# Bias Forum Development Roadmap

## 背景

Bias 当前已经具备论坛产品的主体能力：讨论、回复、标签、权限、审核、举报、通知、搜索、后台、上传、Markdown、队列、缓存、WebSocket 等基础模块都已经存在。

结合当前 Bias 源码与 Flarum 2.x 源码对比，Bias 的核心问题已经不是“有没有功能”，而是“这些功能是否建立在论坛平台化底座之上”。

当前差距主要在以下几个方面：

- Flarum 是可扩展论坛平台，Bias 目前更像功能完整的论坛应用。
- Flarum 有稳定的后端 Extend/Resource/Policy/Search 注册体系，Bias 目前主要依赖手写 REST endpoint + service。
- Flarum 前端有统一的 Store、列表状态、帖流状态、Composer 状态和扩展注入点，Bias 的页面状态还偏分散。
- Flarum 的帖子流不仅承载评论，还承载改标题、改标签、锁定、置顶等事件语义，Bias 当前 `Post.type` 还没有真正成为论坛事件系统。
- Bias 后台和运维能力已经很强，但前台论坛交互抽象、扩展机制和一致性还不够平台化。

后续开发不应继续按“功能点堆叠”推进，而应改为：

- 以扩展体系为主线；
- 以事件系统、Resource API、前端资源层为中轴；
- 在做扩展体系时并行补 UI、交互、性能与运营能力。

## 总目标

把 Bias 从“功能完整的论坛源码”升级为“可扩展、可维护、性能稳定、体验顺滑的论坛平台”。

本路线图的总原则：

- 扩展优先：优先建立模块注册、事件分发、能力注入、前后端扩展接口。
- 底座先行：Resource API、前端 Resource Store、统一分页状态、统一错误格式必须尽早落地。
- 并行演进：UI、交互、性能、搜索、运营能力不再单独排在后面，而是在每个扩展阶段并行完成。
- 论坛优先：所有抽象必须优先服务论坛场景，而不是泛后台系统抽象。

## 设计原则

### 1. 以扩展为核心，不再以页面为核心

今后的主问题不是“讨论页还差什么按钮”，而是：

- 新模块如何注册自己的权限？
- 新模块如何给 Discussion/Post/User/Tag 增加字段和关系？
- 新模块如何注册搜索过滤器？
- 新模块如何注入后台页面和前台交互？
- 新模块如何消费领域事件，而不直接侵入主流程？

### 2. 以事件和资源协议替代手工耦合

今后通知、搜索索引、统计刷新、实时广播、时间线事件都应优先通过领域事件驱动，而不是在 service 里同步散落调用。

今后 API 返回格式要优先走统一 Resource 协议，而不是每个 endpoint 手工拼 response。

### 3. 在做扩展底座时同步修体验

扩展体系不是纯后端工作。做扩展时必须同步推进：

- Composer 重构；
- 帖子流状态抽象；
- 前端资源缓存；
- 列表与详情一致性；
- 模块化后台；
- 实时更新和论坛事件时间线。

## 总体执行顺序

1. 先做阶段 0，修生产风险和并发问题，避免后面重构建立在不稳定基础上。
2. 立即进入阶段 1，把扩展/模块化底座作为主线启动。
3. 阶段 2 同步建立 Resource API 和前端 Resource Store，为扩展体系提供统一数据面。
4. 阶段 3 用扩展体系改造现有内置功能，并同步完成论坛事件流和核心 UI/交互重构。
5. 阶段 4 再升级搜索、长讨论、实时能力，因为这三者都需要建立在资源层和事件层之上。
6. 阶段 5 做后台模块中心、主题、国际化和平台化收口。

## 阶段 0：生产稳定性与安全基线

目标：先解决会影响生产使用的风险，为后续扩展化重构提供稳定基础。

优先级：P0

### 任务

- 修复回帖楼层并发问题。
  - 当前回帖通过查询最后楼层再 `+1`，高并发同一讨论回复时存在唯一约束冲突风险。
  - 建议在事务中锁定 `Discussion` 行，或在 `Discussion` 增加 `next_post_number` 并使用数据库原子递增。
  - 保留 `posts(discussion_id, number)` 唯一约束。
  - 增加并发回帖测试。

- 限制分页参数。
  - 所有列表接口统一限制 `page >= 1`。
  - 所有 `limit` 统一设置上限，例如 50 或 100。
  - 搜索深页要限制或降级。

- 强化生产环境缓存与队列约束。
  - 生产环境应强制 Redis，`LocMemCache` 只用于开发。
  - 后台展示 Redis、队列、WebSocket、失败任务数、队列延迟。
  - 队列不可用时给出明确告警。

- 改进认证安全。
  - 短期缩短 access token 生命周期，增加 CSP。
  - 中期把 access token 从 `localStorage` 迁出，改为 HttpOnly Cookie。
  - API 需要匹配 CSRF 策略。

- 图标资源本地化。
  - 当前前端依赖 Font Awesome CDN。
  - 改为本地打包或统一 Icon 组件，减少外部依赖和首屏阻塞。

### 验收标准

- 并发回帖测试稳定通过。
- 所有分页接口都有统一上限。
- 生产环境缺少 Redis 或队列异常时后台有明确风险提示。
- 前端不再依赖外部 Font Awesome CDN。

## 阶段 1：扩展核心底座

目标：建立 Bias 自己的模块/扩展注册体系，作为后续一切演进的主轴。

优先级：P0

这是当前最优先的阶段，其他改进都以它为中心并行推进。

### 任务

- 建立模块注册中心。

先支持内置模块，不急着做第三方在线安装。

建议目标能力：

```python
forum_registry.register_module(...)
forum_registry.register_permission(...)
forum_registry.register_resource(...)
forum_registry.register_serializer_field(...)
forum_registry.register_search_filter(...)
forum_registry.register_notification_type(...)
forum_registry.register_admin_page(...)
forum_registry.register_forum_nav(...)
forum_registry.register_post_type(...)
forum_registry.register_event_listener(...)
```

- 明确模块边界。

先把现有内置能力按模块定义边界：

- core
- tags
- likes
- flags
- approval
- subscriptions
- notifications
- realtime
- mentions
- users

要求每个模块最少具备：

- 模块元信息；
- 依赖声明；
- 启用状态；
- 权限注册；
- API/Resource 注入点；
- 前端注入点；
- 后台配置入口；
- 事件监听注册入口。

- 建立模块生命周期。

需要支持：

- bootstrap
- register
- ready
- optional teardown 或 disable hooks

短期允许只做“启动时静态加载 + 配置启用禁用”，但结构上要为以后动态模块化留口子。

- 权限注册化。

当前权限码仍偏硬编码。

改造目标：

- 模块自行注册权限项；
- 权限页根据 registry 渲染；
- group 默认权限同步逻辑可按模块提供；
- 标签权限、审核权限、运营权限和扩展权限能统一接入。

- 后台模块中心基础页。

后台新增模块页，先支持内置模块展示：

- 名称；
- 描述；
- 版本；
- 启用状态；
- 依赖；
- 提供的权限；
- 提供的后台页面；
- 数据迁移状态；
- 配置入口链接。

### 并行任务：前端扩展注入基础

- 建立前台注册中心。

建议能力：

```js
forumRegistry.registerRoute(...)
forumRegistry.registerHeaderItem(...)
forumRegistry.registerDiscussionAction(...)
forumRegistry.registerPostAction(...)
forumRegistry.registerComposerExtension(...)
forumRegistry.registerSearchSource(...)
forumRegistry.registerNotificationRenderer(...)
forumRegistry.registerAdminNavItem(...)
```

- 把现有 header、discussion menu、post menu、profile tabs、admin navigation 改成注册式渲染，而不是纯手写固定结构。

### 并行任务：扩展优先下的 UI/交互修正

- 在做注入式前端时，同步收紧 UI 一致性。
  - 减少页面级硬编码颜色和块样式。
  - 统一 token 使用。
  - 把论坛首页和讨论页收回到“内容优先”的论坛信息架构。

- 把讨论列表、帖子菜单、标签展示、用户徽章全部组件化并支持模块扩展。

### 验收标准

- 至少 `tags`、`likes`、`flags`、`approval` 四个内置模块通过 registry 注册。
- 权限页不再依赖手工写死权限清单。
- 后台已有可用的模块中心基础页。
- 前台 discussion/post/header/admin 导航具备基础扩展注入能力。

## 阶段 2：领域事件系统与 Resource API

目标：用事件和统一资源协议替代当前大量手工耦合调用。

优先级：P0-P1

这是扩展体系真正落地的平台层。

### 任务

- 建立领域事件系统。

建议第一批事件：

- `DiscussionStarted`
- `DiscussionUpdated`
- `DiscussionDeleted`
- `DiscussionHidden`
- `DiscussionRestored`
- `DiscussionTagged`
- `DiscussionLocked`
- `DiscussionUnlocked`
- `DiscussionPinned`
- `DiscussionUnpinned`
- `DiscussionApproved`
- `DiscussionRejected`
- `PostCreated`
- `PostUpdated`
- `PostDeleted`
- `PostApproved`
- `PostRejected`
- `PostLiked`
- `PostUnliked`
- `PostFlagged`
- `UserSuspended`
- `UserUnsuspended`

- 迁移当前直接耦合调用。

当前下列逻辑应优先改成事件监听驱动：

- 通知发送；
- 标签统计刷新；
- 搜索索引同步；
- 实时广播；
- 审计补充逻辑；
- 论坛事件时间线记录。

- 建立 Resource 层。

建议形态：

```python
class DiscussionResource:
    type = "discussions"
    fields = [...]
    relationships = [...]
    includes = [...]
    filters = [...]
    sorts = [...]
```

支持：

- `include=user,tags,last_post`
- `fields[discussions]=title,slug,comment_count`
- `sort=-last_posted_at`
- `filter[tag]=python`
- `filter[q]=keyword`

- 统一序列化。

优先替换：

- Discussion list/detail
- Post list/detail
- User summary/detail
- Tag list
- Notification list

- API 错误格式统一。

建议统一：

- `code`
- `message`
- `field_errors`
- `permission`
- `request_id`

### 并行任务：论坛事件流

- 基于领域事件建立“Event Post”基础能力。

先让以下操作进入讨论时间线：

- 改标题；
- 改标签；
- 锁定/解锁；
- 置顶/取消置顶；
- 审核通过/拒绝；
- 隐藏/恢复。

这一步非常关键，因为它会真正把 `Post.type` 从预留字段升级为论坛语义模型。

### 并行任务：后台与扩展联动

- 模块可以注册自己的：
  - 后台设置页；
  - 后台卡片；
  - 后台统计项；
  - 审核/运营入口。

### 验收标准

- 通知、标签统计、搜索索引、实时广播至少有一半以上通过事件监听驱动。
- Discussion/Post/User/Tag/Notification 已切换到统一 Resource 响应。
- 讨论时间线已能显示至少 4 类事件型帖子。
- 新模块能通过 Resource/事件层接入，而不是直接改核心 service。

## 阶段 3：前端 Resource Store、Composer 内核与论坛状态层

目标：建立前端统一资源层和论坛状态层，为扩展、实时、长讨论、搜索打基础。

优先级：P1

### 任务

- 建立前端 Resource Store。

建议能力：

```js
resourceStore.upsert('users', user)
resourceStore.get('discussions', id)
resourceStore.mergePayload(payload)
resourceStore.remove('posts', id)
```

收益：

- 列表、详情、搜索、通知共享用户/讨论/帖子/标签数据；
- 模块新增字段更容易联动；
- 实时更新可以直接 merge payload；
- 减少重复 normalize 和重复请求。

- 建立通用列表/分页状态。

建议抽象：

- `usePaginatedResourceList`
- `useCursorResourceList`
- `useSearchResourceList`
- `useDiscussionListState`
- `useNotificationListState`

- 重构 Composer 公共逻辑。

当前 `DiscussionComposer.vue` 和 `PostComposer.vue` 功能接近，重复较多。

建议拆为：

- `useComposerEditor`
- `useComposerDraft`
- `useComposerPreview`
- `useComposerUpload`
- `useComposerMentions`
- `useComposerEmoji`
- `useComposerViewport`
- `useComposerSubmit`

- 建立 Composer 扩展点。

支持模块注册：

- 额外按钮；
- 插入工具；
- mention provider；
- preview transformer；
- 提交前校验；
- 提交后处理；
- 草稿元信息。

- 建立论坛级状态层。

优先统一：

- discussion list state
- discussion detail state
- post stream state
- notification state
- global search state
- composer state

减少页面内 `window` 事件散落耦合。

### 并行任务：UI 与交互修正

- 建立统一动画 token。

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 260ms;
--ease-standard: cubic-bezier(.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(.2, 0, 0, 1);
```

- Composer 动画优化。
  - 打开时从底部 slide-up。
  - 最小化时做高度收缩。
  - 全屏展开增加过渡。
  - 发布成功后先收起 Composer，再跳转或更新帖子流。
  - 上传、预览、提及搜索、emoji 面板使用统一 loading 和错误反馈。

- 讨论列表体验优化。
  - 桌面端标题允许两行。
  - 未读状态增加左侧细条或未读点。
  - 统计区固定宽度，避免挤压标题。
  - 标签文字根据背景自动计算对比色。
  - 首页减少大面积 hero，把空间还给讨论流。

- 搜索弹层命令面板化。
  - 顶部搜索框点击后打开搜索弹层。
  - 即时展示讨论、帖子、用户、标签。
  - 支持键盘上下选择和 Enter 打开。
  - 空状态展示热门标签、最近搜索、搜索语法提示。

### 验收标准

- 前端列表、详情、搜索、通知共享统一 Resource Store。
- Composer 讨论/回复核心逻辑完成合并。
- 新模块可以给 Composer 注入按钮和能力。
- 列表和详情页 UI 一致性明显提升。
- 搜索弹层支持键盘操作。

## 阶段 4：内置模块迁移与论坛体验重构

目标：用扩展体系重新承载现有核心能力，同时把论坛体验做成真正的平台能力。

优先级：P1

### 任务

- 内置模块逐步迁移到注册体系。

迁移顺序建议：

1. tags
2. likes
3. flags
4. approval
5. subscriptions
6. notifications
7. mentions
8. realtime

要求每个模块都改为：

- 注册自己的权限；
- 注册自己的资源字段；
- 注册自己的前端入口；
- 注册自己的后台设置；
- 注册自己的事件监听器；
- 注册自己的搜索过滤器；
- 注册自己的通知类型和渲染器。

- 标签模块升级。

在迁移 tags 时同步补：

- 主标签/次标签约束抽象；
- 标签权限说明；
- 标签页信息架构优化；
- 标签关注；
- 标签统计刷新状态可视化；
- 标签样式更统一。

- 审核/举报模块升级。

在迁移 approval 与 flags 时同步补：

- 审核原因模板；
- 批量审核；
- 用户历史内容侧栏；
- 审核后自动通知；
- 重复违规计数；
- 举报处理动作与帖子时间线联动。

- 订阅与通知模块升级。

在迁移 subscriptions 与 notifications 时同步补：

- 更清晰的关注/忽略语义；
- 通知聚合；
- 通知类型 renderer 注册化；
- 列表局部刷新；
- 当前页面的轻量更新。

### 并行任务：个人页与移动端

- 个人页结构调整为论坛式信息密度。
  - 活动流优先于设置卡片感。
  - 讨论/回复/最近活动共享资源层。

- 移动端详情页重构。
  - 增加底部操作条：回复、关注、分享、更多。
  - 管理动作放入更多菜单。
  - Composer 打开后进入专注编辑模式，隐藏论坛导航。

### 验收标准

- 至少 6 个核心内置模块完成注册体系迁移。
- 模块不再依赖直接改核心页面才能接入。
- 审核、举报、标签、订阅、通知在前后台都体现为模块化能力。
- 移动端详情页主路径更清晰。

## 阶段 5：长讨论、搜索与实时系统升级

目标：在扩展底座完成后，把论坛高频体验做成平台能力。

优先级：P1-P2

### 任务 A：长讨论 PostStream 升级

- 实现帖子窗口化加载。

建议接口：

```text
GET /api/discussions/:id/posts?near=123&limit=20
GET /api/discussions/:id/posts?before=123&limit=20
GET /api/discussions/:id/posts?after=123&limit=20
```

返回内容：

- 当前窗口帖子；
- 是否有前文；
- 是否有后文；
- 当前楼层索引；
- 总楼层数。

- 前端实现统一 `useDiscussionPostStream`。
  - 管理当前窗口、前后窗口、near 定位；
  - 管理加载前文、加载后文；
  - 滚动时更新已读状态；
  - 滚动时更新 URL 当前楼层；
  - 支持目标楼层 flash。

- 滚动锚定。
  - 图片、代码块、附件加载后不能把用户位置顶走；
  - 使用 ResizeObserver 和 settling 状态；
  - 加载前文时保持当前视口稳定。

- Scrubber 强化。
  - 显示当前楼层和总楼层；
  - 显示未读区间；
  - 支持拖动跳转；
  - 移动端改成底部轻量楼层跳转条或弹层。

- 返回列表位置恢复。
  - 从讨论详情返回列表时，回到刚才那条讨论附近。

### 任务 B：搜索体系升级

- 搜索过滤器/gambit。

支持：

- `tag:python`
- `author:alice`
- `is:unread`
- `is:hidden`
- `is:following`
- `mentioned:me`
- `created:2026-05`
- `in:title`

- 搜索弹层轻量化。
  - 弹层只取每类前 5 条。
  - 弹层不计算全量总数。
  - 搜索结果页再计算当前 tab 总数。

- 搜索索引策略。
  - 短期保留 PostgreSQL FTS。
  - 中文搜索增加 `pg_trgm` 或分词字段，减少 `icontains` 全表扫描。
  - 中长期可选接入 Meilisearch、Typesense 或 OpenSearch。

- 后台索引管理。
  - 搜索索引状态；
  - 重建索引按钮；
  - 索引队列状态；
  - 最近重建时间。

### 任务 C：实时体验升级

- 实时通知强化。
  - toast；
  - 通知聚合；
  - 当前页面局部更新；
  - 连接状态提示。

- 实时讨论更新。
  - 列表显示“有新回复”；
  - 当前详情页底部提示；
  - 用户点击后加载新回复；
  - 不强行打断当前阅读位置。

- 正在输入提示。
  - 当前讨论谁正在回复；
  - 后台可关闭；
  - 权限可配置。

- 在线状态。
  - 用户在线状态；
  - 隐私设置；
  - 缓存失效策略。

### 验收标准

- 1000 回复讨论仍可顺滑浏览。
- `near=楼层` 可以稳定定位。
- 搜索至少支持 5 种过滤器。
- 搜索弹层输入无明显卡顿。
- 新回复能实时提示，但不会打乱当前阅读位置。

## 阶段 6：平台化收口

目标：把 Bias 从“扩展化论坛应用”收口为“可长期演进的平台”。

优先级：P2

### 任务

- 后台模块中心增强。
  - 模块启用状态；
  - 依赖检测；
  - 配置入口；
  - 权限入口；
  - 迁移状态；
  - 健康状态；
  - 调试信息；
  - 模块文档链接。

- 主题与外观体系升级。
  - 设计 token 完整化：
    - 颜色
    - 字体
    - 间距
    - 圆角
    - 阴影
    - 动画
    - z-index
  - 暗色模式：
    - 跟随系统
    - 用户偏好
    - 后台默认设置
  - 外观后台补强：
    - 自定义 Footer HTML
    - `welcome_title` / `welcome_message` 编辑入口
    - 区分“可见 Header/Footer 内容”和“Head/统计代码注入”
    - 增加外观实时预览

- 国际化准备。
  - 前端文案；
  - 后端错误；
  - 邮件模板；
  - 通知文案；
  - 后台配置项；
  - 模块自己的语言包注册机制。

- 开发者文档。
  - 模块开发指南；
  - Resource 字段扩展指南；
  - 事件订阅指南；
  - 前端注入点指南；
  - 权限注册指南；
  - 后台页面注册指南。

### 验收标准

- 后台已有完整模块中心。
- 主题、暗色模式、外观配置进入平台能力。
- 新语言包与新模块都有清晰接入文档。
- 开发者可以按文档新增一个内置模块。

## 性能专项清单

性能工作不再作为单独阶段，而是在各阶段同步推进。

### 数据库

重点检查和补充组合索引：

- `discussions(approval_status, hidden_at, is_sticky, last_posted_at, id)`
- `discussions(user_id, created_at)`
- `posts(discussion_id, number)`
- `posts(discussion_id, approval_status, hidden_at, number)`
- `posts(user_id, created_at)`
- `discussion_user(user_id, is_subscribed, discussion_id)`
- `post_likes(post_id, user_id)`
- `notifications(user_id, read_at, created_at)`
- `discussion_tag(tag_id, discussion_id)`

### 查询

- 讨论列表从 offset 分页逐步改为 cursor/keyset。
- 帖子列表按 `number,id` 做 cursor。
- 搜索页减少重复 `count()`。
- 搜索弹层不计算总数。
- 标签统计、用户计数、搜索索引尽量异步维护。
- Resource include 设计时避免 N+1。

### 前端

- 建立 Resource Store，减少重复请求。
- 长讨论使用窗口化渲染。
- 搜索请求 debounce + 缓存 + 请求取消。
- Composer 预览请求加取消，避免旧响应覆盖新内容。
- 大型依赖按需加载，例如 emoji、highlight、markdown 工具。

## 推荐版本规划

### v1.1：稳定性与扩展底座版本

- 回帖并发修复。
- Redis/队列健康检查。
- 分页参数限制。
- Font Awesome 本地化。
- 模块注册中心雏形。
- 权限注册化雏形。

### v1.2：事件与资源层版本

- 领域事件系统。
- Discussion/Post/Tag/User/Notification Resource 化。
- API 错误统一。
- 后台模块中心基础页。
- Event Post 基础能力。

### v1.3：前端状态层版本

- 前端 Resource Store。
- Composer 公共内核重构。
- 前台扩展注入点。
- 搜索弹层。
- 列表 UI 优化。

### v1.4：内置模块迁移版本

- tags、likes、flags、approval、subscriptions、notifications 模块迁移。
- 审核与举报体验升级。
- 移动端详情操作条。
- 讨论时间线增强。

### v1.5：论坛体验增强版本

- PostStream 窗口化。
- near 定位。
- 滚动锚定。
- Scrubber 增强。
- 返回列表位置恢复。
- 搜索 gambit。

### v2.0：平台版本

- 内置模块全面注册化。
- 实时讨论更新。
- 完整后台模块中心。
- 暗色模式、外观平台化、国际化基础。
- 开发者模块文档。

## 当前最关键的六个底座

- 模块注册中心。
- 领域事件系统。
- Resource API。
- 前端 Resource Store。
- Composer 公共编辑器内核。
- PostStream 长讨论状态层。

这六个底座决定 Bias 后续是继续作为单站论坛源码，还是能逐步发展为真正的可扩展论坛平台。

## 当前最关键的执行原则

- 扩展体系优先于新增业务功能。
- Resource 和事件层优先于页面局部重构。
- 任何新功能都必须优先考虑“能否作为模块能力注册接入”。
- UI、交互、性能优化要在做扩展底座时同步推进，而不是等扩展做完后再返工。

## 开发进度更新

### 2026-05-06

- 已完成：前端 Font Awesome CDN 依赖已移除，论坛端与后台端改为本地打包 `@fortawesome/fontawesome-free`。
- 已完成：后台仪表盘新增运行时风险提示，开始显式暴露 Redis、队列 worker、实时层和 DEBUG 等生产风险。
- 已完成：高级设置保存链路新增生产约束校验，开始阻止 PostgreSQL 形态下的危险缓存/队列配置落库。
- 已完成：后端默认 access token 生命周期从 1 小时收紧为 15 分钟，并补充基础 CSP / `nosniff` / `DENY` / `Referrer-Policy` 安全头。
- 已完成：前端 access token 不再持久化到 `localStorage`，页面刷新时改为依赖 HttpOnly refresh cookie 恢复会话。
- 已完成：通知 WebSocket 新增 refresh cookie 认证回退，前端通知连接不再把 access token 暴露在 URL 查询串。
- 已完成：API 开启 CSRF 校验，前端写请求会先初始化 `csrftoken` 并自动附带 `X-CSRFToken`。
- 已完成：前后端认证主链路切换到 HttpOnly access/refresh cookie，前端不再手动拼接 Bearer access token。
- 已完成：前端 `header`、用户菜单、游客入口和移动抽屉个人入口切换到注册式渲染，前台扩展注入基础继续收口。
- 已完成：讨论详情侧栏主操作区切换到 registry 驱动，回复 / 登录引导 / 关注不再依赖组件内硬编码分支。
- 已完成：前端 ESLint 配置与脚本已修复，`npm run lint` 可稳定校验 Vue/ESM 代码并作为后续前台改造的基础护栏。
- 已完成：通知类型定义、通知页筛选项和头部通知摘要已统一改为从前台 registry 解析，通知渲染注册入口已完成收口。
- 已完成：全局搜索来源定义、筛选项、结果区和搜索弹层已统一切到前台 registry，搜索源注册入口已完成收口。
- 已完成：讨论列表头像区、讨论详情头部和用户主页头图区的徽章展示已切到前台 registry，用户徽章与讨论徽章开始通过统一注册入口分发。
- 已完成：新增统一 `ForumTagBadge` 组件，讨论列表、讨论详情、标签云和标签子标签芯片开始共用同一套标签展示实现。
- 已完成：讨论列表标题状态与个人主页讨论状态已切到前台 registry，新增统一 `ForumStateBadge` 组件并修正 `surface` 过滤，限定区域注入项不再外溢。
- 已完成：个人主页回复状态已切到前台 registry，前台状态展示开始区分 discussion/post 两类独立注册入口，避免状态语义继续混用。
- 已完成：讨论详情帖子头部状态已切到 `postStateBadges`，帖子审核与举报状态开始通过统一状态组件和独立注册入口分发。
- 已完成：讨论详情回复区已切到 `discussionReplyState` 注册入口，并为前台 registry 补充 Node 测试脚本与基础自动化用例，`npm test` / `npm run lint` 已可实际校验这条前台注册链路。
- 已完成：讨论详情帖子审核说明区已切到 `postReviewBanner` 注册入口，帖子审核提示与操作按钮开始通过统一注册结果渲染。
- 已完成：讨论详情讨论审核说明区已切到 `discussionReviewBanner` 注册入口，讨论审核提示与操作按钮开始通过统一注册结果渲染。
- 已完成：讨论详情举报处理面板已切到 `postFlagPanel` 注册入口，举报列表与处理按钮开始通过统一注册结果渲染。
- 已完成：讨论列表与个人主页里的审核反馈文案已切到 `approvalNote` 注册入口，列表型审核提示开始通过统一注册结果分发。
- 已完成：个人主页讨论/回复空状态文案已切到 `emptyState` 注册入口，基础空状态开始通过统一注册结果分发。
- 已完成：讨论列表空状态文案已切到 `emptyState` 注册入口，关注流、我的讨论、未读和标签场景开始通过统一注册结果分发。
- 已完成：通知页与头部通知菜单空状态文案已切到 `emptyState` 注册入口，未读筛选和默认通知为空场景开始通过统一注册结果分发。
- 已完成：标签页与标签卡片最近讨论空状态文案已切到 `emptyState` 注册入口，标签列表为空和标签下暂无讨论场景开始通过统一注册结果分发。
- 已完成：搜索结果页与全局搜索弹层空状态文案已切到 `emptyState` 注册入口，未输入关键词和无结果场景开始通过统一注册结果分发。
- 已完成：讨论详情页与个人主页的页面级状态块已切到 `pageState` 注册入口，`loading/not found` 开始通过统一注册结果分发。
- 已完成：讨论列表、通知中心、标签页、搜索流、个人主页分区、通知菜单与提及选择器的状态提示已批量切到 `stateBlock` 注册入口，`loading/searching/section empty` 开始通过统一注册结果分发。
- 已完成：讨论创建跳转页、讨论/回复 composer 预览状态、发帖标签占位文案、emoji 空状态与真人验证提示已切到 `uiCopy` 注册入口，剩余零散硬编码提示开始通过统一文案解析收口。
- 已完成：认证弹层、密码重置页、个人设置/安全、头部搜索框与预览面板的表单占位、按钮文案和辅助提示已继续切到 `uiCopy` 注册入口，表单语义层开始脱离组件内硬编码。
- 已完成：搜索弹层、移动端导航抽屉、emoji 选择器以及讨论/回复 composer 的占位、按钮标题与提交文案已继续切到 `uiCopy` 注册入口，搜索与编辑器周边的零散提示进一步完成注册化。
- 已完成：邮箱验证页、密码重置页标签、通知页操作文案、举报/审核弹层说明以及一批 modal/search/composer 可访问性标签已继续切到 `uiCopy` 注册入口，认证与公共交互层的硬编码提示进一步收口。
- 已完成：讨论详情头部与个人主页头部新增统一 `heroMeta` 注册入口，作者/发布时间/最后回复/回复数、在线状态/加入时间等元信息已开始通过 registry 分发，讨论详情分页按钮、未读分隔提示以及个人主页头像上传/设置按钮文案也继续切到 `uiCopy` 注册入口。
- 已完成：讨论列表工具栏、头部通知菜单、通知卡片、composer 头部控制以及认证弹层里一批关闭/切换动作文案已继续切到 `uiCopy` 注册入口，按钮标题与可访问性标签开始从组件硬编码进一步收口。
- 已完成：搜索结果页 hero pill/标题/描述、搜索结果分区“查看全部”动作以及搜索弹层“只看某类/查看完整结果”等剩余搜索文案已继续切到 `uiCopy` 注册入口，搜索链路的页面级语义提示进一步完成注册化。
- 已完成：首页 hero 与快捷入口、标签页 hero、搜索讨论/帖子/用户分区标题以及侧栏发帖按钮文案已继续切到 `uiCopy` 注册入口，首页/发现流的剩余页面级语义提示继续完成注册化。
- 已完成：搜索筛选导航、搜索统计标签以及通知页共用的筛选/视图切换标签已继续切到 `uiCopy` 注册入口，搜索与通知两条发现/处理流的共用筛选语义开始统一通过 registry 分发。
- 已完成：通知页标记已读、清除已读、整组处理、删除通知等 confirm/alert 文案已继续切到 `uiCopy` 注册入口，通知处理流里的剩余交互提示开始脱离 composable 内硬编码。
- 已完成：讨论/回复动作菜单里的回复、登录、关注、编辑、置顶、锁定、隐藏、删除、举报等 label/description/confirm 文案已继续切到 `uiCopy` 注册入口，讨论详情动作层开始从菜单工厂与交互 composable 中进一步移除硬编码。
- 已完成：讨论侧栏里的草稿/订阅/锁定辅助提示，以及通用动作菜单的禁用态 `title` 文案已继续切到 `uiCopy` 注册入口，详情页操作区的剩余提示语义开始从组件硬编码进一步收口。
- 已完成：移动端头部的页标题、返回/菜单与右上操作标签，以及讨论列表默认筛选项“全部讨论/关注中”文案已继续切到 `uiCopy` 注册入口，导航层剩余默认语义开始从 composable 内硬编码迁出。
- 已完成：讨论事件帖与回复事件帖里的审核/隐藏/锁定/置顶/改标题/改标签等动作描述，以及楼层跳转 `title` 与通用事件兜底标签已继续切到 `uiCopy` 注册入口，详情流里的系统事件语义开始统一通过 registry 分发。
- 已完成：帖子项里的楼层跳转 `title`、已编辑状态、点赞/回复按钮文案，以及讨论列表卡片里的“发起于/最后回复”时间文案已继续切到 `uiCopy` 注册入口，详情页主体与列表元信息的高频提示进一步脱离组件硬编码。
- 已完成：讨论列表工具栏默认排序标签、列表刷新中提示，以及“加载更多/正在加载讨论”按钮文案已继续切到 `uiCopy` 注册入口，列表流本身的默认交互语义开始从组件内统一迁出。
- 已完成：关注页 hero pill/标题/描述、标签页 hero 兜底描述，以及搜索结果页 `page meta` 标题/描述已继续切到 `uiCopy` 注册入口，页面级描述语义开始从 view 层与硬编码 SEO 文案中继续收口。
- 已完成：搜索结果页顶部统计标签，以及讨论/用户结果卡片里的“X 回复 / X 讨论”计数字段已继续切到 `uiCopy` 注册入口，搜索结果流里的分类统计语义开始进一步脱离组件内拼接。
- 已完成：回复 composer 的标题、副标题、最小化摘要、关闭确认、草稿恢复/保存提示与审核弹窗文案，以及搜索帖子/讨论结果里的匿名用户兜底文案已继续切到 `uiCopy` 注册入口，回复编辑流与搜索帖子结果的剩余高频提示进一步脱离组件硬编码。
- 已完成：讨论 composer 的标题/状态摘要、关闭确认、清草稿确认、草稿恢复/保存提示与讨论更新/审核弹窗文案已继续切到 `uiCopy` 注册入口，发帖编辑流剩余的高频交互反馈进一步脱离组件硬编码。
- 已完成：个人页资料保存、通知偏好、验证邮件、密码修改与头像上传失败等反馈文案已继续切到 `uiCopy` 注册入口，账号设置与安全面板的提交/错误提示开始进一步收口。
- 已完成：讨论详情侧栏封禁提示标题、楼层 scrubber 的“原帖/现在”跳转文案，以及讨论列表侧栏里的“我的主页/标签/更多标签”入口文案已继续切到 `uiCopy` 注册入口，详情页剩余提示区与发现流补充导航语义进一步脱离组件硬编码。
- 已完成：个人设置与账号安全面板的区块标题、说明文案、字段标签，以及通知偏好分组标题/说明已继续切到 `uiCopy` 注册入口，profile 页面块的静态表单语义进一步脱离组件硬编码。
- 已完成：认证会话弹窗里的登录/注册/找回密码标题、副标题、eyebrow、字段标签、真人验证标签与主要成功/失败反馈已继续切到 `uiCopy` 注册入口，认证会话流的剩余表单语义与错误提示进一步脱离组件硬编码。
- 已完成：后台路由注册新增仪表盘快捷入口元数据，后台首页“快速操作”区已改为从 admin registry 渲染，模块化后台入口开始从导航扩展到首页操作面板。
- 当前阶段状态更新：
  - 阶段 0：图标资源本地化已完成；并发回帖修复、分页限制已存在；后台已开始显式暴露并阻止部分 Redis/队列危险配置；认证安全已完成短期 token 收紧、基础安全头、access/refresh Cookie 化、access token 去本地持久化、WebSocket 去 URL token 以及 API CSRF 收口，阶段 0 认证主线已基本闭合。
  - 阶段 1：前台讨论详情、个人主页、讨论列表、通知中心、标签浏览与搜索流里的状态徽章、审核说明、举报处理、审核反馈、空状态文案、部分页面级状态块、批量加载提示、部分零散 UI 文案、一批表单语义文案、部分搜索/编辑器周边提示以及部分认证/公共交互文案已持续切到 registry，前端扩展注入基础正在从导航类入口延伸到列表状态与提示语义层。
  - 阶段 1：模块注册中心、权限注册化、后台模块中心基础页、前端基础注入点已落地，`discussion/post` 动作、讨论侧栏主操作区与辅助提示、回复区状态、帖子/讨论审核说明区、举报处理面板、列表型审核反馈、基础空状态、部分页面级状态、批量状态提示、部分 UI 文案、部分表单语义文案、部分搜索/编辑器提示、部分认证/公共交互提示、认证会话弹窗核心表单语义与反馈、composer、reply composer 草稿与关闭/审核提示、discussion composer 草稿与关闭/审核提示、profile 资料与安全反馈、profile 设置/安全面板静态表单语义、header、游客入口与移动端个人入口、移动端头部导航语义、通知渲染入口、搜索来源入口、搜索统计与结果计数字段、搜索帖子结果兜底语义、用户/讨论徽章展示、讨论/回复状态展示、讨论/回复事件帖语义、详情页帖子主体动作文案、讨论列表元信息语义、讨论列表工具栏与加载语义、列表 hero 与搜索 meta 描述语义、详情/主页 hero 元信息、详情侧栏剩余提示区、讨论列表侧栏补充入口语义、通用动作菜单标题语义、部分标签展示以及后台仪表盘快速操作入口都已进入注册式渲染/组件化，前端 lint 护栏与基础 Node 测试链路已恢复可用，后续重点是继续把更多内置能力从“已注册”推进到“完全按模块接入”，尤其是更多模块级页面块。
  - 阶段 2：领域事件、事件帖、资源字段注册层已落地，但统一 Resource 协议和更多事件驱动迁移仍需继续推进。
  - 阶段 3：前端 Resource Store 已投入使用，但 Composer 公共内核和统一列表状态层仍未收口。

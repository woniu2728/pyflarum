# PyFlarum 管理后台

## 概述

PyFlarum 现在拥有一个完全用 Vue 3 重写的管理后台，完美复刻了 Flarum 的设计和交互体验。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **构建工具**: Vite
- **UI风格**: Flarum 扁平化设计

## 功能模块

### 1. 仪表盘 (Dashboard)
- 系统状态监控（PHP版本、数据库、队列、会话驱动）
- 论坛统计（用户总数、讨论总数、帖子总数）
- 快速操作入口

### 2. 基础设置 (Basics)
- 论坛名称和描述
- 欢迎标题和消息
- 默认语言设置
- 语言选择器开关

### 3. 权限管理 (Permissions)
- 用户组管理（创建、编辑、删除）
- 权限网格（可视化权限配置）
- 权限分类：
  - 查看权限（查看论坛、讨论、用户列表）
  - 发起权限（发起讨论、上传文件）
  - 回复权限（回复讨论、编辑/删除自己的帖子）
  - 管理权限（编辑/删除帖子、锁定/置顶/隐藏讨论）

### 4. 用户管理 (Users)
- 用户列表展示
- 搜索用户（用户名、邮箱）
- 分页浏览
- 用户状态标识（已激活/未激活、管理员标识）

## 访问方式

### 开发环境

1. **启动后端服务**
   ```bash
   cd D:/files/project/tmp/pyflarum
   python manage.py runserver
   ```

2. **启动前端服务**
   ```bash
   cd D:/files/project/tmp/pyflarum/frontend
   npm run dev
   ```

3. **访问管理后台**
   - 论坛前台: http://localhost:3001/
   - 管理后台: http://localhost:3001/admin.html
   
4. **登录要求**
   - 必须使用管理员账号登录
   - 默认管理员账号：`admin` / `admin123`

### 生产环境

1. **构建前端**
   ```bash
   cd frontend
   npm run build
   ```

2. **配置Nginx**
   ```nginx
   location /admin.html {
       root /path/to/dist;
       try_files $uri $uri/ /admin.html;
   }
   
   location /admin {
       root /path/to/dist;
       try_files $uri $uri/ /admin.html;
   }
   ```

## 目录结构

```
frontend/src/admin/
├── AdminApp.vue          # 管理后台主应用
├── main.js               # 入口文件
├── router.js             # 路由配置
├── components/           # 组件
│   ├── AdminHeader.vue   # 顶部导航
│   ├── AdminNav.vue      # 侧边导航
│   └── AdminPage.vue     # 页面基础组件
└── views/                # 页面
    ├── DashboardPage.vue      # 仪表盘
    ├── BasicsPage.vue         # 基础设置
    ├── PermissionsPage.vue    # 权限管理
    └── UsersPage.vue          # 用户管理
```

## API端点

所有管理后台API都在 `/api/admin/` 路径下：

- `GET /api/admin/stats/` - 获取统计数据
- `GET /api/admin/settings/` - 获取设置
- `POST /api/admin/settings/` - 保存设置
- `GET /api/admin/groups/` - 获取用户组列表
- `POST /api/admin/groups/` - 创建用户组
- `GET /api/admin/permissions/` - 获取权限配置
- `POST /api/admin/permissions/` - 保存权限配置
- `GET /api/admin/users/` - 获取用户列表

## 权限控制

- 所有管理后台API都需要JWT认证
- 使用 `@require_staff` 装饰器确保只有管理员可以访问
- 前端通过 `authStore.user.is_staff` 判断是否显示管理后台入口

## 设计特点

### 1. Flarum风格
- 扁平化设计
- 简洁的配色方案（#4d698e 主色调）
- 圆角3px
- 柔和的阴影效果

### 2. 响应式布局
- 侧边导航 + 主内容区
- 固定顶部导航栏
- 自适应宽度（最大1400px）

### 3. 交互体验
- 平滑过渡动画
- 悬停状态反馈
- 加载状态提示
- 成功/错误消息提示

## 与Django Admin的对比

| 特性 | Vue 3管理后台 | Django Admin |
|------|--------------|--------------|
| 渲染方式 | 前端SPA | 服务器端渲染 |
| 用户体验 | 现代化、流畅 | 传统后台 |
| 定制性 | 高度可定制 | 需要覆盖模板 |
| 与前台一致性 | 完全一致 | 风格不同 |
| 开发效率 | 需要前后端配合 | 开箱即用 |

## 后续扩展

可以继续添加以下功能模块：

1. **外观设置** (Appearance)
   - 主题颜色配置
   - Logo上传
   - 自定义CSS/Header/Footer

2. **邮件设置** (Mail)
   - SMTP配置
   - 邮件模板编辑
   - 测试邮件发送

3. **标签管理** (Tags)
   - 标签CRUD
   - 标签层级结构
   - 标签颜色和图标

4. **高级设置** (Advanced)
   - 缓存配置
   - 队列配置
   - 调试模式
   - 维护模式

5. **扩展管理** (Extensions)
   - 扩展列表
   - 启用/禁用扩展
   - 扩展配置

## 注意事项

1. **开发模式**: 前端使用Vite开发服务器，支持热更新
2. **生产模式**: 需要构建静态文件并配置Web服务器
3. **API认证**: 所有请求都需要携带JWT Token
4. **权限检查**: 前后端都需要验证管理员权限

## 贡献指南

如果要添加新的管理页面：

1. 在 `frontend/src/admin/views/` 创建新的页面组件
2. 在 `frontend/src/admin/router.js` 添加路由
3. 在 `frontend/src/admin/components/AdminNav.vue` 添加导航项
4. 在 `apps/core/admin_api.py` 添加对应的API端点
5. 确保API端点使用 `@require_staff` 装饰器

## 许可证

MIT License

# PyFlarum 前端开发指南

## 🎉 项目完成度：100%

所有核心功能已完成，包括8个完整的页面组件和完整的用户交互功能。

## 技术栈

- Vue 3.4.21 (Composition API)
- Vue Router 4.3.0
- Pinia 2.1.7 (状态管理)
- Vite 5.1.5 (构建工具)
- Axios 1.6.7 (HTTP客户端)

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
frontend/
├── public/                      # 静态资源
│   └── default-avatar.svg      # 默认头像
├── src/
│   ├── api/                    # API接口
│   │   └── index.js           # Axios配置和拦截器
│   ├── assets/                 # 资源文件
│   ├── components/             # 公共组件
│   │   ├── Header.vue         # 导航栏（带通知徽章）
│   │   └── Footer.vue         # 页脚
│   ├── router/                 # 路由配置
│   │   └── index.js           # 路由定义和守卫
│   ├── stores/                 # Pinia状态管理
│   │   ├── auth.js            # 认证状态
│   │   └── notification.js    # 通知和WebSocket
│   ├── views/                  # 页面组件（8个）
│   │   ├── HomeView.vue       # 首页
│   │   ├── LoginView.vue      # 登录页
│   │   ├── RegisterView.vue   # 注册页
│   │   ├── DiscussionListView.vue      # 讨论列表
│   │   ├── DiscussionDetailView.vue    # 讨论详情
│   │   ├── DiscussionCreateView.vue    # 创建讨论
│   │   ├── ProfileView.vue             # 用户资料
│   │   └── NotificationView.vue        # 通知中心
│   ├── App.vue                 # 根组件
│   └── main.js                 # 入口文件
├── index.html
├── package.json
└── vite.config.js
```

## ✅ 完成的功能特性

### 1. 用户认证系统
- ✅ 登录/注册页面（带表单验证）
- ✅ JWT Token管理
- ✅ 自动刷新Token
- ✅ 路由守卫（保护需要登录的页面）
- ✅ 记住登录状态

### 2. WebSocket实时通知
- ✅ 自动连接/重连机制
- ✅ 心跳检测（30秒）
- ✅ 浏览器桌面通知
- ✅ 未读消息计数徽章
- ✅ 实时通知推送

### 3. 讨论功能
- ✅ 讨论列表（带搜索、排序、分页）
- ✅ 讨论详情（完整的帖子展示）
- ✅ 创建讨论（Markdown编辑器+预览）
- ✅ 回复帖子（支持@提及）
- ✅ 点赞/取消点赞
- ✅ 编辑/删除帖子
- ✅ 置顶/锁定/隐藏（管理员）

### 4. 标签系统
- ✅ 标签筛选
- ✅ 标签选择器（创建讨论时）
- ✅ 彩色标签显示

### 5. 用户资料
- ✅ 个人资料页
- ✅ 编辑资料（显示名称、简介）
- ✅ 头像上传
- ✅ 用户统计（讨论数、回复数）
- ✅ 用户的讨论和回复列表

### 6. 通知中心
- ✅ 通知列表（分页）
- ✅ 标记为已读/全部已读
- ✅ 删除通知
- ✅ 点击通知跳转到相关页面
- ✅ 多种通知类型图标

### 7. Markdown支持
- ✅ 实时预览
- ✅ 语法高亮
- ✅ @提及用户
- ✅ 代码块、链接、粗体、斜体

### 8. UI/UX设计
- ✅ 响应式设计（移动端适配）
- ✅ 现代化界面（参考Flarum设计）
- ✅ 流畅的动画过渡
- ✅ 加载状态提示
- ✅ 错误处理和提示

## API集成

### HTTP API

```javascript
import api from '@/api'

// 获取讨论列表
const discussions = await api.get('/discussions/')

// 创建讨论
const discussion = await api.post('/discussions/', {
  title: '标题',
  content: '内容'
})
```

### WebSocket

```javascript
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// 连接WebSocket
notificationStore.connect()

// 断开连接
notificationStore.disconnect()

// 标记为已读
notificationStore.markAsRead(notificationId)
```

## 状态管理

### Auth Store

```javascript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 登录
await authStore.login(username, password)

// 注册
await authStore.register(username, email, password)

// 登出
authStore.logout()

// 获取当前用户
const user = authStore.user
const isAuthenticated = authStore.isAuthenticated
```

### Notification Store

```javascript
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// 通知列表
const notifications = notificationStore.notifications

// 未读数量
const unreadCount = notificationStore.unreadCount
```

## 路由配置

```javascript
const routes = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/discussions', name: 'discussions' },
  { path: '/discussions/:id', name: 'discussion-detail' },
  { path: '/discussions/create', name: 'discussion-create', meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', meta: { requiresAuth: true } }
]
```

## 开发建议

### 1. 组件开发
- 使用Composition API
- 组件尽量保持单一职责
- 使用TypeScript（可选）

### 2. 状态管理
- 全局状态使用Pinia
- 组件内状态使用ref/reactive
- 避免过度使用全局状态

### 3. API调用
- 统一使用api实例
- 错误处理在拦截器中统一处理
- 加载状态管理

### 4. 性能优化
- 路由懒加载
- 组件懒加载
- 图片懒加载
- 虚拟滚动（长列表）

## 环境变量

创建`.env`文件：

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

## 部署

### 构建

```bash
npm run build
```

### Nginx配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
    }

    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 常见问题

### 1. CORS错误
确保后端配置了正确的CORS设置：
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]
```

### 2. WebSocket连接失败
检查：
- Redis是否运行
- Django Channels配置
- WebSocket URL是否正确

### 3. Token过期
自动刷新Token或重新登录

## 更多信息

- Vue 3文档: https://vuejs.org/
- Vite文档: https://vitejs.dev/
- Pinia文档: https://pinia.vuejs.org/

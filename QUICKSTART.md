# PyFlarum 快速启动指南

## 🚀 启动步骤

### 1. 启动后端服务

```bash
cd D:/files/project/tmp/pyflarum
python manage.py runserver
```

后端将运行在：http://localhost:8000

### 2. 启动前端服务

```bash
cd D:/files/project/tmp/pyflarum/frontend
npm run dev
```

前端将运行在：http://localhost:3001

### 3. 访问应用

- **论坛前台**: http://localhost:3001/
- **管理后台**: http://localhost:3001/admin.html

### 4. 登录管理后台

使用管理员账号：
- 用户名：`admin`
- 密码：`admin123`

## 📋 功能清单

### 论坛前台
✅ 用户注册/登录
✅ 讨论列表
✅ 发起讨论
✅ 回复讨论
✅ 用户个人页面
✅ 通知系统
✅ 实时WebSocket

### 管理后台
✅ 仪表盘（系统状态、论坛统计）
✅ 基础设置（论坛名称、描述、语言）
✅ 权限管理（用户组、权限网格）
✅ 用户管理（列表、搜索、分页）

## 🎨 设计特点

- 完美复刻Flarum的扁平化设计
- 主色调：#4d698e (Flarum蓝)
- 响应式布局
- 流畅的交互动画

## 🔧 技术栈

### 后端
- Django 5.0.3
- Django Ninja 1.2.2
- JWT认证
- WebSocket支持

### 前端
- Vue 3.4.21 (Composition API)
- Vue Router 4.3.0
- Pinia 2.1.7
- Vite 5.1.5
- Axios 1.6.7

## 📝 注意事项

1. **API路径**: 管理后台API不需要尾部斜杠
   - ✅ `/api/admin/stats`
   - ❌ `/api/admin/stats/`

2. **权限要求**: 所有管理后台功能需要管理员权限（`is_staff=True`）

3. **开发模式**: 前端使用Vite开发服务器，支持热更新

4. **端口配置**:
   - 后端：8000
   - 前端：3001（如果3000被占用会自动切换）

## 🎯 下一步

可以继续添加以下功能：

1. **外观设置** - 主题颜色、Logo上传、自定义CSS
2. **邮件设置** - SMTP配置、邮件模板
3. **标签管理** - 标签CRUD、层级结构
4. **高级设置** - 缓存、队列、维护模式
5. **扩展管理** - 扩展列表、启用/禁用

## 📚 文档

- `ADMIN_README.md` - 管理后台详细文档
- `ADMIN_SUMMARY.md` - 完成总结

## 🐛 问题排查

### 前端无法访问
- 检查npm run dev是否正常运行
- 检查端口3001是否被占用

### 后端API 404
- 确保Django服务器正在运行
- 检查API路径是否正确（不要加尾部斜杠）

### 管理后台无权限
- 确保使用管理员账号登录
- 检查用户的`is_staff`字段是否为True

## ✨ 享受使用PyFlarum！

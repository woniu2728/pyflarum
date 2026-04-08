# PyFlarum Docker部署指南

## 快速开始

### 1. 使用Docker Compose启动所有服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f web
```

### 2. 访问应用

- API文档: http://localhost/api/docs
- Django Admin: http://localhost/admin
- WebSocket通知: ws://localhost/ws/notifications/
- WebSocket在线用户: ws://localhost/ws/online/

### 3. 创建超级用户

```bash
docker-compose exec web python manage.py createsuperuser
```

## 服务说明

### 服务列表

- **db**: PostgreSQL 15数据库
- **redis**: Redis缓存和消息队列
- **web**: Django Web应用（支持HTTP和WebSocket）
- **celery**: Celery异步任务处理器
- **nginx**: Nginx反向代理（可选）

### 端口映射

- 80: Nginx (HTTP)
- 8000: Django (直接访问)
- 5432: PostgreSQL
- 6379: Redis

## 常用命令

### 启动和停止

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v

# 重启服务
docker-compose restart web
```

### 数据库操作

```bash
# 运行迁移
docker-compose exec web python manage.py migrate

# 创建迁移文件
docker-compose exec web python manage.py makemigrations

# 初始化用户组
docker-compose exec web python manage.py init_groups

# 进入数据库
docker-compose exec db psql -U postgres -d pyflarum
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f web
docker-compose logs -f celery
docker-compose logs -f db
```

### 进入容器

```bash
# 进入Web容器
docker-compose exec web bash

# 进入数据库容器
docker-compose exec db bash

# 进入Redis容器
docker-compose exec redis sh
```

### Django管理命令

```bash
# 收集静态文件
docker-compose exec web python manage.py collectstatic --noinput

# 创建超级用户
docker-compose exec web python manage.py createsuperuser

# Django Shell
docker-compose exec web python manage.py shell

# 清空数据库
docker-compose exec web python manage.py flush
```

## 环境变量配置

在`docker-compose.yml`中配置环境变量：

```yaml
environment:
  - DEBUG=False
  - SECRET_KEY=your-secret-key-here
  - DB_NAME=pyflarum
  - DB_USER=postgres
  - DB_PASSWORD=your-password
  - REDIS_HOST=redis
  - EMAIL_HOST=smtp.gmail.com
  - EMAIL_HOST_USER=your-email@gmail.com
  - EMAIL_HOST_PASSWORD=your-password
```

## 生产环境部署

### 1. 修改配置

```yaml
# docker-compose.yml
environment:
  - DEBUG=False
  - SECRET_KEY=生成一个强密码
  - ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
  - DB_PASSWORD=强密码
```

### 2. 使用HTTPS

```bash
# 安装Certbot
apt-get install certbot python3-certbot-nginx

# 获取SSL证书
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. 性能优化

```yaml
# 增加Worker数量
web:
  command: gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker -w 4 -b 0.0.0.0:8000
```

## 备份和恢复

### 备份数据库

```bash
# 备份
docker-compose exec db pg_dump -U postgres pyflarum > backup.sql

# 恢复
docker-compose exec -T db psql -U postgres pyflarum < backup.sql
```

### 备份媒体文件

```bash
# 备份
docker cp pyflarum_web:/app/media ./media_backup

# 恢复
docker cp ./media_backup pyflarum_web:/app/media
```

## 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs web

# 检查服务健康状态
docker-compose ps
```

### 数据库连接失败

```bash
# 检查数据库是否就绪
docker-compose exec db pg_isready -U postgres

# 重启数据库
docker-compose restart db
```

### WebSocket连接失败

```bash
# 检查Redis是否运行
docker-compose exec redis redis-cli ping

# 检查Channels配置
docker-compose exec web python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
```

## 监控和维护

### 查看资源使用

```bash
# 查看容器资源使用
docker stats

# 查看磁盘使用
docker system df
```

### 清理

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理所有未使用的资源
docker system prune -a
```

## 开发环境

### 热重载

```yaml
# docker-compose.override.yml
version: '3.8'
services:
  web:
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
```

### 调试

```yaml
environment:
  - DEBUG=True
  - DJANGO_LOG_LEVEL=DEBUG
```

## 更多信息

- Django文档: https://docs.djangoproject.com/
- Docker文档: https://docs.docker.com/
- Nginx文档: https://nginx.org/en/docs/

# Bias

Bias 是一个使用 Django + Vue 3 构建的论坛项目，目标是对齐 Flarum 2.x 的核心论坛体验和后台管理能力，同时采用更适合 Python 项目的实现方式。

## 技术栈

- 后端：Django 5、Django Ninja、Channels、Celery
- 前端：Vue 3、Vue Router、Pinia、Vite
- 数据库：SQLite 或 PostgreSQL
- 缓存与队列：Redis 可选，本地快速启动可不使用

## 安装策略

项目当前明确支持两条安装路径，并优先推荐 Docker：

1. 推荐安装：`Docker Compose + PostgreSQL + Redis + Nginx`
2. 原生安装：本地快速启动走 `SQLite + 无 Redis`，正式部署走 `PostgreSQL + Redis`

## Docker 安装

### 1. 准备环境

- Docker Desktop 或 Docker Engine + Docker Compose Plugin

### 2. 启动完整论坛栈

```bash
git clone <your-repo-url>
cd bias
docker compose up -d --build
```

首次启动会自动完成这些事情：

- 拉起 PostgreSQL、Redis、Django、Celery、前端构建容器和 Nginx
- 执行数据库迁移
- 初始化默认用户组与权限
- 构建前台与后台静态资源

### 3. 使用域名时的配置

如果你准备通过正式域名访问，例如 `https://bias.chat`，最简方式只需要一条命令：

```bash
echo "SITE_DOMAINS=bias.chat,www.bias.chat" > .env && docker compose up -d --force-recreate web
```

Bias 会自动根据 `SITE_DOMAINS` 推导：

- `FRONTEND_URL`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`

因此大多数 Docker 部署场景下，不需要再手动分别配置这三个变量。

如果你已经有自己的 `.env`，不要直接覆盖文件，只需要追加或修改这一行：

```env
SITE_DOMAINS=bias.chat,www.bias.chat
```

然后重建 `web` 容器：

```bash
docker compose up -d --force-recreate web
```

默认会按 `https` 推导公开地址。如果你的站点暂时只跑在 HTTP 下，可以再补一行：

```env
SITE_SCHEME=http
```

只有在这些场景下，才建议显式覆盖更多变量：

- 你需要同时支持多个域名，例如 `bias.chat` 和 `www.bias.chat`
- 你要兼容额外的前端来源或反向代理来源
- 你希望手动精确控制 `ALLOWED_HOSTS`、`CORS_ALLOWED_ORIGINS`、`CSRF_TRUSTED_ORIGINS`

高级示例：

```env
SITE_DOMAINS=bias.chat,www.bias.chat
SITE_SCHEME=https
FRONTEND_URL=https://bias.chat
ALLOWED_HOSTS=bias.chat,www.bias.chat,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://bias.chat,https://www.bias.chat,http://localhost:8080
CSRF_TRUSTED_ORIGINS=https://bias.chat,https://www.bias.chat,http://localhost:8080
```

### 4. 创建管理员账号

```bash
docker compose exec web python manage.py ensure_admin \
  --username admin \
  --email admin@example.com \
  --password change-me
```

### 5. 访问入口

- Forum 前台：`http://localhost:8080`
- 管理后台 SPA：`http://localhost:8080/admin.html`
- API 文档：`http://localhost:8080/api/docs`

如果你已经配置了域名，上面三项地址应替换为你的正式域名，例如 `https://bias.chat`、`https://bias.chat/admin.html`、`https://bias.chat/api/docs`。

### 6. 常用 Docker 命令

```bash
docker compose logs -f
docker compose ps
docker compose down
```

如需清空数据库和媒体等持久化数据，可在确认无保留价值后执行：

```bash
docker compose down -v
```

### 7. Docker 标准升级流程

推荐按下面顺序升级：

```bash
git pull
docker compose build web celery
docker compose up -d db redis
docker compose up -d web celery frontend nginx
docker compose exec web python manage.py upgrade_forum --non-interactive
```

说明：

- `web` 容器启动时会执行迁移、默认用户组初始化和 `collectstatic`
- `upgrade_forum` 会额外执行系统检查、默认组同步和运行时缓存清理
- 升级前仍建议先备份数据库、`media/` 和当前配置
- 若前端依赖有变化，`frontend` 容器会重新执行 `npm install` 与 `npm run build`

## 原生安装

### 1. 准备环境

- Python 3.11+
- Node.js 18+
- 本地快速启动不要求 Redis
- 正式部署建议准备 PostgreSQL 15+ 和 Redis 7+

### 2. 克隆项目并安装依赖

```bash
git clone <your-repo-url>
cd bias

python -m venv venv
```

Windows:

```powershell
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

安装 Python 依赖：

```bash
pip install -r requirements.txt
```

### 3. 初始化论坛

当前没有网页安装向导，首次安装统一使用 `init_forum` 命令。

#### 本地快速启动

这条路径默认使用 SQLite，且默认关闭 Redis：

```bash
python manage.py init_forum \
  --database sqlite \
  --admin-username admin \
  --admin-email admin@example.com \
  --admin-password admin123456 \
  --non-interactive
```

命令会完成这些事情：

- 生成 `.env`
- 执行数据库迁移
- 初始化默认用户组与权限
- 创建或更新管理员账号

如果你想交互式填写数据库模式和管理员信息，也可以直接执行：

```bash
python manage.py init_forum
```

#### 正式部署 / 预发布环境

这条路径建议使用 PostgreSQL，并默认开启 Redis：

```bash
python manage.py init_forum \
  --database postgres \
  --site-domains bias.chat,www.bias.chat \
  --db-name bias \
  --db-user postgres \
  --db-password postgres \
  --db-host 127.0.0.1 \
  --db-port 5432 \
  --redis auto \
  --admin-username admin \
  --admin-email admin@example.com \
  --admin-password change-me \
  --non-interactive
```

如果你的 Redis 不是默认地址，可以继续补充：

```bash
python manage.py init_forum \
  --database postgres \
  --redis on \
  --redis-host 127.0.0.1 \
  --redis-port 6379 \
  --redis-db 0 \
  --admin-username admin \
  --admin-email admin@example.com \
  --admin-password change-me \
  --non-interactive
```

可选参数：

- `--skip-env-write`：不写 `.env`
- `--skip-migrate`：跳过迁移
- `--skip-admin`：跳过管理员创建
- `--site-domains <hosts>`：配置站点访问域名，多个值用逗号分隔
- `--site-scheme http|https`：配置站点默认协议，默认 `https`
- `--env-file <path>`：指定环境文件路径
- `--frontend-url <url>`：指定前端地址
- `--sqlite-name <path>`：指定 SQLite 文件位置

## 前端安装与启动

```bash
cd frontend
npm install
npm run dev
```

默认前端地址为 `http://localhost:5173`。

## 运行项目

启动后端开发服务：

```bash
python manage.py runserver
```

常用入口：

- Forum 前台：`http://localhost:5173`
- 管理后台 SPA：`http://localhost:5173/admin.html`
- API 文档：`http://127.0.0.1:8000/api/docs`

## 环境变量

可参考 [`.env.example`](.env.example)。

关键变量说明：

- `DB_MODE=sqlite|postgres`
- `SQLITE_NAME=db.sqlite3`
- `USE_REDIS=False|True`
- `SITE_DOMAINS=bias.chat,www.bias.chat`
- `SITE_SCHEME=http|https`
- `ALLOWED_HOSTS=localhost,127.0.0.1,bias.chat`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,https://bias.chat`
- `CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://bias.chat`
- `FRONTEND_URL=http://localhost:5173`
- `CELERY_BROKER_URL` 和 `CELERY_RESULT_BACKEND` 可留空，让系统按 `USE_REDIS` 自动选择默认值

## 升级当前版本

当前已经提供统一升级命令：

```bash
python manage.py upgrade_forum --non-interactive
```

默认会执行：

1. Django 系统检查
2. 数据库迁移
3. 默认用户组与权限同步
4. 运行时缓存清理

常用参数：

- `--collectstatic`：升级后执行 `collectstatic --noinput`
- `--skip-check`：跳过系统检查
- `--skip-migrate`：跳过迁移
- `--skip-init-groups`：跳过默认组同步
- `--skip-clear-cache`：跳过缓存清理
- `--dry-run`：只输出升级计划，不实际执行

推荐升级顺序：

1. 备份数据库、`media/` 和当前 `.env`
2. 拉取新代码
3. 更新 Python 依赖：`pip install -r requirements.txt`
4. 执行 `python manage.py upgrade_forum --non-interactive`
5. 如前端资源有变更，执行 `npm install`、`npm run build` 或重启前端开发服务
6. 重启 Django、Celery、反向代理等相关进程

SQLite 路径建议直接备份数据库文件；PostgreSQL 路径建议使用标准数据库备份方式。若升级失败，优先按你自己的备份方案恢复数据库、`media/` 和 `.env`，确认问题后再重新执行升级命令。

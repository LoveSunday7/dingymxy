# 黑色小猫咪的GitHub小窝

> 山林从不向四季起誓，枯荣随缘，我曾因你而来，也可随风而去

## 项目简介

个人博客网站，前后端分离架构。前端托管于 GitHub Pages 或静态服务器，后端部署于轻量服务器。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 原生 HTML / CSS / JavaScript | 模块化 SPA，无框架依赖 |
| 后端 | FastAPI | 异步 Python Web 框架 |
| 数据库 | SQLite (aiosqlite) | 轻量异步数据库 |
| 认证 | JWT (PyJWT) | 无状态令牌认证 |

## 功能模块

### 前端

- 首页、简历、经历、博客、朋友圈、联系我 共6个页面
- 暗色/亮色主题切换
- 响应式布局（移动端适配）
- 模块化 SPA 路由
- 背景设置面板
- **身份验证入口**（访客验证 + 管理员登录）
- 博客列表/详情对接后端 API
- 留言板对接后端 API

### 后端 API

#### 博客管理

| 接口 | 方法 | 说明 | 权限 |
|------|------|------|------|
| `/api/blog/posts` | GET | 文章列表（分页/搜索/筛选） | 公开 |
| `/api/blog/posts/{id}` | GET | 文章详情 | 公开 |
| `/api/blog/posts` | POST | 创建文章 | 管理员 |
| `/api/blog/posts/{id}` | PUT | 更新文章 | 管理员 |
| `/api/blog/posts/{id}` | DELETE | 删除文章 | 管理员 |
| `/api/blog/posts/{id}/like` | POST | 点赞文章 | 公开 |
| `/api/blog/categories` | GET | 分类列表 | 公开 |
| `/api/blog/tags` | GET | 标签列表 | 公开 |
| `/api/blog/posts/{id}/comments` | POST | 发表评论 | 公开 |

#### 认证

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/verify` | POST | 访客身份验证 |
| `/api/auth/admin/login` | POST | 管理员登录 |
| `/api/auth/me` | GET | 获取当前用户信息 |

#### 用户管理（管理员）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/users` | GET | 用户列表 |
| `/api/users` | POST | 创建访客（预录入） |
| `/api/users/{id}` | PUT | 更新访客信息 |
| `/api/users/{id}` | DELETE | 删除访客 |
| `/api/users/{id}/permissions` | GET/POST | 查看/分配权限 |
| `/api/users/batch-permissions` | POST | 批量分配权限 |

#### 留言板

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/messages` | GET | 留言列表 |
| `/api/messages` | POST | 发表留言 |
| `/api/messages/{id}/like` | POST | 点赞留言 |
| `/api/messages/{id}` | DELETE | 删除留言（管理员） |

### 用户权限系统

本站采用**管理员预录入 + 访客身份验证**的访问控制机制：

1. **管理员**：在后台提前录入访客信息（姓名、联系方式等），系统自动生成访问码
2. **管理员**：为访客分配访问权限（可精确到页面级别或文章级别）
3. **访客**：在身份验证入口输入访问码和姓名进行验证
4. **访客**：验证通过后，根据权限查看对应的专属内容

```
管理员录入 → 生成访问码 → 分配权限 → 访客验证 → 按权限展示内容
```

## 项目结构

```
dingymxy/
├── frontend/                 # 前端项目
│   ├── css/                  # 样式文件
│   │   ├── auth.css          # 认证弹窗样式
│   │   └── pages/            # 页面级样式
│   ├── js/                   # 脚本文件
│   │   ├── api.js            # API请求封装（配置后端地址）
│   │   ├── auth.js           # 身份验证模块
│   │   └── pages/            # 页面级脚本
│   ├── images/               # 图片资源
│   ├── modules/              # HTML 模块
│   │   ├── auth-modal.html   # 认证弹窗
│   │   └── pages/            # 页面模块
│   ├── config.example.js     # 部署配置示例
│   ├── DEPLOY.md             # 部署说明
│   └── index.html            # 入口文件
├── backend/                  # 后端项目
│   ├── app/
│   │   ├── api/              # API路由
│   │   │   ├── auth.py       # 认证接口
│   │   │   ├── blog.py       # 博客接口
│   │   │   ├── users.py      # 用户管理接口
│   │   │   └── messages.py   # 留言板接口
│   │   ├── core/             # 核心模块
│   │   │   ├── config.py     # 配置加载
│   │   │   ├── database.py   # 数据库连接
│   │   │   └── auth.py       # JWT认证
│   │   ├── models/
│   │   │   └── schemas.py    # Pydantic模型
│   │   └── main.py           # FastAPI应用
│   ├── config.yaml           # 后端配置文件
│   ├── requirements.txt      # Python依赖
│   └── main.py               # 启动入口
├── deploy.yaml               # 部署配置
└── README.md
```

## 本地运行

### 前置要求

- Python 3.9+
- Node.js（可选，用于静态服务器）

### 1. 启动后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
# 或
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

首次启动会自动：
- 创建 SQLite 数据库
- 创建默认管理员账户（用户名: `admin`，密码: `admin123`）
- 插入示例分类、标签和文章

API 文档：http://localhost:8000/docs

### 2. 启动前端

```bash
cd frontend

# 方式1：Python
python3 -m http.server 5500 --bind 0.0.0.0

# 方式2：npx
npx serve -l 5500
```

访问：http://localhost:5500

### 3. 配置

**后端配置** `backend/config.yaml`：
- 修改 `server.frontend_url` 和 `cors_origins` 为前端地址
- 修改 `admin.username` 和 `admin.password`（生产环境必须修改）
- 修改 `auth.secret_key`（生产环境必须修改为随机长字符串）

**前端配置** `frontend/js/api.js`：
- 修改 `APP_CONFIG.apiBaseUrl` 为后端 API 地址

## 部署

详见 [frontend/DEPLOY.md](frontend/DEPLOY.md)

核心步骤：
1. 修改前后端配置中的地址和密钥
2. 后端使用 `uvicorn` 或 `gunicorn + uvicorn worker` 启动
3. 前端使用 Nginx 反向代理，同时代理前端静态文件和后端 API

## 数据库表结构

| 表名 | 说明 |
|------|------|
| admins | 管理员账户 |
| users | 访客信息（含访问码） |
| permissions | 访客权限（resource_type + resource_id） |
| posts | 博客文章 |
| categories | 文章分类 |
| tags | 文章标签 |
| post_tags | 文章-标签关联 |
| comments | 评论 |
| messages | 留言板消息 |

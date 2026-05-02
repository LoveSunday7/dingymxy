# 黑色小猫咪的GitHub小窝

> 山林从不向四季起誓，枯荣随缘，我曾因你而来，也可随风而去

## 项目简介

个人博客网站，前端托管于 GitHub Pages，后端部署于轻量服务器。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JavaScript（模块化 SPA） |
| 后端 | FastAPI |
| 数据库 | SQLite |

## 功能模块

### 前端（已完成）

- 首页、简历、经历、博客、朋友圈、联系我 共6个页面
- 暗色/亮色主题切换
- 响应式布局（移动端适配）
- 模块化 SPA 路由
- 背景设置面板

### 后端（开发中）

#### 博客管理

- 文章 CRUD
- 标签 / 分类管理
- 评论系统

#### 用户管理与权限系统

本站采用**管理员预录入 + 访客身份验证**的访问控制机制：

- **管理员**：提前录入访客信息（姓名、联系方式等），并分配对应的访问权限
- **访客**：输入自身信息进行身份验证后，根据权限查看特定内容
- 权限粒度：可控制到页面级别或文章级别，不同访客看到的内容不同

#### 数据库结构（规划）

- `users` — 访客信息表（姓名、联系方式、认证状态）
- `permissions` — 权限表（访客ID、可访问的资源类型、资源ID）
- `posts` — 文章表
- `tags` / `categories` — 标签与分类
- `comments` — 评论表

## 项目结构

```
dingymxy/
├── frontend/          # 前端项目
│   ├── css/           # 样式文件
│   │   └── pages/     # 页面级样式
│   ├── js/            # 脚本文件
│   │   └── pages/     # 页面级脚本
│   ├── images/        # 图片资源
│   ├── modules/       # HTML 模块
│   │   └── pages/     # 页面模块
│   └── index.html     # 入口文件
├── backend/           # 后端项目（FastAPI + SQLite）
└── README.md
```

## 本地运行

```bash
# 前端
cd frontend
# 使用任意静态服务器，例如
python -m http.server 8000

# 后端（开发中）
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

# 任务书 — 黑色小猫咪的GitHub小窝 功能补全

> 📅 创建日期：2026-06-13
> 📊 来源：CodeGraph 代码分析 + 业务缺口评估
> 🎯 目标：为简历、经历、朋友圈三大模块补全前后端数据驱动能力，优化留言板

---

## 进度总览

| Phase | 名称 | 状态 | 完成度 |
|-------|------|------|--------|
| Phase 1 | 数据库设计 | ✅ 已完成 | 6/6 |
| Phase 2 | 后端模型 (Pydantic) | ✅ 已完成 | 3/3 |
| Phase 3 | 后端 API | ✅ 已完成 | 5/5 |
| Phase 4 | 前端页面改造 | ✅ 已完成 | 7/7 |
| Phase 5 | 管理后台扩展 | ✅ 已完成 | 4/4 |
| Phase 6 | 留言板增强优化 | ✅ 已完成 | 4/4 |

**整体进度：29/29 任务完成**

---

## Phase 1 — 数据库设计

> 📁 核心文件：`backend/app/core/database.py`
> ⚠️ 前置：无
> 🚦 阻塞：Phase 2、Phase 3

### T1.1 — 设计 `resume_data` 表 ✅
- [x] ✅ 已完成
**描述**：存储简历的结构化字段（键值对模型），支持多分类（basic_info / bio / education / certifications）
**字段**：`id, section TEXT, field_key TEXT, field_label TEXT, field_value TEXT, field_type TEXT, sort_order INT, created_at, updated_at`
**约束**：`UNIQUE(section, field_key)`
**备注**：采用 EAV（实体-属性-值）模式，避免每个简历字段建一列。field_type 支持 text/longtext/list 三种

### T1.2 — 设计 `timeline_events` 表 ✅
- [x] ✅ 已完成
**描述**：时间线事件表（经历页 + 简历页工作经历共用）
**字段**：`id, event_type TEXT('work'|'education'|'life'), title TEXT, organization TEXT, location TEXT, start_date TEXT, end_date TEXT, summary TEXT, highlights TEXT(JSON), sort_order INT, is_visible INT, created_at, updated_at`
**备注**：highlights 存 JSON 数组如 `["成就1","成就2"]`；sort_order 控制显示顺序

### T1.3 — 设计 `resume_projects` 表 ✅
- [x] ✅ 已完成
**描述**：独立项目经历（简历页用）
**字段**：`id, title TEXT, period TEXT, role TEXT, tech_stack TEXT(JSON), description TEXT, highlights TEXT(JSON), sort_order INT, is_visible INT, created_at, updated_at`

### T1.4 — 设计 `friends_moments` 表 ✅
- [x] ✅ 已完成
**描述**：朋友圈动态主表
**字段**：`id, author_name TEXT, content TEXT, images TEXT(JSON), likes INT DEFAULT 0, is_published INT DEFAULT 1, created_at`
**备注**：images 存 JSON 数组如 `["/uploads/xxx.jpg","/uploads/yyy.jpg"]`

### T1.5 — 设计 `friends_comments` 表 ✅
- [x] ✅ 已完成
**描述**：朋友圈评论表
**字段**：`id, moment_id INT(FK), author_name TEXT, content TEXT, created_at`
**外键**：`FOREIGN KEY (moment_id) REFERENCES friends_moments(id) ON DELETE CASCADE`

### T1.6 — `SCHEMA_SQL` 集成 (5表 + 索引 + 配置)
- [x] ✅ 已完成
**描述**：在 `database.py` 的 `SCHEMA_SQL` 中添加以上 5 张表的建表语句
**备注**：使用 `CREATE TABLE IF NOT EXISTS` 确保幂等

---

## Phase 2 — 后端模型 (Pydantic Schemas)

> 📁 核心文件：`backend/app/models/schemas.py`
> ⚠️ 前置：Phase 1
> 🚦 阻塞：Phase 3

### T2.1 — Resume 模型 ✅
- [x] ✅ 已完成
**新增模型**：
- `ResumeFieldCreate(BaseModel)` — section, field_key, field_label, field_value, field_type, sort_order
- `ResumeFieldUpdate(BaseModel)` — field_value?, field_label?, sort_order?
- `ResumeFieldResponse(BaseModel)` — id, section, field_key, field_label, field_value, field_type, sort_order
- `ResumeSectionResponse(BaseModel)` — section, fields: list[ResumeFieldResponse]

### T2.2 — Timeline 模型 ✅
- [x] ✅ 已完成
**新增模型**：
- `TimelineEventCreate(BaseModel)` — event_type, title, organization?, location?, start_date?, end_date?, summary?, highlights?
- `TimelineEventUpdate(BaseModel)` — 所有字段可选
- `TimelineEventResponse(BaseModel)` — id + 全部字段 + created_at
- `TimelineListResponse(BaseModel)` — events: list[TimelineEventResponse]

### T2.3 — Friends 模型 ✅
- [x] ✅ 已完成
**新增模型**：
- `MomentCreate(BaseModel)` — content, images? (list[str], max 9)
- `MomentUpdate(BaseModel)` — content?, images?, is_published?
- `MomentResponse(BaseModel)` — id, author_name, content, images, likes, created_at, comments_count
- `MomentDetailResponse(BaseModel)` — MomentResponse + comments: list[FriendsCommentResponse]
- `FriendsCommentCreate(BaseModel)` — author_name, content
- `FriendsCommentResponse(BaseModel)` — id, moment_id, author_name, content, created_at

---

## Phase 3 — 后端 API 路由

> 📁 核心文件：新建 `backend/app/api/resume.py`、`experience.py`、`friends.py`
> ⚠️ 前置：Phase 2
> 🚦 阻塞：Phase 4

### T3.1 — `/api/resume` 路由模块 ✅
- [x] ✅ 已完成
**文件**：新建 `backend/app/api/resume.py`
**端点**：

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/resume` | 无 | 获取所有简历数据（按section分组），公开 |
| GET | `/resume/{section}` | 无 | 获取单个section（basic/bio/skills/education/certs） |
| PUT | `/resume` | Admin | 批量更新简历字段 `{fields: [{section, field_key, field_value}]}` |
| DELETE | `/resume/{field_id}` | Admin | 删除单个字段 |

### T3.2 — `/api/experience` 路由模块 ✅
- [x] ✅ 已完成
**文件**：新建 `backend/app/api/experience.py`
**端点**：

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/experience` | 无 | 获取所有可见时间线事件（按sort_order排序） |
| POST | `/experience` | Admin | 创建时间线事件 |
| PUT | `/experience/{event_id}` | Admin | 更新事件 |
| DELETE | `/experience/{event_id}` | Admin | 删除事件 |
| PUT | `/experience/sort` | Admin | 批量更新排序 `[{id, sort_order}]` |
| GET | `/experience/projects` | 无 | 获取项目经历列表 |
| POST | `/experience/projects` | Admin | 创建项目经历 |

### T3.3 — `/api/friends` 路由模块 ✅
- [x] ✅ 已完成
**文件**：新建 `backend/app/api/friends.py`
**端点**：

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/friends/moments` | 无 | 动态列表（分页，按时间倒序） |
| GET | `/friends/moments/{id}` | 无 | 单条动态详情（含评论） |
| POST | `/friends/moments` | Admin | 发布动态 |
| PUT | `/friends/moments/{id}` | Admin | 编辑动态 |
| DELETE | `/friends/moments/{id}` | Admin | 删除动态 |
| POST | `/friends/moments/{id}/like` | 无 | 点赞动态 |
| POST | `/friends/moments/{id}/comments` | 无 | 发表评论 |
| DELETE | `/friends/comments/{id}` | Admin | 删除评论 |

### T3.4 — 注册新路由 ✅
- [x] ✅ 已完成
**文件**：`backend/app/main.py`
**修改**：
  - `from .api import auth, blog, users, messages, resume, experience, friends`
  - `app.include_router(resume.router, prefix="/api")`
  - `app.include_router(experience.router, prefix="/api")`
  - `app.include_router(friends.router, prefix="/api")`

### T3.5 — 种子数据（lifespan） ✅
- [x] ✅ 已完成
**文件**：`backend/app/main.py` → lifespan()
**新增**：
  - 默认简历数据（从现有 resume.html 硬编码内容迁移到数据库）
  - 默认时间线事件（从 experience.html 迁移）
  - 示例朋友圈动态（从 friends.html 迁移，使用本地图片占位）

---

## Phase 4 — 前端页面改造

> 📁 核心文件：`frontend/js/api.js`、`frontend/js/pages/*.js`、`frontend/modules/pages/*.html`
> ⚠️ 前置：Phase 3

### T4.1 — `api.js` 扩展
- [x] ✅ 已完成
**文件**：`frontend/js/api.js`
**新增方法**：
```javascript
api.resume = {
  getAll: () => get('/resume'),
  getSection: (section) => get(`/resume/${section}`),
  update: (fields) => put('/resume', { fields }),
  delete: (id) => del(`/resume/${id}`)
}
api.experience = {
  list: () => get('/experience'),
  listProjects: () => get('/experience/projects'),
  create: (data) => post('/experience', data),
  update: (id, data) => put(`/experience/${id}`, data),
  delete: (id) => del(`/experience/${id}`),
}
api.friends = {
  listMoments: (page) => get('/friends/moments', { page }),
  getMoment: (id) => get(`/friends/moments/${id}`),
  createMoment: (data) => post('/friends/moments', data),
  deleteMoment: (id) => del(`/friends/moments/${id}`),
  likeMoment: (id) => post(`/friends/moments/${id}/like`),
  createComment: (momentId, data) => post(`/friends/moments/${momentId}/comments`, data),
  deleteComment: (id) => del(`/friends/comments/${id}`),
}
```

### T4.2 — 改造 `resume.js`
- [x] ✅ 已完成
**文件**：`frontend/js/pages/resume.js`
**改造内容**：
  - `initResume()` 入口改为异步加载数据
  - 从 `/api/resume` 获取按 section 分组的数据
  - 动态渲染各卡片：基本信息、简介、技能、经历、教育、证书
  - 保留现有入场动画效果
  - 无权限页面机制复用 router.js 现有逻辑
**对比现状**：55行 → 预计 ~200行

### T4.3 — 改造 `experience.js`
- [x] ✅ 已完成
**文件**：`frontend/js/pages/experience.js`
**改造内容**：
  - 完全重写（当前8行空壳）
  - 从 `/api/experience` 获取时间线数据
  - 按时间倒序渲染时间线DOM
  - 支持工作/教育/生活三种事件类型的图标区分
**对比现状**：8行 → 预计 ~150行

### T4.4 — 改造 `friends.js`
- [x] ✅ 已完成
**文件**：`frontend/js/pages/friends.js`
**改造内容**：
  - 从 `/api/friends/moments` 加载动态列表（替代硬编码4条）
  - 点赞对接 `api.friends.likeMoment()`（替代纯前端toggle）
  - 评论对接 `api.friends.createComment()`（替代 `alert()` 假提交）
  - 图片预览功能保留并完善
  - 分页加载（触底加载更多或传统分页）
  - 相对时间显示（"2小时前""昨天"等真实计算）
**对比现状**：192行（大量假交互代码）→ 预计 ~300行

### T4.5 — 重构 `resume.html`
- [x] ✅ 已完成
**文件**：`frontend/modules/pages/resume.html`
**改造**：移除所有硬编码数据，改为空容器 + `<template>` 标签，由 JS 动态填充
**保留**：页面结构和CSS类名不变，确保样式不破坏

### T4.6 — 重构 `experience.html`
- [x] ✅ 已完成
**文件**：`frontend/modules/pages/experience.html`
**改造**：移除4条硬编码时间线卡片，改为空容器 `<div class="timeline" id="timelineContainer"></div>`

### T4.7 — 重构 `friends.html`
- [x] ✅ 已完成
**文件**：`frontend/modules/pages/friends.html`
**改造**：移除4条硬编码朋友圈，改为空容器 `<div class="friends-timeline" id="momentsContainer"></div>`

---

## Phase 5 — 管理后台扩展

> 📁 核心文件：`frontend/js/admin.js`
> ⚠️ 前置：Phase 4

### T5.1 — 简历编辑面板
- [x] ✅ 已完成
**新增 Tab**：📄 简历管理
**功能**：
  - 按 section 分组展示所有简历字段
  - 编辑字段值（文本/长文本/列表类型）
  - 新增/删除字段
  - 拖拽调整排序
  - 一键保存

### T5.2 — 经历管理面板
- [x] ✅ 已完成
**新增 Tab**：🕐 经历管理
**功能**：
  - 时间线事件列表
  - 新增/编辑/删除事件
  - 事件类型选择（工作/教育/生活）
  - 项目经历子Tab
  - 拖拽排序

### T5.3 — 朋友圈管理面板
- [x] ✅ 已完成
**新增 Tab**：👥 朋友圈管理
**功能**：
  - 已发布动态列表（编辑/删除）
  - 发布新动态（图文编辑器）
  - 图片上传（复用已有上传API）+ 预览
  - 评论管理（查看/删除）
  - 最多9张图片限制提示

### T5.4 — 留言板管理（增强）
- [x] ✅ 已完成
**文件**：`frontend/js/admin.js`（现有留言管理模块）
**增强**：添加敏感词列表配置项展示（读取 config.yaml）

---

## Phase 6 — 留言板增强优化

> 📁 核心文件：`backend/app/api/messages.py`、`backend/config.yaml`
> ⚠️ 前置：无（可独立进行）
> 🚦 不阻塞其他任务

### T6.1 — 管理员名称配置化
- [x] ✅ 已完成
**文件**：`backend/config.yaml` + `backend/app/api/messages.py`
**修改**：
  - `config.yaml` 添加 `messages.admin_names: ["黑色小猫", "admin"]`
  - `messages.py` 通过 `_get_admin_names()` 从配置读取，替代硬编码 `ADMIN_NAMES = {"黑色小猫", "admin"}`
**备注**：`_is_admin_name()` 工具函数统一判断，配置热生效

### T6.2 — `list_messages` 返回 `total_pages`
- [x] ✅ 已完成
**文件**：`backend/app/api/messages.py`
**修改**：`list_messages` 和 `list_all_messages_admin` 响应体均增加 `"total_pages": math.ceil(total / per_page)`
**备注**：与 `/api/blog/posts` 和 `/api/friends/moments` 响应格式对齐

### T6.3 — 管理员回复标记优化
- [x] ✅ 已完成
**文件**：`backend/app/api/messages.py` + `backend/app/core/database.py`
**修改**：
  - `messages` 表新增 `is_admin INTEGER DEFAULT 0` 列
  - `create_message` 增加可选的 `user` Depends，管理员发留言时自动设置 `is_admin=1`
  - `_mask_message` 优先使用数据库 `is_admin` 列，其次检查名称
  - `list_all_messages_admin` 查询返回 `is_admin` 字段
**实现**：`create_message` 接收 `user: dict[str, Any] | None = Depends(get_current_user_optional)`

### T6.4 — 简历/经历与博客打通
- [x] ✅ 已完成
**文件**：`backend/app/core/database.py` + `backend/app/models/schemas.py` + `backend/app/api/experience.py` + `frontend/js/pages/resume.js`
**修改**：
  - `resume_projects` 表新增 `post_id INTEGER` 列（关联 posts.id）
  - Pydantic 模型 `ResumeProjectCreate/Update/Response` 新增 `post_id` 字段
  - 项目经历 CRUD 端点支持 `post_id` 写入和更新
  - 前端 resume.js 项目详情中显示「查看博客详情」链接（`#blog/{post_id}`）
**备注**：低优先级跨模块联动，管理员可在管理面板设置项目关联的博客文章

---

## 任务依赖图

```
Phase 1 (DB) ──→ Phase 2 (Models) ──→ Phase 3 (API) ──→ Phase 4 (Frontend) ──→ Phase 5 (Admin)
                                                                                      │
Phase 6 (Messages优化) ──────────────────────────────────────────────────────────────┘ (独立)

具体道路：
  T1.1-T1.6 → T2.1 → T3.1 → T4.1+T4.2+T4.5 → T5.1
  T1.2 → T2.2 → T3.2 → T4.1+T4.3+T4.6 → T5.2
  T1.4-T1.5 → T2.3 → T3.3 → T4.1+T4.4+T4.7 → T5.3
  T3.4 (注册路由) 依赖 T3.1+T3.2+T3.3 全部完成
  T3.5 (种子数据) 依赖 T3.1+T3.2+T3.3 完成 + Phase 1
```

---

## 执行记录

| 日期 | 完成项 | 备注 |
|------|--------|------|
| 2026-06-13 | 创建任务书 | 基于 CodeGraph 全面代码分析 |
| 2026-06-13 | T1.1-T1.6 | Phase 1 全部完成：5张新表(15列/13列/11列/7列/5列)+6个索引+config更新 |
| 2026-06-13 | T2.1-T2.3 | Phase 2 全部完成：17个新Pydantic模型（Resume 5个 + Timeline/Project 6个 + Friends 6个） |
| 2026-06-13 | T3.1-T3.5 | Phase 3 全部完成：3个新API模块(resume/experience/friends) 21个端点 + 路由注册 + 种子数据 |
| 2026-06-13 | T4.1-T4.7 | Phase 4 全部完成：api.js 扩展(3命名空间22方法) + resume.js 重写(55→332行) + experience.js 重写(8→75行) + friends.js 重写(192→314行) + 3 HTML模板去硬编码 |
| 2026-06-13 | T5.1-T5.4 | Phase 5 全部完成：admin.js 扩展(603→1256行) + admin-panel.html(3新Tab+通用表单弹窗) + admin.css(新组件样式) + config API端点 + config.yaml messages配置 |
| 2026-06-13 | T6.1-T6.4 | Phase 6 全部完成：messages.py 配置化(ADMIN_NAMES→config) + total_pages 响应对齐 + is_admin 列+自动标记 + post_id 跨表关联 + 博客详情链接 |

---

## 变更日志

- 2026-06-13：任务书初始创建，29 项任务，6 个 Phase
- 2026-06-13：Phase 1 完成。新增 `resume_data`、`timeline_events`、`resume_projects`、`friends_moments`、`friends_comments` 五张表 + 6个索引；数据库路径从 `data/` 迁移到 `db/`
- 2026-06-13：Phase 2 完成。新增 17 个 Pydantic 模型（`ResumeFieldCreate/Update/Response`、`ResumeSectionResponse`、`ResumeBatchUpdateRequest`、`TimelineEvent/Create/Update/Response`、`ResumeProjectCreate/Update/Response`、`MomentCreate/Update/Response/DetailResponse`、`FriendsCommentCreate/Response`）
- 2026-06-13：Phase 3 完成。新增 3 个 API 路由文件（`api/resume.py` 4端点、`api/experience.py` 9端点、`api/friends.py` 8端点），总计 21 个新 REST 端点；更新 `main.py` 注册路由 + 种子数据（简历字段/时间线事件/朋友圈动态）
- 2026-06-13：Phase 4 完成。`api.js` 新增 3 个命名空间；`resume.js` 从 55 行重写为 332 行；`experience.js` 从 8 行重写为 75 行；`friends.js` 从 192 行重写为 314 行；3 个 HTML 模板移除所有硬编码内容
- 2026-06-13：Phase 5 完成。管理面板新增 3 个 Tab（简历/经历/朋友圈管理）+ 通用表单弹窗
- 2026-06-13：Phase 6 完成。`messages.py` ADMIN_NAMES 配置化 + list_messages/list_all_messages_admin 响应增加 total_pages + messages 表新增 is_admin 列(管理员发布自动标记) + resume_projects 表新增 post_id 列(关联博客文章) + 前端简历项目可跳转博客详情

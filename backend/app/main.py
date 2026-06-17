"""FastAPI应用入口"""
import logging
import time as time_module
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from typing import Any

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import get_config, BASE_DIR
from .core.database import init_db, get_db
from .core.auth import hash_password, get_current_admin
from .api import auth, blog, users, messages, resume, experience, friends
import json

# 服务器启动时间（模块级别）
SERVER_START_TIME = time_module.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动和关闭"""
    cfg = get_config()

    # 配置日志
    log_cfg = cfg.get("logging", {})
    log_level = getattr(logging, log_cfg.get("level", "INFO").upper(), logging.INFO)
    logging.basicConfig(level=log_level, format="%(asctime)s [%(levelname)s] %(message)s")
    logger = logging.getLogger(__name__)

    # 初始化数据库
    if cfg["database"].get("auto_create_tables", True):
        await init_db()
        logger.info("数据库表已创建")

        # Phase 6 列迁移：为已有数据库添加新列
        db = await get_db()
        try:
            # T6.3: messages.is_admin 列
            try:
                await db.execute("ALTER TABLE messages ADD COLUMN is_admin INTEGER DEFAULT 0")
                await db.commit()
                logger.info("数据库迁移: messages.is_admin 列已添加")
            except Exception:
                pass  # 列已存在

            # T6.4: resume_projects.post_id 列
            try:
                await db.execute("ALTER TABLE resume_projects ADD COLUMN post_id INTEGER")
                await db.commit()
                logger.info("数据库迁移: resume_projects.post_id 列已添加")
            except Exception:
                pass  # 列已存在
        finally:
            await db.close()

    # 创建默认管理员
    if cfg["database"].get("seed_data", True):
        db = await get_db()
        try:
            admin_cfg = cfg.get("admin", {})
            cursor = await db.execute("SELECT id FROM admins WHERE username=?", (admin_cfg.get("username", "admin"),))
            if not await cursor.fetchone():
                await db.execute(
                    "INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)",
                    (admin_cfg.get("username", "admin"), hash_password(admin_cfg.get("password", "admin123")), admin_cfg.get("email")),
                )
                await db.commit()
                logger.info(f"默认管理员已创建: {admin_cfg.get('username', 'admin')}")

            # 插入示例分类
            categories = cfg.get("blog", {}).get("allowed_categories", [])
            for i, cat in enumerate(categories):
                cursor = await db.execute("SELECT id FROM categories WHERE name=?", (cat,))
                if not await cursor.fetchone():
                    slug = cat.lower().replace(" ", "-")
                    await db.execute("INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)", (cat, slug, f"{cat}相关文章"))
            await db.commit()

            # 插入示例标签
            tags = cfg.get("blog", {}).get("allowed_tags", [])
            for tag in tags:
                cursor = await db.execute("SELECT id FROM tags WHERE name=?", (tag,))
                if not await cursor.fetchone():
                    slug = tag.lower().replace(" ", "-")
                    await db.execute("INSERT INTO tags (name, slug) VALUES (?, ?)", (tag, slug))
            await db.commit()

            # 插入示例文章（如果数据库为空）
            cursor = await db.execute("SELECT COUNT(*) as cnt FROM posts")
            count = (await cursor.fetchone())["cnt"]
            if count == 0:
                sample_posts = [
                    {
                        "title": "React 18新特性深度解析：并发渲染与Suspense的应用实践",
                        "slug": "react-18",
                        "excerpt": "React 18带来了革命性的并发渲染能力，彻底改变了我们构建React应用的方式。本文将深入探讨useTransition、useDeferredValue等新API的实际应用场景...",
                        "content": "<h2>React 18带来的变革</h2><p>React 18是React框架发展历程中的一个重要里程碑，它引入了并发渲染（Concurrent Rendering）这一革命性特性，彻底改变了我们构建React应用的方式。</p><h3>并发渲染的核心概念</h3><p>并发渲染允许React应用在执行渲染任务时可以被中断，这使得应用能够更好地响应用户输入，提供更流畅的用户体验。</p><h3>Suspense在数据获取中的应用</h3><p>React 18进一步增强了Suspense的功能，使其可以用于数据获取场景，而不仅仅是代码分割。</p><h3>总结</h3><p>React 18的并发特性为构建高性能、响应式的Web应用提供了强大的工具。</p>",
                        "category_id": 1,
                        "is_featured": 0,
                    },
                    {
                        "title": "微前端架构在大型企业应用中的落地实践与挑战",
                        "slug": "microfrontend",
                        "excerpt": "随着企业应用规模的不断扩大，微前端架构成为解决复杂性问题的重要方案。本文将分享在大型电商平台中实施微前端架构的完整历程...",
                        "content": "<h2>微前端架构的必要性</h2><p>随着企业应用的不断复杂化，单体前端架构已经难以满足快速迭代和团队协作的需求。微前端架构将大型前端应用拆分为多个独立的子应用。</p><h3>技术选型</h3><ul><li>基于Single-SPA，成熟稳定</li><li>样式隔离机制完善</li><li>JavaScript沙箱机制</li></ul><h3>总结</h3><p>微前端架构在大型企业应用中展现出巨大优势。</p>",
                        "category_id": 1,
                        "is_featured": 1,
                    },
                    {
                        "title": "TypeScript高级类型编程：从泛型到条件类型的实战应用",
                        "slug": "typescript-advanced",
                        "excerpt": "TypeScript的类型系统提供了强大的编程能力，但很多开发者仅仅停留在基础类型的使用。本文将深入探讨条件类型、映射类型等高级特性...",
                        "content": "<h2>TypeScript高级类型系统</h2><p>TypeScript的类型系统提供了强大的编程能力，让开发者可以在编译时捕获更多的错误。</p><h3>泛型的进阶应用</h3><p>泛型是TypeScript最强大的特性之一。</p><h3>条件类型</h3><p>条件类型允许根据类型关系进行条件判断。</p><h3>总结</h3><p>TypeScript的高级类型系统为构建类型安全的复杂应用提供了强大的工具。</p>",
                        "category_id": 1,
                        "is_featured": 0,
                    },
                    {
                        "title": "Vue 3 Composition API最佳实践",
                        "slug": "vue3-composition",
                        "excerpt": "Vue 3的Composition API彻底改变了我们组织Vue组件逻辑的方式。本文将通过实际项目案例，详细讲解迁移过程和常见问题...",
                        "content": "<h2>Vue 3 Composition API</h2><p>Vue 3的Composition API彻底改变了我们组织Vue组件逻辑的方式。</p><h3>迁移要点</h3><ul><li>理解setup()函数的生命周期</li><li>使用ref和reactive管理状态</li><li>合理拆分组合式函数</li></ul><h3>总结</h3><p>Composition API让代码更加可维护和可复用，是Vue 3开发的推荐方式。</p>",
                        "category_id": 1,
                        "is_featured": 0,
                    },
                    {
                        "title": "现代JavaScript异步编程完全指南",
                        "slug": "async-programming",
                        "excerpt": "异步编程是现代JavaScript开发的核心技能。本文将全面介绍JavaScript异步编程的演进历程，深入解析Promise、Async/Await等核心概念...",
                        "content": "<h2>JavaScript异步编程</h2><p>异步编程是现代JavaScript开发的核心技能。</p><h3>Promise基础</h3><p>Promise提供了更优雅的异步操作管理方式。</p><h3>Async/Await</h3><p>Async/Await让异步代码看起来像同步代码，极大提升了可读性。</p><h3>总结</h3><p>掌握异步编程是成为优秀JavaScript开发者的必经之路。</p>",
                        "category_id": 1,
                        "is_featured": 0,
                    },
                    {
                        "title": "五年编程生涯感悟：从代码新手到架构师的成长之路",
                        "slug": "programming-journey",
                        "excerpt": "回顾五年的编程生涯，从一个只会写静态页面的新手，成长为能够独立负责大型项目架构的前端工程师。本文分享了经验教训与学习方法...",
                        "content": "<h2>五年编程生涯</h2><p>回顾五年的编程生涯，从一个只会写静态页面的新手，成长为能够独立负责大型项目架构的前端工程师。</p><h3>学习方法</h3><ul><li>坚持写技术博客</li><li>参与开源项目</li><li>持续学习新技术</li></ul><h3>总结</h3><p>成长没有捷径，唯有坚持和热爱。</p>",
                        "category_id": 3,
                        "is_featured": 0,
                    },
                ]
                now = datetime.now(timezone.utc).isoformat()
                for post in sample_posts:
                    await db.execute(
                        """INSERT INTO posts (title, slug, excerpt, content, category_id, is_published,
                           is_featured, views, likes, author_name, published_at, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)""",
                        (post["title"], post["slug"], post["excerpt"], post["content"],
                         post["category_id"], post["is_featured"],
                         1000 + hash(post["slug"]) % 4000, 50 + hash(post["slug"]) % 200,
                         "黑色小猫", now, now, now),
                    )
                await db.commit()
                logger.info("示例文章已插入")

            # ---- Phase 3: 种子数据 - 简历 ----
            cursor = await db.execute("SELECT COUNT(*) as cnt FROM resume_data")
            if (await cursor.fetchone())["cnt"] == 0:
                resume_fields = [
                    # basic_info
                    ("basic_info", "name", "姓名", "黑色小猫", "text", 1),
                    ("basic_info", "gender", "性别", "女", "text", 2),
                    ("basic_info", "age", "年龄", "28岁", "text", 3),
                    ("basic_info", "degree", "学历", "计算机科学学士", "text", 4),
                    ("basic_info", "work_years", "工作年限", "5年前端开发经验", "text", 5),
                    ("basic_info", "location", "现居地", "江西省南昌市", "text", 6),
                    ("basic_info", "phone", "联系电话", "+86 195 **** 5018", "text", 7),
                    ("basic_info", "email", "邮箱", "dym3411795482@qq.com", "text", 8),
                    ("basic_info", "github", "GitHub", "github.com/LoveSunday7", "text", 9),
                    ("basic_info", "bilibili", "Bilibili", "bili_67040379923", "text", 10),
                    # bio
                    ("bio", "summary", "个人简介", "我是一名具有5年前端开发经验的全栈工程师，专注于现代Web技术栈。编码时全身心投入，生活中热爱自然，通过徒步旅行和摄影感受山川湖海赋予的宁静与力量。我的人生格言是:活在当下，拥抱变化。", "longtext", 1),
                    # skills
                    ("skills", "frontend", "前端技术", "HTML5/CSS3, JavaScript/ES6+, React生态系统, Vue.js 2/3, TypeScript, 前端工程化(Webpack/Vite)", "text", 1),
                    ("skills", "backend", "后端与全栈", "Node.js(Express/Koa), MySQL/MongoDB, RESTful API, 微服务架构/Docker", "text", 2),
                    ("skills", "tools", "工具与平台", "Git/Git Flow, 敏捷开发(Jira), CI/CD(Jenkins/GitHub Actions), Jest/Cypress测试", "text", 3),
                    ("skills", "soft", "软技能", "团队协作, 问题解决, 快速学习, 项目管理(5人团队经验)", "text", 4),
                    # traits
                    ("traits", "creativity", "创造力", "善于将抽象概念转化为直观的视觉表达，注重用户体验和界面设计的美感与实用性结合", "text", 1),
                    ("traits", "teamwork", "团队协作", "良好的沟通能力和团队合作精神，注重知识分享和团队成长", "text", 2),
                    ("traits", "learning", "快速学习", "对新技术的强烈好奇心和学习能力，适应不同项目需求", "text", 3),
                    ("traits", "responsibility", "责任心", "对工作高度负责，注重代码质量和项目细节，追求卓越的用户体验", "text", 4),
                ]
                for section, key, label, value, ftype, order in resume_fields:
                    await db.execute(
                        "INSERT INTO resume_data (section, field_key, field_label, field_value, field_type, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (section, key, label, value, ftype, order, now),
                    )
                await db.commit()
                logger.info("示例简历数据已插入")

            # ---- Phase 3: 种子数据 - 时间线 ----
            cursor = await db.execute("SELECT COUNT(*) as cnt FROM timeline_events")
            if (await cursor.fetchone())["cnt"] == 0:
                events = [
                    ("work", "高级前端开发工程师", "科技先锋公司", "北京", "2020", "至今",
                     "负责公司核心产品的前端架构设计和技术选型，带领5人前端团队。优化了前端工程化流程，将项目构建时间缩短40%。引入微前端架构，提升了大型应用的开发效率和可维护性。",
                     ["主导的项目获得2022年度\"最佳用户体验奖\"", "团队效率提升30%"], 1),
                    ("work", "前端开发工程师", "创新科技有限公司", "上海", "2018", "2020",
                     "参与多个企业级Web应用开发，主要负责前端架构搭建和核心模块开发。与设计团队紧密合作，建立了公司前端组件库。优化了应用性能，将首屏加载时间从3秒降低到1.2秒。",
                     ["设计的组件库被公司所有前端项目采用", "代码复用率提升50%"], 2),
                    ("work", "网页开发工程师", "数字创意工作室", "杭州", "2016", "2018",
                     "负责公司官网和客户项目的网页开发，接触了从企业官网到电商平台的多种项目类型。熟练掌握了响应式设计和移动端适配技术。",
                     ["3个项目获得行业设计奖项", "客户满意度98%"], 3),
                    ("education", "计算机科学学士", "北京理工大学", "北京", "2012", "2016",
                     "主修计算机科学，辅修视觉设计。在校期间担任前端技术社团社长，组织了多次技术分享和编程比赛。参与多个Web开发项目。",
                     ["毕业设计\"基于React的可视化数据平台\"获得优秀毕业论文奖"], 4),
                ]
                for etype, title, org, loc, start, end, summary, highlights, order in events:
                    await db.execute(
                        """INSERT INTO timeline_events (event_type, title, organization, location, start_date, end_date, summary, highlights, sort_order, is_visible, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)""",
                        (etype, title, org, loc, start, end, summary,
                         json.dumps(highlights, ensure_ascii=False) if highlights else None,
                         order, now, now),
                    )
                await db.commit()
                logger.info("示例时间线数据已插入")

            # ---- Phase 3: 种子数据 - 朋友圈 ----
            cursor = await db.execute("SELECT COUNT(*) as cnt FROM friends_moments")
            if (await cursor.fetchone())["cnt"] == 0:
                moments = [
                    ("今天又完成了一个项目的重构，代码更加优雅了！Vue 3 + TypeScript 的组合真的太强大了，类型安全让开发体验提升了一个档次。继续加油！", None),
                    ("周末徒步征服了庐山，海拔1474米，全程15公里。山间的云雾真的太美了，仿佛置身仙境。分享几张照片给大家看看！", json.dumps(["/images/mountain.avif"], ensure_ascii=False)),
                    ("最近在研究微前端架构，发现乾坤(Qiankun)框架真的很强大！解决了大型应用模块化开发中的很多痛点。", None),
                    ("读完《重构：改善既有代码的设计》第二版，收获满满！好的代码应该是可读、可维护、可扩展的。", None),
                ]
                for content, images in moments:
                    await db.execute(
                        "INSERT INTO friends_moments (author_name, content, images, likes, is_published, created_at) VALUES (?, ?, ?, ?, 1, ?)",
                        ("黑色小猫", content, images,
                         hash(content) % 50 + 5, now),
                    )
                await db.commit()
                logger.info("示例朋友圈数据已插入")

        finally:
            await db.close()

    logger.info("应用启动完成")
    yield
    logger.info("应用关闭")


def create_app() -> FastAPI:
    cfg = get_config()

    app = FastAPI(
        title="黑色小猫咪的GitHub小窝",
        description="个人博客后端API",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS
    cors_origins = cfg["server"].get("cors_origins", ["*"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 根路由
    @app.get("/", summary="API首页")
    async def root():
        return {
            "name": "黑色小猫咪的GitHub小窝",
            "version": "1.0.0",
            "docs": "/docs",
            "endpoints": {
                "auth": "/api/auth",
                "blog": "/api/blog",
                "users": "/api/users",
                "messages": "/api/messages",
                "resume": "/api/resume",
                "experience": "/api/experience",
                "friends": "/api/friends",
            },
        }

    # 注册路由
    app.include_router(auth.router, prefix="/api")
    app.include_router(blog.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(messages.router, prefix="/api")
    app.include_router(resume.router, prefix="/api")
    app.include_router(experience.router, prefix="/api")
    app.include_router(friends.router, prefix="/api")

    # 健康检查
    @app.get("/api/health", summary="服务器健康检查")
    async def health_check():
        uptime_seconds = int(time_module.time() - SERVER_START_TIME)
        days, remainder = divmod(uptime_seconds, 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{days}天{hours}时{minutes}分{seconds}秒"
        return {
            "status": "ok",
            "server_time": datetime.now(timezone.utc).isoformat(),
            "started_at": datetime.fromtimestamp(SERVER_START_TIME, tz=timezone.utc).isoformat(),
            "uptime": uptime_str,
            "uptime_seconds": uptime_seconds,
        }

    # 静态文件（上传目录）
    upload_dir = BASE_DIR / cfg.get("upload", {}).get("upload_dir", "data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    # 管理配置端点（供管理面板读取配置）
    @app.get("/api/admin/config", summary="获取管理配置（管理员）")
    async def get_admin_config(_admin: dict[str, Any] = Depends(get_current_admin)):
        cfg = get_config()
        msg_cfg = cfg.get("messages", {})
        return {
            "messages": {
                "admin_names": msg_cfg.get("admin_names", ["黑色小猫", "admin"]),
                "sensitive_words": msg_cfg.get("sensitive_words", []),
            },
        }

    return app

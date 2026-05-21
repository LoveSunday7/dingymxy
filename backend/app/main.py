"""FastAPI应用入口"""
import logging
import time as time_module
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import get_config, BASE_DIR
from .core.database import init_db, get_db
from .core.auth import hash_password
from .api import auth, blog, users, messages

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
            },
        }

    # 注册路由
    app.include_router(auth.router, prefix="/api")
    app.include_router(blog.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(messages.router, prefix="/api")

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

    return app

"""数据库连接模块 - 异步SQLite (aiosqlite)"""
import aiosqlite
from pathlib import Path
from .config import get_config, BASE_DIR


_db_path: str = ""


def get_db_path() -> str:
    global _db_path
    if not _db_path:
        cfg = get_config()
        raw = cfg["database"]["path"]
        path = Path(raw)
        if not path.is_absolute():
            path = BASE_DIR / raw
        path.parent.mkdir(parents=True, exist_ok=True)
        _db_path = str(path)
    return _db_path


async def get_db() -> aiosqlite.Connection:
    """获取异步数据库连接"""
    db = await aiosqlite.connect(get_db_path())
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA foreign_keys=ON")
    return db


async def init_db():
    """初始化数据库 - 创建所有表"""
    db = await get_db()
    try:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
        # 迁移：为旧表添加新列
        await _migrate(db)
    finally:
        await db.close()


async def _migrate(db: aiosqlite.Connection):
    """数据库迁移 - 为已存在的表添加新列"""
    # messages 表添加 parent_id 和 reply_to_name
    try:
        await db.execute("ALTER TABLE messages ADD COLUMN parent_id INTEGER REFERENCES messages(id) ON DELETE CASCADE")
        await db.commit()
    except Exception:
        pass  # 列已存在
    try:
        await db.execute("ALTER TABLE messages ADD COLUMN reply_to_name TEXT")
        await db.commit()
    except Exception:
        pass  # 列已存在
    # 创建索引（如果不存在）
    try:
        await db.execute("CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id)")
        await db.commit()
    except Exception:
        pass


SCHEMA_SQL = """
-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 访客/用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    wechat TEXT,
    qq TEXT,
    access_code TEXT UNIQUE,
    is_verified INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    resource_type TEXT NOT NULL,  -- 'page', 'post', 'category'
    resource_id TEXT NOT NULL,     -- 页面名/文章ID/分类名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, resource_type, resource_id)
);

-- 文章分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文章表
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category_id INTEGER,
    is_published INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    author_name TEXT DEFAULT '黑色小猫',
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 文章-标签关联表
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER,
    author_name TEXT NOT NULL,
    author_email TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    parent_id INTEGER,
    is_approved INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- 留言板消息表
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    parent_id INTEGER,
    reply_to_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- 公开页面表（无需登录即可访问的页面）
CREATE TABLE IF NOT EXISTS public_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_id TEXT NOT NULL UNIQUE,  -- 页面标识: home, resume, experience, blog, friends, contact
    is_public INTEGER DEFAULT 0,   -- 0=需权限, 1=公开
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_users_access_code ON users(access_code);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_public_pages_page ON public_pages(page_id);
"""

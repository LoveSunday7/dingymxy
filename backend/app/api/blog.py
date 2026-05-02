"""博客文章相关API"""
import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..core.auth import get_current_admin
from ..core.config import get_config
from ..core.database import get_db
from ..models.schemas import PostCreateRequest, PostUpdateRequest

router = APIRouter(prefix="/blog", tags=["博客"])


@router.get("/posts", summary="获取文章列表（公开）")
async def list_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    category: str = Query(default=None),
    tag: str = Query(default=None),
    search: str = Query(default=None),
):
    cfg: dict[str, Any] = get_config()
    if per_page == 10:
        per_page = cfg["blog"]["posts_per_page"]

    db = await get_db()
    try:
        conditions: list[str] = ["p.is_published=1"]
        params: list[str] = []

        if category:
            conditions.append("c.slug=?")
            params.append(category)
        if tag:
            conditions.append("t.slug=?")
            params.append(tag)
        if search:
            conditions.append("(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        where = " AND ".join(conditions)

        # 总数
        count_sql = f"""
            SELECT COUNT(DISTINCT p.id) as total
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE {where}
        """
        cursor = await db.execute(count_sql, params)
        count_row = await cursor.fetchone()
        total = count_row["total"] if count_row else 0

        # 文章列表
        list_sql = f"""
            SELECT DISTINCT p.id, p.title, p.slug, p.excerpt, p.is_featured, p.views,
                   p.likes, p.author_name, p.published_at, p.created_at,
                   c.id as category_id, c.name as category_name, c.slug as category_slug
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN post_tags pt ON p.id = pt.post_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            WHERE {where}
            ORDER BY p.is_featured DESC, p.published_at DESC
            LIMIT ? OFFSET ?
        """
        cursor = await db.execute(list_sql, params + [per_page, (page - 1) * per_page])
        posts = await cursor.fetchall()

        result = []
        for p in posts:
            # 获取文章标签
            tag_cursor = await db.execute(
                """SELECT t.id, t.name, t.slug FROM tags t
                   JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id=?""",
                (p["id"],),
            )
            tags = await tag_cursor.fetchall()

            # 获取评论数
            cmt_cursor = await db.execute(
                "SELECT COUNT(*) as cnt FROM comments WHERE post_id=? AND is_approved=1", (p["id"],)
            )
            cmt_result = await cmt_cursor.fetchone()
            comments_count = cmt_result["cnt"] if cmt_result else 0

            result.append({
                "id": p["id"],
                "title": p["title"],
                "slug": p["slug"],
                "excerpt": p["excerpt"],
                "is_featured": bool(p["is_featured"]),
                "views": p["views"],
                "likes": p["likes"],
                "author_name": p["author_name"],
                "published_at": p["published_at"],
                "created_at": p["created_at"],
                "category": {"id": p["category_id"], "name": p["category_name"], "slug": p["category_slug"]} if p["category_id"] else None,
                "tags": [{"id": t["id"], "name": t["name"], "slug": t["slug"]} for t in tags],
                "comments_count": comments_count,
            })

        total_pages = math.ceil(total / per_page) if total > 0 else 1
        return {"posts": result, "total": total, "page": page, "per_page": per_page, "total_pages": total_pages}
    finally:
        await db.close()


@router.get("/posts/{post_id}", summary="获取文章详情")
async def get_post(post_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT p.*, c.id as category_id, c.name as category_name, c.slug as category_slug
               FROM posts p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id=?""",
            (post_id,),
        )
        post = await cursor.fetchone()
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

        # 增加阅读量
        await db.execute("UPDATE posts SET views=views+1 WHERE id=?", (post_id,))
        await db.commit()

        # 标签
        tag_cursor = await db.execute(
            """SELECT t.id, t.name, t.slug FROM tags t
               JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id=?""",
            (post_id,),
        )
        tags = await tag_cursor.fetchall()

        # 评论
        cmt_cursor = await db.execute(
            """SELECT id, post_id, author_name, author_email, content, likes, parent_id,
                      is_approved, created_at
               FROM comments WHERE post_id=? AND is_approved=1 ORDER BY created_at ASC""",
            (post_id,),
        )
        comments = await cmt_cursor.fetchall()

        # 相关文章（同分类或同标签）
        related = []
        if post["category_id"]:
            rel_cursor = await db.execute(
                """SELECT id, title, published_at FROM posts
                   WHERE category_id=? AND id!=? AND is_published=1
                   ORDER BY published_at DESC LIMIT 3""",
                (post["category_id"], post_id),
            )
            related = await rel_cursor.fetchall()

        return {
            "id": post["id"],
            "title": post["title"],
            "slug": post["slug"],
            "excerpt": post["excerpt"],
            "content": post["content"],
            "is_featured": bool(post["is_featured"]),
            "views": post["views"] + 1,
            "likes": post["likes"],
            "author_name": post["author_name"],
            "published_at": post["published_at"],
            "created_at": post["created_at"],
            "updated_at": post["updated_at"],
            "category": {"id": post["category_id"], "name": post["category_name"], "slug": post["category_slug"]} if post["category_id"] else None,
            "tags": [{"id": t["id"], "name": t["name"], "slug": t["slug"]} for t in tags],
            "comments": [
                {
                    "id": c["id"], "author_name": c["author_name"], "author_email": c["author_email"],
                    "content": c["content"], "likes": c["likes"], "parent_id": c["parent_id"],
                    "created_at": c["created_at"],
                }
                for c in comments
            ],
            "related_posts": [
                {"id": r["id"], "title": r["title"], "date": r["published_at"]} for r in related
            ],
        }
    finally:
        await db.close()


@router.post("/posts", summary="创建文章（管理员）")
async def create_post(req: PostCreateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        # 生成slug
        slug = req.slug or req.title.lower().replace(" ", "-")

        # 检查slug唯一
        cursor = await db.execute("SELECT id FROM posts WHERE slug=?", (slug,))
        if await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="slug已存在")

        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO posts (title, slug, excerpt, content, category_id, is_published,
               is_featured, author_name, published_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.title, slug, req.excerpt, req.content, req.category_id,
             int(req.is_published), int(req.is_featured), req.author_name,
             now if req.is_published else None, now, now),
        )
        post_id = cursor.lastrowid

        # 关联标签
        for tag_id in req.tag_ids:
            await db.execute("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)", (post_id, tag_id))

        await db.commit()
        return {"success": True, "message": "文章创建成功", "data": {"id": post_id, "slug": slug}}
    finally:
        await db.close()


@router.put("/posts/{post_id}", summary="更新文章（管理员）")
async def update_post(post_id: int, req: PostUpdateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM posts WHERE id=?", (post_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

        updates = []
        params = []
        for field in ["title", "slug", "excerpt", "content", "category_id", "is_published", "is_featured", "author_name"]:
            val = getattr(req, field, None)
            if val is not None:
                if field in ("is_published", "is_featured"):
                    val = int(val)
                updates.append(f"{field}=?")
                params.append(val)

        if updates:
            updates.append("updated_at=?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(post_id)
            await db.execute(f"UPDATE posts SET {', '.join(updates)} WHERE id=?", params)

        if req.tag_ids is not None:
            await db.execute("DELETE FROM post_tags WHERE post_id=?", (post_id,))
            for tag_id in req.tag_ids:
                await db.execute("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)", (post_id, tag_id))

        await db.commit()
        return {"success": True, "message": "文章更新成功"}
    finally:
        await db.close()


@router.delete("/posts/{post_id}", summary="删除文章（管理员）")
async def delete_post(post_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM posts WHERE id=?", (post_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

        await db.execute("DELETE FROM posts WHERE id=?", (post_id,))
        await db.commit()
        return {"success": True, "message": "文章已删除"}
    finally:
        await db.close()


@router.post("/posts/{post_id}/like", summary="点赞文章")
async def like_post(post_id: int):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM posts WHERE id=?", (post_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

        await db.execute("UPDATE posts SET likes=likes+1 WHERE id=?", (post_id,))
        await db.commit()

        cursor = await db.execute("SELECT likes FROM posts WHERE id=?", (post_id,))
        like_row = await cursor.fetchone()
        likes = like_row["likes"] if like_row else 0
        return {"success": True, "message": "点赞成功", "data": {"likes": likes}}
    finally:
        await db.close()


@router.get("/categories", summary="获取所有分类")
async def list_categories():
    db = await get_db()
    try:
        cursor = await db.execute("SELECT c.*, COUNT(p.id) as post_count FROM categories c LEFT JOIN posts p ON c.id=p.category_id GROUP BY c.id ORDER BY c.name")
        rows = await cursor.fetchall()
        return [{"id": r["id"], "name": r["name"], "slug": r["slug"], "description": r["description"], "post_count": r["post_count"]} for r in rows]
    finally:
        await db.close()


@router.get("/tags", summary="获取所有标签")
async def list_tags():
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT t.*, COUNT(pt.post_id) as post_count FROM tags t
               LEFT JOIN post_tags pt ON t.id=pt.tag_id
               LEFT JOIN posts p ON pt.post_id=p.id AND p.is_published=1
               GROUP BY t.id ORDER BY t.name"""
        )
        rows = await cursor.fetchall()
        return [{"id": r["id"], "name": r["name"], "slug": r["slug"], "post_count": r["post_count"]} for r in rows]
    finally:
        await db.close()


@router.post("/categories", summary="创建分类（管理员）")
async def create_category(req: dict[str, Any], _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)", (req["name"], req["slug"], req.get("description")))
        await db.commit()
        return {"success": True, "message": "分类创建成功", "data": {"id": cursor.lastrowid}}
    except Exception as e:
        if "UNIQUE" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="分类名或slug已存在")
        raise
    finally:
        await db.close()


@router.post("/tags", summary="创建标签（管理员）")
async def create_tag(req: dict[str, Any], _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("INSERT INTO tags (name, slug) VALUES (?, ?)", (req["name"], req["slug"]))
        await db.commit()
        return {"success": True, "message": "标签创建成功", "data": {"id": cursor.lastrowid}}
    except Exception as e:
        if "UNIQUE" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="标签名或slug已存在")
        raise
    finally:
        await db.close()


# ====== 评论 ======

@router.post("/posts/{post_id}/comments", summary="发表评论")
async def create_comment(post_id: int, req: dict):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM posts WHERE id=?", (post_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="文章不存在")

        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO comments (post_id, user_id, author_name, author_email, content, parent_id, is_approved, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 1, ?)""",
            (post_id, req.get("user_id"), req["author_name"], req.get("author_email"), req["content"], req.get("parent_id"), now),
        )
        await db.commit()
        return {"success": True, "message": "评论发表成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.post("/comments/{comment_id}/like", summary="点赞评论")
async def like_comment(comment_id: int):
    db = await get_db()
    try:
        await db.execute("UPDATE comments SET likes=likes+1 WHERE id=?", (comment_id,))
        await db.commit()
        cursor = await db.execute("SELECT likes FROM comments WHERE id=?", (comment_id,))
        row = await cursor.fetchone()
        return {"success": True, "data": {"likes": row["likes"] if row else 0}}
    finally:
        await db.close()


@router.delete("/comments/{comment_id}", summary="删除评论（管理员）")
async def delete_comment(comment_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM comments WHERE id=?", (comment_id,))
        await db.commit()
        return {"success": True, "message": "评论已删除"}
    finally:
        await db.close()

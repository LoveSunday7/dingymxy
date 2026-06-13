"""朋友圈相关API"""
import json
import math
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..core.auth import get_current_admin
from ..core.database import get_db
from ..models.schemas import FriendsCommentCreate, MomentCreate, MomentUpdate

router = APIRouter(prefix="/friends", tags=["朋友圈"])


@router.get("/moments", summary="获取朋友圈动态列表（公开，分页）")
async def list_moments(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=30),
):
    db = await get_db()
    try:
        # 总数
        cursor = await db.execute("SELECT COUNT(*) as total FROM friends_moments WHERE is_published=1")
        row = await cursor.fetchone()
        total = row["total"] if row else 0

        offset = (page - 1) * per_page
        cursor = await db.execute(
            """SELECT m.id, m.author_name, m.content, m.images, m.likes, m.created_at,
                      (SELECT COUNT(*) FROM friends_comments WHERE moment_id=m.id) as comments_count
               FROM friends_moments m WHERE m.is_published=1
               ORDER BY m.created_at DESC LIMIT ? OFFSET ?""",
            (per_page, offset),
        )
        rows = await cursor.fetchall()

        moments = []
        for r in rows:
            moments.append({
                "id": r["id"], "author_name": r["author_name"], "content": r["content"],
                "images": json.loads(r["images"]) if r["images"] else [],
                "likes": r["likes"], "created_at": r["created_at"],
                "comments_count": r["comments_count"],
            })

        total_pages = math.ceil(total / per_page) if total > 0 else 1
        return {
            "success": True, "moments": moments,
            "total": total, "page": page, "per_page": per_page, "total_pages": total_pages,
        }
    finally:
        await db.close()


@router.get("/moments/{moment_id}", summary="获取单条动态详情（含评论）")
async def get_moment(moment_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, author_name, content, images, likes, is_published, created_at "
            "FROM friends_moments WHERE id=?",
            (moment_id,),
        )
        m = await cursor.fetchone()
        if not m:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="动态不存在")

        # 获取评论
        comment_cursor = await db.execute(
            "SELECT id, moment_id, author_name, content, created_at "
            "FROM friends_comments WHERE moment_id=? ORDER BY created_at ASC",
            (moment_id,),
        )
        comments = await comment_cursor.fetchall()

        return {
            "id": m["id"], "author_name": m["author_name"], "content": m["content"],
            "images": json.loads(m["images"]) if m["images"] else [],
            "likes": m["likes"], "is_published": bool(m["is_published"]),
            "created_at": m["created_at"],
            "comments": [
                {
                    "id": c["id"], "moment_id": c["moment_id"],
                    "author_name": c["author_name"], "content": c["content"],
                    "created_at": c["created_at"],
                }
                for c in comments
            ],
        }
    finally:
        await db.close()


@router.post("/moments", summary="发布朋友圈动态（管理员）")
async def create_moment(req: MomentCreate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO friends_moments (author_name, content, images, likes, is_published, created_at)
               VALUES (?, ?, ?, 0, 1, ?)""",
            ("黑色小猫", req.content,
             json.dumps(req.images, ensure_ascii=False) if req.images else None,
             now),
        )
        await db.commit()
        return {"success": True, "message": "动态发布成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.put("/moments/{moment_id}", summary="编辑动态（管理员）")
async def update_moment(moment_id: int, req: MomentUpdate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM friends_moments WHERE id=?", (moment_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="动态不存在")

        updates: list[str] = []
        params: list[Any] = []
        if req.content is not None:
            updates.append("content=?")
            params.append(req.content)
        if req.images is not None:
            updates.append("images=?")
            params.append(json.dumps(req.images, ensure_ascii=False))
        if req.is_published is not None:
            updates.append("is_published=?")
            params.append(int(req.is_published))

        if updates:
            params.append(moment_id)
            await db.execute(f"UPDATE friends_moments SET {', '.join(updates)} WHERE id=?", params)
            await db.commit()

        return {"success": True, "message": "动态已更新"}
    finally:
        await db.close()


@router.delete("/moments/{moment_id}", summary="删除动态（管理员）")
async def delete_moment(moment_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM friends_moments WHERE id=?", (moment_id,))
        await db.commit()
        return {"success": True, "message": "动态已删除"}
    finally:
        await db.close()


@router.post("/moments/{moment_id}/like", summary="点赞动态")
async def like_moment(moment_id: int):
    db = await get_db()
    try:
        await db.execute("UPDATE friends_moments SET likes=likes+1 WHERE id=?", (moment_id,))
        await db.commit()
        cursor = await db.execute("SELECT likes FROM friends_moments WHERE id=?", (moment_id,))
        row = await cursor.fetchone()
        return {"success": True, "data": {"likes": row["likes"] if row else 0}}
    finally:
        await db.close()


@router.post("/moments/{moment_id}/comments", summary="发表评论")
async def create_comment(moment_id: int, req: FriendsCommentCreate):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM friends_moments WHERE id=?", (moment_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="动态不存在")

        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            "INSERT INTO friends_comments (moment_id, author_name, content, created_at) VALUES (?, ?, ?, ?)",
            (moment_id, req.author_name, req.content, now),
        )
        await db.commit()
        return {"success": True, "message": "评论发表成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.delete("/comments/{comment_id}", summary="删除评论（管理员）")
async def delete_comment(comment_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM friends_comments WHERE id=?", (comment_id,))
        await db.commit()
        return {"success": True, "message": "评论已删除"}
    finally:
        await db.close()

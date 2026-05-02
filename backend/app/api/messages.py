"""留言板相关API"""
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query

from ..core.auth import get_current_admin
from ..core.database import get_db
from ..models.schemas import MessageCreateRequest

router = APIRouter(prefix="/messages", tags=["留言板"])


@router.get("", summary="获取留言列表")
async def list_messages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) as total FROM messages")
        row = await cursor.fetchone()
        total = row["total"] if row else 0

        offset = (page - 1) * per_page
        cursor = await db.execute(
            "SELECT id, name, email, content, likes, created_at FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (per_page, offset),
        )
        rows = await cursor.fetchall()

        messages = [
            {
                "id": r["id"], "name": r["name"], "email": r["email"],
                "content": r["content"], "likes": r["likes"], "created_at": r["created_at"],
            }
            for r in rows
        ]

        return {"messages": messages, "total": total, "page": page, "per_page": per_page}
    finally:
        await db.close()


@router.post("", summary="发表留言")
async def create_message(req: MessageCreateRequest):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            "INSERT INTO messages (name, email, content, likes, is_read, created_at) VALUES (?, ?, ?, 0, 0, ?)",
            (req.name, req.email, req.content, now),
        )
        await db.commit()
        return {"success": True, "message": "留言发表成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.post("/{message_id}/like", summary="点赞留言")
async def like_message(message_id: int):
    db = await get_db()
    try:
        await db.execute("UPDATE messages SET likes=likes+1 WHERE id=?", (message_id,))
        await db.commit()
        cursor = await db.execute("SELECT likes FROM messages WHERE id=?", (message_id,))
        row = await cursor.fetchone()
        return {"success": True, "data": {"likes": row["likes"] if row else 0}}
    finally:
        await db.close()


@router.delete("/{message_id}", summary="删除留言（管理员）")
async def delete_message(message_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM messages WHERE id=?", (message_id,))
        await db.commit()
        return {"success": True, "message": "留言已删除"}
    finally:
        await db.close()

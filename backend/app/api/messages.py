"""留言板相关API"""
import hashlib
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query

from ..core.auth import get_current_admin, get_current_user_optional
from ..core.database import get_db
from ..models.schemas import MessageCreateRequest

router = APIRouter(prefix="/messages", tags=["留言板"])

# 管理员可能的名称（用于识别管理员留言）
ADMIN_NAMES = {"黑色小猫", "admin"}


def _mask_message(msg: dict, is_logged_in: bool) -> dict:
    """根据登录状态脱敏留言信息"""
    if is_logged_in:
        # 登录用户可以看到所有信息
        msg["is_admin"] = msg["name"] in ADMIN_NAMES
        # 递归处理回复
        masked_replies = []
        for reply in msg.get("replies", []):
            masked_replies.append(_mask_message(reply, is_logged_in))
        msg["replies"] = masked_replies
        return msg

    # 未登录用户：隐藏非管理员的真实姓名和邮箱
    if msg["name"] in ADMIN_NAMES:
        msg["is_admin"] = True
        # 管理员名字保留，邮箱隐藏
        msg["email"] = None
    else:
        msg["is_admin"] = False
        # 非管理员：名字脱敏，邮箱隐藏
        original_name = msg["name"]
        if len(original_name) >= 2:
            msg["name"] = original_name[0] + "*" * (len(original_name) - 1)
        else:
            msg["name"] = "访客"
        msg["email"] = None

    # 脱敏回复中的信息
    masked_replies = []
    for reply in msg.get("replies", []):
        masked_replies.append(_mask_message(reply, is_logged_in))
    msg["replies"] = masked_replies

    # 脱敏 reply_to_name
    if msg.get("reply_to_name"):
        if msg["reply_to_name"] not in ADMIN_NAMES:
            rname = msg["reply_to_name"]
            if len(rname) >= 2:
                msg["reply_to_name"] = rname[0] + "*" * (len(rname) - 1)
            else:
                msg["reply_to_name"] = "访客"

    return msg


@router.get("", summary="获取留言列表（树形结构）")
async def list_messages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: dict[str, Any] | None = Depends(get_current_user_optional),
):
    is_logged_in = user is not None

    db = await get_db()
    try:
        # 只统计顶级留言
        cursor = await db.execute("SELECT COUNT(*) as total FROM messages WHERE parent_id IS NULL")
        row = await cursor.fetchone()
        total = row["total"] if row else 0

        offset = (page - 1) * per_page
        cursor = await db.execute(
            """SELECT id, name, email, content, likes, created_at
               FROM messages WHERE parent_id IS NULL
               ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            (per_page, offset),
        )
        rows = await cursor.fetchall()

        messages = []
        for r in rows:
            msg = {
                "id": r["id"], "name": r["name"], "email": r["email"],
                "content": r["content"], "likes": r["likes"], "created_at": r["created_at"],
                "replies": [],
            }
            # 获取该留言的所有回复
            reply_cursor = await db.execute(
                """SELECT id, name, email, content, likes, parent_id, reply_to_name, created_at
                   FROM messages WHERE parent_id=?
                   ORDER BY created_at ASC""",
                (r["id"],),
            )
            reply_rows = await reply_cursor.fetchall()
            for rr in reply_rows:
                msg["replies"].append({
                    "id": rr["id"], "name": rr["name"], "email": rr["email"],
                    "content": rr["content"], "likes": rr["likes"],
                    "parent_id": rr["parent_id"], "reply_to_name": rr["reply_to_name"],
                    "created_at": rr["created_at"],
                })

            # 根据身份脱敏
            msg = _mask_message(msg, is_logged_in)
            messages.append(msg)

        return {"messages": messages, "total": total, "page": page, "per_page": per_page}
    finally:
        await db.close()


@router.post("", summary="发表留言/回复")
async def create_message(req: MessageCreateRequest):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO messages (name, email, content, likes, is_read, parent_id, reply_to_name, created_at)
               VALUES (?, ?, ?, 0, 0, ?, ?, ?)""",
            (req.name, req.email, req.content, req.parent_id, req.reply_to_name, now),
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


@router.get("/admin/all", summary="获取所有留言（管理员，扁平列表）")
async def list_all_messages_admin(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    _admin: dict[str, Any] = Depends(get_current_admin),
):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) as total FROM messages")
        row = await cursor.fetchone()
        total = row["total"] if row else 0

        offset = (page - 1) * per_page
        cursor = await db.execute(
            """SELECT id, name, email, content, likes, is_read, parent_id, reply_to_name, created_at
               FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?""",
            (per_page, offset),
        )
        rows = await cursor.fetchall()

        messages = [
            {
                "id": r["id"], "name": r["name"], "email": r["email"],
                "content": r["content"], "likes": r["likes"],
                "is_read": bool(r["is_read"]), "parent_id": r["parent_id"],
                "reply_to_name": r["reply_to_name"], "created_at": r["created_at"],
                "is_admin": r["name"] in ADMIN_NAMES,
            }
            for r in rows
        ]

        return {"messages": messages, "total": total, "page": page, "per_page": per_page}
    finally:
        await db.close()


@router.put("/{message_id}/read", summary="标记留言已读（管理员）")
async def mark_message_read(message_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("UPDATE messages SET is_read=1 WHERE id=?", (message_id,))
        await db.commit()
        return {"success": True, "message": "已标记为已读"}
    finally:
        await db.close()

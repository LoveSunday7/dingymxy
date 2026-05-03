"""用户管理相关API（管理员）"""
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..core.auth import (
    can_access_page,
    get_current_admin,
    get_current_user_optional,
    get_all_public_pages,
    get_user_permissions,
)
from ..core.database import get_db
from ..models.schemas import PermissionCreateRequest, PublicPageUpdate, UserCreateRequest, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["用户管理"])


def generate_access_code() -> str:
    """生成6位访问码"""
    return secrets.token_hex(3).upper()


@router.get("", summary="获取用户列表（管理员）")
async def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str = Query(default=None),
    _admin: dict[str, Any] = Depends(get_current_admin),
):
    db = await get_db()
    try:
        conditions = []
        params = []
        if search:
            conditions.append("(name LIKE ? OR phone LIKE ? OR email LIKE ? OR wechat LIKE ? OR qq LIKE ?)")
            params.extend([f"%{search}%"] * 5)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""

        # 总数
        cursor = await db.execute(f"SELECT COUNT(*) as total FROM users {where}", params)
        count_row = await cursor.fetchone()
        total = count_row["total"] if count_row else 0

        # 列表
        offset = (page - 1) * per_page
        cursor = await db.execute(
            f"SELECT id, name, phone, email, wechat, qq, access_code, is_verified, last_login_at, created_at FROM users {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        )
        rows = await cursor.fetchall()

        users = []
        for r in rows:
            perms = await get_user_permissions(r["id"])
            users.append({
                "id": r["id"], "name": r["name"], "phone": r["phone"], "email": r["email"],
                "wechat": r["wechat"], "qq": r["qq"], "access_code": r["access_code"],
                "is_verified": bool(r["is_verified"]), "last_login_at": r["last_login_at"],
                "created_at": r["created_at"], "permissions": perms,
            })

        return {"users": users, "total": total, "page": page, "per_page": per_page}
    finally:
        await db.close()


@router.post("", summary="创建访客（管理员预录入）")
async def create_user(req: UserCreateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        access_code = generate_access_code()
        # 确保access_code唯一
        while True:
            cursor = await db.execute("SELECT id FROM users WHERE access_code=?", (access_code,))
            if not await cursor.fetchone():
                break
            access_code = generate_access_code()

        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO users (name, phone, email, wechat, qq, access_code, is_verified, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)""",
            (req.name, req.phone, req.email, req.wechat, req.qq, access_code, now, now),
        )
        await db.commit()

        return {
            "success": True,
            "message": "访客创建成功",
            "data": {
                "id": cursor.lastrowid,
                "name": req.name,
                "access_code": access_code,
            },
        }
    finally:
        await db.close()


@router.get("/stats", summary="获取站点统计（管理员）")
async def get_stats(_admin: dict[str, Any] = Depends(get_current_admin)):
    """获取站点统计数据"""
    db = await get_db()
    try:
        # 用户数
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM users")
        row = await cursor.fetchone()
        total_users = row["cnt"] if row else 0

        cursor = await db.execute("SELECT COUNT(*) as cnt FROM users WHERE is_verified=1")
        row = await cursor.fetchone()
        verified_users = row["cnt"] if row else 0

        # 文章数
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM posts")
        row = await cursor.fetchone()
        total_posts = row["cnt"] if row else 0

        cursor = await db.execute("SELECT COALESCE(SUM(views),0) as v FROM posts")
        row = await cursor.fetchone()
        total_views = row["v"] if row else 0

        cursor = await db.execute("SELECT COALESCE(SUM(likes),0) as l FROM posts")
        row = await cursor.fetchone()
        total_likes = row["l"] if row else 0

        # 评论数
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM comments")
        row = await cursor.fetchone()
        total_comments = row["cnt"] if row else 0

        # 留言数
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM messages")
        row = await cursor.fetchone()
        total_messages = row["cnt"] if row else 0

        # 公开页面数
        cursor = await db.execute("SELECT COUNT(*) as cnt FROM public_pages WHERE is_public=1")
        row = await cursor.fetchone()
        public_pages = row["cnt"] if row else 0

        return {
            "users": {"total": total_users, "verified": verified_users},
            "posts": {"total": total_posts, "views": total_views, "likes": total_likes},
            "comments": total_comments,
            "messages": total_messages,
            "public_pages": public_pages,
        }
    finally:
        await db.close()


# ====== 公开页面管理（必须在 /{user_id} 之前注册） ======

@router.get("/public-pages", summary="获取公开页面列表")
async def list_public_pages():
    """获取所有公开页面（无需认证）"""
    pages = await get_all_public_pages()
    return {"public_pages": pages}


@router.put("/public-pages", summary="设置公开页面（管理员）")
async def update_public_pages(req: PublicPageUpdate, _admin: dict[str, Any] = Depends(get_current_admin)):
    """批量设置公开/非公开页面"""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        for page_id, is_public in req.pages.items():
            await db.execute(
                """INSERT INTO public_pages (page_id, is_public, updated_at) VALUES (?, ?, ?)
                   ON CONFLICT(page_id) DO UPDATE SET is_public=?, updated_at=?""",
                (page_id, int(is_public), now, int(is_public), now),
            )
        await db.commit()
        return {"success": True, "message": "公开页面设置已更新"}
    finally:
        await db.close()


# ====== 页面权限检查 ======

@router.get("/check-page-access/{page_id}", summary="检查页面访问权限")
async def check_page_access(page_id: str, user: dict[str, Any] | None = Depends(get_current_user_optional)):
    """检查当前用户是否可以访问指定页面（未登录用户也能调用）"""
    # 管理员始终可以访问
    if user and user.get("role") == "admin":
        return {"accessible": True, "page_id": page_id}
    user_id = int(user["sub"]) if user else None
    accessible = await can_access_page(user_id, page_id)
    return {"accessible": accessible, "page_id": page_id}


# ====== 批量权限分配（必须在 /{user_id} 之前注册） ======

@router.post("/batch-permissions", summary="批量分配权限（管理员）")
async def batch_create_permissions(req: dict[str, Any], _admin: dict[str, Any] = Depends(get_current_admin)):
    """批量给用户分配权限: {user_id, permissions: [{resource_type, resource_id}]}"""
    db = await get_db()
    try:
        user_id = req["user_id"]
        now = datetime.now(timezone.utc).isoformat()
        for perm in req["permissions"]:
            try:
                await db.execute(
                    "INSERT OR IGNORE INTO permissions (user_id, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?)",
                    (user_id, perm["resource_type"], perm["resource_id"], now),
                )
            except Exception:
                continue
        await db.commit()
        return {"success": True, "message": "批量权限分配完成"}
    finally:
        await db.close()


# ====== 用户 CRUD（动态路径参数放最后） ======

@router.put("/{user_id}", summary="更新访客信息（管理员）")
async def update_user(user_id: int, req: UserUpdateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM users WHERE id=?", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

        updates = []
        params = []
        for field in ["name", "phone", "email", "wechat", "qq"]:
            val = getattr(req, field, None)
            if val is not None:
                updates.append(f"{field}=?")
                params.append(val)
        if req.is_verified is not None:
            updates.append("is_verified=?")
            params.append(int(req.is_verified))

        # 重置或手动设置认证码
        new_access_code = None
        if req.reset_access_code:
            new_access_code = generate_access_code()
            while True:
                cursor = await db.execute("SELECT id FROM users WHERE access_code=? AND id!=?", (new_access_code, user_id))
                if not await cursor.fetchone():
                    break
                new_access_code = generate_access_code()
            updates.append("access_code=?")
            params.append(new_access_code)
        elif req.access_code is not None:
            # 手动设置认证码，检查唯一性
            cursor = await db.execute("SELECT id FROM users WHERE access_code=? AND id!=?", (req.access_code, user_id))
            if await cursor.fetchone():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该认证码已被其他用户使用")
            new_access_code = req.access_code
            updates.append("access_code=?")
            params.append(new_access_code)

        if updates:
            updates.append("updated_at=?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(user_id)
            await db.execute(f"UPDATE users SET {', '.join(updates)} WHERE id=?", params)
            await db.commit()

        result = {"success": True, "message": "用户信息已更新"}
        if new_access_code:
            result["access_code"] = new_access_code
        return result
    finally:
        await db.close()


@router.delete("/{user_id}", summary="删除访客（管理员）")
async def delete_user(user_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM users WHERE id=?", (user_id,))
        await db.execute("DELETE FROM permissions WHERE user_id=?", (user_id,))
        await db.commit()
        return {"success": True, "message": "用户已删除"}
    finally:
        await db.close()


# ====== 权限管理 ======

@router.get("/{user_id}/permissions", summary="获取用户权限")
async def get_permissions(user_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    perms = await get_user_permissions(user_id)
    return {"permissions": perms}


@router.post("/{user_id}/permissions", summary="为用户分配权限（管理员）")
async def create_permission(user_id: int, req: PermissionCreateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM users WHERE id=?", (user_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

        now = datetime.now(timezone.utc).isoformat()
        try:
            await db.execute(
                "INSERT INTO permissions (user_id, resource_type, resource_id, created_at) VALUES (?, ?, ?, ?)",
                (user_id, req.resource_type, req.resource_id, now),
            )
            await db.commit()
        except Exception as e:
            if "UNIQUE" in str(e):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该权限已存在")
            raise

        return {"success": True, "message": "权限分配成功"}
    finally:
        await db.close()


@router.delete("/{user_id}/permissions/{permission_id}", summary="删除用户权限（管理员）")
async def delete_permission(user_id: int, permission_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM permissions WHERE id=? AND user_id=?", (permission_id, user_id))
        await db.commit()
        return {"success": True, "message": "权限已删除"}
    finally:
        await db.close()

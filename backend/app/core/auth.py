"""JWT认证与权限模块"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import get_config
from .database import get_db

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """密码哈希 (SHA-256 + salt)"""
    salt = secrets.token_hex(8)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, password_hash: str) -> bool:
    """验证密码"""
    salt, h = password_hash.split(":", 1)
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """创建JWT Token"""
    cfg = get_config()["auth"]
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(hours=cfg["access_token_expire_hours"])
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, cfg["secret_key"], algorithm=cfg["algorithm"])


def create_admin_token(data: dict[str, Any]) -> str:
    """创建管理员Token"""
    cfg = get_config()["auth"]
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=cfg["admin_token_expire_hours"])
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, cfg["secret_key"], algorithm=cfg["algorithm"])


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any] | None:
    """获取当前认证用户（访客或管理员），未提供凭据则抛401"""
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未提供认证凭据")

    cfg = get_config()["auth"]
    try:
        payload = jwt.decode(
            credentials.credentials, cfg["secret_key"], algorithms=[cfg["algorithm"]]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="无效凭据")

    return payload


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any] | None:
    """获取当前认证用户（可选），未提供凭据返回None"""
    if not credentials:
        return None
    cfg = get_config()["auth"]
    try:
        payload = jwt.decode(
            credentials.credentials, cfg["secret_key"], algorithms=[cfg["algorithm"]]
        )
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
    return payload


async def get_current_admin(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """获取当前管理员"""
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="需要管理员权限")
    return user


async def check_permission(user_id: int, resource_type: str, resource_id: str) -> bool:
    """检查用户是否有权限访问指定资源"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id FROM permissions WHERE user_id=? AND resource_type=? AND resource_id=?",
            (user_id, resource_type, resource_id),
        )
        return await cursor.fetchone() is not None
    finally:
        await db.close()


async def get_user_permissions(user_id: int) -> list[dict[str, Any]]:
    """获取用户所有权限（含权限ID）"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, resource_type, resource_id FROM permissions WHERE user_id=?",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [{"id": r[0], "resource_type": r[1], "resource_id": r[2]} for r in rows]
    finally:
        await db.close()


async def is_page_public(page_id: str) -> bool:
    """检查页面是否为公开页面"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT is_public FROM public_pages WHERE page_id=?",
            (page_id,),
        )
        row = await cursor.fetchone()
        return bool(row["is_public"]) if row else False
    finally:
        await db.close()


async def get_all_public_pages() -> list[str]:
    """获取所有公开页面ID列表"""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT page_id FROM public_pages WHERE is_public=1")
        rows = await cursor.fetchall()
        return [r[0] for r in rows]
    finally:
        await db.close()


async def can_access_page(user_id: int | None, page_id: str) -> bool:
    """检查用户是否可以访问指定页面（公开页面任何人可访问，否则需权限）"""
    if await is_page_public(page_id):
        return True
    if user_id is None:
        return False
    return await check_permission(user_id, "page", page_id)

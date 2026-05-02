"""JWT认证与权限模块"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

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


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建JWT Token"""
    cfg = get_config()["auth"]
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(hours=cfg["access_token_expire_hours"])
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, cfg["secret_key"], algorithm=cfg["algorithm"])


def create_admin_token(data: dict) -> str:
    """创建管理员Token"""
    cfg = get_config()["auth"]
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=cfg["admin_token_expire_hours"])
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, cfg["secret_key"], algorithm=cfg["algorithm"])


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[dict]:
    """获取当前认证用户（访客或管理员）"""
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


async def get_current_admin(
    user: dict = Depends(get_current_user),
) -> dict:
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


async def get_user_permissions(user_id: int) -> list:
    """获取用户所有权限"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT resource_type, resource_id FROM permissions WHERE user_id=?",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [{"resource_type": r[0], "resource_id": r[1]} for r in rows]
    finally:
        await db.close()

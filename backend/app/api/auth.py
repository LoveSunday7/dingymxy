"""认证相关API"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.auth import (
    create_access_token,
    create_admin_token,
    get_current_user,
)
from ..core.config import get_config
from ..core.database import get_db
from ..models.schemas import AdminLoginRequest, TokenResponse, UserVerifyRequest

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/admin/login", response_model=TokenResponse, summary="管理员登录")
async def admin_login(req: AdminLoginRequest):
    cfg = get_config()
    admin_passphrase = cfg.get("admin", {}).get("passphrase", "admin123")

    if req.passphrase != admin_passphrase:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="管理员口令错误")

    token = create_admin_token({"sub": "1", "username": "admin", "role": "admin"})
    return TokenResponse(
        access_token=token,
        user_info={"id": 1, "username": "admin", "role": "admin"},
    )


@router.post("/verify", response_model=TokenResponse, summary="访客身份验证")
async def verify_visitor(req: UserVerifyRequest):
    db = await get_db()
    try:
        # 查找匹配的访客记录
        cursor = await db.execute(
            "SELECT id, name, access_code, is_verified FROM users WHERE access_code=?",
            (req.access_code,),
        )
        user = await cursor.fetchone()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="认证码无效，请联系管理员获取")

        # 验证姓名匹配
        if user["name"] != req.name:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="姓名与认证码不匹配")

        # 更新验证状态
        now = datetime.now(timezone.utc).isoformat()
        await db.execute(
            "UPDATE users SET is_verified=1, last_login_at=? WHERE id=?",
            (now, user["id"]),
        )
        await db.commit()

        token = create_access_token({"sub": str(user["id"]), "name": user["name"], "role": "user"})
        return TokenResponse(
            access_token=token,
            user_info={"id": user["id"], "name": user["name"], "role": "user", "is_verified": True},
        )
    finally:
        await db.close()


@router.get("/me", summary="获取当前用户信息")
async def get_me(user: dict = Depends(get_current_user)):
    db = await get_db()
    try:
        if user.get("role") == "admin":
            return {"role": "admin", "username": user.get("username")}

        cursor = await db.execute("SELECT id, name, is_verified FROM users WHERE id=?", (int(user["sub"]),))
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

        from ..core.auth import get_user_permissions
        permissions = await get_user_permissions(row["id"])
        return {"role": "user", "name": row["name"], "is_verified": bool(row["is_verified"]), "permissions": permissions}
    finally:
        await db.close()

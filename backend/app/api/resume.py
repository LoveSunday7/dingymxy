"""简历相关API"""
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.auth import get_current_admin
from ..core.database import get_db
from ..models.schemas import ResumeBatchUpdateRequest, ResumeFieldCreate, ResumeFieldResponse

router = APIRouter(prefix="/resume", tags=["简历"])


@router.get("", summary="获取所有简历数据（按section分组）")
async def get_resume():
    """公开接口，获取全部简历字段，按 section 分组返回"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, section, field_key, field_label, field_value, field_type, sort_order, created_at, updated_at "
            "FROM resume_data ORDER BY section, sort_order"
        )
        rows = await cursor.fetchall()

        sections: dict[str, list[dict]] = {}
        for r in rows:
            data = {
                "id": r["id"],
                "section": r["section"],
                "field_key": r["field_key"],
                "field_label": r["field_label"],
                "field_value": r["field_value"],
                "field_type": r["field_type"],
                "sort_order": r["sort_order"],
                "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            }
            sections.setdefault(r["section"], []).append(data)

        return {
            "success": True,
            "sections": [
                {"section": s, "fields": f} for s, f in sections.items()
            ],
        }
    finally:
        await db.close()


@router.get("/{section}", summary="获取指定section的简历数据")
async def get_resume_section(section: str):
    """公开接口，获取单个分组的简历字段"""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, section, field_key, field_label, field_value, field_type, sort_order, created_at, updated_at "
            "FROM resume_data WHERE section=? ORDER BY sort_order",
            (section,),
        )
        rows = await cursor.fetchall()
        return {
            "success": True,
            "section": section,
            "fields": [
                {
                    "id": r["id"], "section": r["section"], "field_key": r["field_key"],
                    "field_label": r["field_label"], "field_value": r["field_value"],
                    "field_type": r["field_type"], "sort_order": r["sort_order"],
                    "created_at": r["created_at"], "updated_at": r["updated_at"],
                }
                for r in rows
            ],
        }
    finally:
        await db.close()


@router.put("", summary="批量更新简历字段（管理员）")
async def update_resume(req: ResumeBatchUpdateRequest, _admin: dict[str, Any] = Depends(get_current_admin)):
    """管理员批量更新简历数据。已存在的按 field_key 更新，不存在的插入"""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        for field in req.fields:
            await db.execute(
                """INSERT INTO resume_data (section, field_key, field_label, field_value, field_type, sort_order, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(section, field_key) DO UPDATE SET
                   field_label=excluded.field_label, field_value=excluded.field_value,
                   field_type=excluded.field_type, sort_order=excluded.sort_order,
                   updated_at=excluded.updated_at""",
                (field.section, field.field_key, field.field_label, field.field_value,
                 field.field_type, field.sort_order, now),
            )
        await db.commit()
        return {"success": True, "message": f"已更新 {len(req.fields)} 个字段"}
    finally:
        await db.close()


@router.delete("/{field_id}", summary="删除简历字段（管理员）")
async def delete_resume_field(field_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM resume_data WHERE id=?", (field_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="字段不存在")
        await db.execute("DELETE FROM resume_data WHERE id=?", (field_id,))
        await db.commit()
        return {"success": True, "message": "字段已删除"}
    finally:
        await db.close()

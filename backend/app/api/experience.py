"""经历与时间线相关API"""
import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..core.auth import get_current_admin
from ..core.database import get_db
from ..models.schemas import (
    ResumeProjectCreate, ResumeProjectUpdate,
    TimelineEventCreate, TimelineEventUpdate,
)

router = APIRouter(prefix="/experience", tags=["经历"])


# ====== 时间线事件 ======

@router.get("", summary="获取时间线事件列表（公开）")
async def list_events(event_type: str | None = None):
    """公开接口，按 sort_order 排序。可筛选 event_type (work/education/life)"""
    db = await get_db()
    try:
        conditions = ["is_visible=1"]
        params: list = []
        if event_type:
            conditions.append("event_type=?")
            params.append(event_type)

        where = " AND ".join(conditions)
        cursor = await db.execute(
            f"SELECT id, event_type, title, organization, location, start_date, end_date, "
            f"summary, highlights, sort_order, created_at, updated_at "
            f"FROM timeline_events WHERE {where} ORDER BY sort_order",
            params,
        )
        rows = await cursor.fetchall()

        events = []
        for r in rows:
            events.append({
                "id": r["id"], "event_type": r["event_type"], "title": r["title"],
                "organization": r["organization"], "location": r["location"],
                "start_date": r["start_date"], "end_date": r["end_date"],
                "summary": r["summary"],
                "highlights": json.loads(r["highlights"]) if r["highlights"] else None,
                "sort_order": r["sort_order"], "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            })

        return {"success": True, "events": events}
    finally:
        await db.close()


@router.post("", summary="创建时间线事件（管理员）")
async def create_event(req: TimelineEventCreate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO timeline_events (event_type, title, organization, location, start_date,
               end_date, summary, highlights, sort_order, is_visible, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.event_type, req.title, req.organization, req.location,
             req.start_date, req.end_date, req.summary,
             json.dumps(req.highlights, ensure_ascii=False) if req.highlights else None,
             req.sort_order, int(req.is_visible), now, now),
        )
        await db.commit()
        return {"success": True, "message": "事件创建成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.put("/{event_id}", summary="更新时间线事件（管理员）")
async def update_event(event_id: int, req: TimelineEventUpdate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM timeline_events WHERE id=?", (event_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="事件不存在")

        updates: list[str] = []
        params: list[Any] = []
        field_map = {
            "event_type": req.event_type, "title": req.title,
            "organization": req.organization, "location": req.location,
            "start_date": req.start_date, "end_date": req.end_date,
            "summary": req.summary, "sort_order": req.sort_order,
        }
        for name, val in field_map.items():
            if val is not None:
                updates.append(f"{name}=?")
                params.append(val)

        if req.is_visible is not None:
            updates.append("is_visible=?")
            params.append(int(req.is_visible))
        if req.highlights is not None:
            updates.append("highlights=?")
            params.append(json.dumps(req.highlights, ensure_ascii=False))

        if updates:
            updates.append("updated_at=?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(event_id)
            await db.execute(f"UPDATE timeline_events SET {', '.join(updates)} WHERE id=?", params)
            await db.commit()

        return {"success": True, "message": "事件已更新"}
    finally:
        await db.close()


@router.delete("/{event_id}", summary="删除时间线事件（管理员）")
async def delete_event(event_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM timeline_events WHERE id=?", (event_id,))
        await db.commit()
        return {"success": True, "message": "事件已删除"}
    finally:
        await db.close()


@router.put("/sort/update", summary="批量更新排序（管理员）")
async def sort_events(req: list[dict[str, int]], _admin: dict[str, Any] = Depends(get_current_admin)):
    """批量更新事件排序: [{"id":1,"sort_order":0}, {"id":2,"sort_order":1}]"""
    db = await get_db()
    try:
        for item in req:
            await db.execute(
                "UPDATE timeline_events SET sort_order=?, updated_at=? WHERE id=?",
                (item["sort_order"], datetime.now(timezone.utc).isoformat(), item["id"]),
            )
        await db.commit()
        return {"success": True, "message": "排序已更新"}
    finally:
        await db.close()


# ====== 项目经历 ======

@router.get("/projects/list", summary="获取项目经历列表（公开）")
async def list_projects():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, title, period, role, tech_stack, description, highlights, post_id, sort_order, "
            "created_at, updated_at FROM resume_projects WHERE is_visible=1 ORDER BY sort_order"
        )
        rows = await cursor.fetchall()
        projects = []
        for r in rows:
            projects.append({
                "id": r["id"], "title": r["title"], "period": r["period"],
                "role": r["role"],
                "tech_stack": json.loads(r["tech_stack"]) if r["tech_stack"] else None,
                "description": r["description"],
                "highlights": json.loads(r["highlights"]) if r["highlights"] else None,
                "post_id": r["post_id"],
                "sort_order": r["sort_order"], "created_at": r["created_at"],
                "updated_at": r["updated_at"],
            })
        return {"success": True, "projects": projects}
    finally:
        await db.close()


@router.post("/projects", summary="创建项目经历（管理员）")
async def create_project(req: ResumeProjectCreate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        cursor = await db.execute(
            """INSERT INTO resume_projects (title, period, role, tech_stack, description, highlights, post_id, sort_order, is_visible, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.title, req.period, req.role,
             json.dumps(req.tech_stack, ensure_ascii=False) if req.tech_stack else None,
             req.description,
             json.dumps(req.highlights, ensure_ascii=False) if req.highlights else None,
             req.post_id,
             req.sort_order, int(req.is_visible), now, now),
        )
        await db.commit()
        return {"success": True, "message": "项目创建成功", "data": {"id": cursor.lastrowid}}
    finally:
        await db.close()


@router.put("/projects/{project_id}", summary="更新项目经历（管理员）")
async def update_project(project_id: int, req: ResumeProjectUpdate, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM resume_projects WHERE id=?", (project_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="项目不存在")

        updates: list[str] = []
        params: list[Any] = []
        for name in ["title", "period", "role", "description", "sort_order", "post_id"]:
            val = getattr(req, name, None)
            if val is not None:
                updates.append(f"{name}=?")
                params.append(val)

        if req.is_visible is not None:
            updates.append("is_visible=?")
            params.append(int(req.is_visible))
        if req.tech_stack is not None:
            updates.append("tech_stack=?")
            params.append(json.dumps(req.tech_stack, ensure_ascii=False))
        if req.highlights is not None:
            updates.append("highlights=?")
            params.append(json.dumps(req.highlights, ensure_ascii=False))

        if updates:
            updates.append("updated_at=?")
            params.append(datetime.now(timezone.utc).isoformat())
            params.append(project_id)
            await db.execute(f"UPDATE resume_projects SET {', '.join(updates)} WHERE id=?", params)
            await db.commit()

        return {"success": True, "message": "项目已更新"}
    finally:
        await db.close()


@router.delete("/projects/{project_id}", summary="删除项目经历（管理员）")
async def delete_project(project_id: int, _admin: dict[str, Any] = Depends(get_current_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM resume_projects WHERE id=?", (project_id,))
        await db.commit()
        return {"success": True, "message": "项目已删除"}
    finally:
        await db.close()

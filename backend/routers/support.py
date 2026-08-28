"""
SafeSense AI — Support Requests & Escalation Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from backend.database import get_db
from backend.models import SupportRequest, SupportRequestStatusEnum, FollowUp, User
from backend.auth import get_current_user, log_audit, require_roles
from backend.models import UserRoleEnum

router = APIRouter()


class SupportRequestCreate(BaseModel):
    request_type: str  # counsellor | trusted_person | follow_up | emergency
    message: Optional[str] = None
    assessment_id: Optional[str] = None


class UpdateStatusRequest(BaseModel):
    status: str
    resolution_notes: Optional[str] = None


@router.post("/request")
def create_support_request(
    req: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    valid_types = {"counsellor", "trusted_person", "follow_up", "emergency"}
    if req.request_type not in valid_types:
        raise HTTPException(400, f"request_type must be one of {valid_types}")

    sr = SupportRequest(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        assessment_id=req.assessment_id,
        request_type=req.request_type,
        message=req.message,
        status=SupportRequestStatusEnum.pending,
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)

    log_audit(db, "support_request_created", user_id=current_user.id,
              entity_type="support_request", entity_id=sr.id,
              metadata={"type": req.request_type})

    return _sr_out(sr)


@router.get("/mine")
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(SupportRequest)
        .filter(SupportRequest.user_id == current_user.id)
        .order_by(SupportRequest.created_at.desc())
        .all()
    )
    return [_sr_out(r) for r in requests]


@router.get("/all")
def get_all_requests(
    current_user: User = Depends(require_roles(UserRoleEnum.moderator, UserRoleEnum.admin)),
    db: Session = Depends(get_db),
):
    """Moderator/admin: see all support requests."""
    requests = db.query(SupportRequest).order_by(SupportRequest.created_at.desc()).all()
    return [_sr_out(r) for r in requests]


@router.patch("/{request_id}/status")
def update_request_status(
    request_id: str,
    req: UpdateStatusRequest,
    current_user: User = Depends(require_roles(UserRoleEnum.moderator, UserRoleEnum.admin)),
    db: Session = Depends(get_db),
):
    sr = db.query(SupportRequest).filter(SupportRequest.id == request_id).first()
    if not sr:
        raise HTTPException(404, "Support request not found")

    try:
        sr.status = SupportRequestStatusEnum(req.status)
    except ValueError:
        raise HTTPException(400, "Invalid status value")

    if req.resolution_notes:
        sr.resolution_notes = req.resolution_notes
    sr.assigned_to = current_user.id
    db.commit()
    db.refresh(sr)

    log_audit(db, "support_request_status_updated", user_id=current_user.id,
              entity_type="support_request", entity_id=sr.id,
              metadata={"new_status": req.status})

    return _sr_out(sr)


@router.post("/followup")
def request_followup(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scheduled = body.get("scheduled_date")
    if not scheduled:
        from datetime import date, timedelta
        scheduled = (date.today() + timedelta(days=7)).isoformat()

    fu = FollowUp(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        assessment_id=body.get("assessment_id"),
        scheduled_date=scheduled,
        notes=body.get("notes"),
    )
    db.add(fu)
    db.commit()
    return {"id": fu.id, "scheduled_date": fu.scheduled_date, "status": "pending"}


@router.get("/followups")
def get_my_followups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    followups = db.query(FollowUp).filter(FollowUp.user_id == current_user.id).order_by(FollowUp.scheduled_date.desc()).all()
    return [
        {"id": f.id, "scheduled_date": f.scheduled_date, "completed": f.completed,
         "notes": f.notes, "assessment_id": f.assessment_id}
        for f in followups
    ]


def _sr_out(r: SupportRequest) -> dict:
    return {
        "id": r.id,
        "request_type": r.request_type,
        "message": r.message,
        "status": r.status.value,
        "resolution_notes": r.resolution_notes,
        "assessment_id": r.assessment_id,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
    }

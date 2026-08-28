"""
SafeSense AI — Admin Router (users, audit logs, system config)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db
from backend.models import User, AuditLog, UserRoleEnum
from backend.auth import require_roles, log_audit

router = APIRouter()

AdminOnly = require_roles(UserRoleEnum.admin)


@router.get("/users")
def list_users(
    current_user: User = Depends(AdminOnly),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).limit(200).all()
    log_audit(db, "admin_listed_users", user_id=current_user.id)
    return [
        {"id": u.id, "email": u.email, "name": u.name, "role": u.role.value,
         "is_active": u.is_active, "created_at": u.created_at.isoformat()}
        for u in users
    ]


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    body: dict,
    current_user: User = Depends(AdminOnly),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if "role" in body:
        try:
            user.role = UserRoleEnum(body["role"])
        except ValueError:
            raise HTTPException(400, "Invalid role")
    if "is_active" in body:
        user.is_active = bool(body["is_active"])
    db.commit()
    log_audit(db, "admin_updated_user", user_id=current_user.id, entity_type="user", entity_id=user_id,
              metadata={"changes": body})
    return {"updated": True}


@router.get("/audit-logs")
def get_audit_logs(
    current_user: User = Depends(AdminOnly),
    db: Session = Depends(get_db),
    limit: int = 100,
    action: Optional[str] = None,
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.contains(action))
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {"id": l.id, "user_id": l.user_id, "action": l.action,
         "entity_type": l.entity_type, "entity_id": l.entity_id,
         "result": l.result, "ip_address": l.ip_address,
         "created_at": l.created_at.isoformat()}
        for l in logs
    ]


@router.get("/stats")
def get_system_stats(
    current_user: User = Depends(AdminOnly),
    db: Session = Depends(get_db),
):
    from backend.models import Assessment, DailyCheckIn, SupportRequest, SafetyAlert, Case, SVIResult
    from backend.models import AssessmentStatusEnum
    completed = db.query(Assessment).filter(Assessment.status == AssessmentStatusEnum.completed).all()
    risk_distribution = {}
    language_distribution = {}
    for assessment in completed:
        language_distribution[assessment.language] = language_distribution.get(assessment.language, 0) + 1
        if assessment.svi_result:
            risk = assessment.svi_result.risk_category.value
            risk_distribution[risk] = risk_distribution.get(risk, 0) + 1
    scores = [assessment.svi_result.score for assessment in completed if assessment.svi_result]
    return {
        "total_users": db.query(User).count(),
        "total_assessments": db.query(Assessment).filter(Assessment.status == AssessmentStatusEnum.completed).count(),
        "total_checkins": db.query(DailyCheckIn).count(),
        "total_support_requests": db.query(SupportRequest).count(),
        "pending_alerts": db.query(SafetyAlert).filter(SafetyAlert.acknowledged == False).count(),
        "open_cases": db.query(Case).count(),
        "average_score": round(sum(scores) / len(scores), 1) if scores else None,
        "risk_distribution": risk_distribution,
        "language_distribution": language_distribution,
    }

"""
SafeSense AI — Moderator Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Case, SafetyAlert, Assessment, SVIResult, SupportRequest
from backend.models import UserRoleEnum, CaseStatusEnum, RiskCategoryEnum
from backend.auth import get_current_user, require_roles, log_audit
from backend.models import User

router = APIRouter()

ModeratorOrAdmin = require_roles(UserRoleEnum.moderator, UserRoleEnum.admin)


@router.get("/cases")
def get_cases(
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
    risk: Optional[str] = None,
    status: Optional[str] = None,
):
    query = db.query(Case)
    if risk:
        try:
            query = query.filter(Case.risk_category == RiskCategoryEnum(risk))
        except ValueError:
            pass
    if status:
        try:
            query = query.filter(Case.status == CaseStatusEnum(status))
        except ValueError:
            pass
    cases = query.order_by(Case.created_at.desc()).limit(100).all()

    log_audit(db, "moderator_viewed_cases", user_id=current_user.id, entity_type="case")
    return [_case_out(c) for c in cases]


@router.get("/cases/{case_id}")
def get_case_detail(
    case_id: str,
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    # Indicators from assessment
    indicators = []
    assessment = None
    if case.assessment_id:
        assessment = db.query(Assessment).filter(Assessment.id == case.assessment_id).first()
        if assessment:
            indicators = [
                {"label": i.indicator_label, "category": i.category,
                 "detected": i.detected, "confidence": i.confidence}
                for i in assessment.indicators
            ]

    log_audit(db, "moderator_viewed_case_detail", user_id=current_user.id,
              entity_type="case", entity_id=case_id)

    out = _case_out(case)
    out["indicators"] = indicators
    out["svi_breakdown"] = {}
    if assessment and assessment.svi_result:
        out["svi_breakdown"] = assessment.svi_result.scoring_breakdown or {}
    return out


@router.patch("/cases/{case_id}")
def update_case(
    case_id: str,
    body: dict,
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(404, "Case not found")

    if "status" in body:
        try:
            case.status = CaseStatusEnum(body["status"])
        except ValueError:
            raise HTTPException(400, "Invalid status")
    if "moderator_notes" in body:
        case.moderator_notes = body["moderator_notes"]
    if "follow_up_date" in body:
        case.follow_up_date = body["follow_up_date"]
    if "moderator_id" in body:
        case.moderator_id = body["moderator_id"]

    db.commit()
    db.refresh(case)

    log_audit(db, "case_updated", user_id=current_user.id, entity_type="case", entity_id=case_id,
              metadata={"changes": {k: v for k, v in body.items() if k != "moderator_notes"}})
    return _case_out(case)


@router.get("/alerts")
def get_alerts(
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(SafetyAlert)
        .filter(SafetyAlert.acknowledged == False)
        .order_by(SafetyAlert.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": a.id,
            "case_id": a.case_id,
            "assessment_id": a.assessment_id,
            "risk_category": a.risk_category.value,
            "svi_score": a.svi_score,
            "acknowledged": a.acknowledged,
            "created_at": a.created_at.isoformat(),
        }
        for a in alerts
    ]


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
):
    alert = db.query(SafetyAlert).filter(SafetyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    alert.acknowledged = True
    alert.acknowledged_by = current_user.id
    db.commit()

    log_audit(db, "alert_acknowledged", user_id=current_user.id,
              entity_type="safety_alert", entity_id=alert_id)
    return {"acknowledged": True}


@router.get("/stats")
def get_moderator_stats(
    current_user: User = Depends(ModeratorOrAdmin),
    db: Session = Depends(get_db),
):
    total_cases = db.query(Case).count()
    open_cases = db.query(Case).filter(Case.status == CaseStatusEnum.open).count()
    high_cases = db.query(Case).filter(Case.risk_category == RiskCategoryEnum.HIGH).count()
    critical_cases = db.query(Case).filter(Case.risk_category == RiskCategoryEnum.CRITICAL).count()
    pending_alerts = db.query(SafetyAlert).filter(SafetyAlert.acknowledged == False).count()
    pending_support = db.query(SupportRequest).filter(SupportRequest.status.in_(["pending", "assigned"])).count()

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "high_risk": high_cases,
        "critical_risk": critical_cases,
        "pending_alerts": pending_alerts,
        "pending_support_requests": pending_support,
    }


def _case_out(c: Case) -> dict:
    return {
        "id": c.id,
        "case_ref": c.case_ref,
        "status": c.status.value,
        "risk_category": c.risk_category.value if c.risk_category else None,
        "svi_score": c.svi_score,
        "moderator_notes": c.moderator_notes,
        "follow_up_date": c.follow_up_date,
        "moderator_id": c.moderator_id,
        "assessment_id": c.assessment_id,
        "created_at": c.created_at.isoformat(),
        "updated_at": c.updated_at.isoformat(),
    }

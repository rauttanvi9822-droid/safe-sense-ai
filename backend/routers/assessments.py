"""
SafeSense AI — Assessments Router
Create, complete, analyze, retrieve assessments.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from backend.database import get_db
from backend.models import (
    Assessment, AssessmentMessage, AssessmentIndicator, SVIResult,
    VoiceSessionMetadata, Case, SafetyAlert, SupportRequest,
    AssessmentStatusEnum, RiskCategoryEnum, CaseStatusEnum, SupportRequestStatusEnum
)
from backend.auth import get_current_user, log_audit, decode_token
from backend.models import User
from backend.ai_service import analyze as ai_analyze

router = APIRouter()


def _case_ref() -> str:
    now = datetime.now(timezone.utc)
    short = str(uuid.uuid4())[:6].upper()
    return f"SSA-{now.year}-{short}"


class StartAssessmentRequest(BaseModel):
    language: str = "en"
    interaction_mode: str = "text"

class CompleteAssessmentRequest(BaseModel):
    messages: List[dict]
    combined_text: str
    voice_metadata: Optional[dict] = None
    structured_data: Optional[dict] = None
    is_demo: bool = False
    demo_scenario: Optional[str] = None


@router.post("/start")
def start_assessment(
    req: StartAssessmentRequest,
    request: Request,
    current_user: Optional[User] = Depends(lambda: None),
    db: Session = Depends(get_db),
):
    """Start a new assessment session. User optional (anonymous allowed)."""
    assessment = Assessment(
        id=str(uuid.uuid4()),
        user_id=None,
        case_ref=_case_ref(),
        language=req.language,
        interaction_mode=req.interaction_mode,
        status=AssessmentStatusEnum.in_progress,
    )
    # Try to get user from auth header if present
    try:
        from fastapi.security import OAuth2PasswordBearer
        from backend.auth import decode_token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            assessment.user_id = payload.get("sub")
    except Exception:
        pass

    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return {"id": assessment.id, "case_ref": assessment.case_ref}


@router.post("/{assessment_id}/complete")
def complete_assessment(
    assessment_id: str,
    req: CompleteAssessmentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Complete assessment: run AI analysis, store results, create case + alert if needed."""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    auth_user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            auth_user_id = decode_token(auth_header.split(" ", 1)[1]).get("sub")
        except Exception:
            raise HTTPException(401, "Invalid authentication token")
    if not assessment:
        # Create on-the-fly for anonymous flow
        assessment = Assessment(
            id=assessment_id,
            case_ref=_case_ref(),
            language="en",
            interaction_mode="text",
            status=AssessmentStatusEnum.in_progress,
            is_demo=req.is_demo,
        )
        db.add(assessment)
        db.flush()
    if assessment.user_id and assessment.user_id != auth_user_id:
        raise HTTPException(403, "Assessment does not belong to this user")
    if not assessment.user_id and auth_user_id:
        assessment.user_id = auth_user_id

    # Store messages
    for m in req.messages:
        msg = AssessmentMessage(
            id=str(uuid.uuid4()),
            assessment_id=assessment.id,
            role=m.get("role", "user"),
            content=m.get("content", ""),
        )
        db.add(msg)

    assessment.combined_text = req.combined_text
    assessment.is_demo = req.is_demo

    # Run AI/NLP analysis
    text = req.combined_text or " ".join(
        m.get("content", "") for m in req.messages if m.get("role") == "user"
    )
    result = ai_analyze(
        text=text,
        language=assessment.language or "en",
        voice_metadata=req.voice_metadata,
        structured_data=req.structured_data,
    )

    # Override score if demo scenario requested
    if req.is_demo and req.demo_scenario:
        scenario_scores = {"LOW": 18, "MODERATE": 42, "HIGH": 67, "CRITICAL": 84}
        result.score = scenario_scores.get(req.demo_scenario, result.score)
        from backend.ai_service import score_to_risk
        result.risk_category = score_to_risk(result.score)

    # Store indicators
    for ind in result.indicators:
        ai = AssessmentIndicator(
            id=str(uuid.uuid4()),
            assessment_id=assessment.id,
            indicator_label=ind["label"],
            category=ind["category"],
            detected=ind["detected"],
            confidence=ind["confidence"],
        )
        db.add(ai)

    # Store voice metadata
    if req.voice_metadata:
        vm = VoiceSessionMetadata(
            id=str(uuid.uuid4()),
            assessment_id=assessment.id,
            user_id=assessment.user_id,
            speaking_rate_wpm=req.voice_metadata.get("speaking_rate_wpm"),
            total_speech_seconds=req.voice_metadata.get("speech_duration_seconds"),
            pause_count=req.voice_metadata.get("pause_count"),
            avg_pause_duration_ms=req.voice_metadata.get("avg_pause_duration_ms"),
            transcript_length=len(text),
        )
        db.add(vm)

    # Store SVI result
    svi = SVIResult(
        id=str(uuid.uuid4()),
        assessment_id=assessment.id,
        score=result.score,
        risk_category=RiskCategoryEnum(result.risk_category),
        confidence=result.confidence,
        recommended_support=result.recommended_support,
        scoring_breakdown={
            "breakdown": result.breakdown,
            "modalities": result.modalities_analyzed,
            "model_version": result.model_version,
            "recommendations": result.recommendations,
                "support_risk": result.support_risk,
                "trauma_indicator": result.trauma_indicator,
            "emotion_signals": result.emotion_signals,
        },
        model_version=result.model_version,
        is_prototype=True,
    )
    db.add(svi)

    # Update assessment status
    assessment.status = AssessmentStatusEnum.completed
    assessment.completed_at = datetime.now(timezone.utc)

    # Create case record
    case = Case(
        id=str(uuid.uuid4()),
        case_ref=assessment.case_ref,
        user_id=assessment.user_id,
        assessment_id=assessment.id,
        status=CaseStatusEnum.open,
        risk_category=RiskCategoryEnum(result.risk_category),
        svi_score=result.score,
    )
    db.add(case)

    # Create safety alert for HIGH/CRITICAL
    if result.risk_category in ("HIGH", "CRITICAL"):
        alert = SafetyAlert(
            id=str(uuid.uuid4()),
            case_id=case.id,
            assessment_id=assessment.id,
            risk_category=RiskCategoryEnum(result.risk_category),
            svi_score=result.score,
        )
        db.add(alert)

    # Auto-create support request for CRITICAL
    if result.risk_category == "CRITICAL" and assessment.user_id:
        sr = SupportRequest(
            id=str(uuid.uuid4()),
            user_id=assessment.user_id,
            assessment_id=assessment.id,
            request_type="counsellor",
            message="Auto-created: CRITICAL risk assessment requires immediate review.",
            status=SupportRequestStatusEnum.pending,
        )
        db.add(sr)

    db.commit()

    log_audit(
        db, "assessment_completed",
        user_id=assessment.user_id,
        entity_type="assessment",
        entity_id=assessment.id,
        metadata={"risk": result.risk_category, "svi": result.score, "is_demo": req.is_demo},
    )

    return {
        "assessment_id": assessment.id,
        "case_ref": assessment.case_ref,
        "score": result.score,
        "risk_category": result.risk_category,
        "confidence": result.confidence,
        "recommended_support": result.recommended_support,
        "indicators": result.indicators,
        "emotion_signals": result.emotion_signals,
        "voice_features": result.voice_features,
        "breakdown": result.breakdown,
        "modalities_analyzed": result.modalities_analyzed,
        "recommendations": result.recommendations,
        "model_version": result.model_version,
        "is_prototype": True,
        "timestamp": result.timestamp,
    }


@router.get("/mine")
def get_my_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get authenticated user's assessment history."""
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.status == AssessmentStatusEnum.completed)
        .order_by(Assessment.completed_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for a in assessments:
        svi = a.svi_result
        result.append({
            "id": a.id,
            "case_ref": a.case_ref,
            "date": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else a.created_at.strftime("%Y-%m-%d"),
            "language": a.language,
            "interaction_mode": a.interaction_mode,
            "svi": svi.score if svi else None,
            "risk": svi.risk_category.value if svi else None,
            "status": a.status.value,
        })
    return result


@router.get("/{assessment_id}")
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(404, "Assessment not found")
    # Authorization: user can only access own assessment unless moderator/admin
    if a.user_id != current_user.id and current_user.role.value not in ("moderator", "admin"):
        raise HTTPException(403, "Access denied")

    svi = a.svi_result
    indicators = [
        {"id": i.id, "label": i.indicator_label, "category": i.category,
         "detected": i.detected, "confidence": i.confidence}
        for i in a.indicators
    ]
    breakdown = svi.scoring_breakdown if svi else {}

    return {
        "id": a.id,
        "case_ref": a.case_ref,
        "language": a.language,
        "interaction_mode": a.interaction_mode,
        "status": a.status.value,
        "created_at": a.created_at.isoformat(),
        "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        "svi": {"score": svi.score, "risk_category": svi.risk_category.value,
                "confidence": svi.confidence, "recommended_support": svi.recommended_support,
                "breakdown": breakdown, "is_prototype": True} if svi else None,
        "indicators": indicators,
    }

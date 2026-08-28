"""
SafeSense AI — Progress Router (SVI trend + overall progress)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.database import get_db
from backend.models import Assessment, SVIResult, DailyCheckIn, SupportRequest, User
from backend.auth import get_current_user
from backend.models import AssessmentStatusEnum

router = APIRouter()


@router.get("/summary")
def get_progress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dashboard progress summary: SVI trend, mood trend, check-in streak, stats."""

    # Assessment SVI history (real data)
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.status == AssessmentStatusEnum.completed)
        .order_by(Assessment.completed_at.asc())
        .limit(20)
        .all()
    )

    svi_trend = []
    for a in assessments:
        if a.svi_result:
            svi_trend.append({
                "date": a.completed_at.strftime("%Y-%m-%d") if a.completed_at else a.created_at.strftime("%Y-%m-%d"),
                "svi": a.svi_result.score,
                "risk": a.svi_result.risk_category.value,
                "assessment_id": a.id,
            })

    # Daily check-in mood/stress trend (last 30 days)
    checkins = (
        db.query(DailyCheckIn)
        .filter(DailyCheckIn.user_id == current_user.id)
        .order_by(DailyCheckIn.check_in_date.asc())
        .limit(30)
        .all()
    )

    mood_trend = [
        {
            "date": c.check_in_date,
            "mood": c.mood,
            "stress_level": c.stress_level,
            "safety_level": c.safety_level,
            "emotional_wellbeing": c.emotional_wellbeing,
        }
        for c in checkins
    ]

    # Support requests count
    support_count = db.query(SupportRequest).filter(SupportRequest.user_id == current_user.id).count()

    # Stats
    total_assessments = len(assessments)
    total_checkins = len(checkins)
    latest_svi = svi_trend[-1] if svi_trend else None
    avg_svi = (sum(s["svi"] for s in svi_trend) / len(svi_trend)) if svi_trend else None

    # Check-in streak: consecutive days from today
    streak = 0
    if checkins:
        from datetime import date, timedelta
        today = date.today()
        for i in range(len(checkins)):
            expected = (today - timedelta(days=i)).isoformat()
            if i < len(checkins) and checkins[-(i + 1)].check_in_date == expected:
                streak += 1
            else:
                break

    return {
        "svi_trend": svi_trend,
        "mood_trend": mood_trend,
        "stats": {
            "total_assessments": total_assessments,
            "total_checkins": total_checkins,
            "support_requests": support_count,
            "checkin_streak": streak,
            "latest_svi": latest_svi,
            "average_svi": round(avg_svi, 1) if avg_svi else None,
        },
    }

"""
SafeSense AI — Daily Check-in Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date
import uuid

from backend.database import get_db
from backend.models import DailyCheckIn, User
from backend.auth import get_current_user

router = APIRouter()


class CheckInRequest(BaseModel):
    mood: int           # 1–5
    stress_level: int   # 1–5
    safety_level: int   # 1–5
    emotional_wellbeing: int  # 1–5
    support_needed: bool = False
    notes: Optional[str] = None


def _validate_checkin(req: CheckInRequest):
    for field, val in [("mood", req.mood), ("stress_level", req.stress_level),
                       ("safety_level", req.safety_level), ("emotional_wellbeing", req.emotional_wellbeing)]:
        if not 1 <= val <= 5:
            raise HTTPException(400, f"{field} must be between 1 and 5")


@router.post("/today")
def submit_checkin(
    req: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_checkin(req)
    today = date.today().isoformat()

    existing = db.query(DailyCheckIn).filter(
        DailyCheckIn.user_id == current_user.id,
        DailyCheckIn.check_in_date == today,
    ).first()

    if existing:
        # Update today's check-in
        existing.mood = req.mood
        existing.stress_level = req.stress_level
        existing.safety_level = req.safety_level
        existing.emotional_wellbeing = req.emotional_wellbeing
        existing.support_needed = req.support_needed
        existing.notes = req.notes
        db.commit()
        db.refresh(existing)
        return _checkin_out(existing)

    checkin = DailyCheckIn(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        mood=req.mood,
        stress_level=req.stress_level,
        safety_level=req.safety_level,
        emotional_wellbeing=req.emotional_wellbeing,
        support_needed=req.support_needed,
        notes=req.notes,
        check_in_date=today,
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return _checkin_out(checkin)


@router.get("/today")
def get_today_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today().isoformat()
    existing = db.query(DailyCheckIn).filter(
        DailyCheckIn.user_id == current_user.id,
        DailyCheckIn.check_in_date == today,
    ).first()
    if not existing:
        return {"checked_in_today": False}
    return {"checked_in_today": True, "data": _checkin_out(existing)}


@router.get("/history")
def get_checkin_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 30,
):
    checkins = (
        db.query(DailyCheckIn)
        .filter(DailyCheckIn.user_id == current_user.id)
        .order_by(DailyCheckIn.check_in_date.desc())
        .limit(limit)
        .all()
    )
    return [_checkin_out(c) for c in checkins]


def _checkin_out(c: DailyCheckIn) -> dict:
    return {
        "id": c.id,
        "date": c.check_in_date,
        "mood": c.mood,
        "stress_level": c.stress_level,
        "safety_level": c.safety_level,
        "emotional_wellbeing": c.emotional_wellbeing,
        "support_needed": c.support_needed,
        "notes": c.notes,
        "created_at": c.created_at.isoformat(),
    }

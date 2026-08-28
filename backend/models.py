"""
SafeSense AI — SQLAlchemy Database Models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum as SAEnum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
import enum


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return str(uuid.uuid4())


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRoleEnum(str, enum.Enum):
    user = "user"
    moderator = "moderator"
    admin = "admin"

class RiskCategoryEnum(str, enum.Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AssessmentStatusEnum(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"
    reviewed = "reviewed"

class SupportRequestStatusEnum(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    contacted = "contacted"
    resolved = "resolved"

class CaseStatusEnum(str, enum.Enum):
    open = "open"
    under_review = "under_review"
    closed = "closed"
    follow_up = "follow_up"


# ─── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRoleEnum), nullable=False, default=UserRoleEnum.user)
    language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assessments = relationship("Assessment", back_populates="user", foreign_keys="Assessment.user_id")
    check_ins = relationship("DailyCheckIn", back_populates="user")
    support_requests = relationship("SupportRequest", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    conversation_memories = relationship("ConversationMemory", back_populates="user", cascade="all, delete-orphan")


# ─── Assessments ──────────────────────────────────────────────────────────────

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    case_ref = Column(String(50), unique=True)
    language = Column(String(10), default="en")
    interaction_mode = Column(String(20), default="text")
    status = Column(SAEnum(AssessmentStatusEnum), default=AssessmentStatusEnum.in_progress)
    is_demo = Column(Boolean, default=False)
    combined_text = Column(Text)  # Concatenated user responses for NLP
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="assessments", foreign_keys=[user_id])
    messages = relationship("AssessmentMessage", back_populates="assessment", cascade="all, delete-orphan")
    svi_result = relationship("SVIResult", back_populates="assessment", uselist=False, cascade="all, delete-orphan")
    indicators = relationship("AssessmentIndicator", back_populates="assessment", cascade="all, delete-orphan")
    voice_metadata = relationship("VoiceSessionMetadata", back_populates="assessment", uselist=False)


class AssessmentMessage(Base):
    __tablename__ = "assessment_messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False)  # 'ai' | 'user'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="messages")


class AssessmentIndicator(Base):
    __tablename__ = "assessment_indicators"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    indicator_label = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    detected = Column(Boolean, default=False)
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="indicators")


class VoiceSessionMetadata(Base):
    __tablename__ = "voice_session_metadata"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    speaking_rate_wpm = Column(Float, nullable=True)
    total_speech_seconds = Column(Float, nullable=True)
    pause_count = Column(Integer, nullable=True)
    avg_pause_duration_ms = Column(Float, nullable=True)
    transcript_length = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="voice_metadata")


# ─── SVI Results ──────────────────────────────────────────────────────────────

class SVIResult(Base):
    __tablename__ = "svi_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, unique=True)
    score = Column(Integer, nullable=False)  # 0–100
    risk_category = Column(SAEnum(RiskCategoryEnum), nullable=False)
    confidence = Column(Float)
    recommended_support = Column(Text)
    # Scoring breakdown stored as JSON for reproducibility
    scoring_breakdown = Column(JSON)  # {"features": {...}, "weights": {...}, "model_version": "..."}
    model_version = Column(String(50), default="baseline-v1")
    is_prototype = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="svi_result")


# ─── Daily Check-ins ──────────────────────────────────────────────────────────

class DailyCheckIn(Base):
    __tablename__ = "daily_check_ins"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mood = Column(Integer)           # 1–5
    stress_level = Column(Integer)   # 1–5
    safety_level = Column(Integer)   # 1–5
    emotional_wellbeing = Column(Integer)  # 1–5
    support_needed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    check_in_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="check_ins")

    __table_args__ = (
        UniqueConstraint("user_id", "check_in_date", name="uq_user_checkin_date"),
    )


# ─── Support Requests ─────────────────────────────────────────────────────────

class SupportRequest(Base):
    __tablename__ = "support_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    request_type = Column(String(50), nullable=False)  # counsellor | trusted_person | follow_up | emergency
    message = Column(Text, nullable=True)
    status = Column(SAEnum(SupportRequestStatusEnum), default=SupportRequestStatusEnum.pending)
    assigned_to = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="support_requests", foreign_keys=[user_id])


# ─── Cases (Moderator view) ───────────────────────────────────────────────────

class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_ref = Column(String(50), unique=True, nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    moderator_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    status = Column(SAEnum(CaseStatusEnum), default=CaseStatusEnum.open)
    risk_category = Column(SAEnum(RiskCategoryEnum), nullable=True)
    svi_score = Column(Integer, nullable=True)
    moderator_notes = Column(Text, nullable=True)
    follow_up_date = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ─── Safety Alerts ────────────────────────────────────────────────────────────

class SafetyAlert(Base):
    __tablename__ = "safety_alerts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    risk_category = Column(SAEnum(RiskCategoryEnum), nullable=False)
    svi_score = Column(Integer)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Follow-ups ───────────────────────────────────────────────────────────────

class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(String(36), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    scheduled_date = Column(String(10), nullable=False)
    completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Support Resources ────────────────────────────────────────────────────────

class SupportResource(Base):
    __tablename__ = "support_resources"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    contact = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)
    availability = Column(String(100), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=False)
    added_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─── Audit Logs ───────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(36), nullable=True)
    ip_address = Column(String(45), nullable=True)  # Hashed in production
    result = Column(String(20), default="success")  # success | failure
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_user_id", "user_id"),
        Index("idx_audit_created_at", "created_at"),
        Index("idx_audit_action", "action"),
    )


# ─── Chat Sessions (standalone chatbot) ───────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False)  # 'user' | 'ai'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class ConversationMemory(Base):
    """Small, user-approved-by-context facts useful for future conversations."""
    __tablename__ = "conversation_memories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(30), nullable=False)
    content = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversation_memories")

    __table_args__ = (
        Index("idx_conversation_memories_user_id", "user_id"),
    )

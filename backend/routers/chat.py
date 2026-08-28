"""
SafeSense AI — Chat Router (real-time chatbot)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from backend.database import get_db
from backend.models import ChatSession, ChatMessage, ConversationMemory, User
from backend.auth import get_current_user, decode_token
from backend.ai_service import generate_chat_response

router = APIRouter()


def _request_user_id(request: Request) -> Optional[str]:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        return decode_token(header.split(" ", 1)[1]).get("sub")
    except Exception:
        raise HTTPException(401, "Invalid authentication token")


class SendMessageRequest(BaseModel):
    content: str
    language: str = "en"

class SessionOut(BaseModel):
    session_id: str
    messages: List[dict]


_MEMORY_PATTERNS = [
    ("work", r"\b(?:i work|i study|i'm studying|i am studying|my course|my job)\b"),
    ("goal", r"\b(?:my goal|i want to|i'm trying to|i am trying to|i hope to)\b"),
    ("preference", r"\b(?:i prefer|i like|i love|i enjoy|i usually)\b"),
]


def _extract_memory(content: str) -> tuple[str, str] | None:
    """Keep only explicit, short context that is useful and low sensitivity."""
    import re

    compact = " ".join(content.strip().split())
    if len(compact) < 12 or len(compact) > 240:
        return None
    lowered = compact.lower()
    if any(term in lowered for term in ("suicide", "kill myself", "hurt myself", "self harm", "password", "address")):
        return None
    for kind, pattern in _MEMORY_PATTERNS:
        if re.search(pattern, lowered):
            return kind, compact
    return None


def _memory_tokens(value: str) -> set[str]:
    import re

    return {token for token in re.findall(r"[a-zA-Z]{3,}", value.lower()) if token not in {"the", "and", "that", "with", "this", "from"}}


def _relevant_memories(db: Session, user_id: Optional[str], message: str) -> list[str]:
    if not user_id:
        return []
    query_tokens = _memory_tokens(message)
    if not query_tokens:
        return []
    memories = db.query(ConversationMemory).filter(
        ConversationMemory.user_id == user_id,
    ).order_by(ConversationMemory.updated_at.desc()).limit(30).all()
    ranked = []
    for memory in memories:
        overlap = len(query_tokens & _memory_tokens(memory.content))
        if overlap:
            ranked.append((overlap, memory.updated_at, memory.content))
    ranked.sort(key=lambda item: (item[0], item[1]), reverse=True)
    return [content for _, _, content in ranked[:2]]


@router.post("/session")
def create_session(
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a new chat session (anonymous or authenticated)."""
    user_id = None
    try:
        from backend.auth import decode_token
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            user_id = payload.get("sub")
    except Exception:
        pass

    session = ChatSession(id=str(uuid.uuid4()), user_id=user_id)
    db.add(session)
    db.commit()
    return {"session_id": session.id}


@router.post("/{session_id}/message")
def send_message(
    session_id: str,
    req: SendMessageRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Send a message and get an AI response."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    user_id = _request_user_id(request)
    if not session:
        # Auto-create session if missing
        session = ChatSession(id=session_id)
        session.user_id = user_id
        db.add(session)
        db.flush()
    elif session.user_id and session.user_id != user_id:
        raise HTTPException(403, "Chat session does not belong to this user")

    if not req.content.strip():
        raise HTTPException(400, "Message content cannot be empty")

    if len(req.content) > 4000:
        raise HTTPException(400, "Message too long")

    # Store user message
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="user",
        content=req.content.strip(),
    )
    db.add(user_msg)
    db.flush()

    # Build conversation history
    history = [
        {"role": m.role, "content": m.content}
        for m in sorted(session.messages, key=lambda x: x.created_at)
        if m.id != user_msg.id
    ]

    # Retrieve only memories relevant to this message, never the full profile.
    memory_context = _relevant_memories(db, user_id, req.content)
    ai_text = generate_chat_response(
        req.content,
        history,
        language=req.language,
        relevant_memories=memory_context,
    )

    # Store AI response
    ai_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session.id,
        role="ai",
        content=ai_text,
    )
    db.add(ai_msg)
    extracted = _extract_memory(req.content) if user_id else None
    if extracted:
        kind, content = extracted
        duplicate = db.query(ConversationMemory).filter(
            ConversationMemory.user_id == user_id,
            ConversationMemory.content == content,
        ).first()
        if not duplicate:
            db.add(ConversationMemory(user_id=user_id, kind=kind, content=content))
    db.commit()

    return {
        "user_message": {"id": user_msg.id, "role": "user", "content": req.content,
                          "timestamp": user_msg.created_at.isoformat()},
        "ai_message": {"id": ai_msg.id, "role": "ai", "content": ai_text,
                        "timestamp": ai_msg.created_at.isoformat()},
    }


@router.get("/{session_id}/messages")
def get_messages(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        return {"messages": []}

    user_id = _request_user_id(request)
    if session.user_id and session.user_id != user_id:
        raise HTTPException(403, "Chat session does not belong to this user")
    messages = sorted(session.messages, key=lambda m: m.created_at)
    return {
        "session_id": session_id,
        "messages": [
            {"id": m.id, "role": m.role, "content": m.content,
             "timestamp": m.created_at.isoformat()}
            for m in messages
        ],
    }


@router.delete("/{session_id}")
def clear_session(
    session_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        user_id = _request_user_id(request)
        if session.user_id and session.user_id != user_id:
            raise HTTPException(403, "Chat session does not belong to this user")
        for m in session.messages:
            db.delete(m)
        db.delete(session)
        db.commit()
    return {"cleared": True}

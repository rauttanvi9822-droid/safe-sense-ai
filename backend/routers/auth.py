"""
SafeSense AI — Auth Router (register, login, logout, profile)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

from backend.database import get_db
from backend.models import User, UserRoleEnum
from backend.auth import hash_password, verify_password, create_access_token, get_current_user, log_audit
from backend.config import settings

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    language: str = "en"

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    language: str
    created_at: str


@router.post("/register", status_code=201)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(
        id=str(uuid.uuid4()),
        email=req.email.lower(),
        name=req.name,
        hashed_password=hash_password(req.password),
        role=UserRoleEnum.user,
        language=req.language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, "user_registered", user_id=user.id, entity_type="user", entity_id=user.id,
              ip_address=request.client.host if request.client else None)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return LoginResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name,
              "role": user.role.value, "language": user.language,
              "createdAt": user.created_at.isoformat()},
    )


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), request: Request = None, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username.lower(), User.is_active == True).first()
    ip = request.client.host if request and request.client else None

    if not user or not verify_password(form.password, user.hashed_password):
        if user:
            log_audit(db, "login_failed", user_id=user.id, entity_type="user", entity_id=user.id,
                      result="failure", ip_address=ip)
        raise HTTPException(status_code=401, detail="Invalid credentials")

    log_audit(db, "login_success", user_id=user.id, entity_type="user", entity_id=user.id, ip_address=ip)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return LoginResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "name": user.name,
              "role": user.role.value, "language": user.language,
              "createdAt": user.created_at.isoformat()},
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit(db, "logout", user_id=current_user.id, entity_type="user", entity_id=current_user.id)
    return {"message": "Logged out"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role.value,
        "language": current_user.language,
        "createdAt": current_user.created_at.isoformat(),
    }


@router.patch("/me")
def update_profile(
    body: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {"name", "language"}
    for key, val in body.items():
        if key in allowed:
            setattr(current_user, key, val)
    db.commit()
    db.refresh(current_user)
    return {"id": current_user.id, "name": current_user.name, "language": current_user.language}

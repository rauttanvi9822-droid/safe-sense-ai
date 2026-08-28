"""
SafeSense AI — Resources Router
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from backend.database import get_db
from backend.models import SupportResource, UserRoleEnum, User
from backend.auth import get_current_user, require_roles

router = APIRouter()


@router.get("")
def list_resources(db: Session = Depends(get_db), category: Optional[str] = None):
    """Public endpoint: list active verified resources."""
    query = db.query(SupportResource).filter(SupportResource.is_active == True)
    if category:
        query = query.filter(SupportResource.category == category)
    return [_res_out(r) for r in query.order_by(SupportResource.category).all()]


@router.post("")
def create_resource(
    body: dict,
    current_user: User = Depends(require_roles(UserRoleEnum.admin)),
    db: Session = Depends(get_db),
):
    r = SupportResource(
        id=str(uuid.uuid4()),
        name=body["name"],
        description=body["description"],
        category=body["category"],
        contact=body.get("contact"),
        website=body.get("website"),
        availability=body.get("availability"),
        is_verified=body.get("is_verified", False),
        is_active=body.get("is_active", False),
        added_by=current_user.id,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return _res_out(r)


@router.patch("/{resource_id}")
def update_resource(
    resource_id: str,
    body: dict,
    current_user: User = Depends(require_roles(UserRoleEnum.admin)),
    db: Session = Depends(get_db),
):
    r = db.query(SupportResource).filter(SupportResource.id == resource_id).first()
    if not r:
        raise HTTPException(404, "Resource not found")
    for key, val in body.items():
        if hasattr(r, key) and key not in ("id", "added_by"):
            setattr(r, key, val)
    db.commit()
    db.refresh(r)
    return _res_out(r)


def _res_out(r: SupportResource) -> dict:
    return {
        "id": r.id,
        "name": r.name,
        "description": r.description,
        "category": r.category,
        "contact": r.contact,
        "website": r.website,
        "availability": r.availability,
        "is_verified": r.is_verified,
        "is_active": r.is_active,
        "created_at": r.created_at.isoformat(),
    }

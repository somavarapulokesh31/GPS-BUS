from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.core.security import verify_password, hash_password, create_access_token
from app.schemas.user import UserCreate


def authenticate_user(db: Session, email: str, password: str):
    # Email addresses are case-insensitive in practice. Normalising here
    # prevents a valid account from failing to sign in because of whitespace
    # or capital letters entered in the form.
    normalized_email = email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        email=data.email.strip().lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        full_name=data.full_name,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token(user: User) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role})

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import ParentSignupRequest, UserCreate, UserOut, LoginRequest, TokenResponse
from app.models.user import UserRole
from app.services.auth_service import authenticate_user, create_user, get_token
from app.models.user import User
from app.core.security import decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(*roles):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return current_user
    return checker


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db),
             current_user: User = Depends(require_role("admin"))):
    existing = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db, data)


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(data: ParentSignupRequest, db: Session = Depends(get_db)):
    """Create a parent account and sign the new parent in immediately."""
    normalized_email = data.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = create_user(db, UserCreate(
        email=normalized_email,
        password=data.password,
        role=UserRole.parent,
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else None,
    ))
    return TokenResponse(
        access_token=get_token(user), role=user.role,
        user_id=user.id, full_name=user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = get_token(user)
    return TokenResponse(access_token=token, role=user.role, user_id=user.id, full_name=user.full_name)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

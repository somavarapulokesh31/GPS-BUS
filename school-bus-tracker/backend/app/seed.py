"""
Run this once to create the default admin user.
Usage: python -m app.seed
"""
from app.database import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


DEFAULT_ADMIN_EMAIL = "admin@school.com"
DEFAULT_ADMIN_PASSWORD = "admin123"


def seed_default_admin():
    """Ensure a first-run installation always has an administrator account."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first()
        if existing:
            return False

        admin = User(
            email=DEFAULT_ADMIN_EMAIL,
            password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
            role=UserRole.admin,
            full_name="System Admin",
            phone="0000000000",
        )
        db.add(admin)
        db.commit()
        return True
    finally:
        db.close()


if __name__ == "__main__":
    created = seed_default_admin()
    print("Admin created: admin@school.com / admin123" if created else "Admin already exists.")

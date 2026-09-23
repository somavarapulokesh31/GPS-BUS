import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    driver = "driver"
    parent = "parent"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    driven_buses = relationship("Bus", back_populates="driver", foreign_keys="Bus.driver_id")
    students = relationship("Student", back_populates="parent")
    notifications = relationship("Notification", back_populates="user")
    trips = relationship("Trip", back_populates="driver", foreign_keys="Trip.driver_id")

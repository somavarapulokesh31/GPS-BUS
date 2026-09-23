import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class BusStatus(str, enum.Enum):
    inactive = "inactive"
    active = "active"
    delayed = "delayed"


class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    bus_number = Column(String(50), unique=True, nullable=False)
    capacity = Column(Integer, nullable=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(BusStatus), default=BusStatus.inactive, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    driver = relationship("User", back_populates="driven_buses", foreign_keys=[driver_id])
    routes = relationship("Route", back_populates="bus")
    trips = relationship("Trip", back_populates="bus")
    locations = relationship("BusLocation", back_populates="bus")
    student_assignments = relationship("StudentBusAssignment", back_populates="bus")
    notifications = relationship("Notification", back_populates="bus")

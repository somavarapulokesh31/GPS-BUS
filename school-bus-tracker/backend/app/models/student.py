from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parent = relationship("User", back_populates="students")
    bus_assignments = relationship("StudentBusAssignment", back_populates="student")


class StudentBusAssignment(Base):
    __tablename__ = "student_bus_assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("bus_stops.id"), nullable=False)
    active = Column(Boolean, default=True)

    # Relationships
    student = relationship("Student", back_populates="bus_assignments")
    bus = relationship("Bus", back_populates="student_assignments")
    stop = relationship("BusStop", back_populates="student_assignments")

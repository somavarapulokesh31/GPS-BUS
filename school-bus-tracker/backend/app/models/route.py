from datetime import datetime, time

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Time
from sqlalchemy.orm import relationship

from app.database import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    bus = relationship("Bus", back_populates="routes")
    stops = relationship("BusStop", back_populates="route", order_by="BusStop.stop_order")
    trips = relationship("Trip", back_populates="route")
    schedules = relationship("Schedule", back_populates="route")


class BusStop(Base):
    __tablename__ = "bus_stops"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    stop_order = Column(Integer, nullable=False)
    scheduled_time = Column(Time, nullable=True)

    # Relationships
    route = relationship("Route", back_populates="stops")
    student_assignments = relationship("StudentBusAssignment", back_populates="stop")
    schedules = relationship("Schedule", back_populates="stop")

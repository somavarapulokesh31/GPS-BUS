import enum
from datetime import datetime

from sqlalchemy import Column, Integer, Enum, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.database import Base


class TripStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    cancelled = "cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(Enum(TripStatus), default=TripStatus.active, nullable=False)

    # Relationships
    bus = relationship("Bus", back_populates="trips")
    driver = relationship("User", back_populates="trips", foreign_keys=[driver_id])
    route = relationship("Route", back_populates="trips")
    locations = relationship("BusLocation", back_populates="trip")


class BusLocation(Base):
    __tablename__ = "bus_locations"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id"), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=False)
    longitude = Column(Numeric(10, 7), nullable=False)
    speed = Column(Numeric(5, 2), nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    trip = relationship("Trip", back_populates="locations")
    bus = relationship("Bus", back_populates="locations")

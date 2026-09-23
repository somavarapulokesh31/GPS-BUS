from sqlalchemy import Column, Integer, ForeignKey, Time
from sqlalchemy.orm import relationship

from app.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("bus_stops.id"), nullable=False)
    expected_arrival = Column(Time, nullable=False)

    # Relationships
    route = relationship("Route", back_populates="schedules")
    stop = relationship("BusStop", back_populates="schedules")

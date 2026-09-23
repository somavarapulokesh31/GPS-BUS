from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.trip import TripStatus


class TripOut(BaseModel):
    id: int
    bus_id: int
    driver_id: int
    route_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: TripStatus

    class Config:
        from_attributes = True


class GPSUpdate(BaseModel):
    trip_id: int
    bus_id: int
    latitude: float
    longitude: float
    speed: Optional[float] = None


class DelayReport(BaseModel):
    description: str

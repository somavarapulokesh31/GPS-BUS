from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.bus import BusStatus


class BusCreate(BaseModel):
    bus_number: str
    capacity: Optional[int] = None
    driver_id: Optional[int] = None


class BusUpdate(BaseModel):
    bus_number: Optional[str] = None
    capacity: Optional[int] = None
    driver_id: Optional[int] = None
    status: Optional[BusStatus] = None


class BusOut(BaseModel):
    id: int
    bus_number: str
    capacity: Optional[int] = None
    driver_id: Optional[int] = None
    status: BusStatus
    created_at: datetime

    class Config:
        from_attributes = True


class AssignDriverRequest(BaseModel):
    driver_id: int

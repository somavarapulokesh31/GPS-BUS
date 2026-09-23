from datetime import datetime, time
from typing import Optional, List
from pydantic import BaseModel


class BusStopCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    stop_order: int
    scheduled_time: Optional[time] = None


class BusStopUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    stop_order: Optional[int] = None
    scheduled_time: Optional[time] = None


class BusStopOut(BaseModel):
    id: int
    route_id: int
    name: str
    latitude: float
    longitude: float
    stop_order: int
    scheduled_time: Optional[time] = None

    class Config:
        from_attributes = True


class RouteCreate(BaseModel):
    name: str
    bus_id: Optional[int] = None
    stops: Optional[List[BusStopCreate]] = []


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    bus_id: Optional[int] = None


class RouteOut(BaseModel):
    id: int
    name: str
    bus_id: Optional[int] = None
    created_at: datetime
    stops: List[BusStopOut] = []

    class Config:
        from_attributes = True

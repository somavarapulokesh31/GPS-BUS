from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.bus import Bus, BusStatus
from app.models.trip import Trip, TripStatus
from app.models.route import Route
from app.schemas.trip import TripOut, DelayReport
from app.schemas.bus import BusOut
from app.schemas.route import RouteOut
from app.routers.auth import require_role

router = APIRouter(prefix="/driver", tags=["driver"])
driver_only = require_role("driver")


@router.get("/me")
def driver_info(db: Session = Depends(get_db), current_user: User = Depends(driver_only)):
    bus = db.query(Bus).filter(Bus.driver_id == current_user.id).first()
    if not bus:
        return {"driver": current_user.full_name, "bus": None, "route": None}
    route = db.query(Route).filter(Route.bus_id == bus.id).first()
    return {
        "driver": current_user.full_name,
        "bus": {"id": bus.id, "bus_number": bus.bus_number, "status": bus.status},
        "route": {
            "id": route.id,
            "name": route.name,
            "stops": [
                {"id": s.id, "name": s.name, "order": s.stop_order,
                 "lat": float(s.latitude), "lon": float(s.longitude),
                 "scheduled_time": str(s.scheduled_time) if s.scheduled_time else None}
                for s in route.stops
            ]
        } if route else None,
    }


@router.post("/trips/start", response_model=TripOut, status_code=201)
def start_trip(db: Session = Depends(get_db), current_user: User = Depends(driver_only)):
    bus = db.query(Bus).filter(Bus.driver_id == current_user.id).first()
    if not bus:
        raise HTTPException(404, "No bus assigned to this driver")
    active_trip = db.query(Trip).filter(
        Trip.bus_id == bus.id, Trip.status == TripStatus.active
    ).first()
    if active_trip:
        raise HTTPException(400, "A trip is already active for this bus")
    route = db.query(Route).filter(Route.bus_id == bus.id).first()
    if not route:
        raise HTTPException(404, "No route assigned to this bus")

    trip = Trip(
        bus_id=bus.id,
        driver_id=current_user.id,
        route_id=route.id,
        status=TripStatus.active,
        started_at=datetime.utcnow(),
    )
    bus.status = BusStatus.active
    db.add(trip); db.commit(); db.refresh(trip)
    return trip


@router.post("/trips/end", response_model=TripOut)
def end_trip(db: Session = Depends(get_db), current_user: User = Depends(driver_only)):
    bus = db.query(Bus).filter(Bus.driver_id == current_user.id).first()
    if not bus:
        raise HTTPException(404, "No bus assigned")
    trip = db.query(Trip).filter(
        Trip.bus_id == bus.id, Trip.status == TripStatus.active
    ).first()
    if not trip:
        raise HTTPException(404, "No active trip found")

    trip.status = TripStatus.completed
    trip.ended_at = datetime.utcnow()
    bus.status = BusStatus.inactive
    db.commit(); db.refresh(trip)
    return trip


@router.post("/report-delay")
def report_delay(data: DelayReport, db: Session = Depends(get_db),
                 current_user: User = Depends(driver_only)):
    bus = db.query(Bus).filter(Bus.driver_id == current_user.id).first()
    if not bus:
        raise HTTPException(404, "No bus assigned")
    bus.status = BusStatus.delayed
    db.commit()
    return {"message": "Delay reported", "description": data.description, "bus_id": bus.id}

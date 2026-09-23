from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.bus import Bus
from app.models.student import StudentBusAssignment
from app.models.trip import BusLocation
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.services.eta_service import calculate_eta
from app.routers.auth import require_role

router = APIRouter(prefix="/parent", tags=["parent"])
parent_only = require_role("parent")


@router.get("/bus")
def get_assigned_bus(db: Session = Depends(get_db), current_user: User = Depends(parent_only)):
    """Return the bus assigned to the parent's child, with live location and ETA."""
    # Find child's assignment
    assignment = (
        db.query(StudentBusAssignment)
        .join(StudentBusAssignment.student)
        .filter(
            StudentBusAssignment.active == True,
            StudentBusAssignment.student.has(parent_id=current_user.id),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(404, "No bus assignment found for your child")

    bus = assignment.bus
    stop = assignment.stop
    route = stop.route

    # Latest location
    latest_loc = (
        db.query(BusLocation)
        .filter(BusLocation.bus_id == bus.id)
        .order_by(BusLocation.recorded_at.desc())
        .first()
    )

    # ETA for all stops
    eta_list = []
    if latest_loc:
        eta_list = calculate_eta(
            float(latest_loc.latitude),
            float(latest_loc.longitude),
            route.stops,
            float(latest_loc.speed) if latest_loc.speed else 30.0,
        )

    # Find ETA for parent's specific stop
    my_stop_eta = next((e for e in eta_list if e["stop_id"] == stop.id), None)

    return {
        "bus": {
            "id": bus.id,
            "bus_number": bus.bus_number,
            "status": bus.status,
        },
        "assigned_stop": {
            "id": stop.id,
            "name": stop.name,
            "latitude": float(stop.latitude),
            "longitude": float(stop.longitude),
        },
        "current_location": {
            "latitude": float(latest_loc.latitude) if latest_loc else None,
            "longitude": float(latest_loc.longitude) if latest_loc else None,
            "speed": float(latest_loc.speed) if latest_loc and latest_loc.speed else None,
            "recorded_at": latest_loc.recorded_at.isoformat() if latest_loc else None,
        },
        "route": {
            "id": route.id,
            "name": route.name,
            "stops": [
                {"id": s.id, "name": s.name, "order": s.stop_order,
                 "latitude": float(s.latitude), "longitude": float(s.longitude)}
                for s in route.stops
            ],
        },
        "eta_my_stop": my_stop_eta,
        "eta_all_stops": eta_list,
    }


@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(parent_only)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.put("/notifications/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db),
              current_user: User = Depends(parent_only)):
    notif = db.query(Notification).filter(
        Notification.id == notif_id, Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.put("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(parent_only)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

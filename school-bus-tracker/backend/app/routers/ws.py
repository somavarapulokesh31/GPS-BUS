import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.core.ws_manager import manager
from app.core.security import decode_token
from app.models.user import User
from app.models.bus import Bus, BusStatus
from app.models.trip import Trip, TripStatus, BusLocation
from app.models.route import BusStop
from app.services.eta_service import calculate_eta
from app.services.delay_service import check_and_update_delay, is_approaching_stop
from app.services.notification_service import (
    create_delay_notifications,
    create_approaching_notifications,
)

router = APIRouter(tags=["websocket"])


def get_user_from_token(token: str, db: Session):
    payload = decode_token(token)
    if not payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()


@router.websocket("/ws/driver")
async def driver_ws(websocket: WebSocket, token: str = Query(...)):
    """
    WebSocket endpoint for drivers to send live GPS updates.
    Expects JSON: { "type": "gps_update", "trip_id": int, "bus_id": int,
                    "latitude": float, "longitude": float, "speed": float }
    """
    db = SessionLocal()
    user = get_user_from_token(token, db)
    if not user or user.role != "driver":
        await websocket.close(code=4001)
        db.close()
        return

    await manager.connect_driver(websocket, user.id)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            if data.get("type") != "gps_update":
                continue

            bus_id = data["bus_id"]
            trip_id = data["trip_id"]
            lat = float(data["latitude"])
            lon = float(data["longitude"])
            speed = float(data.get("speed", 30.0))

            # Verify the trip is active
            trip = db.query(Trip).filter(
                Trip.id == trip_id, Trip.status == TripStatus.active
            ).first()
            if not trip:
                continue

            # Save location to DB
            loc = BusLocation(trip_id=trip_id, bus_id=bus_id,
                              latitude=lat, longitude=lon, speed=speed)
            db.add(loc)
            db.commit()

            # Get bus and remaining stops
            bus = db.query(Bus).filter(Bus.id == bus_id).first()
            route_stops = (
                db.query(BusStop)
                .filter(BusStop.route_id == trip.route_id)
                .order_by(BusStop.stop_order)
                .all()
            )

            # Calculate ETA for all stops
            eta_list = calculate_eta(lat, lon, route_stops, speed)

            # Check for delay
            delay_triggered = check_and_update_delay(db, bus, lat, lon, speed, route_stops)

            if delay_triggered and eta_list:
                eta_str = eta_list[0]["eta_time"] if eta_list else "N/A"
                delay_minutes = eta_list[0]["eta_minutes"] if eta_list else 0
                notifs = create_delay_notifications(db, bus, delay_minutes, eta_str)
                # Push notification to subscribed parents via WS
                for notif in notifs:
                    await manager.broadcast_to_bus_subscribers(bus_id, {
                        "type": "notification",
                        "notification_id": notif.id,
                        "message": notif.message,
                        "notification_type": "delay",
                    })

            # Check approaching stops
            for stop in route_stops:
                if is_approaching_stop(lat, lon, float(stop.latitude), float(stop.longitude)):
                    eta_for_stop = next((e for e in eta_list if e["stop_id"] == stop.id), None)
                    eta_min = eta_for_stop["eta_minutes"] if eta_for_stop else 1
                    notifs = create_approaching_notifications(db, bus, stop.name, eta_min, stop.id)
                    for notif in notifs:
                        await manager.broadcast_to_bus_subscribers(bus_id, {
                            "type": "notification",
                            "notification_id": notif.id,
                            "message": notif.message,
                            "notification_type": "approaching",
                        })

            # Broadcast location + ETA to all subscribers of this bus
            await manager.broadcast_to_bus_subscribers(bus_id, {
                "type": "bus_location",
                "bus_id": bus_id,
                "latitude": lat,
                "longitude": lon,
                "speed": speed,
                "status": bus.status,
                "eta_stops": eta_list,
            })

    except WebSocketDisconnect:
        manager.disconnect_driver(user.id)
    finally:
        db.close()


@router.websocket("/ws/bus/{bus_id}")
async def subscribe_bus_ws(websocket: WebSocket, bus_id: int, token: str = Query(...)):
    """
    WebSocket endpoint for parents and admins to subscribe to a bus's live updates.
    """
    db = SessionLocal()
    user = get_user_from_token(token, db)
    if not user or user.role not in ("parent", "admin"):
        await websocket.close(code=4001)
        db.close()
        return

    await manager.connect_subscriber(websocket, bus_id)
    # Send initial bus data immediately on connect
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if bus:
        latest_loc = (
            db.query(BusLocation)
            .filter(BusLocation.bus_id == bus_id)
            .order_by(BusLocation.recorded_at.desc())
            .first()
        )
        await websocket.send_text(json.dumps({
            "type": "connected",
            "bus_id": bus_id,
            "bus_number": bus.bus_number,
            "status": bus.status,
            "latitude": float(latest_loc.latitude) if latest_loc else None,
            "longitude": float(latest_loc.longitude) if latest_loc else None,
        }))
    db.close()

    try:
        while True:
            # Keep connection alive; server pushes updates
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_subscriber(websocket, bus_id)

from datetime import datetime, time
from typing import Optional, List, Dict

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.bus import Bus, BusStatus
from app.models.route import BusStop
from app.services.eta_service import calculate_eta, haversine_distance


def check_and_update_delay(
    db: Session,
    bus: Bus,
    current_lat: float,
    current_lon: float,
    speed_kmh: float,
    remaining_stops: list,
) -> bool:
    """
    Compare ETA at next stop vs scheduled time.
    Updates bus.status if delay is detected or resolved.

    Returns True if bus status changed to 'delayed'.
    """
    if not remaining_stops:
        return False

    next_stop: BusStop = remaining_stops[0]

    # No scheduled time means we can't detect delay
    if next_stop.scheduled_time is None:
        return False

    eta_list = calculate_eta(current_lat, current_lon, [next_stop], speed_kmh)
    if not eta_list:
        return False

    eta_minutes = eta_list[0]["eta_minutes"]
    eta_time = datetime.utcnow().replace(
        hour=int(eta_list[0]["eta_time"].split(":")[0]),
        minute=int(eta_list[0]["eta_time"].split(":")[1]),
        second=0,
        microsecond=0,
    )

    # Convert scheduled_time (time object) to today's datetime for comparison
    now = datetime.utcnow()
    scheduled_dt = now.replace(
        hour=next_stop.scheduled_time.hour,
        minute=next_stop.scheduled_time.minute,
        second=0,
        microsecond=0,
    )

    delay_minutes = (eta_time - scheduled_dt).total_seconds() / 60.0
    threshold = settings.DELAY_THRESHOLD_MINUTES

    status_changed = False

    if delay_minutes > threshold and bus.status != BusStatus.delayed:
        bus.status = BusStatus.delayed
        db.commit()
        status_changed = True
    elif delay_minutes <= 2 and bus.status == BusStatus.delayed:
        bus.status = BusStatus.active
        db.commit()

    return status_changed


def is_approaching_stop(
    current_lat: float,
    current_lon: float,
    stop_lat: float,
    stop_lon: float,
    threshold_meters: int = None,
) -> bool:
    """Returns True if bus is within threshold meters of a stop."""
    if threshold_meters is None:
        threshold_meters = settings.APPROACHING_THRESHOLD_METERS

    dist_km = haversine_distance(current_lat, current_lon, stop_lat, stop_lon)
    dist_meters = dist_km * 1000
    return dist_meters <= threshold_meters

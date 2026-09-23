import math
from typing import List, Dict
from datetime import datetime, timedelta


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth in kilometers.
    Uses the Haversine formula.
    """
    R = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def calculate_eta(
    current_lat: float,
    current_lon: float,
    stops: list,
    speed_kmh: float = 30.0,
) -> List[Dict]:
    """
    Calculate ETA for each remaining stop.

    Args:
        current_lat: Bus current latitude
        current_lon: Bus current longitude
        stops: List of BusStop ORM objects ordered by stop_order
        speed_kmh: Current speed in km/h (default 30 if unknown)

    Returns:
        List of dicts with stop_id, stop_name, distance_km, eta_minutes, eta_time
    """
    if speed_kmh <= 0:
        speed_kmh = 30.0

    results = []
    cumulative_distance = 0.0
    prev_lat, prev_lon = current_lat, current_lon

    for stop in stops:
        stop_lat = float(stop.latitude)
        stop_lon = float(stop.longitude)
        dist = haversine_distance(prev_lat, prev_lon, stop_lat, stop_lon)
        cumulative_distance += dist

        # time in hours → convert to minutes
        eta_minutes = (cumulative_distance / speed_kmh) * 60
        eta_time = datetime.utcnow() + timedelta(minutes=eta_minutes)

        results.append({
            "stop_id": stop.id,
            "stop_name": stop.name,
            "distance_km": round(cumulative_distance, 3),
            "eta_minutes": round(eta_minutes, 1),
            "eta_time": eta_time.strftime("%H:%M"),
        })

        prev_lat, prev_lon = stop_lat, stop_lon

    return results

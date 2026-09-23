from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.bus import Bus
from app.models.route import Route, BusStop
from app.models.student import Student, StudentBusAssignment
from app.models.trip import Trip, TripStatus
from app.models.notification import Notification
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.bus import BusCreate, BusUpdate, BusOut, AssignDriverRequest
from app.schemas.route import RouteCreate, RouteUpdate, RouteOut, BusStopCreate, BusStopOut, BusStopUpdate
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut, AssignStudentRequest, StudentAssignmentOut
from app.schemas.notification import AnnouncementCreate, NotificationOut
from app.services.auth_service import create_user
from app.core.security import hash_password
from app.services.notification_service import create_announcement
from app.routers.auth import require_role

router = APIRouter(prefix="/admin", tags=["admin"])
admin_only = require_role("admin")

# ── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db), _=Depends(admin_only)):
    total = db.query(Bus).count()
    active = db.query(Bus).filter(Bus.status == "active").count()
    delayed = db.query(Bus).filter(Bus.status == "delayed").count()
    completed = db.query(Trip).filter(Trip.status == TripStatus.completed).count()
    return {"total_buses": total, "active_buses": active, "delayed_buses": delayed, "completed_trips": completed}

# ── Buses ────────────────────────────────────────────────────────────────────

@router.get("/buses", response_model=List[BusOut])
def list_buses(db: Session = Depends(get_db), _=Depends(admin_only)):
    return db.query(Bus).all()

@router.post("/buses", response_model=BusOut, status_code=201)
def create_bus(data: BusCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    bus = Bus(**data.model_dump())
    db.add(bus); db.commit(); db.refresh(bus)
    return bus

@router.put("/buses/{bus_id}", response_model=BusOut)
def update_bus(bus_id: int, data: BusUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus: raise HTTPException(404, "Bus not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(bus, k, v)
    db.commit(); db.refresh(bus)
    return bus

@router.delete("/buses/{bus_id}", status_code=204)
def delete_bus(bus_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus: raise HTTPException(404, "Bus not found")
    db.delete(bus); db.commit()

@router.put("/buses/{bus_id}/assign-driver", response_model=BusOut)
def assign_driver(bus_id: int, data: AssignDriverRequest, db: Session = Depends(get_db), _=Depends(admin_only)):
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus: raise HTTPException(404, "Bus not found")
    driver = db.query(User).filter(User.id == data.driver_id, User.role == UserRole.driver).first()
    if not driver: raise HTTPException(404, "Driver not found")
    bus.driver_id = data.driver_id
    db.commit(); db.refresh(bus)
    return bus

# ── Drivers ──────────────────────────────────────────────────────────────────

@router.get("/drivers", response_model=List[UserOut])
def list_drivers(db: Session = Depends(get_db), _=Depends(admin_only)):
    return db.query(User).filter(User.role == UserRole.driver).all()

@router.post("/drivers", response_model=UserOut, status_code=201)
def create_driver(data: UserCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    data.role = UserRole.driver
    existing = db.query(User).filter(func.lower(User.email) == data.email.strip().lower()).first()
    if existing: raise HTTPException(400, "Email already registered")
    return create_user(db, data)

@router.put("/drivers/{driver_id}", response_model=UserOut)
def update_driver(driver_id: int, data: UserUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    user = db.query(User).filter(User.id == driver_id, User.role == UserRole.driver).first()
    if not user: raise HTTPException(404, "Driver not found")
    updates = data.model_dump(exclude_none=True)
    if "password" in updates:
        user.password_hash = hash_password(updates.pop("password"))
    if "email" in updates:
        updates["email"] = updates["email"].strip().lower()
    for k, v in updates.items():
        setattr(user, k, v)
    db.commit(); db.refresh(user)
    return user

@router.delete("/drivers/{driver_id}", status_code=204)
def delete_driver(driver_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    user = db.query(User).filter(User.id == driver_id, User.role == UserRole.driver).first()
    if not user: raise HTTPException(404, "Driver not found")
    db.delete(user); db.commit()

# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("/routes", response_model=List[RouteOut])
def list_routes(db: Session = Depends(get_db), _=Depends(admin_only)):
    return db.query(Route).all()

@router.post("/routes", response_model=RouteOut, status_code=201)
def create_route(data: RouteCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    route = Route(name=data.name, bus_id=data.bus_id)
    db.add(route); db.commit(); db.refresh(route)
    for stop_data in data.stops:
        stop = BusStop(route_id=route.id, **stop_data.model_dump())
        db.add(stop)
    db.commit(); db.refresh(route)
    return route

@router.put("/routes/{route_id}", response_model=RouteOut)
def update_route(route_id: int, data: RouteUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route: raise HTTPException(404, "Route not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(route, k, v)
    db.commit(); db.refresh(route)
    return route

@router.delete("/routes/{route_id}", status_code=204)
def delete_route(route_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route: raise HTTPException(404, "Route not found")
    db.delete(route); db.commit()

@router.post("/routes/{route_id}/stops", response_model=BusStopOut, status_code=201)
def add_stop(route_id: int, data: BusStopCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route: raise HTTPException(404, "Route not found")
    stop = BusStop(route_id=route_id, **data.model_dump())
    db.add(stop); db.commit(); db.refresh(stop)
    return stop

@router.put("/routes/{route_id}/stops/{stop_id}", response_model=BusStopOut)
def update_stop(route_id: int, stop_id: int, data: BusStopUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    stop = db.query(BusStop).filter(BusStop.id == stop_id, BusStop.route_id == route_id).first()
    if not stop: raise HTTPException(404, "Stop not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(stop, k, v)
    db.commit(); db.refresh(stop)
    return stop

@router.delete("/routes/{route_id}/stops/{stop_id}", status_code=204)
def delete_stop(route_id: int, stop_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    stop = db.query(BusStop).filter(BusStop.id == stop_id, BusStop.route_id == route_id).first()
    if not stop: raise HTTPException(404, "Stop not found")
    db.delete(stop); db.commit()

# ── Students & Parents ───────────────────────────────────────────────────────

@router.get("/parents", response_model=List[UserOut])
def list_parents(db: Session = Depends(get_db), _=Depends(admin_only)):
    return db.query(User).filter(User.role == UserRole.parent).all()

@router.post("/parents", response_model=UserOut, status_code=201)
def create_parent(data: UserCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    data.role = UserRole.parent
    existing = db.query(User).filter(func.lower(User.email) == data.email.strip().lower()).first()
    if existing: raise HTTPException(400, "Email already registered")
    return create_user(db, data)

@router.get("/students", response_model=List[StudentOut])
def list_students(db: Session = Depends(get_db), _=Depends(admin_only)):
    return db.query(Student).all()

@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    student = Student(**data.model_dump())
    db.add(student); db.commit(); db.refresh(student)
    return student

@router.put("/students/{student_id}", response_model=StudentOut)
def update_student(student_id: int, data: StudentUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student: raise HTTPException(404, "Student not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(student, k, v)
    db.commit(); db.refresh(student)
    return student

@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student: raise HTTPException(404, "Student not found")
    db.delete(student); db.commit()

@router.post("/students/assign", response_model=StudentAssignmentOut, status_code=201)
def assign_student(data: AssignStudentRequest, db: Session = Depends(get_db), _=Depends(admin_only)):
    assignment = StudentBusAssignment(**data.model_dump())
    db.add(assignment); db.commit(); db.refresh(assignment)
    return assignment

# ── Announcements ────────────────────────────────────────────────────────────

@router.post("/announcements", status_code=201)
def send_announcement(data: AnnouncementCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    users = db.query(User).filter(User.role == data.target_role).all()
    notifications = create_announcement(db, data.message, users)
    return {"sent_to": len(notifications), "message": data.message}

# ── Active Buses Monitor ─────────────────────────────────────────────────────

@router.get("/monitor")
def monitor_buses(db: Session = Depends(get_db), _=Depends(admin_only)):
    from app.models.trip import BusLocation
    buses = db.query(Bus).filter(Bus.status.in_(["active", "delayed"])).all()
    result = []
    for bus in buses:
        latest_loc = (
            db.query(BusLocation)
            .filter(BusLocation.bus_id == bus.id)
            .order_by(BusLocation.recorded_at.desc())
            .first()
        )
        result.append({
            "bus_id": bus.id,
            "bus_number": bus.bus_number,
            "status": bus.status,
            "driver_id": bus.driver_id,
            "latitude": float(latest_loc.latitude) if latest_loc else None,
            "longitude": float(latest_loc.longitude) if latest_loc else None,
            "last_updated": latest_loc.recorded_at.isoformat() if latest_loc else None,
        })
    return result

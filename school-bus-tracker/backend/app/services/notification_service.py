from datetime import datetime
from typing import List

from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType
from app.models.bus import Bus
from app.models.student import StudentBusAssignment
from app.models.user import User


def get_parents_for_bus(db: Session, bus_id: int) -> List[User]:
    """Return all parent users whose child is assigned to this bus."""
    assignments = (
        db.query(StudentBusAssignment)
        .filter(StudentBusAssignment.bus_id == bus_id, StudentBusAssignment.active == True)
        .all()
    )
    parent_ids = list({a.student.parent_id for a in assignments})
    parents = db.query(User).filter(User.id.in_(parent_ids)).all()
    return parents


def create_delay_notifications(
    db: Session,
    bus: Bus,
    delay_minutes: float,
    eta_time_str: str,
) -> List[Notification]:
    """Create delay notifications for all parents of students on this bus."""
    parents = get_parents_for_bus(db, bus.id)
    notifications = []

    for parent in parents:
        msg = (
            f"Bus {bus.bus_number} is currently delayed by approximately "
            f"{int(delay_minutes)} minutes. "
            f"Expected arrival at your stop: {eta_time_str}."
        )
        notif = Notification(
            user_id=parent.id,
            bus_id=bus.id,
            type=NotificationType.delay,
            message=msg,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        notifications.append(notif)

    db.commit()
    for n in notifications:
        db.refresh(n)
    return notifications


def create_approaching_notifications(
    db: Session,
    bus: Bus,
    stop_name: str,
    eta_minutes: float,
    stop_id: int,
) -> List[Notification]:
    """Notify parents whose stop the bus is approaching."""
    assignments = (
        db.query(StudentBusAssignment)
        .filter(
            StudentBusAssignment.bus_id == bus.id,
            StudentBusAssignment.stop_id == stop_id,
            StudentBusAssignment.active == True,
        )
        .all()
    )

    notifications = []
    for assignment in assignments:
        parent = assignment.student.parent
        msg = (
            f"Bus {bus.bus_number} is approaching your stop ({stop_name}). "
            f"Estimated arrival: {int(eta_minutes)} minute(s)."
        )
        notif = Notification(
            user_id=parent.id,
            bus_id=bus.id,
            type=NotificationType.approaching,
            message=msg,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        notifications.append(notif)

    db.commit()
    for n in notifications:
        db.refresh(n)
    return notifications


def create_announcement(
    db: Session,
    message: str,
    target_users: List[User],
) -> List[Notification]:
    """Send an announcement notification to a list of users."""
    notifications = []
    for user in target_users:
        notif = Notification(
            user_id=user.id,
            bus_id=None,
            type=NotificationType.announcement,
            message=message,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notif)
        notifications.append(notif)

    db.commit()
    for n in notifications:
        db.refresh(n)
    return notifications

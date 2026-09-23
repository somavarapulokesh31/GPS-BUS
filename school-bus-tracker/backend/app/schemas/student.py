from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StudentCreate(BaseModel):
    full_name: str
    parent_id: int


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    parent_id: Optional[int] = None


class StudentOut(BaseModel):
    id: int
    full_name: str
    parent_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AssignStudentRequest(BaseModel):
    student_id: int
    bus_id: int
    stop_id: int


class StudentAssignmentOut(BaseModel):
    id: int
    student_id: int
    bus_id: int
    stop_id: int
    active: bool

    class Config:
        from_attributes = True

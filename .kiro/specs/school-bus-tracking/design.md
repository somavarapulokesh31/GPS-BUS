# Technical Design Document
## Real-Time School Bus Tracking and Parent Notification System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │  Parent  │  │  Driver  │  │      Admin Dashboard      │  │
│  │   View   │  │   View   │  │                          │  │
│  └────┬─────┘  └────┬─────┘  └────────────┬─────────────┘  │
└───────┼─────────────┼─────────────────────┼────────────────┘
        │  REST + WS  │  REST + WS          │  REST
┌───────┼─────────────┼─────────────────────┼────────────────┐
│       │    Backend (FastAPI + Python)      │               │
│  ┌────┴──────────────────────────────────┴───┐            │
│  │           WebSocket Manager               │            │
│  │  (broadcasts GPS updates to subscribers)  │            │
│  └───────────────────────────────────────────┘            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │   Auth   │ │  Routes  │ │   ETA    │ │Notification  │  │
│  │ Service  │ │ Service  │ │ Service  │ │  Service    │  │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │
└────────────────────────┬───────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   PostgreSQL DB     │
              └─────────────────────┘
```

### Technology Stack
- **Frontend**: React.js, Leaflet.js + OpenStreetMap, Socket.IO client, Axios
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy ORM, python-socketio / websockets
- **Database**: PostgreSQL 15+
- **Auth**: JWT (python-jose), bcrypt (passlib)
- **Real-time**: WebSockets (FastAPI native WebSocket support)
- **Containerization**: Docker + Docker Compose

### Project Folder Structure
```
school-bus-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── database.py              # DB connection & session
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── bus.py
│   │   │   ├── route.py
│   │   │   ├── trip.py
│   │   │   └── notification.py
│   │   ├── schemas/                 # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── bus.py
│   │   │   ├── route.py
│   │   │   └── notification.py
│   │   ├── routers/                 # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── admin.py
│   │   │   ├── driver.py
│   │   │   ├── parent.py
│   │   │   └── ws.py               # WebSocket endpoint
│   │   ├── services/               # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── eta_service.py
│   │   │   ├── delay_service.py
│   │   │   └── notification_service.py
│   │   ├── core/
│   │   │   ├── config.py           # Settings / env vars
│   │   │   ├── security.py         # JWT helpers
│   │   │   └── ws_manager.py       # WebSocket connection manager
│   │   └── migrations/             # Alembic migrations
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   ├── Notifications/
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ParentDashboard.jsx
│   │   │   ├── DriverDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── websocket.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Database Schema

#### users
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | bcrypt |
| role | ENUM('admin','driver','parent') NOT NULL | |
| full_name | VARCHAR(255) NOT NULL | |
| phone | VARCHAR(20) | |
| created_at | TIMESTAMP | DEFAULT now() |

#### buses
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| bus_number | VARCHAR(50) UNIQUE NOT NULL | |
| capacity | INTEGER | |
| driver_id | INTEGER FK → users(id) | nullable |
| status | ENUM('inactive','active','delayed') | DEFAULT 'inactive' |
| created_at | TIMESTAMP | |

#### routes
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| name | VARCHAR(255) NOT NULL | |
| bus_id | INTEGER FK → buses(id) | nullable |
| created_at | TIMESTAMP | |

#### bus_stops
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| route_id | INTEGER FK → routes(id) | |
| name | VARCHAR(255) NOT NULL | |
| latitude | DECIMAL(10,7) NOT NULL | |
| longitude | DECIMAL(10,7) NOT NULL | |
| stop_order | INTEGER NOT NULL | |
| scheduled_time | TIME | expected arrival time |

#### students
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| full_name | VARCHAR(255) NOT NULL | |
| parent_id | INTEGER FK → users(id) | |
| created_at | TIMESTAMP | |

#### student_bus_assignments
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| student_id | INTEGER FK → students(id) | |
| bus_id | INTEGER FK → buses(id) | |
| stop_id | INTEGER FK → bus_stops(id) | assigned pickup stop |
| active | BOOLEAN | DEFAULT true |

#### trips
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| bus_id | INTEGER FK → buses(id) | |
| driver_id | INTEGER FK → users(id) | |
| route_id | INTEGER FK → routes(id) | |
| started_at | TIMESTAMP | |
| ended_at | TIMESTAMP | nullable |
| status | ENUM('active','completed','cancelled') | |

#### bus_locations
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| trip_id | INTEGER FK → trips(id) | |
| bus_id | INTEGER FK → buses(id) | |
| latitude | DECIMAL(10,7) NOT NULL | |
| longitude | DECIMAL(10,7) NOT NULL | |
| speed | DECIMAL(5,2) | km/h |
| recorded_at | TIMESTAMP | DEFAULT now() |

#### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| user_id | INTEGER FK → users(id) | recipient |
| bus_id | INTEGER FK → buses(id) | |
| type | ENUM('delay','approaching','announcement') | |
| message | TEXT NOT NULL | |
| is_read | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT now() |

#### schedules
| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PK | |
| route_id | INTEGER FK → routes(id) | |
| stop_id | INTEGER FK → bus_stops(id) | |
| expected_arrival | TIME NOT NULL | |

### WebSocket Protocol

#### Driver → Server (GPS update)
```json
{
  "type": "gps_update",
  "trip_id": 1,
  "bus_id": 5,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "speed": 40.5
}
```

#### Server → Parent (location broadcast)
```json
{
  "type": "bus_location",
  "bus_id": 5,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "speed": 40.5,
  "status": "delayed",
  "eta_stops": [
    {"stop_id": 3, "stop_name": "Stop 2", "eta_minutes": 8},
    {"stop_id": 4, "stop_name": "Stop 3", "eta_minutes": 14}
  ]
}
```

#### Server → Parent (notification)
```json
{
  "type": "notification",
  "notification_id": 42,
  "message": "Bus 12 is delayed. Updated ETA at your stop: 8:10 AM.",
  "notification_type": "delay"
}
```

### ETA Calculation Logic
1. Get bus current coordinates (lat, lon)
2. Get remaining stops (stops not yet passed) ordered by stop_order
3. For each remaining stop, calculate Haversine distance from current position
4. Estimate travel time: `time = distance / average_speed`
5. Average speed defaults to 30 km/h if no recent speed data

### Delay Detection Logic
1. For each active trip, get the next upcoming stop and its scheduled_time
2. Calculate current ETA for that stop
3. If `ETA - scheduled_time > threshold (default 5 min)` → mark bus as "Delayed"
4. If previously delayed and now `ETA - scheduled_time < 2 min` → mark as "On Time"
5. On status change to "Delayed", trigger notification service

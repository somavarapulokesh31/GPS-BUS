# 🚌 Real-Time School Bus Tracking and Parent Notification System

A full-stack web application that provides real-time GPS tracking of school buses, automatic delay detection, and parent notifications.

---

## 📋 Features

### For Parents
- ✅ Real-time bus location on a live map
- ✅ ETA at your child's assigned stop
- ✅ Automatic delay notifications
- ✅ "Bus approaching" notifications when close to stop
- ✅ View full route and all stops
- ✅ Notification history

### For Drivers
- ✅ Start/end trips with one click
- ✅ Automatic GPS tracking (shares location every 5 seconds)
- ✅ View assigned route and all stops
- ✅ Report delays with description

### For Admins
- ✅ Dashboard with live statistics (total/active/delayed buses, completed trips)
- ✅ Manage buses, drivers, routes, stops, students, and parents
- ✅ Assign drivers to buses
- ✅ Create routes with ordered stops and scheduled times
- ✅ Assign students to specific buses and stops
- ✅ Live monitor of all active buses
- ✅ Send announcements to all parents

### System Features
- ✅ JWT authentication with role-based access (admin, driver, parent)
- ✅ WebSocket real-time communication for GPS updates and notifications
- ✅ ETA calculation using Haversine distance formula
- ✅ Automatic delay detection comparing actual ETA vs scheduled time
- ✅ OpenStreetMap + Leaflet.js for interactive maps
- ✅ Fully containerized with Docker

---

## 🛠️ Technology Stack

**Backend**
- Python 3.11+
- FastAPI (REST API + WebSockets)
- SQLAlchemy ORM
- PostgreSQL 15
- JWT (python-jose) + bcrypt (passlib)

**Frontend**
- React 18 + Vite
- React Router v6
- Leaflet.js + React-Leaflet (maps)
- Axios (HTTP client)
- Native WebSocket API

**DevOps**
- Docker + Docker Compose
- Nginx (frontend production server)

---

## 📂 Project Structure

```
school-bus-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── database.py              # DB connection
│   │   ├── seed.py                  # Create admin user
│   │   ├── models/                  # SQLAlchemy models
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # API endpoints (auth, admin, driver, parent, ws)
│   │   ├── services/                # Business logic (ETA, delay, notifications)
│   │   └── core/                    # Config, security, WebSocket manager
│   ├── requirements.txt
│   ├── .env
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Login, AdminDashboard, DriverDashboard, ParentDashboard
│   │   ├── components/              # LiveMap, NotificationPanel, Sidebar
│   │   ├── services/                # api.js, websocket.js
│   │   ├── context/                 # AuthContext
│   │   └── App.jsx
│   ├── package.json
│   ├── .env
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Docker** and **Docker Compose** installed
- Or manually: Python 3.11+, Node.js 20+, PostgreSQL 15+

---

## 🐳 Option 1: Run with Docker (Recommended)

### Step 1: Clone the repository
```bash
cd school-bus-tracker
```

### Step 2: Build and run all services
```bash
docker-compose up --build
```

This will:
- Start PostgreSQL on port `5432`
- Start backend API on `http://localhost:8000`
- Start frontend on `http://localhost:80`

### Step 3: Sign in

The backend automatically creates the initial administrator on its first
startup.

**Default admin credentials:**
- Email: `admin@school.com`
- Password: `admin123`

### Step 4: Open the app
Go to **http://localhost** in your browser and login with admin credentials.

---

## 💻 Option 2: Run Manually (Without Docker)

### Backend Setup

1. **Install Python dependencies**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

2. **Set up PostgreSQL**
Create a database named `schoolbus` and update `backend/.env`:
```env
DATABASE_URL=postgresql://bususer:buspass@localhost:5432/schoolbus
SECRET_KEY=supersecretjwtkey1234567890abcdef
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DELAY_THRESHOLD_MINUTES=5
APPROACHING_THRESHOLD_METERS=500
```

3. **Create tables and seed admin**
```bash
python -m app.main  # Run once to create tables (Ctrl+C after it starts)
python -m app.seed
```

4. **Run the backend server**
```bash
uvicorn app.main:app --reload
```

Backend API will be at **http://localhost:8000** (Docs at `/docs`)

---

### Frontend Setup

1. **Install Node dependencies**
```bash
cd frontend
npm install
```

2. **Update frontend/.env** (if needed)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

3. **Run the dev server**
```bash
npm run dev
```

Frontend will be at **http://localhost:5173**

---

## 🔑 Default Accounts

After running `seed.py`, you have:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |

**Create drivers, parents, and students through the admin dashboard.**

---

## 📖 Usage Workflow

### 1️⃣ Admin Setup
1. Login as admin
2. Go to **Buses** → Add a bus (e.g., "Bus 12")
3. Go to **Drivers** → Add a driver account
4. Go to **Buses** → Assign the driver to the bus
5. Go to **Routes** → Create a route, add stops with lat/lon, stop order, and scheduled times
6. Assign the route to a bus
7. Go to **Students** → Create a parent account, then create a student under that parent
8. Assign the student to the bus and a specific stop

### 2️⃣ Driver Trip
1. Login as the driver
2. Click **Start Trip**
3. Browser will ask for location permission — allow it
4. GPS coordinates will be sent to the backend every 5 seconds via WebSocket
5. When done, click **End Trip**

### 3️⃣ Parent View
1. Login as the parent
2. See the live bus location on the map
3. ETA at your stop is displayed prominently
4. Receive real-time notifications when:
   - Bus is delayed
   - Bus is approaching your stop
5. View notification history in the **Notifications** page

### 4️⃣ Admin Monitor
1. Go to **Live Monitor**
2. See all active/delayed buses with their current locations
3. Send announcements to all parents

---

## 🗺️ How It Works

### GPS Tracking
- Driver starts a trip → Opens a WebSocket connection
- Browser Geolocation API sends lat/lon every 5 seconds
- Backend stores each GPS update in `bus_locations` table
- Broadcasts location + ETA to all subscribed parents via WebSocket

### ETA Calculation
- Uses **Haversine formula** to calculate distance between current bus position and each remaining stop
- Formula: `ETA = distance / average_speed`
- Updates on every GPS ping

### Delay Detection
- Compares actual ETA at next stop vs scheduled time
- If difference > 5 minutes (configurable) → bus marked as "Delayed"
- Automatically creates notifications for all parents on that bus
- Pushes notification via WebSocket in real time

### Approaching Notification
- Checks distance from bus to each stop
- If within 500 meters (configurable) → triggers "approaching" notification
- Sent to parents whose assigned stop matches

---

## 🔧 Configuration

### Backend Environment Variables (`backend/.env`)
```env
DATABASE_URL=postgresql://bususer:buspass@localhost:5432/schoolbus
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DELAY_THRESHOLD_MINUTES=5          # Mark bus delayed if > 5 min late
APPROACHING_THRESHOLD_METERS=500   # "Approaching" notification distance
```

### Frontend Environment Variables (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 📡 API Endpoints

### Authentication
- `POST /auth/login` — Login (returns JWT token)
- `POST /auth/register` — Register user (admin only)
- `GET /auth/me` — Get current user

### Admin
- `GET /admin/stats` — Dashboard stats
- `GET /admin/monitor` — Live active buses
- `GET/POST/PUT/DELETE /admin/buses` — Bus CRUD
- `GET/POST/PUT/DELETE /admin/drivers` — Driver CRUD
- `GET/POST/PUT/DELETE /admin/routes` — Route CRUD
- `POST/PUT/DELETE /admin/routes/:id/stops` — Stop management
- `GET/POST/PUT/DELETE /admin/students` — Student CRUD
- `POST /admin/students/assign` — Assign student to bus + stop
- `POST /admin/announcements` — Send announcement to all parents

### Driver
- `GET /driver/me` — Get assigned bus, route, stops
- `POST /driver/trips/start` — Start a trip
- `POST /driver/trips/end` — End a trip
- `POST /driver/report-delay` — Report delay

### Parent
- `GET /parent/bus` — Get assigned bus, live location, ETA
- `GET /parent/notifications` — Get all notifications
- `PUT /parent/notifications/:id/read` — Mark as read

### WebSocket
- `WS /ws/driver?token=<jwt>` — Driver GPS updates
- `WS /ws/bus/:bus_id?token=<jwt>` — Subscribe to bus updates

---

## 🧪 Testing

### Manual Testing Steps
1. **Backend**: Go to `http://localhost:8000/docs` (Swagger UI)
2. **Login**: Use `/auth/login` endpoint with admin credentials
3. **WebSocket**: Use a WebSocket client (e.g., Postman, websocat) to test `/ws/*` endpoints

### End-to-End Test
1. Admin creates bus → route → driver → parent → student → assigns all
2. Driver logs in and starts trip
3. Open parent dashboard in another browser/incognito
4. Watch live bus marker move on the map
5. Manually change GPS coordinates or wait for delay threshold → notification appears

---

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker ps` or `pg_isready`
- Verify `DATABASE_URL` in `.env`
- Check logs: `docker logs schoolbus_backend`

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `frontend/.env`
- CORS is enabled for `localhost:5173` and `localhost:3000` by default

### WebSocket not connecting
- Check browser console for errors
- Ensure JWT token is valid (check `/auth/me` first)
- Verify `VITE_WS_URL` in `frontend/.env`

### GPS not working
- Browser must be HTTPS or localhost for Geolocation API
- Check browser location permissions
- Check browser console for Geolocation errors

---

## 🚢 Deployment

### Production Checklist
1. **Change `SECRET_KEY`** in `backend/.env` to a strong random value
2. **Update CORS origins** in `backend/app/main.py` to your production domain
3. **Use environment variables** for all secrets (never commit `.env` files)
4. **Set up HTTPS** (required for Geolocation API to work on non-localhost)
5. **Configure PostgreSQL** with strong credentials
6. **Build frontend for production**: `npm run build` (outputs to `frontend/dist`)

### Docker Production Deploy
```bash
docker-compose up -d --build
```

### Manual Production Deploy
- Backend: Use `gunicorn` or `uvicorn` with `--workers` flag
- Frontend: Serve `frontend/dist` with Nginx or any static host
- Database: Use managed PostgreSQL (AWS RDS, Azure Database, etc.)

---

## 📄 License

This project is for educational purposes. Feel free to modify and use it as needed.

---

## 👥 Contributors

Built as a demonstration project for a real-time tracking system with WebSocket integration.

---

## 📞 Support

For issues or questions:
- Check the **Troubleshooting** section
- Review API docs at `http://localhost:8000/docs`
- Check browser console and backend logs

---

**🚌 Happy Tracking!**

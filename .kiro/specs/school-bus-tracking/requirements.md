# Real-Time School Bus Tracking and Parent Notification System
## Requirements

### Introduction
Parents currently have no real-time visibility when school buses run late. This system solves that by allowing parents to track their child's school bus in real time and receive automatic notifications when the bus is delayed or approaching their pickup location.

### Requirements

#### 1. User Authentication & Role-Based Access
- MUST support three user roles: Parent, Driver, Admin
- MUST allow users to register and login with email/password
- MUST issue JWT tokens on login for session management
- MUST restrict endpoints based on user role
- MUST hash passwords before storing them

#### 2. Admin Dashboard & Management
- MUST allow admin to add, edit, and delete buses
- MUST allow admin to add, edit, and delete drivers and assign them to buses
- MUST allow admin to add, edit, and delete students and their parent accounts
- MUST allow admin to create routes with ordered bus stops
- MUST allow admin to assign students to specific buses/stops
- MUST allow admin to view all active buses and their current locations on a dashboard
- MUST allow admin to view delayed buses highlighted separately
- MUST allow admin to send announcements to all parents or specific groups
- MUST show dashboard stats: total buses, active buses, delayed buses, completed trips

#### 3. Bus Driver Interface
- MUST allow driver to login and view their assigned bus and route
- MUST allow driver to start and end a trip
- MUST allow driver to share live GPS coordinates while a trip is active
- MUST allow driver to report a delay or problem with a description

#### 4. Parent Interface
- MUST allow parent to login and view their child's assigned bus
- MUST show the bus's current location on a live map
- MUST show estimated arrival time (ETA) at the parent's assigned stop
- MUST display bus status (On Time / Delayed)
- MUST show the full route with all stops on the map
- MUST highlight the parent's assigned stop

#### 5. Real-Time GPS Tracking
- MUST receive GPS coordinates from the driver's device via WebSocket
- MUST broadcast updated bus location to all connected parents watching that bus
- MUST store location history in the database
- MUST update location at least every 5 seconds during an active trip

#### 6. Route Management
- MUST support routes with multiple ordered stops
- MUST store stop name, latitude, longitude, and stop order
- MUST support the pattern: School → Stop 1 → Stop 2 → ... → School

#### 7. ETA Calculation
- MUST calculate estimated arrival time at each stop based on current bus location
- MUST use distance and average speed to estimate remaining time
- MUST update ETA every time a new GPS location is received
- MUST display ETA on parent's map view

#### 8. Delay Detection
- MUST compare actual bus position/time against expected schedule
- MUST mark a bus as "Delayed" if it is significantly behind schedule (configurable threshold, default 5 minutes)
- MUST automatically update the delay status in real time

#### 9. Parent Notifications
- MUST send a notification when a bus is marked as delayed
  - Example: "Bus 12 is currently delayed by approximately 15 minutes. Expected arrival at your stop: 8:10 AM."
- MUST send a notification when the bus is approaching the parent's stop (configurable distance threshold, default 500 meters)
  - Example: "Bus 12 is approaching your stop. Estimated arrival: 2 minutes."
- MUST store all notifications in the database
- MUST display unread notifications in the parent's interface
- SHOULD support real-time push via WebSocket in addition to stored notifications

#### 10. Live Map
- MUST display using OpenStreetMap + Leaflet.js
- MUST show: bus current location (animated marker), full route path, all stops, parent's assigned stop (highlighted), ETA at each stop
- MUST update bus marker position in real time without page refresh

#### 11. Database
- MUST use PostgreSQL
- MUST implement the following tables with proper PKs and FKs:
  - users, parents, students, drivers, buses, routes, bus_stops, student_bus_assignments, bus_locations, schedules, notifications, trips

### Non-Functional Requirements
- Backend API response time SHOULD be under 500ms for non-real-time endpoints
- WebSocket connections MUST handle reconnection gracefully
- Passwords MUST be hashed with bcrypt
- The system SHOULD be containerizable with Docker for easy deployment

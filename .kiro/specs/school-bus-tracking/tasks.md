# Implementation Tasks
## Real-Time School Bus Tracking and Parent Notification System

- [x] 1. Project Setup & Structure
  - Create backend/ and frontend/ directory structure
  - Initialize Python virtual environment
  - Create requirements.txt with all dependencies
  - Create React app with Vite
  - Set up docker-compose.yml with PostgreSQL, backend, frontend services
  - Create .env files for both backend and frontend

- [ ] 2. Database Setup & Models
  - Set up PostgreSQL connection with SQLAlchemy in database.py
  - Create all SQLAlchemy models: User, Bus, Route, BusStop, Student, StudentBusAssignment, Trip, BusLocation, Notification, Schedule
  - Set up Alembic for migrations
  - Run initial migration to create all tables
  - Seed database with sample admin user

- [ ] 3. Authentication System
  - Implement password hashing with bcrypt in security.py
  - Implement JWT token creation and verification
  - Create /auth/register endpoint (admin creates users)
  - Create /auth/login endpoint returning JWT token
  - Create get_current_user dependency with role checking
  - Test login and token validation

- [ ] 4. Admin API - Bus & Driver Management
  - Create CRUD endpoints for buses (GET, POST, PUT, DELETE /admin/buses)
  - Create CRUD endpoints for drivers (GET, POST, PUT, DELETE /admin/drivers)
  - Create endpoint to assign driver to bus (PUT /admin/buses/{id}/assign-driver)
  - Test all admin bus/driver endpoints

- [ ] 5. Admin API - Route & Stop Management
  - Create CRUD endpoints for routes (GET, POST, PUT, DELETE /admin/routes)
  - Create CRUD endpoints for bus stops within a route (POST, PUT, DELETE /admin/routes/{id}/stops)
  - Create endpoint to assign route to bus
  - Test route and stop management

- [ ] 6. Admin API - Student & Parent Management
  - Create CRUD endpoints for students and parent accounts
  - Create endpoint to assign student to bus and stop
  - Create endpoint to send announcements to parents
  - Test student/parent management

- [ ] 7. Driver API
  - Create GET /driver/me endpoint (assigned bus, route, stops)
  - Create POST /driver/trips/start endpoint (creates new trip)
  - Create POST /driver/trips/end endpoint (marks trip completed)
  - Create POST /driver/report-delay endpoint
  - Test driver trip management

- [ ] 8. WebSocket Server - GPS Tracking
  - Implement WebSocket connection manager (ws_manager.py)
  - Create WebSocket endpoint for drivers to send GPS updates
  - Create WebSocket endpoint for parents/admin to subscribe to bus updates
  - Persist each GPS update to bus_locations table
  - Broadcast location updates to all subscribed clients
  - Test WebSocket connection with a mock GPS sender

- [ ] 9. ETA Calculation Service
  - Implement Haversine distance formula
  - Implement ETA calculation for remaining stops based on current location and speed
  - Call ETA service on every GPS update received
  - Include ETA data in WebSocket broadcasts to parents
  - Test ETA accuracy with sample coordinates

- [ ] 10. Delay Detection Service
  - Implement delay detection comparing ETA vs scheduled time
  - Auto-update bus status to 'delayed' when threshold exceeded
  - Auto-revert to 'active' when bus catches up
  - Trigger notification creation on status change
  - Test delay detection with simulated late bus

- [ ] 11. Notification Service & Parent API
  - Implement notification creation for delay events
  - Implement notification creation for "approaching stop" events (within 500m)
  - Create GET /parent/notifications endpoint
  - Create PUT /parent/notifications/{id}/read endpoint
  - Push notifications to parent via WebSocket in real time
  - Create GET /parent/bus endpoint (assigned bus + current location + ETA)
  - Test notification delivery end-to-end

- [ ] 12. Admin Dashboard - React Frontend
  - Set up React project structure with React Router
  - Create AuthContext and login page
  - Create Admin Dashboard page with stats cards (total/active/delayed buses)
  - Create bus management UI (list, add, edit, delete)
  - Create route management UI with stop ordering
  - Create student/parent management UI
  - Create live bus monitoring view (table of active buses with status)
  - Test admin UI flows

- [ ] 13. Live Map - React + Leaflet
  - Install and configure Leaflet.js in React
  - Create MapView component with OpenStreetMap tiles
  - Add bus location marker (animated, updates in real time)
  - Draw route polyline on map
  - Add stop markers with labels
  - Highlight parent's assigned stop
  - Show ETA tooltip on parent's stop marker
  - Connect to WebSocket to receive live location updates and move marker
  - Test map with simulated bus movement

- [ ] 14. Parent Dashboard - React Frontend
  - Create Parent Dashboard page
  - Show assigned bus info and current status (On Time / Delayed)
  - Embed live map component
  - Show ETA at assigned stop prominently
  - Show notifications panel with unread count badge
  - Connect to WebSocket for real-time updates
  - Test full parent flow

- [ ] 15. Driver Dashboard - React Frontend
  - Create Driver Dashboard page
  - Show assigned bus and route with list of stops
  - Add "Start Trip" / "End Trip" button
  - Implement browser Geolocation API to capture GPS coordinates
  - Send GPS coordinates to backend via WebSocket every 5 seconds during active trip
  - Add "Report Delay" form
  - Test driver GPS sharing flow

- [ ] 16. Integration Testing & Bug Fixes
  - Test complete end-to-end workflow: Admin setup → Driver starts trip → GPS updates → Parent sees map → Delay detected → Notification sent
  - Fix any CORS, auth, or WebSocket connection issues
  - Verify all role-based access restrictions work correctly

- [ ] 17. Dockerization & Deployment Instructions
  - Finalize docker-compose.yml with all services
  - Write Dockerfile for backend
  - Write Dockerfile for frontend
  - Write README.md with full setup and run instructions
  - Document all environment variables
  - Provide step-by-step local deployment guide

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, admin, driver, parent, ws
from app.seed import seed_default_admin

# Create all tables on startup
Base.metadata.create_all(bind=engine)
# A new installation must have a usable account; this is idempotent and does
# not overwrite an administrator that already exists.
seed_default_admin()

app = FastAPI(
    title="School Bus Tracker API",
    description="Real-Time School Bus Tracking and Parent Notification System",
    version="1.0.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    # Include the Nginx/Docker frontend origin (http://localhost) as well as
    # the common Vite development origins.
    allow_origins=[
        "http://localhost", "http://127.0.0.1",
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(driver.router)
app.include_router(parent.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {"message": "School Bus Tracker API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

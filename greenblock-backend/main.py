from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routes import (
    sensors,
    carbon,
    hvac,
    carbon_savings,
    anomaly,
    occupancy,
    visitor,
    grid_score,
    agri,
    alerts,
    digest,
    score,
    health,
)

load_dotenv()


def _parse_allowed_origins() -> list[str]:
    """Parse comma-separated CORS origins from env.

    Example:
    ALLOWED_ORIGINS=https://greenblock.anupmazumdar.me,http://localhost:5173
    """
    raw = os.getenv("ALLOWED_ORIGINS", "*").strip()
    if not raw:
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


ALLOWED_ORIGINS = _parse_allowed_origins()

app = FastAPI(
    title="GreenBlock API",
    description="Sustainable Smart Building OS — Solar · Carbon · HVAC",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router, prefix="/api", tags=["Sensors"])
app.include_router(carbon.router, prefix="/api", tags=["Carbon"])
app.include_router(hvac.router, prefix="/api", tags=["HVAC"])
app.include_router(carbon_savings.router, prefix="/api", tags=["Carbon"])
app.include_router(anomaly.router, prefix="/api", tags=["Anomaly"])
app.include_router(occupancy.router, prefix="/api", tags=["Occupancy"])
app.include_router(visitor.router, prefix="/api", tags=["Visitor"])
app.include_router(grid_score.router, prefix="/api", tags=["Energy"])
app.include_router(agri.router, prefix="/api", tags=["Agri"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(digest.router, prefix="/api", tags=["Alerts"])
app.include_router(score.router, prefix="/api", tags=["Energy"])
app.include_router(health.router, prefix="/api", tags=["Health"])


@app.get("/")
def root():
    return {
        "project": "GreenBlock",
        "status": "running",
        "docs": "/docs"
    }
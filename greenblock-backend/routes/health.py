from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Liveness probe: API process is up."""
    return {
        "status": "ok",
        "service": "greenblock-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ready")
def readiness_check():
    """Readiness probe: app is ready to serve requests."""
    # Future extension point: check DB, external APIs, queues, etc.
    return {
        "status": "ready",
        "service": "greenblock-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

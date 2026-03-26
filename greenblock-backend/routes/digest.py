from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


@router.get("/alerts/digest")
def get_digest():
    today = datetime.utcnow().strftime("%a %b %d")
    message = (
        f"GreenBlock Morning Digest — {today}: "
        "Score B+, Solar 2.4kWh, Grid 0.8kWh, 1 anomaly handled."
    )
    return {"status": "ok", "message": message}

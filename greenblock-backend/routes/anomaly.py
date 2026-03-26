from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter()


@router.get("/anomalies")
def get_anomalies():
    now = datetime.utcnow()
    data = [
        {
            "timestamp": (now - timedelta(minutes=12)).isoformat(),
            "type": "pir_motion",
            "severity": "medium",
            "message": "Unusual movement after office hours."
        },
        {
            "timestamp": (now - timedelta(minutes=5)).isoformat(),
            "type": "solar_drop",
            "severity": "high",
            "message": "Solar output dropped sharply on clear weather."
        },
    ]
    return {"count": len(data), "data": data}

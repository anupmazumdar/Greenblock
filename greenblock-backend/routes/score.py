from datetime import datetime
from fastapi import APIRouter

router = APIRouter()


@router.get("/energy-score")
def get_energy_score():
    trend = [61, 66, 72, 74, 78]
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "score": trend[-1],
        "grade": "B+",
        "trend_30d": trend,
    }

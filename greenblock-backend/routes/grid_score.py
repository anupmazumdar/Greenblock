from fastapi import APIRouter

router = APIRouter()


@router.get("/grid-dependency")
def get_grid_dependency():
    trend = [41, 38, 31, 22, 13]
    return {
        "today_mix_percent": {"solar": 73, "battery": 14, "grid": 13},
        "today_kwh": {"solar": 2.4, "battery": 0.5, "grid": 0.4},
        "trend_percent": trend,
        "improvement": f"{trend[0] - trend[-1]}%"
    }

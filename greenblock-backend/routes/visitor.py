from fastapi import APIRouter

router = APIRouter()


@router.get("/visitor-count")
def get_visitor_count():
    weekly = {"Mon": 23, "Tue": 41, "Wed": 47, "Thu": 31, "Fri": 38, "Sat": 14, "Sun": 8}
    today = "Wed"
    return {
        "today": {"count": weekly[today], "day": today},
        "weekly": weekly,
        "peak_hour": "11:00",
    }

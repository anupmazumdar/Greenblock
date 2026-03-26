from fastapi import APIRouter

router = APIRouter()


@router.get("/occupancy-heatmap")
def get_occupancy_heatmap():
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    grid = []
    for d in range(7):
        row = []
        for h in range(24):
            if 8 <= h <= 18 and d < 5:
                row.append(round(0.45 + ((h - 8) % 4) * 0.12, 2))
            else:
                row.append(0.05)
        grid.append(row)
    return {"days": days, "hours": list(range(24)), "grid": grid}

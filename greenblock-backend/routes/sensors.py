import random
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory history store
_history: list[dict] = []


def _simulate_reading() -> dict:
    """Generate a realistic simulated sensor reading."""
    hour = datetime.now().hour
    solar_factor = max(0, 1 - abs(hour - 12) / 6)  # peaks at noon
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "temp": round(random.uniform(24.0, 31.0), 1),
        "humidity": round(random.uniform(45.0, 75.0), 1),
        "solar_v": round(random.uniform(0.5, 5.0) * solar_factor, 2),
        "solar_mw": round(random.uniform(100, 900) * solar_factor, 1),
        "occupancy": random.choice([0, 1, 1]),  # biased toward occupied
        "relay": 0,
        "source": "simulated"
    }


def _seed_history():
    """Pre-fill 24 hrs of history on first call."""
    if _history:
        return
    now = datetime.utcnow()
    for i in range(288):  # every 5 mins × 288 = 24 hrs
        ts = now - timedelta(minutes=5 * (288 - i))
        hour = ts.hour
        solar_factor = max(0, 1 - abs(hour - 12) / 6)
        _history.append({
            "timestamp": ts.isoformat(),
            "temp": round(random.uniform(24.0, 31.0), 1),
            "humidity": round(random.uniform(45.0, 75.0), 1),
            "solar_v": round(random.uniform(0.5, 5.0) * solar_factor, 2),
            "solar_mw": round(random.uniform(100, 900) * solar_factor, 1),
            "occupancy": random.choice([0, 1, 1]),
            "relay": 0,
            "source": "simulated"
        })


# --- Schemas ---

class IngestPayload(BaseModel):
    temp: float
    humidity: float
    solar_v: float
    solar_mw: float
    occupancy: int
    relay: int


class RelayCommand(BaseModel):
    relay_id: int  # 1 or 2
    state: int     # 0 = OFF, 1 = ON


# --- Endpoints ---

@router.get("/sensors")
def get_latest_sensors():
    reading = _simulate_reading()
    _history.append(reading)
    return reading


@router.get("/sensors/history")
def get_sensor_history():
    _seed_history()
    return {"count": len(_history), "data": _history[-288:]}


@router.post("/sensors/ingest")
def ingest_sensor_data(payload: IngestPayload):
    """Arduino serial bridge will POST real data here."""
    record = {
        "timestamp": datetime.utcnow().isoformat(),
        **payload.dict(),
        "source": "arduino"
    }
    _history.append(record)
    return {"status": "ok", "recorded": record}


@router.post("/relay")
def control_relay(cmd: RelayCommand):
    return {
        "status": "ok",
        "relay_id": cmd.relay_id,
        "state": "ON" if cmd.state else "OFF",
        "note": "Simulated — connect Arduino to execute physically"
    }
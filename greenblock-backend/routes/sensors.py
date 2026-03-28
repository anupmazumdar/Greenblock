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
    relay1: int = 0
    relay2: int = 0
    distance: float = -1.0
    sound: int = 0
    rain: int = 0
    co2: float = 400.0
    door_open: int = 0
    visitor_count: int = 0
    laser: int = 0
    timestamp: str = ""


class RelayCommand(BaseModel):
    relay_id: int  # 1 or 2
    state: int     # 0 = OFF, 1 = ON


# --- Endpoints ---

@router.get("/sensors")
def get_latest_sensors():
    # Return last arduino reading if available
    for record in reversed(_history):
        if record.get("source") == "arduino":
            return record
    # Fallback to simulated
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


@router.get("/forecast")
def get_solar_forecast():
    return {
        "status": "ok",
        "next_24h_kwh": [0.0, 0.0, 0.1, 0.3, 0.8, 1.2, 1.6, 1.9, 1.6, 1.0, 0.4, 0.1],
        "model": "simulated"
    }


@router.get("/rfid-log")
def get_rfid_log():
    return {
        "count": 3,
        "data": [
            {"uid": "A3F29C01", "name": "Admin", "event": "entry", "timestamp": datetime.utcnow().isoformat()},
            {"uid": "C7A11B9F", "name": "Visitor", "event": "entry", "timestamp": datetime.utcnow().isoformat()},
            {"uid": "C7A11B9F", "name": "Visitor", "event": "exit", "timestamp": datetime.utcnow().isoformat()},
        ]
    }


@router.get("/air-quality")
def get_air_quality():
    co2_ppm = random.randint(650, 1400)
    recommendation = "Ventilation required" if co2_ppm > 1200 else "Air quality acceptable"
    return {"co2_ppm": co2_ppm, "recommendation": recommendation}

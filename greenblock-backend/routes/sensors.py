import random
from datetime import datetime, timedelta
from fastapi import APIRouter
from pydantic import BaseModel
import httpx
from data_manager import get_data_manager

router = APIRouter()

# In-memory history store (for quick access; persisted to SQLite)
_history: list[dict] = []
_dm = get_data_manager()
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
NASA_LAT = 23.78
NASA_LON = 86.15


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


async def _get_nasa_irradiance_kwh_m2_day() -> float | None:
    """Fetch today's daily irradiance from NASA POWER (kWh/m^2/day)."""
    today = datetime.utcnow().strftime("%Y%m%d")
    params = {
        "parameters": "ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": NASA_LON,
        "latitude": NASA_LAT,
        "start": today,
        "end": today,
        "format": "JSON",
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            response = await client.get(NASA_POWER_URL, params=params)
            response.raise_for_status()

        payload = response.json()
        values = (
            payload.get("properties", {})
            .get("parameter", {})
            .get("ALLSKY_SFC_SW_DWN", {})
        )
        if not values:
            return None

        latest_key = sorted(values.keys())[-1]
        raw_value = values.get(latest_key)
        value = float(raw_value)

        if value < 0:
            return None
        return value
    except Exception:
        return None


def _avg_w_m2_from_daily_kwh(irradiance_kwh_m2_day: float) -> float:
    """Convert kWh/m^2/day to average W/m^2 across 24 hours."""
    return (irradiance_kwh_m2_day * 1000.0) / 24.0


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
async def get_latest_sensors():
    reading = _simulate_reading()

    if float(reading.get("solar_mw", 0) or 0) <= 0:
        irradiance_kwh = await _get_nasa_irradiance_kwh_m2_day()
        if irradiance_kwh is not None:
            avg_w_m2 = _avg_w_m2_from_daily_kwh(irradiance_kwh)
            reading["solar_mw"] = round(avg_w_m2, 1)
            reading["solar_v"] = round(max(0.5, min(5.0, avg_w_m2 / 100.0)), 2)
            reading["solar_irradiance_kwh_m2_day"] = round(irradiance_kwh, 3)
            reading["source"] = "nasa_power_fallback"

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
    # Persist to SQLite for historical queries
    _dm.store_sensor_reading(record)
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
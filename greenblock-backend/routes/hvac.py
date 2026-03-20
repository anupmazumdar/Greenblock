from datetime import datetime
from fastapi import APIRouter
import requests
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
CITY = "Jaipur"  # Change to your building's city


def _get_weather() -> dict | None:
    """Fetch current weather from OpenWeatherMap."""
    if not WEATHER_API_KEY:
        return None
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?q={CITY}&appid={WEATHER_API_KEY}&units=metric"
        res = requests.get(url, timeout=5)
        data = res.json()
        return {
            "outdoor_temp": data["main"]["temp"],
            "outdoor_humidity": data["main"]["humidity"],
            "description": data["weather"][0]["description"],
            "forecast_next_6hr": data["main"]["temp"] + 1.5  # simple approximation
        }
    except Exception:
        return None


def _get_forecast(outdoor_temp: float) -> dict:
    """Simulated 6hr forecast when weather API is unavailable."""
    hour = datetime.now().hour
    return {
        "outdoor_temp": outdoor_temp,
        "outdoor_humidity": 60,
        "description": "simulated",
        "forecast_next_6hr": outdoor_temp + 1.5
    }


def _run_rules(indoor_temp: float, indoor_humidity: float,
               occupancy: int, weather: dict) -> list[dict]:
    """Apply all 5 HVAC rules and return triggered recommendations."""
    hour = datetime.now().hour
    outdoor_temp = weather["outdoor_temp"]
    forecast_next_6hr = weather["forecast_next_6hr"]
    recommendations = []

    # Rule 1 — Pre-cool using thermal mass
    if outdoor_temp < indoor_temp - 2 and forecast_next_6hr < 28:
        recommendations.append({
            "rule": 1,
            "priority": "high",
            "action": "Pre-cool now using thermal mass.",
            "detail": "AC load drops up to 35% by peak hour.",
            "icon": "❄️"
        })

    # Rule 2 — Peak solar window
    if 9 <= hour <= 13:
        recommendations.append({
            "rule": 2,
            "priority": "high",
            "action": "Peak solar window active. Pre-cool at zero grid cost.",
            "detail": f"Best window: 10AM–12PM. Current time: {hour}:00.",
            "icon": "☀️"
        })

    # Rule 3 — Building unoccupied
    if occupancy == 0:
        recommendations.append({
            "rule": 3,
            "priority": "medium",
            "action": "Building unoccupied. Reduce HVAC to standby mode.",
            "detail": "Estimated saving: ₹180 today.",
            "icon": "🏠"
        })

    # Rule 4 — High heat, low solar
    if indoor_temp > 30:
        recommendations.append({
            "rule": 4,
            "priority": "medium",
            "action": "High indoor heat detected. Draw from battery bank.",
            "detail": "Battery power is cheaper than grid at peak hours.",
            "icon": "🔋"
        })

    # Rule 5 — High humidity
    if indoor_humidity > 70 and outdoor_temp < indoor_temp:
        recommendations.append({
            "rule": 5,
            "priority": "low",
            "action": "High humidity detected. Run dehumidifier cycle.",
            "detail": "Recommended duration: 20 minutes.",
            "icon": "💧"
        })

    return recommendations


# --- Endpoints ---

@router.get("/hvac-recommendation")
def get_hvac_recommendation(
    indoor_temp: float = 27.0,
    indoor_humidity: float = 60.0,
    occupancy: int = 1
):
    """
    Return HVAC recommendations based on live conditions.
    Pass current sensor readings as query params:
    /api/hvac-recommendation?indoor_temp=29&indoor_humidity=72&occupancy=1
    """
    weather = _get_weather() or _get_forecast(indoor_temp - 2)
    recommendations = _run_rules(indoor_temp, indoor_humidity, occupancy, weather)

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "inputs": {
            "indoor_temp": indoor_temp,
            "indoor_humidity": indoor_humidity,
            "occupancy": occupancy
        },
        "weather": weather,
        "recommendations": recommendations,
        "total_triggered": len(recommendations),
        "source": "live" if WEATHER_API_KEY else "simulated"
    }


@router.get("/weather")
def get_weather():
    """Return current weather + simple 6hr forecast."""
    weather = _get_weather()
    if not weather:
        return {
            "status": "unavailable",
            "note": "Set WEATHER_API_KEY in .env to enable live weather."
        }
    return {"status": "ok", "data": weather}
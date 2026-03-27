from fastapi import APIRouter
from pydantic import BaseModel
from data_manager import get_data_manager
import os
import random
import requests
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

_active_crop = "wheat"
_dm = get_data_manager()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OWM_CITY = os.getenv("OWM_CITY", "Jaipur")


def _get_weather_snapshot() -> dict:
    """Get weather for agri rules; fallback to simulated values if API key is missing."""
    if not WEATHER_API_KEY:
        return {
            "temp_c": 23.0,
            "humidity": 68,
            "description": "simulated",
            "source": "simulated",
        }

    try:
        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?q={OWM_CITY}&appid={WEATHER_API_KEY}&units=metric"
        )
        data = requests.get(url, timeout=5).json()
        return {
            "temp_c": float(data["main"]["temp"]),
            "humidity": int(data["main"]["humidity"]),
            "description": data["weather"][0]["description"],
            "source": "live",
        }
    except Exception:
        return {
            "temp_c": 23.0,
            "humidity": 68,
            "description": "simulated_fallback",
            "source": "simulated",
        }


class CropPayload(BaseModel):
    crop: str


@router.get("/agri/recommendation")
def get_agri_recommendation():
    """Get crop recommendation using hybrid live + Kaggle fallback."""
    rec = _dm.get_crop_recommendation()
    return {
        "crop": rec.get("crop", _active_crop),
        "yield_estimate": rec.get("yield_estimate"),
        "water_needed": rec.get("water_needed"),
        "confidence": rec.get("confidence"),
        "source": rec.get("source"),
        "recommendation": f"Optimal conditions for {rec.get('crop')}. Monitor soil moisture.",
        "risk": random.choice(["low", "medium", "high"])
    }


@router.get("/agri/irrigation-status")
def get_irrigation_status():
    """Irrigation status with hybrid soil moisture data."""
    soil = _dm.get_soil_moisture()
    moisture = soil.get("soil_moisture", 65)
    pump_status = "ON" if moisture < 50 else "OFF"
    return {
        "pump": pump_status,
        "soil_moisture": moisture,
        "source": soil.get("source"),
        "reason": f"Soil moisture {moisture}%. {'Irrigation needed.' if moisture < 50 else 'Adequate moisture.'}",
    }


@router.get("/agri/disease-risk")
def get_disease_risk():
    """Disease risk with weather-based frost and spray-window guidance."""
    soil = _dm.get_soil_moisture()
    moisture = soil.get("soil_moisture", 65)

    weather = _get_weather_snapshot()
    temp_c = weather["temp_c"]
    humidity = weather["humidity"]

    # Simple disease-risk heuristic: soil moisture + humid weather + mild temperatures.
    disease_score = 0
    if moisture > 75:
        disease_score += 2
    elif moisture > 60:
        disease_score += 1

    if humidity >= 80:
        disease_score += 2
    elif humidity >= 65:
        disease_score += 1

    if 18 <= temp_c <= 30:
        disease_score += 1

    if disease_score >= 4:
        risk_level = "high"
    elif disease_score >= 2:
        risk_level = "medium"
    else:
        risk_level = "low"

    frost_alert = temp_c <= 4
    spray_window = "avoid" if humidity >= 85 or temp_c >= 34 else "recommended"

    if risk_level == "high":
        remedy = "Neem oil 5ml + 1L water + 2 drops soap"
    elif risk_level == "medium":
        remedy = "Light bio-fungicide spray in evening + improve airflow"
    else:
        remedy = "Monitor crop and maintain drainage"

    return {
        "risk": risk_level,
        "soil_moisture": moisture,
        "weather": {
            "temp_c": temp_c,
            "humidity": humidity,
            "description": weather["description"],
            "source": weather["source"],
        },
        "source": soil.get("source", "unknown"),
        "condition": (
            f"Soil {moisture}% | Temp {temp_c}C | Humidity {humidity}%"
        ),
        "frost_alert": frost_alert,
        "spray_window": spray_window,
        "remedy": remedy,
    }


@router.post("/agri/crop")
def set_crop(payload: CropPayload):
    global _active_crop
    _active_crop = payload.crop.strip().lower() or _active_crop
    return {"status": "ok", "crop": _active_crop}


@router.get("/agri/tank-level")
def get_tank_level():
    return {"distance_cm": 42, "status": "ok"}

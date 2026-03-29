from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data_manager import get_data_manager
import os
import random
import requests
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

_active_crop = "wheat"
_dm = get_data_manager()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
OWM_CITY = os.getenv("OWM_CITY", "Jaipur")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


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


class AgriJugaadPayload(BaseModel):
    goal: str
    context: str | None = None


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


@router.post("/agri/jugaad")
async def get_jugaad_advice(payload: AgriJugaadPayload):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not configured")

    goal = payload.goal.strip()
    context = (payload.context or "").strip()
    if not goal:
        raise HTTPException(status_code=400, detail="goal is required")

    prompt = f"Goal: {goal}\n"
    if context:
        prompt += f"Context: {context}\n"
    prompt += "Give practical, low-cost, village-friendly Hinglish guidance."

    request_body = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "X-OpenRouter-Title": "GreenBlock AgriAI",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(OPENROUTER_URL, json=request_body, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {exc}") from exc

    if response.status_code >= 400:
        detail = response.text
        try:
            data = response.json()
            detail = data.get("error", {}).get("message") or detail
        except ValueError:
            pass
        raise HTTPException(status_code=response.status_code, detail=detail)

    try:
        data = response.json()
        result = data["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise HTTPException(status_code=502, detail="Invalid response from OpenRouter") from exc

    return {"result": result}

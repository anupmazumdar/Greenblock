from fastapi import APIRouter
from pydantic import BaseModel
from data_manager import get_data_manager
import random

router = APIRouter()

_active_crop = "wheat"
_dm = get_data_manager()


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
    """Disease risk assessment using soil and environmental data."""
    soil = _dm.get_soil_moisture()
    moisture = soil.get("soil_moisture", 65)
    risk_level = "high" if moisture > 75 else "medium" if moisture > 60 else "low"
    return {
        "risk": risk_level,
        "soil_moisture": moisture,
        "source": soil.get("source"),
        "condition": f"Soil moisture {moisture}% detected",
        "remedy": "Neem oil 5ml + 1L water + 2 drops soap" if risk_level == "high" else "Monitor and maintain drainage",
    }


@router.post("/agri/crop")
def set_crop(payload: CropPayload):
    global _active_crop
    _active_crop = payload.crop.strip().lower() or _active_crop
    return {"status": "ok", "crop": _active_crop}


@router.get("/agri/tank-level")
def get_tank_level():
    return {"distance_cm": 42, "status": "ok"}

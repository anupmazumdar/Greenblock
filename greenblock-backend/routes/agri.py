from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_active_crop = "wheat"


class CropPayload(BaseModel):
    crop: str


@router.get("/agri/recommendation")
def get_agri_recommendation():
    return {
        "crop": _active_crop,
        "recommendation": "Humidity high. Use neem spray in evening window.",
        "risk": "medium",
    }


@router.get("/agri/irrigation-status")
def get_irrigation_status():
    return {
        "pump": "OFF",
        "reason": "Rain detected or humidity adequate.",
    }


@router.get("/agri/disease-risk")
def get_disease_risk():
    return {
        "risk": "high",
        "condition": "Humidity > 80% and temperature in fungal band",
        "remedy": "Neem oil 5ml + 1L water + 2 drops soap",
    }


@router.post("/agri/crop")
def set_crop(payload: CropPayload):
    global _active_crop
    _active_crop = payload.crop.strip().lower() or _active_crop
    return {"status": "ok", "crop": _active_crop}


@router.get("/agri/tank-level")
def get_tank_level():
    return {"distance_cm": 42, "status": "ok"}

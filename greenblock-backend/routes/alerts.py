from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AlertPayload(BaseModel):
    message: str


@router.post("/alerts/whatsapp")
def send_whatsapp(payload: AlertPayload):
    return {"status": "queued", "channel": "whatsapp", "message": payload.message}


@router.post("/alerts/telegram")
def send_telegram(payload: AlertPayload):
    return {"status": "queued", "channel": "telegram", "message": payload.message}

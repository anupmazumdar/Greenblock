from fastapi import APIRouter
from pydantic import BaseModel
import os
from twilio.rest import Client

router = APIRouter()


class AlertPayload(BaseModel):
    message: str


@router.post("/alerts/whatsapp")
def send_whatsapp(payload: AlertPayload):
    sid = os.getenv("TWILIO_SID")
    token = os.getenv("TWILIO_TOKEN")
    from_num = os.getenv("TWILIO_FROM")
    to_num = os.getenv("ALERT_PHONE")

    if not all([sid, token, from_num, to_num]):
        return {"status": "error", "message": "Twilio not configured"}

    client = Client(sid, token)
    msg = client.messages.create(
        body=payload.message,
        from_=from_num,
        to=to_num
    )
    return {"status": "sent", "sid": msg.sid}

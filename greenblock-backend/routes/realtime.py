"""
GreenBlock — WebSocket real-time sensor endpoint.

Frontend connects to /ws/sensors for live sensor push.
Each POST to /api/sensors/ingest broadcasts to all connected clients instantly,
replacing the need to poll REST endpoints every 5s.
"""
from __future__ import annotations

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# All currently connected WebSocket clients
_clients: list[WebSocket] = []

# Latest reading — sent immediately to newly connected clients
_latest: dict | None = None


async def broadcast(reading: dict) -> None:
    """
    Push a sensor reading to all connected WebSocket clients.
    Called by routes/sensors.py on every ingest POST.
    """
    global _latest
    _latest = reading

    dead: list[WebSocket] = []
    for ws in _clients:
        try:
            await ws.send_json(reading)
        except Exception:
            dead.append(ws)

    for ws in dead:
        if ws in _clients:
            _clients.remove(ws)


@router.websocket("/ws/sensors")
async def ws_sensors(websocket: WebSocket) -> None:
    """
    Real-time sensor stream.

    Connect: ws://host/ws/sensors
    - Sends the latest cached reading immediately on connect
    - Pushes each new reading within ~100ms of Arduino ingest
    - Sends {"type":"ping"} every 30s to keep the connection alive
    """
    await websocket.accept()
    _clients.append(websocket)

    # Send current latest so the UI is not blank on first load
    if _latest:
        await websocket.send_json(_latest)

    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket in _clients:
            _clients.remove(websocket)

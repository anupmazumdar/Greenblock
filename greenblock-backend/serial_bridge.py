"""
GreenBlock — serial_bridge.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reads JSON from Arduino via USB Serial (/dev/ttyUSB0)
and POSTs it to FastAPI backend at /api/sensors/ingest

Arduino sends every 2 seconds:
{"temp":27.3,"humidity":58,"solar_v":4.1,"solar_mw":820,
 "occupancy":1,"relay1":0,"relay2":0,"distance":45,
 "sound":0,"rain":0,"co2":820,"door_open":0,
 "visitor_count":12,"laser":0}

Author : Anup Mazumdar — GreenBlock Hackathon 2026
Run    : python3 serial_bridge.py
"""

import serial
import json
import time
import requests
import logging
import os
from datetime import datetime

# ─────────────────────────────────────────────
# CONFIG  (override with env vars on Pi)
# ─────────────────────────────────────────────
SERIAL_PORT   = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
BAUD_RATE     = int(os.getenv("BAUD_RATE", "9600"))
BACKEND_URL   = os.getenv("BACKEND_URL", "http://localhost:8000")
INGEST_ENDPOINT = f"{BACKEND_URL}/api/sensors/ingest"
RETRY_DELAY   = int(os.getenv("RETRY_DELAY", "5"))      # seconds between reconnect attempts
POST_TIMEOUT  = int(os.getenv("POST_TIMEOUT", "5"))      # seconds for HTTP POST timeout
LOG_LEVEL     = os.getenv("LOG_LEVEL", "INFO")

# ─────────────────────────────────────────────
# LOGGING SETUP
# ─────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("serial_bridge")

# ─────────────────────────────────────────────
# EXPECTED SENSOR FIELDS (for validation)
# ─────────────────────────────────────────────
EXPECTED_FIELDS = {
    "temp":          float,
    "humidity":      float,
    "solar_v":       float,
    "solar_mw":      float,
    "occupancy":     int,
    "relay1":        int,
    "relay2":        int,
    "distance":      float,
    "sound":         int,
    "rain":          int,
    "co2":           float,
    "door_open":     int,
    "visitor_count": int,
    "laser":         int,
}

# ─────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────
def validate_payload(data: dict) -> dict:
    """
    Validates and coerces incoming Arduino JSON.
    - Fills missing fields with None (backend handles nulls gracefully)
    - Coerces types to match expected schema
    - Adds server-side timestamp
    Returns cleaned payload dict.
    """
    cleaned = {}
    for field, ftype in EXPECTED_FIELDS.items():
        raw = data.get(field)
        if raw is None:
            log.warning(f"Missing field: '{field}' — sending null")
            cleaned[field] = None
        else:
            try:
                cleaned[field] = ftype(raw)
            except (ValueError, TypeError):
                log.warning(f"Bad type for '{field}': {raw!r} — sending null")
                cleaned[field] = None

    # Sanity range checks (log warnings, don't drop data)
    if cleaned["temp"] is not None and not (-10 <= cleaned["temp"] <= 60):
        log.warning(f"Temp out of range: {cleaned['temp']}°C")
    if cleaned["humidity"] is not None and not (0 <= cleaned["humidity"] <= 100):
        log.warning(f"Humidity out of range: {cleaned['humidity']}%")
    if cleaned["co2"] is not None and not (300 <= cleaned["co2"] <= 5000):
        log.warning(f"CO2 out of range: {cleaned['co2']} ppm")

    # Add server timestamp
    cleaned["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return cleaned


# ─────────────────────────────────────────────
# POST TO FASTAPI
# ─────────────────────────────────────────────
def post_to_backend(payload: dict) -> bool:
    """
    POSTs sensor payload to FastAPI /api/sensors/ingest
    Returns True on success, False on failure.
    """
    try:
        response = requests.post(
            INGEST_ENDPOINT,
            json=payload,
            timeout=POST_TIMEOUT,
        )
        if response.status_code == 200:
            log.info(f"✅ Sent  →  temp={payload.get('temp')}°C  "
                     f"hum={payload.get('humidity')}%  "
                     f"solar={payload.get('solar_mw')}mW  "
                     f"co2={payload.get('co2')}ppm  "
                     f"occ={payload.get('occupancy')}")
            return True
        else:
            log.error(f"Backend returned HTTP {response.status_code}: {response.text[:200]}")
            return False
    except requests.exceptions.ConnectionError:
        log.error(f"Cannot reach backend at {INGEST_ENDPOINT} — is FastAPI running?")
        return False
    except requests.exceptions.Timeout:
        log.error(f"POST timed out after {POST_TIMEOUT}s")
        return False
    except Exception as e:
        log.error(f"Unexpected POST error: {e}")
        return False


# ─────────────────────────────────────────────
# OPEN SERIAL PORT (with retry loop)
# ─────────────────────────────────────────────
def open_serial() -> serial.Serial:
    """
    Blocks until serial port opens successfully.
    Retries every RETRY_DELAY seconds (Arduino may not be plugged in yet).
    """
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=3)
            log.info(f"🔌 Serial port opened: {SERIAL_PORT} @ {BAUD_RATE} baud")
            time.sleep(2)  # let Arduino reset after serial connect
            ser.flushInput()
            return ser
        except serial.SerialException as e:
            log.warning(f"Cannot open {SERIAL_PORT}: {e}. Retrying in {RETRY_DELAY}s...")
            time.sleep(RETRY_DELAY)


# ─────────────────────────────────────────────
# MAIN LOOP
# ─────────────────────────────────────────────
def run():
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log.info("  GreenBlock Serial Bridge — START")
    log.info(f"  Port    : {SERIAL_PORT}")
    log.info(f"  Backend : {INGEST_ENDPOINT}")
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    consecutive_errors = 0
    MAX_ERRORS = 10  # reconnect serial after this many JSON errors

    while True:
        ser = open_serial()

        try:
            while True:
                # ── Read one line from Arduino ──
                raw_line = ser.readline()

                if not raw_line:
                    log.debug("Empty line from serial — skipping")
                    continue

                raw_str = raw_line.decode("utf-8", errors="replace").strip()

                if not raw_str:
                    continue

                # ── Parse JSON ──
                try:
                    data = json.loads(raw_str)
                except json.JSONDecodeError:
                    consecutive_errors += 1
                    log.warning(f"JSON parse error ({consecutive_errors}/{MAX_ERRORS}): {raw_str!r}")
                    if consecutive_errors >= MAX_ERRORS:
                        log.error("Too many JSON errors — reconnecting serial port")
                        consecutive_errors = 0
                        break   # breaks inner while → re-opens serial
                    continue

                consecutive_errors = 0  # reset on good parse

                # ── Validate + clean ──
                payload = validate_payload(data)

                # ── POST to backend ──
                post_to_backend(payload)

        except serial.SerialException as e:
            log.error(f"Serial disconnected: {e}. Reconnecting in {RETRY_DELAY}s...")
            time.sleep(RETRY_DELAY)

        except KeyboardInterrupt:
            log.info("🛑 Stopped by user (Ctrl+C)")
            try:
                ser.close()
            except Exception:
                pass
            break

        finally:
            try:
                ser.close()
                log.info("Serial port closed.")
            except Exception:
                pass


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    run()
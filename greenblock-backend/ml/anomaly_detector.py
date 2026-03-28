"""
GreenBlock — ml/anomaly_detector.py
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IsolationForest-based anomaly detection on live sensor streams.
Fires WhatsApp alert via Twilio within 30 seconds of anomaly.

Author : Anup Mazumdar — GreenBlock Hackathon 2026
"""

import os
import logging
from datetime import datetime
from collections import deque

import numpy as np
from sklearn.ensemble import IsolationForest

log = logging.getLogger("anomaly_detector")

# ── Config ────────────────────────────────────────────────────
CONTAMINATION      = float(os.getenv("ANOMALY_THRESHOLD", "0.1"))  # 10% anomaly rate
MIN_SAMPLES        = int(os.getenv("ANOMALY_MIN_SAMPLES", "30"))    # min readings before model runs
WINDOW_SIZE        = int(os.getenv("ANOMALY_WINDOW", "100"))        # rolling window size

TWILIO_SID         = os.getenv("TWILIO_SID", "")
TWILIO_TOKEN       = os.getenv("TWILIO_TOKEN", "")
TWILIO_FROM        = os.getenv("TWILIO_FROM", "")       # whatsapp:+14155238886
ALERT_PHONE        = os.getenv("ALERT_PHONE", "")       # whatsapp:+91XXXXXXXXXX
WHATSAPP_ENABLED   = all([TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, ALERT_PHONE])

# ── In-memory anomaly log (shown on dashboard) ────────────────
_anomaly_log: list[dict] = []

# ── Rolling windows per sensor ────────────────────────────────
_windows: dict[str, deque] = {
    "temp":     deque(maxlen=WINDOW_SIZE),
    "humidity": deque(maxlen=WINDOW_SIZE),
    "co2":      deque(maxlen=WINDOW_SIZE),
    "solar_mw": deque(maxlen=WINDOW_SIZE),
}

# ── IsolationForest models per sensor ────────────────────────
_models: dict[str, IsolationForest] = {}

# ── Alert cooldown — avoid spam (per sensor, seconds) ────────
_last_alert: dict[str, datetime] = {}
ALERT_COOLDOWN_SEC = 300  # 5 minutes between alerts per sensor


# ── WhatsApp Alert ────────────────────────────────────────────
def _send_whatsapp(message: str) -> bool:
    """Send WhatsApp alert via Twilio. Returns True on success."""
    if not WHATSAPP_ENABLED:
        log.warning("WhatsApp not configured — skipping alert")
        return False
    try:
        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        client.messages.create(
            body=message,
            from_=TWILIO_FROM,
            to=ALERT_PHONE,
        )
        log.info(f"📱 WhatsApp alert sent: {message[:60]}...")
        return True
    except Exception as e:
        log.error(f"WhatsApp send failed: {e}")
        return False


def _cooldown_ok(sensor: str) -> bool:
    """Returns True if enough time has passed since last alert."""
    last = _last_alert.get(sensor)
    if last is None:
        return True
    delta = (datetime.utcnow() - last).total_seconds()
    return delta >= ALERT_COOLDOWN_SEC


def _fire_alert(sensor: str, value: float, message: str):
    """Log anomaly + send WhatsApp if cooldown allows."""
    record = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "sensor":    sensor,
        "value":     round(value, 2),
        "message":   message,
        "severity":  "high",
        "alerted":   False,
    }

    if _cooldown_ok(sensor):
        record["alerted"] = _send_whatsapp(f"⚠️ GreenBlock Alert\n{message}\nValue: {value:.1f}\nTime: {datetime.now().strftime('%H:%M')}")
        _last_alert[sensor] = datetime.utcnow()

    _anomaly_log.append(record)
    # Keep last 50 anomalies
    if len(_anomaly_log) > 50:
        _anomaly_log.pop(0)

    log.warning(f"🚨 ANOMALY [{sensor}] = {value:.2f} — {message}")


# ── Train / Update Model ──────────────────────────────────────
def _get_model(sensor: str) -> IsolationForest | None:
    """Return trained model for sensor, or None if not enough data."""
    window = _windows[sensor]
    if len(window) < MIN_SAMPLES:
        return None

    if sensor not in _models:
        _models[sensor] = IsolationForest(
            contamination=CONTAMINATION,
            random_state=42,
            n_estimators=50,
        )

    X = np.array(list(window)).reshape(-1, 1)
    _models[sensor].fit(X)
    return _models[sensor]


# ── Alert Messages per sensor ─────────────────────────────────
ALERT_MESSAGES = {
    "temp": {
        "high": "🌡️ Temperature spike detected — possible HVAC fault or fire risk.",
        "low":  "🌡️ Temperature drop detected — heating system may have failed.",
    },
    "humidity": {
        "high": "💧 Humidity spike — fungal/mold risk. Check ventilation.",
        "low":  "💧 Humidity too low — equipment or crop stress possible.",
    },
    "co2": {
        "high": "🌫️ CO2 spike — poor ventilation. Open windows or run exhaust fan.",
        "low":  "🌫️ CO2 unusually low — sensor may be faulty.",
    },
    "solar_mw": {
        "high": "☀️ Unexpected solar spike — inverter check recommended.",
        "low":  "☀️ Solar output low on clear day — panel may be dusty or shaded.",
    },
}

def _get_alert_message(sensor: str, value: float, window: deque) -> str:
    mu = float(np.mean(list(window)))
    direction = "high" if value > mu else "low"
    msgs = ALERT_MESSAGES.get(sensor, {})
    return msgs.get(direction, f"Anomaly detected on {sensor}: {value:.1f}")


# ── Main Entry Point ──────────────────────────────────────────
def process_reading(reading: dict) -> list[dict]:
    """
    Call this with every new sensor reading from Arduino.
    Updates rolling windows, runs IsolationForest, fires alerts.
    Returns list of anomalies detected in this reading (may be empty).
    """
    detected = []

    sensors_to_check = {
        "temp":     reading.get("temp", 0.0),
        "humidity": reading.get("humidity", 0.0),
        "co2":      reading.get("co2", 400.0),
        "solar_mw": reading.get("solar_mw", 0.0),
    }

    for sensor, value in sensors_to_check.items():
        # Skip zero/null values (sensor not connected)
        if value is None or value == 0.0:
            continue

        # Add to rolling window
        _windows[sensor].append(value)

        # Get/train model
        model = _get_model(sensor)
        if model is None:
            continue  # not enough data yet

        # Predict
        X = np.array([[value]])
        prediction = model.predict(X)[0]  # -1 = anomaly, 1 = normal
        score = model.score_samples(X)[0]

        if prediction == -1:
            msg = _get_alert_message(sensor, value, _windows[sensor])
            _fire_alert(sensor, value, msg)
            detected.append({
                "sensor":  sensor,
                "value":   value,
                "score":   round(float(score), 4),
                "message": msg,
            })

    return detected


# ── API helpers ───────────────────────────────────────────────
def get_anomaly_log() -> list[dict]:
    """Return last 50 anomalies for dashboard."""
    return list(reversed(_anomaly_log))


def get_window_stats() -> dict:
    """Return current window stats for debugging."""
    stats = {}
    for sensor, window in _windows.items():
        if len(window) > 0:
            arr = list(window)
            stats[sensor] = {
                "count": len(arr),
                "mean":  round(float(np.mean(arr)), 2),
                "std":   round(float(np.std(arr)), 2),
                "min":   round(float(np.min(arr)), 2),
                "max":   round(float(np.max(arr)), 2),
            }
    return stats
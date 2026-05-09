"""
GreenBlock — serial_bridge.py  (Raspberry Pi 4 edition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Two operating modes — set SENSOR_MODE env var:

  SENSOR_MODE=serial  (default)
    Reads JSON from Arduino via USB serial and POSTs to FastAPI.
    Arduino sends every ~2 s:
      {"temp":27.3,"humidity":58,"solar_v":4.1,"solar_mw":820,
       "occupancy":1,"relay":0,"co2":820}

  SENSOR_MODE=gpio
    Reads sensors directly from RPi 4 GPIO / I2C pins — no Arduino needed:
      DHT22    → GPIO_DHT_PIN   (default GPIO 4)
      INA219   → I2C bus 1 (SDA GPIO 2, SCL GPIO 3)
      PIR      → GPIO_PIR_PIN  (default GPIO 17)
      MH-Z19B  → CO2_UART_PORT (/dev/ttyS0)
      Relay    → GPIO_RELAY1_PIN / GPIO_RELAY2_PIN (GPIO 23/24)

Run:
    python3 serial_bridge.py                      # serial mode
    SENSOR_MODE=gpio python3 serial_bridge.py     # GPIO mode

Author : Anup Mazumdar — GreenBlock 2026
"""

import json
import logging
import os
import time
from datetime import datetime

import requests

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
SENSOR_MODE     = os.getenv("SENSOR_MODE",    "serial")   # "serial" | "gpio"
SERIAL_PORT     = os.getenv("SERIAL_PORT",    "auto")     # "auto" detects first available
BAUD_RATE       = int(os.getenv("BAUD_RATE",  "9600"))
BACKEND_URL     = os.getenv("BACKEND_URL",    "http://localhost:8000")
INGEST_ENDPOINT = f"{BACKEND_URL}/api/sensors/ingest"
RETRY_DELAY     = int(os.getenv("RETRY_DELAY",  "5"))
POST_TIMEOUT    = int(os.getenv("POST_TIMEOUT", "5"))
READ_INTERVAL   = float(os.getenv("READ_INTERVAL", "2.0"))  # GPIO poll interval (s)
LOG_LEVEL       = os.getenv("LOG_LEVEL", "INFO")

# BCM GPIO pin assignments
GPIO_DHT_PIN    = int(os.getenv("GPIO_DHT_PIN",    "4"))
GPIO_PIR_PIN    = int(os.getenv("GPIO_PIR_PIN",    "17"))
GPIO_RELAY1_PIN = int(os.getenv("GPIO_RELAY1_PIN", "23"))
GPIO_RELAY2_PIN = int(os.getenv("GPIO_RELAY2_PIN", "24"))
CO2_UART_PORT   = os.getenv("CO2_UART_PORT", "/dev/ttyS0")

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s  [%(levelname)s]  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("serial_bridge")

# ─────────────────────────────────────────────────────────────
# OPTIONAL RPi LIBRARY DETECTION
# ─────────────────────────────────────────────────────────────
try:
    import board
    import adafruit_dht
    DHT_AVAILABLE = True
except ImportError:
    DHT_AVAILABLE = False

try:
    import adafruit_ina219
    import busio
    INA_AVAILABLE = True
except ImportError:
    INA_AVAILABLE = False

try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(GPIO_PIR_PIN,    GPIO.IN)
    GPIO.setup(GPIO_RELAY1_PIN, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(GPIO_RELAY2_PIN, GPIO.OUT, initial=GPIO.LOW)
    RPI_GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    RPI_GPIO_AVAILABLE = False

try:
    import mh_z19
    CO2_AVAILABLE = True
except ImportError:
    CO2_AVAILABLE = False

# ─────────────────────────────────────────────────────────────
# VALIDATION
# ─────────────────────────────────────────────────────────────
EXPECTED_FIELDS = {
    "temp":      float,
    "humidity":  float,
    "solar_v":   float,
    "solar_mw":  float,
    "occupancy": int,
    "relay":     int,
}


def validate_payload(data: dict) -> dict:
    """Validate and coerce sensor data. Unknown/extra fields pass through."""
    cleaned: dict = {}
    for field, ftype in EXPECTED_FIELDS.items():
        raw = data.get(field)
        if raw is None:
            cleaned[field] = None
        else:
            try:
                cleaned[field] = ftype(raw)
            except (ValueError, TypeError):
                log.warning(f"Bad type for '{field}': {raw!r} — sending null")
                cleaned[field] = None

    if cleaned.get("temp") is not None and not (-10 <= cleaned["temp"] <= 60):
        log.warning(f"Temp out of range: {cleaned['temp']}°C")
    if cleaned.get("humidity") is not None and not (0 <= cleaned["humidity"] <= 100):
        log.warning(f"Humidity out of range: {cleaned['humidity']}%")

    # Pass through optional extended fields
    for opt in ("co2", "soil_moisture", "distance", "rain", "visitor_count", "source"):
        if opt in data:
            cleaned[opt] = data[opt]

    cleaned["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return cleaned


# ─────────────────────────────────────────────────────────────
# HTTP POST TO FASTAPI
# ─────────────────────────────────────────────────────────────
def post_to_backend(payload: dict) -> bool:
    try:
        resp = requests.post(INGEST_ENDPOINT, json=payload, timeout=POST_TIMEOUT)
        if resp.status_code == 200:
            co2_str = f"  co2={payload.get('co2')}ppm" if payload.get("co2") else ""
            log.info(
                f"OK  temp={payload.get('temp')}°C  "
                f"hum={payload.get('humidity')}%  "
                f"solar={payload.get('solar_mw')}mW  "
                f"occ={payload.get('occupancy')}{co2_str}"
            )
            return True
        log.error(f"Backend HTTP {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.exceptions.ConnectionError:
        log.error(f"Cannot reach {INGEST_ENDPOINT} — is FastAPI running?")
        return False
    except requests.exceptions.Timeout:
        log.error(f"POST timeout after {POST_TIMEOUT}s")
        return False
    except Exception as exc:
        log.error(f"POST error: {exc}")
        return False


# ─────────────────────────────────────────────────────────────
# SERIAL MODE
# ─────────────────────────────────────────────────────────────
_SERIAL_CANDIDATES = [
    "/dev/ttyUSB0", "/dev/ttyUSB1",
    "/dev/ttyACM0", "/dev/ttyACM1",
    "/dev/ttyS0",
    "COM3", "COM4", "COM5",
]


def _detect_serial_port() -> str:
    if SERIAL_PORT != "auto":
        return SERIAL_PORT

    try:
        import serial.tools.list_ports
        ports = [p.device for p in serial.tools.list_ports.comports()]
        if ports:
            log.info(f"Auto-detected serial ports: {ports}")
            return ports[0]
    except Exception:
        pass

    for candidate in _SERIAL_CANDIDATES:
        if os.path.exists(candidate):
            return candidate

    return _SERIAL_CANDIDATES[0]


def open_serial():
    import serial
    port = _detect_serial_port()
    while True:
        try:
            ser = serial.Serial(port, BAUD_RATE, timeout=3)
            log.info(f"Serial opened: {port} @ {BAUD_RATE} baud")
            time.sleep(2)   # allow Arduino to reset after connect
            ser.flushInput()
            return ser
        except Exception as exc:
            log.warning(f"Cannot open {port}: {exc} — retrying in {RETRY_DELAY}s…")
            time.sleep(RETRY_DELAY)


def run_serial() -> None:
    import serial

    log.info(f"Serial mode  port={_detect_serial_port()}  backend={INGEST_ENDPOINT}")
    consecutive_errors = 0
    MAX_ERRORS = 10

    while True:
        ser = open_serial()
        try:
            while True:
                raw = ser.readline()
                if not raw:
                    continue
                raw_str = raw.decode("utf-8", errors="replace").strip()
                if not raw_str:
                    continue

                try:
                    data = json.loads(raw_str)
                except json.JSONDecodeError:
                    consecutive_errors += 1
                    log.warning(f"JSON error ({consecutive_errors}/{MAX_ERRORS}): {raw_str!r}")
                    if consecutive_errors >= MAX_ERRORS:
                        log.error("Too many JSON errors — reconnecting serial port")
                        consecutive_errors = 0
                        break
                    continue

                consecutive_errors = 0
                post_to_backend(validate_payload(data))

        except serial.SerialException as exc:
            log.error(f"Serial disconnected: {exc} — reconnecting in {RETRY_DELAY}s…")
            time.sleep(RETRY_DELAY)
        except KeyboardInterrupt:
            log.info("Stopped by user (Ctrl+C)")
            try:
                ser.close()
            except Exception:
                pass
            return
        finally:
            try:
                ser.close()
            except Exception:
                pass


# ─────────────────────────────────────────────────────────────
# GPIO MODE — direct RPi 4 sensor reads
# ─────────────────────────────────────────────────────────────

def _read_dht22() -> tuple[float | None, float | None]:
    if not DHT_AVAILABLE:
        return None, None
    try:
        pin = getattr(board, f"D{GPIO_DHT_PIN}")
        dht = adafruit_dht.DHT22(pin, use_pulseio=False)
        temp = dht.temperature
        hum  = dht.humidity
        dht.exit()
        return temp, hum
    except Exception as exc:
        log.debug(f"DHT22: {exc}")
        return None, None


def _read_ina219() -> tuple[float | None, float | None]:
    if not INA_AVAILABLE:
        return None, None
    try:
        i2c     = busio.I2C(board.SCL, board.SDA)
        ina     = adafruit_ina219.INA219(i2c)
        voltage = round(ina.bus_voltage + ina.shunt_voltage / 1000, 3)
        power   = round(ina.power * 1000, 1)   # W → mW
        return voltage, power
    except Exception as exc:
        log.debug(f"INA219: {exc}")
        return None, None


def _read_pir() -> int:
    if not RPI_GPIO_AVAILABLE:
        return 0
    try:
        return int(GPIO.input(GPIO_PIR_PIN))
    except Exception:
        return 0


def _read_co2() -> float | None:
    if not CO2_AVAILABLE:
        return None
    try:
        result = mh_z19.read_all(serial_console_untouched=True)
        return float(result["co2"]) if result and "co2" in result else None
    except Exception:
        return None


def run_gpio() -> None:
    log.info(
        f"GPIO mode  DHT={GPIO_DHT_PIN}  PIR={GPIO_PIR_PIN}  "
        f"RELAY={GPIO_RELAY1_PIN}/{GPIO_RELAY2_PIN}  backend={INGEST_ENDPOINT}"
    )

    if not any([DHT_AVAILABLE, INA_AVAILABLE, RPI_GPIO_AVAILABLE]):
        log.warning(
            "No RPi libraries found. Install on the Pi:\n"
            "  pip install adafruit-circuitpython-dht adafruit-circuitpython-ina219 "
            "RPi.GPIO mh-z19 adafruit-blinka"
        )

    while True:
        try:
            temp, hum         = _read_dht22()
            solar_v, solar_mw = _read_ina219()
            occupancy         = _read_pir()
            co2               = _read_co2()

            data: dict = {
                "temp":      temp      if temp      is not None else 0.0,
                "humidity":  hum       if hum       is not None else 0.0,
                "solar_v":   solar_v   if solar_v   is not None else 0.0,
                "solar_mw":  solar_mw  if solar_mw  is not None else 0.0,
                "occupancy": occupancy,
                "relay":     0,
                "source":    "rpi_gpio",
            }
            if co2 is not None:
                data["co2"] = co2

            post_to_backend(validate_payload(data))

        except KeyboardInterrupt:
            log.info("Stopped by user (Ctrl+C)")
            if RPI_GPIO_AVAILABLE:
                GPIO.cleanup()
            return
        except Exception as exc:
            log.error(f"GPIO read cycle error: {exc}")

        time.sleep(READ_INTERVAL)


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    log.info("  GreenBlock Serial Bridge — START")
    log.info(f"  Mode    : {SENSOR_MODE.upper()}")
    log.info(f"  Backend : {INGEST_ENDPOINT}")
    log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    if SENSOR_MODE == "gpio":
        run_gpio()
    else:
        run_serial()

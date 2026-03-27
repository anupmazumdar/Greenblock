# 🌿 GreenBlock — Smart IoT AgriTech + Building Management System

## 📌 Project Overview

GreenBlock ek ₹1,100 ke hardware se pura AgriTech ecosystem deta hai.
Solo built by Anup Mazumdar | MCA Student, UEM Jaipur | Intern @ Briztech Infosystems

---

## 🔧 Hardware Setup

- Raspberry Pi (hostname: greenblock)
- Arduino (connected via `/dev/ttyACM0`)
- DHT22 — Temperature + Humidity sensor
- INA219 — Solar voltage/current sensor
- Soil moisture sensor
- Relay modules (irrigation control)
- Total cost: ~₹1,100

---

## 🖥️ Two Modes

### 🏗️ Building Mode

- Energy Dashboard
- Carbon Tracker
- HVAC Control
- Access Log

### 🌾 Kisaan Mode

- 🧠 AI Farm Advisor
- 🔧 Jugaad Toolkit
- 🛒 Sasta Bazaar
- 🌿 Organic Guide
- 📅 Season Planner
- 📊 My Farm Stats

---

## ✅ Setup Progress

### Phase 1 — Pi Configuration

- [x] Raspberry Pi setup (hostname: greenblock)
- [x] I2C + SPI + Serial enabled via raspi-config
- [x] Python libraries installed
- [x] Mosquitto MQTT Broker installed + running
- [x] Arduino detected at `/dev/ttyACM0`

### Phase 2 — GitHub

- [x] SSH key generated + added to GitHub
- [x] Repo cloned: `git@github.com:anupmazumdar/Greenblock.git`

### Phase 3 — Kaggle Data Pipeline

- [x] Kaggle CLI installed
- [x] `kaggle.json` configured (`~/.kaggle/kaggle.json`)
- [x] PATH updated (`~/.bashrc`)
- [x] Datasets downloaded to `~/GreenBlock/data/kaggle/`
- [x] crop-recommendation-dataset (atharvaingle) — soil + crop data
- [x] rainfall-in-india (rajanand) — Indian rainfall historical
- [ ] energy-consumption-dataset (robikscube) — pending
- [ ] maize-crop-dataset — 403 forbidden (private dataset)

---

## 📦 Python Libraries Installed

```text
pyserial paho-mqtt requests influxdb-client
adafruit-circuitpython-ina219 RPi.GPIO smbus2
twilio APScheduler anthropic
kaggle six
```

---

## 🗂️ Project Structure

```text
GreenBlock/
├── arduino/
├── greenblock-backend/
│   ├── data/
│   ├── ml/
│   └── requirements.txt
├── greenblock-frontend/
│   ├── src/
│   └── dist/
└── README.md
```

---

## 🚀 Quick Start

### 1) Backend Run (FastAPI)

```bash
cd greenblock-backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend docs open at: `http://localhost:8000/docs`

### 2) Frontend Run (Vite + React)

```bash
cd greenblock-frontend
npm install
npm run dev
```

Frontend opens at: `http://localhost:5173`

### 3) Production-like Commands

```bash
# Frontend build
cd greenblock-frontend
npm run build
npm run preview

# Backend procfile equivalent
cd greenblock-backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 🔐 Environment Variables

Backend now includes a usable `greenblock-backend/.env.example` template:

```env
# Weather API (required for live weather, otherwise simulated mode)
WEATHER_API_KEY=
OWM_CITY=Jaipur

# Serial bridge settings (for Arduino bridge script)
SERIAL_PORT=/dev/ttyACM0
BAUD_RATE=9600
BACKEND_URL=http://localhost:8000
RETRY_DELAY=5
POST_TIMEOUT=5
LOG_LEVEL=INFO
```

Notes:

- If `WEATHER_API_KEY` is missing, `/api/weather` falls back to simulated data.
- For Arduino on Pi, `SERIAL_PORT` is often `/dev/ttyACM0`.

---

## 🔗 Key API Endpoints

Base: `/api`

### Core Sensors & Energy

- `GET /sensors`
- `GET /sensors/history`
- `POST /sensors/ingest`
- `POST /relay`
- `GET /forecast`
- `GET /air-quality`
- `GET /grid-dependency`
- `GET /energy-score`

### Carbon & Materials

- `GET /materials`
- `POST /materials`
- `GET /carbon-summary`
- `GET /carbon-savings`

### HVAC & Weather

- `GET /hvac-recommendation`
- `GET /weather`

### Occupancy, Visitor, Access

- `GET /occupancy-heatmap`
- `GET /visitor-count`
- `GET /rfid-log`

### Agri Mode

- `GET /agri/recommendation`
- `GET /agri/irrigation-status`
- `GET /agri/disease-risk`
- `POST /agri/crop`
- `GET /agri/tank-level`

### Alerts

- `POST /alerts/whatsapp`
- `POST /alerts/telegram`
- `GET /alerts/digest`

### Quick curl Examples

```bash
# 1) Live sensor snapshot
curl http://localhost:8000/api/sensors

# 2) HVAC recommendation
curl "http://localhost:8000/api/hvac-recommendation?indoor_temp=29&indoor_humidity=72&occupancy=1"

# 3) Add carbon material log
curl -X POST http://localhost:8000/api/materials \
  -H "Content-Type: application/json" \
  -d '{"material_name":"fly_ash_brick","quantity_kg":500}'

# 4) Agri disease risk with frost/spray guidance
curl http://localhost:8000/api/agri/disease-risk
```

---

## 🧩 System Architecture

```text
Sensors (DHT22, INA219, Soil, PIR, Rain, RFID)
  |
  v
Arduino -> Serial Bridge (optional) -> FastAPI Backend (/api)
  |                                  |
  |                                  +-> Rules/ML modules
  |                                  +-> SQLite (greenblock_analytics.db)
  |                                  +-> External APIs (OpenWeather etc.)
  v
React Frontend (Vite) <--------------------+
```

---

## 🔌 Services Running

| Service | Status | Command |
| --- | --- | --- |
| Mosquitto | ✅ Active | `sudo systemctl status mosquitto` |
| Arduino | ✅ `/dev/ttyACM0` | `ls /dev/ttyACM*` |

---

## 🧭 Status Legend & Pending Tracker

Legend:

- `✅` Done
- `⏳` Pending
- `⛔` Blocked

- Kaggle Pipeline: energy-consumption-dataset download — `⏳`
  Next: Download and validate schema.
- Kaggle Pipeline: maize-crop-dataset access — `⛔`
  Next: Replace with a public alternative dataset.
- Integrations: NASA POWER API — `⏳`
  Next: Add solar-radiation service endpoint.
- Integrations: data.gov.in mandi prices — `⏳`
  Next: Add mandi price fetch + cache.
- Integrations: OpenWeatherMap alert rules — `⏳`
  Next: Add frost and spray-window logic.
- Integrations: GraminMart API — `⏳`
  Next: Add payload contract and integration.
- Docs: architecture diagram image — `⏳`
  Next: Add diagram in `docs/` and link it.

---

## 📡 Planned Integrations

- NASA POWER API — Solar radiation by GPS
- data.gov.in — Daily mandi prices
- OpenWeatherMap — Frost alerts, spray window
- GraminMart API — Sensor-verified organic marketplace

---

## 🏆 Pitch Impact

| Metric | Target |
| --- | --- |
| Input cost reduction | 40-60% |
| Yield improvement | 20-35% |
| Water savings | 40% |
| Extra income/farmer/season | ₹15,000-25,000 |

---

## 👤 Author

- **Anup Mazumdar**
- GitHub: [https://github.com/anupmazumdar](https://github.com/anupmazumdar)
- LinkedIn: [https://www.linkedin.com/in/anup-mazumdar-1033b5321](https://www.linkedin.com/in/anup-mazumdar-1033b5321)
- Project: GreenBlock + GraminMart = India ka pehla sensor-verified organic marketplace

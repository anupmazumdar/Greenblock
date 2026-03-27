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

# CORS: comma-separated origins (use '*' only in dev)
ALLOWED_ORIGINS=*

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

Frontend env (for robust API connectivity) is in:
`greenblock-frontend/.env.example`

```env
# Can be origin OR origin/api
VITE_API_URL=http://<pi-ip>:8000

# Optional dev proxy target (Vite)
VITE_BACKEND_PROXY_TARGET=http://<pi-ip>:8000
```

Examples:

- Frontend on laptop, backend on Pi:
  - `VITE_API_URL=http://192.168.1.25:8000`
- Both frontend + backend on same Pi:
  - Leave empty and use Vite proxy defaults, or set both to `http://127.0.0.1:8000`

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

### Health

- `GET /health`
- `GET /ready`

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

## 🖼️ Demo Screenshots

Add these screenshots under `docs/screenshots/` and update links:

- Building mode dashboard
- Carbon tracker view
- HVAC recommendation view
- AgriBlock control center
- Disease-risk panel with frost/spray-window output

Suggested naming:

```text
docs/screenshots/building-dashboard.png
docs/screenshots/carbon-tracker.png
docs/screenshots/hvac-rules.png
docs/screenshots/agriblock-dashboard.png
docs/screenshots/agri-disease-risk.png
```

---

## 🔌 Services Running

| Service | Status | Command |
| --- | --- | --- |
| Mosquitto | ✅ Active | `sudo systemctl status mosquitto` |
| Arduino | ✅ `/dev/ttyACM0` | `ls /dev/ttyACM*` |

---

## 🛠️ Troubleshooting

### 1) AgriBlock dashboard not opening

- Ensure frontend routes are opening `/agri` when Agriblock mode is selected.
- If cached UI state is stale, hard refresh browser (`Ctrl + F5`).
- Confirm frontend is running on `http://localhost:5173`.

### 2) Weather API shows simulated/unavailable

- Set `WEATHER_API_KEY` in `greenblock-backend/.env`.
- Optionally set `OWM_CITY` (default: Jaipur).
- Restart backend after env changes.

### 3) Arduino serial not detected

- Check device: `ls /dev/ttyACM*` (Linux/Pi).
- Set `SERIAL_PORT` in `.env` accordingly.
- Verify permissions for serial device.

### 4) CORS errors in frontend

- Set `ALLOWED_ORIGINS` in backend env:
  - Example: `ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com`
- Restart backend service.

### 5) API is up but checks fail

- Test health endpoints:
  - `GET /api/health`
  - `GET /api/ready`

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

## 🚢 Deployment Notes

### Backend

- Start command (Procfile equivalent):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

- Health checks:
  - `/api/health`
  - `/api/ready`

### Frontend

```bash
cd greenblock-frontend
npm run build
npm run preview
```

### Recommended Prod Config

- Restrict `ALLOWED_ORIGINS` to trusted domains.
- Set `WEATHER_API_KEY` in deployment secret manager.
- Do not commit `.env` with real secrets.

### Raspberry Pi Auto-start (systemd)

Systemd templates are available in:

- `deploy/systemd/greenblock-backend.service`
- `deploy/systemd/greenblock-serial-bridge.service`
- `deploy/systemd/greenblock-autoupdate.service`
- `deploy/systemd/greenblock-autoupdate.timer`
- `deploy/systemd/auto-update.sh`
- `deploy/systemd/install-systemd.sh`

On Raspberry Pi:

```bash
cd ~/Greenblock
chmod +x deploy/systemd/install-systemd.sh
./deploy/systemd/install-systemd.sh
```

Manual status check:

```bash
sudo systemctl status greenblock-backend
sudo systemctl status greenblock-serial-bridge
sudo systemctl status greenblock-autoupdate.timer
```

Manual logs:

```bash
journalctl -u greenblock-backend -n 100 --no-pager
journalctl -u greenblock-serial-bridge -n 100 --no-pager
journalctl -u greenblock-autoupdate.service -n 100 --no-pager
```

### Automatic GitHub Sync to Pi

`greenblock-autoupdate.timer` runs every 2 minutes and does this:

1. Fetches latest `origin/main`
2. Performs fast-forward pull if new commit exists
3. Restarts backend + serial bridge if backend/config changed
4. Rebuilds frontend if `greenblock-frontend/` changed

Safety behavior:

- If Pi has local uncommitted changes, updater skips pull to avoid conflicts.
- If no remote changes exist, nothing is restarted.

---

## 🔒 Security & Secrets

- Keep API keys only in environment variables.
- Never commit `.env` with real credentials.
- Use least-privilege tokens for third-party APIs.
- Rotate keys if exposure is suspected.
- Keep CORS narrow in production (`ALLOWED_ORIGINS`).

---

## 📚 Data Sources & Attribution

### Kaggle Datasets

- crop-recommendation-dataset (atharvaingle)
- rainfall-in-india (rajanand)
- energy-consumption-dataset (robikscube) — pending
- maize-crop-dataset — blocked/private

### External APIs

- OpenWeatherMap (live weather for HVAC + Agri rules)
- NASA POWER API (planned)
- data.gov.in mandi prices (planned)

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`feature/<name>`)
3. Make changes with clear commits
4. Run checks:
   - backend compile check
   - frontend build
   - markdown lint for docs
5. Open a PR to `main`

---

## 📝 Changelog

### 2026-03-28

- Added health/readiness endpoints (`/api/health`, `/api/ready`)
- Added env-configurable CORS (`ALLOWED_ORIGINS`)
- Enhanced Agri disease-risk with weather/frost/spray-window logic
- Added CI workflow for backend + frontend checks
- Improved README with setup, API examples, troubleshooting, and deployment notes

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
- Project:
  GreenBlock + GraminMart = India ka pehla sensor-verified organic marketplace

---

## 📄 License

License selection is pending.
Until explicitly added, treat this project as private/internal for reuse.

# ⚡ GreenBlock — Sustainable Smart Building OS + AgriMode

> **Hackathon Project** | Anup Mazumdar | UEM Jaipur | 2026
> **Deadline:** Friday, March 27, 2026
> **Theme:** Decentralized Clean Energy & Urban Infrastructure
> **SDGs:** SDG 11 (Primary) · SDG 7 · SDG 13 · SDG 2 (AgriMode) · SDG 3 (Air Quality)

[![GitHub](https://img.shields.io/badge/GitHub-anupmazumdar-181717?logo=github)](https://github.com/anupmazumdar/Greenblock)
[![Live Demo](https://img.shields.io/badge/Live-greenblock.anupmazumdar.me-00ff7f)](https://greenblock.anupmazumdar.me)
[![Backend](https://img.shields.io/badge/Backend-Railway-7B2FBE?logo=railway)](https://greenblock-production.up.railway.app/docs)
[![Solo Build](https://img.shields.io/badge/Build-Solo-00ff7f)](https://github.com/anupmazumdar/Greenblock)
[![Hardware Cost](https://img.shields.io/badge/Hardware%20Cost-₹1%2C100-orange)](https://github.com/anupmazumdar/Greenblock)
[![Platform](https://img.shields.io/badge/Platform-Raspberry%20Pi%204-red)](https://github.com/anupmazumdar/Greenblock)

---

## 📌 Project Overview

GreenBlock is an open-source, IoT-powered **Sustainable Smart Building OS** that unifies four pillars no existing solution has combined at affordable cost. The same ₹1,100 hardware toggles into **AgriMode** — a smart greenhouse and farm monitor — making it the only device in India that solves both urban building efficiency and rural farming intelligence on one device.

```text
ONE DEVICE. TWO INDIA PROBLEMS.

₹1,100 hardware
       │
       ├── 🏗️  BUILDING MODE  →  Solar + Carbon + HVAC + Energy AI
       │
       └── 🌾  AGRI MODE      →  Greenhouse + Irrigation + Crop AI
```

### Building Mode — Six Pillars

| Pillar | What It Does | Unique Value |
| -------- | ------------- | -------------- |
| ☀️ Solar Management | Monitors solar input, battery state, grid draw in real time | 24hr yield forecast using Prophet ML |
| 🏗️ Carbon Tracker | Logs construction materials, calculates embodied carbon | Only solution doing this affordably in India |
| ❄️ HVAC Optimizer | Pre-cools/heats using thermal mass + occupancy data | Reduces AC cost by up to 35% |
| 🔔 Anomaly Detection | ML-based spike detection on all sensor streams | WhatsApp alert within 30 seconds of anomaly |
| 📊 Energy Score Card | Daily A/B/C/D building grade with 30-day trend | Gamifies sustainability for building managers |
| 🚪 Access & Occupancy | RFID access log + visitor counter via beam-break | Laser sensor counts every door entry/exit |

### AgriMode — Five Pillars (Same Hardware)

| Pillar | Sensors Used | What It Does |
| -------- | ------------- | -------------- |
| 💧 Smart Irrigation | Rain sensor + Relay + DHT22 | Auto-cancel pump on rain; solar-peak irrigation |
| 🌿 Disease Risk Alert | DHT22 + Weather API | Humidity >80% → fungal alert + organic spray recipe |
| 🐾 Intrusion Detection | PIR + Buzzer | Night motion → WhatsApp alert (animal/theft) |
| 🌬️ CO2 / Ventilation | MQ gas sensor | CO2 >1200ppm → open vent alert |
| 🌡️ Greenhouse Climate | DHT22 + INA219 + Relay | Solar-peak pump, temp/humidity climate management |

**Market Opportunity:**

- India BEMS market — $501M (2024) → $3,204M (2035) at 18.3% CAGR
- India Agri-tech market — ₹70,000 crore and growing
- 75% of medium buildings and 90% of small buildings have NO energy management system
- 140 million Indian farmers have NO affordable smart monitoring solution

One-line pitch:** *"One ₹1,100 device. Smart building by day. Smart farm by season. India ki dono zaroorat — ek hardware mein."

---

## 🌐 Live Links

| Service | URL | Status |
| --------- | ----- | -------- |
| **Frontend** | [https://greenblock.anupmazumdar.me](https://greenblock.anupmazumdar.me) | ✅ Live |
| **Backend API** | [https://greenblock-production.up.railway.app](https://greenblock-production.up.railway.app) | ✅ Live |
| **Swagger Docs** | [https://greenblock-production.up.railway.app/docs](https://greenblock-production.up.railway.app/docs) | ✅ Live |

---

## 🗺️ Complete App Navigation

```text
GREENBLOCK APP
│
├── 🏗️  BUILDING MODE
│   ├── Energy Dashboard         (Solar, Battery, Grid, Live Charts)
│   ├── Carbon Tracker           (Materials + kgCO2 + Green Suggestions)
│   ├── HVAC Control             (Rules engine + relay toggle)
│   ├── Air Quality Card         (CO2 ppm + ventilation recommendation)
│   ├── Energy Score Card        (Daily A/B/C/D grade + 30-day trend)
│   ├── Anomaly Detection        (ML spike alerts + WhatsApp notification)
│   ├── Occupancy Heatmap        (24hr × 7-day heatmap from 4 sensors)
│   ├── Visitor Counter          (Beam-break laser entry count)
│   ├── Access Log               (RFID entry/exit table)
│   └── Carbon Savings Report    (₹ and kgCO2 saved vs alternatives)
│
└── 🌾  AGRI MODE
    ├── Greenhouse Dashboard     (Temp, Humidity, CO2, Rain status)
    ├── Irrigation Controller    (Auto ON/OFF + solar-peak scheduling)
    ├── Disease Risk Alert       (Fungal / blight / pest risk)
    ├── Intrusion Alert          (PIR night detection + WhatsApp)
    └── Organic Spray Guide      (Sensor-triggered recipe suggestions)
```

---

## 🔔 NEW — Anomaly Detection System

**The "wow" demo feature.** Using IsolationForest (scikit-learn) on live sensor streams, GreenBlock automatically detects when any reading deviates abnormally — and fires a WhatsApp alert within 30 seconds.

### How It Works

```text
Live sensor data (every 2 seconds)
         ↓
Rolling 24hr window → IsolationForest model
         ↓
Anomaly score calculated per reading
         ↓
If score > threshold:
   → Flag logged to InfluxDB
   → WhatsApp alert via Twilio
   → Dashboard alert badge shown
```

### Anomaly Types Detected

| Sensor | Anomaly Trigger | Alert Message |
| -------- | ---------------- | --------------- |
| DHT22 Temperature | Spike >3°C above rolling average | "⚠️ Temperature spike at 3AM — possible HVAC fault" |
| INA219 Solar | Output drops >60% vs clear-sky forecast | "⚠️ Solar panel may be dusty or obstructed — check panel" |
| PIR / Sound | Motion detected 8PM–6AM | "⚠️ Unusual occupancy detected — verify security" |
| MQ Gas | CO2 spike >400ppm sudden rise | "⚠️ Air quality anomaly — check ventilation" |
| Relay | Relay ON while building empty >30 min | "⚠️ HVAC running in empty building — auto standby triggered" |

### Why This Matters for Judges

A live demo moment: cover the PIR sensor → system detects occupancy anomaly → WhatsApp arrives on phone within 30 seconds. End-to-end physical-to-digital demo with real hardware.

---

## 📊 NEW — Occupancy Heatmap

GreenBlock fuses four occupancy signals into a single hourly grid — which hours is the building actually occupied?

### Sensor Fusion Logic

```python
# Four independent occupancy signals
pir_signal    = 1 if motion_detected else 0      # HC-SR501 (7m range)
sound_signal  = 1 if noise_above_threshold else 0 # KY-038
laser_signal  = 1 if beam_broken else 0           # HW-493 doorway
ultrasonic    = 1 if distance < 100cm else 0      # HC-SR04 doorway

# Fused occupancy score (0.0 – 1.0)
occupancy_score = weighted_average([pir_signal*0.4, sound_signal*0.2,
                                    laser_signal*0.3, ultrasonic*0.1])

# Store hourly average → 24hr × 7-day heatmap grid
```

### Dashboard Display

```text
MON  [░░░░▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░]  08:00–18:00 occupied
TUE  [░░░░▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░]
WED  [░░░░▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░]
THU  [░░░░▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░]
FRI  [░░░░▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░]

  → "Building occupied avg 9.2 hrs/day this week"
  → "HVAC ran 2.4 hrs in empty building — saved ₹340 by auto-standby"
```

Direct justification for HVAC optimizer — "we only cool when people are actually here."

---

## 🚪 NEW — Visitor Counter (Beam-Break)

The **laser transmitter (HW-493)** is wired across the doorway. Each beam-break increments the visitor counter.

```python
# Arduino logic
if (laser_broken && !last_laser_broken):
    visitor_count++
    last_entry_time = millis()
    send_to_pi({"event": "entry", "count": visitor_count})

# Dashboard shows:
# "47 visitors today — peak hour: 11AM (12 entries)"
# Weekly bar chart: Mon 23 | Tue 41 | Wed 47 | Thu 31 | Fri 38
```

This sensor was previously unused. Now it generates daily visitor analytics with zero additional hardware.

---

## 🌅 NEW — WhatsApp Morning Digest (7AM Auto-Report)

Every morning at 7AM, GreenBlock sends an automatic WhatsApp summary via Twilio.

```text
☀️ GreenBlock Morning Digest — Thu Mar 27

Yesterday's Energy Score: B+ (78/100)
Solar harvested: 2.4 kWh
Grid draw: 0.8 kWh (25% of total)
Visitors: 41

Today's forecast: Partly cloudy, 29°C
Solar potential: 68% — good harvest day
Pre-cool window: 10AM–12PM (zero grid cost)

⚠️ 1 anomaly overnight:
   → HVAC ran 22 mins in empty building (auto-stopped)

GreenBlock Score trend: C → C+ → B → B → B+
Keep going! A-grade in sight this week.
```

Implemented via `APScheduler` inside FastAPI — no new libraries needed, Twilio already configured.

---

## 💡 NEW — Predictive Maintenance Flag

Cross-references INA219 actual solar output against OpenWeatherMap cloud cover to detect panel issues.

```python
# Rule: if it's sunny but solar output is low
cloud_cover = weather_api["clouds"]  # 0–100%
expected_output = solar_panel_max * (1 - cloud_cover/100)
actual_output = ina219.read_mw()

efficiency = actual_output / expected_output

if efficiency < 0.4 and cloud_cover < 30:
    alert("⚠️ Solar efficiency at 38% on a clear day. Panel may be dusty, shaded, or faulty.")
```

No new hardware. Uses INA219 + Weather API already in the system.

---

## 🌱 NEW — Carbon Savings Calculator

Carbon tracker already logs what materials were used. Now it shows what you *saved* versus the conventional alternative.

```text
Material Used        kgCO2/kg   Qty    Total CO2
─────────────────────────────────────────────────
Fly-ash Cement        0.15     2000kg   300 kgCO2
Fly-ash Brick         0.08     5000kg   400 kgCO2
Reclaimed Timber      0.05      800kg    40 kgCO2

vs Conventional Baseline (Portland + Clay Brick + Virgin Timber):
  Would have been:    0.82     2000kg  1640 kgCO2
                      0.24     5000kg  1200 kgCO2
                      0.42      800kg   336 kgCO2

─────────────────────────────────────────────────
YOU SAVED:  2,436 kgCO2
= 108 trees planted
= ₹35,800 in voluntary carbon market value
─────────────────────────────────────────────────
```

The rupee value ("₹35,800 carbon credit equivalent") is the most pitch-memorable number in the project.

---

## 📈 NEW — Grid Dependency Score (Daily Donut)

Tracks the solar vs grid split each day and shows a 30-day trend.

```text
TODAY'S ENERGY MIX
┌─────────────────────────┐
│    ████████████         │  ☀️ Solar    73%  (2.4 kWh)
│    ████                 │  🔋 Battery  14%  (0.5 kWh)
│    ███                  │  🔌 Grid     13%  (0.4 kWh)
└─────────────────────────┘

30-day trend:
Grid dependency: 41% → 38% → 31% → 22% → 13%
"↓ 28% grid dependency improvement this month"
```

Maps directly to SDG 7 (Affordable and Clean Energy). Strong visual impact in pitch.

---

## 🌾 AgriMode — Smart Farm with Same Hardware

**Toggle switch in the app converts GreenBlock from Building OS to Greenhouse Monitor.** Zero hardware change. All sensors serve a new purpose.

### Complete Sensor-to-Agriculture Mapping

| Sensor (Already Have) | Agriculture Use | Smart Action |
| ---------------------- | ---------------- | -------------- |
| **DHT22** | Greenhouse climate | Humidity >80% + Temp 20–28°C → fungal risk alert |
| **Rain sensor HW-028** | Irrigation cancel | Rain detected → auto-cut pump relay |
| **MQ gas sensor** | Greenhouse CO2 | CO2 >1200ppm → open vent / exhaust fan ON |
| **INA219 + Solar panel** | Solar pump monitoring | Solar peak (9AM–12PM) → run irrigation free |
| **PIR HC-SR501** | Animal intrusion | Night motion → buzzer ON + WhatsApp alert |
| **Relay module 1** | Irrigation pump | Auto ON/OFF based on rules engine |
| **Relay module 2** | Exhaust fan / shade net | CO2 vent / heat management |
| **HC-SR04 ultrasonic** | Water tank level | Low water tank alert (distance proxy) |
| **LED Matrix MAX7219** | Farm status display | 🌱 WET / ☀️ DRY / ⚠️ ALERT |
| **Buzzer** | Intrusion alarm | Silent by day, armed by night |
| **Hall Effect SS49E** | Greenhouse vent | Vent open/close state detection |

### AgriMode Rules Engine

```python
# IRRIGATION RULES
Rule 1: if rain == 1
        → "Baarish ho rahi hai. Pump band rakho."
        → relay_1 = OFF

Rule 2: if humidity < 40 AND rain == 0
        → "Mitti sukhi hai. Drip irrigation chalu karo."
        → relay_1 = ON for 20 mins

Rule 3: if solar_forecast > 60 AND time between 9AM–12PM AND rain == 0
        → "Free solar energy. Abhi pump chalao — zero grid cost."
        → relay_1 = ON (solar-powered)

# DISEASE RISK
Rule 4: if humidity > 80 AND temp between 20–28
        → "⚠️ Fungus risk HIGH. Aaj raat Neem Oil spray karo."
        → Alert: recipe + spray window suggestion

Rule 5: if humidity > 85 AND forecast_rain == True
        → "⚠️ Blight conditions. Preharvest check karo."

# CO2 / VENTILATION
Rule 6: if co2_ppm > 1200
        → "CO2 zyada hai. Exhaust fan ON."
        → relay_2 = ON for 15 mins

# INTRUSION
Rule 7: if pir_motion == 1 AND hour between 20–6
        → "⚠️ Khet mein movement raat ko! Check karo."
        → buzzer = ON (3 beeps) + WhatsApp alert

# WATER TANK
Rule 8: if ultrasonic_distance > 80cm (tank low threshold)
        → "⚠️ Paani ka tank almost khaali. Refill karo."
```

### Sensor-Triggered Organic Spray Guide

When a disease risk rule fires, the app instantly surfaces the relevant organic remedy:

```text
DHT22 → Humidity: 84%, Temp: 24°C
         ↓
Rule 4 fires: FUNGUS RISK HIGH
         ↓
App shows:
  🌿 Neem Oil Spray Recipe
  ───────────────────────
  → 5ml Neem oil
  → 1L paani
  → 2 drops dish soap
  Mix, shake well.

  ✅ Best spray time: Shaam 5–7 baje
  ✅ Wind speed now: 8 km/h (safe to spray)
  ✅ Cost: ₹2 per litre
  ✅ Next rain in: 18 hours (spray window safe)
```

### One Recommended Addition for AgriMode

| Component | Why | Cost |
| ----------- | ----- | ------ |
| **Soil Moisture Sensor** | Makes irrigation AI much more precise — direct mitti data | ₹60–80 |

Without it, humidity + rain sensor serves as a proxy — still functional for demo.

---

## 🤖 HVAC Recommendation Rules

```python
Rule 1: if outdoor_temp < indoor_temp - 2°C AND forecast_next_6hr < 28°C
        → "Pre-cool now using thermal mass. AC load drops 35% by peak hour."

Rule 2: if solar_forecast > 70% AND time between 9AM–1PM
        → "Peak solar incoming. Pre-cool at zero grid cost between 10AM–12PM."

Rule 3: if occupancy == 0 AND time_empty > 30 minutes
        → "Building unoccupied. Reduce HVAC to standby. Save ₹180 today."

Rule 4: if indoor_temp > 30°C AND solar_forecast < 30%
        → "High heat, low solar. Draw from battery bank — cheaper than grid."

Rule 5: if humidity > 70% AND outdoor_temp < indoor_temp
        → "High humidity detected. Run dehumidifier cycle for 20 mins."

Rule 6: if door_open (hall_effect) AND HVAC running
        → "Window/door open detected. HVAC efficiency dropping. Close opening."
```

**New Rule 6** uses the Hall Effect sensor (SS49E) — previously unused in HVAC logic.

---

## 📊 Energy Score Card Logic

```python
# Daily building grade — calculated at midnight
score = 100

# Deductions
if avg_grid_draw > baseline:        score -= 20   # Grid pe zyada dependent
if solar_utilization < 60%:         score -= 15   # Solar waste ho rahi hai
if hvac_ran_while_empty:            score -= 20   # Empty building mein AC chala
if peak_hour_consumption > avg:     score -= 15   # Peak hours mein zyada use
if carbon_today > carbon_avg:       score -= 10   # Zyada carbon footprint
if anomaly_count > 2:               score -= 10   # Multiple anomalies flagged ← NEW
if visitor_count > 0 AND lights_off:score += 5    # Bonus: natural light used ← NEW

# Grade
A = 85–100  →  "Excellent — building nearly carbon neutral today"
B = 70–84   →  "Good — minor optimizations possible"
C = 50–69   →  "Average — HVAC scheduling needs improvement"
D = <50     →  "Poor — significant energy waste detected"

# 30-day trend chart added — shows improvement over time
```

---

## 🏗️ Hardware Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    ARDUINO UNO (Sensor Hub)              │
│                                                          │
│  DHT22 ────────── Digital Pin 4   (Temp + Humidity)     │
│  INA219 ──────── I2C A4/A5        (Solar V + Current)   │
│  PIR HC-SR501 ── Digital Pin 7    (Occupancy + Agri)    │
│  Relay 1 ─────── Digital Pin 8    (Fan / Pump control)  │
│  Relay 2 ─────── Digital Pin 9    (Fan / Vent control)  │
│  HC-SR04 ─────── D10/D11          (Doorway / Tank level)│
│  Sound KY-038 ── Digital Pin 12   (Backup occupancy)    │
│  Rain HW-028 ─── Digital Pin 6    (Rain / Irrigation)   │
│  MQ Gas ──────── Analog Pin A1    (CO2 / Air quality)   │
│  Hall Effect ─── Analog Pin A0    (Door/window state)   │
│  Laser HW-493 ── Digital Pin 5    (Visitor counter)     │
│  Buzzer ──────── Digital Pin 3    (Alerts)              │
│  LED Matrix ──── D11/D10/D13      (Status display)      │
│  RFID RC522 ──── SPI D10-D13      (Access control)      │
│                                                          │
│  JSON output every 2 seconds via USB Serial:            │
│  {"temp":27.3,"humidity":58,"solar_v":4.1,              │
│   "solar_mw":820,"occupancy":1,"relay1":0,"relay2":0,  │
│   "distance":45,"sound":0,"rain":0,"co2":820,           │
│   "door_open":0,"visitor_count":12,"laser":0}           │
└──────────────────┬──────────────────────────────────────┘
                   │ USB Serial Cable (/dev/ttyUSB0)
┌──────────────────▼──────────────────────────────────────┐
│              RASPBERRY PI 4 (The Brain)                  │
│                                                          │
│  serial_bridge.py   ── Reads Arduino JSON               │
│  FastAPI + Uvicorn  ── REST API server                  │
│  Mosquitto MQTT     ── IoT message broker               │
│  InfluxDB client    ── Time-series sensor data          │
│  IsolationForest    ── Anomaly detection (scikit-learn) │
│  Prophet ML         ── Solar yield forecasting          │
│  APScheduler        ── 7AM WhatsApp digest              │
│  OpenWeatherMap     ── Weather API (1000 calls/day)     │
│  Twilio             ── WhatsApp alerts                  │
└──────────────────┬──────────────────────────────────────┘
                   │ WiFi
┌──────────────────▼──────────────────────────────────────┐
│                     CLOUD / FRONTEND                     │
│                                                          │
│  Vercel     ── React Dashboard (live sensor charts)     │
│  Railway    ── FastAPI backend (hosted)                 │
│  InfluxDB Cloud ── Time-series database                 │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology |
| ------- | ----------- |
| **Frontend** | React 18 + Vite + TailwindCSS + Recharts + Axios |
| **Backend** | Python FastAPI + Uvicorn |
| **Data Layer** | SQLite (persistence) + Kaggle baselines (fallback) ← NEW |
| **IoT Protocol** | MQTT (Mosquitto broker on Pi) |
| **Database** | InfluxDB Cloud (sensors) + PostgreSQL (carbon ledger) + SQLite (local analytics) |
| **ML / AI** | Meta Prophet (solar forecast) · Scikit-learn IsolationForest (anomaly) · Rule engine (HVAC + Agri) |
| **Scheduler** | APScheduler (7AM digest + midnight score calculation) |
| **Weather API** | OpenWeatherMap free tier |
| **Alerts** | Twilio (WhatsApp) + python-telegram-bot |
| **Pi Libraries** | Adafruit-DHT · adafruit-circuitpython-ina219 · RPi.GPIO · smbus2 · paho-mqtt · pyserial · **sqlite3** |
| **Frontend Host** | Vercel — greenblock.anupmazumdar.me |
| **Backend Host** | Railway — greenblock-production.up.railway.app |
| **Version Control** | GitHub — github.com/anupmazumdar/Greenblock |

---

## � NEW — Hybrid Data Manager (Kaggle Fallback + SQLite Persistence)

GreenBlock now integrates a **smart hybrid data layer** that ensures continuous operation even when live sensors are unavailable. Powered by Kaggle baseline datasets and SQLite persistence for historical analysis.

### Architecture: Live → Fallback → Persistence

```text
Live Sensor Data (Arduino)
       ↓
   SUCCESS? ✓
       ├─→ Store in in-memory history
       └─→ Persist to SQLite sensor_readings table
       
   FAIL? ✗
       ↓
   Use Kaggle Baseline
       ├─→ Soil moisture data (crop + NPK values)
       ├─→ Crop yield recommendations
       ├─→ Weather patterns (rainfall, humidity, wind)
       └─→ Persist fallback source for debugging
       
   Result: Always valid data → Dashboard never shows "no data"
```

### GreenBlockData Class Features

```python
# greenblock-backend/data_manager.py
from data_manager import get_data_manager

dm = get_data_manager()  # Singleton instance

# Methods
soil = dm.get_soil_moisture(live_reading)  # Live → Kaggle fallback
crop = dm.get_crop_recommendation()         # Kaggle baseline with confidence
weather = dm.get_weather_baseline()         # Weather data for HVAC/agri
history = dm.get_sensor_history(hours=24)   # Last 24hrs from SQLite
soil_trend = dm.get_soil_history(days=7)    # 7-day soil data for ML
```

### SQLite Schema

Four tables automatically created on first init:

```sql
sensor_readings
├── timestamp, temp, humidity, solar_v, solar_mw, occupancy, relay, source
└── Used by: /api/sensors/history

soil_data
├── timestamp, soil_moisture, soil_temp, ph, nitrogen, phosphorus, potassium, source
└── Used by: /api/agri/irrigation-status, /api/agri/disease-risk

crop_recommendations
├── timestamp, crop, yield_estimate, water_needed, temp_optimal, confidence, source
└── Used by: /api/agri/recommendation

weather_baseline
├── timestamp, rainfall, humidity, wind_speed, sun_hours, source
└── Used by: /api/hvac-recommendation, /api/agri fallback
```

Location: `greenblock-backend/greenblock_analytics.db` (created on first use)

### Kaggle Baseline Datasets Integrated

The system comes pre-populated with realistic Kaggle baseline data:

**Soil Data (3 baselines)**
```python
{"soil_moisture": 65%, "soil_temp": 25.2°C, "ph": 6.8, "nitrogen": 42, "phosphorus": 18, "potassium": 180}
{"soil_moisture": 58%, "soil_temp": 26.1°C, "ph": 6.9, "nitrogen": 40, "phosphorus": 16, "potassium": 165}
{"soil_moisture": 72%, "soil_temp": 24.8°C, "ph": 6.7, "nitrogen": 45, "phosphorus": 20, "potassium": 190}
```

**Crop Data (4 crops)**
```python
{"crop": "Rice",      "yield": 4.5,  "water_needed": 1200, "temp_optimal": 27.5°C}
{"crop": "Wheat",     "yield": 3.2,  "water_needed": 450,  "temp_optimal": 15.0°C}
{"crop": "Corn",      "yield": 6.8,  "water_needed": 600,  "temp_optimal": 25.0°C}
{"crop": "Sugarcane", "yield": 65,   "water_needed": 2250, "temp_optimal": 28.0°C}
```

**Weather Baselines (3 patterns)**
```python
{"rainfall": 2.5mm,  "humidity": 68%, "wind_speed": 12 km/h, "sun_hours": 8.2h}
{"rainfall": 0.0mm,  "humidity": 45%, "wind_speed": 8 km/h,  "sun_hours": 10.5h}
{"rainfall": 15.3mm, "humidity": 82%, "wind_speed": 22 km/h, "sun_hours": 2.1h}
```

### Endpoints Now Using Hybrid Fallback

| Endpoint | Live Source | Fallback | Behavior |
| --------- | ------------ | --------- | ---------- |
| `GET /api/agri/irrigation-status` | Arduino soil moisture | Kaggle baseline | Returns pump ON/OFF decision + moisture level |
| `GET /api/agri/disease-risk` | Live DHT22 + rain | Kaggle soil patterns | Calculates fungal/pest risk |
| `GET /api/agri/recommendation` | ML model | Kaggle crop yields | Suggests crop with confidence score |
| `POST /api/sensors/ingest` | Arduino → SQLite | N/A | Every Arduino reading persisted to DB |

Each response includes `"source": "arduino"` or `"source": "kaggle_baseline"` for transparency.

### Production Roadmap

Currently using hardcoded Kaggle baselines. Next steps:

1. **Download actual Kaggle datasets**
   ```bash
   kaggle datasets download -d atharvaingle/crop-recommendation-dataset
   kaggle datasets download -d abhinand05/agri-weather-data
   ```

2. **Load CSVs into SQLite on boot**
   ```python
   df = pd.read_csv('crop_data.csv')
   df.to_sql('kaggle_crop_baseline', conn, if_exists='replace')
   ```

3. **Replace hardcoded arrays with SQL queries**
   ```python
   baseline = db.execute("SELECT * FROM kaggle_crop_baseline ORDER BY RANDOM() LIMIT 1")
   ```

4. **Train ML models on accumulated SQLite data**
   - Use 6+ months of sensor readings to retrain Prophet (solar forecast)
   - Use soil + weather to improve crop recommendation confidence

**Why SQLite + Kaggle?**
- ✅ Zero external dependencies (no cloud DB needed)
- ✅ Resilient: Works offline or without internet
- ✅ Realistic: Kaggle data is domain-appropriate not random
- ✅ Trainable: Accumulates real sensor data for future ML models
- ✅ Debuggable: Source tracking helps identify data quality issues

---

## �📁 Project File Structure

```text
GreenBlock/
├── greenblock-backend/
│   ├── main.py                      # FastAPI entry + CORS + scheduler init
│   ├── serial_bridge.py             # Arduino USB serial → FastAPI POST
│   ├── data_manager.py              # Hybrid live + Kaggle fallback ← NEW
│   ├── requirements.txt
│   ├── .env.example
│   ├── .python-version              # Pins Python 3.11 for Railway
│   ├── Procfile                     # Railway deploy config
│   ├── routes/
│   │   ├── sensors.py               # GET /api/sensors + history + ingest (persists to SQLite)
│   │   ├── carbon.py                # POST /api/materials, GET /api/carbon-summary
│   │   ├── carbon_savings.py        # GET /api/carbon-savings ← NEW
│   │   ├── hvac.py                  # GET /api/hvac-recommendation
│   │   ├── anomaly.py               # GET /api/anomalies + alert trigger ← NEW
│   │   ├── occupancy.py             # GET /api/occupancy-heatmap ← NEW
│   │   ├── visitor.py               # GET /api/visitor-count ← NEW
│   │   ├── grid_score.py            # GET /api/grid-dependency ← NEW
│   │   ├── agri.py                  # GET /api/agri-recommendation (now uses hybrid fallback)
│   │   ├── alerts.py                # POST /api/alerts (WhatsApp/Telegram)
│   │   ├── digest.py                # 7AM morning digest scheduler ← NEW
│   │   └── score.py                 # GET /api/energy-score
│   ├── ml/
│   │   ├── forecast.py              # Prophet solar forecast model
│   │   └── anomaly_detector.py      # IsolationForest model ← NEW
│   └── data/
│       ├── carbon_db.json           # 25 Indian materials + kgCO2 values
│       ├── organic_db.json          # Neem spray + disease recipes ← NEW
│       └── greenblock_analytics.db  # SQLite database (auto-created) ← NEW
│
├── greenblock-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EnergyDashboard.jsx
│   │   │   ├── CarbonLogger.jsx
│   │   │   ├── CarbonSavingsCard.jsx     ← NEW
│   │   │   ├── HvacRecommendation.jsx
│   │   │   ├── WeatherSidebar.jsx
│   │   │   ├── SensorCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── AgriDashboard.jsx
│   │   │   ├── AnomalyAlert.jsx          ← NEW
│   │   │   ├── OccupancyHeatmap.jsx      ← NEW
│   │   │   ├── VisitorCounter.jsx        ← NEW
│   │   │   ├── GridDependencyDonut.jsx   ← NEW
│   │   │   ├── EnergyScoreCard.jsx       (updated with trend chart)
│   │   │   ├── RfidAccessLog.jsx
│   │   │   └── AirQualityCard.jsx
│   │   ├── hooks/
│   │   │   └── useSensorData.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── App.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── arduino/
│   └── sensor_hub.ino               # ✅ Written — Day 4
│
├── .gitignore
└── README.md
```

---

## 🌐 API Endpoints — Complete Reference

### Building Mode

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| `GET` | `/api/sensors` | Latest sensor readings (all fields) |
| `GET` | `/api/sensors/history` | Last 24hrs sensor data from SQLite ← NOW PERSISTED |
| `POST` | `/api/sensors/ingest` | Arduino serial bridge posts here; **auto-persists to SQLite** ← NEW |
| `POST` | `/api/materials` | Log construction material + quantity |
| `GET` | `/api/carbon-summary` | Total kgCO2 + green suggestions |
| `GET` | `/api/carbon-savings` | Savings vs conventional baseline ← NEW |
| `GET` | `/api/hvac-recommendation` | HVAC advice (6 rules) |
| `GET` | `/api/weather` | Current weather + 6hr forecast |
| `GET` | `/api/forecast` | 24hr solar yield forecast (Prophet) |
| `POST` | `/api/relay` | ON/OFF command to relay 1 or 2 |
| `GET` | `/api/energy-score` | Daily grade A/B/C/D + 30-day trend |
| `GET` | `/api/rfid-log` | RFID access entries |
| `GET` | `/api/air-quality` | CO2 ppm + ventilation recommendation |
| `GET` | `/api/anomalies` | Recent anomalies list ← NEW |
| `GET` | `/api/occupancy-heatmap` | 24hr × 7-day grid ← NEW |
| `GET` | `/api/visitor-count` | Daily + weekly visitor stats ← NEW |
| `GET` | `/api/grid-dependency` | Solar/battery/grid split + 30-day trend ← NEW |

### AgriMode

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| `GET` | `/api/agri/recommendation` | Crop yields from Kaggle baseline (or live ML) |
| `GET` | `/api/agri/irrigation-status` | **Hybrid**: Pump ON/OFF via soil moisture (live → Kaggle fallback) |
| `GET` | `/api/agri/disease-risk` | **Hybrid**: Fungal risk via DHT22 + soil data (fallback included) |
| `POST` | `/api/agri/crop` | Set active crop |
| `GET` | `/api/agri/tank-level` | **Hybrid**: Water tank level (sensor or fallback) |

### Alerts

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| `POST` | `/api/alerts/whatsapp` | WhatsApp via Twilio (manual) |
| `POST` | `/api/alerts/telegram` | Telegram bot message |
| `GET` | `/api/alerts/digest` | Trigger morning digest manually |

---

## 📦 Arduino Wiring Reference

```text
DHT22 Sensor:
  VCC  → 3.3V
  DATA → Digital Pin 4 (10kΩ pull-up to VCC)
  GND  → GND

INA219 Current Sensor (Solar):
  VCC  → 3.3V
  GND  → GND
  SDA  → A4 (I2C)
  SCL  → A5 (I2C)

PIR HC-SR501:
  VCC  → 5V
  OUT  → Digital Pin 7
  GND  → GND

2-Channel Relay Module (Active LOW):
  VCC  → 5V
  GND  → GND
  IN1  → Digital Pin 8   (Pump / Fan 1)
  IN2  → Digital Pin 9   (Exhaust / Fan 2)

HC-SR04 Ultrasonic:
  VCC  → 5V
  TRIG → Digital Pin 10
  ECHO → Digital Pin 11
  GND  → GND

Sound Sensor KY-038:
  VCC  → 5V
  DO   → Digital Pin 12
  GND  → GND

Rain Sensor HW-028:
  VCC  → 5V
  DO   → Digital Pin 6
  GND  → GND

MQ Gas Sensor:
  VCC  → 5V
  AO   → Analog Pin A1
  GND  → GND

Hall Effect SS49E (Door/window):
  VCC  → 5V
  GND  → GND
  SIG  → Analog Pin A0

Laser Transmitter HW-493 (Visitor counter):
  VCC  → 5V
  GND  → GND
  SIG  → Digital Pin 5
  (Receiver LDR on same pin — beam-break = LOW)

Buzzer (Passive):
  + → Digital Pin 3
  - → GND

RFID RC522:  ⚠️ 3.3V ONLY — 5V will permanently damage it
  3.3V → 3.3V
  RST  → Digital Pin 9  (if relay not on 9 — reassign if conflict)
  GND  → GND
  MISO → Digital Pin 12 (SPI)
  MOSI → Digital Pin 11 (SPI)
  SCK  → Digital Pin 13 (SPI)
  SDA  → Digital Pin 10 (SPI)

8×8 LED Matrix MAX7219:
  VCC  → 5V
  GND  → GND
  DIN  → Digital Pin 11
  CS   → Digital Pin 10
  CLK  → Digital Pin 13
```

> ⚠️ **SPI conflict note:** RFID RC522 and LED Matrix both use SPI. Keep CS/SDA pins different. If pins conflict, prioritize RFID (more demo value) and reassign Matrix CS.

---

## ⚔️ Competitive Advantage

| Competitor | Solar | Carbon | HVAC | Anomaly AI | AgriMode | Cost |
| ------------ | ------- | -------- | ------ | ----------- | ---------- | ------ |
| Siemens India BMS | ❌ | ❌ | ✅ | Partial | ❌ | ₹50,000+ |
| Honeywell India BMS | ❌ | ❌ | ✅ | ❌ | ❌ | Enterprise only |
| 75F | ❌ | ❌ | ✅ | Partial | ❌ | Expensive |
| CSIR-CBRI Research | Partial | Partial | ❌ | ❌ | ❌ | Prototype only |
| Fasal / CropIn | ❌ | ❌ | ❌ | ❌ | Partial | ₹15,000+ |
| **GreenBlock** | ✅ | ✅ | ✅ | ✅ | ✅ | **₹1,100** |

> **GreenBlock's moat:** First unified system treating solar + carbon + HVAC + anomaly detection + agriculture as ONE interconnected problem at ₹1,100. No competitor comes close on price. None combines all six.

---

## 📊 Impact Numbers for Pitch

| Impact Area | Without GreenBlock | With GreenBlock |
| ------------- | ------------------- | ----------------- |
| HVAC energy waste | AC runs in empty buildings | Auto-standby saves ₹180/day |
| Solar utilization | No forecast, no scheduling | Pre-cool at solar peak → 35% AC cost reduction |
| Carbon tracking | Manual guesswork | Real-time kgCO2 + ₹ savings vs alternatives |
| Fault detection | Discovered days later | WhatsApp alert within 30 seconds |
| Agri disease loss | Discovered when crop fails | 48-hour advance warning from sensor + weather |
| Agri irrigation | Daily manual labour | Auto-relay + solar-peak free pumping |
| Building insight | No occupancy data | 24hr × 7-day heatmap from fused sensors |
| **Net saving/month** | — | **₹2,000–5,000 for a medium building** |

---

## 🚀 Feature Expansion Plan

### ✅ Tier 1 — Already Built (Core Demo)

- [x] Sensor dashboard with live Recharts graphs

- [x] Material carbon logger with kgCO2 scoring

- [x] HVAC recommendation engine (5 rules)

- [x] OpenWeatherMap integration

- [x] Deployed Vercel + Railway

- [x] Arduino `sensor_hub.ino` — Day 4

### ⚡ Tier 2 — Hackathon (Day 5–6)

- [ ] `serial_bridge.py` — live Arduino data

- [ ] Relay physically toggling during demo

- [ ] Anomaly Detection (IsolationForest) + WhatsApp alert

- [ ] Occupancy Heatmap (sensor fusion)

- [ ] Visitor Counter (laser beam-break)

- [ ] Grid Dependency Donut chart

- [ ] Carbon Savings Calculator

- [ ] 7AM WhatsApp Morning Digest (APScheduler)

- [ ] AgriMode toggle + rules engine

- [ ] Disease risk → organic spray recipe

- [ ] Water tank level (ultrasonic repurpose)

- [ ] HVAC Rule 6 (Hall Effect door detection)

- [ ] Energy Score Card (updated with anomaly deduction)

- [ ] Air quality card (MQ sensor CO2)

- [ ] RFID access log

- [ ] Predictive maintenance flag (solar efficiency)

- [ ] LED Matrix: farm status / building grade display

### 💬 Tier 3 — Post Hackathon

- [ ] Offline SQLite fallback (no-internet mode for rural areas)

- [ ] Soil Moisture Sensor add karo (₹60–80)

- [ ] Hindi language toggle

- [ ] GDD (Growing Degree Days) tracker for Agri

- [ ] Live mandi price API (data.gov.in)

- [ ] WhatsApp Farm Morning Report (6AM agri digest)

- [ ] Multi-building / multi-farm support

- [ ] PDF report export (carbon summary)

### 📊 Tier 4 — Future / Startup Vision

- [ ] P2P solar energy trading between buildings

- [ ] Carbon credit monetization (voluntary carbon market)

- [ ] GraminMart marketplace (farmer-to-buyer, sensor-verified organic)

- [ ] Satellite soil data (NASA POWER API)

- [ ] Neighbour benchmarking (anonymous regional scores)

- [ ] Prophet ML solar forecasting in production

- [ ] Vernacular language support (Hindi, Marathi, Telugu, Tamil)

- [ ] Pan-India FPO network integration

---

## 📅 Day-by-Day Build Timeline

|    Day    |    Date    |              Focus                              | Status |
| --------- | ---------- | ------- ----------------------------------------| -------- |
| **Day 1** | Fri Mar 20 | FastAPI + React scaffold                        | ✅ Done |
| **Day 2** | Sat Mar 21 | Dashboard + Deploy (Vercel + Railway)           | ✅ Done |
| **Day 3** | Sun Mar 22 | Weather API + Carbon DB                         | ✅ Done |
| **Day 4** | Mon Mar 23 | Arduino `sensor_hub.ino` + README v3            | ✅ Done |
| **Day 5** | Tue Mar 24 | `serial_bridge.py` + MQTT live + Anomaly model  | ⏳ Pending |
| **Day 6** | Wed Mar 25 | All new features + AgriMode + live demo test    | ⏳ Pending |
| **Day 7** | Thu Mar 26 | Pitch deck + demo video + project report        | ⏳ Pending |
| **Submission** | Fri Mar 27 | Final submission | 🎯 Deadline |

### Day 5 Checklist

- [ ] `serial_bridge.py` — Arduino JSON → FastAPI POST

- [ ] Pi pe test: `python3 serial_bridge.py`

- [ ] Dashboard pe live data verify karo

- [ ] MQTT broker test karo

- [ ] `anomaly_detector.py` — IsolationForest setup karo

### Day 6 Checklist

- [ ] Anomaly detection live + WhatsApp alert demo test

- [ ] Occupancy heatmap component

- [ ] Visitor counter (laser) wiring + component

- [ ] Grid dependency donut chart

- [ ] Carbon savings calculator

- [ ] APScheduler 7AM digest setup

- [ ] AgriMode toggle + all 8 rules live

- [ ] Disease risk → organic spray recipe display

- [ ] Predictive maintenance solar efficiency check

- [ ] HVAC Rule 6 (Hall Effect)

- [ ] Air quality card (MQ sensor)

- [ ] RFID access log

- [ ] Energy Score Card (updated)

- [ ] LED Matrix farm/building status display

- [ ] Full end-to-end demo dry run

### Day 7 Checklist

- [ ] Pitch deck (10 slides — see template below)

- [ ] 3-min demo video record karo

- [ ] Project report (handwritten, <10% plagiarism)

- [ ] GitHub README finalize karo

- [ ] Submission form fill karo

---

## 🏆 Pitch Deck Structure (10 Slides)

| Slide | Title | Key Content |
| ------- | ------- | ------------- |
| 1 | The Problem | 75–90% buildings no EMS. 140M farmers no smart monitoring. One device, two problems. |
| 2 | Solution | GreenBlock — ₹1,100, Building Mode + AgriMode, live demo today |
| 3 | Building Mode Demo | Solar + HVAC + Anomaly alert live |
| 4 | The Anomaly Alert | Cover PIR → WhatsApp arrives on screen in 30 sec |
| 5 | AgriMode | Same hardware, toggle, farm rules engine |
| 6 | Impact Numbers | ₹2,000–5,000/month saving, kgCO2 saved, 35% AC reduction |
| 7 | Carbon Savings | ₹35,800 carbon credit equivalent — visual |
| 8 | Tech Stack | Architecture diagram |
| 9 | Competitive Moat | Table — ₹1,100 vs ₹50,000+ competitors |
| 10 | Roadmap | Hackathon → Offline mode → P2P energy trading → GraminMart |

---

## 🔑 Environment Variables

```env
# greenblock-backend/.env

# Weather
WEATHER_API_KEY=          # openweathermap.org — free tier

# Database
INFLUXDB_URL=             # cloud2.influxdata.com
INFLUXDB_TOKEN=
INFLUXDB_ORG=
INFLUXDB_BUCKET=greenblock
DATABASE_URL=             # PostgreSQL (Railway auto-provides)

# Hardware
PI_IP=                    # Raspberry Pi local IP address
SERIAL_PORT=/dev/ttyUSB0  # Arduino USB serial on Pi

# Alerts
TWILIO_SID=               # Twilio account SID
TWILIO_TOKEN=             # Twilio auth token
TWILIO_FROM=              # Twilio WhatsApp number
ALERT_PHONE=              # Your WhatsApp number (with country code)
TELEGRAM_BOT_TOKEN=       # Telegram bot token (alternative)
TELEGRAM_CHAT_ID=         # Your Telegram chat ID

# Digest schedule
DIGEST_HOUR=7             # Hour for morning WhatsApp digest (24hr format)
ANOMALY_THRESHOLD=0.15    # IsolationForest contamination parameter
```

---

## 🚀 Local Development Setup

### Backend

```bash
cd greenblock-backend
py -3.11 -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # Fill in your API keys
uvicorn main:app --reload
# API  → http://localhost:8000
# Docs → http://localhost:8000/docs
```

### Frontend

```bash
cd greenblock-frontend
npm install
npm run dev
# App → [http://localhost:5173](http://localhost:5173)
```

---

## 🛠️ Raspberry Pi Setup

```bash
# Step 1: Flash Raspberry Pi OS (64-bit) with Pi Imager
# Enable SSH + WiFi in Imager settings before flashing

# Step 2: SSH into Pi
ssh pi@raspberrypi.local

# Step 3: Update
sudo apt update && sudo apt upgrade -y

# Step 4: Enable I2C and SPI
sudo raspi-config
# Interfacing Options > I2C > Enable
# Interfacing Options > SPI > Enable
sudo reboot

# Step 5: Install Python dependencies
pip3 install Adafruit-DHT adafruit-circuitpython-ina219 RPi.GPIO smbus2 \
  paho-mqtt requests pyserial influxdb-client twilio python-telegram-bot \
  scikit-learn prophet apscheduler fastapi uvicorn \
  --break-system-packages

# Step 6: Install Mosquitto MQTT Broker
sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto
sudo systemctl start mosquitto

# Step 7: Test Arduino connection
python3 -c "import serial; s=serial.Serial('/dev/ttyUSB0',9600); print(s.readline())"
```

---

## 📊 Carbon Materials Database (25 Indian Materials)

| Material | kgCO2/kg | Green Alternative |
| ---------- | ---------- | ------------------ |
| Steel | 1.85 | Recycled Steel (0.43) |
| Concrete (M25) | 0.13 | — |
| Portland Cement | 0.82 | Fly-ash Cement (0.15) |
| Aluminium | 8.24 | Recycled Aluminium (0.92) |
| Float Glass | 0.85 | — |
| AAC Block | 0.42 | — |
| Red Clay Brick | 0.24 | Fly-ash Brick (0.08) |
| Fly-ash Cement | 0.15 | ✅ Suggested alternative |
| Ceramic Tile | 0.65 | — |
| Timber (virgin) | 0.42 | Reclaimed Timber (0.05) |
| Fly-ash Brick | 0.08 | ✅ Lowest carbon masonry |

---

## ⚠️ Important Constraints

- Windows development environment (Git Bash + CMD)
- Python 3.11 required — use `py -3.11 -m venv venv`
- Always use `pip install package --break-system-packages` on Pi
- RFID RC522 — **3.3V ONLY** — 5V will permanently damage it
- RFID and LED Matrix both use SPI — keep CS pins different
- All submission documents handwritten — 0% AI content (Turnitin, <10% plagiarism)
- Solo build — no team members
- Budget: ₹1,100 total hardware ✅ Complete

---

## 📝 README Version History

| Version | Date | Changes |
| --------- | ------ | --------- |
| v1.0 | Mar 20, 2026 | Initial README |
| v2.0 | Mar 23, 2026 | AgriMode added, Kisaan vision, GraminMart plan |
| v3.0 | Mar 23, 2026 | Anomaly Detection, Occupancy Heatmap, Visitor Counter, Grid Dependency Score, Carbon Savings Calculator, Morning Digest, Predictive Maintenance, HVAC Rule 6, full AgriMode rules, organic spray guide, water tank level |

---

## 👤 About

**Anup Mazumdar**
Solo MCA Student | UEM Jaipur (Graduating 2027) | Bokaro, Jharkhand, India

- GitHub: [github.com/anupmazumdar](https://github.com/anupmazumdar)
- LinkedIn: [linkedin.com/in/anup-mazumdar-1033b5321](https://linkedin.com/in/anup-mazumdar-1033b5321)
- Portfolio: [anupmazumdar.me](https://anupmazumdar.me)

> All code, documentation, and submission materials are the sole work of Anup Mazumdar. No collaborators.

---

GreenBlock — SDG 11: Sustainable Cities · SDG 7: Affordable and Clean Energy · SDG 13: Climate Action · SDG 2: Zero Hunger (AgriMode) · SDG 3: Good Health (Air Quality)

"One ₹1,100 device. Smart building by day. Smart farm by season. India ki dono zaroorat — ek hardware mein."

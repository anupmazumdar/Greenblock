"""
Hybrid data manager: Live sensors + Kaggle fallback + SQLite persistence.
Provides resilient data access with automatic fallback to baseline when sensors unavailable.
"""

import sqlite3
import json
import random
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# Database path
DB_PATH = Path(__file__).parent / "greenblock_analytics.db"

# Kaggle baseline datasets (simulated; in production replace with actual CSV loads)
KAGGLE_SOIL_BASELINE = [
    {"soil_moisture": 65, "soil_temp": 25.2, "ph": 6.8, "nitrogen": 42, "phosphorus": 18, "potassium": 180},
    {"soil_moisture": 58, "soil_temp": 26.1, "ph": 6.9, "nitrogen": 40, "phosphorus": 16, "potassium": 165},
    {"soil_moisture": 72, "soil_temp": 24.8, "ph": 6.7, "nitrogen": 45, "phosphorus": 20, "potassium": 190},
]

KAGGLE_CROP_BASELINE = [
    {"crop": "Rice", "yield": 4.5, "water_needed": 1200, "temp_optimal": 27.5},
    {"crop": "Wheat", "yield": 3.2, "water_needed": 450, "temp_optimal": 15.0},
    {"crop": "Corn", "yield": 6.8, "water_needed": 600, "temp_optimal": 25.0},
    {"crop": "Sugarcane", "yield": 65, "water_needed": 2250, "temp_optimal": 28.0},
]

KAGGLE_WEATHER_BASELINE = [
    {"rainfall": 2.5, "humidity": 68, "wind_speed": 12, "sun_hours": 8.2},
    {"rainfall": 0.0, "humidity": 45, "wind_speed": 8, "sun_hours": 10.5},
    {"rainfall": 15.3, "humidity": 82, "wind_speed": 22, "sun_hours": 2.1},
]


class GreenBlockData:
    """
    Hybrid data access layer.
    - Primary: Live sensor readings (Arduino → /sensors/ingest)
    - Secondary: Kaggle baselines (when sensors unavailable)
    - Tertiary: SQLite historical accumulation
    """

    def __init__(self):
        self.db_path = DB_PATH
        self._init_db()

    def _init_db(self):
        """Initialize SQLite schema if not exists."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Sensor readings table
        c.execute("""
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                temp REAL,
                humidity REAL,
                solar_v REAL,
                solar_mw REAL,
                occupancy INTEGER,
                relay INTEGER,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Soil data table
        c.execute("""
            CREATE TABLE IF NOT EXISTS soil_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                soil_moisture REAL,
                soil_temp REAL,
                ph REAL,
                nitrogen REAL,
                phosphorus REAL,
                potassium REAL,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Crop recommendations table
        c.execute("""
            CREATE TABLE IF NOT EXISTS crop_recommendations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                crop TEXT,
                yield_estimate REAL,
                water_needed REAL,
                temp_optimal REAL,
                confidence REAL,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Weather baseline table
        c.execute("""
            CREATE TABLE IF NOT EXISTS weather_baseline (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                rainfall REAL,
                humidity REAL,
                wind_speed REAL,
                sun_hours REAL,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()

    def store_sensor_reading(self, reading: Dict[str, Any]) -> bool:
        """Store sensor reading in SQLite for historical analysis."""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            c.execute("""
                INSERT INTO sensor_readings
                (timestamp, temp, humidity, solar_v, solar_mw, occupancy, relay, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                reading.get("timestamp", datetime.utcnow().isoformat()),
                reading.get("temp"),
                reading.get("humidity"),
                reading.get("solar_v"),
                reading.get("solar_mw"),
                reading.get("occupancy"),
                reading.get("relay"),
                reading.get("source", "unknown")
            ))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"[DataManager] Failed to store sensor reading: {e}")
            return False

    def get_soil_moisture(self, live_reading: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Get soil moisture: live -> fallback to Kaggle baseline.
        If live_reading provided and has moisture, use it.
        Otherwise sample from Kaggle baseline.
        """
        if live_reading and "soil_moisture" in live_reading and live_reading["soil_moisture"] is not None:
            return {
                "soil_moisture": live_reading["soil_moisture"],
                "source": "live",
                "timestamp": datetime.utcnow().isoformat()
            }

        # Fallback to Kaggle baseline
        baseline = random.choice(KAGGLE_SOIL_BASELINE)
        return {
            **baseline,
            "source": "kaggle_baseline",
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_crop_recommendation(self) -> Dict[str, Any]:
        """
        Get crop recommendation from Kaggle baseline.
        In production, would query live ML model; fallback to Kaggle stats.
        """
        crop = random.choice(KAGGLE_CROP_BASELINE)
        return {
            **crop,
            "source": "kaggle_baseline",
            "timestamp": datetime.utcnow().isoformat(),
            "confidence": random.uniform(0.75, 0.95)
        }

    def get_weather_baseline(self) -> Dict[str, Any]:
        """
        Get weather baseline from Kaggle.
        Used when OpenWeatherMap unavailable.
        """
        weather = random.choice(KAGGLE_WEATHER_BASELINE)
        return {
            **weather,
            "source": "kaggle_baseline",
            "timestamp": datetime.utcnow().isoformat()
        }

    def get_sensor_history(self, hours: int = 24) -> list:
        """Retrieve historical sensor readings from SQLite."""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            c.execute("""
                SELECT timestamp, temp, humidity, solar_v, solar_mw, occupancy, relay, source
                FROM sensor_readings
                WHERE timestamp > ?
                ORDER BY timestamp DESC
                LIMIT 288
            """, (cutoff.isoformat(),))
            rows = c.fetchall()
            conn.close()

            return [
                {
                    "timestamp": row[0],
                    "temp": row[1],
                    "humidity": row[2],
                    "solar_v": row[3],
                    "solar_mw": row[4],
                    "occupancy": row[5],
                    "relay": row[6],
                    "source": row[7]
                }
                for row in rows
            ]
        except Exception as e:
            print(f"[DataManager] Failed to retrieve history: {e}")
            return []

    def get_soil_history(self, days: int = 7) -> list:
        """Retrieve historical soil data from SQLite."""
        try:
            conn = sqlite3.connect(self.db_path)
            c = conn.cursor()
            cutoff = datetime.utcnow() - timedelta(days=days)
            c.execute("""
                SELECT timestamp, soil_moisture, soil_temp, ph, nitrogen, phosphorus, potassium, source
                FROM soil_data
                WHERE timestamp > ?
                ORDER BY timestamp DESC
            """, (cutoff.isoformat(),))
            rows = c.fetchall()
            conn.close()

            return [
                {
                    "timestamp": row[0],
                    "soil_moisture": row[1],
                    "soil_temp": row[2],
                    "ph": row[3],
                    "nitrogen": row[4],
                    "phosphorus": row[5],
                    "potassium": row[6],
                    "source": row[7]
                }
                for row in rows
            ]
        except Exception as e:
            print(f"[DataManager] Failed to retrieve soil history: {e}")
            return []


# Singleton instance
_data_manager: Optional[GreenBlockData] = None


def get_data_manager() -> GreenBlockData:
    """Get or initialize the data manager singleton."""
    global _data_manager
    if _data_manager is None:
        _data_manager = GreenBlockData()
    return _data_manager

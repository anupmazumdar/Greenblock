from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import sensors, carbon, hvac

app = FastAPI(
    title="GreenBlock API",
    description="Sustainable Smart Building OS — Solar · Carbon · HVAC",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router, prefix="/api", tags=["Sensors"])
app.include_router(carbon.router, prefix="/api", tags=["Carbon"])
app.include_router(hvac.router, prefix="/api", tags=["HVAC"])


@app.get("/")
def root():
    return {
        "project": "GreenBlock",
        "status": "running",
        "docs": "/docs"
    }
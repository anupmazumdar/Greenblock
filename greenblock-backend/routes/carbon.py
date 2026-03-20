import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Load materials DB once at startup
_DB_PATH = Path(__file__).parent.parent / "data" / "carbon_db.json"
with open(_DB_PATH) as f:
    _DB = json.load(f)

_MATERIALS = {m["name"]: m for m in _DB["materials"]}
_BENCHMARK = _DB["benchmark_kgco2_total"]

# In-memory carbon ledger
_ledger: list[dict] = []


# --- Schemas ---

class MaterialLog(BaseModel):
    material_name: str
    quantity_kg: float


# --- Endpoints ---

@router.get("/materials")
def list_materials():
    """Return all 25 materials with their kgCO2 values."""
    return {"materials": _DB["materials"]}


@router.post("/materials")
def log_material(entry: MaterialLog):
    """Log a construction material usage and calculate its carbon."""
    material = _MATERIALS.get(entry.material_name)
    if not material:
        raise HTTPException(status_code=404, detail=f"Material '{entry.material_name}' not found.")

    kgco2 = round(entry.quantity_kg * material["kgco2_per_kg"], 2)

    record = {
        "material_name": entry.material_name,
        "quantity_kg": entry.quantity_kg,
        "kgco2_per_kg": material["kgco2_per_kg"],
        "total_kgco2": kgco2,
        "category": material["category"],
        "alternative": material.get("alternative"),
        "alt_kgco2_saving": round(
            (material["kgco2_per_kg"] - material["alt_kgco2"]) * entry.quantity_kg, 2
        ) if material.get("alt_kgco2") else None
    }
    _ledger.append(record)
    return {"status": "logged", "entry": record}


@router.get("/carbon-summary")
def get_carbon_summary():
    """Return total embodied carbon, progress vs benchmark, and suggestions."""
    total = round(sum(r["total_kgco2"] for r in _ledger), 2)
    percent_of_benchmark = round((total / _BENCHMARK) * 100, 1)

    # Find highest-impact logged materials with available alternatives
    suggestions = [
        {
            "material": r["material_name"],
            "switch_to": r["alternative"],
            "co2_saving_kg": r["alt_kgco2_saving"]
        }
        for r in _ledger
        if r.get("alternative") and r.get("alt_kgco2_saving", 0) > 0
    ]
    # Deduplicate and sort by saving
    seen = set()
    unique_suggestions = []
    for s in sorted(suggestions, key=lambda x: x["co2_saving_kg"], reverse=True):
        if s["material"] not in seen:
            seen.add(s["material"])
            unique_suggestions.append(s)

    return {
        "total_kgco2": total,
        "benchmark_kgco2": _BENCHMARK,
        "percent_of_benchmark": percent_of_benchmark,
        "status": "✅ Below benchmark" if total < _BENCHMARK else "⚠️ Above benchmark",
        "entries": len(_ledger),
        "top_suggestions": unique_suggestions[:3]
    }
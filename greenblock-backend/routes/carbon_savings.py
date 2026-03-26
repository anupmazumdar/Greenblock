from fastapi import APIRouter

router = APIRouter()


@router.get("/carbon-savings")
def get_carbon_savings():
    return {
        "status": "ok",
        "saved_kgco2": 2436,
        "trees_equivalent": 108,
        "credit_value_inr": 35800,
        "note": "Estimated against conventional baseline."
    }

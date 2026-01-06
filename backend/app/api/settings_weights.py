from fastapi import APIRouter, HTTPException
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS
from backend.app.services.settings import settings_service

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


@router.get("/weights", response_model=RankingWeights)
async def get_weights():
    return settings_service.get_weights()


@router.put("/weights", response_model=RankingWeights)
async def set_weights(weights: RankingWeights):
    settings_service.set_weights(weights)
    return settings_service.get_weights()


@router.get("/presets")
async def get_presets():
    return {
        "presets": [{"name": p.value, "weights": WEIGHT_PRESETS[p].model_dump()} for p in WeightPreset],
        "current": settings_service.get_preset()
    }


@router.post("/presets/{preset_name}", response_model=RankingWeights)
async def apply_preset(preset_name: str):
    try:
        return settings_service.apply_preset(WeightPreset(preset_name))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown preset: {preset_name}")


@router.post("/reset", response_model=RankingWeights)
async def reset_weights():
    return settings_service.reset()


from fastapi import APIRouter
from typing import List
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS
from backend.app.services.settings import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


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
        "presets": [
            {
                "name": preset.value,
                "weights": WEIGHT_PRESETS[preset].model_dump()
            }
            for preset in WeightPreset
        ],
        "current": settings_service.get_preset()
    }


@router.post("/presets/{preset_name}", response_model=RankingWeights)
async def apply_preset(preset_name: str):
    try:
        preset = WeightPreset(preset_name)
        return settings_service.apply_preset(preset)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"Unknown preset: {preset_name}. Available: {[p.value for p in WeightPreset]}"
        )


@router.post("/reset", response_model=RankingWeights)
async def reset_weights():
    return settings_service.reset()

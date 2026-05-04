from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS
from backend.app.services.settings import settings_service

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class CustomPresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    weights: RankingWeights


@router.get("/weights", response_model=RankingWeights)
async def get_weights():
    return settings_service.get_weights()


@router.put("/weights", response_model=RankingWeights)
async def set_weights(weights: RankingWeights):
    settings_service.set_weights(weights)
    return settings_service.get_weights()


@router.get("/presets")
async def get_presets():
    builtin = [
        {"name": p.value, "weights": WEIGHT_PRESETS[p].model_dump(), "builtin": True}
        for p in WeightPreset
    ]
    custom = [
        {"name": name, "weights": w.model_dump(), "builtin": False}
        for name, w in settings_service.list_custom_presets().items()
    ]
    return {
        "presets": builtin + custom,
        "current": settings_service.get_preset(),
    }


@router.post("/presets/{preset_name}", response_model=RankingWeights)
async def apply_preset(preset_name: str):
    try:
        return settings_service.apply_preset(preset_name)
    except (KeyError, ValueError):
        raise HTTPException(status_code=400, detail=f"Unknown preset: {preset_name}")


@router.post("/custom-presets", response_model=RankingWeights, status_code=201)
async def save_custom_preset(payload: CustomPresetCreate):
    try:
        return settings_service.save_custom_preset(payload.name, payload.weights)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/custom-presets/{preset_name}", status_code=204)
async def delete_custom_preset(preset_name: str):
    try:
        settings_service.delete_custom_preset(preset_name)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Custom preset not found: {preset_name}")
    return None


@router.post("/reset", response_model=RankingWeights)
async def reset_weights():
    return settings_service.reset()

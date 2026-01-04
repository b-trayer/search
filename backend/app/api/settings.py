
from fastapi import APIRouter
from typing import List, Dict
from backend.app.schemas.settings import RankingWeights, WeightPreset, WEIGHT_PRESETS
from backend.app.services.settings import settings_service
from backend.app.services.preferences import preferences_service

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


@router.get("/role-type-matrix")
async def get_role_type_matrix() -> Dict[str, Dict[str, float]]:
    return preferences_service.get_role_type_matrix()


@router.put("/role-type-matrix")
async def set_role_type_matrix(matrix: Dict[str, Dict[str, float]]) -> Dict[str, Dict[str, float]]:
    preferences_service.set_role_type_matrix(matrix)
    return preferences_service.get_role_type_matrix()


@router.get("/topic-scores")
async def get_topic_scores() -> Dict[str, float]:
    return preferences_service.get_topic_scores()


@router.put("/topic-scores")
async def set_topic_scores(scores: Dict[str, float]) -> Dict[str, float]:
    preferences_service.set_topic_scores(scores)
    return preferences_service.get_topic_scores()


@router.get("/specialization-topics")
async def get_specialization_topics() -> Dict[str, List[str]]:
    return preferences_service.get_specialization_topics()


@router.put("/specialization-topics")
async def set_specialization_topics(topics: Dict[str, List[str]]) -> Dict[str, List[str]]:
    preferences_service.set_specialization_topics(topics)
    return preferences_service.get_specialization_topics()


@router.post("/preferences/reset")
async def reset_preferences():
    preferences_service.reset()
    return {
        "role_type_matrix": preferences_service.get_role_type_matrix(),
        "topic_scores": preferences_service.get_topic_scores(),
        "specialization_topics": preferences_service.get_specialization_topics()
    }

from fastapi import APIRouter, HTTPException
from app.services import (
    get_race_info,
    get_startlist,
    get_stage_results,
    get_race_results,
)
from app.models import RaceInfoModel, RiderModel, StageResultModel
import datetime

router = APIRouter()

@router.get("/preview")
async def preview_race(slug: str, year: int = None) -> RaceInfoModel:
    if not year:
        year = datetime.datetime.now().year
    race = get_race_info(slug, year)
    if not race:
        raise HTTPException(status_code=422, detail=f"Race '{slug}' not found for year {year}")
    return race

@router.get("/{slug}/startlist")
async def race_startlist(slug: str, year: int = None) -> list[RiderModel]:
    if not year:
        year = datetime.datetime.now().year
    return get_startlist(slug, year)

@router.get("/{slug}/results")
async def race_results(slug: str, year: int = None) -> list[StageResultModel]:
    if not year:
        year = datetime.datetime.now().year
    return get_race_results(slug, year)

@router.get("/{slug}/stage/{stage_number}")
async def stage_results(slug: str, stage_number: int, year: int = None) -> list[StageResultModel]:
    if not year:
        year = datetime.datetime.now().year
    return get_stage_results(slug, year, stage_number)
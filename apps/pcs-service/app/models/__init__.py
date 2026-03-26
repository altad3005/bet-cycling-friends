from pydantic import BaseModel
from typing import Optional
from datetime import date

class RiderModel(BaseModel):
    name: str
    pcs_url: str
    nationality: Optional[str] = None
    team_name: Optional[str] = None

class RaceInfoModel(BaseModel):
    slug: str
    name: str
    year: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_one_day_race: bool = False
    uci_tour: Optional[str] = None
    category: Optional[str] = None

class StageResultModel(BaseModel):
    rider_name: str
    rider_url: str
    rank: int
    team_name: Optional[str] = None
    nationality: Optional[str] = None
    time: Optional[str] = None

class StageModel(BaseModel):
    stage_number: int
    stage_name: str
    stage_url: str
    date: Optional[str] = None
    results: list[StageResultModel] = []

class StageInfoModel(BaseModel):
    number: int
    name: str
    date: Optional[str] = None
    profile_icon: Optional[str] = None

class RiderWithCostModel(RiderModel):
    pcs_rank: Optional[int] = None
    cost: int
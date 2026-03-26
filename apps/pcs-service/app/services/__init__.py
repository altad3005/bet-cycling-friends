from procyclingstats import Race, RaceStartlist, Stage, Ranking
from procyclingstats.errors import ExpectedParsingError
from app.models import RaceInfoModel, RiderModel, StageResultModel, StageInfoModel, RiderWithCostModel
from typing import Optional
import requests
import logging

logger = logging.getLogger(__name__)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.5',
}

BASE_URL = "https://www.procyclingstats.com"

def fetch_html(path: str) -> str:
    url = f"{BASE_URL}/{path}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.text

def get_race_info(slug: str, year: int) -> Optional[RaceInfoModel]:
    try:
        html = fetch_html(f"race/{slug}/{year}")
        race = Race(f"race/{slug}/{year}", html=html, update_html=False)
        return RaceInfoModel(
            slug=slug,
            name=race.name(),
            year=year,
            start_date=race.startdate(),
            end_date=race.enddate(),
            is_one_day_race=race.is_one_day_race(),
            uci_tour=race.uci_tour(),
            category=race.category(),
        )
    except Exception as e:
        logger.error(f"Error fetching race info {slug}/{year}: {e}")
        return None

def get_startlist(slug: str, year: int) -> list[RiderModel]:
    try:
        html = fetch_html(f"race/{slug}/{year}/startlist")
        startlist = RaceStartlist(f"race/{slug}/{year}/startlist", html=html, update_html=False)
        riders = startlist.startlist()
        return [
            RiderModel(
                name=r.get("rider_name", ""),
                pcs_url=r.get("rider_url", ""),
                nationality=r.get("nationality"),
                team_name=r.get("team_name"),
            )
            for r in riders
        ]
    except Exception as e:
        logger.error(f"Error fetching startlist {slug}/{year}: {e}")
        return []

def get_stages_info(slug: str, year: int) -> list[StageInfoModel]:
    try:
        html = fetch_html(f"race/{slug}/{year}")
        race = Race(f"race/{slug}/{year}", html=html, update_html=False)
        stages = race.stages()
        result = []
        for i, s in enumerate(stages):
            # Extract stage number from URL e.g. "race/tour-de-france/2022/stage-3" → 3
            url = s.get("stage_url", "")
            try:
                number = int(url.rstrip("/").split("-")[-1])
            except (ValueError, IndexError):
                number = i + 1
            result.append(StageInfoModel(
                number=number,
                name=s.get("stage_name", f"Étape {number}"),
                date=s.get("date"),
                profile_icon=s.get("profile_icon"),
            ))
        return result
    except Exception as e:
        logger.error(f"Error fetching stages info {slug}/{year}: {e}")
        return []

def get_stage_results(slug: str, year: int, stage_number: int) -> list[StageResultModel]:
    try:
        html = fetch_html(f"race/{slug}/{year}/stage-{stage_number}")
        stage = Stage(f"race/{slug}/{year}/stage-{stage_number}", html=html, update_html=False)
        results = stage.results()
        return [
            StageResultModel(
                rider_name=r.get("rider_name", ""),
                rider_url=r.get("rider_url", ""),
                rank=r.get("rank", 0),
                team_name=r.get("team_name"),
                nationality=r.get("nationality"),
                time=r.get("time"),
            )
            for r in results
            if r.get("rank") and r.get("rank") <= 10
        ]
    except Exception as e:
        logger.error(f"Error fetching stage results {slug}/{year}/stage-{stage_number}: {e}")
        return []

COST_TIERS = [
    (10,  30),
    (30,  20),
    (100, 12),
    (200, 6),
]
COST_DEFAULT = 2

def _compute_cost(rank: Optional[int]) -> int:
    if rank is None:
        return COST_DEFAULT
    for max_rank, cost in COST_TIERS:
        if rank <= max_rank:
            return cost
    return COST_DEFAULT

def get_pcs_ranking(limit: int = 500) -> dict[str, int]:
    """Returns a dict mapping rider_url → PCS rank for the individual ranking."""
    try:
        html = fetch_html("rankings/me/individual")
        ranking = Ranking("rankings/me/individual", html=html, update_html=False)
        riders = ranking.individual_ranking()
        return {r["rider_url"]: r["rank"] for r in riders if r.get("rider_url") and r.get("rank")}
    except Exception as e:
        logger.error(f"Error fetching PCS ranking: {e}")
        return {}

def get_startlist_with_costs(slug: str, year: int) -> list[RiderWithCostModel]:
    startlist = get_startlist(slug, year)
    if not startlist:
        return []
    ranking = get_pcs_ranking()
    result = []
    for rider in startlist:
        rank = ranking.get(rider.pcs_url)
        result.append(RiderWithCostModel(
            name=rider.name,
            pcs_url=rider.pcs_url,
            nationality=rider.nationality,
            team_name=rider.team_name,
            pcs_rank=rank,
            cost=_compute_cost(rank),
        ))
    return result

def get_race_results(slug: str, year: int) -> list[StageResultModel]:
    try:
        html = fetch_html(f"race/{slug}/{year}")
        race = Race(f"race/{slug}/{year}", html=html, update_html=False)
        stages = race.stages()

        if stages:
            # Stage race (grand tour): use .gc() on the last stage
            last_stage_url = stages[-1]["stage_url"]
            stage_html = fetch_html(last_stage_url)
            stage = Stage(last_stage_url, html=stage_html, update_html=False)
            results = stage.gc() or []
        else:
            # One-day race: use /result
            path = f"race/{slug}/{year}/result"
            stage_html = fetch_html(path)
            stage = Stage(path, html=stage_html, update_html=False)
            results = stage.results()

        return [
            StageResultModel(
                rider_name=r.get("rider_name", ""),
                rider_url=r.get("rider_url", ""),
                rank=r.get("rank", 0),
                team_name=r.get("team_name"),
                nationality=r.get("nationality"),
                time=r.get("time"),
            )
            for r in results
            if r.get("rank") and r.get("rank") <= 10
        ]
    except Exception as e:
        logger.error(f"Error fetching race results {slug}/{year}: {e}")
        return []
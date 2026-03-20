from procyclingstats import Race, RaceStartlist, Stage
from procyclingstats.errors import ExpectedParsingError
from app.models import RaceInfoModel, RiderModel, StageResultModel
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

def get_race_results(slug: str, year: int) -> list[StageResultModel]:
    # One-day races use /result, stage races (GC) use /gc
    for path_suffix in ("result", "gc"):
        path = f"race/{slug}/{year}/{path_suffix}"
        try:
            html = fetch_html(path)
            stage = Stage(path, html=html, update_html=False)
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
            logger.warning(f"Could not fetch {path}: {e}")
    logger.error(f"Error fetching race results {slug}/{year}: all paths failed")
    return []
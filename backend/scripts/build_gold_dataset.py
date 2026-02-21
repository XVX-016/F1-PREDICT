"""
Build Gold Dataset race artifacts from structured sources.

Primary sources:
- Ergast (classification, pit stops, DNF status)
- FastF1 (SC/VSC periods via track status / race control feeds)

Output layout:
backend/data/gold/v1/{season}_{round}_{race_slug}/
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import fastf1
fastf1.Cache.enable_cache(os.path.join(ROOT_DIR, "cache"))


ERGAST_BASES = [
    "https://ergast.com/api/f1",
    "https://api.jolpi.ca/ergast/f1",
]


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def _safe_driver_code(result: Dict[str, Any]) -> str:
    drv = result.get("Driver", {})
    code = drv.get("code")
    if code:
        return code.upper()
    family = (drv.get("familyName") or "")[:3].upper()
    if family:
        return family
    return (drv.get("driverId") or "UNK").upper()[:3]


def _ergast_get(path: str) -> Dict[str, Any]:
    attempts: List[str] = []
    for base in ERGAST_BASES:
        url = f"{base}/{path}"
        for attempt in range(1):
            try:
                res = requests.get(url, timeout=6)
                res.raise_for_status()
                return res.json()
            except requests.RequestException as exc:
                attempts.append(f"{url}#{attempt + 1}: {exc.__class__.__name__}")
                time.sleep(0.2)
    raise RuntimeError(f"Failed to fetch Ergast path '{path}' from all endpoints: {attempts}")


def extract_ergast_classification(
    season: int, round_number: int
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], int, Dict[str, str]]:
    data = _ergast_get(f"{season}/{round_number}/results.json")
    races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
    if not races:
        return [], [], 0, {}
    race = races[0]
    results = race.get("Results", [])
    out: List[Dict[str, Any]] = []
    dnf: List[Dict[str, Any]] = []
    driver_id_map: Dict[str, str] = {}

    for row in results:
        driver = _safe_driver_code(row)
        driver_id = str(row.get("Driver", {}).get("driverId") or "").strip()
        if driver_id:
            driver_id_map[driver_id] = driver
        status = row.get("status", "")
        laps_completed = int(row.get("laps", 0) or 0)
        out.append({
            "driver": driver,
            "position": int(row.get("position", 0) or 0),
            "status": status,
            "laps_completed": laps_completed,
            "total_time": row.get("Time", {}).get("time"),
        })
        finished_like = status == "Finished" or status.startswith("+") or status == "Lapped"
        if not finished_like:
            dnf.append({
                "driver": driver,
                "lap": laps_completed,
                "status": status,
            })

    total_laps = max((r["laps_completed"] for r in out), default=0)
    return out, dnf, total_laps, driver_id_map


def extract_ergast_pit_events(season: int, round_number: int, driver_id_map: Dict[str, str]) -> List[Dict[str, Any]]:
    data = _ergast_get(f"{season}/{round_number}/pitstops.json?limit=500")
    races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
    if not races:
        return []
    pit_stops = races[0].get("PitStops", [])
    out: List[Dict[str, Any]] = []
    for row in pit_stops:
        duration_ms = None
        dur = row.get("duration")
        if dur:
            try:
                duration_ms = int(float(dur) * 1000)
            except Exception:
                duration_ms = None
        driver_id = str(row.get("driverId") or "").strip()
        driver_code = driver_id_map.get(driver_id) if driver_id else None
        out.append({
            "driver": driver_code or (driver_id or "UNK").upper()[:3],
            "lap": int(row.get("lap", 0) or 0),
            "stop": int(row.get("stop", 0) or 0),
            "duration_ms": duration_ms,
        })
    return out


def _fastf1_classification_and_pits(
    season: int, race_name_or_round: str
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], int, List[Dict[str, Any]]]:
    session = fastf1.get_session(season, race_name_or_round, "R")
    session.load(laps=True, telemetry=False, weather=False, messages=True)

    results_df = session.results
    laps_df = session.laps

    classification: List[Dict[str, Any]] = []
    dnf_events: List[Dict[str, Any]] = []
    for _, row in results_df.iterrows():
        driver = str(row.get("Abbreviation") or row.get("DriverId") or "UNK").upper()[:3]
        position = int(row.get("Position", 0) or 0)
        status = str(row.get("Status", "") or "")
        laps_completed = int(row.get("Laps", 0) or 0)
        classification.append(
            {
                "driver": driver,
                "position": position,
                "status": status,
                "laps_completed": laps_completed,
                "total_time": str(row.get("Time")) if row.get("Time") is not None else None,
            }
        )
        finished_like = status == "Finished" or status.startswith("+") or status == "Lapped"
        if not finished_like:
            dnf_events.append({"driver": driver, "lap": laps_completed, "status": status})

    pit_events: List[Dict[str, Any]] = []
    if laps_df is not None and not laps_df.empty:
        pit_laps = laps_df[laps_df["PitInTime"].notna()][["Driver", "LapNumber"]]
        for _, row in pit_laps.iterrows():
            pit_events.append(
                {
                    "driver": str(row.get("Driver") or "UNK").upper()[:3],
                    "lap": int(row.get("LapNumber", 0) or 0),
                    "stop": None,
                    "duration_ms": None,
                }
            )

    total_laps = max((r["laps_completed"] for r in classification), default=0)
    return classification, dnf_events, total_laps, pit_events


def _lap_from_session_time(session, t) -> Optional[int]:
    laps = session.laps[["LapNumber", "LapStartTime", "Time"]].dropna()
    if laps.empty:
        return None
    for _, row in laps.iterrows():
        if row["LapStartTime"] <= t <= row["Time"]:
            return int(row["LapNumber"])
    return None


def extract_fastf1_sc_periods(season: int, race_name_or_round: str) -> List[Dict[str, Any]]:
    session = fastf1.get_session(season, race_name_or_round, "R")
    session.load(laps=True, telemetry=False, weather=False, messages=True)

    status_df = getattr(session, "track_status", None)
    if status_df is None or status_df.empty:
        return []

    # TrackStatus codes are FIA feed status values as strings.
    # We only map explicit SC/VSC codes; unknown codes are ignored.
    # Common mapping: 4 = SC, 6/7 = VSC states.
    mapped: List[Tuple[str, int]] = []
    for _, row in status_df.iterrows():
        code = str(row.get("Status", "")).strip()
        if code not in {"4", "6", "7"}:
            continue
        lap = _lap_from_session_time(session, row.get("Time"))
        if lap is None:
            continue
        status = "SC" if code == "4" else "VSC"
        mapped.append((status, lap))

    if not mapped:
        return []

    mapped.sort(key=lambda x: x[1])
    periods: List[Dict[str, Any]] = []
    cur_type, cur_start = mapped[0]
    cur_end = cur_start

    for stype, lap in mapped[1:]:
        contiguous = lap <= cur_end + 1
        if stype == cur_type and contiguous:
            cur_end = max(cur_end, lap)
        else:
            periods.append({"type": cur_type, "start_lap": cur_start, "end_lap": cur_end})
            cur_type, cur_start, cur_end = stype, lap, lap

    periods.append({"type": cur_type, "start_lap": cur_start, "end_lap": cur_end})
    return periods


def extract_fastf1_stint_sequences(
    season: int, race_name_or_round: str
) -> Dict[str, List[Dict[str, Any]]]:
    session = fastf1.get_session(season, race_name_or_round, "R")
    session.load(laps=True, telemetry=False, weather=False, messages=False)
    laps = session.laps
    if laps is None or laps.empty:
        return {}

    out: Dict[str, List[Dict[str, Any]]] = {}
    for driver in sorted({str(x).upper()[:3] for x in laps["Driver"].dropna().unique()}):
        dlaps = laps.pick_drivers(driver)
        if dlaps is None or dlaps.empty:
            continue
        seq: List[Dict[str, Any]] = []
        grouped = dlaps.groupby("Stint", sort=True)
        for stint_key, group in grouped:
            if group.empty:
                continue
            comp = str(group["Compound"].iloc[0] or "").lower()
            if comp not in {"soft", "medium", "hard", "intermediate", "wet"}:
                comp = "unknown"
            seq.append(
                {
                    "stint_index": int(stint_key),
                    "compound": comp,
                    "start_lap": int(group["LapNumber"].min()),
                    "end_lap": int(group["LapNumber"].max()),
                }
            )
        out[driver] = seq
    return out


def enrich_pits_with_compounds(
    pit_events: List[Dict[str, Any]],
    stint_sequences: Dict[str, List[Dict[str, Any]]],
) -> List[Dict[str, Any]]:
    by_driver: Dict[str, List[Dict[str, Any]]] = {}
    for event in pit_events:
        driver = str(event.get("driver") or "").upper()
        if not driver:
            continue
        by_driver.setdefault(driver, []).append(event)

    enriched: List[Dict[str, Any]] = []
    for driver, events in by_driver.items():
        events_sorted = sorted(events, key=lambda e: int(e.get("lap", 0) or 0))
        seq = stint_sequences.get(driver, [])
        for idx, event in enumerate(events_sorted, start=1):
            enriched_event = dict(event)
            enriched_event["stint_index"] = idx
            compound_in = None
            compound_out = None
            # stop i transitions stint i -> i+1 if sequences exist
            if len(seq) >= idx:
                compound_in = seq[idx - 1].get("compound")
            if len(seq) >= idx + 1:
                compound_out = seq[idx].get("compound")
            enriched_event["compound_in"] = compound_in
            enriched_event["compound_out"] = compound_out
            enriched.append(enriched_event)
    return sorted(enriched, key=lambda e: (str(e.get("driver") or ""), int(e.get("lap", 0) or 0)))


def build_gold_race(
    season: int,
    round_number: int,
    race_slug: str,
    race_name_or_round_for_fastf1: str,
    output_root: str,
) -> str:
    source_mode = "ergast+fastf1"
    try:
        classification, dnf_events, total_laps, driver_id_map = extract_ergast_classification(season, round_number)
        pit_events = extract_ergast_pit_events(season, round_number, driver_id_map)
    except Exception:
        classification, dnf_events, total_laps, pit_events = _fastf1_classification_and_pits(
            season, race_name_or_round_for_fastf1
        )
        source_mode = "fastf1_fallback"
    sc_periods = extract_fastf1_sc_periods(season, race_name_or_round_for_fastf1)
    stint_sequences = extract_fastf1_stint_sequences(season, race_name_or_round_for_fastf1)
    pit_events = enrich_pits_with_compounds(pit_events, stint_sequences)

    race_id = f"{season}_{round_number}_{race_slug}"
    race_dir = os.path.join(output_root, f"{season}_{round_number}_{race_slug}")
    os.makedirs(race_dir, exist_ok=True)

    artifacts = {
        "classification.json": classification,
        "pit_events.json": pit_events,
        "sc_periods.json": sc_periods,
        "dnf_events.json": dnf_events,
        "stint_sequences.json": stint_sequences,
        "lap_count.json": {"total_laps": total_laps},
        "metadata.json": {
            "season": season,
            "round": round_number,
            "race_id": race_id,
            "validated": False,
            "validation_status": "UNREVIEWED",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sources": {
                "classification": "ergast" if source_mode == "ergast+fastf1" else "fastf1.results",
                "pit_events": "ergast" if source_mode == "ergast+fastf1" else "fastf1.laps.PitInTime",
                "stint_sequences": "fastf1.laps.Compound+Stint",
                "sc_periods": "fastf1.track_status",
                "dnf_events": "ergast" if source_mode == "ergast+fastf1" else "fastf1.results",
            },
            "notes": [] if source_mode == "ergast+fastf1" else ["ergast_unreachable_used_fastf1_fallback"],
        },
    }

    for filename, payload in artifacts.items():
        with open(os.path.join(race_dir, filename), "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    return race_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Build one Gold Dataset race folder.")
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--round", type=int, required=True)
    parser.add_argument("--race", required=True, help="Race name or round for FastF1 (e.g. Bahrain or 1)")
    parser.add_argument("--slug", default=None, help="Slug for output folder")
    parser.add_argument("--out-root", default=os.path.join(ROOT_DIR, "data", "gold", "v1"))
    args = parser.parse_args()

    slug = args.slug or _slugify(str(args.race))
    race_dir = build_gold_race(
        season=args.season,
        round_number=args.round,
        race_slug=slug,
        race_name_or_round_for_fastf1=str(args.race),
        output_root=args.out_root,
    )
    print(f"Gold race artifacts written: {race_dir}")


if __name__ == "__main__":
    main()

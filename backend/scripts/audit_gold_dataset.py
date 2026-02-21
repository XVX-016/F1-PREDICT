"""
Audit Gold Dataset race folders for schema/integrity coverage.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple


REQUIRED_FILES = [
    "classification.json",
    "pit_events.json",
    "sc_periods.json",
    "dnf_events.json",
    "stint_sequences.json",
    "lap_count.json",
    "metadata.json",
]


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _to_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _sc_overlap(periods: List[Dict[str, Any]]) -> bool:
    ordered: List[Tuple[int, int]] = sorted(
        (_to_int(p.get("start_lap")), _to_int(p.get("end_lap"))) for p in periods
    )
    for idx in range(1, len(ordered)):
        prev_end = ordered[idx - 1][1]
        cur_start = ordered[idx][0]
        if cur_start <= prev_end:
            return True
    return False


def audit_race_folder(race_dir: str, min_drivers: int) -> Dict[str, Any]:
    issues: List[str] = []
    checks_total = 0
    checks_passed = 0

    def record(condition: bool, issue: str) -> None:
        nonlocal checks_total, checks_passed
        checks_total += 1
        if condition:
            checks_passed += 1
        else:
            issues.append(issue)

    missing = [f for f in REQUIRED_FILES if not os.path.exists(os.path.join(race_dir, f))]
    if missing:
        issues.append(f"missing_files: {missing}")
        return {
            "race_dir": race_dir,
            "ok": False,
            "issues": issues,
            "source_agreement_score": 0.0,
        }

    classification = _load_json(os.path.join(race_dir, "classification.json"))
    pit_events = _load_json(os.path.join(race_dir, "pit_events.json"))
    sc_periods = _load_json(os.path.join(race_dir, "sc_periods.json"))
    dnf_events = _load_json(os.path.join(race_dir, "dnf_events.json"))
    stint_sequences = _load_json(os.path.join(race_dir, "stint_sequences.json"))
    lap_count = _load_json(os.path.join(race_dir, "lap_count.json")).get("total_laps", 0)

    drivers = [row.get("driver") for row in classification if isinstance(row, dict)]
    unique_drivers = set(d for d in drivers if d)
    positions = [_to_int(row.get("position")) for row in classification if isinstance(row, dict)]
    expected_positions = set(range(1, len(positions) + 1))
    position_set = set(positions)

    # Classification invariants
    record(len(unique_drivers) >= min_drivers, f"driver_count_below_threshold: {len(unique_drivers)} < {min_drivers}")
    record(len(unique_drivers) == len(drivers), "duplicate_drivers_in_classification")
    record(position_set == expected_positions, f"non_contiguous_positions: got={sorted(position_set)} expected={sorted(expected_positions)}")
    record(len(position_set) == len(positions), "duplicate_positions_in_classification")
    for row in classification:
        if not isinstance(row, dict):
            record(False, f"invalid_classification_row: {row}")
            continue
        status = str(row.get("status", ""))
        laps_completed = _to_int(row.get("laps_completed"))
        if status == "Finished":
            record(laps_completed == lap_count, f"finished_driver_laps_mismatch: {row.get('driver')} {laps_completed}!={lap_count}")
    record(isinstance(stint_sequences, dict), "invalid_stint_sequences_type")

    # Pit duplication and bounds
    pit_keys = set()
    pits_by_driver: Dict[str, set] = {}
    for p in pit_events:
        driver = p.get("driver")
        lap = _to_int(p.get("lap", 0), 0)
        if not driver:
            record(False, f"invalid_pit_event_missing_driver: {p}")
            continue
        record(1 <= lap <= lap_count, f"pit_lap_out_of_range: {driver}@{lap} bounds=1..{lap_count}")
        key = (driver, lap)
        record(key not in pit_keys, f"duplicate_pit_event: {driver}@{lap}")
        pit_keys.add(key)
        pits_by_driver.setdefault(driver, set()).add(lap)

    # Stint consistency if available in classification rows.
    for row in classification:
        if not isinstance(row, dict):
            continue
        driver = row.get("driver")
        if not driver:
            continue
        if "stint_count" in row:
            stint_count = _to_int(row.get("stint_count"), 0)
            pit_count = len(pits_by_driver.get(driver, set()))
            record(
                stint_count == pit_count + 1,
                f"stint_count_mismatch: {driver} stint_count={stint_count} pit_count={pit_count}",
            )
        seq = stint_sequences.get(driver, [])
        if isinstance(seq, list) and seq:
            record(
                len(seq) == len(pits_by_driver.get(driver, set())) + 1,
                f"stint_sequence_length_mismatch: {driver} seq={len(seq)} pits={len(pits_by_driver.get(driver, set()))}",
            )
            prev_end = 0
            for item in seq:
                start_lap = _to_int(item.get("start_lap"), 0)
                end_lap = _to_int(item.get("end_lap"), 0)
                compound = str(item.get("compound") or "")
                record(1 <= start_lap <= lap_count, f"stint_start_out_of_range: {driver} {item}")
                record(1 <= end_lap <= lap_count, f"stint_end_out_of_range: {driver} {item}")
                record(end_lap >= start_lap, f"stint_invalid_interval: {driver} {item}")
                record(compound in {"soft", "medium", "hard", "intermediate", "wet", "unknown"}, f"stint_invalid_compound: {driver} {item}")
                record(start_lap >= prev_end, f"stint_non_monotonic: {driver} {item}")
                prev_end = end_lap

    # SC/VSC bounds
    allowed_sc_types = {"SC", "VSC"}
    for s in sc_periods:
        stype = s.get("type")
        start_lap = _to_int(s.get("start_lap", 0), 0)
        end_lap = _to_int(s.get("end_lap", 0), 0)
        record(stype in allowed_sc_types, f"invalid_sc_type: {stype}")
        record(start_lap > 0 and end_lap >= start_lap, f"invalid_sc_period: {s}")
        record(1 <= start_lap <= lap_count and 1 <= end_lap <= lap_count, f"sc_period_out_of_range: {s}")
    record(not _sc_overlap(sc_periods), "overlapping_sc_periods")

    # DNF bounds
    finished_drivers = {
        row.get("driver")
        for row in classification
        if isinstance(row, dict) and str(row.get("status", "")) == "Finished"
    }
    classified_laps = {
        row.get("driver"): _to_int(row.get("laps_completed"))
        for row in classification
        if isinstance(row, dict) and row.get("driver")
    }
    for d in dnf_events:
        driver = d.get("driver")
        lap = _to_int(d.get("lap", 0), 0)
        record(bool(driver), f"invalid_dnf_event_missing_driver: {d}")
        record(0 <= lap <= lap_count, f"invalid_dnf_lap: {d}")
        if driver:
            record(driver not in finished_drivers, f"dnf_driver_marked_finished: {driver}")
            if driver in classified_laps:
                record(
                    classified_laps[driver] == lap,
                    f"dnf_lap_mismatch_classification: {driver} dnf={lap} classified={classified_laps[driver]}",
                )

    scs = (checks_passed / checks_total) if checks_total else 1.0

    result = {
        "race_dir": race_dir,
        "ok": len(issues) == 0 and scs >= 0.95,
        "issues": issues,
        "driver_count": len(unique_drivers),
        "lap_count": lap_count,
        "pit_event_count": len(pit_events),
        "sc_period_count": len(sc_periods),
        "dnf_event_count": len(dnf_events),
        "checks_total": checks_total,
        "checks_passed": checks_passed,
        "source_agreement_score": round(scs, 6),
        "manual_review_required": scs < 0.95,
    }
    return result


def _write_audit_to_metadata(race_dir: str, result: Dict[str, Any]) -> None:
    metadata_path = os.path.join(race_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        return
    metadata = _load_json(metadata_path)
    metadata["source_agreement_score"] = result.get("source_agreement_score")
    metadata["manual_review_required"] = result.get("manual_review_required")
    metadata["audit_ok"] = result.get("ok")
    metadata["audit_issues"] = result.get("issues", [])
    metadata["audit_checked_at"] = datetime.now(timezone.utc).isoformat()
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit all Gold Dataset races in a version folder.")
    parser.add_argument("--root", default=os.path.join("backend", "data", "gold", "v1"))
    parser.add_argument("--min-drivers", type=int, default=20)
    parser.add_argument("--slug", default=None, help="Only audit race directories containing this slug substring")
    parser.add_argument("--write-metadata", action="store_true", help="Write audit score/flags into metadata.json")
    parser.add_argument("--out", default=os.path.join("backend", "reports", "gold_event_coverage_report.json"))
    args = parser.parse_args()

    race_dirs = [
        os.path.join(args.root, name)
        for name in sorted(os.listdir(args.root))
        if os.path.isdir(os.path.join(args.root, name))
    ] if os.path.exists(args.root) else []
    if args.slug:
        race_dirs = [d for d in race_dirs if args.slug.lower() in os.path.basename(d).lower()]

    results = [audit_race_folder(d, args.min_drivers) for d in race_dirs]
    if args.write_metadata:
        for result in results:
            _write_audit_to_metadata(result["race_dir"], result)
    ok_count = sum(1 for r in results if r["ok"])
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": args.root,
        "num_races": len(results),
        "ok_races": ok_count,
        "failed_races": len(results) - ok_count,
        "results": results,
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print(json.dumps({
        "num_races": report["num_races"],
        "ok_races": report["ok_races"],
        "failed_races": report["failed_races"],
        "report": args.out,
    }, indent=2))

    if report["failed_races"] > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

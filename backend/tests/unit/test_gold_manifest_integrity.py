from __future__ import annotations

import json
from pathlib import Path

from backend.scripts.freeze_gold_dataset import (
    collect_race_file_hashes,
    race_hash,
    sha256_file,
)


def _write_json(path: Path, payload: object) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _create_race(tmp_path: Path, race_id: str) -> Path:
    race_dir = tmp_path / race_id
    race_dir.mkdir(parents=True, exist_ok=True)
    _write_json(race_dir / "classification.json", [{"driver": "VER", "position": 1, "status": "Finished", "laps_completed": 57}])
    _write_json(race_dir / "pit_events.json", [{"driver": "VER", "lap": 18}])
    _write_json(race_dir / "sc_periods.json", [])
    _write_json(race_dir / "dnf_events.json", [])
    _write_json(race_dir / "lap_count.json", {"total_laps": 57})
    _write_json(race_dir / "metadata.json", {"race_id": race_id})
    return race_dir


def test_race_hash_changes_when_any_file_changes(tmp_path: Path) -> None:
    race_dir = _create_race(tmp_path, "2024_1_bahrain")
    files_before = collect_race_file_hashes(str(race_dir))
    race_hash_before = race_hash(files_before)

    _write_json(race_dir / "pit_events.json", [{"driver": "VER", "lap": 19}])
    files_after = collect_race_file_hashes(str(race_dir))
    race_hash_after = race_hash(files_after)

    assert race_hash_before != race_hash_after


def test_file_hash_matches_sha256_file(tmp_path: Path) -> None:
    race_dir = _create_race(tmp_path, "2025_8_spa")
    files = collect_race_file_hashes(str(race_dir))
    for name, digest in files.items():
        assert digest == sha256_file(str(race_dir / name))

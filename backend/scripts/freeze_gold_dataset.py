"""
Freeze Gold Dataset version by generating deterministic manifest with SHA256 checksums.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import subprocess
from datetime import datetime, timezone
from typing import Dict, List


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _git_commit() -> str:
    try:
        out = subprocess.check_output(["git", "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, text=True)
        return out.strip()
    except Exception:
        return "unknown"


def collect_race_folders(root: str) -> List[str]:
    folders = [
        os.path.join(root, name)
        for name in sorted(os.listdir(root))
        if os.path.isdir(os.path.join(root, name))
    ]
    return folders


def collect_race_file_hashes(race_dir: str) -> Dict[str, str]:
    hashes: Dict[str, str] = {}
    for fn in sorted(os.listdir(race_dir)):
        if fn.endswith(".json"):
            full = os.path.join(race_dir, fn)
            hashes[fn] = sha256_file(full)
    return hashes


def race_hash(files: Dict[str, str]) -> str:
    # Stable composition over canonical race files.
    ordered = [f"{k}:{files[k]}" for k in sorted(files.keys())]
    return sha256_text("|".join(ordered))


def main() -> None:
    parser = argparse.ArgumentParser(description="Freeze Gold Dataset by writing gold_manifest.json")
    parser.add_argument("--root", default=os.path.join("backend", "data", "gold", "v1"))
    parser.add_argument("--version", default="v1")
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    out_path = args.out or os.path.join(args.root, "gold_manifest.json")
    race_records: List[Dict[str, object]] = []
    all_file_count = 0
    if os.path.exists(args.root):
        for race_dir in collect_race_folders(args.root):
            files = collect_race_file_hashes(race_dir)
            if not files:
                continue
            all_file_count += len(files)
            race_id = os.path.basename(race_dir)
            race_records.append(
                {
                    "race_id": race_id,
                    "race_hash": race_hash(files),
                    "files": files,
                }
            )

    manifest = {
        "version": args.version,
        "dataset_version": args.version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "root": args.root.replace("\\", "/"),
        "race_count": len(race_records),
        "file_count": all_file_count,
        "pipeline_commit": _git_commit(),
        "python_version": platform.python_version(),
        "races": race_records,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(json.dumps({
        "version": args.version,
        "race_count": len(race_records),
        "file_count": all_file_count,
        "manifest": out_path,
    }, indent=2))


if __name__ == "__main__":
    main()

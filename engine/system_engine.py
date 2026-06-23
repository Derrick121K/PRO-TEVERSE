#!/usr/bin/env python3
"""
Build a DAW core drum kit from a reference ZIP.

This script is intentionally dependency-free so it can run on fresh systems.
It extracts selected samples from a source ZIP into /public/sounds/nkosi and
writes a manifest consumed by the TypeScript audio engine.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import wave
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple


ROLES = ("kick", "snare", "hihat", "clap")


@dataclass
class Candidate:
    name: str
    score_by_role: Dict[str, int]


KEYWORDS: Dict[str, Tuple[str, ...]] = {
    "kick": ("kick", "bd", "bdrum", "k1"),
    "snare": ("snare", "sd", "s1"),
    "hihat": ("hihat", "hihat", "hat", "ch"),
    "clap": ("clap", "snap"),
}


FALLBACK_SELECTION: Dict[str, str] = {
    "kick": "Bdrum1.wav",
    "snare": "043_50S1_2.wav",
    "hihat": "Brk_K1_8.wav",
    "clap": "Audio clipboard_57.wav",
}

# Locked role mapping tuned for the provided nkosi.zip.
LOCKED_ROLE_SELECTION: Dict[str, str] = {
    "kick": "aertee kick.wav",
    "snare": "043_50S1_2.wav",
    "hihat": "Bracke CH 1.wav",
    "clap": "Audio clipboard_57.wav",
}


def normalize_token(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def compute_scores(filename: str) -> Dict[str, int]:
    token = normalize_token(Path(filename).stem)
    parts = set(token.split())
    scores: Dict[str, int] = {role: 0 for role in ROLES}
    for role, words in KEYWORDS.items():
        for word in words:
            if word in token:
                scores[role] += 5
            if word in parts:
                scores[role] += 8
    if "drum" in token and scores["kick"] > 0:
        scores["kick"] += 2
    if "track" in token:
        for role in ROLES:
            scores[role] -= 1
    return scores


def pick_candidates(zip_names: Iterable[str]) -> Dict[str, str]:
    wavs = [name for name in zip_names if name.lower().endswith(".wav")]
    selected: Dict[str, str] = {}
    for role in ROLES:
        locked = LOCKED_ROLE_SELECTION.get(role)
        if locked and locked in wavs:
            selected[role] = locked
    if len(selected) == len(ROLES):
        return selected

    analyzed: List[Candidate] = [
        Candidate(name=name, score_by_role=compute_scores(name))
        for name in wavs
    ]
    used = set(selected.values())
    for role in ROLES:
        ranked = sorted(
            analyzed,
            key=lambda c: c.score_by_role.get(role, 0),
            reverse=True,
        )
        pick = None
        for entry in ranked:
            if entry.name in used:
                continue
            if entry.score_by_role.get(role, 0) <= 0:
                continue
            pick = entry.name
            break
        if pick is None and FALLBACK_SELECTION.get(role) in wavs:
            pick = FALLBACK_SELECTION[role]
        if pick is None and wavs:
            pick = wavs[0]
        if pick:
            selected[role] = pick
            used.add(pick)
    return selected


def extract_kit(zip_path: Path, out_dir: Path, mapping: Dict[str, str]) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        for role, source in mapping.items():
            target = out_dir / f"{role}.wav"
            with zf.open(source, "r") as src, target.open("wb") as dst:
                shutil.copyfileobj(src, dst)


def safe_filename(src: str, index: int) -> str:
    base = Path(src).name
    stem = Path(base).stem
    ext = Path(base).suffix.lower()
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower()
    if not clean:
        clean = f"sample-{index:02d}"
    return f"{index:02d}-{clean}{ext}"


def detect_duration_seconds(name: str, payload: bytes) -> Optional[float]:
    if name.lower().endswith(".wav"):
        try:
            import io

            with wave.open(io.BytesIO(payload), "rb") as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                if rate > 0:
                    return round(frames / rate, 4)
        except Exception:
            return None
    return None


def extract_project_assets(zip_path: Path, out_dir: Path) -> List[Dict[str, object]]:
    out_dir.mkdir(parents=True, exist_ok=True)
    entries: List[Dict[str, object]] = []
    with zipfile.ZipFile(zip_path, "r") as zf:
        names = [n for n in zf.namelist() if n.lower().endswith((".wav", ".mp3"))]
        for i, name in enumerate(names, start=1):
            target_name = safe_filename(name, i)
            target_path = out_dir / target_name
            payload = zf.read(name)
            target_path.write_bytes(payload)
            dur = detect_duration_seconds(name, payload)
            known = dur is not None
            entries.append(
                {
                    "source": name,
                    "url": f"/sounds/nkosi/project/{target_name}",
                    "durationSec": dur if dur is not None else 2.0,
                    "knownDuration": known,
                }
            )
    return entries


def build_track_plan(entries: List[Dict[str, object]], bpm: int = 120) -> List[Dict[str, object]]:
    if not entries:
        return []
    sorted_by_duration = sorted(
        entries,
        key=lambda e: (bool(e.get("knownDuration")), float(e["durationSec"])),
        reverse=True,
    )
    main = sorted_by_duration[:3]
    drums = [e for e in entries if any(k in str(e["source"]).lower() for k in ("kick", "drum", "snare", "hat", "clap"))][:4]
    fx = [e for e in entries if e not in main and e not in drums][:4]

    def to_clips(src: List[Dict[str, object]], label: str, start_step: int) -> List[Dict[str, object]]:
        clips: List[Dict[str, object]] = []
        for i, item in enumerate(src):
            dur_sec = float(item["durationSec"])
            dur_beats = max(0.5, round((dur_sec * bpm) / 60, 2))
            clips.append(
                {
                    "name": f"{label} {i + 1}",
                    "audioUrl": item["url"],
                    "start": start_step * i,
                    "duration": dur_beats,
                }
            )
        return clips

    plan: List[Dict[str, object]] = []
    if main:
        plan.append({"name": "Nkosi Main", "color": "#8b5cf6", "clips": to_clips(main, "Main", 8)})
    if drums:
        plan.append({"name": "Nkosi Drums", "color": "#00d4ff", "clips": to_clips(drums, "Drum", 4)})
    if fx:
        plan.append({"name": "Nkosi FX", "color": "#10b981", "clips": to_clips(fx, "FX", 8)})
    return plan


def write_manifest(
    manifest_path: Path,
    zip_path: Path,
    mapping: Dict[str, str],
    public_base: str = "/sounds/nkosi",
) -> None:
    payload = {
        "generatedBy": "engine/system_engine.py",
        "sourceZip": zip_path.name,
        "coreKit": {
            role: {"url": f"{public_base}/{role}.wav", "source": source}
            for role, source in mapping.items()
        },
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_project_manifest(
    manifest_path: Path,
    zip_path: Path,
    entries: List[Dict[str, object]],
    track_plan: List[Dict[str, object]],
    bpm: int = 120,
) -> None:
    payload = {
        "generatedBy": "engine/system_engine.py",
        "sourceZip": zip_path.name,
        "bpm": bpm,
        "flpUrl": "/sounds/nkosi/project/nkosi.flp",
        "samples": entries,
        "trackPlan": track_plan,
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Pro-Teeverse system drum kit from ZIP")
    parser.add_argument("--zip", dest="zip_path", required=True, help="Path to reference zip file")
    parser.add_argument(
        "--out",
        dest="output_dir",
        default="public/sounds/nkosi",
        help="Output directory for extracted kit files",
    )
    parser.add_argument(
        "--manifest",
        dest="manifest_path",
        default="lib/system-engine-manifest.json",
        help="Output manifest JSON path",
    )
    parser.add_argument(
        "--project-manifest",
        dest="project_manifest_path",
        default="lib/system-engine-project.json",
        help="Output sample-project JSON path",
    )
    args = parser.parse_args()

    zip_path = Path(args.zip_path).resolve()
    out_dir = Path(args.output_dir).resolve()
    manifest_path = Path(args.manifest_path).resolve()
    project_manifest_path = Path(args.project_manifest_path).resolve()

    if not zip_path.exists():
        raise SystemExit(f"ZIP file not found: {zip_path}")

    with zipfile.ZipFile(zip_path, "r") as zf:
        mapping = pick_candidates(zf.namelist())

    missing = [role for role in ROLES if role not in mapping]
    if missing:
        raise SystemExit(f"Could not resolve all drum roles: {missing}")

    extract_kit(zip_path, out_dir, mapping)
    with zipfile.ZipFile(zip_path, "r") as zf:
        if "nkosi.flp" in zf.namelist():
            flp_target = out_dir / "project" / "nkosi.flp"
            flp_target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open("nkosi.flp", "r") as src, flp_target.open("wb") as dst:
                shutil.copyfileobj(src, dst)
    write_manifest(manifest_path, zip_path, mapping)
    project_entries = extract_project_assets(zip_path, out_dir / "project")
    track_plan = build_track_plan(project_entries, bpm=120)
    write_project_manifest(project_manifest_path, zip_path, project_entries, track_plan, bpm=120)
    print("System engine kit built successfully.")
    print("Mapping:")
    for role in ROLES:
        print(f"  {role}: {mapping[role]}")


if __name__ == "__main__":
    main()

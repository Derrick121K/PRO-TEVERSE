#!/usr/bin/env python3
"""Write minimal valid WAV drums to public/sounds/ (no zip required)."""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "sounds"
NKOSI = ROOT / "public" / "sounds" / "nkosi"

SAMPLES = {
    "kick.wav": (55, 0.35, 0.9),
    "snare.wav": (180, 0.12, 0.7),
    "hihat.wav": (8000, 0.04, 0.35),
    "clap.wav": (1200, 0.08, 0.55),
}


def write_tone(path: Path, freq: float, duration: float, amp: float, sample_rate: int = 44100) -> None:
    n = int(sample_rate * duration)
    frames = bytearray()
    for i in range(n):
        t = i / sample_rate
        env = math.exp(-t * (8 if freq < 200 else 40))
        v = amp * env * math.sin(2 * math.pi * freq * t)
        frames.extend(struct.pack("<h", int(max(-32767, min(32767, v * 32767)))))
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(frames)


def main() -> None:
    for name, (freq, dur, amp) in SAMPLES.items():
        write_tone(OUT / name, freq, dur, amp)
        write_tone(NKOSI / name, freq, dur, amp)
    print("Fallback drums written to public/sounds/ and public/sounds/nkosi/")


if __name__ == "__main__":
    main()

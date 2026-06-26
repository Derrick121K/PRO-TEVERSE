# PRO-TEVERSE

Browser DAW inspired by FL Studio: playlist, channel rack, piano roll, mixer, and transport â€” built with Next.js and Tone.js.

## Quick start

```bash
npm install
npm run engine:build-kit   # optional: extracts nkosi.zip â†’ public/sounds/nkosi
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

`postinstall` runs the kit build automatically when `nkosi.zip` is present and samples are missing.

## FL Studio panel map

| FL Studio | PRO-TEVERSE |
|-----------|----------------|
| Playlist | Track list + timeline (`/studio`) |
| Channel rack | Step sequencer + patterns |
| Piano roll | Docked editor for MIDI clips |
| Mixer | Mixer dock panel |
| Transport | Top transport bar |
| Patterns | Pattern tabs above channel rack |
| `.flp` files | `/fl-studio` â†’ Open in Studio |

## Studio shortcuts

- **Space** â€” play / pause  
- **Enter** â€” stop (finalizes master recording when armed)  
- **R** â€” arm / disarm record  
- **L** â€” loop  
- **1â€“4** â€” tool views (studio, chords, pattern, record)

## Recording

1. Press **R** to arm record.  
2. Press **Play** â€” master output is captured.  
3. Press **Stop** â€” a **Mixdown** audio clip is added on the timeline.  

MIDI record: arm record, open piano roll on a MIDI clip, enable MIDI input. Vocals: **Record** tab â†’ vocal recorder.

## Patterns

1. Select or create a pattern above the channel rack.  
2. Program steps.  
3. Click **To playlist** to place the pattern at the playhead.

## Export

`/export` â€” WAV mixdown (MIDI synth + timeline audio clips), per-track stems, Standard MIDI File.

## Limits (vs desktop FL Studio)

- No VST / native FL plugins  
- `.flp` import is best-effort (tempo, channels, matched WAV samples)  
- All audio runs in the browser (Web Audio API)

## System engine

[`engine/system_engine.py`](engine/system_engine.py) builds the core drum kit and demo project manifests from `nkosi.zip`:

```bash
npm run engine:build-kit
```

Outputs:

- `public/sounds/nkosi/*.wav` â€” kick, snare, hat, clap  
- `public/sounds/nkosi/project/*` â€” demo timeline samples  
- `lib/system-engine-manifest.json`  
- `lib/system-engine-project.json`

Fallback drums also live at `public/sounds/kick.wav` etc.

## PRO-TEVERSE Offline Desktop Mode

PRO-TEVERSE is now designed as an offline-first music studio. Music generation, ZIP project editing, WAV rendering, and pattern generation run locally without cloud APIs.

Core offline features:
- Local AI pattern generation
- ZIP project import
- FLP preservation
- WAV/MP3 sample preview
- WAV mix rendering
- Local project workflow
- Desktop packaging preparation

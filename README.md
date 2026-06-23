# PRO-TEEVERSE

Browser DAW inspired by FL Studio: playlist, channel rack, piano roll, mixer, and transport — built with Next.js and Tone.js.

## Quick start

```bash
npm install
npm run engine:build-kit   # optional: extracts nkosi.zip → public/sounds/nkosi
npm run dev
```

Open [http://localhost:3000/studio](http://localhost:3000/studio).

`postinstall` runs the kit build automatically when `nkosi.zip` is present and samples are missing.

## FL Studio panel map

| FL Studio | PRO-TEEVERSE |
|-----------|----------------|
| Playlist | Track list + timeline (`/studio`) |
| Channel rack | Step sequencer + patterns |
| Piano roll | Docked editor for MIDI clips |
| Mixer | Mixer dock panel |
| Transport | Top transport bar |
| Patterns | Pattern tabs above channel rack |
| `.flp` files | `/fl-studio` → Open in Studio |

## Studio shortcuts

- **Space** — play / pause  
- **Enter** — stop (finalizes master recording when armed)  
- **R** — arm / disarm record  
- **L** — loop  
- **1–4** — tool views (studio, chords, pattern, record)

## Recording

1. Press **R** to arm record.  
2. Press **Play** — master output is captured.  
3. Press **Stop** — a **Mixdown** audio clip is added on the timeline.  

MIDI record: arm record, open piano roll on a MIDI clip, enable MIDI input. Vocals: **Record** tab → vocal recorder.

## Patterns

1. Select or create a pattern above the channel rack.  
2. Program steps.  
3. Click **To playlist** to place the pattern at the playhead.

## Export

`/export` — WAV mixdown (MIDI synth + timeline audio clips), per-track stems, Standard MIDI File.

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

- `public/sounds/nkosi/*.wav` — kick, snare, hat, clap  
- `public/sounds/nkosi/project/*` — demo timeline samples  
- `lib/system-engine-manifest.json`  
- `lib/system-engine-project.json`

Fallback drums also live at `public/sounds/kick.wav` etc.

## AI / PRO-TEEVERSE Suno (Text to Music)

Full songs use the **bundled Suno service** in [`services/suno-api`](services/suno-api) (upstream [gcui-art/suno-api](https://github.com/gcui-art/suno-api): Playwright + 2Captcha + Suno cookie).

1. Copy `services/suno-api/.env.example` → `.env` and add `SUNO_COOKIE` + `TWOCAPTCHA_KEY` ([docs/SUNO_DEPLOY.md](docs/SUNO_DEPLOY.md)).
2. `npm run suno:install` then `npm run suno:dev` (port **3001**).
3. `SUNO_API_URL=http://localhost:3001` in `.env.local` (default in `.env.example`).
4. `npm run dev` → studio **Text to Music** adds an **audio clip** on the timeline.

Without a running Suno service, Text to Music falls back to offline MIDI patterns.

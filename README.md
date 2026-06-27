# PRO-TEVERSE

PRO-TEVERSE is an offline-first music production studio built with Next.js, TypeScript and Web Audio/Tone.js.

## Current Rebuild Direction

The app is being simplified into one main Studio route:

/studio

The goal is to remove confusing duplicate workspaces and create one reliable offline DAW-style experience.

## Planned Core Features

- Import local legal audio files
- Browse a local sound library
- Create drum, bass, chord and melody patterns
- Arrange tracks and clips
- Mix volume, pan, mute and solo
- Export project data
- Later: stronger WAV rendering and desktop installer

## Legal Sound Rule

Only use:

- Your own recordings
- Your own exported stems
- Public domain sounds
- CC0 / royalty-free sounds that allow redistribution
- Properly licensed free sample packs

Do not include paid FL Studio samples, cracked plugins, or copyrighted sample packs in this repository.

## Development

Install dependencies:

npm install

Run locally:

npm run dev

Build:

npm run build

Type check:

npm run lint

## Main Route

http://localhost:3000/studio

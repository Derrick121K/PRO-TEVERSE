# PRO-TEVERSE

PRO-TEVERSE is an offline-first music production studio built with Next.js, TypeScript and browser audio tools.

The project has been simplified into one main working studio instead of many confusing separate workspaces.

Main route:

/studio

## Current Status

The One Studio rebuild is active on this branch:

rebuild/one-studio

## What Works Now

- One main Studio workspace
- Local audio import from PC
- Local Sound Library panel inside Studio
- 16-step Pattern Maker
- Pattern playback using browser audio
- Timeline track list
- Mixer controls
- Save project to browser local storage
- Load saved project
- Clear project
- Export project JSON
- Export pattern WAV
- Duplicate old pages redirect to /studio

## Main Studio Sections

1. Project Setup
   - Project name
   - BPM
   - Key
   - Status

2. Import Audio
   - Import WAV, MP3, OGG, M4A, AAC or FLAC
   - Imported PC files play during the current browser session
   - PC files must be re-imported after refresh because browsers do not permanently expose local file paths

3. Sound Library
   - Shows local sound-library items
   - Placeholder sounds appear until real legal audio files are added
   - Sound-library paths can be saved and reloaded if they point to real files inside public/sound-library

4. Pattern Maker
   - Kick
   - Clap
   - Hi-Hat
   - Bass / Log Drum
   - Chords
   - Melody
   - Amapiano preset
   - Clear pattern

5. Timeline
   - Shows imported tracks
   - Shows sound-library tracks
   - Supports preview and remove

6. Mixer
   - Volume
   - Pan
   - Mute
   - Solo

7. Export
   - Project JSON export
   - Pattern WAV export

## Legal Sound Rule

Only use legal sounds:

- Your own recordings
- Your own exported stems
- Public domain sounds
- CC0 sounds
- Royalty-free sounds that allow redistribution
- Properly licensed sample packs

Do not include:

- Paid FL Studio stock sounds copied into the repo
- Cracked plugins
- Pirated sample packs
- Copyrighted music without permission

## How To Run

Install dependencies:

npm install

Run development server:

npm run dev

Open:

http://localhost:3000/studio

Build:

npm run build

Type-check:

npm run lint

## How To Use The Studio

1. Open /studio
2. Set BPM and Key
3. Click Play to hear the pattern
4. Toggle pattern steps
5. Add sounds from Sound Library or import your own legal audio
6. Use Mixer controls
7. Click Save to save the project in the browser
8. Click Load to restore saved project data
9. Click Export WAV to export the pattern as audio
10. Click Export JSON to export project data

## Current Limitations

- Imported PC audio files cannot permanently reload after browser refresh
- Placeholder Sound Library items are not real audio yet
- WAV export currently renders the pattern instruments, not imported MP3/WAV tracks
- Desktop installer is planned later
- Advanced arrangement, MIDI export and plugin support are planned later

## Recommended Next Steps

1. Add real legal sample files into public/sound-library
2. Update the sound-library manifest to point to real WAV/MP3/OGG files
3. Add better timeline arrangement
4. Add stronger mixer/export engine
5. Package as a desktop app later

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
- Generated legal starter WAV samples
- 16-step Pattern Maker
- Pattern playback using browser audio
- Timeline track list
- Mixer controls
- Mixer pan playback
- Save project to browser local storage
- Load saved project
- Clear project
- Export project JSON
- Export pattern WAV
- Export mix WAV with pattern and playable timeline tracks
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
   - Includes generated legal starter sounds
   - Kick
   - Clap
   - Hi-Hat
   - Log Drum
   - Chord Stab
   - Riser
   - Sound-library paths can save and reload because they exist inside public/sound-library

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
   - Shows track duration
   - Supports preview and remove

6. Mixer
   - Volume
   - Pan
   - Mute
   - Solo

7. Export
   - Project JSON export
   - WAV export with pattern
   - WAV export includes playable timeline tracks

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
9. Click Export WAV to export the pattern and playable timeline tracks
10. Click Export JSON to export project data

## Current Limitations

- Imported PC audio files cannot permanently reload after browser refresh
- Timeline tracks currently start from the beginning of the export
- Advanced drag-and-drop arrangement is planned later
- Desktop installer is planned later
- Advanced MIDI export and plugin support are planned later

## Recommended Next Steps

1. Add timeline start position controls
2. Add loop/duplicate arrangement tools
3. Add stronger mixer/export engine
4. Add MIDI export
5. Package as a desktop app later

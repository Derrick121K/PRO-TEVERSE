# PRO-TEVERSE One Studio Rebuild Plan

## Goal

Rebuild PRO-TEVERSE into one simple, working offline music studio instead of many confusing half-connected pages.

## Main Route

/studio

This is now the main production workspace.

## Completed Steps

1. Created rebuild branch
   - Branch: rebuild/one-studio

2. Rebuilt /studio as the main workspace
   - Project setup
   - Import audio
   - Pattern maker
   - Timeline
   - Mixer
   - Export controls

3. Redirected duplicate pages
   - /pro-studio redirects to /studio
   - /fl-studio redirects to /studio
   - /ai-creator redirects to /studio
   - /zip-studio redirects to /studio
   - /sound-library redirects to /studio
   - /export redirects to /studio

4. Added real pattern playback
   - Kick
   - Clap
   - Hat
   - Bass
   - Chords
   - Melody tone
   - Active step highlight

5. Added Sound Library inside Studio
   - Search
   - Category filter
   - Add to Timeline

6. Added Save / Load / Clear project
   - Saves to browser localStorage
   - Loads project name, BPM, key, pattern and tracks
   - Preserves sound-library paths
   - Warns when PC-imported audio needs re-importing

7. Added Pattern WAV Export
   - Renders 8 bars
   - Uses current BPM
   - Exports a .wav file

8. Added generated legal starter samples
   - Kick
   - Clap
   - Hat
   - Log Drum
   - Chord Stab
   - Riser

9. Added track duration loading
   - Sound-library tracks show real duration
   - Short samples show seconds professionally

10. Added mixer pan playback
   - Track playback uses volume
   - Track playback uses pan
   - Muted tracks play silent

11. Added timeline tracks to WAV export
   - Exports pattern
   - Exports playable timeline tracks
   - Respects mute and solo
   - Uses volume and pan

## Current Working Features

- One Studio route
- Local audio import
- Generated legal Sound Library
- Pattern playback
- Pattern WAV export
- Timeline WAV export
- Project JSON export
- Save/load project
- Timeline
- Mixer
- Mixer pan playback
- Duplicate page redirects

## Remaining Work

1. Add timeline start position controls
2. Add loop and duplicate controls
3. Improve arrangement timeline
4. Improve master mixer/export engine
5. Add MIDI export
6. Add desktop installer later

## Build Rules

Every step must pass:

npm run build
npm run lint

Every step must be committed and pushed.

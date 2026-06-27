# PRO-TEVERSE One Studio Rebuild Plan

## Goal

Rebuild PRO-TEVERSE into one simple, working offline music studio instead of many confusing half-connected pages.

## Main Route

/studio

This will become the main and only production workspace.

## Old Routes

These pages will later be redirected to /studio:

- /pro-studio
- /fl-studio
- /ai-creator
- /zip-studio
- /sound-library
- /export

## Final Studio Sections

1. Header / Transport
   - Play
   - Stop
   - BPM
   - Key
   - Save project
   - Export

2. Import Audio
   - Choose local WAV/MP3/OGG/M4A/AAC/FLAC
   - Create audio track
   - Create clip
   - Preview sound

3. Sound Library
   - Legal local samples only
   - No cracked packs
   - No paid FL Studio sounds copied into the repo
   - User can add their own samples to public/sound-library

4. Pattern Maker
   - Drum pattern
   - Bass pattern
   - Chord pattern
   - Melody pattern
   - Amapiano / hip-hop / house presets

5. Timeline
   - Tracks
   - Clips
   - Pattern blocks
   - Audio blocks

6. Mixer
   - Volume
   - Pan
   - Mute
   - Solo
   - Basic effects placeholders

7. Export
   - Project JSON
   - MIDI where possible
   - WAV renderer as a later engine step

## Important Rules

- Offline-first
- No Suno API
- No cloud dependency
- No copyrighted paid sample packs
- No cracked plugins
- Build must pass
- TypeScript lint must pass
- Every step must be committed

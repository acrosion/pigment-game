# Phase 5: Polish

## Goal
Fill remaining polish gaps from the 5-phase plan.

## Tasks

### 5.1 Visual Hint System
- Replace console.log hints with an on-screen toast/notification
- Show a brief highlight on the source tube that has a valid move

### 5.2 Pour Animation
- Animate pigment units moving from source to dest tube on click
- Use CSS transitions or requestAnimationFrame for smooth pour

### 5.3 "Replay Level" Button
- Add replay button on LevelComplete overlay (currently only "Next Painting")

### 5.4 Active Level Indicator
- Show which level is currently being played in LevelSelect

### 5.5 Sound Implementation
- Add simple Web Audio API tones for tube selection, pour, and completion

### 5.6 Bug Fixes
- Fix: `handleNextLevel` in App.tsx doesn't check if last level
- Fix: levels array is memoized at mount, doesn't regenerate on level select

## Acceptance Criteria
- [x] Visual hint replaces console.log
- [x] Pour animation on tube click
- [x] Replay button works on completion screen
- [x] Active level highlighted in LevelSelect
- [x] Sound effects play correctly
- [ ] TypeScript clean, prod build passes
- [ ] All tests pass

// ─── Progression / Persistence ───────────────────────────────────────────────
// localStorage-based save/load for player progress and settings.

import type {
  PlayerProgress,
  GameSettings,
} from '../types'

const PROGRESS_KEY = 'pigment_progress'
const SETTINGS_KEY = 'pigment_settings'

const DEFAULT_PROGRESS: PlayerProgress = {
  highestUnlockedLevel: 1,
  completedLevels: [],
  moveCounts: {},
  bestTimes: {},
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  reducedMotion: false,
  mute: false,
}

// ─── Progression ─────────────────────────────────────────────────────────────

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    const parsed = JSON.parse(raw) as PlayerProgress
    // Validate structure
    if (!parsed.highestUnlockedLevel || !Array.isArray(parsed.completedLevels)) {
      return { ...DEFAULT_PROGRESS }
    }
    // Ensure bestTimes exists
    if (!parsed.bestTimes) {
      parsed.bestTimes = {}
    }
    return parsed
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// Mark a level as completed
export function completeLevel(
  progress: PlayerProgress,
  levelId: number,
  moveCount: number
): PlayerProgress {
  const updated = { ...progress }

  // Only save if something actually changed
  const alreadyCompleted = updated.completedLevels.includes(levelId)
  const currentBest = updated.moveCounts[levelId]
  const bestImproved = currentBest === undefined || moveCount < currentBest
  const nextLevel = levelId + 1
  const wouldUnlock = nextLevel > updated.highestUnlockedLevel

  if (!alreadyCompleted || bestImproved || wouldUnlock) {
    if (!alreadyCompleted) {
      updated.completedLevels = [...updated.completedLevels, levelId]
    }
    if (bestImproved) {
      updated.moveCounts = { ...updated.moveCounts, [levelId]: moveCount }
    }
    // Track best time (simplified: using move count as proxy for now)
    // In production, pass elapsedTime from useGame
    if (wouldUnlock) {
      updated.highestUnlockedLevel = nextLevel
    }
    saveProgress(updated)
  }

  return updated
}

// Unlock a level (for testing/demo)
export function unlockLevel(
  progress: PlayerProgress,
  levelId: number
): PlayerProgress {
  const updated = { ...progress }
  if (levelId >= updated.highestUnlockedLevel) {
    updated.highestUnlockedLevel = levelId + 1
  }
  saveProgress(updated)
  return updated
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as GameSettings
    // Validate structure — merge with defaults for any missing fields
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // silently fail
  }
}

// Toggle sound
export function toggleSound(settings: GameSettings): GameSettings {
  const updated = { ...settings, soundEnabled: !settings.soundEnabled }
  saveSettings(updated)
  return updated
}

// Toggle reduced motion
export function toggleReducedMotion(settings: GameSettings): GameSettings {
  const updated = { ...settings, reducedMotion: !settings.reducedMotion }
  saveSettings(updated)
  return updated
}

// Toggle mute
export function toggleMute(settings: GameSettings): GameSettings {
  const updated = { ...settings, mute: !settings.mute }
  saveSettings(updated)
  return updated
}

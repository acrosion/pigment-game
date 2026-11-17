// ─── useProgress Hook ─────────────────────────────────────────────────────────
// Progress and settings persistence via localStorage.

import { useState, useCallback, useMemo } from 'react'
import type { PlayerProgress, GameSettings, SavedSolution, DailyChallenge, Move } from '../types'
import { generateLevels } from './levelGenerator'
import {
  loadProgress as loadProgressData,
  saveProgress as saveProgressData,
  completeLevel,
  loadSettings as loadSettingsData,
  saveSettings as saveSettingsData,
  toggleSound,
  toggleReducedMotion,
} from './progression'

export interface ProgressState {
  progress: PlayerProgress
  settings: GameSettings
  setProgress: (progress: PlayerProgress) => void
  setSettings: (settings: GameSettings) => void
  completeAndSave: (progress: PlayerProgress, levelId: number, moveCount: number) => PlayerProgress
  toggleSoundSetting: (settings: GameSettings) => GameSettings
  toggleReducedMotionSetting: (settings: GameSettings) => GameSettings
  // Solution history
  saveSolution: (levelId: number, moveCount: number, elapsedTime: number, moves: Move[]) => SavedSolution[]
  getSolutionHistory: () => SavedSolution[]
  // Daily challenge
  dailyChallenge: DailyChallenge
  updateDailyChallenge: (challenge: DailyChallenge) => void
  resetDailyChallenge: () => DailyChallenge
}

export function useProgress(): ProgressState {
  const [progress, setProgressState] = useState<PlayerProgress>(() => loadProgressData())
  const [settings, setSettingsState] = useState<GameSettings>(() => loadSettingsData())

  const setProgress = useCallback((newProgress: PlayerProgress) => {
    setProgressState(newProgress)
    saveProgressData(newProgress)
  }, [])

  const setSettings = useCallback((newSettings: GameSettings) => {
    setSettingsState(newSettings)
    saveSettingsData(newSettings)
  }, [])

  const completeAndSave = useCallback(
    (prog: PlayerProgress, levelId: number, moveCount: number) => {
      const newProgress = completeLevel(prog, levelId, moveCount)
      setProgress(newProgress)
      return newProgress
    },
    [setProgress]
  )

  const toggleSoundSetting = useCallback((s: GameSettings) => toggleSound(s), [])

  const toggleReducedMotionSetting = useCallback((s: GameSettings) => toggleReducedMotion(s), [])


  // ─── Solution History ──────────────────────────────────────────────────────
  const [solutionHistory, setSolutionHistory] = useState<SavedSolution[]>(() => {
    try {
      const raw = localStorage.getItem('pigment_solutions')
      if (!raw) return []
      return JSON.parse(raw) as SavedSolution[]
    } catch {
      return []
    }
  })

  const saveSolution = useCallback((levelId: number, moveCount: number, elapsedTime: number, moves: Move[]) => {
    const solution: SavedSolution = {
      levelId,
      moveCount,
      elapsedTime,
      moves,
      completedAt: new Date().toISOString(),
    }
    const updated = [solution, ...solutionHistory].slice(0, 10) // Keep last 10
    setSolutionHistory(updated)
    try {
      localStorage.setItem('pigment_solutions', JSON.stringify(updated))
    } catch {
      // silently fail
    }
    return updated
  }, [solutionHistory])

  const getSolutionHistory = useCallback(() => solutionHistory, [solutionHistory])

  // ─── Daily Challenge ──────────────────────────────────────────────────────
  const dailyChallenge = useMemo(() => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    try {
      const raw = localStorage.getItem('pigment_daily')
      if (raw) {
        const parsed = JSON.parse(raw) as DailyChallenge
        if (parsed.date === today) return parsed
      }
    } catch {
      // ignore
    }
    // Generate new daily challenge (deterministic based on date)
    const seed = today.split('-').reduce((acc, d) => acc + parseInt(d), 0)
    const levelIndex = seed % 10
    const levels = generateLevels(1, 10)
    const daily: DailyChallenge = {
      date: today,
      levelId: levels[levelIndex].id,
      bestMoveCount: null,
      bestTime: null,
      completed: false,
    }
    try {
      localStorage.setItem('pigment_daily', JSON.stringify(daily))
    } catch {
      // ignore
    }
    return daily
  }, [])

  const updateDailyChallenge = useCallback((challenge: DailyChallenge) => {
    try {
      localStorage.setItem('pigment_daily', JSON.stringify(challenge))
    } catch {
      // ignore
    }
  }, [])

  const resetDailyChallenge = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    const newChallenge: DailyChallenge = {
      date: today,
      levelId: Math.floor(Math.random() * 10) + 1,
      bestMoveCount: null,
      bestTime: null,
      completed: false,
    }
    try {
      localStorage.setItem('pigment_daily', JSON.stringify(newChallenge))
    } catch {
      // ignore
    }
    return newChallenge
  }, [])

  return {
    progress,
    settings,
    setProgress,
    setSettings,
    completeAndSave,
    toggleSoundSetting,
    toggleReducedMotionSetting,
    // Solution history
    saveSolution,
    getSolutionHistory,
    // Daily challenge
    dailyChallenge,
    updateDailyChallenge,
    resetDailyChallenge,
  }
}

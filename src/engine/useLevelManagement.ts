// ─── useLevelManagement Hook ──────────────────────────────────────────────────
// Level lifecycle: generation, selection, navigation, reset.

import { useState, useCallback, useMemo } from 'react'
import type { Level } from '../types'
import { generateLevels } from './levelGenerator'

export interface LevelManagementState {
  levels: Level[]
  currentLevel: Level | undefined
  currentLevelIndex: number
  showingLevelSelect: boolean
  resetKey: number // increments when level changes, used to reset game state
  selectLevel: (levelIndex: number) => void
  nextLevel: () => void
  backFromLevelSelect: () => void
  showLevelSelect: () => void
}

function generateInitialLevels(): Level[] {
  return generateLevels(1, 10)
}

export function useLevelManagement(startLevelIndex: number = 0): LevelManagementState {
  const [levels] = useState<Level[]>(() => generateInitialLevels())
  const [currentLevelIndex, setCurrentLevelIndex] = useState(startLevelIndex)
  const [showingLevelSelect, setShowingLevelSelect] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const currentLevel = useMemo(() => levels[currentLevelIndex], [levels, currentLevelIndex])

  const handleChangeLevel = useCallback(() => {
    setResetKey((prev) => prev + 1)
  }, [])

  const selectLevel = useCallback(
    (levelIndex: number) => {
      const level = levels[levelIndex]
      if (!level) return
      handleChangeLevel()
      setCurrentLevelIndex(levelIndex)
      setShowingLevelSelect(false)
    },
    [levels, handleChangeLevel]
  )

  const nextLevel = useCallback(() => {
    const nextIndex = currentLevelIndex + 1
    if (nextIndex < levels.length) {
      handleChangeLevel()
      setCurrentLevelIndex(nextIndex)
    }
    setShowingLevelSelect(false)
  }, [currentLevelIndex, levels.length, handleChangeLevel])

  const backFromLevelSelect = useCallback(() => {
    setShowingLevelSelect(false)
  }, [])

  const showLevelSelect = useCallback(() => {
    setShowingLevelSelect(true)
  }, [])

  return {
    levels,
    currentLevel,
    currentLevelIndex,
    showingLevelSelect,
    resetKey,
    selectLevel,
    nextLevel,
    backFromLevelSelect,
    showLevelSelect,
  }
}

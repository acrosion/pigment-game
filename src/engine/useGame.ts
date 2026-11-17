// ─── useGame Hook ─────────────────────────────────────────────────────────────
// Core game state management: puzzle state, moves, undo, completion detection.
// Resets when `resetKey` changes (e.g., level selection).

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type {
  PuzzleState,
  PigmentColor,
  Move,
} from '../types'
import { isSolved, countCompletedColors, totalCount } from './puzzleState'
import {
  createHistory,
  getCurrentState,
  pushMove,
  undo,
  canUndo,
  getMoveCount,
  restart,
} from './moveHistory'
import { hasValidMoves, findBestMove, type ValidMoveInfo } from './moveValidation'

export interface GameState {
  // Derived state
  currentState: PuzzleState
  moveCount: number
  completedColors: number
  totalColors: number
  canUndo: boolean
  levelComplete: boolean
  showingComplete: boolean
  isStuck: boolean // true when no valid moves remain
  bestMove: ValidMoveInfo | null // the best available move (for hints)
  elapsedTime: number // elapsed time in seconds

  // Handlers
  handleMove: (newState: PuzzleState, move: Move) => void
  handleUndo: () => void
  handleRestart: () => void
  handleReplay: () => void
  handleNextLevel: () => void
  handleTubeComplete: (color: PigmentColor) => void
  handleBurstComplete: () => void
  handleTubeSelect: () => void
}

function createInitialGameState(puzzleState: PuzzleState) {
  return {
    history: createHistory(puzzleState),
    levelComplete: false,
    showingComplete: false,
  }
}

export function useGame(initialState: PuzzleState, resetKey: number): GameState {
  const prevKeyRef = useRef(resetKey)
  const [gameState, setGameState] = useState(() => createInitialGameState(initialState))

  // Reset when resetKey changes
  useEffect(() => {
    if (prevKeyRef.current !== resetKey) {
      prevKeyRef.current = resetKey
      setGameState(createInitialGameState(initialState))
    }
  }, [resetKey, initialState])

  // Derived state
  const currentState = useMemo(() => getCurrentState(gameState.history), [gameState.history])
  const moveCount = getMoveCount(gameState.history)

  // Timer: track elapsed time
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start timer when game starts, pause on completion
  useEffect(() => {
    if (gameState.levelComplete) {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [gameState.levelComplete, resetKey])
  const completedColors = countCompletedColors(currentState)
  const totalColors = totalCount(currentState)
  const canUndoHistory = canUndo(gameState.history)

  // Check for level completion
  useEffect(() => {
    if (isSolved(currentState) && !gameState.levelComplete) {
      setGameState((prev) => ({
        ...prev,
        levelComplete: true,
      }))
      setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          showingComplete: true,
        }))
      }, 1500)
    }
  }, [currentState, gameState.levelComplete])

  // Handlers
  const handleMove = useCallback(
    (newState: PuzzleState, move: Move) => {
      setGameState((prev) => ({
        ...prev,
        history: (() => {
          const updated = { ...prev.history }
          pushMove(updated, newState, move)
          return updated
        })(),
      }))
    },
    []
  )

  const handleUndo = useCallback(() => {
    if (!canUndoHistory) return
    setGameState((prev) => ({
      ...prev,
      history: (() => {
        const updated = { ...prev.history }
        undo(updated)
        return updated
      })(),
    }))
  }, [canUndoHistory])

  const handleRestart = useCallback(() => {
    setGameState((prev) => {
      const initial = restart(prev.history)
      return {
        ...createInitialGameState(initial),
        history: createHistory(initial),
      }
    })
  }, [])

  const handleReplay = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showingComplete: false,
      levelComplete: false,
    }))
  }, [])

  const handleNextLevel = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      showingComplete: false,
      levelComplete: false,
    }))
  }, [])

  const handleTubeComplete = useCallback((_color: PigmentColor) => {
    // Side effects (burst, revealedColors) handled by caller
  }, [])

  const handleBurstComplete = useCallback(() => {
    // Side effects handled by caller
  }, [])

  const handleTubeSelect = useCallback(() => {
    // Side effects handled by caller
  }, [])

  return {
    currentState,
    moveCount,
    completedColors,
    totalColors,
    canUndo: canUndoHistory,
    levelComplete: gameState.levelComplete,
    showingComplete: gameState.showingComplete,
    isStuck: !isSolved(currentState) && !hasValidMoves(currentState),
    bestMove: isSolved(currentState) ? null : findBestMove(currentState),
    elapsedTime,
    handleMove,
    handleUndo,
    handleRestart,
    handleReplay,
    handleNextLevel,
    handleTubeComplete,
    handleBurstComplete,
    handleTubeSelect,
  }
}

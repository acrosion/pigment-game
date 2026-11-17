// ─── Move History (undo/redo) ────────────────────────────────────────────────
// Stack-based history for undo and restart.
// No redo — restart resets to initial state.

import type {
  PuzzleState,
  Move,
  HistoryEntry,
} from '../types'
import { cloneState } from './puzzleState'

export interface MoveHistory {
  entries: HistoryEntry[]
  currentIndex: number
}

export function createHistory(initialState: PuzzleState): MoveHistory {
  return {
    entries: [{ state: cloneState(initialState), move: null }],
    currentIndex: 0,
  }
}

// Get current state from history
export function getCurrentState(history: MoveHistory): PuzzleState {
  return cloneState(history.entries[history.currentIndex].state)
}

// Get initial state
export function getInitialState(history: MoveHistory): PuzzleState {
  return cloneState(history.entries[0].state)
}

// Push a new move onto the history
export function pushMove(
  history: MoveHistory,
  state: PuzzleState,
  move: Move
): void {
  // Discard any future states (undo was performed)
  history.entries = history.entries.slice(0, history.currentIndex + 1)
  history.entries.push({ state: cloneState(state), move })
  history.currentIndex = history.entries.length - 1
}

// Undo the last move
export function undo(history: MoveHistory): PuzzleState | null {
  if (history.currentIndex <= 0) return null
  history.currentIndex--
  return cloneState(history.entries[history.currentIndex].state)
}

// Check if undo is available
export function canUndo(history: MoveHistory): boolean {
  return history.currentIndex > 0
}

// Check if at initial state
export function isAtInitialState(history: MoveHistory): boolean {
  return history.currentIndex === 0
}

// Restart to initial state
export function restart(history: MoveHistory): PuzzleState {
  history.currentIndex = 0
  return cloneState(history.entries[0].state)
}

// Get move count since initial state
export function getMoveCount(history: MoveHistory): number {
  return history.currentIndex
}

// Get the last move (for display)
export function getLastMove(history: MoveHistory): Move | null {
  if (history.currentIndex <= 0) return null
  return history.entries[history.currentIndex].move
}

// Get total entries (for debugging/stats)
export function getHistoryLength(history: MoveHistory): number {
  return history.entries.length
}

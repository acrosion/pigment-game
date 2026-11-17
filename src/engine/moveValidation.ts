// ─── Move Validation ─────────────────────────────────────────────────────────
// All rules for valid pigment pours.
// Returns null if invalid, or the number of units that would be poured if valid.

import type {
  PuzzleState,
} from '../types'
import {
  getTopColor,
  getTopGroup,
  getRemainingCapacity,
  isEmpty,
} from './puzzleState'

export interface ValidMove {
  units: number // how many units would be poured
}

export interface InvalidMoveReason {
  reason:
    | 'source_empty'
    | 'same_tube'
    | 'no_matching_color'
    | 'dest_full'
    | 'dest_wrong_color'
}

// Check if a move is valid. Returns the number of units that would pour,
// or null with a reason if invalid.
export function validateMove(
  state: PuzzleState,
  fromIndex: number,
  toIndex: number
): ValidMove | null | InvalidMoveReason {
  // Bounds check
  if (fromIndex < 0 || fromIndex >= state.tubes.length) {
    return { reason: 'source_empty' }
  }
  if (toIndex < 0 || toIndex >= state.tubes.length) {
    return { reason: 'dest_full' }
  }

  const source = state.tubes[fromIndex]
  const dest = state.tubes[toIndex]

  // Cannot pour from empty tube
  if (isEmpty(source)) {
    return { reason: 'source_empty' }
  }

  // Cannot pour into the same tube
  if (fromIndex === toIndex) {
    return { reason: 'same_tube' }
  }

  // Get the contiguous top group from source
  const topGroup = getTopGroup(source)
  const sourceColor = getTopColor(source)!

  // Destination is full
  if (getRemainingCapacity(dest) === 0) {
    return { reason: 'dest_full' }
  }

  // If destination is not empty, top color must match
  if (!isEmpty(dest)) {
    const destTopColor = getTopColor(dest)!
    if (destTopColor !== sourceColor) {
      return { reason: 'dest_wrong_color' }
    }
  }

  // Calculate how many units can be poured
  const available = topGroup.length
  const space = getRemainingCapacity(dest)
  const unitsToPour = Math.min(available, space)

  return { units: unitsToPour }
}

// Execute a validated move, returning new state
export function executeMove(
  state: PuzzleState,
  fromIndex: number,
  toIndex: number,
  units: number
): PuzzleState {
  const newState = {
    tubes: state.tubes.map((tube) => ({
      pigments: [...tube.pigments],
    })),
  }

  const source = newState.tubes[fromIndex]
  const dest = newState.tubes[toIndex]

  // Pop `units` from source
  for (let i = 0; i < units; i++) {
    dest.pigments.push(source.pigments.pop()!)
  }

  return newState
}

// Check if a move would complete a tube
export function wouldCompleteTube(
  state: PuzzleState,
  fromIndex: number,
  toIndex: number,
  units: number
): boolean {
  // Simulate the pour
  const source = state.tubes[fromIndex]
  const dest = state.tubes[toIndex]
  const destColor = getTopColor(dest)

  if (isEmpty(dest)) {
    // Pouring into empty tube can't complete it (need 4 units)
    return units === 4
  }

  // After pour, dest will have (current + units) pigments
  const newLength = dest.pigments.length + units
  return newLength === 4 && destColor === getTopColor(source)
}

// ─── Stuck Detection ─────────────────────────────────────────────────────────

export interface ValidMoveInfo {
  fromIndex: number
  toIndex: number
  units: number
}

// Find all valid moves from the current state
export function findAllValidMoves(state: PuzzleState): ValidMoveInfo[] {
  const moves: ValidMoveInfo[] = []

  for (let from = 0; from < state.tubes.length; from++) {
    if (isEmpty(state.tubes[from])) continue

    const topGroup = getTopGroup(state.tubes[from])
    const sourceColor = getTopColor(state.tubes[from])!

    for (let to = 0; to < state.tubes.length; to++) {
      if (from === to) continue
      if (getRemainingCapacity(state.tubes[to]) === 0) continue

      // If dest is not empty, colors must match
      if (!isEmpty(state.tubes[to])) {
        const destColor = getTopColor(state.tubes[to])!
        if (destColor !== sourceColor) continue
      }

      const unitsToPour = Math.min(topGroup.length, getRemainingCapacity(state.tubes[to]))
      if (unitsToPour > 0) {
        moves.push({ fromIndex: from, toIndex: to, units: unitsToPour })
      }
    }
  }

  return moves
}

// Check if the current state has any valid moves
export function hasValidMoves(state: PuzzleState): boolean {
  return findAllValidMoves(state).length > 0
}

// Find the best valid move (prioritizes tube completion, then freeing colors)
export function findBestMove(state: PuzzleState): ValidMoveInfo | null {
  const validMoves = findAllValidMoves(state)
  if (validMoves.length === 0) return null

  // Priority 1: moves that complete a tube
  for (const move of validMoves) {
    if (wouldCompleteTube(state, move.fromIndex, move.toIndex, move.units)) {
      return move
    }
  }

  // Priority 2: moves that free up a color (pour into empty tube)
  const emptyTubes: number[] = []
  for (let i = 0; i < state.tubes.length; i++) {
    if (isEmpty(state.tubes[i])) emptyTubes.push(i)
  }
  for (const move of validMoves) {
    if (emptyTubes.includes(move.toIndex)) {
      return move
    }
  }

  // Priority 3: any valid move
  return validMoves[0]
}

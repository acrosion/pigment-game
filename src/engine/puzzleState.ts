// ─── Puzzle State (immutable) ────────────────────────────────────────────────
// Pure data layer: tube state, pigment types, max capacity.
// All functions return new state — no mutation.

import type {
  Tube,
  PuzzleState,
  PigmentUnit,
} from '../types'
import { TUBE_CAPACITY } from '../types'

// Re-export PuzzleState for consumers
export type { PuzzleState } from '../types'

// Create an empty tube
export function createEmptyTube(): Tube {
  return { pigments: [] }
}

// Create a tube with pigments (validates capacity)
export function createTube(pigments: PigmentUnit[]): Tube {
  if (pigments.length > TUBE_CAPACITY) {
    throw new Error(
      `Tube capacity exceeded: ${pigments.length} > ${TUBE_CAPACITY}`
    )
  }
  return { pigments }
}

// Create a full puzzle state from tube configurations
export function createPuzzleState(tubes: Tube[]): PuzzleState {
  return { tubes }
}

// Clone a puzzle state (deep copy)
export function cloneState(state: PuzzleState): PuzzleState {
  return {
    tubes: state.tubes.map((tube) => ({
      pigments: [...tube.pigments],
    })),
  }
}

// Get the top pigment color of a tube (undefined if empty)
export function getTopColor(tube: Tube): PigmentUnit['color'] | undefined {
  return tube.pigments.length > 0
    ? tube.pigments[tube.pigments.length - 1].color
    : undefined
}

// Get the contiguous group of same-color pigments at the top
export function getTopGroup(tube: Tube): PigmentUnit[] {
  if (tube.pigments.length === 0) return []
  const topColor = tube.pigments[tube.pigments.length - 1].color
  const group: PigmentUnit[] = []
  for (let i = tube.pigments.length - 1; i >= 0; i--) {
    if (tube.pigments[i].color === topColor) {
      group.unshift(tube.pigments[i])
    } else {
      break
    }
  }
  return group
}

// Get remaining capacity of a tube
export function getRemainingCapacity(tube: Tube): number {
  return TUBE_CAPACITY - tube.pigments.length
}

// Check if a tube is complete (all 4 units same color)
export function isTubeComplete(tube: Tube): boolean {
  return (
    tube.pigments.length === TUBE_CAPACITY &&
    getTopColor(tube) !== undefined &&
    tube.pigments.every((p) => p.color === getTopColor(tube)!)
  )
}

// Check if a tube is empty
export function isEmpty(tube: Tube): boolean {
  return tube.pigments.length === 0
}

// Check if a puzzle is fully solved (all non-empty tubes are complete)
export function isSolved(state: PuzzleState): boolean {
  return state.tubes.every(
    (tube) => isEmpty(tube) || isTubeComplete(tube)
  )
}

// Get all distinct colors in the puzzle
export function getDistinctColors(state: PuzzleState): PigmentUnit['color'][] {
  const colors = new Set<PigmentUnit['color']>()
  for (const tube of state.tubes) {
    for (const pigment of tube.pigments) {
      colors.add(pigment.color)
    }
  }
  return Array.from(colors)
}

// Count completed tubes
export function countCompleted(state: PuzzleState): number {
  return state.tubes.filter(isTubeComplete).length
}

// Count total distinct colors that are complete
export function countCompletedColors(state: PuzzleState): number {
  const completedColors = new Set<PigmentUnit['color']>()
  for (const tube of state.tubes) {
    if (isTubeComplete(tube)) {
      const color = getTopColor(tube)!
      completedColors.add(color)
    }
  }
  return completedColors.size
}

// Get total distinct colors in the puzzle
export function totalCount(state: PuzzleState): number {
  return getDistinctColors(state).length
}

// ─── Deep Equality ───────────────────────────────────────────────────────────

export function statesEqual(a: PuzzleState, b: PuzzleState): boolean {
  if (a.tubes.length !== b.tubes.length) return false
  for (let i = 0; i < a.tubes.length; i++) {
    const ta = a.tubes[i]
    const tb = b.tubes[i]
    if (ta.pigments.length !== tb.pigments.length) return false
    for (let j = 0; j < ta.pigments.length; j++) {
      if (ta.pigments[j].color !== tb.pigments[j].color) return false
    }
  }
  return true
}

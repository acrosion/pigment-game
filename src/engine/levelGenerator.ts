// ─── Level Generator ─────────────────────────────────────────────────────────
// Reverse-solve approach: start from a solved state, apply random valid moves
// to shuffle. This guarantees every generated puzzle is solvable.

import type {
  Level,
  Tube,
  PigmentColor,
  PigmentUnit,
} from '../types'
import { TUBE_CAPACITY, PIGMENT_COLORS } from '../types'
import {
  createEmptyTube,
  createTube,
  getTopColor,
  getTopGroup,
  getRemainingCapacity,
  isEmpty,
  isSolved,
  getDistinctColors,
  createPuzzleState,
  type PuzzleState,
} from './puzzleState'
import { executeMove } from './moveValidation'

// A solved state has each color in its own complete tube
function createSolvedState(
  colors: PigmentColor[],
  numEmptyTubes: number
): Tube[] {
  const tubes: Tube[] = []

  // Create one tube per color, fully filled
  for (const color of colors) {
    tubes.push(createTube(Array(TUBE_CAPACITY).fill(null).map(() => ({ color })) as PigmentUnit[]))
  }

  // Add empty tubes
  for (let i = 0; i < numEmptyTubes; i++) {
    tubes.push(createEmptyTube())
  }

  return tubes
}

// Generate a single level
export function generateLevel(
  levelId: number,
  colorCount: number,
  numEmptyTubes: number,
  shuffleMoves: number
): Level {
  // Select colors for this level
  const colors: PigmentColor[] = []
  for (let i = 0; i < colorCount; i++) {
    colors.push(PIGMENT_COLORS[i % PIGMENT_COLORS.length])
  }

  // Start from solved state
  let tubes = createSolvedState(colors, numEmptyTubes)

  // Shuffle by applying random valid moves
  // We MUST make at least 10 moves to guarantee we escape the solved state
  let state = { tubes }
  const maxAttempts = shuffleMoves * 10
  let attempts = 0
  let movesMade = 0

  while (attempts < maxAttempts) {
    attempts++

    // Find all valid moves
    const validMoves = findValidMoves(state)
    if (validMoves.length === 0) break

    // Pick a random valid move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)]

    // Execute the move
    const source = state.tubes[move.fromIndex]
    const dest = state.tubes[move.toIndex]
    const topGroup = getTopGroup(source)
    const unitsToPour = Math.min(
      topGroup.length,
      getRemainingCapacity(dest)
    )

    if (unitsToPour === 0) continue

    state.tubes = state.tubes.map((t) => ({
      pigments: [...t.pigments],
    }))

    for (let j = 0; j < unitsToPour; j++) {
      state.tubes[move.toIndex].pigments.push(
        state.tubes[move.fromIndex].pigments.pop()!
      )
    }
    movesMade++

    // If we've done enough shuffling, stop
    if (movesMade >= shuffleMoves) break
  }

  // Guarantee: if still solved, force-break by moving pigments between tubes
  if (isSolved(state) && movesMade > 0) {
    // Find an empty tube and move one pigment into it from a filled tube
    const emptyIdx = state.tubes.findIndex((t) => isEmpty(t))
    if (emptyIdx >= 0) {
      // Find a filled tube with > 1 pigment
      const filledIdx = state.tubes.findIndex(
        (t) => !isEmpty(t) && t.pigments.length > 1
      )
      if (filledIdx >= 0 && filledIdx !== emptyIdx) {
        state.tubes = state.tubes.map((t) => ({
          pigments: [...t.pigments],
        }))
        const pigment = state.tubes[filledIdx].pigments.pop()!
        state.tubes[emptyIdx].pigments.push(pigment)
      }
    }
  }

  return {
    id: levelId,
    name: `Level ${levelId}`,
    tubes: state.tubes,
    colorCount,
  }
}

// Find all valid moves from a state (for shuffling)
function findValidMoves(state: { tubes: Tube[] }): Array<{
  fromIndex: number
  toIndex: number
}> {
  const moves: Array<{ fromIndex: number; toIndex: number }> = []

  for (let from = 0; from < state.tubes.length; from++) {
    if (isEmpty(state.tubes[from])) continue

    for (let to = 0; to < state.tubes.length; to++) {
      if (from === to) continue
      if (getRemainingCapacity(state.tubes[to]) === 0) continue

      // If dest is not empty, colors must match
      if (!isEmpty(state.tubes[to])) {
        const srcColor = getTopColor(state.tubes[from])!
        const destColor = getTopColor(state.tubes[to])!
        if (srcColor !== destColor) continue
      }

      moves.push({ fromIndex: from, toIndex: to })
    }
  }

  return moves
}

// Generate a sequence of levels
export function generateLevels(
  startId: number,
  count: number
): Level[] {
  const levels: Level[] = []

  for (let i = 0; i < count; i++) {
    const levelNum = startId + i
    // Scale difficulty with level number
    const colorCount = Math.min(10, 3 + Math.floor(levelNum / 2))
    const numEmptyTubes = Math.max(1, 2 - Math.floor(levelNum / 10))
    const shuffleMoves = 20 + levelNum * 10

    const level = generateLevel(levelNum, colorCount, numEmptyTubes, shuffleMoves)

    // Calculate par for levels where it's feasible (BFS is expensive for large puzzles)
    if (colorCount <= 6 && numEmptyTubes >= 1) {
      level.par = calculatePar(level)
    } else {
      // Approximate par for larger levels: colorCount * 3 + levelNum * 2
      level.par = colorCount * 3 + levelNum * 2
    }

    levels.push(level)
  }

  return levels
}

// Validate that a level's initial state is not already solved
export function isLevelPlayable(level: Level): boolean {
  return !isSolved({ tubes: level.tubes })
}

// Validate solvability (trivial for reverse-generated levels, but check anyway)
export function validateLevel(level: Level): boolean {
  // Check basic invariants
  if (level.tubes.length < 3) return false // need at least 1 filled + 2 empty

  for (const tube of level.tubes) {
    if (tube.pigments.length > TUBE_CAPACITY) return false
  }

  // Check that all colors are used
  const colors = getDistinctColors({ tubes: level.tubes })
  if (colors.length !== level.colorCount) return false

  // Check not already solved
  if (isSolved({ tubes: level.tubes })) return false

  return true
}

// Generate and validate a single level
export function generateValidLevel(
  levelId: number,
  colorCount: number,
  numEmptyTubes: number
): Level {
  let level: Level
  let attempts = 0

  do {
    level = generateLevel(levelId, colorCount, numEmptyTubes, 30)
    attempts++
  } while (!validateLevel(level) && attempts < 10)

  if (!validateLevel(level)) {
    // Fallback: create a simple unsolved state
    level = generateLevel(levelId, colorCount, numEmptyTubes, 5)
  }

  return level
}

// Calculate the par (optimal move count) for a level using BFS
export function calculatePar(level: Level): number {
  const initialState = createPuzzleState(level.tubes)
  const visited = new Set<string>()
  visited.add(stateKey(initialState))

  const queue: Array<{ state: PuzzleState; depth: number }> = [
    { state: initialState, depth: 0 },
  ]

  while (queue.length > 0) {
    const { state, depth } = queue.shift()!

    if (isSolved(state)) {
      return depth
    }

    // If depth exceeds reasonable limit, give up
    if (depth > 50) return -1

    // Generate all valid moves
    for (let from = 0; from < state.tubes.length; from++) {
      if (isEmpty(state.tubes[from])) continue

      const topGroup = getTopGroup(state.tubes[from])
      const sourceColor = getTopColor(state.tubes[from])!

      for (let to = 0; to < state.tubes.length; to++) {
        if (from === to) continue
        if (getRemainingCapacity(state.tubes[to]) === 0) continue

        if (!isEmpty(state.tubes[to])) {
          const destColor = getTopColor(state.tubes[to])!
          if (destColor !== sourceColor) continue
        }

        const unitsToPour = Math.min(topGroup.length, getRemainingCapacity(state.tubes[to]))
        if (unitsToPour === 0) continue

        const newState = executeMove(state, from, to, unitsToPour)
        const key = stateKey(newState)

        if (!visited.has(key)) {
          visited.add(key)
          queue.push({ state: newState, depth: depth + 1 })
        }
      }
    }
  }

  return -1 // unsolvable (shouldn't happen for valid levels)
}

// Create a unique key for a puzzle state (for BFS visited set)
function stateKey(state: PuzzleState): string {
  return state.tubes
    .map((tube: Tube) =>
      tube.pigments.map((p: PigmentUnit) => p.color).join('')
    )
    .join('|')
}

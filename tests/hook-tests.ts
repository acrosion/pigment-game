// ─── Hook Tests ───────────────────────────────────────────────────────────────
// Run: npx tsx tests/hook-tests.ts

// Mock localStorage for Node.js
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, val: string) => store.set(key, val),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  get length() { return store.size },
  key: (i: number) => { const keys = Array.from(store.keys()); return keys[i] ?? null },
} as unknown as Storage

import {
  loadProgress,
  saveProgress,
  completeLevel,
  unlockLevel,
  loadSettings,
  saveSettings,
  toggleSound,
  toggleReducedMotion,
} from '../src/engine/progression'

import {
  generateLevels,
  generateValidLevel,
  validateLevel,
  isLevelPlayable,
} from '../src/engine/levelGenerator'

import {
  createEmptyTube,
  createTube,
  createPuzzleState,
  isSolved,
  countCompletedColors,
  totalCount,
} from '../src/engine/puzzleState'

import {
  createHistory,
  getCurrentState,
  pushMove,
  undo,
  canUndo,
  getMoveCount,
  restart,
} from '../src/engine/moveHistory'

import { validateMove, executeMove } from '../src/engine/moveValidation'

// ─── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++
    console.log(`  ✓ ${message}`)
  } else {
    failed++
    console.error(`  ✗ ${message}`)
  }
}

function section(name: string): void {
  console.log(`\n▸ ${name}`)
}

function clean(): void {
  localStorage.removeItem('pigment_progress')
  localStorage.removeItem('pigment_settings')
}

// ─── Progress edge cases ─────────────────────────────────────────────────────

section('progress edge cases')

{
  // Corrupted localStorage data
  try {
    localStorage.setItem('pigment_progress', 'not-json')
    const corrupted = loadProgress()
    assert(corrupted.highestUnlockedLevel === 1, 'corrupted data falls back to defaults')
  } catch (e) {
    assert(false, `corrupted data should not throw: ${e}`)
  }

  // Missing keys
  try {
    localStorage.setItem('pigment_progress', '{"foo": "bar"}')
    const missing = loadProgress()
    assert(missing.highestUnlockedLevel === 1, 'missing keys falls back to defaults')
  } catch (e) {
    assert(false, `missing keys should not throw: ${e}`)
  }

  // Empty string
  try {
    localStorage.setItem('pigment_progress', '')
    const empty = loadProgress()
    assert(empty.highestUnlockedLevel === 1, 'empty string falls back to defaults')
  } catch (e) {
    assert(false, `empty string should not throw: ${e}`)
  }

  // Null
  try {
    localStorage.removeItem('pigment_progress')
    const nullProgress = loadProgress()
    assert(nullProgress.highestUnlockedLevel === 1, 'null/missing key falls back to defaults')
  } catch (e) {
    assert(false, `null should not throw: ${e}`)
  }

  // Settings corrupted
  try {
    localStorage.setItem('pigment_settings', '{invalid')
    const corruptedSettings = loadSettings()
    assert(corruptedSettings.soundEnabled === true, 'corrupted settings falls back to defaults')
  } catch (e) {
    assert(false, `corrupted settings should not throw: ${e}`)
  }

  clean()
}

// ─── Level unlock gating ─────────────────────────────────────────────────────

section('level unlock gating')

{
  const progress = {
    highestUnlockedLevel: 3,
    completedLevels: [1, 2],
    moveCounts: { 1: 12, 2: 18 },
  }

  // Level 0 (id=1) should be unlocked
  assert(0 < progress.highestUnlockedLevel, 'level 0 unlocked when < highestUnlockedLevel')

  // Level 2 (id=3) should be unlocked
  assert(2 < progress.highestUnlockedLevel, 'level 2 unlocked when < highestUnlockedLevel')

  // Level 3 (id=4) should be locked
  assert(3 >= progress.highestUnlockedLevel, 'level 3 locked when >= highestUnlockedLevel')

  // Level 5 (id=6) should be locked
  assert(5 >= progress.highestUnlockedLevel, 'level 5 locked when >= highestUnlockedLevel')

  // Auto-unlock on completion
  const afterComplete = completeLevel(progress, 3, 20)
  assert(afterComplete.highestUnlockedLevel === 4, 'completing level 3 unlocks level 4')
  assert(afterComplete.completedLevels.includes(3), 'level 3 added to completed')
  assert(afterComplete.moveCounts[3] === 20, 'best move count saved')

  clean()
}

// ─── Level generation consistency ────────────────────────────────────────────

section('level generation consistency')

{
  // Generate same level twice — should produce same structure (not necessarily same order)
  const level1 = generateValidLevel(1, 3, 2)
  const level2 = generateValidLevel(1, 3, 2)

  assert(level1.id === level2.id, 'same level id')
  assert(level1.colorCount === level2.colorCount, 'same color count')
  assert(level1.tubes.length === level2.tubes.length, 'same tube count')

  // Validate consistency
  assert(validateLevel(level1), 'level 1 validates')
  assert(validateLevel(level2), 'level 2 validates')
  assert(isLevelPlayable(level1), 'level 1 playable')
  assert(isLevelPlayable(level2), 'level 2 playable')

  // Generate sequence — all should be valid
  const seq = generateLevels(1, 10)
  assert(seq.length === 10, 'generateLevels returns 10 levels')
  for (const lvl of seq) {
    assert(validateLevel(lvl), `level ${lvl.id} validates`)
    assert(isLevelPlayable(lvl), `level ${lvl.id} playable`)
  }

  // Difficulty scales with level number
  const l3 = generateValidLevel(3, 4, 2)
  const l10 = generateValidLevel(10, 7, 2)
  assert(l3.colorCount === 4, 'level 3 has 4 colors')
  assert(l10.colorCount === 7, 'level 10 has 7 colors')
}

// ─── Move validation edge cases ──────────────────────────────────────────────

section('move validation edge cases')

{
  const tube1 = createTube([{ color: 'red' }, { color: 'red' }, { color: 'red' }])
  const tube2 = createEmptyTube()
  const tube3 = createTube([{ color: 'blue' }])
  const tube4 = createTube([
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
  ])
  const state = createPuzzleState([tube1, tube2, tube3, tube4])

  // Valid: pour into empty tube
  const intoEmpty = validateMove(state, 0, 1)
  assert(intoEmpty !== null && 'units' in intoEmpty, 'valid pour into empty')
  if (intoEmpty !== null && 'units' in intoEmpty) {
    assert(intoEmpty.units === 3, `pour 3 units into empty, got ${intoEmpty.units}`)
  }

  // Invalid: into full tube
  const intoFull = validateMove(state, 0, 3)
  assert(intoFull !== null && 'reason' in intoFull, 'full dest rejected')

  // Invalid: out of bounds
  const oob = validateMove(state, 0, 5)
  assert(oob !== null && 'reason' in oob, 'out of bounds rejected')

  // Execute and verify
  const newState = executeMove(state, 0, 1, 3)
  assert(newState.tubes[0].pigments.length === 0, 'source emptied')
  assert(newState.tubes[1].pigments.length === 3, 'dest has 3 pigments')
  assert(newState.tubes[1].pigments.every((p) => p.color === 'red'), 'all red')
}

// ─── History undo edge cases ─────────────────────────────────────────────────

section('history edge cases')

{
  const initial = createPuzzleState([createTube([{ color: 'red' }]), createEmptyTube()])
  const history = createHistory(initial)

  // Multiple undos at start
  const undone1 = undo(history)
  assert(undone1 === null, 'undo at start returns null')
  assert(!canUndo(history), 'canUndo false at start')

  // Push moves then undo
  const move1 = { fromIndex: 0, toIndex: 1, units: 1 }
  const afterMove1 = createPuzzleState([createEmptyTube(), createTube([{ color: 'red' }])])
  pushMove(history, afterMove1, move1)
  assert(canUndo(history), 'canUndo after move')
  assert(getMoveCount(history) === 1, 'move count 1')

  // Undo
  const beforeUndo = undo(history)
  assert(beforeUndo !== null, 'undo returns state')
  assert(getMoveCount(history) === 0, 'move count 0 after undo')

  // Push again to discard undone future
  pushMove(history, afterMove1, move1)
  assert(getMoveCount(history) === 1, 'move count 1')

  // Restart
  const restarted = restart(history)
  assert(restarted.tubes[0].pigments.length === 1, 'restart restores source')
  assert(restarted.tubes[1].pigments.length === 0, 'restart restores dest')
}

// ─── Solved state detection ─────────────────────────────────────────────────

section('solved detection')

{
  // All tubes complete
  const solved = createPuzzleState([
    createTube([{ color: 'red' }, { color: 'red' }, { color: 'red' }, { color: 'red' }]),
    createTube([{ color: 'blue' }, { color: 'blue' }, { color: 'blue' }, { color: 'blue' }]),
    createEmptyTube(),
  ])
  assert(isSolved(solved), 'all complete = solved')
  assert(countCompletedColors(solved) === 2, '2 completed colors')
  assert(totalCount(solved) === 2, '2 total colors')

  // One tube not complete
  const notSolved = createPuzzleState([
    createTube([{ color: 'red' }, { color: 'red' }, { color: 'red' }, { color: 'red' }]),
    createTube([{ color: 'blue' }, { color: 'blue' }, { color: 'blue' }]),
    createEmptyTube(),
  ])
  assert(!isSolved(notSolved), 'not all complete = not solved')
  assert(countCompletedColors(notSolved) === 1, '1 completed color')
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`═══════════════════════════════════════════`)

if (failed > 0) {
  process.exit(1)
}

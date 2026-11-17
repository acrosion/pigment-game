// ─── Engine Tests ────────────────────────────────────────────────────────────
// Run: npx tsx tests/engine.test.ts

import {
  createEmptyTube,
  createTube,
  createPuzzleState,
  cloneState,
  getTopColor,
  getTopGroup,
  getRemainingCapacity,
  isTubeComplete,
  isEmpty,
  isSolved,
  getDistinctColors,
  countCompleted,
  countCompletedColors,
  totalCount,
  statesEqual,
} from '../src/engine/puzzleState'

import {
  validateMove,
  executeMove,
  wouldCompleteTube,
} from '../src/engine/moveValidation'

import {
  createHistory,
  getCurrentState,
  getInitialState,
  pushMove,
  undo,
  canUndo,
  isAtInitialState,
  restart,
  getMoveCount,
  getLastMove,
} from '../src/engine/moveHistory'

import {
  generateLevel,
  generateLevels,
  generateValidLevel,
  validateLevel,
  isLevelPlayable,
} from '../src/engine/levelGenerator'

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

// ─── puzzleState tests ──────────────────────────────────────────────────────

section('puzzleState')

{
  const empty = createEmptyTube()
  assert(empty.pigments.length === 0, 'createEmptyTube creates empty tube')

  const filled = createTube([
    { color: 'red' },
    { color: 'red' },
    { color: 'blue' },
  ])
  assert(filled.pigments.length === 3, 'createTube creates tube with pigments')

  try {
    createTube([
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
    ])
    assert(false, 'createTube rejects > 4 pigments')
  } catch {
    assert(true, 'createTube rejects > 4 pigments')
  }

  const state = createPuzzleState([filled, createEmptyTube()])
  assert(state.tubes.length === 2, 'createPuzzleState creates state')

  const cloned = cloneState(state)
  assert(cloned.tubes.length === 2, 'cloneState copies tubes')
  assert(statesEqual(cloned, state), 'cloneState equals original')

  assert(getTopColor(filled) === 'blue', 'getTopColor returns top pigment')
  assert(getTopColor(empty) === undefined, 'getTopColor on empty returns undefined')

  const topGroup = getTopGroup(filled)
  assert(topGroup.length === 1, 'getTopGroup returns contiguous group (1 blue)')

  const filled2 = createTube([
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
  ])
  assert(getTopGroup(filled2).length === 4, 'getTopGroup returns all 4 when same color')

  assert(getRemainingCapacity(empty) === 4, 'getRemainingCapacity on empty = 4')
  assert(getRemainingCapacity(filled) === 1, 'getRemainingCapacity on 3-pigment tube = 1')

  assert(isTubeComplete(filled2), 'isTubeComplete: all 4 same color')
  assert(!isTubeComplete(filled), 'isTubeComplete: mixed colors')
  assert(!isTubeComplete(empty), 'isTubeComplete: empty')

  assert(isEmpty(empty), 'isEmpty: empty tube')
  assert(!isEmpty(filled), 'isEmpty: non-empty tube')

  const solved = createPuzzleState([
    createTube([
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
      { color: 'red' },
    ]),
    createEmptyTube(),
  ])
  assert(isSolved(solved), 'isSolved: single filled + empty')

  const unsolved = createPuzzleState([filled, createEmptyTube()])
  assert(!isSolved(unsolved), 'isSolved: mixed state not solved')

  const colors = getDistinctColors(unsolved)
  assert(colors.includes('red') && colors.includes('blue'), 'getDistinctColors finds all colors')

  assert(countCompleted(unsolved) === 0, 'countCompleted: no completed tubes')
  assert(countCompletedColors(unsolved) === 0, 'countCompletedColors: no complete colors')

  assert(totalCount(unsolved) === 2, 'totalCount: 2 distinct colors')
}

// ─── moveValidation tests ────────────────────────────────────────────────────

section('moveValidation')

{
  // Tube layout:
  //   [0] [blue, red, red]     top=red, topGroup=2 reds
  //   [1] [red]                top=red
  //   [2] [green]              top=green
  //   [3] [red, red, red, red] full
  const source = createTube([
    { color: 'blue' },
    { color: 'red' },
    { color: 'red' },
  ])
  const destSameColor = createTube([{ color: 'red' }])
  const destDifferentColor = createTube([{ color: 'green' }])
  const destFull = createTube([
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
    { color: 'red' },
  ])

  const state = createPuzzleState([source, destSameColor, destDifferentColor, destFull])

  // Valid: pour 2 reds from [0] into [1] (matches top color, has space)
  const valid = validateMove(state, 0, 1)
  assert(valid !== null && typeof valid === 'object' && 'units' in valid, 'valid move returns units')
  if (typeof valid === 'object' && 'units' in valid) {
    assert(valid.units === 2, `valid move pours 2 units, got ${valid.units}`)
  }

  // Invalid: same tube
  const sameTube = validateMove(state, 0, 0)
  assert(sameTube !== null && 'reason' in sameTube && sameTube.reason === 'same_tube', 'same tube rejected')

  // Invalid: empty source (tube 3 is full, not empty — use a fresh empty tube)
  const emptyTube = createEmptyTube()
  const stateWithEmpty = createPuzzleState([source, destSameColor, destDifferentColor, emptyTube])
  const emptySource = validateMove(stateWithEmpty, 3, 1)
  assert(
    emptySource !== null && 'reason' in emptySource && emptySource.reason === 'source_empty',
    'empty source rejected'
  )

  // Invalid: dest full
  const destFullMove = validateMove(state, 0, 3)
  assert(
    destFullMove !== null && 'reason' in destFullMove && destFullMove.reason === 'dest_full',
    'full dest rejected'
  )

  // Invalid: wrong color (pour red from [0] into [2] which has green on top)
  const wrongColor = validateMove(state, 0, 2)
  assert(
    wrongColor !== null && 'reason' in wrongColor && wrongColor.reason === 'dest_wrong_color',
    'wrong color rejected (dest not empty)'
  )

  // Valid: pour into dest with matching color (empty dest is always valid)
  const emptyDest = createEmptyTube()
  const stateWithEmptyDest = createPuzzleState([source, destSameColor, destDifferentColor, emptyDest])
  const intoEmpty = validateMove(stateWithEmptyDest, 0, 3)
  assert(intoEmpty !== null && 'units' in intoEmpty, 'valid pour into empty dest')

  // Execute move: pour 2 reds from [0] into [3] (which has 1 red, space for 3 more)
  const newState = executeMove(state, 0, 1, 2)
  assert(newState.tubes[0].pigments.length === 1, 'executeMove: source decreased')
  assert(newState.tubes[1].pigments.length === 3, 'executeMove: dest increased')
  assert(newState.tubes[1].pigments[1].color === 'red', 'executeMove: correct color moved')
}

// ─── moveHistory tests ───────────────────────────────────────────────────────

section('moveHistory')

{
  const initial = createPuzzleState([createTube([{ color: 'red' }]), createEmptyTube()])
  const history = createHistory(initial)

  assert(canUndo(history) === false, 'canUndo: initial state')
  assert(isAtInitialState(history), 'isAtInitialState: initial')

  const current = getCurrentState(history)
  assert(statesEqual(current, initial), 'getCurrentState returns initial')

  const firstMove = { fromIndex: 0, toIndex: 1, units: 1 }
  const afterMove = createPuzzleState([createEmptyTube(), createTube([{ color: 'red' }])])
  pushMove(history, afterMove, firstMove)

  assert(canUndo(history) === true, 'canUndo: after move')
  assert(getMoveCount(history) === 1, 'getMoveCount: 1')

  const undone = undo(history)
  assert(undone !== null && statesEqual(undone, initial), 'undo returns to initial')
  assert(isAtInitialState(history), 'isAtInitialState: after undo')
  assert(getMoveCount(history) === 0, 'getMoveCount: 0 after undo')

  // Push another move
  const secondMove = { fromIndex: 1, toIndex: 0, units: 1 }
  const afterSecond = createPuzzleState([createTube([{ color: 'red' }]), createEmptyTube()])
  pushMove(history, afterSecond, secondMove)
  assert(getMoveCount(history) === 1, 'getMoveCount: 1 after second move (undo discarded future)')

  // Restart
  const restarted = restart(history)
  assert(statesEqual(restarted, initial), 'restart returns to initial')
  assert(isAtInitialState(history), 'isAtInitialState: after restart')
  assert(getMoveCount(history) === 0, 'getMoveCount: 0 after restart')
}

// ─── levelGenerator tests ────────────────────────────────────────────────────

section('levelGenerator')

{
  // Generate a simple level (2 colors, 2 empty tubes)
  const level = generateValidLevel(1, 2, 2)

  assert(level.id === 1, 'level has correct id')
  assert(level.colorCount === 2, 'level has correct color count')
  assert(level.tubes.length === 4, `level has ${level.colorCount + 2} tubes (filled + empty)`)

  assert(validateLevel(level), 'level passes validation')
  assert(isLevelPlayable(level), 'level is playable (not already solved)')

  // Check that all pigments in tubes are valid colors
  const validColors = new Set(['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'cyan', 'pink', 'lime', 'indigo'])
  for (const tube of level.tubes) {
    for (const pigment of tube.pigments) {
      assert(validColors.has(pigment.color), `pigment color "${pigment.color}" is valid`)
    }
  }

  // Generate a sequence
  const levels = generateLevels(10, 3)
  assert(levels.length === 3, 'generateLevels creates correct count')
  assert(levels[0].id === 10, 'first level has correct id')
  assert(levels[1].id === 11, 'second level has correct id')
  assert(levels[2].id === 12, 'third level has correct id')

  // Verify all generated levels are playable
  for (const lvl of levels) {
    assert(isLevelPlayable(lvl), `level ${lvl.id} is playable`)
    assert(validateLevel(lvl), `level ${lvl.id} passes validation`)
  }
}

// ─── progression tests ───────────────────────────────────────────────────────

section('progression')

{
  // Test with fresh defaults (in-memory, not localStorage)
  const progress = {
    highestUnlockedLevel: 1,
    completedLevels: [],
    moveCounts: {},
  }

  assert(progress.highestUnlockedLevel === 1, 'default progress starts at level 1')
  assert(progress.completedLevels.length === 0, 'default progress: no completed levels')

  const afterComplete = completeLevel(progress, 1, 15)
  assert(afterComplete.completedLevels.includes(1), 'completeLevel: level 1 in completed')
  assert(afterComplete.highestUnlockedLevel === 2, 'completeLevel: unlocks level 2')
  assert(afterComplete.moveCounts[1] === 15, 'completeLevel: saves move count')

  const afterUnlock = unlockLevel({ ...afterComplete }, 5)
  assert(afterUnlock.highestUnlockedLevel === 6, 'unlockLevel: unlocks to level 6')

  // Test settings
  const settings = {
    soundEnabled: true,
    reducedMotion: false,
    mute: false,
  }

  const soundOff = toggleSound(settings)
  assert(soundOff.soundEnabled === false, 'toggleSound: disabled')

  const motionOn = toggleReducedMotion(settings)
  assert(motionOn.reducedMotion === true, 'toggleReducedMotion: enabled')
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════`)
console.log(`Results: ${passed} passed, ${failed} failed`)
console.log(`═══════════════════════════════════════════`)

if (failed > 0) {
  process.exit(1)
}

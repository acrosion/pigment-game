// ─── Core Types ───────────────────────────────────────────────────────────────

export type PigmentColor =
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'cyan'
  | 'pink'
  | 'lime'
  | 'indigo'

export const PIGMENT_COLORS: readonly PigmentColor[] = [
  'red',
  'green',
  'blue',
  'yellow',
  'purple',
  'orange',
  'cyan',
  'pink',
  'lime',
  'indigo',
] as const

export const TUBE_CAPACITY = 4

// A single pigment unit in a tube
export interface PigmentUnit {
  color: PigmentColor
}

// A tube of pigment
export interface Tube {
  pigments: PigmentUnit[]
}

// A puzzle state (the current arrangement of all tubes)
export interface PuzzleState {
  tubes: Tube[]
}

// A single move (pour from one tube to another)
export interface Move {
  fromIndex: number
  toIndex: number
  units: number
}

// History entry for undo
export interface HistoryEntry {
  state: PuzzleState
  move: Move | null // null for initial state
}

// A generated level
export interface Level {
  id: number
  name: string
  tubes: Tube[]
  // Number of distinct pigment colors used
  colorCount: number
  // Optimal move count (calculated via BFS, -1 if not yet computed)
  par?: number
}

// Player progress
export interface PlayerProgress {
  highestUnlockedLevel: number
  completedLevels: number[]
  moveCounts: Record<number, number> // levelId -> best move count
  bestTimes: Record<number, number> // levelId -> best time in seconds
}

// Game settings
export interface GameSettings {
  soundEnabled: boolean
  reducedMotion: boolean
  mute: boolean
}


// Best time per level (seconds)
export interface BestTimes {
  [levelId: number]: number
}

// A saved solution (move sequence)
export interface SavedSolution {
  levelId: number
  moveCount: number
  elapsedTime: number
  moves: Move[]
  completedAt: string // ISO date string
}

// Daily challenge state
export interface DailyChallenge {
  date: string // YYYY-MM-DD
  levelId: number
  bestMoveCount: number | null
  bestTime: number | null
  completed: boolean
}

// ─── Color Palette (for rendering) ───────────────────────────────────────────

export const PIGMENT_PALETTE: Record<PigmentColor, { bg: string; text: string }> = {
  red:    { bg: '#ef4444', text: '#ffffff' },
  green:  { bg: '#22c55e', text: '#ffffff' },
  blue:   { bg: '#3b82f6', text: '#ffffff' },
  yellow: { bg: '#eab308', text: '#1a1a1a' },
  purple: { bg: '#a855f7', text: '#ffffff' },
  orange: { bg: '#f97316', text: '#ffffff' },
  cyan:   { bg: '#06b6d4', text: '#ffffff' },
  pink:   { bg: '#ec4899', text: '#ffffff' },
  lime:   { bg: '#84cc16', text: '#1a1a1a' },
  indigo: { bg: '#6366f1', text: '#ffffff' },
}

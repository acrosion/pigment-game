// ─── GameBoard Component ──────────────────────────────────────────────────────
// Renders the grid of tubes, handles selection logic, and validates moves.

import { useState, useCallback, useMemo } from 'react'
import { Tube } from './Tube'
import type { PuzzleState, Tube as TubeType, PigmentColor, Move } from '../types'
import { validateMove, executeMove } from '../engine/moveValidation'
import {
  getTopColor,
  isEmpty,
  isTubeComplete,
} from '../engine/puzzleState'
import { TUBE_WIDTH } from '../constants'

interface GameBoardProps {
  state: PuzzleState
  onMove: (newState: PuzzleState, move: Move) => void
  onTubeComplete: (color: PigmentColor) => void
  levelComplete: boolean
  onTubeSelect: () => void
  hintHighlight?: { from: number; to: number } | null
}

export function GameBoard({ state, onMove, onTubeComplete, levelComplete, onTubeSelect, hintHighlight }: GameBoardProps) {
  const [selectedTube, setSelectedTube] = useState<number | null>(null)

  // Calculate valid target tubes for the selected tube
  const validTargets = useMemo(() => {
    if (selectedTube === null) return new Set<number>()

    const result = new Set<number>()
    for (let i = 0; i < state.tubes.length; i++) {
      if (i === selectedTube) continue
      const move = validateMove(state, selectedTube, i)
      if (move !== null && typeof move === 'object' && 'units' in move && move.units > 0) {
        result.add(i)
      }
    }
    return result
  }, [state, selectedTube])

  const handleTubeClick = useCallback(
    (index: number) => {
      if (levelComplete) return

      // If clicking the already-selected tube, deselect
      if (selectedTube === index) {
        setSelectedTube(null)
        return
      }

      // If nothing selected yet, select this tube
      if (selectedTube === null) {
        if (!isEmpty(state.tubes[index])) {
          setSelectedTube(index)
          onTubeSelect()
        }
        return
      }

      // Try to execute the move
      const move = validateMove(state, selectedTube, index)

      if (move !== null && typeof move === 'object' && 'units' in move && move.units > 0) {
        const newState = executeMove(state, selectedTube, index, move.units)

        // Check if the destination tube is now complete
        if (isTubeComplete(newState.tubes[index])) {
          const color = getTopColor(newState.tubes[index])!
          onTubeComplete(color)
        }

        // Build the move info
        const moveInfo: Move = {
          fromIndex: selectedTube,
          toIndex: index,
          units: move.units,
        }

        onMove(newState, moveInfo)
        setSelectedTube(null)
      } else {
        // Invalid move — select the new tube if it has pigments
        if (!isEmpty(state.tubes[index])) {
          setSelectedTube(index)
          onTubeSelect()
        } else {
          setSelectedTube(null)
        }
      }
    },
    [selectedTube, state, onMove, onTubeComplete, onTubeSelect, levelComplete]
  )

  // Calculate grid layout
  const { tubesPerRow, grid } = useMemo(() => {
    const totalTubes = state.tubes.length
    const maxPerRow = Math.min(totalTubes, Math.floor(800 / TUBE_WIDTH))
    const rows = Math.ceil(totalTubes / maxPerRow)

    // Center the grid
    const gridRows: TubeType[][] = []
    for (let r = 0; r < rows; r++) {
      const start = r * maxPerRow
      const end = Math.min(start + maxPerRow, totalTubes)
      gridRows.push(state.tubes.slice(start, end))
    }

    return { tubesPerRow: maxPerRow, grid: gridRows }
  }, [state.tubes])

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        width: '100%',
        maxWidth: '900px',
        padding: '20px',
      }}
    >
      {grid.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-end justify-center"
          style={{
            gap: '24px',
            marginBottom: rowIndex < grid.length - 1 ? '16px' : 0,
          }}
        >
          {row.map((tube, colIndex) => {
            const globalIndex = rowIndex * tubesPerRow + colIndex
            const isSelected = selectedTube === globalIndex
            const isValidTarget = validTargets.has(globalIndex)

            return (
              <Tube
                key={globalIndex}
                tube={tube}
                index={globalIndex}
                isSelected={isSelected}
                isValidTarget={isValidTarget}
                isHinted={hintHighlight ? (globalIndex === hintHighlight.from || globalIndex === hintHighlight.to) : false}
                onClick={handleTubeClick}
                disabled={levelComplete}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

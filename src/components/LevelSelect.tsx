// ─── LevelSelect Component ────────────────────────────────────────────────────
// Grid of level cards showing completion status, best move counts, and unlock state.

import { useState, useCallback } from 'react'
import type { PlayerProgress, Level } from '../types'

interface LevelSelectProps {
  progress: PlayerProgress
  levels: Level[]
  currentLevelIndex: number
  onSelectLevel: (levelIndex: number) => void
  onBack: () => void
}

interface LevelCardProps {
  level: Level
  index: number
  isUnlocked: boolean
  isCompleted: boolean
  isActive: boolean
  bestMoveCount: number | undefined
  starRating: number
  onSelect: () => void
}

// Generate stars based on move count vs estimated optimal
function getStarRating(bestMoveCount: number | undefined, levelIndex: number): number {
  if (bestMoveCount === undefined) return 0
  // Estimate: optimal ≈ colorCount * 2, generous rating threshold
  const optimal = levelIndex * 3 + 5
  if (bestMoveCount <= optimal) return 3
  if (bestMoveCount <= optimal * 1.5) return 2
  return 1
}

function LevelCard({ level, isUnlocked, isActive, starRating, onSelect }: LevelCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={isUnlocked ? onSelect : undefined}
      disabled={!isUnlocked}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '120px',
        height: '140px',
        borderRadius: '16px',
        border: isActive
          ? '2px solid rgba(255,255,255,0.6)'
          : isUnlocked
          ? '2px solid rgba(255,255,255,0.2)'
          : '2px solid rgba(255,255,255,0.08)',
        background: isActive
          ? 'rgba(255,255,255,0.12)'
          : isUnlocked
          ? hovered
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.03)',
        cursor: isUnlocked ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s ease',
        transform: hovered && isUnlocked ? 'scale(1.05)' : isActive ? 'scale(1.02)' : 'scale(1)',
        opacity: isUnlocked ? 1 : 0.4,
        boxShadow: isActive
          ? '0 0 16px rgba(255,255,255,0.15)'
          : isUnlocked && hovered
          ? '0 4px 16px rgba(0,0,0,0.3)'
          : 'none',
        outline: 'none',
      }}
    >
      {/* Level number */}
      <span
        style={{
          fontSize: '32px',
          fontWeight: '700',
          color: isUnlocked ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {level.id}
      </span>

      {/* Stars */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            style={{
              fontSize: '16px',
              filter: star <= starRating ? 'none' : 'grayscale(1) opacity(0.3)',
              transition: 'filter 0.3s ease',
            }}
          >
            {star <= starRating ? '★' : '☆'}
          </span>
        ))}
      </div>

      {/* Lock overlay for locked levels */}
      {!isUnlocked && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '14px',
            opacity: 0.5,
          }}
        >
          🔒
        </span>
      )}

      {/* Active indicator */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          ▶
        </span>
      )}
    </button>
  )
}

export function LevelSelect({ progress, levels, currentLevelIndex, onSelectLevel, onBack }: LevelSelectProps) {
  const handleSelect = useCallback(
    (levelIndex: number) => {
      if (levelIndex >= progress.highestUnlockedLevel) return
      onSelectLevel(levelIndex)
    },
    [progress.highestUnlockedLevel, onSelectLevel]
  )

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '700px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.95)',
              fontFamily: 'system-ui, sans-serif',
              margin: 0,
            }}
          >
            Select Painting
          </h2>
          <button
            onClick={onBack}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            aria-label="Back"
          >
            ✕
          </button>
        </div>

        {/* Level grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          {levels.map((level, index) => {
            const isUnlocked = index < progress.highestUnlockedLevel
            const isCompleted = progress.completedLevels.includes(level.id)
            const bestMoveCount = progress.moveCounts[level.id]
            const starRating = isCompleted ? getStarRating(bestMoveCount, level.id) : 0
            const isActive = index === currentLevelIndex

            return (
              <LevelCard
                key={level.id}
                level={level}
                index={index}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                isActive={isActive}
                bestMoveCount={bestMoveCount}
                starRating={starRating}
                onSelect={() => handleSelect(index)}
              />
            )
          })}
        </div>


        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '3px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.5))',
              width: `${(progress.completedLevels.length / levels.length) * 100}%`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        {/* Progress summary */}
        <div
          style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
          }}
        >
          {progress.completedLevels.length} / {levels.length} completed
          {' · '}
          {progress.highestUnlockedLevel} / {levels.length} unlocked
        </div>
      </div>
    </div>
  )
}

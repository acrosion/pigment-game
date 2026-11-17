// ─── UI Controls Component ────────────────────────────────────────────────────
// Top bar (level info, progress) and bottom bar (undo, restart, hint, sound).

import { useCallback } from 'react'

interface ControlsProps {
  levelNumber: number
  parMoves: number
  completedColors: number
  totalColors: number
  moveCount: number
  elapsedTime: number
  canUndo: boolean
  onUndo: () => void
  onRestart: () => void
  onHint: () => void
  soundEnabled: boolean
  onToggleSound: () => void
  onSettings: () => void
  onShowLevelSelect: () => void
  onViewSolutions: () => void
}

export function Controls({
  levelNumber,
  parMoves,
  completedColors,
  totalColors,
  moveCount,
  elapsedTime,
  canUndo,
  onUndo,
  onRestart,
  onHint,
  soundEnabled,
  onToggleSound,
  onSettings,
  onShowLevelSelect,
  onViewSolutions,
}: ControlsProps) {
  const handleUndo = useCallback(() => {
    if (canUndo) onUndo()
  }, [canUndo, onUndo])

  const handleRestart = useCallback(() => {
    onRestart()
  }, [onRestart])

  const handleHint = useCallback(() => {
    onHint()
  }, [onHint])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleToggleSound = useCallback(() => {
    onToggleSound()
  }, [onToggleSound])


  const handleSettings = useCallback(() => {
    onSettings()
  }, [onSettings])

  return (
    <div className="flex flex-col items-center justify-between w-full" style={{ height: '100svh', padding: '16px', boxSizing: 'border-box' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between w-full" style={{ maxWidth: '600px' }}>
        {/* Level Info */}
        <div className="flex flex-col items-start">
          <span
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Level
          </span>
          <span
            style={{
              fontSize: '32px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {levelNumber}
          </span>
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center">
          <span
            style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: 'system-ui, sans-serif',
              marginBottom: '8px',
            }}
          >
            {completedColors} / {totalColors} colors
          </span>
          <div
            className="flex gap-1"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '4px 8px',
            }}
          >
            {Array.from({ length: totalColors }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                  background: i < completedColors ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Level Select */}
        <button
          onClick={() => onShowLevelSelect()}
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
          aria-label="Select Painting"
        >
          🎨
        </button>

        {/* Settings */}
        <button
          onClick={handleSettings}
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
          aria-label="Settings"
        >
          ⚙
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-center gap-3" style={{ maxWidth: '600px' }}>
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: canUndo ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            color: canUndo ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease',
            boxShadow: canUndo ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
          }}
          aria-label="Undo"
        >
          ↩
        </button>

        {/* Restart */}
        <button
          onClick={handleRestart}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          aria-label="Restart"
        >
          ↻
        </button>

        {/* Move Counter */}
        <div
          style={{
            width: '80px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)' }}>
            {moveCount}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>
            / {parMoves} par
          </div>
        </div>

        {/* Timer */}
        <div
          style={{
            width: '80px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.7)' }}>
            {formatTime(elapsedTime)}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>
            elapsed
          </div>
        </div>

        {/* Hint */}
        <button
          onClick={handleHint}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          aria-label="Hint"
        >
          💡
        </button>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.15)',
            color: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          aria-label={soundEnabled ? 'Mute' : 'Unmute'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Solution History */}
        <button
          onClick={onViewSolutions}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
        >
          📜 Solutions
        </button>
      </div>
    </div>
  )
}

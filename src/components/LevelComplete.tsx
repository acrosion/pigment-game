// ─── LevelComplete Component ──────────────────────────────────────────────────
// Shown when a level is completed. Displays the full artwork and next button.

import { useCallback, useState, useEffect } from 'react'

interface LevelCompleteProps {
  levelNumber: number
  moveCount: number
  parMoves: number
  starRating: number
  elapsedTime: number
  bestTime: number | null
  onNext: () => void
  onReplay: () => void
}

export function LevelComplete({ levelNumber, moveCount, parMoves, starRating, elapsedTime, bestTime, onNext, onReplay }: LevelCompleteProps) {
  const [starsVisible, setStarsVisible] = useState(false)
  const [showing, setShowing] = useState(false)

  useEffect(() => {
    setShowing(true)
    const timer = setTimeout(() => setStarsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleNext = useCallback(() => {
    onNext()
  }, [onNext])

  const handleReplay = useCallback(() => {
    onReplay()
  }, [onReplay])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate performance message
  const getPerformanceMessage = () => {
    if (starRating === 3) return 'Perfect! 🌟'
    if (starRating === 2) return 'Great job! 👏'
    return 'Well done! 👍'
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        opacity: showing ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          transform: showing ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Celebration emoji */}
        <div 
          style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            animation: 'bounce 1s ease-in-out infinite',
          }}
        >
          ✨🎨✨
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.95)',
            fontFamily: 'system-ui, sans-serif',
            marginBottom: '8px',
          }}
        >
          Painting Complete!
        </h2>

        {/* Performance message */}
        <div
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: 'system-ui, sans-serif',
            marginBottom: '16px',
          }}
        >
          {getPerformanceMessage()}
        </div>

        {/* Stats */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            marginBottom: '8px',
          }}
        >
          <div>Level {levelNumber}</div>
          <div style={{ marginTop: '4px' }}>{moveCount} moves (par: {parMoves})</div>
          <div style={{ marginTop: '4px' }}>Time: {formatTime(elapsedTime)}</div>
          {bestTime !== null && (
            <div style={{ marginTop: '4px', fontSize: '14px', opacity: 0.7 }}>
              Best: {formatTime(bestTime)}
            </div>
          )}
        </div>

        {/* Star Rating */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {[1, 2, 3].map((star) => (
            <div
              key={star}
              style={{
                fontSize: '32px',
                transition: 'all 0.3s ease',
                filter: star <= starRating ? 'none' : 'grayscale(100%) opacity(0.3)',
                transform: star <= starRating 
                  ? (starsVisible ? 'scale(1.1)' : 'scale(0.9)') 
                  : 'scale(0.9)',
                opacity: star <= starRating ? 1 : 0.3,
              }}
            >
              ★
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleReplay}
            style={{
              padding: '14px 32px',
              borderRadius: '16px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.03)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Replay ↺
          </button>

          <button
            onClick={handleNext}
            style={{
              padding: '14px 48px',
              borderRadius: '16px',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Next Painting →
          </button>
        </div>
      </div>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}

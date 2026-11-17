// ─── HintOverlay Component ──────────────────────────────────────────────────
// Shows a visual hint arrow between source and destination tubes.

import { useState, useEffect } from 'react'

interface HintOverlayProps {
  fromIndex: number
  toIndex: number
  totalTubes: number
  tubeWidth: number
  tubeGap: number
  duration?: number
}

export function HintOverlay({ fromIndex, toIndex, totalTubes, tubeWidth, tubeGap, duration = 3000 }: HintOverlayProps) {
  const [opacity, setOpacity] = useState(0)
  const [active, setActive] = useState(true)

  useEffect(() => {
    // Fade in
    setOpacity(1)
    
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0)
    }, duration - 500)
    
    const endTimer = setTimeout(() => {
      setActive(false)
    }, duration)
    
    return () => {
      clearTimeout(fadeOutTimer)
      clearTimeout(endTimer)
    }
  }, [duration])

  if (!active) return null

  // Calculate tube positions
  const totalWidth = totalTubes * (tubeWidth + tubeGap) - tubeGap
  const centerX = totalWidth / 2
  
  const tubeCenters = Array.from({ length: totalTubes }, (_, i) => {
    return centerX - (i * (tubeWidth + tubeGap)) - tubeWidth / 2 + tubeWidth / 2
  })
  
  const startX = tubeCenters[fromIndex]
  const endX = tubeCenters[toIndex]
  const startY = 10
  const endY = 10
  const midY = -40

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: totalWidth + 100,
        height: 120,
        zIndex: 6,
        pointerEvents: 'none',
        overflow: 'visible',
        opacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      <svg
        width={totalWidth + 100}
        height={120}
        viewBox={`0 0 ${totalWidth + 100} 120`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Arrow glow */}
          <filter id="hint-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Arrow gradient */}
          <linearGradient id="hint-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 215, 0, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 215, 0, 0.4)" />
          </linearGradient>
        </defs>

        {/* Dashed arrow path */}
        <path
          d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${midY} ${endX} ${endY}`}
          fill="none"
          stroke="url(#hint-grad)"
          strokeWidth="3"
          strokeDasharray="8 4"
          strokeLinecap="round"
          filter="url(#hint-glow)"
          style={{
            animation: 'dashMove 0.5s linear infinite',
          }}
        />

        {/* Arrowhead at destination */}
        <path
          d={`M ${endX - 8} ${endY - 8} L ${endX} ${endY} L ${endX - 8} ${endY + 8}`}
          fill="none"
          stroke="rgba(255, 215, 0, 0.8)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#hint-glow)"
        />

        {/* Pulsing circle at source */}
        <circle
          cx={startX}
          cy={startY}
          r="8"
          fill="none"
          stroke="rgba(255, 215, 0, 0.6)"
          strokeWidth="2"
          filter="url(#hint-glow)"
          style={{
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />

        {/* Pulsing circle at destination */}
        <circle
          cx={endX}
          cy={endY}
          r="8"
          fill="none"
          stroke="rgba(255, 215, 0, 0.6)"
          strokeWidth="2"
          filter="url(#hint-glow)"
          style={{
            animation: 'pulse 1s ease-in-out infinite 0.5s',
          }}
        />
      </svg>

      {/* Inline styles for animations */}
      <style>{`
        @keyframes dashMove {
          to {
            stroke-dashoffset: -12;
          }
        }
        @keyframes pulse {
          0%, 100% {
            r: 8;
            opacity: 0.6;
          }
          50% {
            r: 12;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

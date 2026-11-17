// ─── PourAnimation Component ─────────────────────────────────────────────────
// Renders a smooth liquid arc animation between two tubes.
// Uses actual tube positions for accurate animation.

import { useEffect, useState, useCallback } from 'react'
import type { PigmentColor } from '../types'
import { getPigmentColor } from '../constants'

interface PourAnimationProps {
  fromIndex: number
  toIndex: number
  color: PigmentColor
  units: number
  totalTubes: number
  tubeWidth: number
  tubeGap: number
}

export function PourAnimation({ fromIndex, toIndex, color, units, totalTubes, tubeWidth, tubeGap }: PourAnimationProps) {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(true)

  // Calculate actual tube positions (matching GameBoard layout)
  const totalWidth = totalTubes * (tubeWidth + tubeGap) - tubeGap
  const centerX = totalWidth / 2
  
  // Tube center positions
  const tubeCenters = Array.from({ length: totalTubes }, (_, i) => {
    return centerX - (i * (tubeWidth + tubeGap)) - tubeWidth / 2 + tubeWidth / 2
  })
  
  const startX = tubeCenters[fromIndex]
  const endX = tubeCenters[toIndex]
  const startY = 10
  const endY = 10
  const arcHeight = -100 - units * 20

  const onAnimationEnd = useCallback(() => {
    setActive(false)
  }, [])

  useEffect(() => {
    setProgress(0)
    setActive(true)

    const startTime = performance.now()
    const duration = 300

    const animate = (time: number) => {
      const elapsed = time - startTime
      const rawProgress = Math.min(elapsed / duration, 1)

      // Ease in-out cubic
      const eased = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2

      setProgress(eased)

      if (rawProgress < 1) {
        requestAnimationFrame(animate)
      } else {
        setActive(false)
      }
    }

    const raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [fromIndex, toIndex, units])

  if (!active) return null

  // Calculate current arc position
  const t = progress
  const midX = (startX + endX) / 2
  const currentX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX
  const currentY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * arcHeight + t * t * endY

  // Liquid trail — draw the arc as a thick path
  const liquidColor = getPigmentColor(color)

  // Trail path: from start to current position along the arc
  const trailPoints: number[] = []
  const steps = 30
  for (let i = 0; i <= steps * t; i++) {
    const ti = i / steps
    const tx = (1 - ti) * (1 - ti) * startX + 2 * (1 - ti) * ti * midX + ti * ti * endX
    const ty = (1 - ti) * (1 - ti) * startY + 2 * (1 - ti) * ti * arcHeight + ti * ti * endY
    trailPoints.push(tx, ty)
  }

  const d = trailPoints.length > 0
    ? `M ${trailPoints[0]} ${trailPoints[1]}${trailPoints.slice(2).map((p, i) => (i % 2 === 0 ? ` L ${p}` : ` ${p}`)).join('')}`
    : ''

  // Calculate droplet size based on units
  const dropletSize = 4 + units * 3

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: totalWidth + 100,
        height: 200,
        zIndex: 5,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <svg
        width={totalWidth + 100}
        height={200}
        viewBox={`0 0 ${totalWidth + 100} 200`}
        style={{ overflow: 'visible' }}
        onAnimationEnd={onAnimationEnd}
      >
        <defs>
          {/* Glow filter */}
          <filter id="pour-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Liquid gradient */}
          <linearGradient id="pour-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={liquidColor} stopOpacity="0.6" />
            <stop offset="50%" stopColor={liquidColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={liquidColor} stopOpacity="1" />
          </linearGradient>

          {/* Inner highlight */}
          <linearGradient id="pour-highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main liquid trail */}
        {d && (
          <path
            d={d}
            fill="none"
            stroke="url(#pour-grad)"
            strokeWidth={8 + units * 2}
            strokeLinecap="round"
            filter="url(#pour-glow)"
            style={{
              transition: 'stroke-width 0.1s ease',
            }}
          />
        )}

        {/* Inner highlight line */}
        {d && (
          <path
            d={d}
            fill="none"
            stroke="url(#pour-highlight)"
            strokeWidth={2 + units}
            strokeLinecap="round"
            style={{
              opacity: 0.5,
            }}
          />
        )}

        {/* Droplet at arc tip */}
        {t > 0.05 && t < 0.95 && (
          <circle
            cx={currentX}
            cy={currentY}
            r={dropletSize}
            fill={liquidColor}
            opacity={0.95}
            filter="url(#pour-glow)"
          />
        )}

        {/* Splash drops on landing (last 20% of animation) */}
        {t > 0.8 && (
          <>
            {/* Primary splash */}
            <circle
              cx={endX}
              cy={endY + 5}
              r={3 * (t - 0.8) * 5}
              fill={liquidColor}
              opacity={(t - 0.8) * 3}
              filter="url(#pour-glow)"
            />
            {/* Side splashes */}
            <circle
              cx={endX + 12}
              cy={endY}
              r={2 * (t - 0.8) * 4}
              fill={liquidColor}
              opacity={(t - 0.8) * 2.5}
            />
            <circle
              cx={endX - 12}
              cy={endY}
              r={2 * (t - 0.8) * 4}
              fill={liquidColor}
              opacity={(t - 0.8) * 2.5}
            />
            {/* Top splash */}
            <circle
              cx={endX}
              cy={endY - 8}
              r={1.5 * (t - 0.8) * 3}
              fill={liquidColor}
              opacity={(t - 0.8) * 2}
            />
          </>
        )}

        {/* Landing ripple effect */}
        {t > 0.9 && (
          <circle
            cx={endX}
            cy={endY + 10}
            r={10 * (t - 0.9) * 10}
            fill="none"
            stroke={liquidColor}
            strokeWidth={1}
            opacity={(t - 0.9) * 3}
          />
        )}
      </svg>
    </div>
  )
}

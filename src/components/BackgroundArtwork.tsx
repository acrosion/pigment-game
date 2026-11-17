// ─── BackgroundArtwork Component ──────────────────────────────────────────────
// Phase 3: Enhanced background with dynamic gradient, per-color glow filters,
// ambient bloom layer, animated shimmer particles, and vignette overlay.
// Each completed color reveals its regions and creates a soft bloom around them.

import { useState, useEffect, useMemo } from 'react'
import type { PigmentColor } from '../types'
import { PIGMENT_PALETTE } from '../types'

interface BackgroundArtworkProps {
  revealedColors: Set<PigmentColor>
  isLevelComplete: boolean
  reducedMotion: boolean
}

// ─── Color regions with glow metadata ─────────────────────────────────────────

interface ColorRegion {
  id: string
  colors: PigmentColor[]
  paths: string[]
  glowColor: string
  glowSpread: number
}

const MAGICAL_GARDEN_REGIONS: ColorRegion[] = [
  // Red: roses, crimson accents
  {
    id: 'red-roses',
    colors: ['red'],
    glowColor: '#ef4444',
    glowSpread: 40,
    paths: [
      'M 150 380 Q 160 350 170 380 Q 180 350 190 380 Q 180 400 170 400 Q 160 400 150 380Z',
      'M 650 420 Q 660 390 670 420 Q 680 390 690 420 Q 680 440 670 440 Q 660 440 650 420Z',
      'M 300 460 Q 310 440 320 460 Q 330 440 340 460 Q 330 480 320 480 Q 310 480 300 460Z',
      'M 480 380 Q 495 360 510 380 Q 525 360 540 380 Q 525 400 510 400 Q 495 400 480 380Z',
    ],
  },
  // Green: vegetation, leaves
  {
    id: 'green-veg',
    colors: ['green'],
    glowColor: '#22c55e',
    glowSpread: 35,
    paths: [
      'M 100 450 Q 120 400 140 450 Q 160 400 180 450 L 180 500 L 100 500Z',
      'M 620 450 Q 640 400 660 450 Q 680 400 700 450 L 700 500 L 620 500Z',
      'M 200 500 Q 250 480 300 500 Q 350 480 400 500 L 400 550 L 200 550Z',
      'M 500 500 Q 550 480 600 500 Q 650 480 700 500 L 700 550 L 500 550Z',
      'M 130 350 Q 140 330 150 350 Q 145 370 140 370 Q 135 370 130 350Z',
      'M 660 350 Q 670 330 680 350 Q 675 370 670 370 Q 665 370 660 350Z',
    ],
  },
  // Blue: river, sky, water
  {
    id: 'blue-sky',
    colors: ['blue'],
    glowColor: '#3b82f6',
    glowSpread: 50,
    paths: [
      'M 0 0 L 800 0 L 800 150 Q 600 180 400 150 Q 200 180 0 150Z',
      'M 200 350 Q 300 320 400 350 Q 500 320 600 350 L 600 380 Q 500 350 400 380 Q 300 350 200 380Z',
      'M 100 200 Q 200 180 300 200 Q 250 220 200 220 Q 150 220 100 200Z',
      'M 500 200 Q 600 180 700 200 Q 650 220 600 220 Q 550 220 500 200Z',
    ],
  },
  // Yellow: sunlight, golden flowers
  {
    id: 'yellow-sun',
    colors: ['yellow'],
    glowColor: '#eab308',
    glowSpread: 60,
    paths: [
      'M 350 50 Q 370 30 400 50 Q 430 30 450 50 Q 430 70 400 70 Q 370 70 350 50Z',
      'M 100 300 Q 110 280 120 300 Q 130 280 140 300 Q 130 320 120 320 Q 110 320 100 300Z',
      'M 660 300 Q 670 280 680 300 Q 690 280 700 300 Q 690 320 680 320 Q 670 320 660 300Z',
      'M 400 20 Q 410 10 420 20 Q 430 10 440 20 Q 430 30 420 30 Q 410 30 400 20Z',
      'M 380 30 Q 390 20 400 30 Q 410 20 420 30 Q 410 40 400 40 Q 390 40 380 30Z',
      'M 360 40 Q 370 30 380 40 Q 390 30 400 40 Q 390 50 380 50 Q 370 50 360 40Z',
      'M 420 40 Q 430 30 440 40 Q 450 30 460 40 Q 450 50 440 50 Q 430 50 420 40Z',
    ],
  },
  // Purple: lavender flowers
  {
    id: 'purple-flowers',
    colors: ['purple'],
    glowColor: '#a855f7',
    glowSpread: 30,
    paths: [
      'M 250 420 Q 260 400 270 420 Q 280 400 290 420 Q 280 440 270 440 Q 260 440 250 420Z',
      'M 520 420 Q 530 400 540 420 Q 550 400 560 420 Q 550 440 540 440 Q 530 440 520 420Z',
      'M 350 440 Q 360 425 370 440 Q 380 425 390 440 Q 380 455 370 455 Q 360 455 350 440Z',
      'M 430 440 Q 440 425 450 440 Q 460 425 470 440 Q 460 455 450 455 Q 440 455 430 440Z',
    ],
  },
  // Orange: sunset, warm tones
  {
    id: 'orange-sunset',
    colors: ['orange'],
    glowColor: '#f97316',
    glowSpread: 45,
    paths: [
      'M 300 120 Q 400 80 500 120 Q 400 160 300 120Z',
      'M 150 250 Q 160 230 170 250 Q 180 230 190 250 Q 180 270 170 270 Q 160 270 150 250Z',
      'M 620 250 Q 630 230 640 250 Q 650 230 660 250 Q 650 270 640 270 Q 630 270 620 250Z',
      'M 340 100 Q 360 80 380 100 Q 360 115 340 100Z',
      'M 440 100 Q 460 80 480 100 Q 460 115 440 100Z',
    ],
  },
  // Cyan: water ripples, reflections
  {
    id: 'cyan-water',
    colors: ['cyan'],
    glowColor: '#06b6d4',
    glowSpread: 25,
    paths: [
      'M 250 360 Q 300 340 350 360 Q 400 340 450 360 Q 500 340 550 360 L 550 370 Q 500 350 450 370 Q 400 350 350 370 Q 300 350 250 370Z',
      'M 280 375 Q 330 365 380 375 Q 430 365 480 375 L 480 382 Q 430 372 380 382 Q 330 372 280 382Z',
    ],
  },
  // Pink: soft highlights, petal edges
  {
    id: 'pink-highlights',
    colors: ['pink'],
    glowColor: '#ec4899',
    glowSpread: 20,
    paths: [
      'M 180 390 Q 190 370 200 390 Q 210 370 220 390 Q 210 410 200 410 Q 190 410 180 390Z',
      'M 600 430 Q 610 410 620 430 Q 630 410 640 430 Q 630 450 620 450 Q 610 450 600 430Z',
      'M 230 460 Q 240 445 250 460 Q 260 445 270 460 Q 260 475 250 475 Q 240 475 230 460Z',
    ],
  },
  // Lime: moss, light foliage
  {
    id: 'lime-moss',
    colors: ['lime'],
    glowColor: '#84cc16',
    glowSpread: 25,
    paths: [
      'M 80 480 Q 100 460 120 480 Q 140 460 160 480 Q 140 500 120 500 Q 100 500 80 480Z',
      'M 640 480 Q 660 460 680 480 Q 700 460 720 480 Q 700 500 680 500 Q 660 500 640 480Z',
      'M 50 500 Q 70 485 90 500 Q 110 485 130 500 L 130 520 L 50 520Z',
      'M 670 500 Q 690 485 710 500 Q 730 485 750 500 L 750 520 L 670 520Z',
    ],
  },
  // Indigo: deep shadows, night sky
  {
    id: 'indigo-shadows',
    colors: ['indigo'],
    glowColor: '#6366f1',
    glowSpread: 55,
    paths: [
      'M 50 100 Q 100 80 150 100 Q 200 80 250 100 Q 200 120 150 120 Q 100 120 50 100Z',
      'M 550 100 Q 600 80 650 100 Q 700 80 750 100 Q 700 120 650 120 Q 600 120 550 100Z',
      'M 350 10 Q 360 5 370 10 Q 380 5 390 10 Q 380 15 370 15 Q 360 15 350 10Z',
      'M 420 15 Q 425 10 430 15 Q 435 10 440 15 Q 435 20 430 20 Q 425 20 420 15Z',
      'M 300 20 Q 305 15 310 20 Q 315 15 320 20 Q 315 25 310 25 Q 305 25 300 20Z',
      'M 480 20 Q 485 15 490 20 Q 495 15 500 20 Q 495 25 490 25 Q 485 25 480 20Z',
    ],
  },
]

// ─── Dynamic background gradient based on revealed colors ─────────────────────

function getBackgroundGradient(
  revealedColors: Set<PigmentColor>,
  isLevelComplete: boolean
): string {
  if (isLevelComplete) {
    const colors = Array.from(revealedColors)
    if (colors.length === 0) return '#1a1a2e'
    const stops = colors.map((c, i) => {
      const pct = Math.round((i / Math.max(colors.length - 1, 1)) * 100)
      return `${PIGMENT_PALETTE[c].bg} ${pct}%`
    })
    return `radial-gradient(ellipse at 50% 30%, ${stops.join(', ')}, #1a1a2e 100%)`
  }

  const revealedArr = Array.from(revealedColors)
  if (revealedArr.length === 0) {
    return 'radial-gradient(ellipse at 50% 20%, #3a3a4a 0%, #2a2a2a 40%, #1a1a1a 100%)'
  }

  const primary = PIGMENT_PALETTE[revealedArr[0]].bg
  const secondary = revealedArr.length > 1 ? PIGMENT_PALETTE[revealedArr[1]].bg : '#2a2a2a'
  return `radial-gradient(ellipse at 50% 25%, ${primary}33 0%, ${secondary}22 30%, #1a1a2e 70%, #0f0f1a 100%)`
}

// ─── Shimmer particle type ────────────────────────────────────────────────────

interface Shimmer {
  id: number
  cx: number
  cy: number
  size: number
  opacity: number
  speed: number
  phase: number
}

function generateShimmers(count: number): Shimmer[] {
  const shimmers: Shimmer[] = []
  for (let i = 0; i < count; i++) {
    shimmers.push({
      id: i,
      cx: Math.random() * 800,
      cy: Math.random() * 600,
      size: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.3,
      speed: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return shimmers
}

// ─── Glow filter color list ───────────────────────────────────────────────────

const GLOW_COLORS: PigmentColor[] = [
  'red', 'green', 'blue', 'yellow', 'purple',
  'orange', 'cyan', 'pink', 'lime', 'indigo',
]

// ─── Main component ──────────────────────────────────────────────────────────

export function BackgroundArtwork({
  revealedColors,
  isLevelComplete,
  reducedMotion,
}: BackgroundArtworkProps) {
  const [shimmers] = useState<Shimmer[]>(() => generateShimmers(30))
  const [time, setTime] = useState(0)

  // Animate shimmer phase
  useEffect(() => {
    if (reducedMotion) return
    let frame: number
    const animate = () => {
      setTime((t) => t + 0.016)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [reducedMotion])

  const bgGradient = useMemo(
    () => getBackgroundGradient(revealedColors, isLevelComplete),
    [revealedColors, isLevelComplete]
  )

  const revealedArr = Array.from(revealedColors)

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: bgGradient,
        transition: reducedMotion ? 'none' : 'background 2s ease',
      }}
    >
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{
          opacity: isLevelComplete ? 0 : 1,
          transition: reducedMotion ? 'none' : 'opacity 1s ease',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <defs>
          {/* Grayscale filter for base */}
          <filter id="grayscale-base">
            <feColorMatrix type="saturate" values="0" />
          </filter>

          {/* Per-color glow filters */}
          {GLOW_COLORS.map((color) => (
            <filter
              key={`glow-${color}`}
              id={`glow-${color}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feFlood
                floodColor={PIGMENT_PALETTE[color].bg}
                result="color"
              />
              <feComposite
                in="color"
                in2="blur"
                operator="in"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}

          {/* Shimmer radial gradient */}
          <radialGradient id="shimmer-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </radialGradient>

          {/* Vignette overlay */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.5)" />
          </radialGradient>
        </defs>

        {/* ─── Base grayscale illustration ─────────────────────────── */}
        <g filter="url(#grayscale-base)" opacity="0.25">
          {MAGICAL_GARDEN_REGIONS.flatMap((r) => r.paths).map((path, i) => (
            <path key={`gray-${i}`} d={path} fill="#555" stroke="none" />
          ))}
        </g>

        {/* ─── Ambient glow layer (behind colored regions) ─────────── */}
        {revealedArr.map((color) => {
          const region = MAGICAL_GARDEN_REGIONS.find((r) => r.colors.includes(color))
          if (!region) return null
          return (
            <g
              key={`ambient-${color}`}
              opacity={isLevelComplete ? 0.3 : 0.15}
              style={{ transition: reducedMotion ? 'none' : 'opacity 2s ease' }}
            >
              {region.paths.map((path, i) => (
                <path
                  key={`ambient-${color}-${i}`}
                  d={path}
                  fill={PIGMENT_PALETTE[color].bg}
                  filter={`url(#glow-${color})`}
                  opacity="0.5"
                />
              ))}
            </g>
          )
        })}

        {/* ─── Colored regions ─────────────────────────────────────── */}
        {MAGICAL_GARDEN_REGIONS.map((region) => {
          const isRevealed = region.colors.some((c) => revealedColors.has(c))
          const primaryColor = isRevealed
            ? region.colors.find((c) => revealedColors.has(c))
            : null
          const color = primaryColor ? PIGMENT_PALETTE[primaryColor].bg : '#6b6b6b'
          const opacity = isRevealed ? (isLevelComplete ? 1 : 0.9) : 0

          return (
            <g
              key={region.id}
              opacity={opacity}
              style={{
                transition: reducedMotion
                  ? 'none'
                  : `opacity 1.8s ease, fill 1.8s ease`,
              }}
            >
              {region.paths.map((path, i) => (
                <path
                  key={`${region.id}-${i}`}
                  d={path}
                  fill={color}
                  stroke="none"
                  filter={
                    isRevealed && !isLevelComplete
                      ? `url(#glow-${primaryColor})`
                      : undefined
                  }
                />
              ))}
            </g>
          )
        })}

        {/* ─── Shimmer particles ───────────────────────────────────── */}
        {!reducedMotion &&
          shimmers.map((s) => {
            const pulse = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase)
            return (
              <circle
                key={s.id}
                cx={s.cx}
                cy={s.cy}
                r={s.size}
                fill="url(#shimmer-grad)"
                opacity={s.opacity * pulse}
              />
            )
          })}

        {/* ─── Vignette overlay ────────────────────────────────────── */}
        <rect
          width="800"
          height="600"
          fill="url(#vignette)"
          style={{
            transition: reducedMotion ? 'none' : 'opacity 2s ease',
            opacity: isLevelComplete ? 0.3 : 0.6,
          }}
        />
      </svg>
    </div>
  )
}

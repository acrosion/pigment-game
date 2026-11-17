// ─── Tube Component ───────────────────────────────────────────────────────────
// Renders a single glass tube with pigment layers.
// Handles selection state, hover, and basic click interaction.

import { useState, useCallback, useRef } from 'react'
import type { Tube as TubeType } from '../types'
import {
  TUBE_WIDTH,
  TUBE_HEIGHT,
  TUBE_RADIUS,
  PIGMENT_HEIGHT,
  PIGMENT_GAP,
  SELECT_SCALE,
  SELECT_LIFT,
  getTubePath,
  getPigmentColor,
  getFillHeight,
} from '../constants'

interface TubeProps {
  tube: TubeType
  index: number
  isSelected: boolean
  isValidTarget: boolean
  isHinted: boolean
  onClick: (index: number) => void
  disabled: boolean
}

export function Tube({ tube, index, isSelected, isValidTarget, isHinted, onClick, disabled }: TubeProps) {
  const [hovered, setHovered] = useState(false)
  const ref = useRef<SVGSVGElement>(null)

  const handleClick = useCallback(() => {
    if (!disabled) {
      onClick(index)
    }
  }, [index, onClick, disabled])

  // Calculate transform
  const scale = isSelected ? SELECT_SCALE : hovered ? 1.03 : 1
  const translateY = isSelected ? SELECT_LIFT : 0

  const transform = `translate(${TUBE_WIDTH / 2 * (1 - scale)}, ${translateY}) scale(${scale})`

  // Calculate pigment layer positions
  const pigmentCount = tube.pigments.length
  const fillHeight = getFillHeight(pigmentCount)
  const bottomY = TUBE_HEIGHT - TUBE_RADIUS
  const liquidTopY = bottomY - fillHeight


  return (
    <>
      {/* Hint glow animation */}
      {isHinted && (
        <style>{`
          @keyframes hintPulse {
            0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.6)); }
            50% { filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.9)); }
          }
          @keyframes selectionPulse {
            0%, 100% {
              stroke-opacity: 0.8;
              stroke-width: 3;
            }
            50% {
              stroke-opacity: 1;
              stroke-width: 4;
            }
          }
        `}</style>
      )}
      <div
        className="relative cursor-pointer select-none"
        style={{
          width: TUBE_WIDTH,
          height: TUBE_HEIGHT,
          transform,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: isHinted ? 'hintPulse 1s ease-in-out infinite' : 'none',
          filter: isValidTarget
            ? 'drop-shadow(0 0 12px rgba(100, 255, 100, 0.5))'
            : isSelected
              ? 'drop-shadow(0 0 16px rgba(255, 215, 0, 0.6))'
              : hovered && !disabled
                ? 'drop-shadow(0 4px 12px rgba(255, 215, 0, 0.3))'
                : 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))',
          zIndex: isSelected ? 10 : 1,
        }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      aria-label={`Tube ${index + 1}${tube.pigments.length > 0 ? `, ${tube.pigments.length} pigments` : ', empty'}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <svg
        ref={ref}
        width={TUBE_WIDTH}
        height={TUBE_HEIGHT}
        viewBox={`0 0 ${TUBE_WIDTH} ${TUBE_HEIGHT}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glass gradient */}
          <linearGradient id={`glass-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="15%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="85%" stopColor="rgba(255, 255, 255, 0.12)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.06)" />
          </linearGradient>

          {/* Liquid gradient (vertical) */}
          <linearGradient id={`liquid-grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.05)" />
          </linearGradient>

          {/* Tube shape clip path */}
          <clipPath id={`tube-clip-${index}`}>
            <path d={getTubePath()} />
          </clipPath>

          {/* Glass highlight */}
          <linearGradient id={`highlight-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.3)" />
            <stop offset="30%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </linearGradient>
        </defs>

        {/* Tube body (glass) */}
        <path
          d={getTubePath()}
          fill={`url(#glass-grad-${index})`}
          stroke={isSelected ? 'rgba(255, 215, 0, 0.8)' : hovered && !disabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)'}
          strokeWidth={isSelected ? 3 : 2}
          style={{
            transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          }}
        />

        {/* Liquid fill (clipped to tube shape) */}
        {pigmentCount > 0 && (
          <g clipPath={`url(#tube-clip-${index})`}>
            <rect
              x={TUBE_WIDTH / 2 - TUBE_RADIUS + 4}
              y={liquidTopY}
              width={TUBE_WIDTH - (TUBE_RADIUS - 4) * 2}
              height={fillHeight}
              fill={`url(#liquid-grad-${index})`}
              rx={4}
            />

            {/* Individual pigment layers */}
            {Array.from({ length: pigmentCount }).map((_, i) => {
              const color = tube.pigments[i].color
              const pigmentTop = liquidTopY + i * (PIGMENT_HEIGHT + PIGMENT_GAP)
              const layerColor = getPigmentColor(color)

              return (
                <rect
                  key={i}
                  x={TUBE_WIDTH / 2 - TUBE_RADIUS + 6}
                  y={pigmentTop}
                  width={TUBE_WIDTH - (TUBE_RADIUS - 4) * 2 - 4}
                  height={PIGMENT_HEIGHT}
                  fill={layerColor}
                  rx={3}
                  style={{
                    filter:
                      i === pigmentCount - 1 && isSelected
                        ? 'brightness(1.1)'
                        : i === pigmentCount - 1
                          ? 'brightness(1.05)'
                          : 'brightness(0.95)',
                    transition: 'filter 0.2s ease',
                  }}
                />
              )
            })}

            {/* Liquid surface line */}
            {pigmentCount > 0 && (
              <line
                x1={TUBE_WIDTH / 2 - TUBE_RADIUS + 6}
                y1={liquidTopY}
                x2={TUBE_WIDTH / 2 + TUBE_RADIUS - 6}
                y2={liquidTopY}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
            )}
          </g>
        )}

        {/* Glass highlight overlay */}
        <path
          d={getTubePath()}
          fill={`url(#highlight-${index})`}
          stroke="none"
        />

        {/* Left reflection line */}
        <line
          x1={TUBE_WIDTH / 2 - TUBE_RADIUS + 12}
          y1={15}
          x2={TUBE_WIDTH / 2 - TUBE_RADIUS + 12}
          y2={TUBE_HEIGHT - TUBE_RADIUS - 15}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Selection indicator */}
        {isSelected && (
          <>
            <path
              d={getTubePath()}
              fill="none"
              stroke="rgba(255, 215, 0, 0.8)"
              strokeWidth="3"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))',
                animation: 'selectionPulse 1.5s ease-in-out infinite',
              }}
            />
            {/* Inner glow */}
            <path
              d={getTubePath()}
              fill="rgba(255, 215, 0, 0.05)"
              stroke="none"
            />
          </>
        )}

        {/* Valid target indicator */}
        {isValidTarget && !isSelected && (
          <path
            d={getTubePath()}
            fill="none"
            stroke="rgba(100, 255, 100, 0.4)"
            strokeWidth="2"
            strokeDasharray="6 4"
            style={{
              animation: 'dash 1s linear infinite',
            }}
          />
        )}

        {/* Tube number (subtle) */}
        <text
          x={TUBE_WIDTH / 2}
          y={TUBE_HEIGHT - 8}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.2)"
          fontSize="10"
          fontFamily="system-ui, sans-serif"
        >
          {index + 1}
        </text>
      </svg>
    </div>
    </>
  )
}

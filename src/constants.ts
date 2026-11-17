// ─── Constants ────────────────────────────────────────────────────────────────

import type { PigmentColor } from './types'
import { PIGMENT_PALETTE } from './types'

export const TUBE_WIDTH = 72
export const TUBE_HEIGHT = 200
export const TUBE_RADIUS = 24
export const PIGMENT_HEIGHT = 38
export const PIGMENT_GAP = 1
export const TUBE_GLASS_COLOR = 'rgba(255, 255, 255, 0.15)'
export const TUBE_STROKE_COLOR = 'rgba(255, 255, 255, 0.3)'
export const TUBE_STROKE_WIDTH = 2
export const TUBE_SHADOW = 'rgba(0, 0, 0, 0.3)'

// Glass highlight gradient
export const GLASS_HIGHLIGHT = {
  x1: '15%',
  y1: '0%',
  x2: '85%',
  y2: '0%',
  stop1: 'rgba(255, 255, 255, 0.25)',
  stop2: 'rgba(255, 255, 255, 0)',
}

// Tube bottom curve control point
export const BOTTOM_CURVE = 0.6

// Selection animation
export const SELECT_SCALE = 1.08
export const SELECT_LIFT = -8

// Glass reflection
export const REFLECTION_WIDTH = 8
export const REFLECTION_X = 14

// Tube capacity
export const CAPACITY = 4

// ─── Tube shape helpers ──────────────────────────────────────────────────────

// Generate SVG path for the glass tube shape
export function getTubePath(width: number = TUBE_WIDTH, height: number = TUBE_HEIGHT): string {
  const r = TUBE_RADIUS
  const w = width / 2
  const h = height

  // Tube body: straight sides + rounded bottom
  const topY = 0
  const bottomY = h - r
  const midX = width / 2

  return [
    `M ${midX - w + r} ${topY}`,
    `L ${midX - w + r} ${bottomY}`,
    `A ${r} ${r} 0 0 0 ${midX + w - r} ${bottomY}`,
    `L ${midX + w - r} ${topY}`,
    'Z',
  ].join(' ')
}

// Generate the liquid fill shape for a given number of pigments
export function getLiquidPath(
  width: number = TUBE_WIDTH,
  pigments: number,
  pigmentHeight: number = PIGMENT_HEIGHT,
  gap: number = PIGMENT_GAP
): string {
  if (pigments <= 0) return ''

  const w = width / 2 - 4 // inset for glass thickness
  const midX = width / 2
  const r = TUBE_RADIUS - 4
  const fillHeight = (pigmentHeight + gap) * pigments - gap
  const bottomY = TUBE_HEIGHT - TUBE_RADIUS
  const topY = bottomY - fillHeight

  // Build the liquid shape: straight sides + rounded bottom
  return [
    `M ${midX - w + r} ${bottomY - r}`,
    `L ${midX - w + r} ${topY}`,
    `L ${midX + w - r} ${topY}`,
    `L ${midX + w - r} ${bottomY - r}`,
    `A ${r} ${r} 0 0 1 ${midX - w + r} ${bottomY - r}`,
    'Z',
  ].join(' ')
}

// Get the color for a pigment
export function getPigmentColor(color: PigmentColor): string {
  return PIGMENT_PALETTE[color]?.bg ?? '#888888'
}

// Get the text color for readability on top of pigment
export function getPigmentTextColor(color: PigmentColor): string {
  return PIGMENT_PALETTE[color]?.text ?? '#ffffff'
}

// Get the number of visible pigment layers
export function getVisibleLayers(pigments: number): number {
  return pigments
}

// Check if a tube is full
export function isTubeFull(pigments: number): boolean {
  return pigments >= CAPACITY
}

// Check if a tube is empty
export function isTubeEmpty(pigments: number): boolean {
  return pigments === 0
}

// Calculate the fill height for a given number of pigments
export function getFillHeight(pigments: number): number {
  if (pigments <= 0) return 0
  return (PIGMENT_HEIGHT + PIGMENT_GAP) * pigments - PIGMENT_GAP
}

// ─── Particle Burst Component ─────────────────────────────────────────────────
// Lightweight particle burst effect for tube completion.

import { useState, useEffect, useCallback, useRef } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  opacity: number
  life: number
}

interface ParticleBurstProps {
  active: boolean
  color: string
  onComplete: () => void
}

const PARTICLE_COLORS: Record<string, string[]> = {
  red: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
  green: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  blue: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  yellow: ['#eab308', '#facc15', '#fde047', '#fef08a'],
  purple: ['#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'],
  orange: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
  pink: ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8'],
  lime: ['#84cc16', '#a3e635', '#c6f66f', '#ecfccb'],
  indigo: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
}

export function ParticleBurst({ active, color, onComplete }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const animationRef = useRef<number>(undefined)
  const startTimeRef = useRef<number>(0)

  const createParticles = useCallback(() => {
    const colors = PARTICLE_COLORS[color] ?? ['#ffffff']
    const newParticles: Particle[] = []
    const count = 20

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const speed = 1 + Math.random() * 3
      newParticles.push({
        id: i,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        opacity: 1,
        life: 0,
      })
    }

    setParticles(newParticles)
    startTimeRef.current = performance.now()
  }, [color])

  useEffect(() => {
    if (!active) {
      setParticles([])
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    createParticles()

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp

      const elapsed = (timestamp - startTimeRef.current) / 1000
      const duration = 1.5

      if (elapsed >= duration) {
        setParticles([])
        onComplete()
        return
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // gravity
          life: p.life + 0.02,
          opacity: Math.max(0, 1 - p.life),
        }))
      )

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, color, createParticles, onComplete])

  if (particles.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            opacity: p.opacity,
            transform: `translate(${p.x}px, ${p.y}px)`,
            transition: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}

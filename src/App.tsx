// ─── App.tsx ──────────────────────────────────────────────────────────────────
// Main game component — wires all hooks together.

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { GameBoard } from './components/GameBoard'
import { BackgroundArtwork } from './components/BackgroundArtwork'
import { Controls } from './components/Controls'
import { LevelComplete } from './components/LevelComplete'
import { LevelSelect } from './components/LevelSelect'
import { ParticleBurst } from './components/ParticleBurst'
import { PourAnimation } from './components/PourAnimation'
import { HintOverlay } from './components/HintOverlay'
import type { PigmentColor } from './types'
import { createPuzzleState, type PuzzleState } from './engine/puzzleState'
import { useGame } from './engine/useGame'
import { useLevelManagement } from './engine/useLevelManagement'
import { useProgress } from './engine/useProgress'
import { playSelect, playPour, playComplete } from './engine/sounds'

function App() {
  const { progress, settings, setProgress, setSettings, completeAndSave } = useProgress()

  // Determine starting level from progress (highest unlocked, 0-indexed)
  const startLevelIndex = Math.min(progress.highestUnlockedLevel - 1, 9)

  const {
    levels,
    currentLevel,
    currentLevelIndex,
    showingLevelSelect,
    resetKey,
    selectLevel,
    nextLevel: selectNextLevel,
    backFromLevelSelect,
    showLevelSelect,
  } = useLevelManagement(startLevelIndex)

  // Create initial puzzle state for the current level
  const initialPuzzleState = currentLevel
    ? createPuzzleState(currentLevel.tubes)
    : createPuzzleState([])

  const game = useGame(initialPuzzleState, resetKey)

  // ─── UI-only state ───────────────────────────────────────────────────────
  const [burstActive, setBurstActive] = useState(false)
  const [burstColor, setBurstColor] = useState<PigmentColor>('red')
  const [revealedColors, setRevealedColors] = useState<Set<PigmentColor>>(new Set())
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null)
  const toastId = useRef(0)

  // Solution history modal
  const [showSolutions, setShowSolutions] = useState(false)

  // Daily challenge
  const [_dailyChallenge] = useState(() => {
    try {
      const raw = localStorage.getItem('pigment_daily')
      if (raw) {
        const parsed = JSON.parse(raw)
        const today = new Date().toISOString().split('T')[0]
        if (parsed.date === today) return parsed
      }
    } catch {
      // ignore
    }
    // Generate new daily challenge
    const today = new Date().toISOString().split('T')[0]
    const seed = today.split('-').reduce((acc, d) => acc + parseInt(d), 0)
    const levelIndex = seed % 10
    return { date: today, levelId: levelIndex + 1, bestMoveCount: null, bestTime: null, completed: false }
  })

  // Pour animation state
  const [pourAnim, setPourAnim] = useState<{
    active: boolean
    fromIndex: number
    toIndex: number
    color: PigmentColor
    units: number
  } | null>(null)
  const [hintHighlight, setHintHighlight] = useState<{ from: number; to: number } | null>(null)
  const hintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Solution history
  const [solutionHistory, setSolutionHistory] = useState(() => {
    try {
      const raw = localStorage.getItem('pigment_solutions')
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  })

  // ─── Helpers ─────────────────────────────────────────────────────────────

  // Calculate star rating based on moves vs par
  const bestTime = progress.bestTimes?.[currentLevel?.id ?? 0] ?? null

  // Calculate star rating based on moves vs par
  const starRating = useMemo(() => {
    if (!currentLevel || !game.levelComplete) return 0
    const par = currentLevel.par ?? -1
    if (par <= 0) return 1 // can't compute par, default to 1 star
    const ratio = game.moveCount / par
    if (ratio <= 1.0) return 3
    if (ratio <= 1.5) return 2
    return 1
  }, [currentLevel, game.moveCount, game.levelComplete])

  // Show toast notification
  const showToast = useCallback((message: string) => {
    const id = ++toastId.current
    setToast({ message, id })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2500)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleTubeComplete = useCallback(
    (color: PigmentColor) => {
      setBurstColor(color)
      setBurstActive(true)
      setRevealedColors((prev) => new Set([...prev, color]))
      playComplete(settings.mute)
    },
    [settings.mute]
  )

  const handleBurstComplete = useCallback(() => {
    setBurstActive(false)
  }, [])

  const handleTubeSelect = useCallback(() => {
    playSelect(settings.mute)
  }, [settings.mute])

  // Improved hint: shows a glowing highlight on the best move
  const handleHint = useCallback(() => {
    const best = game.bestMove
    if (!best) {
      showToast('No hints available — try restarting!')
      return
    }

    // Show highlight
    setHintHighlight({ from: best.fromIndex, to: best.toIndex })
    if (hintTimeout.current) clearTimeout(hintTimeout.current)
    hintTimeout.current = setTimeout(() => {
      setHintHighlight(null)
    }, 3000)

    // Also show a text hint
    const color = best.fromIndex >= 0 && best.fromIndex < game.currentState.tubes.length
      ? game.currentState.tubes[best.fromIndex].pigments[game.currentState.tubes[best.fromIndex].pigments.length - 1]?.color
      : 'red'

    const colorNames: Record<string, string> = {
      red: 'red', green: 'green', blue: 'blue', yellow: 'yellow',
      purple: 'purple', orange: 'orange', cyan: 'cyan', pink: 'pink',
      lime: 'lime', indigo: 'indigo',
    }

    showToast(`💡 Try: pour ${best.units}x ${colorNames[color] ?? 'pigment'} from tube ${best.fromIndex + 1} → tube ${best.toIndex + 1}`)
  }, [game.bestMove, game.currentState.tubes, game.levelComplete, showToast])

  const handleNextLevel = useCallback(() => {
    const nextIndex = currentLevelIndex + 1
    if (nextIndex < levels.length) {
      // Save solution history
      const newSolution = {
        levelId: currentLevel!.id,
        moveCount: game.moveCount,
        elapsedTime: game.elapsedTime,
        moves: [], // In production, capture move sequence
        completedAt: new Date().toISOString(),
      }
      const updated = [newSolution, ...solutionHistory].slice(0, 10)
      setSolutionHistory(updated)
      try {
        localStorage.setItem('pigment_solutions', JSON.stringify(updated))
      } catch {
        // ignore
      }

      selectNextLevel()
      const newProgress = completeAndSave(progress, currentLevel!.id, game.moveCount)
      setProgress(newProgress)
    } else {
      const newProgress = completeAndSave(progress, currentLevel!.id, game.moveCount)
      setProgress(newProgress)
      showToast('All paintings complete! 🎉')
    }
  }, [currentLevelIndex, levels, progress, currentLevel, game.moveCount, game.elapsedTime, selectNextLevel, completeAndSave, setProgress, showToast, solutionHistory])

  // Handle move with pour animation
  const handleMoveWithAnimation = useCallback(
    (newState: PuzzleState, move: { fromIndex: number; toIndex: number; units: number }) => {
      // Get the color being poured
      const color = game.currentState.tubes[move.fromIndex].pigments[
        game.currentState.tubes[move.fromIndex].pigments.length - 1
      ]?.color ?? 'blue'

      // Start pour animation
      setPourAnim({
        active: true,
        fromIndex: move.fromIndex,
        toIndex: move.toIndex,
        color: color as PigmentColor,
        units: move.units,
      })

      // After animation completes, apply the move
      setTimeout(() => {
        setPourAnim(null)
        game.handleMove(newState, move)
      }, 300)

      playPour(settings.mute)
    },
    [game, game.currentState.tubes, settings.mute]
  )

  // Stuck detection toast
  const prevStuckRef = useRef(false)
  if (game.isStuck && !prevStuckRef.current) {
    prevStuckRef.current = true
    showToast('😰 No valid moves! Try restarting or using a hint.')
  } else if (!game.isStuck) {
    prevStuckRef.current = false
  }


  // ─── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const key = e.key.toLowerCase()
      switch (key) {
        case 'r': // Restart
          game.handleRestart()
          showToast('🔄 Level restarted')
          break
        case 'u': // Undo
          if (game.canUndo) {
            game.handleUndo()
            showToast('↩️ Undo')
          }
          break
        case 'h': // Hint
          handleHint()
          break
        case 'b': // Back (level select)
          if (!showingLevelSelect) {
            showLevelSelect()
          }
          break
        case 'n': // Next level
          if (game.levelComplete) {
            handleNextLevel()
          }
          break
        case 'd': // Daily challenge
          showToast('📅 Daily challenge coming soon!')
          break
        case 'escape':
          if (showingLevelSelect) {
            backFromLevelSelect()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [game, showingLevelSelect, handleHint, handleNextLevel, showLevelSelect, backFromLevelSelect, showToast])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: '100vw',
        height: '100svh',
        overflow: 'hidden',
        position: 'relative',
        background: '#1a1a2e',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Background artwork */}
      <BackgroundArtwork
        revealedColors={revealedColors}
        isLevelComplete={game.showingComplete}
        reducedMotion={settings.reducedMotion}
      />

      {/* Particle burst effect */}
      <ParticleBurst
        active={burstActive}
        color={burstColor}
        onComplete={handleBurstComplete}
      />

      {/* Pour animation overlay */}
      {pourAnim && pourAnim.active && (
        <PourAnimation
          fromIndex={pourAnim.fromIndex}
          toIndex={pourAnim.toIndex}
          color={pourAnim.color}
          units={pourAnim.units}
          totalTubes={currentLevel?.tubes.length ?? 0}
          tubeWidth={72}
          tubeGap={24}
        />
      )}

      {/* Hint overlay */}
      {hintHighlight && (
        <HintOverlay
          fromIndex={hintHighlight.from}
          toIndex={hintHighlight.to}
          totalTubes={currentLevel?.tubes.length ?? 0}
          tubeWidth={72}
          tubeGap={24}
        />
      )}

      {/* Game board */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <GameBoard
          state={game.currentState}
          onMove={handleMoveWithAnimation}
          onTubeComplete={handleTubeComplete}
          levelComplete={game.showingComplete}
          onTubeSelect={handleTubeSelect}
          hintHighlight={hintHighlight}
        />
      </div>

      {/* Controls */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', height: '100%' }}>
          <Controls
            levelNumber={currentLevel?.id ?? 1}
            parMoves={currentLevel?.par ?? 0}
            completedColors={game.completedColors}
            totalColors={game.totalColors}
            moveCount={game.moveCount}
            elapsedTime={game.elapsedTime}
            canUndo={game.canUndo}
            onUndo={game.handleUndo}
            onRestart={game.handleRestart}
            onHint={handleHint}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => {
              setSettings({ ...settings, soundEnabled: !settings.soundEnabled })
            }}
            onSettings={() => {
              setSettings({ ...settings, reducedMotion: !settings.reducedMotion })
            }}
            onShowLevelSelect={showLevelSelect}
            onViewSolutions={() => setShowSolutions(true)}
          />
        </div>
      </div>

      {/* Level complete overlay */}
      {game.showingComplete && currentLevel && (
        <LevelComplete
          levelNumber={currentLevel.id}
          moveCount={game.moveCount}
          parMoves={currentLevel.par ?? 0}
          starRating={starRating}
          elapsedTime={game.elapsedTime}
          bestTime={bestTime}
          onNext={handleNextLevel}
          onReplay={game.handleReplay}
        />
      )}

      {/* Level select overlay */}
      {showingLevelSelect && (
        <LevelSelect
          progress={progress}
          levels={levels}
          currentLevelIndex={currentLevelIndex}
          onSelectLevel={selectLevel}
          onBack={backFromLevelSelect}
        />
      )}

      {/* Solution history modal */}
      {showSolutions && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowSolutions(false)}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: 'rgba(255, 255, 255, 0.95)', fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
              📜 Solution History
            </h2>
            {solutionHistory.length === 0 ? (
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                No solutions yet. Complete a level to save your solution!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {solutionHistory.map((solution: any, index: number) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '16px',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '8px' }}>
                      Level {solution.levelId}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                      {solution.moveCount} moves • {solution.elapsedTime}s
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
                      {new Date(solution.completedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setShowSolutions(false)}
                style={{
                  padding: '12px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.85)',
            color: 'rgba(255, 255, 255, 0.9)',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
            zIndex: 60,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App

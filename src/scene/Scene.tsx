import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Genre } from './genres'
import { SceneRenderer } from './renderer'

export interface SceneHandle {
  /** p: continuous genre index; drift: px of travel inside the current genre */
  update(p: number, drift: number): void
  /** Pixel distance from the top of the viewport to the horizon (the shelf top). */
  setHorizon(y: number): void
}

interface Props {
  genres: Genre[]
  reducedMotion: boolean
  /** stop the living layers while something covers the scene (an open book, the editor) */
  paused: boolean
}

// clicks on these belong to the interface, not the scene behind it
const UI = 'button, a, input, select, textarea, label, summary, [role="dialog"], .masthead'

/** The poster behind the shelf: field + giant genre word + overprinted shapes + living layer. */
export const Scene = forwardRef<SceneHandle, Props>(function Scene({ genres, reducedMotion, paused }, ref) {
  const bgRef = useRef<HTMLCanvasElement>(null)
  const fgRef = useRef<HTMLCanvasElement>(null)
  const fxRef = useRef<HTMLCanvasElement>(null)
  const wordRefs = useRef<(HTMLElement | null)[]>([])
  const renderer = useRef<SceneRenderer | null>(null)
  const state = useRef({
    p: 0,
    shownP: 0,
    drift: 0,
    shownDrift: 0,
    horizon: 0,
    lean: { x: 0, y: 0 },
    pointer: { x: 0, y: 0, inside: false, mouse: false },
    dirty: true,
  })
  const loop = useRef({ raf: 0, last: 0, start: performance.now() })

  const paint = (now: number) => {
    const r = renderer.current
    if (!r) return
    const s = state.current
    const dt = Math.min(0.05, (now - (loop.current.last || now)) / 1000)
    loop.current.last = now

    // ease toward where the shelf is, so even a scrollbar drag morphs smoothly
    const k = 1 - Math.exp(-dt * 9)
    s.shownP = reducedMotion ? Math.round(s.p) : s.shownP + (s.p - s.shownP) * k
    if (Math.abs(s.p - s.shownP) < 0.0005) s.shownP = s.p
    s.shownDrift += (s.drift - s.shownDrift) * k

    // lean the layers gently toward a mouse pointer (depth, not motion sickness)
    const target = s.pointer.inside && s.pointer.mouse && !reducedMotion
      ? { x: (s.pointer.x / window.innerWidth) * 2 - 1, y: (s.pointer.y / window.innerHeight) * 2 - 1 }
      : { x: 0, y: 0 }
    const kl = 1 - Math.exp(-dt * 3)
    s.lean.x += (target.x - s.lean.x) * kl
    s.lean.y += (target.y - s.lean.y) * kl

    const colors = r.render({
      p: s.shownP,
      drift: reducedMotion ? 0 : s.shownDrift,
      time: (now - loop.current.start) / 1000,
      dt,
      lean: s.lean,
      pointer: s.pointer,
      animate: !reducedMotion,
    })
    const root = document.documentElement.style
    root.setProperty('--field', colors.field)
    root.setProperty('--ink-text', colors.text)
    root.setProperty('--word-ink', colors.word)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.field)
    wordRefs.current.forEach((el, n) => {
      if (!el) return
      const d = s.shownP - n
      const visible = Math.abs(d) < 0.5
      el.style.visibility = visible ? 'visible' : 'hidden'
      if (!visible) return
      // the outgoing word clears before the incoming one prints
      el.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 2.2))
      el.style.transform = `translate3d(${-d * 34 - s.lean.x * 1.2}vw, ${-s.lean.y * 6}px, 0)`
    })
    s.dirty = false
  }

  useImperativeHandle(ref, () => ({
    update(p, drift) {
      state.current.p = p
      state.current.drift = drift
      state.current.dirty = true
    },
    setHorizon(y) {
      if (Math.abs(y - state.current.horizon) < 0.5) return
      state.current.horizon = y
      renderer.current?.resize(window.innerWidth, window.innerHeight, y, sceneTop())
      document.documentElement.style.setProperty('--horizon', `${y}px`)
      state.current.dirty = true
    },
  }))

  // build the renderer; refit on resize
  useEffect(() => {
    if (!bgRef.current || !fgRef.current || !fxRef.current || !genres.length) return
    const r = new SceneRenderer(bgRef.current, fgRef.current, fxRef.current, genres.map((g) => g.scene))
    renderer.current = r
    // Stretch or squeeze each genre word (Anybody's width axis) so it spans the screen.
    const fitWords = () => {
      const target = window.innerWidth * (window.innerWidth < 760 ? 0.92 : 0.9)
      for (const el of wordRefs.current) {
        if (!el) continue
        let stretch = 100
        for (let pass = 0; pass < 2; pass++) {
          el.style.fontStretch = `${stretch}%`
          const w = el.offsetWidth || 1
          stretch = Math.max(50, Math.min(150, (stretch * target) / w))
        }
        el.style.fontStretch = `${stretch}%`
      }
    }
    const onResize = () => {
      r.resize(window.innerWidth, window.innerHeight, state.current.horizon || window.innerHeight * 0.9, sceneTop())
      fitWords()
      state.current.dirty = true
    }
    onResize()
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(() => {
      fitWords()
      state.current.dirty = true
    })
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.current = null
    }
  }, [genres])

  // the frame loop: always alive while visible; with reduced motion it only repaints on change
  useEffect(() => {
    const tick = (now: number) => {
      loop.current.raf = requestAnimationFrame(tick)
      if (document.hidden) return
      if (paused || reducedMotion) {
        if (state.current.dirty) paint(now)
        else loop.current.last = now
        return
      }
      paint(now)
    }
    loop.current.raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(loop.current.raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, reducedMotion])

  // pointer: hover leans the layers and wakes the genre's living layer; a click plays with it
  useEffect(() => {
    const p = state.current.pointer
    const onMove = (e: PointerEvent) => {
      p.x = e.clientX
      p.y = e.clientY
      p.mouse = e.pointerType === 'mouse'
      p.inside = !(e.target as Element | null)?.closest?.(UI)
    }
    const onLeave = () => {
      p.inside = false
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') p.inside = false
    }
    const onDown = (e: PointerEvent) => {
      if (paused || e.button !== 0) return
      if ((e.target as Element | null)?.closest?.(UI)) return
      if (e.clientY > state.current.horizon) return
      onMove(e)
      renderer.current?.click(e.clientX, e.clientY)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [paused])

  return (
    <div className="scene" aria-hidden="true">
      <canvas ref={bgRef} className="scene-field" />
      <div className="scene-words">
        {genres.map((g, k) => (
          <span
            key={g.name}
            ref={(el) => {
              wordRefs.current[k] = el
            }}
            className="scene-word"
          >
            {g.name}
          </span>
        ))}
      </div>
      <canvas ref={fgRef} className="scene-ink" />
      <canvas ref={fxRef} className="scene-light" />
    </div>
  )
})

/** On phones the masthead stacks into two rows; keep the scene's tall shapes below it. */
function sceneTop(): number {
  if (window.innerWidth >= 760) return 0
  return document.querySelector('.masthead')?.getBoundingClientRect().bottom ?? 0
}

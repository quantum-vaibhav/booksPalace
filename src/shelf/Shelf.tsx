import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import type { Genre } from '../scene/genres'
import type { Book } from '../types'
import { INKS } from '../lib/inks'
import { SpineArt, spineMetrics } from './Spine'

export interface Run {
  genre: Genre
  /** every book in the genre */
  all: Book[]
  /** the ones standing on the shelf (capped) */
  books: Book[]
  /** how many wait behind "more" */
  more: number
  /** the far-end stack of books still to read */
  upNext?: boolean
}

export interface ShelfHandle {
  scrollToRun(index: number): void
  focusBook(id: string): void
}

interface Props {
  runs: Run[]
  reducedMotion: boolean
  paused: boolean
  openId: string | null
  onProgress(p: number, drift: number): void
  onHorizon(y: number): void
  onOpen(book: Book, el: HTMLElement): void
  /** open the full list for a genre */
  onShowAll(run: Run): void
  /** only while editing locally: start a new book in Up next */
  onAddNext?(): void
}

/** Shelf travel per pixel of vertical swipe: a phone is short, the shelf is long. */
const SWIPE_GAIN = 1.6

const smoothstep =(x: number) => {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

export const Shelf = forwardRef<ShelfHandle, Props>(function Shelf(
  { runs, reducedMotion, paused, openId, onProgress, onHorizon, onOpen, onShowAll, onAddNext },
  ref,
) {
  const scroller = useRef<HTMLDivElement>(null)
  const plank = useRef<HTMLDivElement>(null)
  const runRefs = useRef<(HTMLElement | null)[]>([])
  const glide = useRef({ target: 0, current: 0, raf: 0, active: false })
  /** when the last touch swipe ended, so the tap it started on doesn't also open a book */
  const swipedAt = useRef(-Infinity)

  // ---- where along the shelf are we, as a continuous genre index -------------
  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const vw = el.clientWidth
    const max = el.scrollWidth - vw
    const f = max > 0 ? el.scrollLeft / max : 0
    // the "reading point" slides across the viewport as you travel, so the first
    // genre owns the opening screen and the last genre owns the final one
    const reading = el.scrollLeft + vw * (0.18 + 0.64 * f)
    const spans = runRefs.current.map((r) => (r ? { start: r.offsetLeft, end: r.offsetLeft + r.offsetWidth } : { start: 0, end: 0 }))
    const zone = Math.max(260, Math.min(640, vw * 0.5))
    let p = 0
    for (let k = 0; k < spans.length - 1; k++) {
      const b = (spans[k].end + spans[k + 1].start) / 2
      const half = Math.min(zone / 2, (spans[k].end - spans[k].start) * 0.45, (spans[k + 1].end - spans[k + 1].start) * 0.45)
      if (reading >= b + half) {
        p = k + 1
        continue
      }
      if (reading > b - half) p = k + smoothstep((reading - (b - half)) / (2 * half))
      break
    }
    const i = Math.floor(p)
    const t = p - i
    const centre = (k: number) => (spans[k] ? (spans[k].start + spans[k].end) / 2 : 0)
    const anchor = centre(i) + (centre(Math.min(i + 1, spans.length - 1)) - centre(i)) * t
    onProgress(p, reading - anchor)
  }, [onProgress])

  const measureHorizon = useCallback(() => {
    if (plank.current) onHorizon(plank.current.getBoundingClientRect().top)
  }, [onHorizon])

  useLayoutEffect(() => {
    measureHorizon()
    measure()
  }, [runs, measure, measureHorizon])

  useEffect(() => {
    const onResize = () => {
      measureHorizon()
      measure()
    }
    window.addEventListener('resize', onResize)
    document.fonts?.ready.then(onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure, measureHorizon])

  // ---- vertical wheel drives horizontal travel, with a little glide ----------
  const step = useCallback(() => {
    const g = glide.current
    const el = scroller.current
    if (!el) return
    g.current += (g.target - g.current) * 0.14
    if (Math.abs(g.target - g.current) < 0.5) g.current = g.target
    el.scrollLeft = g.current
    if (g.current !== g.target) g.raf = requestAnimationFrame(step)
    else {
      g.raf = 0
      g.active = false
    }
  }, [])

  const glideTo = useCallback(
    (x: number) => {
      const el = scroller.current
      if (!el) return
      const g = glide.current
      g.target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, x))
      if (reducedMotion) {
        el.scrollLeft = g.target
        g.current = g.target
        return
      }
      if (!g.active) g.current = el.scrollLeft
      g.active = true
      if (!g.raf) g.raf = requestAnimationFrame(step)
    },
    [reducedMotion, step],
  )

  useEffect(() => {
    if (paused) return
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return // pinch-zoom
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-own-scroll]')) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return // trackpads scroll sideways natively
      e.preventDefault()
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerWidth : 1
      const g = glide.current
      glideTo((g.active ? g.target : scroller.current?.scrollLeft ?? 0) + e.deltaY * unit)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [paused, glideTo])

  // ---- on touch screens an up/down swipe anywhere travels the shelf too ----------
  // (sideways swipes on the shelf scroll it natively; the page itself never scrolls)
  useEffect(() => {
    if (paused) return
    let t: { x: number; y: number; left: number; axis: 'x' | 'y' | null; lastY: number; lastT: number; v: number } | null = null
    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (e.touches.length !== 1 || target?.closest('[data-own-scroll], .genre-index')) {
        t = null
        return
      }
      const el = scroller.current
      if (!el) return
      const g = glide.current
      cancelAnimationFrame(g.raf)
      g.raf = 0
      g.active = false
      const { clientX: x, clientY: y } = e.touches[0]
      t = { x, y, left: el.scrollLeft, axis: null, lastY: y, lastT: e.timeStamp, v: 0 }
    }
    const onMove = (e: TouchEvent) => {
      const el = scroller.current
      if (!t || !el || e.touches.length !== 1) return
      const { clientX: x, clientY: y } = e.touches[0]
      const dx = x - t.x
      const dy = y - t.y
      if (!t.axis) {
        if (Math.hypot(dx, dy) < 8) return
        t.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
      }
      if (t.axis !== 'y') return
      // swipe up to move on, as a wheel scrolled down does
      el.scrollLeft = t.left - dy * SWIPE_GAIN
      const dt = e.timeStamp - t.lastT
      if (dt > 0) t.v = t.v * 0.4 + ((y - t.lastY) / dt) * 0.6
      t.lastY = y
      t.lastT = e.timeStamp
    }
    const onEnd = (e: TouchEvent) => {
      const el = scroller.current
      if (t?.axis) swipedAt.current = performance.now()
      if (t?.axis === 'y' && el && e.timeStamp - t.lastT < 80 && Math.abs(t.v) > 0.2) {
        // carry the flick on, easing out
        glideTo(el.scrollLeft - t.v * SWIPE_GAIN * 260)
      }
      t = null
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [paused, glideTo])

  useEffect(() => () => cancelAnimationFrame(glide.current.raf), [])

  useImperativeHandle(ref, () => ({
    scrollToRun(index) {
      const r = runRefs.current[index]
      const el = scroller.current
      if (!r || !el) return
      // solve for the scroll position whose reading point lands on the genre's centre
      const max = el.scrollWidth - el.clientWidth
      const centre = r.offsetLeft + r.offsetWidth / 2
      const x = (centre - el.clientWidth * 0.18) / (1 + (el.clientWidth * 0.64) / Math.max(1, max))
      glideTo(x)
    },
    focusBook(id) {
      scroller.current?.querySelector<HTMLElement>(`[data-book="${CSS.escape(id)}"]`)?.focus({ preventScroll: true })
    },
  }))

  // ---- keyboard: arrows walk the shelf book by book ---------------------------
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const all = [...(scroller.current?.querySelectorAll<HTMLElement>('[data-book]') ?? [])]
    const i = all.indexOf(document.activeElement as HTMLElement)
    let next = i
    if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = all.length - 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = Math.max(0, i - 1)
    else next = i < 0 ? 0 : Math.min(all.length - 1, i + 1)
    if (next === i || !all[next]) return
    e.preventDefault()
    all[next].focus({ preventScroll: true })
    all[next].scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className="shelf">
      <div ref={plank} className="plank" aria-hidden="true" />
      <div
        ref={scroller}
        className="shelf-scroller"
        onScroll={() => {
          if (!glide.current.active) glide.current.current = glide.current.target = scroller.current?.scrollLeft ?? 0
          measure()
        }}
        onKeyDown={onKeyDown}
        onClickCapture={(e) => {
          if (performance.now() - swipedAt.current < 400) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <div className="shelf-track">
          {runs.map((run, k) => (
            <section
              key={run.genre.name}
              ref={(el) => {
                runRefs.current[k] = el
              }}
              className={`run${run.upNext ? ' run--next' : ''}`}
              aria-labelledby={`run-${k}`}
            >
              <div className="group">
                {run.upNext ? (
                  <>
                    <ol className="stack">
                      {run.books.map((b, n) => (
                        <li key={b.id} style={{ '--n': n } as CSSProperties}>
                          <BookButton book={b} flat hidden={openId === b.id} onOpen={onOpen} />
                        </li>
                      ))}
                      {onAddNext && (
                        <li style={{ '--n': run.books.length } as CSSProperties}>
                          <button type="button" className="add-next" onClick={onAddNext}>
                            <svg viewBox="0 0 12 12" aria-hidden="true">
                              <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" fill="none" />
                            </svg>
                            Add to Up next
                          </button>
                        </li>
                      )}
                    </ol>
                    {run.more > 0 && <MoreButton count={run.more} genre={run.genre.name} inks={hiddenInks(run)} onClick={() => onShowAll(run)} />}
                  </>
                ) : (
                  <>
                    <span className="bookend" aria-hidden="true" />
                    <ol className="books">
                      {run.books.map((b) => (
                        <li key={b.id}>
                          <BookButton book={b} hidden={openId === b.id} onOpen={onOpen} />
                        </li>
                      ))}
                    </ol>
                    {run.more > 0 && <MoreButton count={run.more} genre={run.genre.name} inks={hiddenInks(run)} onClick={() => onShowAll(run)} />}
                    <span className="bookend bookend--end" aria-hidden="true" />
                  </>
                )}
              </div>
              <h2 className="run-tag" id={`run-${k}`}>
                <button type="button" className="run-tag-button" onClick={() => onShowAll(run)} disabled={!run.all.length}>
                  {run.genre.name}
                  <span className="run-count">{run.all.length}</span>
                </button>
              </h2>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
})

/** The rest of a long genre, boxed up at the end of its run: opens the full list. */
function MoreButton({ count, genre, inks, onClick }: { count: number; genre: string; inks: string[]; onClick(): void }) {
  return (
    <button type="button" className="more" onClick={onClick} aria-label={`Show all ${genre} books, ${count} more`}>
      <span className="more-stack" aria-hidden="true">
        {[0, 1, 2].map((k) => (
          <span key={k} style={inks[k] ? ({ '--ink': inks[k] } as CSSProperties) : undefined} />
        ))}
      </span>
      <span className="more-label">{count} more</span>
    </button>
  )
}

/** Spine inks of the first few books that didn't fit on the shelf. */
function hiddenInks(run: Run): string[] {
  return run.all.filter((b) => !run.books.includes(b)).slice(0, 3).map((b) => INKS[b.spineInk])
}

const preloaded = new Set<string>()
/** Start fetching a cover as soon as someone shows interest, so it's ready when the book turns. */
function preloadCover(book: Book) {
  if (!book.cover || preloaded.has(book.cover)) return
  preloaded.add(book.cover)
  const img = new Image()
  img.decoding = 'async'
  img.src = book.cover
}

function BookButton({ book, flat, hidden, onOpen }: { book: Book; flat?: boolean; hidden: boolean; onOpen: Props['onOpen'] }) {
  const m = spineMetrics(book)
  const label = [book.title, book.authors.join(', '), book.status === 'reading' ? 'reading now' : null]
    .filter(Boolean)
    .join(', ')
  return (
    <button
      type="button"
      className={`book${flat ? ' book--flat' : ''}`}
      data-book={book.id}
      data-reading={book.status === 'reading' || undefined}
      data-hidden={hidden || undefined}
      style={{ '--h': m.height, '--w': m.width } as CSSProperties}
      aria-label={label}
      onPointerEnter={() => preloadCover(book)}
      onFocus={() => preloadCover(book)}
      onClick={(e) => {
        preloadCover(book)
        onOpen(book, e.currentTarget)
      }}
    >
      <SpineArt book={book} flat={flat} />
      <span className="slip" aria-hidden="true">
        <span className="slip-title">{book.title}</span>
        <span className="slip-meta">
          {book.authors[0]}
          {book.year ? `, ${book.year}` : ''}
        </span>
      </span>
      {book.status === 'reading' && <span className="ribbon" aria-hidden="true" />}
    </button>
  )
}

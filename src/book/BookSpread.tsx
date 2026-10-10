import { animate } from 'motion'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { INKS, contrast, hexToRgb, inkOn, type RGB } from '../lib/inks'
import { motifTile } from '../lib/motifs'
import type { Genre } from '../scene/genres'
import { SpineArt } from '../shelf/Spine'
import type { Book, Status } from '../types'

interface Props {
  book: Book
  /** every book on the shelf, to find the author's other books */
  library: Book[]
  origin: HTMLElement
  genre: Genre
  reducedMotion: boolean
  onClose(): void
  onEdit?(): void
  /** only while editing locally: move the book between read, reading and up next */
  onStatus?(status: Status): void
}

interface Geometry {
  W: number
  H: number
  D: number
  narrow: boolean
}

function geometry(origin: DOMRect): Geometry {
  const vw = window.innerWidth
  const vh = window.innerHeight
  // a two-page spread when two portrait pages fit side by side, otherwise one page
  let H = Math.min(vh * 0.84, 680)
  let W = H * 0.68
  // a phone on its side: too short for two pages that can hold anything
  const short = vh < 520 && vw > vh
  const narrow = short || W * 2 > vw * 0.92
  if (short) {
    // one wide page, the full height, with room beside it for Close
    H = vh - 24
    W = Math.max(300, Math.min(540, vw - 2 * 164))
  } else if (narrow) {
    W = Math.min(vw - 32, 460)
    H = Math.min(vh - 104, W / 0.66)
  }
  const D = Math.max(18, Math.min(70, H * (origin.width / origin.height)))
  return { W, H, D, narrow }
}

const STATUS_ACTIONS: [Status, string][] = [
  ['reading', 'Start reading'],
  ['read', 'Mark as read'],
  ['next', 'Move to Up next'],
]

const EASE_OUT = [0.16, 1, 0.3, 1] as const
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
const dateFmt = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })

export function BookSpread({ book, library, origin, genre, reducedMotion, onClose, onEdit, onStatus }: Props) {
  const layer = useRef<HTMLDivElement>(null)
  const book3d = useRef<HTMLDivElement>(null)
  const cover = useRef<HTMLDivElement>(null)
  const backdrop = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const [geo, setGeo] = useState(() => geometry(origin.getBoundingClientRect()))
  const [opened, setOpened] = useState(false)
  const [coverFailed, setCoverFailed] = useState(!book.cover)
  const [coverLoaded, setCoverLoaded] = useState(false)

  const field = INKS[genre.scene.field]
  const fieldText = inkOn(field)
  const headInk = INKS[genre.scene.word]

  // the open/close animations run from closures made on the first render; read the live size
  const geoRef = useRef(geo)
  geoRef.current = geo

  const fromShelf = () => {
    const r = origin.getBoundingClientRect()
    const { H } = geoRef.current
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 - H / 2, scale: r.height / H, rotateY: 90 }
  }
  const centred = () => ({
    x: window.innerWidth / 2 - geoRef.current.W / 2,
    y: (window.innerHeight - geoRef.current.H) / 2,
    scale: 1,
    rotateY: 0,
  })
  const spread = () => ({ ...centred(), x: geoRef.current.narrow ? window.innerWidth / 2 - geoRef.current.W / 2 : window.innerWidth / 2 })

  useLayoutEffect(() => {
    const el = book3d.current!
    const cv = cover.current!
    const bd = backdrop.current!
    if (reducedMotion) {
      Object.assign(el.style, { transform: `translate(${spread().x}px, ${spread().y}px)` })
      cv.style.transform = 'rotateY(-180deg)'
      if (geo.narrow) cv.style.opacity = '0'
      animate(layer.current!, { opacity: [0, 1] }, { duration: 0.15 })
      setOpened(true)
      closeBtn.current?.focus()
      return
    }
    let cancelled = false
    const run = async () => {
      animate(bd, { opacity: [0, 1] }, { duration: 0.45 })
      const start = fromShelf()
      const mid = centred()
      // 1. out of the shelf and turn to face the reader
      await animate(
        el,
        { x: [start.x, start.x, mid.x], y: [start.y, start.y - geo.H * 0.04 * start.scale, mid.y], scale: [start.scale, start.scale, 1], rotateY: [90, 90, 0] },
        { duration: 0.85, ease: EASE_OUT, times: [0, 0.18, 1] },
      )
      if (cancelled) return
      // 2. open the cover
      const end = spread()
      await Promise.all([
        animate(el, { x: end.x }, { duration: 0.8, ease: EASE_IN_OUT }),
        animate(cv, { rotateY: -180 }, { duration: 0.8, ease: EASE_IN_OUT }),
        geo.narrow ? animate(cv, { opacity: 0 }, { duration: 0.3, delay: 0.5 }) : null,
      ])
      if (cancelled) return
      setOpened(true)
      closeBtn.current?.focus()
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const close = async () => {
    if (closing.current) return
    closing.current = true
    setOpened(false)
    const el = book3d.current
    const cv = cover.current
    if (!el || !cv || reducedMotion) {
      if (layer.current) await animate(layer.current, { opacity: 0 }, { duration: 0.12 })
      onClose()
      return
    }
    const mid = centred()
    await Promise.all([
      animate(el, { x: mid.x }, { duration: 0.55, ease: EASE_IN_OUT }),
      animate(cv, { rotateY: 0, opacity: 1 }, { duration: 0.55, ease: EASE_IN_OUT }),
    ])
    const back = fromShelf()
    animate(backdrop.current!, { opacity: 0 }, { duration: 0.5, delay: 0.1 })
    await animate(el, { x: back.x, y: back.y, scale: back.scale, rotateY: 90 }, { duration: 0.6, ease: EASE_IN_OUT })
    onClose()
  }

  // turning the phone (or resizing the window) while the book is open re-fits the page
  useEffect(() => {
    if (!opened) return
    const onResize = () => {
      const next = geometry(origin.getBoundingClientRect())
      if (next.narrow !== geo.narrow) {
        // the layout itself changed (one page / two): close rather than show a half-built spread
        close()
        return
      }
      setGeo(next)
      geoRef.current = next
      const end = spread()
      animate(book3d.current!, { x: end.x, y: end.y }, { duration: 0 })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, geo.narrow])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep Tab inside the open book
  const trapFocus = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return
    const items = [...(layer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]') ?? [])].filter(
      (n) => n.offsetParent !== null || n === closeBtn.current,
    )
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const facts: [string, string | number | undefined][] = [
    ['First published', book.year || undefined],
    ['Length', book.pages ? `${book.pages} pages` : undefined],
    ['Reading time', book.pages ? readingTime(book.pages) : undefined],
    ['Shelved in', genre.name],
  ]
  const author = book.authors[0]
  const alsoBy = author ? library.filter((b) => b.id !== book.id && b.authors.includes(author)) : []
  const description = trimDescription(book.description ?? '', 720).split(/\n{2,}/).filter(Boolean)
  const previewLabel = book.previewLink?.includes('openlibrary.org') ? 'Read it free on Open Library' : 'Read a sample on Google Books'
  const finished = book.finished ? dateFmt.format(new Date(`${book.finished}-15`)) : null

  // the title overprints the endpaper in the genre's word ink, like the giant word in the
  // sky, when that ink stays legible there; otherwise it prints in the endpaper's text colour
  const titleOverprint = contrast(multiply(hexToRgb(field), hexToRgb(headInk)), hexToRgb(field)) >= 2.6
  // the reader's page is plain paper: stamp it in whichever genre ink reads best on paper
  const stampInk = geo.narrow
    ? fieldText
    : contrast(hexToRgb(field), hexToRgb(INKS.paper)) >= contrast(hexToRgb(headInk), hexToRgb(INKS.paper))
      ? field
      : headInk
  const stamp =
    book.status === 'reading'
      ? { small: 'Bookmarked', big: 'Reading now' }
      : book.status === 'next'
        ? { small: 'On the list', big: 'Up next' }
        : finished
          ? { small: 'Finished', big: finished }
          : { small: 'On the shelf', big: 'Read' }

  // big, but never wider than the page: size by the longest word (Anybody at 122% runs ~0.8em a letter)
  const longestWord = Math.max(4, ...book.title.split(/\s+/).map((w) => w.length))
  const pagePad = Math.min(44, Math.max(22, geo.W * 0.085))
  const titleSize = Math.max(24, Math.min(60, geo.W * 0.112, geo.H * 0.13, (geo.W - pagePad * 2) / (longestWord * 0.8)))

  const frontMatter = (
    <div className="fm">
      <h2
        id="spread-title"
        className={titleOverprint ? 'fm-title fm-title--overprint' : 'fm-title'}
        style={{ fontSize: titleSize }}
      >
        {book.title}
      </h2>
      <p className="fm-byline">{book.authors.join(' and ')}</p>
      <div className="fm-plate-row">
        <CoverPlate book={book} />
        <dl className="fm-colophon">
          {facts
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
      </div>
      {book.previewLink && (
        <a className="fm-preview" href={book.previewLink} target="_blank" rel="noopener noreferrer">
          {previewLabel}
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3.5 2.5h6v6M9.5 2.5 2.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
    </div>
  )

  const ownerPage = (
    <div className="own" style={{ '--stamp-ink': stampInk } as CSSProperties}>
      <div className="own-head">
        <p className="stamp">
          <span>{stamp.small}</span>
          <strong>{stamp.big}</strong>
        </p>
        {book.rating ? <Rating value={book.rating} /> : null}
      </div>
      {book.favoriteLine && (
        <blockquote className="own-line">
          <p>{book.favoriteLine}</p>
        </blockquote>
      )}
      {book.notes ? (
        <p className="own-notes">{book.notes}</p>
      ) : (
        onEdit && <p className="own-notes own-notes--empty">No notes yet. Add them with Edit book.</p>
      )}
      {description.length > 0 && (
        <section className="own-section">
          <h3>What it’s about</h3>
          {description.map((para, k) => (
            <p key={k}>{para}</p>
          ))}
        </section>
      )}
      {alsoBy.length > 0 && (
        <section className="own-section">
          <h3>Also by {author} on this shelf</h3>
          <ul className="own-also">
            {alsoBy.map((b) => (
              <li key={b.id}>{b.title}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )

  return (
    <div
      ref={layer}
      className={`spread-layer${opened ? ' is-open' : ''}${geo.narrow ? ' is-narrow' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="spread-title"
      onKeyDown={trapFocus}
      style={
        {
          '--W': `${geo.W}px`,
          '--H': `${geo.H}px`,
          '--D': `${geo.D}px`,
          '--endpaper': field,
          '--endpaper-text': fieldText,
          '--head-ink': headInk,
          '--motif': motifTile(genre.scene.signature),
        } as CSSProperties
      }
    >
      <div ref={backdrop} className="spread-backdrop" onClick={close} />
      <div ref={book3d} className="book3d" style={{ transformOrigin: `0 50% ${geo.D / 2}px` }}>
        <div className="book3d-spine">
          <SpineArt book={book} />
        </div>
        <div className="book3d-pages page page--right" data-own-scroll tabIndex={0} aria-label="Notes">
          {book.status === 'reading' && <span className="page-ribbon" aria-hidden="true" />}
          {geo.narrow && <div className="narrow-front">{frontMatter}</div>}
          {ownerPage}
          <div className="page-actions">
            {onStatus &&
              STATUS_ACTIONS.filter(([status]) => status !== book.status).map(([status, label]) => (
                <button key={status} type="button" className="text-button" onClick={() => onStatus(status)}>
                  {label}
                </button>
              ))}
            {onEdit && (
              <button type="button" className="text-button" onClick={onEdit}>
                Edit book
              </button>
            )}
          </div>
        </div>
        <div ref={cover} className="book3d-cover">
          <div className="cover-front" style={{ '--spine-ink': INKS[book.spineInk], '--spine-text': inkOn(INKS[book.spineInk]) } as CSSProperties}>
            {/* a printed cover sits underneath until (or unless) the real one arrives */}
            <div className="cover-type">
              <span className="cover-type-title">{book.title}</span>
              <span className="cover-type-author">{book.authors[0]}</span>
            </div>
            {!coverFailed && book.cover && (
              <img
                src={book.cover}
                alt=""
                draggable={false}
                data-loaded={coverLoaded || undefined}
                onLoad={() => setCoverLoaded(true)}
                onError={() => setCoverFailed(true)}
                ref={(img) => {
                  if (img?.complete && img.naturalWidth > 0) setCoverLoaded(true)
                }}
              />
            )}
          </div>
          <div className="cover-back page page--left" data-own-scroll tabIndex={geo.narrow ? -1 : 0} aria-label="About the book">
            {!geo.narrow && frontMatter}
          </div>
        </div>
      </div>
      <button ref={closeBtn} type="button" className="spread-close" onClick={close}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" fill="none" />
        </svg>
        Close book
      </button>
    </div>
  )
}

/** The book's cover, tipped in; a printed stand-in sits underneath until (or unless) the image arrives. */
function CoverPlate({ book }: { book: Book }) {
  const [failed, setFailed] = useState(!book.cover)
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="fm-plate" style={{ '--spine-ink': INKS[book.spineInk], '--spine-text': inkOn(INKS[book.spineInk]) } as CSSProperties}>
      <span className="fm-plate-type" aria-hidden="true">
        {book.title}
      </span>
      {!failed && book.cover && (
        <img
          src={book.cover}
          alt={`Cover of ${book.title}`}
          draggable={false}
          data-loaded={loaded || undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setLoaded(true)
          }}
        />
      )}
    </div>
  )
}

/** Roughly a minute and a quarter a page, rounded to something a person would say. */
function readingTime(pages: number): string {
  const hours = Math.round((pages * 1.25) / 60)
  if (hours < 1) return 'Under an hour'
  return hours === 1 ? '1 hour' : `${hours} hours`
}

/** Publisher blurbs run long; keep whole sentences up to roughly `max` characters. */
function trimDescription(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'), cut.lastIndexOf('? '), cut.lastIndexOf('! '))
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

function Rating({ value }: { value: number }) {
  return (
    <p className="rating" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" aria-hidden="true" data-on={n <= value || undefined}>
          <circle cx="10" cy="10" r="8" />
        </svg>
      ))}
    </p>
  )
}

/** Two inks printed over each other. */
function multiply(a: RGB, b: RGB): RGB {
  return [(a[0] * b[0]) / 255, (a[1] * b[1]) / 255, (a[2] * b[2]) / 255]
}

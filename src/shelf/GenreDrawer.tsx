import { animate } from 'motion'
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { INKS, inkOn } from '../lib/inks'
import type { Book } from '../types'
import type { Run } from './Shelf'

interface Props {
  run: Run
  openId: string | null
  /** a book is open on top; let it handle Escape */
  covered: boolean
  onOpen(book: Book, el: HTMLElement): void
  onClose(): void
}

const EASE = [0.16, 1, 0.3, 1] as const

/** Every book in a genre, as a list of spines laid flat, rising from the shelf. */
export function GenreDrawer({ run, openId, covered, onOpen, onClose }: Props) {
  const sheet = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  const field = INKS[run.genre.scene.field]

  useLayoutEffect(() => {
    if (sheet.current) animate(sheet.current, { y: ['100%', '0%'] }, { duration: 0.45, ease: EASE })
    closeBtn.current?.focus()
  }, [])

  const close = async () => {
    if (closing.current) return
    closing.current = true
    if (sheet.current) await animate(sheet.current, { y: '100%' }, { duration: 0.28, ease: [0.4, 0, 1, 1] })
    onClose()
  }

  useEffect(() => {
    if (covered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [covered])

  const books = [...run.all].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div
      className="drawer-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      style={{ '--drawer-field': field, '--drawer-text': inkOn(field) } as CSSProperties}
    >
      <div className="drawer-backdrop" onClick={close} />
      <div ref={sheet} className="drawer" data-own-scroll>
        <div className="drawer-head">
          <h2 id="drawer-title">
            {run.genre.name}
            <span>{run.all.length} {run.all.length === 1 ? 'book' : 'books'}</span>
          </h2>
          <button ref={closeBtn} type="button" className="drawer-close" onClick={close}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" fill="none" />
            </svg>
            Close
          </button>
        </div>
        <ul className="drawer-list">
          {books.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="drawer-book"
                data-hidden={openId === b.id || undefined}
                onClick={(e) => onOpen(b, e.currentTarget)}
                style={{ '--spine-ink': INKS[b.spineInk], '--spine-text': inkOn(INKS[b.spineInk]) } as CSSProperties}
              >
                <span className="drawer-spine" aria-hidden="true">
                  {b.status === 'reading' && <span className="drawer-ribbon" />}
                </span>
                <span className="drawer-text">
                  <span className="drawer-title">{b.title}</span>
                  <span className="drawer-meta">
                    {b.authors[0]}
                    {b.year ? `, ${b.year}` : ''}
                    {b.status === 'reading' ? ', reading now' : ''}
                  </span>
                </span>
                {b.rating ? (
                  <span className="drawer-rating" aria-label={`Rated ${b.rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i key={n} data-on={n <= (b.rating ?? 0) || undefined} />
                    ))}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

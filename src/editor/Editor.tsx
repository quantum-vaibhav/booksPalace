import { animate } from 'motion'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { INKS, SPINE_INKS, inkFromTitle, inkOn, type InkId } from '../lib/inks'
import { completeResult, searchBooks, setGoogleBooksKey, type LookupResult } from '../lib/lookup'
import { motifTile } from '../lib/motifs'
import { GENRES, GENRE_BY_ID, UP_NEXT, type GenreId } from '../scene/genres'
import { SpineArt, spineMetrics } from '../shelf/Spine'
import type { Book, Status } from '../types'

setGoogleBooksKey(import.meta.env.VITE_GOOGLE_BOOKS_KEY)

interface Props {
  book?: Book
  /** start a new book with this status, e.g. Up next */
  initialStatus?: Status
  existingIds: string[]
  onSave(book: Book): void
  onCancel(): void
  onRemove(book: Book): void
}

interface Draft {
  title: string
  authors: string
  genre: GenreId
  status: Status
  year: string
  pages: string
  isbn: string
  publisher: string
  cover: string
  previewLink: string
  description: string
  spineInk: InkId
  rating: number
  finished: string
  notes: string
  favoriteLine: string
}

function toDraft(b?: Book): Draft {
  return {
    title: b?.title ?? '',
    authors: b?.authors.join(', ') ?? '',
    genre: b?.genre ?? 'fiction',
    status: b?.status ?? 'read',
    year: b?.year ? String(b.year) : '',
    pages: b?.pages ? String(b.pages) : '',
    isbn: b?.isbn ?? '',
    publisher: b?.publisher ?? '',
    cover: b?.cover ?? '',
    previewLink: b?.previewLink ?? '',
    description: b?.description ?? '',
    spineInk: b?.spineInk ?? 'federalBlue',
    rating: b?.rating ?? 0,
    finished: b?.finished ?? '',
    notes: b?.notes ?? '',
    favoriteLine: b?.favoriteLine ?? '',
  }
}

function slug(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

const num = (s: string) => (s.trim() ? parseInt(s, 10) || undefined : undefined)

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const INK_NAMES: Record<InkId, string> = {
  black: 'Black', burgundy: 'Burgundy', blue: 'Blue', green: 'Green', mediumBlue: 'Medium blue', brightRed: 'Bright red',
  federalBlue: 'Federal blue', purple: 'Purple', teal: 'Teal', flatGold: 'Flat gold', hunterGreen: 'Hunter green', red: 'Red',
  brown: 'Brown', yellow: 'Yellow', marineRed: 'Marine red', orange: 'Orange', fluoPink: 'Fluorescent pink', lightGray: 'Light grey',
  aqua: 'Aqua', mint: 'Mint', sunflower: 'Sunflower', cornflower: 'Cornflower', lake: 'Lake', indigo: 'Indigo', violet: 'Violet',
  slate: 'Slate', kellyGreen: 'Kelly green', paper: 'Paper',
}

const STATUSES: { value: Status; label: string; hint: string }[] = [
  { value: 'read', label: 'Read', hint: 'Stands on the shelf' },
  { value: 'reading', label: 'Reading', hint: 'Gets a ribbon' },
  { value: 'next', label: 'Up next', hint: 'Lies on the stack' },
]

const EASE = [0.16, 1, 0.3, 1] as const

export function Editor({ book, initialStatus, existingIds, onSave, onCancel, onRemove }: Props) {
  const [draft, setDraft] = useState<Draft>(() => ({ ...toDraft(book), ...(initialStatus && !book ? { status: initialStatus } : {}) }))
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LookupResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [filling, setFilling] = useState<number | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [titleError, setTitleError] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const firstField = useRef<HTMLInputElement>(null)
  const leaving = useRef(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  // the sheet takes on the colours of the genre the book is going into
  const theme = draft.status === 'next' ? UP_NEXT : GENRE_BY_ID[draft.genre]
  const field = INKS[theme.scene.field]
  const fieldText = inkOn(field)

  const preview: Book = {
    id: slug(draft.title) || 'new-book',
    title: draft.title || 'Untitled',
    authors: draft.authors.split(',').map((a) => a.trim()).filter(Boolean),
    genre: draft.genre,
    status: draft.status,
    pages: num(draft.pages),
    spineInk: draft.spineInk,
  }
  const metrics = spineMetrics(preview)

  useLayoutEffect(() => {
    if (panel.current) animate(panel.current, { x: ['100%', '0%'] }, { duration: 0.45, ease: EASE })
    firstField.current?.focus({ preventScroll: true })
  }, [])

  const leave = async (then: () => void) => {
    if (leaving.current) return
    leaving.current = true
    if (panel.current) await animate(panel.current, { x: '100%' }, { duration: 0.26, ease: [0.4, 0, 1, 1] })
    then()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave(onCancel)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCancel])

  const search = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      setResults(await searchBooks(query.trim(), 10))
    } catch {
      setSearchError("Couldn't reach the book catalogue. Check your connection and search again, or fill in the details yourself.")
      setResults(null)
    } finally {
      setSearching(false)
    }
  }

  const choose = async (r: LookupResult, index: number) => {
    setFilling(index)
    const full = await completeResult(r).catch(() => r)
    let ink: InkId = inkFromTitle(full.title)
    try {
      const res = await fetch(`/api/spine-ink?${new URLSearchParams({ cover: full.cover ?? '', title: full.title })}`)
      if (res.ok) ink = (await res.json()).ink
    } catch {
      /* keep the fallback ink */
    }
    setDraft((d) => ({
      ...d,
      title: full.title,
      authors: full.authors.join(', '),
      year: full.year ? String(full.year) : '',
      pages: full.pages ? String(full.pages) : '',
      isbn: full.isbn ?? '',
      publisher: full.publisher ?? '',
      cover: full.cover ?? '',
      previewLink: full.previewLink ?? '',
      description: full.description ?? '',
      spineInk: ink,
    }))
    setFilling(null)
    setResults(null)
    setQuery('')
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim()) {
      setTitleError(true)
      panel.current?.querySelector<HTMLInputElement>('#ed-title')?.focus()
      return
    }
    const authors = draft.authors.split(',').map((a) => a.trim()).filter(Boolean)
    let id = book?.id ?? slug(`${draft.title}-${authors[0] ?? ''}`)
    if (!book) {
      let n = 2
      const base = id
      while (existingIds.includes(id)) id = `${base}-${n++}`
    }
    const out: Book = {
      id,
      title: draft.title.trim(),
      authors,
      genre: draft.genre,
      status: draft.status,
      year: num(draft.year),
      pages: num(draft.pages),
      isbn: draft.isbn.trim() || undefined,
      publisher: draft.publisher.trim() || undefined,
      description: draft.description.trim() || undefined,
      cover: draft.cover.trim() || undefined,
      previewLink: draft.previewLink.trim() || undefined,
      spineInk: draft.spineInk,
      rating: draft.status === 'read' && draft.rating ? draft.rating : undefined,
      notes: draft.notes.trim() || undefined,
      favoriteLine: draft.favoriteLine.trim() || undefined,
      finished: draft.status === 'read' ? draft.finished || undefined : undefined,
    }
    leave(() => onSave(JSON.parse(JSON.stringify(out))))
  }

  const heading = book ? 'Edit book' : draft.status === 'next' ? 'Add to Up next' : 'Add a book'
  const shownRating = hoverRating || draft.rating

  return (
    <div className="editor-layer" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div className="editor-backdrop" onClick={() => leave(onCancel)} />
      <div
        ref={panel}
        className="editor"
        data-own-scroll
        style={{ '--ed-field': field, '--ed-text': fieldText, '--ed-motif': motifTile(theme.scene.signature, 0.12) } as CSSProperties}
      >
        {/* ---- the band: the book as it will stand on the shelf, and the search ---- */}
        <header className="ed-band">
          <div className="ed-band-top">
            <h2 id="editor-title">{heading}</h2>
            <button type="button" className="ed-close" onClick={() => leave(onCancel)}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" fill="none" />
              </svg>
              <span className="sr-only">Cancel</span>
            </button>
          </div>

          <div className="ed-preview" aria-hidden="true">
            <div className="ed-preview-shelf">
              <span
                className={`ed-preview-book${draft.status === 'next' ? ' is-flat' : ''}`}
                style={{ '--h': metrics.height, '--w': metrics.width } as CSSProperties}
              >
                <SpineArt book={preview} flat={draft.status === 'next'} />
                {draft.status === 'reading' && <span className="ed-preview-ribbon" />}
              </span>
              {draft.cover && (
                <img key={draft.cover} className="ed-preview-cover" src={draft.cover} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} />
              )}
            </div>
            <div className="ed-preview-text">
              <p className="ed-preview-title">{draft.title || 'Your next book'}</p>
              <p className="ed-preview-meta">
                {preview.authors[0] ?? 'Search for it below, or type it in'}
                {draft.year ? `, ${draft.year}` : ''}
              </p>
            </div>
          </div>

          <form className="ed-search" onSubmit={search} role="search">
            <label htmlFor="ed-search" className="sr-only">
              Find the book
            </label>
            <svg className="ed-search-icon" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={firstField}
              id="ed-search"
              type="search"
              placeholder="Find a book by title, author or ISBN"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={searching || !query.trim()}>
              {searching ? 'Searching' : 'Search'}
            </button>
          </form>
          {searchError && (
            <p className="ed-band-note" role="alert">
              {searchError}
            </p>
          )}
          {results && results.length === 0 && <p className="ed-band-note">No matches. Try fewer words, or just the title.</p>}
          {results && results.length > 0 && (
            <ul className="ed-results" aria-label="Search results">
              {results.map((r, k) => (
                <li key={`${r.olKey ?? r.title}-${k}`}>
                  <button type="button" onClick={() => choose(r, k)} disabled={filling !== null} aria-busy={filling === k}>
                    <span className="ed-result-cover">
                      <span>{r.title}</span>
                      {r.cover && (
                        <img src={r.cover.replace('-L.jpg', '-M.jpg')} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} />
                      )}
                      {filling === k && <span className="ed-result-busy">Filling in</span>}
                    </span>
                    <span className="ed-result-title">{r.title}</span>
                    <span className="ed-result-meta">
                      {r.authors[0] ?? 'Unknown author'}
                      {r.year ? `, ${r.year}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </header>

        {/* ---- the record ---- */}
        <form id="ed-form" className="ed-form" onSubmit={save} noValidate>
          <section className="ed-section" aria-labelledby="ed-s-book">
            <h3 id="ed-s-book">The book</h3>
            <div className="field">
              <label htmlFor="ed-title">Title</label>
              <input
                id="ed-title"
                className="ed-title-input"
                value={draft.title}
                aria-invalid={titleError || undefined}
                aria-describedby={titleError ? 'ed-title-error' : undefined}
                onChange={(e) => {
                  set('title', e.target.value)
                  setTitleError(false)
                }}
              />
              {titleError && (
                <p id="ed-title-error" className="field-error">
                  A book needs a title before it can go on the shelf.
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="ed-authors">Author</label>
              <input id="ed-authors" value={draft.authors} onChange={(e) => set('authors', e.target.value)} />
              <p className="field-hint">For several authors, separate them with commas.</p>
            </div>
            <fieldset className="field">
              <legend>Genre</legend>
              <div className="ed-genres">
                {GENRES.map((g) => {
                  const ink = INKS[g.scene.field]
                  return (
                    <label key={g.id} style={{ '--g-ink': ink, '--g-text': inkOn(ink) } as CSSProperties}>
                      <input type="radio" name="genre" checked={draft.genre === g.id} onChange={() => set('genre', g.id)} />
                      <span>{g.name}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </section>

          <section className="ed-section" aria-labelledby="ed-s-reading">
            <h3 id="ed-s-reading">Your reading</h3>
            <fieldset className="field">
              <legend className="sr-only">Status</legend>
              <div className="ed-status">
                {STATUSES.map((s) => (
                  <label key={s.value}>
                    <input type="radio" name="status" checked={draft.status === s.value} onChange={() => set('status', s.value)} />
                    <span className="ed-status-card">
                      <StatusIcon status={s.value} />
                      <strong>{s.label}</strong>
                      <small>{s.hint}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.status === 'read' && (
              <div className="ed-read-row">
                <fieldset className="field">
                  <legend>Your rating</legend>
                  <div className="ed-rating" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} onMouseEnter={() => setHoverRating(n)}>
                        <input type="radio" name="rating" checked={draft.rating === n} onChange={() => set('rating', n)} />
                        <span data-on={n <= shownRating || undefined} />
                        <span className="sr-only">{n} out of 5</span>
                      </label>
                    ))}
                    {draft.rating > 0 && (
                      <button type="button" className="text-button" onClick={() => set('rating', 0)}>
                        Clear
                      </button>
                    )}
                  </div>
                </fieldset>
                <fieldset className="field">
                  <legend>Finished</legend>
                  <div className="finished-row">
                    <label className="sr-only" htmlFor="ed-month">
                      Month
                    </label>
                    <select
                      id="ed-month"
                      value={draft.finished.slice(5, 7)}
                      onChange={(e) => {
                        const year = draft.finished.slice(0, 4) || String(new Date().getFullYear())
                        set('finished', e.target.value ? `${year}-${e.target.value}` : '')
                      }}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m, k) => (
                        <option key={m} value={String(k + 1).padStart(2, '0')}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="ed-year-finished">
                      Year
                    </label>
                    <input
                      id="ed-year-finished"
                      inputMode="numeric"
                      placeholder="Year"
                      maxLength={4}
                      value={draft.finished.slice(0, 4)}
                      onChange={(e) => {
                        const year = e.target.value.replace(/\D/g, '').slice(0, 4)
                        const month = draft.finished.slice(5, 7) || '01'
                        set('finished', year ? `${year}-${month}` : '')
                      }}
                    />
                  </div>
                </fieldset>
              </div>
            )}
          </section>

          <section className="ed-section" aria-labelledby="ed-s-words">
            <h3 id="ed-s-words">Your words</h3>
            <div className="field">
              <label htmlFor="ed-notes">Notes</label>
              <textarea
                id="ed-notes"
                rows={4}
                placeholder="What stayed with you?"
                value={draft.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
            <div className="field ed-quote">
              <label htmlFor="ed-line">Favourite line</label>
              <textarea
                id="ed-line"
                rows={2}
                placeholder="A line worth keeping"
                value={draft.favoriteLine}
                onChange={(e) => set('favoriteLine', e.target.value)}
              />
            </div>
          </section>

          <section className="ed-section" aria-labelledby="ed-s-spine">
            <h3 id="ed-s-spine">Spine colour</h3>
            <fieldset className="field">
              <legend className="sr-only">Spine colour</legend>
              <div className="ed-spines">
                {SPINE_INKS.map((id) => (
                  <label key={id} title={INK_NAMES[id]}>
                    <input type="radio" name="ink" checked={draft.spineInk === id} onChange={() => set('spineInk', id)} />
                    <span style={{ background: INKS[id] }} />
                    <span className="sr-only">{INK_NAMES[id]}</span>
                  </label>
                ))}
              </div>
              <p className="field-hint">Picked from the cover when you choose a search result.</p>
            </fieldset>

            <details className="editor-more">
              <summary>Publishing details</summary>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="ed-year">First published</label>
                  <input id="ed-year" inputMode="numeric" value={draft.year} onChange={(e) => set('year', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ed-pages">Pages</label>
                  <input id="ed-pages" inputMode="numeric" value={draft.pages} onChange={(e) => set('pages', e.target.value)} />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="ed-isbn">ISBN</label>
                  <input id="ed-isbn" value={draft.isbn} onChange={(e) => set('isbn', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ed-publisher">Publisher</label>
                  <input id="ed-publisher" value={draft.publisher} onChange={(e) => set('publisher', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ed-cover">Cover image link</label>
                <input id="ed-cover" type="url" value={draft.cover} onChange={(e) => set('cover', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ed-preview">Preview link</label>
                <input id="ed-preview" type="url" value={draft.previewLink} onChange={(e) => set('previewLink', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ed-desc">Description</label>
                <textarea id="ed-desc" rows={6} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </details>
          </section>
        </form>

        {/* ---- always within reach ---- */}
        <footer className="ed-footer">
          {book &&
            (confirmRemove ? (
              <span className="remove-confirm">
                <button type="button" className="danger-button" onClick={() => leave(() => onRemove(book))}>
                  Remove from shelf
                </button>
                <button type="button" className="text-button" onClick={() => setConfirmRemove(false)}>
                  Keep it
                </button>
              </span>
            ) : (
              <button type="button" className="text-button" onClick={() => setConfirmRemove(true)}>
                Remove book
              </button>
            ))}
          <button type="submit" form="ed-form" className="ed-save">
            {book ? 'Save changes' : draft.status === 'next' ? 'Add to Up next' : 'Add to shelf'}
          </button>
        </footer>
      </div>
    </div>
  )
}

/** Little pictures of where the book will go: upright, ribboned, or lying on the stack. */
function StatusIcon({ status }: { status: Status }) {
  return (
    <svg className="ed-status-icon" viewBox="0 0 48 36" aria-hidden="true">
      <path d="M2 34h44" stroke="currentColor" strokeWidth="2" />
      {status === 'read' && (
        <>
          <rect x="12" y="6" width="8" height="27" fill="currentColor" />
          <rect x="22" y="10" width="6" height="23" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="30" y="4" width="7" height="29" fill="currentColor" opacity="0.55" />
        </>
      )}
      {status === 'reading' && (
        <>
          <rect x="17" y="6" width="12" height="27" fill="currentColor" />
          <path d="M21 2h5v17l-2.5-2.5L21 19z" fill="#ff48b0" />
        </>
      )}
      {status === 'next' && (
        <>
          <rect x="8" y="26" width="30" height="7" fill="currentColor" />
          <rect x="12" y="18" width="26" height="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="10" y="10" width="28" height="7" fill="currentColor" opacity="0.55" />
        </>
      )}
    </svg>
  )
}

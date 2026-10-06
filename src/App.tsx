import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookSpread } from './book/BookSpread'
import initialBooks from './data/books.json'
import { Editor } from './editor/Editor'
import { useReducedMotion } from './lib/useReducedMotion'
import { GENRES, UP_NEXT, type Genre } from './scene/genres'
import { Scene, type SceneHandle } from './scene/Scene'
import { GenreDrawer } from './shelf/GenreDrawer'
import { Shelf, type Run, type ShelfHandle } from './shelf/Shelf'
import type { Book, Status } from './types'

const DEV = import.meta.env.DEV

/** How many books each genre shows on the shelf; the rest wait behind "more". */
const SHELF_LIMIT = 12
const UP_NEXT_LIMIT = 5

type EditorState = { mode: 'add'; status?: Status } | { mode: 'edit'; book: Book } | null

/** Which books earn a place on the shelf: reading now, then favourites, then the most recent. */
function shelfOrder(a: Book, b: Book): number {
  const reading = Number(b.status === 'reading') - Number(a.status === 'reading')
  if (reading) return reading
  const rating = (b.rating ?? 0) - (a.rating ?? 0)
  if (rating) return rating
  return (b.finished ?? '').localeCompare(a.finished ?? '')
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(initialBooks as Book[])
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<{ book: Book; origin: HTMLElement; genre: Genre } | null>(null)
  const [drawer, setDrawer] = useState<Run | null>(null)
  const [editor, setEditor] = useState<EditorState>(null)
  const [saveError, setSaveError] = useState(false)
  const reducedMotion = useReducedMotion()
  const scene = useRef<SceneHandle>(null)
  const shelf = useRef<ShelfHandle>(null)

  // While the site runs locally the editor writes the book list; read the live copy.
  useEffect(() => {
    if (!DEV) return
    fetch('/api/books')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: Book[]) => setBooks(list))
      .catch(() => {})
  }, [])

  const runs = useMemo<Run[]>(() => {
    const out: Run[] = GENRES.map((genre) => {
      const all = books.filter((b) => b.genre === genre.id && b.status !== 'next')
      const shown = [...all].sort(shelfOrder).slice(0, SHELF_LIMIT)
      // keep the owner's own order among the books that made the cut
      return { genre, all, books: all.filter((b) => shown.includes(b)), more: all.length - shown.length }
    }).filter((r) => r.all.length > 0)
    const next = books.filter((b) => b.status === 'next')
    if (next.length || DEV) {
      out.push({ genre: UP_NEXT, all: next, books: next.slice(0, UP_NEXT_LIMIT), more: Math.max(0, next.length - UP_NEXT_LIMIT), upNext: true })
    }
    return out
  }, [books])

  // keep an open drawer in step with edits
  const drawerRun = drawer ? runs.find((r) => r.genre.name === drawer.genre.name) ?? null : null

  const sceneGenres = useMemo(() => runs.map((r) => r.genre), [runs])

  const onProgress = useCallback((p: number, drift: number) => {
    scene.current?.update(p, drift)
    setActive((prev) => (Math.round(p) === prev ? prev : Math.round(p)))
  }, [])

  const onHorizon = useCallback((y: number) => scene.current?.setHorizon(y), [])

  const persist = async (next: Book[]) => {
    setBooks(next)
    setSaveError(false)
    try {
      const res = await fetch('/api/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error()
    } catch {
      setSaveError(true)
    }
  }

  const setStatus = (book: Book, status: Status) => {
    const updated: Book = { ...book, status }
    if (status !== 'read') {
      delete updated.rating
      delete updated.finished
    } else if (!updated.finished) {
      updated.finished = new Date().toISOString().slice(0, 7)
    }
    persist(books.map((b) => (b.id === book.id ? updated : b)))
    setOpen((o) => (o ? { ...o, book: updated } : o))
  }

  const readCount = books.filter((b) => b.status === 'read').length
  const reading = books.filter((b) => b.status === 'reading')

  const closeBook = () => {
    const id = open?.book.id
    setOpen(null)
    if (id && !drawer) requestAnimationFrame(() => shelf.current?.focusBook(id))
  }

  const openBook = (book: Book, origin: HTMLElement) => {
    const run = runs.find((r) => r.all.includes(book))
    setOpen({ book, origin, genre: run?.genre ?? runs[0].genre })
  }

  return (
    <>
      <Scene ref={scene} genres={sceneGenres} reducedMotion={reducedMotion} paused={!!open || !!editor || !!drawer} />

      <header className="masthead">
        <h1 className="wordmark">Book Palace</h1>
        <nav className="genre-index" aria-label="Genres">
          <ol>
            {runs.map((r, k) => (
              <li key={r.genre.name}>
                <button
                  type="button"
                  aria-current={k === active ? 'true' : undefined}
                  onClick={() => shelf.current?.scrollToRun(k)}
                >
                  {r.genre.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="tally">
          <p>
            {readCount} books read
            {reading.length > 0 && (
              <>
                <br />
                <span className="tally-reading">
                  {reading.length === 1 ? `Reading ${reading[0].title}` : `Reading ${reading.length} now, marked with a ribbon`}
                </span>
              </>
            )}
          </p>
          {DEV && (
            <button type="button" className="ink-button" onClick={() => setEditor({ mode: 'add' })}>
              Add a book
            </button>
          )}
        </div>
      </header>

      {saveError && (
        <p className="save-error" role="alert">
          Your last change wasn't saved. Keep this page open, make sure the site is still running on your computer, and try again.
          <button type="button" className="text-button" onClick={() => setSaveError(false)}>
            Dismiss
          </button>
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {runs[active]?.genre.name}
      </p>

      <main>
        {runs.length === 0 ? (
          <div className="empty-shelf">
            <p>The shelf is empty.</p>
            <p>Books will appear here once they're added.</p>
          </div>
        ) : (
          <Shelf
            ref={shelf}
            runs={runs}
            reducedMotion={reducedMotion}
            paused={!!open || !!editor || !!drawer}
            openId={open?.book.id ?? null}
            onProgress={onProgress}
            onHorizon={onHorizon}
            onOpen={openBook}
            onShowAll={(run) => setDrawer(run)}
            onAddNext={DEV ? () => setEditor({ mode: 'add', status: 'next' }) : undefined}
          />
        )}
      </main>

      {drawerRun && (
        <GenreDrawer
          run={drawerRun}
          openId={open?.book.id ?? null}
          covered={!!open}
          onOpen={openBook}
          onClose={() => setDrawer(null)}
        />
      )}

      {open && (
        <BookSpread
          key={open.book.id}
          book={open.book}
          library={books}
          origin={open.origin}
          genre={open.genre}
          reducedMotion={reducedMotion}
          onClose={closeBook}
          onStatus={DEV ? (status) => setStatus(open.book, status) : undefined}
          onEdit={
            DEV
              ? () => {
                  const book = open.book
                  setOpen(null)
                  setEditor({ mode: 'edit', book })
                }
              : undefined
          }
        />
      )}

      {DEV && editor && (
        <Editor
          book={editor.mode === 'edit' ? editor.book : undefined}
          initialStatus={editor.mode === 'add' ? editor.status : undefined}
          existingIds={books.map((b) => b.id)}
          onCancel={() => setEditor(null)}
          onSave={(book) => {
            const exists = books.some((b) => b.id === book.id)
            persist(exists ? books.map((b) => (b.id === book.id ? book : b)) : [...books, book])
            setEditor(null)
          }}
          onRemove={(book) => {
            persist(books.filter((b) => b.id !== book.id))
            setEditor(null)
          }}
        />
      )}
    </>
  )
}

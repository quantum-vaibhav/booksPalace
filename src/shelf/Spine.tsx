import type { CSSProperties } from 'react'
import { INKS, hashString, inkOn, type InkId } from '../lib/inks'
import type { Book } from '../types'

const ACCENTS: InkId[] = ['yellow', 'fluoPink', 'aqua', 'sunflower', 'mint', 'brightRed', 'paper', 'black']

/** Physical size of a book on the shelf, as fractions of the shelf height. */
export function spineMetrics(book: Book) {
  const h = hashString(book.id)
  const height = 0.74 + (h % 23) / 100
  const pages = book.pages ?? 280
  // a 120-page novella is a sliver, an 800-page brick is fat
  const width = Math.max(0.075, Math.min(0.2, (40 + pages * 0.1) / 600))
  const style = h % 5 // 0,1: plain; 2: bands; 3: label; 4: cap
  const accent = ACCENTS[(h >>> 3) % ACCENTS.length]
  return { height, width, style, accent: accent === book.spineInk ? 'black' : accent }
}

function surname(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[parts.length - 1] ?? name
}

interface Props {
  book: Book
  /** lying flat in the up-next stack */
  flat?: boolean
}

/** The printed face of a spine. Sized by its container. */
export function SpineArt({ book, flat }: Props) {
  const m = spineMetrics(book)
  const ink = INKS[book.spineInk]
  const text = inkOn(ink)
  const accent = INKS[m.accent as InkId]
  const style = {
    '--spine-ink': ink,
    '--spine-text': text,
    '--spine-accent': accent,
  } as CSSProperties
  return (
    <span className={`spine-art spine-art--s${m.style}${flat ? ' spine-art--flat' : ''}`} style={style}>
      {m.style === 4 && <span className="spine-cap" />}
      <span className="spine-title">{book.title}</span>
      <span className="spine-author">{book.authors[0] ? surname(book.authors[0]) : ''}</span>
    </span>
  )
}

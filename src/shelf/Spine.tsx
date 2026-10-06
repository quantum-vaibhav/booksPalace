import type { CSSProperties } from 'react'
import { INKS, hashString, inkOn } from '../lib/inks'
import type { Book } from '../types'

/** Physical size of a book on the shelf, as fractions of the shelf height. */
export function spineMetrics(book: Book) {
  const h = hashString(book.id)
  const height = 0.74 + (h % 23) / 100
  const pages = book.pages ?? 280
  // a 120-page novella is a sliver, an 800-page brick is fat
  const width = Math.max(0.075, Math.min(0.2, (40 + pages * 0.1) / 600))
  // most spines are plain ink; one in five carries a paper title label
  const label = h % 5 === 3
  return { height, width, label }
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
  const style = {
    '--spine-ink': ink,
    '--spine-text': text,
  } as CSSProperties
  return (
    <span className={`spine-art${m.label ? ' spine-art--label' : ''}${flat ? ' spine-art--flat' : ''}`} style={style}>
      <span className="spine-title">{book.title}</span>
      <span className="spine-author">{book.authors[0] ? surname(book.authors[0]) : ''}</span>
    </span>
  )
}

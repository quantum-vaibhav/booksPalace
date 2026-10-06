import type { InkId } from './lib/inks'
import type { GenreId } from './scene/genres'

export type Status = 'read' | 'reading' | 'next'

export interface Book {
  id: string
  title: string
  authors: string[]
  genre: GenreId
  status: Status
  year?: number
  pages?: number
  isbn?: string
  publisher?: string
  description?: string
  cover?: string
  /** Google Books preview URL; only set when Google offers a preview. */
  previewLink?: string
  spineInk: InkId
  rating?: number
  notes?: string
  /** A line the owner chose. Only public-domain text or the owner's own entry. */
  favoriteLine?: string
  /** YYYY-MM */
  finished?: string
  /** Demo entries that ship until the owner imports their real list. */
  sample?: boolean
}

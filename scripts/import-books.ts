// Import a reading list onto the shelf, fetching metadata for each book.
//
//   npm run import-books -- my-books.txt            add new books, keep existing ones
//   npm run import-books -- my-books.txt --replace  start the shelf over from this list
//
// Text format: one book per line, "Title — Author" (a plain " - " or " by " works too).
// A line starting with "#" names the genre for the lines below it ("# Sci-fi", "# History").
// "# Up next" marks the books below as still to read. End a line with "*" for "reading now".
// JSON format: [{ "title", "author", "genre", "status"?, "rating"?, "notes"?, "favoriteLine"?, "finished"?, "sample"? }]
import { readFile, writeFile } from 'node:fs/promises'
import { BOOKS_FILE } from '../server/booksApi'
import { spineInkFromCover } from '../server/spineInk'
import { lookupBook, setGoogleBooksKey } from '../src/lib/lookup'
import { genreFromName, type GenreId } from '../src/scene/genres'
import type { Book, Status } from '../src/types'

interface Entry {
  title: string
  author?: string
  genre: GenreId
  status: Status
  rating?: number
  notes?: string
  favoriteLine?: string
  finished?: string
  sample?: boolean
}

function parseText(text: string): Entry[] {
  const out: Entry[] = []
  let genre: GenreId = 'fiction'
  let status: Status = 'read'
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) {
      const name = line.replace(/^#+/, '').trim()
      if (/^up next|^to read|^next/i.test(name)) {
        status = 'next'
        continue
      }
      const g = genreFromName(name)
      if (!g) console.warn(`Unknown genre "${name}"; filing the books below under Fiction.`)
      genre = g ?? 'fiction'
      status = 'read'
      continue
    }
    const reading = line.endsWith('*')
    const clean = line.replace(/\*$/, '').trim()
    const [title, author] = clean.split(/\s+(?:—|–|-|by)\s+/i)
    out.push({ title: title.trim(), author: author?.trim(), genre, status: reading ? 'reading' : status })
  }
  return out
}

function slug(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

const sameBook = (a: { title: string; authors: string[] }, title: string, author?: string) =>
  a.title.toLowerCase() === title.toLowerCase() && (!author || a.authors.some((x) => x.toLowerCase() === author.toLowerCase()))

async function main() {
  const [file, ...flags] = process.argv.slice(2)
  if (!file) {
    console.error('Usage: npm run import-books -- <list.txt|list.json> [--replace]')
    process.exit(1)
  }
  const replace = flags.includes('--replace')
  setGoogleBooksKey(process.env.GOOGLE_BOOKS_API_KEY)
  const text = await readFile(file, 'utf8')
  const entries: Entry[] = file.endsWith('.json')
    ? (JSON.parse(text) as Entry[]).map((e) => ({ ...e, genre: genreFromName(e.genre) ?? e.genre, status: e.status ?? 'read' }))
    : parseText(text)

  const existing: Book[] = replace ? [] : JSON.parse(await readFile(BOOKS_FILE, 'utf8').catch(() => '[]'))
  const books = [...existing]
  let added = 0

  for (const e of entries) {
    if (books.some((b) => sameBook(b, e.title, e.author))) {
      console.log(`  skip  ${e.title} (already on the shelf)`)
      continue
    }
    const meta = await lookupBook(e.title, e.author).catch(() => null)
    const authors = e.author ? [e.author] : meta?.authors ?? []
    const book: Book = {
      id: slug(`${e.title}-${authors[0] ?? ''}`),
      title: e.title,
      authors,
      genre: e.genre,
      status: e.status,
      year: meta?.year,
      pages: meta?.pages,
      isbn: meta?.isbn,
      publisher: meta?.publisher,
      description: meta?.description,
      cover: meta?.cover,
      previewLink: meta?.previewLink,
      spineInk: await spineInkFromCover(meta?.cover, e.title),
      rating: e.rating,
      notes: e.notes,
      favoriteLine: e.favoriteLine,
      finished: e.finished,
      sample: e.sample,
    }
    // drop empty keys so the JSON stays readable
    books.push(Object.fromEntries(Object.entries(book).filter(([, v]) => v !== undefined && v !== '')) as unknown as Book)
    added++
    console.log(`  ${meta ? 'found' : 'blank'} ${e.title}${meta ? '' : ' (no metadata found; edit it in the editor)'}`)
    await new Promise((r) => setTimeout(r, 250))
  }

  await writeFile(BOOKS_FILE, JSON.stringify(books, null, 2) + '\n')
  console.log(`\nAdded ${added} book${added === 1 ? '' : 's'}; the shelf now holds ${books.length}.`)
}

main()

// Book metadata from public APIs. Runs in the browser (editor) and in Node (import script).
// Open Library is the main source: original publication year, covers, descriptions,
// and a free reading link for public-domain books. Google Books is used on top when
// an API key is configured (its keyless quota is shared and often exhausted); it adds
// publisher descriptions and licensed previews.

export interface LookupResult {
  title: string
  authors: string[]
  year?: number
  pages?: number
  isbn?: string
  publisher?: string
  description?: string
  cover?: string
  previewLink?: string
  /** Open Library work key, e.g. "/works/OL45804W"; used to fetch the description later. */
  olKey?: string
}

let googleKey: string | undefined
export function setGoogleBooksKey(key: string | undefined) {
  googleKey = key || undefined
}

interface GoogleVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
  accessInfo?: { viewability?: string }
}

interface OpenLibraryDoc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  number_of_pages_median?: number
  cover_i?: number
  isbn?: string[]
  ebook_access?: string
}

const OL_FIELDS = 'key,title,author_name,first_publish_year,number_of_pages_median,cover_i,isbn,ebook_access'

async function getJson<T>(url: string, attempts = 3): Promise<T> {
  for (let i = 0; ; i++) {
    const res = await fetch(url)
    if (res.ok) return (await res.json()) as T
    if (i >= attempts - 1 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${new URL(url).host} answered ${res.status}`)
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)))
  }
}

function cleanDescription(text?: string): string | undefined {
  if (!text) return undefined
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    // Open Library descriptions often trail off into source notes and link lists
    .replace(/\n-{3,}[\s\S]*$/, '')
    .replace(/\(\[source\]\[\d+\]\)[\s\S]*$/i, '')
    .replace(/\[([^\]]+)\]\[\d+\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // markdown emphasis
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
    .replace(/\*{2,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() || undefined
}

const olCover = (id?: number) => (id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : undefined)

function fromOpenLibrary(d: OpenLibraryDoc): LookupResult {
  return {
    title: d.title,
    authors: [...new Set(d.author_name ?? [])],
    year: d.first_publish_year,
    pages: d.number_of_pages_median,
    // Open Library lists every edition's ISBN in no particular order; prefer an
    // English-language one. Its publisher list is just as mixed, so leave publisher
    // to Google Books (when configured) or the owner.
    isbn: d.isbn?.find((i) => /^97[89][01]/.test(i)) ?? d.isbn?.find((i) => /^[01]\d{8}[\dX]$/.test(i)),
    cover: olCover(d.cover_i),
    previewLink: d.ebook_access === 'public' ? `https://openlibrary.org${d.key}` : undefined,
    olKey: d.key,
  }
}

function fromGoogle(v: GoogleVolume): LookupResult {
  const info = v.volumeInfo
  const ids = info.industryIdentifiers ?? []
  const isbn = ids.find((i) => i.type === 'ISBN_13')?.identifier ?? ids.find((i) => i.type === 'ISBN_10')?.identifier
  const thumb = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
  const hasPreview = v.accessInfo?.viewability && v.accessInfo.viewability !== 'NO_PAGES'
  return {
    title: info.title,
    authors: info.authors ?? [],
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) || undefined : undefined,
    pages: info.pageCount || undefined,
    isbn,
    publisher: info.publisher,
    description: cleanDescription(info.description),
    cover: thumb?.replace('http://', 'https://').replace('&edge=curl', ''),
    previewLink: hasPreview ? `https://books.google.com/books?id=${v.id}&printsec=frontcover` : undefined,
  }
}

async function searchOpenLibrary(params: Record<string, string>, limit: number): Promise<LookupResult[]> {
  const qs = new URLSearchParams({ ...params, limit: String(limit), fields: OL_FIELDS })
  const data = await getJson<{ docs: OpenLibraryDoc[] }>(`https://openlibrary.org/search.json?${qs}`)
  return data.docs.map(fromOpenLibrary)
}

async function searchGoogle(query: string, max: number): Promise<LookupResult[]> {
  if (!googleKey) return []
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${max}&printType=books&key=${googleKey}`
  const data = await getJson<{ items?: GoogleVolume[] }>(url)
  return (data.items ?? []).map(fromGoogle)
}

async function workDescription(olKey: string): Promise<string | undefined> {
  const work = await getJson<{ description?: string | { value: string } }>(`https://openlibrary.org${olKey}.json`)
  const d = work.description
  return cleanDescription(typeof d === 'string' ? d : d?.value)
}

/** Search results for the editor's search box, best first. */
export async function searchBooks(query: string, limit = 8): Promise<LookupResult[]> {
  const results = await searchOpenLibrary({ q: query }, limit)
  return results.filter((r) => r.title)
}

/** Fill in what a search result lacks: the description, and Google's preview when available. */
export async function completeResult(r: LookupResult): Promise<LookupResult> {
  const out = { ...r }
  if (!out.description && out.olKey) out.description = await workDescription(out.olKey).catch(() => undefined)
  const google = await searchGoogle(`intitle:${r.title}${r.authors[0] ? ` inauthor:${r.authors[0]}` : ''}`, 3)
    .then((g) => g.sort((a, b) => score(b) - score(a))[0])
    .catch(() => undefined)
  if (google) {
    out.description ??= google.description
    out.pages ??= google.pages
    out.publisher ??= google.publisher
    out.cover ??= google.cover
    out.previewLink = google.previewLink ?? out.previewLink
  }
  return out
}

/** The single best match for a known title and author. */
export async function lookupBook(title: string, author?: string): Promise<LookupResult | null> {
  const params: Record<string, string> = { title }
  if (author) params.author = author
  let results = await searchOpenLibrary(params, 3).catch(() => [])
  if (!results.length) results = await searchOpenLibrary({ q: `${title} ${author ?? ''}` }, 3).catch(() => [])
  const best = results.sort((a, b) => score(b) - score(a))[0]
  if (!best) return null
  const done = await completeResult(best)
  return { ...done, title, authors: author ? [author] : done.authors }
}

function score(r: LookupResult): number {
  return (r.description ? 3 : 0) + (r.pages ? 2 : 0) + (r.cover ? 2 : 0) + (r.previewLink ? 1 : 0) + (r.year ? 1 : 0)
}

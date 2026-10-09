# Book Palace

Every book I've read, on one shelf. Scroll sideways and the shelf runs through the genres; behind it, a risograph-style poster for each genre reshapes itself into the next one as you go. Click a spine and the book turns, opens, and shows what it's about and what I thought of it.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. While the dev server runs you can add, edit and remove books from the site itself ("Add a book", or "Edit book" inside an open book). Changes are written to `src/data/books.json`.

```bash
npm run build
```

The build in `dist/` is a static, read-only site: host it anywhere (Netlify, Vercel, GitHub Pages). The editor isn't included in it.

## Hosting

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`) at https://quantum-vaibhav.github.io/booksPalace/. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Load your own books

The shelf ships with sample books. Put your list in a text file, one book per line, with `#` lines naming the genre:

```text
# Fiction
Kafka on the Shore — Haruki Murakami
The Remains of the Day — Kazuo Ishiguro *

# Sci-fi
Dune — Frank Herbert

# Up next
Middlemarch — George Eliot
```

A `*` at the end marks a book you're reading now (it gets a ribbon). Books under `# Up next` lie flat at the end of the shelf. Genres: Fiction, Mystery, Sci-fi, Fantasy, History, Science, Mind & self (common names like "thriller", "biography" or "self-help" map onto these).

```bash
npm run import-books -- my-books.txt --replace
```

This looks up each book's cover, year, pages, ISBN and description on Open Library, picks a spine colour from the cover (needs `ffmpeg` on your PATH), and rewrites `books.json`. Leave off `--replace` to add to the existing shelf instead. Afterwards, add your ratings, notes and favourite lines in the editor.

### Optional: Google Books

Open Library is the main metadata source. If you add a free Google Books API key, lookups also pull publisher descriptions and "Read a sample" preview links:

- for the import script: `GOOGLE_BOOKS_API_KEY=... npm run import-books -- my-books.txt`
- for the editor: create `.env.local` with `VITE_GOOGLE_BOOKS_KEY=...`

## How it's built

Vite, React and TypeScript. The genre scenes are drawn on two canvases (`src/scene/`): a flood-ink field with shapes knocked out to paper, and the shape inks overprinted on top by multiply, with ink-skip specks and slight misregistration. Every scene is made of the same five parts, so any genre can morph into any other; `src/scene/genres.ts` defines them. The 3D open-book animation lives in `src/book/BookSpread.tsx`.

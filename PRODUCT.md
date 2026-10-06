# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site; book data lives as a JSON file in the repo. A local-only editor (runs during development) adds, edits and removes books and writes that file; publishing means redeploying. No accounts, no database. Framework: Vite + React + TypeScript (user-chosen). The editor's write endpoint exists only in the dev server; the deployed build is read-only.

## Users

- **The owner**: a reader who wants one place that shows every book they've read and what they're reading next, and who maintains the list themselves.
- **Visitors**: friends and followers browsing the owner's reading life, often arriving from a shared link or social clip (inferred from the reference image, which is a screen recording from a social video).

## Product Purpose

Book Palace is a personal library: every book the owner has read, standing spine-out on one continuous shelf, grouped by genre. Success is a visitor scrolling the whole shelf for pleasure, and the owner keeping it current without friction.

## Positioning

It is one shelf, not a grid or a catalogue. Scrolling moves sideways along that single shelf through the genres, and the world behind the shelf changes as each genre arrives. A reading app's list view or a Goodreads profile can't offer that.

## Capabilities and Constraints

- One horizontal shelf, books ordered by genre; vertical wheel/trackpad input drives horizontal travel.
- Books lift out slightly on hover/focus.
- Each genre has a background scene **generated in code** (no photos); crossing a genre boundary animates the current scene into the next. Each genre's scene is distinct and alive (its own ambient motion), and responds to hover and click.
- Each genre shows at most 12 books on the shelf (reading now, then highest rated, then most recent); the rest open from a "more" stack or the genre's tag as a full list. Up next shows at most 5.
- Books are added to Up next from an "Add to Up next" slot at the end of the shelf, or by changing an open book's status (both only while editing locally).
- The UI stays clean: no technical text (commands, file names) on screen, flat ink with no texture.
- A bookmark marks the book(s) currently being read; a "reading next" state exists for queued books.
- Clicking a book opens it (animated) into a spread: cover, publisher description and metadata, plus the owner's rating, notes and a favourite line. A "Read a sample" action opens Google Books' licensed preview when one exists.
- No reproduced text from copyrighted books.
- Add, edit and remove books. Metadata (cover, authors, year, pages, ISBN, description, preview availability) is fetched from public book APIs (Open Library, Google Books) and stored in the repo's JSON.

## Evidence on Hand

- No real book list yet. The build starts with ~40 well-known books across genres, clearly sample data, to be replaced by the owner's list.
- Reference image (a basic one-shelf library page with a centred title) shared as structural reference only; the owner explicitly asked not to copy its look.

## Product Principles

1. The shelf is the interface. Every feature happens on, above, or out of the shelf.
2. The owner's own words (notes, ratings, favourite lines) are the most valuable content; metadata supports them.
3. Motion answers scrolling and clicking; it never plays just for show.
4. Editing must be quick enough that keeping the list current isn't a chore.

## Accessibility & Inclusion

Keyboard traversal of the shelf, visible focus, reduced-motion fallback for scene transitions and book opening.

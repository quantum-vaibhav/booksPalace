---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

Scope: the whole site (single page: shelf + book spread + dev-only editor). Visitor mode: Experience.

Audience and job: friends and followers browse the owner's reading life for pleasure; the owner maintains it through a local editor. Proof is the books themselves plus the owner's own notes.

Constraints: static Vite + React + TS build, data in src/data/books.json, editor only in dev. No copyrighted book text. Genre scenes generated in code. Reduced motion and keyboard traversal required.

## Direction contract

THESIS: The shelf top is the horizon. Each genre is a risograph poster scene standing on it, and the same five pieces (orb, far ridge, near ridge, tall form, bands) reshape into the next genre's scene as you scroll, scrubbed to scroll position. It refuses the category default: cream page, serif title, photo-in-a-card genre headers, filter chips.

OWN-WORLD: Riso inks drenched at page scale: each genre owns a flood-ink field (orange, hunter green, medium blue, teal, burgundy, yellow, fluorescent pink, aqua). Shapes knock out the field to paper and overprint each other by multiply, with ink-skip specks and 1–2px misregistration. Spines are flat riso inks matched from covers. Plank is riso black. Type: Anybody (variable width) for display and spines, Brygada 1918 for reading text.

STORY: A visitor sees a poster-world and a shelf in the first second, scrolls, watches the world turn into the next genre, hovers spines that lift, opens one into a two-page spread of the owner's notes, and reaches the "up next" stack where the shelf ends.

FIRST VIEWPORT: Full-bleed orange Fiction field; giant "Fiction" set wide behind a sunset of paper-knocked cloud bands over rooftops; "Book Palace" small top-left, genre index top-centre, book count top-right; the shelf fills the bottom third with spines standing on a black plank whose front edge carries the genre tags.

FORM: User-pinned direction "Riso horizon" (chosen from three presented; no concept-seed roll was run because the user picked the direction directly). Signature interaction: scroll-scrubbed scene morph between genres. Motion grammar: everything answers scroll or click; spine lift on hover, 3D book turn-and-open on click.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

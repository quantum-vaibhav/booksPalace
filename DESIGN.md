---
name: Book Palace
description: Every book the owner has read, spine-out on one continuous shelf beneath a risograph poster world that reprints itself for each genre.
colors:
  riso-black: "#231f20"
  paper: "#f6f4ee"
  slate: "#5e695e"
  federal-blue: "#3d5588"
  bright-red: "#f15060"
  fluorescent-pink: "#ff48b0"
  orange: "#ff6c2f"
  hunter-green: "#407060"
  medium-blue: "#3255a4"
  teal: "#00838a"
  burgundy: "#914e72"
  yellow: "#ffe800"
  aqua: "#5ec8e5"
  blue: "#0078bf"
  green: "#00a95c"
  purple: "#765ba7"
  flat-gold: "#bb8b41"
  red: "#ff665e"
  brown: "#925f52"
  marine-red: "#d2515e"
  light-gray: "#88898a"
  mint: "#82d8d5"
  sunflower: "#ffb511"
  cornflower: "#62a8e5"
  lake: "#235ba8"
  indigo: "#484d7a"
  violet: "#9d7ad2"
  kelly-green: "#67b346"
typography:
  display:
    fontFamily: "'Anybody Variable', 'Arial Narrow', sans-serif"
    fontSize: "min(17.5vw, calc(var(--horizon) * 0.44))"
    fontWeight: 820
    lineHeight: 0.82
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Anybody Variable', 'Arial Narrow', sans-serif"
    fontSize: "clamp(26px, calc(var(--W) * 0.083), 46px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 108"
  title:
    fontFamily: "'Anybody Variable', 'Arial Narrow', sans-serif"
    fontSize: "clamp(19px, 1.7vw, 26px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  spine:
    fontFamily: "'Anybody Variable', 'Arial Narrow', sans-serif"
    fontSize: "min(18px, calc(var(--shelf-h) * var(--w) * 0.4))"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 72"
  body:
    fontFamily: "'Brygada 1918 Variable', Georgia, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-reading:
    fontFamily: "'Brygada 1918 Variable', Georgia, serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  quote:
    fontFamily: "'Brygada 1918 Variable', Georgia, serif"
    fontSize: "clamp(20px, calc(var(--W) * 0.05), 25px)"
    fontWeight: 400
    lineHeight: 1.32
  label:
    fontFamily: "'Anybody Variable', 'Arial Narrow', sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.1
    fontVariation: "'wdth' 105"
rounded:
  print: "3px"
spacing:
  gutter: "clamp(16px, 3vw, 40px)"
  plank: "clamp(48px, 7.5vh, 68px)"
  shelf: "clamp(170px, 38vh, 370px)"
  headroom: "104px"
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
components:
  ink-button:
    backgroundColor: "{colors.riso-black}"
    textColor: "{colors.orange}"
    typography: "{typography.label}"
    rounded: "{rounded.print}"
    padding: "9px 14px 10px"
  text-button:
    textColor: "{colors.riso-black}"
    typography: "{typography.label}"
    padding: "6px 2px"
  danger-button:
    backgroundColor: "{colors.bright-red}"
    textColor: "{colors.riso-black}"
    typography: "{typography.label}"
    rounded: "{rounded.print}"
    padding: "9px 14px 10px"
  close-button:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.riso-black}"
    typography: "{typography.label}"
    rounded: "{rounded.print}"
    padding: "9px 14px 10px"
  preview-link:
    backgroundColor: "{colors.riso-black}"
    textColor: "{colors.orange}"
    typography: "{typography.label}"
    rounded: "{rounded.print}"
    padding: "10px 14px 11px"
  genre-link:
    textColor: "{colors.riso-black}"
    typography: "{typography.label}"
    padding: "4px 8px 6px"
  slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.riso-black}"
    typography: "{typography.body}"
    padding: "8px 11px 9px"
    width: "max-content"
  input-field:
    backgroundColor: "#fffefa"
    textColor: "{colors.riso-black}"
    typography: "{typography.body}"
    rounded: "{rounded.print}"
    padding: "9px 11px"
  segmented-option-checked:
    backgroundColor: "{colors.riso-black}"
    textColor: "{colors.paper}"
    rounded: "{rounded.print}"
    padding: "7px 8px 8px"
  plank:
    backgroundColor: "{colors.riso-black}"
    textColor: "{colors.paper}"
    height: "{spacing.plank}"
  reading-ribbon:
    backgroundColor: "{colors.fluorescent-pink}"
    width: "max(10px, 34%)"
---

# Design System: Book Palace

## Overview

**Creative North Star: "The Riso Horizon"**

The top edge of the shelf is the horizon line of a risograph poster. Above it, each genre owns a full-bleed flood of one drum ink, with a handful of flat shapes (an orb, a ring, a set of cloud bands, a far ridge, a near ground and one tall form) knocked out of the field to bare paper or overprinted on it by multiply. The giant genre word sits in the sky, overprinted in a darker ink. As the visitor scrolls sideways, those same pieces reshape and the inks blend around the hue wheel into the next genre's poster, scrubbed exactly to scroll position. Below the horizon, books stand spine-out on a riso-black plank; everything the hand touches (spines, plank, pages, cover) is printed flat in the same ink list. Each genre also has a living layer of its own (birds, rain, stars, lanterns, a sundial, orbits, ripples, dawn rays) that moves gently, answers the pointer, and plays when the sky is clicked.

The world is loud at page scale and quiet at hand scale. The sky is drenched; the reading surfaces (the open book's endpaper and paper page, the editor panel) are calm, flat sheets with one display face and one reading serif. Density is low in the sky and high on the shelf: forty-odd spines packed with 2px gaps between steel bookends. Depth comes from print logic (knock-outs, overprint, parallax drift between layers, a gentle lean toward the pointer), not from soft UI chrome. Motion answers scroll and click only.

**Key Characteristics:**
- One drum-ink palette of 28 inks; every on-screen colour in the poster, spines and buttons is drawn from it.
- Flood-ink genre fields, shapes knocked to paper or overprinted by multiply, clean flat ink: no speckle, no misregistration (the owner asked for a clean surface).
- Scroll-scrubbed scene morph: shapes interpolate one-to-one, colours interpolate in OKLCH keeping chroma up.
- Anybody (variable width) for everything display and every spine; Brygada 1918 for reading text.
- Corners are 3px or square; the only round forms are the orb, the ring and pill-ended cloud bands in the sky.

## Colors

A risograph drum-ink set used at full strength: one ink floods the sky per genre, two or three more overprint it, and riso black plus paper carry all text.

### Primary
- **Riso Black** (riso-black): the plank, bookends, primary buttons, text on light fields, selection highlight and the editor's rules and input strokes. The darkest thing in the world is an ink, not #000.
- **Paper** (paper): the uncoated stock. Knocked-out shapes reveal it, the open book's right-hand page is printed on it, the slip, close button and editor panel sit on it, and genre tags on the plank are set in it.

### Secondary (genre fields)
Each genre floods the sky with one ink and sets its giant word in a second:
- **Orange** (orange) with Burgundy word: Fiction. Also the page's `theme-color` and the default field.
- **Hunter Green** (hunter-green) with Riso Black word: Mystery.
- **Medium Blue** (medium-blue) with Purple word: Sci-fi.
- **Teal** (teal) with Lake word: Fantasy.
- **Burgundy** (burgundy) with Flat Gold word: History.
- **Yellow** (yellow) with Blue word: Science.
- **Fluorescent Pink** (fluorescent-pink) with Purple word: Mind & self.
- **Aqua** (aqua) with Federal Blue word: Up next, the far end of the shelf.

The remaining inks (sunflower, violet, indigo, lake, kelly-green, mint, cornflower, flat-gold, brown, red, marine-red, blue, green, purple, light-gray) print the orbs, rings, ridges and tall forms, and form the pool spines are printed in.

### Tertiary (signals)
- **Fluorescent Pink** (fluorescent-pink): the reading-now ribbon, threaded behind the spine, a tab above the head and a notched tail hanging over the plank edge.
- **Bright Red** (bright-red): destructive action and invalid-field rings in the editor; the save-error note.
- **Federal Blue** (federal-blue): focus outline inside the editor panel only.
- **Slate** (slate): the 7px lit front edge of the plank.

### Neutral
- **Ink-on text**: text over any ink is paper or riso black, whichever has more contrast with that ink. Masthead text flips between the two as the field blends; it never fades through grey.
- **No texture.** Surfaces are flat ink. An earlier ink-skip grain was removed at the owner's request; do not reintroduce speckle or noise.

### Named Rules
**The Drum List Rule.** Every ink in the poster, on a spine, on a button or on a page is one of the 28 drum inks. New colour means choosing another ink from the list, never mixing a new hex.

**The Contrast Flip Rule.** Text on an ink is paper or riso black, chosen by contrast with that ink. It snaps; it does not cross-fade.

**The Hue-Wheel Blend Rule.** Moving between inks interpolates in OKLCH along the shorter hue arc with chroma carried through, so orange-to-green stays a saturated ink the whole way. Near-neutral inks (black, paper) borrow the other side's hue.

## Typography

**Display Font:** Anybody Variable (with Arial Narrow, sans-serif)
**Body Font:** Brygada 1918 Variable (with Georgia, serif)

**Character:** Anybody's width axis does the work of a whole type family: stretched wide and heavy for the wordmark and the sky word, condensed to 72% for spine titles. Brygada 1918 is a bookish text serif with a proper italic, used for every sentence a person reads.

### Hierarchy
- **Display** (820, `min(17.5vw, horizon x 0.44)`, 0.82): the giant genre word in the sky, overprinted by multiply in the genre's word ink. 19vw on phones.
- **Headline** (800, width 108%, `clamp(26px, W x 0.083, 46px)`, 0.98): the book title on the open front matter; the typeset fallback cover (800, width 110%, W x 0.1); the editor heading (800, width 110%, 26px).
- **Title** (800, width 125%, `clamp(19px, 1.7vw, 26px)`, 1): the "Book Palace" wordmark only.
- **Spine** (720, width 72%, up to 18px, vertical-rl): spine titles; authors' surnames below at 520, width 88%, up to 12px, 88% opacity. Horizontal on flat up-next books.
- **Status** (750, width 110%, 22px): "Reading now" / "Up next" on the owner's page, in the genre's word ink.
- **Body** (400, 16px, 1.5): default. Publisher descriptions 15.5px/1.6 at 62ch; the owner's notes 18px/1.6 at 60ch; byline 19px italic.
- **Quote** (italic, `clamp(20px, W x 0.05, 25px)`, 1.32): the owner's favourite line, under a 92px Anybody 800 opening quote mark in the field ink, multiplied.
- **Label** (600-650, 12-14px): genre index, buttons, fact terms, form labels, plank tags (650, width 112%, `clamp(12px, 1.05vw, 14px)`), with tabular counts at 500 and 60% opacity.

### Named Rules
**The One Axis Rule.** Hierarchy in Anybody comes from the width and weight axes, not from extra families: wide for the masthead and sky, normal for labels, condensed for spines.

**The Serif Reads Rule.** Anything longer than a label (descriptions, notes, favourite lines, hints, the slip) is Brygada 1918. Italic marks secondary voice: bylines, dates, slip meta, the tally's reading line.

## Layout

The page never scrolls vertically. A fixed masthead (three columns: wordmark left, genre index centred, tally and "Add a book" right, padded `clamp(14px, 2.4vh, 26px)` by the gutter) floats over a fixed full-viewport scene canvas. A fixed shelf occupies the bottom: shelf height plus plank height plus 104px headroom for lifted books and slips. The plank's top edge is the horizon; the scene measures it and fits its sky between masthead and horizon in scene units (1000 units = that sky height). The near ground sits roughly 190 units above the horizon so it rises just above the plank behind the books.

The shelf is one horizontal track with 6vw end padding. Each genre is a run at least 24vw wide (62vw on phones) with 24px inner padding, books grouped between L-shaped steel bookends with 2-3px gaps, its tag set on the plank's front face. Runs are short enough that the shelf reads as one continuous row. Vertical wheel input drives horizontal travel with a 0.14 glide; the scene's "reading point" slides from 18% to 82% of the viewport across the full travel so the first and last genres each own a screen.

Book size is physical: height 74-96% of shelf height from a hash of the id, width proportional to page count (7.5-20% of shelf height).

At 760px and below the shelf shrinks (`clamp(150px, 30vh, 250px)`, 50px plank, 92px headroom), the genre index drops to its own swipeable row with a 48px fade at the overflow edge, and the sky word moves down to clear the taller masthead. The open book becomes a single page whenever two portrait pages will not fit in 92% of the viewport width.

## Elevation & Depth

Depth is printed, not floated. The scene builds it from overlapping ink layers: a flood field with shapes knocked out to paper, sky shapes overprinted by multiply, ground layers standing in front and clearing the ink behind them, each layer shifted 0.6-1.4px off register and drifting at its own parallax rate (orb 0.02, bands 0.06, far 0.04, near 0.1, tall 0.12 per pixel of travel). On the shelf, spines carry an inset cloth curve rather than a cast shadow. Real shadows appear only on objects that leave the shelf: the slip, the open book and the editor panel.

### Shadow Vocabulary
- **Cloth spine** (`box-shadow: inset -3px 0 0 rgb(0 0 0 / 0.14), inset 1px 0 0 rgb(255 255 255 / 0.22)`): every spine; a shade on one edge, a sheen on the other.
- **Slip** (`box-shadow: 0 8px 20px -6px rgb(35 31 32 / 0.35)`): the paper slip that rises above a hovered spine.
- **Open book** (`box-shadow: 0 30px 60px -24px rgb(0 0 0 / 0.6)`): cover and page block of the open book.
- **Gutter** (`box-shadow: inset -18px 0 24px -20px rgb(0 0 0 / 0.5)` left page; `inset 18px 0 24px -20px rgb(0 0 0 / 0.35)` right page): the curve of paper into the binding.
- **Editor panel** (`box-shadow: -20px 0 40px -20px rgb(0 0 0 / 0.5)`): the dev-only side sheet.

### Named Rules
**The Print-Depth Rule.** On the poster and the shelf, depth is knock-out, overprint and parallax. Cast shadows belong only to things lifted off the shelf.

## Shapes

Rectangles with square or 3px corners, the corner of a trimmed print. Spines, plank, bookends, pages and covers are square. Buttons, inputs, swatches and the segmented rating/status options take 3px. Round forms live only in the sky: the orb, the ring (sometimes a tilted ellipse), and cloud bands drawn as pills with radius half their height. Ridges are sampled height fields, never squeezed horizontally on narrow screens. The tall form (clock tower, street lamp, spire, crag, obelisk, observatory, cairn, doorway) morphs path-to-path between genres. The reading ribbon ends in a notched swallowtail. Bookends are L-shaped: a 9px upright and a 34 x 5px foot tucked under the books.

## Components

### Buttons
Flat printed blocks; nothing glows.
- **Shape:** 3px corners.
- **Ink button:** riso black ground, text in the current field ink, Anybody 650 width 105% at 14px, `9px 14px 10px`. Presses down 1px on active (160ms ease-out). Disabled at 55% opacity with a progress cursor.
- **Text button:** Anybody 600 14px, underlined 1.5px with 4px offset; "Cancel", "Edit book", "Remove".
- **Danger button:** bright red ground, riso black text; appears only after a remove is confirmed.
- **Close book:** paper ground, riso black text, inline 13px X icon, fixed top-right of the open book; its focus outline turns paper.
- **Preview link:** on the open front matter, an inverted block (endpaper-text ground, endpaper text) with an inline 12px arrow-out icon.

### Navigation
- **Genre index:** a centred row of Anybody 600 14px links at 68% opacity. Hover goes to full opacity; the current genre gets full opacity and a 3px underline at 6px offset, animated in over 200ms. On phones it becomes a single scrolling row under the wordmark; on a phone held sideways (under 520px tall) wordmark, genres and tally share one row. On touch screens every control is at least 44px tall.
- **Keyboard:** arrow keys, Home and End walk the shelf book by book.

### Editor (development only)
- **Band:** the sheet opens with a band printed in the destination genre's field ink (Up next's aqua when the status is Up next), tiled with that genre's motif. It carries the heading in display type, a live preview (the spine as it will stand on a short black shelf, flat when Up next, ribboned when reading, plus the cover) and the search field on paper. Results are a swipeable row of real covers.
- **Sections:** The book, Your reading, Your words, Spine colour, separated by 1.5px black rules, headings in display 19px.
- **Fields:** 1.5px riso black stroke, 4px corners, near-white `#fffefa` ground, Brygada 16px. Focus is a 3px federal blue outline inside the sheet. Errors get a bright red border and ring with a bold message below.
- **Choices are pictures of the world:** genre chips carry their own flood ink and fill with it when chosen; status is three cards with drawn icons (standing, ribboned, stacked) that fill with the genre ink; rating is five 26px circles filled in the genre ink; spine colours are tiny spines on their own black shelf, the chosen one lifted.
- **Footer:** sticky, with Save filled in the genre's field ink.

### Spine (signature)
A book is a button sized by the book itself, printed in one drum ink with its title and surname set vertically. Five deterministic variants by hash: plain (two of five), banded (accent rules near head and foot), paper title label, coloured cap. On hover or focus it lifts 7.5% of shelf height and tilts -1.6deg over 340ms on the ease-out curve, and a paper slip with title, author and year rises 14px above it, tilted 1.6deg. Reduced motion lifts 5% without tilt or transition. Books still to read lie flat in a staggered stack at the end of the shelf and slide 14px sideways on hover.

### Reading Ribbon (signature)
The book being read carries a fluorescent-pink ribbon, a third of the spine wide (min 10px), threaded behind it: a 24px tab shows above the head and a notched tail hangs 20px below, over the plank edge.

### Open Book (signature)
Clicking a spine pulls the book off the shelf, turns it 90 degrees to face the reader (850ms ease-out), then swings the cover open 180 degrees as the block slides to centre (800ms ease-in-out). The backdrop is the genre's own field mixed 24% into near-black: the room after dark.
- **Left page, the endpaper:** the genre's field ink tiled tone-on-tone with the genre's motif (birds, rain, stars, lanterns, sundial, orbits, ripples, rays) in black at 11%. The title is set huge (display 850, 122% width, sized so its longest word fits) and overprinted in the genre's word ink when that stays legible, echoing the giant word in the sky. Below: byline, a ruled colophon (label left, figure right), the preview link and the description.
- **Right page, the reader's record:** paper with gutter shade and stacked page edges. A crooked library date stamp (Finished and the month, Reading now, Up next) and the rating as five circles, both in whichever genre ink reads best on paper; the favourite line large under a hanging quote mark; notes opening with a display drop cap; and at the foot the cover as a one-ink print (drawn on canvas, screened over the stamp ink), tucked in at an angle. A book being read has a pink ribbon falling from the page head beside the gutter.
- **Phones:** a single page printed entirely on the patterned endpaper; stamp, rating and quote mark switch to the endpaper's text colour and the cover print is left out. Held sideways, the page is wide and full-height with Close beside it, and it re-fits when the phone turns.
- **Touch:** an up/down swipe anywhere travels the shelf, as the wheel does, and a flick carries on with the same glide. Spines lift on press instead of hover, since a tap would leave hover stuck.
- Content fades in once open; text past the foot fades into a 48px veil of the page's colour. Escape, the backdrop or "Close book" reverses the sequence back to the spine. If no cover image loads, a typeset cover in the spine ink stands in.

### Plank
Riso black with a 7px slate top edge, carrying each run's genre tag in paper and its count at 60% opacity.

## Do's and Don'ts

### Do:
- **Do** pick every new colour from the drum-ink list in `src/lib/inks.ts` and print text on it in paper or riso black by contrast.
- **Do** keep every printed surface (spine, plank, page, cover, ribbon) flat ink; **don't** add grain, noise or speckle.
- **Do** keep scene pieces to the fixed set (orb, ring, eight bands, far ridge, near ground, tall form) so every genre can morph one-to-one into the next.
- **Do** blend colours in OKLCH along the hue wheel, never in sRGB.
- **Do** set spine type in Anybody condensed (width 72%) and reading text in Brygada 1918.
- **Do** keep corners at 3px or square.
- **Do** tie motion to scroll position or a click, use the `cubic-bezier(0.16, 1, 0.3, 1)` ease-out for lifts and arrivals, and provide the reduced-motion fallback.

### Don't:
- **Don't** introduce photos or raster illustration into the scene; genre worlds are generated shapes and inks.
- **Don't** fade text through grey as the field changes; flip it.
- **Don't** add soft drop shadows to spines or the shelf; the cloth inset and print depth carry them.
- **Don't** break the shelf into a grid or cards; it is one continuous row.
- **Don't** let motion play on its own; nothing animates without scroll, hover, focus or click.

// Small repeating motifs, one per genre, drawn from each genre's living layer
// (birds, rain, stars, lanterns...). Used as tone-on-tone endpaper patterns:
// printed in black at low opacity, so they darken whatever ink they sit on.
import type { SignatureKind } from '../scene/signatures'

const TILES: Record<SignatureKind, { size: number; body: string }> = {
  birds: {
    size: 56,
    body: '<path d="M8 20q5-5 9 0q4-5 9 0M32 44q4-4 7 0q3-4 7 0" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>',
  },
  rain: {
    size: 36,
    body: '<path d="M8 4l-3 9M26 16l-3 9M16 26l-3 9" stroke="#000" stroke-width="2" stroke-linecap="round"/>',
  },
  stars: {
    size: 52,
    body: '<path d="M14 8l1.6 4.4L20 14l-4.4 1.6L14 20l-1.6-4.4L8 14l4.4-1.6z"/><circle cx="38" cy="34" r="2"/><circle cx="24" cy="44" r="1.3"/><circle cx="44" cy="10" r="1.3"/>',
  },
  lanterns: {
    size: 50,
    body: '<rect x="10" y="10" width="9" height="13" rx="3"/><rect x="33" y="31" width="7" height="10" rx="2.5"/>',
  },
  sundial: {
    size: 48,
    body: '<circle cx="24" cy="24" r="12" fill="none" stroke="#000" stroke-width="1.6"/><path d="M24 24l7-6M24 9v4M24 35v4M9 24h4M35 24h4" stroke="#000" stroke-width="1.6" stroke-linecap="round"/>',
  },
  orbits: {
    size: 56,
    body: '<ellipse cx="28" cy="28" rx="18" ry="7" transform="rotate(-24 28 28)" fill="none" stroke="#000" stroke-width="1.6"/><circle cx="28" cy="28" r="4"/><circle cx="44" cy="21" r="2.2"/>',
  },
  ripples: {
    size: 52,
    body: '<circle cx="26" cy="26" r="5" fill="none" stroke="#000" stroke-width="1.6"/><circle cx="26" cy="26" r="11" fill="none" stroke="#000" stroke-width="1.6"/><circle cx="26" cy="26" r="17" fill="none" stroke="#000" stroke-width="1.4"/>',
  },
  rays: {
    size: 52,
    body: '<path d="M10 40a16 16 0 0 1 32 0z"/><path d="M26 18v-8M14 23l-5-6M38 23l5-6" stroke="#000" stroke-width="2" stroke-linecap="round"/>',
  },
}

const cache = new Map<string, string>()

/** A CSS `url(...)` for the genre's motif tile. */
export function motifTile(kind: SignatureKind, opacity = 0.11): string {
  const key = `${kind}:${opacity}`
  const hit = cache.get(key)
  if (hit) return hit
  const { size, body } = TILES[kind]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g opacity="${opacity}">${body}</g></svg>`
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  cache.set(key, url)
  return url
}

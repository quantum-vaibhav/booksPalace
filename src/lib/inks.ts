// Risograph drum inks. Values follow the published swatches closely enough to
// read as riso on screen; every colour in the site comes from this list.
export const INKS = {
  black: '#231f20',
  burgundy: '#914e72',
  blue: '#0078bf',
  green: '#00a95c',
  mediumBlue: '#3255a4',
  brightRed: '#f15060',
  federalBlue: '#3d5588',
  purple: '#765ba7',
  teal: '#00838a',
  flatGold: '#bb8b41',
  hunterGreen: '#407060',
  red: '#ff665e',
  brown: '#925f52',
  yellow: '#ffe800',
  marineRed: '#d2515e',
  orange: '#ff6c2f',
  fluoPink: '#ff48b0',
  lightGray: '#88898a',
  aqua: '#5ec8e5',
  mint: '#82d8d5',
  sunflower: '#ffb511',
  cornflower: '#62a8e5',
  lake: '#235ba8',
  indigo: '#484d7a',
  violet: '#9d7ad2',
  slate: '#5e695e',
  kellyGreen: '#67b346',
  paper: '#f6f4ee',
} as const

export type InkId = keyof typeof INKS

export const PAPER = INKS.paper
export const INK_BLACK = INKS.black

export type RGB = [number, number, number]

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToCss([r, g, b]: RGB, a = 1): string {
  return a === 1
    ? `rgb(${r | 0} ${g | 0} ${b | 0})`
    : `rgb(${r | 0} ${g | 0} ${b | 0} / ${a})`
}

const toLinear = (c: number) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const fromLinear = (c: number) => {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055
  return Math.max(0, Math.min(255, s * 255))
}

function toOklab([r, g, b]: RGB): RGB {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function fromOklab([L, A, B]: RGB): RGB {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

/**
 * Blend two inks around the hue wheel (OKLCH), keeping chroma up, so an
 * orange-to-green change stays a saturated ink the whole way, never mud.
 */
export function mixRgb(a: RGB, b: RGB, t: number): RGB {
  if (t <= 0) return a
  if (t >= 1) return b
  const [L1, A1, B1] = toOklab(a)
  const [L2, A2, B2] = toOklab(b)
  const C1 = Math.hypot(A1, B1)
  const C2 = Math.hypot(A2, B2)
  let h1 = Math.atan2(B1, A1)
  let h2 = Math.atan2(B2, A2)
  // near-neutral inks (black, paper) have no meaningful hue: borrow the other's
  if (C1 < 0.02) h1 = h2
  if (C2 < 0.02) h2 = h1
  let dh = h2 - h1
  if (dh > Math.PI) dh -= 2 * Math.PI
  if (dh < -Math.PI) dh += 2 * Math.PI
  const L = L1 + (L2 - L1) * t
  const C = C1 + (C2 - C1) * t
  const h = h1 + dh * t
  return fromOklab([L, C * Math.cos(h), C * Math.sin(h)])
}

function luminance([r, g, b]: RGB): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Paper or black, whichever reads better on the given ink. */
export function inkOn(hex: string): string {
  const rgb = hexToRgb(hex)
  return contrast(rgb, hexToRgb(PAPER)) >= contrast(rgb, hexToRgb(INK_BLACK)) ? PAPER : INK_BLACK
}

/** Inks a spine can be printed in (excludes paper-adjacent greys that vanish on the plank). */
export const SPINE_INKS: InkId[] = [
  'black', 'burgundy', 'blue', 'green', 'mediumBlue', 'brightRed', 'federalBlue', 'purple',
  'teal', 'flatGold', 'hunterGreen', 'red', 'brown', 'yellow', 'marineRed', 'orange',
  'fluoPink', 'aqua', 'mint', 'sunflower', 'cornflower', 'lake', 'indigo', 'violet',
  'slate', 'kellyGreen', 'paper',
]

export function nearestInk(rgb: RGB, pool: InkId[] = SPINE_INKS): InkId {
  let best: InkId = pool[0]
  let bestD = Infinity
  for (const id of pool) {
    const [r, g, b] = hexToRgb(INKS[id])
    // weighted RGB distance, cheap approximation of perceptual difference
    const rm = (rgb[0] + r) / 2
    const dr = rgb[0] - r
    const dg = rgb[1] - g
    const db = rgb[2] - b
    const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
    if (d < bestD) {
      bestD = d
      best = id
    }
  }
  return best
}

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function inkFromTitle(title: string): InkId {
  return SPINE_INKS[hashString(title) % SPINE_INKS.length]
}

import type { InkId } from '../lib/inks'
import type { SignatureKind } from './signatures'
import {
  cairn, cityBlocks, clockTower, colonnade, cragTower, doorway, obelisk, observatory, peaks,
  pines, rooftops, spire, steps, streetLamp,
} from './shapes'

export type GenreId = 'fiction' | 'mystery' | 'scifi' | 'fantasy' | 'history' | 'science' | 'mind'

/** An ink, or null for "knock out to bare paper, print nothing". */
type Ink = InkId | null

export interface Band {
  x: number
  y: number
  w: number
  h: number
}

export interface SceneSpec {
  /** flood ink behind everything */
  field: InkId
  /** the genre's own living layer: ambient motion plus hover and click responses */
  signature: SignatureKind
  /** giant genre word, overprinted on the field */
  word: InkId
  orb: { x: number; y: number; r: number; ink: Ink; knock: number }
  ring: { x: number; y: number; rx: number; ry: number; rot: number; width: number; ink: InkId; alpha: number }
  bands: { items: Band[]; ink: Ink; knock: number }
  far: { h: (x: number) => number; ink: Ink; knock: number }
  near: { h: (x: number) => number; ink: Ink; knock: number }
  tall: { d: string; ink: Ink; knock: number }
}

export interface Genre {
  id: GenreId
  name: string
  scene: SceneSpec
}

const BAND_COUNT = 8

function bands(list: Band[]): Band[] {
  // every scene has the same number of bands so they can morph one-to-one
  const out = list.slice(0, BAND_COUNT)
  while (out.length < BAND_COUNT) out.push({ ...out[out.length - 1], w: 0, h: 0 })
  return out
}

export const GENRES: Genre[] = [
  {
    id: 'fiction',
    name: 'Fiction',
    scene: {
      field: 'orange',
      signature: 'birds',
      word: 'burgundy',
      orb: { x: 330, y: -585, r: 190, ink: 'yellow', knock: 1 },
      ring: { x: 330, y: -585, rx: 250, ry: 250, rot: 0, width: 4, ink: 'yellow', alpha: 0 },
      bands: {
        ink: null,
        knock: 1,
        items: bands([
          { x: 300, y: -600, w: 460, h: 22 },
          { x: 380, y: -548, w: 560, h: 15 },
          { x: 300, y: -500, w: 330, h: 11 },
          { x: -640, y: -748, w: 300, h: 13 },
          { x: -540, y: -712, w: 420, h: 9 },
          { x: 900, y: -770, w: 230, h: 10 },
          { x: -1100, y: -590, w: 320, h: 12 },
          { x: 1080, y: -660, w: 360, h: 14 },
        ]),
      },
      far: { h: rooftops, ink: 'burgundy', knock: 1 },
      near: { h: (x) => 196 + 22 * Math.abs(Math.sin(x / 74)), ink: 'sunflower', knock: 1 },
      tall: { d: clockTower(-560), ink: 'federalBlue', knock: 1 },
    },
  },
  {
    id: 'mystery',
    name: 'Mystery',
    scene: {
      field: 'hunterGreen',
      signature: 'rain',
      word: 'black',
      orb: { x: 420, y: -730, r: 112, ink: null, knock: 1 },
      ring: { x: -500, y: -648, rx: 78, ry: 78, rot: 0, width: 5, ink: 'sunflower', alpha: 1 },
      bands: {
        ink: null,
        knock: 0.5,
        items: bands([
          { x: -500, y: -430, w: 940, h: 30 },
          { x: 420, y: -468, w: 1150, h: 22 },
          { x: -160, y: -506, w: 720, h: 14 },
          { x: 980, y: -412, w: 820, h: 30 },
          { x: -1150, y: -478, w: 640, h: 18 },
          { x: 420, y: -712, w: 380, h: 8 },
          { x: 380, y: -752, w: 270, h: 6 },
          { x: -900, y: -580, w: 300, h: 8 },
        ]),
      },
      far: { h: cityBlocks, ink: 'indigo', knock: 0 },
      near: { h: (x) => 200 + (Math.floor((x + 3000) / 60) % 3) * 9, ink: 'mint', knock: 1 },
      tall: { d: streetLamp(-500), ink: 'black', knock: 0 },
    },
  },
  {
    id: 'scifi',
    name: 'Sci-fi',
    scene: {
      field: 'mediumBlue',
      signature: 'stars',
      word: 'purple',
      orb: { x: 300, y: -600, r: 236, ink: 'fluoPink', knock: 1 },
      ring: { x: 300, y: -600, rx: 430, ry: 78, rot: -0.28, width: 20, ink: 'yellow', alpha: 1 },
      bands: {
        ink: null,
        knock: 1,
        items: bands([
          { x: -300, y: -820, w: 9, h: 9 },
          { x: -880, y: -700, w: 7, h: 7 },
          { x: 820, y: -860, w: 8, h: 8 },
          { x: -120, y: -640, w: 6, h: 6 },
          { x: 1000, y: -560, w: 7, h: 7 },
          { x: -1150, y: -840, w: 9, h: 9 },
          { x: 640, y: -360, w: 6, h: 6 },
          { x: -520, y: -900, w: 6, h: 6 },
        ]),
      },
      far: { h: (x) => 448 + 62 * Math.sin(x / 260) + 26 * Math.sin(x / 97 + 1), ink: 'violet', knock: 1 },
      near: { h: (x) => 204 + 30 * Math.sin(x / 180 + 2), ink: 'fluoPink', knock: 1 },
      tall: { d: spire(-620), ink: 'black', knock: 1 },
    },
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    scene: {
      field: 'teal',
      signature: 'lanterns',
      word: 'lake',
      orb: { x: -180, y: -600, r: 122, ink: 'sunflower', knock: 1 },
      ring: { x: -180, y: -600, rx: 160, ry: 160, rot: 0, width: 4, ink: 'sunflower', alpha: 0 },
      bands: {
        ink: null,
        knock: 1,
        items: bands([
          { x: -260, y: -640, w: 520, h: 16 },
          { x: -80, y: -598, w: 360, h: 10 },
          { x: 760, y: -720, w: 480, h: 14 },
          { x: 900, y: -682, w: 300, h: 9 },
          { x: -980, y: -760, w: 420, h: 12 },
          { x: 300, y: -820, w: 260, h: 8 },
          { x: -1200, y: -540, w: 300, h: 10 },
          { x: 1200, y: -560, w: 260, h: 10 },
        ]),
      },
      far: { h: peaks, ink: 'lake', knock: 0 },
      near: { h: pines, ink: 'kellyGreen', knock: 1 },
      tall: { d: cragTower(520), ink: 'burgundy', knock: 1 },
    },
  },
  {
    id: 'history',
    name: 'History',
    scene: {
      field: 'burgundy',
      signature: 'sundial',
      word: 'flatGold',
      orb: { x: 440, y: -660, r: 150, ink: 'sunflower', knock: 1 },
      ring: { x: 440, y: -660, rx: 200, ry: 200, rot: 0, width: 4, ink: 'sunflower', alpha: 0 },
      bands: {
        ink: null,
        knock: 1,
        items: bands([
          { x: 420, y: -672, w: 520, h: 12 },
          { x: 520, y: -628, w: 380, h: 8 },
          { x: -800, y: -800, w: 520, h: 10 },
          { x: -700, y: -770, w: 300, h: 6 },
          { x: 1100, y: -820, w: 420, h: 10 },
          { x: -100, y: -860, w: 300, h: 7 },
          { x: -1250, y: -680, w: 280, h: 8 },
          { x: 1250, y: -560, w: 260, h: 8 },
        ]),
      },
      far: { h: colonnade, ink: 'flatGold', knock: 1 },
      near: { h: (x) => steps(x, -520), ink: null, knock: 1 },
      tall: { d: obelisk(-520), ink: 'brown', knock: 1 },
    },
  },
  {
    id: 'science',
    name: 'Science',
    scene: {
      field: 'yellow',
      signature: 'orbits',
      word: 'blue',
      orb: { x: 600, y: -478, r: 70, ink: 'blue', knock: 1 },
      ring: { x: 20, y: -590, rx: 640, ry: 168, rot: -0.12, width: 5, ink: 'blue', alpha: 1 },
      bands: {
        ink: 'blue',
        knock: 0,
        items: bands([
          { x: -580, y: -700, w: 26, h: 26 },
          { x: 240, y: -760, w: 16, h: 16 },
          { x: -900, y: -560, w: 12, h: 12 },
          { x: 900, y: -820, w: 12, h: 12 },
          { x: -260, y: -880, w: 10, h: 10 },
          { x: 1150, y: -640, w: 14, h: 14 },
          { x: -1200, y: -760, w: 10, h: 10 },
          { x: 40, y: -590, w: 44, h: 44 },
        ]),
      },
      far: { h: (x) => 404 + 84 * Math.exp(-(((x - 360) / 520) ** 2)), ink: 'kellyGreen', knock: 0 },
      near: { h: () => 190, ink: 'cornflower', knock: 1 },
      tall: { d: observatory(-500), ink: 'federalBlue', knock: 0 },
    },
  },
  {
    id: 'mind',
    name: 'Mind & self',
    scene: {
      field: 'fluoPink',
      signature: 'ripples',
      word: 'purple',
      orb: { x: 0, y: -520, r: 300, ink: 'orange', knock: 1 },
      ring: { x: 0, y: -520, rx: 362, ry: 362, rot: 0, width: 6, ink: 'orange', alpha: 1 },
      bands: {
        ink: null,
        knock: 1,
        items: bands([
          { x: 0, y: -448, w: 640, h: 16 },
          { x: 0, y: -486, w: 620, h: 12 },
          { x: 0, y: -520, w: 600, h: 9 },
          { x: 0, y: -550, w: 580, h: 6 },
          { x: 0, y: -576, w: 560, h: 4 },
          { x: -900, y: -760, w: 320, h: 10 },
          { x: 960, y: -720, w: 300, h: 10 },
          { x: 0, y: -600, w: 520, h: 3 },
        ]),
      },
      far: { h: (x) => 420 + 54 * Math.sin(x / 400 + 0.6), ink: 'violet', knock: 1 },
      near: { h: () => 190, ink: 'aqua', knock: 1 },
      tall: { d: cairn(-10, -380), ink: 'federalBlue', knock: 1 },
    },
  },
]

/** The far end of the shelf, where the books still to read lie flat. */
export const UP_NEXT: Genre = {
  id: 'mind',
  name: 'Up next',
  scene: {
    field: 'aqua',
    signature: 'rays',
    word: 'federalBlue',
    orb: { x: -40, y: -360, r: 260, ink: 'sunflower', knock: 1 },
    ring: { x: -40, y: -360, rx: 320, ry: 320, rot: 0, width: 5, ink: 'sunflower', alpha: 0 },
    bands: {
      ink: null,
      knock: 1,
      items: bands([
        { x: -40, y: -560, w: 760, h: 8 },
        { x: -40, y: -600, w: 600, h: 6 },
        { x: -40, y: -636, w: 440, h: 4 },
        { x: -900, y: -740, w: 380, h: 10 },
        { x: 900, y: -780, w: 340, h: 10 },
        { x: -1200, y: -620, w: 300, h: 8 },
        { x: 1200, y: -640, w: 280, h: 8 },
        { x: -40, y: -666, w: 300, h: 3 },
      ]),
    },
    far: { h: () => 404, ink: 'lake', knock: 0 },
    near: { h: () => 190, ink: 'sunflower', knock: 1 },
    tall: { d: doorway(560), ink: null, knock: 1 },
  },
}

export const GENRE_BY_ID = Object.fromEntries(GENRES.map((g) => [g.id, g])) as Record<GenreId, Genre>

const ALIASES: Record<string, GenreId> = {
  fiction: 'fiction', literary: 'fiction', 'literary fiction': 'fiction', novel: 'fiction', classics: 'fiction',
  mystery: 'mystery', thriller: 'mystery', crime: 'mystery', 'mystery & thriller': 'mystery', 'mystery and thriller': 'mystery', suspense: 'mystery',
  'sci-fi': 'scifi', scifi: 'scifi', 'science fiction': 'scifi', sf: 'scifi',
  fantasy: 'fantasy',
  history: 'history', biography: 'history', memoir: 'history', 'history & biography': 'history', 'history and biography': 'history',
  science: 'science', 'popular science': 'science', ideas: 'science', 'science & ideas': 'science', nonfiction: 'science', 'non-fiction': 'science',
  mind: 'mind', 'mind & self': 'mind', 'self-help': 'mind', 'self help': 'mind', psychology: 'mind', philosophy: 'mind', self: 'mind',
}

export function genreFromName(name: string): GenreId | null {
  return ALIASES[name.trim().toLowerCase()] ?? null
}

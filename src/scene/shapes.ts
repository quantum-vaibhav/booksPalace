// Geometry helpers for the genre scenes. Scene units: 1000 = sky height,
// x = 0 is the centre of the screen, y = 0 is the horizon (the shelf top),
// negative y is up.

export type Pt = [number, number]

export function toPath(points: Pt[]): string {
  return 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z'
}

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 18): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return out
}

export function clockTower(ax: number): string {
  return toPath([
    [ax - 62, 0], [ax - 62, -690], [ax - 80, -690], [ax - 3, -845], [ax - 3, -900],
    [ax + 3, -900], [ax + 3, -845], [ax + 80, -690], [ax + 62, -690], [ax + 62, 0],
  ])
}

export function streetLamp(ax: number): string {
  return toPath([
    [ax - 9, 0], [ax - 9, -588], [ax - 36, -600], [ax - 27, -692], [ax - 5, -708],
    [ax - 5, -730], [ax + 5, -730], [ax + 5, -708], [ax + 27, -692], [ax + 36, -600],
    [ax + 9, -588], [ax + 9, 0],
  ])
}

export function spire(ax: number): string {
  return toPath([
    [ax - 46, 0], [ax - 14, -520], [ax - 34, -540], [ax - 34, -556], [ax - 6, -560],
    [ax - 3, -860], [ax + 3, -860], [ax + 6, -560], [ax + 34, -556], [ax + 34, -540],
    [ax + 14, -520], [ax + 46, 0],
  ])
}

export function cragTower(ax: number): string {
  return toPath([
    // crag, keep, battlements, and a pennant
    [ax - 270, 0], [ax - 175, -400], [ax - 120, -478], [ax - 56, -478], [ax - 56, -690],
    [ax - 72, -690], [ax - 72, -742], [ax - 44, -742], [ax - 44, -720], [ax - 14, -720],
    [ax - 14, -742], [ax - 4, -742], [ax - 4, -846], [ax + 64, -820], [ax + 4, -796],
    [ax + 4, -742], [ax + 14, -742], [ax + 14, -720], [ax + 44, -720], [ax + 44, -742],
    [ax + 72, -742], [ax + 72, -690], [ax + 56, -690], [ax + 56, -478],
    [ax + 112, -478], [ax + 168, -418], [ax + 250, 0],
  ])
}

export function obelisk(ax: number): string {
  return toPath([
    [ax - 58, 0], [ax - 58, -392], [ax - 40, -392], [ax - 30, -770], [ax, -836],
    [ax + 30, -770], [ax + 40, -392], [ax + 58, -392], [ax + 58, 0],
  ])
}

export function observatory(ax: number): string {
  const r = 128
  const top = -470
  // dome from left to right over the top, with a telescope poking out at ~-60deg
  const dome = arc(ax, top, r, r, Math.PI, Math.PI * 1.62)
  const tip = arc(ax, top, r, r, Math.PI * 1.7, Math.PI * 2)
  const a1 = Math.PI * 1.62
  const a2 = Math.PI * 1.7
  const p1: Pt = [ax + Math.cos(a1) * r, top + Math.sin(a1) * r]
  const p2: Pt = [ax + Math.cos(a2) * r, top + Math.sin(a2) * r]
  const reach = 150
  const dir: Pt = [Math.cos(-1.05), Math.sin(-1.05)]
  return toPath([
    [ax - r, 0],
    ...dome,
    [p1[0] + dir[0] * reach, p1[1] + dir[1] * reach],
    [p2[0] + dir[0] * reach, p2[1] + dir[1] * reach],
    p2,
    ...tip,
    [ax + r, 0],
  ])
}

export function cairn(ax: number, base: number): string {
  const stones = [
    { rx: 128, ry: 42 }, { rx: 100, ry: 36 }, { rx: 76, ry: 30 }, { rx: 54, ry: 24 }, { rx: 34, ry: 18 },
  ]
  let y = base
  const centres = stones.map((s, i) => {
    y -= s.ry
    const c = { ...s, cy: y, cx: ax + (i % 2 === 0 ? 0 : i === 1 ? 10 : -8) }
    y -= s.ry - 6
    return c
  })
  const right: Pt[] = []
  const left: Pt[] = []
  for (const s of centres) {
    right.push(...arc(s.cx, s.cy, s.rx, s.ry, Math.PI / 2, -Math.PI / 2, 10))
    left.unshift(...arc(s.cx, s.cy, s.rx, s.ry, Math.PI * 1.5, Math.PI / 2, 10))
  }
  // the stack stands on a rock that runs down to the ground line
  return toPath([[ax + 150, 0], [ax + 110, base + 10], ...right, ...left, [ax - 110, base + 10], [ax - 160, 0]])
}

export function doorway(ax: number): string {
  const w = 92
  const top = -640
  return toPath([
    [ax - w, -360], [ax - w, top], ...arc(ax, top, w, w * 1.05, Math.PI, Math.PI * 2, 20),
    [ax + w, -360],
  ])
}

// --- heightfields -----------------------------------------------------------

export const HF_MIN = -2400
export const HF_MAX = 2400
export const HF_STEP = 6
export const HF_COUNT = (HF_MAX - HF_MIN) / HF_STEP + 1

export function sampleHeights(fn: (x: number) => number): Float32Array {
  const out = new Float32Array(HF_COUNT)
  for (let i = 0; i < HF_COUNT; i++) out[i] = fn(HF_MIN + i * HF_STEP)
  return out
}

/** Deterministic 0..1 value per integer cell. */
export function cellRand(i: number, seed = 1): number {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** A terrace of houses: storeys in whole steps, shallow gables, chimney stacks. */
export function rooftops(x: number): number {
  const w = 230
  const i = Math.floor((x + 3000) / w)
  const f = (x + 3000) / w - i
  // neighbours differ by at most one storey, so the street reads as a terrace
  const storeys = 3 + Math.floor(cellRand(i, 3) * 2)
  const eaves = 340 + storeys * 46
  const kind = cellRand(i, 7)
  // every house carries a chimney stack: square, tall, unmistakable
  const chimney = f > 0.7 && f < 0.82 ? 70 : 0
  if (kind < 0.3) {
    // low gable facing the street
    const pitch = 30
    return Math.max(eaves + pitch * (1 - Math.abs(2 * f - 1)), eaves + chimney)
  }
  if (kind < 0.75) {
    // flat parapet, a second stack at the other end
    const second = f > 0.16 && f < 0.26 ? 56 : 0
    return eaves + Math.max(chimney, second)
  }
  // mansard: one stepped storey in the roof
  return (f > 0.14 && f < 0.86 ? eaves + 38 : eaves) + chimney
}

export function cityBlocks(x: number): number {
  const w = 104
  const i = Math.floor((x + 3000) / w)
  const f = (x + 3000) / w - i
  const h = 470 + cellRand(i, 4) * 190
  if (f < 0.08) return 400
  return cellRand(i, 6) > 0.7 && f > 0.35 && f < 0.65 ? h + 40 : h
}

export function peaks(x: number): number {
  let h = 380
  for (let k = -6; k <= 6; k++) {
    const cx = k * 420 + cellRand(k, 2) * 160
    const ph = 480 + cellRand(k, 5) * 300
    const half = 260 + cellRand(k, 8) * 120
    h = Math.max(h, ph - (Math.abs(x - cx) / half) * (ph - 360))
  }
  return h
}

export function pines(x: number): number {
  const w = 38
  const f = ((x + 3000) / w) % 1
  const i = Math.floor((x + 3000) / w)
  return 196 + (18 + cellRand(i, 11) * 34) * (1 - Math.abs(2 * f - 1))
}

export function colonnade(x: number): number {
  const w = 118
  const i = Math.floor((x + 3000) / w)
  const f = (x + 3000) / w - i
  if (f > 0.36) return 392
  const broken = cellRand(i, 12)
  return broken > 0.75 ? 450 + broken * 60 : 600
}

export function steps(x: number, cx: number): number {
  const d = Math.abs(x - cx)
  return Math.max(176, 300 - Math.floor(d / 70) * 22)
}

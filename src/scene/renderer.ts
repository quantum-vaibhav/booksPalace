import { interpolate } from 'flubber'
import { INKS, contrast, hexToRgb, mixRgb, rgbToCss, type InkId, type RGB } from '../lib/inks'
import type { Band, SceneSpec } from './genres'
import { HF_COUNT, HF_MAX, HF_MIN, HF_STEP, sampleHeights } from './shapes'
import { createSignature, type SceneEnv, type Signature } from './signatures'

interface Layer {
  color: RGB
  /** ink opacity: 0 means the layer only knocks out the field */
  alpha: number
  knock: number
}

interface Compiled {
  field: RGB
  word: RGB
  orb: Layer & { x: number; y: number; r: number }
  ring: { x: number; y: number; rx: number; ry: number; rot: number; width: number; color: RGB; alpha: number }
  bands: Layer & { items: Band[] }
  far: Layer & { h: Float32Array }
  near: Layer & { h: Float32Array }
  tall: Layer & { d: string; anchor: number; top: number }
}

export interface FrameColors {
  field: string
  word: string
  text: string
}

export interface FrameInput {
  /** continuous scene index (2.4 = 40% of the way from scene 2 to 3) */
  p: number
  /** px of travel away from the current genre's centre */
  drift: number
  time: number
  dt: number
  /** pointer offset from the centre of the screen, -1..1, already eased */
  lean: { x: number; y: number }
  pointer: { x: number; y: number; inside: boolean }
  /** whether the living layers move (off for reduced motion) */
  animate: boolean
}

const rgb = (id: InkId) => hexToRgb(INKS[id])
const PAPER_RGB = rgb('paper')
const BLACK_RGB = rgb('black')
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function layer(field: RGB, ink: InkId | null, knock: number): Layer {
  return ink ? { color: rgb(ink), alpha: 1, knock } : { color: field, alpha: 0, knock }
}

function boundsOf(d: string) {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [0, 0]
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  for (let i = 0; i < nums.length - 1; i += 2) {
    minX = Math.min(minX, nums[i])
    maxX = Math.max(maxX, nums[i])
    minY = Math.min(minY, nums[i + 1])
  }
  return { anchor: (minX + maxX) / 2, top: minY }
}

function compile(s: SceneSpec): Compiled {
  const field = rgb(s.field)
  return {
    field,
    word: rgb(s.word),
    orb: { ...layer(field, s.orb.ink, s.orb.knock), x: s.orb.x, y: s.orb.y, r: s.orb.r },
    ring: { ...s.ring, color: rgb(s.ring.ink) },
    bands: { ...layer(field, s.bands.ink, s.bands.knock), items: s.bands.items },
    far: { ...layer(field, s.far.ink, s.far.knock), h: sampleHeights(s.far.h) },
    near: { ...layer(field, s.near.ink, s.near.knock), h: sampleHeights(s.near.h) },
    tall: { ...layer(field, s.tall.ink, s.tall.knock), d: s.tall.d, ...boundsOf(s.tall.d) },
  }
}

function mixLayer(a: Layer, b: Layer, t: number): Layer {
  // When one side prints no ink, hold the other side's colour while it fades.
  const color = a.alpha === 0 ? b.color : b.alpha === 0 ? a.color : mixRgb(a.color, b.color, t)
  return { color, alpha: lerp(a.alpha, b.alpha, t), knock: lerp(a.knock, b.knock, t) }
}

// How far each layer drifts per pixel of shelf travel, and how far (px) it
// leans toward the pointer: nearer layers move more, which reads as depth.
const DRIFT = { orb: 0.02, ring: 0.02, bands: 0.06, far: 0.04, near: 0.1, tall: 0.12 }
const LEAN = { orb: 8, ring: 8, bands: 14, far: 12, near: 20, tall: 24 }

export class SceneRenderer {
  private scenes: Compiled[]
  private signatures: Signature[]
  private tallLerps: ((t: number) => string)[] = []
  private bg: CanvasRenderingContext2D
  private fg: CanvasRenderingContext2D
  private fx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private horizon = 0
  private top = 0
  private dpr = 1
  private env: SceneEnv | null = null
  private current = 0

  constructor(bgCanvas: HTMLCanvasElement, fgCanvas: HTMLCanvasElement, fxCanvas: HTMLCanvasElement, specs: SceneSpec[]) {
    this.bg = bgCanvas.getContext('2d')!
    this.fg = fgCanvas.getContext('2d')!
    this.fx = fxCanvas.getContext('2d')!
    this.scenes = specs.map(compile)
    this.signatures = specs.map((s) => createSignature(s.signature))
    for (let i = 0; i < specs.length - 1; i++) {
      this.tallLerps.push(interpolate(specs[i].tall.d, specs[i + 1].tall.d, { maxSegmentLength: 8 }))
    }
  }

  /** horizon: px from the top to the shelf top. top: px the masthead occupies. */
  resize(width: number, height: number, horizon: number, top = 0) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = width
    this.h = height
    this.horizon = horizon
    this.top = top
    for (const ctx of [this.bg, this.fg, this.fx]) {
      ctx.canvas.width = Math.round(width * this.dpr)
      ctx.canvas.height = Math.round(height * this.dpr)
    }
  }

  /** A click on the scene goes to the genre that owns the screen. */
  click(x: number, y: number) {
    if (this.env) this.signatures[this.current]?.click(x, y, this.env)
  }

  render(frame: FrameInput): FrameColors {
    const { p, drift, lean } = frame
    const n = this.scenes.length
    const i = Math.max(0, Math.min(n - 1, Math.floor(p)))
    const t = i >= n - 1 ? 0 : Math.max(0, Math.min(1, p - i))
    const A = this.scenes[i]
    const B = this.scenes[Math.min(i + 1, n - 1)]
    this.current = t < 0.5 ? i : Math.min(i + 1, n - 1)

    const field = mixRgb(A.field, B.field, t)
    const orb = { ...mixLayer(A.orb, B.orb, t), x: lerp(A.orb.x, B.orb.x, t), y: lerp(A.orb.y, B.orb.y, t), r: lerp(A.orb.r, B.orb.r, t) }
    const ring = {
      x: lerp(A.ring.x, B.ring.x, t), y: lerp(A.ring.y, B.ring.y, t),
      rx: lerp(A.ring.rx, B.ring.rx, t), ry: lerp(A.ring.ry, B.ring.ry, t),
      rot: lerp(A.ring.rot, B.ring.rot, t), width: lerp(A.ring.width, B.ring.width, t),
      color: mixRgb(A.ring.color, B.ring.color, t), alpha: lerp(A.ring.alpha, B.ring.alpha, t),
    }
    const bands = {
      ...mixLayer(A.bands, B.bands, t),
      items: A.bands.items.map((a, k) => {
        const b = B.bands.items[k]
        return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) }
      }),
    }
    const far = { ...mixLayer(A.far, B.far, t), h: A.far.h, h2: B.far.h }
    const near = { ...mixLayer(A.near, B.near, t), h: A.near.h, h2: B.near.h }
    const tallD = t === 0 ? A.tall.d : i === n - 1 ? B.tall.d : this.tallLerps[i](t)
    const tall = {
      ...mixLayer(A.tall, B.tall, t),
      path: new Path2D(tallD),
      anchor: lerp(A.tall.anchor, B.tall.anchor, t),
      top: lerp(A.tall.top, B.tall.top, t),
    }

    const { w, horizon } = this
    // the scene fills the sky between the masthead and the shelf top
    const u = Math.max(120, horizon - this.top) / 1000
    // on narrow screens the composition's objects pull in toward the centre
    const sx = Math.min(1, w / 2 / (u * 1150))
    const X = (x: number) => w / 2 + x * u * sx
    const Y = (y: number) => horizon + y * u
    // ridges are landscape, not objects: never squeeze them, or roofs turn to spikes
    const XH = (x: number) => w / 2 + x * u
    const off = (k: keyof typeof DRIFT) => -drift * DRIFT[k] - lean.x * LEAN[k]
    const offY = (k: keyof typeof DRIFT) => -lean.y * LEAN[k] * 0.35

    const heightPath = (h1: Float32Array, h2: Float32Array, k: 'far' | 'near') => {
      const path = new Path2D()
      const floor = this.h + 4
      const dx = off(k)
      const dy = offY(k)
      path.moveTo(XH(HF_MIN) + dx, floor)
      for (let s = 0; s < HF_COUNT; s++) {
        path.lineTo(XH(HF_MIN + s * HF_STEP) + dx, Y(-lerp(h1[s], h2[s], t)) + dy)
      }
      path.lineTo(XH(HF_MAX) + dx, floor)
      path.closePath()
      return path
    }

    const orbPx = { x: X(orb.x) + off('orb'), y: Y(orb.y) + offY('orb'), r: orb.r * u }
    const ringPx = { x: X(ring.x) + off('ring'), y: Y(ring.y) + offY('ring'), rx: ring.rx * u, ry: ring.ry * u, rot: ring.rot }
    const tallX = w / 2 + tall.anchor * u * sx + off('tall')
    const shapes = {
      far: heightPath(far.h, far.h2, 'far'),
      near: heightPath(near.h, near.h2, 'near'),
      orb: (() => {
        const path = new Path2D()
        path.arc(orbPx.x, orbPx.y, orbPx.r, 0, Math.PI * 2)
        return path
      })(),
      bands: (() => {
        const path = new Path2D()
        for (const b of bands.items) {
          if (b.w < 0.5 || b.h < 0.5) continue
          const bw = b.w * u * sx
          const bh = b.h * u
          path.roundRect(X(b.x) - bw / 2 + off('bands'), Y(b.y) - bh / 2 + offY('bands'), bw, bh, bh / 2)
        }
        return path
      })(),
    }
    const tallTransform = (ctx: CanvasRenderingContext2D) => {
      ctx.translate(tallX - tall.anchor * u, horizon + offY('tall'))
      ctx.scale(u, u)
    }
    const ringPath = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath()
      ctx.ellipse(ringPx.x, ringPx.y, ringPx.rx, ringPx.ry, ringPx.rot, 0, Math.PI * 2)
    }

    // --- field, knocked out wherever a shape knocks ---------------------------
    const bg = this.bg
    bg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    bg.globalCompositeOperation = 'source-over'
    bg.globalAlpha = 1
    bg.clearRect(0, 0, w, this.h)
    bg.fillStyle = rgbToCss(field)
    bg.fillRect(0, 0, w, this.h)
    bg.globalCompositeOperation = 'destination-out'
    for (const [key, path] of Object.entries(shapes) as [keyof typeof shapes, Path2D][]) {
      const knock = key === 'orb' ? orb.knock : key === 'bands' ? bands.knock : key === 'far' ? far.knock : near.knock
      if (knock <= 0.001) continue
      bg.globalAlpha = knock
      bg.fill(path)
    }
    if (tall.knock > 0.001) {
      bg.save()
      tallTransform(bg)
      bg.globalAlpha = tall.knock
      bg.fill(tall.path)
      bg.restore()
    }
    if (ring.alpha > 0.001) {
      // rings print in their own ink, not overprinted on the field
      bg.globalAlpha = ring.alpha
      bg.lineWidth = ring.width * u
      ringPath(bg)
      bg.stroke()
    }

    // --- inks, overprinted ----------------------------------------------------
    const fg = this.fg
    fg.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    fg.globalCompositeOperation = 'source-over'
    fg.globalAlpha = 1
    fg.clearRect(0, 0, w, this.h)
    // Sky pieces overprint each other; the ground layers then stand in front,
    // each one clearing the ink behind it so the land reads cleanly behind the books.
    const print = (draw: (ctx: CanvasRenderingContext2D) => void, l: Layer, occlude: boolean) => {
      if (occlude) {
        fg.save()
        fg.globalCompositeOperation = 'destination-out'
        fg.globalAlpha = Math.max(l.alpha, l.knock)
        draw(fg)
        fg.restore()
      }
      if (l.alpha <= 0.001) return
      fg.save()
      fg.globalCompositeOperation = occlude ? 'source-over' : 'multiply'
      fg.globalAlpha = l.alpha
      fg.fillStyle = rgbToCss(l.color)
      draw(fg)
      fg.restore()
    }
    const fillPath = (path: Path2D) => (ctx: CanvasRenderingContext2D) => ctx.fill(path)

    print(fillPath(shapes.orb), orb, false)
    if (ring.alpha > 0.001) {
      fg.save()
      fg.globalCompositeOperation = 'multiply'
      fg.globalAlpha = ring.alpha
      fg.strokeStyle = rgbToCss(ring.color)
      fg.lineWidth = ring.width * u
      ringPath(fg)
      fg.stroke()
      fg.restore()
    }
    print(fillPath(shapes.bands), bands, false)
    print(fillPath(shapes.far), far, true)
    print(
      (ctx) => {
        ctx.save()
        tallTransform(ctx)
        ctx.fill(tall.path)
        ctx.restore()
      },
      tall,
      true,
    )
    print(fillPath(shapes.near), near, true)

    // --- the genres' living layers ------------------------------------------------
    const fx = this.fx
    fx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    fx.globalCompositeOperation = 'source-over'
    fx.globalAlpha = 1
    fx.clearRect(0, 0, w, this.h)
    const env: SceneEnv = {
      w,
      h: this.h,
      top: this.top,
      horizon,
      time: frame.time,
      dt: frame.animate ? Math.min(frame.dt, 0.05) : 0,
      orb: orbPx,
      ring: ringPx,
      tall: { x: tallX, top: Y(tall.top) },
      pointer: frame.pointer,
    }
    this.env = env
    const weights = new Map<number, number>([[i, 1 - t]])
    if (t > 0 && i < n - 1) weights.set(i + 1, t)
    this.signatures.forEach((sig, k) => sig.update(env, frame.animate && (weights.get(k) ?? 0) > 0))
    fg.save()
    fg.globalCompositeOperation = 'multiply'
    for (const [k, weight] of weights) {
      // ease the crossfade so neither genre's layer lingers at half strength
      const wgt = weight * weight * (3 - 2 * weight)
      if (wgt > 0.01) this.signatures[k].draw(fg, fx, env, wgt)
    }
    fg.restore()

    // header text flips between paper and black by contrast with the field as it
    // blends, rather than fading through an unreadable grey
    const text = contrast(field, PAPER_RGB) >= contrast(field, BLACK_RGB) ? PAPER_RGB : BLACK_RGB
    return {
      field: rgbToCss(field),
      word: rgbToCss(mixRgb(A.word, B.word, t)),
      text: rgbToCss(text),
    }
  }
}

// Each genre's living layer: ambient motion that belongs to that world only,
// a response to the pointer, and a response to a click. They are drawn on top
// of the morphing scene and crossfade with it as you travel along the shelf.
//
// Two targets: `ink` is the overprint canvas (multiply-blended, so it can only
// darken) and `light` is a normal canvas above it for anything bright.

export type SignatureKind = 'birds' | 'rain' | 'stars' | 'lanterns' | 'sundial' | 'orbits' | 'ripples' | 'rays'

export interface SceneEnv {
  w: number
  h: number
  /** top of the sky (below the masthead on phones) and the shelf top, in px */
  top: number
  horizon: number
  time: number
  dt: number
  orb: { x: number; y: number; r: number }
  ring: { x: number; y: number; rx: number; ry: number; rot: number }
  tall: { x: number; top: number }
  pointer: { x: number; y: number; inside: boolean }
}

export interface Signature {
  /** advance the simulation; `live` is false when the genre is off-screen */
  update(env: SceneEnv, live: boolean): void
  draw(ink: CanvasRenderingContext2D, light: CanvasRenderingContext2D, env: SceneEnv, weight: number): void
  click(x: number, y: number, env: SceneEnv): void
}

const PAPER = '246 244 238'
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const skyY = (env: SceneEnv, f: number) => env.top + (env.horizon - env.top) * f
const near = (env: SceneEnv, x: number, y: number, r: number) =>
  env.pointer.inside && Math.hypot(env.pointer.x - x, env.pointer.y - y) < r

// --- Fiction: a flock over the rooftops -------------------------------------------

function birds(): Signature {
  type Bird = { x: number; y: number; vx: number; vy: number; phase: number; size: number; life: number }
  let flock: Bird[] = []
  const spawn = (env: SceneEnv, x?: number, y?: number, burst = false): Bird => ({
    x: x ?? rand(-env.w * 0.2, env.w),
    y: y ?? skyY(env, rand(0.12, 0.5)),
    vx: burst ? rand(-160, 160) : rand(18, 34),
    vy: burst ? rand(-220, -120) : rand(-4, 4),
    phase: rand(0, 6.28),
    size: rand(5, 9),
    life: burst ? 3.2 : Infinity,
  })
  return {
    update(env, live) {
      if (!flock.length) flock = Array.from({ length: 11 }, () => spawn(env))
      if (!live) return
      for (const b of flock) {
        if (near(env, b.x, b.y, 140)) {
          // scatter away from the cursor, then settle back to a drift
          const dx = b.x - env.pointer.x
          const dy = b.y - env.pointer.y
          const d = Math.hypot(dx, dy) || 1
          b.vx += (dx / d) * 420 * env.dt
          b.vy += (dy / d) * 420 * env.dt
        }
        b.vx += (26 - b.vx) * 0.6 * env.dt
        b.vy += (0 - b.vy) * 0.8 * env.dt
        b.x += b.vx * env.dt
        b.y += b.vy * env.dt
        b.life -= env.dt
        if (b.x > env.w + 40) Object.assign(b, spawn(env), { x: -30 })
      }
      flock = flock.filter((b) => b.life > 0 && b.y > -60)
      while (flock.length < 11) flock.push(spawn(env, -30))
    },
    draw(ink, _light, env, weight) {
      ink.save()
      ink.strokeStyle = '#231f20'
      ink.lineWidth = 1.8
      ink.lineCap = 'round'
      ink.lineJoin = 'round'
      for (const b of flock) {
        const flap = Math.sin(env.time * 9 + b.phase) * 0.6
        ink.globalAlpha = weight * Math.min(1, b.life)
        ink.beginPath()
        ink.moveTo(b.x - b.size, b.y - b.size * (0.3 + flap * 0.5))
        ink.quadraticCurveTo(b.x - b.size * 0.4, b.y - b.size * 0.35, b.x, b.y)
        ink.quadraticCurveTo(b.x + b.size * 0.4, b.y - b.size * 0.35, b.x + b.size, b.y - b.size * (0.3 + flap * 0.5))
        ink.stroke()
      }
      ink.restore()
    },
    click(x, y, env) {
      for (let k = 0; k < 9; k++) flock.push(spawn(env, x + rand(-14, 14), y + rand(-8, 8), true))
    },
  }
}

// --- Mystery: rain, a lamp's cone of light, lightning --------------------------------

function rain(): Signature {
  type Drop = { x: number; y: number; v: number; len: number }
  let drops: Drop[] = []
  let flash = 0
  let bolt: [number, number][] = []
  const wind = 0.22
  const spawn = (env: SceneEnv, anywhere: boolean): Drop => ({
    x: rand(-60, env.w + 60),
    y: anywhere ? rand(env.top - 40, env.horizon) : env.top - rand(0, 80),
    v: rand(640, 980),
    len: rand(14, 26),
  })
  return {
    update(env, live) {
      if (!drops.length) drops = Array.from({ length: Math.round(env.w / 9) }, () => spawn(env, true))
      flash = Math.max(0, flash - env.dt * 3.2)
      if (!live) return
      for (const d of drops) {
        d.y += d.v * env.dt
        d.x += d.v * wind * env.dt
        if (d.y > env.horizon) Object.assign(d, spawn(env, false))
      }
    },
    draw(_ink, light, env, weight) {
      light.save()
      // the street lamp's light, falling from the lantern
      const flicker = 0.85 + Math.sin(env.time * 13) * 0.04 + Math.sin(env.time * 2.3) * 0.06
      const lx = env.tall.x
      const ly = env.tall.top + (env.horizon - env.tall.top) * 0.12
      light.globalAlpha = weight * 0.2 * flicker
      light.fillStyle = 'rgb(255 181 17)'
      light.beginPath()
      light.moveTo(lx - 10, ly)
      light.lineTo(lx + 10, ly)
      light.lineTo(lx + (env.horizon - ly) * 0.42, env.horizon)
      light.lineTo(lx - (env.horizon - ly) * 0.42, env.horizon)
      light.closePath()
      light.fill()
      // rain, parting around the cursor like an umbrella
      light.strokeStyle = `rgb(${PAPER})`
      light.lineWidth = 1.2
      light.lineCap = 'round'
      light.beginPath()
      for (const d of drops) {
        let x = d.x
        if (env.pointer.inside) {
          const dx = x - env.pointer.x
          const dy = d.y - env.pointer.y
          const dist = Math.hypot(dx, dy)
          if (dist < 90) {
            if (dy > 0 && Math.abs(dx) < 90) continue // sheltered under the cursor
            x += Math.sign(dx || 1) * (90 - dist) * 0.6
          }
        }
        light.moveTo(x, d.y)
        light.lineTo(x - d.len * wind, d.y - d.len)
      }
      light.globalAlpha = weight * 0.42
      light.stroke()
      if (flash > 0) {
        light.globalAlpha = weight * flash * 0.32
        light.fillStyle = `rgb(${PAPER})`
        light.fillRect(0, 0, env.w, env.horizon)
        if (bolt.length) {
          light.globalAlpha = weight * Math.min(1, flash * 1.4)
          light.lineWidth = 3
          light.beginPath()
          bolt.forEach(([x, y], k) => (k ? light.lineTo(x, y) : light.moveTo(x, y)))
          light.stroke()
        }
      }
      light.restore()
    },
    click(x, y, env) {
      flash = 1
      bolt = [[x + rand(-80, 80), env.top]]
      const steps = 9
      for (let k = 1; k <= steps; k++) {
        const t = k / steps
        bolt.push([bolt[0][0] + (x - bolt[0][0]) * t + (k < steps ? rand(-28, 28) : 0), env.top + (y - env.top) * t])
      }
    },
  }
}

// --- Sci-fi: stars, an orbiting moon, shooting stars -----------------------------------

function stars(): Signature {
  type Star = { x: number; y: number; r: number; phase: number; speed: number }
  type Streak = { x: number; y: number; vx: number; vy: number; life: number }
  let field: Star[] = []
  let streaks: Streak[] = []
  let nextStreak = 2
  const shoot = (x: number, y: number, angle: number, speed = rand(700, 1000)): Streak => ({
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1,
  })
  return {
    update(env, live) {
      if (!field.length) {
        field = Array.from({ length: 110 }, () => ({
          x: rand(0, env.w), y: skyY(env, rand(0, 0.62)), r: rand(0.6, 1.9), phase: rand(0, 6.28), speed: rand(0.6, 2.2),
        }))
      }
      if (!live) return
      nextStreak -= env.dt
      if (nextStreak < 0) {
        nextStreak = rand(2.5, 5.5)
        streaks.push(shoot(rand(env.w * 0.2, env.w), skyY(env, rand(0, 0.25)), rand(2.4, 2.8)))
      }
      for (const s of streaks) {
        s.x += s.vx * env.dt
        s.y += s.vy * env.dt
        s.life -= env.dt * 0.9
      }
      streaks = streaks.filter((s) => s.life > 0)
    },
    draw(ink, light, env, weight) {
      light.save()
      light.fillStyle = `rgb(${PAPER})`
      for (const s of field) {
        const tw = 0.55 + 0.45 * Math.sin(env.time * s.speed + s.phase)
        const lit = near(env, s.x, s.y, 150) ? 1 - Math.hypot(env.pointer.x - s.x, env.pointer.y - s.y) / 150 : 0
        light.globalAlpha = weight * Math.min(1, tw * 0.75 + lit)
        light.beginPath()
        light.arc(s.x, s.y, s.r * (1 + lit * 1.4), 0, 6.283)
        light.fill()
      }
      light.strokeStyle = `rgb(${PAPER})`
      light.lineCap = 'round'
      for (const s of streaks) {
        light.globalAlpha = weight * s.life
        light.lineWidth = 2
        light.beginPath()
        light.moveTo(s.x, s.y)
        light.lineTo(s.x - s.vx * 0.12, s.y - s.vy * 0.12)
        light.stroke()
      }
      light.restore()

      // a small moon riding the planet's ring; it passes behind the planet
      const a = env.time * 0.32
      const { ring, orb } = env
      const ex = Math.cos(a) * ring.rx
      const ey = Math.sin(a) * ring.ry
      const mx = ring.x + ex * Math.cos(ring.rot) - ey * Math.sin(ring.rot)
      const my = ring.y + ex * Math.sin(ring.rot) + ey * Math.cos(ring.rot)
      const behind = Math.sin(a) < 0 && Math.hypot(mx - orb.x, my - orb.y) < orb.r
      if (!behind) {
        ink.save()
        ink.globalAlpha = weight
        ink.fillStyle = '#484d7a'
        ink.beginPath()
        ink.arc(mx, my, Math.max(5, orb.r * 0.13), 0, 6.283)
        ink.fill()
        ink.restore()
      }
    },
    click(x, y) {
      for (let k = 0; k < 5; k++) streaks.push(shoot(x, y, rand(0, 6.28), rand(380, 760)))
    },
  }
}

// --- Fantasy: sky lanterns ----------------------------------------------------------------

function lanterns(): Signature {
  type Lantern = { x: number; y: number; vy: number; sway: number; phase: number; size: number; life: number }
  let list: Lantern[] = []
  const spawn = (env: SceneEnv, x?: number, y?: number, bonus = false): Lantern => ({
    x: x ?? rand(0, env.w),
    y: y ?? rand(env.top, env.horizon),
    vy: rand(14, 30),
    sway: rand(6, 16),
    phase: rand(0, 6.28),
    size: rand(5, 9),
    life: bonus ? 14 : Infinity,
  })
  return {
    update(env, live) {
      if (!list.length) list = Array.from({ length: 16 }, () => spawn(env))
      if (!live) return
      for (const l of list) {
        l.y -= l.vy * env.dt
        if (near(env, l.x, l.y, 180)) {
          // drawn gently toward the cursor, like a warm draught
          l.x += (env.pointer.x - l.x) * 0.35 * env.dt
          l.y += (env.pointer.y - l.y) * 0.2 * env.dt
        }
        l.life -= env.dt
        if (l.y < env.top - 30 && l.life === Infinity) Object.assign(l, spawn(env, undefined, env.horizon + 10))
      }
      list = list.filter((l) => l.life > 0 && l.y > env.top - 40)
    },
    draw(_ink, light, env, weight) {
      light.save()
      for (const l of list) {
        const x = l.x + Math.sin(env.time * 0.8 + l.phase) * l.sway
        const fade = Math.min(1, l.life / 2) * Math.min(1, (env.horizon - l.y) / 60)
        light.globalAlpha = weight * fade * 0.22
        light.fillStyle = 'rgb(255 181 17)'
        light.beginPath()
        light.arc(x, l.y, l.size * 2.6, 0, 6.283)
        light.fill()
        light.globalAlpha = weight * fade
        light.beginPath()
        light.roundRect(x - l.size * 0.6, l.y - l.size * 0.8, l.size * 1.2, l.size * 1.6, l.size * 0.35)
        light.fill()
      }
      light.restore()
    },
    click(x, y, env) {
      for (let k = 0; k < 6; k++) list.push(spawn(env, x + rand(-30, 30), y + rand(-10, 20), true))
    },
  }
}

// --- History: a sundial around the sun -------------------------------------------------------

function sundial(): Signature {
  let angle = -0.6
  let spin = 0
  return {
    update(env, live) {
      if (!live) return
      let target = -0.6 + Math.sin(env.time * 0.08) * 0.5
      if (env.pointer.inside) target = Math.atan2(env.pointer.y - env.orb.y, env.pointer.x - env.orb.x)
      let d = target - angle
      while (d > Math.PI) d -= 2 * Math.PI
      while (d < -Math.PI) d += 2 * Math.PI
      angle += d * Math.min(1, env.dt * 3) + spin * env.dt
      spin *= Math.pow(0.25, env.dt)
    },
    draw(_ink, light, env, weight) {
      const { x, y, r } = env.orb
      const R = r * 1.75
      light.save()
      light.strokeStyle = `rgb(${PAPER})`
      light.fillStyle = `rgb(${PAPER})`
      light.lineCap = 'round'
      // hour ticks around the dial
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2
        const long = k % 6 === 0
        const sweep = Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle)))
        light.globalAlpha = weight * (0.35 + (sweep < 0.3 ? 0.55 : 0))
        light.lineWidth = long ? 3 : 1.5
        light.beginPath()
        light.moveTo(x + Math.cos(a) * (R - (long ? 22 : 12)), y + Math.sin(a) * (R - (long ? 22 : 12)))
        light.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R)
        light.stroke()
      }
      // the gnomon's hand
      light.globalAlpha = weight * 0.85
      light.lineWidth = 4
      light.beginPath()
      light.moveTo(x, y)
      light.lineTo(x + Math.cos(angle) * (R - 30), y + Math.sin(angle) * (R - 30))
      light.stroke()
      light.beginPath()
      light.arc(x, y, 5, 0, 6.283)
      light.fill()
      light.restore()
    },
    click() {
      spin = 14
    },
  }
}

// --- Science: orbits and a constellation network -------------------------------------------

function orbits(): Signature {
  type Node = { x: number; y: number; vx: number; vy: number; born: number }
  let nodes: Node[] = []
  const pulses: { x: number; y: number; t: number }[] = []
  const extra = [
    { k: 0.55, ry: 0.9, rot: 0.5, speed: 0.6 },
    { k: 1.32, ry: 0.55, rot: -0.35, speed: 0.22 },
  ]
  return {
    update(env, live) {
      if (!nodes.length) {
        nodes = Array.from({ length: 16 }, () => ({
          x: rand(0, env.w), y: skyY(env, rand(0.05, 0.55)), vx: rand(-8, 8), vy: rand(-5, 5), born: -10,
        }))
      }
      if (!live) return
      for (const n of nodes) {
        n.x += n.vx * env.dt
        n.y += n.vy * env.dt
        if (n.x < 0 || n.x > env.w) n.vx *= -1
        if (n.y < env.top || n.y > skyY(env, 0.62)) n.vy *= -1
      }
      for (const p of pulses) p.t += env.dt
      while (pulses.length && pulses[0].t > 1.2) pulses.shift()
    },
    draw(_ink, light, env, weight) {
      const blue = 'rgb(0 120 191)'
      light.save()
      light.strokeStyle = blue
      light.fillStyle = blue
      // constellation: nearby stars join up, and they reach for the cursor
      const pts = env.pointer.inside ? [...nodes, { x: env.pointer.x, y: env.pointer.y }] : nodes
      light.lineWidth = 1
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          const d = Math.hypot(pts[a].x - pts[b].x, pts[a].y - pts[b].y)
          const reach = b === nodes.length ? 200 : 170
          if (d > reach) continue
          light.globalAlpha = weight * (1 - d / reach) * 0.7
          light.beginPath()
          light.moveTo(pts[a].x, pts[a].y)
          light.lineTo(pts[b].x, pts[b].y)
          light.stroke()
        }
      }
      for (const n of nodes) {
        const fresh = Math.max(0, 1 - (env.time - n.born) / 1.5)
        light.globalAlpha = weight
        light.beginPath()
        light.arc(n.x, n.y, 2.6 + fresh * 3, 0, 6.283)
        light.fill()
      }
      // two more orbits around the same centre, each with its own body
      const { ring } = env
      for (const o of extra) {
        const rx = ring.rx * o.k
        const ry = ring.ry * o.k * o.ry * 2.2
        light.globalAlpha = weight * 0.8
        light.lineWidth = 2
        light.beginPath()
        light.ellipse(ring.x, ring.y, rx, ry, ring.rot + o.rot, 0, 6.283)
        light.stroke()
        const a = env.time * o.speed
        const ex = Math.cos(a) * rx
        const ey = Math.sin(a) * ry
        const r2 = ring.rot + o.rot
        light.globalAlpha = weight
        light.beginPath()
        light.arc(ring.x + ex * Math.cos(r2) - ey * Math.sin(r2), ring.y + ex * Math.sin(r2) + ey * Math.cos(r2), 7, 0, 6.283)
        light.fill()
      }
      for (const p of pulses) {
        light.globalAlpha = weight * (1 - p.t / 1.2)
        light.lineWidth = 2
        light.beginPath()
        light.arc(p.x, p.y, 8 + p.t * 90, 0, 6.283)
        light.stroke()
      }
      light.restore()
    },
    click(x, y, env) {
      nodes.push({ x, y, vx: rand(-10, 10), vy: rand(-6, 6), born: env.time })
      if (nodes.length > 30) nodes.splice(0, 1)
      pulses.push({ x, y, t: 0 })
    },
  }
}

// --- Mind & self: a breathing halo and ripples ---------------------------------------------------

function ripples(): Signature {
  type Ring = { x: number; y: number; t: number; max: number; life: number; width: number }
  let rings: Ring[] = []
  let nextCalm = 0
  let lastWake = 0
  let last = { x: 0, y: 0 }
  return {
    update(env, live) {
      if (!live) return
      nextCalm -= env.dt
      if (nextCalm < 0) {
        // the sun breathes out a slow ring every few seconds
        nextCalm = 3.2
        rings.push({ x: env.orb.x, y: env.orb.y, t: 0, max: env.orb.r * 2.6, life: 4, width: 2 })
      }
      if (env.pointer.inside && env.time - lastWake > 0.12) {
        const moved = Math.hypot(env.pointer.x - last.x, env.pointer.y - last.y)
        if (moved > 18) {
          rings.push({ x: env.pointer.x, y: env.pointer.y, t: 0, max: 46, life: 1.1, width: 1.5 })
          lastWake = env.time
          last = { x: env.pointer.x, y: env.pointer.y }
        }
      }
      for (const r of rings) r.t += env.dt
      rings = rings.filter((r) => r.t < r.life)
    },
    draw(_ink, light, env, weight) {
      light.save()
      light.strokeStyle = `rgb(${PAPER})`
      const breath = (Math.sin(env.time * 0.9) + 1) / 2
      light.globalAlpha = weight * (0.25 + breath * 0.25)
      light.lineWidth = 2
      light.beginPath()
      light.arc(env.orb.x, env.orb.y, env.orb.r * (1.32 + breath * 0.08), 0, 6.283)
      light.stroke()
      for (const r of rings) {
        if (r.t <= 0) continue // staggered rings wait their turn
        const k = r.t / r.life
        const ease = 1 - (1 - k) ** 3
        light.globalAlpha = weight * (1 - k) * 0.7
        light.lineWidth = r.width
        light.beginPath()
        light.arc(r.x, r.y, 4 + ease * r.max, 0, 6.283)
        light.stroke()
      }
      light.restore()
    },
    click(x, y) {
      for (let k = 0; k < 3; k++) rings.push({ x, y, t: -k * 0.22, max: 160 + k * 40, life: 2.2, width: 2.5 - k * 0.5 })
    },
  }
}

// --- Up next: dawn rays and paper planes -----------------------------------------------------------

function rays(): Signature {
  type Plane = { x: number; y: number; t: number; sx: number; sy: number; c: [number, number] }
  let lean = 0
  let planes: Plane[] = []
  return {
    update(env, live) {
      if (!live) return
      let target = 0
      if (env.pointer.inside) target = Math.max(-0.35, Math.min(0.35, (env.pointer.x - env.orb.x) / env.w))
      lean += (target - lean) * Math.min(1, env.dt * 2.5)
      for (const p of planes) p.t += env.dt / 1.6
      planes = planes.filter((p) => p.t < 1)
    },
    draw(ink, light, env, weight) {
      const { x, y, r } = env.orb
      const count = 16
      light.save()
      light.fillStyle = `rgb(${PAPER})`
      for (let k = 0; k < count; k++) {
        const a = Math.PI + (k / (count - 1)) * Math.PI + lean + Math.sin(env.time * 0.15) * 0.03
        const spread = 0.045
        const len = Math.max(env.w, env.h)
        light.globalAlpha = weight * (k % 2 ? 0.12 : 0.2)
        light.beginPath()
        light.moveTo(x + Math.cos(a) * r * 1.1, y + Math.sin(a) * r * 1.1)
        light.lineTo(x + Math.cos(a - spread) * len, y + Math.sin(a - spread) * len)
        light.lineTo(x + Math.cos(a + spread) * len, y + Math.sin(a + spread) * len)
        light.closePath()
        light.fill()
      }
      light.restore()
      // paper planes gliding into the doorway
      ink.save()
      ink.fillStyle = '#3d5588'
      for (const p of planes) {
        const t = p.t
        const ex = env.tall.x
        const ey = env.tall.top + (env.horizon - env.tall.top) * 0.45
        const px = (1 - t) ** 2 * p.sx + 2 * (1 - t) * t * p.c[0] + t * t * ex
        const py = (1 - t) ** 2 * p.sy + 2 * (1 - t) * t * p.c[1] + t * t * ey
        const dx = 2 * (1 - t) * (p.c[0] - p.sx) + 2 * t * (ex - p.c[0])
        const dy = 2 * (1 - t) * (p.c[1] - p.sy) + 2 * t * (ey - p.c[1])
        const a = Math.atan2(dy, dx)
        const s = 16 * (1 - t * 0.6)
        ink.globalAlpha = weight * Math.min(1, (1 - t) * 4)
        ink.save()
        ink.translate(px, py)
        ink.rotate(a)
        ink.beginPath()
        ink.moveTo(s, 0)
        ink.lineTo(-s * 0.8, -s * 0.55)
        ink.lineTo(-s * 0.4, 0)
        ink.lineTo(-s * 0.8, s * 0.55)
        ink.closePath()
        ink.fill()
        ink.restore()
      }
      ink.restore()
    },
    click(x, y, env) {
      planes.push({ x, y, t: 0, sx: x, sy: y, c: [(x + env.tall.x) / 2, Math.min(y, env.tall.top) - 120] })
    },
  }
}

const FACTORIES: Record<SignatureKind, () => Signature> = { birds, rain, stars, lanterns, sundial, orbits, ripples, rays }

export function createSignature(kind: SignatureKind): Signature {
  return FACTORIES[kind]()
}

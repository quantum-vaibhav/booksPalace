// Picks the riso ink a spine should be printed in, from the cover image.
// Uses ffmpeg (already on the owner's machine) to shrink the cover to a few
// dozen pixels, then votes for the nearest ink, favouring saturated pixels.
import { spawn } from 'node:child_process'
import { inkFromTitle, nearestInk, type InkId, type RGB } from '../src/lib/inks'

const W = 12
const H = 16

function shrink(image: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-v', 'error', '-i', 'pipe:0', '-vf', `scale=${W}:${H}`, '-frames:v', '1',
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1',
    ])
    const chunks: Buffer[] = []
    ff.stdout.on('data', (c: Buffer) => chunks.push(c))
    ff.on('error', reject)
    ff.on('close', (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`ffmpeg exited ${code}`))))
    ff.stdin.on('error', () => {})
    ff.stdin.end(image)
  })
}

function saturation([r, g, b]: RGB): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

export async function spineInkFromCover(coverUrl: string | undefined, title: string): Promise<InkId> {
  if (!coverUrl) return inkFromTitle(title)
  try {
    const res = await fetch(coverUrl)
    if (!res.ok) return inkFromTitle(title)
    const raw = await shrink(Buffer.from(await res.arrayBuffer()))
    if (raw.length < W * H * 3) return inkFromTitle(title)
    const votes = new Map<InkId, number>()
    for (let i = 0; i < W * H; i++) {
      const px: RGB = [raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]]
      const ink = nearestInk(px)
      // black and white backgrounds dominate most covers; let a cover's colour win when it has one
      const neutral = ink === 'black' || ink === 'paper' || ink === 'lightGray' ? 0.35 : 1
      votes.set(ink, (votes.get(ink) ?? 0) + (0.4 + saturation(px)) * neutral)
    }
    return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0]
  } catch {
    return inkFromTitle(title)
  }
}

import { useEffect, useRef } from 'react'

interface Props {
  src: string
  ink: string
}

/**
 * The cover, printed in one ink: drawn onto a canvas as a greyscale image screened
 * over a flood of the ink, so shadows take the ink and highlights go to paper.
 * (CSS blend modes don't survive inside the 3D book, so this is done by hand.)
 */
export function CoverPrint({ src, ink }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
    const img = new Image()
    img.decoding = 'async'
    const draw = () => {
      if (cancelled) return
      const w = 240
      const h = 360
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = ink
      ctx.fillRect(0, 0, w, h)
      // cover-fit the image into the frame
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      ctx.globalCompositeOperation = 'screen'
      ctx.filter = 'grayscale(1) contrast(1.3) brightness(1.06)'
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      canvas.dataset.ready = 'true'
    }
    img.onload = draw
    // no crossOrigin: the canvas is only ever shown, never read back, so a tainted canvas is fine
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src, ink])

  return <canvas ref={ref} className="own-print" aria-hidden="true" />
}

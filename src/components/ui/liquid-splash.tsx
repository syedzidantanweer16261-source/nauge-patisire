import * as React from "react"
import { LiquidEngine, type EngineOptions, type Rect } from "@/components/ui/liquid-engine"
import { cn } from "@/lib/utils"

/**
 * A cut-out image rebuilt from GPU particles: the cursor (or a finger) turns it
 * liquid and it settles back into the crisp picture. Adapted from the Sculpture
 * Hero; the layout, copy and styling now live with the caller.
 *
 * The art is fitted (contain) inside the box, inset by `padding` so particles
 * have room to fly. Without WebGL2 the static image is shown instead.
 */
export interface LiquidSplashProps {
  /** Same-origin or CORS-enabled image with a transparent background. */
  src: string
  alt: string
  /** Fraction of the box kept free around the art, per side. */
  padding?: number
  /** Particles assemble into the image on load. */
  intro?: boolean
  /** 0 – 2, multiplies the particle count. */
  density?: number
  /** Radius of the disturbance, in px at 1400px of art width. */
  radius?: number
  className?: string
  /** Fires once the first GPU frame (or the fallback image) is on screen. */
  onReady?: () => void
}

export function LiquidSplash({
  src,
  alt,
  padding = 0.08,
  intro = true,
  density = 0.45,
  radius = 170,
  className,
  onReady,
}: LiquidSplashProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const onReadyRef = React.useRef(onReady)
  React.useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  React.useEffect(() => {
    const wrap = wrapRef.current
    const fallback = imgRef.current
    if (!wrap || !fallback) return
    let disposed = false
    let aspect = 1
    let ready = false
    const markReady = () => {
      if (ready || disposed) return
      ready = true
      onReadyRef.current?.()
    }

    // a fresh canvas per engine: a released WebGL context can never be reused
    const canvas = document.createElement("canvas")
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .6s ease"
    wrap.appendChild(canvas)

    const showFallback = () => {
      canvas.style.opacity = "0"
      fallback.style.opacity = "1"
      markReady()
    }

    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const opts = (rm: boolean): EngineOptions => ({
      interactive: true,
      strength: 1,
      radius,
      density,
      dotSize: 1.1,
      spread: 1,
      turbulence: 1,
      liquid: 1,
      streaks: true,
      restStyle: "image",
      returnSpeed: 1,
      ambient: false,
      ambientIntensity: 1,
      speed: 1,
      intro,
      reducedMotion: rm,
      bg: [0.07, 0.04, 0.02],
      imgBg: null,
    })

    let engine: LiquidEngine | null = null
    try {
      engine = new LiquidEngine(canvas, opts(rmq.matches), showFallback)
    } catch {
      engine = null
    }

    const layout = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const availW = w * (1 - padding * 2)
      const availH = h * (1 - padding * 2)
      const rw = Math.max(1, Math.min(availW, availH * aspect))
      const rh = rw / aspect
      const rect: Rect = { x: (w - rw) / 2, y: (h - rh) / 2, w: rw, h: rh }
      Object.assign(fallback.style, {
        left: rect.x + "px",
        top: rect.y + "px",
        width: rect.w + "px",
        height: rect.h + "px",
      })
      engine?.resize(w, h, rect)
    }

    const ro = new ResizeObserver(layout)
    ro.observe(wrap)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) engine?.setVisible(e.isIntersecting && !document.hidden)
    })
    io.observe(wrap)
    const onVis = () => engine?.setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    const onMq = () => engine?.setOptions({ reducedMotion: rmq.matches })
    rmq.addEventListener?.("change", onMq)

    const image = new Image()
    image.decoding = "async"
    image.crossOrigin = "anonymous"
    image.onload = () => {
      if (disposed) return
      aspect = image.naturalWidth / image.naturalHeight || 1
      layout() // the intro scatter is sized from the rect, so lay out first
      if (!engine) return showFallback()
      try {
        engine.onFirstFrame = () => {
          if (disposed) return
          canvas.style.opacity = "1"
          markReady()
        }
        engine.setImage(image)
        layout()
      } catch {
        showFallback()
      }
    }
    image.onerror = showFallback
    image.src = src

    const pos = (e: PointerEvent) => {
      const b = wrap.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top] as const
    }
    const onMove = (e: PointerEvent) => {
      const touch = e.pointerType === "touch"
      if (touch && e.buttons === 0 && e.pressure === 0) return
      const [x, y] = pos(e)
      engine?.pointer("move", x, y, touch)
    }
    const onDown = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("down", x, y, e.pointerType === "touch")
    }
    const onUp = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("up", x, y, e.pointerType === "touch")
    }
    const onLeave = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("leave", x, y, e.pointerType === "touch")
    }
    wrap.addEventListener("pointermove", onMove, { passive: true })
    wrap.addEventListener("pointerdown", onDown, { passive: true })
    wrap.addEventListener("pointerup", onUp, { passive: true })
    wrap.addEventListener("pointercancel", onUp, { passive: true })
    wrap.addEventListener("pointerleave", onLeave, { passive: true })

    return () => {
      disposed = true
      image.onload = null
      image.onerror = null
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      rmq.removeEventListener?.("change", onMq)
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerdown", onDown)
      wrap.removeEventListener("pointerup", onUp)
      wrap.removeEventListener("pointercancel", onUp)
      wrap.removeEventListener("pointerleave", onLeave)
      engine?.destroy()
      canvas.remove()
      fallback.style.opacity = "0"
    }
  }, [src, padding, intro, density, radius])

  return (
    <div ref={wrapRef} role="img" aria-label={alt} className={cn("relative touch-pan-y select-none", className)}>
      {/* hidden until WebGL is ruled out, so the particle intro isn't spoiled */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        draggable={false}
        className="pointer-events-none absolute max-w-none opacity-0 transition-opacity duration-700"
      />
    </div>
  )
}

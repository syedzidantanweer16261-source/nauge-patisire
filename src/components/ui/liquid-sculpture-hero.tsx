"use client"

/**
 * Sculpture Hero — liquid particle hero
 * by guglielmogiannattasio.it
 *
 * The sculpture is rebuilt from ~100k GPU-simulated particles sampled from
 * its own pixels. The cursor turns the material liquid; it settles back into
 * the crisp image. Without WebGL2 the static image is shown.
 */

import * as React from "react"
import { LiquidEngine, clamp, hexToRgb, type EngineOptions, type Rect } from "@/components/ui/liquid-engine"
import { ArrowRight, Moon, Sun } from "lucide-react"


/* ────────────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────────────── */

export interface SculptureHeroLink {
  label: string
  href: string
}

export interface SculptureHeroProps {
  /** Sculpture image (light theme). Must be CORS-enabled when hosted on another domain. */
  src?: string
  /** Optional image for the dark theme. */
  darkSrc?: string
  /** Optional image for phones (portrait layouts), light and dark. */
  mobileSrc?: string
  mobileDarkSrc?: string
  imageAlt?: string
  /** Only for images without transparency: the flat background colour inside the image. */
  imageBackground?: string

  brand?: string
  navLinks?: SculptureHeroLink[]
  navCta?: SculptureHeroLink
  showNav?: boolean

  eyebrow?: string
  headline?: string
  /** Words of the headline to set in the italic accent face. */
  headlineAccent?: string
  body?: string
  primaryCta?: SculptureHeroLink
  secondaryCta?: SculptureHeroLink
  hint?: string
  hintTouch?: string

  /** Light-theme background. */
  background?: string
  /** Dark-theme background. */
  darkBackground?: string
  /** Theme on load. */
  theme?: "light" | "dark"
  /** Show the light/dark switch in the nav. */
  themeToggle?: boolean
  textColor?: string
  accentColor?: string
  headingFont?: string
  accentFont?: string
  bodyFont?: string
  /** Load the default Google Fonts (Geist + Instrument Serif, both OFL). */
  loadFonts?: boolean

  /** 1 = default size for the breakpoint. */
  sculptureScale?: number
  mobileSculptureScale?: number
  /** Offset in % of the hero width / height. */
  sculptureX?: number
  sculptureY?: number

  interactive?: boolean
  /** 0 – 2 */
  strength?: number
  /** Radius of the disturbance, in px at 1440px wide. */
  radius?: number
  /** 0 – 2, multiplies the particle count. */
  particleDensity?: number
  /** 0 – 3, size of each particle relative to the grid. */
  dotSize?: number
  /** 0 – 2, how far particles travel when disturbed. */
  particleSpread?: number
  /** 0 – 2, liquid swirl of the disturbed material. */
  turbulence?: number
  /** 0 – 2, how much the whole sculpture flows while hovered. */
  liquid?: number
  /** Stretch fast particles into liquid streaks. */
  streaks?: boolean
  /** At rest: the crisp image, or the particle field itself. */
  restStyle?: "image" | "particles"
  /** 0 – 2, how quickly the material settles back. */
  returnSpeed?: number
  ambient?: boolean
  /** 0 – 2 */
  ambientIntensity?: number
  /** 0.25 – 3 */
  speed?: number
  /** Assembly animation on load. */
  intro?: boolean

  /** Hero height. Default fills the screen exactly, no scrolling. */
  height?: string
  /** Giant faint word behind the sculpture. Empty to hide. */
  backdropText?: string
  showCredit?: boolean
  className?: string
  style?: React.CSSProperties
}

const DEFAULTS = {
  src: "https://cdn.21st.dev/assets/mirror/ae/ae8c3de9003460e59182e950ccd345f68f27f9d0e4808b64c92c962a4eca7120.webp",
  darkSrc: "https://cdn.21st.dev/assets/mirror/a1/a1fa387b6e417b26a25f317559c87cce4d241c1052c52a2b3bc2966b2aaf9b65.webp",
  mobileSrc: "https://cdn.21st.dev/assets/mirror/b0/b0c8d8e5d64b8cec906a3b390e3dc7c9a5af08334bf0632873c601782cb4bc46.webp",
  mobileDarkSrc: "https://cdn.21st.dev/assets/mirror/9a/9a82cb59be1bfde59855b79d7a565e487155a89f4d52eac74dcc10e267b2b6d1.webp",
  imageAlt: "Abstract sculpture of interwoven metallic filaments and particles",
  imageBackground: "#EAE9E7",
  brand: "Forma®",
  navLinks: [
    { label: "Work", href: "#" },
    { label: "Studio", href: "#" },
    { label: "Approach", href: "#" },
    { label: "Journal", href: "#" },
  ],
  navCta: { label: "Contact", href: "#" },
  eyebrow: "Independent studio — Est. 2019",
  headline: "Form that\nanswers back.",
  headlineAccent: "answers back.",
  body: "We shape products, identities and spaces with the precision of engineering and the patience of craft — work that holds up under attention.",
  primaryCta: { label: "Start a project", href: "#" },
  secondaryCta: { label: "Selected work", href: "#" },
  hint: "Move across the form",
  hintTouch: "Touch the form",
  background: "#EBE9E5",
  darkBackground: "#111110",
  textColor: "#151514",
  accentColor: "#151514",
  headingFont: "'Geist', 'Helvetica Neue', Arial, sans-serif",
  accentFont: "'Instrument Serif', 'Times New Roman', serif",
  bodyFont: "'Geist', 'Helvetica Neue', Arial, sans-serif",
}

/* ────────────────────────────────────────────────────────────────────
   Layout
   ──────────────────────────────────────────────────────────────────── */

/** The sculpture sits centred in the band between the nav and the copy,
 *  as wide as the hero (it may bleed off the sides on small screens). */
function computeRect(
  w: number,
  h: number,
  aspect: number,
  band: { top: number; bottom: number },
  p: { scale: number; mobileScale: number; x: number; y: number }
): Rect {
  const bandH = Math.max(80, band.bottom - band.top)
  let rw: number
  let maxH: number
  if (w >= 1024) {
    rw = w * 1.02 * p.scale
    maxH = bandH * 1.1 * p.scale
  } else if (w >= 640) {
    rw = w * 1.3 * p.scale
    maxH = bandH * 1.15 * p.scale
  } else if (aspect < 1.3) {
    // portrait image for phones: fills the width, may tuck under the headline
    rw = w * 1.0 * p.mobileScale
    maxH = bandH * 1.0 * p.mobileScale
  } else {
    rw = w * 1.9 * p.mobileScale
    maxH = bandH * 1.2 * p.mobileScale
  }
  if (rw / aspect > maxH) rw = maxH * aspect
  const rh = rw / aspect
  const cx = w * (0.5 + p.x / 100)
  const cy = (band.top + band.bottom) / 2 + h * (p.y / 100)
  return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh }
}

/* ────────────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────────── */

const CSS = `
.sh-root{position:relative;width:100%;height:var(--sh-h);overflow:hidden;isolation:isolate;container-type:size;transition:background-color .6s ease,color .6s ease;
  background:var(--sh-bg);color:var(--sh-fg);font-family:var(--sh-body);-webkit-font-smoothing:antialiased;
  touch-action:pan-y;display:flex;flex-direction:column;box-sizing:border-box}
.sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}
.sh-stage{position:absolute;inset:0;z-index:0;pointer-events:none}
.sh-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .5s ease}
.sh-fallback{position:absolute;display:block;max-width:none;user-select:none;-webkit-user-drag:none;transition:opacity .5s ease}
.sh-root[data-gl="on"] .sh-canvas{opacity:1}
.sh-root[data-gl="on"] .sh-fallback{opacity:0}
.sh-root[data-swap="1"] .sh-canvas{opacity:0;transition-duration:.25s}
.sh-root[data-swap="1"] .sh-fallback{opacity:0;transition-duration:.25s}
.sh-backdrop{position:absolute;left:50%;z-index:0;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;user-select:none;
  font-family:var(--sh-head);font-weight:600;letter-spacing:-.06em;line-height:.8;color:color-mix(in srgb,var(--sh-fg) 5%,transparent)}
.sh-nav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;
  padding:26px clamp(20px,3.2cqw,48px) 0}
.sh-brand{font-family:var(--sh-head);font-weight:600;font-size:17px;letter-spacing:-.02em;color:inherit;text-decoration:none}
.sh-links{display:flex;align-items:center;gap:clamp(18px,2.4cqw,36px);list-style:none;margin:0;padding:0}
.sh-link{color:inherit;text-decoration:none;font-size:13.5px;letter-spacing:-.005em;opacity:.72;transition:opacity .2s}
.sh-link:hover{opacity:1}
.sh-theme{display:inline-grid;place-items:center;width:34px;height:34px;padding:0;border-radius:50%;cursor:pointer;color:inherit;background:transparent;
  border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);transition:background .25s,color .25s}
.sh-theme:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-theme:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-navcta{color:inherit;text-decoration:none;font-size:13.5px;padding:8px 14px;border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);
  border-radius:999px;transition:background .25s,color .25s}
.sh-navcta:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-hint{position:absolute;z-index:1;transform:translate(-50%,0);display:flex;align-items:center;gap:10px;white-space:nowrap;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.5;pointer-events:none;transition:opacity .8s ease}
.sh-hint::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;animation:sh-pulse 2.4s ease-in-out infinite}
.sh-root[data-touched="1"] .sh-hint{opacity:0}
@keyframes sh-pulse{0%,100%{transform:scale(.6);opacity:.45}50%{transform:scale(1);opacity:1}}
.sh-spacer{flex:1 1 auto;min-height:0}
.sh-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);align-items:end;
  gap:clamp(24px,4cqw,72px);padding:0 clamp(20px,3.2cqw,48px) clamp(28px,3.4cqw,52px)}
.sh-eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.62;margin:0 0 clamp(14px,1.6cqw,22px);
  display:flex;align-items:center;gap:12px}
.sh-eyebrow::before{content:"";width:28px;height:1px;background:currentColor;opacity:.7}
.sh-h1{font-family:var(--sh-head);font-weight:500;font-size:clamp(40px,min(6.6cqw,11.5cqh),124px);line-height:.92;letter-spacing:-.045em;margin:0;
  text-wrap:balance}
.sh-h1 .sh-line{display:block}
.sh-accent{font-family:var(--sh-accent);font-style:italic;font-weight:400;letter-spacing:-.02em;color:var(--sh-acc)}
.sh-aside{max-width:400px;justify-self:end;padding-bottom:.6em}
.sh-body{font-size:clamp(15px,1.1cqw,17px);line-height:1.5;letter-spacing:-.01em;margin:0 0 26px;opacity:.78;text-wrap:pretty}
.sh-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:22px}
.sh-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;background:var(--sh-fg);
  color:var(--sh-bg);text-decoration:none;font-size:14.5px;font-weight:500;letter-spacing:-.01em;transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .2s}
.sh-btn:hover{transform:translateY(-1px)}
.sh-btn svg,.sh-txt svg{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
.sh-btn:hover svg,.sh-txt:hover svg{transform:translateX(3px)}
.sh-txt{display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none;font-size:14.5px;font-weight:500;
  letter-spacing:-.01em;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--sh-fg) 30%,transparent)}
.sh-root a:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-credit{position:absolute;z-index:2;right:clamp(20px,3.2cqw,48px);bottom:10px;font-size:10px;letter-spacing:.06em;
  color:inherit;opacity:.38;text-decoration:none}
.sh-credit:hover{opacity:.8}
@container (max-width:1023px){
  .sh-content{grid-template-columns:1fr;gap:28px}
  .sh-aside{justify-self:start;max-width:520px;padding-bottom:0}
  .sh-h1{font-size:clamp(40px,min(9.5cqw,9cqh),96px)}
}
@container (max-width:767px){
  .sh-links li:not(.sh-keep){display:none}
}
@container (max-width:639px){
  .sh-nav{padding-top:20px}
  .sh-h1{font-size:clamp(36px,min(12.5cqw,7.2cqh),60px);line-height:.94}
  .sh-body{font-size:15px;margin-bottom:20px}
  .sh-eyebrow{font-size:11px}
  .sh-ctas{gap:18px}
  .sh-btn{height:48px}
  .sh-content{padding-bottom:40px}
  .sh-credit{right:auto;left:50%;transform:translateX(-50%)}
}
@media (prefers-reduced-motion:reduce){
  .sh-hint::before{animation:none}
  .sh-canvas,.sh-fallback,.sh-btn,.sh-btn svg,.sh-txt svg{transition:none}
}
`

const SunIcon = () => <Sun size={15} strokeWidth={1.5} aria-hidden="true" />

const MoonIcon = () => <Moon size={15} strokeWidth={1.5} aria-hidden="true" />

const Arrow = () => <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />

/* ────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────── */

let fontsInjected = false
function injectFonts() {
  if (fontsInjected || typeof document === "undefined") return
  fontsInjected = true
  const id = "sh-fonts"
  if (document.getElementById(id)) return
  const l = document.createElement("link")
  l.id = id
  l.rel = "stylesheet"
  l.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
  document.head.appendChild(l)
}

function renderHeadline(text: string, accent: string) {
  const lines = text.split("\n")
  return lines.map((line, li) => {
    let content: React.ReactNode = line
    const a = accent && accent.trim()
    if (a) {
      const idx = line.indexOf(a)
      if (idx >= 0) {
        content = (
          <>
            {line.slice(0, idx)}
            <span className="sh-accent">{a}</span>
            {line.slice(idx + a.length)}
          </>
        )
      }
    }
    return (
      <span className="sh-line" key={li}>
        {content}
      </span>
    )
  })
}

export default function SculptureHero(props: SculptureHeroProps) {
  const {
    src = DEFAULTS.src,
    darkSrc = DEFAULTS.darkSrc,
    mobileSrc = DEFAULTS.mobileSrc,
    mobileDarkSrc = DEFAULTS.mobileDarkSrc,
    imageAlt = DEFAULTS.imageAlt,
    imageBackground,
    brand = DEFAULTS.brand,
    navLinks = DEFAULTS.navLinks,
    navCta = DEFAULTS.navCta,
    showNav = true,
    eyebrow = DEFAULTS.eyebrow,
    headline = DEFAULTS.headline,
    headlineAccent = DEFAULTS.headlineAccent,
    body = DEFAULTS.body,
    primaryCta = DEFAULTS.primaryCta,
    secondaryCta = DEFAULTS.secondaryCta,
    hint = DEFAULTS.hint,
    hintTouch = DEFAULTS.hintTouch,
    background: lightBackground = DEFAULTS.background,
    darkBackground = DEFAULTS.darkBackground,
    theme = "light",
    themeToggle = true,
    textColor,
    accentColor,
    headingFont = DEFAULTS.headingFont,
    accentFont = DEFAULTS.accentFont,
    bodyFont = DEFAULTS.bodyFont,
    loadFonts = true,
    sculptureScale = 1,
    mobileSculptureScale = 1,
    sculptureX = 0,
    sculptureY = 0,
    interactive = true,
    strength = 1,
    radius = 220,
    particleDensity = 1,
    particleSpread = 1,
    dotSize = 1,
    turbulence = 1,
    liquid = 1,
    streaks = true,
    restStyle = "image",
    returnSpeed = 1,
    ambient = false,
    ambientIntensity = 1,
    speed = 1,
    intro = false,
    height = "100svh",
    backdropText = "forma",
    showCredit = true,
    className,
    style,
  } = props

  const rootRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const hintRef = React.useRef<HTMLDivElement>(null)
  const navRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const engineRef = React.useRef<LiquidEngine | null>(null)
  const aspectRef = React.useRef(1983 / 793)
  const [isTouch, setIsTouch] = React.useState(false)

  const layout = React.useRef({ scale: sculptureScale, mobileScale: mobileSculptureScale, x: sculptureX, y: sculptureY })
  layout.current = {
    scale: clamp(sculptureScale, 0.3, 3),
    mobileScale: clamp(mobileSculptureScale, 0.3, 3),
    x: sculptureX,
    y: sculptureY,
  }

  const [mode, setMode] = React.useState<"light" | "dark">(theme)
  React.useEffect(() => setMode(theme), [theme])
  const background = mode === "dark" ? darkBackground : lightBackground
  const bgRgb = React.useMemo(() => hexToRgb(background, [0.92, 0.91, 0.9]), [background])
  // text follows the background unless set: light on dark grounds, dark on light ones
  const darkBg = bgRgb[0] * 0.2126 + bgRgb[1] * 0.7152 + bgRgb[2] * 0.0722 < 0.45
  const fg = textColor || (darkBg ? "#F1EFEA" : DEFAULTS.textColor)
  const acc = accentColor || fg
  const imgBgRgb = React.useMemo(
    () => (imageBackground ? hexToRgb(imageBackground, [0.918, 0.914, 0.906]) : null),
    [imageBackground]
  )
  const [isMobile, setIsMobile] = React.useState(false)
  const mobileRef = React.useRef(false)
  // pick the image for the current theme and layout, falling back sensibly
  const activeSrc =
    (isMobile && mode === "dark" && (mobileDarkSrc || darkSrc)) ||
    (isMobile && mode === "light" && mobileSrc) ||
    (mode === "dark" && darkSrc) ||
    src

  const engineOpts = (rm: boolean): EngineOptions => ({
    interactive,
    strength: clamp(strength, 0, 2),
    radius: clamp(radius, 40, 600),
    density: clamp(particleDensity, 0.15, 2),
    dotSize: clamp(dotSize, 0.2, 3),
    spread: clamp(particleSpread, 0, 2),
    turbulence: clamp(turbulence, 0, 2),
    liquid: clamp(liquid, 0, 2),
    streaks,
    restStyle,
    returnSpeed: clamp(returnSpeed, 0, 2),
    ambient,
    ambientIntensity: clamp(ambientIntensity, 0, 2),
    speed: clamp(speed, 0.25, 3),
    intro,
    reducedMotion: rm,
    bg: bgRgb,
    imgBg: imgBgRgb,
  })
  const optsRef = React.useRef(engineOpts)
  optsRef.current = engineOpts

  React.useEffect(() => {
    if (loadFonts) injectFonts()
  }, [loadFonts])

  const relayout = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const w = root.clientWidth
    const h = root.clientHeight
    const mob = w < 640
    if (mob !== mobileRef.current) {
      mobileRef.current = mob
      setIsMobile(mob)
    }
    const nav = navRef.current
    const content = contentRef.current
    const band = {
      top: nav ? nav.offsetTop + nav.offsetHeight + 8 : 16,
      bottom: content ? content.offsetTop - 8 : h,
    }
    // a portrait sculpture on phones dissolves into the top of the copy
    if (mob && aspectRef.current < 1.3 && content) band.bottom += content.offsetHeight * 0.3
    const rect = computeRect(w, h, aspectRef.current, band, layout.current)
    const bd = backdropRef.current
    if (bd) {
      const chars = Math.max(1, (bd.textContent || "").length)
      bd.style.fontSize = Math.min((band.bottom - band.top) * 0.95, (w * 0.92) / (chars * 0.56)) + "px"
      bd.style.top = (band.top + band.bottom) / 2 + "px"
    }
    const img = imgRef.current
    if (img) {
      img.style.left = rect.x + "px"
      img.style.top = rect.y + "px"
      img.style.width = rect.w + "px"
      img.style.height = rect.h + "px"
    }
    const hintEl = hintRef.current
    if (hintEl) {
      // the portrait phone sculpture runs into the copy: no room for the cue there
      hintEl.style.display = mob && aspectRef.current < 1.3 ? "none" : ""
      hintEl.style.left = clamp(rect.x + rect.w / 2, 80, w - 80) + "px"
      hintEl.style.top = Math.min(rect.y + rect.h * 0.95, band.bottom - 20) + "px"
    }
    engineRef.current?.resize(w, h, rect)
  }, [])

  // engine lifecycle (re-created only when the image changes)
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    // a fresh canvas per engine: a released WebGL context can never be reused
    const canvas = document.createElement("canvas")
    canvas.className = "sh-canvas"
    stage.appendChild(canvas)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)")
    setIsTouch(coarse.matches)
    let engine: LiquidEngine | null = null
    const fail = () => {
      root.dataset.gl = "off"
    }
    try {
      engine = new LiquidEngine(canvas, optsRef.current(mq.matches), fail)
      engineRef.current = engine
    } catch {
      fail()
    }

    const ro = new ResizeObserver(() => relayout())
    ro.observe(root)
    // the band moves when fonts load or the copy reflows
    if (navRef.current) ro.observe(navRef.current)
    if (contentRef.current) ro.observe(contentRef.current)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) engine?.setVisible(e.isIntersecting && !document.hidden)
    })
    io.observe(root)
    const onVis = () => engine?.setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    const onMq = () => engine?.setOptions({ reducedMotion: mq.matches })
    mq.addEventListener?.("change", onMq)

    const pos = (e: PointerEvent) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top] as const
    }
    let touched = false
    const markTouched = () => {
      if (!touched) {
        touched = true
        root.dataset.touched = "1"
      }
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = pos(e)
      const touch = e.pointerType === "touch"
      if (touch && e.buttons === 0 && e.pressure === 0) return
      engine?.pointer("move", x, y, touch)
      markTouched()
    }
    const onDown = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("down", x, y, e.pointerType === "touch")
      markTouched()
    }
    const onUp = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("up", x, y, e.pointerType === "touch")
    }
    const onLeave = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("leave", x, y, e.pointerType === "touch")
    }
    root.addEventListener("pointermove", onMove, { passive: true })
    root.addEventListener("pointerdown", onDown, { passive: true })
    root.addEventListener("pointerup", onUp, { passive: true })
    root.addEventListener("pointercancel", onUp, { passive: true })
    root.addEventListener("pointerleave", onLeave, { passive: true })

    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      mq.removeEventListener?.("change", onMq)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("pointerleave", onLeave)
      engine?.destroy()
      engineRef.current = null
      canvas.remove()
      delete root.dataset.gl
    }
  }, [relayout])

  // (re)load the sculpture whenever the theme or layout asks for another image;
  // the canvas dips out while the static image covers the swap
  React.useEffect(() => {
    const root = rootRef.current
    const engine = engineRef.current
    if (!root) return
    let cancelled = false
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.decoding = "async"
    const swapping = root.dataset.gl === "on"
    if (swapping) root.dataset.swap = "1"
    image.onload = () => {
      if (cancelled) return
      aspectRef.current = image.naturalWidth / image.naturalHeight || aspectRef.current
      relayout()
      if (engine && root.dataset.gl !== "off") {
        try {
          engine.onFirstFrame = () => {
            if (cancelled) return
            root.dataset.gl = "on"
            delete root.dataset.swap
          }
          engine.setImage(image)
          relayout()
        } catch {
          root.dataset.gl = "off"
        }
      } else delete root.dataset.swap
    }
    image.onerror = () => {
      delete root.dataset.swap
    }
    // let the fade-out start before the GPU upload
    const t = window.setTimeout(() => (image.src = activeSrc), swapping ? 280 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
      image.onload = null
      image.onerror = null
    }
  }, [activeSrc, relayout])

  // live option updates without re-creating the engine
  React.useEffect(() => {
    const e = engineRef.current
    if (!e) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    e.setOptions(optsRef.current(rm))
  }, [interactive, strength, radius, particleDensity, dotSize, particleSpread, turbulence, liquid, streaks, restStyle, returnSpeed, ambient, ambientIntensity, speed, intro, bgRgb, imgBgRgb])

  React.useEffect(() => {
    relayout()
  }, [sculptureScale, mobileSculptureScale, sculptureX, sculptureY, relayout])

  const vars = {
    "--sh-bg": background,
    "--sh-fg": fg,
    "--sh-acc": acc,
    "--sh-head": headingFont,
    "--sh-accent": accentFont,
    "--sh-body": bodyFont,
    "--sh-h": height,
  } as React.CSSProperties

  const hintText = isTouch ? hintTouch : hint

  return (
    <section ref={rootRef} className={"sh-root" + (className ? " " + className : "")} style={{ ...vars, ...style }}>
      <style>{CSS}</style>
      {backdropText ? (
        <div ref={backdropRef} className="sh-backdrop" aria-hidden="true">
          {backdropText}
        </div>
      ) : null}
      <div ref={stageRef} className="sh-stage" aria-hidden="true">
        <img ref={imgRef} className="sh-fallback" src={activeSrc} alt="" crossOrigin="anonymous" draggable={false} />
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{imageAlt}</span>

      {showNav && (
        <nav ref={navRef} className="sh-nav" aria-label="Primary">
          <a className="sh-brand" href="#">
            {brand}
          </a>
          <ul className="sh-links">
            {navLinks.map((l, i) => (
              <li key={i}>
                <a className="sh-link" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
            {themeToggle && (
              <li className="sh-keep">
                <button
                  type="button"
                  className="sh-theme"
                  aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                >
                  {mode === "dark" ? <SunIcon /> : <MoonIcon />}
                </button>
              </li>
            )}
            {navCta && navCta.label && (
              <li className="sh-keep">
                <a className="sh-navcta" href={navCta.href}>
                  {navCta.label}
                </a>
              </li>
            )}
          </ul>
        </nav>
      )}

      {interactive && hintText ? (
        <div ref={hintRef} className="sh-hint" aria-hidden="true">
          {hintText}
        </div>
      ) : null}

      <div className="sh-spacer" />

      <div ref={contentRef} className="sh-content">
        <div>
          {eyebrow ? <p className="sh-eyebrow">{eyebrow}</p> : null}
          <h1 className="sh-h1">{renderHeadline(headline, headlineAccent)}</h1>
        </div>
        <div className="sh-aside">
          {body ? <p className="sh-body">{body}</p> : null}
          <div className="sh-ctas">
            {primaryCta && primaryCta.label ? (
              <a className="sh-btn" href={primaryCta.href}>
                {primaryCta.label}
                <Arrow />
              </a>
            ) : null}
            {secondaryCta && secondaryCta.label ? (
              <a className="sh-txt" href={secondaryCta.href}>
                {secondaryCta.label}
                <Arrow />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {showCredit && (
        <a className="sh-credit" href="https://guglielmogiannattasio.it" target="_blank" rel="noopener">
          by guglielmogiannattasio.it
        </a>
      )}
    </section>
  )
}

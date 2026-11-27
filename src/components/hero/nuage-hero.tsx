import * as React from "react"
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { Menu, X } from "lucide-react"
import { HeroPhoto } from "@/components/hero/hero-photo"
import { ExploreMenuButton, OrderNowButton } from "@/components/hero/hero-buttons"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const NAV_LINKS = [
  { label: "Menu", href: "#menu" },
  { label: "Collections", href: "#collections" },
  { label: "Our Story", href: "#story" },
  { label: "Contact", href: "#contact" },
]

/** deterministic pseudo-random, so particles are identical on every render */
const rand = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 * salt + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

/* ── photographic layers ─────────────────────────────────────────────── */

type Layer = {
  name: string
  alt?: string
  /** box in % of the stage */
  left: number
  top: number
  width: number
  rotate: number
  /** parallax depth in px at full cursor travel; negative = background */
  depth: number
  z: number
  /** out-of-focus foreground / background */
  blur?: number
  /** entrance: "rise" (hero subject), "pour" (revealed top-down), "burst" (thrown from the croissant) */
  enter: "rise" | "pour" | "burst"
  delay: number
  float?: number
  placeholderAspect?: number
}

// the point everything bursts out of: the heart of the croissant
const ORIGIN = { x: 50, y: 58 }

const LAYERS: Layer[] = [
  {
    name: "chocolate",
    alt: "Molten dark chocolate pouring in a glossy ribbon",
    left: 44, top: -6, width: 52, rotate: 4, depth: -14, z: 10,
    enter: "pour", delay: 0.35, placeholderAspect: 0.75,
  },
  {
    name: "croissant",
    alt: "A golden, flaky butter croissant",
    left: 4, top: 30, width: 92, rotate: -6, depth: 12, z: 20,
    enter: "rise", delay: 0.2, placeholderAspect: 1.7,
  },
  { name: "raspberry-a", left: 3, top: 16, width: 15, rotate: -14, depth: 30, z: 30, enter: "burst", delay: 1.15, float: 7 },
  { name: "raspberry-b", left: 80, top: 68, width: 13, rotate: 20, depth: 40, z: 30, enter: "burst", delay: 1.25, float: 8.5 },
  { name: "raspberry-c", left: 26, top: 86, width: 10, rotate: -30, depth: 58, z: 40, blur: 2.5, enter: "burst", delay: 1.35, float: 6.5 },
  { name: "flake-a", left: 81, top: 15, width: 20, rotate: 18, depth: 26, z: 30, enter: "burst", delay: 1.1, float: 9 },
  { name: "flake-b", left: 5, top: 86, width: 17, rotate: -14, depth: 46, z: 30, enter: "burst", delay: 1.2, float: 7.5 },
  { name: "flake-c", left: 15, top: 2, width: 14, rotate: -12, depth: 20, z: 30, blur: 1.2, enter: "burst", delay: 1.3, float: 10 },
]

const IMG_SIZES = (w: number) => `(min-width: 1024px) ${Math.round(w * 0.55)}vw, ${Math.round(w * 0.95)}vw`

function PhotoLayer({ l, px, py, reduce }: { l: Layer; px: MotionValue<number>; py: MotionValue<number>; reduce: boolean }) {
  const x = useTransform(px, (v) => v * l.depth)
  const y = useTransform(py, (v) => v * l.depth)

  // burst items start at the croissant's heart (in % of the full-stage wrapper)
  const fromX = `${ORIGIN.x - (l.left + l.width / 2)}%`
  const fromY = `${ORIGIN.y - (l.top + l.width / 2)}%`

  const wrapEnter =
    l.enter === "burst" && !reduce
      ? { initial: { x: fromX, y: fromY }, animate: { x: "0%", y: "0%" } }
      : { initial: false as const, animate: undefined }

  const itemEnter = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : l.enter === "rise"
      ? {
          initial: { opacity: 0, y: "18%", scale: 1.14, rotate: l.rotate + 4, filter: "blur(18px) brightness(0.35)" },
          animate: { opacity: 1, y: "0%", scale: 1, rotate: l.rotate, filter: "blur(0px) brightness(1)" },
        }
      : l.enter === "pour"
        ? {
            initial: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", y: "-6%", rotate: l.rotate },
            animate: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", y: "0%", rotate: l.rotate },
          }
        : {
            initial: { opacity: 0, scale: 0.2, rotate: l.rotate - 220, filter: "blur(10px)" },
            animate: { opacity: 1, scale: 1, rotate: l.rotate, filter: `blur(${l.blur ?? 0}px)` },
          }

  const itemTransition =
    l.enter === "burst"
      ? { delay: l.delay, type: "spring" as const, stiffness: 55, damping: 12, mass: 0.9 }
      : { delay: l.delay, duration: l.enter === "pour" ? 2 : 1.8, ease: EASE }

  return (
    <motion.div aria-hidden={!l.alt} className="pointer-events-none absolute inset-0" style={{ x, y, zIndex: l.z }}>
      <motion.div
        className="absolute inset-0"
        initial={wrapEnter.initial}
        animate={wrapEnter.animate}
        transition={{ delay: l.delay, type: "spring", stiffness: 55, damping: 12, mass: 0.9 }}
      >
        <motion.div
          className="absolute"
          style={{ left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%` }}
          initial={itemEnter.initial}
          animate={itemEnter.animate}
          transition={itemTransition}
        >
          <motion.div
            animate={
              reduce || !l.float
                ? undefined
                : { y: [0, -10, 0], rotate: [0, l.rotate > 0 ? 5 : -5, 0] }
            }
            transition={{ delay: l.delay + 1.4, duration: l.float, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              l.name === "croissant"
                ? "drop-shadow-[0_40px_45px_rgba(0,0,0,0.6)]"
                : "drop-shadow-[0_18px_22px_rgba(0,0,0,0.55)]"
            )}
          >
            <HeroPhoto
              name={l.name}
              alt={l.alt}
              sizes={IMG_SIZES(l.width)}
              priority={l.name === "croissant"}
              placeholderAspect={l.placeholderAspect}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

/* ── gold dust ───────────────────────────────────────────────────────── */

const BURST = Array.from({ length: 34 }, (_, i) => {
  const ang = rand(i, 1.3) * Math.PI * 2
  const dist = 18 + rand(i, 2.1) * 42 // % of the stage
  return {
    dx: Math.cos(ang) * dist,
    dy: Math.sin(ang) * dist * 0.8 - 6, // bias upward, like heat rising
    size: 2 + rand(i, 3.7) * 4.5,
    crumb: rand(i, 5.3) > 0.72,
    dur: 1.6 + rand(i, 4.4) * 1.4,
    delay: rand(i, 6.6) * 0.25,
    blur: rand(i, 7.2) > 0.75,
  }
})

const DUST = Array.from({ length: 12 }, (_, i) => ({
  left: 8 + rand(i, 8.1) * 84,
  top: 10 + rand(i, 9.4) * 80,
  size: 1.5 + rand(i, 10.2) * 2.5,
  dur: 12 + rand(i, 11.9) * 10,
  delay: rand(i, 12.5) * 6,
}))

function GoldBurst({ play, at }: { play: number; at: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[35]" key={play}>
      {BURST.map((p, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ x: "0%", y: "0%" }}
          animate={{ x: `${p.dx}%`, y: `${p.dy}%` }}
          transition={{ delay: at + p.delay, duration: p.dur, ease: [0.12, 0.8, 0.3, 1] }}
        >
          <motion.span
            className={cn(
              "absolute",
              p.crumb
                ? "rounded-[2px] bg-gradient-to-br from-[#E9B36A] to-[#8C5222]"
                : "rounded-full bg-[radial-gradient(circle,#FFF4D6_0%,#E5C98F_45%,rgba(217,192,143,0)_75%)] shadow-[0_0_8px_2px_rgba(239,223,186,0.35)]",
              p.blur && "blur-[1.5px]"
            )}
            style={{
              left: `${ORIGIN.x}%`,
              top: `${ORIGIN.y}%`,
              width: p.crumb ? p.size * 1.2 : p.size,
              height: p.crumb ? p.size * 0.7 : p.size,
            }}
            initial={{ opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 0.6], rotate: p.crumb ? 260 : 0 }}
            transition={{ delay: at + p.delay, duration: p.dur, times: [0, 0.12, 0.6, 1], ease: "easeOut" }}
          />
        </motion.div>
      ))}
    </div>
  )
}

function AmbientDust() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] motion-reduce:hidden">
      {DUST.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-champagne-light"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size }}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 0.55, 0], y: [0, -60, -120] }}
          transition={{ delay: 2 + d.delay, duration: d.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  )
}

/* ── headline ────────────────────────────────────────────────────────── */

// champagne gradient across the word, one stop per letter (background-clip:text
// can't paint through letters that are being transformed/blurred)
const STOPS: [number, number, number][] = [
  [246, 234, 208],
  [217, 192, 143],
  [184, 149, 94],
  [239, 223, 186],
]
function gradientAt(t: number) {
  const seg = Math.min(STOPS.length - 2, Math.floor(t * (STOPS.length - 1)))
  const k = t * (STOPS.length - 1) - seg
  const [a, b] = [STOPS[seg], STOPS[seg + 1]]
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",")})`
}

function Letters({ text, delay }: { text: string; delay: number }) {
  const chars = Array.from(text)
  return (
    <span aria-hidden="true" className="inline-block">
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={{ color: gradientAt(chars.length > 1 ? i / (chars.length - 1) : 0) }}
          initial={{ opacity: 0, y: "0.35em", filter: "blur(12px)" }}
          animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.065, duration: 1.1, ease: EASE }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

/* ── hero ────────────────────────────────────────────────────────────── */

export default function NuageHero() {
  const reduce = !!useReducedMotion()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [burst, setBurst] = React.useState(0)

  // cursor position, -1…1 across the hero, eased
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const px = useSpring(rawX, { stiffness: 40, damping: 16, mass: 0.8 })
  const py = useSpring(rawY, { stiffness: 40, damping: 16, mass: 0.8 })
  const tiltX = useTransform(py, (v) => v * -4)
  const tiltY = useTransform(px, (v) => v * 5)
  const lightX = useTransform(px, (v) => `${64 + v * 6}%`)
  const lightY = useTransform(py, (v) => `${40 + v * 5}%`)
  const keyLight = useTransform(
    [lightX, lightY],
    ([lx, ly]) =>
      `radial-gradient(42% 46% at ${lx} ${ly}, rgba(233,196,140,0.26), rgba(168,110,60,0.10) 45%, transparent 72%)`
  )

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== "mouse") return
    const r = e.currentTarget.getBoundingClientRect()
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1)
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }
  const onPointerLeave = () => {
    rawX.set(0)
    rawY.set(0)
  }

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="NUAGE Pâtisserie"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-chocolate font-sans text-cream"
      >
        {/* ── lighting ── */}
        <motion.div aria-hidden="true" className="absolute inset-0 -z-20" style={{ backgroundImage: keyLight }} />
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 -z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.6, ease: "easeOut" }}
          style={{
            background:
              "linear-gradient(115deg, transparent 38%, rgba(239,223,186,0.05) 52%, transparent 66%), radial-gradient(70% 60% at 15% 100%, rgba(42,26,18,0.9), transparent 70%), radial-gradient(130% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay" />

        {/* ── nav ── */}
        <motion.header
          className="relative z-50 px-5 pt-5 sm:px-8 lg:px-12 lg:pt-7"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 1, ease: EASE }}
        >
          <nav aria-label="Primary" className="mx-auto flex max-w-[1400px] items-center justify-between gap-6">
            <a
              href="#"
              aria-label="NUAGE Pâtisserie, home"
              className="group flex cursor-pointer flex-col items-start outline-none focus-visible:ring-1 focus-visible:ring-champagne focus-visible:ring-offset-8 focus-visible:ring-offset-chocolate"
            >
              <span className="-mr-[0.62em] font-sans text-[17px] font-extralight tracking-[0.62em] text-cream sm:text-[19px]">
                NUAGE
              </span>
              <span className="mt-1 -mr-[0.58em] font-sans text-[8.5px] font-normal tracking-[0.58em] text-champagne sm:text-[9px]">
                PÂTISSERIE
              </span>
            </a>

            <ul className="hidden items-center gap-10 lg:flex">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="group relative cursor-pointer py-2 text-[12px] font-normal tracking-[0.26em] text-cream/70 uppercase transition-colors duration-300 outline-none hover:text-cream focus-visible:text-cream"
                  >
                    {l.label}
                    <span className="absolute inset-x-0 bottom-0 h-px origin-center scale-x-0 bg-champagne transition-transform duration-500 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <OrderNowButton compact delay={0.4} className="hidden sm:inline-flex" />
              <button
                type="button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="nuage-menu"
                onClick={() => setMenuOpen((o) => !o)}
                className="grid size-11 cursor-pointer place-items-center border border-champagne/30 text-cream transition-colors duration-300 outline-none hover:border-champagne focus-visible:border-champagne lg:hidden"
              >
                {menuOpen ? <X className="size-5" strokeWidth={1.25} aria-hidden="true" /> : <Menu className="size-5" strokeWidth={1.25} aria-hidden="true" />}
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                id="nuage-menu"
                className="absolute inset-x-5 top-[calc(100%+0.75rem)] border border-champagne/15 bg-cocoa/95 p-6 shadow-2xl backdrop-blur-xl sm:inset-x-8 lg:hidden"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                <ul className="flex flex-col">
                  {NAV_LINKS.map((l) => (
                    <li key={l.href} className="border-b border-champagne/10 last:border-0">
                      <a
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-14 cursor-pointer items-center font-display text-3xl font-light italic transition-colors hover:text-champagne focus-visible:text-champagne focus-visible:outline-none"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <OrderNowButton className="mt-5 w-full sm:hidden" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* ── body ── */}
        <div className="relative mx-auto grid w-full max-w-[1400px] flex-1 items-center px-5 pt-2 pb-12 sm:px-8 md:pb-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-12 lg:pb-10">
          {/* stage */}
          <div className="relative order-first mx-auto w-full max-w-[560px] [perspective:1400px] md:max-w-[680px] lg:order-last lg:max-w-none lg:-mr-[6%] lg:ml-[-10%]">
            <motion.div
              className="relative aspect-square w-full cursor-pointer [transform-style:preserve-3d]"
              style={{ rotateX: tiltX, rotateY: tiltY }}
              onPointerDown={() => !reduce && setBurst((b) => b + 1)}
            >
              {/* contact shadow under the croissant */}
              <motion.div
                aria-hidden="true"
                className="absolute top-[74%] left-[14%] z-[15] h-[9%] w-[72%] rounded-[50%] bg-black/70 blur-2xl"
                initial={{ opacity: 0, scaleX: 0.5 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.6, duration: 1.8, ease: EASE }}
              />
              <AmbientDust />
              {LAYERS.map((l) => (
                <PhotoLayer key={l.name} l={l} px={px} py={py} reduce={reduce} />
              ))}
              {!reduce && <GoldBurst play={burst} at={burst === 0 ? 1.05 : 0} />}
            </motion.div>
          </div>

          {/* copy */}
          <div className="relative z-40 -mt-4 text-center sm:-mt-8 lg:mt-0 lg:text-left">
            <motion.p
              className="mb-6 flex items-center justify-center gap-4 text-[10.5px] font-normal tracking-[0.42em] text-champagne uppercase sm:text-[11.5px] lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1.2 }}
            >
              <motion.span
                aria-hidden="true"
                className="h-px w-10 origin-left bg-champagne/70"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 1.2, ease: EASE }}
              />
              Pâtisserie Européenne · Patna
            </motion.p>

            <h1 className="font-display text-cream">
              <span className="sr-only">A Taste of the Uncommon</span>
              <span aria-hidden="true" className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="block text-[clamp(2.1rem,7.4vw,3.6rem)] leading-[1] font-light tracking-[0.01em] md:text-[clamp(3rem,6vw,4.4rem)] lg:text-[clamp(2.8rem,4.2vw,4.6rem)]"
                  initial={{ y: "105%" }}
                  animate={{ y: "0%" }}
                  transition={{ delay: 0.6, duration: 1.2, ease: EASE }}
                >
                  A Taste of the
                </motion.span>
              </span>
              <span className="-mt-[0.06em] block pr-[0.08em] text-[clamp(4.1rem,22vw,8.5rem)] leading-[0.9] font-normal tracking-[-0.015em] italic drop-shadow-[0_6px_30px_rgba(217,192,143,0.18)] md:text-[clamp(6rem,15vw,10rem)] lg:text-[clamp(5.4rem,10.2vw,11rem)]">
                <Letters text="Uncommon" delay={0.85} />
              </span>
            </h1>

            <motion.p
              className="mx-auto mt-7 max-w-[30rem] text-[16px] leading-[1.75] font-light text-cream/75 sm:text-[17px] lg:mx-0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.45, duration: 1, ease: EASE }}
            >
              Butter-laminated croissants, glossy dark chocolate and bright raspberries — European pâtisserie, crafted
              in Patna and ordered online.
            </motion.p>

            <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center lg:justify-start">
              <OrderNowButton delay={1.7} />
              <ExploreMenuButton delay={1.85} />
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  )
}

import { motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Champagne-gold primary CTA. A light sheen sweeps across once after it lands
 * and again on every hover; the arrow's stem lengthens toward the click.
 */
export function OrderNowButton({
  href = "#order",
  delay = 0,
  compact = false,
  className,
}: {
  href?: string
  delay?: number
  compact?: boolean
  className?: string
}) {
  const reduce = useReducedMotion()
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.9, ease: EASE }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative isolate inline-flex cursor-pointer items-center justify-center overflow-hidden font-sans font-medium tracking-[0.28em] text-chocolate uppercase",
        "bg-[linear-gradient(135deg,#F3E4C2_0%,#D9C08F_45%,#B8955E_100%)] outline-none",
        "shadow-[0_14px_40px_-14px_rgba(217,192,143,0.65)] transition-shadow duration-500 hover:shadow-[0_20px_55px_-12px_rgba(217,192,143,0.85)]",
        "focus-visible:ring-1 focus-visible:ring-champagne-light focus-visible:ring-offset-4 focus-visible:ring-offset-chocolate",
        compact ? "h-11 gap-3 px-5 text-[11px]" : "h-14 gap-4 px-8 text-[12px] sm:h-[60px] sm:px-10 sm:text-[13px]",
        className
      )}
    >
      {/* one-off sheen after the entrance */}
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
          initial={{ x: "-150%" }}
          animate={{ x: "420%" }}
          transition={{ delay: delay + 0.9, duration: 1.4, ease: "easeInOut" }}
        />
      )}
      {/* hover sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 -translate-x-[150%] -skew-x-[20deg] bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-[420%] group-focus-visible:translate-x-[420%] motion-reduce:hidden"
      />
      <span className="pl-[0.28em]">Order Now</span>
      <span aria-hidden="true" className="flex items-center">
        <span className="h-px w-6 origin-left bg-current transition-transform duration-500 ease-out group-hover:scale-x-150" />
        <ChevronRight className="-ml-2.5 size-4 transition-transform duration-500 ease-out group-hover:translate-x-3" strokeWidth={1.5} />
      </span>
    </motion.a>
  )
}

/** Hairline-bordered secondary CTA; a champagne wash rises on hover. */
export function ExploreMenuButton({ href = "#menu", delay = 0 }: { href?: string; delay?: number }) {
  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.9, ease: EASE }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative isolate inline-flex h-14 cursor-pointer items-center justify-center gap-3 overflow-hidden border border-champagne/45 px-8 font-sans text-[12px] font-medium tracking-[0.28em] text-cream uppercase outline-none sm:h-[60px] sm:px-10 sm:text-[13px]",
        "transition-[color,border-color] duration-500 hover:border-champagne hover:text-champagne-light",
        "focus-visible:border-champagne focus-visible:text-champagne-light focus-visible:ring-1 focus-visible:ring-champagne-light focus-visible:ring-offset-4 focus-visible:ring-offset-chocolate"
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-gradient-to-t from-champagne/20 to-champagne/[0.04] transition-transform duration-500 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />
      <span className="pl-[0.28em]">Explore the Menu</span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-4 transition-transform duration-500 ease-out group-hover:rotate-45"
        strokeWidth={1.5}
      />
    </motion.a>
  )
}

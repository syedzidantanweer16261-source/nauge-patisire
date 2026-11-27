import manifest from "@/components/hero/nuage-assets.json"
import { cn } from "@/lib/utils"

type Asset = { width: number; height: number; widths: number[] }
const ASSETS = manifest as Record<string, Asset>

/**
 * A locally stored, pre-optimised photograph (see scripts/optimize-hero-images.mjs).
 * Serves AVIF/WebP at the right width. If the photo hasn't been supplied yet it
 * renders nothing in production, and a labelled outline in development.
 */
export function HeroPhoto({
  name,
  alt = "",
  sizes,
  priority = false,
  placeholderAspect = 1,
  className,
}: {
  name: string
  alt?: string
  /** CSS sizes hint, e.g. "(min-width: 1024px) 50vw, 90vw" */
  sizes: string
  /** the hero's main subject: fetched eagerly with high priority (LCP) */
  priority?: boolean
  placeholderAspect?: number
  className?: string
}) {
  const a = ASSETS[name]
  if (!a) {
    if (!import.meta.env.DEV) return null
    return (
      <div
        style={{ aspectRatio: placeholderAspect }}
        className={cn(
          "grid w-full place-items-center rounded-[40%] border border-dashed border-champagne/35 text-center text-[10px] tracking-[0.25em] text-champagne/55 uppercase",
          className
        )}
      >
        {name}
      </div>
    )
  }
  const srcSet = (ext: "avif" | "webp") => a.widths.map((w) => `/hero/nuage/${name}-${w}.${ext} ${w}w`).join(", ")
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={`/hero/nuage/${name}-${a.widths[a.widths.length - 1]}.webp`}
        width={a.width}
        height={a.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        className={cn("block h-auto w-full select-none", className)}
      />
    </picture>
  )
}

/**
 * Optimises the NUAGE hero photographs.
 *
 *   npm run images            (reads assets/hero-src, writes public/hero/nuage)
 *
 * Drop high-resolution originals into assets/hero-src/ using the names below
 * (any of .png .webp .avif .tif .jpg). Cut-outs must keep their transparent
 * background. Each one is trimmed, resized to 640/1280/1920px wide and saved as
 * AVIF + WebP; a manifest with sizes is written for the hero, so a missing
 * photo simply isn't rendered (no 404s, no layout shift).
 */
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

export const ASSETS = [
  "croissant",
  "chocolate",
  "raspberry-a",
  "raspberry-b",
  "raspberry-c",
  "flake-a",
  "flake-b",
  "flake-c",
]
const WIDTHS = [640, 1280, 1920]

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : fallback
}
const SRC = path.resolve(arg("--src", "assets/hero-src"))
const OUT = path.resolve(arg("--out", "public/hero/nuage"))
const MANIFEST = path.resolve(arg("--manifest", "src/components/hero/nuage-assets.json"))

const files = await readdir(SRC).catch(() => [])
await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const manifest = {}
for (const name of ASSETS) {
  const file = files.find((f) => path.parse(f).name.toLowerCase() === name && /\.(png|webp|avif|tiff?|jpe?g)$/i.test(f))
  if (!file) {
    console.warn(`  missing  ${name}`)
    continue
  }
  // trim transparent padding so layout percentages describe the subject itself
  const base = sharp(path.join(SRC, file), { limitInputPixels: 2 ** 28 }).rotate().trim({ threshold: 4 })
  const { data, info } = await base.png().toBuffer({ resolveWithObject: true })
  const meta = await sharp(data).metadata()
  if (!meta.hasAlpha) console.warn(`  note     ${name} has no transparency (expected a cut-out)`)
  const widths = WIDTHS.filter((w) => w <= info.width)
  if (!widths.length || widths.at(-1) < info.width) widths.push(Math.min(info.width, WIDTHS.at(-1)))
  const uniq = [...new Set(widths)].sort((a, b) => a - b)
  for (const w of uniq) {
    const img = sharp(data).resize({ width: w, withoutEnlargement: true })
    await img.clone().avif({ quality: 58, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`))
    await img.clone().webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`))
  }
  manifest[name] = { width: info.width, height: info.height, widths: uniq }
  console.log(`  ok       ${name}  ${info.width}x${info.height}  -> ${uniq.join(", ")}`)
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n")
console.log(`\n${Object.keys(manifest).length}/${ASSETS.length} photos ready. Manifest: ${path.relative(process.cwd(), MANIFEST)}`)

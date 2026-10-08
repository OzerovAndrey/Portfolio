// Спільне для рендера скрінів: Chromium (Playwright), локальна збірка демо на справжньому origin, шрифти демо з @fontsource
// (Google Fonts у CI/контейнері недоступні — CSS-запит підміняється локальними woff2), збереження у WebP.
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const siteRequire = createRequire(resolve(ROOT, "site/package.json"));
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "/opt/node22/lib/node_modules/playwright");
export const sharp = siteRequire("sharp");

const FONT_DIR = resolve(ROOT, "site/node_modules/@fontsource");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".woff": "font/woff" };
export const ORIGIN = "https://ozerovandrey.github.io";
export const DEMO = `${ORIGIN}/multibrand-design-system/`;

/** @font-face для запиту fonts.googleapis.com/css2?family=Inter:wght@400;600&family=… з локальних файлів */
function googleCss(url) {
  const out = [];
  for (const fam of new URL(url).searchParams.getAll("family")) {
    const [name, spec = ""] = fam.split(":");
    const slug = name.toLowerCase().replace(/\+|\s/g, "-");
    const weights = (spec.split("@")[1] ?? "400").split(";");
    const dir = join(FONT_DIR, slug, "files");
    if (!existsSync(dir)) continue;
    for (const w of weights) for (const sub of ["latin", "latin-ext", "cyrillic"]) {
      const f = `${slug}-${sub}-${w}-normal.woff2`;
      if (existsSync(join(dir, f)))
        out.push(`@font-face{font-family:'${name.replace(/\+/g, " ")}';font-style:normal;font-weight:${w};font-display:block;src:url(https://fonts.local/${slug}/${f}) format('woff2');}`);
    }
  }
  return out.join("\n");
}

/** Шрифт для власних сцен: <link href="https://fonts.googleapis.com/css2?family=..."> працює так само, як у демо */
export const fontLink = (...fams) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fams.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`).join("&")}">`;

export async function launch({ demoDist }) {
  if (!existsSync(join(demoDist, "index.html"))) throw new Error(`Немає збірки демо: ${demoDist} (SITE_BASE=/multibrand-design-system/ npm --prefix ../multibrand-design-system/site run build)`);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const scenes = new Map(); // шлях → html для власних сцен
  const newPage = async ({ width, height, scale = 2, scheme = "light" }) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme: scheme, reducedMotion: "reduce" });
    await ctx.route("https://fonts.googleapis.com/**", (r) => r.fulfill({ body: googleCss(r.request().url()), contentType: "text/css" }));
    await ctx.route("https://fonts.gstatic.com/**", (r) => r.abort());
    await ctx.route("https://fonts.local/**", (r) => {
      const p = join(FONT_DIR, new URL(r.request().url()).pathname.replace(/^\/([^/]+)\//, "$1/files/"));
      return existsSync(p) ? r.fulfill({ body: readFileSync(p), contentType: "font/woff2" }) : r.fulfill({ status: 404, body: "" });
    });
    await ctx.route(`${ORIGIN}/**`, (r) => {
      const u = new URL(r.request().url());
      if (scenes.has(u.pathname)) return r.fulfill({ body: scenes.get(u.pathname), contentType: "text/html" });
      if (u.pathname.startsWith("/multibrand-design-system/")) {
        let f = join(demoDist, decodeURIComponent(u.pathname.slice("/multibrand-design-system/".length)));
        if (!extname(f)) f = join(f, "index.html");
        if (existsSync(f)) return r.fulfill({ body: readFileSync(f), contentType: TYPES[extname(f)] ?? "application/octet-stream" });
      }
      return r.fulfill({ status: 404, body: "" });
    });
    await ctx.route(/umami|analytics/, (r) => r.abort());
    return ctx.newPage();
  };
  /** Власна сцена (HTML-рядок) на тому ж origin, що й демо: можна підключати CSS/картинки демо */
  const scenePage = async (name, html, opts) => {
    const path = `/__scene/${name}.html`;
    scenes.set(path, html);
    const p = await newPage(opts);
    await p.goto(`${ORIGIN}${path}`, { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
    return p;
  };
  return { browser, newPage, scenePage, close: () => browser.close() };
}

/** Знімок у WebP (q 92) за шляхом із маніфесту; повертає байти */
export async function save(buf, file) {
  const out = resolve(ROOT, "site/src/assets", file);
  mkdirSync(dirname(out), { recursive: true });
  const info = await sharp(buf).webp({ quality: 92, effort: 5 }).toFile(out);
  return info.size;
}

/** Демо-збірка: CSS-файл з ассетів (для сцен-специменів на справжніх стилях демо) */
export const demoCssHref = (demoDist) => {
  const css = readdirSync(join(demoDist, "assets")).find((f) => f.endsWith(".css"));
  return `${DEMO}assets/${css}`;
};

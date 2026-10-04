// QA-скріни Home і /approach: 1440 і 390, EN і UK, light і dark. Запуск: node qa/shots.mjs (потрібен `npm --prefix site run preview`)
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "/opt/node22/lib/node_modules/playwright");
const BASE = process.env.BASE ?? "http://localhost:4321/Portfolio";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const errors = [];
for (const [w, h] of [[1440, 900], [390, 844]])
  for (const lang of ["en", "uk"])
    for (const scheme of ["light", "dark"])
      for (const page of ["", "approach"]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
        const p = await ctx.newPage();
        p.on("pageerror", (e) => errors.push(`${lang}/${page} ${w}: ${e.message}`));
        p.on("console", (m) => { if (m.type() === "error") errors.push(`${lang}/${page} ${w}: ${m.text()}`); });
        await p.goto(`${BASE}/${lang}/${page}${page ? "/" : ""}`, { waitUntil: "networkidle" });
        // прокрутка, щоб спрацювали reveal і lazy
        const H = await p.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < H; y += h / 2) { await p.evaluate((yy) => scrollTo({ top: yy, behavior: "instant" }), y); await p.waitForTimeout(120); }
        await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await p.waitForTimeout(500);
        await p.screenshot({ path: `${w}-${lang}-${scheme}-${page || "home"}.png`, fullPage: true });
        const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (over > 0) errors.push(`${lang}/${page} ${w} ${scheme}: горизонтальний скрол +${over}px`);
        await ctx.close();
      }
await browser.close();
console.log(errors.length ? errors.join("\n") : "✓ без помилок консолі та горизонтального скролу");

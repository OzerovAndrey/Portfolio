#!/usr/bin/env node
// Стилі сайту: тільки var(--…) токенів. Ловить hex-кольори, px-значення, font-family і font-size без var(),
// тривалості (ms/s), easing (cubic-bezier, ease-*), blur() і rgba()/hsla().
// Винятки: рядки з @media (брейкпоінти) і рядки з коментарем /* allow: причина */.
// Сканує .css і <style>-блоки .astro у site/src; згенеровані файли пропускає.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "site/src");
const SKIP = [/tokens\.generated\.css$/, /[\\/]generated[\\/]/];

const walk = (d) => readdirSync(d).flatMap((n) => { const p = resolve(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(SRC).filter((p) => [".css", ".astro"].includes(extname(p)) && !SKIP.some((r) => r.test(p)));

const RULES = [
  [/#[0-9a-fA-F]{3,8}\b/, "hex-колір — візьми токен"],
  [/(?<![\w-])\d*\.?\d+px\b/, "px-значення — візьми токен (space/size/borderWidth…)"],
  [/font-family\s*:/, "font-family — тільки через text styles ts-*"],
  [/font-size\s*:(?!\s*var\()/, "font-size без var() — тільки text styles ts-* або токен"],
  [/(?<![\w-])\d*\.?\d+m?s\b/, "тривалість — токен motion.duration.*"],
  [/cubic-bezier\(|(?<![\w-])ease(-in|-out|-in-out)?(?![\w-])/, "easing — токен motion.easing.*"],
  [/(?<![\w-])blur\(/, "blur() — токен glass.backdropFilter"],
  [/(?<![\w-])(rgba?|hsla?)\(/, "rgba/hsla — прозорість тільки з альфа-рампи (tokens/site/map.json)"],
];

const errors = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  // у .astro перевіряємо тільки вміст <style>…</style>
  let inStyle = extname(file) === ".css";
  lines.forEach((line, i) => {
    if (extname(file) === ".astro") {
      if (/<style\b/.test(line)) { inStyle = true; return; }
      if (/<\/style>/.test(line)) { inStyle = false; return; }
    }
    if (!inStyle || /@media/.test(line) || /\/\*\s*allow:/.test(line)) return;
    const code = line.replace(/\/\*.*?\*\//g, "");
    for (const [re, msg] of RULES) if (re.test(code)) errors.push(`${relative(ROOT, file)}:${i + 1}  ${msg}\n    ${line.trim()}`);
  });
}

if (errors.length) {
  console.error(`✗ check-styles: ${errors.length} порушень\n\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✓ check-styles: ${files.length} файлів, порушень немає`);

#!/usr/bin/env node
// Portfolio (copied from multibrand-design-system/tools/build-css.mjs, params patch demo-01) — tokens (Token Studio JSON) → CSS custom properties + manifest.
// Chain in CSS mirrors the token architecture: core → brand → map → theme → components,
// every alias stays a var() reference so the browser resolves brand/theme at runtime.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// CLI (all optional; defaults = demo site):
//   --tokens <dir>               token root (default ../tokens)
//   --brand-file <name>=<path>   extra brand set outside the repo, repeatable (e.g. site=../tokens/brand/site.json)
//   --brands <a,b,…>             brands to emit (default: site + every --brand-file)
//   --components-file <path>     extra component set appended after components.json, repeatable
//   --no-demo-components         skip tokens/components.json (consumer ships only its own components)
//   --out-css / --out-meta / --out-manifest <path>
const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const argAll = (k) => argv.flatMap((a, i) => (a === `--${k}` ? [argv[i + 1]] : []));
const arg = (k, d) => argAll(k).at(-1) ?? d;
const ROOT = resolve(arg("tokens", resolve(HERE, "..", "tokens")));
const OUT_CSS = resolve(arg("out-css", resolve(HERE, "..", "site", "src", "styles", "tokens.generated.css")));
const OUT_META = resolve(arg("out-meta", resolve(HERE, "..", "site", "src", "generated", "meta.json")));
const OUT_MANIFEST = resolve(arg("out-manifest", resolve(HERE, "..", "site", "public", "tokens-manifest.json")));
for (const f of [OUT_META, OUT_MANIFEST, OUT_CSS]) mkdirSync(dirname(f), { recursive: true });

const EXTRA_BRANDS = Object.fromEntries(argAll("brand-file").map((s) => { const [n, p] = s.split("="); return [n, resolve(p)]; }));
const BRANDS = arg("brands") ? arg("brands").split(",") : ["site", ...Object.keys(EXTRA_BRANDS)];
const THEMES = ["light", "dark"];
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && "value" in v) out.set(name, { value: v.value, type: v.type, ext: v.$extensions?.["studio.tokens"] });
    else if (v && typeof v === "object") flatten(v, name, out);
  }
  return out;
}

const core = flatten(read("core.json"));
const mapRaw = flatten(read("map.json"));
const brand = Object.fromEntries(BRANDS.map((b) => [b, flatten(EXTRA_BRANDS[b] ? JSON.parse(readFileSync(EXTRA_BRANDS[b], "utf8")) : read(`brand/${b}.json`))]));
const BRAND0 = BRANDS[0];
const theme = Object.fromEntries(THEMES.map((t) => [t, flatten(read(`theme/${t}.json`))]));
const typography = flatten(read("typography.json").typography ? { typography: read("typography.json").typography } : read("typography.json"));
const components = argv.includes("--no-demo-components") ? new Map() : flatten(read("components.json"));
for (const p of argAll("components-file")) flatten(JSON.parse(readFileSync(resolve(p), "utf8")), "", components);

const cssName = (n) => "--" + n.replace(/\./g, "-");
const isRef = (v) => typeof v === "string" && /^\{[^}]+\}$/.test(v);
const refName = (v) => v.slice(1, -1);

// ---------- colour math (Token Studio "modify", hsl space) ----------
function hexToHsl(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error("bad hex " + hex);
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return ("#" + to(r) + to(g) + to(b)).toUpperCase();
}
function modify(hex, mod) {
  const [h, s, l] = hexToHsl(hex);
  const v = parseFloat(mod.value);
  if (mod.type === "lighten") return hslToHex(h, s, l + (1 - l) * v);
  if (mod.type === "darken") return hslToHex(h, s, l * (1 - v));
  throw new Error("unsupported modify " + mod.type);
}

// ---------- resolution ----------
function formatValue(v, type) {
  if (typeof v !== "string") return String(v);
  if (["sizing", "spacing", "borderRadius", "borderWidth", "fontSizes", "lineHeights", "dimension"].includes(type) && /^-?\d+(\.\d+)?$/.test(v)) return v + "px";
  if (type === "letterSpacing" && /%$/.test(v)) return (parseFloat(v) / 100).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + "em";
  if (type === "fontFamilies") {
    const fallback = { "Montserrat": "system-ui, -apple-system, 'Segoe UI', sans-serif", "Manrope": "system-ui, -apple-system, 'Segoe UI', sans-serif", "Space Grotesk": "system-ui, -apple-system, 'Segoe UI', sans-serif", "Nunito": "system-ui, -apple-system, 'Segoe UI', sans-serif", "Unbounded": "'Arial Black', system-ui, sans-serif", "Inter": "system-ui, -apple-system, 'Segoe UI', sans-serif", "Noto Serif Display": "Georgia, 'Times New Roman', serif", "IBM Plex Mono": "ui-monospace, SFMono-Regular, Menlo, monospace" }[v] ?? "system-ui, sans-serif";
    return `'${v}', ${fallback}`;
  }
  return v;
}

// map ramps computed per brand from the brand base colours
const mapValues = {};
const mapMeta = {};
for (const b of BRANDS) {
  mapValues[b] = new Map();
  mapMeta[b] = new Map();
  for (const [name, tok] of mapRaw) {
    const base = tok.value;
    if (!isRef(base)) { mapValues[b].set(name, tok.value); continue; }
    const baseTok = brand[b].get(refName(base));
    if (!baseTok) throw new Error(`map ${name} → ${base} not found in brand ${b}`);
    let baseVal = baseTok.value;
    if (isRef(baseVal)) baseVal = core.get(refName(baseVal)).value;
    const mod = tok.ext?.modify;
    mapValues[b].set(name, mod ? modify(baseVal, mod) : baseVal);
    mapMeta[b].set(name, { base: refName(base), mod });
  }
}

// resolve a token to a final literal for a given brand × theme
function lookup(name, b, t) {
  return theme[t].get(name) ?? brand[b].get(name) ?? (mapValues[b].has(name) ? { value: mapValues[b].get(name), type: "color", literal: true } : null) ?? core.get(name) ?? null;
}
function resolveFinal(name, b, t, depth = 0) {
  if (depth > 12) throw new Error("ref cycle at " + name);
  const tok = lookup(name, b, t);
  if (!tok) throw new Error("unresolved token " + name);
  if (tok.literal) return tok.value;
  if (isRef(tok.value)) return resolveFinal(refName(tok.value), b, t, depth + 1);
  return formatValue(tok.value, tok.type);
}
const layerOf = (name, b, t) => (theme[t].has(name) ? "theme" : brand[b].has(name) ? "brand" : mapValues[b].has(name) ? "map" : "core");

// ---------- CSS emission ----------
function decl(name, tok, refOk = true) {
  const val = isRef(tok.value) && refOk ? `var(${cssName(refName(tok.value))})` : formatValue(tok.value, tok.type);
  return `  ${cssName(name)}: ${val};`;
}
const lines = [];
lines.push("/* GENERATED by tools/build-css.mjs from ../tokens — do not edit. */");
lines.push("/* core */\n:root {");
for (const [n, t] of core) lines.push(decl(n, t));
lines.push("}");
for (const b of BRANDS) {
  lines.push(`/* brand: ${b} (+ map ramps) */\n:root[data-brand="${b}"] {`);
  for (const [n, t] of brand[b]) lines.push(decl(n, t));
  for (const [n, v] of mapValues[b]) lines.push(`  ${cssName(n)}: ${v};`);
  lines.push("}");
}
for (const t of THEMES) {
  lines.push(`/* theme: ${t} */\n:root[data-theme="${t}"] {`);
  for (const [n, tok] of theme[t]) lines.push(decl(n, tok));
  lines.push("}");
}
lines.push("/* brand swatches (used by the control panel) */\n:root {");
for (const b of BRANDS) { lines.push(`  --swatch-${b}-1: ${brand[b].get("color.product1").value};`); lines.push(`  --swatch-${b}-2: ${brand[b].get("color.product2").value};`); }
lines.push("}");
lines.push("/* components */\n:root {");
for (const [n, t] of components) lines.push(decl(n, t));
lines.push("}");
// typography → utility classes
const tsNames = [...typography.keys()];
lines.push("/* typography (text styles) */");
for (const [n, t] of typography) {
  const v = t.value;
  const g = (key) => `var(${cssName(refName(v[key]))})`;
  const cls = ".ts-" + n.replace(/^typography\./, "").replace(/\./g, "-");
  lines.push(`${cls} {\n  font-family: ${g("fontFamily")};\n  font-weight: ${g("fontWeight")};\n  font-size: ${g("fontSize")};\n  line-height: ${g("lineHeight")};\n  letter-spacing: ${g("letterSpacing")};\n  text-transform: ${g("textCase")};\n}`);
}
writeFileSync(OUT_CSS, lines.join("\n") + "\n");

// ---------- manifest (for the "under the hood" diff panel) ----------
const layers = { brand: [...brand[BRAND0].keys()], map: [...mapRaw.keys()], theme: [...theme.light.keys()], components: [...components.keys()] };
const values = {};
for (const b of BRANDS) for (const t of THEMES) {
  const o = {};
  for (const n of layers.brand) o[n] = resolveFinal(n, b, t);
  for (const n of layers.map) o[n] = resolveFinal(n, b, t);
  for (const n of layers.theme) o[n] = resolveFinal(n, b, t);
  for (const [n, tok] of components) o[n] = isRef(tok.value) ? resolveFinal(refName(tok.value), b, t) : formatValue(tok.value, tok.type);
  values[`${b}|${t}`] = o;
}
const aliases = {};
for (const [n, tok] of components) if (isRef(tok.value)) aliases[n] = refName(tok.value);
const CHAIN_TOKENS = ["button.primary.bg.default", "button.borderRadius", "card.default.bg", "badge.primary.bg", "chip.selected.bg.default", "input.br.active", "gameTile.play.bg", "tournament.prize.color", "lootbox.epic.strip.bg", "progress.fill.primary.bg", "header.logo.iconColor", "avatar.borderRadius", "tab.indicator.bg", "switch.on.bg.default", "alert.info.bg", "promo.overlay.bg"];
function chainFor(name, b, t) {
  const steps = [];
  let cur = name, layer = "component", tok = components.get(name), guard = 0;
  while (tok && guard++ < 14) {
    if (isRef(tok.value)) {
      const next = refName(tok.value);
      steps.push({ name: cur, layer, ref: next });
      cur = next;
      const th = theme[t].get(cur);
      if (th) { tok = th; layer = "theme"; continue; }
      const br = brand[b].get(cur);
      if (br) { tok = br; layer = "brand"; continue; }
      if (mapValues[b].has(cur)) {
        const meta = mapMeta[b].get(cur), val = mapValues[b].get(cur);
        steps.push({ name: cur, layer: "map", ref: meta.base, note: meta.mod ? `${meta.mod.type} ${meta.mod.value} (hsl)` : "step 500 = base", value: val });
        cur = meta.base; const bt = brand[b].get(cur); steps.push({ name: cur, layer: "brand", value: formatValue(isRef(bt.value) ? core.get(refName(bt.value)).value : bt.value, bt.type) }); break;
      }
      const cr = core.get(cur); if (cr) { tok = cr; layer = "core"; continue; }
      break;
    }
    steps.push({ name: cur, layer, value: formatValue(tok.value, tok.type) });
    break;
  }
  return steps;
}
const chains = {};
for (const b of BRANDS) for (const t of THEMES) { const o = {}; for (const n of CHAIN_TOKENS) o[n] = { steps: chainFor(n, b, t), value: values[`${b}|${t}`][n] }; chains[`${b}|${t}`] = o; }
writeFileSync(OUT_MANIFEST, JSON.stringify({ layers, aliases, values, chains }));

// component counts by prefix
const compGroups = {};
for (const n of components.keys()) { const g = n.split(".")[0]; compGroups[g] = (compGroups[g] ?? 0) + 1; }
const counts = { core: core.size, brand: brand[BRAND0].size * BRANDS.length, map: mapRaw.size, theme: theme.light.size * 2, typography: typography.size, components: components.size };
counts.total = Object.values(counts).reduce((a, b) => a + b, 0);
const css = lines.join("\n");
writeFileSync(OUT_META, JSON.stringify({ counts, brandCount: BRANDS.length, comboCount: BRANDS.length * THEMES.length, componentGroups: compGroups, componentCount: Object.keys(compGroups).length, cssBytes: Buffer.byteLength(css), textStyles: tsNames.length }, null, 2));
console.log(`tokens → css: ${Buffer.byteLength(css)} bytes · total ${counts.total} tokens · ${Object.keys(compGroups).length} component groups`);

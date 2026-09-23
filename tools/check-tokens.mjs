#!/usr/bin/env node
// Portfolio tokens check: brand/site ↔ demo brand keys (tools/upstream.json), every {ref} resolves
// for site × light|dark, components read only theme/brand semantics, reserved names, WCAG contrast.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OWN = resolve(ROOT, "tokens");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && "value" in v) out.set(name, { value: v.value, type: v.type, mod: v.$extensions?.["studio.tokens"]?.modify });
    else if (v && typeof v === "object") flatten(v, name, out);
  }
  return out;
}

const core = flatten(read(resolve(OWN, "core.json")));
const map = flatten(read(resolve(OWN, "map.json")));
const theme = { light: flatten(read(resolve(OWN, "theme/light.json"))), dark: flatten(read(resolve(OWN, "theme/dark.json"))) };
const upstreamKeys = read(resolve(ROOT, "tools/upstream.json")).brandKeys;
const site = flatten(read(resolve(OWN, "brand/site.json")));
const comps = flatten(read(resolve(OWN, "components.json")));

const errors = [];
const isRef = (v) => typeof v === "string" && /^\{[^}]+\}$/.test(v);
const refName = (v) => v.slice(1, -1);

// 1. key parity
const a = [...upstreamKeys].sort().join("\n"), b = [...site.keys()].sort().join("\n");
if (a !== b) errors.push("brand/site keys differ from demo brands (tools/upstream.json)");

// 1b. reserved Token Studio group names
for (const n of comps.keys()) { const segs = n.split(".").slice(0, -1); for (const r of ["value", "type", "description"]) if (segs.includes(r)) errors.push(`${n}: group name "${r}" is reserved — use amount / percent / detail`); }

// 2. layer rule: components → theme | brand only
for (const [n, t] of comps) {
  if (!isRef(t.value)) { errors.push(`${n}: raw value "${t.value}" (components must alias)`); continue; }
  const r = refName(t.value);
  if (core.has(r) || map.has(r)) errors.push(`${n} → ${r}: components must not read core/map`);
}

// colour math identical to tools/build-css.mjs (Token Studio modify, hsl)
function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, bl = (n & 255) / 255;
  const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - bl) / d + (g < bl ? 6 : 0) : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  let r, g, b; if (s === 0) r = g = b = l; else { const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3); }
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return ("#" + to(r) + to(g) + to(b)).toUpperCase();
}
const modify = (hex, m) => { const [h, s, l] = hexToHsl(hex), v = parseFloat(m.value);
  return m.type === "lighten" ? hslToHex(h, s, l + (1 - l) * v) : hslToHex(h, s, l * (1 - v)); };

function resolveFinal(name, mode, depth = 0) {
  if (depth > 12) throw new Error("cycle at " + name);
  const tok = comps.get(name) ?? theme[mode].get(name) ?? site.get(name) ?? map.get(name) ?? core.get(name);
  if (!tok) throw new Error("unresolved " + name);
  if (map.has(name) && !comps.has(name) && !theme[mode].has(name) && !site.has(name)) {
    const base = resolveFinal(refName(tok.value), mode, depth + 1);
    return tok.mod ? modify(base, tok.mod) : base;
  }
  return isRef(tok.value) ? resolveFinal(refName(tok.value), mode, depth + 1) : tok.value;
}

// 3. every ref resolves in both modes
const resolved = { light: {}, dark: {} };
for (const mode of ["light", "dark"]) {
  for (const set of [site, theme[mode], comps]) for (const n of set.keys()) {
    try { resolved[mode][n] = resolveFinal(n, mode); } catch (e) { errors.push(`[${mode}] ${n}: ${e.message}`); }
  }
}

if (errors.length) { console.error("✗ " + errors.join("\n✗ ")); process.exit(1); }
// 4. contrast (WCAG 2.x) on the pairs the site actually renders
const lum = (hex) => { const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0); };
const ratio = (x, y) => { const [l1, l2] = [lum(x), lum(y)].sort((p, q) => q - p); return (l1 + 0.05) / (l2 + 0.05); };
const PAIRS = [
  ["hero.title.color", "hero.bg", 4.5], ["hero.subtitle.color", "hero.bg", 4.5], ["hero.eyebrow.color", "hero.bg", 4.5], ["focus.outline.color", "section.bg.default", 3], ["focus.outline.color", "section.bg.alt", 3],
  ["button.primary.color.default", "button.primary.bg.default", 4.5], ["button.primary.color.default", "button.primary.bg.hover", 4.5], ["button.primary.color.default", "button.primary.bg.active", 4.5], ["button.secondary.color.default", "section.bg.default", 4.5], ["button.secondary.color.default", "section.bg.alt", 4.5], ["button.secondary.br", "section.bg.default", 3], ["siteFooter.link.color.default", "siteFooter.bg", 4.5], ["accentBar.ink", "section.bg.default", 3],
  ["link.color.default", "section.bg.default", 4.5], ["link.color.default", "section.bg.alt", 4.5],
  ["metric.amount.color", "metric.bg", 4.5], ["metric.label.color", "metric.bg", 4.5], ["metric.typical.color", "metric.typical.bg", 4.5],
  ["caseCard.detail.color", "caseCard.bg.default", 4.5], ["caseCard.tag.color", "caseCard.tag.bg", 4.5],
  ["siteFooter.color", "siteFooter.bg", 4.5], ["siteNav.item.color.default", "siteHeader.bg", 4.5],
  ["contactForm.hint.color", "section.bg.default", 4.5], ["siteFooter.color", "siteFooter.bg", 4.5], ["ctaBand.lead.color", "ctaBand.bg", 4.5], ["audience.detail.color", "audience.bg", 4.5], ["langSwitch.item.color.default", "langSwitch.bg", 4.5], ["step.index.color", "step.index.bg", 4.5],
];
const pick = (n, mode) => { if (!resolved[mode][n]) throw new Error("unknown token " + n); return resolved[mode][n]; };
const report = [];
for (const mode of ["light", "dark"]) for (const [fg, bg, min] of PAIRS) {
  const f = pick(fg, mode), k = pick(bg, mode), r = ratio(f, k);
  if (r < min) errors.push(`[${mode}] contrast ${fg} on ${bg} = ${r.toFixed(2)} < ${min}`);
  report.push({ mode, fg, bg, f, k, ratio: +r.toFixed(2), min });
}

if (process.argv.includes("--report")) console.log(JSON.stringify({ resolved, report }, null, 2));
console.log(`brand/site: ${site.size} keys · site-components: ${comps.size} tokens · contrast pairs: ${report.length}`);
if (errors.length) { console.error("✗ " + errors.join("\n✗ ")); process.exit(1); }
console.log("✓ parity · ✓ layers · ✓ refs (light, dark) · ✓ contrast");

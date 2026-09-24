#!/usr/bin/env node
// Дзеркало спільних сетів з демо (multibrand-design-system) у tokens/ портфоліо.
// Копіює тільки те, що належить системі: core, map, theme/light|dark, typography.
// Плюс read-only копія демо-брендів і демо-компонентів у tokens/demo/ — з неї будується секція «Архітектура» (tokens:demo).
// Свої файли портфоліо (brand/site.json, components.json, $themes, $metadata) не чіпає.
//
//   node tools/sync-demo-tokens.mjs            # з локальної папки ../multibrand-design-system (або DEMO_DIR)
//   node tools/sync-demo-tokens.mjs --github   # з github.com/OzerovAndrey/multibrand-design-system@main
//   node tools/sync-demo-tokens.mjs --check    # нічого не пише; exit 1, якщо дзеркало розійшлось з демо
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "OzerovAndrey/multibrand-design-system";
const SETS = ["core.json", "map.json", "theme/light.json", "theme/dark.json", "typography.json"];
const DEMO_BRANDS = ["aurum", "nova", "fiesta", "ultra"];
// [файл у демо, куди в портфоліо] — дзеркало для секції «Архітектура», руками не редагувати
const DEMO_MIRROR = [...DEMO_BRANDS.map((b) => [`brand/${b}.json`, `demo/brand/${b}.json`]), ["components.json", "demo/components.json"]];
const SHARED_COMPONENTS = ["button", "input"]; // групи, взяті з демо один раз — стежимо, щоб не розійшлись
const useGithub = process.argv.includes("--github");
const checkOnly = process.argv.includes("--check");
const DEMO_DIR = resolve(ROOT, process.env.DEMO_DIR ?? "../multibrand-design-system");

async function source() {
  if (!useGithub) {
    if (!existsSync(resolve(DEMO_DIR, "tokens"))) throw new Error(`немає ${DEMO_DIR}/tokens — вкажи DEMO_DIR або запусти з --github`);
    let commit = "local";
    try { commit = execSync("git rev-parse HEAD", { cwd: DEMO_DIR }).toString().trim(); } catch {}
    return { commit, get: async (p) => readFileSync(resolve(DEMO_DIR, "tokens", p), "utf8"), raw: async (p) => readFileSync(resolve(DEMO_DIR, p), "utf8") };
  }
  // sha коміту — для tools/upstream.json; якщо API недоступне (rate limit), беремо просто main
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  let commit = "main";
  try { const r = await fetch(`https://api.github.com/repos/${REPO}/commits/main`, { headers }); if (r.ok) commit = (await r.json()).sha; } catch {}
  const raw = async (p) => { const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${commit}/${p}`); if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.text(); };
  return { commit, get: (p) => raw(`tokens/${p}`), raw };
}

const keysOf = (o, pre = "", out = []) => { for (const [k, v] of Object.entries(o)) { if (k.startsWith("$")) continue; const n = pre ? `${pre}.${k}` : k; v && typeof v === "object" && "value" in v ? out.push(n) : v && typeof v === "object" && keysOf(v, n, out); } return out; };
const canon = (s) => JSON.stringify(JSON.parse(s));

const src = await source();
const drift = [];
for (const p of SETS) {
  const upstream = await src.get(p), local = resolve(ROOT, "tokens", p);
  const same = existsSync(local) && canon(readFileSync(local, "utf8")) === canon(upstream);
  if (!same) { drift.push(p); if (!checkOnly) writeFileSync(local, upstream.endsWith("\n") ? upstream : upstream + "\n"); }
}
for (const [from, to] of DEMO_MIRROR) {
  const upstream = await src.get(from), local = resolve(ROOT, "tokens", to);
  const same = existsSync(local) && canon(readFileSync(local, "utf8")) === canon(upstream);
  if (!same) { drift.push(to); if (!checkOnly) { mkdirSync(dirname(local), { recursive: true }); writeFileSync(local, upstream.endsWith("\n") ? upstream : upstream + "\n"); } }
}
const demoComponents = JSON.parse(await src.get("components.json"));
const ownComponents = JSON.parse(readFileSync(resolve(ROOT, "tokens/components.json"), "utf8"));
for (const g of SHARED_COMPONENTS) if (JSON.stringify(demoComponents[g]) !== JSON.stringify(ownComponents[g])) drift.push(`components.${g} (оновити вручну, якщо зміна потрібна сайту)`);
const brandKeys = keysOf(JSON.parse(await src.get("brand/aurum.json"))).sort();

if (checkOnly) {
  if (drift.length) { console.error("✗ дзеркало розійшлось з демо @" + src.commit.slice(0, 7) + ":\n  " + drift.join("\n  ")); process.exit(1); }
  console.log("✓ дзеркало = демо @" + src.commit.slice(0, 7));
} else {
  writeFileSync(resolve(ROOT, "tools/upstream.json"), JSON.stringify({ repo: REPO, commit: src.commit, syncedAt: new Date().toISOString(), brandKeys }, null, 2) + "\n");
  console.log(drift.length ? `оновлено з демо @${src.commit.slice(0, 7)}: ${drift.join(", ")}` : `без змін, демо @${src.commit.slice(0, 7)}`);
}

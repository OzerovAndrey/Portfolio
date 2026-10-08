// Дані для кадрів інструментів — тільки з репо демо (DEMO_REPO) і з живого демо в браузері.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { ROOT } from "./lib.mjs";
import { demoPage } from "./demo.mjs";

export const DEMO_REPO = resolve(process.env.DEMO_REPO ?? resolve(ROOT, "../multibrand-design-system"));
const read = (f) => JSON.parse(readFileSync(resolve(DEMO_REPO, "tokens", f), "utf8"));
export const metadata = () => read("$metadata.json");
export const themes = () => read("$themes.json");
export const set = (name) => read(`${name}.json`);

/** { "color.product1": {value,type,$extensions}, … } */
export function flat(obj, pre = [], out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && "value" in v && "type" in v) out[[...pre, k].join(".")] = v;
    else if (v && typeof v === "object" && !k.startsWith("$")) flat(v, [...pre, k], out);
  }
  return out;
}
export const count = (name) => Object.keys(flat(set(name))).length;

/** Злиті сети бренду й теми в порядку Token Studio */
export function merged(brand, theme) {
  return Object.assign({}, ...["core", `brand/${brand}`, "map", `theme/${theme}`, "typography", "components"].map((n) => flat(set(n))));
}
/** Ланцюжок посилань: ["button.primary.bg.default", "color.fill.primary.default", …, сирий кінець] */
export function chain(name, brand, theme) {
  const all = merged(brand, theme);
  const out = [name];
  let v = all[name]?.value;
  while (typeof v === "string" && /^\{[^}]+\}$/.test(v)) { const ref = v.slice(1, -1); out.push(ref); v = all[ref]?.value; }
  return { names: out, raw: v, modify: all[out.at(-2)]?.$extensions?.["studio.tokens"]?.modify };
}
/** Значення токена бренду з підставленими посиланнями на core (для таблиці Figma Variables) */
export function brandValue(name, brand) {
  const all = Object.assign({}, flat(set("core")), flat(set(`brand/${brand}`)));
  let v = all[name]?.value;
  while (typeof v === "string" && /^\{[^}]+\}$/.test(v)) v = all[v.slice(1, -1)]?.value;
  return v;
}

/** Обчислені браузером значення CSS-змінних демо */
export async function computed(newPage, brand, theme, vars) {
  const p = await demoPage(newPage, { brand, theme, width: 1280, height: 800, scale: 1 });
  const out = await p.evaluate((vs) => Object.fromEntries(vs.map((v) => [v, getComputedStyle(document.documentElement).getPropertyValue(v).trim()])), vars);
  await p.close();
  return out;
}

export const git = (cmd) => execSync(`git -C "${DEMO_REPO}" ${cmd}`, { encoding: "utf8" });
/** Коміт, що додав бренд Ultra (перший, де з'явився tokens/brand/ultra.json) */
export function ultraCommit() {
  const sha = git("log --diff-filter=A --format=%H -- tokens/brand/ultra.json").trim().split("\n").at(-1);
  const [subject, author, date] = git(`show -s --format=%s%n%an%n%ad --date=format:"%d %b %Y" ${sha}`).trim().split("\n");
  const files = git(`show --numstat --format= ${sha}`).trim().split("\n").map((l) => { const [a, d, f] = l.split("\t"); return { a: +a, d: +d, f }; });
  const patch = git(`show --format= ${sha} -- tokens/brand/ultra.json`);
  return { sha, subject, author, date, files, patch };
}

/** Вивід справжніх команд (без ANSI) */
export function run(cmd, cwd) {
  try { return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", SITE_BASE: "/multibrand-design-system/" } }).replace(/\x1b\[[0-9;]*m/g, ""); }
  catch (e) { return String(e.stdout ?? "") + String(e.stderr ?? ""); }
}
export const demoCss = () => readFileSync(resolve(DEMO_REPO, "site/src/styles/tokens.generated.css"), "utf8");
export const hasDemoRepo = () => existsSync(resolve(DEMO_REPO, "tokens/$themes.json"));

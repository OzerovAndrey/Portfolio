// Дані для сцени шарів у hero. Рахується під час білду з реальних файлів токенів (tokens/demo, tokens/theme) —
// жодна цифра не пишеться руками. Лічильники площин — з src/generated/demo/meta.json (npm run tokens:demo).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import meta from "../generated/demo/meta.json";
import { ILLUSTRATIONS, SPRITE, type IllusKey } from "./demo-illustrations";

// Ті самі бренди, що в живому демо (реєстр фактів: 4)
export const STAGE_BRANDS = ["aurum", "nova", "fiesta", "ultra"] as const;
export type StageBrand = (typeof STAGE_BRANDS)[number];
export const BRAND_NAME: Record<StageBrand, string> = { aurum: "Aurum", nova: "Nova", fiesta: "Fiesta", ultra: "Ultra" };

type Tok = { value: unknown };
type Tree = { [k: string]: Tree | Tok };
// білд і dev запускаються з site/ (npm --prefix site / cd site)
const TOKENS = resolve(process.cwd(), "..", "tokens");
const read = (p: string): Tree => JSON.parse(readFileSync(resolve(TOKENS, p), "utf8"));
function flatten(o: Tree, prefix = "", out = new Map<string, unknown>()) {
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith("$")) continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && "value" in v) out.set(name, (v as Tok).value);
    else if (v && typeof v === "object") flatten(v as Tree, name, out);
  }
  return out;
}

const brands = Object.fromEntries(STAGE_BRANDS.map((b) => [b, flatten(read(`demo/brand/${b}.json`))])) as Record<StageBrand, Map<string, unknown>>;
const core = flatten(read("core.json"));
const light = flatten(read("theme/light.json"));
const dark = flatten(read("theme/dark.json"));

/** Скільки ключів бренд-файлу відрізняються між двома брендами (однакові ключі — паритет) */
const diff = (a: StageBrand, b: StageBrand) => [...brands[a].keys()].filter((k) => JSON.stringify(brands[a].get(k)) !== JSON.stringify(brands[b].get(k))).length;
export const brandDiff = Object.fromEntries(STAGE_BRANDS.map((a) => [a, Object.fromEntries(STAGE_BRANDS.map((b) => [b, diff(a, b)]))])) as Record<StageBrand, Record<StageBrand, number>>;

/** Скільки семантичних ключів light → dark посилаються на інший крок */
export const modeRemap = [...light.keys()].filter((k) => light.get(k) !== dark.get(k)).length;

/** Токени на площинах: component = components, semantic = theme (одна тема), core = core + brand + map (сирі значення) */
export const planeCount = {
  component: meta.counts.components,
  semantic: meta.counts.theme / 2,
  core: meta.counts.core + meta.counts.brand / meta.brandCount + meta.counts.map,
};

const refOf = (v: unknown) => (typeof v === "string" ? v.replace(/^\{|\}$/g, "") : String(v));
/** Семантична площина: alias → на що посилається в light і dark */
export const SEMANTIC = ["color.bg.primary", "color.text.primary", "color.fill.primary.default", "color.border.secondary", "color.text.accent"].map((name) => ({
  name,
  css: `--${name.replace(/\./g, "-")}`,
  light: refOf(light.get(name)),
  dark: refOf(dark.get(name)),
}));

const str = (v: unknown) => refOf(v);
const radius = (b: StageBrand, k: string) => { const r = refOf(brands[b].get(k)); return `${refOf(core.get(r) ?? r)}px`; };
/** Core-площина: сирі значення бренду */
export const coreOf = Object.fromEntries(STAGE_BRANDS.map((b) => [b, {
  colors: (["color.product1", "color.product2", "color.product3", "color.ink"] as const).map((k) => ({ key: k.replace("color.", ""), value: str(brands[b].get(k)) })),
  font: str(brands[b].get("fontFamily.display")),
  radiusSurface: radius(b, "borderRadius.surface"),
  radiusControl: radius(b, "borderRadius.control"),
}])) as Record<StageBrand, { colors: { key: string; value: string }[]; font: string; radiusSurface: string; radiusControl: string }>;

/** Ілюстрації демо (дзеркало, sync-demo-tokens): тільки потрібні символи спрайту + сцена jackpot.
 *  Кольори — токени --illustration-* / --art-*, тому арт перефарбовується разом із брендом. */
export const LOBBY_ART = [
  { art: "a", ill: "slots" }, { art: "b", ill: "roulette" }, { art: "c", ill: "cards" }, { art: "f", ill: "gem" },
] as const satisfies readonly { art: string; ill: IllusKey }[];
const symbolOf = (k: string) => new RegExp(`<symbol id="ill-${k}"[\\s\\S]*?</symbol>`).exec(SPRITE)?.[0] ?? "";
const refsIn = (svg: string) => [...svg.matchAll(/href="#ill-([a-z]+)"/g)].map((m) => m[1]);
/** Символи спрайту для потрібних ілюстрацій + усі, на які вони посилаються (<use href="#ill-…">), рекурсивно */
export function artSprite(keys: readonly string[], extra = "") {
  const done = new Set<string>(), queue = [...keys, ...refsIn(extra)];
  while (queue.length) { const k = queue.shift()!; if (done.has(k)) continue; done.add(k); queue.push(...refsIn(symbolOf(k))); }
  return [...done].map(symbolOf).join("");
}
export const illustration = (k: IllusKey) => ILLUSTRATIONS[k];

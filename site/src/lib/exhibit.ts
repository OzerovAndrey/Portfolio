// Дані для Signature Work (Exhibit + Lens). Усе рахується під час білду з токенів репо — жодної цифри не пишеться руками:
//  · src/generated/exhibit/manifest.json — scoped-збірка `npm run tokens:exhibit` (бренд site + 4 бренди демо × light/dark): резолв токенів
//  · src/generated/demo/meta.json — кількості токенів демо (`npm run tokens:demo`)
//  · tokens/demo/* — перевірка, що бренди не чіпають компонентний шар
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "../generated/exhibit/manifest.json";
import demoMeta from "../generated/demo/meta.json";

export const BRANDS = ["aurum", "nova", "fiesta", "ultra"] as const;
export const NEUTRAL = "site"; // стартовий монохромний стан експозиції, не п'ятий бренд
export const THEMES = ["light", "dark"] as const;
/** Токени лінзи: кожен показано на сцені (data-token). Ланцюжки є в manifest (CHAIN_TOKENS у tools/build-css.mjs) */
export const TOKENS = ["button.primary.bg.default", "button.borderRadius", "badge.primary.bg", "card.default.bg", "input.br.active", "header.logo.iconColor"] as const;

type Step = { name: string; layer: string; ref?: string; note?: string; value?: string };
type Chain = { steps: Step[]; value: string };
const chains = manifest.chains as unknown as Record<string, Record<string, Chain>>;
const values = manifest.values as unknown as Record<string, Record<string, string>>;

type Tree = { [k: string]: Tree | { value: unknown } };
const TOKENS_DIR = resolve(process.cwd(), "..", "tokens"); // білд і dev запускаються з site/
const read = (p: string): Tree => JSON.parse(readFileSync(resolve(TOKENS_DIR, p), "utf8"));
function keys(o: Tree, prefix = "", out = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith("$")) continue;
    const name = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && "value" in v) out.add(name);
    else if (v && typeof v === "object") keys(v as Tree, name, out);
  }
  return out;
}

// «0 компонентних alias змінено»: у файлах брендів немає жодного ключа компонентного шару, тож перемикання бренду не міняє alias.
// Рахуємо реально: перетин ключів кожного файлу бренду з ключами компонентів демо
const componentKeys = keys(read("demo/components.json"));
const aliasesChanged = BRANDS.reduce((n, b) => n + [...keys(read(`demo/brand/${b}.json`))].filter((k) => componentKeys.has(k)).length, 0);

export const facts = {
  brandValues: manifest.layers.brand.length,
  componentTokens: demoMeta.counts.components,
  aliasesChanged,
  brands: BRANDS.length,
  themes: THEMES.length,
};

const px = (v: string) => v; // уже "8px" з білду
const family = (v: string) => (/^'([^']+)'/.exec(v)?.[1] ?? v.split(",")[0].trim());

/** Стан = бренд або нейтральний site; тема = light | dark */
export const states = Object.fromEntries(
  [NEUTRAL, ...BRANDS].flatMap((b) => THEMES.map((th) => {
    const v = values[`${b}|${th}`];
    return [`${b}|${th}`, {
      colors: { "color.product1": v["color.product1"], "color.product2": v["color.product2"], "color.product3": v["color.product3"] },
      radius: { control: px(v["borderRadius.control"]), surface: px(v["borderRadius.surface"]) },
      fonts: { display: family(v["fontFamily.display"]), base: family(v["fontFamily.base"]) },
      chains: Object.fromEntries(TOKENS.map((t) => [t, chains[`${b}|${th}`][t]])),
    }];
  })),
);

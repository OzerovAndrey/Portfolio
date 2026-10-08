// Демо в бренді й темі (спільне для сцен)
import { DEMO } from "./lib.mjs";

export const BRANDS = ["aurum", "nova", "fiesta", "ultra"];

/** Сторінка демо в бренді й темі; без підказки «Try it» і тостів */
export async function demoPage(newPage, { brand, theme, width, height, path = "", scale = 2 }) {
  const p = await newPage({ width, height, scale, scheme: theme });
  await p.addInitScript(() => { try { localStorage.setItem("mb-hint", "1"); } catch { /* */ } });
  await p.goto(`${DEMO}${path}?brand=${brand}&theme=${theme}`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: ".panel__hint,.toaster{display:none!important} *{caret-color:transparent!important}" });
  await p.waitForTimeout(600);
  return p;
}


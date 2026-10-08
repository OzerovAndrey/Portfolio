// Сцени скрінів: id з маніфесту → async ({ newPage, scenePage, demoDist, width, height }) => Buffer (PNG @2x)
import { BRANDS, demoPage } from "./demo.mjs";
import { componentScenes } from "./scenes-components.mjs";
import { toolScenes } from "./scenes-tools.mjs";

const lobby = (brand, theme) => async ({ newPage, width, height }) => {
  const p = await demoPage(newPage, { brand, theme, width, height });
  const buf = await p.screenshot();
  await p.close();
  return buf;
};

export const scenes = {
  ...Object.fromEntries(BRANDS.flatMap((b) => ["dark", "light"].map((t) => [`lobby-${b}-${t}`, lobby(b, t)]))),
  ...componentScenes,
  ...toolScenes,
};

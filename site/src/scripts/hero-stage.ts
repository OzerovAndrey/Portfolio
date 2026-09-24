// Сцена шарів у hero: перемикання бренду й теми, лічильники площин, легенда, aria-live.
// Без GSAP і без React — працює на всіх ширинах. 3D-скрол (hero-motion.ts) довантажується тільки на desktop з дозволеним рухом.
type Plane = "component" | "semantic" | "core";
type I18n = {
  count: { total: string; changed: string; remapped: string };
  announceBrand: string; announceMode: string;
  modeNames: Record<"light" | "dark", string>; names: Record<string, string>;
  total: Record<Plane, number>;
};

const MOTION_QUERY = "(min-width: 900px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)";
const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

const stage = document.querySelector<HTMLElement>("[data-stage]");
const legend = document.querySelector<HTMLElement>("[data-legend]");
if (stage && legend) init(stage, legend);

function init(stage: HTMLElement, legend: HTMLElement) {
  const html = document.documentElement;
  const i18n = JSON.parse(stage.dataset.i18n!) as I18n;
  const diff = JSON.parse(stage.dataset.diff!) as Record<string, Record<string, number>>;
  const remap = Number(stage.dataset.remap);
  const live = legend.querySelector<HTMLElement>("[data-live]")!;
  const counter = (p: Plane) => legend.querySelector<HTMLElement>(`[data-count="${p}"]`)!;
  const brandButtons = [...stage.querySelectorAll<HTMLButtonElement>("[data-set-brand]")];
  const modeButton = stage.querySelector<HTMLButtonElement>("[data-set-mode]")!;
  const legendItems = [...legend.querySelectorAll<HTMLButtonElement>("[data-legend-plane]")];
  const swap = stage.querySelector<HTMLElement>("[data-swap]")!;
  const theme = (): "light" | "dark" => (html.dataset.theme === "dark" ? "dark" : "light");

  const setCounts = (core: string, semantic: string, component: string) => {
    counter("core").textContent = core; counter("semantic").textContent = semantic; counter("component").textContent = component;
  };
  const zero = fill(i18n.count.changed, { n: 0 });

  // ---- бренд: змінюється тільки data-brand на scope-елементах; анімується тільки core-площина
  let brand = stage.dataset.current!;
  const setBrand = (next: string) => {
    if (next === brand) return;
    const n = diff[brand][next];
    brand = next;
    stage.dataset.current = next;
    stage.querySelectorAll<HTMLElement>("[data-stage-brand]").forEach((el) => (el.dataset.brand = next));
    brandButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setBrand === next)));
    setCounts(fill(i18n.count.changed, { n }), zero, zero);
    live.textContent = fill(i18n.announceBrand, { brand: i18n.names[next], n });
    swap.classList.remove("is-swapping"); void swap.offsetWidth; swap.classList.add("is-swapping");
  };
  brandButtons.forEach((b) => b.addEventListener("click", () => setBrand(b.dataset.setBrand!)));

  // ---- тема: та сама логіка, що в ThemeToggle (data-theme + sessionStorage); шапка підхоплює зміну сама
  modeButton.addEventListener("click", () => {
    const next = theme() === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    try { sessionStorage.setItem("theme", next); } catch { /* приватний режим */ }
  });
  const syncMode = () => modeButton.setAttribute("aria-pressed", String(theme() === "dark"));
  syncMode();
  let last = theme();
  new MutationObserver(() => {
    syncMode();
    if (theme() === last) return;
    last = theme();
    setCounts(zero, fill(i18n.count.remapped, { n: remap }), zero);
    live.textContent = fill(i18n.announceMode, { mode: i18n.modeNames[last], n: remap });
  }).observe(html, { attributes: true, attributeFilter: ["data-theme"] });

  // ---- легенда: наведення/фокус підсвічує площину, клік закріплює
  let pinned = "";
  const show = (p: string) => { if (p) stage.dataset.focus = p; else delete stage.dataset.focus; };
  legendItems.forEach((item) => {
    const p = item.dataset.legendPlane!;
    item.addEventListener("pointerenter", () => show(p));
    item.addEventListener("focus", () => show(p));
    item.addEventListener("pointerleave", () => show(pinned));
    item.addEventListener("blur", () => show(pinned));
    item.addEventListener("click", () => {
      pinned = pinned === p ? "" : p;
      legendItems.forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.legendPlane === pinned)));
      show(pinned || p);
    });
  });

  // ---- 3D-скрол: GSAP після load і простою, тільки коли медіа-умова виконується (або почне виконуватись)
  const mq = matchMedia(MOTION_QUERY);
  let loaded = false;
  const load = () => {
    if (loaded) return; loaded = true;
    import("./hero-motion").then((m) => m.start(stage, legend)).catch(() => html.classList.remove("js-motion"));
  };
  const whenIdle = () => ("requestIdleCallback" in window ? requestIdleCallback(load, { timeout: 2000 }) : setTimeout(load, 200));
  const arm = () => (mq.matches ? whenIdle() : mq.addEventListener("change", (e) => e.matches && whenIdle(), { once: true }));
  if (document.readyState === "complete") arm(); else addEventListener("load", arm, { once: true });
}

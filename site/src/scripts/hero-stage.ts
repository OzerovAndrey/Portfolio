// Hero: перемикання бренду в лобі-мокапі + рядок статусу (aria-live) + легкий паралакс від курсора.
// Без GSAP і без React. Тема живе тільки в перемикачі шапки — лобі підхоплює її через CSS (data-theme на <html>).
type I18n = { announceBrand: string; names: Record<string, string> };

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
const stage = document.querySelector<HTMLElement>("[data-stage]");
if (stage) init(stage);

function init(stage: HTMLElement) {
  const i18n = JSON.parse(stage.dataset.i18n!) as I18n;
  const diff = JSON.parse(stage.dataset.diff!) as Record<string, Record<string, number>>;
  const live = stage.querySelector<HTMLElement>("[data-live]")!;
  const buttons = [...stage.querySelectorAll<HTMLButtonElement>("[data-set-brand]")];
  const swap = stage.querySelector<HTMLElement>("[data-swap]")!;

  // ---- бренд: змінюється тільки data-brand на scope-елементах; лічильник — ключі бренд-файлу, пораховані при білді
  let brand = stage.dataset.current!;
  const setBrand = (next: string) => {
    if (next === brand) return;
    const n = diff[brand][next];
    brand = next;
    stage.dataset.current = next;
    stage.querySelectorAll<HTMLElement>("[data-stage-brand]").forEach((el) => (el.dataset.brand = next));
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.setBrand === next)));
    live.textContent = fill(i18n.announceBrand, { brand: i18n.names[next], n });
    swap.classList.remove("is-swapping"); void swap.offsetWidth; swap.classList.add("is-swapping");
  };
  buttons.forEach((b) => b.addEventListener("click", () => setBrand(b.dataset.setBrand!)));

  // ---- паралакс: тільки desktop, точний вказівник, рух дозволено. CSS читає --tilt-x/-y (від -1 до 1)
  const hero = stage.closest<HTMLElement>("[data-hero]");
  const tilt = stage.querySelector<HTMLElement>("[data-tilt]");
  const mq = matchMedia("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  if (!hero || !tilt) return;
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    if (!mq.matches || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = hero.getBoundingClientRect();
      tilt.style.setProperty("--tilt-x", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      tilt.style.setProperty("--tilt-y", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
  };
  const reset = () => { tilt.style.removeProperty("--tilt-x"); tilt.style.removeProperty("--tilt-y"); };
  hero.addEventListener("pointermove", onMove);
  hero.addEventListener("pointerleave", reset);
  mq.addEventListener("change", reset);
}

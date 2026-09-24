// 3D-скрол сцени шарів (тільки desktop, рух дозволено, висоти вистачає). GSAP + ScrollTrigger через gsap.matchMedia():
// зміна розміру вікна чи налаштувань руху сама прибирає твіни, інлайн-стилі й обробники.
// Pin — це CSS position: sticky (index.astro), ScrollTrigger тільки скрабить таймлайн: без pin-spacer, без зсуву макета.
// Анімуються тільки transform і opacity. Кути й відстані — з токенів (--stage-*), не з коду.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const QUERY = "(min-width: 900px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)";

export function start(stage: HTMLElement, legend: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  const hero = stage.closest<HTMLElement>("[data-hero]")!;
  const copy = hero.querySelector<HTMLElement>("[data-hero-copy]")!;
  const stack = stage.querySelector<HTMLElement>("[data-stack]")!;
  const tilt = stage.querySelector<HTMLElement>("[data-tilt]")!;
  const plane = (p: string) => stage.querySelector<HTMLElement>(`[data-plane="${p}"]`)!;
  const mm = gsap.matchMedia();

  mm.add(QUERY, () => {
    const css = getComputedStyle(stage);
    const num = (v: string) => parseFloat(css.getPropertyValue(v));
    const rx = num("--stage-rotateX"), rz = -num("--stage-rotateZ"), depth = num("--stage-depth"), par = num("--stage-parallax"), scale = num("--stage-scale");
    const smooth = num("--motion-duration-scene") / 1000; // токен у ms → секунди GSAP
    hero.classList.add("is-scrub");

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: true },
    });
    tl.fromTo(stack, { rotationX: 0, rotationZ: 0, scale: 1 }, { rotationX: rx, rotationZ: rz, scale, duration: 1 }, 0)
      .fromTo(plane("component"), { z: 0 }, { z: depth, duration: 1 }, 0)
      .fromTo(plane("core"), { z: 0, opacity: 0 }, { z: -depth, opacity: 1, duration: 0.8 }, 0.1)
      .fromTo(plane("semantic"), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.2)
      .fromTo(copy, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0.35)
      .fromTo(legend, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6);
    const st = tl.scrollTrigger!;

    // Клавіатура: фокус на невидимому (прозорому) блоці → прокручуємо до стану, де він видимий
    const onFocus = (e: FocusEvent) => {
      const el = e.target as Node;
      if (legend.contains(el) && st.progress < 0.9) window.scrollTo({ top: st.end, behavior: "instant" });
      else if (copy.contains(el) && st.progress > 0.35) window.scrollTo({ top: st.start, behavior: "instant" });
    };
    hero.addEventListener("focusin", onFocus);

    // Легкий паралакс від курсора (тільки точний вказівник)
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (matchMedia("(pointer: fine)").matches) {
      const toX = gsap.quickTo(tilt, "rotationX", { duration: smooth, ease: "power3" });
      const toY = gsap.quickTo(tilt, "rotationY", { duration: smooth, ease: "power3" });
      onMove = (e) => {
        const r = hero.getBoundingClientRect();
        toY(((e.clientX - r.left) / r.width - 0.5) * 2 * par);
        toX(-((e.clientY - r.top) / r.height - 0.5) * 2 * par);
      };
      hero.addEventListener("pointermove", onMove);
    }

    return () => {
      hero.classList.remove("is-scrub");
      hero.removeEventListener("focusin", onFocus);
      if (onMove) hero.removeEventListener("pointermove", onMove);
    };
  });
}

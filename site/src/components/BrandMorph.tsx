import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "../styles/morph.css";

const BRANDS = [["aurum", "Aurum"], ["nova", "Nova"], ["fiesta", "Fiesta"], ["ultra", "Ultra"]] as const;
const MODES = ["light", "dark"] as const;
type Mode = (typeof MODES)[number];

interface Labels { brand: string; mode: string; modes: Record<Mode, string>; pause: string; play: string; group: string }
interface Props { labels: Labels; ratio: string; variant?: "morph" | "matrix"; interval?: number }

// Слоти приходять з Astro іменованими слотами `aurum-dark` → проп `aurumDark` (8 кадрів Shot, відрендерених на сервері).
const slotKey = (b: string, m: Mode) => `${b}${m[0].toUpperCase()}${m.slice(1)}`;
// Один індекс на 8 комбінацій: бренд змінюється швидко, мод — раз на повне коло брендів
const split = (i: number) => ({ brand: i % BRANDS.length, mode: Math.floor(i / BRANDS.length) % MODES.length });
const join = (brand: number, mode: number) => mode * BRANDS.length + brand;

/** Brand morph / матриця 4×2: стек кадрів з crossfade, перемикачі бренду й моду. `variant="matrix"` — без автоперемикання. */
export default function BrandMorph(props: Props) {
  const { labels, ratio, variant = "morph", interval = 3000, ...rest } = props;
  const slots = rest as unknown as Record<string, ReactNode>;
  const [idx, setIdx] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [engaged, setEngaged] = useState(false); // наведення або фокус усередині
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(true); // до mount вважаємо reduce: на сервері й до гідрації нічого не крутиться
  const root = useRef<HTMLDivElement>(null);
  const autoplay = variant === "morph";
  const { brand, mode } = split(idx);

  useEffect(() => {
    // початковий мод = тема сайту
    if (document.documentElement.dataset.theme === "dark") setIdx(join(0, 1));
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) { setInView(true); return; }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = autoplay && !reduced && !userPaused && !engaged && inView;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % (BRANDS.length * MODES.length)), interval);
    return () => clearInterval(id);
  }, [running, interval]);

  const pick = useCallback((b: number, m: number) => setIdx(join(b, m)), []);
  const onBlur = (e: React.FocusEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEngaged(false); };

  return (
    <div className="morph" ref={root} onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)} onFocus={() => setEngaged(true)} onBlur={onBlur}>
      <div className="morph__bar" role="group" aria-label={labels.group}>
        {variant === "morph" ? (
          <>
            <div className="morph__control">
              <span className="morph__label ts-label-sm" id={`${variant}-brand`}>{labels.brand}</span>
              <div className="seg" role="radiogroup" aria-labelledby={`${variant}-brand`}>
                {BRANDS.map(([id, name], i) => (
                  <button key={id} type="button" className="seg__item ts-label-sm" role="radio" aria-checked={brand === i} onClick={() => pick(i, mode)} data-event={`morph_brand_${id}`}>{name}</button>
                ))}
              </div>
            </div>
            <div className="morph__control">
              <span className="morph__label ts-label-sm" id={`${variant}-mode`}>{labels.mode}</span>
              <div className="seg" role="radiogroup" aria-labelledby={`${variant}-mode`}>
                {MODES.map((m, i) => (
                  <button key={m} type="button" className="seg__item ts-label-sm" role="radio" aria-checked={mode === i} onClick={() => pick(brand, i)} data-event={`morph_mode_${m}`}>{labels.modes[m]}</button>
                ))}
              </div>
            </div>
            {!reduced && (
              <button type="button" className="seg__item ts-label-sm morph__pause" aria-pressed={userPaused} onClick={() => setUserPaused((p) => !p)} data-event={userPaused ? "morph_play" : "morph_pause"}>
                {userPaused ? labels.play : labels.pause}
              </button>
            )}
          </>
        ) : (
          <div className="matrix">
            {MODES.map((m, mi) => (
              <MatrixRow key={m} label={labels.modes[m]}>
                {BRANDS.map(([id, name], bi) => (
                  <button key={id} type="button" className="matrix__cell ts-label-sm" aria-pressed={brand === bi && mode === mi} aria-label={`${name}, ${labels.modes[m]}`} onClick={() => pick(bi, mi)} data-event={`matrix_${id}_${m}`}>{name}</button>
                ))}
              </MatrixRow>
            ))}
          </div>
        )}
      </div>

      <div className="morph__stage" style={{ aspectRatio: ratio.replace("/", " / ") }}>
        {BRANDS.flatMap(([b]) => MODES.map((m) => {
          const active = BRANDS[brand][0] === b && MODES[mode] === m;
          return <div key={`${b}-${m}`} className="morph__slide" data-active={active} aria-hidden={!active}>{slots[slotKey(b, m)]}</div>;
        }))}
      </div>
    </div>
  );
}

function MatrixRow({ label, children }: { label: string; children: ReactNode }) {
  return <><span className="matrix__row-label ts-label-sm">{label}</span>{children}</>;
}

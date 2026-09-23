import en from "./en.json";
import uk from "./uk.json";

export const locales = ["en", "uk"] as const;
export type Locale = (typeof locales)[number];
export type Dict = typeof en;

// UK рівноправна з EN: якщо ключів різна кількість — білд падає тут, а не на проді
const dicts: Record<Locale, Dict> = { en, uk: uk satisfies Dict };

export const t = (lang: Locale): Dict => dicts[lang];
export const isLocale = (v: unknown): v is Locale => locales.includes(v as Locale);

const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
/** Шлях з урахуванням base і мови: href("uk", "contact") → /Portfolio/uk/contact/ */
export const href = (lang: Locale, page = "") => `${base}${lang}/${page ? page.replace(/^\/|\/$/g, "") + "/" : ""}`;
/** Той самий маршрут іншою мовою — для перемикача і hreflang */
export const swapLang = (pathname: string, to: Locale) => pathname.replace(new RegExp(`^${base}(${locales.join("|")})/`), `${base}${to}/`);
export const staticLangPaths = () => locales.map((lang) => ({ params: { lang } }));

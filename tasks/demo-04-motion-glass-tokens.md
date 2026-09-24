# Задача для «Multibrand Design System» · demo-04 · альфа-рампи, motion бренду, boxShadow, scoped-вивід

**Пріоритет:** середній. Потрібно для візуального шару портфоліо (glass, сцена шарів у hero).
Поки задачу не зроблено, портфоліо тримає тимчасові значення у `Portfolio/tokens/site/` — після sync їх треба прибрати.

1. **Альфа-рампи в `map.json`** (`modify: alpha`, як наявні lighten/darken):
   `color.neutral.dark.alpha{04,08,16,40,60,72,88}` ← `{color.ink}`,
   `color.neutral.light.alpha{08,16,40,60,72,88}` ← `{color.white}`,
   `color.product1.alpha{16,24,40}` ← `{color.product1}`.
   Build: у `modify()` гілка `alpha` → `#RRGGBBAA`. Готовий код — `Portfolio/tools/build-css.mjs`, функція `modify`.
   Тимчасово: `Portfolio/tokens/site/map.json` (ті самі імена — після sync файл видаляється без правок у компонентах).
2. **Motion бренду** (+2 ключі до 55, однакові для всіх брендів):
   `motion.easing.brand` (cubicBezier), `motion.duration.brand` (duration).
   | Бренд | easing | duration | Характер |
   |---|---|---|---|
   | Aurum | `cubic-bezier(0.22, 1, 0.36, 1)` | 600ms | плавний, преміальний |
   | Nova | `cubic-bezier(0.7, 0, 0.3, 1)` | 360ms | різкий, технологічний |
   | Fiesta | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 520ms | з перельотом |
   | Ultra | `cubic-bezier(0.2, 0, 0, 1)` | 400ms | нейтральний |
   Тимчасово: `Portfolio/tokens/site/demo-motion.json`. Після sync — оновити `tools/upstream.json` (brandKeys = 57) і `brand/site.json` портфоліо.
3. **`boxShadow` як тип у build-css.** Композит Token Studio (`{x, y, blur, spread, color, type}` або масив) зараз виходить як `[object Object]`.
   Серіалізатор `shadowCss()` — у `Portfolio/tools/build-css.mjs`. Демо лишається «плоским», але тип має проходити.
4. **Scoped-вивід** (`--scope <selector>`): brand + map + theme + components на `<selector>[data-brand]`, а не тільки на `:root`.
   Без цього вкладений `data-brand` не перефарбовує піддерево (компоненти резолвляться на `:root`). Код — там само.

Після мержу в демо: `node tools/sync-demo-tokens.mjs` у портфоліо → видалити `tokens/site/map.json`, `tokens/site/demo-motion.json`
і відповідні гілки з `tools/build-css.mjs` / `check-tokens.mjs`.

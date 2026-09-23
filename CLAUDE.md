# Portfolio — правила для Claude Code

## Проєкт
Сайт-портфоліо Андрія Озерова: продає мультибрендові дизайн-системи. Головний експонат — живе демо
[multibrand-design-system](https://github.com/OzerovAndrey/multibrand-design-system), вбудоване в сайт.
Власник — Андрій Озеров. Мова комунікації й документації — українська.

Принцип той самий, що в демо: локальна папка `Portfolio` ↔ репо `OzerovAndrey/Portfolio`, пуш у `main` сам деплоїть сайт.

## Структура репо
`tokens/` (джерело правди, Token Studio) · `tools/` (генератори й перевірки) · `site/` (Astro) · `tasks/` (задачі для демо-проєкту).
Нових тек не створювати без потреби.

## Токени
- Сайт — окремий бренд тієї ж системи: `data-brand="site"`, тема — `data-theme="light|dark"` на `<html>`.
- Порядок сетів: core → brand/site → map → theme/light|dark → typography → components (як у демо).
- **Дзеркало демо, не редагувати тут:** `core.json`, `map.json`, `theme/*.json`, `typography.json`.
  Оновлюються тільки `node tools/sync-demo-tokens.mjs` (з `../multibrand-design-system` або `--github`).
  Потрібна зміна в цих сетах → задача в `tasks/demo-NN-*.md`, правка в демо, потім sync.
- **Свої файли портфоліо:** `brand/site.json` (ключі ідентичні брендам демо — змінюються тільки значення),
  `components.json` (`button`, `input` взяті з демо; решта — компоненти сторінок), `$themes.json`, `$metadata.json`.
- `components` посилаються тільки на theme / brand-семантику (включно з `layout.*`). Ніколи на `core.*` / `map.*`.
- Назви груп `value` / `type` / `description` зарезервовані Token Studio → `amount` / `percent` / `detail`.
- Текст на `color.fill.primary.*` — тільки `color.text.onPrimary` (чорний). Посилання й фокус — `color.text.primary`,
  не `text.accent` (у light-темі це світлий product1, не проходить AA).
- Перед комітом токенів: `node tools/check-tokens.mjs` (паритет ключів, шари, зарезервовані імена, резолв у light/dark,
  WCAG-контраст). Червоне = не комітити. Нова пара «текст на фоні» → додати в `PAIRS` у чекері.

## Сайт (`site/`)
- Astro + React-острови (зараз один: `ThemeToggle.tsx`) + TypeScript. Маршрути `/en/*`, `/uk/*`; `/` завжди редіректить на `/en/`.
- Перший візит — завжди light + EN. Вибір теми живе тільки в межах візиту (`sessionStorage`), системна тема й мова браузера не враховуються.
- `npm run tokens` генерує `src/styles/tokens.generated.css` і `src/generated/*` через `tools/build-css.mjs`. Не редагувати.
- Стилі — тільки `var(--…)` компонентних токенів, оболонка сторінки — theme/brand-семантика (`--color-*`, `--space-*`, `--layout-*`).
  Жодного hex / px / font-family. Виняток: брейкпоінти в `@media`.
- Текст — тільки класи text styles `ts-*` (`ts-display-d1`, `ts-title-t1`, `ts-body-md-regular`…), не `font-size` руками.
- Копі — тільки в `src/i18n/en.json` і `uk.json`. EN і UK рівноправні, UK не скорочена; ключі однакові (TS це перевіряє).
- Контакти, URL демо, endpoint форми — `src/config.ts`. Порожнє поле = блок не показується.
- Цифри на сайті — тільки реальні або з плашкою `metric.typical`. Не вигадувати обіцянок від імені Андрія.
- Нова сторінка → спершу розділ у брифі проєкту, потім код.
- Перевірка перед комітом: `npm --prefix site run build` без помилок (включає check-tokens і astro check).

## Демо
Код демо тут не редагується. Потрібна зміна → `tasks/demo-NN-*.md` з готовим рішенням для проєкту «Multibrand Design System».

## Коміти
Українською, `<область>: <що>` — `tokens(site): …`, `pages(home): …`, `tools: …`, `ci: …`.

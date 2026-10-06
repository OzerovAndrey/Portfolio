# Portfolio · аудит поточного візуального стану (перед редизайном)

Дата: 06.10.2026 · гілка `claude/lucid-pasteur-7v6609` · `HEAD` = `c1d27d5` (merge PR #5).
Тип документа: **тільки огляд.** Жодного рядка коду, токена чи конфігурації не змінено; створено лише цей файл.
Мета майбутнього редизайну: преміальний монохром, дуже великий шрифт, editorial-композиція, тонке скло, плаваючі градієнти, плавний рух, паралакс, scroll-взаємодії, тонкий 3D.
Референси (мова, не макет): brilean.com, arturospatino.com, goats.com.pl, walaszczyk.studio. Живу сторінку й референси цієї сесії не відкривали — аудит спирається на код репо.

> **Важливо перед усім.** Три документи в `docs/` — `visual-audit.md`, `visual-baseline.md`, `visual-report.md` — описують **візуальний шар, який уже видалено** (hero-сцена шарів, GSAP, зерно, паралакс, 3D-стек). Його прибрали комітом `dc4909c` («чистка»). Ці документи історичні й **не відображають поточний код**; джерело правди зараз — цей файл, `CLAUDE.md`, `BRIEF.md` і `docs/clean-baseline.md`. Див. також розділ 9.

---

## 1. Current Architecture

### 1.1 Структура репо

| Тека / файл | Роль |
|---|---|
| `tokens/` | **Джерело правди** (Token Studio JSON). Дзеркало демо + власні сети сайту |
| `tools/` | `build-css.mjs` (tokens → CSS), `check-tokens.mjs`, `check-styles.mjs`, `sync-demo-tokens.mjs`, `shots-report.mjs`, `upstream.json` |
| `site/` | Astro 7 + React 19 (один острів-перемикач теми, ще один — BrandMorph), TypeScript strict |
| `tasks/` | Задачі для окремого репо демо (`demo-01…05`) |
| `docs/` | `token-properties.md` (актуальний), `clean-baseline.md` (актуальний), `visual-*.md` (**застарілі**) |
| `qa/` | Скріншоти/Lighthouse із попередніх проходів + `shots.mjs` |
| `.github/workflows/pages.yml` | Пуш у `main` → `npm ci` → `npm run build` → GitHub Pages |
| `BRIEF.md`, `CLAUDE.md`, `README.md`, `SHOTS.md` | Бриф сторінок, правила для Claude Code, огляд, чекліст скрінів |

Демо (`multibrand-design-system`) **не лежить у репо**: це iframe на GitHub Pages + read-only дзеркало його токенів у `tokens/demo/`.

### 1.2 Стек і залежності (`site/package.json`)

- Runtime: `astro ^7.3.4`, `@astrojs/react ^7`, `react`/`react-dom ^19.3`, `@fontsource/inter`, `@fontsource/inter-tight`.
- Dev: `typescript`, `@astrojs/check`, `@types/*`.
- **Немає:** GSAP, three.js, Lenis, Framer Motion, жодної WebGL/анімаційної бібліотеки (GSAP був у видаленому шарі й прибраний з `package.json`). `node_modules` у цій сесії не встановлено.
- Конфіг: `astro.config.mjs` — `base: /Portfolio/` (`SITE_BASE`), `site: https://ozerovandrey.github.io`, `trailingSlash: always`, i18n `en` (default, з префіксом) + `uk`.

### 1.3 Як токени доходять до сайту (повний ланцюг)

```
tokens/*.json  ─┐
tokens/site/*  ─┼─►  tools/build-css.mjs  ─►  site/src/styles/tokens.generated.css   (gitignored)
tokens/brand/site.json ─┘                     site/src/generated/*  (meta.json, tokens-manifest.json; gitignored)
                                                  │
        npm run build = check:tokens → check:styles → tokens → tokens:demo → astro check → astro build
                                                  │
        Base.astro імпортує tokens.generated.css → base.css → visual.css; компоненти читають лише var(--…)
```

Порядок сетів (`tokens/$metadata.json`):
`core → site/core → brand/site → map → site/map → theme/light → site/theme/light → theme/dark → site/theme/dark → typography → components`.

Що саме емітує `build-css.mjs` для сайту (перевірено локальним прогоном у scratchpad, 41 299 байт, 659 токенів):

| CSS-блок | Селектор | Зміст |
|---|---|---|
| core | `:root` | `core.json` + `site/core.json` (примітиви) |
| brand + map | `:root[data-brand="site"]` | `brand/site.json` + рампи `map.json` (lighten/darken **рахуються в build** по hsl) + `site/map.json` (alpha-рампи) |
| theme | `:root[data-theme="light"]`, `…="dark"` | `theme/*.json` + `site/theme/*.json` (aliases як `var()`) |
| components | `:root` | `components.json` (aliases на theme/brand) |
| text styles | `.ts-*` | 25 утиліт із `typography.json` (font-family/weight/size/line-height/letter-spacing/text-transform) |

Кожен alias лишається `var()`-посиланням, тож бренд і тема перемикаються в рантаймі лише атрибутами `data-brand` / `data-theme` на `<html>` (`data-brand="site"` фіксований).

### 1.4 Автоперевірки як частина архітектури

- `check-tokens.mjs` (зараз ✓): паритет 55 ключів `brand/site.json` з демо (`tools/upstream.json`), однакові ключі `site/theme/light|dark`, зарезервовані імена груп (`value/type/description`), **components → тільки theme/brand** (не core/map), резолв усіх `{ref}` у light і dark, **116 пар WCAG-контрасту** (напівпрозорий фон компонується поверх найгіршого — чорного й білого).
- `check-styles.mjs` (зараз ✓, 19 файлів): у `.css` і `<style>` `.astro` заборонені hex, px, `font-family`, `font-size` без `var()`, тривалості `ms/s`, `cubic-bezier`/`ease-*`, `blur()`, `rgba()/hsla()`. Винятки — рядки з `@media` і коментар `/* allow: причина */`.

> Наслідок для редизайну: **кожне нове візуальне значення мусить спершу стати токеном**, інакше `npm run build` (а отже і деплой) падає.

### 1.5 Що не збігається з припущеннями з постановки

Постановка згадує `tokens/site/core/`, `brand/`, `map/`, `theme/`, `typography/`, `components/`. Фактично:

| Припущення | Реальність |
|---|---|
| `tokens/site/core/` (тека) | `tokens/site/core.json` (файл) |
| `tokens/site/brand/` | **Немає.** Бренд — `tokens/brand/site.json` (поза `tokens/site/`) |
| `tokens/site/map/` | `tokens/site/map.json` (файл, тільки alpha-рампи) |
| `tokens/site/theme/` | `tokens/site/theme/light.json`, `dark.json` ✓ |
| `tokens/site/typography/` | **Немає.** Є тільки `tokens/typography.json` (дзеркало демо) |
| `tokens/site/components/` | **Немає.** Компоненти — `tokens/components.json` (шарується з демо: `button`, `input`, `focus`, `link` — взяті з демо; решта — власні) |

---

## 2. Existing Design Tokens

### 2.1 Дзеркало демо (не редагується тут; оновлюється тільки `sync-demo-tokens`)

| Файл | Зміст |
|---|---|
| `tokens/core.json` (59) | `dimension` 0–56 (14 кроків), `borderRadius` 0/4/8/12/24/999, `borderWidth` 0/1/2, `fontWeight` 400–700, `fontSize` 10–56 (12 кроків), `lineHeight` 14–64, `letterSpacing` none/tight(−1%)/wide(8%), `textCase`, `color.white/black/transparent` |
| `tokens/map.json` (41) | Рампи 0…900 (lighten/darken від кольору бренду): `neutral` (від `ink`), `product1/2/3`, `success/warning/danger` |
| `tokens/theme/light.json`, `dark.json` (73 × 2) | Семантика: `color.bg.*`, `fill.{primary,secondary,ghost,accent,success,warning,danger,info}.*`, `text.*`, `border.*`, `outline.focus`, `illustration.*` |
| `tokens/typography.json` (25) | Text styles: `display.d1–d3`, `title.t1–t5`, `body.{lg,md,sm,xs}.{regular,strong}`, `label.xl–xs`, `caption.md/sm`, `overline.md/sm` |
| `tokens/demo/` | Read-only копія 4 брендів демо + його `components.json` → `src/generated/demo/` для секції «Під капотом» |

### 2.2 Власні файли сайту

| Файл | Зміст і призначення |
|---|---|
| `tokens/brand/site.json` (55 ключів) | **Бренд `site`.** Ключі ідентичні брендам демо, змінюються лише значення. Зараз — **монохром**: `product1 #9EA1A9`, `product2 #50545C`, `product3 #6B7079`, `onProduct1 {black}`, `onProduct2 {white}`, `ink #0B0C0E`; семантичні `success #1F9D5B`, `warning #E69A12`, `danger #D23B34`. `fontFamily.display = Inter Tight`, `fontFamily.base = Inter`. `space.padding.xs…xl` = 12/12/16/20/24, `space.gap.xs…xl` = 4/6/8/10/12, `borderRadius.control = 8`, `surface = 12`, `size.control.xs…xl` = 24…56, `iconSize.*`, `layout.columns.*` (4/8/12/12/12), `layout.columnGap.*` (16/16/24/24/24), `layout.paddingH.*` (16/24/32/40/48), `layout.rowGap.*` (32/40/48/56/56) |
| `tokens/components.json` (333) | 27 груп: демо-похідні `button`(48), `input`(39), `focus`, `link`; власні — `siteHeader`, `siteNav`, `langSwitch`, `hero`, `section`, `container`, `demoFrame`, `metric`, `step`, `caseCard`, `audience`, `ctaBand`, `contactForm`, `siteFooter`, `layerStack`, `tokenChain`, `segmented`, `shot`, `flow`, `banner`, **`glass`(8)**, **`motion`(6)**, **`action`(8)** |
| `tokens/$themes.json`, `$metadata.json` | 6 тем Token Studio (Base, Site, Light, Dark, Typography, Components) і порядок сетів |

### 2.3 Власні сети портфоліо `tokens/site/` (не дзеркало, `sync-demo-tokens` їх не чіпає)

| Файл | Токени |
|---|---|
| `site/core.json` | `time.120/200/400` (duration), `curve.easeOut = cubic-bezier(0,0,.58,1)`, `curve.standard = cubic-bezier(.2,0,0,1)`, **`filter.glass = blur(16px) saturate(140%)`**, **`fontSize.fluid.{hero,lead,h2}`** (`clamp`: 56→88 / 18→20 / 32→48 px), `lineHeight.ratio.{display 100%, lead 150%, title 110%}`, `letterSpacing.{display −3.5%, title −2.5%}`, `dimension.1232` (ширина контенту) |
| `site/map.json` | Alpha-рампи (`modify: alpha`): `neutral.dark.alpha{08,60,72}` (від `ink`), `neutral.light.alpha{08,16,72,88}` (від `white`). Тимчасові до `tasks/demo-04` |
| `site/theme/light.json`, `dark.json` | `color.glass.{bg,br,highlight,shadow,solid}`, `color.action.{bg,color}.*` (CTA: майже чорна в light, майже біла в dark), **`boxShadow.glass`** (inner highlight + drop), **`backdropFilter.glass`**, `duration.{fast,base,slow}`, `easing.{standard,out}`, `borderRadius.pill`, `display.{hero,lead,h2}.*` (fluid-розміри), `layout.page.maxWidth` |

Словник нових властивостей («ім'я токена = CSS-властивість»: `backdropFilter`, `boxShadow`, `duration`, `easing`) — `docs/token-properties.md` (актуальний; згадка про зерно/сцену там уже прибрана).

### 2.4 Наявність потрібної інфраструктури (чекліст із постановки)

| Тема | Чи є токени/інфраструктура | Де |
|---|---|---|
| glass | **Є** | `color.glass.*`, `boxShadow.glass`, `backdropFilter.glass`, компонент-група `glass`; клас `.glass` |
| blur | **Є, один рівень** | `filter.glass` (16px + saturate 140%) |
| gradients | **Немає жодного токена.** Єдиний `linear-gradient` у коді — сітка плейсхолдера в `Shot.astro` |
| shadows | **Частково** | `boxShadow.glass`; більше нічого. Тінь рамки демо була й прибрана |
| animation duration | **Є** | `time.120/200/400` → `duration.fast/base/slow` → `motion.duration.*` |
| easing | **Є, 2 криві** | `curve.easeOut`, `curve.standard` → `easing.*` → `motion.easing.*` |
| transitions | **Є як патерн** (токени), готових transition-утиліт немає | |
| motion (складний) | **Ні.** Є тільки `motion.reveal.distance` (= `space.padding.xl`, 24px). Немає spring/overshoot/slower/stagger/parallax-токенів |
| fluid typography | **Є, але вузько** — три розміри `fluid.hero/lead/h2`, через `display.*` → `hero.*`/`section.*`/`ctaBand.*` | `site/core.json` |
| responsive spacing | **Є** — `layout.paddingH/columnGap/rowGap` × 5 брейкпоінтів (xs…xl) | `brand/site.json` → `container.paddingH.*` |
| layout | **Є** — `layout.columns.*`, `layout.page.maxWidth = 1232` | |
| 3D / WebGL / parallax | **Немає ні токенів, ні коду** (були у видаленому шарі: `scene.*`, `depth.*`, `angle.*`, `opacity.*` — прибрано) |
| z-index / opacity / blur-рівні / angle / perspective | **Немає токенів** | |

---

## 3. Existing Visual System

### 3.1 Типографіка

- **Шрифти:** Inter (400/500/600/700, `@fontsource`, self-hosted) для тексту; Inter Tight (600/700) для display/title. Усі підключені глобально в `base.css` (`@import`). На Home preload тільки Inter Tight 700 (latin або cyrillic за мовою) — щоб не було CLS на H1.
- **Text styles (`.ts-*`, 25):** найбільший — `ts-display-d1` = **56/64 px** (bold). `d2`=48, `d3`=40, `t1`=32 … `t5`=18; body 18/16/14/12; label 18…10; caption, overline.
- **Fluid-розміри** (тільки в 3 місцях): `hero.title` 56→88 px (`display.hero`, line-height 100%, tracking −3.5%), `section.title`/`ctaBand.title` 32→48 px (H2, tracking −2.5%), `hero.subtitle` 18→20 px. Інші заголовки (`ts-display-d2/d3`, `ts-title-*`) **фіксовані**.
- **Як застосовано в Home:** `<h1 class="ts-display-d1">` + локальний override `font-size: var(--hero-title-fontSize)` у `<style>` сторінки; `max-width: 14ch`, `text-wrap: balance`. H2 секцій — `ts-title-t1` + `font-size` з `section.title.*`.
- **Стеля:** 88 px на ≥ 1440. «Дуже великого» (clamp до 160–240 px, `vw`-масштабований display) немає. Важка вага (700) і Inter Tight — жорсткий grotesk, не editorial-serif/light.

### 3.2 Кольори

- **Тема:** `data-theme="light|dark"`; перший візит — системна (`prefers-color-scheme`), наживо йде за системою, ручний вибір — `sessionStorage` (inline-скрипт у `<head>` `Base.astro`).
- **Палітра (з прогону build):** `neutral.0 #FFF` → `50 #F7F7F9` → … → `500 #858E9F` → `700 #474D5A` → `800 #292D34` → `900 #0B0C0E`. Light: `bg.primary = neutral.50`, `secondary = 0`, `tertiary = 100`; Dark: `bg.primary = neutral.900 (#0B0C0E)`, `secondary = 800 (#292D34)`.
- **Спостереження:** нейтралі **холодно-синюваті** (`#858E9F`, `#656E80`, `#474D5A`, `#292D34`) — це lighten/darken від `ink #0B0C0E` у hsl зі збереженою насиченістю. Це «майже монохром», але **не чистий grayscale**. `product1/2/3` — графітові сіро-блакитні (`#9EA1A9`, `#50545C`, `#6B7079`). Семантичні success/warning/danger лишаються кольоровими (потрібні для статусів).
- **Дія (`action.*`):** primary-кнопка = `neutral.900` (light) / `neutral.0` (dark), текст зворотний; hover/active — сусідні кроки рампи.
- **Обмеження тексту:** `CLAUDE.md` — текст на `fill.primary.*` лише `text.onPrimary` (чорний); посилання й фокус — `text.primary`, не `text.accent` (у light не проходить AA).

### 3.3 Spacing

`space.padding/gap.*` (xs…xl, малі кроки 4–24 px) для всередині компонентів; `layout.rowGap` (32→56 px) — вертикальний ритм секцій; `layout.paddingH` (16→48 px) — поля контейнера. **Максимальний вертикальний відступ між секціями — 56 px**, що дає щільний «landing-ритм», далекий від editorial-повітря (там 160–320 px).

### 3.4 Radius

`borderRadius`: 0/4/8/12/24/999. У використанні: `control` 8, `surface` 12, `pill` 999 (шапка, glass). Крок 24 є в core, але **не прив'язаний до жодного семантичного токена** бренду.

### 3.5 Shadows

Одна тінь: `boxShadow.glass` (inset 1px highlight + `0 8px 24px` drop). Рамка демо раніше мала тінь — прибрана. Рівнів elevation немає.

### 3.6 Effects

`filter.glass` (blur 16 + saturate 140%), `::selection` (primary fill), `:focus-visible` outline (`focus.outline.*`), View Transitions для теми. Зерно (grain), свічення, noise — **були й прибрані**.

### 3.7 Layout

- Один контейнер на все (`.container`): `max-width = 1232px + padding`, поле з `container.paddingH.xs…xl` через CSS-змінні `--l-padH/--l-gap/--l-row` (перемикаються media-query на 768/1024/1200/1440). Краї шапки, секцій, футера збігаються на 390–1920 (перевірено в `clean-baseline.md`/коміті `525b934`).
- Секції: `.section` (фон `bg.primary`) / `.section--alt` (`bg.tertiary`) чергуються; `.section__head` (заголовок + lead, `.measure` = 60ch).
- Сітки: `.metrics` (1/2/4 колонки), `.steps` (3), `.audience` (3), `.cases` (3), `.newbrand` (2fr/1fr), `.info-grid` (2), `.arch` (5fr/7fr). Жодної 12-колонкової сітки в CSS, хоча `layout.columns` = 4/8/12 у токенах — **колонки як токен не використовуються**.
- Hero: колонка eyebrow → H1 → підзаголовок → 2 CTA, лівий край, **без висоти екрана** (padding-block, не `100vh`).

---

## 4. Existing Motion

Повний перелік — **усе, що є** (після чистки `dc4909c`):

| # | Система | Де | Механізм | Токени | Reduced-motion |
|---|---|---|---|---|---|
| 1 | **Поява секцій** | `Base.astro` (inline IO) + `visual.css` | `[data-reveal]` → `.is-visible` (IntersectionObserver, `rootMargin −10%`), `opacity 0→1` + `translateY(24px→0)`, `400ms ease-out` | `motion.reveal.distance`, `motion.duration.slow`, `motion.easing.out` | Тільки в `no-preference`; без JS/IO секції видимі |
| 2 | **Перемикання теми** | `ThemeToggle.tsx` + `visual.css` | `document.startViewTransition`, `::view-transition-old/new(root)` `200ms`, `easing.standard` | `motion.duration.base`, `motion.easing.standard` | Якщо reduce — миттєво |
| 3 | **Crossfade кадрів** | `morph.css` (`.morph__slide`) | `opacity` `400ms` | `duration.slow`, `easing.standard` | Глобальний ресет |
| 4 | **Автоперемикання BrandMorph** | `BrandMorph.tsx` | `setInterval` 3000 мс; пауза при hover/focus, поза в'юпортом, кнопкою; `matchMedia(reduce)` | — (інтервал — проп) | Вимкнено при reduce |
| 5 | **Hover/active** кнопок, сегментів, матриці | `Button.astro`, `morph.css` | `background-color`/`color` `120ms ease-out` | `duration.fast`, `easing.out` | Ресет |
| 6 | **Поява iframe демо** | `DemoFrame.astro` | `opacity` `200ms` після `load`; lazy-mount через IO (`rootMargin 400px`), лише ≥ 900px | `duration.base`, `easing.out` | Ресет |
| 7 | **Плавний скрол** | `base.css` | `scroll-behavior: smooth` (no-preference) | — | `auto` при reduce |
| 8 | **Ресет reduced-motion** | `base.css` | `animation/transition-duration: 0.01ms !important` для `*` | — | — |
| 9 | **Resolve-chain / seg-перемикачі** | `Architecture.astro` (inline `<script>`) | `hidden` toggle + MutationObserver на `data-theme`; **без анімації** | — | — |
| 10 | **Hover індикатор навігації** | `Header.astro` | `::after` підкреслення (без transition) | `siteNav.item.indicator.*` | — |

**Чого немає:** `@keyframes` (жодного), `requestAnimationFrame`, scroll-driven animations (`animation-timeline`), parallax, sticky-pin сцени, stagger, split-text, cursor-ефекти, page transitions між маршрутами (View Transitions застосовано **тільки** для теми), 3D-transform, `will-change`, GSAP/Lenis.

Прибрано чисткою (історія: `aeea22f`, `bbb62ea`, `6317b95`; відкат — `git revert`): hero-сцена шарів зі scroll-scrub (GSAP ScrollTrigger + `position: sticky`), зерно, паралакс, світіння за рамкою демо, поява рядків H1, hover-стани карток.

---

## 5. Existing Glass / Gradient / Blur

### 5.1 Glass — **є, мінімальний**

- **Реалізація:** клас `.glass` у `styles/visual.css`:
  - база — суцільна поверхня `glass.solid.bg` (= `color.bg.secondary`), `border: 1px glass.br`, `box-shadow: glass.boxShadow`, колір `glass.color.default`;
  - `@supports (backdrop-filter)` → `glass.bg` (white α0.72 у light / ink α0.72 у dark) + `backdrop-filter: blur(16px) saturate(140%)` (з `-webkit-` префіксом);
  - `@media (prefers-reduced-transparency: reduce)` → назад до суцільного фону, без blur.
- **Де застосовано:** **лише шапка** (`Header.astro` → `.header__inner.glass`, плаваюча «таблетка», `border-radius: pill`, sticky). Варіант `Button` glass був і прибраний.
- **Контраст:** `check-tokens` міряє текст на glass поверх найгіршого фону (чорний/білий) + solid-fallback.
- **Токенний ланцюг:** `filter.glass` (core) → `backdropFilter.glass` (theme) → `glass.backdropFilter` (component); `color.neutral.{dark,light}.alphaNN` (map) → `color.glass.*` (theme) → `glass.*` (component).

### 5.2 Blur — один рівень

Тільки `blur(16px) saturate(140%)`. Немає шкали (sm/md/lg), немає blur для фону-градієнтів (потрібен 80–200px).

### 5.3 Gradients — **немає**

Жодного токена, жодного градієнта в UI. `linear-gradient` — лише технічна сітка плейсхолдера скріна (`Shot.astro`, `shot.grid.*`). Альфа-рампи (`alpha08…88`) — єдина «прозорість» в системі і **не охоплюють градієнти** (немає кроків 04/16/24/40 для м'яких плям).

### 5.4 Інше

Зерно/noise/свічення — відсутні (видалено). Теми-світлі «плями» немає.

---

## 6. Existing Responsive System

- **Брейкпоінти** (тільки `min-width` в `@media`, дозволений виняток `check-styles`): **560**, **768**, **900**, 1024, 1104, 1200, 1440; один `max-width: 559/899`. Токенного брейкпоінта немає (CSS не читає `var()` в media queries) — значення дубльовані в коді (9× 768, 7× 1024…).
- **Layout-токени по брейкпоінтах:** `container.paddingH.*`, `layout.columnGap/rowGap.*` → `--l-padH/--l-gap/--l-row` у `:root` (`base.css`), перемикаються на 768/1024/1200/1440.
- **Типографіка:** fluid лише для hero/H2/lead (`clamp`, rem + vw); решта — фіксовані px зі стилів `ts-*`. `BRIEF.md` (правило 6) досі тримає «H1 ≤ ~26 символів» — тимчасово, поки немає адаптивної типографіки (demo-03 п.4).
- **Шапка:** ≥ 900px — один ряд; < 900 — меню другим рядком із горизонтальним скролом; < 560 — логотип скорочується до «AO».
- **Hero CTA:** < 560px — стовпчиком (щоб прибрати CLS від підміни шрифту).
- **Демо:** < 900px — iframe не вантажиться, лишається постер; пропорція рамки міняється на 900 / 1104 / 1200 (9:16 → 4:5 → 1:1 → 27:25); постери `poster-{wide,mid,mobile}-{light,dark}.webp` (≈ 44–87 KB кожен).
- **Зображення:** `astro:assets` `<Image>` з `widths 640/960/1440/2000` і `sizes`; зараз **всі 24 скріни — плейсхолдери** (`SHOTS.md`: готово 0/24, `site/src/assets/shots/` порожня), тож реальних зображень контенту сайт не має, крім постерів демо й OG.
- **Перевірено в минулих прогонах** (`clean-baseline.md`): 390/768/1280/1440/1920 × light/dark × reduced-motion; Lighthouse Home 100/100/100/100, CLS ≈ 0.002.
- **Вхід `prefers-*`:** `color-scheme`, `reduced-motion`, `reduced-transparency`. Немає `prefers-contrast`, `hover: hover`, `pointer: fine` (важливо для курсор-ефектів і hover-паралаксу).

---

## 7. Existing Components

| Компонент | Файл | Токени | Тип | Безпечно еволюціонувати? |
|---|---|---|---|---|
| `Base` layout | `layouts/Base.astro` | — | SEO, тема, reveal-IO, Umami; ключові inline-скрипти | **Обережно** — тема/IO/аналітика; додавати, не міняти |
| `Header` | `components/Header.astro` | `siteHeader/siteNav/langSwitch/glass` | glass-таблетка + навігація + мови + `ThemeToggle` | **Так** (візуально) — зберегти семантику, `data-event`, hreflang, aria |
| `Footer` | `Footer.astro` | `siteFooter.*` | контакти з `config.ts` | **Так** |
| `Button` | `Button.astro` | `button.*`, `action.*` | primary/secondary/text × sm/md/lg; `<a>` або `<button>` | **Так**, але `button.*` — токени демо: не змінювати їх, лише `action.*`/власні |
| `ThemeToggle` | `ThemeToggle.tsx` | стилі в Header | єдиний «обов'язковий» React-острів (`client:idle`, ~69 KB gzip разом із React) | **Лише за потреби**; логіка теми/VT/`sessionStorage` не чіпати |
| `DemoFrame` | `DemoFrame.astro` | `demoFrame.*` | рамка + постер + lazy iframe | **Рамку — так**; логіку mount/`?theme=` — ні (це зв'язок із демо) |
| `Architecture` | `Architecture.astro` | `layerStack/tokenChain/segmented` | «Під капотом»: шари + ланцюжок резолву з `generated/demo/*` | Стилі — так; **дані з manifest — ні** (джерело: `tokens/demo`) |
| `BrandMorph` | `BrandMorph.tsx` + `morph.css` | `segmented`, `shot` | 8 кадрів crossfade, автоплей | Оформлення — так; логіка автоплею/a11y — обережно |
| `HtmlAttrPlate` | `HtmlAttrPlate.tsx` | `flow`, `tokenChain` | ілюстрація `data-brand` | Так (стилі) |
| `Shot` | `Shot.astro` | `shot.*` | скрін із `shots.json` / плейсхолдер | Стилі — так; контракт `shots.json` — ні |
| `Flow` | `Flow.astro` | `flow.*` | схема вузлів | **Так** |
| `CaseCards` | `CaseCards.astro` | `caseCard.*` | 3 картки (третя «coming soon») | **Так** |
| Інфо-картки/сітки | `base.css` (`.info-card`, `.info-grid`, `.stack`) | `audience.*` | про/послуги/кейси | **Так** |
| Секційні патерни | `base.css` (`.section*`) + `<style>` у `index.astro` | `section.*`, `hero.*`, `metric.*`, `step.*`, `audience.*`, `ctaBand.*` | Hero, метрики, кроки, аудиторія, CTA — **не окремі компоненти**, а CSS у сторінці | **Так** — основне поле для редизайну |

---

## 8. Existing Pages

Маршрути (`site/src/pages`): `/` → редірект на `/en/`; `/{en,uk}/` + `about, approach, cases, contact, services`. Усі через `Base`, двомовні (EN основна, UK рівноправна, ключі `i18n/en.json` ↔ `uk.json` перевіряє TS).

| Маршрут | Роль | Секції / стан |
|---|---|---|
| `/{lang}/` Home | «Продати і довести за один скрол» | Hero → **Live demo** (iframe) → **Brand morph** → **Метрики** (4) → **How it works** (3 кроки) → **Новий бренд = файл** (diff-скрін + лічильники «—») → **Під капотом** (6 шарів + ланцюжок) → **Кейси** (3 картки) → **Для кого** → **CTA** |
| `/approach` | Технічна глибина для CTO | Якорі `#token-layers #two-axes #components #pipeline #code-proof #limits`; матриця 4×2, плашка `data-brand`, схеми `Flow` |
| `/cases` | Огляд кейсів | Каркас: картки + формат кейсу; `/cases/aurum-multibrand` ще немає |
| `/services` | Пакети й процес | Каркас: 4 пакети |
| `/about` | Про Андрія | Каркас, **чекає матеріали** (фото, досвід) |
| `/contact` | Конверсія | Форма (за `PUBLIC_FORM_ENDPOINT`, інакше лише прямі контакти) + контакти; JS-покращення `fetch` |

Прапори: `SITE_LAUNCHED=false` (`noindex`), `SHOW_PREVIEW_BANNER=false`, `SHOW_WANDA=false`. Аналітика Umami — події через `data-event` (`cta_demo`, `lang_uk`, `theme_dark`, `morph_*`, `arch_*`…).

---

## 9. Potential Conflicts

Що може вступити в конфлікт із майбутнім напрямком (а також із правилами репо):

| # | Конфлікт | Деталі |
|---|---|---|
| C1 | **Застарілі `docs/visual-audit.md`, `visual-baseline.md`, `visual-report.md`** | Описують видалений шар (GSAP, hero-сцену, зерно, паралакс, 3D). Нова робота може помилково спиратися на них (напр. на `tokens/site/demo-motion.json`, `HeroStage.astro`, `stage.css` — **цих файлів уже немає**). Рекомендація: позначити «історичні» окремим кроком |
| C2 | **Чистка `dc4909c` була свідомим рішенням** | Прибрано «декоративні візуали, 3D, світіння, анімації», бо рухали верстку (CLS) і ускладнювали сайт. Редизайн повертає частину цього — потрібне явне погодження, що це розворот, і чіткі бюджети (CLS, JS KB, Lighthouse) |
| C3 | **«Чистий монохром» vs холодні нейтралі** | Нейтралі мають синюватий відтінок (`#858E9F`…); `product1/2/3` — теж. Для «чорне/біле/сіре» треба або нову нейтральну рампу з нульовою насиченістю, або змінити `ink`/логіку рампи |
| C4 | **Заборона правок дзеркала** | `core.json`, `map.json`, `theme/*.json`, `typography.json` — read-only (їх перезаписує sync). Нові core-примітиви (градієнти, blur-шкала, великі `fontSize`) — тільки у `tokens/site/*` або через `tasks/demo-NN` |
| C5 | **Паритет 55 ключів `brand/site.json`** | Нові «бренд-токени» (градієнти, motion) **не можна** класти в `brand/site.json` — `check-tokens` упаде. Місце — `tokens/site/*` |
| C6 | **`check-styles` блокує типові візуальні прийоми** | `blur()`, `rgba()`, `cubic-bezier`, `ms`, `px`, hex у CSS заборонені → кожен `radial-gradient`, `blur(120px)`, `perspective(1200px)`, `translateZ(Npx)` `rotate(Ndeg)`, `clamp(…px…)` потребує токена або `/* allow */`. Правила **не ловлять** `deg`, `vw/vh`, `perspective()`, `z-index`, `scale()` — це прогалини, не дозвіл |
| C7 | **Компоненти → лише theme/brand** | `check-tokens` забороняє `components → core/map`. Нові компонентні токени градієнтів/blur мусять мати посередника в `theme` (власний `site/theme/*`) |
| C8 | **Контраст** | WCAG-пари в `PAIRS` — вручну. Великий текст поверх анімованих градієнтів/скла не перевіряється автоматично (чекер знає лише статичні кольори, склад поверх «чорного/білого») |
| C9 | **Жорстка шкала `ts-*` і Inter/Inter Tight** | Editorial-типографіка (дуже великий display, інша ширина/вага, можливо інший шрифт) виходить за `typography.json` (дзеркало) і `fontFamily` (ключ бренду, спільний із демо). Новий шрифт = завантаження + `check-styles` забороняє `font-family` → шлях тільки через токени |
| C10 | **Холодні вертикальні відступи** | `layout.rowGap` макс. 56px; editorial-ритм потребує нових, більших відступів (нова шкала у `tokens/site`) |
| C11 | **Перфоманс-бюджет** | Lighthouse 100×4, CLS 0.002, JS ≈ 70 KB. WebGL/GSAP/blur на великих площах зламають це без lazy-стратегії (раніше GSAP довелося вантажити після `load` лише на desktop) |
| C12 | **`position: sticky` шапка + `backdrop-filter`** | Багато `backdrop-filter`-шарів на одному екрані (скло поверх анімованих градієнтів) — дорогі на мобільних; `prefers-reduced-transparency` вже підтримано |
| C13 | **Тема світла/темна + монохром** | Преміум-чорний напрямок природно «темний»; сайт підтримує обидві теми, перший візит — системна. Потрібно рішення: чи лишається light-тема повноцінною |
| C14 | **View Transitions тільки для теми** | Page-transitions між маршрутами не підключені; `trailingSlash: always`, MPA — ефекти між сторінками потребують окремого рішення |
| C15 | **Демо-постери й OG-картинки** | `public/demo/poster-*` і `public/og/*.png` перевипускаються при зміні вигляду; OG містить hero-текст і поточну смугу кольору |
| C16 | **Текстові правила бриф-реєстру** | Цифри — лише з реєстру; великий display-текст не повинен змінювати копі (`hero.title` «Many brands. One codebase.» обмежений довжиною для мобільних) |
| C17 | **Контент ще не готовий** | 0/24 скрінів, `/about` без фото, метрики з «—». Editorial-композиція «візуальний сторітелінг» потребує справжніх зображень/кейсів — інакше композиція триматиметься на плейсхолдерах |

---

## 10. Recommended Visual Foundation

**Нічого не реалізовано.** Це пропозиція для наступних кроків; позначки: **EXISTING** — є і достатньо; **EVOLVE** — є, треба розвинути; **NEW** — відсутнє.
Усе нове — у `tokens/site/*` (власні сети), через ланцюг core → theme → component, не в дзеркалі й не в `brand/site.json`.

### 10.1 Monochrome palette

| Що | Статус | Пропозиція |
|---|---|---|
| Світла/темна семантика (`bg/text/border/fill`) | **EXISTING** | Лишається каркасом; сайт уже монохромний за `brand/site.json` |
| Нейтральна рампа без відтінку | **EVOLVE** | Додати власну нейтральну рампу (чисті сірі) у `tokens/site/core.json` і переключити surface/text/border сайту на неї через `site/theme/*`; не чіпати `map.json` |
| Чорний «ink» для dark-теми (глибший за `#0B0C0E` / `#292D34` для secondary) | **EVOLVE** | Окремі surface-токени в `site/theme/dark.json` |
| Альфа-рампи для чорного/білого | **EVOLVE** | Додати кроки 04/16/24/40 (вже заплановані в `tasks/demo-04`) у `site/map.json` |
| Статусні кольори success/warning/danger | **EXISTING** | Лишити (потрібні для UI-станів) |
| Акцентний колір | **EXISTING** (відсутній свідомо) | `action.*` вже чорно-білий |

### 10.2 Large typography

| Що | Статус | Пропозиція |
|---|---|---|
| Fluid `clamp`-механізм (`fontSize.fluid.*` → `display.*` → компонент) | **EXISTING** | Той самий патерн розширити |
| Ще більший display (напр. 120–240 px, tracking −4…−6%), нові рівні | **NEW** | `fontSize.fluid.display-xl` тощо в `tokens/site/core.json` + `display.*` в `site/theme/*` |
| Fluid для інших заголовків (`d2/d3/t1`) | **EVOLVE** | Зараз фіксовані — зробити fluid-варіанти поряд зі `ts-*` (не міняти `typography.json`) |
| Шрифтова пара/вага (легша, вужча/ширша, можливо serif-акцент) | **NEW** (рішення дизайну) | Через `fontFamily`-токен і `@fontsource`; перевірити CLS/preload; ключ `fontFamily.*` — спільний із демо |
| Eyebrow/overline великою розрідженою caps | **EXISTING** | `ts-overline-*`, `letterSpacing.wide` |
| `text-wrap: balance`, `max-width` в `ch` | **EXISTING** | Уже застосовано |

### 10.3 Glass surfaces

| Що | Статус | Пропозиція |
|---|---|---|
| Клас `.glass`, токени `glass.*`, `filter.glass`, fallback `solid` + `reduced-transparency` | **EXISTING** | Збережена база |
| Градації скла (subtle/default/strong), різний blur (8/16/32), рамки-hairline | **EVOLVE** | Шкала `filter.glass.*` + `color.glass.*` рівнів у `site/*`; `.glass--strong` тощо |
| Поширення скла на картки/панелі (не лише шапку) | **EVOLVE** | Нові компонентні групи, посилаються на `site/theme` |
| Контрольований вибір, де скло **не** використовувати (мобільні, велика площа) | **NEW** | Правило + `@media (hover/pointer)` guard |

### 10.4 Animated gradients

| Що | Статус | Пропозиція |
|---|---|---|
| Будь-які градієнти | **NEW** | Нічого немає |
| Токени градієнтів/«плям» (кольори — монохромні сірі, positions, size, blur 80–200px, opacity) | **NEW** | Спершу `site/core` (кути, розміри, blur-шкала) → `site/theme` (колір світлий/темний) → `components.json` (`ambient.*`) |
| Анімація «плаваючих» плям (CSS `@keyframes` на `transform`/`opacity`, 20–60 с, GPU) | **NEW** | Тривалості `time.20000+`, easing `linear/sine` — нові токени `time.*`/`curve.*` |
| Підтримка `prefers-reduced-motion` + статичний кадр | **EVOLVE** | Патерн ресету вже в `base.css` |
| Розширити `check-styles` на `gradient(`, `deg`, `vw/vh`, `perspective`, `z-index` | **EVOLVE** | Зміна `tools/` — окремий погоджений крок (не конфіг білду, але інструмент перевірки) |

### 10.5 Parallax

| Що | Статус | Пропозиція |
|---|---|---|
| Parallax / scroll-linked | **NEW** | Нічого немає |
| Перший вибір механізму: CSS `animation-timeline: view()/scroll()` (без JS, прогресивно) → лише за потреби IO/rAF легкий скрипт | **NEW** | GSAP/Lenis — окреме рішення про залежність (зараз заборонено цим завданням) |
| Токени глибини/швидкості (`motion.parallax.speed.*`, `distance`) | **NEW** | `site/core` + `site/theme` + `components` |
| Guard: лише `no-preference` і `(hover: hover) and (pointer: fine)` де потрібно | **EVOLVE** | Додати прапорні media-запити |

### 10.6 Smooth motion

| Що | Статус | Пропозиція |
|---|---|---|
| Шкала тривалостей 120/200/400 і 2 easing | **EXISTING** | База |
| Довші тривалості (600–1200 мс), `easeOutExpo/Quint`, spring-подібні, stagger-крок | **EVOLVE** | Розширити `time.*`, `curve.*` у `site/core`, прокинути в `site/theme` → `motion.*` |
| Reveal (opacity + translate) | **EXISTING** | Розвинути до варіантів (mask/clip, scale, text-line stagger), токенізувати `distance/stagger` |
| Page transitions між маршрутами (View Transitions MPA) | **NEW** | Обережно: зараз VT — тільки тема |
| Глобальний reduced-motion ресет | **EXISTING** | Не ламати |

### 10.7 Premium editorial layout

| Що | Статус | Пропозиція |
|---|---|---|
| Єдиний `.container` (1232px) з токенними полями | **EXISTING** | Зберегти як «рамку контенту»; додати **full-bleed/wide** варіанти |
| Колонкова сітка 12 col (токен `layout.columns` вже є) | **EVOLVE** | Реально використати колонки для асиметричних розкладок |
| Вертикальний ритм (більші відступи між секціями 120–240 px, fluid) | **NEW** | `layout.section.*` fluid у `site/core`/`site/theme`; `layout.rowGap` (дзеркало) не чіпати |
| Hero на висоту екрана (`svh`), мегатекст, мінімальна навігація | **EVOLVE** | Новий `hero.*` режим; контроль CLS |
| Нумерація/індекси секцій, тонкі лінії, великі числа | **EXISTING** (`metric.*`, `step.index`) | Розвинути типографічно |
| Реальні візуали замість плейсхолдерів | **NEW** (контент від Андрія) | Критичний шлях для «візуального сторітелінгу» |

### 10.8 Subtle 3D

| Що | Статус | Пропозиція |
|---|---|---|
| 3D інфраструктура | **NEW** | Нічого немає |
| Рівень 1: CSS 3D (`perspective`, `rotateX/Y`, `translateZ`) для карток/стек шарів (шарова метафора токенів уже в «Під капотом») | **NEW** | Токени `perspective`, `angle`, `depth`; мінімальний JS або `animation-timeline` |
| Рівень 2: легкий WebGL (shader-фон) | **NEW**, **відкласти** | Нова залежність + бюджет → окреме погодження; не в першому проході |
| Fallback: статичний кадр для mobile / reduce | **NEW** | Обов'язково |

---

## 11. Risk Assessment

Не змінювати «між іншим»:

| Ризик | Чому небезпечно |
|---|---|
| **Дзеркало демо:** `tokens/core.json`, `map.json`, `theme/*.json`, `typography.json`, `tokens/demo/**` | Перезаписується `sync-demo-tokens`; правки зникнуть або розійдуться з демо. Потрібна зміна → `tasks/demo-NN` |
| **`tokens/brand/site.json` (ключі)** | Паритет 55 ключів із брендами демо; будь-який новий/видалений ключ валить `check-tokens` і ламає тезу «бренд = один файл». Міняти можна тільки значення |
| **`tools/upstream.json`, `sync-demo-tokens.mjs`** | Зв'язок із репо демо |
| **`tools/build-css.mjs`** | Копія з демо + портфоліо-прапорці (`--site-sets`, `modify: alpha`, `boxShadow`); без прапорців вивід має лишатись байт-у-байт. Зміни — лише з розумінням, як `tokens:demo` теж його викликає |
| **`site/package.json` scripts, `astro.config.mjs`, `pages.yml`** | `build` = ланцюжок перевірок + генерація; `base`/`site` визначають усі URL (GitHub Pages, hreflang, OG) |
| **`config.ts` прапори** (`SITE_LAUNCHED`, `SHOW_*`) і Umami `data-event` | Індексація, аналітика. Не перейменовувати події без узгодження (історія метрик) |
| **i18n:** ключі `en.json` ↔ `uk.json` | TS падає при розбіжності; копі міняти тільки там; hero-текст прив'язаний до OG-картинок |
| **Inline-скрипт теми в `Base.astro`** | Запобігає flash-of-wrong-theme; `sessionStorage`-контракт, `js` клас |
| **Контракт iframe демо** (`?theme=`, `?lang=`, `?embed=1`, `config.demoUrl`) | Демо не змінюється; ламається інтеграція |
| **`Architecture.astro` + `src/generated/demo/*`** | Цифри сайту («1039 токенів», ланцюжки) беруться з токенів демо — не писати руками |
| **`shots.json` контракт + `Shot.astro`** | Заміна скріна = клас PNG за шляхом; `SHOTS.md` автогенерується |
| **Lighthouse/CLS-стабільність** | Ранні CLS-проблеми (fallback-шрифт у hero, фіксований layer зерна) виправлялись точково. Нові ефекти мають резервувати місце й вмикатись після `load` |
| **Контраст WCAG (`PAIRS`)** | Кожна нова пара «текст на фоні» → у `PAIRS`; glass/градієнти — поверх найгіршого фону |
| **Правила `CLAUDE.md`** | Текст на `fill.primary.*` — лише `text.onPrimary`; посилання/фокус — не `text.accent`; без hex/px/font-family у стилях; жодних власних `font-size` замість `ts-*` |
| **Згенеровані файли** | `site/src/styles/tokens.generated.css`, `site/src/generated/**` — gitignored, не редагувати (у цій сесії їх узагалі немає, бо `npm run tokens` не запускався) |
| **Нова сторінка/секція** | Спершу розділ у `BRIEF.md` (правило `CLAUDE.md`) |

---

## 12. Recommended Implementation Order

Дуже обережний порядок; кожен крок — окремий коміт, зелений `npm --prefix site run build`, перевірка Lighthouse/CLS і відкат через `git revert`. **Кроки 0–1 не змінюють вигляду.**

0. **Рішення й бюджети (без коду).** Погодити з Андрієм: розворот чистки `dc4909c`; монохром у обох темах чи dark-first; допуск нових залежностей (GSAP/WebGL — так/ні); бюджети (Lighthouse ≥ 95, CLS ≤ 0.01, JS +X KB, мобільний fallback). Позначити `docs/visual-*.md` як історичні.
1. **Референс-розбір.** Окремий документ про «мову» чотирьох референсів (композиція, ритм, типографіка, рух) без копіювання макетів; вибрати 3–4 повторювані патерни.
2. **Токени без UI:** (а) чиста нейтральна рампа, (б) fluid display-шкала і editorial-відступи, (в) розширена шкала motion (duration/easing/stagger), (г) blur-шкала і рівні glass, (д) токени «ambient»-градієнтів. Усе у `tokens/site/*`, потім `node tools/check-tokens.mjs`. Візуально нічого не змінюється.
3. **Інструменти перевірки:** розширити `check-styles` (`gradient(`, `deg`, `vw/vh` у не-`clamp` місцях, `perspective`, `z-index`), додати нові пари в `PAIRS`. Окремий коміт, погоджений.
4. **Типографіка й ритм (hero + заголовки секцій).** Лише CSS/токени: більший display, нові відступи, `svh`-hero. Перевірка CLS, 390–1920, UK-довжини.
5. **Монохромна перебудова поверхонь:** перемкнути surface/border/text сайту на нову нейтральну рампу через `site/theme/*`; оновити OG і постери після схвалення вигляду.
6. **Glass:** розширити `.glass` градаціями, застосувати до 1–2 нових місць; перевірити мобільний перфоманс і `reduced-transparency`.
7. **Ambient-градієнти:** статичний (без анімації) фон → потім CSS-анімація повільного дрейфу; reduced-motion = статика; лише transform/opacity; резервування місця.
8. **Reveal і scroll-мотив:** варіанти появи (текстові рядки, маски) на наявному IO; потім CSS `animation-timeline` для паралаксу прогресивно (з fallback).
9. **Editorial-композиції окремих секцій** (Home згори вниз, по одній секції за коміт), заміна плейсхолдерів реальними візуалами — після матеріалів від Андрія.
10. **Subtle 3D:** спершу CSS-3D для стеку шарів у «Під капотом»/hero; WebGL — лише окремим погодженням і з lazy-завантаженням.
11. **Page transitions (опційно), а потім внутрішні сторінки** (`/approach`, `/cases`, `/services`, `/about`) за вже затвердженою мовою.
12. **Фінал:** оновити `BRIEF.md`/`CLAUDE.md`/`docs/token-properties.md`, QA-прогін (80 комбінацій маршрутів, Lighthouse, axe), перезняти OG/постери.

---

## Додаток A. Стан репо на момент аудиту

| Перевірка | Результат |
|---|---|
| `node tools/check-tokens.mjs` | ✓ 55 ключів · 333 компонентних токени · 116 пар контрасту |
| `node tools/check-styles.mjs` | ✓ 19 файлів, порушень немає |
| Тестова генерація CSS (у scratchpad, поза репо) | 41 299 байт · 659 токенів · 27 груп компонентів |
| `npm run build` | **Не запускався** (немає `node_modules`; щоб не створювати файли й не ставити залежності) |

## Додаток B. Де що лежить (шпаргалка)

| Потрібно | Файл |
|---|---|
| Нові core-примітиви (час, криві, blur, fluid-розміри) | `tokens/site/core.json` |
| Нові семантичні токени (glass, motion, display, layout) | `tokens/site/theme/light.json` + `dark.json` (однакові ключі!) |
| Нові альфа-кроки | `tokens/site/map.json` |
| Нові компонентні токени | `tokens/components.json` (aliases лише на theme/brand) |
| Нові пари контрасту | `PAIRS` у `tools/check-tokens.mjs` |
| Копі | `site/src/i18n/en.json`, `uk.json` |
| Глобальний візуальний шар (glass, reveal, VT) | `site/src/styles/visual.css` |
| Оболонка, сітка, секції | `site/src/styles/base.css` |

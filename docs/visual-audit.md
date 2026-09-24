# Візуальний шар · аудит (фаза 0)

Задача: преміальний візуальний шар (motion, glass, 3D-стек шарів у hero) поверх наявного сайту, без поломок.
Статус: **чекає погодження Андрія.** Код не змінювався.

---

## 0. Конфлікти з `CLAUDE.md` / `BRIEF.md` — потрібне рішення

`CLAUDE.md` і бриф мають пріоритет над промптом, тому нижче — що саме розходиться і що пропоную.

| # | Промпт каже | Правило репо | Пропозиція |
|---|---|---|---|
| K1 | Гілка `feat/visual-layer` | Сесія прив'язана до гілки `claude/portfolio-visual-layer-b6x1r4` | Працюю в `claude/portfolio-visual-layer-b6x1r4` (не `main`). Якщо потрібна саме `feat/visual-layer` — скажіть, запушу туди ту саму історію |
| K2 | Glass / motion / grain → `tokens/brand/site.json` | «ключі `brand/site.json` ідентичні брендам демо»; `check-tokens` падає на паритеті (55 ключів з `tools/upstream.json`) | Нові ключі — в окремі **власні сети портфоліо** `tokens/site/*` (розділ 3). `brand/site.json` не чіпаю |
| K3 | Альфа-кроки «в core» (`neutral.900.alpha60`) | `core.json`, `map.json`, `theme/*.json` — дзеркало демо, редагувати тут заборонено | Альфа-рампа → `tokens/site/map.json` (рахується з кольорів бренду через `modify: alpha`, як наявні рампи в `map`). Постійне рішення — задача `tasks/demo-04-*` |
| K4 | Сайт стає монохромним: графіт, без власного акценту | «Не змінювати наявні значення токенів» (safety rule 3). Крім того, `onProduct1` = чорний: чорний текст на графітовій CTA-заливці не пройде AA | Два варіанти — див. **Р1** нижче. Без вашого «так» значення `brand/site.json` не змінюю |
| K5 | Задача для демо → `docs/demo-requirements.md` | Задачі демо живуть у `tasks/demo-NN-*.md` | `tasks/demo-04-motion-glass-tokens.md` (чернетка — в розділі 3.4, файл створю у фазі 1) |
| K6 | Документувати `backdropFilter`, `duration`, `easing` у «token architecture reference» | Референс лежить у скілі `portfolio-design-system` (поза репо, редагувати звідси не можу). Там уже є словник: `boxShadow`, `blur.glass`, `duration.*`, `easing.*` | Назви з промпту (`backdropFilter`, `duration`, `easing`) — вони точніше відповідають правилу «ім'я = CSS-властивість». Опис — новий розділ у `README.md` або `docs/token-properties.md`; у скіл перенесете ви |
| K7 | Не чіпати `vendor/multibrand-design-system` | Такої теки немає: демо вбудоване як iframe із GitHub Pages, токени — дзеркало в `tokens/demo/` | Правило виконується автоматично: `tokens/demo/` і iframe не змінюю |
| K8 | Фаза 4: «Metrics, How it works, **cases**, CTA» | Секції «Кейси» на Home ще немає (бриф, етапи 8–9) | Фаза 4 торкається тільки наявних секцій: метрики, демо, «Під капотом», «Як це працює», «Для кого», CTA |
| K9 | Перемикач брендів Aurum / Nova / Fiesta | Реєстр фактів: у демо **4** бренди (+ Ultra) | У hero — 3 бренди, як у промпті (метрика «4 бренди» лишається правдою). Якщо хочете Ultra теж — це +1 кнопка, лічильники вже рахуються для всіх пар |
| K10 | Кожен бренд анімує перемикання **своїм** easing (Aurum smooth, Nova sharp, Fiesta overshoot) | У брендах демо немає токенів motion | Тимчасовий сет `tokens/site/demo-motion.json` (значення по брендах), постійне — `demo-04` |
| K11 | Специмен «Aa» зі шрифтом бренду | Шрифти демо-брендів (Montserrat, Manrope, Space Grotesk, Nunito) на сайті не завантажені; це +60–100 KB | Див. **Р2** |

### Рішення, які потрібні від вас

- **Р1. Монохром.** (а) *Рекомендую:* міняю значення `brand/site.json`: `product1` → графіт, `onProduct1` → білий, `product2/3` → нейтральні відтінки; усі пари в чекері перераховуються, якщо щось не проходить AA — підбираю крок. Це свідома зміна існуючих значень, окремим комітом, з переліком змін. OG-картинки (hero-кнопка там periwinkle) — оновити. (б) Лишаю periwinkle, монохромом стає тільки новий шар (glass, stage). Сайт тоді не «рамка» для демо повністю.
- **Р2. Шрифти в «Aa».** (а) *Рекомендую:* специмен рендериться системним шрифтом, поруч — назва шрифту бренду; справжні шрифти не вантажимо (0 KB). (б) Вантажимо тільки display-шрифти трьох брендів, latin-subset, `font-display: optional`, після першого рендера (≈ 45 KB woff2, лише desktop).
- **Р3. Термінологія площин.** Промпт: component / semantic / core. Репо (і секція «Під капотом»): 6 шарів, бренд — окремий шар. Пропоную: площина **Core** = сирі значення (core + brand + map), **Semantic** = `theme/*`, **Component** = `components`. У легенді прямо написано, що бренд-файл лежить у нижній площині. Лічильник «core N changed» рахує ключі бренд-файлу, що відрізняються між двома брендами.
- **Р4.** Порядок K1–K11 вище влаштовує? Особливо K2/K3 — нові сети `tokens/site/*` і невеликі правки `tools/`.

---

## 1. Базова лінія

Повністю — у [`visual-baseline.md`](visual-baseline.md). Коротко: усі перевірки зелені; Lighthouse Home `/en/` —
**100 / 100 / 100 / 100** на mobile і desktop, CLS 0.002 / 0.000; 5 маршрутів × 16 комбінацій (тема × ширина × reduced-motion) без помилок;
JS на Home ≈ **72 KB gzip** (з них 69 KB — React-острів `ThemeToggle`).

## 2. Сторінки й компоненти → які токени читають

| Файл | Що це | Групи токенів (`var(--…)`) |
|---|---|---|
| `layouts/Base.astro` | `<html data-brand="site" data-theme>`, мета, inline-скрипт теми, Umami | — (класи ts-*) |
| `styles/base.css` | оболонка: body, посилання, фокус, сітка, `.section`, reduced-motion | `color-*`, `focus-*`, `link-*`, `section-*`, `layout-*`, `size-*`, `space-*`, `siteHeader-height` |
| `components/Header.astro` | sticky-шапка, навігація, мова, тема | `siteHeader-*`, `siteNav-*`, `langSwitch-*`, `button-text-*`, `space-*` |
| `components/ThemeToggle.tsx` | React-острів (`client:idle`), `data-theme` + `sessionStorage` | стилі в `Header.astro` |
| `components/Button.astro` | primary / secondary / text × sm/md/lg | `button-*` (токени демо) |
| `components/DemoFrame.astro` | iframe демо з lazy-mount, тулбар, підпис | `demoFrame-*`, `space-*`, `borderRadius-control` |
| `components/Architecture.astro` | «Під капотом»: 6 шарів + ланцюжок резолву (дані з `generated/demo/*.json`) | `layerStack-*`, `tokenChain-*`, `segmented-*`, `space-*` |
| `components/Footer.astro` | футер із контактами | `siteFooter-*` |
| `pages/[lang]/index.astro` | Home: hero, метрики, демо, архітектура, how, audience, CTA | `hero-*`, `metric-*`, `step-*`, `audience-*`, `ctaBand-*`, `space-*`, `fontSize-40`/`lineHeight-48` (тимчасовий мобільний H1, demo-03) |
| `pages/[lang]/contact.astro` | форма + контакти | `contactForm-*`, `input-*`, `space-*` |
| `pages/index.astro` | редірект `/` → `/en/` | — |

Зауваги: `Button.astro` і `DemoFrame.astro` мають сирі `120ms` / `200ms ease-out` у `transition` — `check-styles` не ловить `ms`.
Нові стилі цього не повторюють (для `ms`, `cubic-bezier`, `blur()`, `rgba` додам правила в `check-styles` — див. 4.3); наявні два рядки переведу на токен `duration` у фазі 1 як єдину дозволену правку старого CSS, або позначу `/* allow */` — на ваш вибір.

## 3. Як збираються токени `site` і чи приймає пайплайн нові типи

### 3.1 Як зараз

```
tokens/core.json ─┐ (дзеркало демо)
brand/site.json ──┤ (55 ключів = паритет з демо)
map.json ─────────┤ рампи product*/neutral через modify lighten/darken (дзеркало)
theme/light|dark ─┤ семантика (дзеркало)
typography.json ──┤ (дзеркало)
components.json ──┘ тільки {ref} на theme/brand
        │
tools/build-css.mjs  (копія інструмента демо + параметри demo-01)
        ├── :root {core}  :root[data-brand=site] {brand + map}  :root[data-theme=…] {theme}  :root {components}  .ts-* класи
        └── src/styles/tokens.generated.css · src/generated/{meta,tokens-manifest}.json
tools/check-tokens.mjs — паритет, шари, резолв, WCAG (тільки 6-значний hex)
tools/check-styles.mjs — hex / px / font-family / font-size у стилях
```

Той самий `build-css.mjs` з `--brand-file` генерує `src/generated/demo/*` для 4 брендів демо (зараз використовується тільки JSON, CSS демо на сторінку не підключений).

### 3.2 Чи приймає нові типи — ні, не повністю

| Що треба | Що є | Висновок |
|---|---|---|
| `duration` (`200` → `200ms`) | `formatValue` додає одиниці лише для розмірних типів | Рядок `"200ms"` пройде як є; числу треба 1 рядок у `formatValue` |
| `easing` (`cubic-bezier(...)`) | рядок пройде як є | ОК без змін |
| `backdropFilter` / `blur` | рядок пройде як є (`blur(20px)`), але px у значенні токена — нормально, це не стилі | ОК |
| `boxShadow` (композит Token Studio: `{x,y,blur,spread,color,type}` або масив) | `String(obj)` → `[object Object]` | **Потрібен серіалізатор** (~10 рядків) |
| `opacity` | рядок/число пройде | ОК |
| Альфа-рампа (`modify: alpha`) | `modify()` знає тільки lighten/darken | **Потрібна гілка `alpha`** → `#RRGGBBAA` (~3 рядки) |
| Контраст для напівпрозорих кольорів | `lum()` бере перші 6 hex-символів, альфу ігнорує | **Потрібне компонування** «alpha-колір поверх найгіршого фону» (~10 рядків) |
| Токени демо всередині вкладеного `[data-brand]` | CSS емітиться на `:root[data-brand]`, компоненти на `:root` → вкладений `data-brand` нічого не перефарбує | **Потрібен режим scoped-виводу** (`--scope ".stage"`): brand + map + theme + потрібні компоненти оголошуються на самому scope |
| Нові сети поза паритетом | `build-css` читає фіксований набір файлів; `check-tokens` вважає все, що не theme/brand, порушенням шарів | Параметр `--extra-set` у build і дозвіл «components → site-сети» у чекері |

**Демо-репо змінювати не потрібно**: `tools/` — копії портфоліо, правки робляться тут, адитивно (нові прапорці, нові гілки `if`). Поведінка без нових прапорців — байт-у-байт та сама (перевірю `diff` згенерованого CSS до/після).

### 3.3 Проміжне рішення на боці сайту (пропоную)

Нова тека `tokens/site/` — **власні сети портфоліо, яких немає в демо** (тека потрібна: інакше вони змішаються з дзеркалом):

| Файл | Шар | Зміст |
|---|---|---|
| `tokens/site/map.json` | map (рахується для кожного бренду, і для site, і для демо-брендів) | `color.neutral.900.alpha{08,16,60,80,88}`, `color.neutral.0.alpha{08,16,60,72,88}`, `color.product1.alpha{16,24,40}` — `modify: alpha` від кольорів бренду |
| `tokens/site/core.json` | core | `duration.fast/base/slow`, `easing.standard/emphasized`, `blur.glass` |
| `tokens/site/theme/light.json`, `dark.json` | theme | `color.glass.bg`, `color.glass.br`, `color.glass.highlight`, `color.stage.light`, `boxShadow.glass`, `boxShadow.stage`, `opacity.grain` (mode-dependent) |
| `tokens/site/demo-motion.json` | brand (тимчасово) | `aurum/nova/fiesta.motion.easing.brand`, `…motion.duration.brand` — до `demo-04` |
| `tokens/components.json` (+ групи) | components | `glass.{bg,br,backdropFilter,boxShadow}`, `grain.opacity`, `motion.{duration.fast,duration.base,easing.standard}`, `stage.*`, `lobby.*` (тільки `{ref}`) |

`$themes.json` і `$metadata.json` — додати нові сети в порядок після відповідних дзеркальних (Token Studio бачить їх як звичайні сети).
Правило «компонент не читає core/map» лишається: компоненти посилаються тільки на `tokens/site/theme/*` і `components` → theme.

### 3.4 Задача для демо (чернетка `tasks/demo-04-motion-glass-tokens.md`)

1. **Альфа-рампа в `map`**: `neutral.900.alphaNN`, `neutral.0.alphaNN`, `product1.alphaNN` (`modify: alpha`), крок як у Wanda (`alpha06…alpha88`). Build: гілка `alpha` у `modify()`.
2. **Motion у бренді** (+2–3 ключі до 55): `motion.easing.brand`, `motion.duration.brand`. Aurum — плавний `cubic-bezier(.22,1,.36,1)`, Nova — різкий `cubic-bezier(.7,0,.3,1)`, Fiesta — з перельотом `cubic-bezier(.34,1.56,.64,1)`. Бриф «0 змін у компонентах» лишається правдою.
3. **`boxShadow` як тип** у build-css (серіалізатор композиту) — навіть якщо демо лишається «плоским», тип має проходити.
4. **Scoped-вивід** (`--scope <selector>`), щоб бренд перемикався на вкладеному елементі, а не тільки на `<html>`.
Після мержу в демо → `sync-demo-tokens` → видалити `tokens/site/demo-motion.json` і локальні альфа-кроки, які з'являться в дзеркалі.

## 4. План

### 4.1 Що отримує glass / motion / глибину, а що — ні

| Елемент | Glass | Motion | Глибина | Чому |
|---|---|---|---|---|
| Шапка (плаваюча «таблетка») | ✓ | — | тінь glass | Над контентом під час скролу — glass видно по-справжньому |
| Мова + тема в шапці | ✓ (всередині таблетки) | hover/focus | — | |
| Перемикач брендів у hero | ✓ | — | — | Лежить над підсвіткою сцени |
| Secondary CTA hero | ✓ (новий варіант `glass` у `Button`) | — | — | Тільки в hero; «Open full screen» у демо лишається secondary |
| Hero: стек площин | — | вхід + scroll-scrub + паралакс | 3D + тіні | Головний момент: показує, що бренд — нижній шар |
| Лобі-мокап | — (плоский, токени демо) | тільки нижня площина при зміні бренду | — | Показує, що компоненти не змінюються |
| Рамка демо | — | — | тонка рамка + м'яке світло | Рамка для демо, сам iframe не чіпаємо |
| Метрики | — | hover/focus: підсвітка рамки | — | Спокійно |
| «Під капотом» | — | ≤ 1 reveal: ланцюжок резолву будується крок за кроком | — | Показує напрям резолву |
| «Як це працює», «Для кого», CTA | — | тільки hover/focus-стани | — | |
| Grain | глобально, `pointer-events: none` | — | — | Матеріал |
| `/contact` | тільки глобальне (шапка, grain) | — | — | |

### 4.2 Файли

**Нові:**
`tokens/site/{map,core,demo-motion}.json`, `tokens/site/theme/{light,dark}.json` ·
`site/src/styles/visual.css` (glass, grain, fallback-и) ·
`site/src/components/HeroStage.astro` (3 площини + легенда + перемикач + aria-live) ·
`site/src/components/LobbyMock.astro` (лобі на токенах демо) ·
`site/src/scripts/hero-stage.ts` (перемикання, лічильники, events; без GSAP) ·
`site/src/scripts/hero-motion.ts` (GSAP + ScrollTrigger через `gsap.matchMedia()`, динамічний імпорт) ·
`site/src/generated/stage/*` (генерується: scoped CSS демо-брендів для сцени, лічильники змін) ·
`tasks/demo-04-motion-glass-tokens.md` · `docs/visual-report.md` · залежність `gsap`.

**Змінені (тільки де без цього ніяк, кожна правка — у повідомленні коміту):**
`tokens/components.json` (+ нові групи, старі не чіпаю) · `tokens/$themes.json`, `$metadata.json` (+ нові сети) ·
`tools/build-css.mjs` (+ `--extra-set`, `--scope`, `modify: alpha`, `boxShadow`, `duration`) ·
`tools/check-tokens.mjs` (+ нові сети в резолві й шарах, альфа-контраст, нові пари в `PAIRS`) ·
`tools/check-styles.mjs` (+ правила на `ms`, `cubic-bezier`, `blur(`, `rgba(`) ·
`site/package.json` (скрипт генерації stage + `gsap`) ·
`site/src/layouts/Base.astro` (підключити `visual.css`, grain-шар, клас `js-motion` у тому ж inline-скрипті) ·
`site/src/components/Header.astro` (класи glass-таблетки) · `Button.astro` (+ варіант `glass`) ·
`site/src/pages/[lang]/index.astro` (hero: права колонка + H1 розбитий на рядки через `<span>` — текст той самий; hover-стани секцій) ·
`DemoFrame.astro` (рамка/світло навколо, iframe без змін) · `i18n/en.json`, `uk.json` (+ нові ключі в обох, старі не чіпаю) ·
`BRIEF.md` (рядок у журналі й реєстрі фактів для нових цифр) · `README.md` / `CLAUDE.md` (опис `tokens/site/` і нових властивостей).

### 4.3 Технічні рішення

- **Інтерактивність сцени — plain `<script>` (Astro-бандл), не React-острів.** Острів тягне React-рантайм (65 KB gzip уже є для `ThemeToggle`, але прив'язаний до `client:idle`); plain-скрипт для перемикача й лічильників — ≈ 2–3 KB gzip. `ThemeToggle` не чіпаю — лічильник режиму слухає `data-theme` через `MutationObserver`, як уже робить `Architecture`.
- **GSAP** (core ≈ 27 KB + ScrollTrigger ≈ 17 KB gzip) — `import()` після `load` + `requestIdleCallback`, тільки коли `(min-width: 900px) and (prefers-reduced-motion: no-preference)`. На мобільних і з reduced-motion GSAP не завантажується взагалі.
- **Pin без стрибка макета:** замість pin-spacer від ScrollTrigger — `position: sticky` усередині обгортки, висоту якої задає CSS, лише коли inline-скрипт у `<head>` поставив `html.js-motion` (до першого рендера → CLS 0). Якщо GSAP не завантажився — скрипт знімає клас, сторінка стає звичайною.
- **Вхід H1** — CSS-анімація (transform + opacity) на рядках, що стартує з першого кадру, без очікування JS; з reduced-motion — нічого. Ризик для LCP (H1 — LCP-елемент) перевіряю Lighthouse; якщо LCP гірший — вхід лише для sub/CTA/сцени.
- **Лічильники** рахуються під час білду з реальних файлів: зміна бренду Aurum→Nova = **11** ключів бренд-файлу, Aurum→Fiesta = **12**, Fiesta→Nova = **8**; зміна режиму = **41** з 73 семантичних ключів ремапляться на інший крок. Жодна цифра не пишеться руками.
- **Посилання «→ core.key»** у семантичній площині — з `theme/light.json` / `dark.json` під час білду, обидва варіанти в HTML, показ за `data-theme`.
- **Деградація:** < 900 px — площини статичним списком (component → semantic → core), перемикач і лічильники працюють; reduced-motion на desktop — стек одразу розведений, без scrub і паралаксу; без JS — hero-копі, CTA і плоский лобі-мокап (Aurum) видно повністю.
- **Контраст на glass** — чекер компонує `glass.bg` поверх найгіршого фону (найсвітлішого для світлого тексту, найтемнішого для темного, включно з довільним контентом під шапкою = чорний/білий), поріг 4.5:1.
- **Аналітика:** `data-event="hero_switch_brand"` / `hero_switch_mode` на кнопках — через наявний делегований обробник.

### 4.4 Бюджет (очікування)

| Фаза | JS gzip на mobile | JS gzip на desktop |
|---|---|---|
| 1 Токени | 0 | 0 |
| 2 Glass | 0 | 0 |
| 3 Hero | ≈ +3 KB | ≈ +3 KB зразу, +≈ 44 KB GSAP після `load` (не блокує, TBT ≈ 0) |
| 4 Решта Home | ≈ +1 KB | ≈ +1 KB |

Ризик: Lighthouse desktop може врахувати GSAP у «unused JS»; якщо performance < 95 або нижче базового — GSAP вантажиться тільки після першого скролу/наведення на сцену.

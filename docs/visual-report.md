# Візуальний шар · звіт

Гілка `claude/portfolio-visual-layer-b6x1r4` від `main` @ `f6d8586`. Фази 0–4 виконано, кожна окремим комітом із перевірками.
Аудит і рішення Р1–Р4 — [`visual-audit.md`](visual-audit.md), базова лінія — [`visual-baseline.md`](visual-baseline.md).

## Було → стало

### Перевірки

| | Базова лінія | Фінал |
|---|---|---|
| `check-tokens` | ✓ · 55 ключів · 262 компонентні токени · 72 пари контрасту | ✓ · 55 ключів · 328 компонентних токенів · 108 пар (включно з glass поверх найгіршого фону) |
| `check-styles` | ✓ · 10 файлів · правила hex / px / font | ✓ · 12 файлів · + ms/s, cubic-bezier/ease-*, blur(), rgba()/hsla() |
| `astro check` | 0 / 0 / 0 (14 файлів) | 0 / 0 / 0 (18 файлів) |
| Білд | ✓ 5 сторінок | ✓ 5 сторінок |
| Маршрути × 16 комбінацій (тема × 390/1440 × reduced-motion) | 5 маршрутів, 0 аномалій | 5 маршрутів, 0 аномалій (без горизонтального скролу, H1 і текст на місці, 0 помилок у консолі) |
| axe `color-contrast`, сцена hero, 3 бренди × 2 теми × 390/1440 | — | 0 порушень |

### Lighthouse — Home `/en/`

| | Perf | A11y | BP | SEO | CLS | LCP | TBT |
|---|---|---|---|---|---|---|---|
| Mobile, база | 100 | 100 | 100 | 100 | 0.002 | 1 363 ms | 0 |
| Mobile, фінал | 100 | 100 | 100 | 100 | 0.002 | 906 ms | 0 |
| Desktop, база | 100 | 100 | 100 | 100 | 0.000 | 372 ms | 0 |
| Desktop, фінал | 100 | 100 | 100 | 100 | 0.005 | 326 ms | 0 |

LCP у локальних прогонах плаває 900–1 360 ms (mobile) і до, і після змін. `/uk/` mobile: 100, CLS 0.001–0.002.

### JS на Home (gzip)

| | Mobile | Desktop | Що |
|---|---|---|---|
| База | 69.2 KB | 69.2 KB | React-острів ThemeToggle + inline |
| Фаза 1 | +0 | +0 | тільки токени |
| Фаза 2 | +0.2 KB | +0.2 KB | inline: клас `has-grain` |
| Фаза 3 | +2.0 KB | +2.0 KB + **44.4 KB GSAP** | `hero-stage.ts` 1.8 KB; GSAP + ScrollTrigger — динамічний import після `load` + idle, тільки ≥ 900 × 720 і рух дозволено |
| Фаза 4 | +0.2 KB | +0.2 KB | IntersectionObserver у наявному скрипті Architecture |
| **Фінал** | **71.2 KB** (+2.0) | **115.1 KB** (+45.9, з них 44.4 — після load) | |

CSS Home: + `stage.css` 4.1 KB gzip (токени демо-брендів у scope сцени), + `visual.css` < 1 KB.

## Коміти (відкат по фазах)

| Фаза | Коміт | Що |
|---|---|---|
| 0 | `d466474` | аудит, базова лінія |
| 1 | `2794513` | токени: `tokens/site/*`, glass / grain / motion, прапорці build-css, чекери |
| 2.1 | `f573244` | монохром: значення `brand/site.json`, OG-картинки, favicon |
| 2 | `6317b95` | glass-шапка, glass-CTA, зерно, CTA hero стовпчиком < 560 px |
| 3 | `bbb62ea` | hero зі сценою шарів, GSAP, лічильники, i18n `stage`, demo-05 |
| 4 | `aeea22f` | рамка демо, hover-стани, поява ланцюжка резолву |

Відкат фази N і всього після неї: `git revert --no-edit <коміт N>^..HEAD` (історія не переписується).
Окремо, наприклад, тільки монохром: `git revert f573244` — конфліктів із пізнішими фазами немає (інші файли).
Повністю повернутись до базової лінії: `git revert --no-edit f6d8586..HEAD`.

## Додано / змінено

**Додано (15):** `docs/{visual-baseline,visual-audit,token-properties,visual-report}.md` ·
`tokens/site/{core,map,demo-motion}.json`, `tokens/site/theme/{light,dark}.json` ·
`site/src/styles/visual.css` · `site/src/components/HeroStage.astro` · `site/src/lib/stage.ts` ·
`site/src/scripts/{hero-stage,hero-motion}.ts` · `tasks/demo-04-motion-glass-tokens.md` · `tasks/demo-05-lobby-contrast.md`.

**Змінено (23)** — кожна правка перелічена в повідомленні відповідного коміту:

| Файл | Навіщо |
|---|---|
| `tokens/components.json` | + групи glass, grain, motion, stage, stageLight, legend, brandSwitch, demoLight; + `metric.hover`, `audience.hover`, `demoFrame.boxShadow`. Наявні токени не змінено |
| `tokens/brand/site.json` | **значення** product1/2/3, onProduct2 — монохром (Р1, погоджено). Ключі ті самі |
| `tokens/$themes.json`, `$metadata.json` | нові сети `site/*` |
| `tools/build-css.mjs` | `--site-sets`, `--brand-extra`, `--scope`, `--only-components`, `modify: alpha`, `boxShadow`. Без прапорців — вивід байт-у-байт той самий |
| `tools/check-tokens.mjs` | сети `site/*`, альфа-контраст поверх найгіршого фону, нові пари |
| `tools/check-styles.mjs` | правила на тривалості, easing, blur(), rgba() |
| `site/package.json`, `package-lock.json` | `tokens:stage`, `--site-sets`, `gsap` |
| `Header.astro` | glass-таблетка (загальна висота шапки та сама), nav на `glass.color.default` |
| `Button.astro` | + варіант `glass`; transition → токени |
| `DemoFrame.astro` | transition → токени; `z-index` над зерном; тінь рамки |
| `Architecture.astro` | поява ланцюжка резолву |
| `Base.astro` | `visual.css`; класи `js-motion`, `has-grain` у наявному inline-скрипті |
| `index.astro` | hero: колонка сцени, H1 по рядках (текст той самий), скрол-сцена, CTA стовпчиком < 560 px; обгортка світла демо; hover карток |
| `base.css` | reduced-motion ресет позначено `/* allow */` |
| `i18n/en.json`, `uk.json` | + блок `stage` (однакові ключі, UK повна). Наявні ключі не змінено |
| `og/en.png`, `og/uk.png`, `favicon.svg` | periwinkle → графіт (текст hero не змінювався) |
| `BRIEF.md`, `CLAUDE.md` | реєстр фактів (цифри hero), журнал; опис `tokens/site/` |

## Що не зроблено або зроблено інакше, і чому

1. **Ключі glass / motion / grain не в `brand/site.json` і альфа-кроки не в `core`.** Паритет ключів із демо і дзеркальність `core/map/theme`
   (CLAUDE.md) цього не дозволяють. Замість цього — власні сети `tokens/site/*` (погоджено, Р4). Постійне рішення — `tasks/demo-04`.
2. **Монохром із чорним текстом на CTA, не білим.** Дзеркальна тема демо світлить hover у light (`product1.300`) і active у dark —
   білий текст на графіті провалює AA за будь-якого значення. Тому `product1` = світлий графіт `#9EA1A9`, текст чорний (мінімум 4.69).
3. **Лобі-мокап показує не default-стани chip і не рядок провайдера.** Токени демо в цих станах не проходять AA (axe: до 1.43 у light) —
   це баги демо, записані в `tasks/demo-05` з цифрами. Мокап використовує `chip.*.hover`, promo з `promo.overlay.bg`, плитки без провайдера.
4. **Easing брендів (Aurum плавний, Nova різкий, Fiesta з перельотом)** — тимчасово в `tokens/site/demo-motion.json`: у брендах демо таких ключів немає (demo-04 п.2).
5. **«Aa» рендериться fallback-шрифтом** із назвою шрифту бренду поруч — шрифти демо-брендів не завантажуються (Р2, 0 KB).
6. **Pin — CSS `position: sticky`, не pin від ScrollTrigger.** Pin-spacer ScrollTrigger додає висоту після завантаження → зсув макета.
   Висоту сцени резервує CSS до першого рендера (клас `js-motion`), ScrollTrigger тільки скрабить.
7. **Зерно вмикається після `load` + шрифтів.** Повноекранний fixed-шар до підміни шрифтів провокував CLS 0.119 у Lighthouse. Без JS — без зерна (декор).
8. **CTA hero стовпчиком на < 560 px.** Знахідка по дорозі: під fallback-шрифтом дві кнопки на 412 px переносились, після Inter — ні
   (CLS 0.10, був і до змін; базовий Lighthouse пропустив його випадково). Стовпчик прибирає залежність від метрик шрифту.
9. **Старт появи з opacity 0.04, не 0** (`motion.reveal.opacity`): Chrome не рахує елемент з opacity 0 для LCP, і LCP чекав кінця анімації H1.
10. **Секції «Кейси» на Home ще немає** — фаза 4 торкнулась наявних секцій.
11. **Словник нових властивостей** — у `docs/token-properties.md`; скіл `portfolio-design-system` поза репо, перенесіть туди.
12. **OG-картинки** перезаписані з перефарбованою смугою — файли більші (124 → 165 KB, 105 → 147 KB) через інше PNG-стиснення; вміст той самий.
13. **Пуш заблоковано** (403: у сесії немає доступу на запис до `OzerovAndrey/Portfolio`). Коміти лежать локально в гілці до відновлення доступу.

## Як перевірити руками

`npm --prefix site run build && npx --prefix site astro preview` → `/en/`:
desktop ≥ 900 × 720 — скрол розводить стек, копі змінюється легендою; Nova/Fiesta — анімується тільки core-площина, лічильник «core N changed»;
«Темна тема» або перемикач у шапці — «semantic 41 remapped»; наведення на рядок легенди приглушує інші площини, клік закріплює.
Reduced motion — стек одразу розведений. 390 px — площини списком. Без JS — hero-копі, CTA і лобі видно.

# Візуальний шар · базова лінія (до змін)

Знято 24.09.2026 на коміті `f6d8586` (гілка `claude/portfolio-visual-layer-b6x1r4` = `main`).
Кожна фаза порівнюється з цими цифрами. Гірше хоч в одному рядку → фаза не комітиться.

## Перевірки

| Перевірка | Команда | Результат |
|---|---|---|
| Токени | `node tools/check-tokens.mjs` | ✓ parity · ✓ layers · ✓ refs (light, dark) · ✓ contrast — `brand/site: 55 keys · site-components: 262 tokens · contrast pairs: 72` |
| Стилі | `node tools/check-styles.mjs` | ✓ порушень немає |
| Генерація | `npm run tokens`, `npm run tokens:demo` | site: 33 734 B CSS, 588 токенів · demo: 59 624 B CSS, 1 039 токенів, 29 груп |
| Типи | `astro check` | 14 файлів · 0 errors · 0 warnings · 0 hints |
| Білд | `npm --prefix site run build` | ✓ 5 сторінок за ~1.1 s |

## Lighthouse — Home `/en/`

Lighthouse 12, headless Chromium, `astro preview` локально (base `/`). Звіти — не в репо (scratchpad сесії).

| | Performance | Accessibility | Best practices | SEO | CLS | LCP | TBT | JS (transfer) |
|---|---|---|---|---|---|---|---|---|
| Mobile | 100 | 100 | 100 | 100 | 0.002 | 1 363 ms | 0 ms | 69 KB |
| Desktop | 100 | 100 | 100 | 100 | 0.000 | 372 ms | 0 ms | 69 KB |

## Маршрути

Кожен перевірено в 16 комбінаціях: light/dark (системна тема) × 390/1440 px × `prefers-reduced-motion` no-preference/reduce.
Скрізь: HTTP 200, правильний `data-theme`, H1 на місці, текст `<main>` є, горизонтального скролу немає, 0 помилок у консолі.

| Маршрут | H1 | Символів у `<main>` |
|---|---|---|
| `/` | — (редірект на `/en/`) | — |
| `/en/` | Many brands. One codebase. | 3 220 |
| `/uk/` | Багато брендів. Один код. | 3 255 |
| `/en/contact/` | Let's talk | 220 |
| `/uk/contact/` | Поговорімо | 213 |

## JS на Home

| Файл | raw | gzip | Коли вантажиться |
|---|---|---|---|
| `client.*.js` (React runtime) | 212 922 B | 65.6 KB | `client:idle` для `ThemeToggle` |
| `react.*.js` | 7 899 B | 3.0 KB | те саме |
| `ThemeToggle.*.js` | 1 508 B | 0.9 KB | те саме |
| inline-скрипти (тема, демо-iframe, Architecture) | 6 564 B | 2.7 KB | у HTML |
| **Разом** | | **≈ 72 KB gzip** (Lighthouse: 69 KB transfer) | |

HTML Home: EN 61 KB (8.5 KB gzip), UK 61 KB (9.5 KB gzip). CSS: `Button.*.css` 52 KB + `index.*.css` 9.5 KB.

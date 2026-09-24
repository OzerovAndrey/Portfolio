# Нові властивості токенів сайту (візуальний шар)

Доповнення до словника «ім'я токена = CSS-властивість» (скіл `portfolio-design-system` → `references/token-architecture.md`).
Перенести туди, коли оновлюватимете скіл.

| Властивість у імені | CSS | Тип Token Studio | Шар | Приклад |
|---|---|---|---|---|
| `backdropFilter` | `backdrop-filter` | `backdropFilter` (other) | core → theme → component | `glass.backdropFilter` → `backdropFilter.glass` → `filter.glass` |
| `boxShadow` | `box-shadow` | `boxShadow` (композит) | theme → component | `glass.boxShadow` → `boxShadow.glass` (inner highlight + drop shadow) |
| `duration` | `transition-duration`, `animation-duration` | `duration` | core `time.*` → theme `duration.*` → component `motion.duration.*` | `motion.duration.fast` = 120ms |
| `easing` | `transition-timing-function`, `animation-timing-function` | `cubicBezier` | core `curve.*` → theme `easing.*` → component `motion.easing.*` | `motion.easing.out` = ease-out |
| `opacity` | `opacity` | `opacity` | core `opacity.*` → theme → component | `grain.opacity` |

## Прозорість

Тільки з альфа-рампи в map (`modify: alpha` від кольору бренду, рахується для кожного бренду):
`color.neutral.dark.alphaNN` (ink), `color.neutral.light.alphaNN` (white), `color.product1.alphaNN`.
`modify` у theme чи component заборонено. `rgba()` у стилях ловить `tools/check-styles.mjs`.

## Де лежить

`tokens/site/` — власні сети портфоліо, яких немає в демо (не дзеркало, `sync-demo-tokens` їх не чіпає):

| Файл | Шар | Що |
|---|---|---|
| `site/core.json` | core | `time.*`, `curve.*`, `filter.*`, `opacity.*` |
| `site/map.json` | map | альфа-рампи (тимчасово, до demo-04) |
| `site/theme/light.json`, `dark.json` | theme | `color.glass.*`, `color.stage.*`, `boxShadow.*`, `backdropFilter.*`, `opacity.grain`, `duration.*`, `easing.*`, `borderRadius.pill` |
| `site/demo-motion.json` | brand (демо) | `motion.easing.brand`, `motion.duration.brand` для брендів демо (тимчасово, до demo-04) |

Контраст тексту на напівпрозорому фоні `check-tokens` міряє після компонування поверх найгіршого фону: чорного й білого.

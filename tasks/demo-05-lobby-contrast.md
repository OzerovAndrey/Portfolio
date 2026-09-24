# Задача для «Multibrand Design System» · demo-05 · контраст компонентів лобі (axe)

**Пріоритет:** середній. Знайдено 24.09.2026, коли мокап лобі в hero портфоліо зібрали на компонентних токенах демо
(`Portfolio/site/src/components/HeroStage.astro`) і прогнали axe-core `color-contrast` для 3 брендів × 2 тем.
Портфоліо поки показує тільки стани, що проходять AA (див. кінець). Цифри — WCAG 2.x, текст 12 px, поріг 4.5:1.

| Токен (стан) | Семантика | Light | Dark |
|---|---|---|---|
| `chip.selected.color.default` на `chip.selected.bg.default` | `text.accent` на `fill.primary.subtle` | Aurum 2.02 · Nova 1.62 · Fiesta 1.43 | Fiesta 4.15 |
| `chip.color.default` на `chip.bg.default` | `text.secondary` на `fill.secondary.default` | Aurum 3.78 | ✓ |
| `promo.title.color` / `promo.text.color` на `art.jackpot.bg` (без overlay) | `text.onOverlay` на `illustration.stage.primary` | Aurum 3.57 · Nova 2.91 · Fiesta 2.02 | ✓ |
| `gameTile.provider.color` на `card.default.bg` | `text.tertiary` на `bg.secondary` | Aurum 1.91 · Nova 2.36 · Fiesta 2.31 | Aurum 4.26 · Nova 3.53 · Fiesta 3.09 |

1. **`text.accent` у light** — та сама причина, що в demo-03 п.1 (`product1.500` світлий). Рішення з demo-03 (`product1.900`) закриває й chip.selected.
2. **`chip.color.default`** в Aurum light: `text.secondary` (neutral.600 від теплого ink) на `fill.secondary.default` — або темніший `text.secondary` для Aurum, або chip default → `text.primary`.
3. **Promo без overlay** — у демо текст завжди лежить на `promo.overlay.bg`; якщо банер може бути без картинки, overlay має бути обов'язковим шаром компонента.
4. **`text.tertiary`** для дрібного тексту (провайдер гри) не проходить у жодному бренді/темі. Або `gameTile.provider.color` → `text.secondary`, або `text.tertiary` тільки для ≥ 18 px.

**Що зараз робить портфоліо:** chip — стани `*.hover` (`text.primary`; selected — `fill.primary.default` + `onPrimary`),
promo — `art.jackpot.bg` + `promo.overlay.bg`, плитки без рядка провайдера. Після виправлення в демо — повернути default-стани.

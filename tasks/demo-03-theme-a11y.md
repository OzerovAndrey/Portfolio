# Задача для «Multibrand Design System» · demo-03 · контраст і адаптивна типографіка в темах

**Пріоритет:** середній. Знайдено, коли будували бренд `site` для портфоліо (`Portfolio/tools/check-tokens.mjs`).

1. **`theme/light` → `color.text.accent` = `product1.500`** на `bg.primary` не проходить AA 4.5:1 у жодного бренду:
   Aurum 2.13 · Nova 1.67 · Fiesta 1.42 · Ultra 3.03. `product1.700` теж мало (3.37 / 2.70 / 1.87 / 3.99).
   Проходить `product1.900`: 7.48 / 6.32 / 4.81 / 8.67. Варіант: light `color.text.accent` і `color.outline.focus` → `product1.900`.
2. **Неявний контракт hover.** Light-тема світлить hover (`product1.300`), dark — темнить (`product1.700`).
   Це працює, тільки коли `onProduct1` темний. Зафіксувати правило в CLAUDE.md демо: «product1 — світлий, onProduct1 — чорний»,
   або додати перевірку контрасту `onProduct1` на 300/500/700 у `build-skill.py`.
3. **`color.bg.tertiary` у dark = `neutral.900` = `color.bg.primary`.** Секції, що чергують фон, у dark зливаються.
   Варіант: dark `bg.tertiary` → проміжний крок між 900 і 800 (зараз у map його немає — додати `neutral.850`).
4. **Адаптивні text styles.** `display.d1` (56) на 390px ламає довгі UK-слова. Портфоліо тимчасово перевизначає розмір
   hero на мобільних. Варіант: `typography.display.d1` посилається на `fontSize.display.d1` з brand/layout по брейкпоінтах.

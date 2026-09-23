# Задача для «Multibrand Design System» · demo-01 · параметри build-css

**Пріоритет:** низький (портфоліо вже працює на своїй копії скрипта). Мета — щоб копія не розходилась з оригіналом.

Застосувати `demo-01-build-css-params.patch` (`git apply`, +25/−10 рядків). Додає прапорці `--tokens`, `--brand-file`,
`--brands`, `--components-file`, `--no-demo-components`, `--out-css|meta|manifest`. Без прапорців вихід демо
байт-у-байт той самий (перевірено на `tokens.generated.css`, `tokens-manifest.json`, `meta.json`).

Після цього `Portfolio/tools/build-css.mjs` можна синхронізувати з демо так само, як сети токенів.

**Коміт:** `tools(build-css): параметри шляхів і зовнішніх брендів`

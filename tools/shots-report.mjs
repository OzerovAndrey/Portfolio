#!/usr/bin/env node
// SHOTS.md — чекліст скрінів з маніфесту site/src/content/shots.json.
// Статус: ready, якщо файл лежить у site/src/assets/<file>, інакше placeholder. Запуск: npm --prefix site run shots:report
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shots = JSON.parse(readFileSync(resolve(ROOT, "site/src/content/shots.json"), "utf8"));
const rows = shots.map((s) => ({ ...s, ready: existsSync(resolve(ROOT, "site/src/assets", s.file)) }));
const done = rows.filter((r) => r.ready).length;

const blocks = [...new Set(rows.map((r) => r.block))];
const md = [
  "# Скріни",
  "",
  "Автогенеровано: `npm --prefix site run shots:report`. Не редагувати вручну — правки в `site/src/content/shots.json`.",
  "",
  `Готово: **${done} / ${rows.length}**. Заміна скріна = покласти PNG за шляхом із колонки «Файл» (від \`site/src/assets/\`) і запушити.`,
  "",
  ...blocks.flatMap((b) => [
    `## ${b}`,
    "",
    "| id | Що зняти | Розмір | Пропорція | Файл | Статус |",
    "|---|---|---|---|---|---|",
    ...rows.filter((r) => r.block === b).map((r) => `| \`${r.id}\` | ${r.what.uk} | ${r.size} | ${r.ratio} | \`${r.file}\` | ${r.ready ? "ready" : "placeholder"} |`),
    "",
  ]),
].join("\n");
writeFileSync(resolve(ROOT, "SHOTS.md"), md);
console.log(`✓ shots:report — ${done}/${rows.length} ready → SHOTS.md`);

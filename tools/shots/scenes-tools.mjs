// Кадри інструментів: відтворення інтерфейсів Token Studio, Figma, VS Code, терміналу, Chrome DevTools і GitHub
// на СПРАВЖНІХ даних: сети/теми/значення з tokens/ демо, обчислені браузером CSS-змінні, вивід команд, git-коміт Ultra.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, fontLink, demoCssHref } from "./lib.mjs";
import { BRANDS, demoPage } from "./demo.mjs";
import * as D from "./data.mjs";

const NAMES = { aurum: "Aurum", nova: "Nova", fiesta: "Fiesta", ultra: "Ultra" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const img = (file) => `data:image/webp;base64,${readFileSync(resolve(ROOT, "site/src/assets", file)).toString("base64")}`;
const isColor = (v) => /^#[0-9a-f]{3,8}$/i.test(String(v)) || /^rgb/.test(String(v));
const doc = (css, body) => `<!doctype html><html><head><meta charset="utf-8">${fontLink("Inter:wght@400;500;600;700", "JetBrains Mono:wght@400;500;600")}
  <style>*{box-sizing:border-box;margin:0;padding:0}body{width:100vw;height:100vh;overflow:hidden;font:400 12px/1.45 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:#1e1e1e}
  .mono{font-family:"JetBrains Mono",monospace}${css}</style></head><body>${body}</body></html>`;
const shoot = async (scenePage, name, html, width, height) => { const p = await scenePage(name, html, { width, height }); const b = await p.screenshot(); await p.close(); return b; };
/** у якому сеті визначено токен (для підписів ланцюжка) */
const layerOf = (name, brand, theme) => {
  for (const s of ["components", "typography", `theme/${theme}`, "map", `brand/${brand}`, "core"]) if (name in D.flat(D.set(s))) return s;
  return "";
};

/* ================= Figma + плагін Token Studio ================= */
const FIGMA_CSS = `
  .fg{position:absolute;inset:0;background:#e5e5e5}
  .fg__bar{position:absolute;inset:0 0 auto 0;height:40px;background:#2c2c2c;color:#fff;display:flex;align-items:center;gap:12px;padding:0 14px;font-size:11.5px}
  .fg__bar b{font-weight:500}.fg__bar span{opacity:.5}
  .fg__logo{display:grid;grid-template-columns:7px 7px;gap:0}.fg__logo i{width:7px;height:7px;border-radius:50%}
  .fg__l,.fg__r{position:absolute;top:40px;bottom:0;background:#2c2c2c;color:#e6e6e6;border-color:#3a3a3a}
  .fg__l{left:0;width:220px;border-right:1px solid #3a3a3a;padding:12px 0}.fg__r{right:0;width:220px;border-left:1px solid #3a3a3a}
  .fg__l h6{font-size:11px;font-weight:600;padding:0 14px 8px}.fg__l p{padding:5px 14px 5px var(--i,14px);font-size:11px;color:#cfcfcf;display:flex;gap:7px;align-items:center}
  .fg__l p.on{background:#0d99ff33;color:#fff}.fg__l p i{width:9px;height:9px;border:1.3px solid #9a9a9a;border-radius:2px;display:inline-block}
  .fg__cv{position:absolute;top:40px;left:220px;right:220px;bottom:0;overflow:hidden}
  .fg__frame{position:absolute;left:36px;top:46px;width:620px;box-shadow:0 1px 3px rgba(0,0,0,.15)}
  .fg__frame img{display:block;width:100%}.fg__fname{position:absolute;left:36px;top:28px;font-size:11px;color:#6b6b6b}
  .fg__r .sec{padding:12px 14px;border-bottom:1px solid #3a3a3a;font-size:11px}.fg__r .sec b{display:block;margin-bottom:8px;color:#fff;font-weight:600}
  .fg__r .row{display:flex;justify-content:space-between;color:#bdbdbd;padding:3px 0}
  /* Token Studio */
  .ts{position:absolute;background:#fff;border-radius:8px;box-shadow:0 0 0 1px rgba(0,0,0,.12),0 24px 60px -12px rgba(0,0,0,.45);overflow:hidden;display:flex;flex-direction:column;color:#1b1b1f}
  .ts__title{height:34px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid #ececec;font-weight:600;font-size:11.5px;background:#fafafa}
  .ts__title em{font-style:normal;font-weight:400;color:#8a8a8a}.ts__title .x{margin-left:auto;color:#9a9a9a}
  .ts__mark{width:16px;height:16px;border-radius:4px;background:#18181b;display:grid;place-items:center;color:#fff;font-size:9px;font-weight:700}
  .ts__tabs{height:38px;display:flex;align-items:stretch;gap:18px;padding:0 14px;border-bottom:1px solid #ececec}
  .ts__tabs span{display:flex;align-items:center;color:#8a8a8a;font-weight:500;border-bottom:2px solid transparent}.ts__tabs span.on{color:#18181b;border-color:#18181b}
  .ts__tabs .sp{flex:1;border:0}.ts__theme{align-self:center;display:flex;gap:6px;align-items:center;padding:5px 9px;border:1px solid #e3e3e3;border-radius:6px;color:#18181b;font-weight:500}
  .ts__body{flex:1;display:grid;grid-template-columns:210px 1fr;min-height:0}
  .ts__side{border-right:1px solid #ececec;padding:12px 8px;overflow:hidden}
  .ts__h{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8a8a8a;padding:0 6px 8px}
  .set{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:5px;font-size:11.5px}.set.on{background:#f1f1f3;font-weight:600}
  .set .c{margin-left:auto;font:500 10px/1 "JetBrains Mono",monospace;color:#9a9a9a}
  .set .ind{padding-left:20px}
  .cb{width:13px;height:13px;border-radius:3px;border:1.5px solid #c4c4c8;flex:none;display:grid;place-items:center}
  .cb.en{background:#18181b;border-color:#18181b}.cb.en::after{content:"";width:6px;height:3px;border:solid #fff;border-width:0 0 1.6px 1.6px;transform:rotate(-45deg) translate(1px,-1px)}
  .cb.src{border-color:#18181b}.cb.src::after{content:"";width:7px;height:1.6px;background:#18181b}
  .ts__main{padding:14px 18px;overflow:hidden}
  .grp{margin-bottom:14px}.grp__h{display:flex;align-items:center;gap:8px;font-weight:600;margin-bottom:8px;font-size:11.5px}.grp__h span{font:500 10px "JetBrains Mono",monospace;color:#9a9a9a}
  .sw{display:flex;flex-wrap:wrap;gap:10px}.sw div{display:grid;grid-template-columns:26px 1fr;column-gap:7px;width:132px;align-items:center}
  .sw i{grid-row:span 2;width:26px;height:26px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}
  .sw b{font-weight:500;font-size:11px}.sw code{font:10px "JetBrains Mono",monospace;color:#8a8a8a}
  .pills{display:flex;flex-wrap:wrap;gap:6px}.pill{padding:4px 8px;border-radius:6px;background:#f1f1f3;font-size:11px;display:flex;gap:6px}.pill code{font:10px "JetBrains Mono",monospace;color:#8a8a8a}
  .ts__foot{height:36px;border-top:1px solid #ececec;display:flex;align-items:center;gap:10px;padding:0 14px;font-size:11px;color:#6b6b6b}
  .ts__foot .btn{margin-left:auto;background:#18181b;color:#fff;border-radius:6px;padding:6px 12px;font-weight:600}
  .dot{width:7px;height:7px;border-radius:50%;background:#16a34a;display:inline-block}
`;
const LAYERS = ["Header", "Promo · Welcome bonus", "Categories", "Popular games", "Live casino", "Tournaments", "Footer"];
function figma({ frameImg, rightPanel = "", page = "Lobby", sel = 1 }) {
  return `<div class="fg"><div class="fg__bar"><span class="fg__logo"><i style="background:#f24e1e"></i><i style="background:#ff7262"></i><i style="background:#a259ff"></i><i style="background:#1abcfe"></i><i style="background:#0acf83"></i><i></i></span>
    <b>Multibrand Design System</b><span>/ ${page}</span></div>
    <div class="fg__l"><h6>Layers</h6><p>▾ <i></i> Lobby — Desktop 1440</p>${LAYERS.map((l, i) => `<p style="--i:34px" class="${i === sel ? "on" : ""}"><i></i>${l}</p>`).join("")}</div>
    <div class="fg__cv"><div class="fg__fname">Lobby — Desktop 1440</div><div class="fg__frame"><img src="${frameImg}"></div></div>
    <div class="fg__r">${rightPanel}</div></div>`;
}
const tsWindow = ({ x, y, w, h, tab, theme, side, main, foot }) => `<div class="ts" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
  <div class="ts__title"><span class="ts__mark">TS</span>Tokens Studio <em>— plugin</em><span class="x">✕</span></div>
  <div class="ts__tabs">${["Tokens", "Inspect", "Settings"].map((t) => `<span class="${t === tab ? "on" : ""}">${t}</span>`).join("")}<span class="sp"></span><span class="ts__theme">◐ ${theme} ▾</span></div>
  <div class="ts__body" style="${side ? "" : "grid-template-columns:1fr"}">${side ? `<div class="ts__side">${side}</div>` : ""}<div class="ts__main">${main}</div></div>
  <div class="ts__foot">${foot ?? `<span class="dot"></span> GitHub · OzerovAndrey/multibrand-design-system · main<span class="btn">Apply to document</span>`}</div></div>`;

/** Дерево сетів у порядку $metadata зі станом для активних тем */
function setTree(states, active) {
  const order = D.metadata().tokenSetOrder;
  const groups = {};
  for (const s of order) { const [g, n] = s.includes("/") ? s.split("/") : [null, s]; (groups[g ?? s] ??= []).push({ s, n: n ?? s, nested: !!g }); }
  return `<div class="ts__h">Token sets</div>` + Object.entries(groups).map(([g, items]) =>
    (items[0].nested ? `<div class="set">▾ <b style="font-weight:500">${g}</b></div>` : "") +
    items.map(({ s, n, nested }) => `<div class="set${s === active ? " on" : ""}"${nested ? ' style="padding-left:22px"' : ""}><span class="cb ${states[s] === "enabled" ? "en" : states[s] === "source" ? "src" : ""}"></span>${n}<span class="c">${D.count(s)}</span></div>`).join("")
  ).join("") + `<div style="margin-top:14px;padding:8px 6px;border-top:1px solid #ececec;display:grid;gap:6px;color:#6b6b6b;font-size:10.5px">
    <span style="display:flex;gap:7px;align-items:center"><span class="cb en"></span>enabled — у документі</span>
    <span style="display:flex;gap:7px;align-items:center"><span class="cb src"></span>source — тільки для посилань</span></div>`;
}
const stateFor = (brand, theme) => {
  const s = {};
  for (const t of D.themes()) {
    const pick = (t.group === "Brand" && t.name.toLowerCase() === brand) || (t.group === "Theme" && t.name.toLowerCase() === theme) || ["Base", "Typography", "Components"].includes(t.group);
    if (pick) for (const [k, v] of Object.entries(t.selectedTokenSets)) if (v !== "disabled" && s[k] !== "enabled") s[k] = v;
  }
  return s;
};

const tsSets = async ({ scenePage, width, height }) => {
  const brand = "aurum", tokens = D.flat(D.set(`brand/${brand}`));
  const v = (n) => D.brandValue(n, brand);
  const colors = Object.keys(tokens).filter((k) => k.startsWith("color."));
  const grp = (title, keys) => `<div class="grp"><div class="grp__h">${title}<span>${keys.length}</span></div><div class="pills">${keys.map((k) => `<span class="pill">${k.split(".").at(-1)}<code>${esc(v(k))}</code></span>`).join("")}</div></div>`;
  const main = `<div class="grp"><div class="grp__h">color<span>${colors.length}</span></div><div class="sw">${colors.map((k) => `<div><i style="background:${v(k)}"></i><b>${k.slice(6)}</b><code>${v(k)}</code></div>`).join("")}</div></div>`
    + grp("fontFamily", ["fontFamily.display", "fontFamily.base"]) + grp("borderRadius · borderWidth", ["borderRadius.control", "borderRadius.surface", "borderWidth.none", "borderWidth.control"])
    + grp("space.padding", Object.keys(tokens).filter((k) => k.startsWith("space.padding"))) + grp("space.gap", Object.keys(tokens).filter((k) => k.startsWith("space.gap")))
    + grp("size.control", Object.keys(tokens).filter((k) => k.startsWith("size.control"))) + grp("layout.columns", Object.keys(tokens).filter((k) => k.startsWith("layout.columns")));
  const html = doc(FIGMA_CSS, figma({ frameImg: img("shots/brand-morph/lobby-aurum-light.webp") })
    + tsWindow({ x: 330, y: 70, w: 880, h: 800, tab: "Tokens", theme: "Aurum · Light", side: setTree(stateFor(brand, "light"), `brand/${brand}`), main: `<div style="display:flex;justify-content:space-between;margin-bottom:12px"><b style="font-size:13px">brand/aurum</b><span class="mono" style="color:#8a8a8a;font-size:10.5px">${Object.keys(tokens).length} tokens · same keys in every brand</span></div>${main}` }));
  return shoot(scenePage, "ts-sets", html, width, height);
};

const tsChain = async ({ newPage, scenePage, width, height }) => {
  const tok = "button.primary.bg.default";
  const c = D.chain(tok, "aurum", "light");
  const per = {};
  for (const b of BRANDS) per[b] = (await D.computed(newPage, b, "light", ["--button-primary-bg-default", "--color-fill-primary-default"]))["--button-primary-bg-default"];
  const rows = [["Fill", tok], ["Text", "button.primary.color.default"], ["Height", "button.size.lg"], ["Padding X", "button.paddingH.lg"], ["Gap", "button.gap.lg"], ["Radius", "button.borderRadius"]];
  const node = (n, i) => `<div class="nd"><span class="nd__l">${layerOf(n, "aurum", "light") || "value"}</span><b class="mono">${n}</b></div>${i < c.names.length - 1 ? '<span class="ar">→</span>' : ""}`;
  const css = FIGMA_CSS + `
    .tbl{display:grid;grid-template-columns:90px 1fr auto;border:1px solid #ececec;border-radius:8px;overflow:hidden;margin-bottom:16px}
    .tbl>*{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:11.5px}.tbl .h{background:#fafafa;color:#8a8a8a;font-size:10px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
    .tbl .hi{background:#f4f4ff}
    .ch{border:1px solid #e6e6ea;border-radius:10px;padding:16px;background:#fbfbfc}
    .ch__row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .nd{background:#fff;border:1px solid #e3e3e8;border-radius:8px;padding:8px 10px;display:grid;gap:3px}.nd b{font-size:11.5px;font-weight:500}
    .nd__l{font-size:9.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8a8a8a}.ar{color:#9a9a9a;font-size:14px}
    .val{display:flex;align-items:center;gap:8px;background:#18181b;color:#fff;border-radius:8px;padding:8px 12px}.val i{width:18px;height:18px;border-radius:5px;box-shadow:0 0 0 1px #fff3}
    .br{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.br div{border:1px solid #e6e6ea;border-radius:8px;overflow:hidden;background:#fff}
    .br i{display:block;height:44px}.br p{padding:7px 10px;display:flex;justify-content:space-between;font-size:11px}.br code{font:10.5px "JetBrains Mono",monospace;color:#6b6b6b}`;
  const main = `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px"><b style="font-size:13px">Promo / Claim bonus <span style="color:#8a8a8a;font-weight:400">· Button instance</span></b><span class="mono" style="font-size:10.5px;color:#8a8a8a">6 tokens applied</span></div>
    <div class="tbl"><span class="h">Property</span><span class="h">Token</span><span class="h">Aurum · light</span>${rows.map(([p, t]) => { const ch = D.chain(t, "aurum", "light"); return `<span class="${t === tok ? "hi" : ""}">${p}</span><span class="mono ${t === tok ? "hi" : ""}">${t}</span><span class="mono ${t === tok ? "hi" : ""}" style="color:#6b6b6b">${esc(ch.raw)}</span>`; }).join("")}</div>
    <div class="ch"><div style="font-weight:600;margin-bottom:10px">Resolution · ${tok}</div><div class="ch__row">${c.names.map(node).join("")}<span class="ar">→</span><span class="val"><i style="background:${c.raw}"></i><b class="mono">${c.raw}</b></span></div>
    <div style="margin-top:14px;font-weight:600">Same token, other brand sets</div><div class="br">${BRANDS.map((b) => `<div><i style="background:${per[b]}"></i><p>${NAMES[b]}<code>${per[b]}</code></p></div>`).join("")}</div></div>`;
  const html = doc(css, figma({ frameImg: img("shots/brand-morph/lobby-aurum-light.webp") }) + tsWindow({ x: 300, y: 80, w: 920, h: 780, tab: "Inspect", theme: "Aurum · Light", main }));
  return shoot(scenePage, "ts-chain", html, width, height);
};

const tsThemes = async ({ newPage, scenePage, width, height }) => {
  const th = D.themes();
  const sel = th.find((t) => t.group === "Brand" && t.name === "Aurum");
  const combos = {};
  for (const b of BRANDS) for (const t of ["light", "dark"]) combos[`${b}-${t}`] = await D.computed(newPage, b, t, ["--color-bg-primary", "--color-fill-primary-default", "--color-text-primary", "--color-bg-secondary"]);
  const groups = [...new Set(th.map((t) => t.group))];
  const order = D.metadata().tokenSetOrder;
  const seg = (state) => `<span class="seg">${["disabled", "source", "enabled"].map((s) => `<i class="${s === state ? "on" : ""}">${s[0].toUpperCase() + s.slice(1)}</i>`).join("")}</span>`;
  const css = FIGMA_CSS + `
    .shade{position:absolute;inset:0;background:rgba(0,0,0,.35)}
    .md{position:absolute;left:150px;top:70px;width:1140px;height:780px;background:#fff;border-radius:10px;box-shadow:0 30px 80px -20px rgba(0,0,0,.5);display:grid;grid-template-rows:48px 1fr}
    .md__h{display:flex;align-items:center;padding:0 18px;border-bottom:1px solid #ececec;font-weight:600;font-size:13px;gap:10px}.md__h span{margin-left:auto;color:#9a9a9a}
    .md__b{display:grid;grid-template-columns:220px 1fr 330px;min-height:0}
    .tl{border-right:1px solid #ececec;padding:14px 10px}.tl h6{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#8a8a8a;padding:10px 8px 6px}
    .tl p{padding:6px 8px;border-radius:6px;font-size:12px;display:flex;justify-content:space-between}.tl p.on{background:#f1f1f3;font-weight:600}.tl p code{font:10px "JetBrains Mono",monospace;color:#9a9a9a}
    .ss{padding:16px 20px;overflow:hidden}.ss__tabs{display:flex;gap:16px;border-bottom:1px solid #ececec;margin-bottom:10px}.ss__tabs span{padding:8px 0;color:#8a8a8a;font-weight:500}.ss__tabs .on{color:#18181b;border-bottom:2px solid #18181b}
    .sr{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f3f3f3;font-size:12px}
    .seg{display:flex;background:#f1f1f3;border-radius:6px;padding:2px}.seg i{font-style:normal;font-size:10.5px;padding:3px 8px;border-radius:4px;color:#8a8a8a}.seg i.on{background:#fff;color:#18181b;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.12)}
    .mx{border-left:1px solid #ececec;padding:16px;background:#fafafa}.mx h6{font-size:12px;margin-bottom:4px}.mx small{color:#8a8a8a;display:block;margin-bottom:12px}
    .mx__g{display:grid;grid-template-columns:52px 1fr 1fr;gap:8px;align-items:center}.mx__g>span{font-size:11px;color:#6b6b6b}
    .cell{height:68px;border-radius:8px;padding:8px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
    .cell b{width:42px;height:14px;border-radius:4px;display:block}.cell em{font:normal 500 9.5px "JetBrains Mono",monospace}`;
  const tl = groups.map((g) => `<h6>${g}</h6>${th.filter((t) => t.group === g).map((t) => `<p class="${t === sel ? "on" : ""}">${t.name}<code>${Object.keys(t.$figmaVariableReferences ?? {}).length || Object.keys(t.$figmaStyleReferences ?? {}).length}</code></p>`).join("")}`).join("");
  const ss = `<div class="ss__tabs"><span class="on">Sets</span><span>Styles &amp; Variables · ${Object.keys(sel.$figmaVariableReferences ?? {}).length}</span></div>${order.map((s) => `<div class="sr"><span class="mono">${s}</span>${seg(sel.selectedTokenSets[s] ?? "disabled")}</div>`).join("")}`;
  const mx = `<h6>Brand × Theme</h6><small>${BRANDS.length} × 2 = ${BRANDS.length * 2} combinations, one component library</small><div class="mx__g"><span></span><span>Light</span><span>Dark</span>${BRANDS.map((b) => `<span>${NAMES[b]}</span>${["light", "dark"].map((t) => { const c = combos[`${b}-${t}`]; return `<div class="cell" style="background:${c["--color-bg-primary"]};color:${c["--color-text-primary"]}"><b style="background:${c["--color-fill-primary-default"]}"></b><em>${b}·${t}</em></div>`; }).join("")}`).join("")}</div>`;
  const html = doc(css, figma({ frameImg: img("shots/brand-morph/lobby-aurum-light.webp") }) + `<div class="shade"></div><div class="md"><div class="md__h">Themes · Tokens Studio<span>✕</span></div><div class="md__b"><div class="tl">${tl}</div><div class="ss"><div style="font-weight:600;font-size:13px;margin-bottom:10px">Brand / Aurum</div>${ss}</div><div class="mx">${mx}</div></div></div>`);
  return shoot(scenePage, "ts-themes", html, width, height);
};

const figmaVariables = async ({ scenePage, width, height }) => {
  const th = D.themes();
  const cnt = (g) => Object.keys(th.find((t) => t.group === g)?.$figmaVariableReferences ?? {}).length;
  const brandTokens = Object.keys(D.flat(D.set("brand/aurum")));
  const groups = [["color", brandTokens.filter((k) => k.startsWith("color."))], ["fontFamily", ["fontFamily.display", "fontFamily.base"]], ["borderRadius", ["borderRadius.control", "borderRadius.surface"]], ["size/control", ["size.control.md", "size.control.lg"]], ["space/padding", ["space.padding.md", "space.padding.lg"]]];
  const cell = (k, b) => { const v = D.brandValue(k, b); return isColor(v) ? `<span class="c"><i style="background:${v}"></i>${String(v).toUpperCase()}</span>` : `<span class="c"><u>${/^\d+$/.test(v) ? "#" : "Aa"}</u>${esc(v)}${/^\d+$/.test(v) ? "" : ""}</span>`; };
  const css = `
    body{background:#1e1e1e;color:#e6e6e6}
    .bg{position:absolute;inset:0;background:#e5e5e5 url(${img("shots/brand-morph/lobby-nova-dark.webp")}) 340px 120px/760px auto no-repeat;filter:saturate(.9)}
    .sh{position:absolute;inset:0;background:rgba(0,0,0,.45)}
    .vm{position:absolute;left:70px;top:50px;right:70px;bottom:50px;background:#2c2c2c;border-radius:10px;box-shadow:0 30px 90px rgba(0,0,0,.55);display:grid;grid-template-columns:230px 1fr;overflow:hidden;border:1px solid #444}
    .vm__l{border-right:1px solid #3d3d3d;padding:14px 10px}.vm__l h6{font-size:11px;font-weight:600;color:#fff;padding:2px 8px 12px}
    .vm__l p{display:flex;justify-content:space-between;padding:7px 8px;border-radius:5px;font-size:11.5px;color:#cfcfcf}.vm__l p.on{background:#0d99ff;color:#fff;font-weight:500}.vm__l code{font:10.5px "JetBrains Mono",monospace;opacity:.7}
    .vm__l .g{margin-top:16px;padding:0 8px;font-size:10.5px;color:#8a8a8a;line-height:1.6}
    .vm__m{display:flex;flex-direction:column;min-width:0}
    .vm__top{height:46px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid #3d3d3d;font-weight:600;color:#fff}.vm__top span{margin-left:auto;color:#9a9a9a;font-weight:400}
    table{border-collapse:collapse;width:100%;font-size:11.5px}th,td{text-align:left;padding:0 14px;height:31px;border-bottom:1px solid #383838;white-space:nowrap}
    th{color:#a8a8a8;font-weight:500;height:36px}th.m{color:#fff}td:first-child{color:#e6e6e6;width:230px}
    tr.gh td{color:#fff;font-weight:600;background:#262626;height:28px}
    .c{display:flex;align-items:center;gap:7px;font-family:"JetBrains Mono",monospace;font-size:11px;color:#dcdcdc}.c i{width:14px;height:14px;border-radius:3px;box-shadow:inset 0 0 0 1px #ffffff26}
    .c u{text-decoration:none;width:14px;height:14px;border-radius:3px;background:#3d3d3d;display:grid;place-items:center;font:600 8px Inter;color:#bbb}
    td .vn{display:flex;align-items:center;gap:8px}td .vn i{width:12px;height:12px;border:1.3px solid #888;border-radius:50%}`;
  const rows = groups.map(([g, keys]) => `<tr class="gh"><td colspan="5">${g}</td></tr>` + keys.map((k) => `<tr><td><span class="vn"><i></i>${k.replace(/\./g, "/")}</span></td>${BRANDS.map((b) => `<td>${cell(k, b)}</td>`).join("")}</tr>`).join("")).join("");
  const html = doc(css, `<div class="bg"></div><div class="sh"></div><div class="vm"><div class="vm__l"><h6>Local variables</h6>
    <p>Base<code>${cnt("Base")}</code></p><p class="on">Brand<code>${cnt("Brand")}</code></p><p>Theme<code>${cnt("Theme")}</code></p><p>Components<code>${cnt("Components")}</code></p>
    <div class="g">Brand · ${BRANDS.length} modes<br>${D.count("brand/aurum")} brand keys + ${D.count("map")} map ramps<br>same names in every mode</div></div>
    <div class="vm__m"><div class="vm__top">Brand<span>${BRANDS.length} modes · ${cnt("Brand")} variables</span></div>
    <table><thead><tr><th>Name</th>${BRANDS.map((b) => `<th class="m">${NAMES[b]}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></div>`);
  return shoot(scenePage, "figma-vars", html, width, height);
};

const tsSync = async ({ scenePage, width, height }) => {
  const u = D.ultraCommit();
  const tokFiles = u.files.filter((f) => f.f.startsWith("tokens/"));
  const prov = ["Local document", "URL", "JSONBin", "GitHub", "GitLab", "Bitbucket", "Azure DevOps", "Supernova"];
  const field = (l, v, mono = true) => `<label class="fl"><span>${l}</span><b class="${mono ? "mono" : ""}">${v}</b></label>`;
  const css = FIGMA_CSS + `
    .pv{display:grid;gap:4px}.pv p{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid #ececec;border-radius:7px;font-size:12px}.pv p.on{border-color:#18181b;font-weight:600}
    .pv p i{width:13px;height:13px;border-radius:50%;border:1.5px solid #c4c4c8}.pv p.on i{border:4px solid #18181b}
    .fl{display:grid;gap:4px;margin-bottom:10px}.fl span{font-size:10.5px;color:#8a8a8a;font-weight:500}.fl b{font-weight:500;font-size:12px;border:1px solid #e3e3e8;border-radius:6px;padding:8px 10px;background:#fafafa}
    .push{position:absolute;left:800px;top:330px;width:540px;background:#fff;border-radius:10px;box-shadow:0 0 0 1px rgba(0,0,0,.12),0 30px 70px -10px rgba(0,0,0,.5);padding:18px}
    .push h4{font-size:14px;margin-bottom:12px}.fx{display:flex;justify-content:space-between;font:11.5px "JetBrains Mono",monospace;padding:6px 0;border-bottom:1px solid #f1f1f3}
    .fx .a{color:#16a34a}.fx .d{color:#dc2626}.go{margin-top:14px;display:flex;justify-content:flex-end;gap:8px}.go span{padding:8px 14px;border-radius:6px;font-weight:600;border:1px solid #e3e3e8}.go span:last-child{background:#18181b;color:#fff;border-color:#18181b}`;
  const main = `<div style="display:grid;grid-template-columns:200px 1fr;gap:20px"><div><div class="ts__h" style="padding-left:0">Token storage</div><div class="pv">${prov.map((p) => `<p class="${p === "GitHub" ? "on" : ""}"><i></i>${p}</p>`).join("")}</div></div>
    <div><div class="ts__h" style="padding-left:0">GitHub</div>${field("Name", "multibrand-design-system", false)}${field("Repository (owner/repo)", "OzerovAndrey/multibrand-design-system")}${field("Default branch", "main")}${field("File path (folder for multi-file sync)", "tokens")}${field("Personal access token", "••••••••••••••••••••")}</div></div>`;
  const push = `<div class="push"><h4>Push to GitHub</h4>${field("Commit message", esc(u.subject.length > 64 ? u.subject.slice(0, 62) + "…" : u.subject), false)}${field("Branch", "main")}
    <div class="ts__h" style="padding:6px 0">Changed token files</div>${tokFiles.map((f) => `<div class="fx"><span>${f.f}</span><span><span class="a">+${f.a}</span> <span class="d">−${f.d}</span></span></div>`).join("")}
    <div class="go"><span>Cancel</span><span>Push changes</span></div></div>`;
  const html = doc(css, figma({ frameImg: img("shots/brand-morph/lobby-ultra-light.webp") }) + tsWindow({ x: 250, y: 90, w: 760, h: 700, tab: "Settings", theme: "Ultra · Light", main }) + push);
  return shoot(scenePage, "ts-sync", html, width, height);
};

/* ================= VS Code / термінал ================= */
const CODE_CSS = `
  body{background:#181818;color:#cccccc}
  .vs{position:absolute;inset:0;display:grid;grid-template-rows:34px 1fr 24px;grid-template-columns:46px 270px 1fr}
  .vs__t{grid-column:1/-1;background:#1f1f1f;border-bottom:1px solid #2b2b2b;display:flex;align-items:center;gap:8px;padding:0 12px;font-size:12px;color:#9d9d9d}
  .vs__t i{width:11px;height:11px;border-radius:50%;display:inline-block}.vs__t b{margin:0 auto;font-weight:400}
  .vs__a{background:#181818;border-right:1px solid #2b2b2b}.vs__a i{display:block;width:22px;height:22px;margin:12px auto;border:1.6px solid #6e6e6e;border-radius:5px}.vs__a i:first-child{border-color:#d7d7d7}
  .vs__e{background:#181818;border-right:1px solid #2b2b2b;padding:8px 0;font-size:12.5px}
  .vs__e h6{font-size:11px;font-weight:600;letter-spacing:.04em;padding:4px 18px 8px;color:#bbb}
  .tr{display:flex;align-items:center;gap:6px;height:23px;padding-left:calc(14px + var(--d,0) * 14px);color:#cccccc;white-space:nowrap}.tr.on{background:#37373d;outline:1px solid #0078d4;outline-offset:-1px}
  .tr .ic{width:14px;text-align:center;font-size:10px}.tr .n{margin-left:auto;margin-right:12px;font:11px "JetBrains Mono",monospace;color:#6e7681}
  .vs__m{display:flex;min-width:0;background:#1f1f1f}.ed{flex:1;min-width:0;display:flex;flex-direction:column;border-right:1px solid #2b2b2b}
  .ed__tabs{height:35px;display:flex;background:#181818;border-bottom:1px solid #2b2b2b}.ed__tabs span{display:flex;align-items:center;gap:6px;padding:0 14px;font-size:12.5px;color:#9d9d9d;border-right:1px solid #2b2b2b}.ed__tabs span.on{background:#1f1f1f;color:#fff;border-top:1px solid #0078d4}
  .ed__crumb{height:22px;padding:0 16px;font-size:11.5px;color:#8b8b8b;display:flex;align-items:center}
  pre{font:12.5px/20px "JetBrains Mono",monospace;padding:4px 0;overflow:hidden;flex:1}pre .ln{display:inline-block;width:44px;text-align:right;padding-right:18px;color:#6e7681}
  .k{color:#9cdcfe}.s{color:#ce9178}.n{color:#b5cea8}.p{color:#d4d4d4}.sel{color:#d7ba7d}.v{color:#9cdcfe}.c{color:#6a9955}
  .hl{background:#2a3a2a}
  .vs__s{grid-column:1/-1;background:#181818;border-top:1px solid #2b2b2b;display:flex;align-items:center;gap:16px;padding:0 12px;font-size:11.5px;color:#9d9d9d}.vs__s b{background:#0078d4;color:#fff;padding:0 8px;height:24px;display:flex;align-items:center;margin-left:-12px;font-weight:400}
  .term{height:170px;border-top:1px solid #2b2b2b;background:#181818;font:12px/19px "JetBrains Mono",monospace;padding:8px 16px;color:#cccccc}.term .tt{font:11px Inter;color:#e7e7e7;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;border-bottom:1px solid #2b2b2b;padding-bottom:6px}
  .g{color:#3fb950}.y{color:#d29922}.dim{color:#7d8590}`;
const hlJson = (line) => esc(line).replace(/(&quot;|")([^"]+)(")(\s*:)/, '<span class="k">"$2"</span>$4').replace(/:\s*"([^"]*)"/, ': <span class="s">"$1"</span>').replace(/:\s*(\d+)/, ': <span class="n">$1</span>');
const hlCss = (line) => esc(line).replace(/^(:root[^{]*)\{/, '<span class="sel">$1</span>{').replace(/(--[\w-]+)(:)/, '<span class="v">$1</span>$2').replace(/(\/\*.*\*\/)/, '<span class="c">$1</span>').replace(/(#[0-9A-Fa-f]{3,8})/, '<span class="s">$1</span>');
const pre = (lines, hl, start = 1) => `<pre>${lines.map((l, i) => `<span class="ln">${start + i}</span>${hl(l)}`).join("\n")}</pre>`;
const vsTree = (open) => {
  const T = [[0, "▸", ".github"], [0, "▸", "site"], [0, "▸", "skill"], [0, "▾", "tokens"], [1, "▾", "brand"], ...BRANDS.map((b) => [2, "{}", `${b}.json`, D.count(`brand/${b}`), `tokens/brand/${b}.json`]), [1, "▾", "theme"], [2, "{}", "dark.json", D.count("theme/dark"), "tokens/theme/dark.json"], [2, "{}", "light.json", D.count("theme/light"), "tokens/theme/light.json"],
    [1, "{}", "$metadata.json"], [1, "{}", "$themes.json"], [1, "{}", "components.json", D.count("components")], [1, "{}", "core.json", D.count("core")], [1, "{}", "map.json", D.count("map")], [1, "{}", "typography.json", D.count("typography")],
    [0, "▾", "tools"], [1, "JS", "build-css.mjs"], [1, "PY", "build-art.py"], [1, "PY", "build-skill.py"], [0, "M↓", "CLAUDE.md"], [0, "M↓", "README.md"]];
  return T.map(([d, ic, n, c, path]) => `<div class="tr${open.includes(path) ? " on" : ""}" style="--d:${d}"><span class="ic">${ic}</span>${n}${c ? `<span class="n">${c}</span>` : ""}</div>`).join("");
};
const vs = ({ title, tree, editors, term, status }) => `<div class="vs"><div class="vs__t"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><b>${title}</b></div>
  <div class="vs__a"><i></i><i></i><i></i><i></i></div><div class="vs__e"><h6>EXPLORER · MULTIBRAND-DESIGN-SYSTEM</h6>${tree}</div>
  <div class="vs__m"><div style="flex:1;display:flex;flex-direction:column;min-width:0"><div style="flex:1;display:flex;min-height:0">${editors.map((e) => `<div class="ed"><div class="ed__tabs"><span class="on">${e.name}</span></div><div class="ed__crumb">${e.crumb}</div>${e.body}</div>`).join("")}</div>${term ?? ""}</div></div>
  <div class="vs__s"><b>⎇ main</b><span>${status}</span></div></div>`;

const repoFolder = async ({ scenePage, width, height }) => {
  const file = (b) => readFileSync(resolve(D.DEMO_REPO, `tokens/brand/${b}.json`), "utf8").split("\n").slice(0, 38);
  const html = doc(CODE_CSS, vs({ title: "multibrand-design-system — tokens/brand", tree: vsTree(["tokens/brand/aurum.json", "tokens/brand/ultra.json"]),
    editors: ["aurum", "ultra"].map((b) => ({ name: `${b}.json`, crumb: `tokens › brand › ${b}.json`, body: pre(file(b), hlJson) })),
    status: `${D.count("brand/aurum")} keys in every brand file · same names, different values` }));
  return shoot(scenePage, "repo-folder", html, width, height);
};

const cssOutput = async ({ scenePage, width, height }) => {
  const css = D.demoCss().split("\n");
  const block = (b) => { const i = css.findIndex((l) => l.startsWith(`:root[data-brand="${b}"]`)); return css.slice(i, i + 27); };
  const start = (b) => css.findIndex((l) => l.startsWith(`:root[data-brand="${b}"]`)) + 1;
  const out = D.run("node ../tools/build-css.mjs", resolve(D.DEMO_REPO, "site")).trim();
  const html = doc(CODE_CSS, vs({ title: "multibrand-design-system — site/src/styles/tokens.generated.css", tree: vsTree([]),
    editors: ["aurum", "nova"].map((b) => ({ name: "tokens.generated.css", crumb: `site › src › styles › tokens.generated.css › :root[data-brand="${b}"]`, body: pre(block(b), hlCss, start(b)) })),
    term: `<div class="term"><div class="tt">Terminal</div><span class="dim">~/multibrand-design-system/site</span> <span class="g">$</span> node ../tools/build-css.mjs\n<br>${esc(out)}<br><span class="dim">~/multibrand-design-system/site</span> <span class="g">$</span> <span style="background:#ccc;color:#181818">&nbsp;</span></div>`,
    status: "GENERATED by tools/build-css.mjs from ../tokens — do not edit" }));
  return shoot(scenePage, "css-output", html, width, height);
};

const terminalBuild = async ({ scenePage, width, height }) => {
  const demoOut = D.run("npm run build", resolve(D.DEMO_REPO, "site")).trim();
  const chk = D.run("node tools/check-tokens.mjs", ROOT).trim();
  const sty = D.run("node tools/check-styles.mjs", ROOT).trim();
  const color = (t) => esc(t).replace(/^(✓.*)$/gm, '<span class="g">$1</span>').replace(/(✓)/g, '<span class="g">$1</span>').replace(/^(&gt; .*)$/gm, '<span class="dim">$1</span>');
  const prompt = (dir, cmd) => `<span class="pr">${dir}</span> <span class="g">❯</span> <b>${cmd}</b>`;
  const css = `body{background:radial-gradient(120% 90% at 30% 10%,#3a3a40 0%,#1b1b1f 60%,#121214 100%)}
    .tw{position:absolute;left:110px;top:60px;right:110px;bottom:60px;background:#0f1012ee;border-radius:12px;box-shadow:0 0 0 1px #ffffff14,0 40px 100px rgba(0,0,0,.6);overflow:hidden;display:flex;flex-direction:column}
    .tw__t{height:36px;display:flex;align-items:center;gap:8px;padding:0 14px;color:#8b8b8b;font-size:12px;border-bottom:1px solid #ffffff10}.tw__t i{width:12px;height:12px;border-radius:50%}.tw__t b{margin:0 auto;font-weight:500}
    pre{flex:1;padding:16px 22px;font:13px/20px "JetBrains Mono",monospace;color:#d6d6d6;white-space:pre-wrap;overflow:hidden}
    .g{color:#3fb950}.dim{color:#7d8590}.pr{color:#79c0ff}b{font-weight:500;color:#fff}`;
  const body = `<div class="tw"><div class="tw__t"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><b>zsh — build &amp; checks</b></div><pre>${prompt("~/multibrand-design-system/site", "npm run build")}
${color(demoOut)}

${prompt("~/portfolio", "node tools/check-tokens.mjs")}
${color(chk)}

${prompt("~/portfolio", "node tools/check-styles.mjs")}
${color(sty)}

${prompt("~/portfolio", "")}<span style="background:#d6d6d6">&nbsp;</span></pre></div>`;
  return shoot(scenePage, "terminal", doc(css, body), width, height);
};

/* ================= Chrome DevTools ================= */
const DT_CSS = `
  body{background:#202124}
  .br{position:absolute;inset:0;display:grid;grid-template-rows:40px 1fr}
  .br__t{background:#dee1e6;display:flex;align-items:center;gap:10px;padding:0 12px}.br__t i{width:12px;height:12px;border-radius:50%}
  .url{flex:1;max-width:760px;margin-left:40px;background:#fff;border-radius:16px;height:26px;display:flex;align-items:center;padding:0 14px;font-size:12px;color:#3c4043}
  .vp{position:relative;overflow:hidden}.vp img{display:block;width:100%}
  .dt{position:absolute;left:0;right:0;bottom:0;background:#282828;border-top:1px solid #3c3c3c;color:#e3e3e3;display:flex;flex-direction:column}
  .dt__tabs{height:28px;display:flex;align-items:center;gap:16px;padding:0 10px;border-bottom:1px solid #3c3c3c;font-size:12px;color:#9aa0a6}.dt__tabs .on{color:#e3e3e3;border-bottom:2px solid #7cacf8;padding-bottom:5px;margin-top:7px}
  .dt__b{flex:1;display:grid;grid-template-columns:1fr 470px;min-height:0}
  .dom{font:12px/19px "JetBrains Mono",monospace;padding:8px 10px;border-right:1px solid #3c3c3c;overflow:hidden;white-space:nowrap}
  .tg{color:#5db0d7}.at{color:#9bbbdc}.av{color:#f29766}.tx{color:#bdc6cf}.selrow{background:#3a4a5e;margin:0 -10px;padding:0 10px}
  .sty{padding:0;font:12px/19px "JetBrains Mono",monospace;overflow:hidden}.sty__tabs{display:flex;gap:14px;padding:5px 10px;border-bottom:1px solid #3c3c3c;font:12px Inter;color:#9aa0a6}.sty__tabs .on{color:#e3e3e3}
  .rule{padding:6px 10px;border-bottom:1px solid #3c3c3c}.rule .src{float:right;color:#9aa0a6;text-decoration:underline;font-family:Inter;font-size:11px}
  .sel{color:#e3e3e3}.pn{color:#9bbbdc;padding-left:16px}.pv{color:#f29766}.sw{display:inline-block;width:10px;height:10px;border:1px solid #888;margin:0 4px -1px 0}
  .flt{padding:5px 10px;border-bottom:1px solid #3c3c3c;font:12px Inter;color:#9aa0a6}`;
const browserShot = async (newPage, brand, theme) => {
  const p = await demoPage(newPage, { brand, theme, width: 1440, height: 900, scale: 2 });
  const b = await p.screenshot(); await p.close();
  return `data:image/png;base64,${b.toString("base64")}`;
};
const devtoolsAttr = async ({ newPage, scenePage, width, height, demoDist }) => {
  const brand = "nova", theme = "dark";
  const shot = await browserShot(newPage, brand, theme);
  const css = D.demoCss().split("\n");
  const i = css.findIndex((l) => l.startsWith(`:root[data-brand="${brand}"]`));
  const vars = css.slice(i + 1, i + 15).map((l) => l.trim().replace(/;$/, "")).map((l) => { const [k, ...v] = l.split(":"); return [k, v.join(":").trim()]; });
  const vals = await D.computed(newPage, brand, theme, vars.map(([k]) => k));
  const cssFile = demoCssHref(demoDist).split("/").pop();
  const dom = `<div>&lt;!DOCTYPE html&gt;</div><div class="selrow">▾ <span class="tg">&lt;html</span> <span class="at">lang</span>=<span class="av">"en"</span> <span class="at" style="background:#5a4a1e">data-brand</span>=<span class="av" style="background:#5a4a1e">"${brand}"</span> <span class="at">data-theme</span>=<span class="av">"${theme}"</span><span class="tg">&gt;</span> <span style="color:#9aa0a6">== $0</span></div>
    <div style="padding-left:16px">▸ <span class="tg">&lt;head&gt;</span><span class="tx">…</span><span class="tg">&lt;/head&gt;</span></div><div style="padding-left:16px">▾ <span class="tg">&lt;body&gt;</span></div>
    <div style="padding-left:32px">▾ <span class="tg">&lt;div</span> <span class="at">id</span>=<span class="av">"root"</span><span class="tg">&gt;</span></div><div style="padding-left:48px">▸ <span class="tg">&lt;div</span> <span class="at">class</span>=<span class="av">"app"</span><span class="tg">&gt;</span><span class="tx">…</span><span class="tg">&lt;/div&gt;</span></div>
    <div style="padding-left:48px">▸ <span class="tg">&lt;div</span> <span class="at">class</span>=<span class="av">"panel is-expanded"</span><span class="tg">&gt;</span><span class="tx">…</span><span class="tg">&lt;/div&gt;</span></div><div style="padding-left:32px"><span class="tg">&lt;/div&gt;</span></div><div style="padding-left:16px"><span class="tg">&lt;/body&gt;</span></div><div><span class="tg">&lt;/html&gt;</span></div>`;
  const sty = `<div class="sty__tabs"><span class="on">Styles</span><span>Computed</span><span>Layout</span><span>Event Listeners</span></div><div class="flt">Filter</div>
    <div class="rule"><span class="src">${cssFile}</span><span class="sel">:root[data-brand="${brand}"] {</span>${vars.map(([k, v]) => `<div class="pn">${k}: <span class="pv">${isColor(vals[k]) ? `<span class="sw" style="background:${vals[k]}"></span>` : ""}${esc(v)}</span>;</div>`).join("")}<span class="sel">}</span></div>`;
  const html = doc(DT_CSS, `<div class="br"><div class="br__t"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><div class="url">ozerovandrey.github.io/multibrand-design-system/?brand=${brand}&amp;theme=${theme}</div></div>
    <div class="vp"><img src="${shot}"><div class="dt" style="height:470px"><div class="dt__tabs"><span class="on">Elements</span><span>Console</span><span>Sources</span><span>Network</span><span>Performance</span></div><div class="dt__b"><div class="dom">${dom}</div><div class="sty">${sty}</div></div></div></div></div>`);
  return shoot(scenePage, "devtools-attr", html, width, height);
};

const devtoolsComputed = async ({ newPage, scenePage, width, height }) => {
  const names = ["--button-primary-bg-default", "--button-primary-color-default", "--button-borderRadius", "--button-size-md", "--color-fill-primary-default", "--color-bg-primary", "--color-text-primary", "--fontFamily-display", "--borderRadius-control", "--space-padding-md"];
  const pair = ["aurum", "fiesta"];
  const vals = {}, shots = {};
  for (const b of pair) { vals[b] = await D.computed(newPage, b, "light", names); shots[b] = await browserShot(newPage, b, "light"); }
  const pane = (b) => `<div class="pp"><div class="br__t"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><div class="url" style="margin-left:14px">…/multibrand-design-system/?brand=<b>${b}</b>&amp;theme=light</div></div>
    <div class="vp2"><img src="${shots[b]}"></div><div class="cp"><div class="dt__tabs"><span>Elements</span><span>Console</span></div><div class="sty__tabs"><span>Styles</span><span class="on">Computed</span><span>Layout</span></div>
    <div class="flt">Filter: <b style="color:#e3e3e3">--</b> · html[data-brand="${b}"]</div>${names.map((n) => { const v = vals[b][n], diff = vals[pair[0]][n] !== vals[pair[1]][n]; return `<div class="cr${diff ? " df" : ""}"><span class="pn">${n}</span><span class="pv">${isColor(v) ? `<span class="sw" style="background:${v}"></span>` : ""}${esc(v)}</span></div>`; }).join("")}</div></div>`;
  const css = DT_CSS + `body{background:#1b1b1d}.wrap{position:absolute;inset:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
    .pp{background:#282828;border-radius:10px;overflow:hidden;display:grid;grid-template-rows:40px 330px 1fr;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    .vp2{overflow:hidden}.vp2 img{width:100%;display:block}.cp{border-top:1px solid #3c3c3c;font:12px/19px "JetBrains Mono",monospace;color:#e3e3e3}
    .cr{display:flex;justify-content:space-between;padding:3px 12px;border-bottom:1px solid #333}.cr .pn{padding:0}.cr.df{background:#3a3220}.url b{font-weight:700}`;
  const html = doc(css, `<div class="wrap">${pair.map(pane).join("")}</div>`);
  return shoot(scenePage, "devtools-computed", html, width, height);
};

/* ================= GitHub commit ================= */
const gitDiff = async ({ scenePage, width, height }) => {
  const u = D.ultraCommit();
  const add = u.files.reduce((s, f) => s + f.a, 0), del = u.files.reduce((s, f) => s + f.d, 0);
  const lines = u.patch.split("\n").slice(5, 5 + 34);
  const shown = u.files.filter((f) => !f.f.startsWith("skill/"));
  const skill = u.files.length - shown.length;
  const css = `body{background:#0d1117;color:#e6edf3;font-size:13px}
    .gh{position:absolute;inset:0;display:grid;grid-template-rows:62px auto 1fr}
    .gh__top{background:#010409;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:12px;padding:0 24px;color:#e6edf3;font-weight:600}.gh__top span{color:#7d8590;font-weight:400}
    .cm{padding:18px 24px;border-bottom:1px solid #30363d}.cm h1{font-size:20px;font-weight:600;margin-bottom:8px}.cm p{color:#7d8590}.cm p b{color:#e6edf3;font-weight:600}
    .cm code{font:12px "JetBrains Mono",monospace;background:#161b22;border:1px solid #30363d;border-radius:6px;padding:2px 6px;color:#e6edf3}
    .bd{display:grid;grid-template-columns:320px 1fr;min-height:0}
    .ft{border-right:1px solid #30363d;padding:14px 16px;font:12px/24px "JetBrains Mono",monospace;overflow:hidden}.ft .a{color:#3fb950}.ft .d{color:#f85149}.ft div{display:flex;justify-content:space-between}.ft .tk{color:#e6edf3;font-weight:600}.ft .ot{color:#7d8590}
    .df{padding:14px 18px;overflow:hidden}.fh{display:flex;justify-content:space-between;background:#161b22;border:1px solid #30363d;border-radius:6px 6px 0 0;padding:8px 12px;font:12.5px "JetBrains Mono",monospace}
    .fh b{font-weight:600}.fh span{color:#7d8590}
    pre{border:1px solid #30363d;border-top:0;border-radius:0 0 6px 6px;font:12px/19px "JetBrains Mono",monospace;overflow:hidden}
    pre div{display:grid;grid-template-columns:50px 18px 1fr}pre .ad{background:#0f2b1a}pre .hn{background:#121d2f;color:#7d8590}
    pre .ln{color:#3fb950;text-align:right;padding-right:10px;opacity:.7}pre .sg{color:#3fb950}
    .k{color:#79c0ff}.s{color:#a5d6ff}.n{color:#79c0ff}`;
  const hl = (l) => esc(l).replace(/"([^"]+)"(\s*:)/, '<span class="k">"$1"</span>$2').replace(/:\s*"([^"]*)"/, ': <span class="s">"$1"</span>');
  const body = `<div class="gh"><div class="gh__top">OzerovAndrey / multibrand-design-system <span>· Commit</span></div>
    <div class="cm"><h1>${esc(u.subject)}</h1><p><b>${esc(u.author)}</b> committed on ${u.date} · <code>${u.sha.slice(0, 7)}</code> · Showing <b>${u.files.length} changed files</b> with <b style="color:#3fb950">${add} additions</b> and <b style="color:#f85149">${del} deletions</b></p></div>
    <div class="bd"><div class="ft">${shown.map((f) => `<div><span class="${f.f.startsWith("tokens/") ? "tk" : "ot"}">${f.f}</span><span><span class="a">+${f.a}</span> <span class="d">−${f.d}</span></span></div>`).join("")}<div><span class="ot">skill/** (regenerated)</span><span class="ot">${skill} files</span></div>
      <p style="margin-top:16px;color:#7d8590;font-family:Inter;font-size:12.5px;line-height:1.55">tokens/components.json — <b style="color:#e6edf3">not touched</b>.<br>Components reference semantics only, so a new brand is a new brand file.</p></div>
    <div class="df"><div class="fh"><b>tokens/brand/ultra.json</b><span>new file · +${u.files.find((f) => f.f === "tokens/brand/ultra.json").a}</span></div>
      <pre>${lines.map((l, i) => l.startsWith("@@") ? `<div class="hn"><span></span><span></span><span>${esc(l)}</span></div>` : `<div class="ad"><span class="ln">${i}</span><span class="sg">+</span><span>${hl(l.slice(1))}</span></div>`).join("")}</pre></div></div></div>`;
  return shoot(scenePage, "git-diff", doc(css, body), width, height);
};

export const toolScenes = {
  "ts-sets-panel": tsSets,
  "ts-token-chain": tsChain,
  "ts-themes-matrix": tsThemes,
  "figma-variables-modes": figmaVariables,
  "ts-github-sync": tsSync,
  "repo-tokens-folder": repoFolder,
  "css-output": cssOutput,
  "terminal-build": terminalBuild,
  "devtools-data-brand": devtoolsAttr,
  "devtools-computed": devtoolsComputed,
  "git-diff-ultra": gitDiff,
};

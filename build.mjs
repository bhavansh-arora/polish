// Builds the pages: _src/pages/*.html + _src/partials -> *.html at the repository root.
// assets/, css/ and js/ are served as they are, so the repository root is the deployable site
// (GitHub Pages serves it at polish.codebunny.net). Usage: node build.mjs   (no dependencies)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, "_src");
const SITE = "https://polish.nz";

const read = (p) => readFileSync(join(src, p), "utf8");
const partials = Object.fromEntries(
  readdirSync(join(src, "partials")).map((f) => [f.replace(/\.html$/, ""), read(join("partials", f))])
);

// Shared content (pillars) lives in js/data.js so the browser and the build use one source.
const win = {};
new Function("window", readFileSync(join(root, "js/data.js"), "utf8"))(win);
const pillars = win.POLISH.pillars;
const pad = (n) => String(n).padStart(2, "0");

const arrow = '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const icons = {
  arr: arrow,
  btn: `<span class="btn__icon" aria-hidden="true">${arrow.replace('class="arr"', "")}</span>`,
  circle: `<span class="circle-btn" aria-hidden="true">${arrow.replace('class="arr"', "")}</span>`,
  arrow: `<span class="btn__icon" aria-hidden="true">${arrow.replace('class="arr"', "")}</span>`,
  arrowlink: arrow,
  star: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2l1.8 6.9L21 12l-7.2 3.1L12 22l-1.8-6.9L3 12l7.2-3.1z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
};

const generated = {
  pillarCards: pillars.map((p, i) => `
          <article class="pcard">
            <div class="pcard__top"><span class="label">Pillar ${pad(i + 1)} / 09</span><span class="label">${p.short}</span></div>
            <div class="pcard__big" aria-hidden="true">${pad(i + 1)}</div>
            <h3>${p.title}</h3>
            <p>${p.body}</p>
            <p class="pcard__q">“${p.question}”</p>
          </article>`).join(""),
  pillarGrid: pillars.map((p, i) => `
          <article class="card" data-reveal>
            <span class="card__num">Pillar ${pad(i + 1)}</span>
            <h3>${p.title}</h3>
            <p>${p.body}</p>
            <p class="pcard__q" style="margin-top:20px">“${p.question}”</p>
          </article>`).join(""),
  preloaderWords: pillars.map((p) => `<span>${p.short}</span>`).join(""),
};

const nav = [
  ["coaching", "coaching.html", "Coaching"],
  ["programmes", "programmes.html", "Programmes"],
  ["approach", "approach.html", "Approach"],
  ["speaking", "speaking.html", "Speaking"],
  ["about", "about.html", "About"],
  ["insights", "insights.html", "Insights"],
];
const menuNav = [
  ["home", "index.html", "Home"],
  ["coaching", "coaching.html", "Executive <em>coaching</em>"],
  ["programmes", "programmes.html", "Programmes"],
  ["approach", "approach.html", "The nine <em>pillars</em>"],
  ["speaking", "speaking.html", "Speaking"],
  ["about", "about.html", "About <em>Melissa</em>"],
  ["contact", "contact.html", "Say <em>hello</em>"],
];

function parse(file) {
  const raw = read(join("pages", file));
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (m) m[1].split("\n").forEach((l) => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  return { meta, body: m ? raw.slice(m[0].length) : raw };
}

function fill(tpl, ctx) {
  return tpl
    .replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, n) => fill(partials[n] ?? "", ctx))
    .replace(/\{\{icon:(\w+)\}\}/g, (_, n) => icons[n] ?? "")
    .replace(/\{\{(\w+)\}\}/g, (_, k) => (ctx[k] ?? generated[k] ?? ""));
}

const pages = readdirSync(join(src, "pages")).filter((f) => f.endsWith(".html"));
for (const file of pages) {
  const { meta, body } = parse(file);
  const key = meta.nav || "";
  const navLinks = nav.map(([k, href, label]) => `<a class="nav__link" href="${href}"${k === key ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const menuLinks = menuNav.map(([k, href, label], i) => `<a href="${href}"${k === key ? ' aria-current="page"' : ""}><span class="menu__num">${pad(i + 1)}</span>${label}</a>`).join("");
  const scripts = (meta.scripts || "").split(",").map((s) => s.trim()).filter(Boolean)
    .map((s) => `<script src="js/${s}.js" defer></script>`).join("\n  ");
  const ctx = {
    title: meta.title ? `${meta.title} — Polish` : "Polish — Executive Coaching & AI Leadership, New Zealand",
    description: meta.description || "",
    canonical: `${SITE}/${file === "index.html" ? "" : file.replace(/\.html$/, "")}`,
    robots: meta.robots || "index, follow",
    bodyClass: `page-${file.replace(/\.html$/, "")} ${meta.bodyClass || ""}`.trim(),
    navLinks, menuLinks, scripts,
  };
  ctx.content = fill(body, ctx);
  writeFileSync(join(root, file), fill(partials.layout, ctx));
  console.log("built", file);
}

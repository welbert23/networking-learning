#!/usr/bin/env node
/**
 * Builds self-contained single-file copies of every page into dist/.
 *
 * Each page keeps its split sources (assets/css, assets/js) for maintenance;
 * this script inlines the stylesheets, scripts and favicon so the output file
 * can be opened, copied or shared on its own with no assets/ folder.
 *
 * Usage: node build.js
 */
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const outDir = path.join(root, "dist");
const pages = [
  "index.html",
  "Networking-Ebook.html",
  "IP-Calculator.html",
  "Network-Lab.html",
  "widgets/ipcalc.html"
];

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const svgDataUri = "data:image/svg+xml;base64," + fs.readFileSync(path.join(root, "assets/favicon.svg")).toString("base64");

function inlineHtml(html, pageDir) {
  let out = html;
  const usedAssets = [];

  out = out.replace(/<link\b[^>]*rel="icon"[^>]*>/gi, () => {
    usedAssets.push("assets/favicon.svg");
    return `<link rel="icon" href="${svgDataUri}" type="image/svg+xml">`;
  });

  out = out.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/gi, (tag, href) => {
    const file = path.resolve(pageDir, href);
    usedAssets.push(path.relative(root, file).split(path.sep).join("/"));
    return `<style data-source="${path.basename(file)}">\n${read(file).trim()}\n</style>`;
  });

  out = out.replace(/<script\b[^>]*src="([^"]+\.js)"[^>]*>\s*<\/script>/gi, (tag, src) => {
    const file = path.resolve(pageDir, src);
    usedAssets.push(path.relative(root, file).split(path.sep).join("/"));
    return `<script data-source="${path.basename(file)}">\n${read(file).trim()}\n</script>`;
  });

  return { html: out, usedAssets };
}

function build() {
  fs.mkdirSync(outDir, { recursive: true });
  let failures = 0;

  for (const page of pages) {
    const source = path.join(root, page);
    const target = path.join(outDir, page);
    const { html, usedAssets } = inlineHtml(read(page), path.dirname(source));
    const leftovers = html.match(/(?:href|src)="(?:\.\.\/)?assets\/[^"]*"/gi);

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html, "utf8");

    const size = (Buffer.byteLength(html, "utf8") / 1024).toFixed(0);
    const status = leftovers ? "FAIL" : "ok";
    if (leftovers) failures += 1;
    console.log(`${status.padEnd(5)} ${page.padEnd(22)} ${size.padStart(5)} KB  (${usedAssets.length} assets inlined)`);
    if (leftovers) console.log(`      unresolved: ${[...new Set(leftovers)].join(", ")}`);
  }

  if (failures) {
    console.error(`\n${failures} page(s) still reference the assets folder.`);
    process.exitCode = 1;
  } else {
    console.log(`\nBuilt ${pages.length} standalone pages in dist/`);
  }
}

build();

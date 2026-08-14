#!/usr/bin/env node
/*
  Vantage build.

  app.jsx is the source of truth. This compiles it to plain JavaScript and
  writes index.html with the result inlined, so the browser never has to run
  Babel. That is the difference between ~3s and ~0.3s to first paint on a
  desktop, and ~9s vs ~1.2s on a phone-class CPU — plus 555KB of Babel that
  no longer has to be downloaded at all.

  index.html stays a single self-contained file with no runtime dependency
  on this script. You only need to run it after editing app.jsx.

    npm install @babel/standalone     # once
    node build.js

  The compiled code is wrapped in an IIFE. The old <script type="text/babel"
  data-type="module"> ran with module scope, so nothing reached the global
  object; the wrapper preserves that rather than dumping ~590 top-level
  names onto window.
*/
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "app.jsx");
const OUT = path.join(ROOT, "index.html");
const SHELL = path.join(ROOT, "index.shell.html");

function loadBabel() {
  for (const p of ["@babel/standalone", path.join(ROOT, "node_modules/@babel/standalone")]) {
    try { return require(p); } catch (e) { /* try the next location */ }
  }
  console.error("Cannot find @babel/standalone. Run:  npm install @babel/standalone");
  process.exit(1);
}

// Minification is optional: it takes ~110KB off the page and about 12% off
// load time on a mobile connection, but a build without it is still correct.
function loadTerser() {
  for (const p of ["terser", path.join(ROOT, "node_modules/terser")]) {
    try { return require(p); } catch (e) { /* try the next location */ }
  }
  return null;
}

const MARKER = "<!--APP-->";

async function main() {
  if (!fs.existsSync(SRC)) { console.error("Missing " + SRC); process.exit(1); }
  if (!fs.existsSync(SHELL)) { console.error("Missing " + SHELL); process.exit(1); }

  const jsx = fs.readFileSync(SRC, "utf8");
  const shell = fs.readFileSync(SHELL, "utf8");
  if (!shell.includes(MARKER)) {
    console.error("index.shell.html has no " + MARKER + " placeholder.");
    process.exit(1);
  }

  const t0 = Date.now();
  const { code } = loadBabel().transform(jsx, {
    presets: [["react", { runtime: "classic" }]],
    filename: "app.jsx",
    compact: true,
    comments: false,
  });
  const compiledMs = Date.now() - t0;

  let out = code;
  let minMs = 0;
  const terser = loadTerser();
  if (terser) {
    const t1 = Date.now();
    // toplevel mangling is safe precisely because of the IIFE below — nothing
    // in here is reachable by name from outside, and no code depends on
    // Function.prototype.name.
    const res = await terser.minify(code, {
      compress: { passes: 2 },
      mangle: { toplevel: true },
      format: { comments: false },
    });
    if (res.error) { console.error("terser failed:", res.error); process.exit(1); }
    out = res.code;
    minMs = Date.now() - t1;
  } else {
    console.log("(terser not installed — shipping unminified; npm install terser for a smaller page)");
  }

  // A literal </script> anywhere in the compiled output (inside a string, say)
  // would end the tag early and corrupt the document.
  const safe = out.replace(/<\/script>/gi, "<\\/script>");
  const block = '<script>(function(){"use strict";\n' + safe + "\n})();</script>";

  const html = shell.replace(MARKER, () => block);
  fs.writeFileSync(OUT, html);

  const kb = (n) => Math.round(n / 1024) + "KB";
  console.log("app.jsx      " + kb(jsx.length));
  console.log("compiled     " + kb(code.length) + "  in " + compiledMs + "ms");
  if (terser) console.log("minified     " + kb(out.length) + "  in " + minMs + "ms");
  console.log("index.html   " + kb(html.length) + "  (no Babel at runtime)");
}

main();

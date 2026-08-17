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

// Page chunks: compiled separately from app.jsx and written as their own
// static .js file instead of being inlined into index.html, so a page's
// code only downloads/parses/executes when someone actually opens it. Each
// chunk reads shared core utilities off window.__v and registers what it
// exports onto window.__vChunks — see the "LAZY-LOADED PAGE CHUNKS" comment
// near the bottom of app.jsx for the loader that expects this contract.
const CHUNKS = [
  { name: "ravenseye", src: path.join(ROOT, "app.ravenseye.jsx"), out: path.join(ROOT, "chunk-ravenseye.js") },
  { name: "golf", src: path.join(ROOT, "app.golf.jsx"), out: path.join(ROOT, "chunk-golf.js") },
  { name: "mechanicalorchard", src: path.join(ROOT, "app.mechanicalorchard.jsx"), out: path.join(ROOT, "chunk-mechanicalorchard.js") },
];

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

// Shared compile step: JSX -> plain JS (Babel) -> minified (Terser, if
// installed). Used for both app.jsx and each chunk in CHUNKS.
async function compile(babel, terser, jsx, filename) {
  const t0 = Date.now();
  const { code } = babel.transform(jsx, {
    presets: [["react", { runtime: "classic" }]],
    filename,
    compact: true,
    comments: false,
  });
  const compiledMs = Date.now() - t0;

  let out = code;
  let minMs = 0;
  if (terser) {
    const t1 = Date.now();
    // toplevel mangling is safe precisely because of the IIFE wrapper below —
    // nothing in here is reachable by name from outside it, and no code
    // depends on Function.prototype.name. Cross-scope names (window.__v,
    // window.__vChunks) are plain object properties, which mangling never
    // touches.
    const res = await terser.minify(code, {
      compress: { passes: 2 },
      mangle: { toplevel: true },
      format: { comments: false },
    });
    if (res.error) { console.error("terser failed on " + filename + ":", res.error); process.exit(1); }
    out = res.code;
    minMs = Date.now() - t1;
  }
  return { code, out, compiledMs, minMs };
}

async function main() {
  if (!fs.existsSync(SRC)) { console.error("Missing " + SRC); process.exit(1); }
  if (!fs.existsSync(SHELL)) { console.error("Missing " + SHELL); process.exit(1); }

  const jsx = fs.readFileSync(SRC, "utf8");
  const shell = fs.readFileSync(SHELL, "utf8");
  if (!shell.includes(MARKER)) {
    console.error("index.shell.html has no " + MARKER + " placeholder.");
    process.exit(1);
  }

  const babel = loadBabel();
  const terser = loadTerser();
  if (!terser) console.log("(terser not installed — shipping unminified; npm install terser for a smaller page)");

  const { code, out, compiledMs, minMs } = await compile(babel, terser, jsx, "app.jsx");

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

  for (const chunk of CHUNKS) {
    if (!fs.existsSync(chunk.src)) { console.error("Missing chunk source " + chunk.src); process.exit(1); }
    const chunkJsx = fs.readFileSync(chunk.src, "utf8");
    const c = await compile(babel, terser, chunkJsx, path.basename(chunk.src));
    const chunkSafe = c.out.replace(/<\/script>/gi, "<\\/script>");
    const chunkOut = '(function(){"use strict";\n' + chunkSafe + "\n})();";
    fs.writeFileSync(chunk.out, chunkOut);
    console.log(
      path.basename(chunk.src) + "  " + kb(chunkJsx.length) +
      " -> " + path.basename(chunk.out) + "  " + kb(chunkOut.length) +
      (terser ? "  in " + (c.compiledMs + c.minMs) + "ms" : "")
    );
  }
}

main();

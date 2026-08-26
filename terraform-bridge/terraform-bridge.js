#!/usr/bin/env node
// Vantage Terraform bridge — a small local companion process that lets
// BearVantageHub's Terraform > Workspace tab run `terraform fmt` /
// `validate` / `plan` / `apply` against a real project on this machine, and
// read/write the .tf files themselves. Full security model in README.md
// alongside this file. Short version:
//   - Binds to 127.0.0.1 only — never reachable over the network.
//   - Every request needs BOTH an exact Origin match (only Hub's own two
//     origins) AND a pairing token generated on first run — either alone
//     isn't enough, since any browser tab can reach localhost.
//   - Never runs a shell or an arbitrary command — only `terraform` with a
//     fixed, code-defined argument list (execFile, not exec/string-built).
//   - `apply` can only apply a plan file *this same process* just generated
//     via /plan and returned a planId for — never an implicit/arbitrary
//     plan, and never one older than 10 minutes.
//   - File read/write is locked to inside the workspace directory chosen
//     when this script was started — path traversal outside it is refused.
//   - The workspace directory is a command-line argument, decided by the
//     human running this script — the browser can never redirect it.
//   - No background daemon, no auto-start: this process running in your
//     terminal *is* the on/off switch. Ctrl+C fully disables everything.
"use strict";

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");

const PORT = 4787;
const ALLOWED_ORIGINS = new Set(["https://bearvantagehub.netlify.app", "https://andrewmakris2.github.io"]);
const PLAN_TTL_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const workspaceArg = process.argv[2];
if (!workspaceArg) {
  console.error("Usage: node terraform-bridge.js /path/to/your/terraform/project");
  process.exit(1);
}
const workspaceDir = path.resolve(workspaceArg);
if (!fs.existsSync(workspaceDir) || !fs.statSync(workspaceDir).isDirectory()) {
  console.error(`Not a directory: ${workspaceDir}`);
  process.exit(1);
}
if (!fs.readdirSync(workspaceDir).some((f) => f.endsWith(".tf"))) {
  console.error(`No .tf files found in ${workspaceDir} — refusing to start. Point this at a real Terraform project.`);
  process.exit(1);
}

const configDir = path.join(os.homedir(), ".vantage-terraform-bridge");
const tokenFile = path.join(configDir, "token");
let token;
if (fs.existsSync(tokenFile)) {
  token = fs.readFileSync(tokenFile, "utf8").trim();
} else {
  token = crypto.randomBytes(24).toString("hex");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
}

// The one plan a subsequent /apply is allowed to use — replaced by every
// new /plan call, cleared on use or expiry. Lost on restart, on purpose:
// a bridge restart should force a fresh plan, never resurrect an old one.
let currentPlan = null;

function run(args, cb) {
  execFile("terraform", args, { cwd: workspaceDir, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
    cb(err, stdout || "", stderr || "");
  });
}

function ensureInit(cb) {
  if (fs.existsSync(path.join(workspaceDir, ".terraform"))) return cb(null);
  run(["init", "-input=false"], (err, stdout, stderr) => cb(err ? new Error(stderr || err.message) : null));
}

// Resolves a browser-supplied relative path against the workspace and
// refuses anything that escapes it (../, absolute paths, symlink tricks)
// — this is the only thing standing between "read/write a .tf file" and
// "read/write anything on this Mac", so it fails closed.
function resolveWorkspacePath(relPath) {
  if (typeof relPath !== "string" || !relPath) return null;
  const resolved = path.resolve(workspaceDir, relPath);
  const rel = path.relative(workspaceDir, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return resolved;
}

function send(res, origin, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, X-Bridge-Token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  });
  res.end(JSON.stringify(body));
}

function handle(method, url, payload, res, origin) {
  const parsed = new URL(url, "http://127.0.0.1");
  const route = parsed.pathname;

  if (method === "GET" && route === "/status") {
    return run(["version"], (err, stdout) => {
      send(res, origin, 200, { ready: true, workspace: workspaceDir, terraformVersion: (stdout.split("\n")[0] || "").trim() });
    });
  }

  if (method === "GET" && route === "/files") {
    const files = fs
      .readdirSync(workspaceDir)
      .filter((f) => f.endsWith(".tf") || f.endsWith(".tfvars"))
      .sort();
    return send(res, origin, 200, { files });
  }

  if (method === "GET" && route === "/file") {
    const target = resolveWorkspacePath(parsed.searchParams.get("path"));
    if (!target) return send(res, origin, 400, { error: "Invalid path." });
    try {
      return send(res, origin, 200, { path: parsed.searchParams.get("path"), content: fs.readFileSync(target, "utf8") });
    } catch (err) {
      return send(res, origin, 404, { error: err.message });
    }
  }

  if (method === "POST" && route === "/file") {
    const target = resolveWorkspacePath(payload.path);
    if (!target || typeof payload.content !== "string") return send(res, origin, 400, { error: "Invalid path or content." });
    try {
      fs.writeFileSync(target, payload.content, "utf8");
      return send(res, origin, 200, { ok: true });
    } catch (err) {
      return send(res, origin, 500, { error: err.message });
    }
  }

  if (method === "POST" && route === "/fmt") {
    return run(payload.write ? ["fmt", "-no-color"] : ["fmt", "-diff", "-no-color"], (err, stdout, stderr) => {
      send(res, origin, err ? 500 : 200, { output: stdout, error: err ? stderr || err.message : null });
    });
  }

  if (method === "POST" && route === "/validate") {
    return ensureInit((initErr) => {
      if (initErr) return send(res, origin, 500, { error: initErr.message });
      run(["validate", "-json"], (err, stdout, stderr) => {
        let result = null;
        try {
          result = JSON.parse(stdout);
        } catch {
          /* non-JSON output on a hard failure — raw below still has it */
        }
        send(res, origin, 200, { result, raw: stdout, error: err ? stderr || err.message : null });
      });
    });
  }

  if (method === "POST" && route === "/plan") {
    return ensureInit((initErr) => {
      if (initErr) return send(res, origin, 500, { error: initErr.message });
      const planId = crypto.randomBytes(12).toString("hex");
      const planFile = path.join(workspaceDir, ".terraform", `vantage-plan-${planId}`);
      const args = ["plan", "-no-color", "-input=false", `-out=${planFile}`];
      if (payload.varFile) {
        const varFilePath = resolveWorkspacePath(payload.varFile);
        if (!varFilePath || !varFilePath.endsWith(".tfvars")) {
          return send(res, origin, 400, { error: "Invalid var file." });
        }
        args.push(`-var-file=${varFilePath}`);
      }
      run(args, (err, stdout, stderr) => {
        if (err) return send(res, origin, 500, { error: stderr || err.message, output: stdout });
        currentPlan = { planId, file: planFile, createdAt: Date.now() };
        send(res, origin, 200, { planId, output: stdout });
      });
    });
  }

  if (method === "POST" && route === "/test") {
    return ensureInit((initErr) => {
      if (initErr) return send(res, origin, 500, { error: initErr.message });
      run(["test", "-no-color"], (err, stdout, stderr) => {
        send(res, origin, 200, { raw: stdout, error: err ? stderr || err.message : null });
      });
    });
  }

  if (method === "POST" && route === "/apply") {
    if (!currentPlan || payload.planId !== currentPlan.planId) {
      return send(res, origin, 400, { error: "No matching plan on file — run Plan again first." });
    }
    if (Date.now() - currentPlan.createdAt > PLAN_TTL_MS) {
      currentPlan = null;
      return send(res, origin, 400, { error: "That plan has expired — run Plan again first." });
    }
    const planFile = currentPlan.file;
    currentPlan = null; // single-use, whether this succeeds or fails
    return run(["apply", "-no-color", "-input=false", "-auto-approve", planFile], (err, stdout, stderr) => {
      fs.unlink(planFile, () => {});
      send(res, origin, err ? 500 : 200, { output: stdout, error: err ? stderr || err.message : null });
    });
  }

  send(res, origin, 404, { error: "Not found." });
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : null;

  if (req.method === "OPTIONS") {
    if (!allowedOrigin) {
      res.writeHead(403);
      return res.end();
    }
    return send(res, allowedOrigin, 204, {});
  }

  if (!allowedOrigin) {
    console.log(`Rejected request from disallowed origin: ${origin || "(none)"}`);
    res.writeHead(403);
    return res.end();
  }

  if (req.headers["x-bridge-token"] !== token) {
    console.log("Rejected request with missing/incorrect pairing token.");
    return send(res, allowedOrigin, 401, { error: "Invalid or missing pairing token." });
  }

  let body = "";
  let tooBig = false;
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY_BYTES) {
      tooBig = true;
      req.destroy();
    }
  });
  req.on("end", () => {
    if (tooBig) return;
    let payload = {};
    try {
      payload = body ? JSON.parse(body) : {};
    } catch {
      payload = {};
    }
    handle(req.method, req.url, payload, res, allowedOrigin);
  });
});

execFile("terraform", ["version"], (err) => {
  if (err) {
    console.error("`terraform` isn't on PATH — install it (https://developer.hashicorp.com/terraform/install) before running this bridge.");
    process.exit(1);
  }
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Vantage Terraform bridge running at http://127.0.0.1:${PORT}`);
    console.log(`Workspace: ${workspaceDir}`);
    console.log(`\nPairing token (paste into Hub's Terraform > Workspace tab):\n\n  ${token}\n`);
    console.log("Leave this running while you use the Workspace tab. Ctrl+C stops it and fully disables remote access.");
  });
});

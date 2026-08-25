# Vantage Terraform bridge

A small local companion process that lets BearVantageHub's **Terraform >
Workspace** tab run `terraform fmt` / `validate` / `plan` / `apply` against a
real project on your Mac, and read/write the `.tf` files themselves. Nothing
in this repo, and nothing on Netlify, ever holds an AWS credential — this
script inherits whatever AWS access you already have configured locally
(env vars, `~/.aws/credentials`, SSO, whatever `terraform` would already use
if you ran it yourself in this same terminal) and just shells out to your
own `terraform` binary.

## Running it

```
node terraform-bridge/terraform-bridge.js /path/to/your/terraform/project
```

No `npm install` — it's plain Node core modules only. Requires `terraform`
on your `PATH`; it checks on startup and tells you clearly if it's missing.

On first run it generates a pairing token and prints it — paste that into
Hub's Workspace tab once. The token is saved to
`~/.vantage-terraform-bridge/token` and reused on future runs, so you only
pair once, not every session.

**Leave the terminal open while you use the Workspace tab.** Closing it (or
Ctrl+C) stops the process — Hub simply can't reach anything while it's not
running. There's no background daemon and nothing auto-starts.

## Security model

- **Binds to `127.0.0.1` only** — never reachable from the network, only
  from your own machine.
- **Two independent checks on every request**: the browser's `Origin` header
  must be exactly `https://bearvantagehub.netlify.app` or
  `https://andrewmakris2.github.io` (Hub's only two real origins — same
  allowlist `netlify/functions/_lib/cors.js` uses), *and* an `X-Bridge-Token`
  header must match your pairing token. Either alone isn't enough: any
  browser tab can technically reach `127.0.0.1`, so Origin-checking alone
  wouldn't stop a compromised page that also lies about its origin, and the
  token alone wouldn't stop a request from some other site if it somehow
  learned the token. Both together is the actual bar.
- **No shell, no arbitrary commands.** Every route maps to one specific
  `terraform` invocation with a fixed, code-defined argument list
  (`execFile`, never a shell string) — there's no way to smuggle an
  arbitrary command through any parameter.
- **File access is locked to the workspace directory** you started this
  script with. Every path from the browser is resolved and checked against
  that directory before any read or write; anything that would escape it
  (`../..`, an absolute path elsewhere) is refused.
- **`apply` can only apply a plan this exact process just generated.** Every
  `/plan` call writes a real plan file and hands back a one-time `planId`;
  `/apply` requires that exact id and rejects anything else, or anything
  older than 10 minutes, or a second attempt to reuse the same id. There is
  no path from "click Apply" to a plan you haven't already seen the output
  of in the Workspace tab.
- **The workspace directory is yours to choose, not the browser's.** It's a
  command-line argument you set when you start this script — nothing sent
  from Hub can redirect it elsewhere.

## What this does *not* protect against

This is a personal tool for a single-user setup, not a hardened multi-user
service. It trusts that the machine running it is yours, that your local
Terraform/AWS configuration is already something you trust, and that you're
reading the Plan output before clicking Apply — the tooling makes it hard to
apply something you haven't seen, not impossible to make a mistake once
you've seen it and confirmed anyway.

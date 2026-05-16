# Layerbrain authentication

All `brain` CLI commands require an authenticated session. The agent does **not** authenticate; the human does. Then `brain` reads credentials from disk on every call.

## Credential store

- File: `~/.layerbrain/credentials.toml`
- Created by: `brain login` (interactive browser OAuth — human only)
- Base URL: `https://api.layerbrain.com` by default; override with `LAYERBRAIN_BASE_URL`

## Environment override (headless / CI)

- `LAYERBRAIN_API_KEY=<key>` — used in preference to the credentials file
- `LAYERBRAIN_BASE_URL=<url>` — point at a non-default control plane

## Required preflight (every skill)

Before any operation that mutates or reads account state, run:

```
command -v brain
brain whoami
```

If it errors, **stop**. Tell the user:

> You need to run `brain login` first (or export `LAYERBRAIN_API_KEY` for headless use).

If `command -v brain` fails, install the CLI from the website:

```
curl -fsSL https://layerbrain.com/install.sh | sh
```

Do not attempt to log in on the user's behalf. Do not write to `~/.layerbrain/` directly.
Never use a local Layerbrain source checkout as the CLI. Do not `cd` into `layerbrain/brain`, do not run `npm link`, and do not call `node dist/cli.js`; use the `brain` executable found on PATH.

## Install the CLI (one-time)

```
curl -fsSL https://layerbrain.com/install.sh | sh
brain login
```

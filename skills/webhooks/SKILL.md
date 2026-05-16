---
name: webhooks
description: Use when the user wants to create, list, update, delete, or rotate the secret of a Layerbrain webhook. Requires the `brain` CLI.
---

# Layerbrain webhooks

Webhooks send signed HTTP POSTs from Layerbrain to a URL the user controls when events happen (machine state changes, snapshot completions, etc).

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Operations

| Intent | Command |
|---|---|
| List webhooks | `brain webhooks list --output json` |
| Get webhook | `brain webhooks get <ID> --output json` |
| Create webhook | `brain webhooks create --url <url> --enabled-events <event1,event2> --output json` |
| Update webhook | `brain webhooks update <ID> --url <url> --status active` |
| Get signing secret | `brain webhooks signing-secret <ID> --output json` |
| Test webhook | `brain webhooks test <ID>` |
| List deliveries | `brain webhooks deliveries <ID> --output json` |
| Rotate signing secret | `brain webhooks rotate-secret <ID> --output json` |
| Delete webhook | `brain webhooks delete <ID>` |

## Rules

- After `create` or `rotate-secret`, the signing secret is returned **once**. Hand it to the user so they can configure their receiver; do not log it.
- `rotate-secret` invalidates the old signing secret immediately. Warn the user that the receiver will reject deliveries until it has the new secret.
- Verify the target URL is reachable from the public internet before creating — Layerbrain will not retry forever.

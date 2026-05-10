---
name: brain-webhooks
description: Use when the user wants to create, list, update, delete, or rotate the secret of a Layerbrain webhook. Requires the `brain` CLI.
---

# Brain — webhooks

Webhooks send signed HTTP POSTs from Layerbrain to a URL the user controls when events happen (machine state changes, snapshot completions, etc).

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Operations

| Intent | Command |
|---|---|
| List webhooks | `brain webhooks list --output json` |
| Get webhook | `brain webhooks get <ID> --output json` |
| Create webhook | `brain webhooks create --data-file ./webhook.json --output json` |
| Update webhook | `brain webhooks update <ID> --data-file ./webhook.json` |
| Rotate signing secret | `brain webhooks rotate-secret <ID> --output json` |
| Delete webhook | `brain webhooks delete <ID>` |

## Rules

- After `create` or `rotate-secret`, the signing secret is returned **once**. Hand it to the user so they can configure their receiver; do not log it.
- `rotate-secret` invalidates the old signing secret immediately. Warn the user that the receiver will reject deliveries until it has the new secret.
- Verify the target URL is reachable from the public internet before creating — Layerbrain will not retry forever.

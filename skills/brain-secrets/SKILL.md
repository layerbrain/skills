---
name: brain-secrets
description: Use when the user wants to create, list, read, update, delete, or reveal Layerbrain secrets. Requires the `brain` CLI.
---

# Brain — secrets

Layerbrain secrets store credentials, API keys, and other sensitive values. They're referenced by name from machines and brains so the secret material never appears in their configuration.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Operations

| Intent | Command |
|---|---|
| List secrets (no values) | `brain secrets list --output json` |
| Get secret (masked) | `brain secrets get <ID> --output json` |
| Create secret | `brain secrets create --data-file ./secret.json --output json` |
| Update secret | `brain secrets update <ID> --data-file ./secret.json` |
| Reveal value | `brain secrets reveal <ID>` |
| Delete secret | `brain secrets delete <ID>` |

## Rules

- **Always** use `--data-file`, never `--data`. Inline secrets land in shell history.
- `reveal` returns the plaintext value. Treat its output as sensitive: do not echo into chat unless the user explicitly asked to see it; do not write to files unless asked.
- Before `delete`, list which machines / brains reference this secret. Deleting an active secret breaks their next start.
- Rotate by `update`-ing the value, not by `delete` + recreate — references stay intact.

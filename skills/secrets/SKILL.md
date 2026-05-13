---
name: secrets
description: Use when the user wants to create, list, read, update, delete, or reveal Layerbrain secrets. Requires the `brain` CLI.
---

# Layerbrain secrets

Layerbrain secrets store credentials, API keys, and other sensitive values.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Operations

| Intent | Command |
|---|---|
| List secrets (no values) | `brain secrets list --output json` |
| Get secret (masked) | `brain secrets get <ID> --output json` |
| Create secret | `brain secrets create --name <name> --value <value> --output json` |
| Update secret | `brain secrets update <ID> --name <name> --value <value>` |
| Reveal value | `brain secrets reveal <ID>` |
| Delete secret | `brain secrets delete <ID>` |

## Rules

- Prefer `--data-file` for secret values in scripts so plaintext does not land in shell history.
- `reveal` returns the plaintext value. Treat its output as sensitive: do not echo into chat unless the user explicitly asked to see it; do not write to files unless asked.
- Before `delete`, check whether active machines reference this secret. Deleting an active secret may break their next start.
- Rotate by `update`-ing the value, not by `delete` + recreate — references stay intact.

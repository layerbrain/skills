---
name: brain-billing
description: Use when the user wants to view Layerbrain billing — statements (invoices / usage) or subscriptions (plans). Requires the `brain` CLI.
---

# Brain — billing (statements, subscriptions)

Two read-mostly resources:

- **Statements** — invoices and usage records.
- **Subscriptions** — active plans on the account / organization.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Statements

| Intent | Command |
|---|---|
| List statements | `brain statements list --output json` |
| Get statement | `brain statements get <ID> --output json` |

## Subscriptions

| Intent | Command |
|---|---|
| List subscriptions | `brain subscriptions list --output json` |
| Get subscription | `brain subscriptions get <ID> --output json` |
| Create subscription | `brain subscriptions create --data-file ./subscription.json --output json` |

## Rules

- This skill is read-mostly. The only mutating command is `subscriptions create` — confirm with the user before creating, since it implies billing.
- Statements are immutable once issued. Do not attempt to modify; surface as-is.
- When a user asks "how much am I spending", run `statements list` and summarize the latest period. Do not estimate from machine sizes.

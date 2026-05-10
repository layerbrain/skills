---
name: brain-iam
description: Use when the user wants to manage Layerbrain identity and access — accounts, API keys, organizations, or memberships. Requires the `brain` CLI.
---

# Brain — IAM (accounts, API keys, organizations, memberships)

Four resources that together describe **who can do what** on Layerbrain:

- **Accounts** — individual users / service identities.
- **API keys** — programmatic credentials owned by an account.
- **Organizations** — billing + permission boundary, contains accounts.
- **Memberships** — the join between an account and an organization (with a role).

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Accounts

| Intent | Command |
|---|---|
| List | `brain accounts list --output json` |
| Get | `brain accounts get <ID> --output json` |
| Update | `brain accounts update <ID> --data-file ./account.json` |
| Delete | `brain accounts delete <ID>` |

## API keys

| Intent | Command |
|---|---|
| List | `brain api-keys list --output json` |
| Get | `brain api-keys get <ID> --output json` |
| Create | `brain api-keys create --data-file ./key.json --output json` |
| Update | `brain api-keys update <ID> --data-file ./key.json` |
| Rotate | `brain api-keys rotate <ID>` |
| Delete | `brain api-keys delete <ID>` |

## Organizations

| Intent | Command |
|---|---|
| List | `brain organizations list --output json` |
| Get | `brain organizations get <ID> --output json` |
| Create | `brain organizations create --data-file ./org.json --output json` |
| Update | `brain organizations update <ID> --data-file ./org.json` |
| Delete | `brain organizations delete <ID>` |

## Memberships

| Intent | Command |
|---|---|
| List | `brain memberships list --output json` |
| Get | `brain memberships get <ID> --output json` |
| Create | `brain memberships create --data-file ./membership.json --output json` |

## Rules

- After `api-keys create` or `api-keys rotate`, the secret is returned **once**. Hand it to the user immediately; never log it.
- Prefer `rotate` over `delete + create` for active keys — preserves the key's identity in audit logs.
- Before deleting an organization, confirm no active machines / brains / storage exist under it.
- Removing a membership revokes the account's access to the org's resources. Confirm before doing it for the requesting user's own membership.

---
name: networks
description: Use when the user wants to inspect or manage Layerbrain networks, network rules (firewall / ACL), or network flows (observed traffic). Requires the `brain` CLI.
---

# Brain — networks, rules, flows

Three related resources:

- **Networks** — the virtual networks machines attach to.
- **Network rules** — ingress / egress / ACL rules that govern traffic.
- **Network flows** — observed traffic records (read-only, for debugging).

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Networks

| Intent | Command |
|---|---|
| List networks | `brain networks list --output json` |
| Get network | `brain networks get <ID> --output json` |
| Update network | `brain networks update <ID> --data-file ./network.json` |

Networks are not created or deleted through the CLI — they're provisioned with the account.

## Network rules

| Intent | Command |
|---|---|
| List rules | `brain network-rules list --output json` |
| Get rule | `brain network-rules get <ID> --output json` |
| Create rule | `brain network-rules create --data-file ./rule.json --output json` |
| Update rule | `brain network-rules update <ID> --data-file ./rule.json` |
| Delete rule | `brain network-rules delete <ID>` |

## Network flows (read-only)

| Intent | Command |
|---|---|
| List flows | `brain network-flows list --output json` |
| Get flow | `brain network-flows get <ID> --output json` |

Use flows to debug connectivity: did the rule actually allow / block the traffic the user expects?

## Rules

- Always `network-rules list` before creating a new rule — duplicates fragment policy.
- After modifying a rule, suggest the user run `network-flows list` to confirm the new behavior.
- Rules can lock out machines. If the user is editing rules on a network that contains the machine they're SSHed into, warn them.

---
name: machines
description: Use when the user wants to create, list, manage, SSH into, connect to, or check compute regions for Layerbrain machines. Requires the `brain` CLI.
---

# Layerbrain machines

Layerbrain machines are short-lived VMs. This skill covers the public machine lifecycle and the region-availability check to run before creating one.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` or set `LAYERBRAIN_API_KEY`. See `references/auth.md`.

## Region availability

| Intent | Command |
|---|---|
| List available compute | `brain compute list --output json` |

Pick a region ID from `brain compute list` and pass that exact ID to `--region`. Do not invent short aliases like `sfo`.

## Machine lifecycle

| Intent | Command |
|---|---|
| List machines | `brain machines list --limit 50 --output json` |
| Get a machine | `brain machines get <ID> --output json` |
| Create a machine | `brain machines create --name <name> --cpu <int> --ram <gb> --disk <gb> --region <REGION_ID> --ttl-minutes <int> --output json` |
| Create with GPU | Add `--gpu <bundle>` |
| Extend TTL | `brain machines extend <ID> --duration-minutes <int>` |
| Delete | `brain machines delete <ID>` |
| Native SSH | `brain machines ssh --id <ID> --user root` |
| Run a command | `brain machines exec <ID> <command...>` |
| WebSocket shell | `brain machines shell <ID>` |

For complex create payloads, use `--data-file ./machine.json` only when the needed fields are not available as flags.

## Public ports

SSH port 22 is public by default. Every other inbound port must be declared in the root-level `networks` create payload. This controls the Layerbrain host firewall; it does not start a listener inside the Ubuntu machine.

Example public HTTP machine:

```bash
brain machines create \
  --name web \
  --cpu 2 \
  --ram 2 \
  --disk 20 \
  --region <REGION_ID> \
  --ttl-minutes 60 \
  --data '{"networks":[{"network":"public","ports":[{"protocol":"http","port":80,"public":true}]}]}' \
  --output json
```

After create, run the web server inside the machine with `brain machines exec`. Bind to `::` or `0.0.0.0` on the same port.

For HTTPS, declare TCP port 443:

```json
{"networks":[{"network":"public","ports":[{"protocol":"tcp","port":443,"public":true}]}]}
```

The machine must run TLS itself and browsers need a certificate valid for the hostname. Direct machine IPv6 does not get automatic Layerbrain TLS termination.

Public port rules are create-time only. To revoke a public port, delete the machine and create a replacement without that rule.

## Rules

- Always check `brain compute list` before `brain machines create` unless the user already gave a valid region ID.
- Capture the returned `id` from JSON after `create`; use it for SSH, connect, extend, get, and delete.
- If the user asks for a public web app, declare the required public port in `networks` when creating the machine and verify that port from outside Layerbrain.
- Always set `--ttl-minutes` for short-lived work.
- `delete` is destructive. Confirm before deleting a machine with state the user may need.
- Never SSH without confirming the user wants an interactive session. `brain machines ssh --id <ID>` attaches a TTY.

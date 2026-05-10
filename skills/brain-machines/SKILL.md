---
name: brain-machines
description: Use when the user wants to create, list, manage, snapshot, restore, SSH into, or check compute regions for Layerbrain machines (VMs / sandboxes / GPU instances). Requires the `brain` CLI.
---

# Brain — machines (and snapshots, compute regions)

Layerbrain machines are VMs / sandboxes / GPU instances. This skill covers the full machine lifecycle, snapshotting, and the region-availability check you do **before** creating one.

## Preflight

Run `brain whoami`. If it errors, tell the user to run `brain login` (or set `LAYERBRAIN_API_KEY`). See `references/auth.md`.

## Region availability (do this before `machines create`)

| Intent | Command |
|---|---|
| List regions + available compute | `brain compute list --output json` |
| Get one region's details | `brain compute get <REGION_ID> --output json` |

Pick a region with the resources the user needs. Pass its ID to `--region` on `machines create`.

## Machine lifecycle

| Intent | Command |
|---|---|
| List machines | `brain machines list --limit 50 --output json` |
| Get a machine | `brain machines get <ID> --output json` |
| Create a machine | `brain machines create --name <n> --image <img> --cpu <int> --ram-gb <num> --disk-gb <num> --region <REGION_ID> --ttl-minutes <int> --output json` |
| Create with GPU | add `--gpu <type>` (e.g. `--gpu a100`) |
| Attach to networks | add `--networks <id1,id2>` |
| Extend TTL | `brain machines extend <ID> --duration-minutes <int>`  (use `-1` for perpetual) |
| Restore (after stop) | `brain machines restore <ID>` |
| Delete | `brain machines delete <ID>` |
| SSH | `brain machines ssh <ID> --user root` |

For complex create payloads, use `--data-file ./machine.json` instead of repeating flags.

## Snapshots

Snapshots are machine-scoped. Use them to checkpoint state before risky ops or to clone.

| Intent | Command |
|---|---|
| Snapshot a machine | `brain machines snapshot <ID> --name <label> --output json` |
| List snapshots | `brain snapshots list --output json` |
| Get a snapshot | `brain snapshots get <ID> --output json` |
| Restore from snapshot | `brain snapshots restore <ID>` |
| Get download URL | `brain snapshots download <ID>` |
| Create raw snapshot | `brain snapshots create --data-file ./snap.json --output json` |

## Rules

- Always check `brain compute list` before `brain machines create` unless the user already specified a region.
- Capture the returned `id` from JSON after `create` or `snapshot` — you'll need it for follow-ups.
- `--ttl-minutes` matters: machines without TTL extension auto-expire. Warn the user if creating without `--ttl-minutes` for long-running workloads. To make a machine perpetual, pass `--duration-minutes -1` to `extend`.
- `delete` is destructive. Suggest `snapshot` first if the machine has state worth keeping.
- Never SSH without confirming the user wants an interactive session — `brain machines ssh` attaches a TTY.

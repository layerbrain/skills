---
name: events
description: Use when the user wants to list Layerbrain events, inspect event types, or listen to live event streams. Requires the `brain` CLI.
---

# Layerbrain events

Layerbrain events describe platform activity such as machine lifecycle changes, storage activity, and webhook deliveries.

## Preflight

Run `command -v brain`; if it exists, use `brain` exactly as found on PATH. Then run `brain whoami`. If either command errors, follow `references/auth.md`. Never use a local `layerbrain/brain` checkout as the CLI.

## Operations

| Intent | Command |
|---|---|
| List events | `brain events list --limit 50 --output json` |
| Get event | `brain events get <ID> --output json` |
| List event types | `brain events types --output json` |
| Trigger fixture event | `brain trigger machine.started --output json` |
| Listen live | `brain listen --events <event1,event2>` |

## Rules

- Use `brain events types` before configuring webhook `--enabled-events`.
- Use `brain listen` for live debugging and `brain events list` for historical inspection.
- Keep event filters narrow when debugging noisy systems.

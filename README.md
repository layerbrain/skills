# @layerbrain/skills

Skills that teach coding agents how to drive the [`brain`](https://layerbrain.com/docs/getting-started/installation) CLI.

## Quick start

```bash
curl -fsSL https://layerbrain.com/install.sh | sh
brain login

npx @layerbrain/skills install
```

Re-run any time to upgrade.

## Supported targets

| Target | File |
|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| Cursor | `.cursor/rules/<name>.mdc` |
| Cline | `.clinerules` (managed block) |
| `AGENTS.md` | `AGENTS.md` (managed block) |

Pass `--agent <id>` to force one, or let autodetect handle it.

## What gets installed

| Skill | What the agent learns |
|---|---|
| `machines` | Provision VMs, SSH, connect, set idle timeouts, expose ports, pick regions |
| `enabling-https` | Enable HTTPS on a machine IPv6 address with Let's Encrypt and an in-machine TLS server |
| `storage` | Manage buckets and presigned URLs |
| `networks` | Networks, ACL rules, traffic flow debugging |
| `secrets` | Create, rotate, reveal secrets |
| `events` | List events, inspect event types, listen live |
| `iam` | Accounts, API keys, organizations, memberships |
| `webhooks` | Create, rotate signing secrets, manage webhooks |
| `billing` | Read statements and subscriptions |

Plus a shared `references/auth.md` codifying the credential model (`~/.layerbrain/credentials.toml` or `LAYERBRAIN_API_KEY`).

## Commands

```bash
npx @layerbrain/skills install                                # all skills, autodetect target
npx @layerbrain/skills install machines storage               # subset
npx @layerbrain/skills install --agent claude-code            # force one target
npx @layerbrain/skills install --agent claude-code --scope user
npx @layerbrain/skills list                                   # what's installed
npx @layerbrain/skills remove billing                         # remove one
npx @layerbrain/skills detect                                 # show detected targets
npx @layerbrain/skills agents                                 # list every supported target ID
npx @layerbrain/skills skills                                 # list available skills
npx @layerbrain/skills help
```

Append-style targets (`AGENTS.md`, `.clinerules`) use `<!-- @layerbrain/skills:start -->` / `:end` markers, so re-running upgrades cleanly without touching your other rules.

## Authentication

Skills never authenticate the agent — that's a human-only step. Run `brain login` once. Credentials live at `~/.layerbrain/credentials.toml`. For headless / CI use, set `LAYERBRAIN_API_KEY`.

Every skill preamble tells the agent to resolve `brain` from PATH, run `brain whoami`, and stop if either step fails.

## License

MIT

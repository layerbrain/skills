# @layerbrain/skills

Skills that teach coding agents how to drive the [`brain`](https://www.npmjs.com/package/@layerbrain/brain) CLI.

## Quick start

```bash
npm i -g @layerbrain/brain
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
| `brain-machines` | Provision VMs, snapshot, restore, SSH, pick regions |
| `brain-storage` | Manage backends, buckets, presigned URLs |
| `brain-networks` | Networks, ACL rules, traffic flow debugging |
| `brain-secrets` | Create, rotate, reveal secrets |
| `brain-iam` | Accounts, API keys, organizations, memberships |
| `brain-webhooks` | Create, rotate signing secrets, manage webhooks |
| `brain-billing` | Read statements and subscriptions |

Plus a shared `references/auth.md` codifying the credential model (`~/.layerbrain/credentials.toml` or `LAYERBRAIN_API_KEY`).

## Commands

```bash
npx @layerbrain/skills install                                # all skills, autodetect target
npx @layerbrain/skills install brain-machines brain-storage   # subset
npx @layerbrain/skills install --agent claude-code            # force one target
npx @layerbrain/skills install --agent claude-code --scope user
npx @layerbrain/skills list                                   # what's installed
npx @layerbrain/skills remove brain-billing                   # remove one
npx @layerbrain/skills detect                                 # show detected targets
npx @layerbrain/skills agents                                 # list every supported target ID
npx @layerbrain/skills skills                                 # list available skills
npx @layerbrain/skills help
```

Append-style targets (`AGENTS.md`, `.clinerules`) use `<!-- @layerbrain/skills:start -->` / `:end` markers, so re-running upgrades cleanly without touching your other rules.

## Authentication

Skills never authenticate the agent — that's a human-only step. Run `brain login` once. Credentials live at `~/.layerbrain/credentials.toml`. For headless / CI use, set `LAYERBRAIN_API_KEY`.

Every skill preamble tells the agent to run `brain whoami` first and stop if it fails.

## Releasing (maintainers)

Releases publish to npm on tag push (`v*`). See `.github/workflows/release.yml`.

```bash
npm version patch
git push --follow-tags
```

### Required secrets

| Secret | Purpose |
|---|---|
| `NPM_TOKEN` | npm Automation token with publish rights on the `@layerbrain` scope |

## License

MIT

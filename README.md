# @layerbrain/skills

Teach any AI coding agent how to drive the [`brain`](https://www.npmjs.com/package/@layerbrain/brain) CLI like a devops engineer drives AWS.

One install. The agent learns to provision compute, manage machines, configure storage, wire networks, handle secrets, control IAM, manage webhooks, and read billing — all through the `brain` CLI.

## Quick start

```bash
# 1. Install the brain CLI and log in (one-time, per machine)
npm i -g @layerbrain/brain
brain login

# 2. From inside your project, install the skills into your agent
npx @layerbrain/skills install
```

That's it. Re-run any time to upgrade.

## Supported agents

**Native formats** (per-agent file conventions):

| Agent | Target |
|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| Cursor | `.cursor/rules/<name>.mdc` |
| Cline | `.clinerules` (managed block) |

**AGENTS.md cohort** — all of the following read the same `AGENTS.md` file (open standard, stewarded by the Agentic AI Foundation):

Codex (OpenAI), Poolside, Factory Droid, Jules (Google), Aider, goose, OpenCode, Zed, Warp, GitHub Copilot, Devin (Cognition), Junie (JetBrains), Amp, RooCode, Gemini CLI (Google), Ona, Augment, Kilo Code, Phoenix, Semgrep, Windsurf.

Pass any of these as `--agent <id>`, or just let autodetect handle it.

## What gets installed

7 skills, one per intent:

| Skill | What the agent learns |
|---|---|
| `brain-machines` | Provision VMs / sandboxes / GPU machines, snapshot, restore, SSH, pick regions |
| `brain-storage` | Manage backends, buckets, bucket keys, presigned URLs |
| `brain-networks` | Networks, ACL rules, traffic flow debugging |
| `brain-secrets` | Create / rotate / reveal secrets, safely |
| `brain-iam` | Accounts, API keys, organizations, memberships |
| `brain-webhooks` | Create, rotate signing secrets, manage webhooks |
| `brain-billing` | Read statements and subscriptions |

Plus a shared `references/auth.md` codifying the credential model (`~/.layerbrain/credentials.toml` or `LAYERBRAIN_API_KEY`).

## Commands

```bash
npx @layerbrain/skills install                                # all skills, autodetect agent
npx @layerbrain/skills install brain-machines brain-storage   # subset
npx @layerbrain/skills install --agent factory-droid          # force one agent
npx @layerbrain/skills install --agent claude-code --scope user
npx @layerbrain/skills list                                   # what's installed
npx @layerbrain/skills remove brain-billing                   # remove one
npx @layerbrain/skills detect                                 # show detected agents
npx @layerbrain/skills agents                                 # list every supported agent ID
npx @layerbrain/skills skills                                 # list available skills
npx @layerbrain/skills help
```

Append-style targets (`AGENTS.md`, `.clinerules`) use `<!-- @layerbrain/skills:start -->` / `:end` markers, so re-running upgrades cleanly without touching your other rules.

## Authentication

The skills never authenticate the agent — that's a human-only step. Run `brain login` (browser OAuth) on your machine once. Credentials live at `~/.layerbrain/credentials.toml`. For headless / CI use, set `LAYERBRAIN_API_KEY`.

Every skill preamble tells the agent to run `brain whoami` first and stop if it fails.

## Use as a Claude Code plugin

Skip the CLI and install via Claude Code's plugin marketplace:

```
/plugin marketplace add layerbrain/skills
/plugin install layerbrain
```

## Releasing (maintainers)

Releases publish to npm on tag push (`v*`). See `.github/workflows/release.yml`. To cut a release:

```bash
npm version patch     # or minor / major — bumps package.json and creates a v* tag
git push --follow-tags
```

The workflow verifies the tag matches `package.json`, builds, runs `npm publish --access public --provenance`, and creates a GitHub release.

### Required GitHub secrets

| Secret | Purpose |
|---|---|
| `NPM_TOKEN` | npm "Automation" token with publish rights on the `@layerbrain` scope. Create at npmjs.com → Access Tokens → Generate New Token → Automation. |

`GITHUB_TOKEN` is provided automatically by Actions — no setup needed. The workflow also requests `id-token: write` for npm provenance, which uses Sigstore + the GitHub OIDC identity (no extra secret).

## License

MIT

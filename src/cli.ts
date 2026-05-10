#!/usr/bin/env node
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { relative } from "node:path";
import { listSkills, type Skill } from "./registry.js";
import { ALL_AGENTS, ADAPTERS, NATIVE_AGENTS, AGENTS_MD_COHORT, type AgentId } from "./agents.js";
import { defaultTarget, detectAgents } from "./detect.js";
import type { InstallContext } from "./adapters/types.js";

const HELP = `@layerbrain/skills — install Layerbrain skills into any AI coding agent

Usage:
  npx @layerbrain/skills install [skills...] [--agent <id>] [--scope project|user] [--dir <path>]
  npx @layerbrain/skills list   [--agent <id>] [--scope project|user]
  npx @layerbrain/skills remove [skills...] [--agent <id>] [--scope project|user]
  npx @layerbrain/skills skills          # list available skills shipped in this package
  npx @layerbrain/skills agents          # list supported agent IDs
  npx @layerbrain/skills detect          # show detected agents in the current dir
  npx @layerbrain/skills help

Native agents (own file format):
  ${NATIVE_AGENTS.join(", ")}

AGENTS.md cohort (all write the same AGENTS.md file):
  ${AGENTS_MD_COHORT.join(", ")}

Default: autodetect from cwd. Falls back to claude-code (project) if nothing found.

Examples:
  npx @layerbrain/skills install                                # autodetect, install all skills
  npx @layerbrain/skills install brain-machines brain-storage   # subset
  npx @layerbrain/skills install --agent factory-droid          # write AGENTS.md
  npx @layerbrain/skills install --agent claude-code --scope user
  npx @layerbrain/skills remove brain-billing --agent codex
`;

type Args = {
  command: string;
  positionals: string[];
  agent?: AgentId;
  scope: "project" | "user";
  dir: string;
};

function parseCli(): Args {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: false,
    options: {
      agent: { type: "string" },
      scope: { type: "string", default: "project" },
      dir: { type: "string", default: process.cwd() },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(HELP);
    process.exit(0);
  }
  const [command = "help", ...rest] = positionals;
  const scope = values.scope === "user" ? "user" : "project";
  const agent = values.agent ? validateAgent(String(values.agent)) : undefined;
  return {
    command,
    positionals: rest,
    agent,
    scope,
    dir: String(values.dir ?? process.cwd()),
  };
}

function validateAgent(s: string): AgentId {
  if (!(ALL_AGENTS as string[]).includes(s)) {
    fail(`unknown --agent: ${s}. run \`agents\` to see the full list.`);
  }
  return s as AgentId;
}

function fail(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function pickSkills(requested: string[], available: Skill[]): Skill[] {
  if (requested.length === 0) return available;
  const byName = new Map(available.map((s) => [s.name, s]));
  const out: Skill[] = [];
  for (const name of requested) {
    const s = byName.get(name);
    if (!s) fail(`unknown skill: ${name}. run \`skills\` to see available.`);
    out.push(s);
  }
  return out;
}

function targetsFor(args: Args): Array<{ agent: AgentId; scope: "project" | "user"; targetRoot: string; evidence: string }> {
  if (args.agent) {
    return [
      {
        agent: args.agent,
        scope: args.scope,
        targetRoot: defaultTarget(args.agent, args.dir, args.scope),
        evidence: "--agent flag",
      },
    ];
  }
  const detected = detectAgents(args.dir);
  if (detected.length === 0) {
    return [
      {
        agent: "claude-code",
        scope: "project",
        targetRoot: defaultTarget("claude-code", args.dir, "project"),
        evidence: "fallback (no agent detected)",
      },
    ];
  }
  return detected.map((d) => ({
    agent: d.agent,
    scope: d.scope,
    targetRoot: defaultTarget(d.agent, args.dir, d.scope),
    evidence: d.evidence,
  }));
}

function checkAuth(): void {
  try {
    execSync("brain whoami", { stdio: "pipe" });
    console.log("✓ brain CLI authenticated");
  } catch {
    console.log("⚠ brain CLI is not authenticated (or not installed)");
    console.log("  install: npm i -g @layerbrain/brain");
    console.log("  login:   brain login   (or set LAYERBRAIN_API_KEY)");
  }
}

async function run(): Promise<void> {
  const args = parseCli();
  const available = listSkills();

  switch (args.command) {
    case "help":
      console.log(HELP);
      return;

    case "skills":
      for (const s of available) {
        console.log(`${s.name.padEnd(22)} ${s.description}`);
      }
      return;

    case "agents":
      console.log("Native agents (own file format):");
      for (const a of NATIVE_AGENTS) console.log(`  ${a}`);
      console.log("\nAGENTS.md cohort (write the same AGENTS.md file):");
      for (const a of AGENTS_MD_COHORT) console.log(`  ${a}`);
      return;

    case "detect": {
      const detected = detectAgents(args.dir);
      if (detected.length === 0) {
        console.log("no agents detected in", args.dir);
        return;
      }
      for (const d of detected) {
        console.log(`${d.agent.padEnd(14)} scope=${d.scope.padEnd(7)} via ${d.evidence}`);
      }
      return;
    }

    case "install": {
      const skills = pickSkills(args.positionals, available);
      const targets = targetsFor(args);
      console.log(`Installing ${skills.length} skill(s) to ${targets.length} target(s):`);
      for (const t of targets) {
        const ctx: InstallContext = { targetRoot: t.targetRoot, scope: t.scope };
        const res = await ADAPTERS[t.agent].install(skills, ctx);
        const rel = (p: string) => relative(args.dir, p) || p;
        console.log(`  ${t.agent} (${t.scope}) — ${t.evidence}`);
        for (const f of res.written) console.log(`    + ${rel(f)}`);
      }
      checkAuth();
      return;
    }

    case "remove": {
      const names = args.positionals.length > 0 ? args.positionals : available.map((s) => s.name);
      const targets = targetsFor(args);
      for (const t of targets) {
        const ctx: InstallContext = { targetRoot: t.targetRoot, scope: t.scope };
        const res = await ADAPTERS[t.agent].remove(names, ctx);
        const rel = (p: string) => relative(args.dir, p) || p;
        console.log(`  ${t.agent} (${t.scope})`);
        for (const f of res.written) console.log(`    - ${rel(f)}`);
        for (const f of res.skipped) console.log(`    · ${rel(f)} (not present)`);
      }
      return;
    }

    case "list": {
      const targets = targetsFor(args);
      for (const t of targets) {
        const ctx: InstallContext = { targetRoot: t.targetRoot, scope: t.scope };
        const installed = await ADAPTERS[t.agent].list(ctx);
        console.log(`${t.agent} (${t.scope}): ${installed.length === 0 ? "(none)" : installed.join(", ")}`);
      }
      return;
    }

    default:
      console.error(`unknown command: ${args.command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { AgentId } from "./agents.js";

export type Detection = {
  agent: AgentId;
  scope: "project" | "user";
  evidence: string;
};

function exists(p: string): boolean {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

export function detectAgents(cwd: string): Detection[] {
  const root = resolve(cwd);
  const home = homedir();
  const found: Detection[] = [];

  // Claude Code — native SKILL.md format
  if (exists(join(root, ".claude"))) {
    found.push({ agent: "claude-code", scope: "project", evidence: ".claude/" });
  } else if (exists(join(home, ".claude"))) {
    found.push({ agent: "claude-code", scope: "user", evidence: "~/.claude/" });
  }

  // Cursor — native .mdc rules
  if (exists(join(root, ".cursor"))) {
    found.push({ agent: "cursor", scope: "project", evidence: ".cursor/" });
  }

  // Cline — own .clinerules format
  if (exists(join(root, ".clinerules"))) {
    found.push({ agent: "cline", scope: "project", evidence: ".clinerules" });
  }

  // AGENTS.md — shared by Codex, Poolside, Factory Droid, Jules, Aider, goose,
  // opencode, Zed, Warp, GitHub Copilot, Devin, Junie, Amp, RooCode, Gemini CLI,
  // Ona, Augment, Kilo Code, Phoenix, Semgrep, Windsurf, and Cursor.
  if (exists(join(root, "AGENTS.md"))) {
    found.push({ agent: "agents-md", scope: "project", evidence: "AGENTS.md" });
  } else {
    // Single-agent signals that still imply AGENTS.md if the file isn't there yet.
    const signals: Array<[string, AgentId]> = [
      [".codex", "codex"],
      [".poolside", "poolside"],
      ["poolside.config.json", "poolside"],
      [".factory", "factory-droid"],
      [".jules", "jules"],
      [".aider.conf.yml", "aider"],
      [".goose", "goose"],
      [".opencode", "opencode"],
      [".zed", "zed"],
      [".warp", "warp"],
      [".windsurfrules", "windsurf"],
    ];
    for (const [marker, agent] of signals) {
      if (exists(join(root, marker))) {
        found.push({ agent, scope: "project", evidence: marker });
        break; // one signal is enough — AGENTS.md is the shared target
      }
    }
    if (found.every((d) => d.agent !== "codex") && exists(join(home, ".codex"))) {
      found.push({ agent: "codex", scope: "user", evidence: "~/.codex/" });
    }
  }

  return found;
}

export function defaultTarget(agent: AgentId, cwd: string, scope: "project" | "user"): string {
  const root = resolve(cwd);
  const home = homedir();
  switch (agent) {
    case "claude-code":
      return scope === "user" ? join(home, ".claude") : join(root, ".claude");
    case "cursor":
      return join(root, ".cursor");
    case "cline":
      return root;
    default:
      // Every AGENTS.md cohort agent writes to the project root.
      return scope === "user" ? join(home, ".codex") : root;
  }
}

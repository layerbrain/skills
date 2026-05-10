import { claudeCode } from "./adapters/claude-code.js";
import { cursor } from "./adapters/cursor.js";
import { cline } from "./adapters/cline.js";
import { makeAgentsMdAdapter } from "./adapters/agents-md.js";
import type { Adapter } from "./adapters/types.js";

const agentsMd = makeAgentsMdAdapter("agents-md");

export type AgentId =
  | "claude-code"
  | "cursor"
  | "cline"
  | "agents-md"
  | "codex"
  | "poolside"
  | "factory-droid"
  | "jules"
  | "aider"
  | "goose"
  | "opencode"
  | "zed"
  | "warp"
  | "copilot"
  | "devin"
  | "junie"
  | "amp"
  | "roocode"
  | "gemini-cli"
  | "ona"
  | "augment"
  | "kilo-code"
  | "phoenix"
  | "semgrep"
  | "windsurf";

export const NATIVE_AGENTS: AgentId[] = ["claude-code", "cursor", "cline"];

export const AGENTS_MD_COHORT: AgentId[] = [
  "agents-md",
  "codex",
  "poolside",
  "factory-droid",
  "jules",
  "aider",
  "goose",
  "opencode",
  "zed",
  "warp",
  "copilot",
  "devin",
  "junie",
  "amp",
  "roocode",
  "gemini-cli",
  "ona",
  "augment",
  "kilo-code",
  "phoenix",
  "semgrep",
  "windsurf",
];

export const ALL_AGENTS: AgentId[] = [...NATIVE_AGENTS, ...AGENTS_MD_COHORT];

export const ADAPTERS: Record<AgentId, Adapter> = {
  "claude-code": claudeCode,
  cursor,
  cline,
  "agents-md": agentsMd,
  codex: agentsMd,
  poolside: agentsMd,
  "factory-droid": agentsMd,
  jules: agentsMd,
  aider: agentsMd,
  goose: agentsMd,
  opencode: agentsMd,
  zed: agentsMd,
  warp: agentsMd,
  copilot: agentsMd,
  devin: agentsMd,
  junie: agentsMd,
  amp: agentsMd,
  roocode: agentsMd,
  "gemini-cli": agentsMd,
  ona: agentsMd,
  augment: agentsMd,
  "kilo-code": agentsMd,
  phoenix: agentsMd,
  semgrep: agentsMd,
  windsurf: agentsMd,
};

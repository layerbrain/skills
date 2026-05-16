import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Skill } from "../registry.js";
import type { Adapter, InstallContext, InstallResult } from "./types.js";
import { spliceManaged, stripManaged } from "./types.js";

function targetFile(ctx: InstallContext): string {
  return join(ctx.targetRoot, "AGENTS.md");
}

function renderBlock(skills: Skill[]): string {
  const header = `## Layerbrain skills\n\nThe \`brain\` CLI manages Layerbrain (compute, machines, storage, networks, secrets, IAM, webhooks, billing). When the user's intent matches one of the skills below, follow that skill's rules.\n\nCLI resolution: first run \`command -v brain\`. If it exists, use \`brain\` exactly as found on PATH. If it is missing, install with \`curl -fsSL https://layerbrain.com/install.sh | sh\`, then ask the human to run \`brain login\`. Never use a local Layerbrain source checkout as the CLI; do not \`cd\` into \`layerbrain/brain\`, do not run \`npm link\`, and do not call \`node dist/cli.js\`. Auth lives at \`~/.layerbrain/credentials.toml\` or \`LAYERBRAIN_API_KEY\`.\n\n### Skills\n`;
  const list = skills.map((s) => `- **${s.name}** — ${s.description}`).join("\n");
  const tail = `\n\n### Full skill definitions\n\n${skills
    .map((s) => `<details><summary>${s.name}</summary>\n\n${s.body}\n\n</details>`)
    .join("\n\n")}`;
  return header + list + tail;
}

export function makeAgentsMdAdapter(id: string): Adapter {
  return {
    id,

    async install(skills: Skill[], ctx: InstallContext): Promise<InstallResult> {
      const file = targetFile(ctx);
      const existing = existsSync(file) ? readFileSync(file, "utf8") : "";
      writeFileSync(file, spliceManaged(existing, renderBlock(skills)));
      return { written: [file], skipped: [] };
    },

    async remove(_skillNames: string[], ctx: InstallContext): Promise<InstallResult> {
      const file = targetFile(ctx);
      if (!existsSync(file)) return { written: [], skipped: [file] };
      writeFileSync(file, stripManaged(readFileSync(file, "utf8")));
      return { written: [file], skipped: [] };
    },

    async list(ctx: InstallContext): Promise<string[]> {
      const file = targetFile(ctx);
      if (!existsSync(file)) return [];
      const body = readFileSync(file, "utf8");
      if (!body.includes("@layerbrain/skills:start")) return [];
      return body.match(/- \*\*([a-z-]+)\*\*/g)?.map((m) => m.slice(4, -2)) ?? [];
    },
  };
}

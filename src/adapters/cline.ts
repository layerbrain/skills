import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Skill } from "../registry.js";
import type { Adapter, InstallContext, InstallResult } from "./types.js";
import { spliceManaged, stripManaged } from "./types.js";

function targetFile(ctx: InstallContext): string {
  return join(ctx.targetRoot, ".clinerules");
}

function renderBlock(skills: Skill[]): string {
  const intro = `# Layerbrain skills\n\nThe \`brain\` CLI manages Layerbrain. First run \`command -v brain\`; if it exists, use \`brain\` exactly as found on PATH. If it is missing, install with \`curl -fsSL https://layerbrain.com/install.sh | sh\`, then ask the human to run \`brain login\`. Never use a local Layerbrain source checkout as the CLI; do not \`cd\` into \`layerbrain/brain\`, do not run \`npm link\`, and do not call \`node dist/cli.js\`. Auth lives at \`~/.layerbrain/credentials.toml\` or \`LAYERBRAIN_API_KEY\`. When the user's intent matches a skill below, follow that skill's rules.\n`;
  const sections = skills.map((s) => s.body).join("\n\n---\n\n");
  return `${intro}\n${sections}`;
}

export const cline: Adapter = {
  id: "cline",

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
    return body.match(/^name:\s*([a-z-]+)/gm)?.map((m) => m.split(":")[1].trim()) ?? [];
  },
};

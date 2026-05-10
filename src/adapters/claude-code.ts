import { mkdirSync, writeFileSync, existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Skill } from "../registry.js";
import type { Adapter, InstallContext, InstallResult } from "./types.js";

const SKILLS_SUBDIR = "skills";

export const claudeCode: Adapter = {
  id: "claude-code",

  async install(skills: Skill[], ctx: InstallContext): Promise<InstallResult> {
    const written: string[] = [];
    const base = join(ctx.targetRoot, SKILLS_SUBDIR);
    mkdirSync(base, { recursive: true });
    for (const skill of skills) {
      const dir = join(base, skill.name);
      mkdirSync(dir, { recursive: true });
      const file = join(dir, "SKILL.md");
      writeFileSync(file, skill.body);
      written.push(file);
    }
    return { written, skipped: [] };
  },

  async remove(skillNames: string[], ctx: InstallContext): Promise<InstallResult> {
    const written: string[] = [];
    const skipped: string[] = [];
    const base = join(ctx.targetRoot, SKILLS_SUBDIR);
    for (const name of skillNames) {
      const dir = join(base, name);
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true, force: true });
        written.push(dir);
      } else {
        skipped.push(dir);
      }
    }
    return { written, skipped };
  },

  async list(ctx: InstallContext): Promise<string[]> {
    const base = join(ctx.targetRoot, SKILLS_SUBDIR);
    if (!existsSync(base)) return [];
    const out: string[] = [];
    for (const entry of readdirSync(base)) {
      const p = join(base, entry);
      if (statSync(p).isDirectory() && existsSync(join(p, "SKILL.md"))) {
        out.push(entry);
      }
    }
    return out.sort();
  },
};

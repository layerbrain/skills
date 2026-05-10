import { mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Skill } from "../registry.js";
import type { Adapter, InstallContext, InstallResult } from "./types.js";

const RULES_SUBDIR = "rules";

function toMdc(skill: Skill): string {
  return `---\ndescription: ${skill.description.replace(/\n/g, " ")}\nglobs:\nalwaysApply: false\n---\n\n${skill.body.replace(/^---[\s\S]*?---\n/, "")}`;
}

export const cursor: Adapter = {
  id: "cursor",

  async install(skills: Skill[], ctx: InstallContext): Promise<InstallResult> {
    const base = join(ctx.targetRoot, RULES_SUBDIR);
    mkdirSync(base, { recursive: true });
    const written: string[] = [];
    for (const skill of skills) {
      const file = join(base, `${skill.name}.mdc`);
      writeFileSync(file, toMdc(skill));
      written.push(file);
    }
    return { written, skipped: [] };
  },

  async remove(skillNames: string[], ctx: InstallContext): Promise<InstallResult> {
    const base = join(ctx.targetRoot, RULES_SUBDIR);
    const written: string[] = [];
    const skipped: string[] = [];
    for (const name of skillNames) {
      const file = join(base, `${name}.mdc`);
      if (existsSync(file)) {
        rmSync(file);
        written.push(file);
      } else {
        skipped.push(file);
      }
    }
    return { written, skipped };
  },

  async list(ctx: InstallContext): Promise<string[]> {
    const base = join(ctx.targetRoot, RULES_SUBDIR);
    if (!existsSync(base)) return [];
    return readdirSync(base)
      .filter((f) => f.endsWith(".mdc"))
      .map((f) => f.replace(/\.mdc$/, ""))
      .sort();
  },
};

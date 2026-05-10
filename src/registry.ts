import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(here, "..");

export const PACKAGE_ROOT = pkgRoot;
export const SKILLS_DIR = join(pkgRoot, "skills");
export const REFERENCES_DIR = join(pkgRoot, "references");

export type Skill = {
  name: string;
  description: string;
  path: string;
  body: string;
};

function parseFrontmatter(body: string): { name?: string; description?: string } {
  if (!body.startsWith("---")) return {};
  const end = body.indexOf("\n---", 3);
  if (end === -1) return {};
  const fm = body.slice(3, end).trim();
  const out: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

export function listSkills(): Skill[] {
  if (!existsSync(SKILLS_DIR)) return [];
  const skills: Skill[] = [];
  for (const entry of readdirSync(SKILLS_DIR)) {
    const dir = join(SKILLS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const file = join(dir, "SKILL.md");
    if (!existsSync(file)) continue;
    const body = readFileSync(file, "utf8");
    const fm = parseFrontmatter(body);
    skills.push({
      name: fm.name ?? entry,
      description: fm.description ?? "",
      path: file,
      body,
    });
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function loadReferences(): Array<{ name: string; body: string }> {
  if (!existsSync(REFERENCES_DIR)) return [];
  const out: Array<{ name: string; body: string }> = [];
  for (const entry of readdirSync(REFERENCES_DIR)) {
    if (!entry.endsWith(".md")) continue;
    out.push({
      name: entry,
      body: readFileSync(join(REFERENCES_DIR, entry), "utf8"),
    });
  }
  return out;
}

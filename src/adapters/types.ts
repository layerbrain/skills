import type { Skill } from "../registry.js";

export type InstallContext = {
  targetRoot: string;
  scope: "project" | "user";
};

export type InstallResult = {
  written: string[];
  skipped: string[];
};

export interface Adapter {
  id: string;
  install(skills: Skill[], ctx: InstallContext): Promise<InstallResult>;
  remove(skillNames: string[], ctx: InstallContext): Promise<InstallResult>;
  list(ctx: InstallContext): Promise<string[]>;
}

export const MANAGED_START = "<!-- @layerbrain/skills:start -->";
export const MANAGED_END = "<!-- @layerbrain/skills:end -->";

export function wrapManaged(body: string): string {
  return `${MANAGED_START}\n${body}\n${MANAGED_END}`;
}

export function spliceManaged(existing: string, replacement: string): string {
  const block = wrapManaged(replacement);
  const startIdx = existing.indexOf(MANAGED_START);
  const endIdx = existing.indexOf(MANAGED_END);
  if (startIdx === -1 || endIdx === -1) {
    const sep = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
    return existing + sep + (existing.length ? "\n" : "") + block + "\n";
  }
  const before = existing.slice(0, startIdx).replace(/\n*$/, "");
  const after = existing.slice(endIdx + MANAGED_END.length).replace(/^\n*/, "");
  return [before, block, after].filter(Boolean).join("\n\n") + (after ? "" : "\n");
}

export function stripManaged(existing: string): string {
  const startIdx = existing.indexOf(MANAGED_START);
  const endIdx = existing.indexOf(MANAGED_END);
  if (startIdx === -1 || endIdx === -1) return existing;
  const before = existing.slice(0, startIdx).replace(/\n*$/, "");
  const after = existing.slice(endIdx + MANAGED_END.length).replace(/^\n*/, "");
  return [before, after].filter(Boolean).join("\n\n").replace(/\n*$/, "") + "\n";
}

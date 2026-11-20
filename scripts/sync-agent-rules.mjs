#!/usr/bin/env node
// Copies only managed AI instructions. Unmanaged content is never overwritten.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const start = "<!-- naoiw:managed:start -->";
const end = "<!-- naoiw:managed:end -->";
const paths = ["AGENTS.md", ".cursor/rules/naoiw-default.mdc", ".github/copilot-instructions.md"];
const options = Object.fromEntries(process.argv.slice(2).map((s, i, a) => s.startsWith("--") ? [s, a[i + 1]] : null).filter(Boolean));
const sourceRoot = resolve(options["--source-root"] ?? ".");
const targetRoot = resolve(options["--target-root"] ?? ".");
const check = process.argv.includes("--check");
let changed = 0;
let skipped = 0;
function managed(text, file) {
  const b = text.indexOf(start), e = text.indexOf(end);
  if (b < 0 || e < b || text.indexOf(start, b + start.length) !== -1 || text.indexOf(end, e + end.length) !== -1) {
    throw new Error(`invalid managed delimiters in ${file}`);
  }
  return text.slice(b, e + end.length);
}
for (const path of paths) {
  const source = join(sourceRoot, "templates/agent-bundle", path);
  const target = join(targetRoot, path);
  const template = await readFile(source, "utf8");
  const templateManaged = managed(template, source);
  if (!existsSync(target)) {
    if (!check) {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, template);
    }
    changed++;
    console.log(`${check ? "OUTDATED" : "CREATED"} ${path}`);
    continue;
  }
  const current = await readFile(target, "utf8");
  if (!current.includes(start) && !current.includes(end)) {
    skipped++;
    console.log(`SKIPPED ${path}: existing file is unmanaged; preserve its contents`);
    continue;
  }
  const previousManaged = managed(current, target);
  const updated = current.replace(previousManaged, templateManaged);
  if (updated !== current) {
    if (!check) await writeFile(target, updated);
    changed++;
    console.log(`${check ? "OUTDATED" : "UPDATED"} ${path}`);
  } else {
    console.log(`UNCHANGED ${path}`);
  }
}
console.log(`Result: ${changed} ${check ? "outdated" : "changed"}, ${skipped} skipped`);
if (check && changed) process.exitCode = 1;

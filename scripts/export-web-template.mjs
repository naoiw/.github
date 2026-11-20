#!/usr/bin/env node
// Export a React/Vite starter into an independent directory. Never overwrite.
import { cp, lstat, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "templates/web-react");
const rules = join(root, "templates/agent-bundle");

function argumentsMap(args) {
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith("--") || !args[i + 1] || args[i + 1].startsWith("--"))
      throw new Error("Expected --name, --owner and --output. Optional --display, --holder, --year");
    out[args[i].slice(2)] = args[i + 1];
  }
  const allowed = new Set(["name", "owner", "output", "display", "holder", "year"]);
  for (const key of Object.keys(out)) if (!allowed.has(key)) throw new Error("Unknown option: " + key);
  if (!out.name || !/^[a-z0-9][a-z0-9._-]*$/.test(out.name))
    throw new Error("--name must be a lowercase package/repository name");
  if (!out.owner || !/^[a-zA-Z0-9-]+$/.test(out.owner)) throw new Error("--owner must be a GitHub login");
  if (!out.output) throw new Error("--output is required");
  if (out.year && !/^[0-9]{4}$/.test(out.year)) throw new Error("--year must have 4 digits");
  return out;
}

async function replaceTextFiles(dir, replacements) {
  const allowed = new Set([".md", ".json", ".html", ".tsx", ".ts", ".css", ".yml", ".mjs", ".yaml", ".txt"]);
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const next = join(path, entry.name);
      if (entry.isDirectory()) await walk(next);
      else if (entry.isFile() && (allowed.has(extname(entry.name)) || entry.name === "LICENSE")) {
        const before = await readFile(next, "utf8");
        let after = before;
        for (const [key, value] of Object.entries(replacements)) after = after.replaceAll(key, value);
        if (before !== after) await writeFile(next, after);
      }
    }
  }
  await walk(dir);
}

export async function exportTemplate(options) {
  const dest = resolve(options.output);
  const overlap = relative(source, dest);
  if (!overlap || (!overlap.startsWith("..") && overlap !== ".")) throw new Error("Output cannot be under template source");
  try {
    await lstat(dest);
    throw new Error("Refusing to overwrite existing output: " + dest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const year = options.year || String(new Date().getFullYear());
  const values = {
    "__PROJECT_NAME__": options.name,
    "__DISPLAY_NAME__": options.display || options.name,
    "__OWNER__": options.owner,
    "__YEAR__": year,
    "__COPYRIGHT_HOLDER__": options.holder || options.owner,
  };
  await mkdir(dirname(dest), { recursive: true });
  await cp(source, dest, { recursive: true, errorOnExist: true,
    filter: file => !["node_modules", "dist", ".git", "coverage"].includes(file.split(/[\\/]/).at(-1)) });
  for (const p of ["AGENTS.md", ".cursor/rules/naoiw-default.mdc", ".github/copilot-instructions.md"]) {
    const target = join(dest, p);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(rules, p), target, { errorOnExist: true });
  }
  await replaceTextFiles(dest, values);
  console.log("Created " + dest);
  console.log("Next: cd into output, npm install, run checks, and commit package-lock.json.");
  return dest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  exportTemplate(argumentsMap(process.argv.slice(2))).catch(error => { console.error(error); process.exitCode = 1; });
}

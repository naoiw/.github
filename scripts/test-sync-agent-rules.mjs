import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm, mkdir, symlink } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const sourceRoot = resolve(".");
const script = join(sourceRoot, "scripts/sync-agent-rules.mjs");
const managedStart = "<!-- naoiw:managed:start -->";
const managedEnd = "<!-- naoiw:managed:end -->";

async function run(targetRoot, check = false) {
  const args = [script, "--source-root", sourceRoot, "--target-root", targetRoot];
  if (check) args.push("--check");
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

test("create rules, preserve local text, update managed section and stay idempotent", async () => {
  const temp = await mkdtemp(join(tmpdir(), "naoiw-rules-"));
  try {
    const first = await run(temp);
    assert.equal(first.status, 0, first.stderr);
    const agents = join(temp, "AGENTS.md");
    const base = await readFile(agents, "utf8");
    assert.ok(base.includes(managedStart));
    assert.ok(base.includes("リポジトリ固有の指示"));

    const obsolete = base.replace("naoiw 共通AI開発規約（管理領域）", "obsolete rule");
    await writeFile(agents, obsolete + "\n## Local only\nDo not overwrite this.\n");
    const stale = await run(temp, true);
    assert.equal(stale.status, 1);
    assert.match(stale.stdout, /OUTDATED AGENTS.md/);

    const update = await run(temp);
    assert.equal(update.status, 0, update.stderr);
    const restored = await readFile(agents, "utf8");
    assert.ok(restored.includes("naoiw 共通AI開発規約（管理領域）"));
    assert.ok(restored.includes("## Local only\nDo not overwrite this."));
    assert.equal(restored.split(managedStart).length, 2);
    assert.equal(restored.split(managedEnd).length, 2);
    const repeat = await run(temp, true);
    assert.equal(repeat.status, 0, repeat.stderr);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("skip unmanaged existing files rather than overwrite", async () => {
  const temp = await mkdtemp(join(tmpdir(), "naoiw-rules-existing-"));
  try {
    const agents = join(temp, "AGENTS.md");
    await writeFile(agents, "Existing custom guidance\n");
    const result = await run(temp);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SKIPPED AGENTS.md/);
    assert.equal(await readFile(agents, "utf8"), "Existing custom guidance\n");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("reject malformed managed blocks before any file is overwritten", async () => {
  const temp = await mkdtemp(join(tmpdir(), "naoiw-rules-atomic-"));
  try {
    const initial = await run(temp);
    assert.equal(initial.status, 0, initial.stderr);
    const agents = join(temp, "AGENTS.md");
    const copilot = join(temp, ".github/copilot-instructions.md");
    const obsolete = (await readFile(agents, "utf8")).replace("naoiw 共通AI開発規約（管理領域）", "outdated managed text");
    await writeFile(agents, obsolete);
    await writeFile(copilot, "<!-- naoiw:managed:start -->\ninvalid incomplete block");
    const update = await run(temp);
    assert.notEqual(update.status, 0);
    assert.match(update.stderr, /invalid managed delimiters/);
    assert.equal(await readFile(agents, "utf8"), obsolete, "no partial update before validation");
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("never follow existing symlink targets", async () => {
  const temp = await mkdtemp(join(tmpdir(), "naoiw-rules-symlink-"));
  const outside = await mkdtemp(join(tmpdir(), "naoiw-rules-outside-"));
  try {
    await writeFile(join(outside, "AGENTS.md"), "outside instructions\n");
    await symlink(join(outside, "AGENTS.md"), join(temp, "AGENTS.md"));
    const result = await run(temp);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Refusing to update symlink/);
    assert.equal(await readFile(join(outside, "AGENTS.md"), "utf8"), "outside instructions\n");
  } finally {
    await rm(temp, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("reject unknown or missing CLI arguments", () => {
  for (const args of [["--unexpected"], ["--target-root"], ["--source-root", "--check"]]) {
    const result = spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
    assert.notEqual(result.status, 0, JSON.stringify(args));
  }
});

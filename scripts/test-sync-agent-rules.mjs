import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
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

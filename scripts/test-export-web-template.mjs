import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exportTemplate } from "./export-web-template.mjs";

test("exports standalone starter and managed instructions without placeholders", async () => {
  const dir = await mkdtemp(join(tmpdir(), "naoiw-web-starter-"));
  const output = join(dir, "my-site");
  try {
    await exportTemplate({ name: "my-site", owner: "naoiw", output, display: "新しいアプリ", year: "2026" });
    const pkg = JSON.parse(await readFile(join(output, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-site");
    assert.equal(pkg.packageManager, "pnpm@9.14.2");
    const lock = await readFile(join(output, "pnpm-lock.yaml"), "utf8");
    assert.match(lock, /lockfileVersion/);
    const readme = await readFile(join(output, "README.md"), "utf8");
    assert.match(readme, /https:\/\/naoiw\.github\.io\/my-site\//);
    assert.match(readme, /\| 環境 \| ブランチ \| URL \| 状態 \|/);
    const index = await readFile(join(output, "index.html"), "utf8");
    assert.match(index, /新しいアプリ/);
    const license = await readFile(join(output, "LICENSE"), "utf8");
    assert.match(license, /2026 naoiw/);
    const agent = await readFile(join(output, "AGENTS.md"), "utf8");
    assert.match(agent, /naoiw:managed:start/);
    const copilot = await readFile(join(output, ".github/copilot-instructions.md"), "utf8");
    assert.match(copilot, /naoiw:managed:start/);
    const workflows = await readdir(join(output, ".github/workflows"));
    assert.deepEqual(workflows.sort(), ["ci.yml", "deploy-pages.yml"]);
    await assert.rejects(exportTemplate({ name: "my-site", owner: "naoiw", output }), /Refusing to overwrite/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

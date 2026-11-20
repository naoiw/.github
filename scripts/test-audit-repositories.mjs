import test from "node:test";
import assert from "node:assert/strict";
import { summarizeRepo, syncState, renderMarkdown } from "./audit-repositories.mjs";

const sha = "a".repeat(40);
test("detect correct, stale and unpinned AI sync references", () => {
  assert.equal(syncState(null, sha), "未導入");
  assert.equal(syncState("uses: x/reusable-sync-ai-rules.yml@" + sha, sha), "最新");
  assert.equal(syncState("uses: x/reusable-sync-ai-rules.yml@" + "b".repeat(40), sha), "旧SHA");
  assert.equal(syncState("uses: x/reusable-sync-ai-rules.yml@main", sha), "未固定/その他");
});
test("summarize 3 markers, preferred node version and existing CI", () => {
  const files = {
    "AGENTS.md": "<!-- naoiw:managed:start -->",
    ".cursor/rules/naoiw-default.mdc": "<!-- naoiw:managed:start -->",
    ".github/copilot-instructions.md": "<!-- naoiw:managed:start -->",
    ".nvmrc": "26\n",
    "package.json": '{"engines":{"node":">=20"}}',
    ".github/workflows": ["ci.yml", "deploy-pages.yml"],
    ".github/workflows/sync-ai-rules.yml": "uses: x/reusable-sync-ai-rules.yml@" + sha,
  };
  const row = summarizeRepo({ name: "geo-quiz", archived: false }, files, sha);
  assert.deepEqual([row.ai, row.node, row.ci, row.sync, row.workflows], ["3/3", "26", "あり", "最新", 2]);
  assert.match(renderMarkdown([row], { owner: "naoiw", mode: "public", generatedAt: "2026-01-01", recommended: sha, errors: [] }), /geo-quiz/);
});
test("archived repositories are excluded from policy violations", () => {
  const row = summarizeRepo({ name: "old", archived: true }, {}, sha);
  assert.equal(row.sync, "対象外");
  assert.equal(row.ai, "対象外");
});
test("missing policy and non-web projects are distinguishable", () => {
  const row = summarizeRepo({ name: "c-code", archived: false }, { ".github/workflows": [] }, sha);
  assert.equal(row.ai, "未導入");
  assert.equal(row.node, "—");
  assert.equal(row.sync, "未導入");
});

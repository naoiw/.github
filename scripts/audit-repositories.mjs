#!/usr/bin/env node
// Read-only audit for repositories owned by an individual GitHub account.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const owner = process.env.AUDIT_OWNER || "naoiw";
const mode = process.env.AUDIT_MODE || "public";
const token = process.env.AUDIT_TOKEN || process.env.GITHUB_TOKEN || "";
const apiRoot = process.env.GITHUB_API_URL || "https://api.github.com";
if (!/^[A-Za-z0-9-]+$/.test(owner)) throw new Error("Invalid audit owner");

export function syncState(file, recommended) {
  if (file == null) return "未導入";
  const ref = file.match(/reusable-sync-ai-rules\.yml@([^\s"'#]+)/)?.[1];
  if (!ref) return "参照不明";
  if (ref === recommended) return "最新";
  return /^[a-f0-9]{40}$/.test(ref) ? "旧SHA" : "未固定/その他";
}

export function summarizeRepo(repo, files, recommended) {
  if (repo.archived) return { repo: repo.name, archived: true, ai: "対象外", node: "—", ci: "—", sync: "対象外", workflows: 0, ref: null };
  const paths = ["AGENTS.md", ".cursor/rules/naoiw-default.mdc", ".github/copilot-instructions.md"];
  const count = paths.filter(path => typeof files[path] === "string" && files[path].includes("<!-- naoiw:managed:start -->")).length;
  const total = paths.filter(path => files[path] !== null && files[path] !== undefined).length;
  let pkg;
  try { pkg = JSON.parse(files["package.json"] || "{}"); } catch { pkg = {}; }
  const node = (files[".nvmrc"]?.trim() || pkg.engines?.node || "—").replace(/\|/g, "/");
  const workflows = files[".github/workflows"] || [];
  const ci = workflows.some(name => /(^|[-_.])(ci|validate|test|lint)([-_.]|$)/i.test(name)) ? "あり" : "なし";
  const syncFile = files[".github/workflows/sync-ai-rules.yml"];
  const ref = syncFile?.match(/reusable-sync-ai-rules\.yml@([^\s"'#]+)/)?.[1] || null;
  return { repo: repo.name, archived: false, ai: total ? count + "/3" : "未導入", node, ci, sync: syncState(syncFile, recommended), workflows: workflows.length, ref };
}

export function renderMarkdown(rows, context) {
  const safe = value => String(value ?? "—").replace(/\|/g, "/").replace(/[\r\n]/g, " ");
  const active = rows.filter(row => !row.archived);
  const lines = [
    "# naoiw リポジトリ標準適用状況", "",
    "取得日時: " + context.generatedAt + " UTC / オーナー: " + context.owner + " / モード: " + context.mode,
    "推奨同期SHA: " + context.recommended, "",
    "対象: " + rows.length + " 件 / 稼働: " + active.length + " 件 / 同期SHA最新: " + active.filter(row => row.sync === "最新").length + " 件", "",
    "| リポジトリ | AI管理領域 | Node.js | CI | AI同期 | workflow数 |",
    "| --- | --- | --- | --- | --- | ---: |",
  ];
  for (const row of rows) {
    lines.push("| [" + safe(row.repo) + "](https://github.com/" + context.owner + "/" + encodeURIComponent(row.repo) + ") | " +
      [row.ai, row.node, row.ci, row.sync, row.workflows].map(safe).join(" | ") + " |");
  }
  lines.push("", "## 注記", "",
    "- AIは3つの管理領域マーカーの存在を計測しています。内容が新しいことを保証しません。",
    "- Node.jsは.nvmrcまたはpackage.json#engines.nodeに基づくため、未検出でも異常とは限りません。",
    "- CIはワークフローファイル名からの簡易判定で、成功状態は判定していません。",
    "- 旧SHAは推奨SHAと違うという意味です。個別の互換性を確認してから更新してください。",
    "- publicモードは公開リポジトリだけを列挙。accessibleモードには読み取り用の追加トークンが必要です。",
    "- この監査は読み取り専用で、対象リポジトリの設定を変更しません。", "");
  if (context.errors.length) lines.push("## API取得エラー（不完全）", "", ...context.errors.map(safe), "");
  return lines.join("\n") + "\n";
}

async function getJson(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "naoiw-standards-audit",
  };
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch(new URL(path, apiRoot), { headers });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("HTTP " + response.status + " " + path + ": " + (await response.text()).slice(0, 160));
  return response.json();
}

async function getFile(repo, path) {
  const data = await getJson("/repos/" + owner + "/" + encodeURIComponent(repo) + "/contents/" + path);
  if (data === null) return null;
  if (Array.isArray(data)) return data.map(entry => entry.name);
  if (data.type === "file" && data.encoding === "base64")
    return Buffer.from(data.content.replace(/\s/g, ""), "base64").toString("utf8");
  return null;
}

async function listRepos() {
  if (!["public", "accessible"].includes(mode)) throw new Error("AUDIT_MODE must be public or accessible");
  if (mode === "accessible" && !process.env.AUDIT_TOKEN) throw new Error("Set AUDIT_READ_TOKEN for accessible mode");
  const all = [];
  for (let page = 1; page <= 30; page++) {
    const path = mode === "public"
      ? "/users/" + owner + "/repos?type=owner&per_page=100&page=" + page
      : "/user/repos?affiliation=owner&per_page=100&page=" + page;
    const results = await getJson(path);
    if (!Array.isArray(results)) throw new Error("Repository listing is unavailable");
    all.push(...results.filter(repo => repo.owner?.login?.toLowerCase() === owner.toLowerCase()));
    if (results.length < 100) return all;
  }
  throw new Error("Over 3000 repos: check pagination guard");
}

async function audit() {
  const manifest = JSON.parse(await readFile(resolve(root, "versions/workflows.json"), "utf8"));
  const recommended = manifest.recommended_commit;
  if (!/^[0-9a-f]{40}$/.test(recommended)) throw new Error("Invalid recommended_commit");
  const repos = (await listRepos()).sort((a, b) => a.name.localeCompare(b.name));
  const paths = ["AGENTS.md", ".cursor/rules/naoiw-default.mdc",
    ".github/copilot-instructions.md", ".nvmrc", "package.json",
    ".github/workflows", ".github/workflows/sync-ai-rules.yml"];
  const rows = []; const errors = [];
  for (const repo of repos) {
    const files = {};
    if (!repo.archived) {
      for (const path of paths) {
        try { files[path] = await getFile(repo.name, path); }
        catch (error) {
          files[path] = null;
          errors.push(repo.name + "/" + path + ": " + error.message);
        }
      }
    }
    rows.push(summarizeRepo(repo, files, recommended));
    console.log("AUDIT " + repo.name);
  }
  const generatedAt = new Date().toISOString();
  const output = resolve(process.env.AUDIT_OUTPUT || "audit-output");
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, "report.json"), JSON.stringify({ generated_at: generatedAt, owner, mode, recommended_commit: recommended, rows, errors }, null, 2) + "\n");
  await writeFile(resolve(output, "report.md"), renderMarkdown(rows, { generatedAt, owner, mode, recommended, errors }));
  console.log("Audited " + rows.length + " repos, errors: " + errors.length);
  if (errors.length) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  audit().catch(error => { console.error(error); process.exitCode = 1; });

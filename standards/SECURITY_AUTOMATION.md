# 依存関係とGitHub Actionsのセキュリティ運用

## 対象とDependabot設定

各リポジトリにある `.github/dependabot.yml` は、そのリポジトリの **default branchのみ**で有効です。共通 `naoiw/.github` のDependabot設定は、他のリポジトリには自動継承されません。

| リポジトリ | 対象 | 更新確認（JST） |
| --- | --- | --- |
| `naoiw/.github` | GitHub Actions（`/`） | 毎月 02:42 |
| `naoiw/.github` | Reactスターターのpnpm依存（`/templates/web-react`） | 毎月 03:42 |
| `naoiw/react-vite-template` | React/Viteのpnpm依存（`/`） | 毎月 04:42 |
| `naoiw/react-vite-template` | GitHub Actions（`/`） | 毎月 05:42 |

- pnpmの `package.json` と `pnpm-lock.yaml` に対しては、Dependabotの `package-ecosystem: npm` を使用します。**npmへ移行する意味ではありません**。
- **minor/patchのみを1グループにまとめ**、majorは個別PRに分離します。major更新の安全性は自動保証されません。
- `groups.applies-to: version-updates` なので、脆弱性対応PRを意図せず通常更新の大きなグループにまとめません。
- バージョン更新PRはエコシステムごとに最大5件。セキュリティ更新PRの制限とは別です。
- **自動マージは設定しません**。PRごとに差分、lockfile、関連依存の互換性、CI、公開への影響を確認してから明示的にマージします。
- `Use this template` から新規作成したリポジトリには `.github/dependabot.yml` が複製されます。作成後に設定とスケジュールを確認します。
- 共有ワークフローへの参照SHAは、Dependabotが変更を提案しても無条件に採用しません。共通ワークフローをリリースし、利用先でCI/Pagesの検証後に移行します。

## GitHub上で手動確認する設定

GitHubの **Settings → Advanced Security**（画面の名称はプランによって異なる場合あり）で、少なくとも `naoiw/.github` と `naoiw/react-vite-template` を個別に確認します。

| GitHubの項目 | 推奨 |
| --- | --- |
| `Dependency graph` | 有効 |
| `Dependabot alerts` | 有効 |
| `Dependabot security updates` | 有効 |
| `Dependabot version updates` | default branchの設定ファイルと更新ログを確認 |
| `Secret scanning` | 利用可能なら有効 |
| `Push protection` | 利用可能なら有効 |
| `Code scanning` / `CodeQL` | 必要性を評価して段階導入 |

設定ファイルの存在は、AlertsやSecurity updatesが有効であることの証明ではありません。セキュリティ警告は通常の月次スケジュールを待たず確認・対処します。

## GitHub Actionsと共有ワークフロー

- Actionsのmajor更新（例：checkout、setup-node、pnpm/action-setup、Pages系）は単独PRでレビューし、GitHub Runner/Nodeの互換性・権限・Artifacts・Pagesのdry-runを確認します。
- 共有workflowの `@<40桁SHA>` は `versions/workflows.json` の検証済み推奨SHAを利用するのが基本です。SHA更新は別PRで扱います。
- `workflows-v1.0.0` は公開済みですが、現在のmainは更新後のActionsを含みます。**次期リリースは未発行**です。新バージョンの検証とリリース手順は [WORKFLOW_RELEASES.md](WORKFLOW_RELEASES.md) に従ってください。
- 既存利用リポジトリはSHA固定のため、共通原本の更新だけでは切り替わりません。

## Secretsと最小権限

- 読み取り専用監査は通常の `GITHUB_TOKEN` で実行します。非公開リポジトリを含める場合の `AUDIT_READ_TOKEN` はContents readの最小権限に限定します。
- 他リポジトリの書き込み権限を持つPATを共通リポジトリへ不用意に追加しません。
- CIとPagesビルドは原則read-onlyとし、Pagesのデプロイjobのみ必要なwrite権限を設定します。未信頼PRの実行に書き込み権限を渡さないことを優先します。

## 初回Dependabot検証（2026-11-21）

[依存更新PR #6](https://github.com/naoiw/.github/pull/6) は当初、TypeScript 7.0.2 が `typescript-eslint` の対応範囲（TypeScript `<6.1`）を超え、CIが失敗しました。TypeScriptを5.9系に維持し、ESLint 10・Vite 8等と `pnpm-lock.yaml` を更新して [CI成功](https://github.com/naoiw/.github/actions/runs/44766878482) を確認後、mainへマージ済みです。

[GitHub Actions更新PR #5](https://github.com/naoiw/.github/pull/5) も、共通Node CIとPages dry-runの検証後にmainへマージ済みです。この経緯から、**major更新の単独PR化・pin済み共有workflowの段階移行**を採用します。

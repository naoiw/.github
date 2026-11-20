# AI共通ルールの導入と同期

## 仕組み
各リポジトリに `AGENTS.md`、`.cursor/rules/naoiw-default.mdc`、`.github/copilot-instructions.md` を配置します。原本は本リポジトリの `templates/agent-bundle/` にあります。重要なルール本文はファイル内に書いてあるため、外部GitHubへのアクセスがないAIにも最低限の指示が届きます。

`<!-- naoiw:managed:start -->` から `<!-- naoiw:managed:end -->` だけを自動更新します。**その外側のプロジェクト固有指示は保持**します。既に独自ファイルがあり管理マーカーがない場合、同期処理は上書きせずスキップします。

## 手動同期
```bash
# naoiw/.github を別の作業ディレクトリにチェックアウトした後
node /path/to/.github/scripts/sync-agent-rules.mjs \
  --source-root /path/to/.github \
  --target-root /path/to/target-repo
```
差分を確認し、対象の開発ブランチでPRにしてください。

## GitHub Actions
`templates/workflows/caller-sync-ai-rules.yml` を対象リポジトリの `.github/workflows/` に配置すると、手動実行で同期PRを作成できます。定期実行は例では無効化しています。必要ならscheduleを有効化してください。

- 初回の呼び出しでは、`naoiw/.github` の `reusable-sync-ai-rules.yml` がmainで公開されている必要があります。
- 対象リポジトリの Actions設定で「Allow GitHub Actions to create and approve pull requests」が無効の場合、PR作成は失敗します。そのときは許可設定または最小権限のGitHub App token等が必要です。
- リポジトリの保護ルール、個人アカウント権限、既存のCIは変更しません。
- `@main` は更新をそのまま取り込むため、本番運用にはバージョンタグ/コミットSHA固定を推奨します。
- 呼び出し元に必要な `contents: write` と `pull-requests: write` の最小権限を与えます。
- Cursor/Copilot/ChatGPTの読み込み仕様はツールごとに異なります。AGENTS.mdへの設置だけであらゆるChatGPT会話へ自動適用される保証はありません。

## 検証
`node --test scripts/test-sync-agent-rules.mjs` で新規ファイル作成、管理領域更新、既存プロジェクト固有指示の維持、管理外ファイルの保護、checkモード、再実行時の冪等性を検証します。

## 実地検証（2026-11-20）

`geo-quiz` の専用試験ブランチで再利用ワークフローを起動しました。

- [初回実行](https://github.com/naoiw/geo-quiz/actions/runs/44746852704)：原本取得、管理領域の更新、同期ブランチpushは成功。リポジトリでActionsからのPR作成が無効だったため、PR作成だけ失敗。
- **「Allow GitHub Actions to create and approve pull requests」を有効にした後**、[再実行](https://github.com/naoiw/geo-quiz/actions/runs/44747956890)が成功し、[検証PR #60](https://github.com/naoiw/geo-quiz/pull/60) を自動作成できました。検証用PRは誤マージ防止のためクローズ済みです。

検証後は一時的なpushトリガーと古いテスト用ルールを試験ブランチで復旧しました。本番mainは変更していません。試験で生成された同期用ブランチは残る場合があります。

### PR作成がブロックされた場合

対象リポジトリの `Settings > Actions > General > Workflow permissions` で `Allow GitHub Actions to create and approve pull requests` を有効にします。権限を有効化できない場合でも `chore/sync-naoiw-ai-rules` ブランチが生成されることがあり、そのブランチから手動でPRを作成できます。失敗時にはActionsのジョブサマリーに手動PR用リンクを表示します。

デフォルトの `GITHUB_TOKEN` で作成したPRは、他のActionsの `pull_request` イベントを自動起動しない場合があります。作成されたPRのレビューと検証チェックを別途確認してください。

`workflow_dispatch` は対象リポジトリのデフォルトブランチに呼び出し側workflowが存在するときに使えます。既定では手動同期のみで、全リポジトリへの一括反映はしません。

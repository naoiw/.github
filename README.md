# naoiw/.github

`naoiw` 配下のリポジトリで利用する共通のIssue・PRテンプレート、開発規約、AIエージェント向け指示、再利用可能なCI・GitHub Pagesデプロイを管理します。

> **共通規約の原則：特別な指示がない場合、対象リポジトリの開発はここで定義した標準に従います。** ただし作業ごとの明示指示と対象リポジトリ固有のREADME・docs・設定・設計を優先します。

## 自動で参照されるもの（GitHub公式のデフォルトコミュニティファイル）

- [Issueテンプレート](.github/ISSUE_TEMPLATE) — 機能追加、不具合、リファクタリング、保守タスク
- [PRテンプレート](.github/PULL_REQUEST_TEMPLATE.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

同種のファイルが対象リポジトリにある場合は、そちらが優先されます。対象リポジトリが独自のIssueテンプレート・設定を持つ場合、共通Issueテンプレート一式は利用されません。

## 明示的な導入が必要なもの

- [GitHub Flow規約](standards/GITHUB_FLOW.md) — mainのみ / main+developを選択
- [AI開発共通規約](standards/AI_DEVELOPMENT.md) — ChatGPT・Cursor・Copilot等向け
- [技術スタックの既定値](standards/TECH_STACK.md) — 新規TypeScript/React等
- [UI・CSSガイド](standards/UI_STYLE.md)
- [標準ディレクトリ構成](standards/REPOSITORY_STRUCTURE.md)
- [再利用可能CI・GitHub Pagesの使い方](standards/CI_AND_PAGES.md)
- [AI指示の同期・更新PRの仕組み](standards/AI_RULE_SYNC.md)
- [AI導入用の各ツール向け雛形](templates/README.md)
- [React + TypeScript + Viteの新規プロジェクト雛形](templates/web-react)
- [README・docsの標準](standards/DOCUMENTATION.md)
- [MIT等のライセンス運用](standards/LICENSING.md)
- [ワークフロー呼び出し例](templates/workflows)

`standards/`、`templates/`、`AGENTS.md` は他リポジトリへ自動コピーされません。AIが自動で本リポジトリを読む保証もありません。各リポジトリに必要な参照ファイルを配置するか、明示的にこの規約を読ませてください。

## 運用上の注意

- 共通 `LICENSE` の自動適用はありません。MIT等は各リポジトリに個別配置します。既存のApache 2.0等も維持します。
- Node.js・パッケージマネージャー・CSS・デプロイは既存実装を優先します。Webアプリの新規作成には `templates/web-react/` を利用し、必要に応じて独立したTemplate Repositoryへ移します。
- AI指示の同期は初期設定だけでは動きません。各リポジトリで同期ワークフローの呼び出し設定を追加すると、差分をPRでレビューできます。
- `reusable-node-ci.yml` と `reusable-vite-pages.yml` は `workflow_call` 用です。呼び出し元を用意しない限り実行・公開されません。
- 既存のリポジトリ、Issue、ブランチ、公開サイトはこのリポジトリから勝手に変更しません。

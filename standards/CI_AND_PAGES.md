# 共通CIとGitHub Pagesデプロイ

`naoiw/.github` の再利用可能ワークフローは**置くだけでは各リポジトリで実行されません**。呼び出し側リポジトリに `.github/workflows/` のYAMLを導入してください。

新規React/TypeScript/Viteリポジトリをテンプレートから作成するときは、[新規アプリの初期設定・Pages公開ガイド](NEW_WEB_APP_SETUP.md) を先に参照してください。mainの保護、GitHub Pages設定、手動/自動公開、developプレビューへの移行をひと続きで説明しています。

## Node.js CI
`reusable-node-ci.yml` はnpm/pnpmのlockfileインストールと、任意のLint・型チェック・テスト・ビルドを実行します。
- [呼び出し例](../templates/workflows/caller-ci.yml)
- 使わないスクリプトは `run-lint` / `run-typecheck` / `run-tests` / `run-build` を `false` に。
- 既存の `packageManager`、lockfile、Node.js条件と合わせ、pnpmのバージョンも `pnpm-version` で指定。
- ワークフローの実装を変えると同じ `@main` の呼び出し元へ影響するため、本番利用には固定SHAまたはバージョンタグを推奨。

## Pages（Vite）
`reusable-vite-pages.yml` は**Viteの `--base` 引数を受け付ける**ビルドスクリプト専用です。他のビルド系にはそのまま使わないでください。

- `publish-preview: false` → mainだけを `/<repo>/` に公開。[呼び出し例](../templates/workflows/caller-pages-main.yml)
- `publish-preview: true` → mainと既存developを同時ビルドし、`/<repo>/` と `/<repo>/develop/` に公開。[呼び出し例](../templates/workflows/caller-pages-preview.yml)
- `base-path` は必要に応じて指定。カスタムドメインやルートサイトでは既定の `/<repo>/` と異なる場合がある。
- GitHub Pagesはサイト全体で1つのデプロイ結果を持つため、developだけを別デプロイせず単一成果物に統合する。
- main/developのソースは現在のそれぞれのブランチ、`workflow_run` で検証後のdevelopは検証したhead SHAから取得する。
- 事前に対象リポジトリの Settings > Pages > Build and deployment を「GitHub Actions」に設定する。
- 呼び出し元ジョブに `contents: read`、`pages: write`、`id-token: write` を与える。ビルドジョブにはwrite権限を与えない。
- `workflow_run` でのデプロイを使う場合はCIのワークフロー名、トリガーブランチ、成功結果、イベント種別、同一リポジトリを照合する。
- ブランチ保護・検証の信頼性を担保し、未信頼のPRコードのビルドに秘密情報や書き込み権限を渡さない。
- PWA・Service Worker、SPAクライアントルーティング、外部データの公開範囲、独自のビルド処理は**プロジェクト側で別途検証**する。
- preview設定はdevelopが実在するリポジトリだけに導入。mainしかないリポジトリに無断でdevelopを作らない。

## 安全な検証（dry-run）
`reusable-vite-pages.yml` は `dry-run: true` を指定するとPagesへの公開は行わず、`pages-dry-run` という検証用Artifactだけを作ります。

- Pages設定を本番へ切り替える前に、PRでビルド成果物とベースパスを確認してください。
- **dry-runでも呼び出し側のworkflowには `contents: read`、`pages: write`、`id-token: write` の権限宣言が必要**です。再利用ワークフローには公開用ジョブが定義されているため、GitHubが呼び出し時点で権限を検査します。ただし `dry-run: true` なら公開ジョブはスキップされ、ビルドジョブは `contents: read` のみで実行します。
- 検証実績：[geo-quiz（npm、本番ビルドのみ）](https://github.com/naoiw/geo-quiz/actions/runs/44733762022)、[cycling-map（pnpm、本番＋developビルド）](https://github.com/naoiw/cycling-map/actions/runs/44733771718)。いずれも公開ジョブがスキップされ、Artifactが正常に作成されました。
- `dry-run` のビルドは通常mainとdevelopから取得します。PRブランチ自体の成果物を試すものではありません。
- `publish-preview: true` を使用するのはdevelopがあるリポジトリだけです。
- React starterの `vite build` はこの共通方式と互換です。
- このオプションは既存Pages公開ワークフローを自動移行しません。

## 状態
本リポジトリのワークフローは共通部品の提供であり、既存アプリへの配布・移行やPagesの公開は行いません。導入時は対象リポジトリごとにPRと動作確認を行います。

## 安定運用と依存バージョンの固定

新規の呼び出し元では、`naoiw/.github` の再利用可能workflowを **`@main` ではなくコミットSHAで固定**します。`templates/workflows/` と `templates/web-react/` の例は、2026-11-20にCIとPages dry-runを検証した共通workflowのSHAへ固定済みです。原本をマージ更新しても、すでに配置した呼び出し元の参照先は**自動では更新されません**。変更時にリポジトリごとのCI・デプロイを再検証し、参照SHAを更新してください。

- 既存のCI名を参照する `workflow_run` は、検証workflowの名前が変わると発火しなくなります。呼び出し元では既存の名前やイベント制御を確認すること。
- 本番Pages公開の実行は `dry-run` とは別に検証します。本番公開へ無断移行しないこと。
- 共通CIは `contents: read` のみで動作し、Pagesのbuildジョブもread-onlyです。deployジョブだけ `pages: write` と `id-token: write` を必要とします。呼び出し側では再利用workflowの権限要求を満たす必要があります。
- 同期workflowはPR作成のため `contents: write` と `pull-requests: write` が必要ですが、リポジトリ設定によるPR作成可否の制限も別途存在します。
- `ubuntu-latest` で新しいGitHub-hosted runnerを使用します。self-hosted runnerに置き換える際はNode 24で動作するGitHub Actionsが要求するRunnerの最小バージョンを満たすこと。

### 更新後の実地検証（2026-11-20）

共通ワークフローの `actions/checkout@v6` / `actions/setup-node@v6` への更新を、`geo-quiz` の一時的な試験ブランチから、マージ前の共通ワークフロー参照で検証しました。

- [共通Node CI](https://github.com/naoiw/geo-quiz/actions/runs/44749655417)：npm install、Lint、型チェック、テスト、ビルドがすべて成功。
- [共通Pages dry-run](https://github.com/naoiw/geo-quiz/actions/runs/44749655367)：mainのビルドとArtifact作成に成功。公開ジョブはスキップ。
- 使った一時的なworkflowは試験ブランチから削除しました。本番公開処理は変更していません。

### Actions更新後の追加検証（2026-11-21）

- [geo-quiz：Actions v7系のnpm CI](https://github.com/naoiw/geo-quiz/actions/runs/44766295987) と [Pages dry-run](https://github.com/naoiw/geo-quiz/actions/runs/44766295965) は成功。Pagesのdeploy jobはスキップ。
- [cycling-map：Actions v7系のpnpm CI](https://github.com/naoiw/cycling-map/actions/runs/44769078977) と [main+develop Pages dry-run](https://github.com/naoiw/cycling-map/actions/runs/44769078973) は成功。Pagesのdeploy jobはスキップ。
- 一時検証ワークフローは削除済みです。**これらの結果をもって、未リリースのmain SHAへの本番利用先の自動切替は行いません**。次期共通workflowリリース時に再確認してください。

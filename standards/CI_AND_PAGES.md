# 共通CIとGitHub Pagesデプロイ

`naoiw/.github` の再利用可能ワークフローは**置くだけでは各リポジトリで実行されません**。呼び出し側リポジトリに `.github/workflows/` のYAMLを導入してください。

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
- `dry-run` のビルドは通常mainとdevelopから取得します。PRブランチ自体の成果物を試すものではありません。
- `publish-preview: true` を使用するのはdevelopがあるリポジトリだけです。
- React starterの `vite build` はこの共通方式と互換です。
- このオプションは既存Pages公開ワークフローを自動移行しません。

## 状態
本リポジトリのワークフローは共通部品の提供であり、既存アプリへの配布・移行やPagesの公開は行いません。導入時は対象リポジトリごとにPRと動作確認を行います。

# React / TypeScript / Vite 新規リポジトリの作成・Pages公開手順

この文書は `naoiw/react-vite-template` から**新しいGitHub Pages向けWebアプリ**を作る際の、リポジトリごとに必要な設定をまとめたものです。共通ルールは [ブランチ保護](BRANCH_PROTECTION.md) と [CI / Pages仕様](CI_AND_PAGES.md) にあります。**GitHubのSettingsはテンプレートから継承されません。**

対象は React + TypeScript + Vite、Node.js 26、pnpm 9.14.2。React/Vite以外（Next.jsなど）へ共通Pages workflowを流用しないでください。

## 1. 作成して初回公開する（既定: mainのみ・手動デプロイ）

1. [naoiw/react-vite-template](https://github.com/naoiw/react-vite-template) の **Use this template → Create a new repository** から作成します。公開予定のPagesサイトは通常Publicを選び、mainのみで開始します。
2. 複製されたREADMEの `__DISPLAY_NAME__`、`__OWNER__`、`__PROJECT_NAME__`、概要、公開URL、`package.json` のname、`index.html` のtitle、`src/App.tsx`、`LICENSE` の著作権者を変更します。**Use this templateはプレースホルダーを自動置換しません。**
3. Node.js 26 / pnpm 9.14.2を使用し、`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm build` を実行します。依存を変更した場合のみ `pnpm install` でlockfileを更新しコミットします。
4. **Settings → Pages → Build and deployment → Source: GitHub Actions** を選択します。
5. main向けPRまたはpushの **CI** が成功したことを確認します。初期構成は `.github/workflows/ci.yml` にあり、Lint / Typecheck / Buildが有効、テストは無効です。
6. **Actions → Deploy GitHub Pages → Run workflow → main** で最初のデプロイを手動実行します。現在の `.github/workflows/deploy-pages.yml` は `workflow_dispatch` のみなので、**mainへpushしても自動公開されません**。
7. 公開URL（Project Pages通常: `https://<owner>.github.io/<repo>/`）で画面と静的アセットを確認し、READMEのURLと公開状態を更新します。

`reusable-vite-pages.yml` はViteビルドに `--base=/<repo>/` を渡します。通常のProject Pagesでは `vite.config.ts` にbaseを追加する必要はありません。ただしアプリ内で `/assets/...` 等の絶対パスを独自に書いた場合は検証してください。

## 2. mainを保護する（リポジトリごとの手動設定）

新規リポジトリの **Settings → Rules → Rulesets → New branch ruleset** で対象を `main` に設定し、有効化します。

- **Require a pull request before merging**：有効。個人で開発する場合、必要な承認レビュー数はまず0を検討します。
- **Require status checks to pass**：有効。最初のCI実行後、実際のChecks名を選択します。このテンプレートでは通常 `shared-check / validate` ですが、GitHubのChecks表示を正としてください。
- **Block force pushes** と **Restrict deletions**：有効。

Rulesetsの利用可否や選択肢はリポジトリの公開範囲・権限等で異なります。**CIの名前やjob名を変更した場合は必須チェックも更新**してください。詳細は [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) を参照してください。

## 3. Pagesの運用モードを変更する

### A. mainのみ、手動公開（テンプレート初期値）

`.github/workflows/deploy-pages.yml` を変更せず、公開時にActionsから手動実行します。試作・実験用に適しています。

### B. mainへのpushで自動公開

`.github/workflows/deploy-pages.yml` の **`on` の部分だけ**を次に変更します。既存の `permissions`、`jobs`、共通Workflow参照SHA、pnpm設定は維持します。

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

PRをマージするとmainへのpushが発生し、Pagesを再公開します。**PRが開かれただけでは公開しません。** ブランチ保護と必須CIを有効にしてから自動公開へ切り替えることを推奨します。

### C. main本番 + developプレビュー（両方を同時公開）

既存Pagesサイトは**1サイト・1つのデプロイ成果物**です。developだけを別デプロイすると本番側が消えるため、共通Workflowの `publish-preview: true` で、mainを `/<repo>/`、developを `/<repo>/develop/` にまとめます。

1. 必要になった時点で `develop` を作成します。mainのみのプロジェクトに無条件で追加しません。
2. `.github/workflows/ci.yml` の `pull_request.branches` と `push.branches` の両方を `[main, develop]` に変更し、**name: CI** を維持します。
3. `.github/workflows/deploy-pages.yml` を下記のpnpm向け例に変更し、PRでmainへマージします。 `workflow_run` は呼び出し元Workflowが**デフォルトブランチ（main）に存在しなければ**動作しません。
4. mainとdevelopのCI結果を確認し、ActionsとPagesで本番URL・プレビューURLが両方存在することを確認します。
5. 必要であれば `develop` にもmainと同等のPR必須・CI必須のRulesetを適用します。

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [develop]
  workflow_dispatch:

permissions:
  contents: read

jobs:
  pages:
    if: >-
      ${{
        github.event_name != 'workflow_run' ||
        (github.event.workflow_run.conclusion == 'success' &&
         github.event.workflow_run.event == 'push' &&
         github.event.workflow_run.head_branch == 'develop' &&
         github.event.workflow_run.head_repository.full_name == github.repository)
      }}
    permissions:
      contents: read
      pages: write
      id-token: write
    uses: naoiw/.github/.github/workflows/reusable-vite-pages.yml@00047e65d7e53551e2644df02d2f22743ea2c471
    with:
      package-manager: pnpm
      node-version: "26"
      pnpm-version: "9.14.2"
      publish-preview: true
      preview-branch: develop
      preview-subpath: develop
```

これは **2026-11-21時点の検証済み共有v1.1.0 SHA** の例です。将来の新規作成時は [versions/workflows.json](../versions/workflows.json) の推奨SHAとテンプレートが採用するSHAを確認し、同じリリースの組み合わせをPR・CI・Pagesで検証してください。`workflow_run.workflows: [CI]` は `.github/workflows/ci.yml` の `name: CI` と厳密に一致させます。

## 4. 特殊ケース・確認項目

- **カスタムドメイン / user pages**：`/<repo>/` が公開ベースと異なる場合は、Pagesのドメイン設定と共通Workflowの `base-path` 入力（例: `"/"`）を対象サイトに合わせます。READMEの公開URLも修正します。
- **非公開の設定情報**：GitHub Pagesは生成した静的ファイルがクライアントへ配信されます。シークレットや個人情報をフロントエンドのビルド成果物に含めないでください。
- **SPAの深いURL / Service Worker / PWA**：リロード時の404やキャッシュ範囲は別途検証します。
- **Dependabot / ActionsのPR作成**：SettingsのDependency graph / Dependabot alerts / security updatesを個別確認。AI同期PRをGitHub Actionsから作る場合のみ、Actions → General → Workflow permissionsで **Allow GitHub Actions to create and approve pull requests** を許可します。通常のCI/Pagesだけなら不要です。
- **Pagesの安全な試験**：デプロイなしの `dry-run: true` は [CI_AND_PAGES.md](CI_AND_PAGES.md) を参照。既存の共通Workflow仕様ではdry-runでも呼び出しジョブにPages用権限の宣言が必要です。
- **新リポジトリへの継承はない**：Ruleset / PagesのSource / custom domain / ActionsによるPR作成権限はテンプレートを複製してもコピーされません。

## 最終チェック

- [ ] README・package名・アプリ表示・LICENSEを実プロジェクト向けに更新した
- [ ] pnpm lockfileを保持してLint / Typecheck / BuildとGitHub Actions CIが成功した
- [ ] mainのPR必須・CI必須・force push/削除禁止を設定した
- [ ] Settings → Pages → GitHub Actionsを設定し、初回デプロイを確認した
- [ ] 手動 / main自動 / main+developプレビューの**いずれか1つ**を選んだ
- [ ] 公開URL・アセット・必要ならプレビューURLをブラウザで確認した

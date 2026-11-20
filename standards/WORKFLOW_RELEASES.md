# 共通ワークフローのバージョン管理

## 現在の方針

- `versions/workflows.json` の `recommended_commit` を、**検証済みの推奨コミット**として使用します。
- 各利用リポジトリの `uses: naoiw/.github/.github/workflows/*.yml@<40桁SHA>` を原則とし、変更をレビュー可能なPRとして提案します。
- `@main` や移動するタグを本番の参照先として無断採用しません。
- ワークフロー単位の互換性が異なる場合は、利用側のビルド、Pagesプレビュー、権限、イベント種別を個別に検証します。
- `versions/workflows.json` を更新するときは必ず、リンク付きの検証結果をPRに記録してください。ファイルのSHAを更新しても、参照元リポジトリが自動更新されるわけではありません。

## リリース運用

`.github/workflows/release-shared-workflows.yml` は**手動起動専用**です。Actions → Release shared workflows → Run workflow から `main` ブランチと `version`（例: `1.0.0`）を指定すると、`workflows-v1.0.0` というタグとGitHub Releaseを作成します。

- リリース対象は手動起動時の**main HEAD**です。必ずPRのCIと必要な実地テストの成功を事前に確認してください。
- 使用済みバージョンを上書き・移動しません。既存タグなら失敗して停止します。
- リリース後、該当SHAを `versions/workflows.json` に記録するPRを作成し、コミットSHAを利用リポジトリへ展開します。
- GitHub Actionsの `contents: write` を許可する必要があります。管理権限の範囲によって設定変更は手動です。
- `ZUBURI` や他ユーザーのリポジトリには自動適用しません。

## バージョンの目安

- **MAJOR**: 呼び出し側YAMLの入力値・名前・権限・イベント互換性を壊す変更。
- **MINOR**: 後方互換の入力や機能の追加。
- **PATCH**: バグ・ドキュメント・互換性を壊さない内部更新。

依存する外部Actionのメジャーバージョン更新も動作確認を要します。バージョン番号だけを頼りに自動反映してはいけません。

## 監査と更新PR

[監査の手順](REPOSITORY_AUDIT.md) で、推奨SHAと各リポジトリの参照先を比較します。出力される更新候補をレビューし、対象リポジトリごとに独立したPRで反映します。自動マージは禁止です。

## v1.1.0 検証と先行展開

- [v1.1.0 Release](https://github.com/naoiw/.github/releases/tag/workflows-v1.1.0) は、[手動リリース実行](https://github.com/naoiw/.github/actions/runs/44786154325) によって公開済みです。
- リリースタグが指すコミット：`00047e65d7e53551e2644df02d2f22743ea2c471`（リリース時点のmainと一致）。v1.0.0は移動・上書きしません。
- [共通規約のmain検証](https://github.com/naoiw/.github/actions/runs/44782447044)：成功。
- [geo-quiz: npm Node CI](https://github.com/naoiw/geo-quiz/actions/runs/44784096096)、[Pages dry-run](https://github.com/naoiw/geo-quiz/actions/runs/44784096255)：成功。Pagesの公開ジョブはスキップ、Artifact生成済み。
- [cycling-map: pnpm Node CI](https://github.com/naoiw/cycling-map/actions/runs/44784082245)、[main+develop Pages dry-run](https://github.com/naoiw/cycling-map/actions/runs/44784082659)：成功。Pagesの公開ジョブはスキップ、Artifact生成済み。
- [geo-quiz pilot PR #63](https://github.com/naoiw/geo-quiz/pull/63) の[PR CI](https://github.com/naoiw/geo-quiz/actions/runs/44784766406) と [cycling-map pilot PR #23](https://github.com/naoiw/cycling-map/pull/23) の[PR CI](https://github.com/naoiw/cycling-map/actions/runs/44784776413) も成功。
- 両pilot PRはCI参照SHAのみ変更します。本番Pagesのworkflowは変更せず、**各PRを明示的にレビュー・マージ後にmain CIと本番Pagesを確認する**運用です。
- 同期用`reusable-sync-ai-rules.yml`についてはcheckout/setup-nodeの更新を確認していますが、書き込みを伴う同期PR作成の実地試験は今回のpilot対象外です。
- [リリース管理Issue #12](https://github.com/naoiw/.github/issues/12) に続く展開状況を記録します。

## 公開済みのリリース

- [Shared Workflows v1.1.0](https://github.com/naoiw/.github/releases/tag/workflows-v1.1.0)（2026-11-21確認）: commit `00047e65d7e53551e2644df02d2f22743ea2c471`
- [Shared Workflows v1.0.0](https://github.com/naoiw/.github/releases/tag/workflows-v1.0.0)（2026-11-21確認）: commit `2803c2939d96544d9243244686dad8e58b7b78b6`
- Releasesのタグは運用上**移動・上書きしない**でください。GitHub上のReleaseが技術的にimmutableに設定されていることを意味しません。
- 今後の推奨参照SHAは `versions/workflows.json` で管理します。既存プロジェクトのSHAは自動では更新しません。

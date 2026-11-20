# リポジトリ構成の既定方針

**新規作成時の出発点**です。既存リポジトリを一括改造するものではありません。

## React / Vite
```text
README.md               # 機能・起動手順・公開URL
LICENSE                 # プロジェクト個別
AGENTS.md               # 共通AI規約への明示的な橋渡し
docs/                   # 設計・開発・運用。必要な文書だけ
public/                 # 静的素材
src/
  components/           # 汎用UI部品
  features/             # 機能単位の実装（必要な場合）
  lib/                  # UI非依存処理
  styles/               # CSS（必要な場合）
tests/                  # テストが必要な場合
.github/workflows/      # 呼び出し側のCI・デプロイ設定
```

小規模な時計表示アプリや言語実験では、不要なディレクトリを作らない。プロジェクト規模や既存のアーキテクチャに合った構成を優先する。

## README / docs
- README: 機能一覧、動作環境、セットアップ、テスト、公開先、ライセンスの概要。
- docs: READMEに収まらない設計・運用・仕様だけ。
- docsが存在する場合、索引 `docs/README.md` は有用。ファイル数が少ない場合は不要。
- IssueとREADMEで未実装事項を二重管理しない。未実装機能は原則Issueで管理する。

## 開発資産
- `dist/`、`node_modules/`、秘密鍵、ローカルデータは原則コミットしない。
- 参考資料をdevelopだけに置く場合、mainへのPR差分を検査する。Gitのマージによる自動除外を前提にしない。

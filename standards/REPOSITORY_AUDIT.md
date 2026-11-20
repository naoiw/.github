# リポジトリ横断監査

## 目的と対象

`naoiw` の各リポジトリのAI管理領域、Node.js、CI、共通同期ワークフローの参照先を確認します。**読み取り専用**で、ファイルの変更やPRの作成は行いません。`ZUBURI` は対象外です。

## 実行方法

GitHubの `naoiw/.github` → Actions → **Audit naoiw repositories** → **Run workflow** を選択します。

- **public（既定）**：`/users/naoiw/repos` で取得できる公開リポジトリのみ。Secrets設定不要。
- **accessible**：`/user/repos` で読み取り可能な、所有者が `naoiw` のリポジトリ。**手動で `AUDIT_READ_TOKEN` をSecretとして登録**してください。Fine-grained PATを利用する場合は、対象リポジトリへの「Metadata: read」「Contents: read」だけを付与します。非公開リポジトリ名などがArtifactに含まれる可能性があるため、閲覧権限にも注意してください。

## 成果物

成功・失敗にかかわらず、取得できた範囲の `repository-audit` Artifactをアップロードします。保持期間は30日です。

- `report.md`：リポジトリ一覧と簡易ステータス
- `report.json`：機械処理用、参照SHAと取得エラーを収録

404は未導入として扱います。APIの他のエラーが起きた場合はレポートを不完全と明記し、Actionsジョブを失敗扱いにします。

## 注意

AI管理領域は `AGENTS.md` / Cursor / Copilotの**3つの同期マーカーの存在**で計測するだけで、内容の鮮度までは判断しません。

CIはファイル名からの簡易検出で、Lint/テストが成功している保証ではありません。Node.jsが `—` のリポジトリはC言語・Rustなどのプロジェクトかもしれません。推奨SHAと違っていても直ちに異常とはせず、互換性を確認して個別PRで対処します。

ローカルテストは `node --test scripts/test-audit-repositories.mjs`、APIへの実アクセスは `GITHUB_TOKEN=... node scripts/audit-repositories.mjs` です。

この監査は自動更新や自動マージを行いません。

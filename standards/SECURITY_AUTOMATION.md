# 依存関係とGitHub Actionsのセキュリティ運用

## 自動化

`.github/dependabot.yml` に次の更新チェックを設定しています。

- GitHub Actions：リポジトリルートのworkflow依存を月次チェック
- React/Viteスターター：`templates/web-react` のnpm依存を月次チェック
- 更新があればDependabotがPRを作成する。**自動マージはしない**。
- PRでは `Validate shared standards` のテスト、Lint、型チェック、ビルドを確認する。

この設定が反映されるのは **`naoiw/.github` リポジトリ自身**です。他のリポジトリで使用しているActionsやpackage.jsonに対して自動で依存更新PRを送るものではありません。

`templates/web-react` には現在lockfileがないため、他リポジトリに配布する際は `npm install` でlockfileを生成・コミットしてください。Dependabotの最初のPRで依存が変わった場合は生成lockfileも確認します。

## 手動で確認するGitHub設定

各リポジトリの **Settings → Code security and analysis** などから以下を確認します（表記・利用可能な項目はプランや公開範囲によります）。

- **Dependabot alerts**：既知の脆弱な依存関係の警告
- **Dependabot security updates**：セキュリティ更新PR
- **Secret scanning / push protection**：利用できるプラン・リポジトリで有効化
- **Code scanning / CodeQL default setup**：必要な言語・規模で段階導入

依存更新PRは一括マージせず、Actionsのメジャー変更、Node.jsのランタイム、Pagesの権限、lockfileの変更に注意してください。既存のCI/Pagesワークフローは、共通部品の変更だけで自動的に移行しません。

## Secrets / 権限

- 読み取り専用の監査は公開リポジトリなら通常のGITHUB_TOKENで動作します。
- 非公開リポジトリ監査には別途 `AUDIT_READ_TOKEN` を使い、Contents readの最小権限に絞ります。
- 他リポジトリへの書き込み用のPATを、この共通リポジトリに不用意に登録しません。
- GitHub Actionsの権限は各workflow/jobで最小化し、第三者からのPRで書込トークンを扱わないことを優先します。

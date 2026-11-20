# React/Viteテンプレートの独立

## 現状

`templates/web-react/` にReact/TypeScript/Viteの初期コードとCI・Pages呼び出し例があります。独立した `naoiw/react-vite-template` リポジトリは**まだ作成されていません**。

`scripts/export-web-template.mjs` を使うと、管理領域付きのAGENTS/Cursor/Copilotの3ファイルを含め、単独で利用できるディレクトリを生成できます。既存の出力先は上書きしません。

## 使い方

このリポジトリをクローンしてNode 26で次を実行します。

```bash
node scripts/export-web-template.mjs --name sample-app --owner naoiw --output ../sample-app --display "サンプル" --holder naoiw
cd ../sample-app
npm install
npm run lint
npm run typecheck
npm run build
```

`npm install` で生成した `package-lock.json` をコミットします。LICENSEの年・著作権者を確認し、必要に応じてREADMEを編集してください。

## 新規GitHub Template Repositoryを作る場合（手動）

1. [GitHubの新規作成画面](https://github.com/new) でOwner `naoiw`、名前 `react-vite-template`、公開範囲を選択。**空のリポジトリ**として作成します（既存リポジトリを誤って上書きしない）。
2. 上記のスクリプトを `--name react-vite-template --output ../react-vite-template` で実行し、生成されたファイルをGitHubの新規リポジトリへコミットします。必要であればChatGPTに新リポジトリを教えて、配置を依頼できます。
3. `npm install` してlockfileをコミット、Lint・型チェック・ビルドを検証します。
4. Repository Settings → General → **Template repository** を有効化します。
5. 「Use this template」で新しいリポジトリを作ったら、プロジェクト名、LICENSE著作権者、README、独自ドメイン、Pagesのベースパスを確認して更新します。

GitHub Pagesの設定が未完了のまま自動デプロイすると、Actionsが失敗する可能性があります。Template Repository自体をPagesで公開する必要はなく、不要ならデプロイworkflowを無効化してください。

## 運用原則

- 共通ワークフローやAI指示の原本は引き続き `naoiw/.github` に維持します。
- React雛形のソースを `.github` と独立リポジトリの**両方で編集しない**よう、独立後に原本をどちらにするか決めてREADMEを更新します。
- 一旦は `.github` 内の雛形を正とし、独立先は複製とします。後で移行PRを作成して二重管理を解消します。

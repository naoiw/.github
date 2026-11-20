# __DISPLAY_NAME__

React / TypeScript / Viteによる静的Webアプリです。

## 公開URL
- 本番: `https://__OWNER__.github.io/__PROJECT_NAME__/`（GitHub Pages使用時）
- 開発プレビュー: develop運用を有効にした場合のみ `https://__OWNER__.github.io/__PROJECT_NAME__/develop/`

## 技術スタック
- React 19 / TypeScript / Vite
- Node.js 26 / npm

## ローカル開発
```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run preview
```

新規コピー直後は `npm install` を一度実行して `package-lock.json` を生成・コミットしてください。以降は `npm ci` を利用します。

## デプロイ
- 標準はmainのみ。プレビューが必要な場合だけdevelopを利用します。
- GitHub Pagesの設定を「GitHub Actions」にし、共通ワークフローの呼び出しを追加します。
- SPAルーティングやPWAを採用する場合は、base pathとキャッシュ範囲を個別に検証します。
- 詳細は [開発手順](docs/DEVELOPMENT.md)。

## ドキュメント
- [設計](docs/ARCHITECTURE.md)
- [開発とGitHub Flow](docs/DEVELOPMENT.md)

## ライセンス
[MIT License](LICENSE)。外部素材を追加する場合は、それぞれのライセンス表記を確認してください。

# AI指示ファイルの導入テンプレート

以下は**コピーまたは内容を取り込んで**各リポジトリに設置するための雛形です。ここにあるだけではGitHubもChatGPTもCursorも他リポジトリで自動的には読み込みません。

- `AGENTS.md` → 各リポジトリのルートへ
- `.cursor/rules/naoiw-default.mdc` → 各リポジトリの同じパスへ
- `.github/copilot-instructions.md` → 各リポジトリの同じパスへ

いずれも `https://github.com/naoiw/.github/blob/main/standards/AI_DEVELOPMENT.md` を規約として参照する構成です。接続・ブラウズ能力のないエージェントではリンクだけでは内容を読めないため、必要に応じてルール本文の抜粋を各リポジトリに配置してください。

導入は**一度に全リポジトリへ強制しない**。既存ファイルを確認してから追加し、プロジェクト固有の指示を消さないこと。

# AI指示ファイルの導入

**新規導入・共通ルール同期の唯一の原本は [agent-bundle](agent-bundle/) です。**

| 対象リポジトリの配置先 | 雛形 |
| --- | --- |
| `AGENTS.md` | [agent-bundle/AGENTS.md](agent-bundle/AGENTS.md) |
| `.cursor/rules/naoiw-default.mdc` | [agent-bundle/.cursor/rules/naoiw-default.mdc](agent-bundle/.cursor/rules/naoiw-default.mdc) |
| `.github/copilot-instructions.md` | [agent-bundle/.github/copilot-instructions.md](agent-bundle/.github/copilot-instructions.md) |

古い参照用テンプレートと同期用雛形が並存していたため、旧3ファイルを廃止し、以後はagent-bundleだけを使用します。

管理領域のマーカー `<!-- naoiw:managed:start -->` と `<!-- naoiw:managed:end -->` の間だけを更新します。その外側のプロジェクト固有の指示は保持し、マーカーのない既存ファイルは上書きせずスキップします。

詳細は [同期の手順](../standards/AI_RULE_SYNC.md)。ツールごとの指示ファイルの読み込み仕様は異なり、自動で他リポジトリの規約を取得する保証はありません。

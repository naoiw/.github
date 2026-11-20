# Branch protection / Rulesetsの推奨設定

## 目的

誤ったmain更新・CI未検証の統合・誤削除を防ぎます。`naoiw/.github` に設定しただけでは他リポジトリには継承されません。

## 推奨プロファイル

| リポジトリ種別 | 対象ブランチ | PR | 必須CI | デプロイ |
| --- | --- | --- | --- | --- |
| mainのみのアプリ（geo-quiz） | main | 原則必須 | CI | main push後の既存Pages |
| main+develop（cycling-map） | develop | 原則必須 | Validate develop | CI成功後のプレビュー |
| main+develop（cycling-map） | main | 原則必須 | CI/検証ジョブ | main push後の本番 |
| 共通規約（naoiw/.github） | main | 原則必須 | Validate shared standards | デプロイなし |

- 強制pushとブランチ削除は原則禁止。
- 個人アカウントで単独開発する場合、**承認者1名を強制**すると自分でマージできなくなることがあります。まず必要レビュー数0（PRとCIの必須化）を検討してください。
- AIエージェントの書き込み用ブランチやDependabot PRを運用する場合も、mainへの無条件マージは許可しません。
- Pagesのworkflowが他workflowの**名前**を `workflow_run` で参照する場合、名前を変えずに移行してください。
- 共通CIは呼び出し元のjob名と再利用先のjob名が組み合わさるため、**required status checkの表示名が変わる**ことがあります。移行後の実際のChecks画面で新名称を指定し直してください。

## 手動設定の手順

1. 対象のGitHubリポジトリで Settings → Rules → Rulesets を開く。
2. New ruleset → New branch rulesetを選び、対象を `main` または `develop` に設定。
3. 必要に応じてRequire a pull request before merging / Require status checks to pass / Block force pushes / Restrict deletionsを指定。
4. 新規作成ではいきなり全リポジトリへ適用せず、まず1つのリポジトリでPRの作成・CI・マージを確認する。
5. 次に同じカテゴリのリポジトリへ展開。Rulesetsの利用可否や機能はプラン・公開範囲・権限によります。

**注意**：現時点で `naoiw/.github`、`geo-quiz`、`cycling-map` についてGitHub APIのRulesets一覧は空です。一方、branch protection APIは接続アプリから403（管理権限なし）で詳細確認できていません。「保護設定が一切ない」とは断定できません。

## 改善の順番

1. `naoiw/.github/main` から導入し、共通規約の変更がPRとCIを通ることを確認。
2. `geo-quiz/main` に適用。
3. `cycling-map/develop` の検証フローに適用。
4. `cycling-map/main` に本番リリース用として適用。
5. 他のリポジトリへ対象範囲を明示して展開。

設定はGitHub上の管理者操作であり、.githubリポジトリに文書を置いても自動的にRulesetsは作られません。

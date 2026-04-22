# Supabase セットアップ手順

## 1. やること

1. Supabase で新規プロジェクトを作成する
2. `Authentication` の Email プロバイダを有効にする
3. SQL Editor で [init.sql](/C:/Program AI/todoapp-codex/supabase/init.sql) を実行する
4. `Project URL` と `Publishable key` を取得する
5. [config.js](/C:/Program AI/todoapp-codex/config.js) に設定する

## 2. SQL 実行

Supabase の `SQL Editor` を開き、[init.sql](/C:/Program AI/todoapp-codex/supabase/init.sql) の内容を貼り付けて実行する。

この SQL で作成されるもの:

- `profiles` テーブル
- `posts` テーブル
- `updated_at` 自動更新トリガー
- 最小限の `RLS`

## 3. 認証設定

- `Authentication` で Email プロバイダを有効化する
- メール確認を有効にする場合、新規登録後すぐにはログイン状態にならないことがある
- 現行フロントはメール確認未完了エラーに対して案内メッセージを表示する

## 4. `config.js` 設定

[config.js](/C:/Program AI/todoapp-codex/config.js) を以下のように設定する。

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_KEY",
};
```

補足:

- 現行コードは `window.APP_CONFIG.supabaseAnonKey` というキー名を参照している
- 値として設定するのは Supabase の `Publishable key` でよい
- `supabaseUrl` と `supabaseAnonKey` の両方が揃わない場合は `demo mode` で起動する

## 5. 動作確認

1. 画面を再読み込みする
2. 右上の表示が `supabase mode` になっていることを確認する
3. 新規登録またはログインを行う
4. プロフィール更新、投稿作成、投稿編集、投稿削除を確認する

## 6. いまの RLS 方針

### 6.1 `profiles`

- 本人のみ参照可能
- 本人のみ登録可能
- 本人のみ更新可能

### 6.2 `posts`

- 公開投稿は全員参照可能
- 自分の投稿は `draft`、`archived` を含めて参照可能
- 作成、更新、削除は本人のみ可能

## 7. フロント実装との対応

- プロフィール取得時に `profiles` が存在しない場合は自動作成を行う
- 公開投稿一覧では `status = 'published'` のみ取得する
- 投稿編集画面は本人投稿のみ表示する
- 投稿状態変更時の `published_at` 更新はフロントから明示的に行う

## 8. 補足

- フロントの実装は `profiles` と `posts` を前提にしている
- 今後カラムを増やす場合は、SQL とフロントの両方を合わせて更新すること
- 詳細なテーブル仕様は [table-definition.md](/C:/Program AI/todoapp-codex/docs/table-definition.md) を参照

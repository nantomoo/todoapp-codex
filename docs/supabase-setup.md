# Supabase セットアップ手順

## 1. やること

1. Supabase で新規プロジェクトを作成する
2. `Authentication` を有効にする
3. SQL Editor で [init.sql](/C:/Users/hashi/OneDrive/デスクトップ/program/codex-test-cli/supabase/init.sql) を実行する
4. `Project URL` と `anon key` を取得する
5. [config.js](/C:/Users/hashi/OneDrive/デスクトップ/program/codex-test-cli/config.js) に設定する

## 2. SQL 実行

Supabase の `SQL Editor` を開き、[init.sql](/C:/Users/hashi/OneDrive/デスクトップ/program/codex-test-cli/supabase/init.sql) の内容を貼り付けて実行します。

この SQL で作成されるもの:

- `profiles` テーブル
- `posts` テーブル
- `updated_at` 自動更新トリガー
- 最小限の `RLS`

## 3. 認証設定

基本は `Email` プロバイダを有効にしてください。

補足:
- メール確認ありにすると、新規登録後すぐにはログイン状態にならない場合があります
- 開発初期は Email Confirm を一時的に緩めると確認しやすいです

## 4. config.js 設定

[config.js](/C:/Users/hashi/OneDrive/デスクトップ/program/codex-test-cli/config.js) を以下のように更新します。

```js
window.APP_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
};
```

## 5. 動作確認

1. 画面を再読み込みする
2. 右上の表示が `supabase mode` になっていることを確認する
3. 新規登録またはログインを行う
4. プロフィール更新、投稿作成、投稿編集を確認する

## 6. いまの RLS 方針

- `profiles`
  - 本人のみ参照、登録、更新可能
- `posts`
  - 公開投稿は全員参照可能
  - 自分の投稿は下書きでも参照可能
  - 作成、更新、削除は本人のみ可能

## 7. 補足

- フロントの実装は `profiles` と `posts` を前提にしています
- 今後カラムを増やす場合は、SQL とフロントの両方を合わせて更新してください

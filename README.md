# Post Board

会員制投稿アプリの静的 SPA フロントです。

Supabase に接続して実データを扱う構成を前提にしつつ、接続情報が未設定でも `demo mode` で動作確認できます。

## 実装済み

- トップ画面
- 会員登録
- ログイン、ログアウト
- セッション保持
- プロフィール参照、更新
- 投稿一覧、投稿詳細
- 自分の投稿一覧
- 投稿作成、編集、削除
- 投稿状態変更
- `demo mode` と `supabase mode` の切り替え表示

## 技術構成

- 静的 SPA
- HTML / CSS / Vanilla JavaScript
- ハッシュルーティング
- Supabase Auth
- Supabase PostgreSQL
- `localStorage` ベースの `demo mode`

## ファイル構成

- `index.html`
- `styles.css`
- `script.js`
- `config.js`
- `serve.js`
- `supabase/init.sql`
- `docs/`

## 起動方法

静的ファイルだけで動作します。`index.html` を直接開くこともできますが、簡易サーバー利用を推奨します。

```powershell
node serve.js
```

起動後は `http://localhost:8000/` にアクセスします。

## Supabase 側の準備

1. Supabase でプロジェクトを作成する
2. `Authentication` の Email プロバイダを有効にする
3. `SQL Editor` で [supabase/init.sql](/C:/Program AI/todoapp-codex/supabase/init.sql) を実行する
4. フロント側の接続設定を行う

詳細は [docs/supabase-setup.md](/C:/Program AI/todoapp-codex/docs/supabase-setup.md) を参照してください。

## Demo Mode

Supabase 未設定時は `localStorage` を利用した `demo mode` で動作します。

- 初期アカウント: `demo@example.com / password123`
- 初期プロフィール: `デモ会員`
- 初期投稿: 公開投稿 1 件

## 関連ドキュメント

- [システム概要](/C:/Program AI/todoapp-codex/docs/system-overview.md)
- [機能一覧](/C:/Program AI/todoapp-codex/docs/function-list.md)
- [画面一覧 / 遷移図](/C:/Program AI/todoapp-codex/docs/screen-transition.md)
- [DB 設計](/C:/Program AI/todoapp-codex/docs/table-definition.md)
- [ER 図 Mermaid](/C:/Program AI/todoapp-codex/docs/er-diagram-mermaid.md)
- [Supabase セットアップ手順](/C:/Program AI/todoapp-codex/docs/supabase-setup.md)

## 補足

- Supabase 側には `profiles` と `posts` テーブルが必要です
- 認可は RLS 前提です
- プロフィール未作成時は初回参照時に自動作成されます

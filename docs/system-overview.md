# システム概要

## 1. システム名

Post Board

## 2. 目的

ユーザーが会員登録またはログインを行い、プロフィール管理と投稿の作成・閲覧・更新・削除を行える会員制投稿アプリを提供する。

本アプリは静的ファイルで配信可能な SPA として実装されており、Supabase 接続時は実データを扱い、未接続時は `localStorage` を用いた `demo mode` で動作確認できる。

## 3. システム構成

```text
[Browser]
- index.html
- styles.css
- script.js
- Hash Router

    |  HTTPS / Supabase JS
    v

[Supabase] ※ 接続時のみ
- Auth
- PostgreSQL Database
- Row Level Security

    または

[Browser localStorage] ※ demo mode
- demo users
- demo profiles
- demo posts
```

## 4. 基本方針

- フロントエンドは単一の静的 SPA とし、画面描画、入力受付、クライアント側バリデーションを担当する
- 画面遷移はハッシュルーティングで実装する
- `config.js` に `supabaseUrl` と `supabaseAnonKey` が設定されている場合は `supabase mode`、未設定時は `demo mode` とする
- Supabase 利用時の認証は Supabase Auth を利用する
- Supabase 利用時のデータ取得、更新は `profiles` と `posts` テーブルに対して行う
- 認可はフロントの画面制御に加えて、Supabase の RLS で強制する
- 独自 API サーバーや Edge Functions は現行実装には含めない

## 5. 対象ユーザー

### 5.1 ゲストユーザー

- 未ログインでトップ画面、公開投稿一覧、公開投稿詳細を閲覧できる
- 会員登録、ログインを行える

### 5.2 会員ユーザー

- ログイン後にダッシュボードを利用できる
- 自分のプロフィールを参照、更新できる
- 自分の投稿を作成、編集、削除できる
- 投稿状態を `draft`、`published`、`archived` から選択できる

## 6. 実装済み機能

- 会員登録
- ログイン、ログアウト
- セッション保持
- プロフィール参照、更新
- 公開投稿一覧、公開投稿詳細
- 自分の投稿一覧
- 投稿作成、編集、削除
- 投稿状態変更
- `demo mode` と `supabase mode` の切り替え表示
- 認証必須画面のガードと未認証時のログイン画面誘導
- 成功、警告、エラーメッセージの通知表示

## 7. 動作モード

### 7.1 `demo mode`

- `config.js` に Supabase 接続情報が無い場合に利用する
- データ保存先はブラウザの `localStorage`
- 初期アカウントとして `demo@example.com / password123` を利用できる
- 初期データとして公開投稿 1 件を自動投入する

### 7.2 `supabase mode`

- `config.js` の接続情報をもとに Supabase クライアントを生成する
- 認証は Supabase Auth を利用する
- プロフィール未作成時は初回参照時に `profiles` へ自動作成する
- 投稿の公開可否は `posts.status` と RLS 方針に従う

## 8. 非機能要件

- 主要画面は PC、スマートフォンの両方で利用できるレスポンシブ UI とする
- Supabase 利用時は `profiles`、`posts` テーブルに対して RLS を有効化する
- 更新日時は DB トリガーで自動更新する
- 画面上の主要入力には文字数制限と必須チェックを設ける
- エラーや完了メッセージは画面上の通知領域に表示する

## 9. 現時点で未実装の項目

- パスワード再設定
- 検索、絞り込み、ページング
- 画像アップロード
- 監査ログ
- Webhook 受信
- 通知送信
- 管理画面

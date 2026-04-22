# DB 設計

## 1. 採用方針

- Supabase の PostgreSQL を利用する
- 認証ユーザー本体は `auth.users` を利用する
- 業務テーブルは `public.profiles` と `public.posts` の 2 テーブルとする
- 業務テーブルには RLS を設定する
- 更新日時は `public.set_updated_at()` トリガー関数で自動更新する

## 2. テーブル一覧

| 論理名 | 物理名 | 概要 |
|---|---|---|
| 認証ユーザー | `auth.users` | Supabase Auth が管理する認証ユーザー |
| プロフィール | `public.profiles` | ログインユーザーのプロフィール情報 |
| 投稿 | `public.posts` | 投稿本文と公開状態 |

## 3. テーブル定義

### 3.1 `public.profiles`

| カラム名 | 型 | PK | FK | NULL | デフォルト | 説明 |
|---|---|---|---|---|---|---|
| id | uuid | Yes | No | No | `gen_random_uuid()` | 主キー |
| user_id | uuid | No | Yes | No | なし | `auth.users.id` に紐づくユーザー ID |
| display_name | text | No | No | No | なし | 表示名 |
| bio | text | No | No | Yes | `null` | 自己紹介 |
| created_at | timestamptz | No | No | No | `timezone('utc', now())` | 作成日時 |
| updated_at | timestamptz | No | No | No | `timezone('utc', now())` | 更新日時 |

### 3.2 `public.posts`

| カラム名 | 型 | PK | FK | NULL | デフォルト | 説明 |
|---|---|---|---|---|---|---|
| id | uuid | Yes | No | No | `gen_random_uuid()` | 主キー |
| user_id | uuid | No | Yes | No | なし | 投稿者ユーザー ID |
| title | text | No | No | No | なし | タイトル |
| body | text | No | No | No | なし | 本文 |
| status | text | No | No | No | `'draft'` | 投稿状態。`draft / published / archived` |
| published_at | timestamptz | No | No | Yes | `null` | 公開日時 |
| created_at | timestamptz | No | No | No | `timezone('utc', now())` | 作成日時 |
| updated_at | timestamptz | No | No | No | `timezone('utc', now())` | 更新日時 |

## 4. 制約、インデックス、トリガー

### 4.1 `public.profiles`

- 主キー: `id`
- 一意制約: `user_id`
- 外部キー: `user_id -> auth.users.id`
- 参照削除: `on delete cascade`
- 更新トリガー: `profiles_set_updated_at`

### 4.2 `public.posts`

- 主キー: `id`
- 外部キー: `user_id -> auth.users.id`
- 参照削除: `on delete cascade`
- `status` 制約: `check (status in ('draft', 'published', 'archived'))`
- インデックス: `posts_user_id_idx`
- インデックス: `posts_status_idx`
- インデックス: `posts_published_at_idx`
- 更新トリガー: `posts_set_updated_at`

### 4.3 共通関数

- トリガー関数: `public.set_updated_at()`
- 役割: 更新時に `updated_at` を UTC 現在時刻で上書きする

## 5. RLS 設計

### 5.1 `public.profiles`

- `profiles_select_own`
  - `authenticated` のみ
  - `auth.uid() = user_id` の行のみ参照可能
- `profiles_insert_own`
  - `authenticated` のみ
  - 自分自身の `user_id` でのみ登録可能
- `profiles_update_own`
  - `authenticated` のみ
  - 自分自身の行のみ更新可能

### 5.2 `public.posts`

- `posts_select_published_or_own`
  - `anon`, `authenticated`
  - `status = 'published'` または `auth.uid() = user_id` の行を参照可能
- `posts_insert_own`
  - `authenticated` のみ
  - 自分自身の `user_id` でのみ登録可能
- `posts_update_own`
  - `authenticated` のみ
  - 自分自身の行のみ更新可能
- `posts_delete_own`
  - `authenticated` のみ
  - 自分自身の行のみ削除可能

## 6. アプリ実装上の扱い

- プロフィールはログイン後に取得し、未作成の場合は初回参照時に自動生成する
- 投稿一覧画面では `status = 'published'` の投稿のみ表示する
- 投稿詳細画面では本人のみ `draft` と `archived` を閲覧できる
- 投稿編集画面は本人投稿のみ表示する
- 投稿を `published` で新規作成した場合は `published_at` を設定する
- 投稿更新時に `published` を選ぶと `published_at` は更新時刻で上書きされる
- 投稿更新時に `draft` または `archived` を選ぶと `published_at` は `null` になる

## 7. フロント側バリデーション

### 7.1 `profiles`

- `display_name`: 必須、40 文字以内
- `bio`: 300 文字以内

### 7.2 `posts`

- `title`: 必須、120 文字以内
- `body`: 必須、5000 文字以内
- `status`: `draft`、`published`、`archived` のいずれか

## 8. 未採用項目

- `audit_logs` テーブルは現行実装には含めない
- タグ、カテゴリ、コメント、いいね等の関連テーブルは未実装
- 監査用トリガーや通知テーブルは未実装

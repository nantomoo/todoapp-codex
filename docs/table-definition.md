# テーブル定義書

## 1. テーブル一覧

| 論理名 | 物理名 | 概要 |
|---|---|---|
| プロフィール | `profiles` | ユーザーの公開プロフィール情報 |
| 投稿 | `posts` | 投稿本文および公開状態 |
| 監査ログ | `audit_logs` | 重要操作の履歴 |

## 2. テーブル定義

### 2.1 `profiles`

| カラム名 | 型 | PK | FK | NULL | デフォルト | 説明 |
|---|---|---|---|---|---|---|
| id | uuid | Yes | No | No | `gen_random_uuid()` | 主キー |
| user_id | uuid | No | Yes | No | なし | `auth.users.id` と紐づくユーザー ID |
| display_name | text | No | No | No | なし | 表示名 |
| bio | text | No | No | Yes | `null` | 自己紹介 |
| created_at | timestamptz | No | No | No | `now()` | 作成日時 |
| updated_at | timestamptz | No | No | No | `now()` | 更新日時 |

### 2.2 `posts`

| カラム名 | 型 | PK | FK | NULL | デフォルト | 説明 |
|---|---|---|---|---|---|---|
| id | uuid | Yes | No | No | `gen_random_uuid()` | 主キー |
| user_id | uuid | No | Yes | No | なし | 投稿者ユーザー ID |
| title | text | No | No | No | なし | タイトル |
| body | text | No | No | No | なし | 本文 |
| status | text | No | No | No | `'draft'` | 投稿状態。`draft / published / archived` |
| published_at | timestamptz | No | No | Yes | `null` | 公開日時 |
| created_at | timestamptz | No | No | No | `now()` | 作成日時 |
| updated_at | timestamptz | No | No | No | `now()` | 更新日時 |

### 2.3 `audit_logs`

| カラム名 | 型 | PK | FK | NULL | デフォルト | 説明 |
|---|---|---|---|---|---|---|
| id | uuid | Yes | No | No | `gen_random_uuid()` | 主キー |
| actor_user_id | uuid | No | Yes | Yes | `null` | 実行者ユーザー ID |
| action | text | No | No | No | なし | 操作種別 |
| target_type | text | No | No | No | なし | 対象種別 |
| target_id | uuid | No | No | Yes | `null` | 対象レコード ID |
| metadata | jsonb | No | No | Yes | `'{}'::jsonb` | 補足情報 |
| created_at | timestamptz | No | No | No | `now()` | 実行日時 |

## 3. インデックス、制約

### 3.1 `profiles`

- 主キー: `id`
- 一意制約: `user_id`
- 外部キー: `user_id -> auth.users.id`

### 3.2 `posts`

- 主キー: `id`
- 外部キー: `user_id -> auth.users.id`
- 推奨インデックス: `user_id`, `status`, `published_at`

### 3.3 `audit_logs`

- 主キー: `id`
- 外部キー: `actor_user_id -> auth.users.id`
- 推奨インデックス: `actor_user_id`, `target_type`, `created_at`

## 4. 運用上の注意

- 業務テーブルは RLS を有効化する
- `updated_at` は更新トリガーで自動更新する

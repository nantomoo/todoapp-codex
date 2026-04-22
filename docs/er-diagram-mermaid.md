# ER図 Mermaid

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : owns
    AUTH_USERS ||--o{ POSTS : creates

    AUTH_USERS {
        uuid id PK
    }

    PROFILES {
        uuid id PK
        uuid user_id FK
        text display_name
        text bio
        timestamptz created_at
        timestamptz updated_at
    }

    POSTS {
        uuid id PK
        uuid user_id FK
        text title
        text body
        text status
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }
```

## 補足

- `AUTH_USERS` は Supabase Auth の `auth.users` を表す
- `PROFILES.user_id` は `AUTH_USERS.id` に対する一意な外部キーで、1 ユーザー 1 プロフィール
- `POSTS.user_id` は `AUTH_USERS.id` に対する外部キーで、1 ユーザーが複数投稿を持つ
- `posts.status` の取り得る値は `draft`、`published`、`archived`

## draw.io 取込手順

`Arrange` → `Insert` → `Advanced` → `Mermaid` から、上記コードブロック内の Mermaid を貼り付けて読み込む。

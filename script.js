const APP_CONFIG = window.APP_CONFIG ?? {};
const DEMO_STORAGE_KEY = "post-board-demo-data";
const DEMO_SESSION_KEY = "post-board-demo-session";

const appRoot = document.getElementById("app");
const topnav = document.getElementById("topnav");
const noticeArea = document.getElementById("notice-area");

const state = {
  notice: null,
  session: null,
  profile: null,
  mode: "demo",
};

const STATUS_LABELS = {
  draft: "下書き",
  published: "公開中",
  archived: "保管",
};

const formatDateTime = (value) => {
  if (!value) return "未設定";
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const nl2br = (value) => escapeHtml(value).replaceAll("\n", "<br>");

const excerpt = (value, max = 120) => {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
};

const getStatusLabel = (status) => STATUS_LABELS[status] ?? status;

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();

const normalizeNewLines = (value) => String(value ?? "").replace(/\r\n/g, "\n").trim();

const toFriendlyError = (error) => {
  const message = String(error?.message ?? error ?? "エラーが発生しました。");

  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("User already registered")) {
    return "このメールアドレスは既に登録されています。";
  }
  if (message.includes("Password should be at least")) {
    return "パスワードは 8 文字以上で入力してください。";
  }
  if (message.includes("Email not confirmed")) {
    return "メール確認が完了していません。メール内のリンクを確認してください。";
  }
  if (message.includes("Auth session missing")) {
    return "ログイン状態を確認できませんでした。再度ログインしてください。";
  }
  return message;
};

const setFormBusy = (form, busy) => {
  const elements = Array.from(form.elements);
  elements.forEach((element) => {
    if (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.disabled = busy;
    }
  });

  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    if (!submitButton.dataset.defaultLabel) {
      submitButton.dataset.defaultLabel = submitButton.textContent;
    }
    submitButton.textContent = busy ? "処理中..." : submitButton.dataset.defaultLabel;
  }
};

const validateProfileInput = ({ display_name, bio }) => {
  if (!display_name) {
    throw new Error("表示名を入力してください。");
  }
  if (display_name.length > 40) {
    throw new Error("表示名は 40 文字以内で入力してください。");
  }
  if (bio.length > 300) {
    throw new Error("自己紹介は 300 文字以内で入力してください。");
  }
};

const validatePostInput = ({ title, body, status }) => {
  if (!title) {
    throw new Error("タイトルを入力してください。");
  }
  if (!body) {
    throw new Error("本文を入力してください。");
  }
  if (title.length > 120) {
    throw new Error("タイトルは 120 文字以内で入力してください。");
  }
  if (body.length > 5000) {
    throw new Error("本文は 5000 文字以内で入力してください。");
  }
  if (!Object.hasOwn(STATUS_LABELS, status)) {
    throw new Error("投稿状態の指定が不正です。");
  }
};

const parseRoute = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathOnly] = raw.split("?");
  const segments = pathOnly.split("/").filter(Boolean);

  if (pathOnly === "/" || pathOnly === "") return { name: "home" };
  if (pathOnly === "/login") return { name: "login" };
  if (pathOnly === "/signup") return { name: "signup" };
  if (pathOnly === "/dashboard") return { name: "dashboard" };
  if (pathOnly === "/account") return { name: "account" };
  if (pathOnly === "/posts") return { name: "posts" };
  if (segments[0] === "posts" && segments[1]) return { name: "post-detail", id: segments[1] };
  if (pathOnly === "/my/posts") return { name: "my-posts" };
  if (pathOnly === "/my/posts/new") return { name: "post-new" };
  if (segments[0] === "my" && segments[1] === "posts" && segments[2] && segments[3] === "edit") {
    return { name: "post-edit", id: segments[2] };
  }
  return { name: "not-found" };
};

const navigateTo = (path) => {
  const nextHash = `#${path}`;
  if (window.location.hash === nextHash) {
    renderApp();
    return;
  }
  window.location.hash = nextHash;
};

const setNotice = (type, message) => {
  state.notice = { type, message };
  renderNotice();
};

const clearNotice = () => {
  state.notice = null;
  renderNotice();
};

const renderNotice = () => {
  if (!state.notice) {
    noticeArea.innerHTML = "";
    return;
  }

  noticeArea.innerHTML = `
    <div class="notice notice-${state.notice.type}">
      <span>${escapeHtml(state.notice.message)}</span>
      <button type="button" class="ghost-button small-button" data-action="clear-notice">閉じる</button>
    </div>
  `;
};

const createDemoStore = () => {
  const load = () => {
    try {
      const raw = localStorage.getItem(DEMO_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    const now = new Date().toISOString();
    const seedPostId = crypto.randomUUID();
    const seedUserId = crypto.randomUUID();
    return {
      users: [
        {
          id: seedUserId,
          email: "demo@example.com",
          password: "password123",
        },
      ],
      profiles: [
        {
          id: crypto.randomUUID(),
          user_id: seedUserId,
          display_name: "デモ会員",
          bio: "Supabase 未設定時の確認用アカウントです。",
          created_at: now,
          updated_at: now,
        },
      ],
      posts: [
        {
          id: seedPostId,
          user_id: seedUserId,
          title: "ようこそ",
          body: "この画面は demo mode で動作しています。Supabase を設定すると実データに切り替わります。",
          status: "published",
          published_at: now,
          created_at: now,
          updated_at: now,
        },
      ],
    };
  };

  let data = load();

  const save = () => {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
  };

  const sessionUserId = () => localStorage.getItem(DEMO_SESSION_KEY);
  const currentUser = () => data.users.find((user) => user.id === sessionUserId()) ?? null;
  const currentProfile = () => {
    const user = currentUser();
    if (!user) return null;
    return data.profiles.find((profile) => profile.user_id === user.id) ?? null;
  };

  return {
    mode: "demo",
    async init() {
      return currentUser();
    },
    async getSession() {
      return currentUser();
    },
    async signUp({ email, password, displayName }) {
      if (data.users.some((user) => user.email === email)) {
        throw new Error("このメールアドレスは既に登録されています。");
      }
      const now = new Date().toISOString();
      const userId = crypto.randomUUID();
      data.users.push({ id: userId, email, password });
      data.profiles.push({
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: displayName || "新規会員",
        bio: "",
        created_at: now,
        updated_at: now,
      });
      save();
      localStorage.setItem(DEMO_SESSION_KEY, userId);
      return currentUser();
    },
    async signIn({ email, password }) {
      const user = data.users.find((item) => item.email === email && item.password === password);
      if (!user) {
        throw new Error("メールアドレスまたはパスワードが正しくありません。");
      }
      localStorage.setItem(DEMO_SESSION_KEY, user.id);
      return user;
    },
    async signOut() {
      localStorage.removeItem(DEMO_SESSION_KEY);
    },
    async getProfile() {
      return currentProfile();
    },
    async updateProfile({ display_name, bio }) {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const now = new Date().toISOString();
      const profile = currentProfile();
      if (!profile) throw new Error("プロフィールが見つかりません。");
      profile.display_name = display_name;
      profile.bio = bio;
      profile.updated_at = now;
      save();
      return profile;
    },
    async listPublishedPosts() {
      return data.posts
        .filter((post) => post.status === "published")
        .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
    },
    async listMyPosts() {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      return data.posts
        .filter((post) => post.user_id === user.id)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    },
    async getPostForView(id) {
      const post = data.posts.find((item) => item.id === id);
      const user = currentUser();
      if (!post) return null;
      if (post.status !== "published" && (!user || post.user_id !== user.id)) {
        return null;
      }
      return post;
    },
    async getPostForEdit(id) {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      return data.posts.find((item) => item.id === id && item.user_id === user.id) ?? null;
    },
    async createPost({ title, body, status }) {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const now = new Date().toISOString();
      const post = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title,
        body,
        status,
        published_at: status === "published" ? now : null,
        created_at: now,
        updated_at: now,
      };
      data.posts.push(post);
      save();
      return post;
    },
    async updatePost(id, { title, body, status }) {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const post = data.posts.find((item) => item.id === id && item.user_id === user.id);
      if (!post) throw new Error("投稿が見つかりません。");
      const now = new Date().toISOString();
      post.title = title;
      post.body = body;
      post.status = status;
      post.updated_at = now;
      post.published_at = status === "published" ? post.published_at || now : null;
      save();
      return post;
    },
    async deletePost(id) {
      const user = currentUser();
      if (!user) throw new Error("ログインが必要です。");
      data.posts = data.posts.filter((item) => !(item.id === id && item.user_id === user.id));
      save();
    },
  };
};

const createSupabaseStore = () => {
  const client = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);

  const currentUser = async () => {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user ?? null;
  };

  const currentProfile = async () => {
    const user = await currentUser();
    if (!user) return null;
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const payload = {
      user_id: user.id,
      display_name: user.email?.split("@")[0] ?? "会員",
      bio: "",
    };
    const { data: created, error: insertError } = await client
      .from("profiles")
      .insert(payload)
      .select("*")
      .single();
    if (insertError) throw insertError;
    return created;
  };

  return {
    mode: "supabase",
    async init() {
      return currentUser();
    },
    async getSession() {
      return currentUser();
    },
    async signUp({ email, password, displayName }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (error) throw error;
      return data.user ?? null;
    },
    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async getProfile() {
      return currentProfile();
    },
    async updateProfile({ display_name, bio }) {
      const user = await currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const { data, error } = await client
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name,
          bio,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    async listPublishedPosts() {
      const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    async listMyPosts() {
      const user = await currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    async getPostForView(id) {
      const user = await currentUser();
      let query = client.from("posts").select("*").eq("id", id);
      if (!user) {
        query = query.eq("status", "published");
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return null;
      if (data.status !== "published" && data.user_id !== user?.id) return null;
      return data;
    },
    async getPostForEdit(id) {
      const user = await currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async createPost({ title, body, status }) {
      const user = await currentUser();
      if (!user) throw new Error("ログインが必要です。");
      const payload = {
        user_id: user.id,
        title,
        body,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
      };
      const { data, error } = await client.from("posts").insert(payload).select("*").single();
      if (error) throw error;
      return data;
    },
    async updatePost(id, { title, body, status }) {
      const updates = {
        title,
        body,
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === "published") {
        updates.published_at = new Date().toISOString();
      } else if (status !== "published") {
        updates.published_at = null;
      }
      const { data, error } = await client
        .from("posts")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    async deletePost(id) {
      const { error } = await client.from("posts").delete().eq("id", id);
      if (error) throw error;
    },
  };
};

const api = APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey && window.supabase
  ? createSupabaseStore()
  : createDemoStore();

state.mode = api.mode;

const requireAuth = (routeName) => ["dashboard", "account", "my-posts", "post-new", "post-edit"].includes(routeName);

const renderTopnav = () => {
  const links = [
    ['#/', "トップ"],
    ['#/posts', "投稿一覧"],
  ];

  if (state.session) {
    links.push(['#/dashboard', "ダッシュボード"]);
    links.push(['#/my/posts', "自分の投稿"]);
  } else {
    links.push(['#/login', "ログイン"]);
    links.push(['#/signup', "新規登録"]);
  }

  topnav.innerHTML = `
    <div class="mode-chip">${state.mode === "supabase" ? "supabase mode" : "demo mode"}</div>
    ${links.map(([href, label]) => `<a class="nav-link" href="${href}">${label}</a>`).join("")}
    ${state.session ? '<button type="button" class="ghost-button" data-action="logout">ログアウト</button>' : ""}
  `;
};

const renderPostsGrid = (posts, emptyMessage, manage = false) => {
  if (!posts.length) {
    return `<div class="empty-panel">${escapeHtml(emptyMessage)}</div>`;
  }

  return `
    <div class="post-grid">
      ${posts.map((post) => `
        <article class="post-card">
          <div class="status-row">
            <span class="status-pill status-${post.status}">${escapeHtml(getStatusLabel(post.status))}</span>
            <span class="meta-text">${escapeHtml(formatDateTime(post.updated_at || post.created_at))}</span>
          </div>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(excerpt(post.body, 140))}</p>
          <div class="card-actions">
            <a class="text-link" href="#/posts/${post.id}">詳細を見る</a>
            ${manage ? `<a class="text-link" href="#/my/posts/${post.id}/edit">編集する</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
};

const renderHome = () => `
  <section class="hero-panel">
    <div>
      <p class="eyebrow">OPEN POST BOARD</p>
      <h1>思いついたことを、その場で気軽に投稿。</h1>
      <p class="lead">
        会員登録してすぐ書き始められる、シンプルな投稿アプリです。
        認証とプロフィール、投稿だけに絞っているので迷わず使えます。
      </p>
      <div class="hero-actions">
        <a class="primary-button" href="#/posts">みんなの投稿を見る</a>
        ${state.session
          ? '<a class="ghost-button hero-link" href="#/dashboard">投稿をはじめる</a>'
          : '<a class="ghost-button hero-link" href="#/signup">会員登録する</a>'}
      </div>
    </div>
    <aside class="info-card">
      <h2>このアプリでできること</h2>
      <ul class="feature-list">
        <li>認証: ${state.session ? "ログイン済み。すぐに投稿できます" : "会員登録してすぐに始められます"}</li>
        <li>データ接続: ${state.mode === "supabase" ? "Supabase" : "Demo LocalStorage"}</li>
        <li>機能: プロフィール管理、投稿一覧、投稿作成・編集・削除</li>
      </ul>
    </aside>
  </section>
`;

const renderLogin = () => `
  <section class="panel narrow-panel">
    <div class="section-heading">
      <p class="eyebrow">LOGIN</p>
      <h1>ログイン</h1>
      <p>登録済みのメールアドレスとパスワードでサインインします。</p>
    </div>
    <form id="login-form" class="stack-form">
      <label>
        <span>メールアドレス</span>
        <input type="email" name="email" required autocomplete="email" placeholder="name@example.com">
      </label>
      <label>
        <span>パスワード</span>
        <input type="password" name="password" required minlength="8" autocomplete="current-password" placeholder="8文字以上">
      </label>
      <button class="primary-button" type="submit">ログイン</button>
    </form>
    ${state.mode === "demo" ? '<p class="helper-text">demo mode では `demo@example.com / password123` で確認できます。</p>' : ""}
  </section>
`;

const renderSignup = () => `
  <section class="panel narrow-panel">
    <div class="section-heading">
      <p class="eyebrow">SIGN UP</p>
      <h1>新規登録</h1>
      <p>会員登録後にプロフィール編集と投稿作成が使えます。</p>
    </div>
    <form id="signup-form" class="stack-form">
      <label>
        <span>表示名</span>
        <input type="text" name="displayName" required maxlength="40" autocomplete="nickname" placeholder="山田 花子">
      </label>
      <label>
        <span>メールアドレス</span>
        <input type="email" name="email" required autocomplete="email" placeholder="name@example.com">
      </label>
      <label>
        <span>パスワード</span>
        <input type="password" name="password" required minlength="8" autocomplete="new-password" placeholder="8文字以上">
      </label>
      <button class="primary-button" type="submit">登録する</button>
    </form>
  </section>
`;

const renderDashboard = () => `
  <section class="panel">
    <div class="section-heading">
      <p class="eyebrow">DASHBOARD</p>
      <h1>${escapeHtml(state.profile?.display_name ?? "会員ダッシュボード")}</h1>
      <p>プロフィール管理と投稿管理の起点画面です。公開設定は投稿ごとに切り替えられます。</p>
    </div>
    <div class="summary-strip">
      <div class="summary-card">
        <span class="summary-label">接続モード</span>
        <strong>${escapeHtml(state.mode)}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">メールアドレス</span>
        <strong>${escapeHtml(state.session?.email ?? "未取得")}</strong>
      </div>
    </div>
    <div class="dashboard-grid">
      <a class="menu-card" href="#/account">
        <h2>プロフィール</h2>
        <p>表示名と自己紹介を更新します。</p>
      </a>
      <a class="menu-card" href="#/my/posts">
        <h2>自分の投稿</h2>
        <p>作成済みの投稿を確認し、編集できます。</p>
      </a>
      <a class="menu-card" href="#/my/posts/new">
        <h2>新規投稿</h2>
        <p>下書きまたは公開投稿を作成します。</p>
      </a>
    </div>
  </section>
`;

const renderAccount = () => `
  <section class="panel narrow-panel">
    <div class="section-heading">
      <p class="eyebrow">ACCOUNT</p>
      <h1>プロフィール</h1>
    </div>
    <form id="account-form" class="stack-form">
      <label>
        <span>表示名</span>
        <input type="text" name="display_name" required maxlength="40" autocomplete="nickname" value="${escapeHtml(state.profile?.display_name ?? "")}">
      </label>
      <label>
        <span>自己紹介</span>
        <textarea name="bio" rows="5" maxlength="300" placeholder="簡単な紹介を入力">${escapeHtml(state.profile?.bio ?? "")}</textarea>
      </label>
      <button class="primary-button" type="submit">保存する</button>
    </form>
  </section>
`;

const renderPostForm = (mode, post = null) => `
  <section class="panel narrow-panel">
    <div class="section-heading">
      <p class="eyebrow">${mode === "new" ? "NEW POST" : "EDIT POST"}</p>
      <h1>${mode === "new" ? "新規投稿" : "投稿編集"}</h1>
    </div>
    <form id="post-form" class="stack-form" data-mode="${mode}" ${post ? `data-post-id="${post.id}"` : ""}>
      <label>
        <span>タイトル</span>
        <input type="text" name="title" required maxlength="120" value="${escapeHtml(post?.title ?? "")}">
      </label>
      <label>
        <span>本文</span>
        <textarea name="body" rows="10" required maxlength="5000">${escapeHtml(post?.body ?? "")}</textarea>
      </label>
      <label>
        <span>状態</span>
        <select name="status">
          <option value="draft" ${post?.status === "draft" || !post ? "selected" : ""}>下書き</option>
          <option value="published" ${post?.status === "published" ? "selected" : ""}>公開中</option>
          <option value="archived" ${post?.status === "archived" ? "selected" : ""}>保管</option>
        </select>
      </label>
      <p class="helper-text form-note">公開中にすると投稿一覧へ表示されます。下書きと保管は本人のみ確認できます。</p>
      <button class="primary-button" type="submit">${mode === "new" ? "投稿を作成" : "更新する"}</button>
    </form>
  </section>
`;

const renderNotFound = () => `
  <section class="panel narrow-panel">
    <div class="section-heading">
      <p class="eyebrow">404</p>
      <h1>ページが見つかりません</h1>
      <p>指定された画面は存在しません。</p>
    </div>
    <a class="primary-button" href="#/">トップへ戻る</a>
  </section>
`;

const renderLoading = () => {
  appRoot.innerHTML = `
    <section class="panel narrow-panel">
      <div class="loading-state">読み込み中...</div>
    </section>
  `;
};

const renderApp = async () => {
  renderTopnav();
  renderNotice();
  const route = parseRoute();

  if (requireAuth(route.name) && !state.session) {
    setNotice("warning", "ログインが必要です。");
    navigateTo("/login");
    return;
  }

  renderLoading();

  try {
    switch (route.name) {
      case "home":
        appRoot.innerHTML = renderHome();
        return;
      case "login":
        appRoot.innerHTML = state.session ? renderDashboard() : renderLogin();
        return;
      case "signup":
        appRoot.innerHTML = state.session ? renderDashboard() : renderSignup();
        return;
      case "dashboard":
        appRoot.innerHTML = renderDashboard();
        return;
      case "account":
        appRoot.innerHTML = renderAccount();
        return;
      case "posts": {
        const posts = await api.listPublishedPosts();
        appRoot.innerHTML = `
          <section class="panel">
            <div class="section-heading section-row">
              <div>
                <p class="eyebrow">POSTS</p>
                <h1>投稿一覧</h1>
              </div>
              ${state.session ? '<a class="primary-button compact-button" href="#/my/posts/new">新規投稿</a>' : ""}
            </div>
            ${renderPostsGrid(posts, "公開中の投稿はまだありません。")}
          </section>
        `;
        return;
      }
      case "post-detail": {
        const post = await api.getPostForView(route.id);
        if (!post) {
          appRoot.innerHTML = renderNotFound();
          return;
        }
        const editable = state.session && post.user_id === state.session.id;
        appRoot.innerHTML = `
          <article class="panel article-panel">
            <div class="status-row">
              <span class="status-pill status-${post.status}">${escapeHtml(getStatusLabel(post.status))}</span>
              <span class="meta-text">更新: ${escapeHtml(formatDateTime(post.updated_at || post.created_at))}</span>
            </div>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="article-body">${nl2br(post.body)}</div>
            <div class="card-actions">
              <a class="text-link" href="#/posts">一覧へ戻る</a>
              ${editable ? `<a class="text-link" href="#/my/posts/${post.id}/edit">編集する</a>` : ""}
              ${editable ? `<button type="button" class="ghost-button danger-button" data-action="delete-post" data-post-id="${post.id}">削除する</button>` : ""}
            </div>
          </article>
        `;
        return;
      }
      case "my-posts": {
        const posts = await api.listMyPosts();
        appRoot.innerHTML = `
          <section class="panel">
            <div class="section-heading section-row">
              <div>
                <p class="eyebrow">MY POSTS</p>
                <h1>自分の投稿</h1>
              </div>
              <a class="primary-button compact-button" href="#/my/posts/new">新規投稿</a>
            </div>
            ${renderPostsGrid(posts, "まだ投稿がありません。最初の投稿を作成してください。", true)}
          </section>
        `;
        return;
      }
      case "post-new":
        appRoot.innerHTML = renderPostForm("new");
        return;
      case "post-edit": {
        const post = await api.getPostForEdit(route.id);
        appRoot.innerHTML = post ? renderPostForm("edit", post) : renderNotFound();
        return;
      }
      default:
        appRoot.innerHTML = renderNotFound();
    }
  } catch (error) {
    appRoot.innerHTML = `
      <section class="panel narrow-panel">
        <div class="error-state">${escapeHtml(error.message || "エラーが発生しました。")}</div>
      </section>
    `;
  }
};

const refreshSession = async () => {
  state.session = await api.getSession();
  state.profile = state.session ? await api.getProfile() : null;
  renderTopnav();
};

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  try {
    if (action === "clear-notice") {
      clearNotice();
      return;
    }

    if (action === "logout") {
      await api.signOut();
      await refreshSession();
      setNotice("success", "ログアウトしました。");
      navigateTo("/");
      return;
    }

    if (action === "delete-post") {
      const postId = event.target.closest("[data-post-id]")?.dataset.postId;
      if (!postId) return;
      if (!window.confirm("この投稿を削除しますか？")) return;
      await api.deletePost(postId);
      setNotice("success", "投稿を削除しました。");
      navigateTo("/my/posts");
    }
  } catch (error) {
    setNotice("error", error.message || "処理に失敗しました。");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();

  const formData = new FormData(form);
  setFormBusy(form, true);

  try {
    if (form.id === "login-form") {
      const email = normalizeEmail(formData.get("email"));
      const password = String(formData.get("password") || "");
      if (!email) {
        throw new Error("メールアドレスを入力してください。");
      }
      if (!password) {
        throw new Error("パスワードを入力してください。");
      }
      await api.signIn({
        email,
        password,
      });
      await refreshSession();
      setNotice("success", "ログインしました。");
      navigateTo("/dashboard");
      return;
    }

    if (form.id === "signup-form") {
      const displayName = String(formData.get("displayName") || "").trim();
      const email = normalizeEmail(formData.get("email"));
      const password = String(formData.get("password") || "");
      validateProfileInput({ display_name: displayName, bio: "" });
      if (!email) {
        throw new Error("メールアドレスを入力してください。");
      }
      if (password.length < 8) {
        throw new Error("パスワードは 8 文字以上で入力してください。");
      }
      await api.signUp({
        displayName,
        email,
        password,
      });
      await refreshSession();
      if (state.session) {
        setNotice("success", "会員登録が完了しました。");
        navigateTo("/dashboard");
      } else {
        setNotice("success", "登録処理を開始しました。メール確認が必要な場合があります。");
        navigateTo("/login");
      }
      return;
    }

    if (form.id === "account-form") {
      const payload = {
        display_name: String(formData.get("display_name") || "").trim(),
        bio: normalizeNewLines(formData.get("bio")),
      };
      validateProfileInput(payload);
      state.profile = await api.updateProfile({
        ...payload,
      });
      setNotice("success", "プロフィールを更新しました。");
      renderApp();
      return;
    }

    if (form.id === "post-form") {
      const payload = {
        title: String(formData.get("title") || "").trim(),
        body: normalizeNewLines(formData.get("body")),
        status: String(formData.get("status") || "draft"),
      };
      validatePostInput(payload);
      if (form.dataset.mode === "edit") {
        await api.updatePost(form.dataset.postId, payload);
        setNotice("success", "投稿を更新しました。");
      } else {
        await api.createPost(payload);
        setNotice("success", "投稿を作成しました。");
      }
      navigateTo("/my/posts");
    }
  } catch (error) {
    setNotice("error", toFriendlyError(error));
  } finally {
    setFormBusy(form, false);
  }
});

window.addEventListener("hashchange", () => {
  renderApp();
});

const bootstrap = async () => {
  await api.init();
  await refreshSession();
  renderApp();
};

bootstrap().catch((error) => {
  setNotice("error", toFriendlyError(error));
  renderApp();
});

(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const hasConfig = window.SUPABASE_URL &&
    window.SUPABASE_PUBLISHABLE_KEY &&
    window.SUPABASE_URL.startsWith("https://") &&
    !window.SUPABASE_URL.includes("ここに") &&
    !window.SUPABASE_PUBLISHABLE_KEY.includes("ここに");

  let client = null;
  let currentUser = null;
  let quotes = [];
  let editingId = null;

  function status(id, message, isError = false) {
    const node = $(id);
    node.textContent = message;
    node.style.color = isError ? "#a04f62" : "#656b7b";
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function render() {
    const term = $("search-input").value.trim().toLocaleLowerCase();
    const filtered = quotes.filter((q) =>
      [q.title, q.quote, q.detail].join(" ").toLocaleLowerCase().includes(term)
    );
    $("result-count").textContent = `${filtered.length}件`;
    const list = $("quote-list");
    list.replaceChildren();

    if (!filtered.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = term
        ? "該当する語録はありません。別のキーワードで検索してみてね。"
        : "まだ語録がありません。管理者が投稿すると、ここに表示されます。";
      list.append(p);
      return;
    }

    filtered.forEach((q) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "覚え違い";
      card.append(tag);

      const title = document.createElement("h3");
      title.className = "quote-title";
      title.textContent = escapeText(q.title);
      card.append(title);

      const quote = document.createElement("p");
      quote.className = "quote-text";
      quote.textContent = `「${escapeText(q.quote)}」`;
      card.append(quote);

      if (q.detail) {
        const detail = document.createElement("p");
        detail.className = "quote-detail";
        detail.textContent = escapeText(q.detail);
        card.append(detail);
      }

      if (currentUser) {
        const actions = document.createElement("div");
        actions.className = "card-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "button secondary";
        edit.textContent = "編集";
        edit.addEventListener("click", () => beginEdit(q));
        actions.append(edit);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "button secondary";
        remove.textContent = "削除";
        remove.addEventListener("click", () => deleteQuote(q));
        actions.append(remove);
        card.append(actions);
      }
      list.append(card);
    });
  }

  async function loadQuotes() {
    if (!client) return;
    $("quote-list").replaceChildren();
    const loading = document.createElement("p");
    loading.className = "empty";
    loading.textContent = "語録を読み込んでいます…";
    $("quote-list").append(loading);

    const { data, error } = await client
      .from("quotes")
      .select("id,title,quote,detail,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      $("result-count").textContent = "—";
      $("quote-list").replaceChildren();
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "語録を読み込めませんでした。Supabaseの設定とRLSポリシーを確認してください。";
      $("quote-list").append(p);
      status("public-status", `読み込みエラー：${error.message}`, true);
      return;
    }
    quotes = data || [];
    status("public-status", "");
    render();
  }

  function beginEdit(q) {
    editingId = q.id;
    $("quote-id").value = q.id;
    $("quote-title").value = q.title || "";
    $("quote-text").value = q.quote || "";
    $("quote-detail").value = q.detail || "";
    $("form-heading").textContent = "覚え違いを編集";
    $("save-button").textContent = "変更を保存";
    $("cancel-edit").classList.remove("hidden");
    $("quote-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function resetEditor() {
    editingId = null;
    $("quote-form").reset();
    $("quote-id").value = "";
    $("form-heading").textContent = "新しい覚え違いを追加";
    $("save-button").textContent = "語録を追加";
    $("cancel-edit").classList.add("hidden");
  }

  async function deleteQuote(q) {
    if (!window.confirm(`「${q.title}」を削除しますか？この操作は元に戻せません。`)) return;
    const { error } = await client.from("quotes").delete().eq("id", q.id);
    if (error) {
      status("editor-status", `削除できませんでした：${error.message}`, true);
      return;
    }
    status("editor-status", "削除しました。");
    await loadQuotes();
  }

  function showAdmin(isLoggedIn) {
    $("admin-login-box").classList.toggle("hidden", isLoggedIn);
    $("admin-editor").classList.toggle("hidden", !isLoggedIn);
  }

  async function refreshSession() {
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    showAdmin(Boolean(currentUser));
    render();
  }

  async function init() {
    $("search-input").addEventListener("input", render);
    $("cancel-edit").addEventListener("click", resetEditor);

    if (!hasConfig || !window.supabase?.createClient) {
      $("result-count").textContent = "未設定";
      $("quote-list").replaceChildren();
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "公開準備中です。管理者がSupabaseの接続設定を完了すると、語録が表示されます。";
      $("quote-list").append(p);
      status("public-status", "最初にREADME.mdの手順に沿ってSupabaseを設定してください。");
      $("login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        status("login-status", "まだSupabaseの接続設定が完了していません。README.mdを確認してください。", true);
      });
      return;
    }

    client = window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_PUBLISHABLE_KEY
    );

    $("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      status("login-status", "ログインしています…");
      const email = $("admin-email").value.trim();
      const password = $("admin-password").value;
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        status("login-status", "ログインできませんでした。メールアドレス・パスワードと、Supabaseの認証設定を確認してください。", true);
        return;
      }
      currentUser = data.user;
      showAdmin(true);
      $("admin-password").value = "";
      status("login-status", "");
      status("editor-status", "管理者としてログインしました。");
      render();
    });

    $("logout-button").addEventListener("click", async () => {
      await client.auth.signOut();
      currentUser = null;
      resetEditor();
      showAdmin(false);
      status("login-status", "ログアウトしました。");
      await loadQuotes();
    });

    $("quote-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUser) {
        status("editor-status", "投稿するには管理者ログインが必要です。", true);
        return;
      }
      const payload = {
        title: $("quote-title").value.trim(),
        quote: $("quote-text").value.trim(),
        detail: $("quote-detail").value.trim() || null
      };
      if (!payload.title || !payload.quote) {
        status("editor-status", "タイトルと覚え違いの内容を入力してください。", true);
        return;
      }

      $("save-button").disabled = true;
      status("editor-status", "保存しています…");
      let result;
      if (editingId) {
        result = await client.from("quotes").update(payload).eq("id", editingId);
      } else {
        result = await client.from("quotes").insert(payload);
      }
      $("save-button").disabled = false;

      if (result.error) {
        status("editor-status", `保存できませんでした。管理者UUIDとRLS設定を確認してください。詳細：${result.error.message}`, true);
        return;
      }
      resetEditor();
      status("editor-status", "保存しました！");
      await loadQuotes();
    });

    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      showAdmin(Boolean(currentUser));
      render();
    });

    await refreshSession();
    await loadQuotes();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

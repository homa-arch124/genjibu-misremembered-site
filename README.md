# 原因は自分にある。覚え違い集 — 公開サイト設定ガイド

このフォルダには、スマホ対応の公開ページ、管理者ログイン、語録の追加・編集・削除、SupabaseのRLS設定SQLが入っています。

## ファイル一覧

- `index.html` — サイト本体
- `style.css` — PC・スマホ対応デザイン
- `app.js` — 検索、一覧表示、管理者ログイン、投稿・編集・削除
- `config.js` — Supabaseの接続先設定
- `schema.sql` — 語録テーブルとアクセス権限の設定
- `README.md` — この説明書

## 重要な安全ルール

- `config.js` には Supabase の Project URL と Publishable key（または旧 anon key）だけを設定します。
- `service_role` キーや Secret key は絶対に `config.js` やGitHubに載せないでください。
- `schema.sql` の `YOUR_ADMIN_USER_UUID` は、実際の管理者UIDに置き換えてから実行してください。
- 公開前にテスト用の一般ユーザーで、追加・編集・削除が拒否されることを確認してください。

---

## 1. GitHubアカウントを作成

1. https://github.com/ を開いてアカウントを作成します。
2. ログイン後、`genjibu-misremembered` という名前で新しいリポジトリを作成します。
3. 公開リポジトリにします（サイトのHTML/CSS/JSは公開されるため、秘密情報を入れないでください）。

## 2. Supabaseプロジェクトを作成

1. https://supabase.com/ を開き、アカウントを作成します。
2. 新しいプロジェクトを作成します。データベース用パスワードは安全な場所に保管してください。
3. プロジェクトの設定から Project URL と Publishable key（または旧 anon key）を確認します。
4. `config.js` の2か所を実際の値に置き換えます。

例（値は例なので、そのまま使わないでください）：

```js
window.SUPABASE_URL = "https://your-project.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
```

## 3. 管理者アカウントを作成

1. Supabaseの Authentication を開き、Users から管理者ユーザーを追加します。
2. 管理者用のメールアドレスと強いパスワードを設定します。
3. Users一覧で、そのユーザーの `User UID`（UUID）をコピーします。
4. このサイトの管理者アカウントを他人に共有しないでください。必要がなければ公開サインアップは有効にしないでください。

## 4. データベースとアクセス権限を設定

1. Supabaseの SQL Editor を開きます。
2. `schema.sql` の内容を貼り付けます。
3. SQL内にある `YOUR_ADMIN_USER_UUID` を、手順3でコピーした実際の管理者UIDに置き換えます。4つのポリシーで同じUIDを使用してください。
4. SQLを実行します。

このSQLでは、一般の訪問者は語録を読むことができ、ログインしていても管理者UIDと一致しないユーザーは追加・編集・削除できません。

## 5. GitHub Pagesで公開

1. GitHubリポジトリを開き、`Add file` → `Upload files` を選びます。
2. `index.html`、`style.css`、`app.js`、`config.js` をアップロードしてコミットします。
3. `schema.sql` と `README.md` も保管しておく場合はアップロードできます。これらは公開リポジトリに置いても管理者UIDなどの実値や秘密鍵が入っていないことを確認してください。
4. リポジトリの `Settings` → `Pages` を開きます。
5. `Deploy from a branch`、Branch=`main`、Folder=`/(root)` を選んで保存します。
6. 表示された `https://<ユーザー名>.github.io/genjibu-misremembered/` のURLを開きます。公開反映に数分かかる場合があります。

## 6. 動作確認

- ログアウト状態で、語録の閲覧とキーワード検索ができる。
- 管理者のメールアドレスとパスワードでログインできる。
- 管理者が語録を追加・編集・削除できる。
- ログアウトすると投稿フォームが使えなくなる。
- 別の一般ユーザーでログインしても、データベース側で書き込みが拒否される。

## 7. 注意点

- GitHub Pagesは静的サイトのホスティングです。データ保存と認証はSupabaseが担当します。
- `config.js` のPublishable keyはブラウザで見える前提です。データ保護はRLSポリシーで行います。
- 管理者のUIDを変更したら、SQLポリシーも更新してください。
- 無関係な投稿や権利侵害のある投稿を避けるため、管理者が掲載内容を確認してください。
- ファンによる非公式サイトであることを明記し、公式サイトと誤認されるロゴや画像の無断使用は避けてください。

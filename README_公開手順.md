# 道の途中。新PWA / GitHub公開用 (1.5.43)

## このファイルの位置づけ
- **移植元の原本:** `道の途中_ローカルWeb_復元版(3).zip` の `site/` （PWA 1.5.42-dev4 / DB 2.8.23）。
- **この配布物:** 2026-11-19作成の **PWA 1.5.43（公開候補）**。現行ローカル版の画面やDBを維持し、公開とキャッシュの設定のみ調整。
- 道の駅1,234件・その他スポット3,763件。全国イベント自動収集・新しい観光ルート共有などは**追加していません**。
- **GitHub Pagesでの動作やAndroid/iOSへのインストールは未検証**。公開してから実機確認が必要です。

## 新リポジトリを作って公開する手順
1. GitHubで `Penta2026/michinotochu` などの**新しい空のPublicリポジトリ**を作成（既存のREADME/ライセンスは自動作成しない）。この段階では旧PWAとデバッグ版は削除しない。
2. このZIPを**すべて展開**。`index.html` がフォルダ直下にあることを確認。
3. WindowsにGit for Windowsをインストールし、必要なら `git config --global user.name` / `user.email` を設定。
4. ZIPを展開したフォルダでPowerShellを開き、以下を実行（リポジトリ名は作成したものに合わせる）。

```powershell
powershell -ExecutionPolicy Bypass -File .\GitHubへ公開.ps1 -RepositoryUrl https://github.com/Penta2026/michinotochu.git
```

5. GitHubのリポジトリ `Settings → Pages → Build and deployment` で `Deploy from a branch`、`main`、`/(root)` を選んで保存。
6. 公開URLの例: `https://penta2026.github.io/michinotochu/`。これは実際に公開できるまで**未確認の例示URL**です。
7. PC Chrome/Edge、Android Chrome、iPhone Safariで画面・インストール・DB件数・お気に入り/履歴・GPX出力を確認。
8. オフライン時は同梱DBと読み込み済みの画面を確認。Google MapsやURL解決の外部サービスはネット接続が必要。
9. **旧2リポジトリの扱いは新PWAの動作を確認した後に。** 必ずZIPをローカル保存し、Actionsの定期実行設定がないか点検。まずArchive（読み取り専用）も選択可能。削除するならそれぞれ `Settings → General → Danger Zone → Delete this repository` から操作する。削除は復元できない可能性があるので、公開URL移行とデータ退避を確認する。

## 注意：端末の保存データ
お気に入りと旅の履歴はブラウザの保存領域にある。新しいGitHubリポジトリのURLは**以前の公開URLやローカルURLと異なるため自動移行できない**。古いアプリの保存データを残すなら、古いURL・ブラウザの保存領域を消さないこと。再インストールやサイトデータ消去でも失われる場合がある。

## 改修した箇所
- 旧ローカル版の `site/` をサイトのルートに整理。古い開発用バッチ・資料・DB_MASTERは公開用ZIPから除外。
- 版数表示を 1.5.43 に統一、DBは2.8.23のまま。
- localhostでのPWAプレビューを許可。元のローカル開発版とは**違うポート**でテストする（推奨 8766）。
- Service Workerを独立したキャッシュ名に変更。旧リポジトリのキャッシュを消さない構成にし、必要なJavaScriptとDBが取得できないときはSWを有効化しない。
- 古い日付の `PRODUCTION_RELEASE` や開発マーカーは配布物から除外。

## プレビュー
Pythonがインストール済みなら解凍フォルダで `python -m http.server 8766 --bind 127.0.0.1` を実行し、`http://127.0.0.1:8766/` を開く。ブラウザのアプリインストール・オフライン動作はPC実機側で確認すること。

## 未解決の外部依存
元のローカルアプリにはGoogle Mapsや既存Cloudflare Worker、問い合わせ送信サービスなどへの参照が残る。公開前にそれぞれの動作、プライバシー表記、制限・費用と継続運用を確認してほしい。新しいサーバーやイベント自動巡回は追加していない。

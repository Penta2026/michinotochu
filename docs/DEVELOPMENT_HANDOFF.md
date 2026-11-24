# 道の途中。推定走行距離 開発引継ぎ
更新: 2026-11-24 / 工程7.6（公開準備）
## 正本と公開方針
- 本番 main: 7468c1d66e403d648fdd347f4f3e6de7f4d6e03a（今回の開発開始時点）。開発: land-engine-stage2。公開前に main の現状と差分を再確認。
- B_Navi (Penta2026/b_navi) は mixed-v3 安定版を維持。本件では変更しない。
- 仕様: 指定走行距離（片道・全経由地込み）のみ。排気量50/51–125/126以上。海越えは通行可能な登録済み接続かつ予算内なら自動許可、フェリーなし。直線距離モードへ黙って戻さない。既存のGPX・お気に入り・履歴維持。
## 進捗
1 陸地データ取得済み。2 判定エンジン実装。3 4997件中4782件確定、215件保留（境界1、未分類214）。4 接続スキーマと原付しまなみ6橋、全国11候補登録。尾道大橋本州接続、126cc以上、全国主要橋の実道路端点・区間長・車種条件は未完了。
5 距離エンジン実装、係数1.45は暫定。広島発80km→報告176kmの旅程、直線合計73.2km、仮接続参考169.1km。正式全区間推定は接続不足でnull。距離超過による除外の検証は未完了。
6 すごろくUIを指定走行距離＋排気量に一本化。7.1 地域別自動読込とSW追加。7.2 ローカルで元ZIPから地域分割・検証済み。GitHub生成済みデータの登録は未確認。7.3 接続補完、7.4 実旅程・全国抽選検証、7.5 ブラウザ・既存機能回帰、7.6 main公開、8 他ガチャ、9 更新自動化の完結は未完了。
## 工程7.2 実測
ユーザー提供 japan-land-candidate.zip の中身を直接展開。GeoJSON SHA256 26247077ca32466ab1a687aad76c963b5f9f340da2197bb7d6e1cf9a512671b0 がsidecar metadataと一致。元OSM ZIP SHA256 bf79eb76278f0ae8e6b45885065b1f7ad702a08df6957d6e423972260d5e9820。80064 features。Shapely 2.1.2 で元データの確定4782件・橋12端点を照合、不一致0。固定ID別名を適用して1度格子（pad 0.0002度）へ分割。253タイル、合計102228671 bytes、中央値100455 bytes、最大4212904 bytes、広島132_34は1644601 bytes、spots.json 221315 bytes。確定4782件を各タイルで再照合、不一致0。ローカル検証スクリプトが結果を出力後に実行タイムアウトとなったため、GitHub本番生成ジョブの正常終了とは扱わない。
GitHub data/land-runtime/{manifest,spots,connections,132_34}.json は確認時404。Actions Prepare runtime land data の実行ログは未確認。生成処理・検証を再実行し、実ファイルを確認するまで公開不可。
## 重要な制約
- タイル分割は全容量の削減ではなく1回の取得量を削減するもの。
- 未確定陸地は最寄り島に割り当てない。未登録接続は除外。現状は全国の海越えを網羅しない。同一陸地でも山・湾の迂回を保証しない。
- 出典 OSM land polygons / © OpenStreetMap contributors, ODbL。公開前に出典表示と派生DBの提供条件を確認。
- データ生成ツール tools/build-japan-land.py, tools/build-land-sidecar.cjs, tools/build-land-runtime.py。Actions build-land-candidate.yml, prepare-land-runtime.yml。関連仕様 docs/LAND_*.md, docs/SUGOROKU_STAGE6.md。
- 次回はこの文書と現在のブランチを照合し、実行結果を更新する。再アップロードや再ダウンロードは必要な場合だけ。

## 工程7.3 更新
- GitHub上の data/land-runtime/manifest.json と connections.json の実ファイル取得成功。manifest snapshot 785a6f455ed83727c8f6c6837241f0ee28bc7e1b3cb571d510fed7c09d60c0fc、4997件、固定IDの原付6橋を確認。元ZIPとは別スナップショット。全タイルとspotsの再検証は未実施。
- 尾道大橋は国道317号の一般道路で、県の道路資料で本州～向島接続を確認。https://www.pref.hiroshima.lg.jp/uploaded/attachment/520579.pdf 。直接OSM API取得はDNSエラー。道路端点・区間長は未確定。
- tools/inspect-onomichi.py と .github/workflows/inspect-onomichi.yml を追加。OSM APIの小範囲XMLからR317橋候補、道路ノード列、端点の実陸地照合、距離・タグ・way IDを出力。候補のみ、通行制限・一方通行・道路連続性を人または追加検証で確定するまで有効化禁止。Actions起動・成功未確認。成果物 onomichi-road-evidence を確認すること。
- 次: 尾道大橋候補の確認・正式接続登録、瀬戸大橋/明石・鳴門/関門/江田島/安芸灘/126ccしまなみの接続補完。未確認接続は除外。main/B_Navi未変更。

## 工程7.3 追加確認
- inspect-onomichi の起動コミット 90b3ba5f6ab8b54847aaafd5d120b2e0a9cc7dfb。利用可能な commit workflow 検索はPR起動のみ対象で、今回のpush起動結果は取得不能。run ID があれば成果物・ジョブログ取得可能。実行成功・候補生成未確認。再実行不要、既存runを確認する。
- 次回: Actions の Inspect Onomichi R317 connection の run URL から run ID を取得し、onomichi-road-evidence の候補を確認。正式登録は道路連続性・方向・車種制限・同一ポリゴンスナップショットの照合後。地域データの再取得不要。main/B_Navi未変更。

## 工程7.3 尾道大橋登録
- Actions run 45340313330 / artifact 14894739988 を取得。ジョブ成功だが候補0件。原因は抽出器の highway=trunk 除外。実XMLで OSM way 90964667 (国道317号・尾道大橋、trunk、2車線、oneway指定なし) を確認。実道路3ノード、両端をGitHubの133_34タイルで照合。本州→向島、中心線長0.388km。全車種の推定用接続として登録。実走ルートの保証ではない。
- source DB、runtime DB、全国候補、抽出器、回帰試験更新。既知の実座標と陸地IDの対応表を用いた距離エンジン試験で旧GPX推定182.258km、80km超過。全GeoJSONによる回帰試験は未実行。126ccしまなみ高速・他全国接続未完了。main/B_Navi未変更。

## 工程7.5 部分回帰試験
実runtimeデータを模擬fetchで読み込み、広島起点、RS形式ID1233件、3車種×30/80/150kmの9条件正常。うち3条件候補なし、6条件予算内・GPX生成確認。RS形式以外の道の駅ID1件は要確認。変更前app.jsはmainとrunSugoroku以外一致。非同期リセット対策追加・構文確認。詳細 docs/STAGE75_REGRESSION.md。実ブラウザ・SW・保存・B_Navi実機受信・寄り道・全国橋補完は未検証。main/B_Navi未変更。

## 工程7.5 ブラウザ試験準備
旧直線距離説明を経由地込み推定に修正。tests/stage75-browser.spec.cjs と .github/workflows/stage75-browser.yml を追加。Chromiumで実データ抽選、GPXダウンロード、クリップボード連携、お気に入り保存・再読込、寄り道、リセット、SWキャッシュ・オフラインを検証する。起動コミット d884e5560978675f50a6217df270ca30fdcaff0c。実行結果未確認。Actionsの Stage 7.5 browser regression のrun IDを取得して結果確認。B_Navi実機受信、全国橋補完は別途必要。main未変更。

## 工程7.5 ブラウザ試験環境の修正
- run 45341752070 / job 138266793948 は失敗。ubuntu-latest が Ubuntu 26.04.1 を選択し、Playwright 1.56.1 の Chromium 依存関係インストールが非対応。アプリのブラウザ試験は開始されていない。
- stage75-browser.yml の runner を ubuntu-24.04 に固定。修正コミット 79f3cf8fe8ec071d9a3d78a01350250eb1315955。新規push起動のrunを確認すること（旧runの再実行では旧設定が使われる）。main/B_Navi未変更。実ブラウザ試験結果は未確定。


## 工程7.5 Chromium回帰試験 成功（2026-11-24）
- GitHub Actions run 45341989439 / job 138267574666、Ubuntu 24.04、conclusion success。ログで sugoroku browser regression (2.0s) と service worker and cached regional data (1.2s)、2 passed (5.5s) を確認。
- 実ブラウザで80km以内の抽選、最大6駅、GPXダウンロードと地点数・マーカー、B_Navi用クリップボードのGPX一致、お気に入り保存・再読み込み保持、寄り道画面遷移、結果リセット、SW起動・広島タイルキャッシュ・オフライン再抽選に合格。
- 7.5のChromium自動試験は合格。B_Navi実機での受信・ルーティング、他端末、旧版からのSW更新、全国橋接続補完と全国距離検証は未完了。main/B_Naviは変更しない。7.6公開前に残課題を確認する。
- 実行URL: https://github.com/Penta2026/michinotochu/actions/runs/45341989439

## 工程7.6 公開準備
mainとの差分確認時59コミット先行、遅れ0、288ファイル。PWA/DB表示2、SWキャッシュ2、更新時のworker有効化待ち、旧保存キー維持、未登録接続除外の注記、OSM attributionとODbL README、更新履歴候補を追加。新規 Stage 7.6 release upgrade gate で旧mainを同一originに配信し保存→v2差替→SW更新→保存保持→抽選を試験、7.5も再実行する。結果未確認。全国主要橋・全国検証・B_Navi実機受信は未完了。mainは更新せず公開ゲート確認後に判断。

## 工程7.6 更新試験合格（2026-11-24）
- Actions run 45343700510 / job 138273084830: success。Chromium 3 passed (10.2s)。すごろく回帰2.7s、SW・オフライン2.0s、旧版からの更新4.2s。artifact stage76-release-report ID 14896379660。
- 同一originで旧main Ver1からVer2に更新し、お気に入りJSONの完全一致、旧キャッシュ削除、新キャッシュ生成、PWA 2 / DB 2表示、更新後抽選を確認。
- 公開候補の自動試験ゲート合格。全国主要橋の残り、全国距離検証、B_Navi実機受信、旅の履歴個別試験は未完了。main/B_Naviは今回変更しない。部分対応の公開可否を判断してからmainへ反映する。
- 実行URL https://github.com/Penta2026/michinotochu/actions/runs/45343700510

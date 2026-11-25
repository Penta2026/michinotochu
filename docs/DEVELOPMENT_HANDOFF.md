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

## 工程7.6 本番反映対象（2026-11-24）
ユーザー指示により部分対応Ver2を公開する方針。試験済みSHA 6fb4bfc7a4ad07a9798ddd4b2e7848eba886a1b7 からの変更は引継ぎ記録、version.jsonの2/2整合、更新履歴日付のみ。旧main 7468c1d66e403d648fdd347f4f3e6de7f4d6e03a を復旧基準として保存。全国橋・全国検証・実機受信・履歴個別試験は残る。未登録接続は除外、推定距離は実走保証なし。B_Navi変更なし。公開配信確認はmain反映後に実施。

## 工程8.1 行先ガチャ
本番Ver2 SHA 43d4ef2cc745bf3e2348180ecc8addb5d49d10da から distance-stage8 を作成。distance-gacha.js 共通距離帯抽出、行先ガチャ3車種、既存テーマ・許容幅・GPX・保存維持。独立カフェDB等の未収録座標は必要タイルを追加読込し厳密陸地判定。境界70/90km含む・帯外・未接続島除外の合成試験成功、構文検査済み。全実データ試験はツール時間切れ。Chromium回帰 workflow Stage 8.1 destination regression を追加、結果未確認。main/B_Navi未変更。次は8.2今日の走り方、8.3季節を走る。全国橋補完も残る。

## 工程8.1 合格・8.2 実装
8.1 Actions run 45346364361 / job 138281782599 success、3 passed (8.3s) をログ確認。8.2 今日の走り方は現行の単一目的地抽選、距離帯・気分・サブジャンル・方角±30°を維持し、共通DistanceGacha.bandと車種別陸地接続に移行。Google Maps外部検索は従来の地理的中心で道路距離・通行可否未確認を明記。GPX・保存維持。非同期競合対策、構文検査済み。Stage 8.2 ride style regression を追加、実行結果未確認。main/B_Navi未変更。次は8.3季節を走る。

## 工程8.2 報告・8.3 季節を走る
8.2はユーザーよりActionsグリーン報告（run ID未取得、ログ未確認）。8.3は季節自動/春夏秋冬、ランドマーク分類、近い順最大12件を維持し、排気量別の推定走行距離上限へ変更。旧仕様の圏外候補自動補充を廃止、未接続島を除外。共通DistanceGacha.within追加、上限境界・null除外の合成試験と構文検査成功。Stage 8.3 seasonal regressionで8.1/8.2/すごろくも再検証する。実行結果未確認。ユーザー希望により3機能揃えてから本番反映。main/B_Navi未変更。

## 工程8.4〜8.6 公開候補
8.3はユーザーからグリーン報告。共通LandDistance、SugorokuLandUI、DistanceGacha.band/withinを4機能で利用。PWA3、DB2（地理DB未変更）、キャッシュ更新、ホーム旧バージョン表記修正。Ver2からの更新・お気に入り保持・4機能の総合回帰試験を1 workflowに集約。main/B_Naviは試験合格まで維持。全国橋補完は別工程。

## 工程8.5 合格・8.6 本番反映対象
2026-11-24 Actions run 45347935336 / job 138286932987、試験済みSHA 9b3a37ddf49a1537c8b73f07144afb65511933fc、6 passed (18.1s)。4機能、SWオフライン、Ver2→Ver3お気に入り保持合格。旧main 43d4ef2cc745bf3e2348180ecc8addb5d49d10da を復旧基準とする。PWA3/DB2、B_Navi変更なし。全国橋補完・距離精度検証・工程9は残る。配信確認は別途。https://github.com/Penta2026/michinotochu/actions/runs/45347935336

## Ver4 抽選演出（2026-11-25）
Ver3 main 05fe09197d73649acc5be547184491e0843c1b8c から gacha-animation-v4 を作成。CSS 3Dサイコロとカプセル機をローカルで描画、無音・外部素材なし。既存抽選で有効な候補を確定してから演出し、サイコロの出目は既存requestedCount（ランダム1〜6、固定時は指定値）と一致。実駅数は距離内で不足時減少。候補なしは演出なし、再抽選・リセット後の旧結果はrequest IDで破棄。prefers-reduced-motion対応。PWA4/DB2、SW資源登録、更新履歴。既存5試験＋Ver3→4更新＋演出試験を1回のActionsに集約。試験結果未確認。本番/B_Naviは変更しない。

## Ver4 公開反映対象（2026-11-25）
ユーザー提示のActions一覧スクリーンショットで Ver4 draw animation release gate #1、commit 4b052e6、gacha-animation-v4、緑チェック、1m46s を確認。run ID・個別テストログは未確認。公開対象SHA 4b052e63428132cf6239cf99a647b9e23ba5f04e、旧main 05fe09197d73649acc5be547184491e0843c1b8c を復旧基準とする。PWA4/DB2、B_Navi未変更。GitHub Pages配信と実機の演出表示は別途確認。

## Ver5 抽選停止対策（2026-11-25）
ユーザー報告: Ver4で開始を押しても「条件を設定してください」のまま。実機の原因未特定。コード上の未捕捉演出例外を確認、演出欠落・reject・2.8秒超の停止から復帰する共通ヘルパー、すごろく開始直後の候補確認表示、外側例外表示を追加。元抽選ロジック維持。実関数の模擬DOM/エンジン試験でmissing/reject/hangの3件合格。PWA5/DB2、Ver4→5移行と既存試験＋故障注入のActionsを1回に集約。mainは試験待ち。旧main b2844ceaa65beb8115c11b75f109c0953f76c4ad を復旧基準とする。B_Navi未変更。

## Ver5 追加：行先ガチャの候補確認停止
ユーザー報告で行先ガチャも候補確認中のまま停止。共通陸地ローダーのfetch/JSONに時間制限がなかったことを確認（実機原因未確定）。各ファイル12秒の期限、AbortControllerとPromise.race、既存の失敗時promise削除により再試行可能。行先ガチャの外側例外表示と計算段階表示を追加。manifest・地域タイルを意図的に停止させ、エラー表示と復帰を試すChromium試験追加。Ver5の同じgateで再検証、旧run合格では公開しない。距離条件・DB・B_Navi未変更。

## Ver5 設定画面の簡素化（2026-11-25）
ユーザー指定のすごろく・行先ガチャ・今日の走り方・季節を走るの設定画面の注意書き4ブロックを完全削除。結果画面の推定距離・注意表示、抽選ロジック、地理DBは変更なし。最新Ver5の回帰試験で確認し、合格後に公開する。

## Ver5 ホーム画面の簡素化（2026-11-25）
ユーザー指示によりホーム上部の重複バージョン表記 PWA Ver5 を削除。下部のfooterVersion（実PWA/DB表示）は維持。回帰試験に追加。最新コミット合格後に公開。

## Ver5 公開反映対象（2026-11-25）
ユーザーより最新の Ver5: remove redundant home version label / Ver5 draw reliability gate がグリーンになった旨の報告あり。run ID・詳細ログは未取得。候補ブランチ gacha-reliability-v5 と公開対象SHA 2caa1d5e35c6bef87c67a4b6491913bb3b34c195 の一致、旧main b2844ceaa65beb8115c11b75f109c0953f76c4ad からの差分を照合。旧mainを復旧基準とする。PWA5/DB2、B_Navi・地理DB・距離計算エンジン変更なし。GitHub Pages配信と実機での抽選停止解消は別途確認。

## Ver6 任意ナビミッション（2026-11-25）
ユーザー指定の追加ミッションをすごろく・行先ガチャの正常抽選結果に各1件、ナビ使用可40%（乱数0〜0.4未満）、レーダー使用40%（0.4〜0.8未満）、ナビなし20%（0.8以上）で表示。既存すごろくミッションのオンオフとは独立。画面表示のみ（音声なし）、安全優先で任意解除、B_Navi操作・GPX変更なし。お気に入りの任意フィールドnavigationMissionにIDを保存、過去データには非表示。PWA6/DB2、旧main 95c18a6df55da4300ec0763139634c15a97f5357 を復旧基準とする。境界・分布・両機能・GPX・保存と旧回帰の一括Actions、実機とActions未確認。main/B_Navi未変更。

## Ver6 公開反映対象（2026-11-25）
ユーザーより Ver6 navigation mission gate がグリーンとの報告あり。run ID・詳細ログは未取得。候補ブランチ navigation-mission-v6 と公開対象SHA 4cb29fec20211e2874e18fae6bdcb14882cda210 の一致、旧main 95c18a6df55da4300ec0763139634c15a97f5357 からの差分を照合。旧mainを復旧基準とする。PWA6/DB2、B_Navi・地理DB・距離計算エンジン変更なし。GitHub Pages配信と実機の追加ミッション表示は別途確認。

## Ver7 今の目的地（2026-11-25）
旧濃緑topbar（Ver1固定表記含む）を削除し、全画面共通のコンパクトな折りたたみ目的地欄に変更。すごろく/行先ガチャの正常結果だけを自動保存、複数駅は最初の経由地から手動で到着・次へ、クリア/旅終了は確認あり。目的地名・登録address・追加ミッションを端末localStorageの新キーに保持、住所未収録は都道府県市町村＋詳細住所未登録、外部逆ジオコーディングなし。失敗や結果リセットで既存の旅を消さない。新規成功抽選で上書き。GPX/B_Navi/地理DB/距離計算変更なし。PWA7/DB2。住所DB本体は取得制限により全件収録率未確認。モバイル幅・表示/保存/手動進行/置換・既存回帰を一括Actions、実機未確認。旧main ec698becbd878be54172c5bcb0d058d2167fbe6e を復旧基準とする。

## Ver7 公開反映対象（2026-11-25）
ユーザーより Ver7 current destination gate がグリーンとの報告あり。run ID・詳細ログは未取得。候補ブランチ current-destination-v7 と公開対象SHA 1b6e91a2cb78a0e31c071de07506ae24575e39c3 の一致、旧main ec698becbd878be54172c5bcb0d058d2167fbe6e からの差分を照合。旧mainを復旧基準とする。PWA7/DB2、B_Navi・地理DB・距離計算エンジン変更なし。GitHub Pages配信と実機の目的地欄・表示高さ・保存動作は別途確認。

## Ver8 更新整合性対策（2026-11-25）
ユーザー報告: Ver7で上部目的地と追加ミッションが反映されない。mainの両機能実装は確認済み。旧SWがナビゲーションをネットワーク優先、JSをignoreSearch付きキャッシュ優先で返すため新HTMLと旧JSが混在する構造を確認。実端末の原因は未確定。Ver8は重要JS/CSSの版付き完全一致キャッシュ、検証済み同一版HTMLをアプリ起動時に提供、SWインストール時にHTML/app/pwa版を照合、実行時マーカー不一致は抽選停止と更新案内。PWAの更新ボタンを明示。既存の目的地・ミッション・確率・DB・GPX・B_Naviは変更しない。Ver7→8実更新経由の両抽選・古いJS注入・オフライン整合性試験を既存回帰に追加。構文検査済み、Actions/実機未確認。旧main 3d88854685c557cf84ef8b969922474df9ac3c45 を復旧基準とする。

## Ver8 更新試験の同期修正
ユーザー提示のActionsログで15 passed / 1 failed（v8-upgrade.spec.cjs:15）を確認。updateEverything()が再読み込みした直後にpage.evaluateが旧実行コンテキスト消失で失敗。更新成功自体は未確認。実更新ボタンをクリックする前にmain frame navigationを監視し、DOMContentLoaded・HTML/app/pwa版一致・起動完了を待ってからキャッシュと保存内容と両抽選を検証する。追加の手動reloadは除去。合格基準を緩めず、アプリ本体変更なし。最新の再試験待ち。main/B_Navi未変更。

## Ver8 公開反映対象（2026-11-25）
ユーザーより更新試験同期修正後の Ver8 consistent release gate がグリーンとの報告あり。再試験run ID・詳細ログ未取得。候補ブランチ consistent-release-v8 と公開対象SHA 6979fb281caac402229dc4d095068a727dd90c50 の一致、旧main 3d88854685c557cf84ef8b969922474df9ac3c45 からの差分を照合。旧mainを復旧基準とする。PWA8/DB2、B_Navi・地理DB・距離計算エンジン変更なし。Pages配信、実端末の新旧混在解消・追加ミッション・今の目的地の動作は別途確認。

## Ver9 旅カード（2026-11-25）
Ver8 main 2dd8c7dad9c29bb349032b8f9b57b37454fbc28b を復旧基準。ユーザー確定仕様により「今の目的地」展開内に旅カードボタン。最終ゴールを主役に、登録住所・紹介文・カテゴリ、全区間の推定距離、経由地（最大5、順序保持）、当選ナビミッション1件を表示。出発地・予定日・座標はカード入力に渡さない。縦1080×1350、横1920×1080。Canvasによる共通風景・バイクの描画、カテゴリ別8テーマ、専用ベクターアイコン、端末内PNG生成と対応ブラウザのWeb Shareファイル共有（非対応時は保存）。イラストは固有名称なしのプログラム描画、先の参考画像を背景に使用しない。既存Ver8 localStorageキー維持、旧保存の未記録距離は非表示、紹介文は一致するDB情報のみ補完。長文紹介はスペースに応じて省略。現段階の自動登録対象はすごろく・行先ガチャのみ。SW版整合性維持、PWA9/DB2、確率・距離計算・DB・B_Navi変更なし。両形式PNG実ファイル・実抽選・旧保存・オフライン・長い経由地のテスト追加。構文検査済み、Actions・実機・ネイティブ共有は未確認。

## Ver9 公開反映対象（2026-11-25）
ユーザーより Ver9 trip card gate がグリーンとの報告あり。run ID・個別試験ログ未取得。候補ブランチ trip-card-v9 と公開対象SHA 3741812cce25080d45e3315e8e90e73d9071d656 の一致、旧main 2dd8c7dad9c29bb349032b8f9b57b37454fbc28b からの差分を照合。旧mainを復旧基準とする。PWA9/DB2、B_Navi・地理DB・距離計算エンジン・追加ミッション確率変更なし。Pages配信、実端末のカードの絵柄・文字配置、縦横PNG保存・ネイティブ共有は別途確認。

## Ver10 共通イラスト旅カード（2026-11-25）
ユーザー選定の山岳テンプレートを基に、8背景を共通1画像へ統合。タイトル入り・固有地名なしの画像 trip-card-template.webp（1080×1350）を利用。六角内の固定アイコンを描画時に覆い、目的地カテゴリ別アイコンと名称を合成。ミッション欄も実際の当選アイコンに差し替え。経由地は最大5、丸や矢印・固定ラベルなし、行優先順のテキスト配置。縦1080×1350、横1920×1080は同じイラストの風景部を再構成。紹介文・距離・住所・出発地と日付非表示・PNG共有・既存localStorage維持。画像ファイルは接続制約によりユーザーによるブランチルートへの1回のアップロードが必要。画像追加pushだけで一括Actions起動。画像がない間は公開不可。SW必須画像・キャッシュ版10。構文検査済み、実画像合成/実機/Actionsは未確認。旧main 82926e62a090fd28d97a58e5ce6b5a173373d88a を復旧基準とし、B_Navi/DB/抽選確率/距離計算変更なし。

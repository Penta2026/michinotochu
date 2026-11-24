# 工程3 一括陸地判定

実DB 1234+3763=4997件、ID欠落・重複なし、座標はnumber。元DBは変更せずIDと座標で照合するsidecarを生成する。座標変更時は旧IDを無効化。未分類・境界・重複等はreviewへ。

実DBを空のポリゴンで処理し4997件すべて未分類として保持する試験に合格。合成ポリゴンでID照合・座標変更無効化を確認。空データで本番出力することは禁止（CLIで拒否）。全国実ポリゴン未取得のため実際のID付与は保留。

実行: node tools/build-land-sidecar.cjs japan-land.geojson land-sidecar.json

出力には入力SHA256、件数、判定内訳、要確認一覧を保持。入力GeoJSONのproperties.landIdは安定した陸地IDが必要。元DB、UI、SW、B_Naviは未変更。

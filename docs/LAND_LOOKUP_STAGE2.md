# 工程2 陸地判定エンジン

WGS84 GeoJSON Polygon/MultiPolygon、properties.landId必須。1度グリッドの候補索引と内外判定。穴・境界・重複・不正座標を区別し、最寄り陸地への自動補完なし。unclassifiedは海上またはデータ欠落であり、海上と断定しない。MultiPolygonは同一陸地の分割片だけに使う。陸地IDはデータ作成時に永続化する。

テストは合成ポリゴンのみ、4997件の模擬一括処理を含む。実際の全国陸地ポリゴン未取得、実スポット未分類。既存UI・DB・Service Workerは変更しない。実データでの確認前に公開機能へ接続しない。

実行: node tests/land-lookup.test.cjs

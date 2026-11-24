# 工程7.5 回帰試験（部分）
実runtimeデータ・模擬fetch・広島起点、道の駅ID 1233件。
```json
[
  {
    "v": "50",
    "budget": 30,
    "eligible": 0,
    "km": null,
    "stops": 0,
    "pass": true,
    "gpx": null
  },
  {
    "v": "50",
    "budget": 80,
    "eligible": 16,
    "km": 74.56409748882112,
    "stops": 2,
    "pass": true,
    "gpx": true
  },
  {
    "v": "50",
    "budget": 150,
    "eligible": 63,
    "km": 144.72816690168523,
    "stops": 6,
    "pass": true,
    "gpx": true
  },
  {
    "v": "125",
    "budget": 30,
    "eligible": 0,
    "km": null,
    "stops": 0,
    "pass": true,
    "gpx": null
  },
  {
    "v": "125",
    "budget": 80,
    "eligible": 16,
    "km": 74.56409748882112,
    "stops": 2,
    "pass": true,
    "gpx": true
  },
  {
    "v": "125",
    "budget": 150,
    "eligible": 63,
    "km": 144.72816690168523,
    "stops": 6,
    "pass": true,
    "gpx": true
  },
  {
    "v": "126",
    "budget": 30,
    "eligible": 0,
    "km": null,
    "stops": 0,
    "pass": true,
    "gpx": null
  },
  {
    "v": "126",
    "budget": 80,
    "eligible": 16,
    "km": 74.56409748882112,
    "stops": 2,
    "pass": true,
    "gpx": true
  },
  {
    "v": "126",
    "budget": 150,
    "eligible": 61,
    "km": 144.72816690168523,
    "stops": 6,
    "pass": true,
    "gpx": true
  }
]
```
候補なしは eligible=0 の場合正常。実ブラウザ、SW、実機GPX受信、保存UI未検証。

## 工程7.5 Chromium回帰試験 成功（2026-11-24）
- GitHub Actions run 45341989439 / job 138267574666、Ubuntu 24.04、conclusion success。ログで sugoroku browser regression (2.0s) と service worker and cached regional data (1.2s)、2 passed (5.5s) を確認。
- 実ブラウザで80km以内の抽選、最大6駅、GPXダウンロードと地点数・マーカー、B_Navi用クリップボードのGPX一致、お気に入り保存・再読み込み保持、寄り道画面遷移、結果リセット、SW起動・広島タイルキャッシュ・オフライン再抽選に合格。
- 7.5のChromium自動試験は合格。B_Navi実機での受信・ルーティング、他端末、旧版からのSW更新、全国橋接続補完と全国距離検証は未完了。main/B_Naviは変更しない。7.6公開前に残課題を確認する。
- 実行URL: https://github.com/Penta2026/michinotochu/actions/runs/45341989439

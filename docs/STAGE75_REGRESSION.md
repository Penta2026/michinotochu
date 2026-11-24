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
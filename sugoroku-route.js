/* 道の途中。道の駅すごろく: ゴール先行・±45度・前進ルート / PWA 1.5.38-dev1 */
(function (root) {
  "use strict";
  const TO_RAD = Math.PI / 180;
  const MAX_DETOUR_RATIO = 1.3;
  const MAX_STATIONS = 6; // ゴールを含む
  const bearing = (a, b) => {
    const la1 = a.lat * TO_RAD, la2 = b.lat * TO_RAD;
    const dlon = (b.lng - a.lng) * TO_RAD;
    const y = Math.sin(dlon) * Math.cos(la2);
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dlon);
    return Math.atan2(y, x);
  };
  const haversine = (a, b) => {
    const la1 = a.lat * TO_RAD, la2 = b.lat * TO_RAD;
    const dlat = la2 - la1, dlon = (b.lng - a.lng) * TO_RAD;
    const x = Math.sin(dlat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dlon / 2) ** 2;
    return 12742 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
  };
  const valid = p => p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
  const uniform = () => Math.random();
  // ゴール方向の扇形±45°、出発地～ゴール間の進捗率(0..1)に制限。
  function corridor(origin, goal, stations) {
    const azimuth = bearing(origin, goal);
    const scaleLon = 111.32 * Math.cos(origin.lat * TO_RAD);
    const dx = (goal.lng - origin.lng) * scaleLon, dy = (goal.lat - origin.lat) * 111.32;
    const goalSq = dx * dx + dy * dy;
    return stations.filter(s => s !== goal && s.id !== goal.id && valid(s))
      .map(s => {
        const sx = (s.lng - origin.lng) * scaleLon, sy = (s.lat - origin.lat) * 111.32;
        const progress = (sx * dx + sy * dy) / goalSq;
        const diff = Math.atan2(Math.sin(bearing(origin, s) - azimuth), Math.cos(bearing(origin, s) - azimuth));
        return { station: s, progress, angle: Math.abs(diff) / TO_RAD, fromStart: haversine(origin, s) };
      })
      .filter(s => s.progress > 0.015 && s.progress < 0.985 &&
        s.angle <= 45 + 1e-7 && s.fromStart > 0.5 && haversine(s.station, goal) > 0.5)
      .sort((a, b) => a.progress - b.progress);
  }
  // 広域検索で候補が多い場合でも、各進捗帯から中心線に近い駅とランダム駅を残す。
  // すべての駅が進捗帯に分散したまま残るため、6駅ルートの探索を高速化できる。
  function compactCandidates(candidates) {
    if (candidates.length <= 150) return candidates;
    const bins = Array.from({length: 24}, () => []);
    candidates.forEach(s => bins[Math.min(23, Math.floor(s.progress * 24))].push(s));
    const chosen = [];
    for (const bin of bins) {
      if (bin.length <= 7) { chosen.push(...bin); continue; }
      bin.sort((a, b) => a.fromStart * Math.sin(a.angle * TO_RAD) - b.fromStart * Math.sin(b.angle * TO_RAD));
      chosen.push(...bin.slice(0, 5));
      const others = bin.slice(5);
      for (let i = 0; i < 2 && others.length; i++) {
        const j = Math.floor(uniform() * others.length);
        chosen.push(others.splice(j, 1)[0]);
      }
    }
    return chosen.sort((a, b) => a.progress - b.progress);
  }
  function segmentMatrix(candidates) {
    const n = candidates.length, distances = Array.from({ length: n }, () => new Float64Array(n));
    for (let j = 0; j < n; j++) for (let i = 0; i < j; i++)
      distances[i][j] = haversine(candidates[i].station, candidates[j].station);
    return distances;
  }
  // 設定上限までの経由駅を選び、各区間の直線距離合計が最短直線の1.3倍以下の経路だけ返す。
  // 実走行距離・道路の通行可否はここでは扱わず、ナビ側で評価する。
  function solve(origin, goal, candidates, number, aestheticWeight, wobble, distances, toGoal) {
    const n = candidates.length;
    const goalDistance = haversine(origin, goal);
    const score = Array.from({ length: number }, () => Array(n).fill(Infinity));
    const trueDistance = Array.from({ length: number }, () => Array(n).fill(Infinity));
    const parent = Array.from({ length: number }, () => Array(n).fill(-1));
    const stepGap = 0.012; // 逆方向・同一投影地点間の往復を排除
    for (let step = 0; step < number; step++) {
      for (let j = 0; j < n; j++) {
        const station = candidates[j];
        const penalty = aestheticWeight * goalDistance * Math.abs(station.progress - (step + 1) / (number + 1)) +
          (aestheticWeight ? wobble[j] * goalDistance * .008 : 0);
        if (step === 0) {
          score[step][j] = station.fromStart + penalty;
          trueDistance[step][j] = station.fromStart;
        } else {
          for (let i = 0; i < j; i++) {
            if (station.progress - candidates[i].progress < stepGap || !Number.isFinite(score[step-1][i])) continue;
            const segment = distances[i][j];
            const candidateScore = score[step - 1][i] + segment + penalty;
            if (candidateScore < score[step][j]) {
              score[step][j] = candidateScore;
              trueDistance[step][j] = trueDistance[step - 1][i] + segment;
              parent[step][j] = i;
            }
          }
        }
      }
    }
    let best = Infinity, finalStation = -1, totalDistance = Infinity;
    for (let j = 0; j < n; j++) {
      const finishSegment = toGoal[j];
      if (score[number-1][j] + finishSegment < best) {
        best = score[number-1][j] + finishSegment;
        finalStation = j;
        totalDistance = trueDistance[number-1][j] + finishSegment;
      }
    }
    if (finalStation < 0) return null;
    const route = [];
    let current = finalStation;
    for (let step = number - 1; step >= 0; step--) {
      route.unshift(candidates[current].station);
      current = parent[step][current];
    }
    return { points: [...route, goal], directSegments: totalDistance };
  }
  function plan(origin, goal, stations, requestedCount) {
    if (!valid(origin) || !valid(goal) || !Array.isArray(stations)) throw new Error("有効な出発地とゴールが必要です。");
    const direct = haversine(origin, goal);
    if (direct < 0.5) throw new Error("ゴールが出発地に近すぎます。");
    const count = Math.max(1, Math.min(MAX_STATIONS, Math.floor(Number(requestedCount) || 1)));
    const candidates = compactCandidates(corridor(origin, goal, stations));
    const wobble = candidates.map(uniform);
    const distances = segmentMatrix(candidates);
    const toGoal = candidates.map(s => haversine(s.station, goal));
    for (let k = Math.min(count - 1, candidates.length); k >= 1; k--) {
      // まず最短の経由ルートで実現可能性を判定。駅が足りない場合は数を減らす。
      const shortest = solve(origin, goal, candidates, k, 0, wobble, distances, toGoal);
      if (!shortest || shortest.directSegments > direct * MAX_DETOUR_RATIO + 1e-6) continue;
      // 少し左右に振れつつ、各区間が偏りにくい候補を選択。
      const scenic = solve(origin, goal, candidates, k, 0.32, wobble, distances, toGoal);
      const chosen = scenic && scenic.directSegments <= direct * MAX_DETOUR_RATIO + 1e-6 ? scenic : shortest;
      return { points: chosen.points, directKm: direct,
        segmentKm: chosen.directSegments, requestedCount: count, candidateCount: candidates.length };
    }
    return { points: [goal], directKm: direct,
      segmentKm: direct, requestedCount: count, candidateCount: candidates.length };
  }
  function pickGoal(origin, stations, maximumDistance) {
    const goals = stations.filter(valid).map(s => ({ station: s, km: haversine(origin, s) }))
      .filter(s => s.km >= 1 && s.km <= maximumDistance);
    if (!goals.length) return null;
    // 近距離の駅ばかり選ばず、目安距離の65～100%を優先。存在しなければ全候補から。
    const nearTarget = goals.filter(s => s.km >= maximumDistance * 0.65);
    const pool = nearTarget.length ? nearTarget : goals;
    return pool[Math.floor(uniform() * pool.length)].station;
  }
  root.SugorokuRoute = { plan, pickGoal, corridor, haversine, MAX_DETOUR_RATIO, MAX_STATIONS };
})(typeof window !== "undefined" ? window : globalThis);

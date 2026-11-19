/* 道の途中。→ B_Navi 地点順序 GPX1.1 (道路軌跡ではない) */
(function (root) {
  "use strict";
  const NS = "http://www.topografix.com/GPX/1/1";
  const MARKER = "BikeNavigator ordered itinerary BNAV-ITINERARY-1";
  function valid(p) {
    return !!p && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) &&
      Number(p.lat) >= 20 && Number(p.lat) <= 50 &&
      Number(p.lng) >= 120 && Number(p.lng) <= 155;
  }
  function xmlText(value) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function build(origin, routePoints, title) {
    if (!origin || !Array.isArray(routePoints) || !routePoints.length)
      throw new Error("出発地と目的地を設定してください。");
    if (!valid(origin)) throw new Error("日本周辺の有効な緯度・経度を確認してください。");
    if (routePoints.length > 51)
      throw new Error("B_Naviの上限は経由地50件です。地点数を52件以下にしてください。");
    const stops = [origin, ...routePoints];
    if (!stops.every(valid)) throw new Error("日本周辺の有効な緯度・経度を確認してください。");
    const body = stops.map((p, i) => {
      const name = i === 0 ? (p.label || p.name || "出発地") :
        (p.name || (i === stops.length - 1 ? "目的地" : `経由地${i}`));
      return `    <rtept lat="${Number(p.lat).toFixed(7)}" lon="${Number(p.lng).toFixed(7)}"><name>${xmlText(name)}</name></rtept>`;
    }).join("\n");
    const metaName = xmlText(title || "道の途中。の経由地点");
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<gpx xmlns="${NS}" version="1.1" creator="MichiNoTochu">\n` +
      `  <metadata><name>${metaName}</name><desc>道の途中。で選んだ地点の順序。道路経路はB_Navi側で再計算してください。</desc></metadata>\n` +
      `  <rte><name>${MARKER}</name>\n${body}\n  </rte>\n</gpx>\n`;
  }
  function filename(title) {
    const safe = String(title || "ルート").replace(/[\\/:*?"<>|\u0000-\u001F]/g, "_").trim().slice(0, 40) || "ルート";
    const d = new Date(), date = [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("");
    return `道の途中_${safe}_${date}.gpx`;
  }
  function download(origin, points, title) {
    const xml = build(origin, points, title);
    const blob = new Blob([xml], {type:"application/gpx+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename(title || points[points.length-1]?.name); a.hidden = true;
    document.body.appendChild(a);
    try { a.click(); } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000); }
    return xml;
  }
  root.BNavGPX = Object.freeze({build, download, filename, marker:MARKER});
})(window);

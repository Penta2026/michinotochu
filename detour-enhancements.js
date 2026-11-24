/* 道の途中。寄り道しよう：経由地周辺検索 / Google Maps取込 / ルート順序
 * PWA 1.5.41-dev1
 * 既存コードへの影響を小さくするため、現行app.jsの寄り道関連関数のみ上書きする。
 * Google Mapsの検索半径は目安。登録DB候補は直線距離で抽出する。
 */
"use strict";

// 基準は現在のルートから毎回組み立てる。中間点は元ルートの順番を保持。
function detourAnchorEntries(route = detourRoute) {
  if (!route || !route.origin || !Array.isArray(route.points) || !route.points.length) return [];
  const result = [
    {key: "start", name: "スタート地点", point: route.origin, index: 0}
  ];
  route.points.slice(0, -1).forEach((p, i) => {
    result.push({key: `via:${i}`, name: `経由地${i + 1}：${p.name || `地点${i + 1}`}`, point: p, index: i + 1});
  });
  result.push({
    key: "destination", name: "ゴール地点", point: route.points[route.points.length - 1],
    index: route.points.length
  });
  return result;
}
function detourAnchorLabel(key) {
  if (key === "all") return "全地点";
  const item = detourAnchorEntries().find(e => e.key === key);
  return item ? item.name : (key === "destination" ? "ゴール地点" : "スタート地点");
}
function detourAnchorPoint(route, key) {
  const entries = detourAnchorEntries(route);
  return (entries.find(e => e.key === key) || entries[0] || {}).point || null;
}
function detourRefreshAnchorChoices() {
  const selector = $("detourAnchor");
  const choiceArea = $("detourAnchorChoices");
  if (!selector || !choiceArea) return;
  const entries = detourAnchorEntries();
  const previous = selector.value || "all";
  const options = [{key: "all", name: "📍 全地点（スタート・経由地・ゴール）"},
    ...entries.map(e => ({key: e.key, name: e.name}))];
  // 起点と目的地がまだ未設定でも、選択UIは表示する。
  if (!entries.length) options.push(
    {key: "start", name: "スタート地点"}, {key: "destination", name: "ゴール地点"}
  );
  selector.innerHTML = options.map(e => `<option value="${esc(e.key)}">${esc(e.name)}</option>`).join("");
  selector.value = options.some(e => e.key === previous) ? previous : "all";
  choiceArea.innerHTML = options.map(e => `<button type="button" data-anchor-key="${esc(e.key)}" `+
    `class="${selector.value === e.key ? "active" : ""}" `+
    `onclick="setDetourAnchorChoice('${escJs(e.key)}')">${esc(e.name)}</button>`).join("");
}
function setDetourAnchorChoice(key) {
  const selector = $("detourAnchor");
  if (!selector || ![...selector.options].some(opt => opt.value === key)) return;
  selector.value = key;
  $("detourAnchorChoices")?.querySelectorAll("button").forEach(b =>
    b.classList.toggle("active", b.dataset.anchorKey === key));
}
function renderDetourRouteStatus() {
  const status = $("detourDestinationStatus");
  if (status) status.textContent = detourRouteLabel();
  detourRefreshAnchorChoices();
}
// 「全地点」の場合でもGoogle Mapsの周辺検索は単一地点ごと。
// ボタンで基準点を切り替える。半径は検索画面の表示倍率の目安。
function detourSetSearchMapAnchor(key) {
  const state = detourMapSearchState;
  if (!state || !Array.isArray(state.bases)) return;
  const entry = state.bases.find(e => e.key === key);
  if (!entry) return;
  state.mapBaseKey = entry.key;
  state.base = entry.point;
  const link = $("detourMapSearchLink");
  if (link) link.href = detourFoodSearchUrl(state.route, state.genre, entry.point, state.radius, state.index);
  $("detourSearchBaseChoices")?.querySelectorAll("button").forEach(b =>
    b.classList.toggle("active", b.dataset.mapAnchorKey === key));
  const hint = $("detourMapSearchHint");
  if (hint) hint.textContent = `Googleマップ検索の中心：${entry.name}（約${state.radius}kmは目安）`;
  detourRefreshCustomMapLink();
}

// 任意の検索語句。Google Mapsの検索結果は取得しない（無料URLで開くだけ）。
function detourCustomMapSearchUrl() {
  const state = detourMapSearchState;
  if (!state || !state.base) return "#";
  const word = ($("detourCustomKeyword")?.value || "").trim().slice(0, 80);
  if (!word) return "#";
  const zoom = detourMapZoomForRadius(state.radius);
  return `https://www.google.com/maps/search/${encodeURIComponent(word)}/@${Number(state.base.lat)},${Number(state.base.lng)},${zoom}z`;
}
function detourRefreshCustomMapLink() {
  const link = $("detourCustomMapSearchLink");
  if (link) {
    link.href = detourCustomMapSearchUrl();
    const filled = Boolean(($('detourCustomKeyword')?.value || '').trim());
    link.setAttribute('aria-disabled', filled ? 'false' : 'true');
  }
}
// 自由検索は独立した検索語であり、上のジャンル検索とは混同しない。
function detourPrepareCustomMapSearch(event) {
  const keyword = ($('detourCustomKeyword')?.value || '').trim();
  if (!keyword) {
    event?.preventDefault();
    $('detourCustomKeyword')?.focus();
    alert('探したい店名やキーワードを入力してください。');
    return false;
  }
  prepareDetourPointShare();
  return true;
}
// Google Mapsテーマ変更は、現在選んでいる検索中心を変えない。
function setDetourMapGenre(index) {
  const state = detourMapSearchState;
  if (!state) return;
  const words = detourMapSearchWords(state.genre);
  state.index = Math.max(0, Math.min(words.length - 1, Number(index) || 0));
  const name = detourMapSearchWord(state.genre, state.index);
  const link = $("detourMapSearchLink");
  if (link) {
    link.href = detourFoodSearchUrl(state.route, state.genre, state.base, state.radius, state.index);
    link.innerHTML = `🗺 このテーマでGoogleマップ検索`;
  }
  const selectButton = $('detourChooseMapTopic');
  if (selectButton) selectButton.textContent = `🔎 検索テーマ：${name}`;
  closeModal();
}
function runDetourGacha() {
  if (!detourRoute.origin || !detourRoute.points.length) {
    alert("出発地と最終目的地を設定するか、お気に入りのルートを選んでください。"); return;
  }
  const genre = $("detourGenre")?.value || "random";
  const anchor = $("detourAnchor")?.value || "all";
  const radius = numericValue("detourRadius", "detourRadiusFree", 1, 200);
  const route = detourRoute;
  const anchors = detourAnchorEntries(route);
  const activeAnchors = anchor === "all" ? anchors : anchors.filter(e => e.key === anchor);
  if (!activeAnchors.length) { alert("検索する地点を選んでください。"); return; }
  const candidates = detourAllSpots().map(spot => {
    const nearest = activeAnchors.map(a => ({
      anchor: a, distance: dist(a.point.lat, a.point.lng, spot.lat, spot.lng)
    })).sort((a, b) => a.distance - b.distance)[0];
    return {...spot,
      _detourDistance: nearest.distance,
      _detourAnchorKey: nearest.anchor.key,
      _routeProgress: detourRouteProgress(route, spot)
    };
  }).filter(spot => spot._detourDistance <= radius &&
      (genre === "random" || detourGenreMatch(spot, genre)));
  candidates.sort((a, b) => a._routeProgress - b._routeProgress ||
    a._detourDistance - b._detourDistance || a.name.localeCompare(b.name, "ja"));
  window._detourRegisteredPool = candidates;
  const state = detourMapSearchState = {
    route, genre, radius, index: 0,
    bases: activeAnchors.map(a => ({key: a.key, name: a.name, point: a.point})),
    mapBaseKey: activeAnchors[0].key,
    base: activeAnchors[0].point
  };
  const word = detourMapSearchWord(genre, 0);
  const url = detourFoodSearchUrl(route, genre, state.base, radius, 0);
  const target = $("detourResult");
  if (!target) return;
  const registered = candidates.length ? `<div class="detour-registered">
      <h4>📚 アプリ登録候補 <small>${candidates.length}件</small></h4>
      <div class="detour-selection-bar"><span id="detourSelectionStatus">${detourSelectedCount()}件追加済み</span></div>
      <div class="detour-candidate-list">${candidates.map((spot, i) => `
        <div class="detour-candidate-select">
          <input id="detourPick${i}" class="detour-candidate-check" type="checkbox"
            onchange="toggleDetourRegisteredSelection(${i},this.checked)"
            aria-label="${esc(spot.name)}を寄り道に選ぶ">
          <span id="detourOrder${i}" class="detour-order-badge"></span>
          <button type="button" class="detour-candidate-row"
            onclick="openDetourRegisteredDetail(${i},'${escJs(genre)}','${escJs(spot._detourAnchorKey)}')">
            ${iconBadge(spot, spot.kind)}<span>${esc(spot.name)}</span>
            <small>${esc(detourAnchorLabel(spot._detourAnchorKey))}から約${spot._detourDistance.toFixed(1)}km</small>
          </button>
        </div>`).join("")}</div>
      <p class="meta">選んだ地点に最も近い基準点へひも付けます。候補名から詳細を見られます。</p>
    </div>` : `<div class="detour-registered detour-registered-empty">
      <h4>📚 アプリ登録候補</h4>
      <p class="meta">このジャンルの登録候補はありません。Googleマップでも探してみてね。</p>
    </div>`;
  const mapAnchors = activeAnchors.length > 1 ? `<div class="detour-map-anchor-choice">
      <div class="meta">Googleマップで探す場所を選択：</div>
      <div id="detourSearchBaseChoices" class="detour-search-base-grid">
        ${activeAnchors.map((a, i) => `<button type="button" class="soft ${i === 0 ? "active" : ""}"
          data-map-anchor-key="${esc(a.key)}"
          onclick="detourSetSearchMapAnchor('${escJs(a.key)}')">${esc(a.name)}</button>`).join("")}
      </div></div>` : "";
  const destination = route.points[route.points.length - 1];
  target.className = "result";
  target.innerHTML = `<div class="detour-picked">
      <div class="detour-mission-title">🛣️ この辺で寄り道を探す</div>
      <div class="detour-stats">
        <span>${esc(detourAnchorLabel(anchor))} 基準</span><span>半径 約${radius}km</span>
      </div>
      <div class="detour-map-search">
        ${mapAnchors}
        <p id="detourMapSearchHint" class="meta">Googleマップ検索の中心：${esc(state.bases[0].name)}（約${radius}kmは目安）</p>
        <button id="detourChooseMapTopic" type="button" class="soft detour-topic-select" onclick="changeDetourMapGenre()">🔎 検索テーマ：${esc(word)}</button>
        <a id="detourMapSearchLink" class="mapbtn primary" href="${url}" target="_blank"
           rel="noopener" onclick="prepareDetourPointShare()">🗺 このテーマでGoogleマップ検索</a>
        <div class="detour-custom-map-search">
          <label for="detourCustomKeyword">🔎 自由に検索（店名・場所の特徴など）</label>
          <input id="detourCustomKeyword" type="search" value="" maxlength="80"
            placeholder="例：昔ながらのパン屋、○○食堂" oninput="detourRefreshCustomMapLink()">
          <a id="detourCustomMapSearchLink" class="mapbtn detour-custom-search-action" target="_blank"
            rel="noopener" href="#" aria-disabled="true" onclick="return detourPrepareCustomMapSearch(event)">🔎 この言葉でGoogleマップ検索</a>
        </div>
        <input id="detourCandidateLinkInput" class="map-link-input" type="text"
          inputmode="url" autocomplete="off" placeholder="Googleマップ共有URLまたは緯度,経度">
        <button type="button" class="soft detour-copy-add" onclick="addCopiedDetourPoint()">🔗 URLから寄り道に追加</button>
        <div id="detourExternalList" class="detour-external-list"></div>
        <p class="meta">Googleマップで見つけた場所の共有リンクを貼り付けて追加。Androidの共有機能にも対応。名称は追加後に編集できます。</p>
      </div>
      ${registered}
      <div class="detour-route-final">
        <div id="detourSelectionStatus" class="detour-route-final-status">${detourSelectedCount()}件追加済み</div>
        <div class="detour-submit-actions">
          <button id="detourSelectedRoute" type="button" class="primary action-main"
            onclick="openSelectedDetourRoute()">🗺 グーグルマップに送る</button>
          <button id="detourSendBNavi" type="button" class="soft action-main route-bnavi" onclick="sendSelectedDetourToBNavi()">B_Naviに送る</button>
          <button id="detourSaveGpx" type="button" class="soft action-main"
            onclick="saveSelectedDetourGpx()">💾 GPXを保存</button>
        </div>
      </div>
      <p class="meta">ゴール「${esc(destination.name || "目的地")}」は変更しません。寄り道はそれぞれの基準地点の直後、ゴール付近ならゴール手前に配置します。</p>
    </div>`;
  updateDetourSelectionUi();
}

function updateDetourSelectionUi() {
  const count = detourSelectedCount();
  document.querySelectorAll("#detourSelectionStatus").forEach(el => el.textContent = count + "件追加済み");
  const go = $("detourSelectedRoute");
  if (go) {
    go.disabled = count < 1;
    go.textContent = "🗺 グーグルマップに送る";
  }
  const gpx = $("detourSaveGpx");
  if (gpx) gpx.disabled = !detourRoute.origin || !detourRoute.points.length;
  const send = $("detourSendBNavi");
  if (send) send.disabled = !detourRoute.origin || !detourRoute.points.length;
  (window._detourRegisteredPool || []).forEach((spot, i) => {
    const order = detourSelectionNumber(detourPointKey(spot));
    const box = $("detourPick" + i), tag = $("detourOrder" + i);
    if (box) box.checked = order > 0;
    if (tag) tag.textContent = order ? "#" + order : "";
  });
  updateDetourExternalList();
}
function toggleDetourRegisteredSelection(index, checked) {
  const spot = (window._detourRegisteredPool || [])[Number(index)];
  if (!spot) return;
  const selected = detourChosenPoints();
  const key = detourPointKey(spot);
  const oldIndex = selected.findIndex(s => detourPointKey(s) === key);
  if (checked && oldIndex < 0) {
    selected.push({...spot, _detourKey: key, _detourSource: "registered",
      _detourAnchorKey: spot._detourAnchorKey});
  } else if (!checked && oldIndex >= 0) selected.splice(oldIndex, 1);
  updateDetourSelectionUi();
}

// Google Maps共有URLは必ずしも名称を含まない。推測で店舗名を作らない。
function detourNameFromMapUrl(value) {
  const text = String(value || "");
  const match = text.match(/https?:\/\/[^\s]+/);
  if (!match) return "";
  try {
    const url = new URL(match[0]);
    const fromPlace = url.pathname.match(/\/place\/([^/]+)/i);
    let name = fromPlace ? decodeURIComponent(fromPlace[1]).replace(/\+/g, " ") : "";
    if (!name) name = url.searchParams.get("query") || url.searchParams.get("q") || "";
    if (/^-?\d+(?:\.\d+)?\s*,\s*-?\d/.test(name) || /^(loc:|https?:)/i.test(name)) return "";
    return name.trim().slice(0, 80);
  } catch (_) { return ""; }
}
function detourExternalAnchor(options) {
  const entries = detourAnchorEntries();
  const provided = options && options.anchorKey;
  const shared = getPendingMapShare()?.target;
  const key = provided || (shared?.kind === "detour-point" ? shared.anchorKey : null) ||
    detourMapSearchState?.mapBaseKey || $("detourAnchor")?.value || "start";
  if (key === "all") return entries[0]?.key || "start";
  return entries.some(e => e.key === key) ? key : "start";
}
function addDetourExternalCoords(lat, lng, options = {}) {
  const latitude = Number(lat), longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      !validJapanCoords(latitude, longitude)) {
    alert("有効な地点座標を取得できませんでした。"); return false;
  }
  const selected = detourChosenPoints();
  if (selected.some(p => dist(p.lat, p.lng, latitude, longitude) < 0.05)) {
    alert("その場所はすでに寄り道へ追加されています。"); return false;
  }
  const pending = getPendingMapShare()?.target;
  const sharedName = pending?.kind === "detour-point" ? detourSharePointName() : "";
  const name = String(options.name || sharedName || (pending?.kind === "detour-point" && pending.fallbackName) || "Googleマップ追加地点").trim().slice(0, 80);
  const key = "ext:" + (window._detourExternalSeq = (window._detourExternalSeq || 0) + 1);
  selected.push({
    _detourKey: key, _detourSource: "external",
    _detourAnchorKey: detourExternalAnchor(options),
    name: name || "Googleマップ追加地点", lat: latitude, lng: longitude,
    kind: "未登録スポット"
  });
  updateDetourSelectionUi();
  return true;
}
async function addCopiedDetourPoint() {
  const link = await mapLinkText("detourCandidateLinkInput");
  if (!link) { alert("Googleマップの共有URLか、緯度,経度を貼り付けてね。"); return; }
  const coords = await resolveMapLink(link);
  if (!coords) {
    showMapResolveDebug();
    alert("地点を取得できませんでした。短縮URLが解決できない場合は、Googleマップの座標を貼り付けてね。");
    return;
  }
  const name = detourNameFromMapUrl(link) || "Googleマップ追加地点";
  if (addDetourExternalCoords(coords[0], coords[1], {
    anchorKey: detourMapSearchState?.mapBaseKey || $("detourAnchor")?.value,
    name
  })) {
    const input = $("detourCandidateLinkInput");
    if (input) input.value = "";
  }
}
function renameDetourExternalPoint(key, name) {
  const point = detourChosenPoints().find(p => detourPointKey(p) === key && p._detourSource === "external");
  if (!point) return;
  point.name = String(name || "").trim().slice(0, 80) || "Googleマップ追加地点";
  updateDetourExternalList();
}
function updateDetourExternalList() {
  const list = $("detourExternalList");
  if (!list) return;
  const points = detourExternalPoints();
  list.innerHTML = points.length ? points.map(p => {
    const key = detourPointKey(p);
    return `<div class="detour-external-row">
      <div class="detour-external-info">
        <label for="detourName${esc(p._detourKey)}">#${detourSelectionNumber(key)} 📍 地点名（編集可）</label>
        <input id="detourName${esc(p._detourKey)}" type="text" maxlength="80"
          value="${esc(p.name)}" aria-label="寄り道地点名"
          onchange="renameDetourExternalPoint('${escJs(key)}',this.value)">
        <div class="meta">${esc(detourAnchorLabel(p._detourAnchorKey))}付近 / ${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)}</div>
      </div>
      <button type="button" class="soft" onclick="removeDetourExternalPointByKey('${escJs(key)}')">削除</button>
    </div>`;
  }).join("") : `<p class="meta">Googleマップからの追加地点は、まだありません。</p>`;
}
function prepareDetourPointShare() {
  saveReturnState();
  setPendingMapShare({kind: "detour-point", mode: "detour",
    anchorKey: detourMapSearchState?.mapBaseKey || $("detourAnchor")?.value || "start"});
}
function prepareKnownDetourPointShare(lat, lng, name = "Googleマップ候補") {
  saveReturnState();
  setPendingMapShare({kind: "detour-point", mode: "detour",
    anchorKey: detourMapSearchState?.mapBaseKey || $("detourAnchor")?.value || "start",
    fallbackCoords: [Number(lat), Number(lng)], fallbackName: name});
}

// 地点を全てゴール手前に並べる従来仕様を変更。
// 同一基準点の寄り道は「選んだ順番」、元ルートの経由地も順序を維持。
function detourInsertedInSelectedOrder(route, detours) {
  const base = (route?.points || []).map(p => ({...p}));
  if (!base.length) return (detours || []).map(p => ({...p}));
  const lastSlot = base.length - 1;
  const slots = Array.from({length: base.length}, () => []);
  for (const p of (detours || [])) {
    let index = lastSlot;
    if (p._detourAnchorKey === "start") index = 0;
    const via = /^via:(\d+)$/.exec(String(p._detourAnchorKey || ""));
    if (via) index = Math.min(lastSlot, Number(via[1]) + 1);
    if (p._detourAnchorKey === "destination") index = lastSlot;
    const {_detourKey, _detourSource, _detourDistance, _detourAnchorKey,
      _routeProgress, _isDetour, _originalOrder, ...clean} = p;
    slots[index].push(clean);
  }
  const result = [];
  base.forEach((p, index) => result.push(...slots[index], p));
  return result;
}
function detourInsertedMultiple(route, detours) {
  return detourInsertedInSelectedOrder(route, detours);
}

// 元コードの受信処理（receiveSharedMapTarget）からは緯度経度だけが渡るため、
// 共有URLのtitle/textを呼出側で補助的に名前へ反映する（後から編集可能）。
function detourSharePointName() {
  const url = new URL(location.href);
  const title = url.searchParams.get("title") || "";
  const text = url.searchParams.get("text") || "";
  return detourNameFromMapUrl(text) || detourNameFromMapUrl(url.searchParams.get("url")) ||
    (title && !/^https?:/i.test(title) ? title.trim().slice(0, 80) : "");
}

// 初期画面でも新しい選択肢を表示。
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", detourRefreshAnchorChoices, {once: true});
} else {
  detourRefreshAnchorChoices();
}

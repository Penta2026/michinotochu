/* 道の途中。PWAキャッシュ (11) - 独立スコープ、他アプリのキャッシュは削除しない。 */
"use strict";
const VERSION = "11";
const CACHE_PREFIX = "michinotochu-rebuilt-pwa-";
const CACHE_NAME = CACHE_PREFIX + VERSION;
const CORE_FILES = [
  "./index.html", "./style.css?v="+VERSION, "./app.js?v="+VERSION, "./detour-enhancements.js",
  "./pwa.js?v="+VERSION, "./trip-card.js?v="+VERSION, "./gpx-export.js", "./sugoroku-route.js", "./land-lookup.js", "./land-distance.js", "./budget-sugoroku.js", "./sugoroku-land-ui.js", "./distance-gacha.js", "./draw-reveal.js", "./draw-reveal.css", "./data/land-runtime/manifest.json", "./data/land-runtime/spots.json", "./data/land-runtime/connections.json", "./manifest.webmanifest",
  "./data/app_data.js", "./data/riders_cafes.js", "./data/spot_overrides.js",
  "./data/road_summaries_chugoku.js", "./data/road_summaries_shikoku.js",
  "./data/road_summaries_kyushu_okinawa.js", "./data/road_summaries_kinki.js",
  "./data/road_summaries_chubu.js", "./data/road_summaries_kanto.js",
  "./data/road_summaries_tohoku.js", "./data/road_summaries_hokkaido.js",
  "./data/road_summaries_final.js",
  "./assets/home/home_sprite_0.js", "./assets/home/home_sprite_1.js",
  "./assets/home/home_sprite_2.js", "./assets/home/home_sprite_3.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./assets/trip-card-detour.jpg"
];
const OPTIONAL_FILES = [
  "./", "./history.html", "./privacy.html", "./terms.html", "./legal.html",
  "./data/land-runtime/README.md", "./install.html", "./support.html", "./assets/hero_banner.png",
  "./assets/hero_banner_pc.png", "./assets/home/home_background.png",
  "./assets/icons/ic_feature_market.png"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // 必須リソースが1つでも欠けた場合は古いSWを維持する。
    await cache.addAll(CORE_FILES.map(path => new Request(path, {cache: "reload"})));
    // Avoid activating a partially published release (HTML and JS must agree).
    const [html,app,pwa,card]=await Promise.all(["./index.html","./app.js?v="+VERSION,"./pwa.js?v="+VERSION,"./trip-card.js?v="+VERSION].map(async path=>(await cache.match(path)).text()));
    if(!html.includes('data-app-build="'+VERSION+'"')||!app.includes('window.MICHI_APP_BUILD="'+VERSION+'"')||!pwa.includes('PWA_APP_VERSION = "'+VERSION+'"')||!card.includes('const BUILD="'+VERSION+'"'))throw Error("Release resources do not match");
    await Promise.allSettled(OPTIONAL_FILES.map(path => cache.add(new Request(path, {cache: "reload"}))));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (url.pathname.endsWith("/data/version.json")) {
    event.respondWith(fetch(request, {cache: "no-store"}).catch(() => caches.open(CACHE_NAME).then(c => c.match(request))));
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const scopePath=new URL(self.registration.scope).pathname;
      // The active worker serves its own validated app shell, including shared-map query URLs.
      if(url.pathname===scopePath||url.pathname===scopePath+"index.html"){
        const shell=await cache.match("./index.html");
        if(shell)return shell;
      }
      try {
        const response = await fetch(request, {cache: "no-store"});
        if (response.ok && response.type === "basic") await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return (await cache.match(request, {ignoreSearch: true})) || (await cache.match("./index.html")) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const critical=/\/(app\.js|pwa\.js|style\.css|trip-card\.js)$/.test(url.pathname);
    // Never substitute a different release's critical script or stylesheet.
    const cached = await cache.match(request, {ignoreSearch: !critical});
    if (cached) return cached;
    if(critical&&url.searchParams.get("v")!==VERSION)return Response.error();
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});

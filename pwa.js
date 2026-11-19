/* 道の途中。 v1.5.43
 * HTTPS配信と専用localhostプレビューでService Workerを登録する。
 * 元のローカル開発版と同じURL・ポートで同時に動かさないこと。
 * 端末内のお気に入り・旅の履歴は自動的に共有されない。
 */
"use strict";
const PWA_APP_VERSION = "1.5.43";
const PWA_DEFAULT_DB_VERSION = "2.8.23";
const PWA_HOSTED = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
function pwaStoredDbVersion() { return PWA_DEFAULT_DB_VERSION; }
function finishStartup() {
  document.body.classList.remove("pwa-starting");
  const gate = document.getElementById("pwaStartupGate");
  if (gate) { gate.classList.add("done"); setTimeout(() => gate.remove(), 230); }
}
function setPwaStatus(message) {
  const status = document.getElementById("pwaDbStatus");
  if (status) status.textContent = message;
  const footer = document.getElementById("footerVersion");
  if (footer) footer.textContent = `${PWA_HOSTED ? "PWA" : "LOCAL Web"} / PWA ${PWA_APP_VERSION} / DB ${PWA_DEFAULT_DB_VERSION}`;
}
async function updateEverything() {
  if (!PWA_HOSTED) {
    alert(`このURLではPWA更新を利用できません。\nPWA ${PWA_APP_VERSION} / DB ${PWA_DEFAULT_DB_VERSION}`);
    return;
  }
  try {
    const registration = await navigator.serviceWorker?.getRegistration("./");
    if (registration) await registration.update();
    location.reload();
  } catch (error) {
    alert("更新の確認ができませんでした。通信状態を確認して再度試してください。");
  }
}
window.updateEverything = updateEverything;
async function readyLocalWeb() {
  finishStartup();
  if (!PWA_HOSTED) {
    setPwaStatus("ローカルWeb：端末内のデータを使用中");
    // 古い開発用SWが残っても最新版が見えるようにする。
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registrations.filter(r => r.scope.startsWith(location.origin + "/"))
          .forEach(r => r.unregister());
      } catch (_) { /* ローカル環境でSW非対応でもアプリは動く */ }
    }
    return;
  }
  setPwaStatus(location.protocol === "https:" ? "Web公開版：端末内にデータを保存" : "PWAプレビュー：端末内にデータを保存");
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js", {scope: "./"});
  } catch (error) {
    console.warn("PWAオフライン登録に失敗しました。通常のWeb利用は継続できます。", error);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", readyLocalWeb, {once: true});
} else readyLocalWeb();
setTimeout(finishStartup, 2500);

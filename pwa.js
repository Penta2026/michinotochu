/* 道の途中。 v16
 * HTTPS配信と専用localhostプレビューでService Workerを登録する。
 * 元のローカル開発版と同じURL・ポートで同時に動かさないこと。
 * 端末内のお気に入り・旅の履歴は自動的に共有されない。
 */
"use strict";
const PWA_APP_VERSION = "16";
const PWA_DEFAULT_DB_VERSION = "2";
window.MICHI_PWA_BUILD=PWA_APP_VERSION;
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
  const button=document.getElementById("pwaUpdateButton");
  if(button&&PWA_HOSTED)button.textContent="📦 アプリを更新";
  if (footer) footer.textContent = window.MICHI_APP_BUILD===PWA_APP_VERSION ? `${PWA_HOSTED ? "PWA" : "LOCAL Web"} / PWA ${PWA_APP_VERSION} / DB ${PWA_DEFAULT_DB_VERSION}` : "更新不一致：アプリを更新してください";
}
const PWA_UPDATE_RECEIPT = "michi.update.receipt.v1";
let pwaUpdateBusy=false;
function pwaBuildMatches(version){
  return document.documentElement.dataset.appBuild===version &&
    window.MICHI_APP_BUILD===version && window.MICHI_PWA_BUILD===version &&
    window.TripCard?.build===version;
}
function pwaUpdateText(message){const status=document.getElementById("pwaDbStatus");if(status)status.textContent=message;}
function pwaWorkerVersion(worker){
  if(!worker)return Promise.resolve(null);
  return new Promise(resolve=>{
    const channel=new MessageChannel();
    const finish=value=>{clearTimeout(timer);channel.port1.close();resolve(value);};
    const timer=setTimeout(()=>finish(null),1800);
    channel.port1.onmessage=event=>finish(event.data?.type==="MICHI_VERSION"?String(event.data.version):null);
    try{worker.postMessage({type:"MICHI_GET_VERSION"},[channel.port2]);}catch(_){finish(null);}
  });
}
async function pwaPublishedVersion(){
  if(navigator.onLine===false)throw Error("offline");
  const url=new URL("./data/version.json",location.href);url.searchParams.set("check",String(Date.now()));
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch(url,{cache:"no-store",signal:controller.signal});
    if(!response.ok)throw Error("version HTTP "+response.status);
    const data=await response.json();
    if(navigator.onLine===false)throw Error("offline");
    if(!/^[0-9]+$/.test(String(data.appVersion||""))||!/^[0-9]+$/.test(String(data.dbVersion||"")))throw Error("invalid version");
    return {appVersion:String(data.appVersion),dbVersion:String(data.dbVersion)};
  }finally{clearTimeout(timer);}
}
async function pwaWaitForController(registration,target){
  const until=Date.now()+60000;
  let checked=null,checkedVersion=null,requested=null;
  while(Date.now()<until){
    const worker=registration.waiting;
    if(worker&&worker!==requested){requested=worker;worker.postMessage({type:"SKIP_WAITING"});}
    const current=navigator.serviceWorker.controller;
    if(current!==checked){checked=current;checkedVersion=await pwaWorkerVersion(current);}
    if(current&&checkedVersion===target&&registration.active===current&&current.state==="activated")return true;
    if(!registration.installing&&!registration.waiting&&registration.active?.state==="activated"&&registration.active===current&&checkedVersion!==target)break;
    await new Promise(resolve=>setTimeout(resolve,150));
  }
  throw Error("published build not controlling this page");
}
async function updateEverything() {
  if (!PWA_HOSTED) {
    alert(`このURLではPWA更新を利用できません。\nPWA ${PWA_APP_VERSION} / DB ${PWA_DEFAULT_DB_VERSION}`);
    return;
  }
  if(pwaUpdateBusy)return;
  const button=document.getElementById("pwaUpdateButton");
  pwaUpdateBusy=true;if(button){button.disabled=true;button.textContent="確認中…";}
  pwaUpdateText("最新版を確認中…");
  try {
    if(!("serviceWorker" in navigator))throw Error("Service Worker unavailable");
    const target=await pwaPublishedVersion();
    let registration=await navigator.serviceWorker.getRegistration("./");
    if(!registration)registration=await navigator.serviceWorker.register("./service-worker.js",{scope:"./",updateViaCache:"none"});
    const current=await pwaWorkerVersion(navigator.serviceWorker.controller);
    if(current===target.appVersion&&pwaBuildMatches(target.appVersion)&&PWA_DEFAULT_DB_VERSION===target.dbVersion){
      pwaUpdateText(`最新版です（PWA ${target.appVersion} / DB ${target.dbVersion}）`);return;
    }
    pwaUpdateText(`PWA ${target.appVersion} を取得・確認中…`);
    if(button)button.textContent="更新中…";
    if(current!==target.appVersion)await registration.update();
    await pwaWaitForController(registration,target.appVersion);
    try{sessionStorage.setItem(PWA_UPDATE_RECEIPT,JSON.stringify(target));}catch(_){}
    pwaUpdateText("更新データの取得完了。再読み込みします…");
    location.reload();
  } catch (error) {
    console.warn("PWA update not confirmed",error);
    pwaUpdateText("更新未確認：通信状態または公開状況を確認して、再度お試しください。");
  } finally {
    pwaUpdateBusy=false;if(button){button.disabled=false;button.textContent="📦 アプリを更新";}
  }
}
async function pwaShowUpdateReceipt(){
  let receipt=null;
  try{receipt=JSON.parse(sessionStorage.getItem(PWA_UPDATE_RECEIPT)||"null");sessionStorage.removeItem(PWA_UPDATE_RECEIPT);}catch(_){}
  if(!receipt)return;
  const controlled=await pwaWorkerVersion(navigator.serviceWorker?.controller);
  if(pwaBuildMatches(receipt.appVersion)&&PWA_DEFAULT_DB_VERSION===receipt.dbVersion&&controlled===receipt.appVersion)
    pwaUpdateText(`更新完了（PWA ${receipt.appVersion} / DB ${receipt.dbVersion}）`);
  else pwaUpdateText("更新未確認：アプリを更新してください。");
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
    await navigator.serviceWorker.register("./service-worker.js", {scope: "./",updateViaCache:"none"});
    await pwaShowUpdateReceipt();
  } catch (error) {
    console.warn("PWAオフライン登録に失敗しました。通常のWeb利用は継続できます。", error);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", readyLocalWeb, {once: true});
} else readyLocalWeb();
setTimeout(finishStartup, 2500);

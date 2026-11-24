/* Stage 6 development UI. Local dataset only; no network upload. */
(function(root){"use strict";
const state={engine:null};root.SugorokuLandUI=state;
document.addEventListener("DOMContentLoaded",()=>{
 const mode=document.getElementById("sugDistanceMode"),opts=document.getElementById("sugEstimateOptions"),file=document.getElementById("sugLandFile"),status=document.getElementById("sugLandStatus");
 if(!mode||!opts||!file||!status)return;
 mode.addEventListener("change",()=>{opts.hidden=mode.value!=="estimated";});
 let generation=0;
 file.addEventListener("change",async()=>{
  const gen=++generation;state.engine=null;const f=file.files[0];if(!f){status.textContent="陸地データ未読み込み";return;}
  status.textContent="陸地データ照合中…";
  try{
   const [text,response]=await Promise.all([f.text(),fetch("./data/land-connections-shimanami.json",{cache:"no-store"})]);
   if(!response.ok)throw Error("接続DB取得失敗");
   const db=await response.json(),lookup=root.LandLookup.create(JSON.parse(text));
   const engine=root.LandDistance.create({lookup,connections:db.connections});
   if(gen!==generation)return;state.engine=engine;status.textContent="試験データ読み込み済み（しまなみ6橋のみ・本州接続未登録）";
  }catch(e){if(gen===generation)status.textContent="読み込み失敗："+String(e.message||e);}
 });
});
})(window);

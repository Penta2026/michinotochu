/* Stage 7: automatic runtime data loader. No location sent to third parties. */
(function(root){"use strict";
const state={engine:null,base:null,tiles:new Map()};root.SugorokuLandUI=state;
const base="./data/land-runtime/";
// Bound both headers and response body; a stuck request must not poison shared promises.
const LOAD_TIMEOUT_MS=12000;
async function json(name){
 const controller=new AbortController();let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error("陸地データの読み込みがタイムアウトしました: "+name+"。通信状態を確認して再抽選してください。"));controller.abort();},LOAD_TIMEOUT_MS);});
 try{return await Promise.race([(async()=>{
  const r=await fetch(base+name,{signal:controller.signal});
  if(!r.ok)throw Error("陸地データ取得失敗: "+name+" (HTTP "+r.status+")");
  return await r.json();
 })(),timeout]);}
 finally{clearTimeout(timer);}
}
let basePromise=null;
async function loadBase(){if(!basePromise)basePromise=Promise.all([json("manifest.json"),json("spots.json"),json("connections.json")]).then(([manifest,spots,connections])=>{
 if(manifest.schemaVersion!==1||Object.keys(spots).length!==manifest.count||!Array.isArray(connections))throw Error("陸地データの形式が不正です");
 const known=new Map();const add=(lat,lng,id)=>{const key=lat+","+lng;if(known.has(key)&&known.get(key)!==id)known.set(key,null);else known.set(key,id);};
 for(const [lat,lng,id] of Object.values(spots))add(lat,lng,id);
 for(const c of connections)for(const p of [c.a,c.b])add(p.lat,p.lng,p.landId);
 return {manifest,known,connections};
 }).catch(e=>{basePromise=null;throw e;});return basePromise;}
state.prepare=async function(origin,extraPoints=[],targetKm=null){
 const b=await loadBase();const key=Math.floor(origin.lng)+"_"+Math.floor(origin.lat);
 if(!b.manifest.tiles.includes(key))throw Error("出発地点の陸地データがありません");
 if(!state.tiles.has(key)){state.tiles.set(key,json(key+".json").then(root.LandLookup.create).catch(e=>{state.tiles.delete(key);throw e;}));}
 const loaded=new Map([[key,await state.tiles.get(key)]]);
 const extraKeys=new Set(extraPoints.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&!b.known.has(p.lat+","+p.lng)).map(p=>Math.floor(p.lng)+"_"+Math.floor(p.lat)).filter(k=>b.manifest.tiles.includes(k)&&k!==key));
 await Promise.all([...extraKeys].map(async k=>{
  if(!state.tiles.has(k))state.tiles.set(k,json(k+".json").then(root.LandLookup.create).catch(e=>{state.tiles.delete(k);throw e;}));
  loaded.set(k,await state.tiles.get(k));
 }));
 const lookup={classify(lat,lng){
 const k=lat+","+lng;if(b.known.has(k)){const id=b.known.get(k);return {status:id?"land":"unclassified",landId:id};}
 const tile=loaded.get(Math.floor(lng)+"_"+Math.floor(lat));if(tile)return tile.classify(lat,lng);
 return {status:"unclassified",landId:null};
 }};
 return root.LandDistance.create({lookup,connections:b.connections,factor:root.LandDistance.factorForTarget(targetKm)});
};
})(window);

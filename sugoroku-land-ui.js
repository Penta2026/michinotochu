/* Stage 7: automatic runtime data loader. No location sent to third parties. */
(function(root){"use strict";
const state={engine:null,base:null,tiles:new Map()};root.SugorokuLandUI=state;
const base="./data/land-runtime/";
async function json(name){const r=await fetch(base+name);if(!r.ok)throw Error("陸地データ取得失敗: "+name);return r.json();}
let basePromise=null;
async function loadBase(){if(!basePromise)basePromise=Promise.all([json("manifest.json"),json("spots.json"),json("connections.json")]).then(([manifest,spots,connections])=>{
 if(manifest.schemaVersion!==1||Object.keys(spots).length!==manifest.count||!Array.isArray(connections))throw Error("陸地データの形式が不正です");
 const known=new Map();const add=(lat,lng,id)=>{const key=lat+","+lng;if(known.has(key)&&known.get(key)!==id)known.set(key,null);else known.set(key,id);};
 for(const [lat,lng,id] of Object.values(spots))add(lat,lng,id);
 for(const c of connections)for(const p of [c.a,c.b])add(p.lat,p.lng,p.landId);
 return {manifest,known,connections};
 }).catch(e=>{basePromise=null;throw e;});return basePromise;}
state.prepare=async function(origin){
 const b=await loadBase();const key=Math.floor(origin.lng)+"_"+Math.floor(origin.lat);
 if(!b.manifest.tiles.includes(key))throw Error("出発地点の陸地データがありません");
 if(!state.tiles.has(key)){state.tiles.set(key,json(key+".json").then(root.LandLookup.create).catch(e=>{state.tiles.delete(key);throw e;}));}
 const tile=await state.tiles.get(key),lookup={classify(lat,lng){
 const k=lat+","+lng;if(b.known.has(k)){const id=b.known.get(k);return {status:id?"land":"unclassified",landId:id};}
 if(Math.floor(lng)+"_"+Math.floor(lat)===key)return tile.classify(lat,lng);
 return {status:"unclassified",landId:null};
 }};
 return root.LandDistance.create({lookup,connections:b.connections});
};
})(window);

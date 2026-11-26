/* Stages 4–5: land graph and conservative estimated road distance. */
(function(root){"use strict";
const rad=Math.PI/180;
function km(a,b){const x=Math.sin((b.lat-a.lat)*rad/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin((b.lng-a.lng)*rad/2)**2;return 12742*Math.asin(Math.sqrt(Math.min(1,x)));}
const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
const BUILD="14";
const vehicles=["50","125","126"];
// The selected trip budget/target, not each individual leg, sets the land factor.
// Keep short trips unchanged; interpolate between agreed calibration points.
const factorPoints=[[50,1.45],[100,1.50],[200,1.60],[300,1.70],[500,1.85],[750,1.90],[1000,2.00]];
function factorForTarget(targetKm){
 if(!Number.isFinite(targetKm)||targetKm<=50)return 1.45;
 for(let i=1;i<factorPoints.length;i++){
  const [hi,hf]=factorPoints[i],[lo,lf]=factorPoints[i-1];
  if(targetKm<=hi)return lf+(hf-lf)*(targetKm-lo)/(hi-lo);
 }
 return 2;
}
function create({lookup,connections,sidecar=null,factor=1.45}){
 if(!lookup?.classify||!Array.isArray(connections)||!Number.isFinite(factor)||factor<1)throw Error("Invalid distance configuration");
 const nodes=[],edges=[],ids=new Set();
 function land(p){if(!valid(p))return null;const r=lookup.classify(p.lat,p.lng);return r.status==="land"?r.landId:null;}
 for(const c of connections){
  if(typeof c.id!=="string"||!c.id||ids.has(c.id)||!["bridge","tunnel"].includes(c.type)||!valid(c.a)||!valid(c.b)||!c.a.landId||!c.b.landId||c.a.landId===c.b.landId||!Array.isArray(c.vehicles)||!c.vehicles.length||c.vehicles.some(v=>!vehicles.includes(v))||!Number.isFinite(c.km)||c.km<km(c.a,c.b)-0.001)throw Error("Invalid connection "+c.id);
  if(land(c.a)!==c.a.landId||land(c.b)!==c.b.landId)throw Error("Connection endpoints do not match land polygons: "+c.id);
  ids.add(c.id);const i=nodes.length;nodes.push(c.a,c.b);edges.push({i,j:i+1,c});
 }
 function estimate(a,b,{vehicle="125",sea="conditional"}={}){
  if(!vehicles.includes(vehicle)||!["conditional","none"].includes(sea))throw Error("Invalid route options");
  const la=land(a),lb=land(b);if(!la||!lb)return null;
  if(sea==="none"&&la!==lb)return null;
  if(la===lb)return {km:km(a,b)*factor,crossings:[],method:"land-factor"};
  const points=[{...a,landId:la},{...b,landId:lb},...nodes],n=points.length;
  const d=Array(n).fill(Infinity),done=Array(n).fill(false),prev=Array(n).fill(null);d[0]=0;
  for(let step=0;step<n;step++){
   let u=-1;for(let i=0;i<n;i++)if(!done[i]&&(u<0||d[i]<d[u]))u=i;
   if(u<0||!Number.isFinite(d[u])||u===1)break;done[u]=true;
   function relax(v,w,id){if(!done[v]&&d[u]+w<d[v]){d[v]=d[u]+w;prev[v]={u,id};}}
   for(let v=0;v<n;v++)if(v!==u&&points[u].landId===points[v].landId)relax(v,km(points[u],points[v])*factor,null);
   for(const e of edges)if(e.c.vehicles.includes(vehicle)){if(u===e.i+2)relax(e.j+2,e.c.km,e.c.id);if(u===e.j+2)relax(e.i+2,e.c.km,e.c.id);}
  }
  if(!Number.isFinite(d[1]))return null;
  const crossings=[];for(let i=1;i!==0;){const p=prev[i];if(!p)return null;if(p.id)crossings.unshift(p.id);i=p.u;}
  return {km:Math.max(km(a,b),d[1]),crossings,method:"connection-graph"};
 }
 function itinerary(origin,points,opts){let total=0,previous=origin;const sections=[];for(const point of points){const s=estimate(previous,point,opts);if(!s)return null;total+=s.km;sections.push(s);previous=point;}return {km:total,sections};}
 return Object.freeze({estimate,itinerary,land});
}
const api={build:BUILD,create,km,factorForTarget};if(typeof module==="object"&&module.exports)module.exports=api;else root.LandDistance=api;
})(typeof globalThis!=="undefined"?globalThis:this);

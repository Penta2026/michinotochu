/* Land polygon lookup: WGS84 GeoJSON [longitude, latitude].
 * No nearest-island fallback. Unknown is never treated as a shared land ID.
 */
(function(root){
"use strict";
const EPS=1e-10;
function position(p){return Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90;}
function ringStatus(x,y,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [ax,ay]=ring[j],[bx,by]=ring[i];
  const dx=bx-ax,dy=by-ay;
  if(Math.abs(dx)+Math.abs(dy)>EPS&&Math.abs((x-ax)*dy-(y-ay)*dx)<=EPS*Math.max(1,Math.abs(dx)+Math.abs(dy))&&x>=Math.min(ax,bx)-EPS&&x<=Math.max(ax,bx)+EPS&&y>=Math.min(ay,by)-EPS&&y<=Math.max(ay,by)+EPS)return 0;
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside?1:-1;
}
function polygonStatus(x,y,rings){
 const outer=ringStatus(x,y,rings[0]);if(outer!==1)return outer;
 for(const hole of rings.slice(1)){const h=ringStatus(x,y,hole);if(h===0)return 0;if(h===1)return -1;}
 return 1;
}
function bounds(rings){
 let box=[Infinity,Infinity,-Infinity,-Infinity];
 for(const ring of rings){
  if(!Array.isArray(ring)||ring.length<4||!ring.every(position)||ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw Error("Invalid closed polygon ring");
  for(const [x,y] of ring){box=[Math.min(box[0],x),Math.min(box[1],y),Math.max(box[2],x),Math.max(box[3],y)];}
 }
 return box;
}
function create(collection){
 if(collection?.type!=="FeatureCollection"||!Array.isArray(collection.features))throw Error("FeatureCollection required");
 const tiles=new Map(), polygons=[];
 for(const f of collection.features){
  const id=f.properties?.landId;
  if(typeof id!=="string"||!id.trim())throw Error("Stable landId required");
  const g=f.geometry;
  const parts=g?.type==="Polygon"?[g.coordinates]:g?.type==="MultiPolygon"?g.coordinates:null;
  if(!parts?.length)throw Error("Polygon or MultiPolygon required");
  for(const rings of parts){
   if(!rings?.length)throw Error("Empty polygon");
   const box=bounds(rings);
   if(box[2]-box[0]>180)throw Error("Split antimeridian polygons before loading");
   const n=polygons.length;polygons.push({id,rings,box});
   for(let x=Math.floor(box[0]);x<=Math.floor(box[2]);x++)for(let y=Math.floor(box[1]);y<=Math.floor(box[3]);y++){
    const key=x+","+y;if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push(n);
   }
  }
 }
 function classify(lat,lng){
  if(typeof lat!=="number"||typeof lng!=="number"||!position([lng,lat]))return {landId:null,status:"invalid"};
  const inside=new Set(),boundary=new Set();
  for(const i of tiles.get(Math.floor(lng)+","+Math.floor(lat))||[]){
   const p=polygons[i],b=p.box;
   if(lng<b[0]-EPS||lng>b[2]+EPS||lat<b[1]-EPS||lat>b[3]+EPS)continue;
   const s=polygonStatus(lng,lat,p.rings);if(s===1)inside.add(p.id);if(s===0)boundary.add(p.id);
  }
  if(boundary.size)return {landId:null,status:"boundary",candidates:[...new Set([...inside,...boundary])].sort()};
  if(inside.size>1)return {landId:null,status:"ambiguous",candidates:[...inside].sort()};
  if(inside.size===1)return {landId:[...inside][0],status:"land"};
  return {landId:null,status:"unclassified"};
 }
 function classifyAll(spots){
  if(!Array.isArray(spots))throw Error("Spot array required");
  return spots.map(s=>({...s,...(()=>{const r=classify(s.lat,s.lng);return {landId:r.landId,landStatus:r.status};})()}));
 }
 return Object.freeze({classify,classifyAll,polygonCount:polygons.length});
}
const api=Object.freeze({create});
if(typeof module==="object"&&module.exports)module.exports=api;else root.LandLookup=api;
})(typeof globalThis!=="undefined"?globalThis:this);

/* Stage 3: sidecar build; never edit the source spot database. */
(function(root){
"use strict";
function build(data,lookup,metadata={}){
 if(!Array.isArray(data?.roads)||!Array.isArray(data?.landmarks))throw Error("Invalid APP_DATA");
 const entries=Object.create(null),review=[],counts={land:0,boundary:0,ambiguous:0,unclassified:0,invalid:0};
 for(const [kind,spots] of [["road",data.roads],["spot",data.landmarks]])for(const s of spots){
  if(typeof s.id!=="string"||!s.id||Object.hasOwn(entries,s.id))throw Error("Missing or duplicate spot ID: "+s.id);
  const r=lookup.classify(s.lat,s.lng);
  if(!Object.hasOwn(counts,r.status))throw Error("Unexpected classification");
  counts[r.status]++;
  entries[s.id]={lat:s.lat,lng:s.lng,landId:r.status==="land"?r.landId:null,status:r.status};
  if(r.status!=="land")review.push({id:s.id,kind,name:s.name,lat:s.lat,lng:s.lng,status:r.status,candidates:r.candidates||[]});
 }
 return {schemaVersion:1,metadata,total:Object.keys(entries).length,counts,entries,review};
}
function get(sidecar,spot){
 const r=sidecar?.entries?.[spot?.id];
 return r&&r.lat===spot.lat&&r.lng===spot.lng&&r.status==="land"?r.landId:null;
}
const api={build,get};
if(typeof module==="object"&&module.exports)module.exports=api;else root.LandSidecar=api;
})(typeof globalThis!=="undefined"?globalThis:this);

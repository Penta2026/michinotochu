/* Shared distance filtering for destination and later gacha modes. */
(function(root){"use strict";
function band(origin,points,target,tolerance,engine,opts={}){
 if(!Number.isFinite(target)||target<=0||!Number.isFinite(tolerance)||tolerance<0)throw Error("Invalid distance band");
 const low=Math.max(0,target-tolerance),high=target+tolerance;
 return points.flatMap(p=>{const e=engine.estimate(origin,p,opts);return e&&Number.isFinite(e.km)&&e.km>=low&&e.km<=high?[{...p,d:e.km,estimate:e}]:[];});
}
function within(origin,points,limit,engine,opts={}){
 if(!Number.isFinite(limit)||limit<=0)throw Error("Invalid distance limit");
 return band(origin,points,limit/2,limit/2,engine,opts);
}
const api={band,within};if(typeof module==="object"&&module.exports)module.exports=api;else root.DistanceGacha=api;
})(typeof globalThis!=="undefined"?globalThis:this);

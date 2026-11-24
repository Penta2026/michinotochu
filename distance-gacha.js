/* Shared distance filtering for destination and later gacha modes. */
(function(root){"use strict";
function band(origin,points,target,tolerance,engine,opts={}){
 if(!Number.isFinite(target)||target<=0||!Number.isFinite(tolerance)||tolerance<0)throw Error("Invalid distance band");
 const low=Math.max(0,target-tolerance),high=target+tolerance;
 return points.flatMap(p=>{const e=engine.estimate(origin,p,opts);return e&&Number.isFinite(e.km)&&e.km>=low&&e.km<=high?[{...p,d:e.km,estimate:e}]:[];});
}
const api={band};if(typeof module==="object"&&module.exports)module.exports=api;else root.DistanceGacha=api;
})(typeof globalThis!=="undefined"?globalThis:this);

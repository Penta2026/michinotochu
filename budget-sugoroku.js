/* Stage 6: budget-aware sugoroku; existing forward corridor is retained. */
(function(root){"use strict";
function plan(origin,stations,limit,count,engine,route,opts={},random=Math.random){
 if(!Number.isFinite(limit)||limit<=0||!engine||!route)throw Error("Invalid budget planner");
 count=Math.max(1,Math.min(6,Math.floor(count)||1));
 const cache=new Map(),cost=(a,b)=>{const key=[a.lat,a.lng,b.lat,b.lng].join(",");if(!cache.has(key))cache.set(key,engine.estimate(a,b,opts));return cache.get(key);};
 const goals=stations.filter(s=>route.haversine(origin,s)>=1&&route.haversine(origin,s)<=limit).map(s=>({s,e:cost(origin,s)})).filter(x=>x.e&&x.e.km<=limit);
 const shuffle=a=>a.map(x=>({x,r:random()})).sort((a,b)=>a.r-b.r).map(v=>v.x);
 const ordered=[...shuffle(goals.filter(x=>x.e.km>=limit*.65)),...shuffle(goals.filter(x=>x.e.km<limit*.65))];
 for(const {s:goal,e} of ordered){
  const candidates=route.corridor(origin,goal,stations).filter(x=>route.haversine(origin,x.station)<=limit);
  // DP keeps minimum estimated distance for each count and last station.
  const n=candidates.length,dp=Array.from({length:count},()=>Array(n).fill(null));
  for(let k=1;k<count;k++)for(let j=0;j<n;j++){
   const b=candidates[j].station;
   if(k===1){const c=cost(origin,b);if(c&&c.km<=limit)dp[k][j]={km:c.km,points:[b]};}
   else for(let i=0;i<j;i++){const p=dp[k-1][i];if(!p||candidates[j].progress-candidates[i].progress<.012)continue;const c=cost(candidates[i].station,b);if(c&&p.km+c.km<=limit&&(!dp[k][j]||p.km+c.km<dp[k][j].km))dp[k][j]={km:p.km+c.km,points:[...p.points,b]};}
  }
  for(let k=count-1;k>=1;k--){let best=null;for(let j=0;j<n;j++){const p=dp[k][j];if(!p)continue;const c=cost(candidates[j].station,goal);if(c&&p.km+c.km<=limit&&(!best||p.km+c.km<best.km))best={km:p.km+c.km,points:[...p.points,goal]};}if(best)return {...best,goal,estimate:engine.itinerary(origin,best.points,opts)};}
  return {km:e.km,points:[goal],goal,estimate:engine.itinerary(origin,[goal],opts)};
 }
 return null;
}
const api={plan};if(typeof module==="object"&&module.exports)module.exports=api;else root.BudgetSugoroku=api;
})(typeof globalThis!=="undefined"?globalThis:this);

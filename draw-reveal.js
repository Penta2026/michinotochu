/* Local-only draw reveal; presentation never changes the selected route. */
(function(root){"use strict";
 const dots={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
 const finalAngles={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
 function dice(face){
  const f=Number(face);if(!Number.isInteger(f)||f<1||f>6)throw Error("Invalid dice face");
  const [x,y]=finalAngles[f];
  return '<div class="draw-dice-scene"><div class="draw-dice" data-face="'+f+'" style="--end-x:'+(720+x)+'deg;--end-y:'+(1080+y)+'deg">'+
   Object.keys(dots).map(n=>'<div class="draw-face face-'+n+'">'+dots[n].map(i=>'<i style="--pip:'+i+';grid-area:'+Math.ceil(i/3)+' / '+((i-1)%3+1)+'"></i>').join("")+'</div>').join("")+'</div><div class="draw-shadow"></div></div>';
 }
 function capsule(){
  return '<div class="draw-gacha-scene"><div class="draw-machine"><div class="draw-machine-top">行先 GACHA</div><div class="draw-globe">'+Array.from({length:9},(_,i)=>'<i class="draw-ball b'+i+'"></i>').join("")+'</div><div class="draw-machine-base"><div class="draw-knob"></div><div class="draw-slot"></div></div></div><div class="draw-capsule"><div class="draw-cap-top"></div><div class="draw-ticket">★</div><div class="draw-cap-bottom"></div></div></div>';
 }
 async function play(container,kind,options={}){
  if(!container)return;
  const reduced=root.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const duration=reduced?160:kind==="dice"?1700:1900;
  const wrap=document.createElement("div");wrap.className="draw-reveal "+(kind==="dice"?"draw-reveal-dice":"draw-reveal-gacha");wrap.setAttribute("data-draw-kind",kind);wrap.setAttribute("role","status");wrap.setAttribute("aria-live","polite");
  const visual=document.createElement("div");visual.setAttribute("aria-hidden","true");visual.innerHTML=kind==="dice"?dice(options.face):capsule();
  const label=document.createElement("div");label.className="draw-label";label.textContent=kind==="dice"?(options.random?"サイコロを振っています…":"道の駅を選んでいます…"):"ガチャを回しています…";
  wrap.append(visual,label);container.classList.remove("empty");container.replaceChildren(wrap);
  if(kind==="dice"){const note=document.createElement("div");note.className="draw-count-note";note.textContent=options.random?"出目は道の駅数の上限になります":"指定駅数の演出です";wrap.append(note);}
  await new Promise(resolve=>setTimeout(resolve,duration));
  if(container.contains(wrap))label.textContent=kind==="dice"?"出目 "+options.face+" ／ 道の駅数の上限 "+options.face+"駅":"今回の行先が決まりました！";
  // Short final hold, including reduced-motion users. Old requests cannot render results.
  await new Promise(resolve=>setTimeout(resolve,reduced?40:260));
 }
 root.DrawReveal=Object.freeze({play});
})(window);

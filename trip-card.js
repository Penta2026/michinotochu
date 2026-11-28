/* Travel card: entirely local Canvas artwork; no remote assets or trip upload. */
(function(){
"use strict";
const BUILD="16";
// A local, approved countryside illustration; all text is rendered by Canvas.
const artwork=new Image();
const ready=new Promise(resolve=>{artwork.onload=()=>resolve(true);artwork.onerror=()=>resolve(false);artwork.src="./assets/trip-card-detour.jpg";});
function artworkAvailable(){return artwork.complete&&artwork.naturalWidth>0;}
function modeTitle(data){return data.mode==="sug"?"道の駅すごろく":"行先ガチャ";}
const palettes={
 road:{label:"道の駅",sky:"#dce9df",far:"#adc1b2",mid:"#819e85",near:"#4b7560",ground:"#a9b88c",accent:"#47745d"},
 sea:{label:"海",sky:"#d8edf0",far:"#a5c8cc",mid:"#72a8ad",near:"#427982",ground:"#a2b7a5",accent:"#397d87"},
 mountain:{label:"山・自然",sky:"#dce8e5",far:"#b3c8c4",mid:"#789c92",near:"#3e7065",ground:"#97ae86",accent:"#3d7163"},
 cafe:{label:"カフェ",sky:"#f0e3cf",far:"#cebaa0",mid:"#ad9f87",near:"#766e59",ground:"#b5ae88",accent:"#906e48"},
 spot:{label:"観光スポット",sky:"#e4e9e0",far:"#bfc8b8",mid:"#8eaa98",near:"#537568",ground:"#afbd9b",accent:"#537568"},
 season:{label:"季節スポット",sky:"#f0e1d5",far:"#d2bdaf",mid:"#b79882",near:"#7c8870",ground:"#c5b59b",accent:"#9e705a"},
 detour:{label:"寄り道",sky:"#e5e9d7",far:"#c0cab0",mid:"#99ae8a",near:"#587963",ground:"#b0bd83",accent:"#677b43"},
 other:{label:"スポット",sky:"#dce9e7",far:"#b3c7c4",mid:"#8aa8a0",near:"#4f796a",ground:"#a4b89b",accent:"#4f796a"}
};
const missions={normal:"ナビあり。",radar:"レーダーで。",none:"ナビなし。"};
function theme(g){
 const kind=String(g.kind||""),f=String(g.featureCategory||""),t=String(g.category||"")+" "+String(g.name||"");
 if(kind==="道の駅"||f==="road_station")return "road";
 if(/カフェ/.test(kind))return "cafe";
 if(f==="sea"||/海岸|海水浴|岬|海浜|砂浜|展望.*海/.test(t))return "sea";
 if(/^(nature|mountain)$/.test(f)||/高原|山頂|峠|渓谷|登山|滝/.test(t))return "mountain";
 if(/桜|紅葉|花畑|ひまわり|梅園|雪景色/.test(t))return "season";
 if(/寄り道/.test(kind))return "detour";
 if(/スポット/.test(kind)||/history|shrine|museum|park|construction|view/.test(f))return "spot";
 return "other";
}
const ink="#24463e",paper="#f9f6ed",muted="#587166",line="#d7ded0";
const sans='"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif';
const serif='"Noto Serif JP","Hiragino Mincho ProN","Yu Mincho",serif';
function font(c,size,weight=400,family=sans){c.font=weight+" "+size+"px "+family;c.textBaseline="top";}
function txt(c,s,x,y,size=28,color=ink,weight=500,family=sans){font(c,size,weight,family);c.fillStyle=color;c.fillText(String(s),x,y);}
function rect(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect?c.roundRect(x,y,w,h,r):c.rect(x,y,w,h);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
function path(c,points,fill,stroke,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(fill){c.closePath();c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();}}
function circle(c,x,y,r,fill,stroke,w=2){c.beginPath();c.arc(x,y,r,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();}}
function wrap(c,value,width){const rows=[];let row="";for(const ch of Array.from(String(value||"").replace(/\s+/g," ").trim())){if(row&&c.measureText(row+ch).width>width){rows.push(row);row=ch;}else row+=ch;}if(row)rows.push(row);return rows;}
function fit(c,value,width,maxLines,preferred,min=18,weight=500){let size=preferred,rows=[];for(;size>=min;size-=2){font(c,size,weight);rows=wrap(c,value,width);if(rows.length<=maxLines)return {size,rows};}size=min;font(c,size,weight);rows=wrap(c,value,width);if(rows.length>maxLines){rows=rows.slice(0,maxLines);let last=rows[maxLines-1];while(last&&c.measureText(last+"…").width>width)last=last.slice(0,-1);rows[maxLines-1]=last+"…";}return {size,rows};}
function block(c,value,x,y,w,maxLines,size,min,weight=500,color=ink){const f=fit(c,value,w,maxLines,size,min,weight);for(let i=0;i<f.rows.length;i++)txt(c,f.rows[i],x,y+i*f.size*1.32,f.size,color,weight);return f.rows.length*f.size*1.32;}
function rule(c,x,y,w){path(c,[[x,y],[x+w,y]],null,line,2);}
function icon(c,key,x,y,size,color=ink){c.save();c.translate(x,y);c.scale(size/48,size/48);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2.8;c.lineCap="round";c.lineJoin="round";
 if(key==="normal"){path(c,[[5,9],[17,5],[31,10],[43,6],[43,38],[31,42],[17,37],[5,41],[5,9]],null,color,2.5);path(c,[[17,5],[17,37]],null,color,2);path(c,[[31,10],[31,42]],null,color,2);path(c,[[10,28],[23,17],[35,25]],null,color,3);circle(c,35,25,3,color);}
 else if(key==="radar"){[8,15,22].forEach(r=>circle(c,24,24,r,null,color,2));path(c,[[24,24],[39,9]],null,color,3);circle(c,32,19,3,color);}
 else if(key==="none"){circle(c,24,24,20,null,color,2.5);path(c,[[30,10],[28,28],[10,34],[20,20],[30,10]],color);circle(c,24,24,2,paper);}
 else if(key==="road"){path(c,[[4,21],[24,5],[44,21]],null,color,3);path(c,[[9,18],[9,42],[39,42],[39,18]],null,color,3);path(c,[[20,42],[20,28],[29,28],[29,42]],null,color,2);}
 else if(key==="sea"){for(let j=0;j<3;j++){c.beginPath();c.moveTo(4,17+j*10);for(let i=0;i<4;i++)c.quadraticCurveTo(9+i*10,10+j*10,14+i*10,17+j*10);c.stroke();}circle(c,35,8,4,color);}
 else if(key==="mountain"){path(c,[[3,40],[20,10],[30,27],[36,17],[45,40],[3,40]],null,color,3);path(c,[[15,19],[20,23],[25,19]],null,color,2);}
 else if(key==="cafe"){rect(c,7,12,28,23,5,null,color);c.beginPath();c.arc(35,22,8,-Math.PI/2,Math.PI/2);c.stroke();path(c,[[4,40],[43,40]],null,color,3);}
 else if(key==="season"){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;circle(c,24+11*Math.cos(a),24+11*Math.sin(a),8,null,color,2.4);}circle(c,24,24,4,color);}
 else if(key==="detour"){path(c,[[24,43],[24,22],[8,6]],null,color,4);path(c,[[24,22],[40,6]],null,color,4);path(c,[[8,17],[8,6],[19,6]],null,color,3);path(c,[[29,6],[40,6],[40,17]],null,color,3);}
 else{c.beginPath();c.moveTo(24,44);c.bezierCurveTo(4,25,2,19,9,9);c.bezierCurveTo(17,-1,32,-1,39,9);c.bezierCurveTo(46,19,44,25,24,44);c.stroke();circle(c,24,16,6,null,color,2.5);}
 c.restore();}
function bike(c,x,y,scale){c.save();c.translate(x,y);c.scale(scale,scale);const dark="#253e3b",tire="#263937",metal="#d4d9cb";
 for(const [wx,wy] of [[38,100],[160,100]]){circle(c,wx,wy,28,tire);circle(c,wx,wy,19,"#879a90");circle(c,wx,wy,14,dark);circle(c,wx,wy,4,metal);for(let i=0;i<6;i++){const a=i*Math.PI/3;path(c,[[wx,wy],[wx+18*Math.cos(a),wy+18*Math.sin(a)]],null,"#a8b7aa",1.3);}}
 path(c,[[38,100],[71,62],[104,98],[38,100],[94,48],[132,55],[104,98],[160,100],[142,39]],null,dark,7);
 path(c,[[152,100],[135,43],[149,35]],null,"#526b62",6);
 rect(c,78,72,34,28,5,dark);rect(c,82,77,24,17,3,"#74877b");path(c,[[47,71],[58,48],[97,43],[115,55],[95,69],[72,65]],dark);
 rect(c,36,44,48,10,4,dark);rect(c,16,28,39,28,4,dark);rect(c,20,31,31,8,2,"#657e70");
 path(c,[[136,39],[149,30],[160,33]],null,dark,4);circle(c,149,46,8,"#f3dfb5",dark,2);path(c,[[145,32],[139,15],[130,15]],null,dark,3);
 path(c,[[27,104],[8,114]],null,dark,3);c.restore();}
function scenery(c,x,y,w,h,key){
 const p=palettes[key];c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x,y);c.scale(w/1000,h/540);
 let grad=c.createLinearGradient(0,0,0,540);grad.addColorStop(0,p.sky);grad.addColorStop(1,"#f5ead4");c.fillStyle=grad;c.fillRect(0,0,1000,540);circle(c,760,105,46,"#f8edd3");
 const ridges=[[0,265],[120,180],[230,235],[340,120],[465,224],[550,153],[660,240],[790,145],[1000,230],[1000,540],[0,540]];
 path(c,ridges,p.far);
 path(c,[[0,315],[100,243],[230,300],[360,215],[465,267],[560,220],[720,310],[830,237],[1000,296],[1000,540],[0,540]],p.mid);
 if(key==="sea"){c.fillStyle="#82b3b6";c.fillRect(0,291,1000,249);path(c,[[0,310],[210,301],[330,313],[520,304],[730,312],[1000,301]],null,"#e0eee5",3);for(let i=0;i<9;i++){const yy=330+i*17;path(c,[[460+(i%3)*40,yy],[875+(i%2)*70,yy]],null,"#b8d5d1",2);} }
 else{path(c,[[0,320],[180,282],[350,349],[560,270],[780,320],[1000,265],[1000,540],[0,540]],p.near);}
 path(c,[[0,385],[160,330],[320,375],[470,345],[620,407],[820,365],[1000,395],[1000,540],[0,540]],p.ground);
 if(key==="road"||key==="cafe"||key==="spot"){
  const bx=key==="cafe"?650:704,by=343;rect(c,bx,by-65,134,76,2,"#e9e3d0");path(c,[[bx-13,by-65],[bx+60,by-110],[bx+147,by-65]],p.near);
  rect(c,bx+13,by-50,32,29,2,"#86a5a0");rect(c,bx+59,by-50,30,62,2,"#6e877b");rect(c,bx+101,by-50,22,29,2,"#86a5a0");
 }
 // A winding road, kept entirely generic and free of location names.
 c.beginPath();c.moveTo(0,540);c.bezierCurveTo(280,450,545,458,568,397);c.bezierCurveTo(588,351,440,340,450,309);c.lineTo(474,309);c.bezierCurveTo(457,340,642,352,634,407);c.bezierCurveTo(625,472,410,485,250,540);c.closePath();c.fillStyle="#eae5d5";c.fill();
 c.beginPath();c.moveTo(124,540);c.bezierCurveTo(340,473,575,461,603,403);c.bezierCurveTo(615,354,450,344,462,311);c.strokeStyle="#b4b6a5";c.lineWidth=3;c.setLineDash([15,11]);c.stroke();c.setLineDash([]);
 for(let i=0;i<12;i++){const xx=38+i*26,yy=401-i*1.1;path(c,[[xx,yy],[xx-5,yy-14],[xx,yy-10],[xx+5,yy-21]],null,p.near,2);}
 for(const [xx,yy,k] of [[25,385,1.3],[62,371,1],[930,390,1.2],[978,370,1.4]]){path(c,[[xx,yy-55*k],[xx-22*k,yy-5],[xx-10*k,yy-5],[xx-26*k,yy+12],[xx+26*k,yy+12],[xx+10*k,yy-5],[xx+22*k,yy-5]],p.near);}
 bike(c,100,365,1.25);c.restore();}
// Every route stop is included in order. Compact exceptionally long names before
// falling back to an explicit omission notice; there is no arbitrary five-stop slice.
function viaLayout(c,via,width){
 const stops=(Array.isArray(via)?via:[]).map(v=>String(v||"").trim()).filter(Boolean);
 if(!stops.length)return {size:30,rows:["なし"],shortened:false,count:0};
 const joined=stops.join(" → ");
 for(let size=34;size>=18;size-=2){
  font(c,size,500);const rows=wrap(c,joined,width);
  if(rows.length<=4)return {size,rows,shortened:false,count:stops.length};
 }
 for(let limit=Math.max(...stops.map(s=>Array.from(s).length));limit>=3;limit--){
  const short=stops.map(s=>Array.from(s).length>limit?Array.from(s).slice(0,limit-1).join("")+"…":s).join(" → ");
  font(c,18,500);const rows=wrap(c,short,width);
  if(rows.length<=4)return {size:18,rows,shortened:true,count:stops.length};
 }
 const f=fit(c,joined,width,4,18,18,500);
 return {...f,shortened:true,count:stops.length};
}
const green="#347521",forest="#244b26",cream="#fffaf0",pale="#e9f1d8";
function fieldIcon(c,key,x,y,size){
 if(key==="goal"){icon(c,"other",x,y,size,green);return;}
 if(key==="address"){icon(c,"road",x,y,size,green);return;}
 if(key==="via"){icon(c,"detour",x,y,size,green);return;}
 c.save();c.translate(x,y);c.scale(size/48,size/48);
 if(key==="desc"){rect(c,8,4,32,40,5,null,green);for(let i=0;i<3;i++)path(c,[[15,14+9*i],[33,14+9*i]],null,green,3);}
 if(key==="flag"){path(c,[[9,44],[9,5]],null,green,4);path(c,[[10,6],[37,8],[30,18],[37,26],[10,23]],green);}
 if(key==="distance"){c.beginPath();c.arc(24,32,19,Math.PI,2*Math.PI);c.lineWidth=4;c.strokeStyle=green;c.stroke();path(c,[[24,32],[35,18]],null,green,3);circle(c,24,32,4,green);}
 c.restore();
}
function infoPanel(c,data,x,y,w,h){
 const g=data.goal||{};
 c.save();c.translate(x,y);c.scale(w/1024,h/1000);
 function box(y,h){rect(c,0,y,1024,h,25,cream,"#8ba977");}
 function label(key,value,y){fieldIcon(c,key,17,y,45);txt(c,value,75,y+6,27,forest,700);}
 box(0,94);label("goal","目的地",17);
 block(c,g.name||"名称未登録",220,12,775,2,31,22,700,forest);
 box(104,78);label("address","住所",120);
 block(c,g.address||"住所未登録",220,115,775,2,25,18,500,forest);
 box(192,244);label("desc","説明",204);
 const value=data.mode==="sug"?data.stationMission:data.destMission;
 const showMission=data.mode==="sug"||data.mode==="dest";
 const station=typeof value==="string"&&value.trim()?value:"未保存（以前の旅）";
 block(c,g.summary||"説明未登録",24,252,976,showMission?3:5,28,21,400,forest);
 if(showMission){rect(c,15,367,994,57,16,pale);block(c,(data.mode==="sug"&&station!=="ミッションなし"&&value?"全駅共通ミッション：":"ミッション：")+station,28,373,968,2,21,18,700,forest);}
 box(446,275);label("via","経由地",458);
 const route=viaLayout(c,data.via,960);
 if(route.shortened)txt(c,"一部省略・全"+route.count+"件",690,469,20,muted,500);
 for(let i=0;i<route.rows.length;i++)txt(c,route.rows[i],28,512+i*46,route.size,forest,500);
 box(731,104);label("flag","追加ミッション",752);
 const m=Object.prototype.hasOwnProperty.call(missions,data.mission)?missions[data.mission]:null;
 if(m){icon(c,data.mission,405,755,56,green);txt(c,m,480,756,36,forest,700);}
 else txt(c,"未設定",405,762,30,muted,500);
 box(845,108);label("distance","総走行距離",865);
 txt(c,"（推定）",76,905,20,muted,500);
 const km=Number.isFinite(data.estimatedKm)&&data.estimatedKm>=0?"約 "+data.estimatedKm.toFixed(1)+" km":"未計算";
 block(c,km,405,870,585,1,40,24,700,forest);
 // Leave the lower margin free of dynamic data.
 path(c,[[0,979],[180,970],[390,985],[610,971],[860,982],[1024,968],[1024,1000],[0,1000]],"#d5e8a9");
 c.restore();
}
function draw(canvas,data){
 const w=1080,h=1350;
 canvas.width=w;canvas.height=h;const c=canvas.getContext("2d");if(!c)throw Error("Canvas unavailable");
 const key=theme(data.goal||{});
 c.fillStyle=cream;c.fillRect(0,0,w,h);
 if(artworkAvailable())c.drawImage(artwork,0,0,w,330);
 else scenery(c,0,0,w,330,key);
 rect(c,28,20,modeTitle(data)==="道の駅すごろく"?440:300,70,24,"#234c2eea");
 txt(c,modeTitle(data),50,33,43,"#fff",700);
 rect(c,10,318,1060,1022,32,cream,"#a9c184");
 infoPanel(c,data,28,335,1024,1000);
 return canvas;
}
function open(data,modal){
 modal('<div class="trip-card-dialog"><h2>旅カード</h2><p class="meta">目的地と旅程を画像に。出発地点・日付は入りません。</p><canvas id="tripCardCanvas" aria-label="旅カードのプレビュー"></canvas><p id="tripCardStatus" role="status"></p><div class="trip-card-actions"><button id="tripCardSave" type="button" disabled>PNG保存</button><button id="tripCardShare" type="button" disabled>共有する</button></div></div>');
 const el=id=>document.getElementById(id),canvas=el("tripCardCanvas"),save=el("tripCardSave"),share=el("tripCardShare"),status=el("tripCardStatus");let blob=null,seq=0;
 function filename(){return modeTitle(data)+"_"+String(data.goal.name||"旅").replace(/[\\/:*?"<>|]/g,"_").slice(0,60)+"_1080x1350.png";}
 function file(){return new File([blob],filename(),{type:"image/png"});}
 function canShare(){try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file()]}));}catch(_){return false;}}
 async function refresh(){
  const ticket=++seq;blob=null;save.disabled=share.disabled=true;
  status.textContent="画像を生成中…";
  try{const loaded=await ready;if(ticket!==seq||!canvas.isConnected)return;draw(canvas,data);canvas.toBlob(b=>{if(ticket!==seq||!canvas.isConnected)return;if(!b){status.textContent="画像を作成できませんでした。";return;}blob=b;save.disabled=false;share.disabled=!canShare();status.textContent=canvas.width+" × "+canvas.height+" px"+(!loaded?" ／ 背景画像未読込・簡易表示":"")+(share.disabled?" ／ 画像保存からSNSに投稿できます":"");},"image/png");}catch(e){status.textContent="画像を作成できませんでした："+e.message;}
 }
 save.onclick=()=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);};
 share.onclick=async()=>{if(!blob||!canShare())return;try{await navigator.share({files:[file()],title:modeTitle(data)});}catch(e){if(e.name!=="AbortError")status.textContent="共有できませんでした。PNG保存をご利用ください。";}};
 refresh();
}
window.TripCard=Object.freeze({build:BUILD,draw,open,theme,ready,artworkAvailable,viaLayout,modeTitle});
})();

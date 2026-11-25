/* Travel card: entirely local Canvas artwork; no remote assets or trip upload. */
(function(){
"use strict";
const BUILD="10";
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
const missions={normal:"ナビ使用可",radar:"レーダー使用",none:"ナビなし"};
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
// Shared image template. All labels and selected icons remain live Canvas content.
const TEMPLATE_URL="trip-card-template.webp?v=10";
let template=null,loading=null;
function ready(){
 if(template)return Promise.resolve(template);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{if(image.naturalWidth!==1080||image.naturalHeight!==1350){loading=null;reject(Error("旅カード画像のサイズが不正です"));return;}template=image;resolve(image);};
  image.onerror=()=>{loading=null;reject(Error("旅カードの背景画像を読み込めません。通信状態を確認し、アプリを更新してください。"));};
  image.src=TEMPLATE_URL;
 });
 return loading;
}
function field(c,value,x,y,w,h,maxLines,preferred,min,weight,color,align="left"){
 const f=fit(c,value,w,maxLines,preferred,min,weight);
 const rowH=f.size*1.20,top=y+Math.max(0,(h-f.rows.length*rowH)/2);
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 for(let i=0;i<f.rows.length;i++){
  font(c,f.size,weight);
  const xx=align==="center"?x+(w-c.measureText(f.rows[i]).width)/2:x;
  txt(c,f.rows[i],xx,top+i*rowH,f.size,color,weight);
 }
 c.restore();
}
function viaField(c,via,x,y,w,h){
 if(!via.length)return;
 // No circles, arrows, or pre-printed placeholders: names only in visit order.
 // Two columns, row-major order for 3–5 stops; full width for 1–2 stops.
 const cols=via.length>=3?2:1,rows=Math.ceil(via.length/cols),gap=16,cw=(w-(cols-1)*gap)/cols,rh=h/rows;
 via.forEach((name,i)=>field(c,name,x+(i%cols)*(cw+gap),y+Math.floor(i/cols)*rh,cw,rh,2,via.length>=3?20:25,14,600,ink));
}
function drawPortrait(c,data,g,key,via,mission,hasDistance){
 c.save();c.scale(1080/1100,1350/1375);
 c.drawImage(template,0,0,1100,1375);
 // Mask the original illustration inside the badge while retaining its double outline.
 path(c,[[150,320],[257,382],[257,535],[150,593],[42,535],[42,382]],"#f6f1df");
 icon(c,key,94,378,112,palettes[key].accent);
 field(c,palettes[key].label,50,506,200,49,2,29,22,700,ink,"center");
 // Name / address / description use the existing printed, empty boxes.
 field(c,g.name||"名称未登録",428,337,585,72,2,49,26,700,"#fffdf3","center");
 field(c,g.address||"住所未登録",432,434,590,44,2,26,17,600,ink);
 if(g.summary)field(c,g.summary,432,523,607,90,4,25,17,400,ink);
 viaField(c,via,432,661,607,92);
 // The fixed compass in the source artwork is covered, then replaced with the actual mission icon.
 path(c,[[708,800],[809,800],[784,864],[700,864],[689,855],[689,838]],"#144b32");
 if(mission)icon(c,data.mission,714,807,51,"#fffdf3");
 if(hasDistance){
  txt(c,"推定走行距離",434,806,16,ink,600);
  field(c,"約 "+data.estimatedKm.toFixed(1)+" km",420,824,222,37,1,29,18,700,ink,"center");
 }
 if(mission){
  txt(c,"追加ミッション",819,805,16,muted,600);
  field(c,mission,808,824,237,37,1,30,20,700,ink,"center");
 }
 c.restore();
}
function drawWide(c,data,g,key,via,mission,hasDistance){
 const w=1920,h=1080;
 c.fillStyle="#f8f4e8";c.fillRect(0,0,w,h);
 // Reuse the same photograph-like mountain artwork, cropped only from the scenic area.
 c.save();c.beginPath();c.rect(0,659,w,421);c.clip();
 const sy=875/1375*template.naturalHeight,sh=template.naturalHeight-sy;
 const dh=w/template.naturalWidth*sh;
 c.drawImage(template,0,sy,template.naturalWidth,sh,0,h-dh,w,dh);c.restore();
 // Title from the template is reused verbatim, without baking in any destination details.
 c.drawImage(template,205/1100*1080,65/1375*1350,650/1100*1080,230/1375*1350,50,20,650,230);
 const hx=156,hy=363;
 path(c,[[hx,hy-119],[hx+101,hy-60],[hx+101,hy+60],[hx,hy+119],[hx-101,hy+60],[hx-101,hy-60]],"#f5f1df","#28563e",7);
 path(c,[[hx,hy-106],[hx+90,hy-53],[hx+90,hy+53],[hx,hy+106],[hx-90,hy+53],[hx-90,hy-53]],null,"#9eae83",2);
 icon(c,key,hx-46,hy-76,92,palettes[key].accent);
 field(c,palettes[key].label,hx-84,hy+24,168,58,2,28,20,700,ink,"center");
 const x=310,ww=1545;
 rect(c,x,259,ww,94,12,"#10482f");field(c,g.name||"名称未登録",x+24,264,ww-48,84,2,70,34,700,"#fffdf3");
 rect(c,x,369,ww,58,9,"#d3ddc7");field(c,g.address||"住所未登録",x+22,373,ww-44,50,2,32,22,600,ink);
 if(g.summary){rect(c,x,441,ww,93,9,"#f0ebd9");field(c,g.summary,x+22,445,ww-44,85,3,30,20,400,ink);}
 if(via.length){txt(c,"経由地",x,548,23,muted,700);viaField(c,via,x+118,542,ww-118,100);}
 // Dark bottom bar over the shared artwork with live distance and mission.
 rect(c,62,925,1796,115,15,"#f7f3e9f5");
 if(hasDistance){txt(c,"推定走行距離",100,945,23,muted,600);txt(c,"約 "+data.estimatedKm.toFixed(1)+" km",100,977,43,ink,700);}
 if(mission){const mx=hasDistance?1030:100;icon(c,data.mission,mx,950,69,ink);txt(c,"追加ミッション",mx+95,944,23,muted,600);txt(c,mission,mx+95,977,43,ink,700);}
}
function draw(canvas,data,format){
 if(!template)throw Error("旅カード画像の読み込みが完了していません");
 const tall=format!=="wide";canvas.width=tall?1080:1920;canvas.height=tall?1350:1080;
 const c=canvas.getContext("2d");if(!c)throw Error("Canvas unavailable");
 const g=data.goal||{},key=theme(g),via=Array.isArray(data.via)?data.via.slice(0,5):[];
 const mission=Object.prototype.hasOwnProperty.call(missions,data.mission)?missions[data.mission]:null;
 const hasDistance=Number.isFinite(data.estimatedKm)&&data.estimatedKm>=0;
 if(tall)drawPortrait(c,data,g,key,via,mission,hasDistance);else drawWide(c,data,g,key,via,mission,hasDistance);
 return canvas;
}
function open(data,modal){
 modal('<div class="trip-card-dialog"><h2>旅カード</h2><p class="meta">目的地と旅程を画像に。出発地点・日付は入りません。</p><div class="trip-card-formats"><button id="tripCardTall" type="button" aria-pressed="true">縦長・SNS</button><button id="tripCardWide" type="button" aria-pressed="false">横長・動画</button></div><canvas id="tripCardCanvas" aria-label="旅カードのプレビュー"></canvas><p id="tripCardStatus" role="status"></p><div class="trip-card-actions"><button id="tripCardSave" type="button" disabled>PNG保存</button><button id="tripCardShare" type="button" disabled>共有する</button></div></div>');
 const el=id=>document.getElementById(id),canvas=el("tripCardCanvas"),save=el("tripCardSave"),share=el("tripCardShare"),status=el("tripCardStatus");let format="tall",blob=null,seq=0;
 function filename(){return "道の途中_"+String(data.goal.name||"旅").replace(/[\\/:*?"<>|]/g,"_").slice(0,60)+"_"+(format==="wide"?"1920x1080":"1080x1350")+".png";}
 function file(){return new File([blob],filename(),{type:"image/png"});}
 function canShare(){try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files:[file()]}));}catch(_){return false;}}
 async function refresh(f){
  format=f;const ticket=++seq;blob=null;save.disabled=share.disabled=true;el("tripCardTall").setAttribute("aria-pressed",String(f==="tall"));el("tripCardWide").setAttribute("aria-pressed",String(f==="wide"));
  status.textContent="画像を生成中…";
  try{await ready();if(ticket!==seq||!canvas.isConnected)return;draw(canvas,data,f);canvas.toBlob(b=>{if(ticket!==seq||!canvas.isConnected)return;if(!b){status.textContent="画像を作成できませんでした。";return;}blob=b;save.disabled=false;share.disabled=!canShare();status.textContent=canvas.width+" × "+canvas.height+" px"+(share.disabled?" ／ 画像保存からSNSに投稿できます":"");},"image/png");}catch(e){status.textContent="画像を作成できませんでした："+e.message;}
 }
 el("tripCardTall").onclick=()=>refresh("tall");el("tripCardWide").onclick=()=>refresh("wide");
 save.onclick=()=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);};
 share.onclick=async()=>{if(!blob||!canShare())return;try{await navigator.share({files:[file()],title:"道の途中。"});}catch(e){if(e.name!=="AbortError")status.textContent="共有できませんでした。PNG保存をご利用ください。";}};
 refresh("tall");
}
window.TripCard=Object.freeze({build:BUILD,draw,open,theme,ready});
})();

const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('actual draw populates shareable final destination and both PNG formats',async({page},testInfo)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='10'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('sug');setOrigin('sug',34.3992388,132.4406034,'非公開の出発地');document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';window.drawNavigationMission=()=> 'none';});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
 const data=await page.evaluate(()=>tripCardSnapshot());expect(data.goal.name).toBe(await page.locator('#sugResult .goal b').innerText());expect(data.mission).toBe('none');expect(data.estimatedKm).toBeGreaterThan(0);expect(data.estimatedKm).toBeLessThanOrEqual(100);expect(JSON.stringify(data)).not.toContain('非公開の出発地');expect(data.via.length).toBeLessThanOrEqual(5);
 await page.evaluate(()=>showView('home'));await page.locator('#currentDestinationPanel summary').click();await page.getByRole('button',{name:'旅カードを作る'}).click();
 for(const [format,w,h] of [['縦長・SNS',1080,1350],['横長・動画',1920,1080]]){
  await page.getByRole('button',{name:format}).click();await expect(page.locator('#tripCardSave')).toBeEnabled();
  expect(await page.locator('#tripCardCanvas').evaluate(c=>[c.width,c.height])).toEqual([w,h]);
  const event=page.waitForEvent('download');await page.locator('#tripCardSave').click();const dl=await event;const png=fs.readFileSync(await dl.path());
  expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([w,h]);
  await testInfo.attach(format,{body:png,contentType:'image/png'});
 }
 await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(data);
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'非公開の出発地');document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';});
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
 const single=await page.evaluate(()=>tripCardSnapshot());expect(single.goal.name).toBe(await page.locator('#destResult .spot-card h3').innerText());expect(single.via).toEqual([]);expect(single.estimatedKm).toBeGreaterThan(0);
});
test('category art, all mission icons, five via stops, offline export',async({page,context},testInfo)=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&window.TripCard?.build==='10');
 const themes=await page.evaluate(()=>[{kind:'道の駅'},{kind:'ライダーズカフェ'},{featureCategory:'sea'},{featureCategory:'nature'},{name:'桜並木'},{kind:'寄り道スポット'},{kind:'定番スポット'},{}].map(window.TripCard.theme));expect(themes).toEqual(['road','cafe','sea','mountain','season','detour','spot','other']);
 await context.setOffline(true);
 await page.evaluate(()=>TripCard.ready());
 await page.evaluate(()=>{setCurrentDestination('sug',Array.from({length:6},(_,i)=>({name:'長い名前の道の駅'+(i+1)+'・自然豊かな山間の休憩施設',address:'広島県広島市',summary:'これは長い紹介文のテストです。'.repeat(20)})),'radar',123.4);});
 await page.locator('#currentDestinationPanel summary').click();await page.getByRole('button',{name:'旅カードを作る'}).click();await expect(page.locator('#tripCardSave')).toBeEnabled();const d=await page.evaluate(()=>tripCardSnapshot());expect(d.via).toHaveLength(5);
 for(const [mode,w,h] of [['tall',1080,1350],['wide',1920,1080]]){
  const b=await page.evaluate(({mode})=>{const c=document.createElement('canvas');TripCard.draw(c,tripCardSnapshot(),mode);return c.toDataURL().split(',')[1];},{mode});const png=Buffer.from(b,'base64');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([w,h]);await testInfo.attach('long-route-'+mode,{body:png,contentType:'image/png'});
 }
 for(const mission of ['normal','radar','none']){const ok=await page.evaluate(m=>{const c=document.createElement('canvas');TripCard.draw(c,{goal:{name:'目的地',kind:'スポット',address:'住所'},via:[],mission:m,estimatedKm:null},'wide');return c.toDataURL().startsWith('data:image/png');},mission);expect(ok).toBe(true);}
 await context.setOffline(false);
});
test('single template, dynamic icon and five text-only via stops',async({page},testInfo)=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='10');
 const results=await page.evaluate(async()=>{
  await TripCard.ready();
  const proto=CanvasRenderingContext2D.prototype,original=proto.fillText,records=[];
  proto.fillText=function(value,...args){records.push(String(value));return original.call(this,value,...args);};
  try{
   const data={goal:{name:'テスト目的地',kind:'道の駅',address:'広島県',summary:'紹介文'},via:['経由地点A','経由地点B','経由地点C','経由地点D','経由地点E'],estimatedKm:123.4,mission:'radar'};
   return ['tall','wide'].map(format=>{
    records.length=0;const c=document.createElement('canvas');TripCard.draw(c,data,format);
    const text=records.slice();const a=c.toDataURL();
    TripCard.draw(c,{...data,goal:{...data.goal,kind:'ライダーズカフェ'},mission:'none'},format);
    const different=c.toDataURL()!==a;
    return {format,text,different,png:a.split(',')[1]};
   });
  }finally{proto.fillText=original;}
 });
 for(const r of results){
  for(const name of ['経由地点A','経由地点B','経由地点C','経由地点D','経由地点E','レーダー使用'])expect(r.text).toContain(name);
  expect(r.text).not.toContain('1');expect(r.text).not.toContain('>>');expect(r.different).toBe(true);
  await testInfo.attach('template-'+r.format,{body:Buffer.from(r.png,'base64'),contentType:'image/png'});
 }
});

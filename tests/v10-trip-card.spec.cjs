const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('Ver10 artwork, actual station mission, ordered routes, export and offline',async({page,context},testInfo)=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>window.TripCard?.build==='10'&&!document.body.classList.contains('pwa-starting')&&!!navigator.serviceWorker.controller);
 expect(await page.evaluate(()=>TripCard.ready)).toBe(true);
 expect(await page.evaluate(()=>TripCard.artworkAvailable())).toBe(true);
 await page.evaluate(()=>{showView('sug');setOrigin('sug',34.3992388,132.4406034,'非公開の出発地');document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';document.getElementById('sugMission').checked=true;});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
 const data=await page.evaluate(()=>tripCardSnapshot());
 expect(data.mode).toBe('sug');expect(data.stationMission).toBe(await page.locator('#sugResult .mission').innerText());
 expect(JSON.stringify(data)).not.toContain('非公開の出発地');
 await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));
 expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(data);
 const names=['道の駅 湖畔の里福富','道の駅 よがんす白竜','道の駅 みはら神明の里','道の駅 クロスロードみつぎ','道の駅 世羅','道の駅 びんご府中','ゴール'];
 await page.evaluate(names=>setCurrentDestination('sug',names.slice(0,6).map(name=>({name,address:'広島県広島市',summary:'施設の説明文です。'.repeat(12)})),'none',123.4,'ご当地のお土産を探そう'),names);
 const layout=await page.evaluate(()=>{const c=document.createElement('canvas').getContext('2d');return TripCard.viaLayout(c,tripCardSnapshot().via,960);});
 expect(layout.rows.length).toBeLessThanOrEqual(4);expect(layout.shortened).toBe(false);
 expect(layout.rows.join('').replace(/\\s/g,'')).toContain('クロスロードみつぎ');
 await context.setOffline(true);
 await page.evaluate(()=>showView('home'));await page.locator('#currentDestinationPanel summary').click();await page.getByRole('button',{name:'旅カードを作る'}).click();
 for(const [format,w,h] of [['縦長・SNS',1080,1350],['横長・動画',1920,1080]]){
  await page.getByRole('button',{name:format}).click();await expect(page.locator('#tripCardSave')).toBeEnabled();
  const event=page.waitForEvent('download');await page.locator('#tripCardSave').click();const dl=await event;const png=fs.readFileSync(await dl.path());
  expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect([png.readUInt32BE(16),png.readUInt32BE(20)]).toEqual([w,h]);await testInfo.attach(format,{body:png,contentType:'image/png'});
 }
 await context.setOffline(false);
 await page.evaluate(()=>setCurrentDestination('dest',[{name:'海岸',address:'住所'}],'radar',42));
 const dest=await page.evaluate(()=>tripCardSnapshot());expect(dest.mode).toBe('dest');expect(dest.stationMission).toBeNull();
 expect(await page.evaluate(()=>TripCard.modeTitle(tripCardSnapshot()))).toBe('行先ガチャ');
});
test('no route or estimate fabricated for older state; four rows retain order',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='10');
 const values=await page.evaluate(()=>{setCurrentDestination('sug',[{name:'旧目的地',address:'住所'}],'normal');const c=document.createElement('canvas').getContext('2d');return {data:tripCardSnapshot(),route:TripCard.viaLayout(c,['A','B','C','D','E','F','G'],960),title:TripCard.modeTitle(tripCardSnapshot())};});
 expect(values.data.stationMission).toBeNull();expect(values.data.estimatedKm).toBeNull();expect(values.route.rows.join('')).toBe('A → B → C → D → E → F → G');expect(values.title).toBe('道の駅すごろく');
});

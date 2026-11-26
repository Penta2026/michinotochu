const {test,expect}=require('@playwright/test');
test('independent toggles, category pool, 70/30 boundary and no shop requirement',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='13'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>showView('dest'));await page.locator('#dest [data-mission="off"]').click();
 expect(await page.locator('#destMission').isChecked()).toBe(false);expect(await page.locator('#sugMission').isChecked()).toBe(true);
 await page.evaluate(()=>showView('sug'));await page.locator('#sug [data-mission="off"]').click();
 await page.evaluate(()=>showView('dest'));await page.locator('#dest [data-mission="on"]').click();
 expect(await page.locator('#sugMission').isChecked()).toBe(false);expect(await page.locator('#destMission').isChecked()).toBe(true);
 const results=await page.evaluate(()=>{
  const cat={coast:'sea',mountain:'mountain',shrine_temple:'shrine',castle_history:'history',dam:'construction',unusual:'unusual'};
  return {cats:Object.entries(cat).map(([featureCategory,expected])=>[discoveryCategory({featureCategory}),expected]),season:discoveryCategory({name:'桜並木'}),cafe:discoveryCategory({kind:'ライダーズカフェ'}),special:drawDiscoveryMission({featureCategory:'coast'},true,()=>.2999),common:drawDiscoveryMission({featureCategory:'coast'},true,()=>.3),fallback:drawDiscoveryMission({featureCategory:'generic'},true,()=>0),off:drawDiscoveryMission({},false,()=>{throw Error('random called');})};
 });
 for(const [actual,expected] of results.cats)expect(actual).toBe(expected);
 expect(results.season).toBe('season');expect(results.cafe).toBe('cafe');expect(results.special).toBe('海と空の境界線を撮ろう');expect(results.common).not.toBe(results.special);expect(results.fallback).toBe('その場所で一番気に入った景色を撮ろう');expect(results.off).toBe('ミッションなし');
});
test('actual destination draw persists mission to current card and favorite; off works',async({page,context})=>{
 page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='13'&&!!navigator.serviceWorker.controller);
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'広島試験');document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';});
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
 const saved=await page.evaluate(()=>tripCardSnapshot());expect(saved.destMission).toBe(await page.locator('#destResult .mission').innerText());expect(saved.destMission).not.toBe('ミッションなし');
 await page.locator('#destResult').getByRole('button',{name:'お気に入りに保存'}).click();expect(await page.evaluate(()=>loadFavorites()[0].travelMission)).toBe(saved.destMission);
 await page.evaluate(()=>showView('favorites'));await expect(page.locator('#favoriteList .mission')).toHaveText(saved.destMission);
 await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(saved);
 await page.evaluate(()=>showView('home'));await page.locator('#currentDestinationPanel summary').click();await expect(page.locator('#currentDestinationDetails .mission')).toHaveText(saved.destMission);
 await context.setOffline(true);await page.getByRole('button',{name:'旅カードを作る'}).click();await expect(page.locator('#tripCardSave')).toBeEnabled();
 const drawn=await page.evaluate(()=>{const canvas=document.createElement('canvas'),c=canvas.getContext('2d'),original=c.fillText.bind(c),texts=[];c.fillText=(s,...args)=>{texts.push(s);original(s,...args);};TripCard.draw(canvas,tripCardSnapshot());return texts;});
 expect(drawn.join('')).toContain(saved.destMission);await context.setOffline(false);
 await page.evaluate(()=>{closeModal();showView('dest');});await page.locator('#dest [data-mission="off"]').click();await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});expect(await page.evaluate(()=>tripCardSnapshot().destMission)).toBe('ミッションなし');
});
test('one station mission remains identical at every stop including goal',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='13'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('home');setCurrentDestination('sug',[{name:'経由1',address:'住所'},{name:'経由2',address:'住所'},{name:'ゴール',address:'住所'}],'none',100,'ご当地キャラを探す');});
 await page.locator('#currentDestinationPanel summary').click();
 for(let i=0;i<3;i++){await expect(page.locator('#currentDestinationDetails .mission')).toHaveText('ご当地キャラを探す');await expect(page.locator('#currentDestinationDetails')).toContainText('全駅共通');expect(await page.evaluate(()=>tripCardSnapshot().stationMission)).toBe('ご当地キャラを探す');if(i<2)await page.getByRole('button',{name:'到着・次の目的地へ'}).click();}
 await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));expect(await page.evaluate(()=>tripCardSnapshot().stationMission)).toBe('ご当地キャラを探す');await expect(page.locator('#currentDestinationName')).toHaveText('ゴール');
});

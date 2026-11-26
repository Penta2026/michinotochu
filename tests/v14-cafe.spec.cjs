const {test,expect}=require('@playwright/test');
test('suspended partner remains stored but is not listed or drawn, including API duplicates and offline',async({page,context})=>{
 await page.route('https://michinotochu-riders-api.yasutaka5262.workers.dev/**',route=>route.fulfill({json:{items:[{id:'RC-34-001',name:'GOLDEN VALLEY',prefecture:'広島県',lat:34.56332361,lng:132.66240223,publish:true,gacha:'候補'}]},headers:{'access-control-allow-origin':'*'}}));
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>window.TripCard?.build==='14'&&!!navigator.serviceWorker.controller&&!document.body.classList.contains('pwa-starting'));
 const status=await page.evaluate(async()=>{
  await loadRidersCafesApi();
  const shop=RIDERS_CAFES.find(p=>p.id==='RC-34-001');
  return {count:RIDERS_CAFES.filter(p=>p.id==='RC-34-001').length,publish:shop.publish,gacha:shop.gacha,permission:shop.permission.status,detour:detourAllSpots().some(p=>p.id==='RC-34-001')};
 });
 expect(status).toEqual({count:1,publish:false,gacha:'除外',permission:'approved',detour:false});
 await page.evaluate(()=>{showView('interest');document.getElementById('interestPref').value='広島県';document.getElementById('interestType').value='cafe';runInterest();});
 await expect(page.locator('#interestResult')).not.toContainText('GOLDEN VALLEY');
 await page.evaluate(()=>{showView('nearby');setOrigin('nearby',34.56332361,132.66240223,'試験');document.getElementById('nearbyType').value='cafe';document.getElementById('nearbyDistFree').value='5';runNearby();});
 await expect(page.locator('#nearbyResult')).not.toContainText('GOLDEN VALLEY');
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'試験');document.getElementById('destMood').value='ライダーズカフェ';document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='80';});
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult')).toContainText('候補がありません',{timeout:60000});
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));
 expect(await page.evaluate(()=>window.RIDERS_CAFES.find(p=>p.id==='RC-34-001').publish)).toBe(false);
 expect(await page.evaluate(()=>detourAllSpots().some(p=>p.id==='RC-34-001'))).toBe(false);
 await expect(page.locator('#footerVersion')).toContainText('PWA 14 / DB 2');
});

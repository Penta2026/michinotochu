const {test,expect}=require('@playwright/test');
test('navigation mission weight boundaries, both draw modes and GPX remain available',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof drawNavigationMission==='function'&&!document.body.classList.contains('pwa-starting'));
 const distribution=await page.evaluate(()=>{
  const counts={normal:0,radar:0,none:0};for(let i=0;i<1000;i++)counts[drawNavigationMission((i+.5)/1000)]++;
  return {counts,boundaries:[0,.399999,.4,.799999,.8,.999999].map(x=>drawNavigationMission(x))};
 });
 expect(distribution.counts).toEqual({normal:400,radar:400,none:200});
 expect(distribution.boundaries).toEqual(['normal','normal','radar','radar','none','none']);
 for(const mode of ['sug','dest']){
  await page.evaluate(mode=>{showView(mode);setOrigin(mode,34.3992388,132.4406034,'広島試験');if(mode==='sug'){document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';document.getElementById('sugMission').checked=false;}else{document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';}},mode);
  for(const [key,label] of [['normal','ナビ使用可'],['radar','レーダー使用'],['none','ナビなし']]){
   await page.evaluate(key=>{window.drawNavigationMission=()=>key;},key);
   await page.locator('#'+mode+' .action-main').click();
   const result=page.locator('#'+mode+'Result');const mission=result.locator('.navigation-mission');
   await expect(mission).toHaveCount(1);await expect(mission).toHaveAttribute('data-nav-mission',key);
   await expect(mission.locator('.navigation-mission-name')).toContainText(label);
   await expect(result.locator(mode==='sug'?'.goal':'.spot-card')).toBeVisible();
   await expect(result.locator('.route-gpx')).toBeEnabled();await expect(result.locator('.route-bnavi')).toBeEnabled();
   if(mode==='sug')await expect(result.locator('.mission')).toHaveText('ミッションなし');
  }
  const result=page.locator('#'+mode+'Result');
  const download=page.waitForEvent('download');await result.locator('.route-gpx').click();expect((await download).suggestedFilename()).toMatch(/\.gpx$/);
  await result.getByRole('button',{name:'お気に入りに保存'}).click();
 }
 await page.evaluate(()=>showView('favorites'));
 await expect(page.locator('#favoriteList .navigation-mission[data-nav-mission="none"]')).toHaveCount(2);
 await page.reload();await page.waitForFunction(()=>typeof showView==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>showView('favorites'));
 await expect(page.locator('#favoriteList .navigation-mission[data-nav-mission="none"]')).toHaveCount(2);
});

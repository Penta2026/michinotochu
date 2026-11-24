const {test,expect}=require('@playwright/test');
test('seasonal candidates obey estimated distance and preserve actions',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof runSeason==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('season');setOrigin('season',34.3992388,132.4406034,'広島試験');document.getElementById('seasonRadiusFree').value='100';document.getElementById('seasonSelect').value='秋';});
 for(const vehicle of ['50','125','126']){
  await page.locator('#seasonVehicle').selectOption(vehicle);
  await page.locator('#season .action-main').click();
  await expect(page.locator('#seasonResult .season-estimated-item').first()).toBeVisible({timeout:60000});
  const items=await page.locator('#seasonResult .season-estimated-item').allTextContents();
  expect(items.length).toBeLessThanOrEqual(12);
  const distances=items.map(x=>Number(x.match(/推定走行距離：約([\d.]+)km/)[1]));
  expect(distances.every((d,i)=>d<=100&&(i===0||d>=distances[i-1]))).toBe(true);
 }
 const first=page.locator('#seasonResult .season-estimated-item').first();
 const download=page.waitForEvent('download');await first.locator('.route-gpx').click();expect((await download).suggestedFilename()).toMatch(/\.gpx$/);
 await first.getByRole('button',{name:'保存',exact:true}).click();
 await page.evaluate(()=>showView('favorites'));await expect(page.locator('#favoriteList .fav-card')).toHaveCount(1);
 await page.evaluate(()=>{showView('season');document.getElementById('seasonRadiusFree').value='1';setOrigin('season',34.3992388,132.4406034,'広島試験');});
 await page.locator('#season .action-main').click();
 await expect(page.locator('#seasonLandStatus')).toHaveText('',{timeout:60000});
 const remaining=await page.locator('#seasonResult .season-estimated-item').allTextContents();
 expect(remaining.every(x=>Number(x.match(/推定走行距離：約([\d.]+)km/)[1])<=1)).toBe(true);
 expect(errors).toEqual([]);
});

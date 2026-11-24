const {test,expect}=require('@playwright/test');
test('destination estimated band and existing actions',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof runDestination==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'広島試験');document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';});
 for(const vehicle of ['50','125','126']){
  await page.locator('#destVehicle').selectOption(vehicle);
  await page.locator('#dest .action-main').click();
  await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
  const match=(await page.locator('#destResult').innerText()).match(/推定走行距離：約([\d.]+)km/);
  expect(match).not.toBeNull();expect(Number(match[1])).toBeGreaterThanOrEqual(70);expect(Number(match[1])).toBeLessThanOrEqual(90);
 }
 const download=page.waitForEvent('download');await page.locator('#destResult .route-gpx').click();expect((await download).suggestedFilename()).toMatch(/\.gpx$/);
 await page.locator('#destResult').getByRole('button',{name:'お気に入りに保存'}).click();
 await page.evaluate(()=>showView('favorites'));await expect(page.locator('#favoriteList .fav-card')).toHaveCount(1);
 expect(errors).toEqual([]);
});

const {test,expect}=require('@playwright/test');
test('ride style estimated band and direction',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof runRideStyle==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('ride');setOrigin('ride',34.3992388,132.4406034,'広島試験');document.getElementById('rideDistance').value='100';document.getElementById('rideMood').value='road';document.getElementById('rideDirection').value='north';});
 for(const vehicle of ['50','125','126']){
  await page.locator('#rideVehicle').selectOption(vehicle);
  await page.locator('#ride .action-main').click();
  await expect(page.locator('#rideResult .ride-registered .spot-card')).toBeVisible({timeout:60000});
  const match=(await page.locator('#rideResult').innerText()).match(/推定走行距離：約([\d.]+)km/);
  expect(match).not.toBeNull();expect(Number(match[1])).toBeGreaterThanOrEqual(85);expect(Number(match[1])).toBeLessThanOrEqual(115);
  await expect(page.locator('#rideResult .ride-map-search')).toContainText('道路距離・車種別通行可否は未確認');
 }
 const download=page.waitForEvent('download');await page.locator('#rideResult .route-gpx').click();expect((await download).suggestedFilename()).toMatch(/\.gpx$/);
 await page.locator('#rideResult .spot-card').getByRole('button',{name:'保存',exact:true}).click();
 await page.evaluate(()=>showView('favorites'));await expect(page.locator('#favoriteList .fav-card')).toHaveCount(1);
 expect(errors).toEqual([]);
});

const {test,expect}=require('@playwright/test');
test('draw results survive missing animation and rejected animation',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof runSugoroku==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{window.DrawReveal=undefined;showView('sug');setOrigin('sug',34.3992388,132.4406034,'広島試験');document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
 expect(await page.locator('#sugResult .route-line').count()).toBeLessThanOrEqual(3);
 await page.evaluate(()=>window.DrawReveal={play:async()=>{throw Error('simulated animation failure')}});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'広島試験');document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';});
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
 await page.evaluate(()=>{window.DrawReveal={play:()=>new Promise(()=>{})};showView('sug');});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:15000});
});

test('stalled shared land data reports timeout and retries in both modes',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>typeof runDestination==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{
  const original=window.fetch.bind(window);window.__realDrawFetch=original;
  window.fetch=(url,opts)=>String(url).endsWith('/manifest.json')?new Promise(()=>{}):original(url,opts);
  showView('dest');setOrigin('dest',34.3992388,132.4406034,'広島試験');
  document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';
 });
 await page.locator('#dest .action-main').click();
 await expect(page.locator('#destResult')).toContainText('タイムアウト',{timeout:20000});
 await expect(page.locator('#destLandStatus')).toHaveText('');
 await page.evaluate(()=>window.fetch=window.__realDrawFetch);
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
 await page.evaluate(()=>{
  window.SugorokuLandUI.tiles.clear();
  const original=window.__realDrawFetch;
  window.fetch=(url,opts)=>String(url).endsWith('/132_34.json')?new Promise(()=>{}):original(url,opts);
  showView('sug');setOrigin('sug',34.3992388,132.4406034,'広島試験');
  document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';
 });
 await page.locator('#sug .action-main').click();
 await expect(page.locator('#sugResult')).toContainText('タイムアウト',{timeout:20000});
 await expect(page.locator('#sugLandStatus')).toHaveText('');
 await page.evaluate(()=>window.fetch=window.__realDrawFetch);
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
});

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

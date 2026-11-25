const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:8765/';
async function setup(page,mode){
 await page.goto(base);
 await page.waitForFunction(()=>!!window.DrawReveal&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(mode=>{showView(mode);setOrigin(mode,34.3992388,132.4406034,'広島試験');if(mode==='sug'){document.getElementById('sugRadiusFree').value='100';document.getElementById('sugCount').value='3';}else{document.getElementById('destDistFree').value='80';document.getElementById('destTolFree').value='10';}},mode);
}
test('dice face and result cap, stale reveal cancelled',async({page})=>{
 await setup(page,'sug');
 await page.locator('#sug .action-main').click();
 await expect(page.locator('#sugResult .draw-dice')).toHaveAttribute('data-face','3');
 await expect(page.locator('#sugResult .goal')).toBeVisible();
 expect(await page.locator('#sugResult .route-line').count()).toBeLessThanOrEqual(3);
 await page.evaluate(()=>document.getElementById('sugCount').value='0');
 await page.locator('#sug .action-main').click();
 const die=page.locator('#sugResult .draw-dice');await expect(die).toBeVisible();
 const face=Number(await die.getAttribute('data-face'));expect(face).toBeGreaterThanOrEqual(1);expect(face).toBeLessThanOrEqual(6);
 await expect(page.locator('#sugResult .goal')).toBeVisible();expect(await page.locator('#sugResult .route-line').count()).toBeLessThanOrEqual(face);
 await page.locator('#sug .action-main').click();await expect(die).toBeVisible();
 await page.evaluate(()=>resetResult('sug'));await page.waitForTimeout(2200);await expect(page.locator('#sugResult')).toContainText('条件を設定してください');await expect(page.locator('#sugResult .goal')).toHaveCount(0);
});
test('capsule reveal and destination result',async({page})=>{
 await setup(page,'dest');await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .draw-machine')).toBeVisible();
 await expect(page.locator('#destResult .spot-card')).toBeVisible();
 const text=await page.locator('#destResult').innerText();const km=Number(text.match(/推定走行距離：約([\d.]+)km/)[1]);expect(km).toBeGreaterThanOrEqual(70);expect(km).toBeLessThanOrEqual(90);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible();
});

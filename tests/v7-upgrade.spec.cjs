const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
test('upgrade installed v6 to v7 without losing local storage',async({page})=>{
 const base='http://127.0.0.1:8766/';
 page.on('dialog',d=>d.accept());
 await page.goto(base);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&typeof saveFavorite==='function');
 await page.evaluate(()=>saveFavorite({mode:'道の駅すごろく',title:'更新前の保存',origin:{lat:34.3992388,lng:132.4406034,label:'広島'},points:[{lat:34.433767,lng:132.703576,name:'西条'}]}));
 const before=await page.evaluate(()=>JSON.stringify(loadFavorites()));
 expect(before).toContain('更新前の保存');
 // Replace server tree in place; the browser origin and storage remain unchanged.
 fs.cpSync(process.cwd(),process.env.UPGRADE_WEBROOT,{recursive:true,filter:src=>!['.git','node_modules','playwright-report','test-results'].includes(path.basename(src))});
 await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await expect.poll(()=>page.evaluate(async()=> (await caches.keys()).includes('michinotochu-rebuilt-pwa-7')),{timeout:60000}).toBe(true);
 await expect.poll(()=>page.evaluate(async()=> !(await caches.keys()).includes('michinotochu-rebuilt-pwa-6')),{timeout:60000}).toBe(true);
 await page.reload();
 await expect(page.locator('#footerVersion')).toContainText('PWA 7 / DB 2',{timeout:60000});
 expect(await page.evaluate(()=>JSON.stringify(loadFavorites()))).toBe(before);
 await page.evaluate(()=>{showView('sug');setOrigin('sug',34.3992388,132.4406034,'広島');document.getElementById('sugRadiusFree').value='80';});
 await page.locator('#sug .action-main').click();await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:60000});
});

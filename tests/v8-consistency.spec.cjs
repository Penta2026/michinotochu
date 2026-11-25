const {test,expect}=require('@playwright/test');
test('stale main script is detected rather than silently drawing with old code',async({page})=>{
 // Intercept only main script before the first service worker controls this page.
 await page.route('**/app.js?v=8',r=>r.fulfill({contentType:'application/javascript',body:'window.MICHI_APP_BUILD="5";'}));
 await page.goto('http://127.0.0.1:8765/');
 await expect(page.locator('#buildMismatch')).toBeVisible();
 await expect(page.locator('#sug .action-main')).toBeDisabled();
 await expect(page.locator('#dest .action-main')).toBeDisabled();
 await expect(page.locator('#footerVersion')).toContainText('更新不一致');
});
test('active worker serves a coherent shell and exact critical assets offline',async({page,context})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&window.MICHI_APP_BUILD==="8");
 const cache=await page.evaluate(async()=>{const c=await caches.open('michinotochu-rebuilt-pwa-8');return {exact:!!await c.match('./app.js?v=8'),old:!!await c.match('./app.js?v=5'),html:(await (await c.match('./index.html')).text()).includes('data-app-build="8"')}});
 expect(cache).toEqual({exact:true,old:false,html:true});
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));
 expect(await page.evaluate(()=>[document.documentElement.dataset.appBuild,window.MICHI_APP_BUILD,window.MICHI_PWA_BUILD])).toEqual(['8','8','8']);
 await expect(page.locator('#buildMismatch')).toBeHidden();
 await context.setOffline(false);
});

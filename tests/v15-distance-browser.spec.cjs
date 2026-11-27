const {test,expect}=require('@playwright/test');
test('500 km budget uses 1.85 for all legs and card matches draw',async({page,context})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForFunction(()=>window.LandDistance?.build==='15'&&!!navigator.serviceWorker.controller&&!document.body.classList.contains('pwa-starting'));
 const initial=await page.evaluate(async()=>{
  const origin={lat:34.3992388,lng:132.4406034},target={lat:34.433767,lng:132.703576};
  const old=await SugorokuLandUI.prepare(origin),adjusted=await SugorokuLandUI.prepare(origin,[],500);
  return [old.estimate(origin,target).km,adjusted.estimate(origin,target).km];
 });
 expect(initial[1]/initial[0]).toBeCloseTo(1.85/1.45,8);
 await page.evaluate(()=>{const real=SugorokuLandUI.prepare;window.testTargets=[];SugorokuLandUI.prepare=function(o,p,t){window.testTargets.push(t);return real(o,p,t);};showView('sug');setOrigin('sug',34.3992388,132.4406034,'試験');document.getElementById('sugRadiusFree').value='500';document.getElementById('sugCount').value='6';});
 await page.locator('#sug .action-main').click();
 await expect(page.locator('#sugResult .goal')).toBeVisible({timeout:90000});
 const data=await page.evaluate(()=>({km:tripCardSnapshot().estimatedKm,targets:window.testTargets}));
 expect(data.targets).toContain(500);expect(data.km).toBeGreaterThan(0);expect(data.km).toBeLessThanOrEqual(500);
 await expect(page.locator('#sugResult')).toContainText('全区間の推定走行距離：約'+data.km.toFixed(1)+'km');
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'試験');document.getElementById('destDistFree').value='200';document.getElementById('destTolFree').value='40';});
 await page.locator('#dest .action-main').click();await expect(page.locator('#destResult .spot-card')).toBeVisible({timeout:60000});
 const dest=await page.evaluate(()=>({km:tripCardSnapshot().estimatedKm,targets:window.testTargets}));
 expect(dest.targets).toContain(200);expect(dest.km).toBeGreaterThanOrEqual(160);expect(dest.km).toBeLessThanOrEqual(240);
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>!document.body.classList.contains('pwa-starting'));
 expect(await page.evaluate(()=>[LandDistance.build,LandDistance.factorForTarget(500),tripCardSnapshot().estimatedKm])).toEqual(['15',1.85,dest.km]);
 await context.setOffline(false);
});

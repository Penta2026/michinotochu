const {test,expect}=require('@playwright/test');
test('random target 20 to 200 inclusive, one draw per request, manual distance remains independent',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>window.TripCard?.build==='15'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('dest');setOrigin('dest',34.3992388,132.4406034,'試験');document.getElementById('destDistFree').value='99';});
 const random=page.locator('[data-target="destDist"] button[data-value="random"]');
 await random.click();await expect(random).toHaveClass(/active/);await expect(page.locator('#destDistFree')).toHaveValue('');
 const checks=await page.evaluate(()=>[destinationDistanceChoice(()=>0),destinationDistanceChoice(()=>.999999),destinationDistanceChoice(()=>.5)]);
 expect(checks).toEqual([{km:20,random:true},{km:200,random:true},{km:110,random:true}]);
 await page.evaluate(()=>{
  window.targetCalls=[];
  const real=SugorokuLandUI.prepare;
  SugorokuLandUI.prepare=(o,p,t)=>{window.targetCalls.push(t);return real(o,p,t);};
  const original=destinationDistanceChoice;let draws=0;
  window.destinationDistanceChoice=()=>original(()=>[0,.999999][draws++]);
  document.getElementById('destTolFree').value='30';
 });
 for(const km of [20,200]){
  await page.locator('#dest .action-main').click();
  await expect(page.locator('#destResult')).toContainText(new RegExp('距離ガチャ[： ]'+km+'km'),{timeout:90000});
  await expect(random).toHaveClass(/active/);
  expect(await page.evaluate(()=>window.targetCalls.at(-1))).toBe(km);
 }
 expect(await page.evaluate(()=>window.targetCalls)).toEqual([20,200]);
 await page.locator('[data-target="destDist"] button[data-value="50"]').click();
 expect(await page.evaluate(()=>destinationDistanceChoice())).toEqual({km:50,random:false});
 await random.click();await page.locator('#destDistFree').fill('73');
 expect(await page.evaluate(()=>destinationDistanceChoice())).toEqual({km:73,random:false});
});

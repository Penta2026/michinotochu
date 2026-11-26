const {test,expect}=require('@playwright/test');
test('map names from direct and expanded links, title and fallback',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>typeof detourResolvedPlaceName==='function');
 const values=await page.evaluate(()=>{
  const url='https://www.google.com/maps/place/%E9%A7%85%E5%8D%97%E5%85%AC%E5%9C%92/@33.96,132.10,16z';
  const short='https://maps.app.goo.gl/testfixture';
  return [detourResolvedPlaceName(url),detourResolvedPlaceName(short,{ok:true,lat:33.96,lng:132.10,finalUrl:url}),detourResolvedPlaceName(short,{ok:true,placeName:'駅南公園'}),detourResolvedPlaceName(short,null,'駅南公園'),detourResolvedPlaceName('駅南公園\n'+short),detourResolvedPlaceName(short,{ok:true,lat:33.96,lng:132.10}),detourResolvedPlaceName('https://www.google.com/maps/place/33.96,132.10'),detourResolvedPlaceName('https://www.google.com/maps/search/?api=1&query=公園'),detourResolvedPlaceName(short,null,'Google Maps')];
 });
 expect(values).toEqual(['駅南公園','駅南公園','駅南公園','駅南公園','駅南公園','','','','']);
});
test('short link import retains resolver name in selected route and GPX, editable fallback',async({page})=>{
 page.on('dialog',d=>d.accept());
 await page.goto('http://127.0.0.1:8765/');await page.waitForFunction(()=>typeof detourResolvedPlaceName==='function'&&!document.body.classList.contains('pwa-starting'));
 await page.evaluate(()=>{showView('detour');detourRoute={origin:{lat:34.3992388,lng:132.4406034,label:'出発'},points:[{name:'ゴール',lat:33.9,lng:132.1}],source:'manual'};renderDetourRouteStatus();runDetourGacha();});
 await expect(page.locator('#detourCandidateLinkInput')).toBeVisible();
 await page.route('https://crimson-dust-53e2.yasutaka5262.workers.dev/**',async route=>{
  const url=new URL(route.request().url()).searchParams.get('url');
  const named=url.includes('namedfixture');
  await route.fulfill({json:named?{ok:true,lat:33.96,lng:132.10,finalUrl:'https://www.google.com/maps/place/%E9%A7%85%E5%8D%97%E5%85%AC%E5%9C%92/@33.96,132.10,16z'}:{ok:true,lat:33.95,lng:132.11},headers:{'access-control-allow-origin':'*'}});
 });
 await page.locator('#detourCandidateLinkInput').fill('https://maps.app.goo.gl/namedfixture');await page.getByRole('button',{name:'URLから寄り道に追加'}).click();
 await expect(page.getByRole('textbox',{name:'寄り道地点名'}).first()).toHaveValue('駅南公園');
 await page.locator('#detourCandidateLinkInput').fill('https://maps.app.goo.gl/unnamedfixture');await page.getByRole('button',{name:'URLから寄り道に追加'}).click();
 await expect(page.getByRole('textbox',{name:'寄り道地点名'}).nth(1)).toHaveValue('Googleマップ追加地点');
 const second=page.getByRole('textbox',{name:'寄り道地点名'}).nth(1);await second.fill('手入力の地点');await second.press('Tab');
 expect(await page.evaluate(()=>detourChosenPoints().map(p=>p.name))).toEqual(['駅南公園','手入力の地点']);
 const result=await page.evaluate(()=>{const points=detourInsertedMultiple(detourRoute,detourChosenPoints());return {names:points.map(p=>p.name),xml:BNavGPX.build(detourRoute.origin,points,'旅')};});
 expect(result.names).toEqual(['駅南公園','手入力の地点','ゴール']);expect(result.xml).toContain('駅南公園');
});

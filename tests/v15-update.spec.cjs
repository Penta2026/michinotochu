const {test,expect}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('real service worker update button confirms current, installs next, preserves data, handles failed publish/offline',async({page,context})=>{
 let served='15',published='15';
 const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),rel=u.pathname==='/'?'index.html':u.pathname.slice(1);
  if(rel==='data/version.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({appVersion:published,dbVersion:'2'}));return;}
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  let data=fs.readFileSync(file);
  if(served==='16'&&['index.html','app.js','pwa.js','trip-card.js','land-distance.js','detour-enhancements.js','service-worker.js'].includes(rel)){
   data=data.toString().replaceAll('data-app-build="15"','data-app-build="16"').replaceAll('PWA 15 / DB 2','PWA 16 / DB 2').replaceAll('?v=15"','?v=16"').replaceAll('window.MICHI_APP_BUILD="15"','window.MICHI_APP_BUILD="16"').replaceAll('window.TripCard.build!=="15"','window.TripCard.build!=="16"').replaceAll('PWA_APP_VERSION = "15"','PWA_APP_VERSION = "16"').replaceAll('const BUILD="15"','const BUILD="16"').replaceAll('const DETOUR_IMPORT_BUILD = "15"','const DETOUR_IMPORT_BUILD = "16"').replaceAll('const VERSION = "15"','const VERSION = "16"');
  }
  res.writeHead(200,{'Content-Type':contentTypes[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&window.TripCard?.build==='15');
  await page.evaluate(()=>{localStorage.setItem('update-preserve-test','keep');setCurrentDestination('dest',[{name:'保存対象',address:'住所'}],'normal',42);showView('home');});
  const snapshot=await page.evaluate(()=>tripCardSnapshot());
  const button=page.locator('#pwaUpdateButton'),status=page.locator('#pwaDbStatus');
  await button.click();await expect(status).toContainText('最新版です（PWA 15 / DB 2）',{timeout:20000});
  published='16'; // Metadata visible first: do not claim a successful update or clear storage.
  await button.click();await expect(status).toContainText('更新未確認',{timeout:75000});
  expect(await page.evaluate(()=>window.MICHI_APP_BUILD)).toBe('15');
  served='16';await button.click();
  await page.waitForFunction(()=>window.MICHI_APP_BUILD==='16'&&window.MICHI_PWA_BUILD==='16'&&window.TripCard?.build==='16',{},{timeout:90000});
  await expect(status).toContainText('更新完了（PWA 16 / DB 2）',{timeout:20000});
  expect(await page.evaluate(()=>localStorage.getItem('update-preserve-test'))).toBe('keep');
  expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(snapshot);
  await button.click();await expect(status).toContainText('最新版です（PWA 16 / DB 2）',{timeout:20000});
  await context.setOffline(true);await button.click();await expect(status).toContainText('更新未確認',{timeout:20000});
  expect(await page.evaluate(()=>window.MICHI_APP_BUILD)).toBe('16');await page.reload();await page.waitForFunction(()=>window.MICHI_APP_BUILD==='16');
  expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(snapshot);
 }finally{await context.setOffline(false);await new Promise(resolve=>server.close(resolve));}
});

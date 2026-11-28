const {test,expect}=require('@playwright/test');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const crypto=require('node:crypto');
test('real service worker update button confirms current, installs next, preserves data, handles failed publish/offline',async({page,context})=>{
 let served='16',published='16',versionUnavailable=false;
 const hits=new Map(),changed='assets/icons/ic_feature_market.png',tile='data/land-runtime/132_34.json',image='assets/hero_banner.png';
 const oldBytes=fs.readFileSync(path.join(root,changed)),newBytes=Buffer.concat([oldBytes,Buffer.from('test-change')]);
 const hash=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
 const contentTypes={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
 const server=http.createServer((req,res)=>{
  const u=new URL(req.url,'http://localhost'),rel=u.pathname==='/'?'index.html':u.pathname.slice(1);
  if(rel==='data/version.json'&&versionUnavailable){res.writeHead(503);res.end();return;}
  if(rel==='data/version.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({appVersion:published,dbVersion:'2'}));return;}
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  hits.set(rel,(hits.get(rel)||0)+1);
  let data=fs.readFileSync(file);
  if(served==='17'&&rel===changed)data=newBytes;
  if(served==='17'&&['index.html','app.js','pwa.js','trip-card.js','land-distance.js','detour-enhancements.js','service-worker.js'].includes(rel)){
   data=data.toString().replaceAll('data-app-build="16"','data-app-build="17"').replaceAll('PWA 16 / DB 2','PWA 17 / DB 2').replaceAll('?v=16"','?v=17"').replaceAll('window.MICHI_APP_BUILD="16"','window.MICHI_APP_BUILD="17"').replaceAll('window.TripCard.build!=="16"','window.TripCard.build!=="17"').replaceAll('PWA_APP_VERSION = "16"','PWA_APP_VERSION = "17"').replaceAll('const BUILD="16"','const BUILD="17"').replaceAll('const DETOUR_IMPORT_BUILD = "16"','const DETOUR_IMPORT_BUILD = "17"').replaceAll('const VERSION = "16"','const VERSION = "17"');
  }
  if(served==='17'&&rel==='service-worker.js')data=data.replace(hash(oldBytes),hash(newBytes));
  res.writeHead(200,{'Content-Type':contentTypes[path.extname(rel)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  await page.goto('http://127.0.0.1:'+server.address().port+'/');await page.waitForFunction(()=>!!navigator.serviceWorker.controller&&window.TripCard?.build==='16');
  await page.evaluate(()=>{localStorage.setItem('update-preserve-test','keep');setCurrentDestination('dest',[{name:'保存対象',address:'住所'}],'normal',42);showView('home');});
  await page.evaluate(async tile=>{await (await fetch(tile)).arrayBuffer();},tile);
  const snapshot=await page.evaluate(()=>tripCardSnapshot());
  const button=page.locator('#pwaUpdateButton'),status=page.locator('#pwaDbStatus');
  await button.click();await expect(status).toContainText('最新版です（PWA 16 / DB 2）',{timeout:20000});
  published='17'; // Metadata visible first: do not claim a successful update or clear storage.
  await button.click();await expect(status).toContainText('更新未確認',{timeout:75000});
  expect(await page.evaluate(()=>window.MICHI_APP_BUILD)).toBe('16');
  const before=Object.fromEntries([image,changed,tile,'data/app_data.js','assets/trip-card-detour.jpg'].map(p=>[p,hits.get(p)||0]));
  served='17';await button.click();
  await page.waitForFunction(()=>window.MICHI_APP_BUILD==='17'&&window.MICHI_PWA_BUILD==='17'&&window.TripCard?.build==='17',{},{timeout:90000});
  await expect(status).toContainText('更新完了（PWA 17 / DB 2）',{timeout:20000});
  expect(await page.evaluate(()=>localStorage.getItem('update-preserve-test'))).toBe('keep');
  expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(snapshot);
  expect(hits.get(image)).toBe(before[image]);expect(hits.get('data/app_data.js')).toBe(before['data/app_data.js']);expect(hits.get('assets/trip-card-detour.jpg')).toBe(before['assets/trip-card-detour.jpg']);expect(hits.get(changed)).toBe(before[changed]+1);
  await page.evaluate(async tile=>{await (await fetch(tile)).arrayBuffer();},tile);expect(hits.get(tile)).toBe(before[tile]);
  const cached=await page.evaluate(async p=>Array.from(new Uint8Array(await (await (await caches.open('michinotochu-rebuilt-pwa-17')).match(p)).arrayBuffer())),changed);expect(Buffer.from(cached).equals(newBytes)).toBe(true);
  await button.click();await expect(status).toContainText('最新版です（PWA 17 / DB 2）',{timeout:20000});
  versionUnavailable=true;await context.setOffline(true);await button.click();await expect(status).toContainText('更新未確認',{timeout:20000});
  expect(await page.evaluate(()=>window.MICHI_APP_BUILD)).toBe('17');await page.reload();await page.waitForFunction(()=>window.MICHI_APP_BUILD==='17');
  expect(await page.evaluate(()=>tripCardSnapshot())).toEqual(snapshot);
 }finally{await context.setOffline(false);await new Promise(resolve=>server.close(resolve));}
});

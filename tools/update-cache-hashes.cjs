// Run from repository root: node tools/update-cache-hashes.cjs [--check]
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const paths=cp.execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean).sort();
const eligible=p=>(/^(assets|icons)\//.test(p)||/^data\/(?:land-runtime\/.*\.json$|[^/]+\.js$)/.test(p))&&!/riders_cafes\.js$/.test(p);
const hashes={};for(const p of paths.filter(eligible)){const b=fs.readFileSync(p);hashes[p]=crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');}
const file='service-worker.js',source=fs.readFileSync(file,'utf8'),re=/\/\* HASHES_BEGIN \*\/ .*? \/\* HASHES_END \*\//;
if(!re.test(source))throw Error('Hash manifest marker missing');
const next=source.replace(re,'/* HASHES_BEGIN */ '+JSON.stringify(hashes)+' /* HASHES_END */');
if(process.argv.includes('--check')){if(next!==source)throw Error('Asset hashes stale: run node tools/update-cache-hashes.cjs');console.log('Asset hashes verified:',Object.keys(hashes).length);}
else fs.writeFileSync(file,next);

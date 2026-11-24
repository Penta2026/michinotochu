/* node tools/build-land-sidecar.cjs <polygons.geojson> <output.json> */
const fs=require("node:fs"),vm=require("node:vm"),crypto=require("node:crypto");
const {create}=require("../land-lookup.js"),{build}=require("../land-sidecar.js");
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error("Usage: node tools/build-land-sidecar.cjs <polygons.geojson> <output.json>");
const source=fs.readFileSync(require("node:path").join(__dirname,"../data/app_data.js"),"utf8");
const polygonText=fs.readFileSync(input,"utf8"),polygons=JSON.parse(polygonText);
if(!polygons.features?.length)throw Error("Real polygon dataset required");
const ctx={window:{}};vm.runInNewContext(source,ctx,{timeout:10000});
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const result=build(ctx.window.APP_DATA,create(polygons),{sourceSha256:hash(source),polygonSha256:hash(polygonText)});
fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({total:result.total,counts:result.counts,review:result.review.length},null,2));

/* Stage 5 regression. Run with the extracted original japan-land.geojson.
 * Full dataset is not committed. No fake mainland-to-island connection.
 */
const fs=require("node:fs"),assert=require("node:assert/strict");
const {create:lookupCreate}=require("../land-lookup.js");
const {create,km}=require("../land-distance.js");
const db=require("../data/land-connections-shimanami.json");
const path=process.argv[2];if(!path)throw Error("Supply original japan-land.geojson");
const lookup=lookupCreate(JSON.parse(fs.readFileSync(path,"utf8")));
const engine=create({lookup,connections:db.connections});
const points=[
 {name:"出発地",lat:34.3992388,lng:132.4406034},
 {name:"西条のん太の酒蔵",lat:34.433767,lng:132.703576},
 {name:"たけはら",lat:34.343938,lng:132.912168},
 {name:"しまなみの駅御島",lat:34.248962,lng:133.005253},
 {name:"よしうみいきいき館",lat:34.12747,lng:133.021945}
];
assert.deepEqual(points.map(engine.land),["JP-HONSHU","JP-HONSHU","JP-HONSHU",db.connections[2].b.landId,db.connections[4].b.landId]);
const sections=points.slice(1).map((p,i)=>({direct:km(points[i],p),estimate:engine.estimate(points[i],p)}));
assert.equal(sections[2].estimate,null);
assert.equal(engine.itinerary(points[0],points.slice(1)),null);
assert.equal(engine.estimate(points[3],points[4],{vehicle:"126"}),null);
assert.equal(engine.estimate(points[3],points[4],{sea:"none"}),null);
assert.deepEqual(sections[3].estimate.crossings,["shimanami-moped-4","shimanami-moped-5"]);
// Hypothetical gateway approach: direct*factor to first bridge entry.
// This is NOT a legal connection, full estimate, or proof of road distance.
const via=db.connections[0].a;
const scenario=sections[0].estimate.km+sections[1].estimate.km+km(points[2],via)*1.45+engine.estimate(via,points[3]).km+sections[3].estimate.km;
assert.ok(scenario>80);
console.log(JSON.stringify({sections,scenario,fullEstimate:null,reason:"missing mainland connection"},null,2));

"""Build runtime data from an existing successful candidate artifact; no network."""
import argparse,json,math,hashlib
from pathlib import Path
from shapely.geometry import shape,box,mapping,Point
from shapely.strtree import STRtree
def main():
 p=argparse.ArgumentParser();p.add_argument("source",type=Path);p.add_argument("output",type=Path);p.add_argument("--connections",type=Path,required=True);a=p.parse_args()
 g=json.loads((a.source/"japan-land.geojson").read_text());side=json.loads((a.source/"land-sidecar.json").read_text());db=json.loads(a.connections.read_text())
 if side["total"]!=len(side["entries"]):raise ValueError("sidecar count mismatch")
 if side["metadata"]["polygonSha256"]!=hashlib.sha256((a.source/"japan-land.geojson").read_bytes()).hexdigest():raise ValueError("snapshot mismatch")
 aliases=db.get("fixedIdAliases",{}); ids=[aliases.get(f["properties"]["landId"],f["properties"]["landId"]) for f in g["features"]]
 shapes=[shape(f["geometry"]) for f in g["features"]];tree=STRtree(shapes)
 def land(lat,lng):
  pt=Point(lng,lat);hits=tree.query(pt,predicate="within")
  names={ids[i] for i in hits};return next(iter(names)) if len(names)==1 else None
 for c in db["connections"]:
  for key in ("a","b"):
   e=c[key];e["landId"]=aliases.get(e["landId"],e["landId"])
   if land(e["lat"],e["lng"])!=e["landId"]:raise ValueError("Bridge endpoint mismatch "+c["id"])
 entries={}
 for ident,e in side["entries"].items():
  expected=aliases.get(e["landId"],e["landId"])
  if e["status"]=="land" and land(e["lat"],e["lng"])!=expected:raise ValueError("Spot mismatch "+ident)
  entries[ident]=[e["lat"],e["lng"],expected if e["status"]=="land" else None]
 a.output.mkdir(parents=True,exist_ok=True)
 def write(name,obj):
  (a.output/name).write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"),allow_nan=False),encoding="utf-8")
 write("spots.json",entries);write("connections.json",db["connections"])
 tiles=[];pad=.0002
 for x in range(122,154):
  for y in range(20,46):
   region=box(x-pad,y-pad,x+1+pad,y+1+pad);features=[]
   for i in tree.query(region,predicate="intersects"):
    clipped=shapes[i].intersection(region)
    parts=[clipped] if clipped.geom_type=="Polygon" else [q for q in getattr(clipped,"geoms",[]) if q.geom_type=="Polygon"]
    for part in parts:
     if part.is_empty:continue
     features.append({"type":"Feature","properties":{"landId":ids[i]},"geometry":mapping(part)})
   if features:
    key=f"{x}_{y}";write(key+".json",{"type":"FeatureCollection","features":features});tiles.append(key)
 write("manifest.json",{"schemaVersion":1,"snapshot":side["metadata"]["polygonSha256"],"tiles":tiles,"count":len(entries),"attribution":"© OpenStreetMap contributors, ODbL","coverage":"partial bridge coverage"})
 print("Runtime tiles",len(tiles),"spots",len(entries),"connections",len(db["connections"]))
if __name__=="__main__":main()

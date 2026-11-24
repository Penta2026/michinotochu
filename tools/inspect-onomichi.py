"""Stage 7.3: extract auditable R317 bridge road candidates from OSM XML.
Candidate only: no automatic route activation. Run against runtime tiles.
"""
import argparse,json,math,xml.etree.ElementTree as ET,heapq
from pathlib import Path
from shapely.geometry import shape,Point
from shapely.strtree import STRtree
def km(a,b):
 r=math.pi/180; x=math.sin((a[0]-b[0])*r/2)**2+math.cos(a[0]*r)*math.cos(b[0]*r)*math.sin((a[1]-b[1])*r/2)**2
 return 12742*math.asin(min(1,math.sqrt(x)))
def main():
 p=argparse.ArgumentParser();p.add_argument("osm");p.add_argument("runtime");p.add_argument("output");a=p.parse_args()
 root=ET.parse(a.osm).getroot();nodes={n.attrib["id"]:(float(n.attrib["lat"]),float(n.attrib["lon"])) for n in root.findall("node")}
 manifest=json.loads((Path(a.runtime)/"manifest.json").read_text())
 features=json.loads((Path(a.runtime)/"133_34.json").read_text())["features"]
 geoms=[shape(f["geometry"]) for f in features];tree=STRtree(geoms)
 def land(n):
  lat,lng=nodes[n];hits=tree.query(Point(lng,lat),predicate="within")
  ids={features[i]["properties"]["landId"] for i in hits}
  return next(iter(ids)) if len(ids)==1 else None
 graph={};seeds=[];ways={}
 for w in root.findall("way"):
  tags={t.attrib["k"]:t.attrib["v"] for t in w.findall("tag")};refs=[n.attrib["ref"] for n in w.findall("nd")]
  if tags.get("highway") not in ("trunk","primary","secondary","tertiary","unclassified","residential","primary_link","secondary_link"):continue
  if tags.get("motorroad")=="yes" or tags.get("access") in ("no","private") or tags.get("motor_vehicle") in ("no","private") or tags.get("motorcycle") in ("no","private"):continue
  if not all(n in nodes for n in refs):continue
  ref=tags.get("ref","");is317="317" in ref.split(";")
  if not is317:continue
  wid=w.attrib["id"];ways[wid]={"tags":tags,"nodes":refs}
  for u,v in zip(refs,refs[1:]):
   dist=km(nodes[u],nodes[v]);graph.setdefault(u,[]).append((v,dist,wid));graph.setdefault(v,[]).append((u,dist,wid))
  if tags.get("bridge") not in (None,"no") and (tags.get("name")=="尾道大橋" or tags.get("bridge:name")=="尾道大橋" or min((km(nodes[n],(34.40917,133.216611)) for n in refs),default=100)<.12):
   seeds.append(wid)
 def search(start,target):
  q=[(0,start,[],[start])];seen=set()
  while q:
   d,u,ws,ns=heapq.heappop(q)
   if u in seen:continue
   seen.add(u)
   if d>3:continue
   if land(u)==target:return d,ws,ns
   for v,k,w in graph.get(u,[]):
    if v not in seen:heapq.heappush(q,(d+k,v,ws+[w],ns+[v]))
  return None
 candidates=[]
 for wid in seeds:
  refs=ways[wid]["nodes"]
  for rr in (refs,refs[::-1]):
   left=search(rr[0],"JP-HONSHU");right=search(rr[-1],"JP-MUKAISHIMA")
   if not left or not right:continue
   # No repeated nodes: avoid backtracking onto the bridge or circular candidates.
   ns=left[2][::-1]+rr[1:]+right[2][1:]
   if len(set(ns))!=len(ns):continue
   ws=left[1][::-1]+[wid]+right[1]
   length=sum(km(nodes[u],nodes[v]) for u,v in zip(ns,ns[1:]))
   candidates.append({"a":{"lat":nodes[ns[0]][0],"lng":nodes[ns[0]][1],"landId":"JP-HONSHU"},"b":{"lat":nodes[ns[-1]][0],"lng":nodes[ns[-1]][1],"landId":"JP-MUKAISHIMA"},"km":length,"nodeIds":ns,"points":[nodes[n] for n in ns],"wayIds":ws,"ways":{w:ways[w] for w in set(ws)}})
 candidates.sort(key=lambda c:c["km"])
 out={"schemaVersion":1,"snapshot":manifest["snapshot"],"source":"OpenStreetMap API 0.6 map bbox 133.210,34.405,133.222,34.413","attribution":"© OpenStreetMap contributors, ODbL","status":"review-required","seedWayIds":seeds,"candidates":candidates}
 Path(a.output).write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding="utf-8")
 print("Bridge seeds",len(seeds),"candidate paths",len(candidates))
if __name__=="__main__":main()

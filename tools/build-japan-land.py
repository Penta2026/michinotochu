"""Build Japan-region land polygons from OSM complete WGS84 shapefile.
No simplification, no fabricated geometry. IDs are snapshot-specific unless
a reviewed anchor registry is supplied. Requires geopandas, pyogrio, shapely.
"""
import argparse, json, hashlib
from pathlib import Path
import geopandas as gpd
from shapely.geometry import box, mapping, Point
from shapely.geometry.polygon import orient
from shapely import normalize

def main():
    p=argparse.ArgumentParser()
    p.add_argument("source")
    p.add_argument("output")
    p.add_argument("--anchors", required=True)
    a=p.parse_args()
    extent=box(122,20,154,46)
    data=gpd.read_file(a.source,bbox=extent.bounds,engine="pyogrio")
    if data.crs is None or data.crs.to_epsg()!=4326:
        raise ValueError("Expected WGS84 EPSG:4326 source")
    anchors=json.loads(Path(a.anchors).read_text(encoding="utf-8"))
    if not anchors or len({x["id"] for x in anchors})!=len(anchors):
        raise ValueError("Unique reviewed anchors required")
    features=[]
    matched=set()
    for geo in data.geometry:
        if geo is None or geo.is_empty: continue
        if not geo.is_valid: raise ValueError("Invalid input geometry")
        parts=[geo] if geo.geom_type=="Polygon" else list(geo.geoms) if geo.geom_type=="MultiPolygon" else []
        for part in parts:
            if not part.intersects(extent): continue
            hits=[x for x in anchors if part.contains(Point(x["lng"],x["lat"]))]
            if len(hits)>1: raise ValueError("Multiple land IDs on one polygon: "+str(hits))
            if hits:
                ident=hits[0]["id"]
                if ident in matched: raise ValueError("Repeated anchor "+ident)
                matched.add(ident)
            else:
                ident="OSM-SNAPSHOT-"+hashlib.sha256(normalize(part).wkb).hexdigest()[:24]
            # Keep full island geometry inside the region; clip foreign
            # continental polygons at the boundary to avoid oversized output.
            clipped=part.intersection(extent)
            polygons=[clipped] if clipped.geom_type=="Polygon" else [g for g in getattr(clipped,"geoms",[]) if g.geom_type=="Polygon"]
            if not polygons: continue
            for g in polygons:
                features.append({"type":"Feature","properties":{"landId":ident},"geometry":mapping(orient(g,sign=1))})
    missing={x["id"] for x in anchors}-matched
    if missing: raise ValueError("Unmatched anchors: "+str(missing))
    if not features: raise ValueError("No land polygons")
    out={"type":"FeatureCollection","attribution":"© OpenStreetMap contributors, ODbL","source":"https://osmdata.openstreetmap.de/data/land-polygons.html","features":features}
    with open(a.output,"x",encoding="utf-8") as f: json.dump(out,f,ensure_ascii=False,separators=(",",":"),allow_nan=False)
    print("Features:",len(features),"reviewed anchors:",len(matched))
if __name__=="__main__": main()

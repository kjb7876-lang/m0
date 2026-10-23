#!/usr/bin/env python3
"""Apply the V5 presentation/ward fixes to the preserved V4 candidate.

This operates on a local test package only. It does not edit deployment,
approval records, historical gates, or the original embedded story payload.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client-source"
COPIES = (
    "hospital-improvements-a5.js",
    "hospital-maze-progression.js",
    "world-layout-r78.js",
    "world-combat-r78.js",
    "world-combat-v4-compat.js",
    "world-assets-r80.js",
    "world-assets-r80-data.js",
    "world-environment-r81.js",
    "world-presentation-r81.js",
)
ADDITIONS = ("world-environment-r81.js", "world-presentation-r81.js")


def digest(data):
    return hashlib.sha256(data).hexdigest()


def apply(site: Path):
    for name in COPIES:
        if not (SOURCE / name).is_file():
            raise ValueError("R81 source is not ready: " + name)
    index = site / "index.html"
    renderer_path = site / "dist/phase1.js"
    manifest_path = site / "web-manifest-r62.json"
    manifest = json.loads(manifest_path.read_text())
    if not manifest.get("r80"):
        raise ValueError("The existing R80/V4 candidate is required")
    html = index.read_text()
    payload = re.search(r'<script type="application/json" id="portable-data">(.*?)</script>', html, re.S)
    if not payload:
        raise ValueError("Original story payload is missing")
    original_payload_sha = digest(payload.group(1).encode())
    renderer = renderer_path.read_text()
    begin, end = "/* R81_LAYOUT_BEGIN */", "/* R81_LAYOUT_END */"
    fragment = (SOURCE / "world-layout-r78.js").read_text()
    if begin in renderer:
        a, b = renderer.index(begin), renderer.index(end) + len(end)
        if renderer[b:b + 1] == "\n":
            b += 1
    else:
        marker = "/* Source fragment injected into the pinned Three renderer by apply-r78.py."
        if renderer.count(marker) != 1:
            raise ValueError("Expected preserved V4 layout fragment")
        a = renderer.index(marker)
        b = renderer.index('function explorationLayout(id,theme="cave",safe=false,meta={})', a)
        if b - a > 20000:
            raise ValueError("Unexpected renderer fragment range")
    renderer = renderer[:a] + begin + "\n" + fragment + "\n" + end + "\n" + renderer[b:]
    renderer_path.write_text(renderer)
    for name in COPIES:
        shutil.copyfile(SOURCE / name, site / name)
    for name in ADDITIONS:
        tag = f'<script src="./{name}"></script>'
        if html.count(tag) > 1:
            raise ValueError("Duplicate R81 runtime: " + name)
        html = html.replace(tag, "").rstrip()
    html += "\n" + "\n".join(f'<script src="./{name}"></script>' for name in ADDITIONS) + "\n"
    compat_tag = '<script src="./world-combat-v4-compat.js"></script>'
    combat_tag = '<script src="world-combat-r78.js"></script>'
    html = html.replace(compat_tag + "\n", "")
    if html.count(combat_tag) != 1:
        raise ValueError("Expected V4/R81 combat integration anchor")
    html = html.replace(combat_tag, compat_tag + "\n" + combat_tag, 1)
    for clamp in ("function clampCamera(){", "function clampCamera(p){"):
        guarded = clamp + "if(window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera())return;"
        if guarded not in html:
            if html.count(clamp) != 1:
                raise ValueError("Expected native camera clamp anchor: " + clamp)
            html = html.replace(clamp, guarded, 1)
    next_before = "next=r.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'&&!r.cleared?null:authored&&nearest(authored,r,entry)"
    next_intermediate = "next=(r.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'&&!r.cleared||r.exploration?.worldWardR81&&(!r.cleared||!window.__STORYWORLD_WORLD_R74__?.isOpen(r,r.exploration.worldR74.doors.find(d=>d.id==='door-2'))))?null:authored&&nearest(authored,r,entry)"
    next_after = "next=r.exploration?.worldWardR81?(r.cleared&&authored&&!blocked(authored.x,authored.y,.43,r)?{x:authored.x,y:authored.y}:null):r.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'&&!r.cleared?null:authored&&nearest(authored,r,entry)"
    html = html.replace(next_intermediate, next_after)
    portal_replacements = (
        ("if(r.id==='ep1a08'&&blocked(entry.x,entry.y,.43,r))",
         "if((r.id==='ep1a08'||r.exploration?.worldWardR81)&&blocked(entry.x,entry.y,.43,r))"),
        ("r.id==='ep1a08'?r.exploration?.hospitalLayoutRevision:''].join(':')",
         "r.id==='ep1a08'?r.exploration?.hospitalLayoutRevision:r.exploration?.worldWardR81?window.__STORYWORLD_WORLD_R74__?.generation():''].join(':')"),
        ("authored=source?.landmarks?.[0]||Object.values(source?.exits||{})[0]",
         "authored=r.exploration?.worldWardR81?.portalNext||source?.landmarks?.[0]||Object.values(source?.exits||{})[0]"),
        (next_before, next_after),
    )
    for before, after in portal_replacements:
        if after not in html:
            if html.count(before) != 1:
                raise ValueError("Expected native physical portal anchor: " + before)
            html = html.replace(before, after, 1)
    # The native generic sweep covers physical walls, but interactive R74
    # doors are runtime state, not static layout walls. Sweep that same door
    # state for both friendly and hostile projectiles on the new ward maps.
    door_anchor = " if(L?.floorCells&&!L.hospitalAnalytic12){"
    door_sweep = """ // R81 closed narrative doors participate in the same analytic shot sweep.
 if(L?.worldWardR81)for(const d of L.worldR74?.doors||[])if(!window.__STORYWORLD_WORLD_R74__?.isOpen(r,d)){
  const x0=d.x-d.width/2,y0=d.y-d.depth/2,x1=d.x+d.width/2,y1=d.y+d.depth/2;
  rect(x0,y0,x1,y1);roundedRect(x0,y0,x1,y1,radius);
 }
"""
    if door_sweep not in html:
        if html.count(door_anchor) != 1:
            raise ValueError("Expected native projectile floor sweep anchor")
        html = html.replace(door_anchor, door_sweep + door_anchor, 1)
    shot_before = "terrainT=room?.exploration?.hospitalAnalytic12?terrainContact153(b.px,b.py,endX,endY,b.radius):null"
    shot_after = "terrainT=(room?.exploration?.hospitalAnalytic12||room?.exploration?.worldWardR81)?terrainContact153(b.px,b.py,endX,endY,b.radius):null"
    if shot_after not in html:
        if html.count(shot_before) != 1:
            raise ValueError("Expected native hostile projectile sweep anchor")
        html = html.replace(shot_before, shot_after, 1)
    height_before = "return e?.mazeEliteR2===true?ordinary*2:major(e)?config.bossHeight:ordinary;"
    height_after = "return (e?.mazeEliteR2===true||e?.wardChampionR81===true)?ordinary*2:major(e)?config.bossHeight:ordinary;"
    if height_after not in html:
        if html.count(height_before) != 1:
            raise ValueError("Expected native champion size contract anchor")
        html = html.replace(height_before, height_after, 1)
    scope_replacements = (
        ("key=id+':'+seed+':'+version+':r75:'+r75version",
         "key=id+':'+l+':r81ego:'+Number(!!window.__STORYWORLD_R81_EGO_BUILD__)+':'+seed+':'+version+':r75:'+r75version"),
        ("{...d?.meta,seedR73:seed,worldR74:version,worldR75:r75version,hospitalDoorsB3:",
         "{...d?.meta,seedR73:seed,layerR81:l,egoVisitR81:!!window.__STORYWORLD_R81_EGO_BUILD__,worldR74:version,worldR75:r75version,hospitalDoorsB3:"),
        ("function buildRoom(id,l){const r=makeRoom(id,l);r.egoVisitId151=ego151.visitId;",
         "function buildRoom(id,l){let r;const previousR81=window.__STORYWORLD_R81_EGO_BUILD__;window.__STORYWORLD_R81_EGO_BUILD__=true;try{r=makeRoom(id,l);}finally{window.__STORYWORLD_R81_EGO_BUILD__=previousR81;}r.egoVisitId151=ego151.visitId;"),
    )
    for before, after in scope_replacements:
        if after not in html:
            if html.count(before) != 1:
                raise ValueError("Expected native layout scope anchor: " + before)
            html = html.replace(before, after, 1)
    arrival_before = "const goal=r?.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'"
    arrival_intermediate = "const goal=r?.exploration?.worldWardR81&&!r.cleared?r.exploration.worldWardR81.gatherAnchor:r?.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'"
    arrival_after = "const goal=r?.exploration?.worldWardR81&&!r.cleared?(r.exploration.worldWardR81.arrivalAnchor||r.exploration.worldWardR81.gatherAnchor):r?.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'"
    html = html.replace(arrival_intermediate, arrival_after)
    if arrival_after not in html:
        if html.count(arrival_before) != 1:
            raise ValueError("Expected native portal arrival goal anchor")
        html = html.replace(arrival_before, arrival_after, 1)
    restore_replacements = (
        ("(r.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'||findPath(r.objective,{x,y},r).length>0)",
         "(r.exploration?.worldWardR81||r.id==='ep1a08'&&r.exploration?.hospitalCoreB2?.revision==='ep1a08-ward-maze-r2'||findPath(r.objective,{x,y},r).length>0)"),
        ("e.x=clamp(finite(old.x,e.x),2,28);e.y=clamp(finite(old.y,e.y),2,28);e.graceUntil=time+.75;",
         "e.x=r.exploration?.worldWardR81?clamp(finite(old.x,e.x),r.exploration.bounds[0]+e.combatProfile.bodyBlock.r,r.exploration.bounds[2]-e.combatProfile.bodyBlock.r):clamp(finite(old.x,e.x),2,28);e.y=r.exploration?.worldWardR81?clamp(finite(old.y,e.y),r.exploration.bounds[1]+e.combatProfile.bodyBlock.r,r.exploration.bounds[3]-e.combatProfile.bodyBlock.r):clamp(finite(old.y,e.y),2,28);e.graceUntil=time+.75;"),
    )
    for before, after in restore_replacements:
        if after not in html:
            if html.count(before) != 1:
                raise ValueError("Expected native actor restoration anchor: " + before)
            html = html.replace(before, after, 1)
    html = html.replace('src="./dist/phase1.js?r78=1"', 'src="./dist/phase1.js?r81=1"')
    html = html.replace("storyworld.hospital-three-pc.maze.v4:", "storyworld.hospital-three-pc.maze.v5:")
    after = re.search(r'<script type="application/json" id="portable-data">(.*?)</script>', html, re.S)
    if digest(after.group(1).encode()) != original_payload_sha:
        raise ValueError("Original payload changed")
    index.write_text(html)
    for name in ("hospital-pc-test.js", "hospital-direct-test.js"):
        p = site / name
        p.write_text(p.read_text().replace("storyworld.hospital-three-pc.maze.v4:", "storyworld.hospital-three-pc.maze.v5:"))
    rows = {r["path"]: r for r in manifest["files"]}
    for name in (*COPIES, "dist/phase1.js", "index.html", "hospital-pc-test.js", "hospital-direct-test.js"):
        b = (site / name).read_bytes()
        rows[name] = {"path": name, "bytes": len(b), "sha256": digest(b)}
    manifest["files"] = sorted(rows.values(), key=lambda r: r["path"])
    manifest["fileCount"] = len(rows)
    manifest["totalBytes"] = sum(r["bytes"] for r in rows.values())
    manifest["webHTMLSha256"] = rows["index.html"]["sha256"]
    manifest["largest"] = sorted(rows.values(), key=lambda r: r["bytes"], reverse=True)[:20]
    manifest["r81"] = {
        "revision": "V5",
        "baseline": "R80/V4 preserved candidate",
        "storyPayloadSha256": original_payload_sha,
        "htmlSha256": rows["index.html"]["sha256"],
        "rendererSha256": rows["dist/phase1.js"]["sha256"],
        "testStoragePrefix": "storyworld.hospital-three-pc.maze.v5:",
        "browserVerified": False,
        "GPUVerified": False,
        "naturalPlayVerified": False,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    result = {"status": "R81_APPLIED", **manifest["r81"], "files": len(rows)}
    print(json.dumps(result, ensure_ascii=False))
    return result


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--site", type=Path, default=ROOT / "hospital-three-pc/site")
    apply(p.parse_args().site)

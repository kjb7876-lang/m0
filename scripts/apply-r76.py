#!/usr/bin/env python3
"""Apply the R76 golden design-capacity overlay after the exact R75 release gate."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

R75_HTML_SHA256 = "971ab5fa455203576e0ec3005557321bc36e56220072d5b0f3078d53cc6d8f57"
R75_RENDERER_SHA256 = "22a04872281d2fe260d34c4c618f9b608c8afbefe1faf2c759f0ee00d9bf04bb"

BLOCKER_BASELINE = """function explorationBlocked(layout,x,y,radius=.27){
 if(!layout)return false;if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return true;
 if(layout.hospitalAnalytic12)return hospitalBlocked12(layout,x,y,radius);
 const index=explorationIndex(layout),b=layout.bounds;if(x-radius<b[0]||y-radius<b[1]||x+radius>b[2]||y+radius>b[3])return true;
 if(index.floor)for(let a=Math.floor(x-radius);a<=Math.floor(x+radius);a++)for(let c=Math.floor(y-radius);c<=Math.floor(y+radius);c++)if(!index.floor.has(explorationCellKey(a,c))&&Math.hypot(Math.max(a-x,0,x-a-1),Math.max(c-y,0,y-c-1))<radius+1e-8)return true;
 return (index.walls.get(explorationCellKey(Math.floor(x/5),Math.floor(y/5)))||[]).some(w=>!w.decorative&&Math.hypot(Math.max(Math.abs(x-w.x)-w.width/2,0),Math.max(Math.abs(y-w.y)-w.depth/2,0))<radius);
}"""

BLOCKER_OPTIMIZED = """function explorationBlocked(layout,x,y,radius=.27){
 if(!layout)return false;if(!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(radius)||radius<0)return true;
 if(layout.hospitalAnalytic12)return hospitalBlocked12(layout,x,y,radius);
 const index=explorationIndex(layout),b=layout.bounds;if(x-radius<b[0]||y-radius<b[1]||x+radius>b[2]||y+radius>b[3])return true;
 if(index.floor){const floorRadius=radius+1e-8;for(let a=Math.floor(x-radius);a<=Math.floor(x+radius);a++)for(let c=Math.floor(y-radius);c<=Math.floor(y+radius);c++)if(!index.floor.has(explorationCellKey(a,c))){const dx=Math.max(a-x,0,x-a-1);if(dx>=floorRadius)continue;const dy=Math.max(c-y,0,y-c-1);if(dy<floorRadius&&Math.hypot(dx,dy)<floorRadius)return true;}}
 const candidates=index.walls.get(explorationCellKey(Math.floor(x/5),Math.floor(y/5)))||[];for(let i=0;i<candidates.length;i++){const w=candidates[i];if(w.decorative)continue;const dx=Math.abs(x-w.x)-w.width/2;if(dx>=radius)continue;const dy=Math.abs(y-w.y)-w.depth/2;if(dy>=radius)continue;if(Math.hypot(Math.max(dx,0),Math.max(dy,0))<radius)return true;}return false;
}"""


def optimize_blocked(renderer: str) -> str:
    return once(renderer, BLOCKER_BASELINE, BLOCKER_OPTIMIZED, "R75 blocker distance prefilters")


def once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"R76 anchor drift for {label}: expected 1, found {count}")
    return source.replace(old, new, 1)


def edit_script(html: str, script_id: str, transform) -> str:
    tag = f'<script id="{script_id}">'
    start = html.find(tag)
    if start < 0:
        raise RuntimeError(f"R76 script missing: {script_id}")
    body_start = start + len(tag)
    body_end = html.find("</script>", body_start)
    if body_end < 0:
        raise RuntimeError(f"R76 script is unterminated: {script_id}")
    body = transform(html[body_start:body_end])
    return html[:body_start] + body + html[body_end:]


def core(body: str) -> str:
    body = once(body,
        "slots:7,targets:8", "slots:12,targets:8", "12 design limit")
    body = once(body,
        "return{version:2,learned:false,designs:[]",
        "return{version:2,slotCapacityVersion:1,learned:false,designs:[]",
        "slot schema marker")
    body = once(body,
        "function sanitize(raw){", "function sanitize(raw,channel='gold'){",
        "channel-aware save migration")
    body = once(body,
        "s.legacyCredit=raw.version===1?s.ranks.slots+Math.max(0,(raw.ranks?.speed||0)-7):",
        "s.legacyCredit=raw.version===1?Math.max(0,(raw.ranks?.speed||0)-7):",
        "avoid refunding active slot ranks")
    body = once(body,
        "].slice(0,12)){if(!d||!safeId(d.id)",
        "].slice(0,LIMIT.slots)){if(!d||!safeId(d.id)",
        "bounded saved-design migration")
    body = once(body,
        "const wanted=[...new Set((Array.isArray(raw.equipped)?raw.equipped:[]).filter(id=>ids.has(id)))].slice(0,s.ranks.equip?3:1),chosen=new Set(wanted);for(const d of all){if(chosen.size>=7)break;chosen.add(d.id);}",
        "const capacity=channel==='gold'?7+Math.min(5,s.ranks.slots):7,wanted=[...new Set((Array.isArray(raw.equipped)?raw.equipped:[]).filter(id=>ids.has(id)))].slice(0,s.ranks.equip?3:1),chosen=new Set(wanted);for(const d of all){if(chosen.size>=capacity)break;chosen.add(d.id);}",
        "channel-specific capacity migration")
    body = once(body,
        "function stats(s){const r=s.ranks,n=damageLevel(s),damage=n.length>14?1e12:Math.min(1e12,1+.1*Number(n));return{slots:7,",
        "function stats(s,channel='gold'){const r=s.ranks,n=damageLevel(s),damage=n.length>14?1e12:Math.min(1e12,1+.1*Number(n));return{slots:channel==='gold'?7+clamp(r.slots,0,5):7,",
        "channel-specific runtime stats")
    return body


def dances(body: str) -> str:
    body = once(body,
        "if(s?.version!==2)s=p[field(k)]=C.sanitize(s);",
        "if(s?.version!==2||s.slotCapacityVersion!==1||!s.ranks||!Number.isSafeInteger(s.ranks.slots)||!Array.isArray(s.designs)||!Array.isArray(s.archive))s=p[field(k)]=C.sanitize(s,k);else if(s.designs.length>C.stats(s,k).slots)s=p[field(k)]=C.sanitize(s,k);",
        "one-time slot-capacity migration")
    body = once(body,
        "function stats(k,p=local()){return C.stats(state(k,p));}",
        "function stats(k,p=local()){return C.stats(state(k,p),k);}",
        "channel-aware capacity lookup")
    body = once(body,
        "if(!d&&s.designs.length>=7)return fail('도안은 7개까지 저장합니다. 기존 도안을 편집·교체하세요.');",
        "if(!d&&s.designs.length>=t.slots)return fail('도안 저장칸이 가득 찼습니다. 저장칸을 강화하거나 기존 도안을 편집·교체하세요.');",
        "save capacity guard")
    body = once(body,
        "if(!d||s.designs.length>=7)return fail('도안 또는 빈 저장칸을 확인하세요.');",
        "if(!d||s.designs.length>=t.slots)return fail('도안 또는 빈 저장칸을 확인하세요.');",
        "clone capacity guard")
    body = once(body,
        "const r=cmd.key,caps={cooldown:10,size:10,speed:7,equip:1};if(!s.learned||!['damage',...Object.keys(caps)].includes(r))return fail('강화 항목을 확인하세요.');",
        "const r=cmd.key,caps={cooldown:10,size:10,speed:7,slots:5,equip:1};if(!s.learned||!['damage',...Object.keys(caps)].includes(r))return fail('강화 항목을 확인하세요.');if(k==='silver'&&r==='slots')return fail('도안 저장칸 강화는 황금실 필살검무에 적용됩니다.');",
        "independent slot upgrade")
    body = once(body,
        "p.points-=cost;s.ranks[r]=n;changed=true;",
        "p.points-=cost;s.ranks[r]=n;if(r==='slots'){const capacity=stats(k,p).slots;while(s.designs.length<capacity&&s.archive.length)s.designs.push(s.archive.shift());}changed=true;",
        "restore archived designs after a slot purchase")
    body = once(body,
        "C.sanitize(state(k,player)),clock=ready(player,k)",
        "C.sanitize(state(k,player),k),clock=ready(player,k)",
        "channel-aware save export")
    body = once(body,
        "C.sanitize(raw?.silverR74)", "C.sanitize(raw?.silverR74,'silver')",
        "silver save migration")
    body = once(body,
        "C.sanitize(state(k,p)):null",
        "C.sanitize(state(k,p),k):null",
        "channel-aware inspection")
    return body


def ui(body: str) -> str:
    body = once(body,
        "return{s,stats:C.stats(s),p};",
        "return{s,stats:C.stats(s,uiKindR74),p};",
        "editor capacity display")
    body = once(body,
        "const upgrades=[['cooldown','쿨타임'],['damage','피해'],['size','크기'],['speed','속도'],['equip','동시장착']];",
        "const upgrades=[['cooldown','쿨타임'],['damage','피해'],['size','크기'],['speed','속도'],...(uiKindR74==='gold'?[['slots','도안 저장칸']]:[]),['equip','동시장착']];",
        "gold-only saved slot upgrade")
    body = once(body,
        "도안 7개, 동시장착 해금은 총 7점으로 1→3개. 속도 최대 7단계, 재사용 최소 3초, 피해는 단계 제한 없이 1점씩 강화합니다. 기존 저장칸·초과 속도 투자는 한 번만 포인트로 돌려줍니다.",
        "황금실 저장칸은 기존 기본 7개에서 단계당 1점으로 최대 12개까지 늘고, 은색실은 7개로 고정됩니다. 동시장착은 별도 강화로 총 7점에 1개에서 3개가 됩니다. 속도 최대 7단계, 재사용 최소 3초, 피해는 1점씩 강화합니다. 기존 초과 속도 투자는 한 번만 포인트로 돌려줍니다.",
        "capacity and cost guidance")
    return body


def build(site: Path) -> dict:
    index = site / "index.html"
    html = index.read_text(encoding="utf-8")
    if 'id="dance-policy-r75"' not in html:
        raise RuntimeError("R76 must follow the exact R75 overlay")
    before = hashlib.sha256(html.encode("utf-8")).hexdigest()
    if before != R75_HTML_SHA256:
        raise RuntimeError(f"R76 requires the exact R75 HTML, found {before}")
    renderer_path = site / "dist" / "phase1.js"
    baseline_renderer = renderer_path.read_bytes()
    baseline_renderer_sha = hashlib.sha256(baseline_renderer).hexdigest()
    if baseline_renderer_sha != R75_RENDERER_SHA256:
        raise RuntimeError(f"R76 requires the exact R75 renderer, found {baseline_renderer_sha}")
    html = edit_script(html, "golden-core-r72", core)
    html = edit_script(html, "thread-dances-r74", dances)
    html = edit_script(html, "golden-thread-r72", ui)
    html_bytes = html.encode("utf-8")
    renderer_bytes = optimize_blocked(baseline_renderer.decode("utf-8")).encode("utf-8")
    renderer_sha = hashlib.sha256(renderer_bytes).hexdigest()
    output = Path("out/r76")
    output.mkdir(parents=True, exist_ok=True)
    (output / "phase1-r75.js").write_bytes(baseline_renderer)
    index.write_bytes(html_bytes)
    renderer_path.write_bytes(renderer_bytes)
    manifest_path = site / "web-manifest-r62.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    index_row, = [row for row in manifest["files"] if row["path"] == "index.html"]
    renderer_row, = [row for row in manifest["files"] if row["path"] == "dist/phase1.js"]
    index_row.update(bytes=len(html_bytes), sha256=hashlib.sha256(html_bytes).hexdigest())
    if renderer_row["sha256"] != baseline_renderer_sha:
        raise RuntimeError("R75 manifest renderer lineage drift")
    renderer_row.update(bytes=len(renderer_bytes), sha256=renderer_sha)
    manifest["webHTMLSha256"] = index_row["sha256"]
    manifest["r76"] = {
        "baselineR75HtmlSha256": before,
        "baselineR75RendererSha256": baseline_renderer_sha,
        "htmlSha256": index_row["sha256"],
        "rendererSha256": renderer_sha,
        "designSlots": {"goldenBase": 7, "pointsPerSlot": 1, "maximum": 12, "silverFixed": 7},
        "equippedSlots": {"base": 1, "maximum": 3, "unlockCost": 7},
        "runtimeChange": "collision-equivalent axis-distance early rejects and indexed wall scan",
    }
    manifest["fileCount"] = len(manifest["files"])
    manifest["totalBytes"] = sum(row["bytes"] for row in manifest["files"])
    manifest["largest"] = sorted(manifest["files"], key=lambda row: row["bytes"], reverse=True)[:20]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    out = {
        "status": "R76_GOLDEN_STORAGE_OVERLAY_APPLIED",
        "baselineR75HtmlSHA256": before,
        "baselineR75RendererSHA256": baseline_renderer_sha,
        "htmlSHA256": index_row["sha256"],
        "rendererSHA256": renderer_sha,
        "manifestSHA256": hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        "designSlots": {"goldenBase": 7, "pointsPerSlot": 1, "maximum": 12, "silverFixed": 7},
        "equippedSlots": {"base": 1, "maximum": 3, "unlockCost": 7},
        "runtimeChange": "collision-equivalent axis-distance early rejects and indexed wall scan",
    }
    try:
        out["headSHA"] = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        pass
    return out


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, required=True)
    args = parser.parse_args()
    result = build(args.site)
    output = Path("out/r76")
    output.mkdir(parents=True, exist_ok=True)
    (output / "build.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False))

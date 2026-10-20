#!/usr/bin/env python3
"""Apply the R76 golden design-capacity overlay after the exact R75 release gate."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


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
        "const capacity=channel==='gold'?3+s.ranks.slots:7,wanted=[...new Set((Array.isArray(raw.equipped)?raw.equipped:[]).filter(id=>ids.has(id)))].slice(0,s.ranks.equip?3:1),chosen=new Set(wanted);for(const d of all){if(chosen.size>=capacity)break;chosen.add(d.id);}",
        "channel-specific capacity migration")
    body = once(body,
        "function stats(s){const r=s.ranks,n=damageLevel(s),damage=n.length>14?1e12:Math.min(1e12,1+.1*Number(n));return{slots:7,",
        "function stats(s,channel='gold'){const r=s.ranks,n=damageLevel(s),damage=n.length>14?1e12:Math.min(1e12,1+.1*Number(n));return{slots:channel==='gold'?3+clamp(r.slots,0,9):7,",
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
        "const r=cmd.key,caps={cooldown:10,size:10,speed:7,slots:9,equip:1};if(!s.learned||!['damage',...Object.keys(caps)].includes(r))return fail('강화 항목을 확인하세요.');if(k==='silver'&&r==='slots')return fail('도안 저장칸 강화는 황금실 필살검무에 적용됩니다.');",
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
        "황금실 저장칸은 기본 3개에서 단계당 1점으로 최대 12개까지 늘고, 은색실은 7개로 고정됩니다. 동시장착은 별도 강화로 총 7점에 1개에서 3개가 됩니다. 속도 최대 7단계, 재사용 최소 3초, 피해는 1점씩 강화합니다. 기존 초과 속도 투자는 한 번만 포인트로 돌려줍니다.",
        "capacity and cost guidance")
    return body


def build(site: Path) -> dict:
    index = site / "index.html"
    html = index.read_text(encoding="utf-8")
    if 'id="dance-policy-r75"' not in html:
        raise RuntimeError("R76 must follow the exact R75 overlay")
    before = hashlib.sha256(html.encode("utf-8")).hexdigest()
    html = edit_script(html, "golden-core-r72", core)
    html = edit_script(html, "thread-dances-r74", dances)
    html = edit_script(html, "golden-thread-r72", ui)
    html_bytes = html.encode("utf-8")
    index.write_bytes(html_bytes)
    renderer_sha = hashlib.sha256((site / "dist" / "phase1.js").read_bytes()).hexdigest()
    manifest_path = site / "web-manifest-r62.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    index_row, = [row for row in manifest["files"] if row["path"] == "index.html"]
    index_row.update(bytes=len(html_bytes), sha256=hashlib.sha256(html_bytes).hexdigest())
    manifest["webHTMLSha256"] = index_row["sha256"]
    manifest["r76"] = {
        "baselineR75HtmlSha256": before,
        "htmlSha256": index_row["sha256"],
        "rendererSha256": renderer_sha,
        "designSlots": {"goldenBase": 3, "pointsPerSlot": 1, "maximum": 12, "silverFixed": 7},
        "equippedSlots": {"base": 1, "maximum": 3, "unlockCost": 7},
    }
    manifest["fileCount"] = len(manifest["files"])
    manifest["totalBytes"] = sum(row["bytes"] for row in manifest["files"])
    manifest["largest"] = sorted(manifest["files"], key=lambda row: row["bytes"], reverse=True)[:20]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    out = {
        "status": "R76_GOLDEN_STORAGE_OVERLAY_APPLIED",
        "baselineR75HtmlSHA256": before,
        "htmlSHA256": index_row["sha256"],
        "rendererSHA256": renderer_sha,
        "manifestSHA256": hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        "designSlots": {"goldenBase": 3, "pointsPerSlot": 1, "maximum": 12, "silverFixed": 7},
        "equippedSlots": {"base": 1, "maximum": 3, "unlockCost": 7},
    }
    try:
        out["headSHA"] = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
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

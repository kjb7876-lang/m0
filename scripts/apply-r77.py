#!/usr/bin/env python3
"""Apply the R77 guide-continuation overlay to the exact approved R76 site."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
R77_METADATA = {
    "rendererCacheKey": "r76=1",
    "runtimeChange": "guide-owned next-story travel chooses Normal; readable guide Continue",
    "normalTravelScope": "one-use guide-issued open next-story portal only; existing story admission/guest guards retained",
    "sceneAdvance": {
        "parts": ["pre", "post", "firstPost", "awakenPre", "prologue.pre", "prologue.post"],
        "minimumDelayMs": 6000,
        "maximumDelayMs": 45000,
        "waitForNarration": True,
    },
    "legacySave": "no schema change; transient token/timer are not serialized",
}


def sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"R77 anchor drift for {label}: expected 1, found {count}")
    return source.replace(old, new, 1)


def edit_script(html: str, script_id: str, transform) -> str:
    tag = f'<script id="{script_id}">'
    start = html.find(tag)
    if start < 0:
        raise RuntimeError(f"R77 script missing: {script_id}")
    body_start = start + len(tag)
    body_end = html.find("</script>", body_start)
    if body_end < 0:
        raise RuntimeError(f"R77 script is unterminated: {script_id}")
    body = transform(html[body_start:body_end])
    return html[:body_start] + body + html[body_end:]


def campaign(body: str) -> str:
    old = "if(nextStory(id,l)){if(coopMode()==='guest'){toast('다음 지역과 난이도는 방장만 정할 수 있습니다.',2);return false;}return picker.call(this,id,from,options);}"
    new = "if(nextStory(id,l)){if(coopMode()==='guest'){toast('다음 지역과 난이도는 방장만 정할 수 있습니다.',2);return false;}const guidedNormal=window.__STORYWORLD_GUIDE_R77__?.takeNextNormal(id,l,zone);if(!guidedNormal)return picker.call(this,id,from,options);options={...options,difficultyR63:guidedNormal};}"
    return once(body, old, new, "Normal only after next-story admission and guest check")


def guide(body: str) -> str:
    body = once(body,
        "if(goal.kind==='portal')travel(goal.direction);else interact();",
        "if(goal.kind==='portal'){const guideR77=window.__STORYWORLD_GUIDE_R77__,intentR77=guideR77?.armNextNormal(goal,zone,layer),resultR77=travel(goal.direction);if(intentR77&&resultR77?.then)resultR77.then(ok=>{if(!ok)guideR77.cancelNextNormal(intentR77);},()=>guideR77.cancelNextNormal(intentR77));else if(intentR77&&resultR77===false)guideR77.cancelNextNormal(intentR77);}else interact();",
        "arm Normal intent only at guide-owned portal dispatch")
    return body


def menu(html: str) -> str:
    return once(html,
        "guide=!guide;auto=guide;guideTimer=0;closePanel();",
        "guide=!guide;auto=guide;guideTimer=0;window.__STORYWORLD_GUIDE_R77__?.syncGuide();closePanel();",
        "cancel R77 timer when the existing guide toggle turns OFF")


def build(site: Path) -> dict:
    approval_path = ROOT / "scripts/r76-approved-runtime.json"
    approval = json.loads(approval_path.read_text(encoding="utf-8"))
    expected = approval.get("approvedR76")
    if not isinstance(expected, dict) or set(expected) != {"index.html", "dist/phase1.js"}:
        raise RuntimeError("R77 requires the approvedR76 HTML and renderer hashes")

    index_path = site / "index.html"
    renderer_path = site / "dist/phase1.js"
    html_bytes = index_path.read_bytes()
    renderer_bytes = renderer_path.read_bytes()
    baseline_html_sha = sha256(html_bytes)
    baseline_renderer_sha = sha256(renderer_bytes)
    if baseline_html_sha != expected["index.html"]:
        raise RuntimeError(f"R77 requires exact approved R76 HTML, found {baseline_html_sha}")
    if baseline_renderer_sha != expected["dist/phase1.js"]:
        raise RuntimeError(f"R77 requires exact approved R76 renderer, found {baseline_renderer_sha}")

    manifest_path = site / "web-manifest-r62.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    rows = {row["path"]: row for row in manifest["files"]}
    if rows.get("index.html", {}).get("sha256") != baseline_html_sha:
        raise RuntimeError("R76 manifest HTML hash does not match the site")
    if rows.get("dist/phase1.js", {}).get("sha256") != baseline_renderer_sha:
        raise RuntimeError("R76 manifest renderer hash does not match the site")
    if not isinstance(manifest.get("r76"), dict):
        raise RuntimeError("R77 must follow the R76 manifest overlay")

    html = html_bytes.decode("utf-8")
    html = edit_script(html, "campaign-combat-r63r1", campaign)
    html = edit_script(html, "guide-r75", guide)
    html = menu(html)
    overlay = (ROOT / "client-source/guide-r77.js").read_text(encoding="utf-8")
    if "</script" in overlay.lower():
        raise RuntimeError("Unsafe R77 script close tag")
    if 'id="guide-r77"' in html:
        raise RuntimeError("R77 guide runtime is already present")
    html += '\n<script id="guide-r77">\n' + overlay + '\n</script>\n'

    output_html = html.encode("utf-8")
    output_html_sha = sha256(output_html)
    output_renderer_sha = sha256(renderer_bytes)
    rows["index.html"].update(bytes=len(output_html), sha256=output_html_sha)
    rows["dist/phase1.js"].update(bytes=len(renderer_bytes), sha256=output_renderer_sha)
    manifest["webHTMLSha256"] = output_html_sha
    manifest["r77"] = {
        "baselineR76HtmlSha256": baseline_html_sha,
        "baselineR76RendererSha256": baseline_renderer_sha,
        "htmlSha256": output_html_sha,
        "rendererSha256": output_renderer_sha,
        **R77_METADATA,
    }
    manifest["fileCount"] = len(manifest["files"])
    manifest["totalBytes"] = sum(row["bytes"] for row in manifest["files"])
    manifest["largest"] = sorted(manifest["files"], key=lambda row: row["bytes"], reverse=True)[:20]

    index_path.write_bytes(output_html)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    result = {
        "status": "R77_GUIDE_NORMAL_OVERLAY_APPLIED",
        "baselineR76HtmlSha256": baseline_html_sha,
        "baselineR76RendererSha256": baseline_renderer_sha,
        "htmlSha256": output_html_sha,
        "rendererSha256": output_renderer_sha,
        "manifestSha256": sha256(manifest_path.read_bytes()),
        "rendererUnchanged": renderer_bytes == renderer_path.read_bytes(),
        "rendererCacheKey": "r76=1",
        "scriptId": "guide-r77",
        **R77_METADATA,
    }
    out_dir = ROOT / "out/r77"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "apply.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    try:
        result["headSHA"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except (OSError, subprocess.CalledProcessError):
        result["headSHA"] = None
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, default=Path("_pages/docs"))
    args = parser.parse_args()
    build(args.site)


if __name__ == "__main__":
    main()

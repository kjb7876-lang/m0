#!/usr/bin/env python3
"""Apply the PC story-world maze overlay after an R77-built site.

The patch is intentionally additive and scope-limited: it does not touch
workflow, gate, pin, save, HAPIL, or public deployment files.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "client-source"
FILES = (
    "hospital-improvements-a5.js",
    "world-visual-r78.js",
    "world-combat-r78.js",
    "ego-restore-health-r79.js",
)
OLD_LAYOUT = re.compile(
    r'function explorationLayout\(id,theme="cave",safe=false,meta=\{\}\)'
    r'\{const base=baseExplorationLayoutR74\(id,theme,safe,meta\);'
    r'if\(meta\.worldR75!==1\)return worldLayoutR74\(base,id,theme,safe,meta\);'
    r'(?:(?!function explorationLayout)[^{}]|\{[^{}]*\})*?'
    r'return worldLayoutR75\(base,id,theme,safe,meta\);\}'
)
NEW_LAYOUT = '''function explorationLayout(id,theme="cave",safe=false,meta={}){const base=baseExplorationLayoutR74(id,theme,safe,meta);if(meta.worldR75!==1)return worldLayoutR74(base,id,theme,safe,meta);if(worldLayoutR78Eligible(id,theme,safe))return worldLayoutStoryR78(base,id,theme,safe,meta);const coop=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();if(id==='last301'&&!safe&&(!coop||coop==='off'))return worldLayoutBossR76(base,id,theme,safe,meta);return worldLayoutR75(base,id,theme,safe,meta);}'''
R78_METADATA = {
    "scope": "55 solo authored STORY combat maps; hospital and safe maps keep their prior layouts; co-op keeps its prior layouts",
    "layout": "wide connected hospital-grammar maze rooms with story topology, original exits, and regional environment art retained",
    "encounters": "existing native packs stay intact; ordinary packs occupy route rooms, native midbosses the gathering room, canonical bosses the central arena",
    "hospital": "PC fine-pointer 1.12 camera crop, wall-top roof treatment, operating-room floor inlay and surgeon marker",
    "preservation": "no combat stats, damage, save schema, assets, audio, narrative, or source map identity rewritten",
    "rendererCacheKey": "r78=1",
}


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def one(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"R78 anchor drift for {label}: expected 1, found {count}")
    return source.replace(old, new, 1)


def add_manifest_row(rows: dict, name: str, data: bytes) -> None:
    rows[name] = {"path": name, "bytes": len(data), "sha256": sha256(data)}


def build(site: Path) -> dict:
    index_path, renderer_path = site / "index.html", site / "dist/phase1.js"
    manifest_path = site / "web-manifest-r62.json"
    for path in (index_path, renderer_path, manifest_path):
        if not path.is_file():
            raise RuntimeError(f"R78 requires an R77 site file: {path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    r77 = manifest.get("r77")
    if not isinstance(r77, dict):
        raise RuntimeError("R78 requires an R77-built site and its manifest marker")
    html_bytes, renderer_bytes = index_path.read_bytes(), renderer_path.read_bytes()
    baseline_html_sha, baseline_renderer_sha = sha256(html_bytes), sha256(renderer_bytes)
    if baseline_html_sha != r77.get("htmlSha256") or baseline_renderer_sha != r77.get("rendererSha256"):
        raise RuntimeError("R77 manifest hashes do not match the input site")
    renderer = renderer_bytes.decode("utf-8")
    if "worldLayoutStoryR78" in renderer:
        raise RuntimeError("R78 layout fragment is already applied")
    fragment = (SOURCES / "world-layout-r78.js").read_text(encoding="utf-8")
    if "</script" in fragment.lower():
        raise RuntimeError("Unsafe script closing tag in the R78 renderer fragment")
    marker = 'function explorationLayout(id,theme="cave",safe=false,meta={})'
    if renderer.count(marker) != 1:
        raise RuntimeError("R77 explorationLayout anchor is missing or ambiguous")
    match = OLD_LAYOUT.search(renderer)
    if not match or "worldLayoutBossR76" not in match.group(0):
        raise RuntimeError("R78 requires the R76 boss-core dispatch from the R77 renderer")
    renderer = renderer[:match.start()] + NEW_LAYOUT + renderer[match.end():]
    at = renderer.index(marker)
    renderer = renderer[:at] + fragment + "\n" + renderer[at:]

    html = html_bytes.decode("utf-8")
    html = one(html, 'src="./dist/phase1.js?r76=1"', 'src="./dist/phase1.js?r78=1"', "renderer cache key")
    for name in FILES:
        destination = site / name
        shutil.copyfile(SOURCES / name, destination)
    for name in FILES:
        tag = f'<script src="./{name}"></script>'
        if tag in html or f'<script src="{name}"></script>' in html:
            raise RuntimeError(f"R78 script already present in input HTML: {name}")
    tags = "\n" + "\n".join(f'<script src="./{name}"></script>' for name in FILES) + "\n"
    html += tags

    renderer_out = renderer.encode("utf-8")
    html_out = html.encode("utf-8")
    renderer_path.write_bytes(renderer_out)
    index_path.write_bytes(html_out)

    rows = {row["path"]: dict(row) for row in manifest.get("files", [])}
    for name in FILES:
        add_manifest_row(rows, name, (site / name).read_bytes())
    add_manifest_row(rows, "index.html", html_out)
    add_manifest_row(rows, "dist/phase1.js", renderer_out)
    manifest["files"] = sorted(rows.values(), key=lambda row: row["path"])
    manifest["fileCount"] = len(manifest["files"])
    manifest["totalBytes"] = sum(row["bytes"] for row in manifest["files"])
    manifest["webHTMLSha256"] = sha256(html_out)
    manifest["r78"] = {
        "baselineR77HtmlSha256": baseline_html_sha,
        "baselineR77RendererSha256": baseline_renderer_sha,
        "htmlSha256": sha256(html_out),
        "rendererSha256": sha256(renderer_out),
        **R78_METADATA,
    }
    manifest["largest"] = sorted(manifest["files"], key=lambda row: row["bytes"], reverse=True)[:20]
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    result = {
        "status": "R78_STORY_WORLD_MAZE_APPLIED",
        "site": str(site.resolve()),
        "inputR77HtmlSha256": baseline_html_sha,
        "inputR77RendererSha256": baseline_renderer_sha,
        "outputHtmlSha256": sha256(html_out),
        "outputRendererSha256": sha256(renderer_out),
        "manifestSha256": sha256(manifest_path.read_bytes()),
        "rendererCacheKey": R78_METADATA["rendererCacheKey"],
        "scriptFiles": list(FILES),
        **R78_METADATA,
        "browserVerified": False,
        "GPUVerified": False,
    }
    out = ROOT / "out/r78"
    out.mkdir(parents=True, exist_ok=True)
    (out / "apply.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, default=Path("_pages/docs"))
    args = parser.parse_args()
    build(args.site)


if __name__ == "__main__":
    main()

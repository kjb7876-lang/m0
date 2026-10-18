#!/usr/bin/env python3
"""Build R71 on top of the exact published R70 runtime.

The feature transforms are deliberately composed in memory and the manifest is
written once at the end. This keeps the overlay reproducible and prevents one
feature transform from accidentally blessing the output of another as its
baseline.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import tempfile
from pathlib import Path
from types import ModuleType

BASE_HTML = "76791c87cf6b3f70d99f35aafc7dacaf3adb389f4be10081c024f8802a9aa5f5"
BASE_RENDERER = "b87e0feb34c321d19e557b7d08e63b9f0744f1e28b9e7d6e2ee7ea9ca0a6ebf4"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_module(path: Path, name: str) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load R71 transform: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def require_transform(module: ModuleType, attribute: str, source: str) -> str:
    function = getattr(module, attribute, None)
    if not callable(function):
        raise RuntimeError(f"R71 transform API missing {module.__file__}:{attribute}")
    result = function(source)
    if not isinstance(result, str):
        raise RuntimeError(f"R71 transform returned non-text: {module.__file__}:{attribute}")
    return result


def check_script_tag_balance(html: str) -> None:
    opens = len(re.findall(r"<script\b", html, re.IGNORECASE))
    closes = len(re.findall(r"</script\s*>", html, re.IGNORECASE))
    if opens != closes:
        raise RuntimeError(f"Unbalanced script tags after R71 transforms ({opens} opens, {closes} closes)")


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}.", delete=False) as tmp:
        tmp.write(data)
        temp_path = Path(tmp.name)
    temp_path.replace(path)


def transform_html_and_renderer(html: str, renderer: str) -> tuple[str, str]:
    root = Path(__file__).resolve().parent
    health = load_module(root / "health-r71.py", "storyworld_health_r71")
    progression = load_module(root / "progression-r71.py", "storyworld_progression_r71")
    render = load_module(root / "render-r71.py", "storyworld_render_r71")

    # Health/bleed and difficulty/rewards are HTML overlays. The renderer
    # transform is last so its URL cache key names the final composed runtime.
    html = require_transform(health, "transform_html", html)
    html = require_transform(progression, "transform_html", html)
    html = require_transform(render, "transform_html", html)
    renderer = require_transform(render, "transform", renderer)
    check_script_tag_balance(html)
    return html, renderer


def update_manifest(site: Path, old_html: bytes, new_html: bytes,
                    old_renderer: bytes, new_renderer: bytes) -> dict:
    manifest_path = site / "web-manifest-r62.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not manifest.get("r70") or manifest.get("r71"):
        raise RuntimeError("Unexpected overlay lineage: expected R70 and no R71")
    if manifest.get("webHTMLSha256") != digest(old_html):
        raise RuntimeError("R70 manifest HTML digest mismatch")

    edits = {
        "index.html": (old_html, new_html),
        "dist/phase1.js": (old_renderer, new_renderer),
    }
    for name, (old, new) in edits.items():
        rows = [row for row in manifest.get("files", []) if row.get("path") == name]
        if len(rows) != 1:
            raise RuntimeError(f"Manifest must contain exactly one entry for {name}")
        if rows[0].get("sha256") != digest(old) or rows[0].get("bytes") != len(old):
            raise RuntimeError(f"R70 manifest mismatch: {name}")
        rows[0].update(bytes=len(new), sha256=digest(new))

    manifest["webHTMLSha256"] = digest(new_html)
    manifest["totalBytes"] = sum(row["bytes"] for row in manifest["files"])
    manifest["r71"] = {
        "revision": "R71-GAMEPLAY-READABILITY",
        "baselineCommit": "34338945dc47f5bcb8c2ce05b2d7de62d72c7ad5",
        "playerMaxHP": 777,
        "bossMaxHPUsesBalancedSuffix": 666,
        "mapMaterialRolesReadable": True,
        "difficultyConfirmationAndRewardTiers": [1, 3, 7],
        "existingDropProbabilityAndAmountsPreserved": True,
        "bleedOnLandedEnemyAttack": True,
        "officialEffectPrinciplesApplied": True,
        "simulationChanged": True,
        "mediaChanged": False,
        "changedFiles": ["index.html", "dist/phase1.js"],
    }
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", type=Path, required=True)
    args = parser.parse_args()
    site = args.site.resolve()
    if site == Path("docs").resolve():
        raise RuntimeError("Do not modify the pinned original source tree")

    html_path = site / "index.html"
    renderer_path = site / "dist/phase1.js"
    old_html = html_path.read_bytes()
    old_renderer = renderer_path.read_bytes()
    if digest(old_html) != BASE_HTML or digest(old_renderer) != BASE_RENDERER:
        raise RuntimeError("R71 requires exact published R70 HTML and renderer bytes")

    html, renderer = transform_html_and_renderer(
        old_html.decode("utf-8"), old_renderer.decode("utf-8")
    )
    new_html, new_renderer = html.encode("utf-8"), renderer.encode("utf-8")
    if new_html == old_html and new_renderer == old_renderer:
        raise RuntimeError("R71 transforms produced no runtime changes")
    manifest = update_manifest(site, old_html, new_html, old_renderer, new_renderer)

    atomic_write(html_path, new_html)
    atomic_write(renderer_path, new_renderer)
    atomic_write(site / "web-manifest-r62.json",
                 (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    print("R71_OVERLAY_APPLIED", json.dumps({
        "htmlSHA256": digest(new_html),
        "rendererSHA256": digest(new_renderer),
        "files": len(manifest["files"]),
        "simulationChanged": True,
        "mediaChanged": False,
    }, sort_keys=True))


if __name__ == "__main__":
    main()

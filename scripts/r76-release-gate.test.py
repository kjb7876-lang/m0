#!/usr/bin/env python3
"""Exercise R76 release approval success and refusal paths on isolated fixtures."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
GATE = HERE / "r76-release-gate.py"

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def row(path: str, data: bytes) -> dict:
    return {"path": path, "bytes": len(data), "sha256": digest(data)}

def run_gate(root: Path, output_path: Path) -> subprocess.CompletedProcess[str]:
    env = dict(os.environ)
    env["GITHUB_SHA"] = "fixture-source-commit"
    env["GITHUB_OUTPUT"] = str(output_path)
    return subprocess.run(
        [sys.executable, "scripts/r76-release-gate.py"],
        cwd=root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

with tempfile.TemporaryDirectory(prefix="r76-release-gate-") as temporary:
    root = Path(temporary)
    scripts = root / "scripts"
    docs = root / "_pages" / "docs"
    scripts.mkdir()
    (docs / "dist").mkdir(parents=True)
    (docs / "assets").mkdir()
    shutil.copyfile(GATE, scripts / GATE.name)

    html = b"<html>approved-r76</html>"
    renderer = b"window.approvedR76=true;"
    asset = b"approved-r75-image"
    baseline = {
        "index.html": "971ab5fa455203576e0ec3005557321bc36e56220072d5b0f3078d53cc6d8f57",
        "dist/phase1.js": "22a04872281d2fe260d34c4c618f9b608c8afbefe1faf2c759f0ee00d9bf04bb",
    }
    approval = {
        "schema": "storyworld.r76-runtime-approval/v1",
        "candidateSource": {
            "pullRequest": 19,
            "headSha": "4499d479d3e18871e38fe69d6e8b21d62cfbef17",
            "workflowRunId": None,
        },
        "baselineR75": baseline,
        "approvedR76": {
            "index.html": digest(html),
            "dist/phase1.js": digest(renderer),
        },
        "designSlots": {"goldenBase": 7, "pointsPerSlot": 1, "maximum": 12, "silverFixed": 7},
        "equippedSlots": {"base": 1, "maximum": 3, "unlockCost": 7},
        "bossLayout": "last301 native boss room is part of the connected regional maze with an interactive approach door and brighter regional landscape; original exits retained",
        "rendererCacheKey": "r76=1",
        "minimapCore": "originalEncounterBounds offset by expanded layout bounds",
    }
    (scripts / "r76-approved-runtime.json").write_text(json.dumps(approval), encoding="utf-8")
    (docs / "index.html").write_bytes(html)
    (docs / "dist" / "phase1.js").write_bytes(renderer)
    (docs / "assets" / "approved.webp").write_bytes(asset)

    rows = [
        row("index.html", html),
        row("dist/phase1.js", renderer),
        row("assets/approved.webp", asset),
    ]
    manifest = {
        "webHTMLSha256": digest(html),
        "files": rows,
        "fileCount": len(rows),
        "totalBytes": sum(item["bytes"] for item in rows),
        "largest": sorted(rows, key=lambda item: item["bytes"], reverse=True)[:20],
        "releaseR75": {
            "status": "approved",
            "runtimeHashes": baseline,
            "generatedAssets": {"assets/approved.webp": digest(asset)},
        },
        "r76": {
            "baselineR75HtmlSha256": baseline["index.html"],
            "baselineR75RendererSha256": baseline["dist/phase1.js"],
            "htmlSha256": digest(html),
            "rendererSha256": digest(renderer),
            "designSlots": approval["designSlots"],
            "equippedSlots": approval["equippedSlots"],
            "bossLayout": approval["bossLayout"],
            "rendererCacheKey": approval["rendererCacheKey"],
            "minimapCore": approval["minimapCore"],
        },
    }
    (docs / "web-manifest-r62.json").write_text(json.dumps(manifest), encoding="utf-8")

    output = root / "output.txt"
    good = run_gate(root, output)
    assert good.returncode == 0, good.stderr + good.stdout
    assert '"status": "R76_RELEASE_PIN_PASSED"' in good.stdout
    values = dict(line.split("=", 1) for line in output.read_text(encoding="utf-8").splitlines())
    assert values["html_sha"] == digest(html)
    assert values["renderer_sha"] == digest(renderer)
    assert values["asset_hashes_json"] == json.dumps({"assets/approved.webp": digest(asset)}, sort_keys=True, separators=(",", ":"))
    stamped = json.loads((docs / "web-manifest-r62.json").read_text(encoding="utf-8"))
    assert stamped["releaseR76"]["sourceCommit"] == "fixture-source-commit"
    assert stamped["releaseR76"]["candidateSource"] == approval["candidateSource"]
    assert stamped["releaseR76"]["rendererCacheKey"] == approval["rendererCacheKey"]
    assert stamped["releaseR76"]["minimapCore"] == approval["minimapCore"]
    assert values["manifest_sha"] == digest((docs / "web-manifest-r62.json").read_bytes())

    (docs / "dist" / "phase1.js").write_bytes(b"modified-runtime")
    bad = run_gate(root, root / "bad-output.txt")
    assert bad.returncode != 0
    assert "R76 runtime differs" in bad.stderr
    print("R76_RELEASE_GATE_TESTS_PASSED")

#!/usr/bin/env python3
"""Pin and stamp the exact R76 runtime after the approved R75 gate."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath

ROOT = Path("_pages/docs")
APPROVAL = json.loads(Path("scripts/r76-approved-runtime.json").read_text(encoding="utf-8"))
if APPROVAL.get("schema") != "storyworld.r76-runtime-approval/v1":
    raise SystemExit("Unknown R76 release approval schema")
if APPROVAL.get("candidateSource", {}).get("pullRequest") != 19:
    raise SystemExit("R76 runtime approval is not tied to PR 19")
if APPROVAL.get("candidateSource", {}).get("headSha") != "d8956169a6ba3df7001f9b17e9ab33f1bac59ad4":
    raise SystemExit("R76 runtime approval is not tied to the reviewed PR 19 source commit")
BASELINE = APPROVAL.get("baselineR75")
EXPECTED_BASELINE = {
    "index.html": "971ab5fa455203576e0ec3005557321bc36e56220072d5b0f3078d53cc6d8f57",
    "dist/phase1.js": "22a04872281d2fe260d34c4c618f9b608c8afbefe1faf2c759f0ee00d9bf04bb",
}
if BASELINE != EXPECTED_BASELINE:
    raise SystemExit("R76 approval does not preserve the exact R75 base")
EXPECTED = APPROVAL.get("approvedR76")
if not isinstance(EXPECTED, dict) or set(EXPECTED) != {"index.html", "dist/phase1.js"}:
    raise SystemExit("R76 approval must pin exactly the HTML and renderer")
if not isinstance(APPROVAL.get("designSlots"), dict) or not isinstance(APPROVAL.get("equippedSlots"), dict):
    raise SystemExit("R76 progression approval is incomplete")
if APPROVAL.get("rendererCacheKey") != "r76=1" or APPROVAL.get("minimapCore") != "originalEncounterBounds offset by expanded layout bounds":
    raise SystemExit("R76 cache-key or minimap approval is incomplete")

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def fail(message: str) -> None:
    raise SystemExit(message)

actual = {name: sha256(ROOT / name) for name in EXPECTED}
if actual != EXPECTED:
    fail("R76 runtime differs from the exact reviewed candidate: " + json.dumps(actual, sort_keys=True))

manifest_path = ROOT / "web-manifest-r62.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
release75 = manifest.get("releaseR75")
r76 = manifest.get("r76")
if not isinstance(release75, dict) or release75.get("status") != "approved":
    fail("R75 release gate did not approve the preserved baseline")
if release75.get("runtimeHashes") != BASELINE:
    fail("R75 release manifest differs from the R76 approved baseline")
if not isinstance(r76, dict):
    fail("R76 overlay metadata is missing")
if r76.get("baselineR75HtmlSha256") != BASELINE["index.html"] or r76.get("baselineR75RendererSha256") != BASELINE["dist/phase1.js"]:
    fail("R76 overlay was not built on the exact approved R75 runtime")
if r76.get("htmlSha256") != actual["index.html"] or r76.get("rendererSha256") != actual["dist/phase1.js"]:
    fail("R76 overlay metadata does not match the approved runtime")
if r76.get("designSlots") != APPROVAL["designSlots"] or r76.get("equippedSlots") != APPROVAL["equippedSlots"]:
    fail("R76 progression limits differ from the approved candidate")
if r76.get("bossLayout") != APPROVAL["bossLayout"]:
    fail("R76 boss layout differs from the approved candidate")
if r76.get("rendererCacheKey") != APPROVAL["rendererCacheKey"] or r76.get("minimapCore") != APPROVAL["minimapCore"]:
    fail("R76 renderer cache or minimap behavior differs from the approved candidate")
if manifest.get("webHTMLSha256") != actual["index.html"]:
    fail("R76 web HTML hash in the manifest is stale")

rows = manifest.get("files")
if not isinstance(rows, list):
    fail("R76 runtime manifest has no file list")

def verify_row(path_text: str, expected_hash: str) -> None:
    matches = [row for row in rows if row.get("path") == path_text]
    if len(matches) != 1:
        fail("R76 strict manifest must contain exactly one row for " + path_text)
    target = ROOT / path_text
    row = matches[0]
    if row.get("sha256") != expected_hash or row.get("bytes") != target.stat().st_size:
        fail("R76 strict manifest disagrees with release bytes: " + path_text)

for name, digest in actual.items():
    verify_row(name, digest)

assets = release75.get("generatedAssets")
if not isinstance(assets, dict):
    fail("R75 generated-image approvals are missing")
for name, digest in assets.items():
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts or "\\" in name:
        fail("Unsafe generated-asset path in R75 approval: " + name)
    target = ROOT.joinpath(*relative.parts)
    if target.is_symlink() or not target.is_file() or sha256(target) != digest:
        fail("R75 generated image differs from its exact approval: " + name)
    verify_row(name, digest)

if manifest.get("fileCount") != len(rows):
    fail("R76 manifest file count is stale")
if manifest.get("totalBytes") != sum(row.get("bytes", -1) for row in rows):
    fail("R76 manifest total byte count is stale")
largest = sorted(rows, key=lambda row: row["bytes"], reverse=True)[:20]
if manifest.get("largest") != largest:
    fail("R76 manifest largest-file summary is stale")

source_commit = os.environ.get("GITHUB_SHA", "working-tree")
manifest["releaseR76"] = {
    "status": "approved",
    "sourceCommit": source_commit,
    "candidateSource": APPROVAL["candidateSource"],
    "baselineR75RuntimeHashes": BASELINE,
    "runtimeHashes": actual,
    "designSlots": APPROVAL["designSlots"],
    "equippedSlots": APPROVAL["equippedSlots"],
    "bossLayout": APPROVAL["bossLayout"],
    "rendererCacheKey": APPROVAL["rendererCacheKey"],
    "minimapCore": APPROVAL["minimapCore"],
}
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
manifest_sha = sha256(manifest_path)
asset_json = json.dumps(assets, sort_keys=True, separators=(",", ":"))
if os.environ.get("GITHUB_OUTPUT"):
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as stream:
        stream.write("html_sha=" + actual["index.html"] + "\n")
        stream.write("renderer_sha=" + actual["dist/phase1.js"] + "\n")
        stream.write("asset_hashes_json=" + asset_json + "\n")
        stream.write("manifest_sha=" + manifest_sha + "\n")
print(json.dumps({
    "status": "R76_RELEASE_PIN_PASSED",
    "sourceCommit": source_commit,
    "candidateSource": APPROVAL["candidateSource"],
    "runtimeHashes": actual,
    "manifestSHA256": manifest_sha,
}, sort_keys=True))

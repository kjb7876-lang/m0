#!/usr/bin/env python3
"""Pin the guide-only R77 overlay to the exact approved R76 release."""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
from pathlib import Path, PurePosixPath

ROOT = Path("_pages/docs")
APPROVAL = json.loads(Path("scripts/r77-approved-runtime.json").read_text(encoding="utf-8"))
R76_APPROVAL = json.loads(Path("scripts/r76-approved-runtime.json").read_text(encoding="utf-8"))
EXPECTED_CONTRACT = {
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
RUNTIME_PATHS = {"index.html": "index.html", "dist/phase1.js": "dist/phase1.js"}


def fail(message: str) -> None:
    raise SystemExit(message)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_candidate_source(source: object) -> dict:
    if not isinstance(source, dict):
        fail("Approved R77 release has no candidate source pin")
    pr = source.get("pullRequest")
    head = source.get("headSha")
    if not isinstance(pr, int) or isinstance(pr, bool) or pr < 1:
        fail("Approved R77 release must name its reviewed pull request")
    if not isinstance(head, str) or not re.fullmatch(r"[0-9a-f]{40}", head):
        fail("Approved R77 release must pin its reviewed source commit")
    run_id = source.get("workflowRunId")
    if run_id is not None and (not isinstance(run_id, int) or isinstance(run_id, bool) or run_id < 1):
        fail("R77 approval workflow run ID must be a positive integer or null")
    available = subprocess.run(
        ["git", "cat-file", "-e", head + "^{commit}"],
        text=True,
        capture_output=True,
        check=False,
    )
    if available.returncode != 0:
        fail("Pinned R77 source commit is not present in this checkout")
    ancestor = subprocess.run(
        ["git", "merge-base", "--is-ancestor", head, "HEAD"],
        text=True,
        capture_output=True,
        check=False,
    )
    if ancestor.returncode != 0:
        fail("Pinned R77 source commit is unrelated to or newer than this checkout")
    changed = subprocess.run(
        ["git", "diff", "--name-only", "--no-renames", head + "..HEAD"],
        text=True,
        capture_output=True,
        check=False,
    )
    if changed.returncode != 0:
        fail("Could not inspect changes after the pinned R77 source commit")

    def review_only(path_text: str) -> bool:
        path = PurePosixPath(path_text)
        name = path.name
        if path_text in {
            "scripts/r77-approved-runtime.json",
            "scripts/r77-guide-normal.browser.mjs",
        }:
            return True
        if path_text == ".github/workflows/pages.yml":
            return True
        if path.suffix.lower() in {".md", ".mdx"}:
            return True
        return ".test." in name or ".spec." in name or "__tests__" in path.parts

    forbidden = [path for path in changed.stdout.splitlines() if path and not review_only(path)]
    if forbidden:
        fail("Runtime-producing changes were made after the pinned R77 source commit: " + ", ".join(forbidden))
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if os.environ.get("GITHUB_EVENT_NAME") == "pull_request" and event_path:
        event = json.loads(Path(event_path).read_text(encoding="utf-8"))
        pull = event.get("pull_request", {})
        if pull.get("number") != pr:
            fail("Approved R77 candidate belongs to a different pull request")
    return source


if APPROVAL.get("schema") != "storyworld.r77-runtime-approval/v1":
    fail("Unknown R77 release approval schema")
if APPROVAL.get("contract") != EXPECTED_CONTRACT:
    fail("R77 approval contract differs from the guide-only change")
if APPROVAL.get("baselineR76") != R76_APPROVAL.get("approvedR76"):
    fail("R77 approval does not preserve the exact approved R76 runtime")

BASELINE = APPROVAL["baselineR76"]
EXPECTED_BASELINE = {"index.html", "dist/phase1.js"}
if not isinstance(BASELINE, dict) or set(BASELINE) != EXPECTED_BASELINE:
    fail("R77 approval must pin exactly the R76 HTML and renderer baseline")

actual = {name: sha256(ROOT / relative) for name, relative in RUNTIME_PATHS.items()}
manifest_path = ROOT / "web-manifest-r62.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
release76 = manifest.get("releaseR76")
if not isinstance(release76, dict) or release76.get("status") != "approved":
    fail("R76 release gate did not approve the preserved baseline")
if release76.get("runtimeHashes") != BASELINE:
    fail("R76 release manifest differs from the exact R77 baseline")
metadata76 = manifest.get("r76")
if not isinstance(metadata76, dict) or metadata76.get("htmlSha256") != BASELINE["index.html"] or metadata76.get("rendererSha256") != BASELINE["dist/phase1.js"]:
    fail("R76 overlay metadata differs from the exact R77 baseline")

r77 = manifest.get("r77")
if not isinstance(r77, dict):
    fail("R77 guide overlay metadata is missing")
expected_metadata = {
    "baselineR76HtmlSha256": BASELINE["index.html"],
    "baselineR76RendererSha256": BASELINE["dist/phase1.js"],
    "htmlSha256": actual["index.html"],
    "rendererSha256": actual["dist/phase1.js"],
    **EXPECTED_CONTRACT,
}
for key, expected in expected_metadata.items():
    if r77.get(key) != expected:
        fail("R77 manifest metadata differs from the approved guide contract: " + key)
if actual["dist/phase1.js"] != BASELINE["dist/phase1.js"]:
    fail("R77 guide overlay must preserve the exact R76 renderer bytes")
if manifest.get("webHTMLSha256") != actual["index.html"]:
    fail("R77 web HTML hash in the manifest is stale")

rows = manifest.get("files")
if not isinstance(rows, list):
    fail("R77 runtime manifest has no file list")


def verify_row(path_text: str, expected_hash: str) -> None:
    matches = [row for row in rows if row.get("path") == path_text]
    if len(matches) != 1:
        fail("R77 strict manifest must contain exactly one row for " + path_text)
    target = ROOT / path_text
    row = matches[0]
    if row.get("sha256") != expected_hash or row.get("bytes") != target.stat().st_size:
        fail("R77 strict manifest disagrees with release bytes: " + path_text)


for name, digest in actual.items():
    verify_row(name, digest)

assets = release76.get("generatedAssets")
if not isinstance(assets, dict):
    assets = manifest.get("releaseR75", {}).get("generatedAssets")
if not isinstance(assets, dict):
    fail("Preserved generated-image approvals are missing")
for name, digest in assets.items():
    relative = PurePosixPath(name)
    if relative.is_absolute() or ".." in relative.parts or "\\" in name:
        fail("Unsafe generated-asset path in preserved approval: " + name)
    target = ROOT.joinpath(*relative.parts)
    if target.is_symlink() or not target.is_file() or sha256(target) != digest:
        fail("Generated image differs from its preserved approval: " + name)
    verify_row(name, digest)

if manifest.get("fileCount") != len(rows):
    fail("R77 manifest file count is stale")
if manifest.get("totalBytes") != sum(row.get("bytes", -1) for row in rows):
    fail("R77 manifest total byte count is stale")
if manifest.get("largest") != sorted(rows, key=lambda row: row["bytes"], reverse=True)[:20]:
    fail("R77 manifest largest-file summary is stale")

status = APPROVAL.get("status")
if status not in {"pending-review", "approved"}:
    fail("Unknown R77 release approval status")
if status == "pending-review":
    if os.environ.get("GITHUB_EVENT_NAME") != "pull_request" and os.environ.get("GITHUB_REF") == "refs/heads/main":
        fail("R77 review is pending; refusing public Pages deployment")
    if APPROVAL.get("approvedR77") != {"index.html": None, "dist/phase1.js": None}:
        fail("Pending R77 approval must not contain approved runtime hashes")
    source = APPROVAL.get("candidateSource")
    if source != {"pullRequest": None, "headSha": None, "workflowRunId": None}:
        fail("Pending R77 approval must not claim a reviewed source pin")
else:
    source = validate_candidate_source(APPROVAL.get("candidateSource"))
    expected = APPROVAL.get("approvedR77")
    if not isinstance(expected, dict) or set(expected) != EXPECTED_BASELINE:
        fail("Approved R77 release must pin exactly the HTML and renderer")
    if actual != expected:
        fail("R77 runtime differs from the exact reviewed candidate: " + json.dumps(actual, sort_keys=True))

source_commit = os.environ.get("GITHUB_SHA", "working-tree")
manifest["releaseR77"] = {
    "status": status,
    "sourceCommit": source_commit,
    "candidateSource": source,
    "baselineR76RuntimeHashes": BASELINE,
    "runtimeHashes": actual,
    "contract": EXPECTED_CONTRACT,
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
    "status": "R77_RELEASE_PIN_PASSED",
    "approvalStatus": status,
    "sourceCommit": source_commit,
    "candidateSource": source,
    "runtimeHashes": actual,
    "manifestSHA256": manifest_sha,
}, sort_keys=True))

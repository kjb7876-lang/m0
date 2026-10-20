#!/usr/bin/env python3
"""Exercise R77 exact-runtime approval, metadata, baseline, and main-refusal paths."""
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
GATE = HERE / "r77-release-gate.py"
APPROVAL = HERE / "r77-approved-runtime.json"


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def row(path: str, data: bytes) -> dict:
    return {"path": path, "bytes": len(data), "sha256": digest(data)}


def git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args], cwd=root, text=True, capture_output=True, check=False
    )
    assert result.returncode == 0, result.stderr + result.stdout
    return result.stdout.strip()


def fixture(parent: Path, label: str, status: str = "pending-review") -> tuple[Path, dict, bytes, bytes]:
    root = parent / label
    scripts = root / "scripts"
    docs = root / "_pages" / "docs"
    scripts.mkdir(parents=True)
    (docs / "dist").mkdir(parents=True)
    (docs / "assets").mkdir()
    shutil.copyfile(GATE, scripts / GATE.name)

    html = b"<html>guide-normal-r77</html>"
    renderer = b"window.approvedR76Renderer=true;"
    asset = b"preserved-r75-image"
    baseline = {
        "index.html": digest(b"<html>approved-r76</html>"),
        "dist/phase1.js": digest(renderer),
    }
    approval = json.loads(APPROVAL.read_text(encoding="utf-8"))
    approval["status"] = "pending-review"
    approval["baselineR76"] = baseline
    approval["approvedR77"] = {"index.html": None, "dist/phase1.js": None}
    approval["candidateSource"] = {"pullRequest": None, "headSha": None, "workflowRunId": None}
    (scripts / "r77-approved-runtime.json").write_text(json.dumps(approval), encoding="utf-8")
    (scripts / "r76-approved-runtime.json").write_text(json.dumps({"approvedR76": baseline}), encoding="utf-8")

    (docs / "index.html").write_bytes(html)
    (docs / "dist" / "phase1.js").write_bytes(renderer)
    (docs / "assets" / "approved.webp").write_bytes(asset)
    assets = {"assets/approved.webp": digest(asset)}
    rows = [row("index.html", html), row("dist/phase1.js", renderer), row("assets/approved.webp", asset)]
    manifest = {
        "webHTMLSha256": digest(html),
        "files": rows,
        "fileCount": len(rows),
        "totalBytes": sum(item["bytes"] for item in rows),
        "largest": sorted(rows, key=lambda item: item["bytes"], reverse=True)[:20],
        "releaseR75": {"status": "approved", "generatedAssets": assets},
        "releaseR76": {"status": "approved", "runtimeHashes": baseline},
        "r76": {"htmlSha256": baseline["index.html"], "rendererSha256": baseline["dist/phase1.js"]},
        "r77": {
            "baselineR76HtmlSha256": baseline["index.html"],
            "baselineR76RendererSha256": baseline["dist/phase1.js"],
            "htmlSha256": digest(html),
            "rendererSha256": digest(renderer),
            **approval["contract"],
        },
    }
    (docs / "web-manifest-r62.json").write_text(json.dumps(manifest), encoding="utf-8")

    git(root, "init", "--quiet", "-b", "main")
    git(root, "config", "user.email", "r77-gate-test@example.invalid")
    git(root, "config", "user.name", "R77 Gate Test")
    git(root, "add", ".")
    git(root, "commit", "--quiet", "-m", "R77 source-producing commit")
    source_sha = git(root, "rev-parse", "HEAD")
    if status == "approved":
        approval["status"] = "approved"
        approval["approvedR77"] = {"index.html": digest(html), "dist/phase1.js": digest(renderer)}
        approval["candidateSource"] = {
            "pullRequest": 77,
            "headSha": source_sha,
            "workflowRunId": 123456,
        }
        (scripts / "r77-approved-runtime.json").write_text(json.dumps(approval), encoding="utf-8")
        git(root, "add", "scripts/r77-approved-runtime.json")
        git(root, "commit", "--quiet", "-m", "R77 exact runtime approval")
        review_only = {
            "README.md": "R77 release notes\n",
            ".github/workflows/pages.yml": "# reviewed workflow adjustment\n",
            "scripts/r77-guide-normal.cpu.test.mjs": "// reviewed CPU fixture\n",
            "scripts/r77-guide-normal.browser.mjs": "// reviewed browser fixture\n",
        }
        for name, contents in review_only.items():
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents, encoding="utf-8")
        git(root, "add", *review_only.keys())
        git(root, "commit", "--quiet", "-m", "reviewed docs tests and workflow")
    return root, manifest, html, renderer


def run_gate(root: Path, output_path: Path, **environment: str) -> subprocess.CompletedProcess[str]:
    env = dict(os.environ)
    env.update({"GITHUB_SHA": "fixture-source-commit", "GITHUB_EVENT_NAME": "pull_request"})
    env.update(environment)
    env["GITHUB_OUTPUT"] = str(output_path)
    return subprocess.run(
        [sys.executable, "scripts/r77-release-gate.py"],
        cwd=root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


with tempfile.TemporaryDirectory(prefix="r77-gate-tests-") as temporary:
    root = Path(temporary)
    good_root, _, html, renderer = fixture(root, "pending")
    output = root / "pending-output.txt"
    good = run_gate(good_root, output)
    assert good.returncode == 0, good.stderr + good.stdout
    assert '"approvalStatus": "pending-review"' in good.stdout
    pending_manifest = json.loads((good_root / "_pages/docs/web-manifest-r62.json").read_text(encoding="utf-8"))
    assert pending_manifest["releaseR77"]["status"] == "pending-review"
    values = dict(line.split("=", 1) for line in output.read_text(encoding="utf-8").splitlines())
    assert values["html_sha"] == digest(html)
    assert values["renderer_sha"] == digest(renderer)
    assert values["asset_hashes_json"] == json.dumps({"assets/approved.webp": digest(b"preserved-r75-image")}, sort_keys=True, separators=(",", ":"))
    assert values["manifest_sha"] == digest((good_root / "_pages/docs/web-manifest-r62.json").read_bytes())

    approved_root, _, _, _ = fixture(root, "approved", "approved")
    approved = run_gate(approved_root, root / "approved-output.txt", GITHUB_EVENT_NAME="push", GITHUB_REF="refs/heads/main")
    assert approved.returncode == 0, approved.stderr + approved.stdout
    approved_manifest = json.loads((approved_root / "_pages/docs/web-manifest-r62.json").read_text(encoding="utf-8"))
    assert approved_manifest["releaseR77"]["status"] == "approved"
    assert approved_manifest["releaseR77"]["candidateSource"]["pullRequest"] == 77

    pending_main_root, _, _, _ = fixture(root, "pending-main")
    refused = run_gate(pending_main_root, root / "refused-output.txt", GITHUB_EVENT_NAME="push", GITHUB_REF="refs/heads/main")
    assert refused.returncode != 0
    assert "review is pending" in refused.stderr

    tampered_root, _, _, _ = fixture(root, "tampered", "approved")
    tampered_html = b"different-guide-output"
    (tampered_root / "_pages/docs/index.html").write_bytes(tampered_html)
    tampered_manifest_path = tampered_root / "_pages/docs/web-manifest-r62.json"
    tampered_manifest = json.loads(tampered_manifest_path.read_text(encoding="utf-8"))
    tampered_manifest["webHTMLSha256"] = digest(tampered_html)
    tampered_manifest["r77"]["htmlSha256"] = digest(tampered_html)
    tampered_row = next(item for item in tampered_manifest["files"] if item["path"] == "index.html")
    tampered_row.update({"sha256": digest(tampered_html), "bytes": len(tampered_html)})
    tampered_manifest["totalBytes"] = sum(item["bytes"] for item in tampered_manifest["files"])
    tampered_manifest["largest"] = sorted(tampered_manifest["files"], key=lambda item: item["bytes"], reverse=True)[:20]
    tampered_manifest_path.write_text(json.dumps(tampered_manifest), encoding="utf-8")
    tampered = run_gate(tampered_root, root / "tampered-output.txt", GITHUB_EVENT_NAME="push", GITHUB_REF="refs/heads/main")
    assert tampered.returncode != 0
    assert "R77 runtime differs" in tampered.stderr

    descendant_root, _, _, _ = fixture(root, "descendant", "approved")
    changed_source = descendant_root / "client-source/guide-r77.js"
    changed_source.parent.mkdir(parents=True)
    changed_source.write_text("// changed after the pinned guide source\n", encoding="utf-8")
    git(descendant_root, "add", "client-source/guide-r77.js")
    git(descendant_root, "commit", "--quiet", "-m", "unreviewed runtime-source change")
    changed = run_gate(descendant_root, root / "descendant-output.txt", GITHUB_EVENT_NAME="push", GITHUB_REF="refs/heads/main")
    assert changed.returncode != 0
    assert "Runtime-producing changes" in changed.stderr

    unrelated_root, _, _, _ = fixture(root, "unrelated", "approved")
    git(unrelated_root, "switch", "--orphan", "unrelated")
    git(unrelated_root, "clean", "-fdx")
    (unrelated_root / "other-history.txt").write_text("unrelated commit\n", encoding="utf-8")
    git(unrelated_root, "add", "other-history.txt")
    git(unrelated_root, "commit", "--quiet", "-m", "unrelated source history")
    unrelated_sha = git(unrelated_root, "rev-parse", "HEAD")
    git(unrelated_root, "switch", "main")
    path = unrelated_root / "scripts/r77-approved-runtime.json"
    approval = json.loads(path.read_text(encoding="utf-8"))
    approval["candidateSource"]["headSha"] = unrelated_sha
    path.write_text(json.dumps(approval), encoding="utf-8")
    unrelated = run_gate(unrelated_root, root / "unrelated-output.txt", GITHUB_EVENT_NAME="push", GITHUB_REF="refs/heads/main")
    assert unrelated.returncode != 0
    assert "unrelated to or newer than this checkout" in unrelated.stderr

    metadata_root, _, _, _ = fixture(root, "metadata")
    path = metadata_root / "_pages/docs/web-manifest-r62.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest["r77"]["sceneAdvance"]["safeBodyScope"] = "any body or replay"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    mismatch = run_gate(metadata_root, root / "metadata-output.txt")
    assert mismatch.returncode != 0
    assert "sceneAdvance" in mismatch.stderr

    baseline_root, _, _, _ = fixture(root, "baseline")
    path = baseline_root / "scripts/r77-approved-runtime.json"
    approval = json.loads(path.read_text(encoding="utf-8"))
    approval["baselineR76"]["index.html"] = "0" * 64
    path.write_text(json.dumps(approval), encoding="utf-8")
    mismatch = run_gate(baseline_root, root / "baseline-output.txt")
    assert mismatch.returncode != 0
    assert "exact approved R76 runtime" in mismatch.stderr

print("R77_RELEASE_GATE_TESTS_PASSED")

#!/usr/bin/env python3
"""Register the approved Mammon files against the manifests in this checkout.

Run from any directory after restoring the scoped overlay and art files. The
default registers the files with one git apply. Use --check to preview.
"""
import argparse
import difflib
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OVERLAY = "mammon-miniature-pilot.js"
ASSETS = "assets/mammon-v3/"
ACTIVE = ("F01", "W06", "P01", "P02", "D01", "O01", "O02")
TAG = f'<script src="./{OVERLAY}" data-mammon-release></script>\n'.encode()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode()


def entry(path, data):
    return {"path": path, "bytes": len(data), "sha256": digest(data)}


def register(root):
    runtime = root / "r96/runtime-text"
    source = (root / "r96/client-source" / OVERLAY).read_bytes()
    require((runtime / OVERLAY).read_bytes() == source, "Runtime and source overlay differ")
    definitions = json.loads((runtime / ASSETS / "index.json").read_bytes())["assets"]
    active = [a for a in definitions if a["status"] == "registered"]
    assets = {a["id"]: a for a in active}
    require(len(active) == len(ACTIVE) and set(assets) == set(ACTIVE), "Unexpected active art")
    additions = [entry(OVERLAY, source)]
    for key in ACTIVE:
        a = assets[key]
        filename = a["file"]
        require(Path(filename).name == filename and filename.endswith(".webp"), "Invalid asset filename")
        path = ASSETS + filename
        row = entry(path, (runtime / path).read_bytes())
        require(row["bytes"] == a["bytes"] and row["sha256"] == a["sha256"], f"Asset mismatch: {key}")
        additions.append(row)

    files = ["r96/runtime-text/index.html", "r96/runtime-manifest.json", "r96/runtime-inputs.json"]
    original = [(root / p).read_bytes() for p in files]
    html, manifest_raw, spec_raw = original
    manifest, spec = json.loads(manifest_raw), json.loads(spec_raw)
    require(encode(manifest) == manifest_raw and encode(spec) == spec_raw, "Unexpected JSON formatting")
    require(digest(manifest_raw) == spec["runtimeManifestSHA256"], "Runtime inputs reference another manifest")
    rows = {row["path"]: row for row in manifest["files"]}
    require(list(rows) == sorted(rows), "Expected sorted source manifest")
    groups = spec["basePaths"] + spec["textPaths"] + spec["mediaPaths"]
    require(len(rows) == len(manifest["files"]) == manifest["fileCount"] == len(groups)
            and set(rows) == set(groups), "Manifest and input paths do not match")
    require(manifest["totalBytes"] == sum(r["bytes"] for r in rows.values()), "Incorrect inventory size")
    require(rows["index.html"] == entry("index.html", html)
            and manifest["webHTMLSha256"] == digest(html), "Index hash mismatch")
    require(html.count(b"</body>") == 1 and b"seven-sins-art.js" not in html, "Unexpected game entry")
    wanted = {row["path"] for row in additions}
    scoped = {p for p in rows if p == OVERLAY or p.startswith(ASSETS)}
    if scoped or OVERLAY.encode() in html:
        require(scoped == wanted and html.count(TAG) == html.count(OVERLAY.encode()) == 1
                and wanted.issubset(spec["textPaths"])
                and all(rows[a["path"]] == a for a in additions), "Partial or inconsistent Mammon registration")
        return b""

    html = html.replace(b"</body>", TAG + b"</body>")
    rows["index.html"] = entry("index.html", html)
    rows.update((a["path"], a) for a in additions)
    manifest["files"] = [rows[path] for path in sorted(rows)]
    manifest["fileCount"] = len(rows)
    manifest["totalBytes"] = sum(row["bytes"] for row in rows.values())
    manifest["webHTMLSha256"] = rows["index.html"]["sha256"]
    manifest_raw = encode(manifest)
    spec["textPaths"].extend(row["path"] for row in additions)
    spec["runtimeManifestSHA256"] = digest(manifest_raw)
    patch = []
    for name, before, after in zip(files, original, (html, manifest_raw, encode(spec))):
        patch.extend(difflib.diff_bytes(difflib.unified_diff, before.splitlines(True), after.splitlines(True),
                                        fromfile=("a/" + name).encode(), tofile=("b/" + name).encode()))
    return b"".join(patch)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check whether registration can apply without writing")
    args = parser.parse_args()
    patch = register(ROOT)
    if not patch:
        print("Already registered and verified.")
    else:
        subprocess.run(["git", "apply"] + (["--check"] if args.check else []) + ["-"],
                       cwd=ROOT, input=patch, check=True)
        print("Registration ready." if args.check else "Registered eight files.")

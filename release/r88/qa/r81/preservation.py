#!/usr/bin/env python3
"""Compare the complete V8 package with the preserved V4 input.

The canonical V4 manifest and embedded story hashes are included in the
report so this check is independent of invented gameplay fixture values.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SHA = lambda b: hashlib.sha256(b).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path, default=ROOT.parent / "hospital-refinement-v4/hospital-three-pc")
    args = parser.parse_args()
    baseline, current = args.baseline, ROOT / "hospital-three-pc"
    old, new = baseline / "site", current / "site"
    checks = []
    def check(name, passed, detail=None):
        checks.append({"name": name, "passed": bool(passed), "detail": detail})
    manifest = json.loads((old / "web-manifest-r62.json").read_text())
    protected = [r for r in manifest["files"] if r["path"].startswith(("assets/", "audio/", "data/", "delivery/", "vendor/"))]
    changed = []
    for row in protected:
        p = new / row["path"]
        if not p.is_file() or SHA(p.read_bytes()) != row["sha256"]:
            changed.append(row["path"])
    check("Every original image, audio, source data, delivery payload and vendor byte matches V4", not changed, {"files": len(protected), "changed": changed})
    def embedded(site):
        text = (site / "index.html").read_text()
        return {m.group(1): SHA(m.group(2).encode()) for m in re.finditer(r'<script[^>]*type="application/json"[^>]*id="([^"]+)"[^>]*>(.*?)</script>', text, re.S)}
    before, after = embedded(old), embedded(new)
    check("Original embedded JSON/story payloads are byte identical", before and before == after, before)
    names = ["START.cmd", "LOCAL-SERVER.cjs", "portable-node/node.exe"]
    launchers = [{"path": name, "unchanged": SHA((baseline / name).read_bytes()) == SHA((current / name).read_bytes())} for name in names]
    check("Windows launcher, loopback server and portable Node are unchanged", all(r["unchanged"] for r in launchers), launchers)
    html = (new / "index.html").read_text()
    direct = (new / "hospital-direct-test.js").read_text()
    check("V11 launcher and inline store use the same isolated test namespace", "storyworld.hospital-three-pc.maze.v11:" in html and "storyworld.hospital-three-pc.maze.v11:" in direct and "storyworld.hospital-three-pc.maze.v4:" not in html and "storyworld.hospital-three-pc.maze.v4:" not in direct)
    report = {"schema": "r81-preservation/v1", "checks": checks, "passed": all(c["passed"] for c in checks), "baselineManifestSha256": SHA((old / "web-manifest-r62.json").read_bytes()), "browserVerified": False, "GPUVerified": False}
    (ROOT / "qa/r81/preservation-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"passed": sum(c["passed"] for c in checks), "total": len(checks)}))
    if not report["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

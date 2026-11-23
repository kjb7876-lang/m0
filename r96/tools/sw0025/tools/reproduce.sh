#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
repo="$(cd "${1:?usage: reproduce.sh REPO_ROOT EMPTY_OUTPUT}" && pwd)"
out="${2:?usage: reproduce.sh REPO_ROOT EMPTY_OUTPUT}"
mkdir -p "$out"
out="$(cd "$out" && pwd)"
mkdir -p "$out"/{full,compact,decoded,intermediates,provenance}
stock="$repo/r96/runtime-text/assets/r1305"
decoder="$repo/r96/runtime-text/vendor/three/examples/jsm/libs/meshopt_decoder.module.js"
for h in ego gunner hunter lauren michaela neon persona seoha slayer; do
 p="$stock/$h-3d.glb"
 f="$out/full/$h-3d.glb"
 d="$out/compact/$h.runtime-delta.json"
 if [[ "$h" == seoha ]]; then
  python3 "$here/tools/graft.py" "$p" "$here/authors/$h.json" "$out/intermediates/$h-3d.glb"
  python3 "$here/tools/seoha-dagger.py" "$out/intermediates/$h-3d.glb" "$f"
  python3 "$here/tools/compact-final.py" "$h" "$p" "$f" "$d"
 else
  python3 "$here/tools/graft.py" "$p" "$here/authors/$h.json" "$f" --compact-out "$d"
 fi
 python3 "$here/tools/verify-compact.py" "$p" "$f" "$d"
 node "$here/tools/decode-preview.mjs" "$f" "$out/decoded/$h-3d.glb" "$decoder"
done
python3 "$here/tools/audit.py" "$stock" "$out" "$here/authors"
blender -b -t 2 --python-exit-code 1 -P "$here/tools/check-blender.py" -- "$out/decoded" > "$out/provenance/blender-structural.log"

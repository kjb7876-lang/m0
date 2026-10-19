#!/usr/bin/env bash
set -euo pipefail
for generated in _pages _r70 _r71 _r72; do
  if test -d "$generated"; then
    test -f "$generated/docs/web-manifest-r62.json" || { echo "Refusing to clean an unrecognized build directory: $generated" >&2; exit 1; }
    rm -rf -- "$generated"
  fi
done
bash scripts/build-r73-site.sh
mkdir -p out/r74
python3 scripts/apply-r74.py --site _pages/docs | tee out/r74/build.json
node --test scripts/r74.cpu.test.mjs | tee out/r74/cpu.log

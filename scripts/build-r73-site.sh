#!/usr/bin/env bash
set -euo pipefail
mkdir -p out/r73
python3 scripts/unpack-runtime-r62.py --output _pages/docs
for rev in 66 67 68 69 70; do python3 "scripts/apply-r$rev.py" --site _pages/docs; done
cp -a _pages _r70
python3 scripts/apply-r71.py --site _pages/docs
cp -a _pages _r71
python3 scripts/apply-r72.py --site _pages/docs
cp -a _pages _r72
node --test scripts/r72.cpu.test.mjs | tee out/r73/r72-cpu.log
python3 scripts/apply-r73.py --site _pages/docs | tee out/r73/build.json
node --check _pages/docs/dist/phase1.js
node --test scripts/r73.cpu.test.mjs scripts/r73-slots.cpu.test.mjs scripts/r73-dom.cpu.test.mjs | tee out/r73/cpu.log

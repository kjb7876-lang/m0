#!/usr/bin/env bash
set -euo pipefail
bash scripts/build-r74-site.sh
if test -d _r74-reference; then
  test -f _r74-reference/docs/web-manifest-r62.json
  rm -rf -- _r74-reference
fi
cp -a _pages _r74-reference
mkdir -p out/r75
python3 scripts/story-r75.py | tee out/r75/source-contract.json
python3 scripts/apply-r75.py --site _pages/docs | tee out/r75/build.json
node --check _pages/docs/dist/phase1.js
node --test scripts/r75-story.cpu.test.mjs scripts/r75-hero-art.cpu.test.mjs scripts/r75-defense.cpu.test.mjs scripts/r75-dances.cpu.test.mjs scripts/r75-samong.cpu.test.mjs scripts/r75-objectives.cpu.test.mjs scripts/r75-world-guide.cpu.test.mjs scripts/r74-dances.cpu.test.mjs scripts/r74-health.cpu.test.mjs scripts/r74-elements.cpu.test.mjs scripts/r74-world.cpu.test.mjs | tee out/r75/cpu.log
node scripts/r74-coop-transition.cpu.cjs | tee out/r75/coop-transition.log

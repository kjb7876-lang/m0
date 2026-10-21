#!/usr/bin/env bash
# Manual candidate build entry. No upload, ref update, workflow dispatch or deploy.
# Existing R75/R76/R77 source approvals must pass before hospital output exists.
set -euo pipefail
bash scripts/build-r75-site.sh
python3 scripts/r75-release-gate.py
python3 scripts/apply-r76.py --site _pages/docs
python3 scripts/r76-release-gate.py
python3 scripts/apply-r77.py --site _pages/docs
python3 scripts/r77-release-gate.py
python3 scripts/build-hospital-b1.py --baseline _pages/docs --output out/hospital-b1-release/site

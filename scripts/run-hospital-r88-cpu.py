#!/usr/bin/env python3
"""Run the complete R88 suite from reconstructed inputs, never historical JSON.

Expected counts are compiled into the separately generated R88 gate only after
the actual frozen V12 proof exists. No guessed count or approval is created here.
"""
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-r88'
WORK = OUT / 'verification'


def now():
    return datetime.now(timezone.utc).isoformat()


def main():
    gate_spec = importlib.util.spec_from_file_location('r88_static_gate', ROOT / 'scripts/hospital-r88-release-gate.py')
    gate = importlib.util.module_from_spec(gate_spec)
    gate_spec.loader.exec_module(gate)
    expected_groups = len(gate.EXPECTED_RUNS)
    expected_checks = sum(gate.EXPECTED_CHECK_COUNTS.values())
    if expected_groups < 47 or expected_checks < 578:
        raise SystemExit('R88 contract lost preserved regression coverage')
    # These reproduce the exact historical fixture bytes used by existing QA;
    # they do not publish a historical artifact or borrow historical approvals.
    subprocess.run(['python3', 'scripts/prepare-handoff-baselines.py'], cwd=WORK, check=True)
    start = now()
    report = WORK / 'qa/r88/final-suite.json'
    report.unlink(missing_ok=True)
    subprocess.run(['node', 'qa/r88/run-suite.cjs'], cwd=WORK, check=True)
    data = json.loads(report.read_text())
    if data.get('passed') is not True or data.get('passedChecks') != expected_checks or data.get('totalChecks') != expected_checks or data.get('groups') != expected_groups or data.get('sourceUnchangedDuringRun') is not True or data.get('changedFiles') != []:
        raise SystemExit('Fresh complete R88 CPU suite did not pass its frozen contract')
    source = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    receipt = {'schema': 'storyworld.hospital-r88-preflight/v1', 'sourceCommit': source,
               'startedAt': start, 'finishedAt': now(), 'reportSHA256': hashlib.sha256(report.read_bytes()).hexdigest(),
               'reportPath': 'out/hospital-r88/verification/qa/r88/final-suite.json',
               'executedCommand': ['node', 'qa/r88/run-suite.cjs'], 'freshResults': True,
               'browserVerified': False, 'GPUVerified': False, 'naturalPlayVerified': False}
    (OUT / 'preflight.json').write_text(json.dumps(receipt, indent=2) + '\n')
    # Recheck actual staged bytes and every fresh per-group result immediately.
    approval = json.loads((ROOT / 'scripts/hospital-r88-approved-runtime.json').read_text())
    gate.validate_contract(approval)
    verified = gate.validate_artifact(OUT / 'site', approval)
    gate.validate_preflight(verified, ROOT)
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()

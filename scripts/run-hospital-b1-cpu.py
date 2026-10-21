#!/usr/bin/env python3
"""Execute fresh CPU checks. Reading old JSON never counts as a rerun."""
import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out/hospital-b1/build-connected'
RESULTS = ['final-results.json', 'audit/results.json', 'build-chain-results.json', 'storage-results.json', 'release-gate-tests.json', 'workflow-wiring-results.json']
COMMANDS = [
    ['node', str(OUT.relative_to(ROOT) / 'hospital-sim.mjs')],
    ['node', str(OUT.relative_to(ROOT) / 'audit/audit.mjs')],
    ['python3', 'scripts/hospital-b1-build.cpu.test.py'],
    ['node', 'scripts/hospital-b1-storage.cpu.test.mjs'],
    ['python3', 'scripts/hospital-b1-release-gate.cpu.test.py'],
    ['python3', 'scripts/hospital-b1-workflow.cpu.test.py'],
]


def main():
    if any((OUT / r).exists() for r in RESULTS) or (OUT / 'cpu-preflight.json').exists():
        raise SystemExit('Fresh result paths required; preserve existing evidence instead of overwriting it')
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    start_ns = time.time_ns()
    executed = []
    for i, cmd in enumerate(COMMANDS):
        with (OUT / ('cpu-command-' + str(i + 1) + '.log')).open('w') as log:
            process = subprocess.run(cmd, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        executed.append({'command': cmd, 'exitCode': process.returncode})
        print(json.dumps(executed[-1]), flush=True)
        if process.returncode: raise SystemExit('CPU command failed; see its original log')
    hashes, summary = {}, {}
    for name in RESULTS:
        p = OUT / name
        if not p.is_file() or p.stat().st_mtime_ns < start_ns: raise SystemExit('Result was not freshly generated: ' + name)
        result = json.loads(p.read_text())
        if result.get('failed') != 0: raise SystemExit('CPU failures: ' + name)
        hashes[str(p.relative_to(ROOT))] = hashlib.sha256(p.read_bytes()).hexdigest()
        summary[name] = {'passed': result.get('passed'), 'failed': result.get('failed')}
    paths = ['.github/workflows/pages.yml', 'client-source/hospital-prototype-b1.js', 'client-source/hospital-visual-b1.js', 'client-source/hospital-sight-fix-b1.js', 'client-source/hospital-test-storage-b1.js', 'scripts/apply-hospital-prototype-b1.py', 'scripts/apply-hospital-visual-b1.py', 'scripts/apply-hospital-sight-fix-b1.py', 'scripts/build-hospital-b1.py', 'scripts/build-hospital-b1-release.sh', 'scripts/prepare-hospital-b1-cpu.py', 'scripts/run-hospital-b1-cpu.py', 'scripts/hospital-b1-release-gate.py', 'scripts/hospital-b1-build.cpu.test.py', 'scripts/hospital-b1-storage.cpu.test.mjs', 'scripts/hospital-b1-release-gate.cpu.test.py', 'scripts/hospital-b1-workflow.cpu.test.py', 'docs/hospital-b1-evidence/hospital-sim.mjs', 'docs/hospital-b1-evidence/audit.mjs']
    paths += ['client-source/hospital-core-b2.js', 'client-source/hospital-runtime-b2.js', 'scripts/build-hospital-b2.py', 'scripts/run-hospital-b2-cpu.py', 'scripts/hospital-b2-release-gate.py', 'docs/hospital-b2-evidence/runtime.mjs', 'docs/hospital-b2-evidence/checks.mjs', 'docs/hospital-b2-evidence/structure.mjs', 'docs/hospital-b2-evidence/ego-control.mjs', 'docs/hospital-b2-evidence/canonical-summons-b2.json']
    receipt = {'schema': 'm0.hospital.clean-cpu-preflight/v1', 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(), 'sourceTree': subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=ROOT, text=True).strip(), 'startedAt': started, 'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'freshResultFiles': True, 'executedCommands': executed, 'resultHashes': hashes, 'summary': summary, 'sourcePathHashes': {p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in paths}, 'runtimeHashes': {p: hashlib.sha256((OUT / 'site' / p).read_bytes()).hexdigest() for p in ['index.html', 'dist/phase1.js']}, 'manifestSHA256BeforeReleaseStamp': hashlib.sha256((OUT / 'site/web-manifest-r62.json').read_bytes()).hexdigest(), 'originalUserSavesUsed': False, 'browserExecuted': False, 'ok': True}
    (OUT / 'cpu-preflight.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt))


if __name__ == '__main__': main()

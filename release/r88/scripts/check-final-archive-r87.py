#!/usr/bin/env python3
"""Extract both delivered ZIPs and test those exact bytes over local HTTP."""
from pathlib import Path, PurePosixPath
import hashlib,json,subprocess,zipfile
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT.parent/'outputs'
DEST=OUT/'v11-two-extracted-check'
if DEST.exists():raise SystemExit('Extraction destination already exists; no overwrite performed')
DEST.mkdir()
seen=set()
for i in (1,2):
    p=OUT/f'StoryWorld-PC-R87-V11-PART{i:02d}-of-02.zip'
    with zipfile.ZipFile(p) as z:
        if z.testzip():raise ValueError('Archive CRC mismatch')
        for n in z.namelist():
            q=PurePosixPath(n)
            if q.is_absolute() or '..' in q.parts or n in seen:raise ValueError('Unsafe or duplicate archive path: '+n)
            seen.add(n)
        z.extractall(DEST)
site=DEST/'hospital-three-pc/site';final=json.loads((DEST/'qa/r87/final-suite.json').read_text())
bad=[n for n,sha in final['sourceHashes'].items() if hashlib.sha256((site/n).read_bytes()).hexdigest()!=sha]
if bad:raise ValueError('Extracted runtime differs: '+str(bad))
p=subprocess.run(['node',str(DEST/'qa/package-check.cjs')],cwd=DEST,capture_output=True,text=True,timeout=180)
(OUT/'v11-two-extraction-check.log').write_text(p.stdout+p.stderr)
report=json.loads((DEST/'qa/package-results.json').read_text())
report.update(extractedParts=2,archiveUnionFiles=len(seen),frozenRuntimeFilesVerified=len(final['sourceHashes']),runtimeHashMismatches=bad,packageExitCode=p.returncode)
(OUT/'v11-two-extraction-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
if p.returncode or not report['passed']:raise SystemExit('Extracted package checks failed; see report')
print(json.dumps({'passed':True,'checks':len(report['checks']),'runtimeFiles':len(final['sourceHashes']),'archiveFiles':len(seen)}))

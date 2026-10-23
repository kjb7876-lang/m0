#!/usr/bin/env python3
"""Copy frozen R87 canonical source into the package; never change runtime files."""
from pathlib import Path
import hashlib,json,shutil
from datetime import datetime,timezone
import argparse
ROOT=Path(__file__).resolve().parents[1]
SHA=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--frozen',action='store_true',help='required: root has frozen source for final verification');a=p.parse_args()
 if not a.frozen:raise SystemExit('No copy performed. Run with --frozen only after final source freeze.')
 target=ROOT/'hospital-three-pc/source-patch';site=ROOT/'hospital-three-pc/site';files=sorted((ROOT/'client-source').glob('*.js'))+[ROOT/'scripts/apply-r82.py',ROOT/'scripts/apply-r83.py',ROOT/'scripts/apply-r84.py',ROOT/'scripts/apply-r85.py',ROOT/'scripts/apply-r86.py',ROOT/'scripts/apply-r87.py']+sorted((ROOT/'qa/r83').glob('*-patch.cjs'))+sorted((ROOT/'qa/r84').glob('*-patch.cjs'))+sorted((ROOT/'qa/r85').glob('*.cjs'))+sorted((ROOT/'qa/r86').glob('*.cjs'))+sorted((ROOT/'qa/r87').glob('*.cjs'))+sorted((ROOT/'qa/r87').glob('*.py'))+[ROOT/'qa/r87/image-dimensions.json']+[ROOT/'qa/r85/presentation-baseline.json',ROOT/'qa/r85/integration.json',ROOT/'qa/r83/effect-integration.json']
 required={'world-layout-r78.js','world-combat-r78.js','world-combat-v4-compat.js','world-environment-r81.js','world-presentation-r81.js','hospital-maze-progression.js'}
 if not required.issubset({f.name for f in files}):raise SystemExit('Missing canonical R87 source')
 rows=[]
 for source in files:
  rel=source.relative_to(ROOT);dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest)
  row={'path':str(rel),'bytes':dest.stat().st_size,'sha256':SHA(dest)}
  if row['sha256']!=SHA(source):raise SystemExit('Source copy mismatch: '+str(rel))
  runtime=site/source.name
  if rel.parts[0]=='client-source' and runtime.is_file():
   row['runtimePath']=str(runtime.relative_to(ROOT/'hospital-three-pc'));row['runtimeSHA256']=SHA(runtime);row['runtimeIdentical']=row['runtimeSHA256']==row['sha256']
   if not row['runtimeIdentical']:raise SystemExit('Canonical source differs from runnable site: '+str(rel))
  rows.append(row)
 report={'schema':'r87-source-snapshot/v1','frozenAt':datetime.now(timezone.utc).isoformat(),'files':rows,'sourceFiles':len(rows),'runtimeEdited':False,'publicDeploymentChanged':False,'testResults':'../../qa/r87/final-suite.json','browserVerified':False,'GPUVerified':False}
 (target/'source-snapshot-r87.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'sourceFiles':len(rows),'verified':True,'runtimeEdited':False}))
if __name__=='__main__':main()

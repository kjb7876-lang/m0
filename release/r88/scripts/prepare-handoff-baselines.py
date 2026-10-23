#!/usr/bin/env python3
"""Restore exact historical CPU fixtures from current shared bytes + tiny overlays.
Run after extracting into one new parent folder. Never overwrites different bytes.
"""
from pathlib import Path
import hashlib,json,os,shutil
ROOT=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def put(source,target,expected):
 if source.is_symlink() or not source.is_file() or sha(source)!=expected:raise ValueError('Baseline input missing/changed: '+str(source))
 if target.exists():
  if target.is_symlink() or sha(target)!=expected:raise ValueError('Refusing to overwrite another baseline: '+str(target))
  return
 target.parent.mkdir(parents=True,exist_ok=True)
 try:os.link(source,target)
 except OSError:shutil.copyfile(source,target)
def main():
 spec=json.loads((ROOT/'handoff/baseline-inputs.json').read_text());count=0
 for v in spec['variants']:
  dest=ROOT.parent/v['folder']
  for r in v['files']:
   source=ROOT/r['overlay'] if 'overlay' in r else ROOT/'hospital-three-pc/site'/r['path']
   put(source,dest/'hospital-three-pc/site'/r['path'],r['sha256']);count+=1
  for r in v.get('launchers',[]):put(ROOT/'hospital-three-pc'/r['path'],dest/'hospital-three-pc'/r['path'],r['sha256'])
  if 'harness' in v:
   source=ROOT/v['harness'];put(source,dest/'qa/harness.cjs',sha(source))
 print(json.dumps({'historicalFixtureFilesVerified':count,'runtimeEdited':False,'differentExistingFilesOverwritten':False}))
if __name__=='__main__':main()

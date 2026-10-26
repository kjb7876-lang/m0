#!/usr/bin/env python3
"""R99: copy canonical r96/client-source overlays (and any listed runtime-text
files) into the manifest-owned runtime, refreshing hashes, sizes, textPaths and
the manifest digest. Idempotent; run after editing client-source or adding
files under r96/runtime-text."""
import hashlib,json,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96'
sha=lambda b:hashlib.sha256(b).hexdigest()
def main(extra):
 for p in sorted((R/'client-source').glob('*.js')):
  t=R/'runtime-text'/p.name
  if not t.exists() or t.read_bytes()!=p.read_bytes():shutil.copyfile(p,t);print('copied',p.name)
 spec=json.loads((R/'runtime-inputs.json').read_text());m=json.loads((R/'runtime-manifest.json').read_text())
 rows={r['path']:r for r in m['files']}
 for name in list(spec['textPaths'])+[n for n in extra if n not in spec['textPaths']]:
  b=(R/'runtime-text'/name).read_bytes()
  if name not in spec['textPaths']:
   # a processed replacement for a baseline file moves from basePaths to textPaths
   if name in spec['basePaths']:spec['basePaths'].remove(name);print('moved from basePaths',name)
   if name in spec['mediaPaths']:raise SystemExit('media pack file cannot be replaced: '+name)
   spec['textPaths'].append(name);print('added',name)
  row=rows.get(name)
  if row is None:row=rows[name]={'path':name};m['files'].append(row)
  row['bytes']=len(b);row['sha256']=sha(b)
 m['files'].sort(key=lambda r:r['path']);m['fileCount']=len(m['files']);m['totalBytes']=sum(r['bytes'] for r in m['files'])
 mb=(json.dumps(m,ensure_ascii=False,indent=2)+'\n').encode()
 (R/'runtime-manifest.json').write_bytes(mb);spec['runtimeManifestSHA256']=sha(mb)
 (R/'runtime-inputs.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'files':len(m['files']),'manifest':spec['runtimeManifestSHA256']}))
if __name__=='__main__':main(sys.argv[1:])

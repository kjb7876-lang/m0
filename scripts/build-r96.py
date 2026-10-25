#!/usr/bin/env python3
"""Reconstruct only manifest-owned R96 web files; verify every byte before use."""
import hashlib,json,shutil,subprocess,tempfile,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'r96'
TARGET=SOURCE/'hospital-three-pc/site'
sha=lambda b:hashlib.sha256(b).hexdigest()
def safe(name):
 p=PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or '\\' in name:raise ValueError('Unsafe path')
 return name
def main():
 spec=json.loads((SOURCE/'runtime-inputs.json').read_text())
 mb=(SOURCE/'runtime-manifest.json').read_bytes()
 assert sha(mb)==spec['runtimeManifestSHA256']
 manifest=json.loads(mb);expected={r['path']:r for r in manifest['files']}
 assert len(expected)==manifest['fileCount']
 groups=spec['basePaths']+spec['textPaths']+spec['mediaPaths']
 assert len(set(groups))==len(groups) and set(groups)==set(expected)
 for name in groups:safe(name)
 if TARGET.exists():raise ValueError('Fresh output required')
 TARGET.mkdir(parents=True)
 with tempfile.TemporaryDirectory(prefix='r96-build-') as tmp:
  tmp=Path(tmp);baseline=tmp/'base/docs'
  subprocess.run(['python3',str(ROOT/'scripts/unpack-runtime-r62.py'),'--output',str(baseline)],cwd=ROOT,check=True)
  for names,origin in [(spec['basePaths'],baseline),(spec['textPaths'],SOURCE/'runtime-text')]:
   for name in names:
    p=TARGET/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(origin/name,p)
  archive=tmp/'runtime.zip'
  with archive.open('wb') as f:
   for row in spec['parts']:
    b=(ROOT/safe(row['path'])).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'];f.write(b)
  assert sha(archive.read_bytes())==spec['archiveSHA256']
  with zipfile.ZipFile(archive) as z:
   assert set(z.namelist())==set(spec['mediaPaths']) and len(z.namelist())==len(spec['mediaPaths'])
   assert z.testzip() is None
   z.extractall(TARGET)
 for name,row in expected.items():
  b=(TARGET/name).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'],name
 (TARGET/'web-manifest-r62.json').write_bytes(mb)
 for p in (SOURCE/'client-source').glob('*.js'):
  if (TARGET/p.name).exists():assert p.read_bytes()==(TARGET/p.name).read_bytes(),p.name
 receipt={'files':len(expected),'bytes':sum(r['bytes'] for r in expected.values()),'runtimeManifestSHA256':sha(mb),'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()}
 (SOURCE/'build-result.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
if __name__=='__main__':main()

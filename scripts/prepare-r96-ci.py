"""Restore exact QA inputs; deduplicate preserved source pixels against the built site."""
from pathlib import Path, PurePosixPath
import hashlib,json,zipfile,tempfile,shutil
root=Path(__file__).resolve().parents[1];target=root/'r96';site=target/'hospital-three-pc/site'
sha=lambda b:hashlib.sha256(b).hexdigest()
spec=json.loads((target/'ci-inputs.json').read_text())
with tempfile.TemporaryDirectory() as td:
 archive=Path(td)/'inputs.zip'
 with archive.open('wb') as f:
  for r in spec['parts']:
   b=(root/r['path']).read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256'];f.write(b)
 assert sha(archive.read_bytes())==spec['archiveSHA256']
 with zipfile.ZipFile(archive) as z:
  expected={r['path'] for r in spec['files'] if 'runtimePath' not in r}
  assert len(z.namelist())==len(expected) and set(z.namelist())==expected and z.testzip() is None
  for name in z.namelist():assert not PurePosixPath(name).is_absolute() and '..' not in PurePosixPath(name).parts
  z.extractall(target)
 for r in spec['files']:
  p=target/r['path']
  if 'runtimePath' in r:
   p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(site/r['runtimePath'],p)
  b=p.read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256'],r['path']
print('Exact CI fixture files verified:',len(spec['files']))

from pathlib import Path
import json,hashlib,os
root=Path(__file__).resolve().parents[1];r=root/'r96';site=r/'hospital-three-pc/site';sha=lambda b:hashlib.sha256(b).hexdigest()
manifest=(r/'runtime-manifest.json').read_bytes();spec=json.loads(manifest)
assert (site/'web-manifest-r62.json').read_bytes()==manifest
expected={v['path'] for v in spec['files']}|{'web-manifest-r62.json'}
assert {p.relative_to(site).as_posix() for p in site.rglob('*') if p.is_file()}==expected
for v in spec['files']:
 b=(site/v['path']).read_bytes();assert len(b)==v['bytes'] and sha(b)==v['sha256'],v['path']
for p in (r/'client-source').glob('*.js'):
 if (site/p.name).exists():assert p.read_bytes()==(site/p.name).read_bytes(),p.name
browser=json.loads((r/'browser-results.json').read_text());assert browser['passed'] and browser['sandbox'] and not browser['errors']
result={'passed':True,'sourceCommit':os.environ.get('GITHUB_SHA'),'runtimeManifestSHA256':sha(manifest),'verifiedFiles':spec['fileCount'],'browserSandbox':True}
(r/'release-result.json').write_text(json.dumps(result,indent=2));print(result)

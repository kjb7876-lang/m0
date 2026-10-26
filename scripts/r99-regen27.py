#!/usr/bin/env python3
"""R99: install the docs-regenerated replacements for the 27 actor/projectile
images with background-removal faults (list: docs-regen-list.md). Usage:
  python3 scripts/r99-regen27.py /path/to/unzipped/regen27
Each replacements/<path>.webp must keep the original canvas size and carry
alpha. Copies go to r96/runtime-text/assets/r99/clean/<path> (the original
bytes stay untouched), r96/r99-regen27.json records them, regenerated paths
leave r99-defringe.json, and the redirect list in assets-clean-r99.js is
rebuilt from both records."""
import hashlib,json,re,shutil,subprocess,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];R=ROOT/'r96';SITE=R/'hospital-three-pc/site';src=Path(sys.argv[1])/'replacements'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=[]
for f in sorted(src.rglob('*.webp')):
 rel=f.relative_to(src).as_posix();orig=SITE/rel
 if not orig.is_file():raise SystemExit('no original in built site: '+rel)
 a,b=Image.open(orig),Image.open(f)
 if a.size!=b.size or b.mode!='RGBA':raise SystemExit(f'{rel}: size {b.size} vs {a.size}, mode {b.mode}')
 out=R/'runtime-text/assets/r99/clean'/rel;out.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,out)
 rows.append({'path':rel,'sourceSHA256':sha(orig),'output':'assets/r99/clean/'+rel,'outputSHA256':sha(out)})
(R/'r99-regen27.json').write_text(json.dumps({'schema':'storyworld.r99-regen27/v1','note':'docs-regenerated transparent replacements; originals unchanged, loads redirected by assets-clean-r99.js','files':rows},ensure_ascii=False,indent=2)+'\n')
regen={r['path'] for r in rows};D=R/'r99-defringe.json';d=json.loads(D.read_text())
d['files']=[r for r in d['files'] if r['path'] not in regen];D.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
paths=sorted({r['path'] for r in d['files']}|regen);js=R/'client-source/assets-clean-r99.js';t=js.read_text()
t=re.sub(r'const CLEAN=new Set\(\[[^\]]*\]\)','const CLEAN=new Set('+json.dumps(paths)+')',t);js.write_text(t)
print(json.dumps({'installed':len(rows),'redirected':len(paths)}))
subprocess.run([sys.executable,str(ROOT/'scripts/sync-r99.py'),*[r['output'] for r in rows]],check=True)

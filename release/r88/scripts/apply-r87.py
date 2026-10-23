#!/usr/bin/env python3
"""Integrate the explicitly requested three painted atlases on preserved R86."""
from pathlib import Path
import hashlib,importlib.util,json,re,shutil
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'hospital-three-pc/site'
NAMES=['painted-vfx-data-r87.js','painted-vfx-r87.js']
SHA=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def apply(site=SITE):
 p=site/'index.html';s=p.read_text()
 for n in NAMES:s=s.replace(f'<script src="./{n}"></script>\n','').replace(f'<script src="./{n}"></script>','')
 p.write_text(s)
 spec=importlib.util.spec_from_file_location('r86_base',ROOT/'scripts/apply-r86.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base);base.apply(site)
 s=p.read_text()
 for n in NAMES:
  shutil.copyfile(ROOT/'client-source'/n,site/n);s=s.rstrip()+f'\n<script src="./{n}"></script>\n'
 s=s.replace('storyworld.hospital-three-pc.maze.v10:','storyworld.hospital-three-pc.maze.v11:').replace('./dist/phase1.js?r86=1','./dist/phase1.js?r87=1');p.write_text(s)
 for n in ['hospital-direct-test.js','hospital-pc-test.js']:
  q=site/n;q.write_text(q.read_text().replace('storyworld.hospital-three-pc.maze.v10:','storyworld.hospital-three-pc.maze.v11:'))
 mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());names={r['path'] for r in m['files']}|set(NAMES)
 names.update(q.relative_to(site).as_posix() for q in (site/'assets/painted-vfx-r87').rglob('*') if q.is_file())
 rows=[{'path':n,'bytes':(site/n).stat().st_size,'sha256':SHA(site/n)} for n in sorted(names)]
 report={'revision':'R87/V11','paintedAtlases':['poison16','scalpel16','thorn24'],'legacyProcedural80Loaded':False,'rootBoss':'dist00-boss','rootDurationSeconds':2.2,'rootDotPulses':4,'rootDotBudgetFactor':.6,'rootEscape':'S native blink','rootSingleOverlay':True,'seamlessLoopVerified':False,'testStoragePrefix':'storyworld.hospital-three-pc.maze.v11:','browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'publicDeploymentChanged':False}
 m.update(files=rows,fileCount=len(rows),totalBytes=sum(r['bytes'] for r in rows),webHTMLSha256=SHA(p),largest=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20]);m['r87']=report
 mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(ROOT/'qa/r87/integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'R87_APPLIED','files':len(rows)}))
if __name__=='__main__':apply()

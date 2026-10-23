#!/usr/bin/env python3
"""Build V10 on the preserved V9; never mutate its original embedded story."""
from pathlib import Path
import hashlib, importlib.util, json, re, shutil, subprocess
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'hospital-three-pc/site'
SHA=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def apply(site=SITE):
    p=site/'index.html';s=p.read_text()
    s=s.replace('<!-- R86 user scope: supplied dynamic package preserved offline; not loaded -->','<!-- R84 supplied deterministic VFX: no preview loop -->')
    payload=re.search(r'<script type="application/json" id="portable-data">(.*?)</script>',s,re.S).group(1)
    # Remove only our late tags before the older builders reorder extensions.
    for source in sorted((ROOT/'client-source').glob('*r86*.js')):
        tag=f'<script src="./{source.name}"></script>'
        s=s.replace(tag+'\n','').replace(tag,'')
    # Older builders require these historical tags while assembling V9. They
    # are removed from the delivered page below, per the user's latest scope.
    for name in ['assets/refined-r85/dynamic/catalog.js','assets/refined-r85/dynamic/runtime.js','dynamic-vfx-r84.js']:
        tag=f'<script src="./{name}"></script>'
        if tag not in s:s=s.rstrip()+'\n'+tag+'\n'
    p.write_text(s)
    spec=importlib.util.spec_from_file_location('r85_base',ROOT/'scripts/apply-r85.py')
    base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base);base.apply(site)
    subprocess.run(['node',str(ROOT/'qa/r86/camera-patch.cjs'),str(p)],check=True)
    perf=ROOT/'qa/r86/performance-patch.cjs'
    if perf.is_file():subprocess.run(['node',str(perf),str(site/'dist/phase1.js')],check=True)
    s=p.read_text()
    for name in ['assets/refined-r85/dynamic/catalog.js','assets/refined-r85/dynamic/runtime.js','assets/dynamic-vfx-r84/catalog.js','assets/dynamic-vfx-r84/runtime.js','dynamic-vfx-r84.js']:
        tag=f'<script src="./{name}"></script>'
        s=s.replace(tag+'\n','').replace(tag,'')
    s=s.replace('<!-- R84 supplied deterministic VFX: no preview loop -->','<!-- R86 user scope: supplied dynamic package preserved offline; not loaded -->')
    for source in sorted((ROOT/'client-source').glob('*r86*.js')):
        shutil.copyfile(source,site/source.name)
        s=s.rstrip()+f'\n<script src="./{source.name}"></script>\n'
    s=s.replace('storyworld.hospital-three-pc.maze.v9:','storyworld.hospital-three-pc.maze.v10:')
    s=re.sub(r'src="\./dist/phase1\.js(?:\?[^\"]*)?"','src="./dist/phase1.js?r86=1"',s)
    if re.search(r'<script type="application/json" id="portable-data">(.*?)</script>',s,re.S).group(1)!=payload:raise ValueError('Original embedded story changed')
    p.write_text(s)
    for name in ['hospital-direct-test.js','hospital-pc-test.js']:
        q=site/name;q.write_text(q.read_text().replace('storyworld.hospital-three-pc.maze.v9:','storyworld.hospital-three-pc.maze.v10:'))
    mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());names={r['path'] for r in m['files']}
    names.update(source.name for source in (ROOT/'client-source').glob('*r86*.js'))
    rows=[{'path':n,'bytes':(site/n).stat().st_size,'sha256':SHA(site/n)} for n in sorted(names)]
    report={'revision':'R86/V10','pcDefaultViewExpansion':1.5,'pcDefaultViewArea':2.25,'championBodyScale':2,'championHPScale':6,'championAttackScale':6,'baseline':'Preserved V9/R85','testStoragePrefix':'storyworld.hospital-three-pc.maze.v10:','suppliedDynamicPackageEnabled':False,'dynamic80RecipesGameLoaded':False,'selectedStaticPNGsEnabled':True,'originalNativeSkillsPreserved':True,'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'publicDeploymentChanged':False}
    m.update(files=rows,fileCount=len(rows),totalBytes=sum(r['bytes'] for r in rows),webHTMLSha256=SHA(p),largest=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20]);m['r86']=report
    mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(ROOT/'qa/r86/integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':'R86_APPLIED','files':len(rows)}))
if __name__=='__main__':apply()

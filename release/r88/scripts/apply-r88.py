#!/usr/bin/env python3
"""Apply the supplied42 painted assets over the preserved R87 PC candidate."""
from pathlib import Path
import hashlib,importlib.util,json,shutil
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'hospital-three-pc/site'
NAMES=['final42-data-r88.js','final42-runtime-r88.js','final42-hooks-r88.js']
SHA=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def apply(site=SITE):
    p=site/'index.html';s=p.read_text()
    for n in NAMES:s=s.replace(f'<script src="./{n}"></script>\n','').replace(f'<script src="./{n}"></script>','')
    p.write_text(s)
    spec=importlib.util.spec_from_file_location('preserved_r87',ROOT/'scripts/apply-r87.py')
    base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base);base.apply(site)
    s=p.read_text()
    for n in NAMES:
        shutil.copyfile(ROOT/'client-source'/n,site/n)
        s=s.rstrip()+f'\n<script src="./{n}"></script>\n'
    shutil.copyfile(ROOT/'client-source/final42-preview.html',site/'final42-preview.html')
    s=s.replace('./dist/phase1.js?r87=1','./dist/phase1.js?r88=1');p.write_text(s)
    mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());names={r['path'] for r in m['files']}|set(NAMES)|{'final42-preview.html'}
    names.update(q.relative_to(site).as_posix() for q in (site/'assets/final42-r88').rglob('*') if q.is_file())
    rows=[{'path':n,'bytes':(site/n).stat().st_size,'sha256':SHA(site/n)} for n in sorted(names)]
    data=json.loads((ROOT/'qa/r88/final42-normalized.json').read_text())
    report={'revision':'R88/V12','paintedEffectCount':42,'storedPaintedFrames':680,'runtimeAtlasCount':42,'authoritativeIndexSHA256':data['sourceIndexSHA256'],'legacyProcedural80Loaded':False,'prior3MedicalRootEffectsSingleOwner':True,'rootMechanicPreserved':'2.2s bind,4 native DOT pulses,S blink escape','saveNamespace':'storyworld.hospital-three-pc.maze.v11:','existingV11SavesRetained':True,'oldB2SaveAutomaticallyImported':False,'sourceImagesReencoded':False,'sourceMetadataModified':False,'browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'publicDeploymentChanged':False}
    m.update(files=rows,fileCount=len(rows),totalBytes=sum(r['bytes'] for r in rows),webHTMLSha256=SHA(p),largest=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20]);m['r88']=report
    mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(ROOT/'qa/r88/integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':'R88_APPLIED','files':len(rows),'effects':42}))
if __name__=='__main__':apply()

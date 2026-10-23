#!/usr/bin/env python3
"""Integrate the supplied four-raster/runtime refinement on the preserved V8."""
from pathlib import Path
import hashlib, importlib.util, io, json, re, shutil
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'hospital-three-pc/site'
SOURCE=ROOT/'hospital-three-pc/source-patch/asset-source-docs/refined-r85'
SHA=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def data_file(path, frozen=False):
    s=path.read_text().split('=',1)[1].strip().removesuffix(';')
    return json.loads(s[len('Object.freeze('):-1] if frozen else s)

def apply(site=SITE):
    baseline=json.loads((ROOT/'qa/r85/presentation-baseline.json').read_text())
    if SHA(site/'assets/world-r80/catalog.json')!=baseline['legacyWorldCatalogSHA256']:raise ValueError('Protected legacy world catalog changed')
    current={r['file']:r for r in json.loads((SOURCE/'current-assets.json').read_text())['files']}
    changes=json.loads((SOURCE/'refinement-changes.json').read_text())
    for row in changes:
        p=SOURCE/row['destination']
        if SHA(p)!=current[row['destination']]['sha256']:raise ValueError('Refined source mismatch: '+str(p))
    world_path=ROOT/'client-source/world-assets-r80-data.js'
    world=data_file(world_path);derivatives=[]
    for key,old in baseline['props'].items():
        src=SOURCE/'art'/old['source'];im=Image.open(src).convert('RGBA')
        b=im.getchannel('A').point(lambda a:255 if a>=16 else 0).getbbox()
        x0,y0,x1,y1=b;x0=max(0,x0-6);y0=max(0,y0-6);x1=min(im.width,x1+6);y1=min(im.height,y1+6)
        crop=im.crop((x0,y0,x1,y1));factor=min(1,512/max(crop.size));size=tuple(max(1,round(v*factor)) for v in crop.size)
        if crop.size!=size:crop=crop.resize(size,Image.Resampling.LANCZOS)
        # Map the existing ground anchor through each alpha-bound rectangle.
        ob=old['derivative']['crop'];of=old['derivative']['scale'];op=old['frame']['pivot']
        fraction=[((op[i]/of+ob[i])-ob[i])/(ob[i+2]-ob[i]) for i in (0,1)]
        pivot=[round(fraction[i]*size[i],3) for i in (0,1)]
        dest=site/'assets/world-r80'/('refined-r85-'+key+'.webp');dest.parent.mkdir(parents=True,exist_ok=True)
        buf=io.BytesIO();crop.save(buf,'WEBP',lossless=True,method=6);dest.write_bytes(buf.getvalue())
        entry={**old,'path':dest.relative_to(site).as_posix(),'sourceSHA256':SHA(src),'sha256':SHA(dest),'bytes':dest.stat().st_size,'width':size[0],'height':size[1],'rgbaBytes':size[0]*size[1]*4,
               'frame':{'sourceRect':[0,0,*size],'pivot':pivot,'visibleHeight':size[1],'visibleBounds':[0,0,*size]},
               'derivative':{'crop':[x0,y0,x1,y1],'scale':factor,'originalPreserved':True,'pivotStatus':'previous normalized ground anchor mapped to refined alpha crop; CPU checked, GPU unverified'},
               'refinementR85':{'originalRuntimePath':old['path'],'originalSourceSHA256':old['sourceSHA256'],'sourceFile':'art/'+old['source'],'nativePlacementChanged':False}}
        world['assets'][key]=entry;derivatives.append({'key':key,'source':entry['source'],'path':entry['path'],'dimensions':list(size),'pivot':pivot,'worldScale':entry['scale'],'groundAnchorFraction':fraction})
    world_path.write_text('window.__STORYWORLD_ASSETS_R80_DATA__='+json.dumps(world,ensure_ascii=False,separators=(',',':'))+';\n')
    catalog_path=site/'assets/refined-r85/world-catalog.json';catalog_path.parent.mkdir(parents=True,exist_ok=True)
    catalog_path.write_text(json.dumps(world,ensure_ascii=False,indent=2)+'\n')
    sand=SOURCE/'dynamic/assets/batch04/04-kair03-exhausted-sand-tracks.png';im=Image.open(sand).convert('RGBA');box=list(im.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox())
    old=baseline['sand'];ob=old['alpha64BBox'];gain=max(ob[2]-ob[0],ob[3]-ob[1])/max(box[2]-box[0],box[3]-box[1])
    if not 1<=gain<=1.5:raise ValueError('Unreviewed sand footprint gain')
    rel='assets/vfx-r83/refined-r85/04-kair03-exhausted-sand-tracks.png';dest=site/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(sand,dest)
    p=ROOT/'client-source/vfx-selected-data-r83.js';data=data_file(p,True)
    data['regions']['kair03']['recovery']={**old,'path':rel,'sha256':SHA(sand),'dimensions':list(im.size),'decodedBytes':im.width*im.height*4,'alpha64BBox':box,'selection':'refined_same_concept','presentationScaleR85':gain,'refinementR85':True,'originalSourceSHA256':old['sha256']}
    p.write_text('window.__STORYWORLD_SELECTED_VFX_DATA_R83__=Object.freeze('+json.dumps(data,ensure_ascii=False,separators=(',',':'))+');\n')
    # Only the new sand sprite needs gain; vector accents retain native size.
    p=ROOT/'client-source/vfx-selected-r83.js';s=p.read_text();s=s.replace('k=maximum/Math.max(iw,ih),cx=', 'k=maximum/Math.max(iw,ih)*(a.presentationScaleR85||1),cx=');p.write_text(s)
    p=ROOT/'client-source/dynamic-vfx-r84.js';s=p.read_text();s=s.replace('*(q.size/nominal);','*(q.size/nominal)*(spec.presentationScaleR85||1);');p.write_text(s)
    # Normalize the active source tags before running the preserved builder.
    p=site/'index.html';s=p.read_text()
    for name in ['catalog.js','runtime.js']:s=s.replace('./assets/refined-r85/dynamic/'+name,'./assets/dynamic-vfx-r84/'+name)
    p.write_text(s)
    spec=importlib.util.spec_from_file_location('r84_base',ROOT/'scripts/apply-r84.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base);base.apply(site)
    dest=site/'assets/refined-r85';dest.mkdir(parents=True,exist_ok=True)
    for row in changes:
        if row['destination'].startswith('art/'):
            p=dest/row['destination'];p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SOURCE/row['destination'],p)
    for name in ['catalog.js','catalog.json','runtime.js','README-KO.txt']:
        p=dest/'dynamic'/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(SOURCE/'dynamic'/name,p)
    p=site/'index.html';s=p.read_text()
    for name in ['catalog.js','runtime.js']:s=s.replace('./assets/dynamic-vfx-r84/'+name,'./assets/refined-r85/dynamic/'+name)
    s=s.replace('storyworld.hospital-three-pc.maze.v8:','storyworld.hospital-three-pc.maze.v9:').replace('./dist/phase1.js?r84=1','./dist/phase1.js?r85=1');p.write_text(s)
    for name in ['hospital-direct-test.js','hospital-pc-test.js']:
        p=site/name;p.write_text(p.read_text().replace('storyworld.hospital-three-pc.maze.v8:','storyworld.hospital-three-pc.maze.v9:'))
    report={'revision':'R85/V9','downloadedUpdateZIP':{'bytes':4116662,'sha256':'dd6f41e7d836bdde6cc033d0a6ccabd1ac05509a1a445ae6f1fd6020973c6690'},'pngInventory':318,'retainedPNGs':314,'refinedPNGs':4,'dynamicRecipes':80,'activeRuntimeVersion':'1.1.0','hospitalProps':derivatives,'sand':{'path':rel,'bbox':box,'rasterGain':gain,'sourceSHA256':SHA(sand),'oldVisibleWidth':ob[2]-ob[0],'newVisibleWidth':box[2]-box[0]},'nativePropPlacementChanged':False,'hospitalEntry':'settings-only','browserVerified':False,'GPUVerified':False,'naturalPlayVerified':False,'publicDeploymentChanged':False}
    (ROOT/'qa/r85/integration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());names={r['path'] for r in m['files']}
    names.update(p.relative_to(site).as_posix() for folder in [site/'assets/refined-r85',site/'assets/vfx-r83/refined-r85'] for p in folder.rglob('*') if p.is_file())
    names.update(row['path'] for row in derivatives)
    rows=[{'path':n,'bytes':(site/n).stat().st_size,'sha256':SHA(site/n)} for n in sorted(names)]
    m.update(files=rows,fileCount=len(rows),totalBytes=sum(r['bytes'] for r in rows),webHTMLSha256=SHA(site/'index.html'),largest=sorted(rows,key=lambda r:r['bytes'],reverse=True)[:20]);m['r85']=report;mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'status':'R85_APPLIED','files':len(rows),'refined':4,'sandGain':gain}))

if __name__=='__main__':apply()

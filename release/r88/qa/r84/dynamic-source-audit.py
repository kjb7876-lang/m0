#!/usr/bin/env python3
"""Independent audit of the supplied original dynamic80 source and SVG evidence.

Default paths are portable in the delivered package. PNG bytes are reused from
the existing R83 selected-assets directory, never duplicated or re-encoded.
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
SHA = lambda data: hashlib.sha256(data).hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT/'hospital-three-pc/source-patch/asset-source-docs/dynamic-vfx-r84')
    args = parser.parse_args()
    source = args.source
    baseline = json.loads((HERE/'dynamic-source-baseline.json').read_text())
    checks = []
    def check(name, passed, detail=None):
        checks.append(dict(name=name, passed=bool(passed), **({} if detail is None else {'detail':detail})))
        if not passed:
            raise ValueError(name)
    report = dict(schema='r84-supplied-dynamic80-source-audit/v1', checks=checks,
                  method='Independent preserved-source SHA256, JSON/XML/code structure and restricted Node VM sampling plus real pinned Three CPU command replay. No browser/GPU, raster pixels, natural play or measured GPU memory.',
                  browserVerified=False, GPUVerified=False, naturalPlayVerified=False)
    try:
        check('Canonical user bundle has94 distinct paths including64 PNGs and30 nonPNG files',baseline['sourceFiles']==94 and len({r['path'] for r in baseline['files']})==94 and sum(r['path'].endswith('.png') for r in baseline['files'])==64)
        missing=[];changed=[];pngs=[]
        for row in baseline['files']:
            rel=Path(row['path'])
            if rel.suffix.lower()=='.png':
                actual=ROOT/'hospital-three-pc/site/assets/vfx-r83/selected'/rel.relative_to('assets')
                pngs.append(row)
            else:
                actual=source/rel
            if not actual.is_file():missing.append(row['path'])
            elif actual.stat().st_size!=row['bytes'] or SHA(actual.read_bytes())!=row['sha256']:changed.append(row['path'])
        check('All64 PNGs reuse exact current R83 bytes and30 supplied evidence files stay unchanged',not missing and not changed,dict(missing=missing,changed=changed,pngBytes=sum(r['bytes'] for r in pngs)))
        catalog=json.loads((source/'catalog.json').read_text())
        reused=[r for r in catalog if r.get('source')]
        new=[r for r in catalog if not r.get('source')]
        check('Catalog contains80 unique recipes with64 reused PNGs and16 new procedural motifs',len(catalog)==80 and len({r['id'] for r in catalog})==80 and len(reused)==64 and len(new)==16 and len({r['motif'] for r in new})==16)
        check('No provisional procedural motif invents a canonical region or boss assignment',all(r['origin']=='new-procedural' and all(r.get(k) is None for k in ['scene','sceneTitle','boss','zone']) and r.get('canonicalStatus')=='proposed-reusable-effect; not a verified story skill' for r in new))
        check('Every source recipe has bounded finite duration, unsigned seed and local hex accent',all(isinstance(r['duration'],(int,float)) and math.isfinite(r['duration']) and 0<r['duration']<=4 and isinstance(r['seed'],int) and 0<=r['seed']<=0xffffffff and re.fullmatch(r'#[0-9a-fA-F]{6}',r['color']) for r in catalog))
        bypath={r['path']:r for r in baseline['files']}
        check('Catalog PNG paths and SHA256 point only to exact supplied local assets',all(r['source'] in bypath and r['sourceSha256']==bypath[r['source']]['sha256'] and not Path(r['source']).is_absolute() and '..' not in Path(r['source']).parts for r in reused))
        provenance=json.loads((source/'provenance.json').read_text())
        check('Provenance ties both unmodified catalogs and all64 PNGs to exact hashes',provenance['catalog_sha256']==SHA((source/'catalog.json').read_bytes()) and provenance['catalog_js_sha256']==SHA((source/'catalog.js').read_bytes()) and len(provenance['source64'])==64 and all(r['output'] in bypath and r['output_sha256']==bypath[r['output']]['sha256'] and r['byte_identical'] for r in provenance['source64']))
        runtime=(source/'runtime.js').read_text()
        forbidden=re.findall(r'\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|requestAnimationFrame|setInterval|setTimeout|importScripts)\s*(?:\(|\.)',runtime)
        check('Supplied sampler/render core contains no network, timers, storage or dynamic-code calls',not forbidden,forbidden)
        methods=set(re.findall(r'ctx\.([A-Za-z_]+)',runtime))
        supported={'arc','beginPath','bezierCurveTo','canvas','closePath','drawImage','fill','fillStyle','globalAlpha','lineCap','lineJoin','lineTo','lineWidth','moveTo','restore','rotate','save','scale','stroke','strokeStyle','translate'}
        check('Original core drawing API is within current DrawCommands supported operations',methods<=supported and 'bezierCurveTo' in methods and 'drawImage' in methods,sorted(methods))
        preview=(source/'preview.js').read_text()
        check('Only the standalone preview owns a RAF/clear loop; it is not runtime logic','requestAnimationFrame(tick)' in preview and 'clearRect' in preview and 'requestAnimationFrame' not in runtime)
        vmanifest=json.loads((source/'vectors/vectors-manifest.json').read_text())
        check('Sixteen SVG alternatives match exact supplied vector manifest hashes',vmanifest['count']==16 and len(vmanifest['assets'])==16 and all(SHA((source/'vectors'/r['file']).read_bytes())==r['sha256'] for r in vmanifest['assets']))
        svg_results=[];unsafe=[];animation_total=0;signatures=set()
        for row in vmanifest['assets']:
            path=source/'vectors'/row['file'];text=path.read_text();tree=ET.fromstring(text);ids={e.attrib.get('id') for e in tree.iter() if e.attrib.get('id')}
            animations=[e for e in tree.iter() if e.tag.split('}')[-1] in ['animate','animateTransform','animateMotion']]
            if re.search(r'<!DOCTYPE|<!ENTITY',text,re.I):unsafe.append(row['file']+':entity')
            for e in tree.iter():
                tag=e.tag.split('}')[-1]
                if tag in ['script','foreignObject','image']:unsafe.append(row['file']+':'+tag)
                for key,value in e.attrib.items():
                    k=key.split('}')[-1]
                    if k.lower().startswith('on'):unsafe.append(row['file']+':event')
                    if k=='href' and not (value.startswith('#') and value[1:] in ids):unsafe.append(row['file']+':href')
                    for ref in re.findall(r'url\(([^)]+)\)',value):
                        if not(ref.startswith('#') and ref[1:] in ids):unsafe.append(row['file']+':url')
            geometry_tags={'path','line','circle','ellipse','rect','polygon','polyline'}
            geometry_attributes={'d','x','y','x1','y1','x2','y2','cx','cy','r','rx','ry','width','height','points','transform'}
            signature=[(e.tag.split('}')[-1],{k:v for k,v in e.attrib.items() if k in geometry_attributes}) for e in tree.iter() if e.tag.split('}')[-1] in geometry_tags]
            signatures.add(SHA(json.dumps(signature,sort_keys=True).encode()))
            animation_total+=len(animations);svg_results.append(dict(file=row['file'],animationNodes=len(animations),viewBox=tree.attrib.get('viewBox')))
            if len(animations)!=row['animation_count'] or tree.attrib.get('viewBox')!='0 0 512 512':unsafe.append(row['file']+':manifest')
        check('SVG alternatives contain no executable/external/raster payload and preserve local references',not unsafe,unsafe)
        check('All16 SVG motifs have distinct source geometry and252 declared animation nodes',len(signatures)==16 and animation_total==252 and len(svg_results)==16,dict(animations=animation_total,files=svg_results))
        readme=(source/'README-KO.txt').read_text()
        check('Source README keeps motion defaults and browser/GPU/game verification limits explicit','새로 그린 다중 프레임' in readme and '미검증' in readme and 'SVG는 같은16종' in readme and '보안 설정을 해제하지' in readme)
        result=subprocess.run(['node',str(HERE/'dynamic-source-runtime-check.cjs'),str(source)],capture_output=True,text=True,timeout=180)
        child=json.loads((HERE/'dynamic-source-runtime-results.json').read_text())
        checks.extend(child['checks'])
        report['runtimeSummary']={k:child[k] for k in ['samples','replays','maxPrimitives','method']}
        check('Independent supplied-runtime replay process completes successfully',result.returncode==0 and child.get('passed') is True,dict(exitCode=result.returncode,stderr=result.stderr[-1000:]))
        report['scopeNotes']=['SVG16 are alternate presentations of procedural16, not96 distinct effects.','Preview RAF/UI is preserved as source evidence and must not be loaded into the game.','Raw render() centers its own canvas at short-side0.35; game integration needs local coordinates and restrained scaling.','Projectile sampler adds designed flight motion; attached native projectiles must rebase center to avoid double movement.','Counter is impact; golden wall is stationary panel; cult04 stitching is actual revival only.']
    except Exception as error:
        report['failure']=str(error)
        if not checks or checks[-1]['passed']:
            checks.append(dict(name='Exception',passed=False,detail=str(error)))
    report['passed']=all(c['passed'] for c in checks) and 'failure' not in report
    (HERE/'dynamic-source-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(dict(passed=report['passed'],checks=len(checks),passedChecks=sum(c['passed'] for c in checks))))
    return 0 if report['passed'] else 1

if __name__=='__main__':
    raise SystemExit(main())

#!/usr/bin/env python3
"""R68: remove empty back/front passes for verified consistently-facing paths.

Apply after R67 only. Do not modify source archives, geometry, gameplay, texture
refresh, media, or resolution. Opposite-facing/unsupported geometry stays on the
original two-pass path. The decision is refreshed only when position data changes.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE_COMMIT = '41f6a0208eade036234eaca5cb1acf7224cd5b67'
BASE_HTML = '0c17a3a642967955aa143aff69d46289c946bdfddaa95a6eb295647d81c6117a'
# Actual published hash: Pages run 39039785619, deploy job 117417491594,
# R67_PUBLIC_RELEASE_VERIFIED. The earlier report's renderer hash was stale.
BASE_RENDERER = '1fea552262a3abb58befd8df79c9b1de01386d318ab738ae8842b36f9cdf907b'
def digest(data):
    return hashlib.sha256(data).hexdigest()
def replace_once(s, old, new):
    if s.count(old) != 1:
        raise RuntimeError('R68 source drift: '+old[:100])
    return s.replace(old, new, 1)
METHOD = r'''  configurePathPassR68(row,c){
    const material=row.mesh.material;
    if((c.kind!=='fill'&&c.kind!=='stroke')||!material.isMeshBasicMaterial)return;
    const geometry=row.mesh.geometry,position=geometry.getAttribute('position');
    let cache=row.pathPassR68;
    if(cache&&cache.position===position&&cache.version===position?.version&&cache.index===geometry.index)return;
    if(!cache)cache=row.pathPassR68={};
    cache.position=position;cache.version=position?.version;cache.index=geometry.index;
    this.stats.pathPassChecksR68=(this.stats.pathPassChecksR68||0)+1;
    // Original CommandScene paths are non-indexed, coplanar triangles. Verify
    // consistent facing in actual Float32 geometry rather than assume winding.
    // With one facing, the other pass draws nothing, even for overlapping paths.
    const a=position?.array;
    let safe=!!a&&!geometry.index&&position.itemSize===3&&a.length>=9&&a.length%9===0;
    let rx=0,ry=0,rz=0,r2=0,ox=0,oy=0,oz=0;
    if(safe)for(let i=0;i<a.length;i+=9){
      let finite=true;for(let j=0;j<9;j++)if(!Number.isFinite(a[i+j])){finite=false;break;}
      if(!finite){safe=false;break;}
      const ux=a[i+3]-a[i],uy=a[i+4]-a[i+1],uz=a[i+5]-a[i+2];
      const vx=a[i+6]-a[i],vy=a[i+7]-a[i+1],vz=a[i+8]-a[i+2];
      const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,n2=nx*nx+ny*ny+nz*nz;
      if(n2<1e-20)continue;
      if(!r2){rx=nx;ry=ny;rz=nz;r2=n2;ox=a[i];oy=a[i+1];oz=a[i+2];}
      else{const dot=nx*rx+ny*ry+nz*rz;if(dot<=0||dot*dot<.99999*n2*r2){safe=false;break;}}
      // Reject separated parallel surfaces as well as volumetric geometry.
      for(let j=0;j<9;j+=3){const d=(a[i+j]-ox)*rx+(a[i+j+1]-oy)*ry+(a[i+j+2]-oz)*rz;if(d*d>1e-8*r2){safe=false;break;}}
      if(!safe)break;
    }
    safe=safe&&r2>0;
    if(material.forceSinglePass!==safe){material.forceSinglePass=safe;material.needsUpdate=true;}
    material.userData.r68PlanarPathSinglePass=safe;
    cache.safe=safe;
  }
'''
def transform(source):
    if 'configurePathPassR68' in source:
        raise RuntimeError('R68 already applied')
    source=replace_once(source,'  applySpatialPolicy(row,c,firstBody){',METHOD+'  applySpatialPolicy(row,c,firstBody){')
    source=replace_once(source,'this.applySpatialPolicy(row,c,firstBody);seen.add(c.key);','this.applySpatialPolicy(row,c,firstBody);this.configurePathPassR68(row,c);seen.add(c.key);')
    return source

def main():
    p=argparse.ArgumentParser();p.add_argument('--site',type=Path,required=True);args=p.parse_args();site=args.site.resolve()
    if site==(ROOT/'docs').resolve():raise RuntimeError('Pinned build sources must remain untouched')
    html=(site/'index.html').read_bytes();js=(site/'dist/phase1.js').read_bytes()
    if digest(html)!=BASE_HTML or digest(js)!=BASE_RENDERER:
        raise RuntimeError('R68 requires exact published R67 HTML/renderer bytes')
    mp=site/'web-manifest-r62.json';manifest=json.loads(mp.read_text(encoding='utf-8'))
    if manifest.get('r68') or not manifest.get('r67',{}).get('flatUnlitSpritesSinglePass'):
        raise RuntimeError('Unexpected overlay lineage')
    next_html=replace_once(html.decode('utf-8'),'dist/phase1.js?r67=1','dist/phase1.js?r68=1').encode('utf-8')
    next_js=transform(js.decode('utf-8')).encode('utf-8')
    edits={'index.html':(html,next_html),'dist/phase1.js':(js,next_js)}
    for filename,(old,new) in edits.items():
        rows=[r for r in manifest['files'] if r['path']==filename]
        if len(rows)!=1 or rows[0]['sha256']!=digest(old) or rows[0]['bytes']!=len(old):
            raise RuntimeError('Input manifest mismatch: '+filename)
        rows[0].update(bytes=len(new),sha256=digest(new))
    manifest['webHTMLSha256']=digest(next_html);manifest['totalBytes']=sum(r['bytes'] for r in manifest['files'])
    manifest['r68']={'revision':'R68-PLANAR-PATH-PERF','baselineCommit':BASE_COMMIT,'consistentFacingPlanarPathsSinglePass':True,'decisionCacheInvalidatedByPositionVersion':True,'oppositeFacingFallbackPreserved':True,'simulationChanged':False,'mediaChanged':False,'resolutionChanged':False,'changedFiles':list(edits)}
    for name,(_,new) in edits.items():(site/name).write_bytes(new)
    mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('R68_OVERLAY_APPLIED',json.dumps({'htmlSHA256':digest(next_html),'rendererSHA256':digest(next_js),'files':len(manifest['files']),'simulationChanged':False,'mediaChanged':False}))
if __name__=='__main__':main()

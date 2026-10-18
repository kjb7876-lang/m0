#!/usr/bin/env python3
"""R70: retain compatible paint materials and update simple image buffers in place.
Only applies to the exact published R69 runtime. No gameplay or media edits.
"""
import argparse, hashlib, json
from pathlib import Path
BASE_HTML='da20c0570c9f67aab56484bafb7855f5c63b8257efedc2356b5381a7ab235182'
BASE_RENDERER='07bd84fd6af8b945637b83bd7b6af3e1341b5272339f8f77354061991a642176'
def digest(b): return hashlib.sha256(b).hexdigest()
def once(s,a,b):
    if s.count(a)!=1: raise RuntimeError('R70 source drift: '+a[:150])
    return s.replace(a,b,1)
METHODS=r'''  // All shader/blend/owner-type transitions still use the original replacement
  // path. Color/alpha and unused Canvas paint state are not shader definitions.
  updatePaintR70(row,c){
    const previous=row.styleState,m=row.mesh.material;
    if(!previous||previous.kind!==c.kind||row.image!==(c.kind==='image'?c.image:null)||row.geometryState?.owner.kind!==c.owner.kind||previous.propFrame!==(c.owner.kind==='prop'?c.owner.visualHospitalFrame:null))return false;
    const a=previous.style,b=c.style;
    if(a.globalCompositeOperation!==b.globalCompositeOperation||!['source-over','screen'].includes(b.globalCompositeOperation))return false;
    if(c.kind==='image'){
      // Lit hospital surfaces are intentionally excluded. Image filters are
      // updated by the existing filter-uniform path later in render().
      if(!m.isMeshBasicMaterial||!m.userData.filter)return false;
      row.styleState=styleState24(c);
      this.stats.imagePaintReuseR70=(this.stats.imagePaintReuseR70||0)+1;
      return true;
    }
    if(c.kind!=='fill'&&c.kind!=='stroke')return false;
    const key=c.kind==='stroke'?'strokeStyle':'fillStyle';
    if(typeof a[key]!=='string'||typeof b[key]!=='string'||!m.isMeshBasicMaterial||m.map)return false;
    const paint=cssColor(this.T,b[key]);
    m.color.copy(paint.color);m.userData.originalOpacity=paint.alpha;
    row.baseOpacity=paint.alpha;m.opacity=paint.alpha*b.globalAlpha;
    row.styleState=styleState24(c);
    this.stats.solidPaintReuseR70=(this.stats.solidPaintReuseR70||0)+1;
    return true;
  }
  // The unclipped six-vertex image quad has fixed topology. Do not construct a
  // disposable BufferGeometry/typed arrays merely to copy them into this one.
  updateImageGeometryR70(row,c){
    if(c.kind!=='image'||c.clips.length||c.points.length!==4)return false;
    const g=row.mesh.geometry,p=g.getAttribute('position'),uv=g.getAttribute('uv');
    if(g.index||Object.keys(g.attributes).length!==2||!p||!uv||p.itemSize!==3||uv.itemSize!==2||p.array.length!==18||uv.array.length!==12||!(p.array instanceof Float32Array)||!(uv.array instanceof Float32Array))return false;
    if(c.owner.kind==='prop'&&['gurney','wheelchair'].includes(c.owner.visualHospitalFrame))return false;
    const a=c.points[0],b=c.points[1],d=c.points[3],ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-a[0],vy=d[1]-a[1],det=ux*vy-uy*vx;
    const [sx,sy,sw,sh]=c.sourceRect,[iw,ih]=c.imageSize;
    let positionChanged=false,uvChanged=false;
    // Exact original triangle order [0,1,2],[0,2,3], including mirrored quads.
    for(let i=0;i<6;i++){
      const index=i<3?i:i===3?0:i===4?2:3,q=c.points[index],v=this.worldPoint(q,c.owner),at=i*3;
      const px=Math.fround(v.x),py=Math.fround(v.y),pz=Math.fround(v.z);
      if(p.array[at]!==px||p.array[at+1]!==py||p.array[at+2]!==pz){p.array[at]=px;p.array[at+1]=py;p.array[at+2]=pz;positionChanged=true;}
      let u=0,w=0;
      if(Math.abs(det)>=1e-9){const x=q[0]-a[0],y=q[1]-a[1],s=(x*vy-y*vx)/det,t=(ux*y-uy*x)/det;u=Math.fround((sx+s*sw)/iw);w=Math.fround(1-(sy+t*sh)/ih);}
      const j=i*2;if(uv.array[j]!==u||uv.array[j+1]!==w){uv.array[j]=u;uv.array[j+1]=w;uvChanged=true;}
    }
    if(positionChanged){p.needsUpdate=true;g.computeBoundingSphere();}
    if(uvChanged)uv.needsUpdate=true;
    this.stats.imageBufferReuseR70=(this.stats.imageBufferReuseR70||0)+1;
    if(!uvChanged)this.stats.unchangedUVUploadsSkippedR70=(this.stats.unchangedUVUploadsSkippedR70||0)+1;
    return true;
  }
'''
def transform(s):
    s=once(s,'  geometryChanged(row,c){',METHODS+'  geometryChanged(row,c){')
    old="      if(row&&row.image===(c.kind==='image'?c.image:null)&&!sameStyleKey24(row.styleState,c))this.updateGradientR69(row,c);"
    new="      if(row&&row.image===(c.kind==='image'?c.image:null)&&!sameStyleKey24(row.styleState,c)){if(!this.updatePaintR70(row,c))this.updateGradientR69(row,c);}"
    s=once(s,old,new)
    s=once(s,'          const geometry=this.geometry(c);if(!geometry){this.remove(c.key);continue;}','          if(!this.updateImageGeometryR70(row,c)){\n          const geometry=this.geometry(c);if(!geometry){this.remove(c.key);continue;}')
    s=once(s,'else{old.dispose();row.mesh.geometry=geometry;}\n          row.screenPositionBase=null;','else{old.dispose();row.mesh.geometry=geometry;}\n          }\n          row.screenPositionBase=null;')
    return s

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--site',type=Path,required=True);site=parser.parse_args().site.resolve()
    if site==Path('docs').resolve():raise RuntimeError('Do not modify the pinned original source tree')
    oldh=(site/'index.html').read_bytes();oldj=(site/'dist/phase1.js').read_bytes()
    if digest(oldh)!=BASE_HTML or digest(oldj)!=BASE_RENDERER:raise RuntimeError('R70 requires exact published R69 bytes')
    h=once(oldh.decode(),'dist/phase1.js?r69=1','dist/phase1.js?r70=1').encode();j=transform(oldj.decode()).encode()
    mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());edits={'index.html':(oldh,h),'dist/phase1.js':(oldj,j)}
    if not m.get('r69') or m.get('r70'):raise RuntimeError('Unexpected overlay lineage')
    for name,(old,new) in edits.items():
        rows=[r for r in m['files'] if r['path']==name]
        if len(rows)!=1 or rows[0]['sha256']!=digest(old) or rows[0]['bytes']!=len(old):raise RuntimeError('Manifest mismatch: '+name)
        rows[0].update(bytes=len(new),sha256=digest(new))
    m['webHTMLSha256']=digest(h);m['totalBytes']=sum(r['bytes'] for r in m['files']);m['r70']={'revision':'R70-RETAINED-PAINT-QUADS','baselineCommit':'94018c1143a96db13d4413ead9bde314db8574b3','compatibleSolidPaintReuse':True,'unlitImagePaintReuse':True,'unclippedImageBufferReuse':True,'unchangedUVUploadSkipped':True,'fallbackPreserved':True,'simulationChanged':False,'mediaChanged':False,'resolutionChanged':False}
    for name,(_,new) in edits.items():(site/name).write_bytes(new)
    mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    print('R70_OVERLAY_APPLIED',json.dumps({'htmlSHA256':digest(h),'rendererSHA256':digest(j),'files':len(m['files']),'simulationChanged':False,'mediaChanged':False}))
if __name__=='__main__':main()

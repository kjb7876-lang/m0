#!/usr/bin/env python3
"""Apply R69 to the exact published R68 build; no combat/media changes."""
import argparse,hashlib,json
from pathlib import Path
BASE_HTML='5d990d8c6d7b84a1de04fa18431f8696db0bda5e8e42e7ad3d76753e072e6206'
BASE_RENDERER='bfe84ba90aa5097a0e512403869e12e4799a3284fe5f839fbbe33f48f4daa8ea'
def digest(b):return hashlib.sha256(b).hexdigest()
def once(s,a,b):
    if s.count(a)!=1:raise RuntimeError('R69 source drift: '+a[:120])
    return s.replace(a,b,1)
CURVE=r'''  // Canvas-compatible cubic curves, flattened in screen space. This does not
  // suppress fallback: unsupported operations still use the original safeguard.
  bezierCurveTo(c1x,c1y,c2x,c2y,x,y){
    if(![c1x,c1y,c2x,c2y,x,y].every(Number.isFinite))return;
    if(!this.current)this.moveTo(c1x,c1y);
    else if(this.current.closed){this.current={points:[this.current.points[0].slice()],closed:false};this.paths.push(this.current);}
    const p=this.current.points.at(-1),a=this.point(c1x,c1y),b=this.point(c2x,c2y),q=this.point(x,y);
    const values=[a[0]-p[0],a[1]-p[1],b[0]-p[0],b[1]-p[1],q[0]-p[0],q[1]-p[1]];
    if(![...p,...values].every(Number.isFinite))return;
    const tolerance=.2/Math.max(1,this.dpr),key=values.join(',')+':'+tolerance;
    const cache=this.curveCacheR69??=new Map(),stats=this.curveStatsR69??={calls:0,builds:0,hits:0,segments:0};stats.calls++;
    let offsets=cache.get(key);
    if(offsets){stats.hits++;cache.delete(key);cache.set(key,offsets);}
    else{
      stats.builds++;offsets=[];const tol2=tolerance*tolerance;
      const distance2=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/den)):0;return(px-ax-t*dx)**2+(py-ay-t*dy)**2;};
      const split=(x0,y0,x1,y1,x2,y2,x3,y3,depth)=>{
        if(Math.max(distance2(x1,y1,x0,y0,x3,y3),distance2(x2,y2,x0,y0,x3,y3))<=tol2){offsets.push([x3,y3]);return;}
        if(depth>=12)throw Error('Cubic curve subdivision budget exceeded; Legacy required');
        const ax=(x0+x1)*.5,ay=(y0+y1)*.5,bx=(x1+x2)*.5,by=(y1+y2)*.5,cx=(x2+x3)*.5,cy=(y2+y3)*.5;
        const dx=(ax+bx)*.5,dy=(ay+by)*.5,ex=(bx+cx)*.5,ey=(by+cy)*.5,fx=(dx+ex)*.5,fy=(dy+ey)*.5;
        split(x0,y0,ax,ay,dx,dy,fx,fy,depth+1);split(fx,fy,ex,ey,cx,cy,x3,y3,depth+1);
      };
      split(0,0,...values,0);
      // At most 64*256 retained points; pathological curves are never cached.
      if(offsets.length<=256){if(cache.size>=64)cache.delete(cache.keys().next().value);cache.set(key,offsets);}
    }
    for(const v of offsets)this.current.points.push([p[0]+v[0],p[1]+v[1]]);
    // Preserve the exact transformed endpoint, not a rounded cache translation.
    this.current.points[this.current.points.length-1]=q;stats.segments+=offsets.length;
  }
'''
GRADIENT=r'''  // Gradient matrices/stops are uniforms, not new shader programs. Reuse only
  // when every other material/style condition is unchanged.
  updateGradientR69(row,c){
    const key=c.kind==='stroke'?'strokeStyle':'fillStyle',previous=row.styleState;
    if(c.kind==='image'||!previous||previous.kind!==c.kind||previous.propFrame!==(c.owner.kind==='prop'?c.owner.visualHospitalFrame:null)||!row.mesh.material.isShaderMaterial)return false;
    const old=previous.style?.[key],g=c.style[key];
    if(!old||!g||typeof old!=='object'||typeof g!=='object'||!['linear','radial'].includes(g.kind)||!['linear','radial'].includes(old.kind)||g.stops.length>12)return false;
    const ignore=k=>k==='globalAlpha'||k==='filter'||k===key;
    const a=previous.style,b=c.style;
    for(const k of Object.keys(a))if(!ignore(k)&&(!Object.prototype.hasOwnProperty.call(b,k)||!sameStructuredValue24(a[k],b[k])))return false;
    for(const k of Object.keys(b))if(!ignore(k)&&!Object.prototype.hasOwnProperty.call(a,k))return false;
    const [aa,bb,cc,dd,ee,ff]=g.matrix,det=aa*dd-bb*cc,args=g.args;
    if(Math.abs(det)<1e-10||(g.kind==='radial'&&(args[0]!==args[3]||args[1]!==args[4])))return false;
    const u=row.mesh.material.uniforms;if(!u.gradientInverse||!u.colors||!u.offsets)return false;
    u.gradientInverse.value.set(dd/det,-cc/det,(cc*ff-dd*ee)/det,-bb/det,aa/det,(bb*ee-aa*ff)/det,0,0,1);
    u.gradientArgs.value.set(args[0],args[1],args[2],g.kind==='radial'?args[5]:args[3]);u.radial.value=g.kind==='radial'?1:0;u.count.value=g.stops.length;
    for(let i=0;i<12;i++){
      const stop=g.stops[Math.min(i,g.stops.length-1)];
      if(stop){const color=cssColor(this.T,stop.color),rgb=color.color.convertLinearToSRGB();u.colors.value[i].set(rgb.r,rgb.g,rgb.b,color.alpha);u.offsets.value[i]=stop.offset;}
      else{u.colors.value[i].set(0,0,0,0);u.offsets.value[i]=0;}
    }
    row.styleState=styleState24(c);this.stats.gradientUniformUpdatesR69=(this.stats.gradientUniformUpdatesR69||0)+1;return true;
  }
'''
def transform(s):
    s=once(s,'  roundRect(x,y,w,h,r=0){',CURVE+'  roundRect(x,y,w,h,r=0){')
    s=once(s,'this.pool.clear();this.commands=[];}','this.pool.clear();this.curveCacheR69?.clear();this.commands=[];}')
    s=once(s,'  geometryChanged(row,c){',GRADIENT+'  geometryChanged(row,c){')
    s=once(s,'      let row=this.rows.get(c.key);','      let row=this.rows.get(c.key);\n      if(row&&row.image===(c.kind===\'image\'?c.image:null)&&!sameStyleKey24(row.styleState,c))this.updateGradientR69(row,c);')
    return s

def main():
    p=argparse.ArgumentParser();p.add_argument('--site',type=Path,required=True);site=p.parse_args().site.resolve()
    oldh=(site/'index.html').read_bytes();oldj=(site/'dist/phase1.js').read_bytes()
    if digest(oldh)!=BASE_HTML or digest(oldj)!=BASE_RENDERER:raise RuntimeError('R69 requires exact published R68 bytes')
    h=once(oldh.decode(),'dist/phase1.js?r68=1','dist/phase1.js?r69=1').encode();j=transform(oldj.decode()).encode()
    mp=site/'web-manifest-r62.json';m=json.loads(mp.read_text());edits={'index.html':(oldh,h),'dist/phase1.js':(oldj,j)}
    for name,(old,new) in edits.items():
        rows=[r for r in m['files'] if r['path']==name]
        if len(rows)!=1 or rows[0]['sha256']!=digest(old) or rows[0]['bytes']!=len(old):raise RuntimeError('Manifest mismatch: '+name)
        rows[0].update(bytes=len(new),sha256=digest(new))
    m['webHTMLSha256']=digest(h);m['totalBytes']=sum(r['bytes'] for r in m['files']);m['r69']={'revision':'R69-CURVE-STABILITY','baselineCommit':'9002bfd3d4cc536f799eee77caaad87467623ee9','cubicScreenErrorPixels':.2,'curveCacheEntries':64,'gradientUniformReuse':True,'existingR67LabelsPreserved':True,'fallbackPreserved':True,'simulationChanged':False,'mediaChanged':False,'resolutionChanged':False}
    for name,(_,new) in edits.items():(site/name).write_bytes(new)
    mp.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
    print('R69_OVERLAY_APPLIED',json.dumps({'htmlSHA256':digest(h),'rendererSHA256':digest(j),'files':len(m['files']),'simulationChanged':False,'mediaChanged':False}))
if __name__=='__main__':main()

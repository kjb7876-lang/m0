'use strict';
const fs=require('fs'),path=require('path');
const START='  /* R86_PATH_BUFFER_BEGIN */',END='  /* R86_PATH_BUFFER_END */';
const method=`${START}
  // Same native path triangulation and world projection. Retain typed arrays
  // only when the complete attribute topology matches. Clipping and topology
  // changes keep the original allocation/replacement path.
  updatePathGeometryR86(row,c){
    if(!['fill','stroke'].includes(c.kind)||c.clips.length)return false;
    const g=row.mesh.geometry,p=g.getAttribute('position'),uv=g.getAttribute('uv'),screen=g.getAttribute('screenPosition'),needsScreen=needsScreenPosition24(c);
    if(g.index||!p||!uv||p.itemSize!==3||uv.itemSize!==2||!!screen!==needsScreen||screen&&screen.itemSize!==2||Object.keys(g.attributes).length!==(needsScreen?3:2))return false;
    const float32=a=>Object.prototype.toString.call(a)==='[object Float32Array]';
    if(!float32(p.array)||!float32(uv.array)||screen&&!float32(screen.array))return false;
    let triangles;
    if(c.kind==='fill')triangles=pathTriangles(this.T,c.paths,c.rule);
    else{
      triangles=[];
      for(const path of c.paths){const points=path.points,n=path.closed?points.length:points.length-1;
        for(let i=0;i<n;i++){const a=points[i],b=points[(i+1)%points.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<1e-7)continue;
          const w=c.lineWidth/2,dx=-(b[1]-a[1])/d*w,dy=(b[0]-a[0])/d*w,q=[[a[0]+dx,a[1]+dy],[b[0]+dx,b[1]+dy],[b[0]-dx,b[1]-dy],[a[0]-dx,a[1]-dy]];
          triangles.push([q[0],q[1],q[2]],[q[0],q[2],q[3]]);
        }
      }
    }
    const count=triangles.length*3;
    if(!count||p.count!==count||uv.count!==count||screen&&screen.count!==count)return false;
    let i=0,positionChanged=false,screenChanged=false;
    for(const triangle of triangles)for(const q of triangle){const v=this.worldPoint(q,c.owner),at=i*3,j=i*2,x=Math.fround(v.x),y=Math.fround(v.y),z=Math.fround(v.z);
      if(p.array[at]!==x||p.array[at+1]!==y||p.array[at+2]!==z){p.array[at]=x;p.array[at+1]=y;p.array[at+2]=z;positionChanged=true;}
      if(screen){const sx=Math.fround(q[0]),sy=Math.fround(q[1]);if(screen.array[j]!==sx||screen.array[j+1]!==sy){screen.array[j]=sx;screen.array[j+1]=sy;screenChanged=true;}}
      i++;
    }
    if(positionChanged){p.needsUpdate=true;g.computeBoundingSphere();}
    if(screenChanged)screen.needsUpdate=true;
    this.stats.pathBufferReuseR86=(this.stats.pathBufferReuseR86||0)+1;
    this.stats.pathTypedArrayBytesAvoidedR86=(this.stats.pathTypedArrayBytesAvoidedR86||0)+p.array.byteLength+uv.array.byteLength+(screen?.array.byteLength||0);
    return true;
  }
${END}
`;
function patchRenderer(source){
 const a=source.indexOf(START),b=source.indexOf(END);
 if(a>=0){if(b<a)throw Error('Incomplete R86 buffer patch');source=source.slice(0,a)+method+source.slice(b+END.length+1);}
 else{const anchor='  geometryChanged(row,c){';if(source.split(anchor).length!==2)throw Error('Missing unique native geometry comparison');source=source.replace(anchor,method+anchor);}
 const old='if(!this.updateImageGeometryR70(row,c)){',next='if(!this.updateImageGeometryR70(row,c)&&!this.updatePathGeometryR86(row,c)){';
 if(!source.includes(next)){if(source.split(old).length!==2)throw Error('Missing unique native geometry update');source=source.replace(old,next);}
 return source;
}
module.exports={patchRenderer};
if(require.main===module){const target=path.resolve(process.argv[2]||path.join(__dirname,'../../hospital-three-pc/site/dist/phase1.js')),source=fs.readFileSync(target,'utf8'),next=patchRenderer(source);if(patchRenderer(next)!==next)throw Error('R86 performance patch is not idempotent');fs.writeFileSync(target,next);console.log(JSON.stringify({revision:'R86',path:target,stablePathBuffers:true,changed:source!==next}));}

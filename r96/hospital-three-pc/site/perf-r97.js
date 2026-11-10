'use strict';
/* R97 performance overlay. Presentation-only: no save, damage, collision or asset change.
   1) three.js draws every transparent DoubleSide mesh twice (back faces, then front faces) and
      flips material.needsUpdate on each pass, forcing a program re-resolve per object per pass.
      When every triangle of every mesh sharing the material faces the same way for the current
      camera, one of those passes draws nothing, so a single pass paints identical pixels.
      The check is exact and re-evaluated whenever geometry, transform or camera changes.
   2) Adaptive render scale, only while playing, only after sustained slow frames, and it
      reverts and locks itself off if lowering the resolution does not measurably help. */
(()=>{
 if(window.__STORYWORLD_PERF_R97__)return;
 const stats={managed:0,singlePass:0,twoPass:0,facingChecks:0,frameSinglePass:0,frameTwoPass:0,scale:1,scaleSteps:0,scaleReverted:0,scaleLocked:false,lastFrameMs:null};
 const facingCache=new WeakMap();
 const e=[0,0,0,0,0,0,0,0,0];
 function uniformFacing(mesh,dir,camKey){
  const g=mesh.geometry,p=g?.attributes?.position;if(!p)return false;const m=mesh.matrixWorld.elements,idx=g.index;
  const hit=facingCache.get(mesh);
  if(hit&&hit.geometry===g&&hit.pv===p.version&&hit.iv===(idx?idx.version:-1)&&hit.count===p.count&&hit.ds===g.drawRange.start&&hit.dc===g.drawRange.count&&hit.cam===camKey){let same=true;for(let i=0;i<16;i++)if(hit.m[i]!==m[i]){same=false;break;}if(same)return hit.value;}
  stats.facingChecks++;
  const start=Math.max(0,g.drawRange.start),total=idx?idx.count:p.count,end=Math.min(total,start+(Number.isFinite(g.drawRange.count)?g.drawRange.count:total));
  const vertex=(i,o)=>{const x=p.getX(i),y=p.getY(i),z=p.getZ(i);e[o]=m[0]*x+m[4]*y+m[8]*z;e[o+1]=m[1]*x+m[5]*y+m[9]*z;e[o+2]=m[2]*x+m[6]*y+m[10]*z;};
  let sign=0,value=true;
  for(let t=start;t+2<end;t+=3){
   vertex(idx?idx.getX(t):t,0);vertex(idx?idx.getX(t+1):t+1,3);vertex(idx?idx.getX(t+2):t+2,6);
   const ax=e[3]-e[0],ay=e[4]-e[1],az=e[5]-e[2],bx=e[6]-e[0],by=e[7]-e[1],bz=e[8]-e[2];
   const d=(ay*bz-az*by)*dir[0]+(az*bx-ax*bz)*dir[1]+(ax*by-ay*bx)*dir[2];
   if(Math.abs(d)<1e-12)continue;const s=d>0?1:-1;if(!sign)sign=s;else if(s!==sign){value=false;break;}
  }
  if(m[0]*(m[5]*m[10]-m[6]*m[9])-m[4]*(m[1]*m[10]-m[2]*m[9])+m[8]*(m[1]*m[6]-m[2]*m[5])===0)value=false;
  facingCache.set(mesh,{geometry:g,pv:p.version,iv:idx?idx.version:-1,count:p.count,ds:g.drawRange.start,dc:g.drawRange.count,cam:camKey,m:Float64Array.from(m),value});return value;
 }
 function singlePass(scene,camera){
  if(!camera?.isOrthographicCamera)return;camera.updateMatrixWorld();const c=camera.matrixWorld.elements,dir=[-c[8],-c[9],-c[10]],camKey=dir.map(v=>v.toFixed(6)).join(',');
  if(scene.matrixWorldAutoUpdate!==false)scene.updateMatrixWorld();const verdict=new Map();
  scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const list=Array.isArray(o.material)?o.material:[o.material];
   for(const mat of list){if(!mat||mat.side!==2||mat.transparent!==true)continue;
    if(!mat.userData.r97Managed){if(mat.forceSinglePass)continue;mat.userData.r97Managed=true;stats.managed++;}
    if(verdict.get(mat)===false)continue;verdict.set(mat,uniformFacing(o,dir,camKey));}});
  let one=0,two=0;for(const [mat,ok] of verdict){if(ok)one++;else two++;if(mat.forceSinglePass!==ok){mat.forceSinglePass=ok;if(ok)stats.singlePass++;else stats.twoPass++;}}
  stats.frameSinglePass=one;stats.frameTwoPass=two;
 }
 const STEPS=[1,.85,.72],intervals=[];let last=0,stepAt=0,before=null,enabled=true;
 function sample(stamp){
  const playing=typeof started!=='undefined'&&started&&!loading&&!modal&&!document.hidden;
  if(!playing||!last||stamp-last>1000){last=stamp;intervals.length=0;return;}
  intervals.push(stamp-last);last=stamp;if(intervals.length<90)return;
  const sorted=intervals.slice().sort((a,b)=>a-b),mid=sorted[sorted.length>>1];intervals.length=0;stats.lastFrameMs=+mid.toFixed(2);
  const index=STEPS.indexOf(stats.scale);
  if(before){if(mid>before*.9&&index>0){stats.scale=STEPS[index-1];stats.scaleReverted++;stats.scaleLocked=true;}before=null;return;}
  if(!enabled||stats.scaleLocked||stamp-stepAt<3000)return;
  if(mid>24&&index<STEPS.length-1){before=mid;stats.scale=STEPS[index+1];stats.scaleSteps++;stepAt=stamp;}
  else if(mid<15&&index>0){stats.scale=STEPS[index-1];stepAt=stamp;}
 }
 function install(){
  const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.r97Installed)return;r.r97Installed=true;
  const baseRender=r.render;
  r.render=function(frame){
   if(stats.scale!==1&&frame?.viewport){const cap=Math.min(frame.viewport.dpr,frame.settings?.lowFx?1:1.5);frame.viewport={...frame.viewport,dpr:cap*stats.scale};}
   const gl=this.renderer;if(gl&&!gl.r97Wrapped){gl.r97Wrapped=true;const glRender=gl.render;gl.render=function(scene,camera){if(scene===r.scene&&r.r97Pending){r.r97Pending=false;singlePass(scene,camera);}return glRender.call(this,scene,camera);};}
   this.r97Pending=true;
   return baseRender.call(this,frame);
  };
 }
 function loop(stamp){try{install();sample(stamp);}catch(error){}requestAnimationFrame(loop);}
 requestAnimationFrame(loop);
 window.__STORYWORLD_PERF_R97__=Object.freeze({inspect:()=>({...stats,adaptiveEnabled:enabled}),setAdaptive(v){enabled=!!v;if(!enabled){stats.scale=1;before=null;}}});
})();

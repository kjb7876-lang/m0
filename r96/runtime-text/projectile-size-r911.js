/* R911 projectile minimum size (사용자 2026-11-12 08:29Z):
   "모든 투사체 전수조사해서 최소 영웅크기의 절반크기는 되게".
   - 영웅·몹·보스 투사체는 drawProjectile 사슬 하나로 그려진다. 맨 바깥에서 감싸
     실제로 그려지는 몸통(불투명도 .45 이상 명령, 그림은 투명 여백을 뺀 실측)의
     화면 크기를 재고, 긴 변이 영웅 화면 키의 절반보다 작으면 몸통 중심을 기준으로
     그 순간만 ctx 를 키운다. 판정 반지름(b.radius)·속도·피해는 건드리지 않는다.
   - 재기는 그리기 명령을 받아 상자만 계산하는 가짜 ctx 로 한 번 더 그려서 한다
     (투사체마다 처음 한 번 + 0.33초마다). 실패하면 원래대로 그린다.
   - 영웅 키는 엔진 actorHeight()(=66×zoom). 끄기: localStorage storyworld.r911.projsize = off */
(function(){
  'use strict';
  if(window.__STORYWORLD_PROJ_SIZE_R911__)return;
  const KEY='storyworld.r911.projsize';
  const CFG={ratio:.5,bodyAlpha:.45,remeasure:.33,maxScale:6,pixelAlpha:40};
  let enabled=true;try{enabled=localStorage.getItem(KEY)!=='off';}catch{}
  const stats={draws:0,measured:0,scaled:0,errors:0,maxScale:1};const errs=[];

  // ---- matrix helpers (a,b,c,d,e,f) ----
  const I=()=>[1,0,0,1,0,0];
  const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const ap=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];

  // ---- opaque bounds of an image (or a sub-rect), normalised 0..1, cached ----
  const opaqueCache=new WeakMap();
  function opaqueRect(img,sx,sy,sw,sh){
    if(!img||typeof img!=='object')return null;
    let per=opaqueCache.get(img);if(!per){per=new Map();opaqueCache.set(img,per);}
    const key=sx+','+sy+','+sw+','+sh;if(per.has(key))return per.get(key);
    let out=null;
    try{
      const S=48,c=document.createElement('canvas');c.width=S;c.height=S;const g=c.getContext('2d',{willReadFrequently:true});
      g.drawImage(img,sx,sy,sw,sh,0,0,S,S);const d=g.getImageData(0,0,S,S).data;
      let x0=S,y0=S,x1=-1,y1=-1;
      for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(d[(y*S+x)*4+3]>CFG.pixelAlpha){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}
      out=x1<0?{x0:.5,y0:.5,x1:.5,y1:.5,empty:true}:{x0:x0/S,y0:y0/S,x1:(x1+1)/S,y1:(y1+1)/S};
    }catch{out=null;}
    per.set(key,out);return out;
  }
  function natural(img){return{w:img?.naturalWidth||img?.videoWidth||img?.width||0,h:img?.naturalHeight||img?.videoHeight||img?.height||0};}

  // ---- bounding-box recording context ----
  function makeProbe(dprValue){
    const st={m:I(),alpha:1,lw:1};const stack=[];let path=[];
    const body={x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity,n:0},all={x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity,n:0};
    function add(pts,pad=0){if(!pts.length)return;const a=st.alpha;const boxes=[all];if(a>=CFG.bodyAlpha)boxes.push(body);
      for(const box of boxes){box.n++;for(const [x,y] of pts){if(!Number.isFinite(x)||!Number.isFinite(y))continue;box.x0=Math.min(box.x0,x-pad);box.y0=Math.min(box.y0,y-pad);box.x1=Math.max(box.x1,x+pad);box.y1=Math.max(box.y1,y+pad);}}}
    function rectPts(x,y,w,h){return[ap(st.m,x,y),ap(st.m,x+w,y),ap(st.m,x,y+h),ap(st.m,x+w,y+h)];}
    function scaleOf(){return Math.sqrt(Math.abs(st.m[0]*st.m[3]-st.m[1]*st.m[2]))||1;}
    const real={
      save(){stack.push({m:st.m.slice(),alpha:st.alpha,lw:st.lw});},
      restore(){const s=stack.pop();if(s){st.m=s.m;st.alpha=s.alpha;st.lw=s.lw;}},
      translate(x,y){st.m=mul(st.m,[1,0,0,1,+x||0,+y||0]);},
      rotate(r){const c=Math.cos(r),s=Math.sin(r);st.m=mul(st.m,[c,s,-s,c,0,0]);},
      scale(x,y){st.m=mul(st.m,[+x,0,0,+(y??x),0,0]);},
      transform(a,b,c,d,e,f){st.m=mul(st.m,[a,b,c,d,e,f]);},
      setTransform(a,b,c,d,e,f){if(a&&typeof a==='object'){const M=a;a=M.a;b=M.b;c=M.c;d=M.d;e=M.e;f=M.f;}if(a===undefined){st.m=I();return;}const k=1/(dprValue||1);st.m=[a*k,b*k,c*k,d*k,e*k,f*k];},
      resetTransform(){st.m=I();},
      getTransform(){const m=st.m,k=dprValue||1;return (typeof DOMMatrix==='function')?new DOMMatrix([m[0]*k,m[1]*k,m[2]*k,m[3]*k,m[4]*k,m[5]*k]):{a:m[0]*k,b:m[1]*k,c:m[2]*k,d:m[3]*k,e:m[4]*k,f:m[5]*k};},
      beginPath(){path=[];},closePath(){},
      moveTo(x,y){path.push(ap(st.m,x,y));},lineTo(x,y){path.push(ap(st.m,x,y));},
      quadraticCurveTo(cx,cy,x,y){path.push(ap(st.m,cx,cy),ap(st.m,x,y));},
      bezierCurveTo(a,b,c,d,x,y){path.push(ap(st.m,a,b),ap(st.m,c,d),ap(st.m,x,y));},
      arcTo(x1,y1,x2,y2){path.push(ap(st.m,x1,y1),ap(st.m,x2,y2));},
      arc(x,y,r,s=0,e=Math.PI*2,ccw=false){this.ellipse(x,y,r,r,0,s,e,ccw);},
      ellipse(x,y,rx,ry,rot=0,s=0,e=Math.PI*2,ccw=false){rx=Math.abs(+rx||0);ry=Math.abs(+ry||0);let span=ccw?s-e:e-s;if(!Number.isFinite(span))span=Math.PI*2;if(Math.abs(span)>=Math.PI*2-1e-6)span=Math.PI*2;else span=((span%(Math.PI*2))+Math.PI*2)%(Math.PI*2);const dir=ccw?-1:1,cr=Math.cos(rot),sr=Math.sin(rot);for(let i=0;i<=16;i++){const t=s+dir*span*i/16,px=Math.cos(t)*rx,py=Math.sin(t)*ry;path.push(ap(st.m,x+px*cr-py*sr,y+px*sr+py*cr));}},
      rect(x,y,w,h){path.push(...rectPts(x,y,w,h));},
      roundRect(x,y,w,h){path.push(...rectPts(x,y,w,h));},
      fill(){add(path);},
      stroke(){add(path,st.lw*scaleOf()/2);},
      fillRect(x,y,w,h){add(rectPts(x,y,w,h));},
      strokeRect(x,y,w,h){add(rectPts(x,y,w,h),st.lw*scaleOf()/2);},
      clearRect(){},clip(){},fillText(){},strokeText(){},
      measureText(t){return{width:String(t||'').length*6,actualBoundingBoxAscent:8,actualBoundingBoxDescent:2};},
      drawImage(img,...a){let sx=0,sy=0,sw,sh,dx,dy,dw,dh;const n=natural(img);
        if(a.length>=8){[sx,sy,sw,sh,dx,dy,dw,dh]=a;}else if(a.length>=4){[dx,dy,dw,dh]=a;sw=n.w;sh=n.h;}else{[dx,dy]=a;sw=dw=n.w;sh=dh=n.h;}
        if(![dx,dy,dw,dh].every(Number.isFinite))return;
        const o=(sw>0&&sh>0)?opaqueRect(img,sx,sy,sw,sh):null;if(o?.empty)return;
        const r=o||{x0:0,y0:0,x1:1,y1:1};add(rectPts(dx+dw*r.x0,dy+dh*r.y0,dw*(r.x1-r.x0),dh*(r.y1-r.y0)));},
      createLinearGradient(){return{addColorStop(){}};},createRadialGradient(){return{addColorStop(){}};},createConicGradient(){return{addColorStop(){}};},createPattern(){return{setTransform(){}};},
      setLineDash(){},getLineDash(){return[];},isPointInPath(){return false;},isPointInStroke(){return false;},
      getImageData(x,y,w,h){return{width:w,height:h,data:new Uint8ClampedArray(Math.max(0,w*h*4))};},putImageData(){},createImageData(w,h){return{width:w,height:h,data:new Uint8ClampedArray(Math.max(0,w*h*4))};}
    };
    const props={canvas:(typeof ctx!=='undefined'?ctx?.canvas:null),fillStyle:'#000',strokeStyle:'#000',font:'10px sans-serif',filter:'none',globalCompositeOperation:'source-over',lineCap:'butt',lineJoin:'miter',textAlign:'start',textBaseline:'alphabetic',shadowBlur:0,shadowColor:'transparent',shadowOffsetX:0,shadowOffsetY:0,imageSmoothingEnabled:true,miterLimit:10,lineDashOffset:0};
    const probe=new Proxy(real,{
      get(t,k){if(k==='globalAlpha')return st.alpha;if(k==='lineWidth')return st.lw;if(k==='__r911probe')return true;if(k in t)return t[k];if(k in props)return props[k];return typeof k==='string'&&/^[a-z]/.test(k)?undefined:undefined;},
      set(t,k,v){if(k==='globalAlpha'){const n=+v;if(Number.isFinite(n)&&n>=0&&n<=1)st.alpha=n;return true;}if(k==='lineWidth'){const n=+v;if(Number.isFinite(n)&&n>0)st.lw=n;return true;}props[k]=v;return true;},
      has(t,k){return k in t||k in props||k==='globalAlpha'||k==='lineWidth';}
    });
    return {probe,result(){const pick=body.n?body:all;if(!pick.n||!Number.isFinite(pick.x0))return null;return{w:pick.x1-pick.x0,h:pick.y1-pick.y0,cx:(pick.x0+pick.x1)/2,cy:(pick.y0+pick.y1)/2,body:!!body.n,all:all.n?{w:all.x1-all.x0,h:all.y1-all.y0}:null};}};
  }


  // ---- 잔선 걷은 사본으로 주소 돌리기(scripts/r911-vfx-clean.py, r96/r911-vfx-clean.json). 원본·캐시 키·데이터 경로는 그대로. ----
  const CLEAN=new Set(["assets/vfx/heroes/gunner-e.webp", "assets/vfx/heroes/hwando-e.webp", "assets/vfx/heroes/lauren-q.webp", "assets/vfx/heroes/lauren-r.webp", "assets/vfx/heroes/neon-e.webp", "assets/vfx/heroes/seoha-e.webp", "assets/vfx/heroes/seoha-w.webp", "assets/vfx/heroes/slayer-r.webp", "assets/vfx/generated/v300/barrier-sigil.webp", "assets/vfx/generated/v300/time-ring.webp"]);const DERIVED=new Map([['assets/vfx/heroes/gunner-laser-bullet.webp','assets/r911/derived/gunner-laser-bullet.webp']]);const CLEAN_KEY='storyworld.r911.vfxclean';let cleanOn=true;try{cleanOn=localStorage.getItem(CLEAN_KEY)!=='off';}catch{}
  const PRE=/^(?:\.\/)?(?:assets\/r425\/clean\/|assets\/r99\/clean\/)?/;
  if(typeof urlFor==='function'&&!urlFor.__r911){const ub=urlFor;const uw=function(p,...a){try{if(cleanOn&&typeof p==='string'){const q=p.replace(PRE,'');if(CLEAN.has(q)){stats.redirected=(stats.redirected||0)+1;return ub.call(this,'assets/r911/clean/'+q,...a);}if(DERIVED.has(q)){stats.replaced=(stats.replaced||0)+1;return ub.call(this,DERIVED.get(q),...a);}}}catch{}return ub.call(this,p,...a);};uw.__r911=true;urlFor=uw;}
  function heroPx(){try{const h=typeof actorHeight==='function'?actorHeight():66*(typeof zoom==='number'?zoom:1);return Number.isFinite(h)&&h>0?h:66;}catch{return 66;}}
  function minPx(){return heroPx()*CFG.ratio;}
  function scaleFor(size,min=minPx()){if(!Number.isFinite(size)||size<=0||!Number.isFinite(min)||min<=0)return 1;if(size>=min)return 1;return Math.min(CFG.maxScale,min/size);}

  const state=new WeakMap();
  let inside=false,busy=0;
  function measureWith(base,self,args){
    const p=args[0];const saved=ctx;const pr=makeProbe(typeof dpr==='number'?dpr:1);
    inside=true;ctx=pr.probe;
    try{base.apply(self,args);}catch(e){stats.errors++;const msg=String(e&&e.stack||e).slice(0,300);if(errs.length<8&&!errs.includes(msg))errs.push(msg);}finally{ctx=saved;inside=false;}
    const r=pr.result();if(!r)return null;
    let q=null;try{q=project(p.x,p.y);}catch{}
    return{w:r.w,h:r.h,size:Math.max(r.w,r.h),ox:q?r.cx-q.x:0,oy:q?r.cy-q.y:0,body:r.body,all:r.all};
  }
  function measure(p){if(typeof drawProjectile!=='function'||!p)return null;return measureWith(baseRef||drawProjectile,null,[p]);}

  // 맘몬의 금고(ep1b06)는 Codex 작업 구역이라 손대지 않는다(사용자 상시 규칙).
  const SKIP_ZONES=new Set(['ep1b06']);function skipZone(){try{return typeof zone==='string'&&SKIP_ZONES.has(zone);}catch{return false;}}
  let baseRef=null;
  function install(){
    if(typeof drawProjectile!=='function'||drawProjectile.__r911)return false;
    const base=drawProjectile;baseRef=base;
    const wrapped=function(p,...rest){
      if(!p||typeof p!=='object')return;
      if(inside||busy||!enabled||ctx?.__r911probe||skipZone())return base.apply(this,[p,...rest]);
      stats.draws++;
      let s=state.get(p);const now=typeof time==='number'?time:0;
      if(!s||now-s.at>=CFG.remeasure||now<s.at){const m=measureWith(base,this,[p,...rest]);stats.measured++;s={at:now,m};state.set(p,s);}
      const m=s.m;const k=m?scaleFor(m.size):1;
      busy++;try{
      if(k<=1.001)return base.apply(this,[p,...rest]);
      let q;try{q=project(p.x,p.y);}catch{return base.apply(this,[p,...rest]);}
      const cx=q.x+m.ox,cy=q.y+m.oy;
      stats.scaled++;if(k>stats.maxScale)stats.maxScale=k;
      ctx.save();
      try{ctx.translate(cx,cy);ctx.scale(k,k);ctx.translate(-cx,-cy);return base.apply(this,[p,...rest]);}
      finally{ctx.restore();}
      }finally{busy--;}
    };
    wrapped.__r911=true;wrapped.__r911base=base;drawProjectile=wrapped;return true;
  }
  // 다른 덧씌우기가 나중에 drawProjectile 을 다시 감싸도 맨 바깥에 서도록 첫 몇 초 동안 다시 확인한다.
  function ensure(){try{if(typeof drawProjectile==='function'&&!drawProjectile.__r911)install();}catch{}}
  ensure();let tries=0;const iv=setInterval(()=>{ensure();if(++tries>40)clearInterval(iv);},250);

  window.__STORYWORLD_PROJ_SIZE_R911__={
    revision:'R911-PROJECTILE-MIN-HALF-HERO',config:CFG,stats,errors:()=>errs.slice(),cleanPaths:()=>[...CLEAN],
    get enabled(){return enabled;},
    setEnabled(v){enabled=!!v;try{localStorage.setItem(KEY,enabled?'on':'off');}catch{}return enabled;},
    heroPx,minPx,scaleFor,measure,makeProbe,ensure,
    inspect(p){const s=state.get(p);return s?{...s.m,scale:s.m?scaleFor(s.m.size):1}:null;}
  };
})();

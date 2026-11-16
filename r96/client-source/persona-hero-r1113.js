/* R1113 페르소나 영웅 해금(사용자 2026-11-16 10:43Z "페르소나보스 잡으면 페르소나영웅나오는거 적용해줘").
 *  · 해금: 사몽 결전 페르소나 '순수악의'를 쓰러뜨리면(room.persona.completed — 엔진이 결전 끝에 세움) 한 번 알림과 함께 영웅 선택창 9번째 칸(맨 끝)에 '페르소나'가 생긴다.
 *    저장(localStorage storyworld.r1113.personaHero). 777 시험 중에도 보인다(EGO R1046 과 같은 규칙).
 *  · 몸·조작: 페르소나는 라우렌의 별 기술을 거울처럼 쓰는 보스(R1096)이므로 영웅으로서는 라우렌의 기술·키를 그대로 쓰고(스킬 키를 늘리지 않음),
 *    그림만 페르소나로 바꾼다 — EGO(환도 위 형상)와 같은 '형상' 방식. player.personaHeroR1113(저장됨), 라우렌일 때만 켜지고 다른 영웅으로 바꾸면 꺼진다.
 *  · 전장 몸 그림: 서 있을 때·공격할 때 rc133 페르소나 방향 그림(정면·왼·뒤·오른, 궁극기 동안 각성형), 걸을 때 Dots CX-0120PW 걷기 3방향 시트(R1104b 와 같은 webp,
 *    걷는 화면 방향으로 고르고 오른쪽은 뒤집기, 지나간 거리로 칸 넘김). 발은 몸 위치 project(x,y) 에, 키는 영웅 키(actorHeight)에 맞춘다.
 *  · 고유색 언주(사용자 11-16 02:36Z): 이 형상일 때 영웅 쪽 이펙트(라우렌 보라)를 R1096 과 같은 색 돌리기로 언주 붉은빛으로 바꾼다.
 *  · Dots 영웅 시트(CX-0108PH/CX-0109CS)가 오면 그림만 바꾼다. 판정·피해·쿨다운·저장 구조는 라우렌 그대로.
 * 끄기: localStorage storyworld.r1113.personaHero = {"on":..., "off":true}. */
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_PERSONA_HERO_R1113__)return;
const REV='R1113-persona-hero-4-idle6',KEY='storyworld.r1113.personaHero',FIELD='personaHeroR1113',BASE='lauren';
const PROFILE=Object.freeze({name:'페르소나',title:'페르소나 · 순수악의',role:'HIDDEN · 9번째 영웅',color:'#cc3428',
 passive:'사몽 결전에서 쓰러뜨린 거울. 라우렌의 별 기술을 언주빛으로 되비춥니다.',special:'라우렌과 같은 기술·키',
 portrait:'assets/rc133/art/awake-0.png',tags:['히든','언주','라우렌 계보']});
const TINT='hue-rotate(100deg) saturate(1.5) brightness(.78) contrast(1.15)'; // R1096 라우렌→언주 색 돌리기와 같은 방향(보라 164,98,255 → 붉은 언주)
const ART=Object.freeze({base:i=>'assets/rc133/art/base-'+i+'.png',awake:i=>'assets/rc133/art/awake-'+i+'.png',w:344,h:400,ax:172,ground:385,height:357});
const DIRI=Object.freeze({front:0,left:2,back:4,right:6});
const CELL=512,FRAMES=8;
const WALK=Object.freeze({front:Object.freeze({src:'assets/r1104b/persona-walk-front.webp',ax:256,ground:476,h:424,step:.65}),
 rear:Object.freeze({src:'assets/r1104b/persona-walk-rear.webp',ax:256,ground:477,h:424,step:.65}),
 side:Object.freeze({src:'assets/r1104b/persona-walk-side.webp',ax:266,ground:476,h:424,step:.7})});
// 대기 6칸(Dots CX-0122PH r1, 사용자 11-16 21:46 KST "대기모션좋네, 클로드 개선적용"): 칸 192×256, 발 (96,226), 몸 키 157, 130ms/칸. 옆은 오른쪽 보기 → 왼쪽은 반전.
// 걷기(512×512)와 따로 읽는다. 시트가 아직 안 읽혔으면 rc133 정지 그림.
const IDLE=Object.freeze({s:Object.freeze({src:'assets/r1113d/persona-idle-s.png',ax:96,ground:226,h:157,n:6,cell:[192,256]}),
 n:Object.freeze({src:'assets/r1113d/persona-idle-n.png',ax:96,ground:226,h:157,n:6,cell:[192,256]}),
 side:Object.freeze({src:'assets/r1113d/persona-idle-side.png',ax:96,ground:226,h:157,n:6,cell:[192,256]})});
const IDLE_MS=130,IDLE_DIR={front:['s',1],back:['n',1],right:['side',1],left:['side',-1]};
const SCALE=1.08; // 영웅 키(actorHeight) 대비 페르소나 몸 키 — 망토·두건 때문에 조금 크게
const stats={swaps:0,walkSwaps:0,tints:0,unlocks:0,cards:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=(f,d)=>{try{return f();}catch(_){return d;}};
const fin=Number.isFinite;
const pl=()=>G(()=>typeof player!=='undefined'?player:null,null);
const now=()=>G(()=>typeof time==='number'&&fin(time)?time:null,null);
let saved={on:false,off:false};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object')saved={on:v.on===true,off:v.off===true};}catch(_){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(saved));}catch(_){}};
const cheat=()=>G(()=>!!window.__STORYWORLD_CHEAT777__?.active?.(),false);
function unlocked(){return !saved.off&&(saved.on||cheat());}
let notice=false;
function unlock(reason='api'){if(saved.on)return true;saved.on=true;persist();notice=reason!=='silent';stats.unlocks++;stats.unlockReason=String(reason).slice(0,40);return true;}
function formActive(){const p=pl();return !!(p&&p[FIELD]===true&&p.hero===BASE&&!saved.off);}
function setForm(v){const p=pl();if(!p)return false;if(v&&(!unlocked()||p.hero!==BASE)){p[FIELD]=false;return false;}p[FIELD]=!!v;return !!v;}
// ---- 해금 감시: 결전이 끝나면(엔진 room.persona.completed) ----
function watch(){try{const r=G(()=>typeof room!=='undefined'?room:null,null);if(!saved.on&&r&&r.persona&&(r.persona.completed===true||r.persona.phase==='complete'))unlock('persona-defeated');
 // 영웅창 777(R1057 비밀 입력·모바일 제목 7연타)이 발동하면 EGO 와 함께 페르소나도 해금(사용자 11-16: EGO 까지 10명)
 if(!saved.on&&G(()=>!!document.getElementById('panel')?.classList?.contains('r1057secret'),false))unlock('secret-777');
 const p=pl();if(p&&p[FIELD]===true&&(p.hero!==BASE||!unlocked()))p[FIELD]=false;
 if(notice&&!G(()=>loading||storyScene||modal,true)){notice=false;try{if(typeof toast==='function')toast('히든 영웅 해금 · '+PROFILE.title+' — 영웅 선택창 9번째 칸에서 고를 수 있습니다.',5);}catch(e){fail(e);}}}catch(e){fail(e);}}
// ---- 그림 읽기(캔버스로) ----
const hasDom=()=>G(()=>typeof document!=='undefined'&&!!document&&typeof document.createElement==='function'&&typeof Image==='function',false);
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const abs=u=>G(()=>new URL(u,document.baseURI||window.location?.href).href,u);
const IM=new Map(); // path → {state, frames:[{canvas,w,h,path}]}
function load(path,cells,cell){let r=IM.get(path);if(r)return r;r={state:'wait',frames:null};IM.set(path,r);if(!hasDom()){r.state='failed';return r;}
 try{const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
  img.onload=()=>{try{const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,n=cells||1,cw=cells?(cell?.[0]||CELL):W,ch=cells?(cell?.[1]||CELL):H,out=[];
    for(let f=0;f<n;f++){const cv=canvas(cw,ch);cv.getContext('2d').drawImage(img,f*cw,0,cw,ch,0,0,cw,ch);const id='r1113:'+path+(cells?':'+f:'');cv.__storyworldStaticSource={path:id};out.push({canvas:cv,w:cw,h:ch,path:id});}
    r.frames=out;r.state='ready';}catch(e){r.state='failed';fail(e);}};
  img.onerror=()=>{r.state='failed';};img.src=abs(path);}catch(e){r.state='failed';fail(e);}return r;}
function prewarm(){for(const i of [0,2,4,6]){load(ART.base(i));load(ART.awake(i));}for(const k in WALK)load(WALK[k].src,FRAMES);for(const k in IDLE)load(IDLE[k].src,IDLE[k].n,IDLE[k].cell);}
// ---- 걸음(지나간 거리) ----
const walk={x:null,y:null,t:null,phase:0,w:0,scr:[0,1],hist:[]};
function track(p,t){if(walk.t==null||t<walk.t||t-walk.t>1){walk.hist.length=0;walk.w=0;}
 const dt=walk.t==null?0:t-walk.t;walk.t=t;walk.hist.push({t,x:p.x,y:p.y});while(walk.hist.length>2&&t-walk.hist[0].t>.25)walk.hist.shift();
 const a=walk.hist[0],span=t-a.t,dx=p.x-a.x,dy=p.y-a.y,v=span>.08?Math.hypot(dx,dy)/span:0,moving=v>.4;
 walk.w+=((moving?1:0)-walk.w)*Math.min(1,dt*9);
 if(moving){const X=dx-dy,Y=(dx+dy)*.5,L=Math.hypot(X,Y)||1;walk.scr=[X/L,Y/L];walk.phase+=v*dt;}
 return walk;}
function pickWalk(){const v=walk.scr;if(Math.abs(v[0])>=Math.abs(v[1]))return ['side',v[0]>0?-1:1];return [v[1]>0?'front':'rear',1];}
// ---- 몸 그림 바꿔 끼우기 ----
const okPt=q=>Array.isArray(q)&&fin(q[0])&&fin(q[1]);
function heroBody(cmds){let best=-1,bh=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.r1113)continue;const o=c.owner;if(!o||o.kind!=='hero')continue;
  const P=c.points;if(!Array.isArray(P)||P.length!==4||!P.every(okPt))continue;const h=Math.abs(P[3][1]-P[0][1]);if(h>bh){bh=h;best=i;}}return best;}
function place(c,fr,anchor,m,foot,H){ // fr 의 (anchor.ax, anchor.ground) 를 foot 에, anchor.h 를 H 에 맞춰 화면에 바로 선 사각형으로
 const k=H/anchor.h,X=u=>foot[0]+m*(u-anchor.ax)*k,Y=v=>foot[1]+(v-anchor.ground)*k,W=fr.w,Hh=fr.h;
 const pts=[[X(0),Y(0)],[X(W),Y(0)],[X(W),Y(Hh)],[X(0),Y(Hh)]];if(!pts.every(okPt))return false;
 c.image=fr.canvas;c.mutable=false;c.sourcePath=fr.path;c.immutableTint=fr.canvas.__storyworldStaticSource;c.sourceRect=[0,0,W,Hh];c.imageSize=[W,Hh];c.points=pts;c.r1113=true;return true;}
// 공격·스킬(사용자 11-16): 새 시트 대신 걷기 칸을 얼굴 방향으로 돌리고, 손의 빨간 구슬 빛 + 몸 뒤 약한 오라(언주 명암)
// 구슬 자리: 시트 칸마다 빨간 구슬 둘레 상자 가운데(build: 언주 빨강 픽셀). 뒷모습은 몸에 가려 같은 손 반대편(330,196) 뒤쪽 빛만.
const ORB=Object.freeze({front:[[182,196],[182,195],[182,194],[182,196],[182,196],[184,194],[181,209],[183,196]],side:[[201,188],[201,188],[200,188],[200,188],[200,188],[200,188],[200,188],[200,188]],rear:Array.from({length:8},()=>[330,196])});
const ORB_R=34,ACT_FPS=10,EONJU=[[70,14,10],[204,52,40],[255,176,140]];
const SIDE={front:['front',1],back:['rear',1],left:['side',1],right:['side',-1]};
let glowCv=null,auraCv=null;
function grad(stops){const c=canvas(64,64),x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);for(const [o,col] of stops)g.addColorStop(o,col);x.fillStyle=g;x.fillRect(0,0,64,64);return c;}
function glows(){if(glowCv&&auraCv)return true;if(!hasDom())return false;const [d,m,l]=EONJU.map(v=>v.join(','));
 glowCv=grad([[0,'rgba(255,236,224,1)'],[.18,'rgba('+l+',.95)'],[.45,'rgba('+m+',.6)'],[.75,'rgba('+d+',.22)'],[1,'rgba('+d+',0)']]);glowCv.__storyworldStaticSource={path:'r1113:glow:orb'};
 auraCv=grad([[0,'rgba('+m+',.55)'],[.55,'rgba('+m+',.28)'],[.85,'rgba('+d+',.1)'],[1,'rgba('+d+',0)']]);auraCv.__storyworldStaticSource={path:'r1113:glow:aura'};return true;}
function fxCmd(body,id,cv,cx,cy,rx,ry,alpha){const pts=[[cx-rx,cy-ry],[cx+rx,cy-ry],[cx+rx,cy+ry],[cx-rx,cy+ry]];if(!pts.every(okPt)||!(alpha>0))return null;
 const ord=fin(body.order)?body.order+(id==='r1113:aura'?-.5:.5):body.order;
 return {...body,key:id+':0',order:ord,kind:'image',owner:{id,kind:'effect'},image:cv,mutable:false,sourcePath:cv.__storyworldStaticSource.path,immutableTint:cv.__storyworldStaticSource,sourceRect:[0,0,64,64],imageSize:[64,64],points:pts,
  style:{...(body.style&&typeof body.style==='object'?body.style:{}),filter:'none',globalAlpha:Math.min(1,alpha),globalCompositeOperation:'lighter'},r1113:true,r1113tint:true};}
function swapBody(cmds){const i=heroBody(cmds);if(i<0)return null;const c=cmds[i],p=pl(),t=now();if(!p||t==null||typeof project!=='function')return null;
 const g=project(p.x,p.y);if(!fin(g?.x)||!fin(g?.y))return null;const lift=Math.max(0,Math.min(200,+p.visualLiftPx||0)),foot=[g.x,g.y-lift],H=G(()=>actorHeight(),66)*SCALE;if(!(H>0))return null;
 const s=track(p,t),ult=p.ultimateAnim>0,act=!ult&&(p.attackAnim>0||p.skillAnim>0);
 if(s.w>.5&&!act&&!ult){const [k,m]=pickWalk(),W=WALK[k],r=IM.get(W.src);if(r?.state==='ready'){const f=Math.floor(s.phase/W.step*4)%FRAMES;if(place(c,r.frames[f],W,m,foot,H)){stats.walkSwaps++;stats.last=k+':'+f+(m<0?':flip':'');return {i,c,mode:'walk'};}}}
 const dir=String(p.poseDirections5?.[ult?'ultimate':p.skillAnim>0?'skill':p.attackAnim>0?'attack':'']||p.direction||'front');
 if(act){const [k,m]=SIDE[dir]||SIDE.front,W=WALK[k],r=IM.get(W.src);if(r?.state==='ready'){const f=Math.floor(t*ACT_FPS)%FRAMES;if(place(c,r.frames[f],W,m,foot,H)){stats.actSwaps=(stats.actSwaps||0)+1;stats.last='act:'+k+':'+f+(m<0?':flip':'');
   return {i,c,mode:'act',k,f,m,W,foot,H,t,skill:p.skillAnim>0};}}}
 if(!ult){const [k,m]=IDLE_DIR[dir]||IDLE_DIR.front,S=IDLE[k],r=IM.get(S.src);if(r?.state==='ready'&&r.frames?.length){const f=Math.floor(t*1000/IDLE_MS)%r.frames.length;if(place(c,r.frames[f],S,m,foot,H)){stats.idleSwaps=(stats.idleSwaps||0)+1;stats.last='idle:'+k+':'+f+(m<0?':flip':'');return {i,c,mode:'idle',foot,H,t};}}}
 const idx=DIRI[dir]??0,path=(ult?ART.awake:ART.base)(idx),r=IM.get(path);if(r?.state!=='ready')return null;
 if(place(c,r.frames[0],{ax:ART.ax,ground:ART.ground,h:ART.height},1,foot,H)){stats.swaps++;stats.last=path;return {i,c,mode:ult?'ult':'still',foot,H,t};}return null;}
function addGlow(cmds,sw){if(!sw||(sw.mode!=='act'&&sw.mode!=='ult')||!glows())return 0;const body=sw.c,t=sw.t,pulse=.5+.5*Math.sin(t*17);let n=0;
 // 몸 뒤 오라: 몸 가운데, 몸 키의 약 0.55·0.9 타원
 const k=sw.H/(sw.W?.h||ART.height),bodyH=sw.H,cx=sw.foot[0],cy=sw.foot[1]-bodyH*.48;
 const aura=fxCmd(body,'r1113:aura',auraCv,cx,cy,bodyH*.36,bodyH*.56,(sw.mode==='ult'?.55:sw.skill?.42:.32)+.08*Math.sin(t*9));
 const bi=cmds.indexOf(body);if(aura&&bi>=0){cmds.splice(bi,0,aura);n++;}
 if(sw.mode==='act'){const O=ORB[sw.k]?.[sw.f];if(O){const ox=sw.foot[0]+sw.m*(O[0]-sw.W.ax)*k,oy=sw.foot[1]+(O[1]-sw.W.ground)*k,R=ORB_R*k*(.9+.25*pulse);
   const orb=fxCmd(body,'r1113:orb',glowCv,ox,oy,R,R,(sw.k==='rear'?.45:.75)+.25*pulse);const j=cmds.indexOf(body);if(orb&&j>=0){cmds.splice(j+1,0,orb);n++;}}}
 stats.glows=(stats.glows||0)+n;return n;}
// ---- 언주색: 영웅 쪽 이펙트 ----
// 라우렌 고유 보라(164,98,255 · 120,50,200 · 214,170,255)로 구운 r106fx 는 꼬리표가 없어도 영웅 것
const LAUREN_FX=/^r106fx:[a-z]+:(164\.98\.255|120\.50\.200|214\.170\.255):/;
function heroFx(o,c){if(!o||o.kind==='hero'||o.kind==='enemy'||o.kind==='contact'||o.kind==='shadow')return false;if(o.pxfSide==='hero'||o.side==='hero')return true;if(o.pxfSide==='enemy'||o.side==='enemy')return false;const id=String(o.id||'');
 if(/(^|:)hero(:|$)/.test(id)||/^r102:/.test(id))return true;return o.kind==='effect'&&LAUREN_FX.test(String(c?.sourcePath||''));}
function tint(cmds){let n=0;for(const c of cmds){if(!c||c.kind!=='image'||c.r1113tint)continue;if(!heroFx(c.owner,c))continue;const s=c.style&&typeof c.style==='object'?c.style:{};
  const f=typeof s.filter==='string'&&s.filter!=='none'?s.filter+' ':'';c.style={...s,filter:f+TINT};c.r1113tint=true;n++;}stats.tints+=n;return n;}
// 페르소나는 창이 없다 → 라우렌 창끝 빛(R425)은 형상일 때 뺀다
const DROP=/^r425:spear-tip$/;
function drop(cmds){let j=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(c&&c.owner&&DROP.test(String(c.owner.id||'')))continue;cmds[j++]=c;}const n=cmds.length-j;cmds.length=j;stats.dropped=(stats.dropped||0)+n;return n;}
function process(cmds){if(!Array.isArray(cmds))return 0;if(!formActive())return 0;prewarm();let n=0;try{drop(cmds);}catch(e){fail(e);}try{const sw=swapBody(cmds);if(sw){n++;n+=addGlow(cmds,sw);}}catch(e){fail(e);}try{n+=tint(cmds);}catch(e){fail(e);}return n;}
// ---- 렌더러 감싸기(prototype·인스턴스, 한 render 에 한 번) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r1113)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1113=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
// ---- 저장 ----
function wrapSave(){
 if(typeof serializeSave==='function'&&!serializeSave.__r1113){const base=serializeSave;const w=function(...a){const d=base.apply(this,a);try{if(d&&d.player)d.player[FIELD]=formActive();}catch(e){fail(e);}return d;};w.__r1113=true;serializeSave=w;}
 if(typeof restoreSave==='function'&&!restoreSave.__r1113){const base=restoreSave;const w=async function(raw,...a){const r=await base.call(this,raw,...a);try{const p=pl();if(p)p[FIELD]=raw?.player?.[FIELD]===true&&p.hero===BASE&&unlocked();}catch(e){fail(e);}return r;};w.__r1113=true;restoreSave=w;}}
function wrapTick(){if(typeof tick!=='function'||tick.__r1113)return;const base=tick;const w=function(...a){const r=base.apply(this,a);try{watch();if(formActive()&&hasDoc())hudName();}catch(e){fail(e);}return r;};w.__r1113=true;tick=w;}
// ---- 영웅 선택창: 9번째 칸 ----
const hasDoc=()=>G(()=>typeof document!=='undefined'&&!!document&&typeof document.querySelector==='function',false);
const url=p=>G(()=>urlFor(p),p);
let want=false,commit=null,synthetic=false;
function css(){if(document.getElementById('r1113Css'))return;const s=document.createElement('style');s.id='r1113Css';s.textContent=[
 '.r1113card{position:relative}.r1113card img{object-fit:cover;object-position:50% 14%}',
 '.r1113card .r1113tag{position:absolute;top:4px;right:4px;font-size:9px;letter-spacing:.14em;padding:1px 5px;border:1px solid #cc3428;color:#ffd8cc;background:#1a0604cc;border-radius:2px}',
 '#panel .heroRowR101 .r1113card>span:not(.r1113tag){display:block;text-align:center}',
 '.r1113card.selected{border-color:#cc3428!important;box-shadow:0 0 14px #cc342880!important}',
 // 라우렌 칸은 엔진 선택값으로 .selected 를 그대로 두되(무대·확정이 그 값을 씀) 보이기만 고르지 않은 칸처럼
 'html #panel:not(#r1113x) [data-hero][data-hero].selected.r1113under{border-color:#53636b!important;background:#0c1822b0!important;box-shadow:none!important;outline:none!important;transform:none!important}',
 'html.r1085Ink.r1086Hanji:not(#r1086x) #panel:not(#r1113x) [data-hero][data-hero].selected.r1113under{background-color:#dacdb0!important;border-color:#8a7c68!important;box-shadow:none!important;transform:none!important}',
 '#panel.r263:not(#r1113x) .cards.r108:has(> [data-persona-r1113]){grid-template-columns:repeat(auto-fill,minmax(80px,1fr))!important}'].join('\n');document.head.appendChild(s);}
function card(ref,startRow){const b=document.createElement('button');b.type='button';b.className=(ref.className||'card').replace(/\bselected\b/g,'').trim()+' r1113card';b.dataset.personaR1113='1';b.dataset.r263='1';b.title=PROFILE.title;
 if(startRow)b.innerHTML='<img alt="페르소나"><span>'+PROFILE.name+'</span>';
 else if(ref.querySelector('.pf'))b.innerHTML='<div class="pf"><img alt="페르소나"></div><div class="body"><span class="role">'+PROFILE.role+'</span><strong>'+PROFILE.name+'</strong><small>'+PROFILE.passive+'</small></div>';
 else b.innerHTML='<img alt="페르소나"><strong>'+PROFILE.name+'</strong><small>'+PROFILE.passive+'</small>';
 b.querySelector('img').src=url(PROFILE.portrait);const tag=document.createElement('span');tag.className='r1113tag';tag.textContent='HIDDEN';b.appendChild(tag);
 b.onclick=ev=>{try{ev?.stopPropagation?.();want=true;const h=b.parentElement?.querySelector('[data-hero="'+BASE+'"]');synthetic=true;try{h?.click();}finally{synthetic=false;want=true;}setTimeout(mark,0);}catch(e){fail(e);}};stats.cards++;return b;}
function mark(){if(!hasDoc())return;for(const c of document.querySelectorAll('#panel [data-persona-r1113]')){const h=c.parentElement?.querySelector('[data-hero="'+BASE+'"]');const sel=want&&!!h&&h.classList.contains('selected');c.classList.toggle('selected',sel);if(h)h.classList.toggle('r1113under',sel);}
 const st=document.getElementById('r263Stage');if(!st)return;const nm=st.querySelector('.nm');
 if(want&&st.dataset.hero===BASE&&nm&&nm.textContent!==PROFILE.name){st.classList.add('r1113');st.style.setProperty('--c',PROFILE.color);const role=st.querySelector('.role'),img=st.querySelector('.pt img'),info=st.querySelector('.info');
  nm.textContent=PROFILE.name;if(role)role.textContent=PROFILE.role;if(img){img.onerror=null;img.src=url(PROFILE.portrait);img.alt=PROFILE.name;}
  if(info){const tags=info.querySelector('.tags');if(tags)tags.innerHTML=PROFILE.tags.map(x=>'<span>'+x+'</span>').join('');}}
 else if(!want&&st.classList.contains('r1113'))st.classList.remove('r1113');}
function inject(){const panel=document.getElementById('panel');if(!panel)return;const rows=[];const sr=panel.querySelector('#heroRowR101 .heroRowR101');if(sr)rows.push([sr,true]);const cs=panel.querySelector('.cards');if(cs&&cs.querySelector('[data-hero]'))rows.push([cs,false]);
 for(const [row,start] of rows){const h=row.querySelector('[data-hero="'+BASE+'"]');let c=row.querySelector('[data-persona-r1113]');if(!h){continue;}
  if(!unlocked()){if(c)c.remove();continue;}
  const heroes=[...row.querySelectorAll('[data-hero]')],last=heroes[heroes.length-1];
  if(!c){c=card(h,start);last.insertAdjacentElement('afterend',c);}else if(c.previousElementSibling!==last)last.insertAdjacentElement('afterend',c);}
 mark();}
function onClick(ev){try{const el=ev.target?.closest?.('#panel [data-hero],#chooseHero,#slotConfirmR73,#panel [data-ego-r1046]');if(!el)return;
 if(el.id==='chooseHero'||el.id==='slotConfirmR73'){const sel=document.querySelector('#panel [data-persona-r1113].selected');commit=!!(sel&&want);return;}
 if(!synthetic&&!ev.target.closest('[data-persona-r1113]'))want=false;}catch(e){fail(e);}}
function hudName(){const n=G(()=>document.getElementById('heroName'),null);if(!n)return;const t=String(n.textContent||''),b=G(()=>HEROES[BASE].name,'라우렌');if(t.includes(b))n.textContent=t.split(b).join(PROFILE.name);else if(!t)n.textContent=PROFILE.name;}
function nameFix(id,v){if(id!=='heroName'||!formActive())return v;const t=String(v??''),b=G(()=>HEROES[BASE].name,'라우렌');return t.includes(b)?t.split(b).join(PROFILE.name):t;}
function wrapHud(){for(const k of ['setHudTextR63R2','setHudText']){const f=G(()=>typeof window[k]==='function'?window[k]:null,null);if(!f||f.__r1113)continue;const w=function(id,v,...a){let x=v;try{x=nameFix(id,v);}catch(e){fail(e);}return f.call(this,id,x,...a);};w.__r1113=true;try{window[k]=w;}catch(e){fail(e);}}}
let uiAt=0;
function ui(){if(!hasDoc())return;const t=Date.now();if(t<uiAt)return;uiAt=t+200;
 try{if(commit!=null&&!G(()=>loading,true)&&G(()=>started,false)){const p=pl();if(p){const on=commit&&p.hero===BASE;setForm(on);if(on&&typeof toast==='function')toast(PROFILE.title+' · 라우렌의 기술을 언주빛으로 씁니다.',4);}commit=null;want=false;}}catch(e){fail(e);}
 try{if(document.getElementById('panel')?.querySelector('[data-hero]')){css();inject();}}catch(e){fail(e);}
 try{if(formActive()){hudName();const pt=document.getElementById('portrait'),u=url(PROFILE.portrait);if(pt&&pt.getAttribute('src')!==u)pt.src=u;}}catch(e){fail(e);}}
function install(){wrapSave();wrapTick();wrapInst();wrapHud();if(hasDoc()){try{document.addEventListener('click',onClick,true);}catch(e){fail(e);}}
 try{setInterval(()=>{try{wrapSave();wrapTick();wrapInst();wrapHud();watch();ui();}catch(e){fail(e);}},250);}catch(e){fail(e);}}
install();
window.__STORYWORLD_PERSONA_HERO_R1113__=Object.freeze({revision:REV,profile:PROFILE,field:FIELD,base:BASE,tint:TINT,art:ART,walkSheets:WALK,idleSheets:IDLE,scale:SCALE,orb:ORB,
 unlocked,unlock,formActive,setForm,process,watch,refresh:()=>{try{if(hasDoc()){css();inject();}}catch(e){fail(e);}},
 lock(){saved={on:false,off:false};persist();},set(v){saved.off=v===false||v==='off';persist();return !saved.off;},
 images:()=>Object.fromEntries([...IM].map(([k,v])=>[k,v.state])),
 inspect:()=>({revision:REV,unlocked:unlocked(),saved:{...saved},form:formActive(),walk:+walk.w.toFixed(2),want,commit,stats:{...stats},lastError})});
})();

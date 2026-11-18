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
const REV='R1113-persona-hero-9-celestial-r1143-wer-r1144',KEY='storyworld.r1113.personaHero',FIELD='personaHeroR1113',BASE='lauren';
const PROFILE=Object.freeze({name:'페르소나',title:'페르소나 · 순수악의',role:'HIDDEN · 9번째 영웅',color:'#cc3428',
 passive:'사몽 결전에서 쓰러뜨린 거울. 별의 기술을 언주빛으로 되비춥니다.',special:'내면의 소용돌이',
 portrait:'assets/rc133/art/awake-0.png',tags:['히든','언주','거울']});
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
// R1120(사용자 11-17 "걷기 모션이 너무 빠름"): 칸 넘김을 엔진 영웅 걷기(visual-r119 WALK_RATE_R148 = 거리 1당 3.2칸)와 같게. 예전 4/step(약 6칸)은 1.8배 빨랐다.
const WALK_RATE=3.2;
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
function prewarm(){for(const i of [0,2,4,6]){load(ART.base(i));load(ART.awake(i));}for(const k in WALK)load(WALK[k].src,FRAMES);for(const k in IDLE)load(IDLE[k].src,IDLE[k].n,IDLE[k].cell);for(const k of ['vortex','eclipse']){const q=SK_SRC(k);load(q.flight);load(q.contact);}}
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
// R1120: 라우렌 몸 그림(…/lauren/… — 라우렌 스킬 그림 lauren/lauren-*, fx/lauren/* 은 빼고). 막기 때 더 큰 방벽(barrier.webp)을 몸으로 고르던 것을 막는다.
const LAUREN_BODY=/\/lauren\/(?!lauren-)/,LAUREN_NOT_BODY=/\/fx\/lauren\//;
const isLaurenBody=c=>{const s=String(c?.sourcePath||'');return LAUREN_BODY.test(s)&&!LAUREN_NOT_BODY.test(s);};
function heroBody(cmds){let best=-1,bh=0,bestL=-1,bl=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||c.kind!=='image'||c.r1113||c.r151Death)continue;const o=c.owner;if(!o||o.kind!=='hero'||/:r151$/.test(String(o.id||'')))continue; // R1140: R151 쓰러짐 칸(이미 페르소나 쓰러짐 시트)은 몸으로 고르지 않는다
  const P=c.points;if(!Array.isArray(P)||P.length!==4||!P.every(okPt))continue;const h=Math.abs(P[3][1]-P[0][1]);if(h>bh){bh=h;best=i;}if(isLaurenBody(c)&&h>bl){bl=h;bestL=i;}}return bestL>=0?bestL:best;}
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
function swapBody(cmds){if(!(pl()?.hp>0))return null; // R1140: 쓰러진 뒤엔 몸을 바꿔 끼우지 않는다(쓰러짐 칸이 대기 그림으로 덮이던 것)
 const i=heroBody(cmds);if(i<0)return null;const c=cmds[i],p=pl(),t=now(),P0=c.points.map(q=>[q[0],q[1]]);if(!p||t==null||typeof project!=='function')return null;
 const g=project(p.x,p.y);if(!fin(g?.x)||!fin(g?.y))return null;const lift=Math.max(0,Math.min(200,+p.visualLiftPx||0)),foot=[g.x,g.y-lift],H=G(()=>actorHeight(),66)*SCALE;if(!(H>0))return null;
 const s=track(p,t),ult=p.ultimateAnim>0,act=!ult&&(p.attackAnim>0||p.skillAnim>0);
 if(s.w>.5&&!act&&!ult){const [k,m]=pickWalk(),W=WALK[k],r=IM.get(W.src);if(r?.state==='ready'){const f=Math.floor(s.phase*WALK_RATE)%FRAMES;if(place(c,r.frames[f],W,m,foot,H)){stats.walkSwaps++;stats.last=k+':'+f+(m<0?':flip':'');return {i,c,mode:'walk',P0};}}}
 const dir=String(p.poseDirections5?.[ult?'ultimate':p.skillAnim>0?'skill':p.attackAnim>0?'attack':'']||p.direction||'front');
 if(act){const [k,m]=SIDE[dir]||SIDE.front,W=WALK[k],r=IM.get(W.src);if(r?.state==='ready'){const f=Math.floor(t*ACT_FPS)%FRAMES;if(place(c,r.frames[f],W,m,foot,H)){stats.actSwaps=(stats.actSwaps||0)+1;stats.last='act:'+k+':'+f+(m<0?':flip':'');
   return {i,c,mode:'act',k,f,m,W,foot,H,t,skill:p.skillAnim>0,P0};}}}
 if(!ult){const [k,m]=IDLE_DIR[dir]||IDLE_DIR.front,S=IDLE[k],r=IM.get(S.src);if(r?.state==='ready'&&r.frames?.length){const f=Math.floor(t*1000/IDLE_MS)%r.frames.length;if(place(c,r.frames[f],S,m,foot,H)){stats.idleSwaps=(stats.idleSwaps||0)+1;stats.last='idle:'+k+':'+f+(m<0?':flip':'');return {i,c,mode:'idle',foot,H,t,P0};}}}
 const idx=DIRI[dir]??0,path=(ult?ART.awake:ART.base)(idx),r=IM.get(path);if(r?.state!=='ready')return null;
 if(place(c,r.frames[0],{ax:ART.ax,ground:ART.ground,h:ART.height},1,foot,H)){stats.swaps++;stats.last=path;return {i,c,mode:ult?'ult':'still',foot,H,t,P0};}return null;}
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
// R1120: 라우렌 보라로 물든 에덴 불(r108eden:<시트>#164,98,255|…), 라우렌 스킬 그림 폴더(lauren/lauren-*, fx/lauren/*), EGO 오라(r111:ego-*·라우렌 팔레트), 순간이동 빛(…:lauren:…)
const LAUREN_EDEN=/^r108eden:[a-z.]+#(\d+),(\d+),(\d+)\|/,LAUREN_ART=/\/lauren\/lauren-|\/fx\/lauren\//,EGO_AURA=/^r111:ego-(back|front)$/,LAUREN_ID=/:lauren:/;
// R1140: 막기 방벽(r1027/barrier.webp — 은청색, 영웅 소유 테두리 복제 포함)·막기 빛(r111:guard-*, 금빛)·블링크 잔광(vfx/blink-afterimage.webp)도 형상일 때 언주로
const GUARD_ART=/\/r1027\/barrier\.webp/,BLINK_ART=/\/vfx\/blink-afterimage\.webp/,GUARD_ID=/^r111:guard-(back|front)$/;
function heroFx(o,c){if(!o||o.kind==='enemy'||o.kind==='contact'||o.kind==='shadow')return false;if(o.kind==='hero')return GUARD_ART.test(String(c?.sourcePath||''));
 if(o.pxfSide!=='enemy'&&o.side!=='enemy'){if(GUARD_ID.test(String(o.id||'')))return true;const s0=String(c?.sourcePath||'');if(GUARD_ART.test(s0)||BLINK_ART.test(s0))return true;}if(o.pxfSide==='hero'||o.side==='hero')return true;if(o.pxfSide==='enemy'||o.side==='enemy')return false;const id=String(o.id||'');
 if(o.r101===true&&HIT_ID.test(id)&&HIT_ART.test(String(c?.sourcePath||'')))return true;/* R1143: 영웅 타격 불꽃(R101, 라우렌 보라·옅은 색) */
 if(/(^|:)hero(:|$)/.test(id)||/^r102:/.test(id)||EGO_AURA.test(id)||LAUREN_ID.test(id))return true;const sp=String(c?.sourcePath||'');
 const e=LAUREN_EDEN.exec(sp),ev=e&&violet(+e[1],+e[2],+e[3]);
 return o.kind==='effect'&&(LAUREN_FX.test(sp)||!!ev||LAUREN_ART.test(sp));}
// 보라 계열(파랑이 빨강·초록보다 큰 색) — 라우렌 팔레트 164,98,255 · 150,70,255 · 74,26,120 · 240,216,255 등
function violet(r,g,b){return b>r&&b>g&&b-Math.min(r,g)>=30;} // 은빛(226,232,242) 같은 거의 무채색은 그대로
// R1120: 선·채우기 명령(중력 우물 코어·원반 등 r561 벡터)은 그림 필터 대신 색 문자열을 언주 명암으로 바꾼다(밝기 따라 먹→언주→살구, 알파 유지)
const RAMP=[[0,[6,1,1]],[.22,EONJU[0]],[.5,EONJU[1]],[.82,EONJU[2]],[1,[255,236,224]]];
function eonju(r,g,b){const L=Math.max(0,Math.min(1,(.3*r+.59*g+.11*b)/255+.08*(b/255)));let j=1;while(j<RAMP.length-1&&L>RAMP[j][0])j++;const [a0,c0]=RAMP[j-1],[a1,c1]=RAMP[j],k=Math.max(0,Math.min(1,(L-a0)/Math.max(1e-6,a1-a0)));return c0.map((v,i)=>Math.round(v+(c1[i]-v)*k));}
const RGBA=/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.eE+-]+)\s*)?\)/g; // 알파가 1.2e-7 꼴로 적혀도 잡는다(R1143: 옅어지는 고리 끝이 보라로 남던 것)
function recolorStr(v){if(typeof v!=='string')return v;return v.replace(RGBA,(m,r,g,b,a)=>{if(!violet(+r,+g,+b))return m;const c=eonju(+r,+g,+b);return a==null?'rgb('+c.join(',')+')':'rgba('+c.join(',')+','+a+')';});}
function recolorPaint(v){if(typeof v==='string')return recolorStr(v);if(v&&typeof v==='object'&&Array.isArray(v.stops))return {...v,stops:v.stops.map(st=>st&&typeof st==='object'?{...st,color:recolorStr(st.color)}:st)};return v;}
const VEC_ID=/^r561:/;
const HIT_ID=/^r101:\d+$/,HIT_ART=/\/r100\/sig-(hit|slash)-(violet|pale)\.webp/;
// R1120: 픽셀 이펙트(R163) — 라우렌 특수기(R178 pvfx-warm-explosion 등)는 영웅 팔레트(보라)를 색조로 넘겨 구운 캔버스라 그림 필터가 안 닿는다 → play 로 넘기는 색조를 언주로.
//  frameAt 은 R102 영웅 이펙트 안에서 그려져 그 명령째 언주 색 돌리기(tint)를 받으므로 그대로 둔다(둘 다 하면 빨강→초록).
const eonjuArr=c=>Array.isArray(c)&&c.length>=3&&violet(c[0],c[1],c[2])?eonju(c[0],c[1],c[2]):c;
function pfxTint(o){if(!o||typeof o!=='object'||!o.tint||typeof o.tint!=='object'||!formActive())return o;const t=o.tint,a=eonjuArr(t.a),b=eonjuArr(t.b);if(a===t.a&&b===t.b)return o;return {...o,tint:{...t,a,b}};}
function wrapPfx(){const X=G(()=>window.__STORYWORLD_PIXELFX_R163__,null);if(!X||X.__r1120||typeof X.play!=='function')return;
 const w={...X,__r1120:true,play:(n,x,y,o)=>{let q=o;try{q=pfxTint(o);}catch(e){fail(e);}return X.play(n,x,y,q);}};
 try{window.__STORYWORLD_PIXELFX_R163__=Object.freeze(w);}catch(e){fail(e);}}
function vectors(cmds){let n=0;for(const c of cmds){if(!c||(c.kind!=='fill'&&c.kind!=='stroke')||c.r1113tint)continue;const o=c.owner;if(!o||!(VEC_ID.test(String(o.id||''))||heroFx(o,c)))continue;const s=c.style;if(!s||typeof s!=='object')continue;
  const ct=celToneOf(o);if(ct){c.style={...s,fillStyle:tonePaint(s.fillStyle,ct),strokeStyle:tonePaint(s.strokeStyle,ct)};c.r1113tint=true;stats.celTints=(stats.celTints||0)+1;n++;continue;}
  c.style={...s,fillStyle:recolorPaint(s.fillStyle),strokeStyle:recolorPaint(s.strokeStyle)};c.r1113tint=true;n++;}stats.vecTints=(stats.vecTints||0)+n;return n;}
// R1140 언주 명암 굽기: 색 돌리기(hue-rotate)는 밝은 심을 흰·분홍으로 남긴다(브라우저 기록기는 brightness·contrast·saturate·grayscale·hue-rotate 만 됨) →
//  정지 그림 이펙트는 그림을 한 번 읽어 밝기 따라 먹→언주 어두움(70,14,10)→언주(204,52,40)→살구(255,176,140)→살구빛 흰색으로 구운 캔버스로 바꿔 끼운다(알파 그대로).
//  한 프레임에 한 장만 굽고(끊김 막기), 바뀌는 캔버스·너무 큰 그림·읽기 막힌 그림·굽기 전 프레임은 예전 색 돌리기 필터 그대로.
const LUT=(()=>{const t=new Uint8ClampedArray(768);for(let v=0;v<256;v++){const L=v/255;let j=1;while(j<RAMP.length-1&&L>RAMP[j][0])j++;const [a0,c0]=RAMP[j-1],[a1,c1]=RAMP[j],k=Math.max(0,Math.min(1,(L-a0)/Math.max(1e-6,a1-a0)));for(let i=0;i<3;i++)t[v*3+i]=Math.round(c0[i]+(c1[i]-c0[i])*k);}return t;})();
const lum=(r,g,b)=>{const v=Math.round(.3*(+r||0)+.59*(+g||0)+.11*(+b||0));return v<0?0:v>255?255:v;};
function ramp(r,g,b){const i=lum(r,g,b)*3;return [LUT[i],LUT[i+1],LUT[i+2]];}
// 굽는 그림은 대부분 빛 더하기(lighter)로 겹쳐 그려져 밝은 쪽이 금방 흰·분홍으로 뜬다 → 굽기용 표는 흰 꼬리 없이 사용자 세 색만(먹 → 70,14,10 → 204,52,40 → 255,176,140)
const DEEP=[[0,[0,0,0]],[.3,EONJU[0]],[.65,EONJU[1]],[1,EONJU[2]]];
const LUT_DEEP=(()=>{const t=new Uint8ClampedArray(768);for(let v=0;v<256;v++){const L=v/255;let j=1;while(j<DEEP.length-1&&L>DEEP[j][0])j++;const [a0,c0]=DEEP[j-1],[a1,c1]=DEEP[j],k=Math.max(0,Math.min(1,(L-a0)/Math.max(1e-6,a1-a0)));for(let i=0;i<3;i++)t[v*3+i]=Math.round(c0[i]+(c1[i]-c0[i])*k);}return t;})();
// R1143 천체 공명 갈래 색(페르소나 형상만): 척력 = 언주(위 DEEP 그대로), 인력 = 흑, 합친 것 = 검빨. 모양은 그대로 두고 밝기 따라 색만 바꾼다.
const mkLut=R=>{const t=new Uint8ClampedArray(768);for(let v=0;v<256;v++){const L=v/255;let j=1;while(j<R.length-1&&L>R[j][0])j++;const [a0,c0]=R[j-1],[a1,c1]=R[j],k=Math.max(0,Math.min(1,(L-a0)/Math.max(1e-6,a1-a0)));for(let i=0;i<3;i++)t[v*3+i]=Math.round(c0[i]+(c1[i]-c0[i])*k);}return t;};
const BLACK_RAMP=[[0,[0,0,0]],[.6,[24,22,27]],[1,[140,134,146]]],DARKRED_RAMP=[[0,[0,0,0]],[.35,[40,4,4]],[.7,[122,16,14]],[1,EONJU[1]]];
const TONES=Object.freeze({eonju:{lut:LUT_DEEP,filter:null},black:{lut:mkLut(BLACK_RAMP),filter:'grayscale(1) brightness(.34) contrast(1.5)'},darkred:{lut:mkLut(DARKRED_RAMP),filter:null}});
const CEL_TONE=Object.freeze({repulse:'eonju',red:'eonju',blue:'black',violet:'darkred',meteor:'darkred'}),CEL_ID=/^r946:(repulse|red|blue|violet|meteor)(?::|$)/,CEL_ART=/(^|\/)assets\/r946\//;
function celestialTone(kind){return formActive()&&typeof kind==='string'&&Object.prototype.hasOwnProperty.call(CEL_TONE,kind)?CEL_TONE[kind]:null;}
function celToneOf(o){const m=o&&CEL_ID.exec(String(o.id||''));return m?CEL_TONE[m[1]]:null;}
// R1144: 다른 영웅 시트(민트 번개 등)는 보라 기준 색 돌리기(TINT)가 안 맞는다 → 굽지 못할 때 쓸 색 돌리기를 이펙트 주인이 준다(기록기가 받는 함수만)
const SAFE_FILTER=/^(?:(?:saturate|hue-rotate|brightness|contrast|grayscale)\([\d.]+(?:deg)?\)\s*)+$/;
function ownerFallback(o){const v=o&&o.personaFallback;return typeof v==='string'&&SAFE_FILTER.test(v)?v:null;}
function toneStr(v,tone){if(typeof v!=='string')return v;const t=TONES[tone].lut;return v.replace(RGBA,(m,r,g,b,a)=>{const i=lum(r,g,b)*3,c=[t[i],t[i+1],t[i+2]];return a==null?'rgb('+c.join(',')+')':'rgba('+c.join(',')+','+a+')';});}
function tonePaint(v,tone){if(typeof v==='string')return toneStr(v,tone);if(v&&typeof v==='object'&&Array.isArray(v.stops))return {...v,stops:v.stops.map(st=>st&&typeof st==='object'?{...st,color:toneStr(st.color,tone)}:st)};return v;}
function rampPixels(d,lut=LUT_DEEP){let n=0;if(!d||!(d.length>=4))return 0;for(let i=0;i+3<d.length;i+=4){if(d[i+3]===0)continue;const j=lum(d[i],d[i+1],d[i+2])*3;d[i]=lut[j];d[i+1]=lut[j+1];d[i+2]=lut[j+2];n++;}return n;}
const BAKE_MAX_PX=2048*2048,BAKE_MAX_N=200,BAKE_MAX_TOTAL=12e6;const baked=new WeakMap(),bakedTone={};let bakeSerial=0,bakeBudget=0,bakeCount=0,bakePx=0; // 합계 1200만 화소(약 48MB)까지만 굽는다
function bake(c,tone='eonju'){const im=c.image;if(!im||typeof im!=='object'||c.mutable===true||!hasDom())return null;const store=tone==='eonju'?baked:(bakedTone[tone]||(bakedTone[tone]=new WeakMap()));let r=store.get(im);if(r!==undefined)return r;
 const w=Math.floor(+im.naturalWidth||+im.videoWidth||+im.width||0),h=Math.floor(+im.naturalHeight||+im.videoHeight||+im.height||0);
 if(!(w>0&&h>0)||w*h>BAKE_MAX_PX||bakeCount>=BAKE_MAX_N||bakePx+w*h>BAKE_MAX_TOTAL){store.set(im,null);return null;}
 if(bakeBudget<=0)return null;bakeBudget--;
 try{const cv=canvas(w,h),g=cv.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h);rampPixels(d.data,TONES[tone].lut);g.putImageData(d,0,0);
  const id='r1140:'+tone+':'+(++bakeSerial)+':'+String(c.sourcePath||c.immutableTint?.path||im.__storyworldStaticTint?.path||'cv').replace(/^https?:\/\/[^/]+\//,'').slice(0,90);cv.__storyworldStaticSource={path:id};
  r={canvas:cv,path:id};bakeCount++;bakePx+=w*h;stats.bakedPx=bakePx;stats.baked=(stats.baked||0)+1;}catch(_){r=null;stats.bakeSkips=(stats.bakeSkips||0)+1;}
 store.set(im,r);return r;}
function tint(cmds){let n=0;for(const c of cmds){if(!c||c.kind!=='image'||c.r1113tint)continue;if(!heroFx(c.owner,c))continue;const s=c.style&&typeof c.style==='object'?c.style:{};
  const ct=celToneOf(c.owner);if(ct&&!CEL_ART.test(String(c.sourcePath||''))){c.r1113tint=true;continue;}/* R1143: 유성 궤도가 던지는 조형물 그림은 물들이지 않음 */const tone=ct||'eonju';if(ct)stats.celTints=(stats.celTints||0)+1;
  let b=null;try{b=bake(c,tone);}catch(e){fail(e);}
  if(b){if(typeof s.filter==='string'&&/grayscale\(/.test(s.filter)){const k=s.filter.replace(/grayscale\([^)]*\)\s*/g,'').trim();c.style={...s,filter:k||'none'};}/* R1143: 무채색 필터가 구운 색을 다시 지우지 않게 */c.image=b.canvas;c.mutable=false;c.sourcePath=b.path;c.immutableTint=b.canvas.__storyworldStaticSource;c.r1113tint=true;stats.bakedDraws=(stats.bakedDraws||0)+1;n++;continue;}
  const f=typeof s.filter==='string'&&s.filter!=='none'?s.filter+' ':'';c.style={...s,filter:f+(TONES[tone].filter||(tone==='darkred'?TINT+' brightness(.55)':ownerFallback(c.owner)||TINT))};c.r1113tint=true;n++;}stats.tints+=n;return n;}
// 페르소나는 창이 없다 → 라우렌 창끝 빛(R425)은 형상일 때 뺀다
const DROP=/^r425:spear-tip$/;
function drop(cmds){let j=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(c&&c.owner&&DROP.test(String(c.owner.id||'')))continue;cmds[j++]=c;}const n=cmds.length-j;cmds.length=j;stats.dropped=(stats.dropped||0)+n;return n;}
// R1120 몸 복제: 몸을 바꾼 뒤에도 남는 라우렌 몸 그림(가림 유령·R409 테두리 복제·잔상·대시 몸 시트) → 바꾼 페르소나 칸을 몸과의 발 차이만큼 옮겨 쓴다(투명도·순서·열쇠는 그대로).
const foot0=P=>[(P[2][0]+P[3][0])/2,(P[2][1]+P[3][1])/2];
function echoes(cmds,sw){if(!sw||!sw.P0)return 0;const B=sw.c,f0=foot0(sw.P0);let n=0;
 for(const c of cmds){if(!c||c===B||c.kind!=='image'||c.r1113||!isLaurenBody(c))continue;const o=c.owner;if(o&&(o.kind==='enemy'||o.kind==='shadow'||o.kind==='contact'))continue;
  const P=c.points;if(!Array.isArray(P)||P.length!==4||!P.every(okPt))continue;const f=foot0(P),dx=f[0]-f0[0],dy=f[1]-f0[1];
  c.image=B.image;c.mutable=false;c.sourcePath=B.sourcePath;c.immutableTint=B.immutableTint;c.sourceRect=[...B.sourceRect];c.imageSize=[...B.imageSize];c.points=B.points.map(q=>[q[0]+dx,q[1]+dy]);c.r1113=true;n++;}
 stats.echoes=(stats.echoes||0)+n;return n;}
// R1120 스킬 그림: 라우렌 r561 스킬 시트(256칸 6×4)를 같은 자리에서 페르소나 Dots 탄 시트(R1119, 256칸 가로 8·6, 이미 언주색)로 — 판정·피해는 그대로.
//  중력 우물 뒤·분쇄 소용돌이 → 내면의 소용돌이 비행 8칸 루프, 붕괴 24칸 → 욕망의 일식(앞 16칸 비행 루프, 뒤 8칸 → 소멸 6칸). 우물 앞 고리는 그림 그대로 언주 색.
const SKILL=Object.freeze({'lauren-gravity-well-back':{sheet:'vortex'},'lauren-crush-vortex':{sheet:'vortex'},'lauren-collapse':{sheet:'eclipse',split:16}});
const SKILL_RX=/\/r561\/lauren\/(lauren-gravity-well-back|lauren-crush-vortex|lauren-collapse)\.webp/;
const SK_SRC=k=>({flight:'assets/r1119/fx-'+k+'-flight.webp',contact:'assets/r1119/fx-'+k+'-contact.webp'});
function skills(cmds){let n=0;for(const c of cmds){if(!c||c.kind!=='image'||c.r1113)continue;const m=SKILL_RX.exec(String(c.sourcePath||''));if(!m)continue;const S=SKILL[m[1]],src=SK_SRC(S.sheet);
  const sr=Array.isArray(c.sourceRect)&&c.sourceRect.length>=2&&c.sourceRect.every(fin)?c.sourceRect:null;const idx=sr?Math.floor((sr[1]+.5)/256)*6+Math.floor((sr[0]+.5)/256):Math.floor((now()||0)*12)%24;
  let path=src.flight,f=idx%8;if(S.split&&idx>=S.split){path=src.contact;f=Math.min(5,Math.floor((idx-S.split)*6/(24-S.split)));}
  const r=load(path);if(r.state!=='ready'||!r.frames?.[0])continue;const fr=r.frames[0];
  c.image=fr.canvas;c.mutable=false;c.sourcePath='r1113:'+path.replace(/^assets\//,'')+':'+f;c.immutableTint=fr.canvas.__storyworldStaticSource;c.sourceRect=[f*256,0,256,256];c.imageSize=[fr.w,fr.h];c.r1113=true;c.r1113tint=true;
  if(c.style&&typeof c.style==='object'&&typeof c.style.filter==='string'&&/hue-rotate/.test(c.style.filter))c.style={...c.style,filter:'none'};n++;}
 stats.skillSwaps=(stats.skillSwaps||0)+n;return n;}
// R1120b 우물 코어: 엔진이 선·채우기로 그린 보라 구(r561:well:<t>:core:n) → 빼고, 그 자리에 욕망의 일식 비행 시트 칸 하나(Dots 그림, 이미 언주색)
const CORE_ID=/^r561:well:[^:]+:core$/;
function wellCore(cmds){let n=0;const groups=new Map();
 for(let i=0;i<cmds.length;i++){const c=cmds[i];if(!c||(c.kind!=='fill'&&c.kind!=='stroke'))continue;const id=String(c.owner?.id||'');if(!CORE_ID.test(id))continue;let g=groups.get(id);if(!g){g={first:c,box:[Infinity,Infinity,-Infinity,-Infinity],fill:null};groups.set(id,g);}
  if(c.kind==='fill'&&Array.isArray(c.paths)){for(const pa of c.paths)for(const q of (Array.isArray(pa?.points)?pa.points:[]))if(okPt(q)){g.box[0]=Math.min(g.box[0],q[0]);g.box[1]=Math.min(g.box[1],q[1]);g.box[2]=Math.max(g.box[2],q[0]);g.box[3]=Math.max(g.box[3],q[1]);}g.fill=g.fill||c;}}
 if(!groups.size)return 0;const r=load(SK_SRC('eclipse').flight);if(r.state!=='ready'||!r.frames?.[0])return 0;const fr=r.frames[0],f=Math.floor((now()||0)*1000/83)%8;
 const add=[];for(const [id,g] of groups){const b=g.box;if(!(b[2]>b[0])||!(b[3]>b[1]))continue;const cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,R=Math.max(b[2]-b[0],b[3]-b[1])*1.25;// 시트 칸 안 일식 원반 지름 ≈ 칸의 0.42 → 칸 폭 = 코어 지름/0.42 쯤이지만 테두리 불꽃까지 보이게 1.25배로 잘라 둔다
  const base=g.first,pts=[[cx-R,cy-R],[cx+R,cy-R],[cx+R,cy+R],[cx-R,cy+R]];if(!pts.every(okPt))continue;
  const cmd={...base,kind:'image',key:id+':r1120core',order:base.order,owner:{...base.owner},image:fr.canvas,mutable:false,sourcePath:'r1113:r1119/fx-eclipse-flight.webp:'+f,immutableTint:fr.canvas.__storyworldStaticSource,
   sourceRect:[f*256,0,256,256],imageSize:[fr.w,fr.h],points:pts,style:{...(base.style&&typeof base.style==='object'?base.style:{}),filter:'none',globalCompositeOperation:'source-over'},r1113:true,r1113tint:true};
  delete cmd.paths;delete cmd.rule;delete cmd.lineWidth;add.push([base,cmd]);}
 let j=0;for(let i=0;i<cmds.length;i++){const c=cmds[i];if(c&&(c.kind==='fill'||c.kind==='stroke')&&CORE_ID.test(String(c.owner?.id||''))){const a=add.find(x=>x[0]===c);if(a){cmds[j++]=a[1];n++;}continue;}cmds[j++]=c;}cmds.length=j;
 stats.cores=(stats.cores||0)+n;return n;}
function process(cmds){if(!Array.isArray(cmds))return 0;if(!formActive())return 0;prewarm();bakeBudget=1;let n=0;try{drop(cmds);}catch(e){fail(e);}try{const sw=swapBody(cmds);if(sw){n++;n+=echoes(cmds,sw);n+=addGlow(cmds,sw);}}catch(e){fail(e);}try{n+=skills(cmds);}catch(e){fail(e);}try{n+=wellCore(cmds);}catch(e){fail(e);}try{n+=tint(cmds);}catch(e){fail(e);}try{n+=vectors(cmds);}catch(e){fail(e);}return n;}
// ---- 렌더러 감싸기(prototype·인스턴스, 한 render 에 한 번) ----
let depth=0;
const wrapFn=fn=>{if(fn.__r1113)return fn;const w=function(frame){if(depth===0){try{if(frame&&Array.isArray(frame.commands))process(frame.commands);}catch(e){fail(e);}}depth++;try{return fn.apply(this,arguments);}finally{depth--;}};w.__r1113=true;return w;};
try{const C=window.StoryPhase1?.ThreeRenderer?.prototype;if(C&&typeof C.render==='function')C.render=wrapFn(C.render);}catch(e){fail(e);}
const wrapped=new WeakSet();
function wrapInst(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.prototype.hasOwnProperty.call(r,'render')&&typeof r.render==='function'&&!wrapped.has(r)){wrapped.add(r);r.render=wrapFn(r.render);}}catch(e){fail(e);}}
function registerGameHooks() {
 window.__STORYWORLD_POST_HOOKS__.register('__r1113', {
  tick() { watch(); if (formActive() && hasDoc()) hudName(); },
  serializeSave(data) { if (data?.player) data.player[FIELD] = formActive(); },
  restoreSave(raw) {
   const p = pl();
   if (p) p[FIELD] = raw?.player?.[FIELD] === true && p.hero === BASE && unlocked();
  }
 }, fail);
}

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
 if(want&&st.dataset.hero===BASE)try{relabelIn(st);}catch(e){fail(e);}
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
function nameFix(id,v){if(!formActive())return v;if(Object.prototype.hasOwnProperty.call(HUD_TEXT,id))return HUD_TEXT[id];if(id!=='heroName')return v;const t=String(v??''),b=G(()=>HEROES[BASE].name,'라우렌');return t.includes(b)?t.split(b).join(PROFILE.name):t;}
function wrapHud(){for(const k of ['setHudTextR63R2','setHudText']){const f=G(()=>typeof window[k]==='function'?window[k]:null,null);if(!f||f.__r1113)continue;const w=function(id,v,...a){let x=v;try{x=nameFix(id,v);}catch(e){fail(e);}return f.call(this,id,x,...a);};w.__r1113=true;try{window[k]=w;}catch(e){fail(e);}}}
// R1120b 하단 스킬 칸: 형상일 때 아이콘을 페르소나 Dots 탄 시트(R1119) 칸으로, Q·본편 E 이름을 그 그림의 기술 이름으로, 초상 테 색을 언주로. 끄면 원래대로(dataset 에 기억).
const HUD_ICON=Object.freeze({attackIcon:'small-orb',blinkIcon:'diamond',guardIcon:'shield',specialIcon:'vortex',egoIcon:'eye'}),HUD_DOCK=Object.freeze({'#story-wer-w img':'star','#story-wer-e img':'eclipse','#story-wer-r img':'lance'});
const HUD_TEXT=Object.freeze({specialLabel:'내면의 소용돌이'}),HUD_TITLE=Object.freeze({'story-wer-w':'순수악의의 분기','story-wer-e':'욕망의 일식','story-wer-r':'악의의 관통'});
// R1140: 본편 W·E·R 칸 — 엔진 updateHUD 가 매 프레임 라우렌 아이콘·제목을 다시 쓰므로 그 직후에 다시 입힌다(아래 wrapHudDock)
const DOCK=Object.freeze({w:Object.freeze({icon:'star',name:'순수악의의 분기'}),e:Object.freeze({icon:'eclipse',name:'욕망의 일식'}),r:Object.freeze({icon:'lance',name:'악의의 관통'})});
const iconUrl=new Map();
function icon(k){if(iconUrl.has(k))return iconUrl.get(k);const r=load('assets/r1119/fx-'+k+'-flight.webp');if(r.state!=='ready'||!r.frames?.[0])return null;
 try{const cv=canvas(96,96);cv.__id=k;const g=cv.getContext('2d'),S=r.frames[0].h||256,m=Math.round(S*24/256);g.drawImage(r.frames[0].canvas,2*S+m,m,S-2*m,S-2*m,0,0,96,96);const u=cv.toDataURL('image/png');iconUrl.set(k,u);return u;}catch(e){fail(e);iconUrl.set(k,null);return null;}}
function hudIcon(el,k,on){if(!el)return;const d=el.dataset||{};if(on){const u=icon(k);if(!u)return;if(d.r1120src==null)d.r1120src=el.getAttribute('src')||'';if(el.getAttribute('src')!==u)el.src=u;}
 else if(d.r1120src!=null){el.src=d.r1120src;delete d.r1120src;}}
function hudTitles(on){for(const id in HUD_TITLE){const el=document.getElementById(id);if(!el)continue;const d=el.dataset,t=HUD_TITLE[id];
  if(on){if(el.title!==t){if(d.r1120title==null){d.r1120title=el.title||'';d.r1120aria=el.getAttribute('aria-label')||'';}el.title=t;el.setAttribute('aria-label',t+' · '+String(d.r1120aria).split(' · ').slice(1).join(' · '));}}
  else if(d.r1120title!=null){el.title=d.r1120title;el.setAttribute('aria-label',d.r1120aria);delete d.r1120title;delete d.r1120aria;}}}
function dockSkin(on){for(const q in HUD_DOCK)hudIcon(G(()=>document.querySelector(q),null),HUD_DOCK[q],on);hudTitles(on);}
let dockWrapped=false; // 한 번만 감싼다(다른 오버레이가 위에 또 감싸도 다시 감싸지 않음 — #754 핑퐁 방지)
function wrapHudDock(){if(dockWrapped)return;const f=G(()=>typeof updateHUD==='function'?updateHUD:null,null);if(!f)return;dockWrapped=true;
 const w=function(){const r=f.apply(this,arguments);try{if(formActive()&&hasDoc())dockSkin(true);}catch(e){fail(e);}return r;};w.__r1140=true;try{updateHUD=w;}catch(e){fail(e);}}
function hudSkin(on){if(!hasDoc())return;
 for(const id in HUD_ICON)hudIcon(document.getElementById(id),HUD_ICON[id],on);for(const q in HUD_DOCK)hudIcon(G(()=>document.querySelector(q),null),HUD_DOCK[q],on);
 for(const id in HUD_TEXT){const el=document.getElementById(id);if(!el)continue;const d=el.dataset;if(on){if(el.textContent!==HUD_TEXT[id]){if(d.r1120txt==null)d.r1120txt=el.textContent;el.textContent=HUD_TEXT[id];}}else if(d.r1120txt!=null){el.textContent=d.r1120txt;delete d.r1120txt;}}
 hudTitles(on);
 const pf=document.getElementById('r376Pf');if(pf&&pf.style){const d=pf.dataset,cur=pf.style.getPropertyValue('--hc');if(on){if(cur!==PROFILE.color){if(d.r1120hc==null)d.r1120hc=cur;pf.style.setProperty('--hc',PROFILE.color);}}else if(d.r1120hc!=null){pf.style.setProperty('--hc',d.r1120hc);delete d.r1120hc;}}}
// R1140 글 바꾸기: 형상일 때 P 창·영웅 선택 무대에 남는 라우렌 이름·기술 이름·패시브 문장 → 페르소나 것(화면 글만, 저장·판정·키는 그대로)
const LABELS=Object.freeze([['세 번째 공격에 잔향 마력진이 남는다.',PROFILE.passive],['잔향의 마법사','순수악의'],['잔향 결계','내면의 소용돌이'],['거짓 분리','순수악의의 분기'],['심문자의 전이','욕망의 일식'],['진명 심판','악의의 관통'],['라우렌',PROFILE.name]]);
const LABEL_RX=/라우렌|잔향의 마법사|잔향 결계|잔향 마력진|거짓 분리|심문자의 전이|진명 심판/;
// R1143(사용자 2026-11-18 05:41Z "이름앞에 (진) 을 붙이고 모두 척력은 언주색 인력은 흑색으로 합친건 검빨색해서 기존이펙트에 색만얹어"):
//  페르소나 형상일 때 라우렌 몸의 확률 패시브 천체 공명(R946)과 그 갈래 이름 앞에 '(진) ', 그림은 기존 모양 그대로 색만 얹는다(위 CEL_TONE — 장면 명령을 그릴 때 갈래별 명암표로 굽는다).
//  척력(항성 반발·은빛 거성) = 언주, 인력(심연 왜성) = 흑, 합친 것(쌍성 소멸·유성 궤도: 끌어와 던짐) = 검빨. 판정·수치·확률은 건드리지 않는다.
const CEL_PREFIX='(진) ',CEL_NAMES=Object.freeze({passive:'천체 공명',repulse:'항성 반발',red:'은빛 거성',blue:'심연 왜성',violet:'쌍성 소멸',meteor:'유성 궤도'});
const CEL_RX=/(\(진\) )?(천체 공명|항성 반발|은빛 거성|심연 왜성|쌍성 소멸|유성 궤도)/g,CEL_TEST=/천체 공명|항성 반발|은빛 거성|심연 왜성|쌍성 소멸|유성 궤도/;
function relabel(v){if(typeof v!=='string'||!v)return v;let t=v;if(LABEL_RX.test(t))for(const [a,b] of LABELS)if(t.includes(a))t=t.split(a).join(b);
 if(CEL_TEST.test(t))t=t.replace(CEL_RX,(m,p,n)=>CEL_PREFIX+n);return t;}
// 해금 알림(R1025 '특수 패시브 해금 · …') 같은 화면 알림 글도 형상일 때만 같은 이름으로. 한 번만 감싼다.
let toastWrapped=false;function wrapToast(){if(toastWrapped)return;const f=G(()=>typeof toast==='function'?toast:null,null);if(!f)return;toastWrapped=true;
 const w=function(text,...a){let t=text;try{if(typeof t==='string'&&CEL_TEST.test(t)&&formActive())t=relabel(t);}catch(e){fail(e);}return f.call(this,t,...a);};w.__r1143=true;try{toast=w;}catch(e){fail(e);}}
function relabelIn(root){const rt=root?String(root.textContent||''):'';if(!root||!(LABEL_RX.test(rt)||CEL_TEST.test(rt))||typeof document.createTreeWalker!=='function')return 0;let n=0;
 const tw=document.createTreeWalker(root,4);for(let x=tw.nextNode();x;x=tw.nextNode()){const v=x.nodeValue,t=relabel(v);if(t!==v){x.nodeValue=t;n++;}}stats.relabels=(stats.relabels||0)+n;return n;}
// P 창 등(영웅 선택창은 라우렌 칸이 따로 있으므로 무대만 mark 에서 바꾼다)
function relabelPanel(){if(!hasDoc()||!formActive())return;const panel=document.getElementById('panel');if(!panel||typeof panel.querySelector!=='function'||panel.querySelector('[data-hero]'))return;relabelIn(panel);}
let panelObs=null;function watchPanel(){if(panelObs||!hasDoc()||typeof MutationObserver!=='function')return;const panel=document.getElementById('panel');if(!panel)return;
 try{panelObs=new MutationObserver(()=>{try{relabelPanel();}catch(e){fail(e);}});panelObs.observe(panel,{childList:true,subtree:true,characterData:true});}catch(e){fail(e);}}
let hudOn=false;function hud(){const on=formActive();if(on){prewarm();hudSkin(true);hudOn=true;}else if(hudOn){hudSkin(false);hudOn=false;}}
let uiAt=0;
function ui(){if(!hasDoc())return;const t=Date.now();if(t<uiAt)return;uiAt=t+200;
 try{if(commit!=null&&!G(()=>loading,true)&&G(()=>started,false)){const p=pl();if(p){const on=commit&&p.hero===BASE;setForm(on);if(on&&typeof toast==='function')toast(PROFILE.title+' · 거울의 기술을 언주빛으로 씁니다.',4);}commit=null;want=false;}}catch(e){fail(e);}
 try{if(document.getElementById('panel')?.querySelector('[data-hero]')){css();inject();}}catch(e){fail(e);}
 try{hud();}catch(e){fail(e);}
 try{watchPanel();relabelPanel();}catch(e){fail(e);}
 try{if(formActive()){hudName();const pt=document.getElementById('portrait'),u=url(PROFILE.portrait);if(pt&&pt.getAttribute('src')!==u)pt.src=u;}}catch(e){fail(e);}}
function install(){registerGameHooks();wrapInst();wrapHud();wrapPfx();wrapHudDock();wrapToast();if(hasDoc()){try{document.addEventListener('click',onClick,true);}catch(e){fail(e);}}
 try{setInterval(()=>{try{wrapInst();wrapHud();wrapPfx();wrapHudDock();wrapToast();watch();ui();}catch(e){fail(e);}},250);}catch(e){fail(e);}}
install();
window.__STORYWORLD_PERSONA_HERO_R1113__=Object.freeze({revision:REV,profile:PROFILE,field:FIELD,base:BASE,tint:TINT,art:ART,walkSheets:WALK,idleSheets:IDLE,scale:SCALE,orb:ORB,dock:DOCK,ramp,rampPixels,relabel,celestialTone,celestialTones:CEL_TONE,celestialRamp:(tone,r,g,b)=>{const t=TONES[tone];if(!t)return null;const i=lum(r,g,b)*3;return [t.lut[i],t.lut[i+1],t.lut[i+2]];},celestialNames:Object.freeze(Object.fromEntries(Object.entries(CEL_NAMES).map(([k,v])=>[k,CEL_PREFIX+v]))),
 unlocked,unlock,formActive,setForm,process,watch,refresh:()=>{try{if(hasDoc()){css();inject();}}catch(e){fail(e);}try{hud();}catch(e){fail(e);}},
 lock(){saved={on:false,off:false};persist();},set(v){saved.off=v===false||v==='off';persist();return !saved.off;},
 images:()=>Object.fromEntries([...IM].map(([k,v])=>[k,v.state])),
 inspect:()=>({revision:REV,unlocked:unlocked(),saved:{...saved},form:formActive(),walk:+walk.w.toFixed(2),want,commit,stats:{...stats},lastError})});
})();

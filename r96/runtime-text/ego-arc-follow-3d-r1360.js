// R1360 EGO 각성 영웅 3D 기본 공격 — 칼이 실제로 지나간 길에 EGO 고유색 베기 궤적을 화려하게 얹는다.
//  · 사용자 11-27 06:23Z "ego각성영웅도 절도있게 칼날로 적을 화려하게 베는 느낌 있게 개선".
//  · 실측(헤드리스): 3D EGO 가 R1347 검술 여덟 동작으로 베어도, EGO 베기 그림(R1048 ego_slash → R1139b 가로 붓 궤적)은 2D 몸 자리 기준 한 방향으로만 나왔다.
//    흰 환도 반월(R1353)은 R1265(사용자 11-20)가 EGO 에게서 일부러 지운다 → EGO 는 환도와 다른 자기 그림으로 따로 맞춘다.
//  · 고침: 3D EGO 가 보이고 R1347 검술이 켜져 있을 때만 —
//    ① R1353 과 같은 방식으로 3D 장면을 그리는 순간 실제 칼끝(BladeTip) 화면 자리를 베기 구간(R1360 접힌 시간: strike-CUT ~ strike+HOLD)마다 기록한다.
//    ② 칼이 타격 순간을 지나면 그 길에 두 장을 맞춰 그린다(맞추기 계산은 R1353 pure.fit — 시작·끝·가장 먼 점에 그림의 칼자국 시작·끝·가운데를 맞춤):
//       가. 먹·언주 붓 궤적(Dots R1139b trail-horizontal, 6칸 — 먹선이 남고 흩어지는 여운) — 보통 합성, 반투명(.62).
//       나. 타격 섬광(Dots R1048 ego_slash, 6칸 — 언주·흰 깃 초승달) — 가산 합성, 앞 .12초만(.42) → 먹(검정)+언주(빨강)+흰 세 겹.
//       환도 반월(.22초)보다 여운이 길다(.34초): 붓 궤적 끝 칸(먹 흩어짐)이 남는다.
//    ③ 같은 때 2D 몸 자리 기준 고정 궤적(R1048 ':r1048s*' — R1139b 가 붓 궤적으로 바꿔 그림)은 그리지 않는다(둘 겹침 방지).
//  · 그림은 모두 Dots 프레임 시트(새 그림 파일 없음, 코드로 그린 선 없음). 판정·피해·범위·쿨다운·다른 영웅·2D EGO·3D 끔·검술 끔은 그대로.
//  · R350 영웅 가림: 칼 궤적이 영웅 몸을 감아 돌아 늘 .15 까지 깎이므로(R1353 실측) R1034·R1353 처럼 빼고(owner.r350) 세기를 직접 준다. 알파>12 자리만 잘라 그린다.
//  · 끄기: localStorage storyworld.r1360.egoArc=off. API window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__)return;
const REV='R1360-ego-arc-follow-1',KEY='storyworld.r1360.egoArc',ATK_SEC=.5,HERO='ego';
// 그림 칼자국(밝기·알파 가중 능선 실측, 칸 좌표): 시작 S → 끝 E, 가운데 M(줄에서 가장 먼 점).
const SHEETS=Object.freeze({
 trail:Object.freeze({path:'assets/r1139/ego/trail-horizontal.webp',cell:256,frames:6,stroke:Object.freeze({S:[28,133],E:[232,106],M:[110,152]}),crop:Object.freeze([19,92,225,78]),alpha:.62,blend:'source-over',show:.34}),
 flash:Object.freeze({path:'assets/r1048/fx/ego_slash.webp',cell:256,frames:6,stroke:Object.freeze({S:[198,52],E:[46,187],M:[158,157]}),crop:Object.freeze([40,41,176,173]),alpha:.42,blend:'lighter',show:.12})});
const SCALE=1.15;// 원래 크기: 영웅 키 1.15배 폭(칸 256 → 화면) — R1048 FX.slash size 3.4 칸 단위와 비슷하게
let on=true;try{on=localStorage.getItem(KEY)!=='off';}catch(_){}
const stats={revision:REV,seen:0,drawn:0,flash:0,hidden:0,fallback:0,mirrored:0,errors:0,last:null};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,240);};
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],len2=a=>Math.hypot(a[0],a[1]),cross=(a,b)=>a[0]*b[1]-a[1]*b[0],ang=a=>Math.atan2(a[1],a[0]);
const arcApi=()=>window.__STORYWORLD_HWANDO_ARC_FOLLOW_R1353__?.pure||null;
const comboApi=()=>window.__STORYWORLD_SWORD_COMBO_R1347__||null;
const host=()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three||null;
function shown(){const R=window.__STORYWORLD_HWANDO3D_R1302__;if(!R?.inspect)return false;let i;try{i=R.inspect();}catch(_){return false;}return !!(i&&i.shown&&i.hero===HERO);}
function replacing(){return on&&shown()&&!!comboApi()?.on?.()&&!!arcApi();}
// 칸 번호: 나이 → 칸(끝나면 -1)
function frameAt(age,dur,frames){if(!(age>=0)||age>dur)return -1;return Math.max(0,Math.min(frames-1,Math.floor(age/Math.max(1e-3,dur)*frames)));}
// 기록 구간(R1353 win 과 같은 규칙)
function win(mv){const W=arcApi()?.win;if(typeof W==='function')return W(comboApi()?.pure,mv);return [mv.windup,Math.min(1,mv.strike+.18)];}

// ── 3D 칼끝 기록 ──
let T=null,hookedScene=null,parts=null;
function rig(r){const g=r.scene.getObjectByName('r1305-'+HERO+'-3d-shared');if(!g||!g.visible)return null;
 if(!parts||parts.g!==g){const m=g.getObjectByName('r1305-'+HERO+'-3d-model'),w=g.getObjectByName('r1313-'+HERO+'-weapon');let tip=null;w?.traverse(o=>{if(!tip&&/^BladeTip/.test(o.name||''))tip=o;});if(!m||!tip)return null;parts={g,m,tip};}return parts;}
const swings=[];const MAX_SWINGS=4;
function record(){if(!on)return;const r=host(),api=comboApi();if(!r?.scene||!r.camera||!shown()||!api?.on?.())return;T=r.T||T;if(!T)return;
 const last=api.inspect?.().last?.[HERO];if(!last||!(last.w>0)||!last.move||!fin(last.t))return;const q=rig(r);if(!q)return;
 const el=r.renderer?.domElement,cw=el?.clientWidth||el?.width,ch=el?.clientHeight||el?.height;if(!(cw>0&&ch>0))return;
 const P2=v=>{const p=v.project(r.camera);return [(p.x+1)/2*cw,(1-p.y)/2*ch];},f0=P2(q.m.getWorldPosition(new T.Vector3())),tp=P2(q.tip.getWorldPosition(new T.Vector3()));
 if(![...f0,...tp].every(fin))return;const now=typeof time==='number'?time:0;
 let s=swings[swings.length-1];
 if(!s||s.idx!==last.idx||last.t<s.lastT-.05||now-s.t0>ATK_SEC*1.2){const mv=api.pure?.MOVES?.[last.idx];if(!mv)return;const W=win(mv);
  s={idx:last.idx,move:mv.id,strike:mv.strike,lo:W[0],hi:W[1],t0:now-last.t*ATK_SEC,pts:[],lastT:last.t,shownAt:null};swings.push(s);if(swings.length>MAX_SWINGS)swings.shift();stats.seen++;}
 s.lastT=last.t;if(last.t>=s.lo-.02&&last.t<=s.hi+.02)s.pts.push({t:last.t,rel:[tp[0]-f0[0],tp[1]-f0[1]]});}
function hookScene(){const r=host();if(!r?.scene||r.scene===hookedScene)return;const c=comboApi()?.inspect?.();if(!c||!(c.hooks>0))return;
 const sc=r.scene,prev=sc.onAfterRender;sc.onAfterRender=function(...a){try{record();}catch(e){fail(e);}return prev?.apply(this,a);};hookedScene=sc;}

// ── 그리기 ──
const SENT={type:'r1360-ego-arc',x:0,y:0,age:0,life:Infinity,r1360Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function pathOf(s){const pts=s.pts.filter(p=>p.t>=s.lo-.02&&p.t<=s.hi+.02);return pts.length>=3?pts.map(p=>p.rel):null;}
function layer(sh,f,fr,meta,ga){const im=typeof readyImage==='function'?readyImage(sh.path)?.image:null;if(!im)return false;
 const run=()=>{ctx.save();try{ctx.globalCompositeOperation=sh.blend;ctx.globalAlpha=(fin(ctx.globalAlpha)?ctx.globalAlpha:1)*ga;ctx.translate(f.A[0],f.A[1]);ctx.rotate(f.rot);ctx.scale(f.k,f.mirror?-f.k:f.k);ctx.rotate(-f.phi);ctx.translate(-f.S[0],-f.S[1]);
  const [cx,cy,cw,ch]=sh.crop;ctx.drawImage(im,fr*sh.cell+cx,cy,cw,ch,cx,cy,cw,ch);}finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope(meta,run);else run();return true;}
function drawOne(s,now){const A0=arcApi();if(!A0)return;
 if(s.shownAt==null){if(!(s.lastT>=s.strike))return;s.shownAt=now;}const age=now-s.shownAt;if(age>SHEETS.trail.show)return;
 const rel=pathOf(s);if(!rel)return;const b=typeof project==='function'&&typeof player==='object'&&player?project(player.x,player.y):null;if(!b)return;
 const path=rel.map(p=>[b.x+p[0],b.y+p[1]]),A=path[0],B=path[path.length-1];let P=path[path.length>>1],best=-1;
 let area=0;for(const q of path)area+=cross(sub(B,A),sub(q,A));const sg=area<0?-1:1;for(const q of path){const dd=sg*cross(sub(B,A),sub(q,A));if(dd>best){best=dd;P=q;}}
 const ah=typeof actorHeight==='function'?actorHeight():66,d0=sub(path[Math.min(path.length-1,2)],A),dir0=len2(d0)>.5?ang(d0):0;
 const meta=k=>({id:'r1360:ego-arc:'+k+':'+s.t0.toFixed(4),kind:'effect',x:typeof player==='object'?player.x:0,y:typeof player==='object'?player.y:0,r1360:true,r350:true,sourcePath:SHEETS[k].path});
 let f=null;
 for(const k of ['trail','flash']){const sh=SHEETS[k],fr=frameAt(age,sh.show,sh.frames);if(fr<0)continue;const st=sh.stroke,L0=len2(sub(st.E,st.S)),base=(fin(ah)&&ah>0?ah:66)*SCALE/L0;
  const fk=A0.fit(A,B,P,base,dir0,st);if(layer(sh,fk,fr,meta(k),sh.alpha)){if(k==='trail'){f=fk;stats.drawn++;}else stats.flash++;}}
 if(f){if(f.short)stats.fallback++;if(f.mirror)stats.mirrored++;stats.last={move:s.move,idx:s.idx,age:+age.toFixed(3),points:path.length,rot:+(f.rot*180/Math.PI).toFixed(1),mirror:f.mirror,short:f.short,A:A.map(x=>+x.toFixed(1)),B:B.map(x=>+x.toFixed(1))};}}
function drawAll(){if(typeof ctx==='undefined'||!ctx)return;const now=typeof time==='number'?time:0;for(const s of swings)try{drawOne(s,now);}catch(e){fail(e);}}
// ③ 2D 몸 자리 고정 궤적 끄기: R1048 이 drawHero 안에서 붙이는 ':r1048s<n>' 명령(R1139b 가 붓 궤적으로 바꾸는 것) — 3D EGO·검술일 때만.
const SLASH_KEY=/:r1048s\d+$/;
if(typeof drawHero==='function'){const baseDH=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=baseDH.apply(this,a);
 try{if(st>=0&&replacing()){const C=rec.commands;for(let i=st;i<C.length;i++){const c=C[i];if(c&&SLASH_KEY.test(String(c.key||''))&&+(c.style?.globalAlpha??1)>0){c.style={...(c.style||{}),globalAlpha:0};stats.hidden++;}}}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const baseDE=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r1360-ego-arc'){if(on)drawAll();return;}return baseDE.apply(this,[e,...a]);};}
if(typeof tick==='function'){const baseT=tick;tick=function(...a){const r=baseT.apply(this,a);try{hookScene();const now=typeof time==='number'?time:0;
  for(let i=swings.length-1;i>=0;i--){const s=swings[i];if(now-s.t0>2||now<s.t0-1)swings.splice(i,1);}
  if(on&&swings.some(s=>s.shownAt==null||now-s.shownAt<=SHEETS.trail.show))arm();else disarm();}catch(e){fail(e);}return r;};}
setInterval(()=>{try{hookScene();}catch(e){fail(e);}},400);
window.__STORYWORLD_EGO_ARC_FOLLOW_R1360__=Object.freeze({revision:REV,on:()=>on,
 set:v=>{on=!!v;try{localStorage.setItem(KEY,on?'on':'off');}catch(_){}return on;},
 pure:Object.freeze({SHEETS,SCALE,frameAt}),
 inspect:()=>({...stats,on,lastError,replacing:replacing(),swings:swings.map(s=>({move:s.move,t0:+s.t0.toFixed(3),pts:s.pts.length,lastT:+s.lastT.toFixed(2),shown:s.shownAt!=null}))})});
})();

// R161 — 사몽 맵에 스토리 몹이 그대로 다시 나오던 문제(사용자 2026-10-31 "스토리모드에서 사용하던 몹들이 사몽맵에 재등장하는 버그 … 재등장하지 않게,
//  마땅한 자산이 없으면 '영웅의 꼭두각시 자아', '세뇌당한 기억의 조각' 조형물과 '피로 얼룩진 기억 타일' + 구글드라이브 쓸만한 자산 적용").
//  원인: 사몽 구역(R103·R115)은 에피소드마다 STORY 지역의 몹을 '기증자'(EP.mobs [지역, 몹 id])로 빌려 와 그 그림 그대로 만든다.
//  · 꼭두각시 자아: 사몽 구역의 일반 몹 중 사몽 전용 그림(R105 학생·종이 형상)이 없는 몹은 몸 그림을 빼고, 드라이브 '영웅의 꼭두각시 자아'
//    걷기 8프레임(오른쪽, 왼쪽은 반전)으로 그린다. 그림자·체력바·이름·판정·체력·피해·스킬·저장은 그대로(보이는 것만).
//    보스·중간보스·페르소나 급과 사몽 전용 그림이 있는 몹은 건드리지 않는다. 걷기 한 동작뿐이라 공격·피격은 같은 걷기 칸 + 번쩍임으로 보인다.
//  · 세뇌당한 기억의 조각: 사몽 구역마다 통로를 막지 않는 장식 조형물 하나를 길에서 떨어진, 단서 기록 곁의 트인 바닥에 둔다(R169, 예전 2개).
//  · 피로 얼룩진 기억 타일: world-tiles-r118.js 에서 전용 바닥이 없는 사몽 구역의 바닥 텍스처로 쓴다.
//  자산 출처(드라이브, 읽기 전용 원본 보존): Samong-Hero-Puppet-Ego RUNTIME(시트 sha256 bb64255c…), Samong-Memory-Fallback PART01(조형물 f1a9c0a9…),
//  PART02+03(타일 두 조각 합본 f480fb72…). 세 자산 모두 전달 문서상 '사몽 및 그 이후 맵 전용, 적합한 기존 자산이 없을 때만'의 조건부 후보다.
//  · R167(사용자 2026-10-31 "꼭두각시 자아 공격에 뒤로 한 번 갔다가 앞 칼로 찌르는 모션, 찔리면 피 폭발, 피를 이용한 공격, 육망성 피·피가시 비석·피 운석 —
//    중간보스 스킬"): 공격 예고 동안 뒤로 물러났다가(0.35칸) 공격 순간 영웅 쪽으로 칼끝을 앞세워 찌른다(0.8칸, 앞으로 기울임) — 그림 위치만 움직이고
//    판정 자리는 그대로. 찔린 순간 영웅 자리에 피 폭발. B 광장 중간보스도 꼭두각시로 그리고 5.5초마다 ① 발밑 피의 육망성(1.3초 뒤 터짐)
//    ② 영웅 쪽으로 줄지어 솟는 피가시 비석 ③ 피 운석 셋을 돌아가며 쓴다(모두 예고 표시 뒤 판정, 피해는 중간보스 피해 기준).
//  설정 키 storyworld.r161.samong {puppet,sculpture}. 협동 모드에서는 쉰다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_R161__)return;
const REV='R161-samong-1',KEY='storyworld.r161.samong';
const PUPPET='assets/r161/puppet/puppet-ego-walk-right-8.webp',SCULPT='assets/r161/sculpture/memory-fragment.webp';
/* R184: S-06 디스토피아는 원문 외형대로 그린 임시 픽셀 시트(같은 칸 규격 256×320, 4×2 걷기 8프레임)를 꼭두각시 대신 쓴다 — 좋은 자산이 오면 이 표만 바꾼다 */
/* R1177: 임시 픽셀 시트(assets/r184/s06, 보존) 대신 Dots 디스토피아 칠한 그림을 같은 칸 규격으로 옮긴 시트(scripts/r1177-samong-pixel-art.py) */
const S06='assets/r1177/',S06ART={invader:S06+'s06-invader-walk-right-8.webp',rival:S06+'s06-rival-dots-walk-right-8.webp',commander:S06+'s06-commander-dots-walk-right-8.webp'},
 S06MOT={[S06+'s06-rival-dots-walk-right-8.webp']:{attack:S06+'s06-rival-dots-attack-8.webp',hit:S06+'s06-rival-dots-hit-4.webp',death:S06+'s06-rival-dots-death-8.webp'},
  [S06+'s06-commander-dots-walk-right-8.webp']:{attack:S06+'s06-commander-dots-attack-8.webp',hit:S06+'s06-commander-dots-hit-4.webp',death:S06+'s06-commander-dots-death-8.webp'}},
 SHEETS=new Set([PUPPET,...Object.values(S06ART),...Object.values(S06MOT).flatMap(v=>Object.values(v))]);
// R1177b: 상대 초인(DYS-03)·지휘 개체/기체(DYS-06·DYS-10 공용)는 Dots CX-0156SP(ROUGH r1, scripts/r1177b-dys-sheets.py 로 칸 규격·불투명·채도 손질) 걷기 + 공격·피격(·사망) 시트.
//  공격은 예고~회복 동안 공격 칸을 차례로, 피격은 번쩍임이 켜진 순간부터 0.32초 피격 칸, 사망 시트가 있으면 0.8초 동안 무너짐→잿빛 연기(15세: 피 없음). 시트가 아직 안 읽혔으면 예전처럼 걷기 칸.
//  지휘 개체 시트는 칸 320x320 발 160,300(GEO 표). R1177 임시본(s06-rival/commander-walk-right-8)·R184 원본은 보존.
function sheetFor(e){try{const x=typeof room==='object'?room?.samongR103:null;if(!x||!(x.key==='S-06'||/^sz115-S06-/.test(String(x.zone||''))))return PUPPET;const n=String(e?.name||'');
 if(/상대 초인/.test(n))return S06ART.rival;if(/지휘 (개체|기체)/.test(n))return S06ART.commander;if(/검은 명령선/.test(n))return PUPPET;return S06ART.invader;}catch(_){return PUPPET;}}
// 시트 1024×640, 4열×2행, 칸 256×320. 발 기준점(칸 안) 101.8,299.5, 몸 키 214.5px(실 제외, 원본 429px의 절반).
const CW=256,CH=320,PX=101.8,PY=299.5,BODY=214.5,FPS=8;
const GEO_DEF=Object.freeze({cw:CW,ch:CH,px:PX,py:PY,s:1}),GEO_CMD=Object.freeze({cw:320,ch:320,px:160,py:300,s:1.15}),geoOf=p=>/s06-commander-dots-/.test(String(p))?GEO_CMD:GEO_DEF;
let prefs={puppet:true,sculpture:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={puppetDraws:0,skippedArt:0,skippedMajor:0,waits:0,sculptures:0,rooms:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const samongRoom=()=>typeof room==='object'&&!!room?.samongR103;
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
function hasSamongArt(e){try{return !!window.__STORYWORLD_DRIVE_ART_R105__?.artFor?.(e);}catch(_){return false;}}
// R177: 사몽 그림이 없는 보스·대면 상대(예: 교주의 인장)도 스토리 모드 그림을 다시 쓰지 않고 꼭두각시 자아로(보스는 더 크고 짙게).
// R389: R380 승인 시트가 정해진 몹(사몽 S-07 '페르소나' 보스 = 지금 영웅의 페르소나)은 꼭두각시로 덮지 않음.
function hasApproved(e){try{return !!window.__STORYWORLD_APPROVED_MOBS_R380__?.assign?.(e);}catch(_){return false;}}
const puppetOf=e=>prefs.puppet&&solo()&&samongRoom()&&!!e?.samongR103&&!e.r170Tower&&!hasSamongArt(e)&&!e.r200Shade&&!hasApproved(e)/* R200: 잔영 그림이 정해진 몹은 꼭두각시로 덮지 않음 */&&!faceR1098(e)&&!nameSheet(e)&&!dotsR1394(e);
/* R1394: Dots 사몽 전용 그림이 온 몹(이름 표)은 꼭두각시로 덮지 않는다 — 엔진 몸 그림을 R1377 이 그 시트로 바꿔 그린다 */
function dotsR1394(e){try{return !!window.__STORYWORLD_SAMONG_ART_R1394__?.covers?.(e);}catch(_){return false;}}
// R1206(사용자 2026-11-19 "망토 셋 … 사몽 에피소드에 이런 몹 많던데 개선"): R248 이름 시트(R290·R410 손그림 포함)로 그리는 몹은 꼭두각시로 덮지 않는다.
//  R248 이 바깥에서 엔진 몸 그림만 가리고 이름 시트를 그리는데, 안쪽 이 파일의 꼭두각시는 가려지지 않아 한 몹에 그림 두 장(예: 뿌리에서 쏟아진 잔영 = m063 + 실 인형)이 겹쳤다.
function nameSheet(e){try{return !!window.__STORYWORLD_MOB_UNIQUE_R248__?.covers?.(e);}catch(_){return false;}}
// R1098: 사몽 최종 보스 미카엘라는 미카엘라 본인 시트(samong-face-r1098.js)로 그린다 — 꼭두각시로 덮지 않음.
function faceR1098(e){try{return !!window.__STORYWORLD_SAMONG_FACE_R1098__?.covers?.(e);}catch(_){return false;}}

// ---- 꼭두각시 자아 -------------------------------------------------------------------------
let hiding=null;
if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){if(hiding&&typeof p==='string'&&!SHEETS.has(p))return null;return base.call(this,p,...a);};}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function shapeOf(e){const sh=e.attack?.shape154||e.combatProfile?.attackShape||{};return{w:e.attack?.castWindup150??(sh.windup??.45),a:sh.active??.15,r:sh.recovery??.35,range:sh.range??1.2};}
function lunge(e){const A=e.attack;if(!A||!Number.isFinite(A.elapsed)||!Number.isFinite(A.angle))return null;const S=shapeOf(e),t=A.elapsed;
 if(t<S.w){const u=smooth(t/Math.max(.01,S.w));return{angle:A.angle,d:-.35*u,lean:-.06*u};}
 if(t<S.w+S.a){const u=smooth((t-S.w)/Math.max(.01,S.a));return{angle:A.angle,d:-.35+1.15*u,lean:.14*u};}
 const u=smooth((t-S.w-S.a)/Math.max(.01,S.r));return{angle:A.angle,d:.8*(1-u),lean:.14*(1-u)};}
// ---- 피: 찔림 피 폭발, 중간보스 스킬(육망성·피가시 비석·피 운석) -----------------------------------------
const BLOOD={a:[120,10,22],b:[255,90,90]},DARK={a:[40,4,10],b:[120,20,30]};
const PFX=()=>{const x=window.__STORYWORLD_PIXELFX_R163__;return x&&x.ready&&x.ready()?x:null;};
const SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const bfx=[],BSENT={type:'r167-blood',x:0,y:0,age:0,life:Infinity};
function barm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(BSENT)){BSENT.age=0;effects.push(BSENT);}}catch(_){}}
function addFx(o){bfx.push({t0:T(),seed:Math.random()*6,...o});if(bfx.length>40)bfx.shift();barm();}
function field(owner,x,y,r,warn,life,dmg,kind){if(typeof hazards==='undefined'||typeof blocked==='function'&&blocked(x,y,.1,room))return;hazards.push({id:++uid,type:'field',owner,x,y,radius:r,age:0,warning:warn,life:warn+life,asset:typeof VFX!=='undefined'?VFX.mark:null,damage:dmg,lastHit:-99,samongPattern:kind});}
function bloodBurst(x,y,big){addFx({kind:'burst',x,y,life:.6,big:!!big});try{PFX()?.play('dark-explosion-blood',x,y,{k:big?.9:.45,rate:1.8});}catch(_){}stats.bursts=(stats.bursts||0)+1;}
function midSkill(e){const S2=e.r167||(e.r167={next:T()+2.5,n:0});if(T()<S2.next||!(e.hp>0)||e.spawnState==='dead')return;S2.next=T()+5.5;const kind=['hex','spikes','meteor'][S2.n++%3],dmg=(e.damage||12)*1.1;stats.midSkills=(stats.midSkills||0)+1;
 if(kind==='hex'){const c={x:player.x,y:player.y};field(e.id,c.x,c.y,2.3,1.3,.45,dmg,'puppet-hex');addFx({kind:'hex',x:c.x,y:c.y,life:1.75,warn:1.3});try{PFX()?.play('dark-explosion-blood',c.x,c.y,{delay:1.3,k:1.1,rate:1.4});}catch(_){}}
 else if(kind==='spikes'){const a=Math.atan2(player.y-e.y,player.x-e.x);for(let i=0;i<7;i++){const d=1+i*.95,x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d,w=.55+i*.11;field(e.id,x,y,.75,w,.55,dmg*.8,'puppet-spike');addFx({kind:'spike',x,y,life:w+.9,warn:w});}}
 else{for(let k=0;k<3;k++){const r=Math.random()*2.4,a=Math.random()*Math.PI*2,x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r,w=1+k*.3;field(e.id,x,y,1.2,w,.5,dmg,'puppet-meteor');addFx({kind:'meteor',x,y,life:w+.7,warn:w});try{PFX()?.play('dark-explosion-blood',x,y,{delay:w,k:.75,rate:1.6});}catch(_){}}}
 try{if(typeof toast==='function'&&S2.n<=3)toast({hex:'피의 육망성',spikes:'피가시 비석',meteor:'피 운석'}[kind]+' · '+(e.name||'중간보스'),2);}catch(_){}}
function bloodTick(){if(!prefs.puppet||!solo()||!samongRoom())return;for(const e of room.enemies||[]){if(!(e.hp>0)||!puppetOf(e))continue;const m=e.r161;
  const A=e.attack;if(A&&A.committed&&m&&m.hitId!==A.id){m.hitId=A.id;const S=shapeOf(e);if(typeof player==='object'&&player&&Math.hypot(player.x-e.x,player.y-e.y)<=S.range+.55&&!(player.invincible>0))bloodBurst(player.x,player.y,false);}
  if(e.samongMidR162)midSkill(e);}}
function hexagram(cx,cy,R,a,spin){ctx.strokeStyle='rgba(200,24,40,'+a+')';ctx.lineWidth=2;ctx.shadowColor='rgba(255,40,50,.9)';ctx.shadowBlur=6;
 for(const off of [0,Math.PI]){ctx.beginPath();for(let i=0;i<=3;i++){const t=off+spin+i*Math.PI*2/3,x=cx+Math.cos(t)*R,y=cy+Math.sin(t)*R*.5;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}
 ctx.beginPath();for(let i=0;i<=48;i++){const t=i/48*Math.PI*2,x=cx+Math.cos(t)*R*1.08,y=cy+Math.sin(t)*R*.54;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();ctx.shadowBlur=0;}
function drawBlood(){if(typeof ctx==='undefined'||!ctx||typeof project!=='function')return;const S=SPR(),h=typeof actorHeight==='function'?actorHeight():60,t0=T(),TILE_=typeof TILE==='number'?TILE:64,z=typeof zoom==='number'?zoom:1;
 for(const f of bfx){const t=t0-f.t0;if(t<0||t>f.life)continue;const q=project(f.x,f.y);ctx.save();try{const run=()=>{
  const PX=window.__STORYWORLD_PIXELFX_R163__;// R176: 프레임 애니메이션 시트가 있으면 한 장짜리 그림 늘이기 대신 시트를 한 번 재생
  if(f.kind==='burst'&&PX?.has?.('dark-explosion-blood')){if(!f.px){f.px=true;PX.play('dark-explosion-blood',f.x,f.y,{k:.55,rate:1.3});}}
  else if(f.kind==='burst'){const v=t/f.life;if(S){S.draw('flare',BLOOD,q.x,q.y-h*.45,h*(.6+.8*v),h*(.6+.8*v),{alpha:1-v});for(let i=0;i<8;i++){const a=f.seed+i*.785,d=h*(.15+.7*v);S.draw('spark',BLOOD,q.x+Math.cos(a)*d,q.y-h*.45+Math.sin(a)*d*.6+h*.4*v*v,h*.3,h*.07,{angle:a,alpha:1-v});}S.draw('smoke',DARK,q.x,q.y-h*.3,h*(.5+.6*v),h*(.4+.4*v),{blend:'source-over',alpha:.5*(1-v),angle:f.seed});}}
  else if(f.kind==='hex'){const R=2.3*TILE_*z,u=Math.min(1,t/f.warn),a=t<f.warn?.35+.55*u:Math.max(0,1-(t-f.warn)/.45);hexagram(q.x,q.y,R*(.6+.4*u),a,t*.8);if(S&&t<f.warn)S.draw('glow',BLOOD,q.x,q.y,R*1.6,R*.8,{alpha:.25*u});}
  else if(f.kind==='spike'){if(t<f.warn){if(S)S.draw('crack',BLOOD,q.x,q.y,h*.9,h*.9,{squash:.5,angle:f.seed,alpha:.8*t/f.warn});}else if(PX?.has?.('mob-stone')){if(!f.px){f.px=true;PX.play('mob-stone',f.x,f.y,{k:.9,rate:1.25,tint:BLOOD,flip:f.seed>3});}}else{const v=t-f.warn,rise=Math.min(1,v/.12),fade=Math.max(0,1-(v-.5)/.4);if(S){S.draw('spike',BLOOD,q.x,q.y,h*.42,h*1.25*rise,{alpha:.95*fade});S.draw('spike',DARK,q.x+h*.12,q.y+2,h*.3,h*.8*rise,{alpha:.85*fade});S.draw('ring',BLOOD,q.x,q.y,h*(.5+v*2),h*(.25+v),{alpha:Math.max(0,1-v/.3)});}}}
  else if(f.kind==='meteor'){if(t<f.warn){const v=(t/f.warn)**2,sx=q.x+h*3,sy=q.y-h*7,mx=sx+(q.x-sx)*v,my=sy+(q.y-sy)*v;if(S){S.draw('rune',BLOOD,/* R341 */q.x,q.y,h*1.6,h*1.6,{squash:.5,angle:t,alpha:.6});S.along('slashline',BLOOD,sx+(mx-sx)*.6,sy+(my-sy)*.6,mx,my,h*.6,{alpha:.85});S.draw('orb',BLOOD,mx,my,h*.6,h*.6,{alpha:1});S.draw('glow',BLOOD,mx,my,h*1.1,h*1.1,{alpha:.8});}}}
  };if(typeof ctx.scope==='function')ctx.scope({id:'r167:'+f.kind+':'+f.t0+':'+f.seed,kind:'effect',x:f.x,y:f.y},run);else run();}catch(err){fail(err);}finally{ctx.restore();}}}
function drawPuppet(e,im,key){const dead=e.hp<=0||e.spawnState==='dead',age=T()-(Number.isFinite(e.deadAt)?e.deadAt:T());if(dead&&age>.8)return;
 const q=project(e.x,e.y),cp=e.combatProfile,size=(typeof actorHeight==='function'?actorHeight():60)*(cp?.spriteRect?.height||1)*(e.defScale||1),k=size/BODY,lift=Math.max(0,Math.min(size*.65,Number(e.visualLiftPx)||0));
 const m=e.r161||(e.r161={x:e.x,y:e.y,moving:0,face:1,seed:Math.random()*8});const dx=e.x-m.x,dy=e.y-m.y,sp=Math.hypot(dx,dy);
 if(sp>.002){m.moving=T()+.25;const sx=(dx-dy);if(Math.abs(sx)>.001)m.face=sx<0?-1:1;}else if(typeof player==='object'&&player){const s=(player.x-player.y)-(e.x-e.y);if(Math.abs(s)>.05&&T()>m.moving)m.face=s<0?-1:1;}
 m.x=e.x;m.y=e.y;{const r444=window.__STORYWORLD_ENEMY_FACE_R444__?.left?.(e);if(typeof r444==='boolean')m.face=r444?-1:1;}/* R444: 걸음 떨림 없이 한 곳에서 */
 // R167: 찌르기 — 예고 동안 뒤로(-0.35칸), 공격 구간에 앞으로(+0.8칸), 회복 동안 제자리로. 판정 자리(e.x,e.y)는 그대로.
 const L=lunge(e);let ox=0,oy=0,lean=0,fr;
 if(L){const q2=project(e.x+Math.cos(L.angle)*L.d,e.y+Math.sin(L.angle)*L.d);ox=q2.x-q.x;oy=q2.y-q.y;const s=Math.cos(L.angle)-Math.sin(L.angle);if(Math.abs(s)>.05)m.face=s<0?-1:1;lean=L.lean;fr=L.d<0?1:5;}
 else{const walking=T()<m.moving||e.state==='attack'||e.state==='windup';fr=walking?Math.floor(T()*FPS+m.seed)%8:0;}
 // R1177b: 동작 시트(공격·피격·사망) — 있고 읽혔을 때만
 const M=S06MOT[key],g=geoOf(key);let sheet=im,ash=false;const fl=Number(e.flash)>0;if(fl&&!m.flashOn)m.hitT=T();m.flashOn=fl;
 if(M){let alt=null,f2=0;
  if(dead&&M.death){alt=image(M.death);f2=Math.min(7,Math.max(0,Math.floor(age/.8*8)));ash=!!alt;}
  else if(!dead&&L&&M.attack){const S=shapeOf(e),tot=Math.max(.05,S.w+S.a+S.r),u=Math.max(0,Math.min(.999,(e.attack.elapsed||0)/tot));alt=image(M.attack);f2=Math.floor(u*8);if(alt)lean=0;}
  else if(!dead&&M.hit&&Number.isFinite(m.hitT)&&T()-m.hitT>=0&&T()-m.hitT<.32){alt=image(M.hit);f2=Math.min(3,Math.floor((T()-m.hitT)/.08));}
  if(alt){sheet=alt;fr=f2;}}
 if(!Number.isFinite(fr))fr=0;const sx0=(fr%4)*g.cw,sy0=Math.floor(fr/4)*g.ch;
 ctx.save();try{ctx.globalAlpha*=dead?(ash?Math.max(0,Math.min(1,(.8-age)/.15)):Math.max(0,1-age/.8)):1;const big=major(e)&&!e.samongMidR162;/* R181: drop-shadow 필터는 3D 그리기(Three.js 기록기)가 받지 않아 큰 꼭두각시(앞장 보스·대면 보스)가 나오면 'Three.js 실행 실패'로 화면이 꺼졌다(불탄 거리·북부 방어선)
     → 지원되는 필터(밝기·대비·채도)만 쓰고, 붉은 기운은 발밑 R106 glow 조각으로 따로 그린다 */
  if(big&&!(e.flash>0)){const S=window.__STORYWORLD_FX_SPRITES_R106__;if(S?.on?.())S.draw('glow',{a:[120,0,18],b:[200,20,40]},q.x+ox,q.y-lift+oy-CH*k*.35,CW*k*1.15,CH*k*.9,{alpha:.55,blend:'source-over'});}
  ctx.filter=e.flash>0?'brightness(1.8) saturate(.5)':big?'saturate(.75) contrast(1.18) brightness(.82)':'saturate(.92) contrast(1.05)';
  ctx.translate(q.x+ox,q.y-lift+oy);if(lean)ctx.rotate(lean*m.face);const kb=(big&&!(e.defScale>1.2)?k*1.25:k)*g.s;ctx.scale(m.face*kb,kb);ctx.drawImage(sheet,sx0,sy0,g.cw,g.ch,-g.px,-g.py,g.cw,g.ch);}finally{ctx.restore();}
 /* R1206: 죽음 연출(R462)이 가려진 엔진 몸(다른 몹 그림) 대신 이 꼭두각시 칸을 쓰게 남긴다(걷기 시트 경로 — 구운 그림은 같은 경로로 나옴) */if(!dead)try{const kb=(big0(e)&&!(e.defScale>1.2)?k*1.25:k)*g.s;e.r1206Look={path:key,frame:{assetFrame:{sourceRect:[sx0,sy0,g.cw,g.ch],pivot:[g.px,g.py],visibleHeight:BODY}},flip:m.face<0,h:BODY*kb};}catch(_){}
 stats.puppetDraws++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let im=null;
 let key=null;try{if(puppetOf(e)){im=image(sheetFor(e));key=sheetFor(e);if(!im)stats.waits++;}else if(e?.samongR103&&samongRoom()){if(major(e))stats.skippedMajor++;else stats.skippedArt++;}}catch(err){fail(err);im=null;}
 if(!im)return base.apply(this,[e,...a]);
 hiding=e;let r;try{r=base.apply(this,[e,...a]);}finally{hiding=null;}
 try{scopeDraw(e,()=>drawPuppet(e,im,key));}catch(err){fail(err);}return r;};}
const big0=e=>major(e)&&!e.samongMidR162;
function scopeDraw(e,f){if(typeof ctx.scope==='function')ctx.scope({id:'r161:puppet:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}

// ---- 세뇌당한 기억의 조각 --------------------------------------------------------------------
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function dress(){if(!prefs.sculpture||!solo()||!samongRoom())return;const r=room,L=r.exploration,key=r.samongR103.key||r.samongR103.zone||'';if(!L||r.r161Dressed===key)return;
 r.r161Dressed=key;stats.rooms++;const cells=(L.floorCells||[]).slice();if(!cells.length)return;
 const avoid=[L.entry,r.objective,L.samongR103?.exit,L.samongR103?.dais,L.samongR103?.centre].filter(p=>p&&Number.isFinite(p.x)),props=r.props||(r.props=[]);
 // R169(사용자 "서사와 관련된 조형물만, 너무 남발하지 않아 길을 막지 않도록 미적 감각 동원"): 방마다 하나만, 입구→목표·출구 길에서 2.5칸 넘게 떨어진
 //  사방이 트인 자리에 두고, 단서 기록(record·단서)이 있으면 그 곁(약 2.4칸)에 세워 기록을 지키는 것처럼 보이게 한다.
 const path=window.__STORYWORLD_PLAY_R169__?.pathCells?.(r)||null,marks=props.filter(p=>p.samongR103==='record'||p.r115Clue),open=(x,y)=>typeof blocked!=='function'||!blocked(x,y,.3,r);
 const offPath=(x,y)=>{if(!path)return true;for(let dx=-3;dx<=3;dx++)for(let dy=-3;dy<=3;dy++)if(path.has((Math.floor(x)+dx)+','+(Math.floor(y)+dy))&&Math.hypot(Math.floor(x)+dx+.5-x,Math.floor(y)+dy+.5-y)<2.5)return false;return true;};
 let h=hash(key),n=0,best=null,bs=1e9;
 for(let t=0;t<260;t++){h=Math.imul(h^(h>>>13),0x5bd1e995)>>>0;const c=cells[h%cells.length],x=c[0]+.5,y=c[1]+.5;
  if(avoid.some(p=>Math.hypot(p.x-x,p.y-y)<4.5))continue;if(props.some(p=>Math.hypot(p.x-x,p.y-y)<2.2))continue;
  if([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].some(([a,b])=>!open(x+a,y+b)))continue;// 좁은 곳·벽에 붙은 곳은 피한다
  if(!offPath(x,y))continue;
  const d=marks.length?Math.min(...marks.map(m=>Math.hypot(m.x-x,m.y-y))):0,score=marks.length?Math.abs(d-2.4):t;if(score<bs){bs=score;best={x,y};}if(!marks.length)break;}
 if(best){props.push({id:'r161:sculpt:'+key+':0',path:SCULPT,x:best.x,y:best.y,height:118+(h%17),solid:false,autoTargetEligible6:false,visible:true,r80PresentationOnly:true,r161Sculpture:true,flip:!!(h&1)});n=1;stats.sculptures++;}
 if(n)image(SCULPT);}
// R1206(사용자 2026-11-19 "세뇌당한 기억의 조각은 각 맵당 1개체만"): 같은 방에 조각 적(R170 탑)이 서면 장식 조각은 그리지 않는다(한 맵에 조각 하나).
const towerHere=()=>{try{return (room?.enemies||[]).some(e=>e&&e.r170Tower);}catch(_){return false;}};
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r161Sculpture&&(!image(p.path)||(prefs.oneSculpture!==false&&towerHere()))){if(towerHere())stats.sculptHidden=(stats.sculptHidden||0)+1;return;}return base.apply(this,[p,...a]);};}
let next=0;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(T()>=next||T()<next-5){next=T()+.5;dress();}bloodTick();const t=T();for(let i=bfx.length-1;i>=0;i--)if(t-bfx[i].t0>bfx[i].life)bfx.splice(i,1);if(bfx.length)barm();else if(typeof effects!=='undefined'){const i=effects.indexOf(BSENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(ef,...a){if(ef&&ef.type==='r167-blood'){try{drawBlood();}catch(err){fail(err);}return;}return base.apply(this,[ef,...a]);};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);try{dress();if(samongRoom()){image(PUPPET);for(const v of SHEETS)if(v!==PUPPET)image(v);}}catch(e){fail(e);}return r;};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_R161__=Object.freeze({revision:REV,set,puppetOf,sheetFor,S06ART,S06MOT,geoOf,lunge,bloodBurst,_midSkill:midSkill,PUPPET,SCULPT,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:samongRoom()?{key:room.samongR103.key,dressed:room.r161Dressed||null,sculptures:(room.props||[]).filter(p=>p.r161Sculpture).length,puppets:(room.enemies||[]).filter(e=>e.hp>0&&puppetOf(e)).length,mobs:(room.enemies||[]).filter(e=>e.hp>0).length}:null})});
})();

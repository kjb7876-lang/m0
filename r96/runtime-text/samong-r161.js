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
// 시트 1024×640, 4열×2행, 칸 256×320. 발 기준점(칸 안) 101.8,299.5, 몸 키 214.5px(실 제외, 원본 429px의 절반).
const CW=256,CH=320,PX=101.8,PY=299.5,BODY=214.5,FPS=8;
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
const puppetOf=e=>prefs.puppet&&solo()&&samongRoom()&&!!e?.samongR103&&!e.r170Tower&&!hasSamongArt(e);

// ---- 꼭두각시 자아 -------------------------------------------------------------------------
let hiding=null;
if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){if(hiding&&typeof p==='string'&&p!==PUPPET)return null;return base.call(this,p,...a);};}
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
  else if(f.kind==='meteor'){if(t<f.warn){const v=(t/f.warn)**2,sx=q.x+h*3,sy=q.y-h*7,mx=sx+(q.x-sx)*v,my=sy+(q.y-sy)*v;if(S){S.draw('runecross',BLOOD,q.x,q.y,h*1.6,h*1.6,{squash:.5,angle:t,alpha:.6});S.along('slashline',BLOOD,sx+(mx-sx)*.6,sy+(my-sy)*.6,mx,my,h*.6,{alpha:.85});S.draw('orb',BLOOD,mx,my,h*.6,h*.6,{alpha:1});S.draw('glow',BLOOD,mx,my,h*1.1,h*1.1,{alpha:.8});}}}
  };if(typeof ctx.scope==='function')ctx.scope({id:'r167:'+f.kind+':'+f.t0+':'+f.seed,kind:'effect',x:f.x,y:f.y},run);else run();}catch(err){fail(err);}finally{ctx.restore();}}}
function drawPuppet(e,im){const dead=e.hp<=0||e.spawnState==='dead',age=T()-(Number.isFinite(e.deadAt)?e.deadAt:T());if(dead&&age>.8)return;
 const q=project(e.x,e.y),cp=e.combatProfile,size=(typeof actorHeight==='function'?actorHeight():60)*(cp?.spriteRect?.height||1)*(e.defScale||1),k=size/BODY,lift=Math.max(0,Math.min(size*.65,Number(e.visualLiftPx)||0));
 const m=e.r161||(e.r161={x:e.x,y:e.y,moving:0,face:1,seed:Math.random()*8});const dx=e.x-m.x,dy=e.y-m.y,sp=Math.hypot(dx,dy);
 if(sp>.002){m.moving=T()+.25;const sx=(dx-dy);if(Math.abs(sx)>.001)m.face=sx<0?-1:1;}else if(typeof player==='object'&&player){const s=(player.x-player.y)-(e.x-e.y);if(Math.abs(s)>.05&&T()>m.moving)m.face=s<0?-1:1;}
 m.x=e.x;m.y=e.y;
 // R167: 찌르기 — 예고 동안 뒤로(-0.35칸), 공격 구간에 앞으로(+0.8칸), 회복 동안 제자리로. 판정 자리(e.x,e.y)는 그대로.
 const L=lunge(e);let ox=0,oy=0,lean=0,fr;
 if(L){const q2=project(e.x+Math.cos(L.angle)*L.d,e.y+Math.sin(L.angle)*L.d);ox=q2.x-q.x;oy=q2.y-q.y;const s=Math.cos(L.angle)-Math.sin(L.angle);if(Math.abs(s)>.05)m.face=s<0?-1:1;lean=L.lean;fr=L.d<0?1:5;}
 else{const walking=T()<m.moving||e.state==='attack'||e.state==='windup';fr=walking?Math.floor(T()*FPS+m.seed)%8:0;}
 const sx0=(fr%4)*CW,sy0=Math.floor(fr/4)*CH;
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age/.8):1;const big=major(e)&&!e.samongMidR162;ctx.filter=e.flash>0?'brightness(1.8) saturate(.5)':big?'saturate(.75) contrast(1.18) brightness(.82) drop-shadow(0 0 7px rgba(170,0,24,.85))':'saturate(.92) contrast(1.05)';
  ctx.translate(q.x+ox,q.y-lift+oy);if(lean)ctx.rotate(lean*m.face);const kb=big&&!(e.defScale>1.2)?k*1.25:k;ctx.scale(m.face*kb,kb);ctx.drawImage(im,sx0,sy0,CW,CH,-PX,-PY,CW,CH);}finally{ctx.restore();}
 stats.puppetDraws++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let im=null;
 try{if(puppetOf(e)){im=image(PUPPET);if(!im)stats.waits++;}else if(e?.samongR103&&samongRoom()){if(major(e))stats.skippedMajor++;else stats.skippedArt++;}}catch(err){fail(err);im=null;}
 if(!im)return base.apply(this,[e,...a]);
 hiding=e;let r;try{r=base.apply(this,[e,...a]);}finally{hiding=null;}
 try{scopeDraw(e,()=>drawPuppet(e,im));}catch(err){fail(err);}return r;};}
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
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r161Sculpture&&!image(p.path))return;return base.apply(this,[p,...a]);};}
let next=0;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(T()>=next||T()<next-5){next=T()+.5;dress();}bloodTick();const t=T();for(let i=bfx.length-1;i>=0;i--)if(t-bfx[i].t0>bfx[i].life)bfx.splice(i,1);if(bfx.length)barm();else if(typeof effects!=='undefined'){const i=effects.indexOf(BSENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(ef,...a){if(ef&&ef.type==='r167-blood'){try{drawBlood();}catch(err){fail(err);}return;}return base.apply(this,[ef,...a]);};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);try{dress();if(samongRoom())image(PUPPET);}catch(e){fail(e);}return r;};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_R161__=Object.freeze({revision:REV,set,puppetOf,lunge,bloodBurst,_midSkill:midSkill,PUPPET,SCULPT,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:samongRoom()?{key:room.samongR103.key,dressed:room.r161Dressed||null,sculptures:(room.props||[]).filter(p=>p.r161Sculpture).length,puppets:(room.enemies||[]).filter(e=>e.hp>0&&puppetOf(e)).length,mobs:(room.enemies||[]).filter(e=>e.hp>0).length}:null})});
})();

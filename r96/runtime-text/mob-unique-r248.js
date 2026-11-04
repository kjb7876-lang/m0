// R248 몹 재활용 금지 — 사용자 2026-11-03 "사몽 666 b쪽맵에서 스토리모드 몹들이 나오는 문제 … 모든맵에서 몹재활용금지하고 몹이름에 맞게 나오고
//  서사에맞는 자산이 없으면 너가 픽셀스킬사용해서 몹임시생성후 향후 자산들어오면 그걸로 적용 … 신규몹생성시 공격이펙트도 적절하게 만들고
//  근접 원거리 촉수 위에서비석등물체낙하 할퀴기 물기 상태이상등 적절하게".
//  · 전수 조사(헤드리스, 모든 본편·사몽 구역에서 몹마다 실제로 그려지는 그림 파일): 다른 이름의 몹이 같은 그림을 쓰는 경우와, 사몽 몹이 본편 그림
//    (또는 사몽 공용 '꼭두각시 자아' 한 장)을 쓰는 경우를 찾았다. 그림마다 처음 나오는 이름 하나만 원래 그림을 지키고, 나머지 이름은
//    scripts/r248-mob-pixel-art.py 가 이름 낱말(거미·슬라임·안개·결정·기계·인형·뿌리·날개·칼날·가면…)로 몸 유형·색·머리·무기를 골라 그린
//    임시 픽셀 시트(걷기 8 + 공격 4프레임)로 그린다. 목록은 mob-unique-r248-data.js(이름 → 시트). 좋은 자산이 오면 그 이름 줄만 바꾼다.
//  · 이름 맞추기: '중간보스 · ' 앞말, ' 증원'·' 추격대'·' 후속 증원'·' · 짙은 형상' 뒷말, 끝 번호를 떼고 본다(같은 몹의 변형은 같은 그림).
//  · 그리기: 엔진 drawEnemy 를 그대로 부르되(그림자·체력바·이름) 몸 그림만 가린 뒤 이 시트를 그린다(R161 꼭두각시와 같은 방식). 판정·체력·피해·보상·저장은 그대로.
//  · 공격 이펙트·상태이상(이 시트로 그리는 몹만): 공격이 닿는 순간 영웅 자리에 유형별 그림 — 물기(네발·거미·뱀), 할퀴기(손톱), 베기(칼),
//    찌르기(바늘·창), 낙하(결정·역십자가·덩어리 → 위에서 비석·파편이 떨어져 꽂힘), 가시(뿌리), 실(인형), 감전(기계), 산(점액), 한기·독안개(망령·안개), 불(용).
//    상태이상은 엔진 둔화(heroSlowUntil150, 이동 0.62배)를 짧게(0.6~1.1초) — 수백 마리가 몰려도 4초에 한 번만, 영웅이 공격 거리 안일 때만.
//  · R290: 시트 줄에 path 가 있으면 그 경로를 쓴다(새 손그림 시트는 assets/r290/mobs/, 원래 임시 시트는 그대로 둔다).
//  · 혼자 플레이일 때만. 끄기: localStorage['storyworld.r248.mobs']='{"on":false}' (그림), '{"fx":false}' (공격 이펙트·상태이상)
(()=>{'use strict';
if(window.__STORYWORLD_MOB_UNIQUE_R248__)return;
const REV='R248-mobs-1',KEY='storyworld.r248.mobs',DATA=window.__STORYWORLD_MOB_UNIQUE_R248_DATA__||{byName:{},sheets:{},dir:'assets/r248/mobs/'};
let prefs={on:true,fx:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={draws:0,waits:0,fx:0,slows:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
const T=()=>typeof time==='number'?time:0,SPR=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s&&s.on&&s.on()?s:null;};
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const CW=256,CH=320,PX=128,PY=300,FPS=8;
function baseName(n){return String(n||'').replace(/^중간보스\s*·\s*/,'').replace(/\s*·\s*짙은 형상$/,'').replace(/\s*(후속 증원|증원|추격대)$/,'').replace(/\s+\d+$/,'').trim();}
const cache=new WeakMap();
const dream=e=>!!(e&&(e.samongR103||(typeof layer!=='undefined'&&layer==='DREAM')));
function sheetOf(e){if(!e)return null;let v=cache.get(e);if(v&&v.n===e.name&&v.k===e.r248Key)return v.s;const b=baseName(e.name);
 const id=(e.r248Key&&DATA.byName[e.r248Key])||(dream(e)&&DATA.byName['사몽:'+b])||DATA.byName[b]||null,s=id?DATA.sheets[id]||null:null;cache.set(e,{n:e.name,k:e.r248Key,s:s?{id,...s,path:s.path||DATA.dir+s.file}:null});return cache.get(e).s;}
// 사몽에 본편 몹 이름이 그대로 나온 몹(기증 몹 이름이 남은 것): 그 구역(없으면 그 장)의 사몽 몹 이름으로 바꾸고, 그림은 사몽 전용 새 시트로.
const STORY=new Set(DATA.storyNames||[]);
function samongName(){try{const x=room?.samongR103;if(!x)return null;const z=window.__STORYWORLD_SAMONG_ZONES_R115__?.zone?.(x.zone),E=window.__STORYWORLD_SAMONG_R103__?.episodes;const ep=Array.isArray(E)?E.find(r=>r&&r.key===x.key):E?.[x.key];const n=z?.mobName||ep?.mobName||null;return n&&!STORY.has(n)?n:null;}catch(err){fail(err);return null;}}
function renameStory(){if(!prefs.on||typeof room!=='object'||!room?.samongR103)return;let sn;for(const e of room.enemies||[]){if(!e||e.r248Named||!e.samongR103||e.r170Tower)continue;e.r248Named=true;const b=baseName(e.name);if(!STORY.has(b))continue;
  e.r248Key='사몽:'+b;if(sn===undefined)sn=samongName();if(sn&&!e.boss&&!e.persona){e.r248From=e.name;e.name=e.name.replace(b,sn);if(DATA.byName[sn])e.r248Key=sn;stats.renamed=(stats.renamed||0)+1;}}}/* 보스(정본 이름)만 이름을 지킨다 */
const SHEETS=new Set(Object.values(DATA.sheets||{}).map(s=>DATA.dir+s.file));
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---- 그리기 ---------------------------------------------------------------------------------
/* 엔진 그리기는 그대로 돌린다(그림 칸 고르기·체력바·그림자·검사용 rc146BodyFrame 기록 포함). 그동안 그 몹의 몸 그림(프레임 묶음·경로)만 칠하지 않는다. */
function bodyPaths(e){const out=new Set();try{const fs=window.__STORYWORLD_STORY_COMBAT_R54__?.frameSet?.(e);if(fs)for(const v of Object.values(fs))if(v?.path)out.add(v.path);}catch(_){}
 try{for(const v of Object.values(e.profile?.frames||{}))if(v?.path)out.add(v.path);}catch(_){}if(e.path)out.add(e.path);return out;}
const srcPath=im=>{try{const s=String(im?.__path||im?.src||'');if(!s)return '';const i=s.indexOf('/assets/');return i>=0?s.slice(i+1):s.replace(/^https?:\/\/[^/]+\/(m0\/)?/,'');}catch(_){return '';}};
function withoutBody(e,f){const c=typeof ctx!=='undefined'?ctx:null;if(!c||typeof c.drawImage!=='function')return f();const paths=bodyPaths(e),od=c.drawImage;
 c.drawImage=function(im,...a){try{const p=srcPath(im),lp=e.rc146BodyFrame?.path;if(p&&!SHEETS.has(p)&&(paths.has(p)||p===lp||[...paths].some(x=>p.endsWith(x))||(lp&&p.endsWith(lp)))){stats.hiddenBody=(stats.hiddenBody||0)+1;return;}}catch(_){}return od.apply(this,[im,...a]);};
 try{return f();}finally{c.drawImage=od;}}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
function shapeOf(e){const sh=e.attack?.shape154||e.combatProfile?.attackShape||{};return{w:e.attack?.castWindup150??(sh.windup??.45),a:sh.active??.15,r:sh.recovery??.35,range:sh.range??1.2};}
function attackFrame(e){const A=e.attack;if(!A||!Number.isFinite(A.elapsed))return -1;const S=shapeOf(e),t=A.elapsed;if(t<S.w)return t<S.w*.5?8:8;if(t<S.w+S.a)return 9;if(t<S.w+S.a+S.r*.5)return 10;return 11;}
const KSCALE={coin:.55,lipstick:.6,candy:.6,bottle:.6,mask:.7,blade:.75,heel:.65,cross:.85,paper:.75,slime:.75,crystal:1,fog:.9,serpent:.7,spider:.85,quad:.8,drone:.8};
function drawOwn(e,s,im){const dead=e.hp<=0||e.spawnState==='dead',age=T()-(Number.isFinite(e.deadAt)?e.deadAt:T());if(dead&&age>.8)return;
 const q=project(e.x,e.y),cp=e.combatProfile,AH=(typeof actorHeight==='function'?actorHeight():60),size0=AH*(cp?.spriteRect?.height||1)*(e.defScale||1)*(KSCALE[s.kind]||1),size=Math.min(size0,AH*(e.boss?2.4:major(e)?1.7:1.3)),k=size/Math.max(40,s.body||200),lift=Math.max(0,Math.min(size*.65,Number(e.visualLiftPx)||0));
 const m=e.r248||(e.r248={x:e.x,y:e.y,moving:0,face:1,seed:Math.random()*8});const dx=e.x-m.x,dy=e.y-m.y;
 /* R259: 영웅 8칸 안이면 걷거나 옆으로 돌 때도 영웅 쪽을 본다(멀리서는 가는 쪽) — 사용자 "적들공격및 이동등 방향이미지도 영웅을목표로했을때 자연스러운 방향" */
 const hd=typeof player==='object'&&player?Math.hypot(player.x-e.x,player.y-e.y):1e9,sdH=hd<1e9?(player.x-player.y)-(e.x-e.y):0;
 if(Math.hypot(dx,dy)>.002){m.moving=T()+.25;const sx=dx-dy;if(hd<8){if(Math.abs(sdH)>.05)m.face=sdH<0?-1:1;}else if(Math.abs(sx)>.001)m.face=sx<0?-1:1;}else if(hd<1e9){if(Math.abs(sdH)>.05&&(T()>m.moving||hd<8))m.face=sdH<0?-1:1;}
 m.x=e.x;m.y=e.y;let fr=attackFrame(e);if(fr>=0&&Number.isFinite(e.attack?.angle)){const sd=Math.cos(e.attack.angle)-Math.sin(e.attack.angle);if(Math.abs(sd)>.05)m.face=sd<0?-1:1;}
 if(fr<0)fr=T()<m.moving?Math.floor(T()*FPS+m.seed)%8:Math.floor(T()*2+m.seed)%2;
 const sx0=(fr%4)*CW,sy0=Math.floor(fr/4)*CH;
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age/.8):1;ctx.filter=e.flash>0?'brightness(1.8) saturate(.5)':'saturate(.78) brightness(.86) contrast(1.08)';/* 칠한 배경과 덜 튀게 */
  ctx.translate(q.x,q.y-lift);ctx.scale(m.face*k,k);ctx.drawImage(im,sx0,sy0,CW,CH,-PX,-PY,CW,CH);}finally{ctx.restore();}stats.draws++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let s=null,im=null;
 try{if(prefs.on&&solo()&&e&&!e.r170Tower&&!e.r251Circle){s=sheetOf(e);if(s){im=image(s.path);if(!im)stats.waits++;}}}catch(err){fail(err);im=null;}
 if(!im)return base.apply(this,[e,...a]);
 const r=withoutBody(e,()=>base.apply(this,[e,...a]));
 try{const f=()=>drawOwn(e,s,im);if(typeof ctx.scope==='function')ctx.scope({id:'r248:mob:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}catch(err){fail(err);}return r;};}
// ---- 공격 이펙트·상태이상 ------------------------------------------------------------------------
const FXK={quad:'bite',serpent:'bite',spider:'web',slime:'acid',mech:'shock',drone:'shock',wraith:'chill',fog:'miasma',crystal:'drop',cross:'drop',golem:'drop',plant:'thorns',puppet:'thread',winged:'dive',
 blade:'slash',coin:'slash',heel:'slash',lipstick:'pierce',candy:'pierce',paper:'slash',mask:'chill',bottle:'acid'};
function fxKindOf(s,e){if(s.kind==='human'){const w=s.weapon;return w==='claws'?'claw':w==='needle'||w==='spear'?'pierce':w==='staff'||w==='lantern'?'chill':'slash';}if(s.kind==='winged'&&/용$|불길|화염/.test(String(e.name||'')))return 'fire';return FXK[s.kind]||'slash';}
const SLOW={web:['거미줄',1.1],acid:['산성 점액',.9],shock:['감전',.7],chill:['한기',.8],miasma:['독안개',1.0],thread:['얽힌 실',.8]};
const PAL={bite:{a:[150,30,30],b:[255,150,140]},claw:{a:[150,30,30],b:[255,170,160]},slash:{a:[170,170,190],b:[255,255,255]},pierce:{a:[170,170,190],b:[255,240,240]},web:{a:[150,150,150],b:[245,245,240]},
 acid:{a:[60,120,40],b:[200,255,140]},shock:{a:[60,110,170],b:[200,240,255]},chill:{a:[60,70,120],b:[180,200,255]},miasma:{a:[60,70,50],b:[170,200,140]},drop:{a:[70,60,60],b:[220,200,190]},
 thorns:{a:[70,40,30],b:[200,140,110]},thread:{a:[160,160,170],b:[255,255,255]},dive:{a:[90,60,60],b:[230,200,190]},fire:{a:[170,60,20],b:[255,200,90]}};
const fx=[],SENT={type:'r248-fx',x:0,y:0,age:0,life:Infinity};let slowAt=-99;
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function onContact(e,s){const k=fxKindOf(s,e),S=shapeOf(e),near=Math.hypot(player.x-e.x,player.y-e.y)<=S.range+(e.radius||.4)+.6;
 fx.push({k,x:near?player.x:e.x+Math.cos(e.attack.angle||0)*1.1,y:near?player.y:e.y+Math.sin(e.attack.angle||0)*1.1,ex:e.x,ey:e.y,t0:T(),seed:Math.random()*6,life:k==='drop'?1.0:.6});if(fx.length>12)fx.shift();stats.fx++;arm();
 const sl=SLOW[k];if(near&&sl&&T()-slowAt>4){slowAt=T();try{player.heroSlowUntil150=Math.max(Number(player.heroSlowUntil150)||0,T()+sl[1]);player.storyStatus150={key:'r248-'+k,label:sl[0],until:T()+sl[1]};stats.slows++;}catch(err){fail(err);}}}
function tickFx(){if(!prefs.fx||!solo()||typeof room!=='object'||!room)return;for(const e of room.enemies||[]){if(!(e.hp>0)||!e.attack)continue;const s=sheetOf(e);if(!s)continue;const S=shapeOf(e),A=e.attack,id=A.id??A;
  if(Number.isFinite(A.elapsed)&&A.elapsed>=S.w&&e.r248Hit!==A){e.r248Hit=A;try{onContact(e,s);}catch(err){fail(err);}}}
 for(let i=fx.length-1;i>=0;i--)if(T()-fx[i].t0>fx[i].life)fx.splice(i,1);}
function drawFx(){const S=SPR();if(!S||typeof project!=='function')return;const h=typeof actorHeight==='function'?actorHeight():60;
 for(const f of fx){const v=(T()-f.t0)/f.life;if(v<0||v>1)continue;const u=1-v,q=project(f.x,f.y),P=PAL[f.k]||PAL.slash,o={overHero:true};
  if(f.k==='bite'){const c=v<.4?v/.4:1;S.along?.('slashline',P,q.x-h*.35,q.y-h*.75+h*.2*c,q.x+h*.35,q.y-h*.75+h*.2*c,h*.25,{...o,alpha:u});S.along?.('slashline',P,q.x-h*.35,q.y-h*.25-h*.2*c,q.x+h*.35,q.y-h*.25-h*.2*c,h*.25,{...o,alpha:u});if(v>.35)S.draw('spark',{a:[180,20,30],b:[255,120,110]},q.x,q.y-h*.5,h*.6,h*.6,{...o,alpha:u});}
  else if(f.k==='claw'){for(let i=0;i<3;i++){const off=(i-1)*h*.16;S.along?.('slashline',P,q.x-h*.4+off,q.y-h*.95,q.x+h*.2+off,q.y-h*.15,h*.18,{...o,alpha:u*Math.min(1,v*5)});}}
  else if(f.k==='slash'){S.along?.('slashline',P,q.x-h*.55,q.y-h*.3,q.x+h*.55,q.y-h*.8,h*.3,{...o,alpha:u});S.draw('spark',P,q.x,q.y-h*.55,h*.5,h*.5,{...o,alpha:u*.8});}
  else if(f.k==='pierce'){const a=Math.atan2(f.y-f.ey,f.x-f.ex),p0=project(f.x-Math.cos(a)*.9,f.y-Math.sin(a)*.9);S.along?.('slashline',P,p0.x,p0.y-h*.5,q.x,q.y-h*.5,h*.16,{...o,alpha:u});S.draw('spark',P,q.x,q.y-h*.5,h*.45,h*.45,{...o,alpha:u});}
  else if(f.k==='web'){S.draw('ring',P,q.x,q.y,h*1.4*(.6+v*.6),h*.7*(.6+v*.6),{...o,alpha:u*.9});for(let i=0;i<6;i++){const a=i/6*Math.PI*2+f.seed;S.along?.('slashline',P,q.x,q.y-h*.1,q.x+Math.cos(a)*h*.7,q.y-h*.1+Math.sin(a)*h*.35,h*.06,{...o,alpha:u*.8});}}
  else if(f.k==='acid'){S.draw('glow',P,q.x,q.y-h*.2,h*1.2,h*.6,{...o,alpha:u*.8});for(let i=0;i<5;i++){const a=f.seed+i*1.3;S.draw('orb',P,q.x+Math.cos(a)*h*.4*v,q.y-h*.3-Math.sin(a)*h*.4*v+h*.5*v*v,h*.16,h*.16,{...o,alpha:u});}}
  else if(f.k==='shock'){for(let i=0;i<3;i++)S.draw('spark',P,q.x+Math.sin(f.seed+i*2)*h*.3,q.y-h*(.3+.25*i),h*.55,h*.55,{...o,alpha:u,angle:f.seed+i});S.draw('glow',P,q.x,q.y-h*.5,h,h,{...o,alpha:u*.6});}
  else if(f.k==='chill'||f.k==='miasma'){S.draw('smoke',P,q.x,q.y-h*.4,h*1.5*(.6+v*.5),h*1.1*(.6+v*.5),{...o,alpha:u*.7,blend:'source-over'});S.draw('ring',P,q.x,q.y,h*1.3,h*.6,{...o,alpha:u*.6});}
  else if(f.k==='drop'){/* 위에서 비석·파편이 떨어져 꽂힌다 */const fall=Math.min(1,v/.35),y=q.y-h*1.8*(1-fall);S.draw('spike',P,q.x,y,h*.38,h*.85,{...o,pivot:[.5,1],alpha:Math.min(1,u*1.6)});if(fall>=1){S.draw('crack',{a:[40,30,30],b:[150,120,110]},q.x,q.y,h*1.3,h*1.3,{...o,squash:.5,alpha:u});S.draw('smoke',{a:[70,60,60],b:[160,150,140]},q.x,q.y-h*.2,h*1.2*(v+.3),h*.7*(v+.3),{...o,alpha:u*.6,blend:'source-over'});}}
  else if(f.k==='thorns'){for(let i=0;i<5;i++){const a=f.seed+i*1.25,r=h*.35*(i%2?1:.5),g=Math.min(1,v/.25);S.draw('spike',P,q.x+Math.cos(a)*r,q.y+Math.sin(a)*r*.5,h*.16,h*.6*g,{...o,pivot:[.5,1],alpha:u});}}
  else if(f.k==='thread'){const p0=project(f.ex,f.ey);for(let i=0;i<3;i++)S.along?.('slashline',P,p0.x,p0.y-h*(.9+.1*i),q.x+(i-1)*h*.15,q.y-h*.5,h*.05,{...o,alpha:u*.9});}
  else if(f.k==='dive'){S.draw('smoke',P,q.x,q.y-h*.3,h*1.2,h*.8,{...o,alpha:u*.6,blend:'source-over'});S.along?.('slashline',P,q.x-h*.5,q.y-h*.9,q.x+h*.3,q.y-h*.1,h*.22,{...o,alpha:u});}
  else if(f.k==='fire'){S.draw('glow',P,q.x,q.y-h*.4,h*1.4,h*1.1,{...o,alpha:u});S.draw('flare',P,q.x,q.y-h*.5,h*.9,h*.9,{...o,alpha:u,angle:f.seed});}}}
if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e&&e.type==='r248-fx'){try{drawFx();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{renameStory();tickFx();}catch(e){fail(e);}return r;};}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}
window.__STORYWORLD_MOB_UNIQUE_R248__=Object.freeze({revision:REV,set,baseName,sheetFor:e=>sheetOf(e),fxKindOf:(e)=>{const s=sheetOf(e);return s?fxKindOf(s,e):null;},count:()=>Object.keys(DATA.byName).length,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},fx:fx.length,lastError})});
})();

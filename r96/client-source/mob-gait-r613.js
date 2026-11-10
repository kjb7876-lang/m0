// R613 걷기 그림이 한 장뿐인 몹의 임시 걸음 — 사용자 2026-11-10 "이동모션이없는 몹들도 전수조사해서 … 생성개선적용".
//  정식본은 Dots 걷기 시트(요청서 CX-0067MV, r96/qa/r613/CX-0067MV-request.txt). 시트가 오기 전까지만 쓰는 코드 걸음이며 최종 그림이 아니다.
//  ① 판정(그리기에서 직접): 몹이 걷는 동안 drawEnemy 가 그린 몸 그림(이미지+칸)을 모아, 0.6초·20번 이상 본 뒤 한 가지뿐이면 'gait',
//     두 가지 이상(각 2번 이상)이면 'frames'(손대지 않음). 맞음·공격·조준·돌진 중 그림은 판정에서 뺀다. 판정은 몹 하나하나에(같은 이름도 그림이 다를 수 있음), 몸 그림은 그리기 기록기 명령(원본 경로·칸)을 먼저 본다.
//     → 나중에 Dots 걷기 시트가 붙으면 그 몹은 저절로 'frames' 가 되어 이 걸음이 꺼진다.
//  ② 걸음: R52 applyBodyPose 사슬(발 위치에서 몸에 거는 변형)에 덧붙인다. 위상은 '지나간 거리'로 정해 발이 미끄러지지 않는다(0.42칸에 한 걸음).
//     걷는 몹 = 걸음마다 발 디딤(최대 3.2px 뜸)·좌우 기울기(±3.2°)·디딜 때 아주 작은 눌림(세로 3.5%)·가는 쪽으로 1.4° 숙임.
//     떠 있는 몹(나방·망령·그림자 등, R109 fly/hover) = 위로만 부드럽게 오르내림(최대 3.6px)·작은 기울기, 눌림 없음.
//     멈추면 0.15초 안에 서서히 0 으로 돌아간다. R109 '꿀렁임 금지'(늘였다 줄였다 출렁임)는 지킨다 — 몸 전체를 굳은 채 들고 기울인다.
//  손대지 않음: 보스·중간보스·페르소나, 고정형(탑·인형·포탑), 병원(ep1a08, R51 전용 자세), 공격·조준·R286 돌진 중, 죽은 몹.
//  끄기: localStorage['storyworld.r613.gait']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_MOB_GAIT_R613__)return;
const REV='R613-gait-1',KEY='storyworld.r613.gait';
const STRIDE=.42,LIFT=3.2,FLOAT=3.6,TILT=.056,LEAN=.024,SQUASH=.035,TAU=.12,MIN_N=20,MIN_SPAN=.6;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={samples:0,decided:0,poses:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const zoneId=()=>{try{return (typeof room!=='undefined'&&room?.id)||(typeof zone!=='undefined'?zone:'')||'';}catch(_){return '';}};
const hospital=()=>{try{return typeof zone!=='undefined'&&zone==='ep1a08';}catch(_){return false;}};
const major=e=>!!(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||'')));
const fixed=e=>!!(e.stationary||e.r170Tower||e.turret||e.rooted||e.immobile||e.r251Circle||e.r193Doll);
const busy=e=>!!(e.attack||e.rangedWindup>0||e.r268Dash||e.r286?.mode||e.hitTimer>0);
const baseName=e=>String(e?.name||'').replace(/^중간보스 · /,'').replace(/\s*\d+$/,'').replace(/ (후속 증원|증원|우두머리|추격대)$/,'').replace(/ (후속 증원|증원|우두머리|추격대)$/,'').trim();
const FLOATY=/나방|박쥐|망령|유령|영혼|잔영|환영|그림자|눈알|원반|막익|날개|혼령|안개/;
function floats(e){if(e.r613Float||e.flying||e.fly||e.hover||e.levitate)return true;try{const k=window.__STORYWORLD_MOBS_R109__?.trackFor?.(e)?.kind;if(k==='fly'||k==='hover')return true;}catch(_){}return FLOATY.test(String(e.name||''));}
function eligible(e){return !!(prefs.on&&e&&e.hp>0&&e.spawnState!=='dead'&&!major(e)&&!fixed(e)&&!hospital());}
// ---- 판정 ----
// 판정은 몹 하나하나에 매긴다: 같은 이름이라도 그림이 다를 수 있다(dist00 뿌리 추적자 = R380 시트 몹과 R74 지도 그림 몹이 섞여 나옴).
let vZone=null,V=new WeakMap();const names=new Map();// names: 보고용 이름 → {gait,frames}
function rec(e){const z=zoneId();if(z!==vZone){vZone=z;V=new WeakMap();names.clear();}let r=V.get(e);if(!r)V.set(e,r={keys:new Map(),n:0,t0:null,verdict:null,name:baseName(e)});return r;}
function verdict(e){if(!e)return null;const z=zoneId();if(z!==vZone)return null;return V.get(e)?.verdict||null;}
function note(r){const c=names.get(r.name)||{gait:0,frames:0};c[r.verdict]++;names.set(r.name,c);}
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura/i;
function sample(r,key){if(!key)return;stats.samples++;r.n++;if(r.t0==null)r.t0=T();r.keys.set(key,(r.keys.get(key)||0)+1);
 const multi=[...r.keys.values()].filter(v=>v>=2).length;if(multi>=2){r.verdict='frames';stats.decided++;note(r);return;}
 if(r.n>=MIN_N&&T()-r.t0>=MIN_SPAN&&r.keys.size===1){r.verdict='gait';stats.decided++;note(r);}}
// 그리기 기록기(Three.js 쪽 ctx.commands)에 남은 몸 그림: 오프스크린 캔버스로 합성해 그리는 몹도 원래 그림 경로·칸이 여기 남는다.
//  캔버스뿐이라 원본을 알 수 없는 그림은 판정하지 않는다(= 걸음 안 줌, 보수적으로).
function fromCommands(C,st){if(!C||!(st>=0))return null;let fin=null;for(let i=st;i<C.length;i++){const k=C[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;
 const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(!src||src==='original-actor-canvas'||FX.test(src))continue;const P=k.points;
 const ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!fin||ar>fin.ar)fin={ar,key:src+'|'+String(k.sourceRect||'')};}return fin?fin.key:null;}
// ---- 걸음 상태 ----
const W=new WeakMap();
function stepState(e){const now=T();let s=W.get(e);if(!s){W.set(e,s={lx:e.x,ly:e.y,dist:0,amp:0,at:now,movedAt:-1,dir:1});return s;}
 const dt=Math.max(0,Math.min(.25,now-s.at));if(dt<=0&&s.at===now&&s.lx===e.x&&s.ly===e.y)return s;
 const dx=e.x-s.lx,dy=e.y-s.ly,d=Math.hypot(dx,dy);if(d>1e-5&&d<.6){s.dist+=d;s.movedAt=now;const sx=dx-dy;if(Math.abs(sx)>1e-5)s.dir=sx>0?1:-1;}
 s.lx=e.x;s.ly=e.y;const walking=e.moving!==false&&now-s.movedAt<=.08&&s.movedAt>=0;const k=1-Math.exp(-dt/(walking?TAU:TAU/4));s.amp+=((walking?1:0)-s.amp)*k;if(s.amp<.05&&!walking)s.amp=0;s.at=now;s.walking=walking;return s;}
let scoped=null;
function pose(c,e){const s=W.get(e);if(!s||!(s.amp>.02)||busy(e)||verdict(e)!=='gait')return false;
 const z=typeof Z==='function'?Z():(typeof zoom==='number'&&zoom>0?zoom:1),a=s.amp,ph=s.dist/STRIDE*Math.PI;
 if(floats(e)){const lift=(.5-.5*Math.cos(ph*.5))*FLOAT*z*a;c.translate(0,-lift);c.rotate((Math.sin(ph*.5)*TILT*.5+s.dir*LEAN*.6)*a);}
 else{const st=Math.sin(ph),up=Math.abs(st),lift=up*LIFT*z*a,contact=Math.pow(1-up,3);c.translate(0,-lift);c.rotate((st*TILT+s.dir*LEAN)*a);if(contact>.01)c.scale(1+SQUASH*.6*contact*a,1-SQUASH*contact*a);}
 stats.poses++;return true;}
// ---- 사슬 연결 ----
function installPose(){const chain=window.__STORYWORLD_HOSPITAL_CHARGE_R52__;if(!chain||typeof chain.applyBodyPose!=='function'||chain.__r613)return !!chain?.__r613;
 window.__STORYWORLD_HOSPITAL_CHARGE_R52__=Object.freeze({...chain,__r613:true,
  applyBodyPose(c,hero=false){const r=chain.applyBodyPose(c,hero);if(hero||!c||!scoped)return r;try{if(pose(c,scoped))return {...(r||{shear:0,scaleY:1}),phase:'r613-gait'};}catch(err){fail(err);}return r;},
  hasMotion(e){try{const s=e&&W.get(e);if(s&&s.amp>.02&&verdict(e)==='gait')return true;}catch(_){}return chain.hasMotion?chain.hasMotion(e):false;}});return true;}
// 바깥에 늦게 감싼 그림 공급자(sin-boss-art-r463 등)가 그리는 몸까지 보려면 이 감싸기가 맨 바깥이어야 한다 → 1초마다 맨 위가 아니면 다시 감싼다.
//  안쪽에 남은 옛 감싸기는 depth 로 그냥 통과시킨다(두 번 판정·두 번 자세 없음).
let depth=0;
function installDraw(){if(typeof drawEnemy!=='function')return false;if(drawEnemy.__r613)return true;const base=drawEnemy;
 const w=function(e,...a){if(depth>0||!eligible(e))return base.call(this,e,...a);depth++;try{return draw.call(this,base,e,a);}finally{depth--;}};
 w.__r613=true;try{drawEnemy=w;}catch(_){}try{window.drawEnemy=w;}catch(_){}stats.wraps=(stats.wraps||0)+1;return true;}
function draw(base,e,a){let s=null,r=null,hook=null,best=null;
  try{s=stepState(e);r=rec(e);if(!r.verdict&&s.walking&&!busy(e)&&typeof ctx!=='undefined'&&ctx&&typeof ctx.drawImage==='function'){const c=ctx,own=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage;
    c.drawImage=function(img,...q){try{let sx=0,sy=0,dw,dh;if(q.length>=8){sx=q[0];sy=q[1];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
      const path=img?.currentSrc||img?.src||img?.__path||'';const src=String(path||('cv'+img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');const area=Math.abs((dw||0)*(dh||0));if(!FX.test(src)&&(!best||area>best.area))best={area,key:src+'|'+sx+','+sy,canvas:!path};}catch(_){}return f.apply(this,arguments);};
    hook=()=>{if(own)c.drawImage=own;else delete c.drawImage;};}}catch(err){fail(err);}
  const C0=hook&&Array.isArray(ctx.commands)?ctx.commands:null,st0=C0?C0.length:-1;
  const prev=scoped;scoped=e;try{return base.call(this,e,...a);}finally{scoped=prev;if(hook){hook();try{const k=fromCommands(C0,st0)||(best&&!best.canvas?best.key:null);if(k)sample(r,k);}catch(err){fail(err);}}}}
installPose();installDraw();
const reinstall=()=>{const a=installPose(),b=installDraw();return a&&b;};
if(typeof setInterval==='function')setInterval(()=>{try{reinstall();}catch(err){fail(err);}},1000);
window.__STORYWORLD_MOB_GAIT_R613__=Object.freeze({revision:REV,verdict,baseName,reinstall,floats:e=>floats(e),
 set(on){prefs.on=!!on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}},
 inspect:()=>({revision:REV,prefs:{...prefs},zone:vZone,gaitNames:[...names].filter(([,c])=>c.gait).map(([k])=>k),frameNames:[...names].filter(([,c])=>c.frames).map(([k])=>k),
  names:Object.fromEntries(names),stats:{...stats},lastError})});
})();

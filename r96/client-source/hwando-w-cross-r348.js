// R348 환도 W '월섬 회천' — 원 안 십자 베기 → 원 밖 분신 7 → 분신 자리 십자 베기 + 주변 스플래시(사용자 2026-11-05).
//  사용자: "환도 w스킬 사용시 원안에 초록색선으로친거처럼 십자가베기 같이일어난다음(원이랑비슷한색상) 원밖 초록십자가 나온지역에
//   플레이어가 0.7초등장(분신) 그후 십자가베기가 일어나면서 그근방 적에게 스플레시대미지일어나고 빨간작은원친거3개 거기서 나오는.)이런 도형이펙트 없애줘".
//  ① 큰 원(R292 띠 hwando/w, R302 재채색)은 그대로 둔다 — 기준 '원'.
//  ② 원 안: 영웅을 지나는 세로·가로 칼 베기 한 쌍(iai-cut + slashline, 원과 같은 은백 + 골드 교차점)이 정십자가(위 짧고 아래 긴)를 긋는다. 화면 기준 원 반지름에 맞춘다.
//     R425(사용자 2026-11-08 "환도영웅 분신7개나오고 십자베기하는거 십자를-십자가로"): 예전 '+'(가로 칼이 한가운데·세로와 같은 길이) 대신
//     가로 칼을 바닥 십자가 그림(fx-sprites 'cross' 256×384, 교차점이 위에서 33.85%)과 같은 비율로 올리고 줄인다 — 원 안·분신 7 모두.
//     세로 칼은 그대로 ±arm, 교차점은 중심에서 0.323·arm 위, 가로 칼 반폭 0.667·arm. 회전·뒤집기 없음(역십자 금지), 교차점 반짝임도 돌리지 않는다.
//  ③ 원 밖 7곳(우리 편 숫자 7)에 환도 분신(그 순간 영웅 몸 그림을 은빛 반투명으로)이 0.7초 서 있다가 그 자리에서 십자 베기 →
//     반경 1.5칸 안의 적에게 스플래시(W 원 피해의 0.45배 = attackPower×1.25×0.45, 분신 하나가 한 적을 한 번). 원 밖의 적 곁을 먼저 고르고,
//     모자라면 원 둘레 바깥에 고르게(벽·막힌 자리 건너뜀). 피해는 엔진 hitEnemy(난이도·노출·보스 교전 규칙 그대로), 벽 너머는 clearLine 으로 막는다.
//     협동(R62 mode≠off)에서는 분신·피해를 만들지 않는다(권한이 호스트에 있어 손님이 피해를 넣으면 안 됨) — 그림 ②만.
//  ④ 원 안 ')' 초승달 칼날을 뺀다: fx-d2s-r106 '소용돌이 칼날'(hammer: blade 회전 n=3+단계), hero-fx-r102 blade 스타일 초승달(crescent),
//     hud-bgm-hwando-w-r313 의 띠 꼬리 3칼날(drawSplit) — 셋 다 이 파일의 owns('hwando','w') 를 보고 환도 W 에서만 건너뛴다. 다른 영웅·슬롯 그대로.
//  시전 감지: 엔진 W 'circle' 이 피해를 넣는 순간 area() 가 부르는 fx('storySourceSkill',원점,{storyWER,sourceHero:'hwando',sourceSlot:'w',stage:'release',castId}).
//   (cast 는 닫힌 영역 안이라 직접 감쌀 수 없다. release 는 실제 판정과 같은 틱·같은 원점이고, castId 로 한 번만 받는다.)
//  상징 규칙: 십자가만(룬·육망성·마법진 고리 없음). Three.js 기록기: ctx.filter 는 saturate·brightness 만(엔진 잔상과 같은 값).
//  끄기: localStorage['storyworld.r348.hwandoW']='{"on":false}' (예전 연출로)
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_W_CROSS_R348__)return;
const REV='R348-hwando-w-cross-4',KEY='storyworld.r348.hwandoW';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({clones:7,ringWorld:3.15,ringCell:115/384*10/* R292 띠 칸 반지름(px)/칸 → 화면 칸 수 */,cloneScreen:1.42,maxWorld:7.5,enemyScreen:2.7,
 crossLife:.5,cloneIn:.2,hold:.7,slashLife:.42,splash:1.5,mult:1.25*.45,offset:.85});
const PAL=Object.freeze({a:Object.freeze([214,222,234]),b:Object.freeze([244,248,255])}),GOLD=Object.freeze({a:Object.freeze([255,198,72]),b:Object.freeze([255,232,170])});
const stats={casts:0,clones:0,slashes:0,hits:0,damage:0,draws:0,snapshots:0,coopSkipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const SP=()=>{const s=window.__STORYWORLD_FX_SPRITES_R106__;return s?.on?.()?s:null;};
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const fin=v=>typeof v==='number'&&Number.isFinite(v);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const owns=(hero,slot)=>on&&hero==='hwando'&&String(slot)==='w';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
// ---- 영웅 몸 그림 붙잡기(분신용): drawHero 가 기록한 가장 큰 영웅 그림 명령 ---------------------------------
let body=null;
//  몸 그림만: R271 이 고른 몸(c.r271) 먼저, 없으면 영웅 몸 그림 경로(R271·R119 의 BODY_ART 와 같은 목록). 오라·각성 문양 같은 다른 영웅 그림은 고르지 않는다.
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r143\/attack\/|r242\/hwando\/|r271\/hwando\/|r283\/hwando\/|^blob:/;
function snap(rec,st){if(!Array.isArray(rec?.commands)||!player)return;let best=null,bh=0;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!c.image||!Array.isArray(c.points)||c.points.length<4)continue;
  const r271=!!c.r271;if(!r271&&!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1])+(r271?1e4:0);if(hh>bh){bh=hh;best=c;}}
 if(best)bh=Math.abs(best.points[3][1]-best.points[0][1]);
 if(!best||!(bh>4))return;const q=project(player.x,player.y),sr=best.sourceRect||[0,0,best.image.naturalWidth||best.image.width,best.image.naturalHeight||best.image.height];
 body={image:best.image,src:String(best.sourcePath||best.image?.src||'').slice(-60),sr:[...sr],dx:best.points[0][0]-q.x,dy:best.points[0][1]-q.y,w:best.points[1][0]-best.points[0][0],h:best.points[3][1]-best.points[0][1],at:T(),hero:player.hero};stats.snapshots++;}
function heroSide(){const d=window.__STORYWORLD_HWANDO_R271__?.state?.()?.dir||String(player?.direction||'');return /e$|^e|right/.test(d)?1:/w$|^w|left/.test(d)?-1:0;}
// ---- 분신 자리 고르기 --------------------------------------------------------------------------------------
function screenBasis(x,y){const q=project(x,y),a=project(x+1,y),b=project(x,y+1);return {q,m:[a.x-q.x,b.x-q.x,a.y-q.y,b.y-q.y]};}
function worldFromScreen(B,sx,sy){const [a,b,c,d]=B.m,det=a*d-b*c;if(Math.abs(det)<1e-6)return null;return {x:(d*sx-b*sy)/det,y:(-c*sx+a*sy)/det};}
const open=(x,y)=>typeof blocked!=='function'||!blocked(x,y,.34,room);
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,room);
function pickSpots(o){const B=screenBasis(o.x,o.y),ringPx=CFG.ringCell*unit(),spots=[],sAng=p=>{const q=project(p.x,p.y);return Math.atan2(q.y-B.q.y,q.x-B.q.x);};
 const sdist=p=>{const q=project(p.x,p.y);return Math.hypot(q.x-B.q.x,q.y-B.q.y);};
 // 원 밖(판정 원 3.15칸 밖이고 화면 원 밖) 적 곁: 가까운 적부터, 분신은 적에서 원점 쪽으로 조금 물러선 자리
 let foes=[];try{foes=(typeof liveEnemies==='function'?liveEnemies():[]).filter(e=>{const d=Math.hypot(e.x-o.x,e.y-o.y);return d>CFG.ringWorld+(e.radius||.3)&&d<=CFG.maxWorld&&sdist(e)>ringPx*1.02&&sdist(e)<=ringPx*CFG.enemyScreen&&(typeof damageable3!=='function'||damageable3(e));})
  .sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y));}catch(e){fail(e);}
 for(const e of foes){if(spots.length>=CFG.clones)break;const d=Math.hypot(e.x-o.x,e.y-o.y),k=Math.min(CFG.offset,d*.2),p={x:e.x-(e.x-o.x)/d*k,y:e.y-(e.y-o.y)/d*k};
  /* 물러선 자리도 원 밖(판정 3.15칸 + 화면 원)인지 다시 본다 — 아니면 적 자리, 그것도 아니면 건너뜀 */
  const outside=p=>Math.hypot(p.x-o.x,p.y-o.y)>CFG.ringWorld&&sdist(p)>ringPx*1.02;
  const at=[p,{x:e.x,y:e.y}].find(c=>outside(c)&&open(c.x,c.y))||null;if(!at||!line(o,at))continue;const a=sAng(at);if(spots.some(s=>Math.abs(Math.atan2(Math.sin(a-s.ang),Math.cos(a-s.ang)))<.32))continue;spots.push({...at,ang:a,foe:e.id,face:Math.sign(e.x-at.x||1)});}
 // R705c(사용자 2026-11-12 "근거리영웅인경우 적근거리에 분신이 나타났다 사라져야지"): 적이 없는 빈 둘레를 채우던 분신은 없앤다 — 분신은 적 곁에만 서고 피해도 그 적 자리에서만 난다.
 return spots.slice(0,CFG.clones);}
// ---- 시전 ----------------------------------------------------------------------------------------------------
const casts=[];const seen=new Set();
function begin(x,y,o){if(seen.has(o.castId))return;seen.add(o.castId);if(seen.size>64)seen.delete(seen.values().next().value);
 const c={id:o.castId,x,y,t0:T(),room,zone:typeof zone!=='undefined'?zone:null,player,power:typeof attackPower==='function'?attackPower():0,body:body&&T()-body.at<.5&&body.hero==='hwando'?{...body}:null,side:heroSide(),clones:[]};
 if(solo()){c.clones=pickSpots(c).map((s,i)=>({...s,i,hit:false}));stats.clones+=c.clones.length;}else stats.coopSkipped++;
 casts.push(c);if(casts.length>3)casts.shift();stats.casts++;arm();}
function valid(c){return c.room===room&&player===c.player&&player?.hp>0&&player.hero==='hwando'&&(typeof zone==='undefined'||zone===c.zone);}
function strike(c,s){s.hit=true;stats.slashes++;if(!solo()||!valid(c)||typeof hitEnemy!=='function')return;const dmg=c.power*CFG.mult;if(!(dmg>0))return;
 const list=typeof liveEnemies==='function'?liveEnemies():[];
 for(const e of list){if(Math.hypot(e.x-s.x,e.y-s.y)>CFG.splash+(e.radius||0))continue;if(typeof damageable3==='function'&&!damageable3(e))continue;if(!line(s,e))continue;
  const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-wer-clone-r348',attackKind9:'skill',friendly:true,owner:'hero',attackId9:'r348:'+c.id+':'+s.i,sourceHero:'hwando',sourceSlot:'w',r348Clone:true});
  if(ok&&old>e.hp){stats.hits++;stats.damage+=old-e.hp;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}}}
// ---- 그리기 --------------------------------------------------------------------------------------------------
function cut(S,x0,y0,x1,y1,th,a){S.along('iai-cut',PAL,x0,y0,x1,y1,th,{alpha:a*.9,blend:'screen',overHero:true});S.along('slashline',PAL,x0,y0,x1,y1,th*.42,{alpha:a,blend:'screen',overHero:true});stats.draws+=2;}
// 세로(위→아래) 먼저, 가로(왼→오른) 0.06초 뒤 — 칼이 지나가며 길어지고(0.12초) 머문 뒤 사라진다.
// 정십자가: 세로 칼 ±arm, 가로 칼은 교차점 by(중심에서 arm×BAR_UP 위)에서 반폭 arm×BAR_HALF — 바닥 십자가 그림과 같은 비율(위 0.677·아래 1.323·양옆 0.667).
const BAR_UP=1-2*.3385,BAR_HALF=256/384;
function crossSlash(S,cx,cy,arm,age,life,th){const by=cy-arm*BAR_UP,hw=arm*BAR_HALF;
 for(let k=0;k<2;k++){const v=(age-k*.06)/life;if(v<=0||v>=1)continue;const g=smooth(v/.24),a=v<.45?1:1-smooth((v-.45)/.55),grow=.08+.92*g;
  if(k)cut(S,cx-hw,by,cx-hw+2*hw*grow,by,th*(1-.35*v),a);else cut(S,cx,cy-arm,cx,cy-arm+2*arm*grow,th*(1-.35*v),a);}
 const v=age/life;if(v>.08&&v<.8){const a=1-smooth((v-.3)/.5);S.draw('flare',GOLD,cx,by,th*1.9,th*1.9,{alpha:.7*a,blend:'screen',overHero:true});S.draw('glow',PAL,cx,by,th*2.6,th*2.6,{alpha:.35*a,blend:'screen'});stats.draws+=2;}}
function drawClone(c,s,age){const S=SP(),b=c.body,q=project(s.x,s.y),h=H(),u=unit();if(!q)return;
 const tIn=age-CFG.cloneIn,tSl=tIn-CFG.hold;if(tIn<0)return;
 const vis=tIn<.12?smooth(tIn/.12):tSl<0?1:1-smooth(tSl/.3);
 if(S&&tSl<0){const g=smooth(tIn/.25);S.draw('cross',PAL,q.x,q.y,u*1.05*g,u*1.6*g,{squash:.5,alpha:.38*vis,blend:'screen'});S.draw('glow',PAL,q.x,q.y-h*.1,h*.9,h*.45,{alpha:.35*vis,blend:'screen'});stats.draws+=2;}
 if(b&&vis>.01){ctx.save();try{const run=()=>{const mir=c.side!==0&&s.face!==0&&s.face!==c.side,dx=mir?-b.dx:b.dx,w=mir?-b.w:b.w;ctx.globalAlpha*=.5*vis;ctx.globalCompositeOperation='source-over';ctx.filter='saturate(.3) brightness(1.12)';
   ctx.translate(q.x+dx,q.y+b.dy);if(w<0){ctx.scale(-1,1);ctx.drawImage(b.image,b.sr[0],b.sr[1],b.sr[2],b.sr[3],0,0,-w,b.h);}else ctx.drawImage(b.image,b.sr[0],b.sr[1],b.sr[2],b.sr[3],0,0,w,b.h);};
   if(typeof ctx.scope==='function')ctx.scope({id:'r348:'+c.id+':'+s.i,kind:'effect',x:s.x,y:s.y,r348:true},run);else run();stats.draws++;}catch(e){fail(e);}finally{ctx.restore();}}
 if(S&&tSl>=0&&tSl<CFG.slashLife){const arm=CFG.splash*u*.95;crossSlash(S,q.x,q.y-h*.45,arm,tSl,CFG.slashLife,h*.36);}}
function drawCast(c){const S=SP();if(!S)return;const age=T()-c.t0,q=project(c.x,c.y),h=H();
 if(age<CFG.crossLife+.06)crossSlash(S,q.x,q.y-h*.3,CFG.ringCell*unit()*.97,age,CFG.crossLife,h*.55);
 for(const s of c.clones)drawClone(c,s,age);}
const total=()=>CFG.cloneIn+CFG.hold+CFG.slashLife+.05;
const SENT={type:'r348-hwando-w',x:0,y:0,age:0,life:Infinity,r348Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
try{
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
  try{const o=opt||{};if(on&&type==='storySourceSkill'&&o.storyWER&&o.stage==='release'&&owns(o.sourceHero,o.sourceSlot)&&player?.hero==='hwando'&&fin(x)&&fin(y)&&o.castId!=null)begin(x,y,o);}catch(e){fail(e);}return r;};}
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
  try{if(on&&st>=0&&player?.hero==='hwando'&&player.hp>0)snap(rec,st);}catch(e){fail(e);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)for(const c of casts)if(valid(c))drawCast(c);}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 const asHeroR720=(id,fn)=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;return D&&typeof D.asHero==='function'?D.asHero(id,fn):fn();};/* R720-4: 다음 틱에 이어지는 기술을 그 영웅 몸(생존 배치 영웅이면 그 몸)으로 돌린다 */
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T();
   asHeroR720('hwando',()=>{for(let i=casts.length-1;i>=0;i--){const c=casts[i];if(!valid(c)||t-c.t0>total()||t<c.t0-1){casts.splice(i,1);continue;}
    for(const s of c.clones)if(!s.hit&&t-c.t0>=CFG.cloneIn+CFG.hold+.06)strike(c,s);}});
   if(casts.length)arm();else if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){casts.length=0;return base.apply(this,a);};}
 try{SP()?.warm?.(PAL,['iai-cut','slashline','cross','glow']);SP()?.warm?.(GOLD,['flare']);}catch(_){}
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)casts.length=0;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_HWANDO_W_CROSS_R348__=Object.freeze({revision:REV,config:CFG,palette:PAL,on:()=>on,set,owns,pickSpots,
 inspect:()=>({revision:REV,on,stats:{...stats},lastError,body:body&&{hero:body.hero,src:body.src,w:body.w,h:body.h,age:+(T()-body.at).toFixed(2)},
  casts:casts.map(c=>({id:c.id,x:c.x,y:c.y,age:+(T()-c.t0).toFixed(3),power:c.power,body:!!c.body,clones:c.clones.map(s=>({x:+s.x.toFixed(2),y:+s.y.toFixed(2),foe:s.foe,hit:s.hit}))}))})});
})();

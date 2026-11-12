// R947 슬레이어 확률 발동 피 패시브 — 사용자 2026-11-12 13:13Z (요약) 슬레이어 확률 발동 특수 패시브 셋.
//  ① 피 레이저가 체크(격자) 모양으로 주변을 덮으며 난사(드묾) ② 기본 피 다루기 탄(흔함) ③ 피 십자검 여러 자루가 하늘에서 내려와 적에게 꽂힘. Dots 이펙트 개선 적용.
//  다른 작품은 느낌만 참고했다. 기술 이름·그림·연출은 StoryWorld 고유(슬레이어 테마: 십자군 광전사·주의 보혈 — 진홍·검붉은 피·흰 빛심).
//  새 키·새 슬롯 없음. 기본 공격(A)이 성공할 때마다, 그리고 R425 적혈 오라 중 분신이 벨 때마다 주사위 한 번 → 셋 중 하나만 터진다.
//   ② 「혈침(血針)」 20%, 대기 0.9초 : 압축한 피 한 줄기가 방금 벤 적 쪽으로 7.5칸 날아가며 줄 위 적을 모두 꿰뚫는다(각 공격력 ×0.85, 벽에서 멈춤).
//   ③ 「성혈검우(聖血劍雨)」 8%, 대기 6초 : 피로 빚은 십자검 7자루가 6.5칸 안 가까운 적들 머리 위에서 차례로 떨어져 꽂힌다(자루마다 ×1.3, 곁 0.9칸 ×0.4).
//      십자검은 칼날이 아래 — 위가 짧고 아래가 긴 정십자 모양 그대로, 회전·상하 반전 없이 그린다(사용자 상시 규칙 2026-11-08).
//   ① 「혈격자(血格子)」 4%, 대기 14초 : 슬레이어 둘레 5칸에 피 레이저가 가로 줄·세로 줄을 번갈아 그으며 0.2초마다 8번 난사한다(체크 무늬가 바닥을 덮음).
//      줄에 걸린 적은 한 번의 난사에 한 번씩 ×0.32, 벽 너머는 안 맞음. 격자 가운데는 슬레이어를 따라간다.
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙·R586 피의 낙인 그대로)·blocked·clearLine. 협동(R62 mode≠off)에서는 발동하지 않는다.
//  R425 분신(slayer-blood-r425.js)은 고치지 않는다 — 분신 베기 피해(r425:'clone')를 엿보아 발동 기회로만 센다.
//  생존 배치 영웅(R720, player.r720Ally 몸): 대기 시간·탄·검·격자 상태를 몸마다 따로 둔다.
//  그림: 적중·꽂힘 피 튐은 Dots 시트(R585 slayer-burst-small, R587 SL11 slayer-hit) 재사용. 레이저·피 탄·십자검 몸체는 처음 한 번 오프스크린에 그려 둔 고정 그림(임시) —
//   Dots CX-0088 시트가 오면 바꾼다. 그리기 중 그라데이션을 만들지 않는다(3D 기록기 멈춤 함정). 필터 안 씀.
//  렉: 한 프레임 그림 60개 상한(저사양 28), 피 탄 동시 4개, 할 일이 없으면 그리기 표지를 effects 에서 뺀다.
//  끄기: localStorage['storyworld.r947.slayerBlood']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__)return;
const REV='R947-slayer-blood-1',KEY='storyworld.r947.slayerBlood',HERO='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({
 needle:Object.freeze({chance:.2,icd:.9,mult:.85,range:7.5,radius:.45,speed:16,max:4}),
 swords:Object.freeze({chance:.08,icd:6,count:7,range:6.5,fall:.55,stagger:.07,mult:1.3,splash:.9,splashMult:.4,stuck:.75}),
 lattice:Object.freeze({chance:.04,icd:14,radius:5,waves:8,gap:.2,lead:.08,spacing:1.25,half:.2,mult:.32,life:2}),
 maxDraws:60,maxVis:48});
const SHEET=Object.freeze({
 burst:Object.freeze({path:'assets/r585/slayer-burst-small.webp',cell:192,cols:6,frames:24,fps:30,px:128/256,py:224/256}),
 hit:Object.freeze({path:'assets/r587/slayer-hit.webp',cell:192,cols:6,frames:24,fps:40,px:132/256,py:158/256})});
const fin=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
let lastError=null,errors=0;const fail=e=>{errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const isSl=p=>!!p&&p.hero===HERO&&p.hp>0;
const P=()=>{try{return typeof player!=='undefined'?player:null;}catch(_){return null;}};
const open=(x,y,r=.2)=>typeof blocked!=='function'||!blocked(x,y,r,room);
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,room);
const foes=()=>{try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}};
const power=()=>{try{return typeof attackPower==='function'?attackPower():0;}catch(_){return 0;}};
const aim=()=>{try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}};
const say=(t,x,y)=>{try{if(typeof floatText==='function')floatText(t,x,y,'#ff4b5c');}catch(_){}};
const sfx=k=>{try{if(typeof sound==='function')sound(k);}catch(_){}};
// ---- 상태: 조종 영웅 하나 + 생존 배치 영웅(r720Ally 몸)마다 하나 ------------------------------------------------
const fresh=body=>({body,ready:{needle:-1e9,swords:-1e9,lattice:-1e9},force:null,needles:[],swords:[],lattice:null,
 stats:{swings:0,needles:0,swordCasts:0,lattices:0,multi:0,hits:0,damage:0,wallStops:0,coopSkipped:0,cloneSwings:0}});
const main=fresh(null),allyState=new WeakMap(),allies=[];
function st(p,make=true){if(p&&p.r720Ally===true){let s=allyState.get(p);if(!s&&make){s=fresh(p);allyState.set(p,s);allies.push(s);if(allies.length>8)allies.shift();}return s||null;}return main;}
const states=()=>[main,...allies];
const bodyOf=s=>s.body||P();
const busy=s=>s.needles.length||s.swords.length||s.lattice;
function wipe(s){s.needles.length=0;s.swords.length=0;s.lattice=null;}
// ---- 피해 ----------------------------------------------------------------------------------------------------
function strike(s,e,mult,base,tag,id){if(!solo()){s.stats.coopSkipped++;return false;}if(typeof hitEnemy!=='function'||!e||!(e.hp>0))return false;const dmg=base*mult;if(!(dmg>0))return false;
 if(typeof damageable3==='function'&&!damageable3(e))return false;const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-slayer-blood-r947',attackKind9:'skill',friendly:true,owner:'hero',sourceHero:HERO,sourceSlot:'a',attackId9:'r947:'+id,r947:tag});
 if(ok&&old>e.hp){s.stats.hits++;s.stats.damage+=old-e.hp;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}return ok;}
// ---- 그림 목록·표지 ------------------------------------------------------------------------------------------
const vis=[];let serial=0;
const addVis=v=>{if(low()&&vis.length>=16)return;vis.push({t0:T(),...v});while(vis.length>CFG.maxVis)vis.shift();arm();};
const SENT={type:'r947-slayer-blood',x:0,y:0,age:0,life:Infinity,r947Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function clearAll(){for(const s of states())wipe(s);vis.length=0;disarm();}
// ---- 발동 ----------------------------------------------------------------------------------------------------
function pick(s){if(s.force){const k=s.force;s.force=null;return k;}
 const r=Math.random(),a=CFG.needle.chance,b=CFG.swords.chance,c=CFG.lattice.chance,k=r<a?'needle':r<a+b?'swords':r<a+b+c?'lattice':null;
 return k&&T()>=s.ready[k]?k:null;}
const nearOf=(p,r)=>{let b=null,bd=r;for(const e of foes()){if(!(e.hp>0)||!fin(e.x)||!fin(e.y))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<=bd){bd=d;b=e;}}return b;};
function onSwing(p,foe){const s=st(p);s.stats.swings++;if(!solo()){s.stats.coopSkipped++;return;}
 const k=pick(s);if(!k)return;s.ready[k]=T()+CFG[k].icd;
 if(k==='needle')castNeedle(s,p,foe);else if(k==='swords')castSwords(s,p);else castLattice(s,p);}
// ② 혈침
function castNeedle(s,p,foe){const e=foe&&foe.hp>0?foe:nearOf(p,4.5),a=e?Math.atan2(e.y-p.y,e.x-p.x):aim(),ux=Math.cos(a),uy=Math.sin(a),id='n'+(++serial);s.stats.needles++;
 s.needles.push({id,ox:p.x+ux*.4,oy:p.y+uy*.4,x:p.x+ux*.4,y:p.y+uy*.4,ux,uy,pw:power(),travel:.4,hit:new Set(),room,t0:T()});while(s.needles.length>CFG.needle.max)s.needles.shift();
 addVis({k:'muzzle',x:p.x+ux*.5,y:p.y+uy*.5,a,life:.22});arm();}
function stepNeedles(s,dt){const M=CFG.needle;for(let i=s.needles.length-1;i>=0;i--){const b=s.needles[i];if(b.room!==room){s.needles.splice(i,1);continue;}
 let move=M.speed*dt,dead=false;while(move>1e-9&&!dead){const d=Math.min(.2,move);move-=d;const nx=b.x+b.ux*d,ny=b.y+b.uy*d;
  if(!open(nx,ny)){s.stats.wallStops++;dead=true;addVis({k:'hit',x:b.x,y:b.y,life:.5});break;}b.x=nx;b.y=ny;b.travel+=d;
  for(const e of foes()){if(!(e.hp>0)||b.hit.has(e))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<M.radius+(e.radius||0)&&line(b,e)){b.hit.add(e);if(strike(s,e,M.mult,b.pw,'needle',b.id))addVis({k:'hit',x:e.x,y:e.y,life:.5});}}
  if(b.travel>=M.range)dead=true;}
 if(dead){addVis({k:'streak',a:{x:b.ox,y:b.oy},b:{x:b.x,y:b.y},life:.3});s.needles.splice(i,1);}}}
// ③ 성혈검우
function castSwords(s,p){const C=CFG.swords,near=foes().filter(e=>e.hp>0&&fin(e.x)&&fin(e.y)&&Math.hypot(e.x-p.x,e.y-p.y)<=C.range&&line(p,e)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,C.count);
 if(!near.length)return;const t=T(),pw=power(),id='s'+(++serial);s.stats.swordCasts++;
 for(let i=0;i<C.count;i++){const e=near[i%near.length],lap=Math.floor(i/near.length),a=i*2.39996,r=lap?.38:0;
  s.swords.push({i,foe:e,dx:Math.cos(a)*r,dy:Math.sin(a)*r,x:e.x,y:e.y,at:t+C.fall+i*C.stagger,t0:t+i*C.stagger,landed:false,end:t+C.fall+i*C.stagger+C.stuck+.3,pw,id:id+':'+i,room});}
 while(s.swords.length>C.count*2)s.swords.shift();
 say('성혈검우',p.x,p.y-.5);sfx('special');arm();}
function stepSwords(s){const t=T(),C=CFG.swords;for(let i=s.swords.length-1;i>=0;i--){const w=s.swords[i];if(w.room!==room){s.swords.splice(i,1);continue;}
 if(!w.landed){if(w.foe&&w.foe.hp>0&&fin(w.foe.x)){const tx=w.foe.x+w.dx,ty=w.foe.y+w.dy;if(open(tx,ty,.1)){w.x=tx;w.y=ty;}}
  if(t>=w.at){w.landed=true;const e=w.foe;if(e&&e.hp>0&&Math.hypot(e.x-w.x,e.y-w.y)<=.6+(e.radius||0))strike(s,e,C.mult,w.pw,'sword',w.id);
   const o={x:w.x,y:w.y};for(const q of foes())if(q!==e&&q.hp>0&&Math.hypot(q.x-o.x,q.y-o.y)<=C.splash+(q.radius||0)&&line(o,q))strike(s,q,C.splashMult,w.pw,'swordSplash',w.id+'b');
   addVis({k:'burst',x:w.x,y:w.y,life:.8});if(w.i===0||w.i===C.count-1)try{if(typeof shake!=='undefined'&&fin(shake))shake=Math.max(shake,.7);}catch(_){}}}
 if(t>=w.end)s.swords.splice(i,1);}}
// ① 혈격자
function castLattice(s,p){const t=T();s.stats.lattices++;s.lattice={t0:t,room,pw:power(),wave:0,next:t+CFG.lattice.lead,lines:[],id:'l'+(++serial),cx:p.x,cy:p.y};
 addVis({k:'pulse',x:p.x,y:p.y,life:.5});say('혈격자',p.x,p.y-.5);sfx('special');arm();}
function stepLattice(s){const L=s.lattice;if(!L)return;const t=T(),C=CFG.lattice,b=bodyOf(s);if(L.room!==room||!isSl(b)){s.lattice=null;return;}
 L.cx=b.x;L.cy=b.y;
 while(L.wave<C.waves&&t>=L.next){const w=L.wave,dir=w%2?'v':'h',off=((w>>1)%2)*C.spacing/2,mid=dir==='h'?L.cy:L.cx,lines=[],K=Math.ceil(C.radius/C.spacing)+1;
  for(let k=-K;k<=K;k++){const c=Math.round((mid+k*C.spacing+off)/C.spacing*2)/2*C.spacing,dc=c-mid;if(Math.abs(dc)>=C.radius-.15)continue;const hw=Math.sqrt(C.radius*C.radius-dc*dc);
   const m0=(dir==='h'?L.cx:L.cy),t1=L.next+lines.length*.012;let seg=null;
   for(let v=m0-hw;v<=m0+hw+1e-6;v+=.25){const free=dir==='h'?open(v,c,.05):open(c,v,.05);if(free){if(!seg)seg={dir,c,a0:v,a1:v,t:t1,wave:w};seg.a1=v;}else if(seg){if(seg.a1-seg.a0>.4)lines.push(seg);seg=null;}}
   if(seg&&seg.a1-seg.a0>.4)lines.push(seg);}
  const o={x:L.cx,y:L.cy};
  for(const e of foes()){if(!(e.hp>0)||!fin(e.x)||Math.hypot(e.x-o.x,e.y-o.y)>C.radius+(e.radius||0)*.5||!line(o,e))continue;const v=dir==='h'?e.y:e.x;
   if(lines.some(q=>Math.abs(v-q.c)<=C.half+(e.radius||0))&&strike(s,e,C.mult,L.pw,'lattice',L.id+':'+w))addVis({k:'hit',x:e.x,y:e.y,life:.4,small:true});}
  L.lines=L.lines.filter(q=>q.wave>=w-1).concat(lines);L.wave++;L.next+=C.gap;}
 if(t>=L.t0+C.life)s.lattice=null;}
// ---- 코드 그림(임시): 처음 한 번 오프스크린에 그려 두는 고정 그림 -----------------------------------------------
const tex=new Map();
function make(key,w,h,paint){if(tex.has(key))return tex.get(key);let c=null;try{if(typeof document==='undefined')return null;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!g)return null;paint(g,w,h);
  c.__storyworldStaticSource=Object.freeze({path:'r947:'+key,immutable:true});}catch(e){fail(e);c=null;}tex.set(key,c);return c;}
// 피 레이저 줄기: 흰 빛심 + 진홍 테 + 검붉은 바깥 번짐(가로로 늘여 씀, 양 끝은 뾰족하게 사라짐)
function beamTex(){return make('beam',256,32,(g,w,h)=>{const cy=h/2;
  const band=(th,col)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,col.replace('A','0'));gr.addColorStop(.08,col.replace('A','1'));gr.addColorStop(.92,col.replace('A','1'));gr.addColorStop(1,col.replace('A','0'));
   g.fillStyle=gr;g.beginPath();g.ellipse(w/2,cy,w/2,th/2,0,0,7);g.fill();};
  g.globalAlpha=.45;band(30,'rgba(110,0,14,A)');g.globalAlpha=.8;band(16,'rgba(200,10,32,A)');g.globalAlpha=1;band(7,'rgba(255,90,96,A)');band(3,'rgba(255,240,236,A)');});}
// 피 탄 머리: 진홍 물방울 창끝(오른쪽이 앞)
function needleTex(){return make('needle',128,32,(g,w,h)=>{const cy=h/2;const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(120,0,16,0)');gr.addColorStop(.55,'rgba(170,6,26,.85)');gr.addColorStop(1,'rgba(255,60,70,1)');
  g.fillStyle=gr;g.beginPath();g.moveTo(0,cy);g.quadraticCurveTo(w*.6,cy-11,w,cy);g.quadraticCurveTo(w*.6,cy+11,0,cy);g.fill();
  g.fillStyle='rgba(255,236,232,.95)';g.beginPath();g.moveTo(w*.35,cy);g.quadraticCurveTo(w*.75,cy-3,w-2,cy);g.quadraticCurveTo(w*.75,cy+3,w*.35,cy);g.fill();});}
// 피 십자검: 칼날이 아래. 위(손잡이·머리) 짧고 아래(칼날) 긴 정십자 모양. 진홍 날 + 검붉은 테 + 흰 날선 + 엷은 피 빛무리.
function swordTex(){return make('sword',96,288,(g,w,h)=>{const cx=w/2,guardY=62;
  const shape=(grow)=>{g.beginPath();g.arc(cx,14,9+grow,0,7);g.fill();g.fillRect(cx-5-grow,20,10+grow*2,guardY-20);
   g.beginPath();g.moveTo(cx-40-grow,guardY-6-grow);g.lineTo(cx+40+grow,guardY-6-grow);g.lineTo(cx+34+grow,guardY+8+grow);g.lineTo(cx-34-grow,guardY+8+grow);g.closePath();g.fill();
   g.beginPath();g.moveTo(cx-12-grow,guardY+8);g.lineTo(cx+12+grow,guardY+8);g.lineTo(cx+8+grow*.6,h-30);g.lineTo(cx,h-4+grow*.5);g.lineTo(cx-8-grow*.6,h-30);g.closePath();g.fill();};
  g.fillStyle='rgba(150,0,20,.16)';shape(9);g.fillStyle='rgba(170,0,24,.26)';shape(5);
  g.fillStyle='rgba(58,0,8,1)';shape(2);
  const gr=g.createLinearGradient(cx-12,0,cx+12,0);gr.addColorStop(0,'rgba(120,0,18,1)');gr.addColorStop(.45,'rgba(220,20,40,1)');gr.addColorStop(.55,'rgba(236,40,56,1)');gr.addColorStop(1,'rgba(110,0,16,1)');g.fillStyle=gr;shape(0);
  g.strokeStyle='rgba(255,226,220,.95)';g.lineWidth=2;g.beginPath();g.moveTo(cx,guardY+12);g.lineTo(cx,h-18);g.stroke();
  g.fillStyle='rgba(255,210,200,.9)';g.beginPath();g.arc(cx,guardY+1,4.5,0,7);g.fill();g.beginPath();g.arc(cx,14,3.5,0,7);g.fill();
  g.fillStyle='rgba(120,0,14,.9)';for(let i=0;i<5;i++){g.beginPath();g.ellipse(cx+(i%2?7:-6),guardY+30+i*36,2,4+i%3,0,0,7);g.fill();}});}
// 바닥 고리(시전 맥동): 진홍 고리 한 겹
function ringTex(){return make('ring',256,128,(g,w,h)=>{g.strokeStyle='rgba(160,0,24,.5)';g.lineWidth=14;g.beginPath();g.ellipse(w/2,h/2,w/2-10,h/2-8,0,0,7);g.stroke();
  g.strokeStyle='rgba(255,70,80,.95)';g.lineWidth=4;g.beginPath();g.ellipse(w/2,h/2,w/2-10,h/2-8,0,0,7);g.stroke();});}
function warm(){try{beamTex();needleTex();swordTex();ringTex();if(typeof ensureImages==='function')Promise.resolve(ensureImages([SHEET.burst.path,SHEET.hit.path])).catch(()=>{});}catch(e){fail(e);}}
const asked={t:0};
function sheetImg(k){const S=SHEET[k];try{const got=typeof readyImage==='function'?readyImage(S.path):null;if(got?.image)return got.image;const t=Date.now();if(t-asked.t>1500){asked.t=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages([SHEET.burst.path,SHEET.hit.path])).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---- 그리기 --------------------------------------------------------------------------------------------------
let budget=0,drawCalls=0;
// 바닥 격자·고리는 groundAligned(R350 영웅 가림 옅게가 영웅 몸 상자를 덮는 긴 줄을 85% 옅게 하지 않도록 — 바닥 무늬라 영웅을 가리지 않음)
const GROUND=new Set(['lattice']);
function scoped(id,fn){const own={id:'r947:'+id,kind:'effect',r947:true,groundAligned:GROUND.has(id)};try{if(typeof ctx.scope==='function')return ctx.scope(own,fn);return fn();}catch(e){fail(e);}}
// 조각 한 장: (x,y)=기준점, w·h=화면 크기, px·py=기준점 비율. ang 이 0 이면 회전을 부르지 않는다(십자검은 늘 0).
function img(id,im,x,y,w,h,o={}){if(!im||budget<=0||!(w>0)||!(h>0))return false;budget--;drawCalls++;
 scoped(id,()=>{ctx.save();try{ctx.globalCompositeOperation=o.add?'lighter':'source-over';ctx.globalAlpha*=clamp(o.alpha??1,0,1);ctx.translate(x,y);if(o.ang)ctx.rotate(o.ang);
  ctx.drawImage(im,-w*(o.px??.5),-h*(o.py??.5),w,h);}catch(e){fail(e);}finally{ctx.restore();}});return true;}
function cell(id,k,fr,x,y,size,alpha,flip){const S=SHEET[k],im=sheetImg(k);if(!im||budget<=0)return false;budget--;drawCalls++;fr=clamp(Math.floor(fr),0,S.frames-1);
 scoped(id,()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha,0,1);ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  ctx.drawImage(im,(fr%S.cols)*S.cell,Math.floor(fr/S.cols)*S.cell,S.cell,S.cell,-size*S.px,-size*S.py,size,size);}catch(e){fail(e);}finally{ctx.restore();}});return true;}
const scr=(x,y,lift=.4)=>{const q=project(x,y);return {x:q.x,y:q.y-H()*lift};};
function beam(id,A,B,th,alpha){const L=Math.hypot(B.x-A.x,B.y-A.y);if(!(L>1))return;img(id,beamTex(),(A.x+B.x)/2,(A.y+B.y)/2,L,th,{ang:Math.atan2(B.y-A.y,B.x-A.x),alpha,add:true});}
function drawAll(){const t=T(),lo=low(),h=H(),u=unit();budget=lo?28:CFG.maxDraws;
 const sword=swordTex(),needle=needleTex(),ring=ringTex();
 for(const s of states()){
  // ① 혈격자: 바닥 높이(살짝 띄움) 줄. 한 줄은 0.05초에 굵어졌다 0.3초에 사라짐.
  const L=s.lattice;if(L){for(const q of L.lines){const a=t-q.t;if(a<0||a>.34)continue;const k=a<.05?smooth(a/.05):1-smooth((a-.05)/.29),lift=.12;
    const A=q.dir==='h'?scr(q.a0,q.c,lift):scr(q.c,q.a0,lift),B=q.dir==='h'?scr(q.a1,q.c,lift):scr(q.c,q.a1,lift);beam('lattice',A,B,h*(.2+.12*k),k);}}
  // ② 혈침
  for(const b of s.needles){const p=scr(b.x,b.y),back=Math.min(b.travel,3),tl=scr(b.x-b.ux*back,b.y-b.uy*back),ang=Math.atan2(p.y-tl.y,p.x-tl.x);
   beam('needle',tl,p,h*.26,.95);img('needle',needle,p.x,p.y,h*1.05,h*.36,{ang,px:.8,py:.5});}
  // ③ 성혈검우: 떨어지는 동안 하늘에서 가속, 꽂힌 뒤 칼끝이 땅에 박혀 흔들림 없이 서 있다가 사라짐. 회전 없음(정십자).
  for(const w of s.swords){const g=project(w.x,w.y),sh=h*1.55,sw=sh/3;let y,al=1;
   if(!w.landed){const k=clamp((t-w.t0)/(w.at-w.t0),0,1),fall=(1-k*k)*h*4.2;y=g.y-fall;al=smooth(k/.15);
    if(k<1&&!lo)beam('trail',{x:g.x,y:y-sh*.95-h*.9},{x:g.x,y:y-sh*.6},sw*.55,.55*al);}
   else{const a=t-w.at;y=g.y+h*.08;al=a<w.end-w.at-.3?1:1-smooth((a-(w.end-w.at-.3))/.3);}
   img('sword',sword,g.x,y,sw,sh,{px:.5,py:.985,alpha:al});}}
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(k<0||k>=1)continue;
  if(v.k==='hit'){const g=scr(v.x,v.y,.45);cell('hit','hit',age*SHEET.hit.fps,g.x,g.y,h*(v.small?1.1:1.5),1-smooth((k-.7)/.3),(v.t0*13|0)%2===1);}
  else if(v.k==='burst'){const g=project(v.x,v.y);cell('burst','burst',age*SHEET.burst.fps,g.x,g.y+h*.06,h*2.1,1-smooth((k-.75)/.25),false);}
  else if(v.k==='muzzle'){const g=scr(v.x,v.y);img('needle',needle,g.x,g.y,h*.9*(1-k*.5),h*.4*(1-k),{ang:Math.atan2(Math.sin(v.a)*.5,Math.cos(v.a)),alpha:1-k,add:true});}
  else if(v.k==='streak'){const A=scr(v.a.x,v.a.y),B=scr(v.b.x,v.b.y);beam('needle',A,B,h*.22*(1-k*.6),.8*(1-k));}
  else if(v.k==='pulse'){const g=project(v.x,v.y),r=u*CFG.lattice.radius*2*smooth(k/.6);img('lattice',ring,g.x,g.y,r*1.41,r*.71,{alpha:.9*(1-k)});}}}
// ---- 설치 ----------------------------------------------------------------------------------------------------
let lastT=null;
try{
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){const p=P();if(!on||!isSl(p))return base.apply(this,a);const cd0=p.attackCD,r=base.apply(this,a);
   try{if(!(cd0>0)&&p.attackCD>0&&P()===p)onSwing(p,null);}catch(e){fail(e);}return r;};}
 // R425 적혈 오라 분신 베기: 피해는 그대로 엔진에 넘기고, 끝난 뒤 발동 기회로만 센다.
 if(typeof hitEnemy==='function'){const base=hitEnemy;hitEnemy=function(e,v,src,...a){const r=base.call(this,e,v,src,...a);
   try{const p=P();if(on&&src&&src.r425==='clone'&&isSl(p)&&r!==false){st(p).stats.cloneSwings++;onSwing(p,e);}}catch(err){fail(err);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T(),dt=lastT==null?0:clamp(t-lastT,0,.1);lastT=t;let any=vis.length>0;
   if(on){if(!isSl(P())&&busy(main))wipe(main);
    for(const s of states()){if(!busy(s))continue;if(dt>0)stepNeedles(s,dt);stepSwords(s);stepLattice(s);if(busy(s))any=true;}}
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(any)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();const r=await base.apply(this,a);warm();return r;};}
 warm();
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(kind,body){if(!['needle','swords','lattice'].includes(kind))return false;const s=st(body||P());if(!s)return false;s.force=kind;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(null),t=T(),left=k=>Math.max(0,+(s.ready[k]-t).toFixed(3));
 return {revision:REV,on,errors,lastError,stats:{...s.stats},cd:{needle:left('needle'),swords:left('swords'),lattice:left('lattice')},vis:vis.length,drawCalls,
  needles:s.needles.map(b=>({id:b.id,x:+b.x.toFixed(2),y:+b.y.toFixed(2),travel:+b.travel.toFixed(2),hit:b.hit.size})),
  swords:s.swords.map(w=>({i:w.i,foe:w.foe?.id??null,x:+w.x.toFixed(2),y:+w.y.toFixed(2),landed:w.landed})),
  lattice:s.lattice?{age:+(t-s.lattice.t0).toFixed(3),waves:s.lattice.wave,lines:s.lattice.lines.map(q=>({dir:q.dir,c:q.c,wave:q.wave}))}:null};}
window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__=Object.freeze({revision:REV,config:CFG,on:()=>on,set,force,inspect});
})();

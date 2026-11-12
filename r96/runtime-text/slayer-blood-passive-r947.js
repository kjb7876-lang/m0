// R947 슬레이어 확률 발동 피 패시브 — 사용자 2026-11-12 13:13Z (요약) 슬레이어 확률 발동 특수 패시브 셋.
//  ① 피 레이저가 체크(격자) 모양으로 주변을 덮으며 난사(드묾) ② 기본 피 다루기 탄(흔함) ③ 피 십자검 여러 자루가 하늘에서 내려와 적에게 꽂힘. Dots 이펙트 개선 적용.
//  다른 작품은 느낌만 참고했다. 기술 이름·그림·연출은 StoryWorld 고유(슬레이어 테마: 십자군 광전사·주의 보혈 — 진홍·검붉은 피·흰 빛심).
//  새 키·새 슬롯 없음. 기본 공격(A)이 성공할 때마다, 그리고 R425 적혈 오라 중 분신이 벨 때마다 주사위 한 번 → 셋 중 하나만 터진다.
//   ② 「혈침(血針)」 20%, 대기 0.9초 : 사용자 13:38Z "체인라이트닝 느낌마냥 연쇄되게 대신 적혈로" — 방금 벤 적에서 적혈 번개가 0.07초마다 3.8칸 안 가장 가까운
//      다음 적으로 튄다(최대 6명, 첫 ×0.85 에서 튈 때마다 ×0.85, 같은 적 한 번, 벽 너머로는 안 튐).
//   ③ 「성혈검우(聖血劍雨)」 8%, 대기 6초 : 피로 빚은 십자검 7자루가 6.5칸 안 가까운 적들 머리 위에서 차례로 떨어져 꽂힌다(자루마다 ×1.3, 곁 0.9칸 ×0.4).
//      십자검은 칼날이 아래 — 위가 짧고 아래가 긴 정십자 모양 그대로, 회전·상하 반전 없이 그린다(사용자 상시 규칙 2026-11-08).
//   ① 「혈격자(血格子)」 4%, 대기 14초 : 슬레이어 둘레 5칸에 피 레이저가 가로 줄·세로 줄을 번갈아 그으며 0.2초마다 8번 난사한다(체크 무늬가 바닥을 덮음).
//      줄에 걸린 적은 한 번의 난사에 한 번씩 ×0.32, 벽 너머는 안 맞음. 격자 가운데는 슬레이어를 따라간다.
//      사용자 13:39Z "피레이져 교차지점에 적혈피십자가 생기면서 적에게 피폭발피해" — 세로줄이 그어질 때 앞 가로줄과 엇갈린 교차점 중 적 곁(0.95칸)에
//      적혈 십자가(Dots R585 시트, 정십자)가 솟고 0.55초 뒤 피 폭발(반경 1칸, ×0.55). 한 교차점에 하나, 한 번의 혈격자에 최대 10개.
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙·R586 피의 낙인 그대로)·blocked·clearLine. 협동(R62 mode≠off)에서는 발동하지 않는다.
//  R425 분신(slayer-blood-r425.js)은 고치지 않는다 — 분신 베기 피해(r425:'clone')를 엿보아 발동 기회로만 센다.
//  생존 배치 영웅(R720, player.r720Ally 몸): 대기 시간·탄·검·격자 상태를 몸마다 따로 둔다.
//  그림: 적중·꽂힘 피 튐·교차점 십자가는 Dots 시트(R585 slayer-burst-small·slayer-r-cross, R587 SL11 slayer-hit) 재사용. 레이저·적혈 번개·십자검 몸체는 처음 한 번 오프스크린에 그려 둔 고정 그림(임시) —
//   Dots CX-0088 시트가 오면 바꾼다. 그리기 중 그라데이션을 만들지 않는다(3D 기록기 멈춤 함정). 필터 안 씀.
//  렉: 한 프레임 그림 60개 상한(저사양 28), 피 탄 동시 4개, 할 일이 없으면 그리기 표지를 effects 에서 뺀다.
//  끄기: localStorage['storyworld.r947.slayerBlood']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__)return;
const REV='R947-slayer-blood-1',KEY='storyworld.r947.slayerBlood',HERO='slayer';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({
 needle:Object.freeze({chance:.2,icd:.9,mult:.85,decay:.85,jumps:6,jump:3.8,first:4.5,gap:.07,max:4}),
 swords:Object.freeze({chance:.08,icd:6,count:7,range:6.5,fall:.55,stagger:.07,mult:1.3,splash:.9,splashMult:.4,stuck:.75}),
 lattice:Object.freeze({chance:.04,icd:14,radius:5,waves:8,gap:.2,lead:.08,spacing:1.25,half:.2,mult:.32,life:2,crossMult:.55,crossDelay:.55,crossRadius:1,crossNear:.95,crossMax:10,crossLife:1}),
 maxDraws:60,maxVis:48});
const SHEET=Object.freeze({
 burst:Object.freeze({path:'assets/r585/slayer-burst-small.webp',cell:192,cols:6,frames:24,fps:30,px:128/256,py:224/256}),
 hit:Object.freeze({path:'assets/r587/slayer-hit.webp',cell:192,cols:6,frames:24,fps:40,px:132/256,py:158/256}),
 cross:Object.freeze({path:'assets/r585/slayer-r-cross.webp',cell:192,cols:6,frames:24,fps:23.6,px:128/256,py:224/256})});
const BOLT=Object.freeze({path:'assets/r108/eden/lightning.webp',cell:256,p:[.5005,.04],len:.8843,ring:[8,15],fps:24});// R108 손그림 번개 시트(파랑) → 적혈로 다시 칠해 씀
const SHEET_PATHS=Object.values(SHEET).map(v=>v.path).concat(BOLT.path);
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
const fresh=body=>({body,ready:{needle:-1e9,swords:-1e9,lattice:-1e9},force:null,needles:[],swords:[],lattice:null,crosses:[],
 stats:{swings:0,needles:0,swordCasts:0,lattices:0,multi:0,hits:0,damage:0,wallStops:0,coopSkipped:0,cloneSwings:0}});
const main=fresh(null),allyState=new WeakMap(),allies=[];
function st(p,make=true){if(p&&p.r720Ally===true){let s=allyState.get(p);if(!s&&make){s=fresh(p);allyState.set(p,s);allies.push(s);if(allies.length>8)allies.shift();}return s||null;}return main;}
const states=()=>[main,...allies];
const bodyOf=s=>s.body||P();
const busy=s=>s.needles.length||s.swords.length||s.lattice||s.crosses.length;
function wipe(s){s.needles.length=0;s.swords.length=0;s.lattice=null;s.crosses.length=0;}
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
// 적혈 연쇄: 벤 적에서 시작해 0.07초마다 3.8칸 안 가장 가까운 다음 적으로 피 번개가 튄다(최대 6명, 튈 때마다 ×0.85). 벽 너머로는 안 튐.
function castNeedle(s,p,foe){const M=CFG.needle,e=foe&&foe.hp>0?foe:nearOf(p,M.first);if(!e)return;s.stats.needles++;
 s.needles.push({id:'n'+(++serial),last:{x:p.x,y:p.y},first:e,hit:new Set(),k:0,next:T(),pw:power(),room,seed:serial*7.13});while(s.needles.length>M.max)s.needles.shift();arm();}
function stepNeedles(s){const M=CFG.needle,t=T();for(let i=s.needles.length-1;i>=0;i--){const c=s.needles[i];if(c.room!==room){s.needles.splice(i,1);continue;}let done=false;
 while(!done&&t>=c.next){if(c.k>=M.jumps){done=true;break;}let e=null;
  if(c.k===0)e=c.first&&c.first.hp>0?c.first:null;
  else{let bd=M.jump,blockedNear=false;for(const q of foes()){if(!(q.hp>0)||c.hit.has(q)||!fin(q.x)||!fin(q.y))continue;const d=Math.hypot(q.x-c.last.x,q.y-c.last.y);if(d>bd)continue;if(!line(c.last,q)){blockedNear=true;continue;}bd=d;e=q;}
   if(!e&&blockedNear)s.stats.wallStops++;}
  if(!e){done=true;break;}c.hit.add(e);const from=c.last;c.last={x:e.x,y:e.y};
  strike(s,e,M.mult*Math.pow(M.decay,c.k),c.pw,'needle',c.id+':'+c.k);addVis({k:'arc',a:from,b:{x:e.x,y:e.y},life:.34,seed:c.seed+c.k,lead:c.k===0});addVis({k:'hit',x:e.x,y:e.y,life:.45,small:c.k>0});
  c.k++;c.next+=M.gap;}
 if(done)s.needles.splice(i,1);}}
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
function castLattice(s,p){const t=T();s.stats.lattices++;s.lattice={t0:t,room,pw:power(),wave:0,next:t+CFG.lattice.lead,lines:[],id:'l'+(++serial),cx:p.x,cy:p.y,crossKeys:new Set(),crossN:0};
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
  // 가로줄(앞 난사)과 세로줄(이번 난사)이 엇갈린 교차점 중 적 곁(0.95칸)에 적혈 십자가가 솟아 0.55초 뒤 피 폭발(반경 1칸, ×0.55)
  if(dir==='v'){const hs=L.lines.filter(q=>q.dir==='h'&&q.wave===w-1);
   for(const v of lines)for(const q of hs){if(L.crossN>=C.crossMax)break;const x=v.c,y=q.c;if(x<q.a0-1e-6||x>q.a1+1e-6||y<v.a0-1e-6||y>v.a1+1e-6)continue;
    const key=x+','+y;if(L.crossKeys.has(key)||Math.hypot(x-o.x,y-o.y)>C.radius||!open(x,y,.1)||!line(o,{x,y}))continue;
    if(!foes().some(e=>e.hp>0&&fin(e.x)&&Math.hypot(e.x-x,e.y-y)<=C.crossNear+(e.radius||0)))continue;
    L.crossKeys.add(key);L.crossN++;s.crosses.push({x,y,t0:v.t,boom:v.t+C.crossDelay,boomed:false,pw:L.pw,id:L.id+':x'+L.crossN,room});}}
  L.lines=L.lines.filter(q=>q.wave>=w-1).concat(lines);L.wave++;L.next+=C.gap;}
 if(t>=L.t0+C.life)s.lattice=null;}
function stepCrosses(s){const t=T(),C=CFG.lattice;for(let i=s.crosses.length-1;i>=0;i--){const x=s.crosses[i];if(x.room!==room){s.crosses.splice(i,1);continue;}
 if(!x.boomed&&t>=x.boom){x.boomed=true;for(const e of foes())if(e.hp>0&&fin(e.x)&&Math.hypot(e.x-x.x,e.y-x.y)<=C.crossRadius+(e.radius||0)&&line(x,e))strike(s,e,C.crossMult,x.pw,'latticeCross',x.id);
  addVis({k:'burst',x:x.x,y:x.y,life:.7});}
 if(t>=x.t0+C.crossLife)s.crosses.splice(i,1);}}
// ---- 코드 그림(임시): 처음 한 번 오프스크린에 그려 두는 고정 그림 -----------------------------------------------
const tex=new Map();
function make(key,w,h,paint){if(tex.has(key))return tex.get(key);let c=null;try{if(typeof document==='undefined')return null;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!g)return null;paint(g,w,h);
  c.__storyworldStaticSource=Object.freeze({path:'r947:'+key,immutable:true});}catch(e){fail(e);c=null;}tex.set(key,c);return c;}
// 피 레이저 줄기: 흰 빛심 + 진홍 테 + 검붉은 바깥 번짐(가로로 늘여 씀, 양 끝은 뾰족하게 사라짐)
function beamTex(){return make('beam',256,32,(g,w,h)=>{const cy=h/2;
  const band=(th,col)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,col.replace('A','0'));gr.addColorStop(.08,col.replace('A','1'));gr.addColorStop(.92,col.replace('A','1'));gr.addColorStop(1,col.replace('A','0'));
   g.fillStyle=gr;g.beginPath();g.ellipse(w/2,cy,w/2,th/2,0,0,7);g.fill();};
  g.globalAlpha=.45;band(30,'rgba(110,0,14,A)');g.globalAlpha=.8;band(16,'rgba(200,10,32,A)');g.globalAlpha=1;band(7,'rgba(255,90,96,A)');band(3,'rgba(255,240,236,A)');});}
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
function warm(){try{beamTex();swordTex();ringTex();if(typeof ensureImages==='function')Promise.resolve(ensureImages(SHEET_PATHS)).catch(()=>{});}catch(e){fail(e);}}
const asked={t:0};
function sheetImg(k){const S=SHEET[k];try{const got=typeof readyImage==='function'?readyImage(S.path):null;if(got?.image)return got.image;const t=Date.now();if(t-asked.t>1500){asked.t=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages(SHEET_PATHS)).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---- 그리기 --------------------------------------------------------------------------------------------------
let budget=0,drawCalls=0;
// 바닥 격자·고리는 groundAligned(R350 영웅 가림 옅게가 영웅 몸 상자를 덮는 긴 줄을 85% 옅게 하지 않도록 — 바닥 무늬라 영웅을 가리지 않음)
const GROUND=new Set(['lattice','needle']);
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
// ---- 적혈 번개 시트: R108 손그림 번개를 평균 밝기 → 적혈 단계색(검붉음 → 진홍 → 분홍빛 흰 속심)으로 한 번 다시 칠한다(알파 그대로) ----
const CRIM=[[0,[34,0,6]],[.4,[110,0,16]],[.7,[196,12,34]],[.9,[255,84,92]],[1,[255,232,226]]];
let crim=null,crimTried=-1e9;
// 엔진 그림 캐시가 쓰지 않는 그림을 곧 비우므로(헤드리스 실측: 받은 뒤 1초 안에 사라졌다 다시 생김) 받자마자 그 자리에서 다시 칠해 둔다.
function paintCrimson(im){if(crim||!im)return crim;try{const w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;if(!(w>0&&h>0))return null;
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,w,h),px=d.data,L=new Uint8ClampedArray(768);
  for(let i=0;i<256;i++){const l=i/255;let j=1;while(j<CRIM.length-1&&l>CRIM[j][0])j++;const[a0,c0]=CRIM[j-1],[a1,c1]=CRIM[j],t=clamp((l-a0)/Math.max(1e-6,a1-a0),0,1);for(let k=0;k<3;k++)L[i*3+k]=c0[k]+(c1[k]-c0[k])*t;}
  for(let i=0;i<px.length;i+=4){if(!px[i+3])continue;const m=Math.round((px[i]+px[i+1]+px[i+2])/3)*3;px[i]=L[m];px[i+1]=L[m+1];px[i+2]=L[m+2];}
  g.putImageData(d,0,0);try{Object.defineProperty(cv,'__storyworldStaticSource',{value:Object.freeze({path:'r947crimson:'+BOLT.path,immutable:true})});}catch(_){}crim=cv;}catch(e){fail(e);}return crim;}
function crimson(){if(crim)return crim;const now=Date.now();if(now-crimTried<1500)return null;crimTried=now;
 try{const got=typeof readyImage==='function'?readyImage(BOLT.path):null;if(got?.image)return paintCrimson(got.image);
  if(typeof ensureImages==='function')Promise.resolve(ensureImages([BOLT.path])).then(()=>{try{const r=readyImage(BOLT.path);if(r?.image)paintCrimson(r.image);}catch(e){fail(e);}}).catch(()=>{});}catch(e){fail(e);}return null;}
// 번개 줄기 칸(0~7)을 A→B 로 늘여 그린다(R108·R437 과 같은 방식: 칸의 +y 축이 선분을 따라감). 번개 모양이라 십자와 무관.
function boltCell(src,fr,A,B,thick,alpha,add){const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy),C=BOLT.cell;if(!(L>2)||budget<=0)return;budget--;drawCalls++;fr=((fr|0)%8+8)%8;
 const sy=L/(BOLT.len*C),sx=clamp(sy*.5,.12,thick/(C*.5));
 scoped('needle',()=>{ctx.save();try{ctx.translate(A.x,A.y);ctx.rotate(Math.atan2(dy,dx)-Math.PI/2);ctx.scale(sx,sy);ctx.globalCompositeOperation=add?'lighter':'source-over';ctx.globalAlpha*=clamp(alpha,0,1);
  ctx.drawImage(src,(fr&3)*C,(fr>>2)*C,C,C,-BOLT.p[0]*C,-BOLT.p[1]*C,C,C);}catch(e){fail(e);}finally{ctx.restore();}});}
function boltRing(src,age,x,y,size,alpha){if(budget<=0)return;budget--;drawCalls++;const C=BOLT.cell,fr=Math.min(BOLT.ring[1],BOLT.ring[0]+Math.floor(age*BOLT.fps));
 scoped('needle',()=>{ctx.save();try{ctx.translate(x,y);ctx.globalAlpha*=clamp(alpha,0,1);ctx.drawImage(src,(fr&3)*C,(fr>>2)*C,C,C,-size/2,-size/2,size,size);}catch(e){fail(e);}finally{ctx.restore();}});}
// 적혈 번개 한 줄기: A→B 를 몇 마디로 끊어 옆으로 꺾고(0.05초마다 모양이 바뀜) 마디마다 피 레이저 줄기를 잇는다. 굵은 겉줄 + 가는 속줄 두 겹.
function bloodArc(v,age,k,h,lo){const A=scr(v.a.x,v.a.y,v.lead?.55:.45),B=scr(v.b.x,v.b.y,.45),dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy);if(!(L>2))return;
 const src=crimson();if(src){const al=k<.2?1:1-smooth((k-.2)/.8),fr=v.seed*3+Math.floor(age*BOLT.fps);boltCell(src,fr,A,B,h*1.3,al,false);boltCell(src,fr,A,B,h*.9,al,true);if(!lo)boltCell(src,fr+3,A,B,h*.6,.85*al,true);
  boltRing(src,age,B.x,B.y+h*.2,h*1.3,.9*al);return;}
 const n=lo?3:5,nx=-dy/L,ny=dx/L,fl=Math.floor(age/.05),al=k<.15?1:1-smooth((k-.15)/.85),pts=[A];
 for(let i=1;i<n;i++){const r=Math.sin((v.seed*12.9898+i*78.233+fl*37.719))*43758.5453,j=(r-Math.floor(r)-.5)*Math.min(L*.28,h*.55);pts.push({x:A.x+dx*i/n+nx*j,y:A.y+dy*i/n+ny*j});}pts.push(B);
 for(let i=0;i<n;i++)beam('needle',pts[i],pts[i+1],h*.42*(1-k*.4),.9*al);
 if(!lo)for(let i=0;i<n;i++)beam('needle',pts[i],pts[i+1],h*.12,al);}
function drawAll(){const t=T(),lo=low(),h=H(),u=unit();budget=lo?28:CFG.maxDraws;
 const sword=swordTex(),ring=ringTex();
 for(const s of states()){
  // ① 혈격자: 바닥 높이(살짝 띄움) 줄. 한 줄은 0.05초에 굵어졌다 0.3초에 사라짐.
  const L=s.lattice;if(L){for(const q of L.lines){const a=t-q.t;if(a<0||a>.34)continue;const k=a<.05?smooth(a/.05):1-smooth((a-.05)/.29),lift=.12;
    const A=q.dir==='h'?scr(q.a0,q.c,lift):scr(q.c,q.a0,lift),B=q.dir==='h'?scr(q.a1,q.c,lift):scr(q.c,q.a1,lift);beam('lattice',A,B,h*(.2+.12*k),k);}}
  // ① 혈격자 교차점 적혈 십자가(Dots R585 적혈 십자가 시트, 회전·뒤집기 없음 — 정십자)
  for(const x of s.crosses){const a=t-x.t0;if(a<0)continue;const g=project(x.x,x.y);cell('cross','cross',a*SHEET.cross.fps,g.x,g.y+h*.04,h*1.3,a>x.boom-x.t0+.3?1-smooth((a-(x.boom-x.t0+.3))/.15):1,false);}
  // ③ 성혈검우: 떨어지는 동안 하늘에서 가속, 꽂힌 뒤 칼끝이 땅에 박혀 흔들림 없이 서 있다가 사라짐. 회전 없음(정십자).
  for(const w of s.swords){const g=project(w.x,w.y),sh=h*1.55,sw=sh/3;let y,al=1;
   if(!w.landed){const k=clamp((t-w.t0)/(w.at-w.t0),0,1),fall=(1-k*k)*h*4.2;y=g.y-fall;al=smooth(k/.15);
    if(k<1&&!lo)beam('trail',{x:g.x,y:y-sh*.95-h*.9},{x:g.x,y:y-sh*.6},sw*.55,.55*al);}
   else{const a=t-w.at;y=g.y+h*.08;al=a<w.end-w.at-.3?1:1-smooth((a-(w.end-w.at-.3))/.3);}
   img('sword',sword,g.x,y,sw,sh,{px:.5,py:.985,alpha:al});}}
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(k<0||k>=1)continue;
  if(v.k==='hit'){const g=scr(v.x,v.y,.45);cell('hit','hit',age*SHEET.hit.fps,g.x,g.y,h*(v.small?1.1:1.5),1-smooth((k-.7)/.3),(v.t0*13|0)%2===1);}
  else if(v.k==='burst'){const g=project(v.x,v.y);cell('burst','burst',age*SHEET.burst.fps,g.x,g.y+h*.06,h*2.1,1-smooth((k-.75)/.25),false);}
  else if(v.k==='arc')bloodArc(v,age,k,h,lo);
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
   if(on){if(!isSl(P())&&busy(main))wipe(main);if(!crim&&isSl(P()))crimson();/* 지역 이동 때 엔진 그림 캐시가 비므로 슬레이어가 있는 동안 번개 시트를 미리 받아 다시 칠해 둠 */
    for(const s of states()){if(!busy(s))continue;stepNeedles(s);stepSwords(s);stepLattice(s);stepCrosses(s);if(busy(s))any=true;}}
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(any)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();const r=await base.apply(this,a);warm();return r;};}
 warm();
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(kind,body){if(!['needle','swords','lattice'].includes(kind))return false;const s=st(body||P());if(!s)return false;s.force=kind;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(null),t=T(),left=k=>Math.max(0,+(s.ready[k]-t).toFixed(3));
 return {revision:REV,on,errors,lastError,boltSheet:!!crim,stats:{...s.stats},cd:{needle:left('needle'),swords:left('swords'),lattice:left('lattice')},vis:vis.length,drawCalls,
  needles:s.needles.map(c=>({id:c.id,jumps:c.k,hit:c.hit.size})),
  crosses:s.crosses.map(x=>({x:x.x,y:x.y,boomed:x.boomed})),
  swords:s.swords.map(w=>({i:w.i,foe:w.foe?.id??null,x:+w.x.toFixed(2),y:+w.y.toFixed(2),landed:w.landed})),
  lattice:s.lattice?{age:+(t-s.lattice.t0).toFixed(3),waves:s.lattice.wave,lines:s.lattice.lines.map(q=>({dir:q.dir,c:q.c,wave:q.wave}))}:null};}
window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__=Object.freeze({revision:REV,config:CFG,on:()=>on,set,force,inspect});
})();

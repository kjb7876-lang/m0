// R947 슬레이어 확률 발동 피 패시브 — 사용자 2026-11-12 13:13Z (요약) 슬레이어 확률 발동 특수 패시브 셋.
//  ① 피 레이저가 체크(격자) 모양으로 주변을 덮으며 난사(드묾) ② 기본 피 다루기 탄(흔함) ③ 피 십자검 여러 자루가 하늘에서 내려와 적에게 꽂힘. Dots 이펙트 개선 적용.
//  다른 작품은 느낌만 참고했다. 기술 이름·그림·연출은 StoryWorld 고유(슬레이어 테마: 십자군 광전사·주의 보혈 — 진홍·검붉은 피·흰 빛심).
//  새 키·새 슬롯 없음. 기본 공격(A)이 성공할 때마다, 그리고 R425 적혈 오라 중 분신이 벨 때마다 주사위 한 번 → 셋 중 하나만 터진다.
//   ② 「혈침(血針)」 20%, 대기 0.9초 : 사용자 13:38Z "체인라이트닝 느낌마냥 연쇄되게 대신 적혈로" — 방금 벤 적에서 액체 피 줄기가 0.07초마다 3.8칸 안 가장 가까운
//      다음 적으로 튄다(최대 6명, 첫 ×0.85 에서 튈 때마다 ×0.85, 같은 적 한 번, 벽 너머로는 안 튐). 14:12Z "번개보다는 완전한 적혈 느낌" → 번개 그림 없이 피 줄기·핏방울·피 튐.
//   ③ 「성혈검우(聖血劍雨)」 8%, 대기 6초 : 피로 빚은 십자검 7자루가 6.5칸 안 가까운 적들 머리 위에서 차례로 떨어져 꽂힌다(자루마다 ×1.3, 곁 0.9칸 ×0.4).
//      십자검은 칼날이 아래 — 위가 짧고 아래가 긴 정십자 모양 그대로, 회전·상하 반전 없이 그린다(사용자 상시 규칙 2026-11-08).
//   ① 「혈격자(血格子)」 4%, 대기 14초 : 슬레이어 둘레 5칸에 피 레이저가 가로 줄·세로 줄을 번갈아 그으며 0.2초마다 8번 난사한다(체크 무늬가 바닥을 덮음).
//      줄에 걸린 적은 한 번의 난사에 한 번씩 ×0.32, 벽 너머는 안 맞음. 격자 가운데는 슬레이어를 따라간다.
//      사용자 13:39Z "피레이져 교차지점에 적혈피십자가 생기면서 적에게 피폭발피해" — 세로줄이 그어질 때 앞 가로줄과 엇갈린 교차점 중 적 곁(0.95칸)에
//      적혈 십자가(Dots R585 시트, 정십자)가 솟고 0.55초 뒤 피 폭발(반경 1칸, ×0.55). 한 교차점에 하나, 한 번의 혈격자에 최대 10개.
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙·R586 피의 낙인 그대로)·blocked·clearLine. 협동(R62 mode≠off)에서는 발동하지 않는다.
//  R425 분신(slayer-blood-r425.js)은 고치지 않는다 — 분신 베기 피해(r425:'clone')를 엿보아 발동 기회로만 센다.
//  생존 배치 영웅(R720, player.r720Ally 몸): 대기 시간·탄·검·격자 상태를 몸마다 따로 둔다.
//  그림: 적중·꽂힘 피 튐·교차점 십자가는 Dots 시트(R585 slayer-burst-small·slayer-r-cross, R587 SL11 slayer-hit) 재사용. 레이저·피 줄기·십자검 몸체는 처음 한 번 오프스크린에 그려 둔 고정 그림(임시) —
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
 maxDraws:96,maxVis:48});/* R985: 혈격자 줄이 줄기+양끝 3장이 되어 60→96 */
const SHEET=Object.freeze({
 burst:Object.freeze({path:'assets/r585/slayer-burst-small.webp',cell:192,cols:6,frames:24,fps:30,px:128/256,py:224/256}),
 hit:Object.freeze({path:'assets/r587/slayer-hit.webp',cell:192,cols:6,frames:24,fps:40,px:132/256,py:158/256}),
 cross:Object.freeze({path:'assets/r585/slayer-r-cross.webp',cell:192,cols:6,frames:24,fps:23.6,px:128/256,py:224/256}),
 // Dots CX-0089SB(11-13 적용): SB-01 떨어지는 십자검 12장(칼끝 피벗 128,252/256), SB-02 꽂힘 16장(128,225/256, 끝은 흩어져 사라짐),
 // SB-06 추가2 액체 피 줄기 12장 루프(256×64, 줄기 x 11~245) + 머리 핏덩이(앞 4장만: 5~8장은 위로 16px 어긋남). 알파 16 이하는 포장 때 지움.
 fall:Object.freeze({path:'assets/r947/slayer-sword-fall.webp',cell:192,cols:6,frames:12,fps:16,px:.5,py:252/256,body:217/256}),
 stab:Object.freeze({path:'assets/r947/slayer-sword-stab.webp',cell:192,cols:4,frames:16,fps:15,px:.5,py:225/256}),
 stream:Object.freeze({path:'assets/r947/slayer-blood-stream.webp',cw:256,ch:64,cols:1,frames:12,fps:20,x0:11/256,x1:245/256,band:31/64}),
 head:Object.freeze({path:'assets/r947/slayer-blood-head.webp',cell:64,cols:4,frames:4,fps:20,px:.5,py:.5}),
 // R985 Dots SB-03 피 레이저 줄기(원본 512×64 12장 → 384×48, 양 끝이 잘린 띠라 늘여 씀) + SB-03b 끝조각(64×64 12장, 왼쪽 x3 에서 줄기와 이어지고 x52 에서 끝남)
 lbeam:Object.freeze({path:'assets/r947/slayer-lattice-beam.webp',cw:384,ch:48,cols:6,frames:12,fps:30}),
 lend:Object.freeze({path:'assets/r947/slayer-lattice-end.webp',cell:64,cols:6,frames:12,fps:30,x0:3/64,x1:52/64})});
const SHEET_PATHS=Object.values(SHEET).map(v=>v.path);
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
const G971=(h,a)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.chances(h,a);return Array.isArray(v)&&v.length===a.length&&v.every(x=>Number.isFinite(x)&&x>=0)?v:a;}catch(_){return a;}},D971=(h,s)=>{try{const g=window.__STORYWORLD_PASSIVE_GROWTH_R971__,v=g&&g.cooldown(h,s);return Number.isFinite(v)&&v>0?v:s;}catch(_){return s;}};/* R971 특수 패시브 강화(0단계=원래 값) */
function pick(s){if(s.force){const k=s.force;s.force=null;return k;}
 const r=Math.random(),[a,b,c]=G971(HERO,[CFG.needle.chance,CFG.swords.chance,CFG.lattice.chance]),k=r<a?'needle':r<a+b?'swords':r<a+b+c?'lattice':null;
 return k&&T()>=s.ready[k]?k:null;}
const nearOf=(p,r)=>{let b=null,bd=r;for(const e of foes()){if(!(e.hp>0)||!fin(e.x)||!fin(e.y))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<=bd){bd=d;b=e;}}return b;};
function onSwing(p,foe){const s=st(p);s.stats.swings++;if(!solo()){s.stats.coopSkipped++;return;}
 const k=pick(s);if(!k)return;
 /* 대상이 없어 안 나가면 대기 시간도 쓰지 않음(R947-3) */
 const fired=k==='needle'?castNeedle(s,p,foe):k==='swords'?castSwords(s,p):castLattice(s,p);if(fired)s.ready[k]=T()+D971(HERO,CFG[k].icd);}
// ② 혈침
// 적혈 연쇄: 벤 적에서 시작해 0.07초마다 3.8칸 안 가장 가까운 다음 적으로 피 줄기가 튄다(최대 6명, 튈 때마다 ×0.85). 벽 너머로는 안 튐.
function castNeedle(s,p,foe){const M=CFG.needle,e=foe&&foe.hp>0?foe:nearOf(p,M.first);if(!e)return false;s.stats.needles++;
 s.needles.push({id:'n'+(++serial),last:{x:p.x,y:p.y},first:e,hit:new Set(),k:0,next:T(),pw:power(),room,seed:serial*7.13});while(s.needles.length>M.max)s.needles.shift();arm();return true;}
function stepNeedles(s){const M=CFG.needle,t=T();for(let i=s.needles.length-1;i>=0;i--){const c=s.needles[i];if(c.room!==room){s.needles.splice(i,1);continue;}let done=false;
 while(!done&&t>=c.next){if(c.k>=M.jumps){done=true;break;}let e=null;
  if(c.k===0)e=c.first&&c.first.hp>0?c.first:null;
  else{let bd=M.jump,blockedNear=false;for(const q of foes()){if(!(q.hp>0)||c.hit.has(q)||!fin(q.x)||!fin(q.y))continue;const d=Math.hypot(q.x-c.last.x,q.y-c.last.y);if(d>bd)continue;if(!line(c.last,q)){blockedNear=true;continue;}bd=d;e=q;}
   if(!e&&blockedNear)s.stats.wallStops++;}
  if(!e){done=true;break;}c.hit.add(e);const from=c.last;c.last={x:e.x,y:e.y};
  strike(s,e,M.mult*Math.pow(M.decay,c.k),c.pw,'needle',c.id+':'+c.k);addVis({k:'arc',a:from,b:{x:e.x,y:e.y},life:.34,seed:c.seed+c.k,lead:c.k===0});addVis({k:'burst',x:e.x,y:e.y,life:.7});addVis({k:'hit',x:e.x,y:e.y,life:.45,small:true});
  c.k++;c.next+=M.gap;}
 if(done)s.needles.splice(i,1);}}
// ③ 성혈검우
function castSwords(s,p){const C=CFG.swords,near=foes().filter(e=>e.hp>0&&fin(e.x)&&fin(e.y)&&Math.hypot(e.x-p.x,e.y-p.y)<=C.range&&line(p,e)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,C.count);
 if(!near.length)return false;const t=T(),pw=power(),id='s'+(++serial);s.stats.swordCasts++;
 for(let i=0;i<C.count;i++){const e=near[i%near.length],lap=Math.floor(i/near.length),a=i*2.39996,r=lap?.38:0;
  s.swords.push({i,foe:e,dx:Math.cos(a)*r,dy:Math.sin(a)*r,x:e.x,y:e.y,at:t+C.fall+i*C.stagger,t0:t+i*C.stagger,landed:false,end:t+C.fall+i*C.stagger+C.stuck+.3,pw,id:id+':'+i,room});}
 while(s.swords.length>C.count*2)s.swords.shift();
 say('성혈검우',p.x,p.y-.5);sfx('special');arm();return true;}
function stepSwords(s){const t=T(),C=CFG.swords;for(let i=s.swords.length-1;i>=0;i--){const w=s.swords[i];if(w.room!==room){s.swords.splice(i,1);continue;}
 if(!w.landed){if(w.foe&&w.foe.hp>0&&fin(w.foe.x)){const tx=w.foe.x+w.dx,ty=w.foe.y+w.dy;if(open(tx,ty,.1)){w.x=tx;w.y=ty;}}
  if(t>=w.at){w.landed=true;const e=w.foe;if(e&&e.hp>0&&Math.hypot(e.x-w.x,e.y-w.y)<=.6+(e.radius||0))strike(s,e,C.mult,w.pw,'sword',w.id);
   const o={x:w.x,y:w.y};for(const q of foes())if(q!==e&&q.hp>0&&Math.hypot(q.x-o.x,q.y-o.y)<=C.splash+(q.radius||0)&&line(o,q))strike(s,q,C.splashMult,w.pw,'swordSplash',w.id+'b');
   addVis({k:'burst',x:w.x,y:w.y,life:.8});if(w.i===0||w.i===C.count-1)try{if(typeof shake!=='undefined'&&fin(shake))shake=Math.max(shake,.7);}catch(_){}}}
 if(t>=w.end)s.swords.splice(i,1);}}
// ① 혈격자
function castLattice(s,p){const t=T();s.stats.lattices++;s.lattice={t0:t,room,pw:power(),wave:0,next:t+CFG.lattice.lead,lines:[],id:'l'+(++serial),cx:p.x,cy:p.y,crossKeys:new Set(),crossN:0};
 addVis({k:'pulse',x:p.x,y:p.y,life:.5});say('혈격자',p.x,p.y-.5);sfx('special');arm();return true;}
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
// 핏방울: 위가 뾰족한 물방울 + 윤기 점
function dropTex(){return make('blooddrop',32,48,(g,w,h)=>{const cx=w/2;g.fillStyle='rgba(60,0,8,1)';g.beginPath();g.moveTo(cx,2);g.quadraticCurveTo(w-2,h*.62,cx,h-2);g.quadraticCurveTo(2,h*.62,cx,2);g.fill();
  g.fillStyle='rgba(176,8,28,1)';g.beginPath();g.moveTo(cx,7);g.quadraticCurveTo(w-6,h*.62,cx,h-6);g.quadraticCurveTo(6,h*.62,cx,7);g.fill();
  g.fillStyle='rgba(255,200,196,.8)';g.beginPath();g.ellipse(cx-4,h*.6,2.4,4,-.3,0,7);g.fill();});}
// 바닥 고리(시전 맥동): 진홍 고리 한 겹
function ringTex(){return make('ring',256,128,(g,w,h)=>{g.strokeStyle='rgba(160,0,24,.5)';g.lineWidth=14;g.beginPath();g.ellipse(w/2,h/2,w/2-10,h/2-8,0,0,7);g.stroke();
  g.strokeStyle='rgba(255,70,80,.95)';g.lineWidth=4;g.beginPath();g.ellipse(w/2,h/2,w/2-10,h/2-8,0,0,7);g.stroke();});}
function warm(){try{dropTex();ringTex();if(typeof ensureImages==='function')Promise.resolve(ensureImages(SHEET_PATHS)).catch(()=>{});}catch(e){fail(e);}}
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
function cell(id,k,fr,x,y,size,alpha,flip){const S=SHEET[k],im=sheetImg(k);if(!im||budget<=0||!(alpha>0))return false;budget--;drawCalls++;fr=clamp(Math.floor(fr),0,S.frames-1);
 scoped(id,()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha,0,1);ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  ctx.drawImage(im,(fr%S.cols)*S.cell,Math.floor(fr/S.cols)*S.cell,S.cell,S.cell,-size*S.px,-size*S.py,size,size);}catch(e){fail(e);}finally{ctx.restore();}});return true;}
const scr=(x,y,lift=.4)=>{const q=project(x,y);return {x:q.x,y:q.y-H()*lift};};
// 혈격자 레이저 한 줄(R985): A→B 로 눕힌 Dots SB-03 줄기 + 양 끝 SB-03b 끝조각(왼쪽은 좌우 뒤집음 — 레이저라 뒤집어도 됨, 십자가 아님).
// 덮어 그리기(더하기면 분홍·흰빛으로 바래 피가 아니라 빛으로 읽힘). 끝조각 끝이 정확히 A·B 에 오도록 줄기를 안쪽으로 줄인다(벽에서 끊긴 줄이 벽을 넘지 않게). 시트 2장만 재사용, 새 캔버스 없음.
function beam(id,A,B,th,alpha,age){const L=Math.hypot(B.x-A.x,B.y-A.y);if(!(L>1)||!(th>0)||!(alpha>0))return;const ang=Math.atan2(B.y-A.y,B.x-A.x),S=SHEET.lbeam,E=SHEET.lend,bi=sheetImg('lbeam'),ei=sheetImg('lend');if(!bi)return;
 const fr=Math.floor((Number.isFinite(age)?age:0)*S.fps)%S.frames,cap=ei&&!low()?Math.min(th*(E.x1-E.x0),L*.3):0,inner=L-cap*2;
 const put=(im,sx,sy,sw,sh,dx,dy,dw,dh,flip)=>{if(budget<=0)return;budget--;drawCalls++;scoped(id,()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha,0,1);ctx.translate(A.x,A.y);ctx.rotate(ang);if(flip){ctx.translate(L,0);ctx.scale(-1,1);}
  ctx.drawImage(im,sx,sy,sw,sh,dx,dy,dw,dh);}catch(e){fail(e);}finally{ctx.restore();}});};
 put(bi,(fr%S.cols)*S.cw,Math.floor(fr/S.cols)*S.ch,S.cw,S.ch,cap-1,-th/2,inner+2,th,false);
 if(cap>0){const ef=Math.floor((Number.isFinite(age)?age:0)*E.fps+3)%E.frames,sx=(ef%E.cols)*E.cell,sy=Math.floor(ef/E.cols)*E.cell,sc=cap/(E.x1-E.x0)/E.cell;
  put(ei,sx,sy,E.cell,E.cell,L-cap-E.x0*E.cell*sc,-th/2,E.cell*sc,th,false);put(ei,sx,sy,E.cell,E.cell,L-cap-E.x0*E.cell*sc,-th/2,E.cell*sc,th,true);}}
// 적혈 연쇄 한 줄기(사용자 14:12Z "번개보다는 완전한 적혈 느낌"): 번개 대신 액체 피 줄기가 A→B 로 활처럼 휘어 0.09초에 뻗고(머리는 굵은 핏덩이),
// 지나간 자리에서 핏방울이 떨어지며, 닿은 자리는 Dots 피 튐(R585 burst-small). 덮어 그리기(빛이 아니라 피).
function bloodArc(v,age,k,h,lo){const A=scr(v.a.x,v.a.y,v.lead?.55:.45),B=scr(v.b.x,v.b.y,.45),dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy);if(!(L>2))return;
 const S=SHEET.stream,im=sheetImg('stream'),dr=dropTex(),ang=Math.atan2(dy,dx),reach=smooth(age/.09),al=k<.3?1:1-smooth((k-.3)/.7);
 // Dots SB-06 줄기 한 장을 A→B 로 눕혀 그리되, 뻗는 동안은 원본 왼쪽부터 reach 만큼만 잘라 보여 준다(늘임 없이 '흘러 나감').
 if(im&&budget>0&&al>0){budget--;drawCalls++;const fr=Math.floor(age*S.fps)%S.frames,span=S.x1-S.x0,dw=L/span,dh=h*.55/S.band,sw=S.cw*(S.x0+span*reach);
  scoped('needle',()=>{ctx.save();try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(al,0,1);ctx.translate(A.x,A.y);ctx.rotate(ang);
   ctx.drawImage(im,0,fr*S.ch,sw,S.ch,-dw*S.x0,-dh/2,dw*sw/S.cw,dh);}catch(e){fail(e);}finally{ctx.restore();}});}
 if(reach<1){const H2=SHEET.head,hi=sheetImg('head');if(hi&&budget>0){budget--;drawCalls++;const q={x:A.x+dx*reach,y:A.y+dy*reach},sz=h*.36,fr=Math.floor(age*H2.fps)%H2.frames;
  scoped('needle',()=>{ctx.save();try{ctx.translate(q.x,q.y);ctx.rotate(ang);ctx.drawImage(hi,fr*H2.cell,0,H2.cell,H2.cell,-sz*.8,-sz/2,sz,sz);}catch(e){fail(e);}finally{ctx.restore();}});}}
 const m=lo?2:4;for(let i=0;i<m;i++){const t=(i+.5)/m,a0=t*.09,fa=age-a0;if(fa<0)continue;const q={x:A.x+dx*t,y:A.y+dy*t},fall=.5*h*7*fa*fa,da=1-smooth((fa-.15)/.2);if(da<=0)continue;
  img('needle',dr,q.x+((i*37+v.seed*11)%9-4)*h*.02,q.y+fall,h*.1,h*.15,{alpha:da*al});}}
function drawAll(){const t=T(),lo=low(),h=H(),u=unit();budget=lo?28:CFG.maxDraws;
 const ring=ringTex();
 for(const s of states()){
  // ① 혈격자: 바닥 높이(살짝 띄움) 줄. 한 줄은 0.05초에 굵어졌다 0.3초에 사라짐.
  const L=s.lattice;if(L){for(const q of L.lines){const a=t-q.t;if(a<0||a>.34)continue;const k=a<.05?smooth(a/.05):1-smooth((a-.05)/.29),lift=.12;
    const A=q.dir==='h'?scr(q.a0,q.c,lift):scr(q.c,q.a0,lift),B=q.dir==='h'?scr(q.a1,q.c,lift):scr(q.c,q.a1,lift);beam('lattice',A,B,h*(.34+.16*k),k,a);}}
  // ① 혈격자 교차점 적혈 십자가(Dots R585 적혈 십자가 시트, 회전·뒤집기 없음 — 정십자)
  for(const x of s.crosses){const a=t-x.t0;if(a<0)continue;const g=project(x.x,x.y);cell('cross','cross',a*SHEET.cross.fps,g.x,g.y+h*.04,h*1.3,a>x.boom-x.t0+.3?1-smooth((a-(x.boom-x.t0+.3))/.15):1,false);}
  // ③ 성혈검우: 떨어지는 동안 하늘에서 가속, 꽂힌 뒤 칼끝이 땅에 박혀 흔들림 없이 서 있다가 사라짐. 회전 없음(정십자).
  for(const w of s.swords){const g=project(w.x,w.y),F=SHEET.fall,size=h*1.55/F.body;
   if(!w.landed){const k=clamp((t-w.t0)/(w.at-w.t0),0,1),fall=(1-k*k)*h*4.2;cell('sword','fall',((t-w.t0)*F.fps)%F.frames,g.x,g.y-fall,size,smooth(k/.15),false);}
   else{const a=t-w.at,S=SHEET.stab,fr=a*S.fps,left=w.end-t;cell('sword','stab',Math.min(fr,S.frames-1),g.x,g.y+h*.08,size*1.06,left<.12?smooth(left/.12):1,false);}}}
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
   if(on){if(!isSl(P())&&busy(main))wipe(main);
    for(const s of states()){if(!busy(s))continue;stepNeedles(s);stepSwords(s);stepLattice(s);stepCrosses(s);if(busy(s))any=true;}}
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(any)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();const r=await base.apply(this,a);warm();return r;};}
 warm();
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(kind,body){if(!['needle','swords','lattice'].includes(kind))return false;const s=st(body||P());if(!s)return false;s.force=kind;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(null),t=T(),left=k=>Math.max(0,+(s.ready[k]-t).toFixed(3));
 return {revision:REV,on,errors,lastError,stats:{...s.stats},cd:{needle:left('needle'),swords:left('swords'),lattice:left('lattice')},vis:vis.length,drawCalls,
  needles:s.needles.map(c=>({id:c.id,jumps:c.k,hit:c.hit.size})),
  crosses:s.crosses.map(x=>({x:x.x,y:x.y,boomed:x.boomed})),
  swords:s.swords.map(w=>({i:w.i,foe:w.foe?.id??null,x:+w.x.toFixed(2),y:+w.y.toFixed(2),landed:w.landed})),
  lattice:s.lattice?{age:+(t-s.lattice.t0).toFixed(3),waves:s.lattice.wave,lines:s.lattice.lines.map(q=>({dir:q.dir,c:q.c,wave:q.wave}))}:null};}
window.__STORYWORLD_SLAYER_BLOOD_PASSIVE_R947__=Object.freeze({revision:REV,config:CFG,on:()=>on,set,force,inspect});
})();

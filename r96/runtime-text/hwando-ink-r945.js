// R945 환도 확률 발동 수묵 패시브 — 사용자 2026-11-12 12:01Z (요약) 환도 확률 발동 특수 패시브 연출, 옛이야기 속 의협 세 사람(도술 부리는 도사·매화 가지를 남기는 의적·
//  축지와 분신을 쓰는 두령) 모티브로 동양화·수묵화풍 기술. ① 흑백 검기·참격이 기본 공격 방향으로 적을 관통하며 날아감 ② 수묵 분신 7체를 7초간 적 주변에 불러
//  환도의 모든 모션을 따라 하게 ③ 세 모티브를 엮은 수묵 합동 기술. 자산은 Dots 에 요청(CX-0085HI), 드라이브에 쓸 만한 이펙트가 있으면 개선 적용.
//  다른 작품·인물은 느낌만 참고했다. 기술 이름·그림·연출은 StoryWorld 고유(먹 검정·여백 흰색·낙관 주홍 세 색).
//  새 키·새 슬롯 없음. 기본 공격(A)이 성공할 때마다 주사위 한 번 → 셋 중 하나만 터진다(한 번의 공격에 하나).
//   ① 「묵월(墨月)」 18%, 대기 1.2초 : 먹 초승달 한 줄이 방금 벤 적 쪽으로 7칸 날아가며 줄 위 적을 모두 꿰뚫는다(각 공격력 ×0.9, 벽에서 멈춤).
//      그림 = Dots CX-0062HW 검풍 시트(assets/r590/hwando-q-wind-blade)를 먹 층(검정)·여백 층(흰색) 두 겹으로 크게 다시 씀 + 먹 붓 자국 꼬리.
//   ② 「칠묵영(七墨影)」 6%, 대기 7초 : 수묵 분신 7체가 7초 동안 6칸 안 적들 곁에 선다. 분신은 진짜 영웅 그리기(drawHero)를 자리만 옮겨 먹빛으로 다시 그리므로
//      걷기·기본 공격·Q·W·E·R·피격 자세까지 영웅과 같은 순간 같은 모션이다. 영웅이 기본 공격·Q·W·E·R 을 쓸 때마다 분신도 곁(1.8칸)의 적을 한 번씩 벤다(공격력 ×0.25).
//   ③ 「삼협묵희(三俠墨戲)」 3%, 대기 20초 : 부적 7장이 7칸 안 적 일곱에게 날아가 붙고(도술) → 그 자리에 주홍 매화 낙관이 찍히고(매화 의적) →
//      먹 그림자 셋이 구름을 타고 나타나 한 획씩 가로지른 뒤(축지 두령) 1.6초에 낙관이 터진다: 표식 적 ×2.2, 사거리 안 나머지 적 ×0.6. 영웅은 옮기지 않는다.
//  판정은 엔진 hitEnemy(난이도·노출·보스 규칙 그대로)·blocked·clearLine. 협동(R62 mode≠off)에서는 발동하지 않는다.
//  생존 배치 영웅(R720, player.r720Ally 몸): 대기 시간·분신·합동기 상태를 몸마다 따로 둔다 — 배치된 환도가 부른 분신은 그 환도 곁 적에게 서고, 조종 영웅 상태와 섞이지 않는다.
//  코드 그림(붓 자국·먹 번짐·매화·부적·낙관)은 처음 한 번 오프스크린 캔버스에 그려 둔 고정 그림(기록기 정적 원본)이며 Dots 시트가 오기 전 임시다.
//  렉: 한 프레임 그림 48개 상한(저사양 28), 검기 동시 4개, 할 일이 없으면 그리기 표지를 effects 에서 뺀다. 필터는 grayscale·contrast·brightness 만.
//  끄기: localStorage['storyworld.r945.hwandoInk']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_HWANDO_INK_R945__)return;
const REV='R945-hwando-ink-1',KEY='storyworld.r945.hwandoInk';
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const CFG=Object.freeze({
 moon:Object.freeze({chance:.18,icd:1.2,mult:.9,range:7,radius:.7,speed:13,max:4}),
 clones:Object.freeze({chance:.06,count:7,life:7,icd:7,mult:.25,seek:6,ring:1,reach:1.8}),
 trio:Object.freeze({chance:.03,icd:20,mult:2.2,bloomMult:.6,range:7,marks:7,strikeAt:1.6,life:2.3}),
 maxDraws:48,maxVis:40});
const INK='grayscale(1) contrast(1.5) brightness(0.92)',INKDARK='grayscale(1) brightness(0.1)';// 분신 수묵빛: 어두운 바닥에서 읽히게 한지처럼 밝은 무채색 몸에 먹 선(기록기 허용 필터만)
const BLADE=Object.freeze({path:'assets/r590/hwando-q-wind-blade.webp',cell:256,cols:6,pivot:[205,122],th:150,loop:20});
const fin=v=>typeof v==='number'&&Number.isFinite(v),clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
let lastError=null,errors=0;const fail=e=>{errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const H=()=>typeof actorHeight==='function'?actorHeight():60;
const unit=()=>(typeof TILE==='number'?TILE:32)*(typeof zoom==='number'?zoom:1);
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const low=()=>!!(typeof settings!=='undefined'&&settings?.lowFx)||!!window.__STORYWORLD_MOBILE_PERF_R298__?.inspect?.().mobile;
const isHw=p=>!!p&&p.hero==='hwando'&&p.hp>0;
const P=()=>{try{return typeof player!=='undefined'?player:null;}catch(_){return null;}};
const open=(x,y,r=.2)=>typeof blocked!=='function'||!blocked(x,y,r,room);
const line=(a,b)=>typeof clearLine!=='function'||clearLine(a,b,room);
const foes=()=>{try{return typeof liveEnemies==='function'?liveEnemies():[];}catch(_){return [];}};
const power=()=>{try{return typeof attackPower==='function'?attackPower():0;}catch(_){return 0;}};
const aim=()=>{try{return typeof storyAim22==='function'?storyAim22():0;}catch(_){return 0;}};
const say=(t,x,y)=>{try{if(typeof floatText==='function')floatText(t,x,y,'#f4f1e6');}catch(_){}};
const sfx=k=>{try{if(typeof sound==='function')sound(k);}catch(_){}};
// ---- 상태: 조종 영웅 하나 + 생존 배치 영웅(r720Ally 몸)마다 하나 ------------------------------------------------
const fresh=body=>({body,ready:{moon:-1e9,clones:-1e9,trio:-1e9},force:null,clones:[],cloneEnd:-1e9,phantoms:[],trio:null,blades:[],mim:{},drawT:null,drawC:null,
 stats:{swings:0,moons:0,cloneCasts:0,trios:0,multi:0,hits:0,damage:0,cloneHits:0,wallStops:0,coopSkipped:0,cloneDraws:0}});
const main=fresh(null),allyState=new WeakMap(),allies=[];
function st(p,make=true){if(p&&p.r720Ally===true){let s=allyState.get(p);if(!s&&make){s=fresh(p);allyState.set(p,s);allies.push(s);if(allies.length>8)allies.shift();}return s||null;}return main;}
const states=()=>[main,...allies];
const bodyOf=s=>s.body||P();
const busy=s=>s.blades.length||s.clones.length||s.phantoms.length||s.trio;
function wipe(s){s.blades.length=0;s.clones.length=0;s.phantoms.length=0;s.trio=null;s.cloneEnd=-1e9;}
// ---- 피해 ----------------------------------------------------------------------------------------------------
function strike(s,e,mult,base,tag,id){if(!solo()){s.stats.coopSkipped++;return false;}if(typeof hitEnemy!=='function'||!e||!(e.hp>0))return false;const dmg=base*mult;if(!(dmg>0))return false;
 if(typeof damageable3==='function'&&!damageable3(e))return false;const old=e.hp,ok=hitEnemy(e,dmg,{kind:'story-hwando-ink-r945',attackKind9:'skill',friendly:true,owner:'hero',sourceHero:'hwando',sourceSlot:'a',attackId9:'r945:'+id,r945:tag});
 if(ok&&old>e.hp){s.stats.hits++;s.stats.damage+=old-e.hp;if(tag==='clone')s.stats.cloneHits++;try{if(typeof floatText==='function')floatText(Math.round(old-e.hp),e.x,e.y);}catch(_){}}return ok;}
// ---- 그림 목록·표지 ------------------------------------------------------------------------------------------
const vis=[];let serial=0;
const addVis=v=>{vis.push({t0:T(),...v});while(vis.length>CFG.maxVis)vis.shift();arm();};
const SENT={type:'r945-hwando-ink',x:0,y:0,age:0,life:Infinity,r945Sentinel:true};
function arm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)&&!effects.includes(SENT)){SENT.age=0;effects.push(SENT);}}catch(_){}}
function disarm(){try{if(typeof effects!=='undefined'&&Array.isArray(effects)){const i=effects.indexOf(SENT);if(i>=0)effects.splice(i,1);}}catch(_){}}
function clearAll(){for(const s of states())wipe(s);vis.length=0;disarm();}
// ---- 발동 ----------------------------------------------------------------------------------------------------
function pick(s){const t=T();if(s.force){const k=s.force;s.force=null;return k;}
 const r=Math.random(),m=CFG.moon.chance,c=CFG.clones.chance,q=CFG.trio.chance,k=r<m?'moon':r<m+c?'clones':r<m+c+q?'trio':null;
 return k&&t>=s.ready[k]?k:null;}
function onSwing(p){const s=st(p);s.stats.swings++;mimic(s,p,'a');if(!solo()){s.stats.coopSkipped++;return;}
 const k=pick(s);if(!k)return;const t=T();s.ready[k]=t+CFG[k].icd;
 if(k==='moon')castMoon(s,p);else if(k==='clones')castClones(s,p);else castTrio(s,p);}
const nearOf=(p,r)=>{let b=null,bd=r;for(const e of foes()){if(!(e.hp>0)||!fin(e.x)||!fin(e.y))continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<=bd){bd=d;b=e;}}return b;};
// ① 묵월
function castMoon(s,p){const e=nearOf(p,4.5),a=e?Math.atan2(e.y-p.y,e.x-p.x):aim(),ux=Math.cos(a),uy=Math.sin(a),id='m'+(++serial);s.stats.moons++;
 s.blades.push({id,ox:p.x,oy:p.y,x:p.x+ux*.6,y:p.y+uy*.6,ux,uy,a,pw:power(),travel:.6,hit:new Set(),room,t0:T()});while(s.blades.length>CFG.moon.max)s.blades.shift();
 addVis({k:'splash',x:p.x+ux*.7,y:p.y+uy*.7,life:.4,size:1.3});say('묵월',p.x,p.y-.4);sfx('special');arm();}
function stepBlades(s,dt){const M=CFG.moon;for(let i=s.blades.length-1;i>=0;i--){const b=s.blades[i];if(b.room!==room){s.blades.splice(i,1);continue;}
 let move=M.speed*dt,dead=false;while(move>1e-9&&!dead){const d=Math.min(.2,move);move-=d;const nx=b.x+b.ux*d,ny=b.y+b.uy*d;
  if(!open(nx,ny)){s.stats.wallStops++;dead=true;addVis({k:'splash',x:b.x,y:b.y,life:.45,size:1.5});break;}b.x=nx;b.y=ny;b.travel+=d;
  for(const e of foes()){if(!(e.hp>0)||b.hit.has(e))continue;if(Math.hypot(e.x-b.x,e.y-b.y)<M.radius+(e.radius||0)&&line(b,e)){b.hit.add(e);if(strike(s,e,M.mult,b.pw,'moon',b.id))addVis({k:'splash',x:e.x,y:e.y,life:.35,size:1});}}
  if(b.travel>=M.range){dead=true;addVis({k:'splash',x:b.x,y:b.y,life:.45,size:1.2});}}
 if(dead)s.blades.splice(i,1);}}
// ② 칠묵영
function spot(e,i,ring){for(let k=0;k<8;k++){const a=i*2.39996+k*Math.PI/4,x=e.x+Math.cos(a)*ring,y=e.y+Math.sin(a)*ring;if(open(x,y,.2)&&line({x,y},e))return {x,y,a};}return {x:e.x,y:e.y,a:0};}
function castClones(s,p){const C=CFG.clones,near=foes().filter(e=>e.hp>0&&fin(e.x)&&fin(e.y)&&Math.hypot(e.x-p.x,e.y-p.y)<=C.seek).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,C.count);
 if(!near.length)return;const t=T();s.stats.cloneCasts++;s.clones.length=0;s.cloneEnd=t+C.life;
 for(let i=0;i<C.count;i++){const e=near[i%near.length],q=spot(e,i,C.ring);s.clones.push({i,foe:e,x:q.x,y:q.y,a:q.a,t0:t+i*.03});addVis({k:'puff',x:q.x,y:q.y,life:.5,size:1.2});}
 say('칠묵영',p.x,p.y-.4);sfx('blink');arm();}
function stepClones(s,dt){if(!s.clones.length)return;const t=T(),C=CFG.clones,b=bodyOf(s);
 if(t>=s.cloneEnd||!isHw(b)){for(const c of s.clones)addVis({k:'puff',x:c.x,y:c.y,life:.5,size:1});s.clones.length=0;return;}
 for(const c of s.clones){if(!(c.foe&&c.foe.hp>0)){c.foe=nearOf(c,C.seek)||(b&&nearOf(b,C.seek));if(c.foe){const q=spot(c.foe,c.i,C.ring);c.a=q.a;}}
  if(!c.foe)continue;const tx=c.foe.x+Math.cos(c.a)*C.ring,ty=c.foe.y+Math.sin(c.a)*C.ring,d=Math.hypot(tx-c.x,ty-c.y);
  if(d>.02&&open(tx,ty,.2)){const k=Math.min(1,dt*9);c.x+=(tx-c.x)*k;c.y+=(ty-c.y)*k;}}}
// 영웅 모션을 따라 벤다: 기본 공격·Q·W·E·R 한 번마다 분신도 곁의 적을 한 번씩
function mimic(s,p,slot){if(!s||!s.clones.length||!solo())return;const t=T();if(s.mim[slot]===t&&slot!=='a'&&slot!=='q')return;s.mim[slot]=t;const C=CFG.clones,pw=power(),id='c'+(++serial);
 for(const c of s.clones){let e=c.foe&&c.foe.hp>0&&Math.hypot(c.foe.x-c.x,c.foe.y-c.y)<=C.reach?c.foe:nearOf(c,C.reach);if(!e||!line(c,e))continue;
  if(strike(s,e,C.mult,pw,'clone',id+':'+c.i)&&!low())addVis({k:'cut',a:{x:c.x,y:c.y},b:{x:e.x,y:e.y},life:.22});}}
// ③ 삼협묵희
function castTrio(s,p){const Q=CFG.trio,near=foes().filter(e=>e.hp>0&&fin(e.x)&&fin(e.y)&&Math.hypot(e.x-p.x,e.y-p.y)<=Q.range).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).slice(0,Q.marks);
 if(!near.length)return;let cx=0,cy=0;for(const e of near){cx+=e.x;cy+=e.y;}cx/=near.length;cy/=near.length;const t=T();s.stats.trios++;
 s.trio={t0:t,room,ox:p.x,oy:p.y,cx,cy,marks:near,pw:power(),struck:false,done:false,id:'t'+(++serial)};
 s.phantoms.length=0;for(let i=0;i<3;i++){const a=-Math.PI/2+i*Math.PI*2/3,R=2.4;let x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;if(!open(x,y,.2)){x=cx+Math.cos(a)*.8;y=cy+Math.sin(a)*.8;}
  s.phantoms.push({i,x,y,t0:t+.75+i*.2,end:t+Q.strikeAt+.35});}
 say('삼협묵희',p.x,p.y-.5);sfx('ego');arm();}
function stepTrio(s){const R=s.trio;if(!R)return;const t=T(),Q=CFG.trio;if(R.room!==room||!isHw(bodyOf(s))){s.trio=null;s.phantoms.length=0;return;}
 if(!R.struck&&t>=R.t0+Q.strikeAt){R.struck=true;const set=new Set(R.marks),o={x:R.ox,y:R.oy};
  for(const e of R.marks)if(e.hp>0)strike(s,e,Q.mult,R.pw,'trio',R.id);
  for(const e of foes())if(e.hp>0&&!set.has(e)&&Math.hypot(e.x-o.x,e.y-o.y)<=Q.range&&line(o,e))strike(s,e,Q.bloomMult,R.pw,'bloom',R.id+'b');
  try{if(typeof shake!=='undefined'&&fin(shake))shake=Math.max(shake,1.2);}catch(_){}sfx('special');}
 for(let i=s.phantoms.length-1;i>=0;i--)if(t>=s.phantoms[i].end)s.phantoms.splice(i,1);
 if(t>=R.t0+Q.life){R.done=true;s.trio=null;s.phantoms.length=0;}}
// ---- 코드 그림(임시): 처음 한 번 오프스크린에 그려 두는 고정 수묵 조각 ------------------------------------------
const tex=new Map(),INKRGB='14,14,18',WHITERGB='246,243,234';
function rnd(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function make(key,w,h,paint){if(tex.has(key))return tex.get(key);let c=null;try{if(typeof document==='undefined')return null;c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');if(!g)return null;paint(g,w,h,rnd(key.length*7919+w));
  c.__storyworldStaticSource=Object.freeze({path:'r945:'+key,immutable:true});}catch(e){fail(e);c=null;}tex.set(key,c);return c;}
// 마른 붓 자국(비백): 왼쪽 굵은 먹 머리 → 오른쪽으로 갈라지는 가는 결
function strokeTex(key,rgb){return make(key,512,128,(g,w,h,r)=>{const cy=h*.5;
  // 붓털 결: 머리(왼쪽)에서 넓게 퍼졌다가 꼬리(오른쪽)로 가며 모이고 끊긴다(비백). 끝이 뾰족해 네모 띠로 보이지 않게.
  for(let i=0;i<150;i++){const sp=(r()-.5)*2,y0=cy+sp*h*.42*Math.sqrt(1-Math.min(1,Math.abs(sp))*.4),x0=w*(.02+r()*.1),L=w*(.55+r()*.42)*(1-Math.abs(sp)*.35),x1=x0+L,y1=cy+sp*h*.08+(r()-.5)*4,th=1.2+r()*3.6*(1-Math.abs(sp)*.5),al=.22+r()*.55;
   const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,`rgba(${rgb},${al})`);gr.addColorStop(.55,`rgba(${rgb},${al*.85})`);gr.addColorStop(.85,`rgba(${rgb},${al*.35})`);gr.addColorStop(1,`rgba(${rgb},0)`);
   g.strokeStyle=gr;g.lineWidth=th;g.lineCap='round';g.beginPath();g.moveTo(x0,y0);g.bezierCurveTo(x0+L*.35,y0+(r()-.5)*6,x0+L*.7,(y0+y1)/2+(r()-.5)*5,x1,y1);g.stroke();}
  const gr=g.createRadialGradient(40,cy,4,40,cy,54);gr.addColorStop(0,`rgba(${rgb},.95)`);gr.addColorStop(.65,`rgba(${rgb},.55)`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;g.beginPath();g.ellipse(46,cy,50,h*.42,0,0,7);g.fill();});}
// 먹 번짐: 들쭉날쭉한 가장자리 + 튄 점
function blotTex(white){const C=white?WHITERGB:INKRGB;return make(white?'blotw':'blot',256,256,(g,w,h,r)=>{const cx=w/2,cy=h/2;for(let L=0;L<4;L++){g.fillStyle=`rgba(${C},${.26+L*.14})`;g.beginPath();const n=26,R=w*(.44-L*.07);
   for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr=R*(.72+r()*.3),x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.closePath();g.fill();}
  g.fillStyle=`rgba(${C},.8)`;for(let i=0;i<26;i++){const a=r()*7,d=w*(.3+r()*.19),s=1+r()*5;g.beginPath();g.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,s,0,7);g.fill();}});}
// 담묵 구름(여백에 번지는 옅은 먹)
function cloudTex(){return make('cloud',256,128,(g,w,h,r)=>{for(let i=0;i<16;i++){const x=w*(.15+r()*.7),y=h*(.35+r()*.4),R=22+r()*34,gr=g.createRadialGradient(x,y,2,x,y,R),v=205+Math.floor(r()*45);
   gr.addColorStop(0,`rgba(${v},${v},${v-6},.36)`);gr.addColorStop(1,`rgba(${v},${v},${v-6},0)`);g.fillStyle=gr;g.beginPath();g.arc(x,y,R,0,7);g.fill();}});}
// 주홍 매화 낙관(다섯 꽃잎 + 먹 꽃술)
function plumTex(){return make('plum',128,128,(g,w,h,r)=>{const cx=w/2,cy=h/2;for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5,x=cx+Math.cos(a)*27,y=cy+Math.sin(a)*27,gr=g.createRadialGradient(x,y,2,x,y,25);
   gr.addColorStop(0,'rgba(226,58,44,.96)');gr.addColorStop(.75,'rgba(178,30,30,.9)');gr.addColorStop(1,'rgba(150,20,24,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,25,0,7);g.fill();}
  g.fillStyle='rgba(250,236,214,.95)';g.beginPath();g.arc(cx,cy,9,0,7);g.fill();g.fillStyle='rgba(16,14,16,.9)';for(let i=0;i<9;i++){const a=i/9*Math.PI*2;g.beginPath();g.arc(cx+Math.cos(a)*13,cy+Math.sin(a)*13,2.2,0,7);g.fill();}});}
// 부적(한지 + 먹 획 + 주홍 인장) — 글자가 아닌 붓 무늬만
function charmTex(){return make('charm',64,128,(g,w,h,r)=>{g.fillStyle='rgba(239,230,205,.97)';g.fillRect(6,4,w-12,h-8);g.strokeStyle='rgba(18,16,18,.9)';g.lineWidth=2.5;g.strokeRect(9,7,w-18,h-14);
  g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(w/2,16);g.lineTo(w/2,h-40);g.stroke();g.lineWidth=3;for(let i=0;i<4;i++){const y=26+i*16;g.beginPath();g.moveTo(17,y+(r()-.5)*4);g.quadraticCurveTo(w/2,y-7,w-17,y+(r()-.5)*4);g.stroke();}
  g.fillStyle='rgba(198,40,34,.92)';g.fillRect(w/2-10,h-36,20,20);g.fillStyle='rgba(239,230,205,.9)';g.fillRect(w/2-5,h-31,10,3);g.fillRect(w/2-5,h-24,10,3);});}
// 큰 낙관(네모 인장, 흰 새김 줄)
function sealTex(){return make('seal',128,128,(g,w,h)=>{g.fillStyle='rgba(196,36,32,.94)';g.fillRect(10,10,w-20,h-20);g.strokeStyle='rgba(246,236,214,.95)';g.lineWidth=7;g.lineCap='square';
  g.beginPath();g.moveTo(30,34);g.lineTo(98,34);g.moveTo(64,34);g.lineTo(64,96);g.moveTo(30,64);g.lineTo(98,64);g.moveTo(30,96);g.lineTo(98,96);g.moveTo(34,50);g.lineTo(34,80);g.moveTo(94,50);g.lineTo(94,80);g.stroke();});}
function warm(){try{strokeTex('ink',INKRGB);strokeTex('white',WHITERGB);blotTex();blotTex(true);cloudTex();plumTex();charmTex();sealTex();if(typeof ensureImages==='function')Promise.resolve(ensureImages([BLADE.path])).catch(()=>{});}catch(e){fail(e);}}
const asked={t:0};
function bladeSheet(){try{const got=typeof readyImage==='function'?readyImage(BLADE.path):null;if(got?.image)return got.image;const t=Date.now();if(t-asked.t>1500){asked.t=t;if(typeof ensureImages==='function')Promise.resolve(ensureImages([BLADE.path])).catch(()=>{});}}catch(e){fail(e);}return null;}
// ---- 그리기 --------------------------------------------------------------------------------------------------
let budget=0,drawCalls=0;
// 조각 한 장: (x,y)=기준점, w·h=화면 크기, px·py=기준점 비율, reveal=왼쪽부터 드러난 비율(붓이 지나가며 그려지는 느낌)
function img(im,x,y,w,h,o={}){if(!im||budget<=0||!(w>0)||!(h>0))return false;budget--;drawCalls++;const k=clamp(o.reveal??1,.02,1),iw=im.width,ih=im.height;ctx.save();
 try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(o.alpha??1,0,1);if(o.filter)ctx.filter=o.filter;ctx.translate(x,y);if(o.ang)ctx.rotate(o.ang);
  ctx.drawImage(im,0,0,iw*k,ih,-w*(o.px??.5),-h*(o.py??.5),w*k,h);}catch(e){fail(e);}finally{ctx.restore();}return true;}
function cellAt(im,fr,x,y,ang,sc,alpha,filter){if(!im||budget<=0)return false;budget--;drawCalls++;const C=BLADE.cell;fr=((Math.floor(fr)%BLADE.loop)+BLADE.loop)%BLADE.loop;ctx.save();
 try{ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=clamp(alpha,0,1);ctx.filter=filter;ctx.translate(x,y);ctx.rotate(ang);ctx.scale(sc,Math.cos(ang)<0?-sc:sc);
  ctx.drawImage(im,(fr%BLADE.cols)*C,Math.floor(fr/BLADE.cols)*C,C,C,-BLADE.pivot[0],-BLADE.pivot[1],C,C);}catch(e){fail(e);}finally{ctx.restore();}return true;}
const scr=(x,y,lift=.42)=>{const q=project(x,y);return {x:q.x,y:q.y-H()*lift};};
const SAN=(p,q)=>Math.atan2(q.y-p.y,q.x-p.x),SD=(p,q)=>Math.hypot(q.x-p.x,q.y-p.y);
// 어두운 바닥에서도 먹이 읽히게: 여백(흰) 번짐을 먼저 넓게 깔고 그 위에 먹을 얹는다
function splat(x,y,w,h,alpha,ang=0){img(blotTex(true),x,y,w*1.28,h*1.28,{alpha:alpha*.8,ang:ang+1});img(blotTex(),x,y,w,h,{alpha,ang});}
function brush(A,B,th,alpha,reveal=1){stroke('white',A,B,th,alpha*.95,reveal);stroke('white',A,B,th*.8,alpha*.7,reveal);stroke('ink',A,B,th*.46,alpha,reveal);}
function stroke(kind,A,B,th,alpha,reveal=1){const im=strokeTex(kind,kind==='ink'?INKRGB:WHITERGB);return img(im,A.x,A.y,SD(A,B)*1.06,th,{ang:SAN(A,B),px:.03,py:.5,alpha,reveal});}
function drawAll(){const t=T(),lo=low(),h=H(),u=unit();budget=lo?28:CFG.maxDraws;
 const cloud=cloudTex(),plum=plumTex(),charm=charmTex(),seal=sealTex(),sheet=bladeSheet();
 for(const s of states()){
  // ③ 삼협묵희(바닥 것부터)
  const R=s.trio;if(R){const a=t-R.t0,Q=CFG.trio,o=scr(R.ox,R.oy,.5),c=scr(R.cx,R.cy,.35);
   if(a<Q.strikeAt+.3&&!lo)img(cloud,c.x,c.y+h*.3,u*5.2,u*2.2,{alpha:.75*smooth(a/.5)*(1-smooth((a-Q.strikeAt)/.3))});
   // 매화 가지: 영웅에게서 무리 가운데로 그려지는 먹 획
   if(a>.3&&a<Q.strikeAt+.2)brush(o,c,h*.5,.85*(1-smooth((a-Q.strikeAt)/.2)),smooth((a-.3)/.45));
   R.marks.forEach((e,i)=>{if(!(e.hp>0)&&!R.struck)return;const g=project(e.x,e.y),top={x:g.x,y:g.y-h*1.15};
    // 부적: 영웅 → 적 머리 위로 날아가 붙어 흔들림
    if(a<Q.strikeAt){const k=smooth((a-i*.03)/.4),x=o.x+(top.x-o.x)*k,y=o.y+(top.y-o.y)*k-Math.sin(k*Math.PI)*h*.6+(k>=1?Math.sin(t*6+i)*2:0);img(charm,x,y,h*.3,h*.6,{ang:(1-k)*(i%2?5:-5)+Math.sin(t*4+i)*.08,alpha:a<.05?0:1});}
    // 매화 낙관: 발밑에 찍힘 → 터질 때 커지며 옅어짐
    const m=a-.45-i*.05;if(m>0){const pop=a<Q.strikeAt?.7+.3*smooth(m/.12):1+smooth((a-Q.strikeAt)/.45)*1.5,al=a<Q.strikeAt?1:1-smooth((a-Q.strikeAt)/.5);img(plum,g.x,g.y-h*.08,u*1.05*pop,u*.62*pop,{alpha:.95*al});}
    if(R.struck){const k=(a-Q.strikeAt)/.45;if(k<1)splat(g.x,g.y-h*.4,u*1.9*(.5+k),u*1.5*(.5+k),.9*(1-k*k),i);}});
   // 먹 그림자 셋의 한 획씩(검정 굵게 + 흰 속심)
   for(let i=0;i<3;i++){const k=(a-(.95+i*.2))/.6;if(k<=0||k>=1)continue;const ang=-Math.PI/2+i*Math.PI*2/3,L=3.4,A=scr(R.cx+Math.cos(ang)*L,R.cy+Math.sin(ang)*L,.4),B=scr(R.cx-Math.cos(ang)*L,R.cy-Math.sin(ang)*L,.4),rv=smooth(k/.22),al=1-smooth((k-.45)/.55);
    brush(A,B,h*1.15,.95*al,rv);}
   // 끝: 큰 낙관 + 여백을 쓸고 가는 흰 붓
   const f=a-Q.strikeAt;if(f>0&&f<.7){img(seal,c.x+u*1.9,c.y-h*1.25,h*.78*(1.25-.25*smooth(f/.12)),h*.78*(1.25-.25*smooth(f/.12)),{alpha:1-smooth((f-.4)/.3),ang:-.08});
    if(!lo)img(cloud,o.x,o.y+h*.3,u*CFG.trio.range*1.5*smooth(f/.5),u*CFG.trio.range*.75*smooth(f/.5),{alpha:.8*(1-smooth(f/.7))});}}
  // ① 묵월: 먹 꼬리 → 먹 층 → 여백 층
  for(const b of s.blades){const p=scr(b.x,b.y),q0=project(b.x+b.ux,b.y+b.uy),sa=Math.atan2(q0.y-h*.42-p.y,q0.x-p.x),back=Math.min(b.travel,2.6),tl=scr(b.x-b.ux*back,b.y-b.uy*back),kk=b.travel/CFG.moon.range,al=kk>.85?1-(kk-.85)/.15:1,sc=h*2.3/BLADE.th,fr=(t-b.t0)*14;
   brush(tl,p,h*1.0,.8*al);
   if(sheet){cellAt(sheet,fr,p.x,p.y,sa,sc*1.18,al,'grayscale(1) brightness(2.4) contrast(1.15)');cellAt(sheet,fr,p.x-Math.cos(sa)*h*.12,p.y-Math.sin(sa)*h*.12,sa,sc*.86,.97*al,'grayscale(1) brightness(0.12)');}
   else splat(p.x,p.y,h*1.5,h*1.5,.9*al);}
  // ② 칠묵영 발밑 담묵
  if(!lo)for(const c of s.clones){const g=project(c.x,c.y);img(cloud,g.x,g.y-h*.05,u*1.7,u*.7,{alpha:.7});}}
 for(const v of vis){const age=t-v.t0,k=age/v.life;if(k<0||k>=1)continue;
  if(v.k==='splash'){const g=scr(v.x,v.y,.35),sz=u*v.size*(.55+.75*smooth(k/.4));splat(g.x,g.y,sz*1.3,sz,.9*(1-k*k),v.t0*7);}
  else if(v.k==='puff'){const g=scr(v.x,v.y,.45),sz=h*v.size*(.6+.9*k);splat(g.x,g.y,sz,sz*1.15,.8*(1-k),v.t0*5);if(!lo)img(cloud,g.x,g.y+h*.3,sz*1.7,sz*.7,{alpha:.7*(1-k)});}
  else if(v.k==='cut'){const A=scr(v.a.x,v.a.y),B=scr(v.b.x+(v.b.x-v.a.x)*.5,v.b.y+(v.b.y-v.a.y)*.5);brush(A,B,h*.55,.9*(1-k),smooth(k/.3));}}}
// 분신: 진짜 영웅 그리기를 자리만 옮겨 먹빛으로. 안쪽 그리기가 ctx.filter 를 'none' 등으로 다시 써도 먹빛이 앞에 남도록 그 동안만 filter 를 가로챈다.
function withInk(fn,F=INK){const own=Object.getOwnPropertyDescriptor(ctx,'filter');let proto=ctx,desc=null;while(proto&&!desc){proto=Object.getPrototypeOf(proto);desc=proto?Object.getOwnPropertyDescriptor(proto,'filter'):null;}
 const native=desc&&typeof desc.set==='function'&&typeof desc.get==='function';if(own&&!('value' in own)){fn();return;}
 const prev=native?desc.get.call(ctx):ctx.filter,comp=v=>{v=String(v||'none');return v.startsWith(F)?v:v==='none'?F:F+' '+v;};let cur=comp(prev);
 try{Object.defineProperty(ctx,'filter',{configurable:true,enumerable:true,get(){return cur;},set(v){cur=comp(v);if(native)desc.set.call(ctx,cur);}});if(native)desc.set.call(ctx,cur);}catch(e){fail(e);fn();return;}
 try{fn();}finally{try{delete ctx.filter;if(native)desc.set.call(ctx,prev);else ctx.filter=prev;}catch(e){fail(e);}}}
let cloneBusy=false;
function drawClones(self){const p=P();if(cloneBusy||!on||!p)return;const s=st(p,false);if(!s||!(s.clones.length||s.phantoms.length))return;
 const t=T(),cm=typeof ctx!=='undefined'&&ctx?ctx.commands:null;if(s.drawT===t&&s.drawC===cm)return;s.drawT=t;s.drawC=cm;// 같은 프레임에 영웅 그리기가 또 불려도(다른 분신 기능) 한 번만
 cloneBusy=true;try{const end=s.cloneEnd;
  // 자리만 옮겨 바깥쪽 영웅 그리기(덧씌우기 사슬 전체)를 그대로 다시 부른다 — 영웅 몸 그림을 따로 그리는 덧씌우기들도 player 자리를 읽으므로(R767 분신과 같은 길).
  // 방향·공격·걷기·스킬 자세 값은 건드리지 않아 영웅과 같은 순간 같은 모션이 된다. 무적 깜빡임만 끈다.
  const keep={x:p.x,y:p.y,invincible:p.invincible};
  const lo=low();
  const pass=(c,al,dx,flt)=>{ctx.save();try{p.x=c.x+dx;p.y=c.y+dx;p.invincible=0;ctx.globalAlpha=(ctx.globalAlpha??1)*al;withInk(()=>drawHero(),flt);s.stats.cloneDraws++;}catch(e){fail(e);}finally{ctx.restore();p.x=keep.x;p.y=keep.y;p.invincible=keep.invincible;}};
  // 먹 그림자 한 겹(오른쪽 아래로 살짝 비켜 짙은 먹) 위에 담묵 몸 — 수묵 윤곽처럼 읽히게. 저사양은 담묵 몸만.
  const one=(c,al)=>{if(!(al>0))return;if(!lo)pass(c,al*.75,.07,INKDARK);pass(c,al,0,INK);};
  for(const c of s.clones)one(c,.86*smooth((t-c.t0)/.3+.35)*(end-t<.5?clamp((end-t)/.5,.15,1):1));
  for(const c of s.phantoms)if(t>=c.t0)one(c,.9*smooth((t-c.t0)/.15+.3)*clamp((c.end-t)/.3,0,1));}catch(e){fail(e);}finally{cloneBusy=false;}}
// ---- 설치 ----------------------------------------------------------------------------------------------------
let lastT=null;
try{
 if(typeof basicAttack==='function'){const base=basicAttack;basicAttack=function(...a){const p=P();if(!on||!isHw(p))return base.apply(this,a);const cd0=p.attackCD,r=base.apply(this,a);
   try{if(!(cd0>0)&&p.attackCD>0&&P()===p)onSwing(p);}catch(e){fail(e);}return r;};}
 if(typeof special==='function'){const base=special;special=function(...a){const p=P();if(!on||!isHw(p))return base.apply(this,a);const cd0=p.specialCD,r=base.apply(this,a);
   try{if(!(cd0>0)&&p.specialCD>0)mimic(st(p,false),p,'q');}catch(e){fail(e);}return r;};}
 if(typeof fx==='function'){const base=fx;fx=function(type,x,y,opt){const r=base.apply(this,arguments);
  try{const o=opt||{},p=P();if(on&&type==='storySourceSkill'&&o.storyWER&&o.sourceHero==='hwando'&&isHw(p)&&(o.stage==='release'||o.stage==='flight'))mimic(st(p,false),p,'wer:'+o.sourceSlot);}catch(e){fail(e);}return r;};}
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const r=base.apply(this,a);try{drawClones(this);}catch(e){fail(e);}return r;};}
 if(typeof drawEffect==='function'){const base=drawEffect;drawEffect=function(e,...a){if(e===SENT){try{if(on)drawAll();}catch(err){fail(err);}return;}return base.apply(this,[e,...a]);};}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{const t=T(),dt=lastT==null?0:clamp(t-lastT,0,.1);lastT=t;let any=vis.length>0;
   if(on){if(!isHw(P())&&busy(main))wipe(main);
    for(const s of states()){if(!busy(s))continue;if(dt>0)stepBlades(s,dt);stepClones(s,dt);stepTrio(s);if(busy(s))any=true;}}
   for(let i=vis.length-1;i>=0;i--)if(t-vis[i].t0>=vis[i].life||t<vis[i].t0-1)vis.splice(i,1);
   if(any)arm();else disarm();}catch(e){fail(e);}return r;};}
 if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){clearAll();const r=await base.apply(this,a);warm();return r;};}
 warm();
}catch(e){fail(e);}
function set(v){on=v!==false;if(!on)clearAll();try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
function force(kind,body){if(!CFG[kind]||kind==='maxDraws')return false;const s=st(body||P());if(!s)return false;s.force=kind;return true;}
function inspect(body){const s=st(body||P(),false)||fresh(null),t=T(),left=k=>Math.max(0,+(s.ready[k]-t).toFixed(3));
 return {revision:REV,on,errors,lastError,stats:{...s.stats},cd:{moon:left('moon'),clones:left('clones'),trio:left('trio')},vis:vis.length,drawCalls,
  clones:s.clones.map(c=>({i:c.i,x:+c.x.toFixed(3),y:+c.y.toFixed(3),foe:c.foe?.id??null})),phantoms:s.phantoms.length,
  blades:s.blades.map(b=>({id:b.id,x:+b.x.toFixed(2),y:+b.y.toFixed(2),travel:+b.travel.toFixed(2),hit:b.hit.size})),
  trio:s.trio?{age:+(t-s.trio.t0).toFixed(3),marks:s.trio.marks.map(e=>e.id),struck:s.trio.struck,done:s.trio.done}:null};}
window.__STORYWORLD_HWANDO_INK_R945__=Object.freeze({revision:REV,config:CFG,on:()=>on,set,force,inspect});
})();

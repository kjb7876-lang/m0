// R1028 적 촉수 타격감 — 사용자 2026-11-14 "적촉수 이펙트 확실하게 타격감있게 제대로 나오는지".
//  점검(헤드리스·코드)에서 찾은 것: 적 촉수 세 가지 모두 피해가 들어가는 순간(장판 age = warning)에 촉수가 아직 땅에서 솟기 전이었다.
//   · 사몽 보스 '촉수' 패턴(samong-r103 장판 + samong-play-r162 시트): delay = warn − 0.12 · 18fps → 맞는 순간 2번째 칸(납작한 혹).
//   · 사몽 탑 피의 육망성(combat-r170): 맞은 뒤(age ≥ warning)에야 0번 칸부터 8fps 로 재생 → 다 솟는 건 0.7초 뒤.
//   · 타락 계열 보스 장판(skill-sheets-r411 boss-tentacle-bind): 앞당김 0.25초(12.5fps) → 맞는 순간 3번째 칸.
//   · 사몽 P 구역(R976) 밖에선 촉수가 R163 도트판(208×130 칸을 크게 늘림)이라 픽셀이 보였다. 맞았을 때 영웅 자리에 터지는 그림도 없었다.
//  고친 것(판정·피해·시간·쿨다운·서사는 그대로, 그림만):
//   ① 촉수 시트를 어디서나 칠한 시트(R976 과 같은 assets/r976/tendrils-blood.webp, 같은 재생 길이 2.93초)로 — R976 이 P 구역에서 쓰는 것과 같은 그림.
//   ② 맞는 순간 = 촉수가 다 솟은 칸(24칸 중 5.5번째)이 되도록 시작을 앞당긴다. 사몽 패턴은 부르는 쪽 재생을 장판에 맞춰 다시 맞추고,
//      R170 육망성은 맞기 0.3초 전에 이 파일이 먼저 틀고(중앙 크게 + 옆 둘), 터질 때 R170 이 부르는 늦은 재생은 겹치지 않게 뺀다.
//      R411 boss-tentacle-bind 는 앞당김을 0.45초로(12.5fps → 5번째 칸).
//   ④ 영웅 발밑 촉수가 R350 '영웅 가림 옅게'(영웅 쪽 이펙트를 최대 85% 옅게)에 걸려 거의 안 보였다(헤드리스 화면, 고치기 전·후 모두) —
//      pixelfx 그리기 이름에 enemy 를 넣은 같은 시트(enemy-tendrils-r1028)로 틀어 적 쪽 위협 그림으로 읽히게 한다(R350 ENEMY_WORD). 영웅은 R350 유령이 그대로 살린다.
//   ③ 영웅이 그 촉수 장판 안에 있을 때 맞는 순간 영웅 가슴께에 피·뼛조각 적중 시트(R411 칠한 corpse-explosion 을 2.4배속으로, 앞 3칸은 건너뛰고 터지는 칸부터)를 한 번.
//      같은 순간 여러 장판이 겹쳐도 0.25초에 한 번. 코드로 그린 선·원은 쓰지 않는다(시트만).
//  끄기: localStorage storyworld.r1028.tentacle {"on":false}(전부) · {"impact":false}(③만). API window.__STORYWORLD_TENTACLE_STRIKE_R1028__.
(()=>{'use strict';
if(window.__STORYWORLD_TENTACLE_STRIKE_R1028__)return;
const REV='R1028-tentacle-strike-1',KEY='storyworld.r1028.tentacle';
let prefs={on:true,impact:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={sheet:0,retimed:0,renamed:0,prestart:0,dropped:0,impacts:0,throttled:0,leadSet:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0,fin=Number.isFinite;
const IMPACT_SKIP=4/(12.5*2.4);// 적중 시트 앞 3칸(작은 불씨)은 건너뛰고 터지는 칸부터
const NAME='tendrils-blood',PLAY='enemy-tendrils-r1028',IMPACT='enemy-tentacle-hit-r1028',RATE=2.2,STRIKE=5.5/24,LEAD411=.45;
// pixelfx 는 'assets/r163/pixelfx/'+file 로만 읽는다 → 별칭(r1028/…)을 적고 전역 readyImage·addImage 에서 실제 경로로 바꿔 준다(R976 과 같은 방식, 다른 경로는 그대로)
const ALIAS_DIR='assets/r163/pixelfx/r1028/',ALIAS=new Map([[ALIAS_DIR+NAME+'.webp','assets/r976/tendrils-blood.webp'],[ALIAS_DIR+PLAY+'.webp','assets/r976/tendrils-blood.webp'],[ALIAS_DIR+IMPACT+'.webp','assets/r411/fx/boss-corpse-explosion.webp']]);
const ROWS={[NAME]:{file:'r1028/'+NAME+'.webp',frame:[256,256],pivot:[128,208],columns:6,frames:24,fps:24/(44/15),loop:false,r1028:true},
 [PLAY]:{file:'r1028/'+NAME+'.webp',frame:[256,256],pivot:[128,208],columns:6,frames:24,fps:24/(44/15),loop:false,r1028:true},
 [IMPACT]:{file:'r1028/'+IMPACT+'.webp',frame:[256,256],pivot:[128,192],columns:6,frames:24,fps:12.5,loop:false,r1028:true}};
if(prefs.on)try{const real=p=>typeof p==='string'&&p.startsWith(ALIAS_DIR)?ALIAS.get(p)||p:p;
 if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){return base.call(this,real(p),...a);};}
 if(typeof addImage==='function'){const base=addImage;addImage=function(p,...a){return base.call(this,real(p),...a);};}}catch(e){fail(e);}
const PX0=()=>window.__STORYWORLD_PIXELFX_R163__;
// ① 시트 표: 메타가 늦게(fetch) 오므로 틱마다 확인. R976 이 P 구역에서 바꿔 끼웠다 되돌려도 이 줄(같은 그림)이 남는다.
function sheet(){const X=PX0(),M=X&&typeof X.meta==='function'?X.meta():null;if(!M)return;
 if(M[NAME]&&!M[NAME].r1028&&!M[NAME].r976){M[NAME]={...M[NAME],...ROWS[NAME],frame:ROWS[NAME].frame.slice(),pivot:ROWS[NAME].pivot.slice()};stats.sheet++;}
 for(const k of [PLAY,IMPACT])if(!M[k])M[k]={...ROWS[k],frame:ROWS[k].frame.slice(),pivot:ROWS[k].pivot.slice()};
 // 미리 읽기: 첫 촉수 패턴이 그림을 기다리느라 비어 보이지 않게(pixelfx 는 처음 그릴 때에야 읽기 시작한다)
 if(!warmed&&typeof X.warm==='function'){warmed=true;try{X.warm([PLAY,IMPACT]);}catch(err){fail(err);}}}
let warmed=false;
function lead(rate){const X=PX0(),m=X?.meta?.()?.[PLAY];if(!m||!(m.fps>0))return 0;return STRIKE*m.frames/(m.fps*(rate||1));}
const tentacle=h=>!!(h&&h.type==='field'&&(h.samongPattern==='tentacles'||h.samongPattern==='r170-hex')&&fin(h.x)&&fin(h.y));
const bind411=h=>!!(h&&h.type==='field'&&h.r411==='boss-tentacle-bind'&&fin(h.x)&&fin(h.y));
const HZ=()=>{try{return typeof hazards!=='undefined'&&Array.isArray(hazards)?hazards:[];}catch(_){return[];}};
const S=new WeakMap();const st=h=>{let s=S.get(h);if(!s){s={};S.set(h,s);}return s;};
let own=false;
function near(x,y){let best=null,bd=1e9;for(const h of HZ()){if(!tentacle(h))continue;const d=Math.hypot(h.x-x,h.y-y),lim=Math.max(.35,(fin(h.radius)?h.radius:1)*.6);if(d<=lim&&d<bd){bd=d;best=h;}}return best;}
// ② 부르는 쪽 재생을 장판 시간에 맞춘다
function wrapPlay(){const X=PX0();if(!X||X.__r1028||typeof X.play!=='function')return;const base=X.play;
 window.__STORYWORLD_PIXELFX_R163__=Object.freeze({...X,__r1028:true,play(name,x,y,o={}){
  if(prefs.on&&!own&&name===NAME&&fin(x)&&fin(y)){try{const h=near(x,y);if(h){const s=st(h);
    if(s.pre){stats.dropped++;return null;}// R170: 이 파일이 맞기 전에 이미 틀었다
    const rate=(o&&o.rate)||1,hitIn=(fin(h.warning)?h.warning:0)-(fin(h.age)?h.age:0);s.seen=true;stats.retimed++;
    return base.call(this,PLAY,x,y,{...o,delay:hitIn-lead(rate)});}
   stats.renamed++;return base.call(this,PLAY,x,y,o);}catch(err){fail(err);}}
  return base.call(this,name,x,y,o);}});}
function own_(f){own=true;try{return f();}finally{own=false;}}
function H(){try{return typeof actorHeight==='function'?actorHeight():54;}catch(_){return 54;}}
let lastImpact=-9;
function scan(){if(!prefs.on)return;sheet();wrapPlay();const X=PX0();if(!X)return;const t=T(),p=typeof player==='object'?player:null,L=lead(RATE);
 for(const h of HZ()){const tn=tentacle(h),b=!tn&&bind411(h);if(!tn&&!b)continue;const s=st(h),age=fin(h.age)?h.age:0,w=fin(h.warning)?h.warning:0;
  // R170 육망성: 맞기 L초 전에 먼저 튼다(중앙 크게 + 옆 둘 — R170 이 터질 때 그리던 자리·크기 그대로)
  if(h.samongPattern==='r170-hex'&&!s.pre&&age<w&&w-age<=L+1e-6){s.pre=true;stats.prestart++;const d=(w-age)-L,sd=h.r170?.seed||0,r=fin(h.radius)?h.radius:1.7;
   own_(()=>{X.play(PLAY,h.x,h.y,{k:1.7,rate:RATE,delay:d});for(let i=0;i<2;i++){const a=sd+i*Math.PI+.6;X.play(PLAY,h.x+Math.cos(a)*r*.45,h.y+Math.sin(a)*r*.45,{k:1.2,rate:RATE,delay:d+.05+.03*i,flip:i===1});}});}
  // ③ 맞는 순간(처음 age ≥ warning) 영웅이 장판 안이면 적중 그림
  if(!s.hit&&age>=w){s.hit=true;if(!prefs.impact||!p||!(p.hp>0)||!fin(p.x)||!fin(p.y))continue;const r=fin(h.radius)?h.radius:1;if(Math.hypot(p.x-h.x,p.y-h.y)>r+.15)continue;
   if(t-lastImpact<.25){stats.throttled++;continue;}lastImpact=t;stats.impacts++;
   own_(()=>X.play(IMPACT,p.x,p.y,{k:.72,rate:2.4,delay:-IMPACT_SKIP,z:H()*.42}));}}}
// R411 촉수 속박: 앞당김만 늘린다(다른 보스 시트는 그대로)
function lead411(){if(!prefs.on)return;const A=window.__STORYWORLD_SKILL_SHEETS_R411__,row=A?.sheets?.['boss-tentacle-bind'];if(Array.isArray(row)&&row[3]!==LEAD411&&!Object.isFrozen(row)){row[3]=LEAD411;stats.leadSet++;}}
function step(){try{lead411();scan();}catch(err){fail(err);}}
if(prefs.on&&typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);step();return r;};}
step();
function set(k,v){if(k in prefs){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}return{...prefs};}
window.__STORYWORLD_TENTACLE_STRIKE_R1028__=Object.freeze({revision:REV,set,lead,strikeFrame:STRIKE,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError})});
})();

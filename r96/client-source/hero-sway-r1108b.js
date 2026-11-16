// R1108b — 서하 이동 '종이처럼 휘청거림'(사용자 2026-11-16 11:04Z, R1108 병합 뒤에도). 헤드리스 실측과 원인:
//  ① R1108 이 서하 대각 걷기를 옆 걷기(walk-e)로 바꿨는데, walk-e 는 외투가 다리를 가려 걸음(발 교차)이 거의 없고(발 폭 변화 0.004 — 다른 시트 0.07~0.19) 머리만 4px 오르내려
//     '발이 안 떼지는 채 몸만 미끄러지며 흔들리는' 종이 인형처럼 보였다 → 대각 걷기를 원래 3/4 시트(walk-se·ne, 걸음 있음)로 되돌린다(R1108 seoha 기본 꺼짐).
//  ② 서하 걷기 시트 8칸은 4칸 걸음이 두 번 반복이고 몸이 곧게 서 있는 평면 그림이라, 움직여도 무게가 안 실린다 → 이동 방향(화면 가로 성분)으로 몸을 발끝 기준
//     최대 3.5° 기울여(속도에 비례, 0.1초 안에 부드럽게 따라감) 앞으로 나가는 무게감을 준다. 서 있거나 위·아래로만 가면 0°, 발 자리·크기·칸은 그대로.
//  판정·피해·세이브는 바꾸지 않는다(그림 기울임뿐). 끄기: localStorage storyworld.r1108b.sway = {"on":false}. 진짜 해결은 3/4 걷기 시트(Dots 재요청).
(()=>{'use strict';
if(window.__STORYWORLD_HERO_SWAY_R1108B__)return;
const REV='R1108b-hero-sway-1',KEY='storyworld.r1108b.sway',MAX=3.5*Math.PI/180,TAU=.1,RATE=30*Math.PI/180;/* 초당 최대 30° — 느린 기기에서 한 프레임이 길어도 한 번에 튀지 않게 */
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={leaned:0,errors:0};let lastError=null,theta=0,lastT=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const fin=Number.isFinite,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const WALK=/assets\/r130\/seoha\/walk-[a-z]+\.webp/;
// 목표 기울기: 이동 속도(월드 vx,vy → 화면 가로 vx-vy)의 가로 비율 × 속도 비율
function target(p){if(!p||!p.moving)return 0;const vx=+p.moveVX150||0,vy=+p.moveVY150||0,sp=Math.hypot(vx,vy);if(!(sp>.05))return 0;return clamp((vx-vy)/(Math.SQRT2*sp),-1,1)*MAX*clamp(sp,0,1);}
// 발끝(pivot) 기준 회전. 같은 점을 돌려서 기울임, 발 자리는 그대로
function rotate(points,pivot,a){const s=Math.sin(a),c=Math.cos(a);return points.map(q=>[pivot[0]+(q[0]-pivot[0])*c-(q[1]-pivot[1])*s,pivot[1]+(q[0]-pivot[0])*s+(q[1]-pivot[1])*c]);}
function smooth(goal,t){if(lastT==null||!(t>lastT)||t-lastT>.5){lastT=t;theta=goal;return theta;}const dt=t-lastT;lastT=t;const d=(goal-theta)*(1-Math.exp(-dt/TAU)),lim=RATE*dt;theta+=clamp(d,-lim,lim);if(Math.abs(theta)<1e-4&&goal===0)theta=0;return theta;}
function afterHero(rec,st){const p=typeof player==='object'?player:null;if(!p||p.hero!=='seoha'||!prefs.on||!rec||!Array.isArray(rec.commands))return;
 const a=smooth(target(p),typeof time==='number'?time:0);if(!a)return;let pivot=null;try{const q=project(p.x,p.y);pivot=[q.x,q.y-Math.min(Math.max(+p.visualLiftPx||0,0),1e4)];}catch(_){}if(!pivot||!pivot.every(fin))return;
 for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c?.kind!=='image'||c.owner?.kind!=='hero'||!Array.isArray(c.points)||c.points.length<4)continue;if(!WALK.test(String(c.sourcePath||c.image?.src||'')))continue;
  const pts=rotate(c.points,pivot,a);if(!pts.flat().every(fin))continue;c.points=pts;c.r1108bLean=a;stats.leaned++;}}
let wrapped=false;
function install(){try{if(wrapped||typeof drawHero!=='function')return;const base=drawHero;drawHero=function(...args){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:0;const r=base.apply(this,args);try{afterHero(rec,st);}catch(e){fail(e);}return r;};wrapped=true;}catch(e){fail(e);}}
if(typeof document==='object'&&document&&document.readyState==='complete')install();else if(typeof window.addEventListener==='function')window.addEventListener('load',install);
window.__STORYWORLD_HERO_SWAY_R1108B__=Object.freeze({revision:REV,max:MAX,tau:TAU,rate:RATE,
 setPrefs:v=>{prefs={...prefs,...(v||{})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};},
 test:Object.freeze({target,rotate,smooth,reset:()=>{theta=0;lastT=null;},afterHero}),
 inspect:()=>({revision:REV,prefs:{...prefs},wrapped,theta,...stats,lastError,presentationOnly:true,gameplayChanged:false})});
})();

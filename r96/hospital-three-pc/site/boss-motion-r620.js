// R620 보스·중간보스 몸 움직임 보간 — 사용자 2026-11-10 "프레임 수가 적어 뚝뚝 끊기는 영웅·보스·중간보스 동작(대기·공격·피격·죽음)".
//  실측(qa/r620/boss-census): 보스·중간보스 대부분이 R104 열쇠 자세 4장(준비·타격·이어짐·회수)뿐이라 대기·걷기는 한 장, 공격은 3장이 툭툭 바뀌었다.
//  그림(Dots 시트)이 오기 전까지, 그리고 온 뒤에도 칸 사이를 잇기 위해 그리기만 손질한다. 판정·피해·시간·세이브는 그대로.
//   · 대기: 발을 붙인 채 숨쉬기(세로 ±1.6%, 가로 반대 ±0.8%)와 아주 느린 상체 흔들림.
//   · 걷기: 발 디딤에 맞춘 위아래 출렁임, 가는 쪽으로 몸 기울기, 디딜 때 살짝 눌림. 걷는 동안 공격 자세 그림이 끼어들면 회수(대기) 그림으로 둔다.
//   · 공격: 열쇠 자세가 바뀔 때 앞 자세를 0.09초 겹쳐 사라지게(교차 보간). 준비 동안 웅크림 → 타격 순간 영웅 쪽으로 내딛기 → 천천히 제자리.
//   · 피격: 맞은 반대쪽으로 밀렸다가(키의 5%) 돌아오기, 살짝 젖힘.
//   · 상태가 바뀔 때 값이 튀지 않게 모두 부드럽게 따라간다(초당 16).
//  몸 그림 명령(드로우 기록 ctx.commands 의 가장 큰 적 몸 이미지)의 네 점만 발밑을 기준으로 옮긴다. 체력바·이름표·이펙트는 건드리지 않는다.
//  끄기: localStorage['storyworld.r620.bossmotion']='{"on":false}'. 점검: window.__STORYWORLD_BOSS_MOTION_R620__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_MOTION_R620__)return;
const REV='R620-boss-motion-1',KEY='storyworld.r620.bossmotion';
let prefs={on:true,xfade:true,walkHold:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,shaped:0,xfades:0,walkHeld:0,hits:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|death|dissol|burn/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.currentSrc||c?.image?.src||'');
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.wardChampionR81===true));
function excluded(e){try{if(/mammon/i.test(String(room?.id||''))||e.mammon||e.mammonR||/mammon/i.test(String(e.nativeId||'')))return true;}catch(_){}return !!(e.samongDollR193||e.r193Doll||e.r193Tower||e.r170Tower||e.r75Tower||e.r251Circle||e.prop||e.object||e.stationary);}
// R104 열쇠 자세 파일 → 자세 번호(p1 준비 · p2 타격 · p3 이어짐 · p4 회수)
const poseNo=s=>{const m=/-p([1-4])\.(?:webp|png)/i.exec(s);return m?+m[1]:0;};
// Dots CX-0068SM 시트: 보스가 지금 그리는 대기 원본 경로 → 같은 칸 크기·발 줄로 맞춘 가로 한 줄 시트(qa/r620/sheets.md 에 원본·해시·검수값).
const SHEETS={'assets/generated-v31224/actors-normalized/1a8ca2c5759b_ep1b03_envy_sister_phase0.webp':{w:672,h:384,idle:{path:'assets/r620/bosses/b03-idle6.webp',n:6,fps:8},hit:{path:'assets/r620/bosses/b03-hit4.webp',n:4,fps:16}}};
const asked=new Set();function sheetImg(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r?.image)return r.image;if(!asked.has(p)&&typeof addImage==='function'){asked.add(p);addImage(p,'R620 Dots CX-0068SM boss sheet');}}catch(_){}return null;}
const ST=new WeakMap();
const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={sx:1,sy:1,sh:0,ox:0,oy:0,at:-1,fx:NaN,fy:NaN,vx:0,move:0,hitAt:-9,hitT:0,prev:null,xAt:-9,lastPath:'',stepPh:Math.random()*6.28,seed:Math.random()*6.28,lastT:-1});return s;};
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||!Array.isArray(c.points)||c.points.length<4)continue;if(FX.test(srcOf(c)))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}return best;}
const dirToHero=e=>{try{const d=(player.x-e.x)-(player.y-e.y);return d>=0?1:-1;}catch(_){return 1;}};
function windupOf(A,e){const w=A?.castWindup150??A?.shape154?.windup??e?.combatProfile?.attackShape?.windup;return Number.isFinite(w)&&w>0?w:.35;}
function target(e,s,c,t,dt){
 const P=c.points,fx=(P[2][0]+P[3][0])/2,fy=(P[2][1]+P[3][1])/2;
 // 화면 속 발 움직임으로 걷는지 본다(카메라가 영웅을 따라가도 보스 쪽 상대 움직임으로 충분하다).
 let sp=0;try{if(Number.isFinite(s.wx)&&dt>0){sp=Math.hypot(e.x-s.wx,e.y-s.wy)/dt;const sdx=(e.x-s.wx)-(e.y-s.wy);if(Math.abs(sdx)>1e-4)s.vx=sdx>0?1:-1;}}catch(_){}
 s.wx=e.x;s.wy=e.y;s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*10);
 const H=Math.abs(P[3][1]-P[0][1])||100;
 if(e.hitTimer>0&&t-s.hitAt>.25){s.hitAt=t;s.hitDir=dirToHero(e);stats.hits++;}
 let sx=1,sy=1,sh=0,ox=0,oy=0;const hitAge=t-s.hitAt;
 if(hitAge>=0&&hitAge<.24){const k=Math.pow(1-hitAge/.24,2),d=s.hitDir||1;ox=-d*H*.05*k;sh=-d*.07*k;sy=1-.035*k;sx=1+.02*k;}
 else if(e.attack){const A=e.attack,w=windupOf(A,e),el=Number(A.elapsed)||0,d=Number.isFinite(A.angle)?(Math.cos(A.angle)-Math.sin(A.angle)>=0?1:-1):dirToHero(e);
  if(el<w){const u=Math.min(1,el/w),k=Math.sin(u*Math.PI/2);sy=1-.045*k;sx=1+.025*k;sh=-d*.035*k;ox=-d*H*.012*k;}
  else{const a=el-w,k=a<.1?a/.1:Math.max(0,1-(a-.1)/.35);sy=1+.025*k;sx=1-.012*k;sh=d*.05*k;ox=d*H*.06*k;}}
 else if(s.move>.5){s.stepPh+=dt*2*Math.PI*1.9;const b=Math.abs(Math.sin(s.stepPh));oy=-H*.028*b;sy=1-.022*(1-b)+.01*b;sx=1+.012*(1-b);sh=(s.vx||1)*.045+.014*Math.sin(s.stepPh);}
 else{const ph=t*2*Math.PI/1.9+s.seed,b=Math.sin(ph);sy=1+.016*b;sx=1-.008*b;sh=.011*Math.sin(ph*.5);}
 return {fx,fy,sx,sy,sh,ox,oy};}
function apply(c,G,s){c.points=c.points.map(p=>{if(!Array.isArray(p))return p;const dx=p[0]-G.fx,dy=p[1]-G.fy;return [G.fx+dx*s.sx+s.sh*(-dy)+s.ox,G.fy+dy*s.sy+s.oy,...p.slice(2)];});}
function process(e,cmds,st0){
 const c=bodyCmd(cmds,st0);if(!c)return;const s=stOf(e),t=T();const dt=s.lastT<0?0:Math.max(0,Math.min(.1,t-s.lastT));s.lastT=t;
 const path=srcOf(c),pn=poseNo(path);
 // 걷는 중(공격 아님)에 R104 공격 자세(p1~p3)가 끼어들면 회수 자세(p4)로 둔다 — 걸으며 칼을 휘두르는 것처럼 보이던 깜빡임.
 if(prefs.walkHold&&pn&&pn!==4&&!e.attack&&!(e.hitTimer>0)&&s.move>.5){const p4=path.replace(/-p[1-3]\./i,'-p4.');try{if(typeof readyImage==='function'){const im=readyImage(p4)?.image;if(im){c.image=im;c.sourcePath=p4;stats.walkHeld++;}}}catch(_){}}
 let sheet=null;const SD=SHEETS[path];
 if(SD&&!e.attack){const hitAge=t-s.hitAt,hitting=e.hitTimer>0||(hitAge>=0&&hitAge<SD.hit.n/SD.hit.fps);const use=hitting&&SD.hit?SD.hit:(s.move<=.5?SD.idle:null);
  if(use){const im=sheetImg(use.path);if(im){const i=use===SD.hit?Math.min(use.n-1,Math.max(0,Math.floor((e.hitTimer>0&&!(hitAge>=0&&hitAge<1)?0:hitAge)*use.fps))):Math.floor((t+s.seed)*use.fps)%use.n;c.image=im;c.sourcePath=use.path;c.sourceRect=[i*SD.w,0,SD.w,SD.h];sheet=use===SD.hit?'hit':'idle';stats.sheet=(stats.sheet||0)+1;}}}
 const G=target(e,s,c,t,dt),k=dt>0?Math.min(1,dt*16):1;
 if(sheet==='idle'){G.sy=1+(G.sy-1)*.3;G.sx=1+(G.sx-1)*.3;G.sh*=.3;}else if(sheet==='hit'){G.ox*=.5;G.sh*=.4;G.sy=1+(G.sy-1)*.4;}
 for(const n of ['sx','sy','sh','ox','oy'])s[n]+=(G[n]-s[n])*k;
 const curPath=srcOf(c),rect=String(c.sourceRect||'');
 let ghost=null;
 if(prefs.xfade&&s.prev&&curPath!==s.lastPath&&s.prev.path!==curPath&&s.prev.rect===rect&&t-s.prev.at<.2){s.xFrom=s.prev;s.xAt=t;stats.xfades++;}
 if(s.xFrom&&t-s.xAt<.09&&s.xFrom.path!==curPath){const u=(t-s.xAt)/.09;ghost={...c,image:s.xFrom.image,sourcePath:s.xFrom.path,imageSize:s.xFrom.size||c.imageSize,style:{...(c.style||{}),globalAlpha:(c.style?.globalAlpha??1)*(1-u)*.85},r620Ghost:true};}
 s.prev={path:curPath,image:c.image,rect,size:c.imageSize,at:t};s.lastPath=curPath;
 apply(c,G,s);if(ghost){ghost.points=c.points.map(p=>Array.isArray(p)?[...p]:p);const i=cmds.indexOf(c);if(i>=0)cmds.splice(i+1,0,ghost);}
 stats.shaped++;}
// 다른 덧씌우기(R425 크기·좌우, R463 7대죄 그림 등)가 몸을 다 고친 뒤에 움직임을 얹어야 하므로, 모든 스크립트가 실린 다음(setTimeout 0) 한 번 맨 바깥에서 감싼다.
//  R613 은 보스를 건드리지 않으니 그 뒤 R613 이 다시 맨 위로 올라가도 상관없다. 이 파일은 다시 감싸지 않는다(서로 번갈아 감싸며 사슬이 길어지는 일 막기).
let installed=false;function install(){if(installed||typeof drawEnemy!=='function')return;installed=true;const base=drawEnemy;drawEnemy=function(e,...a){
 if(!prefs.on||!major(e)||!(e.hp>0)||excluded(e))return base.call(this,e,...a);
 const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;
 const r=base.call(this,e,...a);stats.draws++;
 if(cm&&st0>=0)try{process(e,cm,st0);}catch(err){fail(err);}
 return r;};}
if(typeof setTimeout==='function')setTimeout(install,0);else install();
window.__STORYWORLD_BOSS_MOTION_R620__=Object.freeze({rev:REV,inspect:()=>({rev:REV,installed,prefs:{...prefs},stats:{...stats},lastError}),set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();

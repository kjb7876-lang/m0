// R760 불면귀 보스 연출 — 사용자 2026-11-11 "불면귀파트 여러 연출 강화… 불면귀보스도 조금더 모든방면으로 개선하도록 모션이랑 일관성과 불면귀스럽게
//  아까 귀비탕영상참고", "귀비탕영상+동양몽세 진입 시네마틱과 서사에 맞게", "향후 게임 홍보영상으로도 쓰일것이기에 디테일".
//  헤드리스 실측(qa/r760): 불면귀(last303 l303-boss)는 대기 그림과 공격 그림이 서로 다른 그림체·다른 크기(몸 사각형 키 158.7 → 132.6px, 16% 줄어듦)였고,
//  회백 연기의 해골 저승사자라 영상의 '먹색 실타래 · 호박색 눈빛 한 점 · 보라 소용돌이 속 핵'과 달랐다.
//  · 일관성: 같은 인물의 밀도 높은 4자세(R104 mb-last302 p1 준비·p2 타격·p3 이어짐·p4 대기/회수)를 먹색·보라 톤 + 호박색 눈빛으로 칠한 사본
//    (scripts/r760-bulmyeongwi-tone.py → assets/r760/boss)으로 대기·공격을 모두 그린다. 크기는 엔진 대기 그림 기준 하나(×1.3)로 고정.
//    실비(rain)·흩어짐(transition) 패턴 그림도 톤 사본으로, 같은 기준 크기로.
//  · 불면귀다움: 정본 35장 "잠을 빼앗는 시선과 겹겹의 잔상" — 몸 뒤에 같은 자세의 잔상 2겹(체력 절반 이하 3겹), 공격 준비 동안 잔상이 벌어진다.
//  · 중간보스 '검은 안개 심장 · 불면의 기억'(last302)은 불면귀의 기억 조각: 회백 그림·크기는 그대로, 잔상 1겹만.
//  · 그림만 바꾼다. 판정·피해·체력·시간·세이브·생성 지점은 그대로. 최종 그림은 Dots CX-0070BM(보스 768칸 재작화)이 오면 그것으로 바꾼다.
//  · 순서: 그림 바꾸기는 불러올 때 바로 drawEnemy 를 감싸(R620 보다 안쪽 → R620 이 -p1~-p4 자세 번호로 교차 보간·숨쉬기를 얹음),
//    잔상은 setTimeout 0 으로 R620 보다 바깥에서(R620 이 다듬은 몸을 따라감).
//  끄기: localStorage['storyworld.r760.bulmyeongwi']='{"on":false}'. 점검: window.__STORYWORLD_BULMYEONGWI_R760__.inspect()
(()=>{'use strict';
if(window.__STORYWORLD_BULMYEONGWI_R760__)return;
const REV='R760-bulmyeongwi-1',KEY='storyworld.r760.bulmyeongwi';
let prefs={on:true,ghosts:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(prefs))if(typeof s[k]==='boolean')prefs[k]=s[k];}catch(_){}
const stats={draws:0,swapped:0,waiting:0,patterns:0,ghosted:0,errors:0};let lastError=null,last=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const T=()=>typeof time==='number'&&Number.isFinite(time)?time:performance.now()/1000;
const DIR='assets/r760/boss/bulmyeongwi-';
const POSE={w:393,h:432,px:193,py:406,vis:400};      // R104 mb-last302 열쇠 자세 칸·발 기준점·보이는 키
const IDLE_VIS=257/384;                               // 엔진 대기 그림(672x384)의 보이는 몸 비율(보이는 영역 65..322)
const SCALE=1.3;                                      // 대기 기준 대비 보스 몸 크기
const PATTERN={rain:{foot:353},transition:{foot:353}}; // 672x384 패턴 그림의 발 줄
const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|flame|r572|r571|r92\/boss|death|dissol|burn/i;
const srcOf=c=>String(c?.sourcePath||c?.image?.currentSrc||c?.image?.src||'');
const roomId=()=>{try{return String(room?.id||'');}catch(_){return '';}};
function role(e){if(!e||!(e.hp>0))return null;const id=String(e.nativeId||''),r=roomId();
 if(r==='last303'&&(id==='l303-boss'||(e.boss&&/^불면귀/.test(String(e.name||'')))))return 'boss';
 if(r==='last302'&&/^mb-last302/.test(id))return 'mid';return null;}
function kindOf(p){if(/bulmyeongwi_idle/i.test(p))return 'idle';if(/bulmyeongwi_attack/i.test(p))return 'attack';if(/bulmyeongwi_rain/i.test(p))return 'rain';
 if(/bulmyeongwi_transition/i.test(p))return 'transition';if(/mb-last302-v31231-p[1-4]\./i.test(p))return 'pose';if(/assets\/r760\/boss\//.test(p))return 'done';return null;}
const asked=new Set();
function img(p){try{const r=typeof readyImage==='function'?readyImage(p):null;if(r&&r.ready!==false&&r.image)return r.image;}catch(_){}
 // 엔진은 지역을 옮길 때 그림 캐시를 비울 수 있다 → 준비 안 됐으면 매번 다시 청한다(addImage 는 이미 불러오는 중이면 그 줄을 돌려줌).
 try{if(typeof addImage==='function'){asked.add(p);addImage(p,'R760 불면귀 톤 그림');}}catch(_){}return null;}
function bodyCmd(cmds,st0){let best=null,bh=0;for(let i=st0;i<cmds.length;i++){const c=cmds[i];if(c?.kind!=='image'||c.owner?.kind!=='enemy'||c.r620Ghost||c.r760Ghost||!Array.isArray(c.points)||c.points.length<4)continue;
  if(FX.test(srcOf(c))&&!/assets\/r760\//.test(srcOf(c)))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(h>bh){bh=h;best=c;}}return best;}
// 잔상 흔들림 위상은 적마다 고정(같은 장면을 다시 찍어도 같게 — 홍보 영상 재녹화·검사 재현)
const seedOf=e=>{const t=String(e?.id??e?.nativeId??'');let h=7;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))%9973;return h/9973*6.283;};
const ST=new WeakMap();const stOf=e=>{let s=ST.get(e);if(!s)ST.set(e,s={unit:0,wx:NaN,wy:NaN,vx:0,move:0,lastT:-1,seed:seedOf(e)});return s;};
const Hq=c=>Math.abs(c.points[3][1]-c.points[0][1]);
// 렌더러는 sourceRect 를 imageSize 로 나눠 칸 좌표를 만든다 → 그림을 바꾸면 imageSize 도 새 그림 크기로(안 그러면 옛 크기 기준으로 잘려 늘어남).
function setImg(c,im,path,w,h){c.image=im;c.sourcePath=path;const iw=im.naturalWidth||im.width||w,ih=im.naturalHeight||im.height||h;c.imageSize=[iw,ih];}
function footOf(e,c){try{if(typeof project==='function'){const q=project(e.x,e.y);if(q&&Number.isFinite(q.x)&&Number.isFinite(q.y))return [q.x,q.y];}}catch(_){}
 const P=c.points;return [(P[2][0]+P[3][0])/2,(P[2][1]+P[3][1])/2];}
function tileLen(e){try{if(typeof project==='function'){const a=project(e.x,e.y),b=project(e.x+1,e.y+1),d=Math.hypot(b.x-a.x,b.y-a.y);if(d>1e-3&&Number.isFinite(d))return d;}}catch(_){}return 1;}
function facing(e){try{const A=e.attack;if(A&&Number.isFinite(A.angle))return Math.cos(A.angle)-Math.sin(A.angle)>=0?1:-1;const d=(player.x-e.x)-(player.y-e.y);return d>=0?1:-1;}catch(_){return 1;}}
function windupOf(A,e){const w=A?.castWindup150??A?.shape154?.windup??e?.combatProfile?.attackShape?.windup;return Number.isFinite(w)&&w>0?w:.35;}
// 엔진은 휘두르는 동안 e.attack 없이 state 'attack' + 공격 그림만 줄 때가 있다(헤드리스 실측) → 그때는 상태 나이로 자세를 고른다.
function poseFor(e,k){const A=e.attack;if(!A){if(k==='attack'||e.state==='attack'){const a=Number(e.stateAge)||0;return a<.25?1:a<.45?2:3;}return 4;}const w=windupOf(A,e),el=Number(A.elapsed)||0;return el<w?1:el<w+.18?2:3;}
// ── 안쪽: 그림·크기 ──
function swap(e,cmds,st0){const c=bodyCmd(cmds,st0);if(!c)return;const p=srcOf(c),k=kindOf(p);if(!k||k==='done')return;const s=stOf(e);
 // 기준 키 = 엔진이 대기 그림을 그리는 보이는 몸 키를 '바닥 한 칸 화면 길이'로 나눈 값(카메라가 공격 때 당겨져도 자세마다 크기가 튀지 않게).
 const tl=tileLen(e);if(k==='idle'){const u=Hq(c)*IDLE_VIS/tl;s.unit=s.unit?s.unit+(u-s.unit)*.2:u;}
 const unit=(s.unit||Hq(c)*IDLE_VIS/tl)*tl;last={k,tl:+tl.toFixed(2),H:+Hq(c).toFixed(1),unitPerTile:+(s.unit||0).toFixed(2)};
 if(k==='rain'||k==='transition'){const path=DIR+k+'.webp',im=img(path);if(!im){stats.waiting++;return;}
  const P=c.points,sg=P[1][0]>=P[0][0]?1:-1,iw=Math.abs(P[1][0]-P[0][0])/Math.max(1e-6,Hq(c)),nh=unit/IDLE_VIS*SCALE,nw=nh*iw,[fx,fy]=footOf(e,c);
  const cx=(P[0][0]+P[1][0])/2-((P[2][0]+P[3][0])/2-fx),top=fy-nh*PATTERN[k].foot/384,L=cx-sg*nw/2;
  c.points=[[L,top],[L+sg*nw,top],[L+sg*nw,top+nh],[L,top+nh]];setImg(c,im,path,672,384);c.sourceRect=[0,0,672,384];stats.patterns++;return;}
 const path=DIR+'p'+poseFor(e,k)+'.webp',im=img(path);if(!im){stats.waiting++;return;}
 const kk=unit*SCALE/POSE.vis,sg=facing(e),[fx,fy]=footOf(e,c),x0=fx-sg*POSE.px*kk,y0=fy-POSE.py*kk,w=POSE.w*kk,h=POSE.h*kk;
 c.points=[[x0,y0],[x0+sg*w,y0],[x0+sg*w,y0+h],[x0,y0+h]];setImg(c,im,path,POSE.w,POSE.h);c.sourceRect=[0,0,POSE.w,POSE.h];stats.swapped++;}
// ── 바깥: 겹겹의 잔상 ──
const ALPHA={boss:[.26,.16,.1],mid:[.16]};
function ghosts(e,who,cmds,st0){if(!prefs.ghosts)return;const c=bodyCmd(cmds,st0);if(!c)return;const s=stOf(e),t=T(),dt=s.lastT<0?0:Math.max(0,Math.min(.1,t-s.lastT));s.lastT=t;
 let sp=0;if(Number.isFinite(s.wx)&&dt>0){sp=Math.hypot(e.x-s.wx,e.y-s.wy)/dt;const d=(e.x-s.wx)-(e.y-s.wy);if(Math.abs(d)>1e-4)s.vx=d>0?1:-1;}s.wx=e.x;s.wy=e.y;if(dt>0)s.move+=((sp>.18?1:0)-s.move)*Math.min(1,dt*8);
 const n=who==='mid'?1:(e.maxHp>0&&e.hp/e.maxHp<=.5?3:2),H=Hq(c);let K=1;const A=e.attack;if(A){const w=windupOf(A,e),el=Number(A.elapsed)||0;if(el<w)K=1+2.2*Math.min(1,el/w);}
 const out=[];for(let i=1;i<=n;i++){const side=i%2?1:-1,amp=H*(.035+.025*i)*K;
  const dx=side*amp*(.8+.2*Math.sin(t*2.4+i*2.3+s.seed))-(s.vx||0)*s.move*H*.05*i,dy=-H*.012*i*(1+Math.cos(t*1.2+i+s.seed))*.5;
  const a=(ALPHA[who][i-1]??.08)*(c.style?.globalAlpha??1);
  out.push({...c,style:{...(c.style||{}),globalAlpha:a},points:c.points.map(q=>Array.isArray(q)?[q[0]+dx,q[1]+dy,...q.slice(2)]:q),key:String(c.key??'enemy')+':r760g'+i,r760Ghost:true,r620Ghost:undefined});}
 const i=cmds.indexOf(c);if(i>=0){cmds.splice(i,0,...out);stats.ghosted++;}
 // 몸이 커져 엔진이 옛 키에 맞춰 둔 이름표가 얼굴을 덮던 것 → 이름표를 몸 맨 위(보이는 윗줄 3%) 위로 올린다.
 if(who==='boss'){const top=Math.min(...c.points.map(q=>q[1]))+H*.03-6;for(let j=st0;j<cmds.length;j++){const k=cmds[j];if(k?.kind==='text'&&k.owner?.kind==='enemy'&&Array.isArray(k.point)&&k.point[1]>top){k.point=[k.point[0],top,...k.point.slice(2)];stats.label=(stats.label||0)+1;}}}}
const ALL=['p1','p2','p3','p4','rain','transition'];let visit='';
// 엔진은 지역을 옮길 때 그림 캐시를 비울 수 있다 → 불면귀 지역에 들어와 처음 적이 그려질 때 한 번 미리 청한다(보스 첫 등장에 원본이 비치지 않게).
function preload(){const r=roomId();if(r===visit)return;visit=r;if(r==='last303'||r==='last302')for(const k of ALL)img(DIR+k+'.webp');}
function wrap(fn,pre){if(typeof drawEnemy!=='function')return false;const base=drawEnemy;drawEnemy=function(e,...a){
  if(pre&&prefs.on)try{preload();}catch(_){}
  const who=prefs.on?role(e):null;if(!who)return base.call(this,e,...a);
  const cm=(typeof ctx!=='undefined'&&Array.isArray(ctx?.commands))?ctx.commands:null,st0=cm?cm.length:-1;const r=base.call(this,e,...a);
  if(cm&&st0>=0)try{fn(e,who,cm,st0);}catch(err){fail(err);}return r;};return true;}
const inner=wrap((e,who,cm,st0)=>{stats.draws++;if(who==='boss')swap(e,cm,st0);},true);
let outer=false;const installOuter=()=>{if(!outer)outer=wrap(ghosts);};
if(typeof setTimeout==='function')setTimeout(installOuter,0);else installOuter();
// 보스 구역에 들어가기 전에 미리 불러 둔다(첫 등장에 원본이 한 번 비치지 않게).
for(const k of ALL)img(DIR+k+'.webp');
window.__STORYWORLD_BULMYEONGWI_R760__=Object.freeze({rev:REV,inspect:()=>({rev:REV,inner,outer,last,prefs:{...prefs},stats:{...stats},lastError,scale:SCALE}),
 set(p={}){for(const k of Object.keys(prefs))if(typeof p[k]==='boolean')prefs[k]=p[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return {...prefs};}});
})();

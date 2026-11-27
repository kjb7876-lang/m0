// R1346 보스별 차별 — 사용자 2026-11-26 14:00Z "추천안대로 개선해서 보스별 차별이 확실하게"(R1346 조사 문서 안 A).
//  조사: 보스·중간보스 77명이 자기 패턴 위에 '모든 보스에 같은 공용 스킬 층'(R241 운석·R330 재해·R105 날아오는 운석·R411/R1040 터짐 시트·R431 던지기 폭발)을
//   이름 해시·장판 색으로 받아, 어느 보스든 같은 그림이 반복돼 보였다.
//  이 파일 = 보스별 표 하나 + 시그니처 스킬. 다른 파일은 이 표를 먼저 묻고(연결 지점 한 줄씩), 표에 없는 적(사몽·생존 등)은 예전 그대로다.
//  ① 공용 운석(R241)·바닥 고리는 모든 보스 유지(사용자 14:01Z "1.모든보스"). 같은 6발 운석이 겹치던 R330 '화산'은 불 계열 중간보스 3명만,
//     R105 하늘에서 날아오는 운석은 불 계열 4명만.
//  ② R330 재해: 고유 스킬이 있는 본보스는 끄고, 중간보스는 서사 맞춤 종류로(예: 늪의 뿔악마 군주는 '군' 글자 때문에 폭탄이던 것을 홍수로).
//     재해의 바닥 육망성 예고는 끈다(바닥 예고 금지 규칙). 머리 위 육망성·재해 그림은 그대로.
//  ③ 터짐 그림: R1040(패턴 터짐)·R411(장판 터짐)·R431(조형물 던지기 폭발) 그림을 보스 서사에 맞춘 표로. 불 계열만 검은 불꽃 유지.
//  ④ 시그니처 스킬: 고유 스킬이 없던 본보스 17명에게 각자 다른 모양(줄·벽·고리·조여듦·추적·나선·십자·흩뿌림·퍼짐) × 다른 프레임 시트.
//     그림은 저장소의 Dots 24칸 시트(R411·R438·R431)를 그대로 쓴 임시본 — 보스 전용 시트가 오면 표의 sheet 만 바꾼다(최종 아님).
//     바닥 예고 장판 없음: 시트의 첫 프레임(작게 피어오름)이 신호. 피해 = 보스 근접 × .35 한 칸에 한 번, 한 시전 합 ≤ 근접 1.4대, 재사용 14~16초.
//  맘몬 지역(b06·b06b·금고 장부감시자·겨울숲 가시파수)은 사용자 승인 전 손대지 않는 규칙이라 표에서 뺐다(예전 그대로, R1358).
//  질투(b03)·탐식(b04)은 다른 스레드(R1343·위장 꿈틀) 몫이라 비워 두고 register(id,spec) 로 넣을 자리만 연다.
//  끄기: localStorage['storyworld.r1346.identity']='{"on":false}' (모든 연결 지점이 예전 동작으로).
(()=>{'use strict';
if(window.__STORYWORLD_BOSS_IDENTITY_R1346__)return;
const REV='R1346-identity-1',KEY='storyworld.r1346.identity',TAU=Math.PI*2;
let prefs={on:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={casts:0,bursts:0,hits:0,draws:0,errors:0,blasts:0};let lastError=null,lastSpots=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const G=k=>{try{return Function('return typeof '+k+'!=="undefined"?'+k+':undefined')();}catch(_){return undefined;}};
const T=()=>{const t=G('time');return typeof t==='number'?t:0;};
// ---- 시트(모두 6열 24칸 Dots 프레임 시트) ----
const SD=(path,py,o={})=>Object.freeze({path,cell:256,cols:6,n:24,fps:16,py,...o});
const SHEETS=({
 'boss-meteor':SD('assets/r411/fx/boss-meteor.webp',192),'boss-fire-wall':SD('assets/r411/fx/boss-fire-wall.webp',175),'boss-corpse-explosion':SD('assets/r411/fx/boss-corpse-explosion.webp',192),
 'boss-tentacle-bind':SD('assets/r411/fx/boss-tentacle-bind.webp',208),'boss-gravity-well':SD('assets/r411/fx/boss-gravity-well.webp',150),'boss-bone-spikes':SD('assets/r411/fx/boss-bone-spikes.webp',192),
 'boss-infection-mark':SD('assets/r411/fx/boss-infection-mark.webp',128),'boss-lightning-strike':SD('assets/r411/fx/boss-lightning-strike.webp',208),'boss-ground-fissure':SD('assets/r411/fx/boss-ground-fissure.webp',160),
 'enemy-poison-mist':SD('assets/r438/fx/enemy-poison-mist.webp',160),'enemy-cold-wave':SD('assets/r438/fx/enemy-cold-wave.webp',175),'enemy-curse-brand':SD('assets/r438/fx/enemy-curse-brand.webp',128),
 'black-flare':SD('assets/r431/black-flare.webp',151.5,{cell:192}),'black-burst':SD('assets/r431/black-burst.webp',151.5,{cell:192})});
// R1358: 보스 전용 Dots 시트를 이름으로 더한다(이미 있는 이름은 덮지 않음). 가로 한 줄 시트면 cols=n.
function addSheet(key,v){if(!key||SHEETS[key]||!v||!v.path||!(v.cell>0)||!(v.n>=12)||!(v.fps>0))return null;SHEETS[key]=Object.freeze({cols:v.n,py:v.cell*.78,...v});return SHEETS[key];}
// 터짐 그림 계열 → 시트
const FAMILY=Object.freeze({fire:'boss-fire-wall',blood:'boss-corpse-explosion',earth:'boss-ground-fissure',poison:'enemy-poison-mist',shock:'boss-lightning-strike',void:'boss-gravity-well',
 frost:'enemy-cold-wave',curse:'enemy-curse-brand',blackfire:'black-flare',blackburst:'black-burst',bone:'boss-bone-spikes',tentacle:'boss-tentacle-bind',infect:'boss-infection-mark'});
const FIRE=new Set(['dist06-boss','b07-boss','mb-dist06','mb-ep1b07']);// 불·지옥 계열: 날아오는 운석·검은 불꽃 유지
// ---- 보스별 표: [터짐 계열, R411 장판 두 그림, 재해(false=끔 | 종류), 시그니처(없으면 'own' = 이미 고유 스킬 있음)] ----
const B='boss-';
const ROWS={
 // 본보스 — 고유 스킬이 이미 있는 보스(R473·R1239·R1258·R1263·R1042·R1274·R472)
 'dist06-boss':['fire',[B+'fire-wall',B+'corpse-explosion'],false,'own'],
 'a11-boss':['blackfire',[B+'lightning-strike',B+'gravity-well'],false,'own'],
 'b02-boss':['poison',[B+'infection-mark',B+'gravity-well'],false,'own'],
 'b05-boss':['curse',[B+'tentacle-bind',B+'gravity-well'],false,'own'],
 'b07-boss':['fire',[B+'fire-wall',B+'bone-spikes'],false,'own'],
 'b08-boss':['blood',[B+'bone-spikes',B+'corpse-explosion'],false,'own'],
 'b09-boss':['shock',[B+'lightning-strike',B+'ground-fissure'],false,'own'],
 // 본보스 — 새 시그니처(모양 × 시트, 보스마다 다름). 근거는 그 보스의 엔진 패턴 이름(새 설정을 짓지 않음)
 'dist00-boss':['tentacle',[B+'tentacle-bind',B+'ground-fissure'],false,{shape:'line',sheet:B+'tentacle-bind',why:'검은 뿌리 직선 찌르기'}],
 'u203-boss':['shock',[B+'lightning-strike',B+'gravity-well'],false,{shape:'cross',sheet:B+'lightning-strike',why:'도시 0번지 소거'}],
 'l301-boss':['blackburst',[B+'bone-spikes',B+'gravity-well'],false,{shape:'ring',sheet:'black-flare',why:'여섯 형상 동시 검'}],
 'l303-boss':['void',[B+'gravity-well',B+'tentacle-bind'],false,{shape:'chase',sheet:B+'gravity-well',why:'잠들 수 없는 시선'}],
 'l305-boss':['earth',[B+'ground-fissure',B+'corpse-explosion'],false,{shape:'rain',sheet:B+'ground-fissure',why:'불면귀와 같던 패턴 세트를 땅울림으로 구분'}],
 'kair-great-01':['bone',[B+'bone-spikes',B+'ground-fissure'],false,{shape:'rain',sheet:B+'bone-spikes',why:'시간조형 — 뼈 가시'}],
 'kair-great-02':['earth',[B+'ground-fissure',B+'lightning-strike'],false,{shape:'wall',sheet:B+'ground-fissure',why:'최초명령 교차식 — 갈라진 벽'}],
 'kair-great-03':['curse',[B+'gravity-well',B+'infection-mark'],false,{shape:'ring',sheet:'enemy-curse-brand',why:'유예의 열린 시간방'}],
 'kair-great-04':['blood',[B+'corpse-explosion',B+'gravity-well'],false,{shape:'spiral',sheet:B+'corpse-explosion',why:'붕괴시간로'}],
 'kair-great-05':['infect',[B+'infection-mark',B+'tentacle-bind'],false,{shape:'chase',sheet:B+'infection-mark',why:'자비로운 단일결론'}],
 'kair-great-06':['void',[B+'gravity-well',B+'lightning-strike'],false,{shape:'line',sheet:B+'gravity-well',why:'시간조형 염동역행'}],
 'k103-boss':['frost',[B+'tentacle-bind',B+'ground-fissure'],false,{shape:'line',sheet:'enemy-cold-wave',why:'세이렌 파도 부채'}],
 'h103-boss':['blackfire',[B+'tentacle-bind',B+'bone-spikes'],false,{shape:'chase',sheet:'black-flare',why:'EGO 환수탈취'}],
 'c102-boss':['shock',[B+'lightning-strike',B+'infection-mark'],false,{shape:'spiral',sheet:B+'lightning-strike',why:'최초명령 교차식'}],
 'c103-boss':['fire',[B+'fire-wall',B+'bone-spikes'],false,{shape:'wall',sheet:B+'fire-wall',why:'질서의 방벽'}],
 'c104-boss':['blackburst',[B+'gravity-well',B+'corpse-explosion'],false,{shape:'expand',sheet:'black-burst',why:'검은태양 연산환'}],
 // 중간보스 — 터짐 그림·재해 종류만 서사 맞춤(재해는 유지)
 'mb-dist01':['void',[B+'gravity-well',B+'tentacle-bind'],'tornado'],
 'mb-dist02':['poison',[B+'tentacle-bind',B+'infection-mark'],'flood'],
 'mb-dist03':['blood',[B+'corpse-explosion',B+'bone-spikes'],'volcano'],
 'mb-dist04':['blackburst',[B+'bone-spikes',B+'gravity-well'],'wisp'],
 'mb-dist05':['curse',[B+'gravity-well',B+'infection-mark'],'wisp'],
 'mb-dist06':['fire',[B+'fire-wall',B+'corpse-explosion'],'volcano'],
 'mb-ep1a08':['shock',[B+'lightning-strike',B+'infection-mark'],'poison'],
 'mb-ep1a09':['poison',[B+'infection-mark',B+'gravity-well'],'poison'],
 'mb-ep1a10':['earth',[B+'ground-fissure',B+'bone-spikes'],'bomb'],
 'mb-ep1a11':['blackfire',[B+'lightning-strike',B+'corpse-explosion'],'tornado'],
 'mb-ep1b01':['curse',[B+'gravity-well',B+'bone-spikes'],false],// R1241 72 그림자가 고유 스킬
 'mb-ep1b02':['poison',[B+'infection-mark',B+'ground-fissure'],'poison'],
 'mb-ep1b05':['curse',[B+'tentacle-bind',B+'infection-mark'],'wisp'],
 'mb-ep1b07':['fire',[B+'fire-wall',B+'corpse-explosion'],'volcano'],
 'mb-ep1b08':['blood',[B+'corpse-explosion',B+'bone-spikes'],'poison'],
 'mb-ep1b09':['shock',[B+'lightning-strike',B+'ground-fissure'],'bomb'],
 'u201-mid':['shock',[B+'lightning-strike',B+'ground-fissure'],'bomb'],
 'u202-mid':['earth',[B+'ground-fissure',B+'bone-spikes'],'bomb'],
 'u203-mid':['void',[B+'gravity-well',B+'lightning-strike'],'wisp'],
 'u204-mid':['curse',[B+'infection-mark',B+'lightning-strike'],'wisp'],
 'u205-mid':['blackburst',[B+'corpse-explosion',B+'ground-fissure'],'bomb'],
 'u206-mid':['tentacle',[B+'tentacle-bind',B+'gravity-well'],'wisp'],
 'mb-hando01':['void',[B+'gravity-well',B+'infection-mark'],'wisp'],
 'mb-hando02':['shock',[B+'lightning-strike',B+'bone-spikes'],'bomb'],
 'mb-hando03':['blackfire',[B+'bone-spikes',B+'tentacle-bind'],'wisp'],
 'mb-murder01':['frost',[B+'ground-fissure',B+'lightning-strike'],'flood'],
 'mb-murder02':['curse',[B+'infection-mark',B+'ground-fissure'],'wisp'],
 'mb-murder03':['earth',[B+'ground-fissure',B+'corpse-explosion'],'tornado'],
 'murder04-mid':['void',[B+'gravity-well',B+'ground-fissure'],'wisp'],
 'c101-mid':['fire',[B+'fire-wall',B+'lightning-strike'],'bomb'],
 'c103-mid':['infect',[B+'infection-mark',B+'bone-spikes'],'wisp'],
 'c104-mid':['tentacle',[B+'tentacle-bind',B+'infection-mark'],'poison'],
 'c105-mid':['poison',[B+'infection-mark',B+'corpse-explosion'],'poison'],
 'c106-mid':['shock',[B+'lightning-strike',B+'corpse-explosion'],'bomb']};
const extra=new Map();// register() 로 다른 스레드가 넣는 보스
function mk(id,r){const [burst,r411,disaster,sig]=r;return Object.freeze({id,burst,r411:r411.slice(),disaster,own:sig==='own',sig:sig&&sig!=='own'?Object.freeze({...sig}):null});}
const TABLE=Object.fromEntries(Object.entries(ROWS).map(([id,r])=>[id,mk(id,r)]));
// R1358: 게임 안 이름표(nativeId)가 겹치는 두 경우 — 주사실(ep1a09)의 주사기 환영체가 오만의 폐허핵 이름표(mb-ep1a10)를, 병원 집도의가 안정화 감독 이름표(mb-ep1a08)를 같이 쓴다.
const ALIAS=Object.freeze({'mb-ep1a10|중독을 부르는 주사기 환영체':'mb-ep1a09','mb-ep1a08|병원 심부의 집도의':'mb-ep1a08s'});
const idOf=e=>{if(!e)return '';const n=String(e.nativeId||e.id||'');return ALIAS[n+'|'+e.name]||n;};
function spec(e){if(!prefs.on||!e)return null;const id=idOf(e);return extra.get(id)||TABLE[id]||null;}
function allow(kind,e){const s=spec(e);if(!s)return undefined;
 if(kind==='meteor')return true;/* 사용자 14:01Z: 공용 운석·바닥 고리 모든 보스 유지 */
 if(kind==='disaster')return s.disaster!==false;
 if(kind==='flyMeteor')return FIRE.has(s.id);
 return undefined;}
const disasterKind=e=>{const s=spec(e);return s&&typeof s.disaster==='string'?s.disaster:null;};
const sheetOf=name=>SHEETS[FAMILY[name]||name]||null;
const sheetByPath=p=>Object.values(SHEETS).find(s=>s.path===p)||null;
function ownerOf(h){try{const r=G('room');return (r?.enemies||[]).find(e=>e&&e.id===h.owner)||null;}catch(_){return null;}}
function burstSheet(h){const e=h&&h.owner!=null?ownerOf(h):null,s=spec(e);return s?sheetOf(s.burst):null;}
function r411Pair(e){const s=spec(e);return s?{elem:'r1346',a:s.r411[0],b:s.r411[1],n:0}:null;}
function blastSheet(e){const s=spec(e);if(!s||FIRE.has(s.id))return null;return sheetOf(s.burst);}
function register(id,v){if(!id||!v)return null;const cur=TABLE[id];const r=[v.burst||cur?.burst||'earth',v.r411||cur?.r411||[B+'ground-fissure',B+'bone-spikes'],v.disaster!==undefined?v.disaster:(cur?cur.disaster:false),v.own?'own':(v.sig||(cur?.own?'own':cur?.sig)||'own')];
 extra.set(String(id),mk(String(id),r));return extra.get(String(id));}
// ---- 그리기 도우미 ----
const asked=new Map();
function image(p){try{const got=G('readyImage')?.(p);if(got?.image)return got.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);const en=G('ensureImages');if(typeof en==='function')Promise.resolve(en([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
function unit(x,y){const pr=G('project');if(typeof pr!=='function')return 34;const a=pr(x,y),b=pr(x+1,y),c=pr(x,y+1);return Math.max(Math.hypot(b.x-a.x,b.y-a.y),Math.hypot(c.x-a.x,c.y-a.y))*1.25;}
function cellDraw(sh,f,sx,sy,w,alpha){const c=G('ctx'),im=image(sh.path);if(!c||!im||!(f>=0&&f<sh.n))return false;const col=f%sh.cols,row=Math.floor(f/sh.cols);
 const was=c.globalAlpha,wf=c.filter,br=sh.bright>0&&sh.bright!==1&&sh.bright<=2;c.globalAlpha=Math.max(0,Math.min(1,alpha==null?1:alpha));if(br)c.filter='brightness('+sh.bright+')';/* R1358: 시트별 밝기(brightness 만 — 기록기 안전) */
 try{c.drawImage(im,col*sh.cell,row*sh.cell,sh.cell,sh.cell,sx-w/2,sy-w*sh.py/sh.cell,w,w);}finally{c.globalAlpha=was;if(br)c.filter=wf;}stats.draws++;return true;}
// R431 던지기 폭발 대신 그 보스의 터짐 시트(이미 R431 scope 안에서 불림). 그렸으면 true.
function drawBlast(owner,el,x,y,w){const sh=blastSheet(owner);if(!sh)return false;const f=Math.floor(el*sh.fps);if(f<sh.n)cellDraw(sh,f,x,y,w*1.05,1);stats.blasts++;return true;}
// ---- 시그니처 스킬 ----
const TUNE=Object.freeze({first:5,cd:14,jitter:2,cap:1.4,dmgK:.35,radius:.95,range:14,impact:.42,size:1.9});
const ARCH=Object.freeze(['line','wall','ring','expand','chase','spiral','cross','rain','orbit','zigzag']);
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function rng(seed){let s=seed>>>0||1;return()=>{s=Math.imul(s^(s>>>15),2246822507)>>>0;s=Math.imul(s^(s>>>13),3266489909)>>>0;return ((s^=s>>>16)>>>0)/4294967296;};}
// 자리 만들기: 시전 순간 보스(e)·영웅(p) 자리 기준. 결과 [{x,y,d(지연 초)}]
function layout(shape,e,p,id,n){const h=hash(id),rot=(h%360)*Math.PI/180,R=rng(h+n*7919),dx=p.x-e.x,dy=p.y-e.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,out=[];const add=(x,y,d)=>out.push({x,y,d});
 if(shape==='line'){const step=1.05+(h%5)*.12,cnt=Math.ceil((L+2.6)/step),wob=(h%3)*.18;for(let i=1;i<=cnt;i++){const s=i*step,o=Math.sin(i*1.3)*wob;add(e.x+ux*s-uy*o,e.y+uy*s+ux*o,i*.12);}}
 else if(shape==='wall'){const cnt=7,gap=1.05+(h%4)*.08;for(let i=0;i<cnt;i++){const o=(i-(cnt-1)/2)*gap;add(p.x-uy*o,p.y+ux*o,Math.abs(i-(cnt-1)/2)*.1);}}
 else if(shape==='ring'){const k=6;for(let i=0;i<k;i++){const a=rot+i*TAU/k;add(p.x+Math.cos(a)*2.6,p.y+Math.sin(a)*2.6,0);}for(let i=0;i<3;i++){const a=rot+i*TAU/3+.5;add(p.x+Math.cos(a)*1.25,p.y+Math.sin(a)*1.25,.55);}add(p.x,p.y,1.0);}
 else if(shape==='expand'){const rings=[1.5,L,L+1.5];rings.forEach((r,j)=>{const k=Math.max(6,Math.round(TAU*r/1.7));for(let i=0;i<k;i++){const a=rot+i*TAU/k+j*.2;add(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,j*.45);}});}
 else if(shape==='spiral'){const k=11,turn=(h%2?1:-1);for(let i=0;i<k;i++){const u=1-i/(k-1),a=rot+turn*i*.75,r=3.6*u;add(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,i*.11);}}
 else if(shape==='cross'){add(p.x,p.y,0);const arms=[[1,0],[-1,0],[0,1],[0,-1]].map(([a,b])=>[a*Math.cos(rot)-b*Math.sin(rot),a*Math.sin(rot)+b*Math.cos(rot)]);for(const s of [1.3,2.6])for(const [ax,ay] of arms)add(p.x+ax*s,p.y+ay*s,s*.14);}
 else if(shape==='orbit'){const k=8,turn=(h%2?1:-1),a0=Math.atan2(dy,dx),r=Math.max(1.6,L);for(let i=0;i<k;i++){const a=a0+turn*(i-k+1)*TAU/k;add(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,i*.13);}}/* R1358: 보스 둘레를 한 바퀴 돌아 영웅 자리에서 끝남 */
 else if(shape==='zigzag'){const step=1.2,cnt=Math.ceil((L+2)/step),amp=.9+(h%3)*.15;for(let i=1;i<=cnt;i++){const s=i*step,o=(i%2?1:-1)*amp;add(e.x+ux*s-uy*o,e.y+uy*s+ux*o,i*.1);}}/* R1358: 보스→영웅 지그재그 */
 else if(shape==='rain'){add(p.x,p.y,0);const k=7+(h%3);for(let i=0;i<k;i++){const a=R()*TAU,r=1.3+R()*2.2;add(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,.15+i*.14);}}
 return out;}
let casts=[];const state=new WeakMap();
function hero(){return G('player');}
function liveBoss(e){return !!e&&e.hp>0&&!e.deadRecorded&&(!e.spawnState||e.spawnState==='active')&&e.visible!==false&&!e.disabled;}
function blockedAt(x,y){try{const bl=G('blocked'),r=G('room');return typeof bl==='function'&&bl(x,y,.25,r);}catch(_){return false;}}
function start(e,s,now){const p=hero();if(!p)return;const id=idOf(e),st=state.get(e)||{n:0};st.n++;state.set(e,st);
 const shape=s.sig.shape,sh=sheetOf(s.sig.sheet),lead=Math.floor(sh.n*TUNE.impact)/sh.fps;
 let pts=shape==='chase'?[]:layout(shape,e,p,id,st.n).filter(q=>!blockedAt(q.x,q.y));
 const C={e,id,shape,sh,t0:now,lead,dmg:Math.max(1,(Number(e.damage)||20)*TUNE.dmgK),cap:Math.max(1,(Number(e.damage)||20)*TUNE.cap),dealt:0,rows:[],chase:shape==='chase'?{left:4+(hash(id)%3),next:now,gap:.5+(hash(id)%3)*.08}:null};
 for(const q of pts)C.rows.push({x:q.x,y:q.y,t0:now+q.d,hit:false});
 lastSpots=pts.map(q=>[+(q.x-p.x).toFixed(1),+(q.y-p.y).toFixed(1),+q.d.toFixed(2)]);if(shape==='chase')lastSpots=[id,'chase',C.chase.left,C.chase.gap];
 casts.push(C);if(casts.length>6)casts.shift();stats.casts++;stats.bursts+=C.rows.length;}
function hurtHero(C){const hf=G('hurt'),p=hero();if(typeof hf!=='function'||!p)return;if(C.dealt+C.dmg>C.cap+1e-9)return;let r;try{r=hf(C.dmg,{r1346:C.id,source:C.e,enemy:C.e,kind:'r1346-signature'});}catch(err){fail(err);return;}
 if(r==='ignored'||r==='invulnerable'||r==='parried'||r===false)return;C.dealt+=C.dmg;stats.hits++;}
function step(){const now=T(),r=G('room'),p=hero();if(!prefs.on||!r||!p){casts=[];return;}
 casts=casts.filter(C=>C.e&&r.enemies&&r.enemies.includes(C.e)&&(C.rows.some(w=>now-w.t0<C.sh.n/C.sh.fps+.1)||C.chase&&C.chase.left>0));
 for(const C of casts){if(C.chase&&C.chase.left>0&&now>=C.chase.next&&liveBoss(C.e)){C.rows.push({x:p.x,y:p.y,t0:now,hit:false});C.chase.left--;C.chase.next=now+C.chase.gap;stats.bursts++;}
  for(const w of C.rows){if(w.hit||now<w.t0+C.lead)continue;w.hit=true;if(!liveBoss(C.e))continue;if(Math.hypot(p.x-w.x,p.y-w.y)<=TUNE.radius&&!(p.invincible>0))hurtHero(C);}}
 for(const e of r.enemies||[]){const s=spec(e);if(!s||!s.sig||!liveBoss(e))continue;const st=state.get(e)||{n:0};state.set(e,st);
  const d=Math.hypot(p.x-e.x,p.y-e.y);if(d>TUNE.range){if(st.next)st.next=Math.max(st.next,now+2);continue;}
  if(!st.next){st.next=now+TUNE.first;continue;}
  if(now>=st.next&&!casts.some(C=>C.e===e&&(C.rows.some(w=>!w.hit)||C.chase&&C.chase.left>0))){st.next=now+TUNE.cd+(hash(idOf(e)+st.n)%100)/100*TUNE.jitter;start(e,s,now);}}
 if(casts.length)arm();}
function draw(){const c=G('ctx'),pr=G('project');if(!c||typeof pr!=='function')return;const now=T();
 for(const C of casts)for(const w of C.rows){const a=now-w.t0;if(a<0)continue;const f=Math.floor(a*C.sh.fps);if(f>=C.sh.n)continue;const q=pr(w.x,w.y),W=unit(w.x,w.y)*TUNE.size*(C.sh.scale>0?C.sh.scale:1);/* R1358: 칸 안 그림 크기가 다른 Dots 시트는 scale 로 맞춤 */
  const fn=()=>cellDraw(C.sh,f,q.x,q.y,W,f<3?.55+.15*f:1);
  if(typeof c.scope==='function')c.scope({id:'r1346:'+C.id+':'+C.t0+':'+w.x.toFixed(2),kind:'effect',x:w.x,y:w.y,groundAligned:false,enemy:true,ownerType:'enemy'},fn);else fn();}}
const SENT={type:'r1346-fx',x:0,y:0,age:0,life:Infinity};
function arm(){try{const fx=G('effects');if(Array.isArray(fx)&&!fx.includes(SENT)){SENT.age=0;fx.push(SENT);}}catch(_){}}
const DE=G('drawEffect');if(typeof DE==='function'){const base=DE;try{Function('f','drawEffect=f')(function(fx,...a){if(fx&&fx.type==='r1346-fx'){try{if(prefs.on)draw();}catch(err){fail(err);}return;}return base.apply(this,[fx,...a]);});}catch(err){fail(err);}}
const TK=G('tick');if(typeof TK==='function'){const base=TK;try{Function('f','tick=f')(function(...a){const r=base.apply(this,a);try{step();}catch(err){fail(err);}return r;});}catch(err){fail(err);}}
function set(v){prefs={...prefs,...(v&&typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)casts=[];return {...prefs};}
window.__STORYWORLD_BOSS_IDENTITY_R1346__=Object.freeze({revision:REV,set,spec,allow,disasterKind,groundSigil:()=>prefs.on?false:undefined,r411Pair,burstSheet,blastSheet,drawBlast,sheetOf,sheetByPath,register,
 table:()=>Object.values({...TABLE,...Object.fromEntries(extra)}),archetypes:ARCH,addSheet,tune:TUNE,families:FAMILY,
 cast:(e)=>{const s=spec(e);if(!s||!s.sig)return false;start(e,s,T());arm();return true;},
 inspect:()=>({revision:REV,prefs:{...prefs},...stats,casting:casts.length,lastSpots,lastError})});
})();

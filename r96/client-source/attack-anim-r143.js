// R143 — 영웅 기본 공격을 드라이브 시트의 6프레임(예비 2 · 타격 2 · 회수 2)으로 이어 그린다.
//  · R130 은 공격·스킬·막기를 시트의 한 칸(정지 그림)으로만 바꿔, 멈춰 서서 칠 때 한 자세가 0.2초 떴다 사라졌다(동작이 없음).
//    환도는 걷기만 새 시트를 받아 공격이 가장 옛 묶음(hero-authored)으로 남아 있었다.
//  · 멈춰 서서 기본 공격할 때(attackAnim>0, 스킬·맞음·대시·궁극기·막기·걷기 아님) 몸 그림을 assets/r143/attack/<영웅>/attack-<방향>.webp 의
//    공격 진행에 맞는 칸으로 바꾼다. 방향은 가장 가까운 적(4칸 안) 쪽 8방향, 없으면 영웅이 보는 방향. 왼쪽 3방향은 오른쪽 그림 반전.
//  · 발은 칸의 발 기준점(96, 방향별 실측)을 영웅 발밑점에, 키는 걷기와 같은 방법(칸마다 머리 꼭대기 중앙값)으로 서 있기 키에 맞춘다.
//  · 걸으면서 치기(R119 걷기 이어 가기), 스킬·궁극기·막기 그림, 협동 모드는 그대로. 판정·피해·세이브는 바꾸지 않는다.
//  · 맞았을 때(hurtAnim, 스킬·대시·궁극기·막기 아님): 같은 시트의 피격 2프레임(충격 → 뒤로 젖힘, assets/r143/hit)을 맞은 쪽(가장 가까운 적)을 보며 그린다.
//    환도 시트에는 피격이 없어 환도는 예전 피격 그림 그대로다.
//  · 환도 서 있기: 드라이브 시트 README 의 '흰 망토 대기 원화'와 달리 게임은 옛 황갈색 R93 서 있기를 써서 멈출 때마다 색·화풍이 바뀌었다.
//    시트에 서 있기가 없어, 같은 시트의 공격 첫 칸(발을 딛고 칼을 든 대기 자세)을 마지막 걷기 방향으로 쓰고 숨쉬기만 ±1% 준다.
//    storyworld.r143.attack {on:false} 로 끄면 R130 정지 그림으로, {hwandoIdle:false} 로 끄면 R93 서 있기·옛 동작 묶음으로 돌아간다.
//    같은 이유로 환도의 스킬·막기·맞음·대시도 옛 황갈색 동작 묶음 대신 흰 망토 시트 칸을 쓴다(R130 이 다른 영웅에 쓴 대응).
(()=>{'use strict';
if(window.__STORYWORLD_ATTACK_ANIM_R143__)return;
const REV='R143-attack-anim-1',KEY='storyworld.r143.attack';
const HEROES=['lauren','hwando','seoha','neon','michaela','hunter','slayer','gunner'];
const FOOT={lauren:{s:225,se:223,e:227,ne:226,n:226},hwando:{s:219,se:220,e:226,ne:226,n:226},seoha:{s:226,se:225,e:226,ne:224,n:225},neon:{s:225,se:225,e:226,ne:226,n:226},
 michaela:{s:226,se:226,e:226,ne:226,n:226},hunter:{s:226,se:226,e:226,ne:226,n:226},slayer:{s:220,se:220,e:223,ne:225,n:226},gunner:{s:227,se:227,e:227,ne:227,n:227}};// index.json 의 방향별 발 실측
/* R201(사용자 2026-11-01 영웅 기본팩 적용): 기본팩의 추가 동작만 실제 동작으로 — 미카엘라 스킬6·궁극기8 S/E, 로렌 스킬6 S/E·궁극기8 S/SE/E·방어4 S/E·대시4 S(낱장 PNG 4장) — 다른 방향은 기존 그림 유지(W 는 E 반전, 기존 매핑과 같음).
   기본팩의 대기·걷기·공격·피격·사망 25세트(미카엘라·서하·로렌)는 이미 들어간 그림과 픽셀이 같아 바꿀 것이 없었다(R130·R143·R151).
   방어는 들어올리는 4칸을 0.32초에 한 번 돌고 마지막 칸에 머문다. 대시는 이동 방향, 스킬·궁극기는 가까운 적 방향. */
const SKILLSET={michaela:{skill:['s','e'],ultimate:['s','e']},lauren:{skill:['s','e'],ultimate:['s','se','e'],guard:['s','e'],dash:['s']}};// scripts/r201-heropack-extra.py 가 만든 방향만
const ACT_FOOT={'michaela:skill':{s:227,e:232},'michaela:ultimate':{s:226,e:231},'lauren:skill':{s:226,e:226},'lauren:ultimate':{s:226,se:224,e:236},'lauren:guard':{s:227,e:240},'lauren:dash':{s:225}};// 칸 안 발 실측(index.json footY)
const DIR8=['e','se','s','sw','w','nw','n','ne'],SHEET={s:['s',0],se:['se',0],e:['e',0],ne:['ne',0],n:['n',0],sw:['se',1],w:['e',1],nw:['ne',1]};
const FOUR={front:'s',back:'n',left:'w',right:'e'};
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/attack\/|awakening|^blob:/;
let prefs={on:true,hwandoIdle:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hitFrames:0,idleFrames:0,frames:0,swings:0,dupRemoved:0,waiting:0,errors:0,lastDir:null,lastFrame:null};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const pathOf=(h,d,act='attack')=>act==='walk'?(d==='e'&&(h==='gunner'||h==='hwando')?'assets/r144/walk/'+h+'/walk-e.webp':'assets/'+(h==='gunner'?'r128':'r130')+'/'+h+'/walk-'+d+'.webp'):act==='hit'&&h==='hwando'?'assets/r196/hwando/hit-'+d+'.webp'/* R196 색감 맞춘 파생본 */:'assets/r143/'+act+'/'+h+'/'+act+'-'+d+'.webp',HIT=new Set(HEROES);/* R194: 환도 피격 2프레임(드라이브 Hwando 49/276 묶음, s·se·e·n — hit-NE 는 묶음 품질 보류 '칼 하나 더' 라 북동은 북 시트로) */
const HIT_FALLBACK={hwando:{ne:'n'}};
const asked=new Map();
// R147: R119 상태(서 있기 비율·걷기 방향)는 0.25초마다 한 번만 읽는다(inspect 는 상태표 전체를 복사한다).
let r119S={},r119At=0;const r119Stats=()=>{const t=Date.now();if(t-r119At>250){r119At=t;try{r119S=window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats||{};}catch(_){r119S={};}}return r119S;};
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
// 걷기(R140 sheetMeasure)와 같은 방법: 칸마다 가운데 100px 띠의 머리 꼭대기 → 발(226)~머리 키의 중앙값.
const bodyMemo=new WeakMap();
function bodyOf(im){let v=bodyMemo.get(im);if(v)return v;v=180;try{const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,n=Math.max(1,Math.round(W/192)),cw=W/n,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,W,H).data,hs=[];
 for(let k=0;k<n;k++){const x0=Math.round(k*cw+46),x1=Math.round(k*cw+146);let top=-1;for(let y=0;y<H&&top<0;y++)for(let x=x0;x<x1;x+=2)if(d[(y*W+x)*4+3]>24){top=y;break;}if(top>=0)hs.push(226-top);}
 hs.sort((a,b)=>a-b);const m=hs[hs.length>>1];if(m>=150&&m<=240)v=m;}catch(_){}bodyMemo.set(im,v);return v;}
function dirNow(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y),ang=Math.atan2(b.y-q.y,b.x-q.x);if(player.hero==='gunner'){/* R425: 기억사수 좌·우 공격 그림이 각각 약 120°(±60°)를 맡는다(사용자 2026-11-08 "좋은 이미지라서") — 남은 위·아래 60°씩만 n·s */const d=Math.abs(ang)*180/Math.PI;stats.gunner120=(stats.gunner120||0)+1;return d<=60?'e':d>=120?'w':ang<0?'n':'s';}return DIR8[((Math.round(ang/(Math.PI/4))%8)+8)%8];}}catch(_){}return FOUR[player?.direction]||'s';}
let swing={start:0,prev:0,dir:'s'};
function apply(rec,st){const h=player.hero;if(!HEROES.includes(h))return;
 const a=+player.attackAnim||0;if(a>swing.prev+1e-6||swing.start<=0){swing.start=a;swing.dir=dirNow();stats.swings++;}swing.prev=a;
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;if(c.r121Walk)return;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return;const fr=place(rec,st,best,h,swing.dir,a,swing.start,0);if(fr==null)return;
 stats.frames++;stats.lastDir=swing.dir;stats.lastFrame=fr;}
// 시트 칸 하나를 몸 그림 자리에 그린다(발 기준점·걷기와 같은 키). idle 이면 첫 칸 + 숨쉬기.
function place(rec,st,best,h,dir8,a,start,idle,act='attack',fixed=null){const[sd0,mir]=SHEET[dir8]||SHEET.s,sd=act==='hit'&&HIT_FALLBACK[h]?.[sd0]||sd0;
 // R437: 네온·라우렌 새 좌·우 공격(넓은 칸·자기 발 자리·몸 180 고정) — 시트 표는 neon-lauren-r437.js. 끄면 예전 192 칸 시트.
 const alt0=act==='attack'&&!idle?window.__STORYWORLD_NEON_LAUREN_R437__?.attackSheet?.(h,sd):null,altIm=alt0?image(alt0.path):null,alt=altIm?alt0:null/* R437 시트가 아직 안 왔으면 예전 시트로 */,CW=alt?alt.cell[0]:192,FX=alt?alt.foot[0]:96,p=alt?alt.path:pathOf(h,sd,act),im=alt?altIm:image(p);if(!im)return null;
 const n=Math.max(1,Math.round((im.naturalWidth||im.width)/CW)),fr=fixed!=null?Math.min(n-1,fixed):idle?0:Math.min(n-1,Math.floor(Math.min(.999,Math.max(0,1-a/Math.max(.05,start)))*n));
 const bh=Math.abs(best.points[3][1]-best.points[0][1]),want=(typeof actorHeight==='function'?actorHeight():bh)*(r119Stats().standRatio||.98),k=want/(alt?alt.body:bodyOf(im)),ky=idle?k*(1+.01*Math.sin((typeof time==='number'?time:0)*2.2)):k;
 const q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want*.65),fx=q.x,fy=q.y-lift,f=mir?-1:1,ay=alt?alt.foot[1]:ACT_FOOT[h+':'+act]?.[sd]??(act==='walk'?226:(FOOT[h]?.[sd])||226);
 const sx=fr*CW,X=v=>fx+f*(v-FX)*k,Y=v=>fy+(v-ay)*ky,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[sx,0,CW,256],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(CW),Y(0)],[X(CW),Y(256)],[X(0),Y(256)]],r143Attack:!idle&&act==='attack',r437Attack:alt?{hero:h,frame:fr}:null,r143Hit:act==='hit',r143Idle:!!idle});
 // 몸을 두 번 그리는 영웅(환도: 몸 + 겹친 사본)은 같은 옛 그림의 다른 사본을 지운다.
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before&&BODY_ART.test(String(c.sourcePath||c.image?.src||''))){rec.commands.splice(i,1);stats.dupRemoved++;}}
 return fr;}
// 환도: 옛 그림(황갈색 R93 서 있기, hero-authored 동작 묶음)을 같은 흰 망토 시트로. R130 이 다른 영웅에 쓴 대응과 같다
//  (스킬 → 공격 3번째 칸, 막기·맞음 → 공격 첫 칸(시트에 피격 없음), 대시 → 걷기 4번째 칸, 궁극기 → 공격 4번째 칸(타격) —
//   옛 묶음의 궁극기 칸은 효과 없는 황갈색 찌르기 자세였다).
function hwandoUnify(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const src=String(c.sourcePath||c.image?.src||'');if(!BODY_ART.test(src))continue;if(c.r121Walk||c.r143Attack)return;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return;const src=String(best.sourcePath||best.image?.src||''),walkDir=()=>{const d=r119Stats().walkDir||FOUR[player.direction]||'s';return DIR8.includes(d)?d:'s';};
 if(/r93\/idle\/idle-hwando/.test(src)){if(place(rec,st,best,'hwando',walkDir(),0,1,1)!=null)stats.idleFrames++;return;}
 if(!/hero-authored[^/]*\/hwando-(action|walk)-atlas/.test(src))return;
 const[act,fr,dir]=player.ultimateAnim>0?['attack',3,dirNow()]:player.dashAnim>0?['walk',3,walkDir()]:player.skillAnim>0?['attack',2,dirNow()]:['attack',0,dirNow()];
 if(place(rec,st,best,'hwando',dir,0,1,0,act,fr)!=null)stats.hwandoActs=(stats.hwandoActs||0)+1;}
// 기억사수 대시: R128 이 만든 대시 그림(g-dash_*)은 몸이 34% 작아(36px vs 서 있기 54px) 대시 때마다 영웅이 줄었다 → 다른 영웅(R130)처럼 걷기 4번째 칸.
function gunnerDash(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const src=String(c.sourcePath||c.image?.src||'');if(!BODY_ART.test(src))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best||!/r128\/gunner\/g-dash/.test(String(best.sourcePath||best.image?.src||'')))return;const d=r119Stats().walkDir||FOUR[player.direction]||'e';
 if(place(rec,st,best,'gunner',DIR8.includes(d)?d:'e',0,1,0,'walk',3)!=null)stats.gunnerDash=(stats.gunnerDash||0)+1;}
let hurt={start:0,prev:0,dir:'s'};
const cast={act:null,start:0,prev:0,dir:'s',t0:0};
function currentAct(){if(player.dashAnim>0)return'dash';if(player.guard)return'guard';if(player.ultimateAnim>0)return'ultimate';if(player.skillAnim>0)return'skill';return null;}
function applyAct(rec,st){const h=player.hero,act=currentAct();if(!act||!SKILLSET[h]?.[act])return false;
 const a=act==='guard'?1:(+player[act+'Anim']||0),now=typeof time==='number'?time:performance.now()/1000;
 if(cast.act!==act||(act!=='guard'&&a>cast.prev+1e-6)||cast.start<=0){cast.act=act;cast.start=a;cast.t0=now;cast.dir=act==='dash'?(r119Stats().walkDir||FOUR[player.direction]||'s'):dirNow();}cast.prev=a;
 const sd=(SHEET[cast.dir]||SHEET.s)[0];if(!SKILLSET[h][act].includes(sd))return false;/* 없는 방향은 기존 그림 그대로 */
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return false;const fixed=act==='guard'?Math.min(3,Math.floor((now-cast.t0)/.08)):null;
 const fr=place(rec,st,best,h,cast.dir,a,cast.start,0,act,fixed);if(fr==null)return false;stats[act+'Frames']=(stats[act+'Frames']||0)+1;stats.lastFrame=fr;return true;}
function applyHit(rec,st){const h=player.hero;if(!HIT.has(h))return;const a=+player.hurtAnim||0;if(a>hurt.prev+1e-6||hurt.start<=0){hurt.start=a;hurt.dir=dirNow();}hurt.prev=a;
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(best&&place(rec,st,best,h,hurt.dir,a,hurt.start,0,'hit')!=null)stats.hitFrames++;}
// R144: 옆 걷기(walk-e) 는 드라이브 v1 시트로(기억사수·환도). v2 walk-e 는 8칸 모두 뒷다리 아래가 잘려 장화가 몸에서 떨어져 보였다
//  (scripts/r144-walk-v1.py, assets/r144/walk/<영웅>/index.json). 칸 배치·발 기준점이 같아 그림만 바꾼다. 받기 전에는 예전 그림 그대로.
const WALK_V1={'assets/r128/gunner/walk-e.webp':'assets/r144/walk/gunner/walk-e.webp','assets/r130/hwando/walk-e.webp':'assets/r144/walk/hwando/walk-e.webp'};
function swapWalk(rec,st){for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero')continue;const src=String(c.sourcePath||c.image?.src||'').replace(/^.*?(assets\/)/,'$1').split('?')[0];const to=WALK_V1[src];if(!to)continue;
 const row=typeof readyImage==='function'?readyImage(to):null;if(!row?.image){image(to);continue;}c.image=row.image;c.sourcePath=to;stats.walkV1=(stats.walkV1||0)+1;}}
// 미리 받기: 영웅이 바뀔 때뿐 아니라 지역을 옮길 때도(게임이 지역마다 그림 기억을 비운다) — 처음 쓰는 순간 그림이 없어
//  옛 그림이 0.3초쯤 보이던 것(환도 스킬, 헤드리스 120초 관찰 8장면)을 막는다. 아직 못 받은 것은 2초마다 다시 묻는다.
function preload(){try{const h=player?.hero;if(!HEROES.includes(h))return 0;let miss=0;const want=[];for(const [act,ds] of Object.entries(SKILLSET[h]||{}))for(const d of ds)want.push(pathOf(h,d,act));/* R201 *//* R437 새 공격 시트 */{const a=window.__STORYWORLD_NEON_LAUREN_R437__?.attackSheet?.(h,'e');if(a?.path)want.push(a.path);}for(const d of['s','se','e','ne','n']){want.push(pathOf(h,d));if(HIT.has(h)&&!HIT_FALLBACK[h]?.[d])want.push(pathOf(h,d,'hit'));if(h==='hwando'||h==='gunner')want.push(pathOf(h,d,'walk'));}if(h==='hwando'||h==='gunner')want.push('assets/r144/walk/'+h+'/walk-e.webp');
 for(const p of want){if(typeof readyImage==='function'&&readyImage(p))continue;miss++;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}catch(_){}}}stats.preloadMiss=miss;return miss;}catch(_){return 0;}}
let lastHero=null,lastRoom=null,nextPre=0;
// R440: 몸 그림 덧씌우기들(이 파일·환도·슬레이어·헌터)이 상태를 읽기 직전에 스킬 중이면 '공격 중'으로 잠깐 바꿔 보인다(되돌림은 skill-attack-r440 바깥 감싸기).
if(typeof drawHero==='function'){const inner=drawHero;drawHero=function(...a){const r=inner.apply(this,a);try{window.__STORYWORLD_SKILL_ATTACK_R440__?.swap?.();}catch(_){}return r;};}
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 if(player?.hero==='hwando'&&window.__STORYWORLD_HWANDO_R242__?.active?.())return r;/* R242: 환도는 새 선택 자산이 그린다 — 옛 시트를 그리거나 받지 않는다(텍스처 중복 방지) */
 try{if(st>=0&&rec&&prefs.on)swapWalk(rec,st);}catch(e){fail(e);}
 try{const now=Date.now();if(player&&(player.hero!==lastHero||(typeof room!=='undefined'&&room!==lastRoom)||now>=nextPre)){lastHero=player.hero;lastRoom=typeof room!=='undefined'?room:null;nextPre=now+(preload()?2000:15000);}
  const busy=player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard;
  if(!(player?.attackAnim>0))swing.prev=0;if(!(player?.hurtAnim>0))hurt.prev=0;
  if(prefs.on&&st>=0&&solo()&&player?.hero==='gunner'&&player.dashAnim>0){gunnerDash(rec,st);return r;}
  const hurtOnly=player?.hurtAnim>0&&!(player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard);/* R194: 환도도 피격 시트가 생겨 맞을 땐 아래 applyHit 로 */
  if(prefs.on&&prefs.hwandoIdle&&st>=0&&solo()&&player?.hero==='hwando'&&!(player.attackAnim>0&&!busy)&&!hurtOnly){hwandoUnify(rec,st);return r;}
  if(prefs.on&&st>=0&&solo()&&player?.hurtAnim>0&&!(player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard)){applyHit(rec,st);return r;}
  if(prefs.on&&st>=0&&solo()&&player&&currentAct()){const ca=currentAct();/* R720 규칙 2: 스킬·궁극기 커밋 창 뒤 이동이면 전용 시트를 내려놓고 걷기(R119)에 맡긴다 */if(!((ca==='skill'||ca==='ultimate')&&window.__STORYWORLD_HERO_MOTION_R720__?.moveCancel?.('skill'))&&applyAct(rec,st))return r;}else cast.act=null;
  if(!prefs.on||st<0||!solo()||!player||!(player.attackAnim>0)||busy)return r;
  apply(rec,st);}catch(e){fail(e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
// R440: 지금 R201 전용 스킬·궁극기 시트(미카엘라·라우렌 s/e)를 그릴 차례인가 — 그때는 공격 모션으로 바꾸지 않는다.
function actSheet(){try{const h=player?.hero,act=currentAct();if(!prefs.on||!solo()||!act||act==='dash'||act==='guard'||!SKILLSET[h]?.[act])return false;const d=cast.act===act&&cast.start>0?cast.dir:dirNow();return SKILLSET[h][act].includes((SHEET[d]||SHEET.s)[0]);}catch(_){return false;}}
window.__STORYWORLD_ATTACK_ANIM_R143__=Object.freeze({revision:REV,set,FOOT,actSheet,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();

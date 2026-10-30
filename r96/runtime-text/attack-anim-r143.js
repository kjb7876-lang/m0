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
const DIR8=['e','se','s','sw','w','nw','n','ne'],SHEET={s:['s',0],se:['se',0],e:['e',0],ne:['ne',0],n:['n',0],sw:['se',1],w:['e',1],nw:['ne',1]};
const FOUR={front:'s',back:'n',left:'w',right:'e'};
const BODY_ART=/hero_direction|hero-authored|assets\/heroes\/|r91\/walk\/|r93\/idle\/|r119\/heroes\/|r121\/(?:heroes|walk)\/|r128\/gunner\/|r130\/[a-z]+\/|r143\/attack\/|awakening|^blob:/;
let prefs={on:true,hwandoIdle:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={hitFrames:0,idleFrames:0,frames:0,swings:0,dupRemoved:0,waiting:0,errors:0,lastDir:null,lastFrame:null};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const pathOf=(h,d,act='attack')=>act==='walk'?'assets/'+(h==='gunner'?'r128':'r130')+'/'+h+'/walk-'+d+'.webp':'assets/r143/'+act+'/'+h+'/'+act+'-'+d+'.webp',HIT=new Set(HEROES.filter(h=>h!=='hwando'));
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});else if(typeof addImage==='function')addImage(p);}}catch(e){fail(e);}stats.waiting++;return null;}
// 걷기(R140 sheetMeasure)와 같은 방법: 칸마다 가운데 100px 띠의 머리 꼭대기 → 발(226)~머리 키의 중앙값.
const bodyMemo=new WeakMap();
function bodyOf(im){let v=bodyMemo.get(im);if(v)return v;v=180;try{const W=im.naturalWidth||im.width,H=im.naturalHeight||im.height,n=Math.max(1,Math.round(W/192)),cw=W/n,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,W,H).data,hs=[];
 for(let k=0;k<n;k++){const x0=Math.round(k*cw+46),x1=Math.round(k*cw+146);let top=-1;for(let y=0;y<H&&top<0;y++)for(let x=x0;x<x1;x+=2)if(d[(y*W+x)*4+3]>24){top=y;break;}if(top>=0)hs.push(226-top);}
 hs.sort((a,b)=>a-b);const m=hs[hs.length>>1];if(m>=150&&m<=240)v=m;}catch(_){}bodyMemo.set(im,v);return v;}
function dirNow(){try{const q=project(player.x,player.y);let best=null,bd=4;for(const e of room?.enemies||[]){if(!(e?.hp>0)||e.visible===false)continue;const d=Math.hypot(e.x-player.x,e.y-player.y);if(d<bd){bd=d;best=e;}}
 if(best){const b=project(best.x,best.y);return DIR8[((Math.round(Math.atan2(b.y-q.y,b.x-q.x)/(Math.PI/4))%8)+8)%8];}}catch(_){}return FOUR[player?.direction]||'s';}
let swing={start:0,prev:0,dir:'s'};
function apply(rec,st){const h=player.hero;if(!HEROES.includes(h))return;
 const a=+player.attackAnim||0;if(a>swing.prev+1e-6||swing.start<=0){swing.start=a;swing.dir=dirNow();stats.swings++;}swing.prev=a;
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;if(c.r121Walk)return;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return;const fr=place(rec,st,best,h,swing.dir,a,swing.start,0);if(fr==null)return;
 stats.frames++;stats.lastDir=swing.dir;stats.lastFrame=fr;}
// 시트 칸 하나를 몸 그림 자리에 그린다(발 기준점·걷기와 같은 키). idle 이면 첫 칸 + 숨쉬기.
function place(rec,st,best,h,dir8,a,start,idle,act='attack',fixed=null){const[sd,mir]=SHEET[dir8]||SHEET.s,p=pathOf(h,sd,act),im=image(p);if(!im)return null;
 const n=Math.max(1,Math.round((im.naturalWidth||im.width)/192)),fr=fixed!=null?Math.min(n-1,fixed):idle?0:Math.min(n-1,Math.floor(Math.min(.999,Math.max(0,1-a/Math.max(.05,start)))*n));
 const bh=Math.abs(best.points[3][1]-best.points[0][1]),want=(typeof actorHeight==='function'?actorHeight():bh)*(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio||.98),k=want/bodyOf(im),ky=idle?k*(1+.01*Math.sin((typeof time==='number'?time:0)*2.2)):k;
 const q=project(player.x,player.y),lift=Math.min(Math.max(+player.visualLiftPx||0,0),want*.65),fx=q.x,fy=q.y-lift,f=mir?-1:1,ay=act==='walk'?226:(FOOT[h]?.[sd])||226;
 const sx=fr*192,X=v=>fx+f*(v-96)*k,Y=v=>fy+(v-ay)*ky,before=best.image;
 Object.assign(best,{image:im,sourcePath:p,immutableTint:null,sourceRect:[sx,0,192,256],imageSize:[im.naturalWidth||im.width,im.naturalHeight||im.height],
  points:[[X(0),Y(0)],[X(192),Y(0)],[X(192),Y(256)],[X(0),Y(256)]],r143Attack:!idle&&act==='attack',r143Hit:act==='hit',r143Idle:!!idle});
 // 몸을 두 번 그리는 영웅(환도: 몸 + 겹친 사본)은 같은 옛 그림의 다른 사본을 지운다.
 for(let i=rec.commands.length-1;i>=st;i--){const c=rec.commands[i];if(c!==best&&c.kind==='image'&&c.owner?.kind==='hero'&&c.image===before&&BODY_ART.test(String(c.sourcePath||c.image?.src||''))){rec.commands.splice(i,1);stats.dupRemoved++;}}
 return fr;}
// 환도: 옛 그림(황갈색 R93 서 있기, hero-authored 동작 묶음)을 같은 흰 망토 시트로. R130 이 다른 영웅에 쓴 대응과 같다
//  (스킬 → 공격 3번째 칸, 막기·맞음 → 공격 첫 칸(시트에 피격 없음), 대시 → 걷기 4번째 칸, 궁극기 → 공격 4번째 칸(타격) —
//   옛 묶음의 궁극기 칸은 효과 없는 황갈색 찌르기 자세였다).
function hwandoUnify(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const src=String(c.sourcePath||c.image?.src||'');if(!BODY_ART.test(src))continue;if(c.r121Walk||c.r143Attack)return;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best)return;const src=String(best.sourcePath||best.image?.src||''),walkDir=()=>{const d=window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.walkDir||FOUR[player.direction]||'s';return DIR8.includes(d)?d:'s';};
 if(/r93\/idle\/idle-hwando/.test(src)){if(place(rec,st,best,'hwando',walkDir(),0,1,1)!=null)stats.idleFrames++;return;}
 if(!/hero-authored[^/]*\/hwando-(action|walk)-atlas/.test(src))return;
 const[act,fr,dir]=player.ultimateAnim>0?['attack',3,dirNow()]:player.dashAnim>0?['walk',3,walkDir()]:player.skillAnim>0?['attack',2,dirNow()]:['attack',0,dirNow()];
 if(place(rec,st,best,'hwando',dir,0,1,0,act,fr)!=null)stats.hwandoActs=(stats.hwandoActs||0)+1;}
// 기억사수 대시: R128 이 만든 대시 그림(g-dash_*)은 몸이 34% 작아(36px vs 서 있기 54px) 대시 때마다 영웅이 줄었다 → 다른 영웅(R130)처럼 걷기 4번째 칸.
function gunnerDash(rec,st){let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const src=String(c.sourcePath||c.image?.src||'');if(!BODY_ART.test(src))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(!best||!/r128\/gunner\/g-dash/.test(String(best.sourcePath||best.image?.src||'')))return;const d=window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.walkDir||FOUR[player.direction]||'e';
 if(place(rec,st,best,'gunner',DIR8.includes(d)?d:'e',0,1,0,'walk',3)!=null)stats.gunnerDash=(stats.gunnerDash||0)+1;}
let hurt={start:0,prev:0,dir:'s'};
function applyHit(rec,st){const h=player.hero;if(!HIT.has(h))return;const a=+player.hurtAnim||0;if(a>hurt.prev+1e-6||hurt.start<=0){hurt.start=a;hurt.dir=dirNow();}hurt.prev=a;
 let best=null,bh=0;for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points||!BODY_ART.test(String(c.sourcePath||c.image?.src||'')))continue;const hh=Math.abs(c.points[3][1]-c.points[0][1]);if(hh>bh){bh=hh;best=c;}}
 if(best&&place(rec,st,best,h,hurt.dir,a,hurt.start,0,'hit')!=null)stats.hitFrames++;}
// 미리 받기: 영웅이 바뀔 때뿐 아니라 지역을 옮길 때도(게임이 지역마다 그림 기억을 비운다) — 처음 쓰는 순간 그림이 없어
//  옛 그림이 0.3초쯤 보이던 것(환도 스킬, 헤드리스 120초 관찰 8장면)을 막는다. 아직 못 받은 것은 2초마다 다시 묻는다.
function preload(){try{const h=player?.hero;if(!HEROES.includes(h))return 0;let miss=0;const want=[];for(const d of['s','se','e','ne','n']){want.push(pathOf(h,d));if(HIT.has(h))want.push(pathOf(h,d,'hit'));if(h==='hwando'||h==='gunner')want.push(pathOf(h,d,'walk'));}
 for(const p of want){if(typeof readyImage==='function'&&readyImage(p))continue;miss++;const t=Date.now();if(t-(asked.get(p)||0)>1000){asked.set(p,t);try{if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}catch(_){}}}stats.preloadMiss=miss;return miss;}catch(_){return 0;}}
let lastHero=null,lastRoom=null,nextPre=0;
if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=base.apply(this,a);
 try{const now=Date.now();if(player&&(player.hero!==lastHero||(typeof room!=='undefined'&&room!==lastRoom)||now>=nextPre)){lastHero=player.hero;lastRoom=typeof room!=='undefined'?room:null;nextPre=now+(preload()?2000:15000);}
  const busy=player.skillAnim>0||player.hurtAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard;
  if(!(player?.attackAnim>0))swing.prev=0;if(!(player?.hurtAnim>0))hurt.prev=0;
  if(prefs.on&&st>=0&&solo()&&player?.hero==='gunner'&&player.dashAnim>0){gunnerDash(rec,st);return r;}
  if(prefs.on&&prefs.hwandoIdle&&st>=0&&solo()&&player?.hero==='hwando'&&!(player.attackAnim>0&&!busy)){hwandoUnify(rec,st);return r;}
  if(prefs.on&&st>=0&&solo()&&player?.hurtAnim>0&&!(player.skillAnim>0||player.dashAnim>0||player.ultimateAnim>0||player.guard)){applyHit(rec,st);return r;}
  if(!prefs.on||st<0||!solo()||!player||!(player.attackAnim>0)||busy)return r;
  apply(rec,st);}catch(e){fail(e);}return r;};}
function set(k,v){prefs[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_ATTACK_ANIM_R143__=Object.freeze({revision:REV,set,FOOT,inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,browser:false,GPU:false})});
})();

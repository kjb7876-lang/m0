// R161 — 사몽 맵에 스토리 몹이 그대로 다시 나오던 문제(사용자 2026-10-31 "스토리모드에서 사용하던 몹들이 사몽맵에 재등장하는 버그 … 재등장하지 않게,
//  마땅한 자산이 없으면 '영웅의 꼭두각시 자아', '세뇌당한 기억의 조각' 조형물과 '피로 얼룩진 기억 타일' + 구글드라이브 쓸만한 자산 적용").
//  원인: 사몽 구역(R103·R115)은 에피소드마다 STORY 지역의 몹을 '기증자'(EP.mobs [지역, 몹 id])로 빌려 와 그 그림 그대로 만든다.
//  · 꼭두각시 자아: 사몽 구역의 일반 몹 중 사몽 전용 그림(R105 학생·종이 형상)이 없는 몹은 몸 그림을 빼고, 드라이브 '영웅의 꼭두각시 자아'
//    걷기 8프레임(오른쪽, 왼쪽은 반전)으로 그린다. 그림자·체력바·이름·판정·체력·피해·스킬·저장은 그대로(보이는 것만).
//    보스·중간보스·페르소나 급과 사몽 전용 그림이 있는 몹은 건드리지 않는다. 걷기 한 동작뿐이라 공격·피격은 같은 걷기 칸 + 번쩍임으로 보인다.
//  · 세뇌당한 기억의 조각: 사몽 구역마다 통로를 막지 않는 장식 조형물 2개(간소화 1개)를 입구·출구·다른 조형물에서 떨어진 바닥에 둔다.
//  · 피로 얼룩진 기억 타일: world-tiles-r118.js 에서 전용 바닥이 없는 사몽 구역의 바닥 텍스처로 쓴다.
//  자산 출처(드라이브, 읽기 전용 원본 보존): Samong-Hero-Puppet-Ego RUNTIME(시트 sha256 bb64255c…), Samong-Memory-Fallback PART01(조형물 f1a9c0a9…),
//  PART02+03(타일 두 조각 합본 f480fb72…). 세 자산 모두 전달 문서상 '사몽 및 그 이후 맵 전용, 적합한 기존 자산이 없을 때만'의 조건부 후보다.
//  설정 키 storyworld.r161.samong {puppet,sculpture}. 협동 모드에서는 쉰다.
(()=>{'use strict';
if(window.__STORYWORLD_SAMONG_R161__)return;
const REV='R161-samong-1',KEY='storyworld.r161.samong';
const PUPPET='assets/r161/puppet/puppet-ego-walk-right-8.webp',SCULPT='assets/r161/sculpture/memory-fragment.webp';
// 시트 1024×640, 4열×2행, 칸 256×320. 발 기준점(칸 안) 101.8,299.5, 몸 키 214.5px(실 제외, 원본 429px의 절반).
const CW=256,CH=320,PX=101.8,PY=299.5,BODY=214.5,FPS=8;
let prefs={puppet:true,sculpture:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={puppetDraws:0,skippedArt:0,skippedMajor:0,waits:0,sculptures:0,rooms:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,160);};
const solo=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
const T=()=>typeof time==='number'?time:0;
const asked=new Map();
function image(p){try{const row=typeof readyImage==='function'?readyImage(p):null;if(row?.image)return row.image;const t=Date.now();if(t-(asked.get(p)||0)>1500){asked.set(p,t);if(typeof ensureImages==='function')Promise.resolve(ensureImages([p])).catch(()=>{});}}catch(e){fail(e);}return null;}
const samongRoom=()=>typeof room==='object'&&!!room?.samongR103;
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
function hasSamongArt(e){try{return !!window.__STORYWORLD_DRIVE_ART_R105__?.artFor?.(e);}catch(_){return false;}}
const puppetOf=e=>prefs.puppet&&solo()&&samongRoom()&&!!e?.samongR103&&!major(e)&&!hasSamongArt(e);

// ---- 꼭두각시 자아 -------------------------------------------------------------------------
let hiding=null;
if(typeof readyImage==='function'){const base=readyImage;readyImage=function(p,...a){if(hiding&&typeof p==='string'&&p!==PUPPET)return null;return base.call(this,p,...a);};}
function drawPuppet(e,im){const dead=e.hp<=0||e.spawnState==='dead',age=T()-(Number.isFinite(e.deadAt)?e.deadAt:T());if(dead&&age>.8)return;
 const q=project(e.x,e.y),cp=e.combatProfile,size=(typeof actorHeight==='function'?actorHeight():60)*(cp?.spriteRect?.height||1)*(e.defScale||1),k=size/BODY,lift=Math.max(0,Math.min(size*.65,Number(e.visualLiftPx)||0));
 const m=e.r161||(e.r161={x:e.x,y:e.y,moving:0,face:1,seed:Math.random()*8});const dx=e.x-m.x,dy=e.y-m.y,sp=Math.hypot(dx,dy);
 if(sp>.002){m.moving=T()+.25;const sx=(dx-dy);if(Math.abs(sx)>.001)m.face=sx<0?-1:1;}else if(typeof player==='object'&&player){const s=(player.x-player.y)-(e.x-e.y);if(Math.abs(s)>.05&&T()>m.moving)m.face=s<0?-1:1;}
 m.x=e.x;m.y=e.y;
 const walking=T()<m.moving||e.state==='attack'||e.state==='windup',fr=walking?Math.floor(T()*FPS+m.seed)%8:0,sx0=(fr%4)*CW,sy0=Math.floor(fr/4)*CH;
 ctx.save();try{ctx.globalAlpha*=dead?Math.max(0,1-age/.8):1;ctx.filter=e.flash>0?'brightness(1.8) saturate(.5)':'saturate(.92) contrast(1.05)';
  ctx.translate(q.x,q.y-lift);ctx.scale(m.face*k,k);ctx.drawImage(im,sx0,sy0,CW,CH,-PX,-PY,CW,CH);}finally{ctx.restore();}
 stats.puppetDraws++;}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){let im=null;
 try{if(puppetOf(e)){im=image(PUPPET);if(!im)stats.waits++;}else if(e?.samongR103&&samongRoom()){if(major(e))stats.skippedMajor++;else stats.skippedArt++;}}catch(err){fail(err);im=null;}
 if(!im)return base.apply(this,[e,...a]);
 hiding=e;let r;try{r=base.apply(this,[e,...a]);}finally{hiding=null;}
 try{scopeDraw(e,()=>drawPuppet(e,im));}catch(err){fail(err);}return r;};}
function scopeDraw(e,f){if(typeof ctx.scope==='function')ctx.scope({id:'r161:puppet:'+e.id,kind:'enemy',x:e.x,y:e.y},f);else f();}

// ---- 세뇌당한 기억의 조각 --------------------------------------------------------------------
function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function dress(){if(!prefs.sculpture||!solo()||!samongRoom())return;const r=room,L=r.exploration,key=r.samongR103.key||r.samongR103.zone||'';if(!L||r.r161Dressed===key)return;
 r.r161Dressed=key;stats.rooms++;const cells=(L.floorCells||[]).slice();if(!cells.length)return;
 const avoid=[L.entry,r.objective,L.samongR103?.exit,L.samongR103?.dais,L.samongR103?.centre].filter(p=>p&&Number.isFinite(p.x)),props=r.props||(r.props=[]);
 const want=(typeof settings!=='undefined'&&settings.lowFx)?1:2;let h=hash(key),n=0;
 for(let t=0;t<120&&n<want;t++){h=Math.imul(h^(h>>>13),0x5bd1e995)>>>0;const c=cells[h%cells.length],x=c[0]+.5,y=c[1]+.5;
  if(avoid.some(p=>Math.hypot(p.x-x,p.y-y)<4.5))continue;if(props.some(p=>Math.hypot(p.x-x,p.y-y)<2.2))continue;
  if(typeof blocked==='function'&&[[1,0],[-1,0],[0,1],[0,-1]].filter(([a,b])=>!blocked(x+a,y+b,.3,r)).length<4)continue;// 통로 한가운데(좁은 곳)는 피한다
  props.push({id:'r161:sculpt:'+key+':'+n,path:SCULPT,x,y,height:118+(h%17),solid:false,autoTargetEligible6:false,visible:true,r80PresentationOnly:true,r161Sculpture:true,flip:!!(h&1)});n++;stats.sculptures++;}
 if(n)image(SCULPT);}
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(p?.r161Sculpture&&!image(p.path))return;return base.apply(this,[p,...a]);};}
let next=0;
if(typeof tick==='function'){const base=tick;tick=function(...a){const r=base.apply(this,a);try{if(T()>=next||T()<next-5){next=T()+.5;dress();}}catch(e){fail(e);}return r;};}
if(typeof enterRegion==='function'){const base=enterRegion;enterRegion=async function(...a){const r=await base.apply(this,a);try{dress();if(samongRoom())image(PUPPET);}catch(e){fail(e);}return r;};}
function set(p){prefs={...prefs,...p};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}}
window.__STORYWORLD_SAMONG_R161__=Object.freeze({revision:REV,set,puppetOf,PUPPET,SCULPT,
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,room:samongRoom()?{key:room.samongR103.key,dressed:room.r161Dressed||null,sculptures:(room.props||[]).filter(p=>p.r161Sculpture).length,puppets:(room.enemies||[]).filter(e=>e.hp>0&&puppetOf(e)).length,mobs:(room.enemies||[]).filter(e=>e.hp>0).length}:null})});
})();

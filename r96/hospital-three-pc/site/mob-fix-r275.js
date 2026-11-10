// R275 몹·보스 전수 점검 후속 — 사용자 2026-11-03 "모든몹 보스들 코드랑 이미지 전수조사해서 렉이랑 배경처리 및 이미지잘림등 모든부분개선".
//  전수 조사: scripts/r275-mob-audit.py(그림마다 칸 가장자리 알파·불투명 모서리·밝은 테두리·칸별 몸 높이/발 줄) + 헤드리스 집계(지역마다 몹이 실제 그린 그림·칸).
//  ① 화면 밖 몹은 drawEnemy 사슬 맨 바깥에서 건너뛴다. 엔진·덧씌우기 27겹이 몹마다 매 프레임 돌았는데(dist02 41마리 중 화면 안 5~8마리),
//     원래 화면 밖 건너뛰기(perf-r119)는 사슬 한가운데라 그 바깥 13겹(R115 중심 재기·R205·R208·R248 고유 시트·R259·R260 …)은 화면 밖 몹에도 돌았다.
//     조건은 perf-r119 와 같다(보스·중간보스·페르소나·공격 중·원거리 준비·죽는 중은 늘 그린다, 여백 = 몸 키×2+40px).
//  ② R208·R223 드라이브 몹 스트립 14장 중 그림 문제가 있는 것을 파생본(assets/r275/mobs, 원본은 그대로)으로 바꿔 그린다 — 칸·발 기준점은 같고 경로만 바꾼다.
//     다리 사이·팔과 연기 사이에 남은 회색 판 배경 섬 제거, 밝은 회색 테두리(halo) 정리, 드라이브 시트 칸에서 이미 잘려 온 머리·꼬리·무기 끝은 납작한 단면 대신 부드럽게.
//     파생본이 다 읽힌 뒤에만 바꾼다(R260 처럼 크기 튐 없게).
//  끄기: localStorage['storyworld.r275.mobfix']='{"on":false}' (전부), '{"cull":false}' (①만), '{"art":false}' (②만)
(()=>{'use strict';
if(window.__STORYWORLD_MOB_FIX_R275__)return;
const REV='R275-mobfix-1',KEY='storyworld.r275.mobfix';
let prefs={on:true,cull:true,art:true};try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch(_){}
const stats={culled:0,drawn:0,remapped:0,waiting:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
// ② 원본 경로 → 파생본 (scripts/r275-mob-fix.py 가 만든 assets/r275/mobs/index.json 과 같은 표)
const ART=Object.freeze({
 'assets/r208/mobs/root-bound-ghoul.webp':'assets/r275/mobs/root-bound-ghoul.webp',
 'assets/r208/mobs/web-bound-skeleton.webp':'assets/r275/mobs/web-bound-skeleton.webp',
 'assets/r208/mobs/twin-head-corpse.webp':'assets/r275/mobs/twin-head-corpse.webp',
 'assets/r208/mobs/halberd-revenant.webp':'assets/r275/mobs/halberd-revenant.webp',
 'assets/r208/mobs/ember-hound.webp':'assets/r275/mobs/ember-hound.webp',
 'assets/r223/mobs/oblivion-spider.webp':'assets/r275/mobs/oblivion-spider.webp',
 'assets/r223/mobs/thread-nurse.webp':'assets/r275/mobs/thread-nurse.webp',
 'assets/r223/mobs/vial-collector.webp':'assets/r275/mobs/vial-collector.webp',
 'assets/r223/mobs/curtain-mannequin.webp':'assets/r275/mobs/curtain-mannequin.webp',
 'assets/r223/mobs/ash-mason.webp':'assets/r275/mobs/ash-mason.webp',
 'assets/r223/mobs/signal-golem.webp':'assets/r275/mobs/signal-golem.webp',
 'assets/r223/mobs/censer-priest.webp':'assets/r275/mobs/censer-priest.webp',
 'assets/r223/mobs/superego-inquisitor.webp':'assets/r275/mobs/superego-inquisitor.webp',
 'assets/r223/mobs/clockwork-sentinel.webp':'assets/r275/mobs/clockwork-sentinel.webp'});
const ready=p=>{try{return !!(typeof readyImage==='function'&&readyImage(p)?.image?.naturalWidth>0);}catch(_){return false;}};
const asked=new Set(),swapped=new Set();
function remap(){if(!prefs.on||!prefs.art||typeof room!=='object'||!room)return;const S=window.__STORYWORLD_STORY_MOBS_R208__;if(!S?.assign)return;
 for(const e of room.enemies||[]){if(!e||!e.r208Mob)continue;let m=null;try{m=S.assign(e);}catch(err){fail(err);}if(!m||m.r275From)continue;const to=ART[m.path];if(!to)continue;
  if(!ready(to)){if(!asked.has(to)&&typeof ensureImages==='function'){asked.add(to);Promise.resolve(ensureImages([to])).catch(err=>{asked.delete(to);fail(err);});}stats.waiting++;continue;}
  m.r275From=m.path;m.path=to;swapped.add(m);stats.remapped++;}}
function unmap(){for(const m of swapped){if(m.r275From){m.path=m.r275From;delete m.r275From;}}swapped.clear();}
// ① 화면 밖 건너뛰기(perf-r119 와 같은 조건, 사슬 맨 바깥)
const major=e=>!!(e&&(e.boss||e.midboss||e.persona||e.cosmic||e.trial||e.samongBoss||e.combatProfile?.major||/중간보스/.test(String(e.name||''))));
let inFrame=false;
const r119Cull=()=>{try{const s=JSON.parse(localStorage.getItem((window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r119.perf')||'null');return s?.cull!==false;}catch(_){return true;}};
let cullOK=r119Cull();
function offscreen(e){if(!prefs.on||!prefs.cull||!cullOK||!inFrame||!e||major(e)||e.attack||e.r61Action||e.rangedWindup>0||!(e.hp>0)||e.spawnState==='dead'||e.r251Circle||e.r170Tower)return false;
 const q=project(e.x,e.y),h=(typeof actorHeight==='function'?actorHeight():60)*(e.combatProfile?.spriteRect?.height||1)*(e.defScale||1),m=h*2+40,w=typeof W==='number'?W:innerWidth,hh=typeof H==='number'?H:innerHeight;
 return q.x<-m||q.x>w+m||q.y<-m*.6||q.y>hh+m*1.6;}
if(typeof draw==='function'){const frameBase=draw;draw=function(...a){inFrame=true;try{try{remap();}catch(err){fail(err);}return frameBase.apply(this,a);}finally{inFrame=false;}};}
if(typeof drawEnemy==='function'){const base=drawEnemy;drawEnemy=function(e,...a){try{if(offscreen(e)){stats.culled++;return;}}catch(err){fail(err);}stats.drawn++;return base.apply(this,[e,...a]);};}
function set(v){prefs={...prefs,...(typeof v==='object'?v:{on:v!==false})};try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}cullOK=r119Cull();if(!prefs.on||!prefs.art)unmap();return {...prefs};}
window.__STORYWORLD_MOB_FIX_R275__=Object.freeze({revision:REV,set,art:()=>({...ART}),offscreen:e=>{const f=inFrame;inFrame=true;try{return offscreen(e);}finally{inFrame=f;}},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},swapped:[...swapped].map(m=>m.id),lastError})});
})();

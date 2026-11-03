// R261 길잡이가 가는 길에 보물상자·상자·포인트 구슬을 챙긴다 — 사용자 2026-11-03 "길잡이상태에서도 보물상자알아서 열고 포인트획득하면서 가도록
//  그리고 가는길에 몹있으면 몹잡고 나아가도록 생략하고 가지않고".
//  · 길잡이·혼자·창 없음·근처(8칸) 적 없음일 때만. 적이 있으면 원래 길잡이가 먼저 싸운다(엔진 길잡이는 40칸 안 가장 가까운 적을 친다).
//  · 대상: R103 보물상자(아직 안 연 것), R108 부술 수 있는 상자(아직 포인트를 안 받은 것), R108 포인트 구슬, R177 바닥 쪽지.
//    지금 자리에서 직선 12칸 안·길(R100 navPath)이 있고 그 길 길이가 24칸 이하인 것 중 가장 가까운 것 하나. 한 번 실패한 대상은 그 맵에서 다시 고르지 않는다.
//  · 다가가면: 보물상자는 R103 openChest, 상자는 엔진 상호작용(E)으로 부수고, 구슬·쪽지는 밟아서 줍는다(R108·R177 그대로).
//  · 걷는 동안(대상당 최대 8초)은 원래 길잡이가 길을 다시 짜지 않게 한다. 적이 8칸 안에 나타나면 바로 원래 길잡이(전투)로 돌아간다.
//  끄기: localStorage['storyworld.r261.guideLoot']='{"on":false}'
(()=>{'use strict';
if(window.__STORYWORLD_GUIDE_LOOT_R261__)return;
const REV='R261-guide-loot-2',KEY='storyworld.r261.guideLoot',NEAR=12,MAXLEN=24,WALK=8;
let on=true;try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.on===false)on=false;}catch(_){}
const stats={walks:0,chests:0,crates:0,orbs:0,docs:0,skipped:0,errors:0};let lastError=null;const fail=e=>{stats.errors++;lastError=String(e?.message||e).slice(0,200);};
const T=()=>typeof time==='number'?time:0;
const solo=()=>{let m=null;try{m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();}catch(_){}return !m||m==='off';};
const G=()=>window.__STORYWORLD_GROWTH_R103__,CR=()=>window.__STORYWORLD_CRATES_R108__,POL=()=>window.__STORYWORLD_POLISH_R100__;
let cur=null,until=0,bad=new Set(),badRoom=null,nextPick=0;
function live(){try{return on&&solo()&&typeof guide!=='undefined'&&guide&&typeof started!=='undefined'&&started&&!(typeof modal!=='undefined'&&modal)&&!(typeof loading!=='undefined'&&loading)&&!(typeof storyScene!=='undefined'&&storyScene)&&typeof player==='object'&&player&&player.hp>0&&typeof room==='object'&&room;}catch(_){return false;}}
function enemyNear(){try{return typeof nearestEnemy==='function'&&!!nearestEnemy(8);}catch(_){return false;}}
function chestOpened(p){try{return (G()?.state?.()?.opened||[]).includes(p.chestR103);}catch(_){return true;}}
function crateClaimed(p){try{const C=CR();const id=C.idOf(p);return !!window.__STORYWORLD_PROGRESSION_R62__?.state?.(player)?.pointDropClaimsR64?.[id];}catch(_){return false;}}
function candidates(){const out=[],C=CR();
 for(const p of room.props||[]){if(!p||p.visible===false||p.destroyed)continue;const id=String(p.id||'');if(bad.has(id))continue;
  if(p.chestR103&&!chestOpened(p))out.push({p,kind:'chest'});
  else if(p.r108Orb)out.push({p,kind:'orb'});
  else if(C?.eligible?.(p)&&!crateClaimed(p))out.push({p,kind:'crate'});}
 try{const D=window.__STORYWORLD_STORY_COLLECT_R177__?.inspect?.()?.docs?.();if(Array.isArray(D))for(const d of D)if(!bad.has('doc:'+d.key))out.push({p:{id:'doc:'+d.key,x:d.x,y:d.y},kind:'doc'});}catch(_){}
 return out.map(c=>({...c,d:Math.hypot(c.p.x-player.x,c.p.y-player.y)})).filter(c=>c.d<=NEAR).sort((a,b)=>a.d-b.d);}
function pathTo(pt){try{const r=POL()?.navPath?.(player,pt);return Array.isArray(r)?r:null;}catch(e){fail(e);return null;}}
function len(r){let n=0;for(let i=1;i<r.length;i++)n+=Math.hypot(r[i].x-r[i-1].x,r[i].y-r[i-1].y);return n;}// navPath 는 칸 중심을 매끄럽게 다듬은 점 목록이라 점 개수≠걸음 수
const reach=k=>k==='crate'||k==='chest'?1.6:.6;// 상자는 막힌 칸이라 옆 칸까지(R108 상호작용 1.7 안)
function pick(){for(const c of candidates()){if(c.d<reach(c.kind))return {...c,path:[]};const r=pathTo({x:c.p.x,y:c.p.y});if(r&&r.length&&len(r)<=MAXLEN)return {...c,path:r};bad.add(String(c.p.id||''));stats.skipped++;}return null;}
function act(c){const p=c.p;try{if(c.kind==='chest'){if(G()?.openChest?.(p))stats.chests++;bad.add(String(p.id||''));}
  else if(c.kind==='crate'){if(typeof interact==='function')interact();stats.crates++;bad.add(String(p.id||''));}
  else{/* 구슬·쪽지는 밟으면 줍힌다 */if(c.kind==='orb')stats.orbs++;else stats.docs++;bad.add(String(p.id||''));}}catch(e){fail(e);}}
function step(){if(String(room.id)+':'+String(room.samongR103?.zone||'')!==badRoom){badRoom=String(room.id)+':'+String(room.samongR103?.zone||'');bad=new Set();cur=null;}
 if(enemyNear()){cur=null;return false;}
 if(cur){const still=(room.props||[]).includes(cur.p)||cur.kind==='doc';if(!still||T()>until){if(T()>until)bad.add(String(cur.p.id||''));cur=null;return false;}
  const d=Math.hypot(cur.p.x-player.x,cur.p.y-player.y);if(d<reach(cur.kind)){act(cur);cur=null;return false;}
  if(!(typeof route!=='undefined'&&route?.length)){const r=pathTo({x:cur.p.x,y:cur.p.y});if(r&&len(r)<.5&&d<2.3){act(cur);cur=null;return false;}/* 길 끝(상자 옆 빈 칸)에 닿았으면 그 자리에서 */if(r&&r.length){route=r.slice(1).map(v=>({x:v.x,y:v.y}));command=null;}else{bad.add(String(cur.p.id||''));cur=null;return false;}}return true;}
 if(T()<nextPick)return false;nextPick=T()+.5;/* 고르기(길 찾기)는 0.5초에 한 번만 */
 const c=pick();if(!c)return false;if(c.d<reach(c.kind)){act(c);return true;}cur=c;until=T()+WALK;stats.walks++;if(c.path.length){route=c.path.slice(1).map(v=>({x:v.x,y:v.y}));command=null;}return true;}
if(typeof guideStep==='function'){const base=guideStep;guideStep=function(...a){try{if(live()&&step())return;}catch(e){fail(e);}return base.apply(this,a);};}
function set(v){on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on}));}catch(_){}return on;}
window.__STORYWORLD_GUIDE_LOOT_R261__=Object.freeze({revision:REV,set,candidates:()=>live()?candidates().map(c=>({kind:c.kind,x:c.p.x,y:c.p.y,d:+c.d.toFixed(1)})):[],inspect:()=>({revision:REV,on,stats:{...stats},cur:cur&&{kind:cur.kind,x:cur.p.x,y:cur.p.y},lastError})});
})();

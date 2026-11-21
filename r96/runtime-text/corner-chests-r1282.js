/* R1282 구석 방 보물상자 — 사용자 2026-11-21 01:23Z "스토리모드 및 사몽에피소드 모든 맵 구석에 방같은곳에는 보물상자하나씩 배치해서
 *  스킬포인트 보다 쉽게 얻을 수 있게해줘 난이도 상관없이 맵탐험할 이유도 되도록".
 * - 막다른 방 찾기(순수 함수 deadEnds): 지도 방 그래프에서 이웃 하나뿐인 방 → 없으면 아래 바닥 모양 → 그래도 없으면(고리 지도) 입구에서 가장 먼 방 하나.
 *   바닥 모양: 바닥 칸(floorCells)에서 사방 8칸이 모두 바닥인 칸(안쪽)을 2×2 로 다듬어 '방 속'을 얻고,
 *   한 칸 넓혀 방을 만든다(폭 3칸 이하 복도는 방이 되지 않는다). 방 밖 바닥과 닿는 자리(입구)가 한 무리뿐인 방 = 막다른 방.
 *   입구·목표(보스·제단)·문 곁 방, 너무 작거나(16칸 미만) 너무 큰(700칸 초과) 방은 뺀다. 맵마다 많아야 7개.
 * - 상자 자리: 그 방 안쪽 칸 가운데 입구에서 가장 먼 곳(방 구석). 상자는 길을 막지 않는다(solid:false).
 * - 열기: 상호작용 키(E·C·모바일 버튼)·더블클릭(R1279, cursor-r780 이 '사용'으로 읽음). 열면 R1237 규칙대로 +1 구슬이 튕겨 나와 흩어지고
 *   걸어가 주우면 스킬(패시브) 포인트 +1 씩. 상자 하나에 구슬 3~5개(상자마다 정해짐, 평균 4) — 난이도·세계와 상관없이 같다.
 * - 저장: 구슬마다 R62 awardPointDrop claim id('r64:r1282chest:<층>:<맵>:<x>_<y>:<k>')로 한 번만 준다(R108·R1237 과 같은 길).
 *   구슬을 다 주운 상자는 다시 들어와도 열린 채로 있다. 열고 다 줍지 않고 나갔다면 남은 구슬만 다시 나온다.
 * - 제외: 무한생존(R600)·영화 모드 기록(R461)·쉼터(safe) 지역. 그림은 R712 보물상자(닫힘·열림) 그대로 — 새 도형을 그리지 않는다.
 * 끄기: localStorage 'storyworld.r1282.cornerChests' = '{"on":false}'. Canonical source; copied by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_CORNER_CHESTS_R1282__)return;
 const REV='R1282-corner-chests-1',KEY='storyworld.r1282.cornerChests';
 const ASSET=Object.freeze({closed:'assets/r712/chest-closed.png',open:'assets/r712/chest-open.png'}),HEIGHT=Object.freeze({closed:54,open:74});
 const MAX_PER_MAP=7,RANGE=1.9,ORB_MIN=3,ORB_SPAN=3,ROOM_MIN=16,ROOM_MAX=700,KEEP_OUT=3;
 const stats={placed:0,opened:0,orbs:0,direct:0,refused:0};let lastError=null;const fail=e=>{lastError=String(e?.stack||e).slice(0,300);};
 let prefs={on:true};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'&&v.on===false)prefs.on=false;}catch(_){}

 // ---- 순수: 막다른 방 ------------------------------------------------------------------------------
 const K=(x,y)=>x+','+y;
 function hashOf(s){s=String(s);let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 const N4=[[1,0],[-1,0],[0,1],[0,-1]],N8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 // 방 하나(칸 집합 own)의 입구 무리 수와 입구에서 가장 먼 안쪽 칸.
 function roomInfo(own,S,inner){const door=new Set();for(const k of own){const[x,y]=k.split(',').map(Number);for(const[dx,dy]of N4){const n=K(x+dx,y+dy);if(S.has(n)&&!own.has(n))door.add(n);}}
  let groups=0;const dseen=new Set();for(const k of door){if(dseen.has(k))continue;groups++;const q=[k];dseen.add(k);
   for(let i=0;i<q.length;i++){const[x,y]=q[i].split(',').map(Number);for(const[dx,dy]of N8){const n=K(x+dx,y+dy);if(door.has(n)&&!dseen.has(n)){dseen.add(n);q.push(n);}}}}
  const dist=new Map(),q=[];for(const k of door){const[x,y]=k.split(',').map(Number);for(const[dx,dy]of N4){const n=K(x+dx,y+dy);if(own.has(n)&&!dist.has(n)){dist.set(n,1);q.push(n);}}}
  for(let i=0;i<q.length;i++){const[x,y]=q[i].split(',').map(Number),d=dist.get(q[i]);for(const[dx,dy]of N4){const n=K(x+dx,y+dy);if(own.has(n)&&!dist.has(n)){dist.set(n,d+1);q.push(n);}}}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const k of own){const[x,y]=k.split(',').map(Number);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  const spots=[...own].filter(k=>inner.has(k)).map(k=>{const[x,y]=k.split(',').map(Number);return{x,y,d:dist.get(k)||0};}).sort((a,b)=>b.d-a.d||hashOf(K(a.x,a.y))-hashOf(K(b.x,b.y)));
  return{groups,box:[x0,y0,x1,y1],spots};}
 // 막다른 방: ① 지도에 방 그래프(nodes·edges)가 있으면 이웃이 하나뿐인 방(길목·보스실·앞방 닫힌 칸·다음 구역 문 방 빼고),
 //  ② 그래프가 없거나 그래프로 못 찾으면 바닥 모양으로 찾은 방(사방 r칸이 바닥인 '속'을 2×2 로 다듬고 r칸 넓힘) 가운데 입구 무리가 하나뿐인 방.
 function deadEnds(list,opt={}){
  const cells=(Array.isArray(list)?list:[]).filter(c=>Array.isArray(c)&&Number.isInteger(c[0])&&Number.isInteger(c[1]));
  const S=new Set(cells.map(c=>K(c[0],c[1]))),has=(x,y)=>S.has(K(x,y));if(S.size<ROOM_MIN)return[];
  const sq=(x,y,r)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(!has(x+dx,y+dy))return false;return true;};
  const inner=new Set();for(const[x,y]of cells)if(sq(x,y,1))inner.add(K(x,y));
  const avoid=(opt.avoid||[]).filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)),keep=Number.isFinite(opt.keepOut)?opt.keepOut:KEEP_OUT;
  const near=b=>avoid.some(p=>p.x>=b[0]-keep&&p.x<=b[2]+keep&&p.y>=b[1]-keep&&p.y<=b[3]+keep);
  const rooms=[];const nodes=Array.isArray(opt.nodes)?opt.nodes:[],edges=Array.isArray(opt.edges)?opt.edges:[];
  if(nodes.length&&edges.length){const deg=new Map();for(const e of edges){const a=Array.isArray(e)?e[0]:e?.from,b=Array.isArray(e)?e[1]:e?.to;if(a==null||b==null||a===b)continue;deg.set(a,(deg.get(a)||0)+1);deg.set(b,(deg.get(b)||0)+1);}
   for(const n of nodes){if(!n||(opt.anyNode?!(deg.get(n.id)>=1)||/전투실/.test(String(n.name||'')):deg.get(n.id)!==1)||n.bossCoreR78||n.closetR179||n.storyMapR171==='waypoint'||/다음 구역 문|입구/.test(String(n.name||''))||!Number.isFinite(n.x+n.y))continue;
    const w=Math.max(1,Number(n.width)||Number(n.radius)*2||3),d=Math.max(1,Number(n.depth)||Number(n.radius)*2||3),bx=Number.isFinite(n.x)?[Math.floor(n.x-w/2),Math.floor(n.y-d/2),Math.ceil(n.x+w/2),Math.ceil(n.y+d/2)]:null;
    const own=new Set();for(let y=bx[1];y<bx[3];y++)for(let x=bx[0];x<bx[2];x++)if(has(x,y))own.add(K(x,y));if(own.size<9)continue;rooms.push({own,node:n.id});}}
  else{const R=Number.isInteger(opt.radius)?opt.radius:3;const deep=new Set();for(const[x,y]of cells)if(sq(x,y,R))deep.add(K(x,y));const inD=(x,y)=>deep.has(K(x,y));
   const core=new Set();for(const k of deep){const[x,y]=k.split(',').map(Number);if([[0,0],[-1,0],[0,-1],[-1,-1]].some(([ox,oy])=>inD(x+ox,y+oy)&&inD(x+ox+1,y+oy)&&inD(x+ox,y+oy+1)&&inD(x+ox+1,y+oy+1)))core.add(k);}
   const roomCell=new Set();for(const k of core){const[x,y]=k.split(',').map(Number);for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)roomCell.add(K(x+dx,y+dy));}
   const seen=new Set();for(const k of roomCell){if(seen.has(k))continue;const own=new Set([k]),q=[k];seen.add(k);
    for(let i=0;i<q.length;i++){const[x,y]=q[i].split(',').map(Number);for(const[dx,dy]of N4){const n=K(x+dx,y+dy);if(roomCell.has(n)&&!seen.has(n)){seen.add(n);own.add(n);q.push(n);}}}
    if(own.size>=ROOM_MIN&&own.size<=(opt.maxCells||ROOM_MAX))rooms.push({own,node:null});}}
  const out=[];
  for(const r of rooms){const info=roomInfo(r.own,S,inner);if(r.node==null&&info.groups!==1)continue;if(!info.groups||(!opt.anyNode&&near(info.box)))continue;
   // 가장 먼 방 고르기(anyNode)에서는 방 전체가 아니라 상자 자리만 입구·목표·문에서 6칸 넘게 떨어지면 된다(보스 방의 먼 구석 등)
   let sp=info.spots.length?info.spots:[...r.own].map(k=>{const[x,y]=k.split(',').map(Number);return{x,y,d:0};});if(opt.anyNode)sp=sp.filter(q=>avoid.every(p=>Math.hypot(q.x+.5-p.x,q.y+.5-p.y)>6));if(!sp.length)continue;
   out.push({x:sp[0].x+.5,y:sp[0].y+.5,cells:r.own.size,depth:sp[0].d,box:info.box,node:r.node,spots:sp.slice(0,8).map(s=>({x:s.x+.5,y:s.y+.5}))});}
  // 그래프로 하나도 못 찾았으면(고리·바퀴살 지도) 바닥 모양으로 한 번 더
  if(!out.length&&nodes.length&&edges.length&&opt.fallback!==false&&!opt.anyNode){const g=deadEnds(cells,{...opt,nodes:null,edges:null});if(g.length)return g;
   // 그것도 없으면(막다른 곳 없는 고리 지도) 입구에서 가장 먼 방 하나 — 모든 맵에 탐험할 상자 하나는 둔다
   const e=opt.entry||avoid[0],far=deadEnds(cells,{...opt,anyNode:true,fallback:false,max:999});
   far.sort((a,b)=>e?Math.hypot(b.x-e.x,b.y-e.y)-Math.hypot(a.x-e.x,a.y-e.y):0);return far.slice(0,1).map(s=>({...s,far:true}));}
  // 많으면 깊은(입구에서 먼) 방부터 7개
  out.sort((a,b)=>b.depth-a.depth||a.box[1]-b.box[1]||a.box[0]-b.box[0]);
  return out.slice(0,Number.isInteger(opt.max)?opt.max:MAX_PER_MAP);}
 const orbCount=id=>ORB_MIN+hashOf(id)%ORB_SPAN;// 3~5
 const safeId=s=>String(s).replace(/[^A-Za-z0-9._:-]/g,'_').slice(0,180);
 const claimIds=id=>Array.from({length:orbCount(id)},(_,k)=>'r64:r1282chest:'+safeId(id)+':'+k);

 // ---- 게임 쪽 ---------------------------------------------------------------------------------------
 const P=()=>window.__STORYWORLD_PROGRESSION_R62__;
 function claimed(id){try{return !!P()?.state?.(player)?.pointDropClaimsR64?.[id];}catch(_){return false;}}
 const done=id=>claimIds(id).every(claimed);
 function mapKey(r){if(!r)return'';const z=typeof r.samongR103?.zone==='string'?r.samongR103.zone:'';return(r.layer||'STORY')+':'+(z||r.id||'room');}
 function applies(r){try{if(!prefs.on||!r||!Array.isArray(r.exploration?.floorCells)||!r.exploration.floorCells.length)return false;
   if(r.layer&&r.layer!=='STORY'&&r.layer!=='DREAM')return false;
   if(window.__STORYWORLD_SURVIVAL_R600__?.active?.()||r.survivalR600)return false;
   if(window.__STORYWORLD_CINEMA_RUN_R461__?.active?.())return false;
   if(!r.samongR103){const def=typeof regionById!=='undefined'?regionById?.[r.id]:null;if(!def||def.safe)return false;}
   return true;}catch(e){fail(e);return false;}}
 const layoutCache=new WeakMap();
 function avoidOf(r){const L=r.exploration||{},a=[L.entry,L.entrance,r.objective,r.altar,...(L.worldR74?.doors||[]),...(L.worldR78?.boss?[L.worldR78.boss]:[])];
  try{for(const p of r.props||[])if(p&&(p.r74Door||p.r75NPC||p.r75NarrativeNPC||p.chestR103||p.growthR103))a.push(p);}catch(_){}
  return a.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));}
 function spotsFor(r){const L=r.exploration;let c=layoutCache.get(L);if(c&&c.cells===L.floorCells)return c.list;
  const list=deadEnds(L.floorCells,{avoid:avoidOf(r),entry:L.entry||L.entrance,nodes:L.nodes,edges:L.edges});layoutCache.set(L,{cells:L.floorCells,list});return list;}
 function free(r,q){try{if(typeof blocked==='function')return !blocked(q.x,q.y,.5,r);}catch(_){return false;}return true;}
 function chestProp(id,at,open){return{id:'r1282chest:'+id,x:at.x,y:at.y,solid:false,visible:true,autoTargetEligible6:false,label:'보물상자',
  path:open?ASSET.open:ASSET.closed,height:open?HEIGHT.open:HEIGHT.closed,cornerChestR1282:{id,open:!!open,count:orbCount(id)}};}
 function place(r=typeof room!=='undefined'?room:null){try{if(!applies(r))return 0;if(r.r1282Placed===r.exploration)return 0;r.r1282Placed=r.exploration;
   const key=mapKey(r);let n=0;
   for(const s of spotsFor(r)){const at=[{x:s.x,y:s.y},...s.spots].find(q=>free(r,q));if(!at)continue;
    const id=key+':'+Math.floor(s.x)+'_'+Math.floor(s.y);if(r.props.some(p=>p?.cornerChestR1282?.id===id))continue;
    r.props.push(chestProp(id,at,done(id)));n++;}
   stats.placed+=n;return n;}catch(e){fail(e);return 0;}}
 function openChest(p){const c=p?.cornerChestR1282;if(!c||c.open)return false;
  const ids=claimIds(c.id).filter(id=>!claimed(id)),t0=typeof time==='number'?time:0,C=window.__STORYWORLD_CRATES_R108__;
  c.open=true;p.path=ASSET.open;p.height=HEIGHT.open;stats.opened++;
  if(ids.length){
   if(C?.scatterSpots&&typeof tick==='function'){const spots=C.scatterSpots({id:p.id,x:p.x,y:p.y},ids.length);
    ids.forEach((id,k)=>{room.props.push({id:'r108orb:'+id,x:p.x,y:p.y,path:'assets/vfx/v31315/spirit-orb.webp',height:30,solid:false,visible:true,autoTargetEligible6:false,
     r108Orb:{id,amount:1,at:t0+k*.04,from:{x:p.x,y:p.y},to:spots[k]||{x:p.x,y:p.y},box:'r1282chest:'+c.id,count:ids.length}});stats.orbs++;});
    try{room.r108CratesPruned=room.props;}catch(_){}}
   else{let got=0;for(const id of ids)if(P()?.awardPointDrop?.(1,id,player))got++;else stats.refused++;stats.direct+=got;try{updateHUD();saveGame(false);}catch(_){}}}
  try{if(typeof fx==='function'&&typeof VFX!=='undefined'&&VFX.cross)fx('sigil',p.x,p.y,{asset:VFX.cross,size:1.8,life:.8});}catch(_){}
  try{if(typeof sound==='function')sound('clear');}catch(_){}
  try{toast(ids.length?'보물상자 · 스킬 포인트 구슬 '+ids.length+'개':'이미 연 보물상자입니다.',2.4);}catch(_){}
  return true;}
 const live=()=>{try{return typeof started!=='undefined'&&started&&!modal&&!loading&&!!player&&player.hp>0&&!!room;}catch(_){return false;}};
 function nearChest(){let best=null,bd=RANGE;for(const p of room?.props||[]){if(!p?.cornerChestR1282||p.cornerChestR1282.open||p.visible===false)continue;const d=Math.hypot(p.x-player.x,p.y-player.y);if(d<=bd){bd=d;best=p;}}return best;}
 // 사몽 단서·문 같은 표식이 더 가까우면 그쪽이 먼저(R227 과 같은 까닭)
 function closerGoal(p){try{const d=Math.hypot(p.x-player.x,p.y-player.y);return(room?.props||[]).some(q=>q&&q!==p&&q.samongR103&&!q.growthR103&&q.samongR103!=='back'&&q.visible!==false&&Math.hypot(q.x-player.x,q.y-player.y)<Math.min(d,1.9));}catch(_){return false;}}
 function install(){
  if(typeof interact==='function'){const base=interact;interact=function(...a){try{if(live()){place();const c=nearChest();if(c&&!closerGoal(c)&&openChest(c))return;}}catch(e){fail(e);}return base.apply(this,a);};}
  if(typeof tick==='function'){const base=tick;let last=null;tick=function(...a){const r=base.apply(this,a);try{if(typeof room!=='undefined'&&room&&(room!==last||room.r1282Placed!==room.exploration)&&!loading){last=room;place(room);}}catch(e){fail(e);}return r;};}
  try{if(typeof addImage==='function'&&typeof readyImage==='function')for(const p of[ASSET.closed,ASSET.open])if(!readyImage(p))addImage(p,'R1282 보물상자');}catch(e){fail(e);}}
 try{install();}catch(e){fail(e);}
 function setPrefs(v){prefs.on=!(v&&v.on===false);try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 window.__STORYWORLD_CORNER_CHESTS_R1282__=Object.freeze({revision:REV,ASSET,MAX_PER_MAP,RANGE,deadEnds,orbCount,claimIds,mapKey,applies,place,openChest,set:setPrefs,prefs:()=>({...prefs}),
  inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},lastError,chests:(typeof room!=='undefined'&&room?.props||[]).filter(p=>p?.cornerChestR1282).map(p=>({id:p.cornerChestR1282.id,x:+p.x.toFixed(2),y:+p.y.toFixed(2),open:p.cornerChestR1282.open,count:p.cornerChestR1282.count}))})});
})();

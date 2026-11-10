/* R105: 드라이브 static4 정적 소품. dist02 검은 늪지대 — 얼굴을 닮은 수초와 물속에서 올라온 손
 * ([03 · dist02] "사람의 얼굴을 닮은 수초가 떠다녔고, 물속에서 올라온 손들이 발목을 붙잡았다."),
 * dist03 무너진 성 — 검은 소환 기둥 일곱과 끊어진 봉인 사슬([04 · dist03]).
 * 표현 전용 소품: 충돌·피해·잡기 판정이 없고 길을 막지 않는다. 손은 수면선 아래(손목·팔)를 잘라
 * 물결에 녹인 파생본(assets/r105/props/dist02-hands.webp)을 쓴다. 기둥은 원화 하나를 일곱 번 놓는다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_STATIC_PROPS_R105__)return;
 const REV='R105-static-props-1',DIR='assets/r105/props/';
 const ART={waterweed:{path:DIR+'dist02-waterweed.webp',height:126},hands:{path:DIR+'dist02-hands.webp',height:94},pillar:{path:DIR+'dist03-pillar.webp',height:252},chain:{path:DIR+'dist03-chain.webp',height:72}};
 // [소품, 개수, 자리] — water: 길 바로 바깥의 물, ring: 중앙 광장 둘레, path: 입구 근처 길가.
 // R446(사용자 2026-11-09 "무너진성 보스방에 일곱기둥이 나오는 버그를 일곱기둥맵에 나오게"): 기둥 일곱은 무너진 성(dist03)에서 빼고
 //  일곱 기둥(dist05) 소환진 둘레에 공격하는 고정형 적(아래 R446 절)으로 선다. 무너진 성에는 끊어진 봉인 사슬만 남는다.
 const PLAN={dist02:[['waterweed',6,'water'],['hands',5,'water']],dist03:[['chain',4,'path']]};
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};const stats={rooms:0,props:0,skipped:0};
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 const A=()=>window.StoryPhase1;
 const blockedAt=(L,x,y,s)=>{const a=A();return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):true;};
 function jitter(seed,x,y){return{x:x+((hash(seed+':'+x+':'+y)%100)/100-.5),y:y+((hash(y+':'+x+':'+seed)%100)/100-.5)};}
 function keep(pts,n,gap,avoid){pts.sort((a,b)=>a.k-b.k);const out=[];for(const p of pts){if(out.length>=n)break;if(avoid.some(q=>q&&Math.hypot(q.x-p.x,q.y-p.y)<(q.r||4)))continue;if(out.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<gap))continue;out.push(p);}return out;}
 function waterSpots(r,n,seed,avoid){const L=r.exploration,b=L?.bounds;if(!Array.isArray(b))return[];const pts=[];
  // 물가: 길(비차단) 위이되 1~2방향이 물(차단)인 자리. R81 계약(장식 소품은 차단 칸을 피한다)을 지키면서 물 바로 곁에 선다.
  for(let y=b[1]+1;y<b[3]-1;y+=1.5)for(let x=b[0]+1;x<b[2]-1;x+=1.5){const p=jitter(seed,x,y);if(blockedAt(L,p.x,p.y,.3))continue;let wet=0;for(const[dx,dy]of[[1.2,0],[-1.2,0],[0,1.2],[0,-1.2]])if(blockedAt(L,p.x+dx,p.y+dy,.2))wet++;if(wet<1||wet>2)continue;pts.push({...p,k:hash(seed+':'+p.x.toFixed(2)+p.y.toFixed(2))});}
  return keep(pts,n,3.6,avoid);}
 function ringSpots(r,n,seed,avoid){const L=r.exploration,c=L?.centralArena&&Number.isFinite(L.centralArena.x)?L.centralArena:(L?.nodes||[]).slice().sort((a,b)=>(b.radius||0)-(a.radius||0))[0]||r.objective;if(!c||!Number.isFinite(c.x+c.y))return[];
  const rad=Math.max(4,Math.min(8.5,(c.radius||8)-1.2)),pts=[];for(let i=0;i<n;i++){const a=i*Math.PI*2/n-Math.PI/2;let q=null;for(let d=rad;d>=2.5&&!q;d-=.7){const x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;if(!blockedAt(L,x,y,.5))q={x,y,k:i};}if(q)pts.push(q);}
  return pts.filter(p=>!avoid.some(q=>q&&Math.hypot(q.x-p.x,q.y-p.y)<(q.r||3)));}
 function pathSpots(r,n,seed,avoid){const L=r.exploration,e=L?.entry;if(!e||!Number.isFinite(e.x+e.y))return[];const pts=[];
  for(let d=2.5;d<=9;d+=.8)for(let a=0;a<Math.PI*2;a+=Math.PI/6){const x=e.x+Math.cos(a)*d,y=e.y+Math.sin(a)*d;if(blockedAt(L,x,y,.45))continue;let wall=0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(blockedAt(L,x+dx,y+dy,.2))wall++;if(wall<1)continue;pts.push({x,y,k:hash(seed+':'+x.toFixed(1)+y.toFixed(1))});}
  return keep(pts,n,2.6,avoid);}
 function dress(r){try{if(!r||!PLAN[r.id]||r.r105Static||r.exploration?.type==='r103-samong'||!r.exploration?.floorCells?.length)return r;
  const seed=r.id+':'+(r.layer||'STORY'),avoid=[r.exploration.entry&&{...r.exploration.entry,r:4.5},r.objective&&{...r.objective,r:3.5},...(r.props||[]).filter(p=>p?.r99Tree||p?.r80Dressing).map(p=>({x:p.x,y:p.y,r:2.4}))].filter(Boolean);
  const placed=[];for(const[kind,count,where]of PLAN[r.id]){const art=ART[kind];const spots=where==='water'?waterSpots(r,count,seed+kind,avoid):where==='ring'?ringSpots(r,count,seed,avoid):pathSpots(r,count,seed+kind,avoid);
   spots.forEach((p,i)=>{const q={id:'r105:static:'+r.id+':'+kind+':'+i,path:art.path,x:p.x,y:p.y,height:art.height*(kind==='pillar'?1:.9+((hash(seed+kind+i)%20)/100)),solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r105Static:kind};r.props.push(q);placed.push(q);avoid.push({x:p.x,y:p.y,r:2.2});});
   if(spots.length<count)stats.skipped+=count-spots.length;}
  if(typeof addImage==='function')for(const kind of new Set(placed.map(p=>p.r105Static)))try{addImage(ART[kind].path);}catch(e){fail(e);}
  r.r105Static={revision:REV,props:placed.map(p=>p.id)};stats.rooms++;stats.props+=placed.length;}catch(e){fail(e);}return r;}
 function install(){
  if(typeof makeRoom==='function'){const b=makeRoom;makeRoom=function(...a){const r=b.apply(this,a);try{dress(r);}catch(e){fail(e);}return r;};}
  if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){const out=await b.apply(this,a);try{if(out!==false&&typeof room!=='undefined')dress(room);}catch(e){fail(e);}return out;};}
  if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(...a){const out=await b.apply(this,a);try{if(out!==false)for(const r of new Set([...Object.values(typeof world==='object'&&world||{}),typeof room!=='undefined'?room:null]))dress(r);}catch(e){fail(e);}return out;};}
  try{for(const r of new Set([...Object.values(typeof world==='object'&&world||{}),typeof room!=='undefined'?room:null]))dress(r);}catch(e){fail(e);}}
 try{install();}catch(e){fail(e);}
 if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){try{if(p?.r105Static&&typeof readyImage==='function'&&!readyImage(p.path)&&!(typeof imageCache!=='undefined'&&imageCache.has(p.path)))addImage(p.path);}catch(e){fail(e);}return base.apply(this,[p,...a]);};}// 지역 재진입 뒤 그림 재요청
 // ---- R446: 일곱 기둥(dist05) — 검은 소환 기둥 일곱 = 움직이지 않고 공격하는 탑형 적 -----------------------------------
 //  같은 원화(dist03-pillar)를 소환진(중앙 광장) 둘레 고리에 일곱 번 세운다. 몸은 R170 '조형물 적'(e.r170Tower) 틀을 그대로 써서
 //  그림(drawTower)·체력 막대·공격(영웅 발밑 1.3초 예고 → 솟는 촉수)·다른 덧씌우기들의 탑 제외 규칙을 함께 받는다.
 //  일곱이 한꺼번에 치지 않게: 기둥마다 10초 간격, 기둥끼리 최소 3초 띄우고, 영웅이 8칸 안에 있을 때만 친다. 잡몹 소환은 하지 않는다.
 //  색은 원화의 갈라진 틈 불빛(검은 돌 + 잉걸불 주황). 저장에 들어가지 않으며 다시 들어오면 새로 선다(R170 탑과 같음).
 //  끄기: localStorage storyworld.r446.pillars = '0'.
 const P446={rev:'R446-seven-pillars-1',region:'dist05',name:'검은 소환 기둥',h:252,every:10,gap:3,range:8,
  pal:{main:{a:[40,8,4],b:[255,128,48]},sub:{a:[20,4,2],b:[220,60,24]}}};
 const s446={placed:0,casts:0,rooms:0};let last446=-99,at446=0;
 const on446=()=>{try{return localStorage.getItem('storyworld.r446.pillars')!=='0';}catch(_){return true;}};
 const T446=()=>typeof time==='number'?time:0;
 const major446=e=>!!(e?.boss||e?.midboss||e?.persona||e?.trial||e?.cosmic);
 const solo446=()=>{const m=window.__STORYWORLD_COOP_SIM_R62__?.mode?.();return !m||m==='off';};
 const pillars446=r=>(r?.enemies||[]).filter(e=>e&&e.r446Pillar!=null);
 // 문 둘레(문짝 선분에서 2.6칸)와 몸이 벽에 박히는 칸은 피한다. 각 기둥은 제 각도에서 반지름을 줄이거나 조금 비틀어 빈 자리를 찾는다.
 // 소환진 제단(objective/altar)에서 3.6칸, 문짝은 방향(axis)에 기대지 않고 가로·세로 두 선분 모두에서 2.6칸을 띄운다(문 앞을 막거나 문을 가리지 않게).
 const doorNear446=(r,x,y)=>[r.objective,r.altar].some(o=>o&&Number.isFinite(o.x+o.y)&&Math.hypot(o.x-x,o.y-y)<3.6)||(r.exploration?.worldR74?.doors||[]).some(d=>{const w=(Number(d.width)||4)/2,ax=Math.abs(x-d.x),ay=Math.abs(y-d.y);return Math.min(Math.hypot(ax,Math.max(0,ay-w)),Math.hypot(Math.max(0,ax-w),ay))<2.6;});
 function ring446(r){const L=r.exploration,c=L?.centralArena&&Number.isFinite(L.centralArena.x)?L.centralArena:r.objective;if(!c||!Number.isFinite(c.x+c.y))return[];
  const rad=Math.max(4,Math.min(8.5,(c.radius||8)-1.2)),out=[];
  for(let i=0;i<7;i++){const a0=i*Math.PI*2/7-Math.PI/2;let q=null;
   for(const da of [0,.12,-.12,.24,-.24,.36,-.36,.48,-.48]){for(let d=rad;d>=4.5&&!q;d-=.5){const a=a0+da,x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;
     if(blockedAt(L,x,y,.7)||doorNear446(r,x,y)||out.some(o=>Math.hypot(o.x-x,o.y-y)<2.4))continue;q={x,y};}if(q)break;}
   if(q)out.push(q);}
  // 문 쪽 각도가 비면 고리 위 남은 빈자리(기둥끼리 2.4칸 띄움)로 채워 늘 일곱을 세운다.
  //  남은 빈자리 가운데 다른 기둥과 가장 먼 곳(화면에서 겹쳐 보이지 않게 — 등각 화면 가로 = x−y 차이도 함께 본다)을 고른다.
  while(out.length<7){let best=null,bs=-1;for(let a=0;a<Math.PI*2;a+=.1)for(let d=rad;d>=4.5;d-=.5){const x=c.x+Math.cos(a)*d,y=c.y+Math.sin(a)*d;
    if(blockedAt(L,x,y,.7)||doorNear446(r,x,y)||out.some(o=>Math.hypot(o.x-x,o.y-y)<2.4))continue;
    const sc=Math.min(...out.map(o=>Math.hypot(o.x-x,o.y-y)+.5*Math.abs((o.x-o.y)-(x-y))));if(sc>bs){bs=sc;best={x,y};}}
   if(!best)break;out.push(best);}
  return out;}
 function place446(r){if(!r||r.id!==P446.region||r.samongR103||r.exploration?.type==='r103-samong'||!r.exploration?.floorCells?.length||!Array.isArray(r.enemies))return;
  if(r.r446Pillars===r.id||pillars446(r).length){r.r446Pillars=r.id;return;}
  const donor=r.enemies.find(e=>e&&e.hp>0&&!major446(e)&&!e.r170Tower);if(!donor)return;// 몹이 아직 안 섰으면 다음 틱에 다시
  const spots=ring446(r);if(spots.length<7)s446.short=(s446.short||0)+7-spots.length;
  let snap;try{snap=JSON.stringify(donor);}catch(_){return;}r.r446Pillars=r.id;
  spots.forEach((p,i)=>{let e;try{e=JSON.parse(snap);}catch(_){return;}
   Object.assign(e,{id:'r446:pillar:'+r.id+':'+i,x:p.x,y:p.y,homeX:p.x,homeY:p.y,nav:[],navAt:0,attack:null,rangedWindup:0,deadRecorded:false,spawnState:'active',
    r170Tower:{art:ART.pillar.path,h:P446.h,next:T446()+4+i*P446.gap,casts:0,summoned:12,snap:'{}',pal:P446.pal},r75Tower:true,r61PreserveHealth:true,r446Pillar:i,
    speed:0,ai:'melee',samongElite:false,samongSurvival:false,r162Lane:false,samongSubR170:false,name:P446.name,nameR446:P446.name});
   e.maxHp=e.hp=Math.round(Math.max(60,(Number(donor.maxHp)||60)*4));e.damage=(Number(donor.damage)||10);e.defScale=1;e.cd=99;
   r.enemies.push(e);s446.placed++;});
  s446.rooms++;if(typeof addImage==='function')try{addImage(ART.pillar.path);}catch(e){fail(e);}}
 function tick446(){const r=typeof room!=='undefined'?room:null;if(!r||r.id!==P446.region||typeof player!=='object'||!player)return;const now=T446();
  if(now>=at446||now<at446-5){at446=now+.7;if(on446()&&solo446())place446(r);}
  const live=pillars446(r).filter(e=>e.r170Tower&&e.hp>0);
  // ① 방금 친 기둥 알아채기: 그 기둥은 10초 쉬고, 마지막 공격 시각을 적는다.
  for(const e of live){const t=e.r170Tower;if(t.casts!==t.seen446){t.seen446=t.casts;if(t.casts>0){s446.casts++;last446=now;t.next=now+P446.every;}}}
  // ② 8칸 밖 기둥은 쉬게 하고, ③ R170 towerTick(이 틱 바로 뒤)는 때가 된 탑을 한 프레임에 모두 쏘므로 여기서 한 번에 하나만, 앞 공격과 3초 띄워 남긴다.
  let due=null;for(const e of live){const t=e.r170Tower;if(Math.hypot(player.x-e.x,player.y-e.y)>P446.range)t.next=Math.max(t.next,now+.5);if(now-last446<P446.gap)t.next=Math.max(t.next,last446+P446.gap);if(t.next<=now&&(!due||t.casts<due.r170Tower.casts||t.casts===due.r170Tower.casts&&t.next<due.r170Tower.next))due=e;}// 덜 친 기둥부터 — 일곱이 돌아가며 친다
  for(const e of live)if(e!==due&&e.r170Tower.next<=now)e.r170Tower.next=now+P446.gap;}
 if(typeof tick==='function'){const base=tick;tick=function(...a){const out=base.apply(this,a);try{tick446();}catch(e){fail(e);}return out;};}
 window.__STORYWORLD_SEVEN_PILLARS_R446__=Object.freeze({revision:P446.rev,config:P446,place:place446,inspect:()=>({revision:P446.rev,stats:{...s446},failures,lastError,pillars:pillars446(typeof room!=='undefined'?room:null).map(e=>({id:e.id,x:+e.x.toFixed(2),y:+e.y.toFixed(2),hp:e.hp,maxHp:e.maxHp,casts:e.r170Tower?.casts||0,next:e.r170Tower?.next}))})});
 window.__STORYWORLD_STATIC_PROPS_R105__=Object.freeze({revision:REV,art:ART,plan:PLAN,dress,inspect:()=>({revision:REV,failures,lastError,stats:{...stats},current:typeof room!=='undefined'?room?.r105Static||null:null})});
})();

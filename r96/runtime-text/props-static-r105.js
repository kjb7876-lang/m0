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
 const PLAN={dist02:[['waterweed',6,'water'],['hands',5,'water']],dist03:[['pillar',7,'ring'],['chain',4,'path']]};
 let failures=0,lastError=null;const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};const stats={rooms:0,props:0,skipped:0};
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 const A=()=>window.StoryPhase1;
 const blockedAt=(L,x,y,s)=>{const a=A();return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):true;};
 function jitter(seed,x,y){return{x:x+((hash(seed+':'+x+':'+y)%100)/100-.5),y:y+((hash(y+':'+x+':'+seed)%100)/100-.5)};}
 function keep(pts,n,gap,avoid){pts.sort((a,b)=>a.k-b.k);const out=[];for(const p of pts){if(out.length>=n)break;if(avoid.some(q=>q&&Math.hypot(q.x-p.x,q.y-p.y)<(q.r||4)))continue;if(out.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<gap))continue;out.push(p);}return out;}
 function waterSpots(r,n,seed,avoid){const L=r.exploration,b=L?.bounds;if(!Array.isArray(b))return[];const pts=[];
  for(let y=b[1]+1;y<b[3]-1;y+=1.5)for(let x=b[0]+1;x<b[2]-1;x+=1.5){const p=jitter(seed,x,y);if(!blockedAt(L,p.x,p.y,.55))continue;let near=0;for(const[dx,dy]of[[1.7,0],[-1.7,0],[0,1.7],[0,-1.7]])if(!blockedAt(L,p.x+dx,p.y+dy,.2))near++;if(near<1||near>2)continue;pts.push({...p,k:hash(seed+':'+p.x.toFixed(2)+p.y.toFixed(2))});}
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
 window.__STORYWORLD_STATIC_PROPS_R105__=Object.freeze({revision:REV,art:ART,plan:PLAN,dress,inspect:()=>({revision:REV,failures,lastError,stats:{...stats},current:typeof room!=='undefined'?room?.r105Static||null:null})});
})();

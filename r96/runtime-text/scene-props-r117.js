/* R117: 사몽 장면 소품 — Drive 2026-10-28 '적용본 · 게임 반영 전' 한 번 재생 4키(ASSET-READY)와 정적 1장.
 * 원고 순서로 구역을 짚었다: R-02 꽃잎(sz115-RA-4), R-03 의자(RB-1), R-07 수련·소등·흰 천(RD-1·RD-3), R-08 붓(RD-4),
 * R-16 기록장(RG-8), S-03 고리(S03-7), NS09 탄피(S06-16), 종장 종이컵·휴지(M-4).
 * 표현 전용 소품: 충돌·피해·잡기 없음, 길을 막지 않는다. 영웅이 가까이 오면 K1→K4를 한 번 재생하고 K4에서 멈춘다(되감기·반복 없음).
 * 재생 상태는 이번 실행 동안 기억한다. R99 나무처럼 그리기 직전에 p.path 를 바꿔 기존 소품 그림 경로를 그대로 쓴다.
 * Canonical source; copied to runtime-text by scripts/sync-r99.py. */
(()=>{'use strict';
 if(window.__STORYWORLD_SCENE_PROPS_R117__)return;
 const REV='R117-scene-props-1',IDX='./assets/r117/scene/index.json',STEP_MS=430,NEAR=3.4;
 // 구역 id -> [소품 id, 입구에서 떨어질 거리]
 const PLAN={'sz115-RA-4':[['r02-petal',7]],'sz115-RB-1':[['r03-chair',6.5]],'sz115-RD-1':[['r07-lotus',7]],'sz115-RD-3':[['r07-lamp',7],['r07-cloth',9.5]],
  'sz115-RD-4':[['r08-brush',6]],'sz115-RG-8':[['r16-page',7]],'sz115-S03-7':[['s03-ring',7]],'sz115-S06-16':[['ns09-casing',7]],'sz115-M-4':[['ep-cup',6],['ep-tissue',8.5]]};
 const tracks=new Map(),played=new Map();let failures=0,lastError=null,state='idle';const stats={rooms:0,props:0,skipped:0,plays:0};
 const fail=e=>{failures++;lastError=String(e?.stack||e).slice(0,300);};
 const hash=t=>{let h=2166136261;for(const c of String(t))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h||1;};
 const A=()=>window.StoryPhase1;
 const blockedAt=(L,x,y,s)=>{const a=A();return typeof a?.explorationBlocked==='function'?a.explorationBlocked(L,x,y,s):true;};
 const roomZone=r=>r?.exploration?.samongR115?.zone||null;
 function spot(r,seed,want,used){const L=r.exploration,e=L?.entry,cells=L?.floorCells;if(!e||!Array.isArray(cells)||!cells.length)return null;
  const avoid=[e&&{...e,r:3.5},L.samongR103?.exit&&{...L.samongR103.exit,r:4},L.samongR103?.dais&&{...L.samongR103.dais,r:5},r.objective&&{...r.objective,r:3.5},...used.map(q=>({...q,r:3})),
   ...(r.props||[]).filter(p=>p&&Number.isFinite(p.x+p.y)).map(p=>({x:p.x,y:p.y,r:p.samongR103||p.r115Clue?2.6:1.9}))].filter(Boolean);
  let best=null,bk=1e9;
  for(const c of cells){const x=c[0]+.5,y=c[1]+.5;if(avoid.some(q=>Math.hypot(q.x-x,q.y-y)<q.r))continue;if(blockedAt(L,x,y,.5))continue;
   let open=0;for(const[dx,dy]of[[1.3,0],[-1.3,0],[0,1.3],[0,-1.3],[1.3,1.3],[2.4,2.4],[2.4,0],[0,2.4]])if(!blockedAt(L,x+dx,y+dy,.4))open++;if(open<8)continue;// 카메라 쪽(+x,+y)이 열린 자리만: 벽 윗면에 가려지지 않게
   const k=Math.abs(Math.hypot(x-e.x,y-e.y)-want)+(hash(seed+':'+c[0]+':'+c[1])%100)/60;if(k<bk){bk=k;best={x,y};}}
  return best;}
 function dress(r){try{const z=roomZone(r),plan=z&&PLAN[z];if(!plan||r.r117Scene||!tracks.size)return r;
  const placed=[],used=[];for(const[tid,want]of plan){const t=tracks.get(tid);if(!t){stats.skipped++;continue;}
   const p=spot(r,z+':'+tid,want,used);if(!p){stats.skipped++;continue;}used.push(p);
   const id='r117:scene:'+z+':'+tid,q={id,path:t.files[0].path,x:p.x,y:p.y,height:t.height,solid:false,visible:true,enabled:true,autoTargetEligible6:false,r80PresentationOnly:true,r117Scene:{track:tid,frames:t.files.map(f=>f.path)}};
   r.props.push(q);placed.push(id);if(typeof addImage==='function')for(const f of t.files)try{addImage(f.path);}catch(e){fail(e);}}
  r.r117Scene={revision:REV,zone:z,props:placed};stats.rooms++;stats.props+=placed.length;}catch(e){fail(e);}return r;}
 function drawWrap(base){return function(p,...a){const s=p?.r117Scene;if(s){try{const n=s.frames.length;let i=0;
   if(n>1){let st=played.get(p.id);if(!st&&typeof player!=='undefined'&&player&&Math.hypot(player.x-p.x,player.y-p.y)<NEAR){st={t0:performance.now()};played.set(p.id,st);stats.plays++;}
    if(st)i=Math.min(n-1,Math.floor((performance.now()-st.t0)/STEP_MS));}
   p.path=s.frames[i];if(typeof readyImage==='function'&&!readyImage(p.path)&&typeof addImage==='function')addImage(p.path);}catch(e){fail(e);}}
  return base.apply(this,[p,...a]);};}
 async function load(){state='loading';try{const r=await fetch(IDX,{cache:'force-cache'});if(!r.ok)throw new Error('index '+r.status);const j=await r.json();
  for(const t of j.tracks||[])tracks.set(t.id,t);state='ready';try{if(typeof room!=='undefined')dress(room);}catch(e){fail(e);}}catch(e){state='failed';fail(e);}}
 function install(){
  if(typeof drawProp==='function')drawProp=drawWrap(drawProp);
  if(typeof enterRegion==='function'){const b=enterRegion;enterRegion=async function(...a){const out=await b.apply(this,a);try{if(out!==false&&typeof room!=='undefined')dress(room);}catch(e){fail(e);}return out;};}
  if(typeof restoreSave==='function'){const b=restoreSave;restoreSave=async function(...a){const out=await b.apply(this,a);try{if(out!==false&&typeof room!=='undefined')dress(room);}catch(e){fail(e);}return out;};}
  load();}
 try{install();}catch(e){fail(e);}
 window.__STORYWORLD_SCENE_PROPS_R117__=Object.freeze({revision:REV,plan:PLAN,dress,trackFor:id=>tracks.get(id)||null,played:()=>[...played.keys()],
  inspect:()=>({revision:REV,state,tracks:tracks.size,stats:{...stats},failures,lastError,room:typeof room!=='undefined'?room?.r117Scene||null:null})});
})();

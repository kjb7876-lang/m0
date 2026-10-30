/* R92 environment dressing. Presentation only: processed copies of the R92
 * generated floor decals and standing light props (assets/r92). Placement is a
 * deterministic visual plan per zone; it never enters room data, collision,
 * hazards, route finding, progression or saves. Lit props feed the R90 local
 * light pool through lightPoints(). Canonical source; copied by apply-r92.cjs. */
(()=>{'use strict';
 const A=window.StoryPhase1,CS=A?.CommandScene?.prototype;
 if(!CS||window.__STORYWORLD_VISUAL_R92__)return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r92.presentation';
 const DEFAULTS=Object.freeze({floorDecals:true,lightProps:true});
 const LABELS={floorDecals:'바닥 데칼',lightProps:'광원 소품'};
 // Counts follow floor area (about 5 decals and 1-2 lamps per screen at default zoom).
 const INDEX='./assets/r92/index.json',DECAL_CELLS=80,DECAL_GAP=3.2,LIGHT_CELLS=320,LIGHT_GAP=7;
 const quota=(cells,per,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(cells/per)));
 let prefs={...DEFAULTS},index=null,state='idle',lastError=null,plan=null,planKey=null,preloadAt=0;
 const stats={plans:0,decalDraws:0,propDraws:0,dimmedFrames:0,preloads:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}return{...prefs};}
 function load(){if(state!=='idle')return;state='loading';
  fetch(INDEX,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('R92 index '+r.status);return r.json();}).then(j=>{index=j;state='ready';}).catch(e=>{state='failed';fail(e);});}
 const story=()=>(typeof layer==='undefined'||layer==='STORY')&&(window.__STORYWORLD_COOP_SIM_R62__?.mode?.()||'off')==='off';
 function family(r){const L=r?.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||(zone==='ep1a08'?'clinical':null)||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family||'regional';}
 function region(r){const f=family(r);for(const[k,list]of Object.entries(index.families))if(list.includes(f))return k;return'regional';}
 function segment(p,a,b){const x=b.x-a.x,y=b.y-a.y,n=x*x+y*y,t=n?Math.max(0,Math.min(1,((p.x-a.x)*x+(p.y-a.y)*y)/n)):0;return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t);}
 function wallDistance(p,w){if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const[a,b]=w.endpoints;return Math.max(0,segment(p,{x:a[0],y:a[1]},{x:b[0],y:b[1]})-(w.depth||.24)/2);}
  if(!finite(w)||!Number.isFinite(w.width+w.depth))return Infinity;return Math.hypot(Math.max(0,Math.abs(p.x-w.x)-w.width/2),Math.max(0,Math.abs(p.y-w.y)-w.depth/2));}
 // Authored points that must stay readable: R90's protection list (entries,
 // portals, guidance marks, props, markers) plus door openings.
 function guards(r){const g=window.__STORYWORLD_DECALS_R90__?.protections?.(r,zone,false)||{points:[],doors:[]},L=r.exploration;
  return{points:g.points||[],doors:g.doors||L?.hospitalDoorsB3||L?.worldR74?.doors||[]};}
 // R90 sizes its radii for blood (portals 7.8); dressing only needs the mark itself kept clear.
 const GUARD_MAX=3.4;
 function clear(p,radius,g,r){if(g.points.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<Math.min(q.radius,GUARD_MAX)+radius))return false;
  for(const d of g.doors){if(!finite(d))continue;const dx=Math.max(0,Math.abs(p.x-d.x)-(d.width||0)/2),dy=Math.max(0,Math.abs(p.y-d.y)-(d.depth||0)/2);if(Math.hypot(dx,dy)<2.6+radius)return false;}
  return typeof A.explorationBlocked!=='function'||!A.explorationBlocked(r.exploration,p.x,p.y,radius);}
 function build(r){const L=r?.exploration;if(!L?.floorCells?.length||!L.walls?.length||!index)return{decals:[],lights:[]};
  const reg=region(r),g=guards(r),floors=index.items.filter(i=>i.kind==='floor'&&i.region===reg);let lamps=index.items.filter(i=>i.kind==='light'&&i.region===reg);
  // R102: the lamp kinds follow the region's story (Eastern lamps only in Eastern scenes).
  try{const pick=window.__STORYWORLD_PROPS_R102__?.lamps?.(zone,reg,index.items,lamps,family(r));if(Array.isArray(pick)&&pick.length)lamps=pick;}catch(e){fail(e);}
  // Standing sprites are not hidden by a wall mass in front of them (camera
  // side, +x+y) and would read as standing on its roof; keep them where the
  // floor in front is open (R93).
  const F=new Set(L.floorCells.map(([x,y])=>x+','+y)),onFloor=(x,y)=>F.has(Math.floor(x)+','+Math.floor(y));
  const openAhead=p=>{for(const s of[.5,1,1.5,2,2.5])for(const o of[-.5,0,.5])if(!onFloor(p.x+s+o,p.y+s-o))return false;return true;};
  const cells=L.floorCells.map(([x,y])=>({x:x+.5,y:y+.5,seed:hash('r92:'+zone+':'+x+':'+y)})).sort((a,b)=>a.seed-b.seed||a.y-b.y||a.x-b.x);
  const decals=[],lights=[],DECALS=quota(cells.length,DECAL_CELLS,8,110),LIGHTS=quota(cells.length,LIGHT_CELLS,3,26);
  // R155: 바닥 칸마다 모든 벽과 거리를 재던 것(칸 수 x 벽 수)을, 벽마다 '2칸 안' 범위의 격자 칸에만 넣어 두고 그 칸의 벽만 잰다.
  //  2칸 안 벽은 빠짐없이 찾고 같은 순서(벽 번호 순, 같으면 먼저 것)로 고르므로 2칸 안 결과는 그대로이고, 그보다 먼 결과는
  //  아래 쓰임(1.8·1.25·0.45 문턱)에서 똑같이 '멀다'로 판정된다. window.__STORYWORLD_R155_NOGRID__ 이면 옛 방식.
  const NEAR=2,grid=new Map();if(!window.__STORYWORLD_R155_NOGRID__)L.walls.forEach((w,i)=>{let x0,x1,y0,y1;
   if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const[a,b]=w.endpoints,m=NEAR+(w.depth||.24)/2;x0=Math.min(a[0],b[0])-m;x1=Math.max(a[0],b[0])+m;y0=Math.min(a[1],b[1])-m;y1=Math.max(a[1],b[1])+m;}
   else if(finite(w)&&Number.isFinite(w.width+w.depth)){x0=w.x-w.width/2-NEAR;x1=w.x+w.width/2+NEAR;y0=w.y-w.depth/2-NEAR;y1=w.y+w.depth/2+NEAR;}else return;
   if(![x0,x1,y0,y1].every(Number.isFinite)||(x1-x0)*(y1-y0)>40000)return grid.set('all',[...(grid.get('all')||[]),i]);
   for(let gx=Math.floor(x0);gx<=Math.floor(x1);gx++)for(let gy=Math.floor(y0);gy<=Math.floor(y1);gy++){const k=gx+','+gy;let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(i);}});
  const nearCache=new Map(),near=p=>{const k=p.x+','+p.y;let n=nearCache.get(k);if(n)return n;n={d:Infinity,x:p.x,y:p.y};
   if(window.__STORYWORLD_R155_NOGRID__){for(const w of L.walls){const c=closest(p,w);if(c&&c.d<n.d)n=c;}}
   else{const own=grid.get(Math.floor(p.x)+','+Math.floor(p.y))||[],far=grid.get('all'),ids=far?[...new Set([...own,...far])].sort((a,b)=>a-b):own;for(const i of ids){const c=closest(p,L.walls[i]);if(c&&c.d<n.d)n=c;}}
   nearCache.set(k,n);return n;};
  // Stains gather along wall feet and corners; only a few lie in open floor (R94).
  for(const c of cells){if(decals.length>=DECALS||!floors.length)break;const p={x:c.x+((c.seed>>>4)%100)/200-.25,y:c.y+((c.seed>>>12)%100)/200-.25};
   if(near(c).d>1.8&&(c.seed>>>24)%10>=3)continue;
   if(decals.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<DECAL_GAP)||!clear(p,.9,g,r))continue;
   decals.push({...p,item:floors[c.seed%floors.length].id,scale:.85+((c.seed>>>20)%40)/100,flip:(c.seed>>>27)&1});}
  // Lamps (R94): one or two lamp kinds per zone so a place reads as one set;
  // they stand against back walls (the wall faces the camera, upper side on
  // screen), first in pairs flanking portals, entries, objectives and doors,
  // then at a steady rhythm along the remaining back walls. Each lamp is
  // mirrored to the side of its wall.
  if(lamps.length){const zs=hash('r94:'+zone),set=[...new Set([lamps[zs%lamps.length],lamps[(zs>>>7)%lamps.length]])];
   const spot=c=>{const p={x:c.x,y:c.y},n=near(p);if(n.d<.45||n.d>1.25)return null;if(!openAhead(p)||!clear(p,.45,g,r))return null;
    return{...p,seed:c.seed,back:(n.x-p.x)+(n.y-p.y)<=-.05,flip:((n.x-p.x)-(n.y-p.y))>0};};
   // Anchor pairs may use any wall (entries sit on the lower map edge); the
   // corridor rhythm keeps to back walls only.
   const all=cells.map(spot).filter(Boolean),spots=all.filter(s=>s.back),free=p=>!lights.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<3);
   const put=(s,kind)=>{const it=set[lights.length%set.length];lights.push({x:s.x,y:s.y,item:it.id,color:it.color,flip:s.flip,role:kind});};
   const anchors=[...g.points.filter(q=>/portal|entry|exit|gate|objective|boss|altar|marker/i.test(String(q.kind||q.id||''))),...g.doors.filter(finite)];
   for(const a of anchors){if(lights.length>=LIGHTS)break;const ring=all.filter(s=>{const d=Math.hypot(s.x-a.x,s.y-a.y);return d>=2&&d<=6.5&&free(s);}).sort((s,t)=>Math.abs(Math.hypot(s.x-a.x,s.y-a.y)-4.6)-Math.abs(Math.hypot(t.x-a.x,t.y-a.y)-4.6));
    const first=ring[0];if(!first)continue;put(first,'anchor');
    const v1=Math.atan2(first.y-a.y,first.x-a.x),second=ring.find(s=>s!==first&&free(s)&&Math.abs(((Math.atan2(s.y-a.y,s.x-a.x)-v1+3*Math.PI)%(2*Math.PI))-Math.PI)<Math.PI*.45);
    if(second&&lights.length<LIGHTS)put(second,'anchor');}
   for(const s of [...spots].sort((s,t)=>s.y-t.y||s.x-t.x)){if(lights.length>=LIGHTS)break;if(lights.some(q=>Math.hypot(s.x-q.x,s.y-q.y)<LIGHT_GAP+1))continue;put(s,'rhythm');}}
  stats.plans++;return{decals,lights};}
 // Closest point of a wall (segment with depth, or box) to p.
 function closest(p,w){if(Array.isArray(w.endpoints)&&w.endpoints.length===2){const[a,b]=w.endpoints,x=b[0]-a[0],y=b[1]-a[1],n=x*x+y*y,t=n?Math.max(0,Math.min(1,((p.x-a[0])*x+(p.y-a[1])*y)/n)):0,cx=a[0]+x*t,cy=a[1]+y*t;
   return{d:Math.max(0,Math.hypot(p.x-cx,p.y-cy)-(w.depth||.24)/2),x:cx,y:cy};}
  if(!finite(w)||!Number.isFinite(w.width+w.depth))return null;const cx=Math.max(w.x-w.width/2,Math.min(w.x+w.width/2,p.x)),cy=Math.max(w.y-w.depth/2,Math.min(w.y+w.depth/2,p.y));return{d:Math.hypot(p.x-cx,p.y-cy),x:cx,y:cy};}
 function current(){if(!index||typeof room==='undefined'||!room)return null;const key=room;
  if(planKey!==key||plan?.zone!==zone||plan?.layout!==room.exploration){plan={...build(room),zone,layout:room.exploration};planKey=key;}return plan;}
 const byId=id=>index.items.find(i=>i.id===id);
 function image(it){const row=typeof readyImage==='function'?readyImage(it.path):null;return row?.image||null;}
 // The native image cache is purged after region entry; re-request missing rows.
 function preload(p){const now=performance.now();if(now-preloadAt<2000||typeof addImage!=='function'||typeof readyImage!=='function')return;preloadAt=now;
  for(const id of new Set([...p.decals.map(d=>d.item),...p.lights.map(l=>l.item)])){const it=byId(id);if(it&&!readyImage(it.path)){addImage(it.path,'R92 generated environment');stats.preloads++;}}}
 function inView(q,m=220){const vw=typeof W==='number'?W:innerWidth,vh=typeof H==='number'?H:innerHeight;return q.x>-m&&q.y>-m&&q.x<vw+m&&q.y<vh+m;}
 function sightOk(p){const s=window.__STORYWORLD_SIGHT24__;return !s?.enabled||s.pointVisible(p.x,p.y);}
 function drawDecals(){load();if(!prefs.floorDecals||!story()||typeof ctx==='undefined'||typeof project!=='function')return;const p=current();if(!p)return;preload(p);
  const warn=window.__STORYWORLD_DECALS_R90__?.warnings?.()?.45:1;if(warn<1)stats.dimmedFrames++;const body=typeof actorHeight==='function'?actorHeight():66;
  p.decals.forEach((d,i)=>{if(!sightOk(d))return;const q=project(d.x,d.y);if(!inView(q))return;const it=byId(d.item),img=it&&image(it);if(!img)return;
   const w=body*2.0*d.scale*(it.w/230),h=w*it.h/it.w;
   const paint=()=>{ctx.save();try{ctx.globalAlpha*=.82*warn;ctx.filter='brightness(.86) saturate(.85)';if(d.flip){ctx.translate(q.x,q.y);ctx.scale(-1,1);ctx.translate(-q.x,-q.y);}
    ctx.drawImage(img,0,0,img.naturalWidth||img.width,img.naturalHeight||img.height,q.x-w/2,q.y-h/2,w,h);stats.decalDraws++;}finally{ctx.restore();}};
   if(typeof ctx.scope==='function')ctx.scope({id:'r92:floor:'+zone+':'+i,kind:'ground',x:d.x,y:d.y,groundAligned:true,r92Floor:true,presentationOnly:true,alive:false,sourcePath:it.path},paint);else paint();});}
 function drawLights(){if(!prefs.lightProps||!story()||typeof ctx==='undefined'||typeof project!=='function')return;const p=current();if(!p)return;preload(p);const body=typeof actorHeight==='function'?actorHeight():66;
  p.lights.forEach((l,i)=>{if(!sightOk(l))return;const q=project(l.x,l.y);if(!inView(q))return;const it=byId(l.item),img=it&&image(it);if(!img)return;
   const k=body*1.3/200,w=it.w*k,h=it.h*k;
   const paint=()=>{if(typeof shadow==='function')shadow(q.x,q.y,Math.max(10,w*.45));ctx.save();try{if(l.flip){ctx.translate(q.x,q.y);ctx.scale(-1,1);ctx.translate(-q.x,-q.y);}ctx.drawImage(img,0,0,img.naturalWidth||img.width,img.naturalHeight||img.height,q.x-w/2,q.y-h+2,w,h);stats.propDraws++;}finally{ctx.restore();}};
   if(typeof ctx.scope==='function')ctx.scope({id:'r92:light:'+zone+':'+i,kind:'prop',x:l.x,y:l.y,alive:true,presentationOnly:true,r92Light:true,sourcePath:it.path},paint);else paint();});}
 if(typeof groundImage==='function'){const base=groundImage;groundImage=function(...args){const result=base.apply(this,args);try{drawDecals();}catch(e){fail(e);}return result;};}
 // Props are drawn once per frame alongside the native hero pass; the command
 // scene orders them by their own world position, like native props.
 if(typeof drawHero==='function'){const base=drawHero;drawHero=function(...args){const result=base.apply(this,args);try{drawLights();}catch(e){fail(e);}return result;};}
 const policy=CS.applySpatialPolicy;
 CS.applySpatialPolicy=function(row,command,...args){const result=policy.call(this,row,command,...args);if(command?.owner?.r92Floor&&row?.mesh){const m=row.mesh.material;row.mesh.layers.set(2);row.mesh.renderOrder=-1196;m.depthTest=true;m.depthWrite=false;m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-2;}return result;};
 const C=A.ThreeRenderer?.prototype,clearBase=C?.clearScene;if(clearBase)C.clearScene=function(...args){plan=null;planKey=null;return clearBase.apply(this,args);};
 function settingsSection(){const host=document.getElementById('retroSettingsR91')||document.getElementById('retroSettingsR90');if(!host||document.getElementById('retroSettingsR92'))return;
  const s=document.createElement('section');s.id='retroSettingsR92';s.innerHTML='<h3>환경 자산 (R92)</h3><p class="small muted">표현 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r92-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r92-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const base=showSettings;showSettings=function(...args){const result=base.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}
 window.__STORYWORLD_VISUAL_R92__=Object.freeze({prefs:()=>({...prefs}),set,storageKey:KEY,
  lightPoints:()=>prefs.lightProps&&story()&&plan&&plan.zone===zone?plan.lights.map(l=>({id:'r92:'+l.item,x:l.x,y:l.y,color:l.color})):[],
  plan:()=>plan?{zone:plan.zone,decals:plan.decals.map(d=>({...d})),lights:plan.lights.map(l=>({...l}))}:null,
  inspect:()=>({revision:'R92-environment',prefs:{...prefs},index:state,items:index?.items?.length||0,decals:plan?.decals?.length||0,lights:plan?.lights?.length||0,stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,saveSlotsChanged:false})});
})();

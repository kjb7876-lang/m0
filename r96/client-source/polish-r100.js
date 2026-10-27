/* R100 polish. Presentation only: native AI, combat clocks, collision,
 * progression and saves are read, never written.
 *  - Root bind: the whole thorn cage, translucent over the hero, wherever the
 *    R96 split overlay does not own it (touch devices, low effects).
 *  - Signature colours: each enemy's art carries a measured colour
 *    (polish-r100-data.js); R98 skill effects read it through colourOf().
 *  - Facing: mobs whose art faces left or right turn toward the hero while
 *    engaged and toward their travel otherwise. Winged art hovers and beats.
 *  - Navigation: a compass and a ground trail toward the current goal replace
 *    the nearest-enemy arrow.
 *  - Touch: dodge / skill / EGO buttons, a closer default camera and a softer
 *    sight mask for portrait phones.
 *  - Outdoor: a moss or rock cap over the low hedge walls (the strip between
 *    two wall panels used to read as an empty trough).
 *  - Ambience: per-family drifting particles and a light vignette.
 * Canonical source. */
(()=>{'use strict';
 const D=window.__STORYWORLD_POLISH_R100_DATA__,A=window.StoryPhase1,C=A?.ThreeRenderer?.prototype;
 if(!D||window.__STORYWORLD_POLISH_R100__||typeof drawEnemy!=='function'||typeof drawHero!=='function'||typeof project!=='function'||typeof draw!=='function')return;
 const KEY=(window.__STORYWORLD_TEST_STORAGE_B1__?.prefix||'storyworld.hospital-three-pc.maze.v11:')+'r100.polish';
 const DEFAULTS=Object.freeze({root:true,signature:true,facing:true,flyers:true,nav:true,touch:true,walls:true,ambience:true});
 const LABELS={root:'뿌리속박 전체를 반투명하게',signature:'몹·보스 고유색 스킬 이펙트',facing:'잡몹이 플레이어를 바라봄',flyers:'날개 달린 몹의 비행·날갯짓',nav:'길안내 나침반·바닥 화살표 (적 방향 화살표 대신)',touch:'모바일 회피·기술·EGO 버튼',walls:'야외 벽 윗면 덮개·장식',ambience:'지역 분위기 입자·가장자리 그늘'};
 let prefs={...DEFAULTS},lastError=null;
 const stats={rootDraws:0,flips:0,flaps:0,navPaths:0,navCells:0,navDraws:0,caps:0,softMasks:0,particles:0,touches:0,errors:0};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');for(const k of Object.keys(DEFAULTS))if(typeof saved?.[k]==='boolean')prefs[k]=saved[k];}catch(_){}
 const fail=e=>{stats.errors++;lastError=String(e?.stack||e);};
 function set(patch={}){for(const k of Object.keys(DEFAULTS))if(typeof patch[k]==='boolean')prefs[k]=patch[k];try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}apply();return{...prefs};}
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),finite=Number.isFinite,TAU=Math.PI*2;
 const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
 const coarse=()=>!!window.matchMedia?.('(pointer:coarse)').matches;
 const lowFx=()=>!!(typeof settings!=='undefined'&&settings?.lowFx);
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 const live=()=>typeof started!=='undefined'&&started&&!loading&&!!room&&!!player;
 function scope(owner,fn){if(typeof ctx?.scope==='function')return ctx.scope(owner,fn);return fn();}
 function image(path,role){const row=typeof readyImage==='function'?readyImage(path):null;if(row?.image)return row.image;if(typeof addImage==='function')try{addImage(path,role);}catch(_){}return null;}

 // ---- enemy art table ---------------------------------------------------------
 // Keyed by the idle frame (path, or path#rect for atlas cells) and remembered
 // per enemy before R92 lends its move/attack strips for the draw.
 const known=new WeakMap();
 function artOf(e){if(!e)return null;if(known.has(e))return known.get(e);let row=null;
  if(e.r74Monster)row=D.art['r74:'+e.r74Monster]||null;
  else{const f=e.profile?.frames?.idle,path=f?.path||e.path,rect=f?.assetFrame?.sourceRect;row=(Array.isArray(rect)&&D.art[path+'#'+rect.join(',')])||D.art[path]||null;}
  known.set(e,row);return row;}
 const colourOf=e=>prefs.signature&&e?artOf(e)?.c||null:null;

 // ---- root bind -----------------------------------------------------------------
 const ROOT=D.root,ROOT_PATH='assets/r100/root-full.webp',VEIL=.8,root={on:false,start:0,off:-1,scene:null};
 function rooted(){const until=r=>finite(r?.until)?r.until:finite(r?.remaining)?time+r.remaining:-1;
  const b=window.__STORYWORLD_PAINTED_VFX_R87__?.inspect?.().binding;if(b&&until(b)>time)return true;
  for(const api of[window.__STORYWORLD_FIELDS_R61__,window.__STORYWORLD_REGIONAL_COMBAT_R58__,window.__STORYWORLD_HOSPITAL_WOUNDS_R53__])
   for(const r of api?.statusRows?.()||[])if((r.key==='bind'||r.key==='속박'||r.label==='속박')&&until(r)>time)return true;
  return false;}
 function rootFrame(){const s=ROOT.seconds,c=ROOT.clips;
  if(root.on){let t=time-root.start;for(const i of[...c.emerge.frames,...c.bind.frames]){if(t<s[i])return i;t-=s[i];}const hold=c.hold.frames,cycle=hold.reduce((n,i)=>n+s[i],0);t%=cycle;for(const i of hold){if(t<s[i])return i;t-=s[i];}return hold[0];}
  if(root.off>=0){let t=time-root.off;for(const i of c.release.frames){if(t<s[i])return i;t-=s[i];}}
  return -1;}
 function drawRoot(){
  if(root.scene!==room||time<root.start){root.scene=room;root.on=false;root.off=-1;}
  const on=player.hp>0&&rooted();if(on&&!root.on){root.on=true;root.start=time;root.off=-1;}else if(!on&&root.on){root.on=false;root.off=time;}
  if(!prefs.root||player.hp<=0||player.visible===false||window.__STORYWORLD_STATUS_R96__?.ownsBinding?.())return;
  const i=rootFrame();if(i<0)return;const im=image(ROOT_PATH,'R100 root bind');if(!im)return;
  const q=project(player.x,player.y),dh=actorHeight()*2/ROOT.canvasHeight,dw=dh*ROOT.w/ROOT.h,sx=(i%ROOT.cols)*ROOT.w,sy=Math.floor(i/ROOT.cols)*ROOT.h;
  scope({id:'r100:root',kind:'effect',x:player.x,y:player.y},()=>{ctx.save();try{ctx.globalAlpha*=VEIL;ctx.drawImage(im,sx,sy,ROOT.w,ROOT.h,q.x-ROOT.pivot[0]*dw,q.y-ROOT.pivot[1]*dh,dw,dh);}finally{ctx.restore();}});stats.rootDraws++;}
 const heroBase=drawHero;drawHero=function(...args){const result=heroBase.apply(this,args);try{if(live())drawRoot();}catch(err){fail(err);}return result;};

 // ---- facing --------------------------------------------------------------------
 // Screen side of the hero (u = x - y). While engaged the side flips only past
 // a small dead band so a mob does not twitch when the hero walks under it.
 const face=new WeakMap();
 function wantLeft(e){let s=face.get(e);if(!s){s={left:null,u:null};face.set(e,s);}
  const u=e.x-e.y,du=(player.x-player.y)-u,engaged=Math.hypot(player.x-e.x,player.y-e.y)<9||!!e.attack||e.rangedWindup>0;
  if(engaged){if(s.left===null||Math.abs(du)>.3)s.left=du<0;}
  else if(s.u!==null&&Math.abs(u-s.u)>.004)s.left=u<s.u;else if(s.left===null)s.left=du<0;
  s.u=u;return s.left;}
 const motion=window.__STORYWORLD_ENEMY_MOTION_R51__;
 if(motion?.flip){const base=motion.flip;window.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({...motion,flip(e,f,fallback){const out=base(e,f,fallback);
  try{if(!prefs.facing||!e||!player||f?.r74Monster||f?.r51OrderlyPose||e.boss||e.midboss||e.persona||!(e.hp>0))return out;const row=artOf(e);if(row?.f!=='L'&&row?.f!=='R')return out;
   const left=wantLeft(e);stats.flips++;return row.f==='R'?left:!left;}catch(err){fail(err);}return out;}});}

 // ---- flyers ----------------------------------------------------------------------
 // A winged body hovers (visualLiftPx, which also shrinks the native shadow)
 // and beats: the whole enemy draw is scaled about its chest. RC146 swaps the
 // frame painter inside drawEnemy, so the beat wraps the draw, not the frame.
 const enemyBase=drawEnemy;drawEnemy=function(e,...args){let row=null;try{row=artOf(e);}catch(err){fail(err);}
  if(!(prefs.flyers&&row?.fly&&e&&e.hp>0&&!e.deadRecorded&&e.spawnState!=='dead'&&!e.boss&&!e.midboss&&!e.persona&&finite(e.x+e.y)))return enemyBase.call(this,e,...args);
  const own=Object.prototype.hasOwnProperty.call(e,'visualLiftPx'),old=e.visualLiftPx,seed=hash(e.id)%628/100,h=actorHeight();
  if(!(finite(old)&&old>0))e.visualLiftPx=h*(.13+.035*Math.sin(time*2.6+seed));
  // R101: the beat itself moved to the body pose (polish-r101), so the shadow and
  // health bar no longer wobble with it; only the hover lift stays here.
  try{stats.flaps++;return enemyBase.call(this,e,...args);}
  finally{if(own)e.visualLiftPx=old;else delete e.visualLiftPx;}};

 // ---- navigation ----------------------------------------------------------------
 const ward=()=>window.__STORYWORLD_WORLD_COMBAT_R78__;
 function nearestOf(list){let best=null,d=Infinity;for(const e of list){const k=Math.hypot(e.x-player.x,e.y-player.y);if(k<d){d=k;best=e;}}return best;}
 const fighting=e=>e&&e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&e.visible!==false&&finite(e.x+e.y);
 function wardDoor(id){return room.exploration?.worldR74?.doors?.find(d=>d.id===id)||null;}
 function goal(){try{const own=window.__STORYWORLD_NAV_GOAL_R103__?.();if(own&&finite(own.x+own.y))return own;}catch(_){}const def=regionById?.[zone];if(!def)return null;const alive=(room.enemies||[]).filter(fighting),pt=(p,label,kind)=>p&&finite(p.x+p.y)?{x:p.x,y:p.y,label,kind}:null;
  const W=ward(),s=W?.controlled?.(room)?W.state(room):null,g=room.exploration?.worldWardR81;
  if(s&&g){switch(s.phase){
   case'route':return pt(g.gatherAnchor,'중앙 전투실','objective');
   case'rally':{const e=nearestOf(alive);return e?pt(e,'적 제압 · '+alive.length,'enemy'):pt(g.gatherAnchor,'중앙 전투실','objective');}
   case'door':case'doorStory':return pt(wardDoor(room.exploration.bossDoorId)||g.bossAnchor,'보스 구역 문','objective');
   case'boss':{const b=nearestOf(alive.filter(e=>e.boss||e.midboss));return b?pt(b,'보스','boss'):pt(g.bossAnchor,'보스 구역','objective');}
   case'exit':case'exitStory':return pt(wardDoor('door-2'),'출구 문','objective');}}
  const routes=window.__STORYWORLD_REGION_ROUTES__,P=window.__STORYWORLD_PORTALS_R61__,d=routes?.activeDirection?.(),st=d?P?.status?.(d):null;
  if(st?.visible&&st.point){if(!st.open&&alive.length&&!canTravelSafe()){const e=nearestOf(alive);if(e)return pt(e,'봉인 해제 · 적 처치','enemy');}return pt(st.point,regionById[st.destination||def.exits?.[d]]?.title||'다음 기억','exit');}
  const obj=room.objective;if(!completed(zone)&&storyReady(def)&&obj){
   if(def.bosses?.length&&room.engaged){const b=nearestOf(alive.filter(e=>e.boss||e.midboss));if(b)return pt(b,'보스','boss');}
   if(!def.bosses?.length&&!def.safe&&(room.kills||0)<3){const e=nearestOf(alive);if(e)return pt(e,'적 처치 '+(room.kills||0)+'/3','enemy');}
   return pt(obj,def.safe?'이야기':'목표','objective');}
  return null;}
 function canTravelSafe(){try{return typeof canTravel==='function'?!!canTravel():true;}catch(_){return true;}}
 // Grid A* over cell centres with a binary heap. Cells and the edges between
 // them are tested once per room with the native blocked() query, so a thin
 // wall on a cell border still splits the cells it separates.
 let grid=null;
 function gridFor(){const L=room.exploration,b=Array.isArray(L?.bounds)?L.bounds:[0,0,typeof N==='number'?N:30,typeof N==='number'?N:30],x0=Math.floor(b[0]),y0=Math.floor(b[1]),w=Math.ceil(b[2])-x0,h=Math.ceil(b[3])-y0,
   phase=ward()?.controlled?.(room)?ward().state(room)?.phase:'',key=[zone,layer,x0,y0,w,h,phase,room.engaged,room.cleared].join('|');
  if(grid?.room===room&&grid.key===key)return grid;
  grid={room,key,x0,y0,w,h,cell:new Uint8Array(w*h),east:new Uint8Array(w*h),south:new Uint8Array(w*h)};return grid;}
 function navPath(from,to){const G=gridFor(),{x0,y0,w,h}=G,inside=(cx,cy)=>cx>=0&&cy>=0&&cx<w&&cy<h;
  const free=(cx,cy)=>{if(!inside(cx,cy))return false;const k=cx+cy*w;let v=G.cell[k];if(!v){v=blocked(x0+cx+.5,y0+cy+.5,.29,room)?2:1;G.cell[k]=v;stats.navCells++;}return v===1;};
  const east=(cx,cy)=>{const k=cx+cy*w;let v=G.east[k];if(!v){v=blocked(x0+cx+1,y0+cy+.5,.1,room)?2:1;G.east[k]=v;}return v===1;};
  const south=(cx,cy)=>{const k=cx+cy*w;let v=G.south[k];if(!v){v=blocked(x0+cx+.5,y0+cy+1,.1,room)?2:1;G.south[k]=v;}return v===1;};
  const pass=(ax,ay,bx,by)=>bx>ax?east(ax,ay):bx<ax?east(bx,by):by>ay?south(ax,ay):south(bx,by);
  const sx=Math.floor(from.x)-x0,sy=Math.floor(from.y)-y0;let gx=Math.floor(to.x)-x0,gy=Math.floor(to.y)-y0;
  if(!inside(sx,sy))return null;
  if(!free(gx,gy)){let best=null;for(let r=1;r<=3&&!best;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&free(gx+dx,gy+dy)&&(!best||Math.hypot(dx,dy)<best.d))best={x:gx+dx,y:gy+dy,d:Math.hypot(dx,dy)};if(!best)return null;gx=best.x;gy=best.y;}
  const start=sx+sy*w,end=gx+gy*w,gs=new Map([[start,0]]),prev=new Map(),closed=new Set(),heap=[[Math.hypot(gx-sx,gy-sy),start]];
  const push=n=>{heap.push(n);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  let loops=0;while(heap.length&&loops++<14000){const[,k]=pop();if(closed.has(k))continue;if(k===end)break;closed.add(k);const cx=k%w,cy=(k-cx)/w,base=gs.get(k);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(!free(nx,ny))continue;
    if(dx&&dy){if(!free(cx+dx,cy)||!free(cx,cy+dy)||!pass(cx,cy,cx+dx,cy)||!pass(cx,cy,cx,cy+dy)||!pass(cx+dx,cy,nx,ny)||!pass(cx,cy+dy,nx,ny))continue;}else if(!pass(cx,cy,nx,ny))continue;
    const nk=nx+ny*w,cost=base+(dx&&dy?1.4142:1);if(cost<(gs.get(nk)??Infinity)){gs.set(nk,cost);prev.set(nk,k);push([cost+Math.hypot(gx-nx,gy-ny),nk]);}}}
  if(!prev.has(end)&&end!==start)return null;const cells=[];for(let k=end;k!==start&&k!=null;k=prev.get(k))cells.unshift({x:x0+k%w+.5,y:y0+Math.floor(k/w)+.5});
  // Chaikin corner cutting: a smooth trail, still inside the walked cells.
  let line=[{x:from.x,y:from.y},...cells];for(let pass2=0;pass2<2&&line.length>2;pass2++){const out=[line[0]];for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1];out.push({x:a.x*.75+b.x*.25,y:a.y*.75+b.y*.25},{x:a.x*.25+b.x*.75,y:a.y*.25+b.y*.75});}out.push(line[line.length-1]);line=out;}
  return line;}
 const nav={goal:null,path:null,at:-9,from:null,goalKey:'',angle:0,meters:0,visible:false};
 function updateNav(){nav.visible=false;if(!prefs.nav||!live()||modal||player.hp<=0||layer!=='STORY'&&layer!=='DREAM')return;
  const g=goal();nav.goal=g;if(!g)return;const key=Math.floor(g.x)+':'+Math.floor(g.y)+':'+g.kind,moved=!nav.from||Math.hypot(player.x-nav.from.x,player.y-nav.from.y)>.9;
  if(key!==nav.goalKey||(moved&&time-nav.at>.35)||time-nav.at>2.5||time<nav.at){nav.goalKey=key;nav.at=time;nav.from={x:player.x,y:player.y};nav.path=navPath(player,g)||[{x:player.x,y:player.y},{x:g.x,y:g.y}];stats.navPaths++;}
  // Bearing: the trail point about 2.5 units ahead, or the goal when close.
  const ahead=pointAlong(nav.path,2.5)||g,a=project(player.x,player.y),b=project(ahead.x,ahead.y);nav.angle=Math.atan2(b.y-a.y,b.x-a.x);nav.meters=Math.round(pathLength(nav.path));nav.visible=true;}
 function pathLength(p){let n=0;for(let i=1;i<(p?.length||0);i++)n+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);return n;}
 function pointAlong(p,dist){if(!p||p.length<2)return null;let left=dist;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],l=Math.hypot(b.x-a.x,b.y-a.y);if(l>=left)return{x:a.x+(b.x-a.x)*left/l,y:a.y+(b.y-a.y)*left/l};left-=l;}return p[p.length-1];}
 // Ground trail: chevrons laid flat along the next stretch of the path,
 // flowing away from the hero. Hidden while a fight is right next to the hero.
 function drawTrail(){if(!nav.visible||!nav.path||nav.path.length<2)return;const threat=(room.enemies||[]).some(e=>fighting(e)&&Math.hypot(e.x-player.x,e.y-player.y)<5);if(threat&&nav.goal?.kind!=='objective')return;
  const total=Math.min(8,pathLength(nav.path)-.6);if(total<1)return;const flow=(time*1.6)%1;
  scope({id:'r100:nav',kind:'hazard',x:player.x,y:player.y,groundAligned:true,r100:true},()=>{ctx.save();try{ctx.globalCompositeOperation='lighter';
   for(let s=.9+flow*.9;s<total;s+=.9){const p=pointAlong(nav.path,s),q=pointAlong(nav.path,s+.25);if(!p||!q)break;const dx=q.x-p.x,dy=q.y-p.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,nx=-uy,ny=ux,w=.26,len=.22;
    const fade=Math.min(1,(s-.6)/.8)*Math.max(0,1-s/total),pts=[[p.x-ux*len+nx*w,p.y-uy*len+ny*w],[p.x+ux*len,p.y+uy*len],[p.x-ux*len-nx*w,p.y-uy*len-ny*w],[p.x-ux*(len-.12),p.y-uy*(len-.12)]];
    ctx.fillStyle='rgba(255,214,140,'+(.62*fade).toFixed(3)+')';ctx.beginPath();pts.forEach(([x,y],i)=>{const v=project(x,y);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y);});ctx.closePath();ctx.fill();}
  }finally{ctx.restore();}});stats.navDraws++;}
 if(typeof groundImage==='function'){const gb=groundImage;groundImage=function(...args){const result=gb.apply(this,args);try{if(prefs.nav&&live())drawTrail();}catch(err){fail(err);}return result;};}

 // ---- HUD: compass, touch buttons, ambience ------------------------------------------
 const $id=id=>document.getElementById(id),stage=()=>$id('stage');
 const style=document.createElement('style');style.id='polishStyleR100';style.textContent=`
#navCompassR100{position:absolute;z-index:14;right:14px;top:84px;width:92px;display:none;flex-direction:column;align-items:center;gap:3px;pointer-events:none;font:11px 'Malgun Gothic',sans-serif;color:#efe2c2;text-shadow:0 1px 3px #000}
#navCompassR100 .ring{position:relative;width:54px;height:54px;border-radius:50%;background:radial-gradient(circle at 50% 42%,#2b2a26ee,#0d0f12ee 70%);border:2px solid #b89a5e;box-shadow:0 0 0 1px #000a,0 3px 10px #000a,inset 0 0 8px #000}
#navCompassR100 .ring:before{content:'';position:absolute;inset:5px;border-radius:50%;border:1px dashed #b89a5e66}
#navCompassR100 .needle{position:absolute;left:50%;top:50%;width:0;height:0;transform-origin:0 0}
#navCompassR100 .needle:before{content:'';position:absolute;left:-2px;top:-7px;border-left:21px solid #f3cf7a;border-top:7px solid transparent;border-bottom:7px solid transparent;filter:drop-shadow(0 0 3px #f3cf7a88)}
#navCompassR100 .needle:after{content:'';position:absolute;left:-12px;top:-4px;border-right:10px solid #7d6a48;border-top:4px solid transparent;border-bottom:4px solid transparent}
#navCompassR100 .pin{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#efe2c2}
#navCompassR100 .label{max-width:92px;text-align:center;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#navCompassR100 .dist{color:#cdb98a;font-size:10px}
#touchActionsR100{position:absolute;z-index:19;right:calc(env(safe-area-inset-right,0px) + 10px);bottom:calc(env(safe-area-inset-bottom,0px) + 62px);display:none;flex-direction:column;gap:10px;touch-action:none}
#touchActionsR100 button{position:relative;width:58px;height:58px;padding:0;border-radius:50%;border:2px solid #b89a5ecc;background:radial-gradient(circle at 50% 40%,#2c3a40e6,#0c1418ee);color:#f1e6cc;font:bold 11px 'Malgun Gothic',sans-serif;box-shadow:0 3px 10px #000b;overflow:hidden;touch-action:none;-webkit-tap-highlight-color:transparent}
#touchActionsR100 button img{position:absolute;inset:6px;width:42px;height:42px;object-fit:contain;opacity:.92;pointer-events:none}
#touchActionsR100 button span{position:absolute;left:0;right:0;bottom:3px;font-size:10px;text-shadow:0 1px 2px #000;pointer-events:none}
#touchActionsR100 button i{position:absolute;inset:0;background:#000a;display:none;align-items:center;justify-content:center;font-style:normal;font-size:15px;color:#fff;pointer-events:none}
#touchActionsR100 button.cd i{display:flex}
#touchActionsR100 button:active{transform:scale(.93)}
#ambienceR100{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
#vignetteR100{position:absolute;inset:0;pointer-events:none;z-index:2;background:radial-gradient(ellipse at 50% 52%,transparent 58%,rgba(4,6,8,.42) 100%)}
@media (pointer:coarse){
 body.mobile-live-r63 #touchActionsR100.on{display:flex}
 body.mobile-live-r63.mobile-modal-r63 #touchActionsR100{display:none!important}
 body.mobile-live-r63 #navCompassR100{right:auto;left:calc(env(safe-area-inset-left,0px) + 8px);top:calc(env(safe-area-inset-top,0px) + 42px);width:76px}
 body.mobile-live-r63 #navCompassR100 .ring{width:46px;height:46px}
 body.mobile-live-r63 #navCompassR100 .label{max-width:76px;font-size:10px}
 body.mobile-live-r63 #vignetteR100{background:radial-gradient(ellipse at 50% 50%,transparent 64%,rgba(4,6,8,.32) 100%)}
}
@media (pointer:coarse) and (orientation:portrait){
 body.mobile-live-r63 #goldHudR72{transform:scale(.84);transform-origin:top right}
 body.mobile-live-r63 #heroCard.mobile-hud-r63{transform:scale(.9);transform-origin:bottom left}
}`;document.head.appendChild(style);
 // Built node by node and kept by reference (no innerHTML parsing or child
 // indexing), so the overlay also mounts under the QA DOM stand-in.
 const make=(tag,cls,parent)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;};
 const compass=make('div');compass.id='navCompassR100';compass.setAttribute('aria-hidden','true');
 const ring=make('div','ring',compass),needle=make('i','needle',ring),compassLabel=make('span','label',compass),compassDist=make('span','dist',compass);make('i','pin',ring);
 const vignette=document.createElement('div');vignette.id='vignetteR100';vignette.setAttribute('aria-hidden','true');
 const particles=document.createElement('canvas');particles.id='ambienceR100';particles.setAttribute('aria-hidden','true');
 const touch=document.createElement('div');touch.id='touchActionsR100';
 const ACTIONS=[['blink','회피',()=>blink(),'blinkIcon','blinkCD'],['special','기술',()=>special(),'specialIcon','specialCD'],['ego','EGO',()=>ego(),'egoIcon','egoCD']];
 const buttons=[];
 for(const[id,label,fn]of ACTIONS){const b=make('button',null,touch);b.type='button';b.setAttribute('aria-label',label);const img=make('img',null,b);img.alt='';make('span',null,b).textContent=label;const cd=make('i',null,b);buttons.push({b,img,cd,action:ACTIONS.find(r=>r[0]===id)});
  const press=e=>{e.preventDefault();e.stopPropagation();try{window.__STORYWORLD_MOBILE_R63__?.clearGesture?.();if(typeof unlockAudio==='function')unlockAudio();fn();stats.touches++;}catch(err){fail(err);}};
  b.addEventListener('pointerdown',press);for(const t of['pointerup','click','touchstart','touchend'])b.addEventListener(t,e=>{e.stopPropagation();if(t!=='touchstart')e.preventDefault();},{passive:false});
  }
 function mount(){const s=stage();if(!s)return false;for(const el of[vignette,particles,compass,touch])if(el.parentNode!==s)s.appendChild(el);return true;}
 let hudAt=0,lastAngle=null,lastLabel='',lastDist='';
 function updateHud(){if(!mount())return;const showNav=nav.visible&&!modal&&!storyScene;compass.style.display=showNav?'flex':'none';
  if(showNav){const deg=Math.round(nav.angle*180/Math.PI);if(deg!==lastAngle){needle.style.transform='rotate('+deg+'deg)';lastAngle=deg;}
   const label=nav.goal.label,dist=nav.meters+'m';if(label!==lastLabel){compassLabel.textContent=label;lastLabel=label;}if(dist!==lastDist){compassDist.textContent=dist;lastDist=dist;}}
  const now=performance.now();if(now-hudAt<120)return;hudAt=now;
  const touchOn=prefs.touch&&coarse()&&live()&&player.hp>0&&!(typeof safeRegion==='function'&&safeRegion());touch.classList.toggle('on',touchOn);
  if(touchOn)for(const{b,img,cd:shade,action:a}of buttons){const src=$id(a[3])?.src||'';if(src&&img.getAttribute('src')!==src)img.setAttribute('src',src);const cd=Number(player[a[4]])||0;b.classList.toggle('cd',cd>.05);const t=cd>.05?Math.ceil(cd)+'':'';if(shade.textContent!==t)shade.textContent=t;}
  vignette.style.display=prefs.ambience&&live()&&!modal?'block':'none';}

 // Ambience: screen-space motes that drift with the camera so they read as
 // part of the place (leaves, spores, embers, snow, spray, dust).
 const MOTES={garden:{c:[[176,206,96],[226,190,96]],n:34,fall:14,size:[2,4],kind:'leaf'},swamp:{c:[[150,210,120],[200,230,150]],n:30,fall:-6,size:[1.5,3],kind:'spore'},
  ash:{c:[[255,150,60],[255,200,110]],n:36,fall:-22,size:[1,2.6],kind:'ember'},forge:{c:[[255,150,60],[255,210,120]],n:36,fall:-24,size:[1,2.6],kind:'ember'},
  snow:{c:[[240,248,255],[214,230,245]],n:46,fall:26,size:[1.5,3.4],kind:'snow'},coast:{c:[[200,236,245],[160,210,230]],n:26,fall:-4,size:[1,2.4],kind:'spore'},
  memory:{c:[[200,160,255],[160,200,255]],n:28,fall:-8,size:[1.2,2.6],kind:'glow'},neural:{c:[[110,230,255],[160,190,255]],n:28,fall:-8,size:[1.2,2.6],kind:'glow'},
  cave:{c:[[190,200,230]],n:20,fall:5,size:[1,2],kind:'dust'},regional:{c:[[230,214,170]],n:22,fall:4,size:[1,2.2],kind:'dust'}};
 const motes=[];let moteFamily=null,lastOrigin=null,lastT=0;
 function family(){const L=room?.exploration;return L?.surface?.art?.r81Environment||L?.worldWardR81?.environment?.family||window.__STORYWORLD_ENVIRONMENT_R81__?.specs?.[zone]?.family||'regional';}
 function ambience(){const want=prefs.ambience&&live()&&!modal&&layer==='STORY';particles.style.display=want?'block':'none';if(!want){motes.length=0;moteFamily=null;return;}
  const fam=family(),spec=MOTES[fam]||MOTES.regional,cw=Math.max(1,Math.round(W)),ch=Math.max(1,Math.round(H));if(particles.width!==cw)particles.width=cw;if(particles.height!==ch)particles.height=ch;
  const n=Math.round(spec.n*(coarse()?.6:1)*(lowFx()?.6:1));if(moteFamily!==fam){motes.length=0;moteFamily=fam;}
  while(motes.length<n)motes.push({x:Math.random()*cw,y:Math.random()*ch,z:.5+Math.random()*.8,p:Math.random()*TAU,c:spec.c[motes.length%spec.c.length],s:spec.size[0]+Math.random()*(spec.size[1]-spec.size[0])});
  const o=project(0,0),now=performance.now(),dt=clamp((now-lastT)/1000,0,.05);lastT=now;const dx=lastOrigin?o.x-lastOrigin.x:0,dy=lastOrigin?o.y-lastOrigin.y:0;lastOrigin=o;
  const c=particles.getContext('2d');c.clearRect(0,0,cw,ch);c.globalCompositeOperation=spec.kind==='ember'||spec.kind==='glow'?'lighter':'source-over';
  for(const m of motes){m.x+=dx*m.z+Math.sin(time*.7+m.p)*8*dt*m.z;m.y+=dy*m.z+spec.fall*dt*m.z;m.p+=dt;
   if(m.x<-10)m.x+=cw+20;else if(m.x>cw+10)m.x-=cw+20;if(m.y<-10)m.y+=ch+20;else if(m.y>ch+10)m.y-=ch+20;
   const tw=spec.kind==='ember'||spec.kind==='glow'?.45+.55*Math.abs(Math.sin(time*2.3+m.p*3)):.75,a=(.32+.4*m.z)*tw;
   c.fillStyle='rgba('+m.c[0]+','+m.c[1]+','+m.c[2]+','+a.toFixed(3)+')';
   if(spec.kind==='leaf'){c.save();c.translate(m.x,m.y);c.rotate(time*1.3+m.p*4);c.fillRect(-m.s,-m.s*.45,m.s*2,m.s*.9);c.restore();}
   else{c.beginPath();c.arc(m.x,m.y,m.s*m.z,0,TAU);c.fill();}}
  stats.particles++;}

 // ---- touch camera and sight ---------------------------------------------------------
 // The first touch session without a camera preference opens one step closer
 // than R63's 2x wide view (the hero was ~33 px tall on a portrait phone).
 const CAMERA_FLAG=KEY+'.camera';
 function cameraDefault(){if(!coarse()||!live())return;try{if(localStorage.getItem(CAMERA_FLAG))return;const store=window.__STORYWORLD_TEST_STORAGE_B1__?.store,saved=JSON.parse(store?.getItem('storyworld.camera.r63.v1')||'{}')||{};
  if(!saved.mobile)window.__STORYWORLD_CAMERA_R63__?.setFactor?.(1.25);localStorage.setItem(CAMERA_FLAG,'1');}catch(err){fail(err);}}
 // Outside the line of sight the world stays visible but dimmed instead of
 // black; outdoors (where walls are waist high) it is lighter still.
 const sight=window.__STORYWORLD_SIGHT24__;let softCanvas=null,softKey='';
 if(sight?.mask){const desc=Object.getOwnPropertyDescriptors(sight),baseMask=sight.mask;
  desc.mask={enumerable:true,value:function(){const s=baseMask.apply(this,arguments);if(!s?.enabled||!s.canvas||!prefs.touch&&coarse())return s;try{
   const open=!!room?.exploration?.r98Scene?.open,maze=room?.samongR103?.stage==='maze',level=maze?.5:open?.58:.32,key=s.serial+':'+level;
   if(!softCanvas){softCanvas=document.createElement('canvas');softCanvas.width=softCanvas.height=128;}
   if(softKey!==key){const c=softCanvas.getContext('2d');c.globalCompositeOperation='source-over';c.globalAlpha=1;c.fillStyle='#000';c.fillRect(0,0,128,128);
    const v=Math.round(level*255),gr=c.createRadialGradient(64,64,30,64,64,64);gr.addColorStop(0,'rgb('+v+','+v+','+v+')');gr.addColorStop(1,'#000');c.fillStyle=gr;c.fillRect(0,0,128,128);
    c.globalCompositeOperation='lighten';c.drawImage(s.canvas,0,0);c.globalAlpha=.45;for(const[x,y]of[[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]])c.drawImage(s.canvas,x,y);c.globalAlpha=1;c.globalCompositeOperation='source-over';softKey=key;stats.softMasks++;}
   return{...s,canvas:softCanvas,serial:key};}catch(err){fail(err);return s;}}};
  window.__STORYWORLD_SIGHT24__=Object.freeze(Object.defineProperties({},desc));}

 // ---- outdoor wall caps ------------------------------------------------------------------
 // The blocked strip between two hedge-height wall panels gets a lid at the
 // wall height, textured as moss or rock by region family. Its own basic
 // material takes the native sight mask (a clone of the floor material went
 // black on touch devices, whose floor shader expects more than a map).
 const MOSS=/garden|swamp|coast|snow|regional/;
 function capTexture(r,fam){const path='./assets/r99/outdoor/'+(MOSS.test(fam)?'surround-moss':'surround-cliff')+'.webp',cache=r.r100CapTextures||(r.r100CapTextures=new Map());
  if(cache.has(path))return cache.get(path);const T=r.T,t=new T.TextureLoader().load(path,undefined,undefined,fail);if(T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=2;cache.set(path,t);r.spatialResources?.add(t);return t;}
 // Under the dimmed sight mask the dark moss would sink to black; lift it.
 function capTone(m,force){const lit=window.__STORYWORLD_SIGHT24__?.enabled===true,k=lit?1:.8;if(force||m.userData.r100Tone!==k){m.color.setRGB(k,k*1.02,k*.95);m.userData.r100Tone=k;}}
 function capSight(r,m){if(m.userData.r100Sight||!r.sightState24||typeof A?.attachSight24!=='function')return;A.attachSight24(m,r.sightState24);m.userData.r100Sight=true;}
 function capScene(frame){const scene=frame?.exploration?.r98Scene;return prefs.walls&&solo()&&frame?.layer==='STORY'&&scene?.open&&finite(scene.wall)&&window.__STORYWORLD_WORLD_R98__?.prefs?.().places!==false?scene:null;}
 let capRenderer=null;
 function capInfo(){const r=capRenderer,c=r?.r100Cap,m=c?.material,f=r?.stoneMaterial;return c?{visible:c.visible,parent:c.parent===r.spatialRoot,type:m.type,map:!!m.map?.image,color:m.color?.getHexString?.(),side:m.side,transparent:m.transparent,depthTest:m.depthTest,floorType:f?.type,floorMap:!!f?.map,floorVertexColors:f?.vertexColors,renderOrder:c.renderOrder,layers:c.layers.mask}:null;}
 function syncCap(r,frame){capRenderer=r;const scene=capScene(frame),old=r.r100Cap;if(!scene){if(old)old.visible=false;return;}
  const L=frame.exploration,fam=scene.family||'regional',key=scene.wall+':'+fam;if(old&&r.r100CapLayout===L&&r.r100CapKey===key&&old.parent===r.spatialRoot){old.visible=true;capTone(old.material);capSight(r,old.material);return;}
  const plan=window.__STORYWORLD_HOSPITAL_A5__?.plan(L);if(!plan?.roofRects?.length||!r.spatialRoot)return;
  if(old){old.parent?.remove(old);old.geometry.dispose();}
  const T=r.T,h=scene.wall+.006,pos=[],uv=[],idx=[],tile=3;
  for(const q of plan.roofRects){if(!finite(q.x+q.y+q.width+q.depth))continue;const i=pos.length/3,c=[[q.x,q.y],[q.x+q.width,q.y],[q.x+q.width,q.y+q.depth],[q.x,q.y+q.depth]];for(const[x,y]of c){pos.push(x,h,y);uv.push(x/tile,-y/tile);}idx.push(i,i+2,i+1,i,i+3,i+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  let m=r.r100CapMaterial;if(!m){m=new T.MeshBasicMaterial({side:T.DoubleSide,depthTest:true,depthWrite:true,toneMapped:false});m.userData.r100Cap=true;r.spatialResources?.add(m);r.r100CapMaterial=m;}
  m.map=capTexture(r,fam);capTone(m,true);capSight(r,m);m.needsUpdate=true;
  const mesh=new T.Mesh(g,m);mesh.name='r100-hedge-top';mesh.layers.set(2);mesh.userData={presentationOnly:true,collisionChanged:false,r100Cap:true};r.spatialRoot.add(mesh);
  r.r100Cap=mesh;r.r100CapLayout=L;r.r100CapKey=key;stats.caps++;}
 if(C?.ensureHospitalRoofsR2){const roofBase=C.ensureHospitalRoofsR2;C.ensureHospitalRoofsR2=function(frame){const out=roofBase.call(this,frame);try{syncCap(this,frame);}catch(err){fail(err);}return out;};}
 if(C?.clearScene){const clearBase=C.clearScene;C.clearScene=function(...args){this.r100Cap?.geometry?.dispose?.();this.r100Cap=null;this.r100CapLayout=null;this.r100CapMaterial=null;this.r100CapTextures=null;return clearBase.apply(this,args);};}

 // ---- frame hooks ---------------------------------------------------------------------------
 // The R51 nearest-enemy arrow stays off while the compass guides; the saved
 // setting itself is never changed.
 const drawBase=draw;draw=function(...args){let restore=false,old;
  try{if(prefs.nav&&typeof settings!=='undefined'&&settings){old=settings.enemyDirection51;settings.enemyDirection51=false;restore=true;}updateNav();}catch(err){fail(err);}
  try{return drawBase.apply(this,args);}finally{if(restore)settings.enemyDirection51=old;try{updateHud();ambience();cameraDefault();}catch(err){fail(err);}}};

 function apply(){try{updateHud();}catch(err){fail(err);}}
 function settingsSection(){const host=document.getElementById('retroSettingsR98World')||document.getElementById('retroSettingsR98Vfx')||document.getElementById('retroSettingsR93')||document.getElementById('retroSettingsR89');if(!host||document.getElementById('retroSettingsR100'))return;
  const s=document.createElement('section');s.id='retroSettingsR100';s.innerHTML='<h3>R100 연출</h3><p class="small muted">보이는 연출만 바뀌며 전투 판정·이동·저장은 그대로입니다. 설정은 저장 슬롯과 별도로 보관됩니다.</p>'+Object.keys(DEFAULTS).map(k=>'<label><input type="checkbox" id="r100-'+k+'"> '+LABELS[k]+'</label> ').join('');
  host.parentNode.insertBefore(s,host.nextSibling);for(const k of Object.keys(DEFAULTS)){const el=s.querySelector('#r100-'+k);el.checked=prefs[k];el.onchange=()=>set({[k]:el.checked});}}
 if(typeof showSettings==='function'){const sb=showSettings;showSettings=function(...args){const result=sb.apply(this,args);try{settingsSection();}catch(e){fail(e);}return result;};}

 window.__STORYWORLD_POLISH_R100__=Object.freeze({prefs:()=>({...prefs}),set,colourOf,artOf:e=>{const r=artOf(e);return r?{...r}:null;},rooted:()=>root.on,
  sig:D.sig,sigColours:D.sigColours,capMesh:()=>capRenderer?.r100Cap||null,goal:()=>nav.goal?{...nav.goal}:null,path:()=>nav.path?nav.path.map(p=>({...p})):null,navPath,
  inspect:()=>({revision:'R100-polish',prefs:{...prefs},stats:{...stats},nav:{visible:nav.visible,goal:nav.goal,meters:nav.meters,points:nav.path?.length||0},cap:capInfo(),root:{on:root.on,off:root.off},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();

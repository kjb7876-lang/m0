/* Hospital A5 presentation retained. Maze refinement fills EVERY non-walkable
 * cell inside the original hospital envelope with contiguous masonry caps.
 * These caps never grant floor/collision access; native walls stay authoritative. */
(()=>{'use strict';
 const enabled=r=>r?.id==='ep1a08'&&!!r.exploration?.hospitalDoorsB3;
 const cache=new WeakMap(),stats={floorDraws:0,roofDraws:0,propsSuppressed:0,projectileCues:0,surgeonBackdrops:0};
 const material='assets/visual-test/hospital-quiet-material-atlas-r42.png';
 const medicalProps=new Set(['assets/visual-test/hospital-prop-atlas-oriented.png',material,'assets/props/v31238/hospital-craving-cabinet.webp']);
 const key=(x,y)=>x+':'+y;
 function compact(cells,bounds){
  const rows=[],active=new Map();
  for(let y=bounds[1];y<bounds[3];y++){
   const next=new Map();
   for(let x=bounds[0];x<bounds[2];x++){
    if(!cells.has(key(x,y)))continue;const left=x;while(x+1<bounds[2]&&cells.has(key(x+1,y)))x++;
    const width=x-left+1,tag=left+':'+width,prior=active.get(tag);
    if(prior){prior.depth++;next.set(tag,prior);}else{const r={x:left,y,width,depth:1};rows.push(r);next.set(tag,r);}
   }active.clear();for(const [tag,r]of next)active.set(tag,r);
  }return rows;
 }
 function plan(L){
  let p=cache.get(L);if(p)return p;
  const b=L.bounds.map(Math.floor),floor=new Set(L.floorCells.map(([x,y])=>key(x,y))),outside=new Set(),queue=[];
  const add=(x,y)=>{const k=key(x,y);if(x<b[0]||x>=b[2]||y<b[1]||y>=b[3]||floor.has(k)||outside.has(k))return;outside.add(k);queue.push([x,y]);};
  for(let x=b[0];x<b[2];x++){add(x,b[1]);add(x,b[3]-1);}for(let y=b[1];y<b[3];y++){add(b[0],y);add(b[2]-1,y);}
  for(let i=0;i<queue.length;i++){const[x,y]=queue[i];add(x+1,y);add(x-1,y);add(x,y+1);add(x,y-1);}
  const roofs=new Set();for(let y=b[1];y<b[3];y++)for(let x=b[0];x<b[2];x++){const k=key(x,y);if(!floor.has(k))roofs.add(k);}
  const roofRects=compact(roofs,b),tiles=[];
  for(const r of roofRects)for(let y=r.y;y<r.y+r.depth;y+=4)for(let x=r.x;x<r.x+r.width;x+=4)tiles.push({x,y,width:Math.min(4,r.x+r.width-x),depth:Math.min(4,r.y+r.depth-y)});
  p={walkCells:floor.size,roofCells:roofs.size,roofRects,tiles,bossRect:{x:10.45,y:6.45,width:17.1,depth:11.1}};cache.set(L,p);return p;
 }
 function corners(r){return[[r.x,r.y],[r.x+r.width,r.y],[r.x+r.width,r.y+r.depth],[r.x,r.y+r.depth]].map(([x,y])=>project(x,y));}
 function onScreen(points){return Math.max(...points.map(p=>p.x))>=-16&&Math.min(...points.map(p=>p.x))<=W+16&&Math.max(...points.map(p=>p.y))>=-16&&Math.min(...points.map(p=>p.y))<=H+16;}
 function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
 function fillRect(r,color){const p=corners(r);if(!onScreen(p))return;polygon(p);ctx.fillStyle=color;ctx.fill();}
 function line(points,color,width){ctx.beginPath();points.map(([x,y])=>project(x,y)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=Math.max(.65,width*zoom);ctx.stroke();}
 function paintRoof(r,image){
  const p=corners(r);if(!onScreen(p))return;
  ctx.save();try{
   polygon(p);ctx.fillStyle='#263a3d';ctx.fill();
   if(image){ctx.save();try{polygon(p);ctx.clip();const[a,b,,d]=p;ctx.transform((b.x-a.x)/600,(b.y-a.y)/600,(d.x-a.x)/320,(d.y-a.y)/320,a.x,a.y);ctx.filter='brightness(.34) saturate(.55)';ctx.drawImage(image,640,16,600,320,0,0,600,320);}finally{ctx.restore();}}
   polygon(p);ctx.strokeStyle='#556364';ctx.lineWidth=Math.max(.65,.9*zoom);ctx.stroke();
   line([[r.x+.10,r.y+.10],[r.x+r.width-.10,r.y+.10]],'#7b8780',.6);
   stats.roofDraws++;
  }finally{ctx.restore();}
 }
 function paintBoss(r){
  if(!onScreen(corners(r)))return;
  // Give the surgeon's chamber its own operating-theatre floor treatment.
  // The muted inlay sits on the original tiles and stays separate from combat
  // telegraphs; it also breaks up the broad, unmarked outer edge of the room.
  fillRect(r,'rgba(26,43,47,.68)');
  const inset=.22;for(const d of [0,inset]){const q={x:r.x+d,y:r.y+d,width:r.width-d*2,depth:r.depth-d*2};const ps=corners(q);polygon(ps);ctx.strokeStyle=d?'#c1c9b9':'#69908d';ctx.lineWidth=Math.max(.7,(d?1.15:2.15)*zoom);ctx.stroke();}
  for(let x=12;x<27;x+=2)line([[x,7],[x,17]],'rgba(173,198,189,.25)',.7);
  for(let y=8;y<18;y+=2)line([[11,y],[27,y]],'rgba(173,198,189,.24)',.7);
  const ellipse=(cx,cy,rx,ry,fill,stroke,width)=>{const points=Array.from({length:40},(_,i)=>{const a=i*Math.PI*2/40;return[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];}).map(([x,y])=>project(x,y));polygon(points);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=Math.max(.7,width*zoom);ctx.stroke();}};
  ellipse(20,12,6.7,4.15,'rgba(120,160,157,.17)','rgba(189,211,201,.62)',1.15);
  ellipse(20,12,4.5,2.8,'rgba(201,217,205,.13)','rgba(211,221,207,.49)',.8);
  // A long pale operating table is a floor decal, not a blocking prop.
  fillRect({x:18.9,y:10.2,width:2.2,depth:3.6},'rgba(188,204,194,.34)');
  fillRect({x:19.3,y:10.65,width:1.4,depth:2.6},'rgba(36,57,60,.43)');
  line([[19.5,10.9],[20.5,10.9]],'rgba(224,232,215,.72)',.9);
  line([[20,11.2],[20,13.1]],'rgba(224,232,215,.60)',.8);
  line([[18.2,8.4],[19.2,9.1],[20,8.4]],'rgba(152,96,93,.58)',1.15);
  // Low-contrast enamel bay corners frame the scene without hiding actors.
  for(const [x,y,sx,sy]of [[12,8,1,1],[26,8,-1,1],[12,16,1,-1],[26,16,-1,-1]]){
   line([[x+sx*1.25,y],[x,y],[x,y+sy*1.25]],'rgba(195,207,194,.45)',1.25);
  }
  stats.floorDraws++;
 }
 const groundBase=groundImage;groundImage=function(...args){
  const result=groundBase.apply(this,args);if(!enabled(room))return result;
  const p=plan(room.exploration),sight=window.__STORYWORLD_SIGHT24__?.geometry(),paint=()=>{
   ctx.save();try{
    if(sight?.enabled){polygon(sight.polygon.map(([x,y])=>project(x,y)));ctx.clip();}
    /* Three owns roof caps at wall-top height; ground-level tiles looked like open gutters. */if(!window.__STORYWORLD_PHASE1__?.controller?.state.three){const im=readyImage(material)?.image;for(const r of p.tiles)paintRoof(r,im);}paintBoss(p.bossRect);
   }finally{ctx.restore();}
  };
  if(typeof ctx.scope==='function')ctx.scope({id:'hospital-a5-floor-and-cutaway-roofs',kind:'hospital-architecture',groundAligned:true,presentationOnly:true},paint);else paint();
  return result;
 };
 const enemyBase=drawEnemy;drawEnemy=function(e,...args){
  if(!enabled(room)||!e?.mazeChiefR1)return enemyBase.apply(this,[e,...args]);
  // The translucent teal pool is ground-aligned and follows the surgeon, so
  // his silhouette remains readable when he leaves the centre of the room.
  const q=project(e.x,e.y),paint=()=>{ctx.save();try{
   ctx.globalAlpha*=.58;ctx.beginPath();ctx.ellipse(q.x,q.y+1.1*zoom,1.65*TILE*zoom,.58*TILE*zoom,0,0,Math.PI*2);
   ctx.fillStyle='rgba(78,137,136,.48)';ctx.fill();ctx.strokeStyle='rgba(204,224,210,.86)';ctx.lineWidth=Math.max(1,1.45*zoom);ctx.stroke();
   ctx.beginPath();ctx.ellipse(q.x,q.y+1.1*zoom,1.12*TILE*zoom,.33*TILE*zoom,0,0,Math.PI*2);ctx.strokeStyle='rgba(157,100,94,.72)';ctx.lineWidth=Math.max(.8,.9*zoom);ctx.stroke();
   ctx.beginPath();ctx.moveTo(q.x-5*zoom,q.y+1.1*zoom);ctx.lineTo(q.x+5*zoom,q.y+1.1*zoom);ctx.moveTo(q.x,q.y-3*zoom);ctx.lineTo(q.x,q.y+5*zoom);ctx.strokeStyle='rgba(224,226,209,.78)';ctx.lineWidth=Math.max(.75,.8*zoom);ctx.stroke();stats.surgeonBackdrops++;
  }finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:'surgeon-operating-focus:'+e.id,kind:'arena-backdrop',x:e.x,y:e.y,groundAligned:true,presentationOnly:true},paint);else paint();
  return enemyBase.apply(this,[e,...args]);
 };
 const propBase=drawProp;drawProp=function(p,...args){
  if(enabled(room)&&p&&!p.terrainWall&&!p.hospitalDoorFrameB3){
   if(!medicalProps.has(p.path)||blocked(p.x,p.y,.05,room)){stats.propsSuppressed++;return;}
  }return propBase.call(this,p,...args);
 };
 const projectileBase=drawProjectile;drawProjectile=function(p,...args){
  const result=projectileBase.call(this,p,...args);
  if(!enabled(room)||p?.dead||p?.medical20?.room!==room||!['syringe','scalpel'].includes(p.medical20.frame)||window.__STORYWORLD_SIGHT24__?.enabled&&!window.__STORYWORLD_SIGHT24__.pointVisible(p.x,p.y))return result;
  const n=Math.hypot(p.vx,p.vy);if(!(n>0))return result;
  const tip=project(p.x+p.vx/n*(p.radius||0),p.y+p.vy/n*(p.radius||0)),back=project(p.x-p.vx/n*.62,p.y-p.vy/n*.62),lift=actorHeight()*(window.__STORYWORLD_VISUAL_POLISH_R44__?.hospitalProjectileLift||0);
  const paint=()=>{ctx.save();try{ctx.globalAlpha*=.94;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(back.x,back.y-lift);ctx.lineTo(tip.x,tip.y-lift);ctx.strokeStyle='#172126';ctx.lineWidth=Math.max(2.4,3.0*zoom);ctx.stroke();ctx.strokeStyle=p.medical20.frame==='syringe'?'#b6d88c':'#e0e8e6';ctx.lineWidth=Math.max(.9,1.15*zoom);ctx.stroke();stats.projectileCues++;}finally{ctx.restore();}};
  if(typeof ctx.scope==='function')ctx.scope({id:'hospital-a5-tool-cue:'+p.id,kind:'projectile',x:p.x,y:p.y,presentationOnly:true},paint);else paint();return result;
 };
 // Slightly tighten the PC camera on ultrawide screens. The maze geometry and
 // collision stay identical; this crops the unused outer roof rim from the
 // viewport so the current combat space occupies more of the display.
 const pcFine=()=>!(typeof mobile==='function'&&mobile())&&
  (typeof matchMedia!=='function'||matchMedia('(pointer:fine)').matches);
 const controller=window.__STORYWORLD_PHASE1__?.controller,drawBase=controller?.draw;
 const pcFinePointerZoomHooked=typeof drawBase==='function';
 if(pcFinePointerZoomHooked)controller.draw=function(...args){
  if(!enabled(room)||!pcFine()||!Number.isFinite(zoom))return drawBase.apply(this,args);
  const before=zoom;zoom=before*1.12;try{return drawBase.apply(this,args);}finally{zoom=before;}
 };
 window.__STORYWORLD_HOSPITAL_A5__=Object.freeze({plan,enabled,inspect:()=>({revision:'hospital-maze-wall-top-roofs-r3',enabled:enabled(room),stats:{...stats},floorCells:enabled(room)?plan(room.exploration).walkCells:0,roofCells:enabled(room)?plan(room.exploration).roofCells:0,surgeonBackdrop:'operating-theatre floor inlay plus ground-aligned follow spotlight',pcFinePointerZoomFactor:1.12,pcFinePointerZoomHooked,desktopOnly:true,cutawayRoofsGroundAligned:false,threeRoofHeight:2.705,roofCollisionAdded:false,enemyCountChanged:false,damageBudgetChanged:false,saveSchemaChanged:false,actualBrowser:false,GPU:false})});
})();

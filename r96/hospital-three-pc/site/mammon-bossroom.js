/* Mammon boss room: isolated layout/presentation overlay. Native doors, combat,
 * progression and save format remain owned by the game. No original asset edits. */
(()=>{'use strict';
if(window.__STORYWORLD_MAMMON_BOSSROOM__)return;
const REV='mammon-bossroom-v3',cache=new WeakMap(),stats={layouts:0,scenes:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,500);};
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const furniture=Object.freeze([
 {id:'desk',x:14,y:7.35,width:5,depth:1.4,height:1.02},
 {id:'drawers',x:6.85,y:15,width:1.4,depth:4,height:1.35},
 {id:'safe',x:22,y:7.1,width:2.4,depth:1.8,height:2.1}
]);
// Bundles sit on existing solid furniture; no extra obstacle in the arena.
const cashBundles=Object.freeze([{x:21.35,y:6.55,z:2.11},{x:22.15,y:6.55,z:2.11},{x:22.75,y:7.05,z:2.11},{x:21.35,y:7.5,z:2.11},{x:22.15,y:7.5,z:2.11}]);
const inside=(x,y)=>x>=6&&x<26&&y>=6&&y<20;
// Latest main already owns the zone's architectural finish. Retain it outside
// and inside the boss room; this overlay contributes furniture only there.
const pilotFinish=()=>{const p=window.__STORYWORLD_MAMMON_MINIATURE_PILOT__?.inspect?.();return !!(p?.registered&&p.on);};
function layout(id,L){
 if(id!=='ep1b06'||!solo()||!L?.storyMapR171||L.samongR103)return L;
 if(L.mammonBossroom)return L;if(cache.has(L))return cache.get(L);
 const M=window.__STORYWORLD_STORY_MAPS_R171__;if(!M?.geometry)return L;
 const cells=new Set(L.floorCells.map(c=>c.join(':')));
 // Collision-only furniture has a floor-height native mesh; the authored mesh below owns its silhouette.
 // Reclaim only the four native 2x2 pillar footprints. No external corridor changes.
 for(const x of[10,20])for(const y of[9,15])for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)cells.add((x+dx)+':'+(y+dy));
 const g=M.geometry(cells),pillarWall=w=>w.x>9.8&&w.x<22.2&&w.y>8.8&&w.y<17.2&&w.width<=2.3&&w.depth<=2.3;
 const walls=L.walls.filter(w=>!pillarWall(w));
 for(const p of furniture)walls.push({id:'mammon:'+p.id,x:p.x,y:p.y,width:p.width,depth:p.depth,height:.01,r98BaseHeight:.01,r115Wall:p.height,angle:0,
  analyticBounds12:[p.x-p.width/2,p.y-p.depth/2,p.x+p.width/2,p.y+p.depth/2],mammonFurniture:true,sinFurniture:true});
 const out={...L,floorCells:g.floorCells,floorRects:g.floorRects,walls,mammonBossroom:REV};
 for(const key of['r219Source','r204Source'])if(L[key])Object.defineProperty(out,key,{value:L[key]});
 cache.set(L,out);stats.layouts++;return out;
}
const previous=window.__STORYWORLD_LAYOUT_HOOK_R204__;
window.__STORYWORLD_LAYOUT_HOOK_R204__=function(id,L){const base=previous?.(id,L)||L;return layout(id,base);};
const eligible=r=>r?.id==='ep1b06'&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&solo()&&r.exploration?.mammonBossroom;
// Keep decorative, non-interactive clutter out of the central fight area without
// deleting props from saves or touching doors, loot, altars or combat objects.
const clutter=p=>p&&!p.chest&&!p.altar&&!p.name&&!/chest|altar|portal|door|note|memory/i.test(String(p.kind||'')+String(p.id||''))&&!p.r74Door&&!p.r81WardDoor&&!p.interactive&&!p.solid&&!p.terrainWall&&
 (p.r80PresentationOnly||p.visualOnly6||p.decorative)&&inside(p.x,p.y)&&p.x>9&&p.x<23&&p.y>8&&p.y<18;
window.__STORYWORLD_PERF_GROUPS_R266__?.registerPropRenderer?.(p=>typeof room!=='undefined'&&eligible(room)&&clutter(p));
if(typeof drawProp==='function'){const draw=drawProp;drawProp=function(p,...a){if(typeof room!=='undefined'&&eligible(room)&&clutter(p))return;return draw.call(this,p,...a);};}
function buildScene(r,L){
 const inheritedFinish=pilotFinish();
 const old=r.__mammon;if(old&&old.generation===r.sceneGeneration){old.group.removeFromParent();for(const o of old.resources){r.spatialResources.delete(o);o.dispose?.();}}
 const T=r.T,resources=new Set(),group=new T.Group();group.name='mammon-bossroom';
 const resource=o=>{r.spatialResources.add(o);resources.add(o);return o;};
 const material=(color,map=null)=>{const m=resource(new T.MeshStandardMaterial({color,map,roughness:.88,metalness:.24}));
  if(r.sightState24)window.StoryPhase1.attachSight24?.(m,r.sightState24);return m;};
 const iron=material(0x7d8990),edge=material(0x56636a),brass=material(0x94754c),wood=material(0x49362b),top=material(0x69503b),paper=material(0xa49e7e),paperEdge=material(0xccc4a1),ink=material(0x465947),band=material(0x82734f),safeMetal=material(0x667a83);
 // Reuse the painted wood half of the existing school atlas, without changing source bytes.
 const generation=r.sceneGeneration,im=new Image();im.decoding='async';
 im.onload=()=>{if(r.disposed||r.sceneGeneration!==generation||r.__mammon?.group!==group)return;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;canvas.getContext('2d').drawImage(im,0,0,1024,1024,0,0,256,256);
  const t=resource(new T.CanvasTexture(canvas));t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;
  for(const [m,c]of[[wood,0x82705a],[top,0xbba18a]]){m.map=t;m.color.setHex(c);m.needsUpdate=true;}};
 im.onerror=()=>fail(Error('mammon wood texture unavailable'));im.src='assets/r118/tiles/school.webp';
 const metalImage=new Image();metalImage.onload=()=>{if(r.disposed||r.sceneGeneration!==generation||r.__mammon?.group!==group)return;const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(metalImage,1024,0,1024,1024,0,0,256,256);const t=resource(new T.CanvasTexture(c));t.colorSpace=T.SRGBColorSpace;iron.map=t;iron.needsUpdate=true;};metalImage.onerror=()=>fail(Error('mammon iron texture unavailable'));metalImage.src='assets/r118/tiles/vault.webp';
 function box(name,x,y,z,w,d,h,m){const geo=resource(new T.BoxGeometry(w,h,d)),o=new T.Mesh(geo,m);o.position.set(x,z+h/2,y);o.name='mammon:'+name;o.layers.set(2);o.userData.presentationOnly=true;group.add(o);return o;}
 // Inner cladding follows the native isometric wall axes. It never crosses an aperture.
 for(const w of inheritedFinish?[]:L.walls){if(w.mammonFurniture)continue;
  const a=w.analyticBounds12||[w.x-w.width/2,w.y-w.depth/2,w.x+w.width/2,w.y+w.depth/2];
  if(w.y>=5.8&&w.y<=6.2&&w.width>1){const x0=Math.max(9,a[0]),x1=Math.min(26,a[2]);if(x1>x0){box('iron-north',(x0+x1)/2,6.16,0,x1-x0,.12,2.2,iron);box('north-cornice',(x0+x1)/2,6.16,2.2,x1-x0,.18,.12,brass);for(let x=x0+.2;x<x1;x+=2)box('iron-rib',x,6.25,0,.06,.06,2.2,edge);}}
  if(w.x>=5.8&&w.x<=6.2&&w.depth>1){const y0=Math.max(11,a[1]),y1=Math.min(20,a[3]);if(y1>y0){box('iron-west',6.16,(y0+y1)/2,0,.12,y1-y0,.65,iron);box('west-cornice',6.16,(y0+y1)/2,.65,.18,y1-y0,.1,brass);}}
 }
 for(const p of furniture){
  // Dedicated office sprites replace only these silhouettes; native footprints stay solid.
  if(p.id!=='safe'&&window.__STORYWORLD_SIN_ROOM_ART__?.themes?.ep1b06)continue;
  if(p.id==='desk'){
   box('desk-top',p.x,p.y,.9,p.width,p.depth,.12,top);
   for(const x of[p.x-p.width/2+.45,p.x+p.width/2-.45]){box('desk-pedestal',x,p.y,0,.8,p.depth-.12,.9,wood);for(let z=.2;z<.85;z+=.25)box('desk-handle',x,p.y+.66,z,.24,.05,.045,brass);}
   box('desk-back',p.x,p.y-.62,.2,p.width,.12,.65,wood);
  }else if(p.id==='safe'){
   box('safe-body',p.x,p.y,0,p.width,p.depth,p.height,safeMetal);
   box('safe-door',p.x,p.y+p.depth/2+.035,.13,p.width-.24,.08,p.height-.26,edge);
   box('safe-panel',p.x,p.y+p.depth/2+.085,.25,p.width-.5,.025,p.height-.5,safeMetal);
   for(const x of[p.x-p.width/2+.12,p.x+p.width/2-.12])box('safe-frame',x,p.y+p.depth/2+.13,.08,.07,.06,p.height-.16,brass);
   for(const z of[.1,p.height-.14])box('safe-frame',p.x,p.y+p.depth/2+.13,z,p.width-.17,.06,.06,brass);
   for(const z of[.4,1.5])box('safe-hinge',p.x-p.width/2+.2,p.y+p.depth/2+.17,z,.13,.14,.22,brass);
   box('safe-handle',p.x+.3,p.y+p.depth/2+.22,.82,.52,.08,.07,brass);
   box('safe-keyhole',p.x-.3,p.y+p.depth/2+.14,.9,.05,.04,.1,edge);
  }else{
   box('drawer-case',p.x,p.y,0,p.width,p.depth,p.height,wood);box('drawer-top',p.x,p.y,p.height,p.width+.06,p.depth+.06,.08,top);
   for(let y=p.y-p.depth/2+.5;y<p.y+p.depth/2;y+=1)for(let z=.24;z<p.height;z+=.4){box('drawer-face',p.x+.71,y,z-.15,.04,.9,.34,top);box('drawer-handle',p.x+.76,y,z,.06,.26,.045,brass);}
  }
 }
 for(const [i,p] of cashBundles.entries()){
  box('cash-stack-'+i,p.x,p.y,p.z,.72,.42,.18,paper);
  for(const h of[.035,.075,.115,.155])box('cash-paper-edge',p.x,p.y+.212,p.z+h,.7,.008,.012,paperEdge);
  box('cash-note',p.x,p.y,p.z+.181,.62,.34,.008,ink);
  box('cash-band',p.x,p.y,p.z+.195,.13,.43,.012,band);
  box('cash-band-front',p.x,p.y+.217,p.z,.13,.012,.19,band);
 }
 // Brass frames surround the actual native leaves; open/closed leaves remain R83-owned.
 for(const d of inheritedFinish?[]:L.worldR74.doors.filter(d=>d.id==='door-0'||d.id==='door-2')){
  for(const s of[-1,1])box('brass-jamb',d.x+s*(d.width/2+.14),d.y,.0,.22,.3,2.7,brass);
  box('brass-header',d.x,d.y,2.56,d.width,.3,.14,brass);
 }
 r.spatialRoot.add(group);r.__mammon={generation:r.sceneGeneration,L,group,resources,inheritedFinish};stats.scenes++;
}
// Legacy presentation uses the same collision footprints if Three is unavailable.
function fallbackFurniture(){
 if(typeof room==='undefined'||!eligible(room)||window.__STORYWORLD_PHASE1__?.controller?.state?.three||typeof project!=='function')return;
 const z=(typeof TILE==='number'?TILE:34)*Math.sqrt(1.5)*(typeof zoom==='number'?zoom:1);
 const face=(points,color)=>{ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
 ctx.save();try{for(const p of furniture){if(p.id!=='safe'&&window.__STORYWORLD_SIN_ROOM_ART__?.themes?.ep1b06)continue;const x=p.x-p.width/2,y=p.y-p.depth/2,b=[[x,y],[x+p.width,y],[x+p.width,y+p.depth],[x,y+p.depth]].map(([x,y])=>project(x,y)),t=b.map(q=>({x:q.x,y:q.y-p.height*z}));face([t[1],t[2],b[2],b[1]],p.id==='safe'?'#343d40':'#34281f');face([t[2],t[3],b[3],b[2]],p.id==='safe'?'#56636a':'#49362b');face(t,p.id==='safe'?'#747d80':'#69503b');}for(const c of cashBundles){for(const [w,d,color] of[[.72,.42,'#a49e7e'],[.13,.43,'#82734f']])face([[c.x-w/2,c.y-d/2],[c.x+w/2,c.y-d/2],[c.x+w/2,c.y+d/2],[c.x-w/2,c.y+d/2]].map(([x,y])=>{const q=project(x,y);return{x:q.x,y:q.y-(c.z+.2)*z};}),color);}}finally{ctx.restore();}
}
if(typeof drawObjective==='function'){const base=drawObjective;drawObjective=function(...a){const out=base.apply(this,a);fallbackFurniture();return out;};}
function before(r,frame){
 if(frame?.zone!=='ep1b06'||frame.layer!=='STORY'||!frame.exploration?.mammonBossroom||!solo()||!r.spatialBuilt)return;
 if(!r.__mammon||r.__mammon.generation!==r.sceneGeneration||r.__mammon.L!==frame.exploration||r.__mammon.inheritedFinish!==pilotFinish())buildScene(r,frame.exploration);
}
const C=window.StoryPhase1?.ThreeRenderer?.prototype;
const wrap=fn=>{const f=function(frame){try{before(this,frame);}catch(e){fail(e);}return fn.apply(this,arguments);};return f;};
if(C?.render)C.render=wrap(C.render);
const wrapped=new WeakSet();function instance(){const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.hasOwn(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrap(r.render);}}
if(typeof setInterval==='function')setInterval(instance,500);instance();
window.__STORYWORLD_MAMMON_BOSSROOM__=Object.freeze({revision:REV,layout,furniture,cashBundles,clutter,inspect:()=>({revision:REV,stats:{...stats},lastError})});
})();

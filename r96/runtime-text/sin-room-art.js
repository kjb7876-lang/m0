/* Theme-specific boss-room furniture, drawn from untouched generated PNGs.
 * The six interiors share only the native rendering mechanism, never props.
 * Doors, combat, story progression, source layouts and save schema stay native. */
(()=>{'use strict';
if(window.__STORYWORLD_SIN_ROOM_ART__)return;
const REV='sin-room-art-v1',ROOT='assets/sin-rooms/',cache=new WeakMap(),applied=new WeakMap();
const stats={layouts:0,rooms:0,props:0,draws:0,hidden:0,authoredCorrections:0,wallMasksHidden:0,wallMasksRestored:0,errors:0};let lastError=null,last=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,500);};
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const cell=(rect,pivot=[rect[2]/2,rect[3]],visibleHeight=rect[3])=>Object.freeze({sourceRect:Object.freeze(rect),pivot:Object.freeze(pivot),visibleHeight});
// Source rectangles are metadata only: no atlas pixels are rewritten or copied.
// Exact alpha bounds are supplied with the generated source-asset manifest.
const ATLAS={
 sloth:{path:ROOT+'sloth-home.png',cells:{sofa:cell([15,65,621,506],[310.5,503],500),fridge:cell([843,32,322,553],[161,550],547),tv:cell([43,654,526,518],[263,515],512),bed:cell([677,624,621,549],[310.5,546],543)}},
 envy:{path:ROOT+'envy-home.png',cells:{settee:cell([78,93,506,436],[253,433],430),mirror:cell([775,63,297,476],[148.5,473],470),console:cell([117,668,429,464],[214.5,461],458),cabinet:cell([764,639,324,509],[162,506],503)}},
 glutton:{path:ROOT+'glutton-kitchen.png',cells:{prep:cell([76,105,512,436],[256,433],430),range:cell([720,81,438,485],[219,482],479),fridge:cell([155,663,327,488],[163.5,485],482),trolley:cell([725,683,420,453],[210,450],447)}},
 lust:{path:ROOT+'lust-bar.png',cells:{bar:cell([48,3,636,580],[318,577],574),backbar:cell([805,1,397,602],[198.5,599],596),booth:cell([47,623,579,548],[289.5,545],542),trolley:cell([787,603,434,549],[217,546],543)}},
 mammon:{path:ROOT+'mammon-office.png',cells:{desk:cell([52,56,737,582],[368.5,579],576),chair:cell([876,15,355,582],[177.5,579],576),drawers:cell([57,666,667,511],[333.5,508],505),trolley:cell([819,633,438,538],[219,535],532)}},
 wrath:{path:ROOT+'wrath-restaurant.png',cells:{table:cell([17,12,618,558],[309,555],552),table2:cell([17,12,618,558],[309,555],552),table3:cell([17,12,618,558],[309,555],552),buffet:cell([695,33,602,519],[301,516],513),chairs:cell([36,600,587,558],[293.5,555],552),booth:cell([677,606,613,555],[306.5,552],549)}}
};
for(const a of Object.values(ATLAS)){Object.freeze(a.cells);Object.freeze(a);}Object.freeze(ATLAS);
// Minimum visible-alpha (>16) contact coordinate in each untouched atlas cell:
// slope * flipped(sourceX-pivotX) - (sourceY-pivotY). A north-wall plane has
// screen slope +.5; a west-wall plane has -.5. These source-pixel measurements
// keep opaque feet on the floor without using transparent rectangle corners.
const GROUND_EDGE=Object.freeze({
 sloth:Object.freeze({sofa:33.75,fridge:-19,tv:8,bed:37.75}),
 envy:Object.freeze({settee:-34.5,mirror:-34.25,console:-60.75,cabinet:-50.5}),
 glutton:Object.freeze({prep:11.5,range:-8,fridge:-20.75,trolley:-30.5}),
 lust:Object.freeze({bar:27,backbar:-11.25,booth:-77.25,trolley:-75}),
 mammon:Object.freeze({desk:-15.25,chair:-43.25,drawers:-45.75,trolley:-39}),
 wrath:Object.freeze({table:48,table2:48,table3:48,buffet:56,chairs:-54.75,booth:-35.75})
});
// x/y are native floor positions; width/depth are the solid furniture footprint.
// Pixel heights use the same zoom-1 scale as native props (the hero is 66 px).
const prop=(key,x,y,width,depth,height,wallHeight,flip=false,existingCollision=false)=>Object.freeze({key,x,y,width,depth,height,wallHeight,flip,existingCollision});
// R438(사용자 2026-11-09 "의자같은경우는 중앙에 각도맞게" · "식탁이랑 의자를 같이 가야지"): 분노 식당의 쓰러진 의자 무리(식탁 없는 의자)를 보스방 왼쪽 벽에서 빼, 보스방 앞 몹 모이는 구역(gatherBounds [4,27,28,39]) 북쪽 벽에 붙인다 — 식탁 앞에 두면 식탁 그림 속 의자와 겹쳐 더 어수선했다(사용자 03:19Z "보스방이 작아서 배치가 다 어렵다면 보스방이전에 몹들이 몰리는 구역에 적절하게"). 보스방에는 의자가 그려진 식탁·찬장·부스(작은 식탁 포함) 세트만 남는다.
//  같은 날 03:40Z "빨간색 원그린 조형물식탁을 아래 원두곳에 각도 맞게 배치": 같은 식탁 세트(의자 포함 그림)를 모이는 구역 두 곳(9.1,30.3)·(19.3,32.1)에 보스방 식탁과 같은 방향(긴 쪽이 x 축)으로 더 놓는다. 같은 그림 칸을 table2·table3 이름으로 다시 쓴다(그림 픽셀은 그대로).
const themes={
 ep1b02:{name:'나태의 거주집',atlas:'sloth',props:[prop('sofa',13.0,7.15,4.4,1.65,165,1.25),prop('fridge',23.4,7.15,1.5,1.2,155,2.25),prop('tv',18.65,7.0,2.2,1.2,110,1.5),prop('bed',7.2,15.2,1.8,3.7,160,.85,true)]},
 ep1b03:{name:'질투의 거주집',atlas:'envy',props:[prop('settee',12.9,7.15,4.1,1.6,165,1.2),prop('mirror',23.6,6.9,1.5,.9,130,2.25),prop('console',18.5,7.0,2.6,1.25,142,1.3),prop('cabinet',7.05,14.2,1.3,1.5,148,2.15,true)]},
 ep1b04:{name:'탐식의 호텔 주방',atlas:'glutton',props:[prop('prep',12.9,7.15,4.0,1.7,165,1.15),prop('range',18.7,7.1,3.0,1.4,165,1.55),prop('fridge',23.7,7.0,1.7,1.3,150,2.35),prop('trolley',7.1,15.4,1.5,1.55,112,1.1,true)]},
 ep1b05:{name:'색욕의 호텔 고급 바',atlas:'lust',props:[prop('bar',13.1,7.15,4.0,1.5,170,1.3),prop('backbar',22.0,7.0,2.4,.95,170,2.4),prop('booth',7.15,13.8,1.65,3.5,165,1.4,true),prop('trolley',7.1,18.0,1.25,1.4,112,.95,true)]},
 ep1b06:{name:'맘몬의 호텔 사장실과 금고',atlas:'mammon',props:[prop('desk',14,7.35,5,1.4,160,1.02,true,true),prop('chair',18,7.4,1.2,1.2,130,1.7),prop('drawers',6.85,15,1.4,4,140,1.35,true,true),prop('trolley',24.5,7,1,1.2,100,1.1)]},
 ep1b07:{name:'불타는 호텔 식당',atlas:'wrath',props:[prop('table',13.1,7.3,3.9,1.7,170,1.05),prop('buffet',21.6,7.1,4.0,1.65,165,1.45),prop('chairs',9.6,26.1,2.2,1.5,132,1.1),prop('table2',9.1,30.3,3.9,1.7,170,1.05),prop('table3',19.3,32.1,3.9,1.7,170,1.05),prop('booth',7.2,17.2,1.8,3.75,170,1.35,true)]}
};
for(const t of Object.values(themes)){Object.freeze(t.props);Object.freeze(t);}Object.freeze(themes);
function propPlane(p){
 const t=themes[p.sinArtZone],c=t&&ATLAS[t.atlas]?.cells[p.sinArtKey];if(!c)return null;
 const tile=typeof TILE==='number'?TILE:34,offset=-GROUND_EDGE[t.atlas][p.sinArtKey]*p.height/c.visibleHeight/tile+.005;
 // Reuse the native vertical world-plane projection. This changes depth only:
 // unlike a camera-facing quad, tall furniture cannot lean through its wall.
 return p.x<8?{ax:p.x+offset,ay:p.y-1,bx:p.x+offset,by:p.y+1}:{ax:p.x-1,ay:p.y+offset,bx:p.x+1,by:p.y+offset};
}
function layout(id,L){
 const t=themes[id];if(!t||!solo()||!L?.storyMapR171||L.samongR103||L.samongR115)return L;
 if(id==='ep1b06'&&!L.mammonBossroom)return L;
 if(L.sinRoomArt===REV&&L.sinRoomArtZone===id)return L;
 let byZone=cache.get(L);if(byZone?.has(id))return byZone.get(id);
 // A restored authored layout may contain this overlay's previous envelopes.
 // Remove only our owned collision records, never native walls or other rooms.
 const walls=L.walls.filter(w=>!(w.sinArtFurniture&&String(w.id||'').startsWith('sin-art:'+id+':'))&&!(w.sinFurniture&&String(w.id||'').startsWith('sin:'+id+':')));
 for(const p of t.props)if(!p.existingCollision)walls.push({id:'sin-art:'+id+':'+p.key,x:p.x,y:p.y,width:p.width,depth:p.depth,height:.01,r98BaseHeight:.01,r115Wall:p.wallHeight,angle:0,
  analyticBounds12:[p.x-p.width/2,p.y-p.depth/2,p.x+p.width/2,p.y+p.depth/2],sinFurniture:true,sinArtFurniture:true});
 const out={...L,walls,sinBossroom:REV,sinBossroomZone:id,sinRoomArt:REV,sinRoomArtZone:id};
 for(const key of['r219Source','r204Source'])if(L[key])Object.defineProperty(out,key,{value:L[key]});
 if(!byZone){byZone=new Map();cache.set(L,byZone);}byZone.set(id,out);stats.layouts++;return out;
}
const previous=window.__STORYWORLD_LAYOUT_HOOK_R204__;
window.__STORYWORLD_LAYOUT_HOOK_R204__=function(id,L){return layout(id,previous?.(id,L)||L);};
const eligible=r=>!!themes[r?.id]&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&solo()&&r.exploration?.sinRoomArt===REV;
// Native collision envelopes must remain in exploration.walls, but even their
// floor-height meshes draw dark rectangles underneath the authored sprites.
// Suppress only their render layers; never change collision records or ordinary
// walls. Remember each exact mask so leaving this scope is fully reversible.
const wallMasks=new WeakMap(),renderFrames=new WeakMap(),wrappedMethods=new WeakSet();
function restoreOwnedWalls(renderer){
 const state=wallMasks.get(renderer);if(!state)return 0;let restored=0;
 for(const [mesh,mask]of state.original){if(mesh.layers)mesh.layers.mask=mask;restored++;}
 wallMasks.delete(renderer);stats.wallMasksRestored+=restored;return restored;
}
function hideOwnedWalls(renderer,frame){
 if(!renderer)return 0;
 const scoped=frame?.layer==='STORY'&&!!themes[frame.zone]&&frame.exploration?.sinRoomArt===REV&&!frame.exploration.samongR103&&!frame.exploration.samongR115&&solo()&&!renderer.disposed;
 if(!scoped){restoreOwnedWalls(renderer);return 0;}
 let state=wallMasks.get(renderer);
 if(state&&(state.generation!==renderer.sceneGeneration||state.layout!==frame.exploration||state.zone!==frame.zone)){restoreOwnedWalls(renderer);state=null;}
 if(!state){state={generation:renderer.sceneGeneration,layout:frame.exploration,zone:frame.zone,original:new Map()};wallMasks.set(renderer,state);}
 const live=new Set();
 for(const row of renderer.wallRows?.values?.()||[]){const mesh=row.mesh||row,w=mesh.userData?.originalWall;
  if(!mesh.layers||!w||!(w.sinArtFurniture||frame.zone==='ep1b06'&&w.mammonFurniture))continue;
  live.add(mesh);if(!state.original.has(mesh)){state.original.set(mesh,mesh.layers.mask);stats.wallMasksHidden++;}mesh.layers.mask=0;
 }
 // Released chunks may be re-admitted with new meshes. Do not retain them or
 // accidentally restore a new mesh using the old chunk's saved layer mask.
 for(const [mesh,mask]of state.original)if(!live.has(mesh)){if(mesh.layers)mesh.layers.mask=mask;state.original.delete(mesh);stats.wallMasksRestored++;}
 return state.original.size;
}
// R113/R115 automatically move ordinary props away from walls and crop their
// feet into the floor. These authored sprites already have a measured ground
// pivot and a matching collision envelope. Retain their original recorder quad
// and source rectangle through that generic postprocessing, including outer
// nested prop scopes. Actor priority, opacity, sight and all other props stay native.
function restoreAuthoredCommands(frame){
 let restored=0;
 for(const command of frame?.commands||[]){const a=command.sinRoomArtAuthored;
  if(!a||command.kind!=='image'||!command.owner?.sinArt||command.owner.id!==a.id)continue;
  const changed=command.sourceRect?.some((v,i)=>v!==a.sourceRect[i])||command.points?.some((p,i)=>p.some((v,j)=>v!==a.points[i][j]));
  if(changed){command.sourceRect=a.sourceRect.slice();command.points=a.points.map(p=>p.slice());restored++;}
 }
 stats.authoredCorrections+=restored;return restored;
}
function wrapRenderer(target,ownOnly=false){
 if(!target)return;
 for(const name of['render','activateTerrain','admitTerrain','clearScene']){
  if(ownOnly&&!Object.hasOwn(target,name))continue;const base=target[name];if(typeof base!=='function'||wrappedMethods.has(base))continue;
  const wrapped=name==='render'?function(frame,...args){renderFrames.set(this,frame);try{restoreAuthoredCommands(frame);hideOwnedWalls(this,frame);}catch(e){fail(e);}return base.call(this,frame,...args);}
   :name==='clearScene'?function(...args){restoreOwnedWalls(this);return base.apply(this,args);}
   :function(...args){const result=base.apply(this,args);try{const frame=renderFrames.get(this);if(frame)hideOwnedWalls(this,frame);}catch(e){fail(e);}return result;};
  wrappedMethods.add(wrapped);target[name]=wrapped;
 }
}
wrapRenderer(window.StoryPhase1?.ThreeRenderer?.prototype);
function rendererInstance(){wrapRenderer(window.__STORYWORLD_PHASE1__?.controller?.state?.three,true);}
if(typeof setInterval==='function')setInterval(rendererInstance,400);rendererInstance();
function apply(r){
 if(!r||!Array.isArray(r.props))return;
 if(!eligible(r)){if(applied.has(r)){r.props=r.props.filter(p=>!p.sinArt);applied.delete(r);}return;}
 const old=applied.get(r);if(old?.layout===r.exploration&&old.props===r.props&&old.items.every(p=>r.props.includes(p)))return;
 const t=themes[r.id],a=ATLAS[t.atlas],items=[];
 r.props=r.props.filter(p=>!p.sinArt);
 if(typeof addImage==='function')addImage(a.path,'sin room '+t.atlas);
 for(const p of t.props){const item={id:'sin-art:'+r.id+':'+p.key,x:p.x,y:p.y,path:a.path,height:p.height,solid:false,visible:true,enabled:true,interactive:false,
   autoTargetEligible6:false,r80PresentationOnly:true,sinArt:true,sinArtZone:r.id,sinArtKey:p.key,sinArtFlip:p.flip};r.props.push(item);items.push(item);}
 applied.set(r,{layout:r.exploration,props:r.props,items});stats.rooms++;stats.props+=items.length;last={zone:r.id,theme:t.name,props:items.map(p=>p.id)};
}
// Only overlapping, noninteractive decorative clutter is suppressed. Native
// doors, loot, notes, memories, NPCs and combat objects always retain ownership.
function covered(p,id){
 if(!p||p.sinArt||p.chest||p.altar||p.name||p.r74Door||p.r81WardDoor||p.r75NPC||p.r75NarrativeNPC||p.interactive||p.solid||p.terrainWall)return false;
 if(/chest|altar|portal|door|note|memory/i.test(String(p.kind||'')+String(p.id||'')))return false;
 return !!(p.r80PresentationOnly||p.visualOnly6||p.decorative)&&!!themes[id]?.props.some(q=>Math.abs(p.x-q.x)<q.width/2+.25&&Math.abs(p.y-q.y)<q.depth/2+.25);
}
function drawOwn(p){
 const t=themes[p.sinArtZone],c=t&&ATLAS[t.atlas]?.cells[p.sinArtKey];if(!c)return;
 const sight=window.__STORYWORLD_SIGHT24__;if(sight?.enabled&&!sight.pointVisible(p.x,p.y))return;
 const row=typeof readyImage==='function'?readyImage(p.path):null;if(!row){if(typeof addImage==='function')addImage(p.path);return;}
 const z=typeof zoom==='number'?zoom:1,q=project(p.x,p.y),scale=p.height*z/c.visibleHeight,w=c.sourceRect[2]*scale,h=c.sourceRect[3]*scale;
 const hero=typeof player!=='undefined'&&player?project(player.x,player.y):null,behind=hero&&q.y>hero.y-3&&q.y-h<hero.y-15&&Math.abs(q.x-hero.x)<w*.45;
 const recorded=[];
 const paint=()=>{ctx.save();try{ctx.globalAlpha*=behind?.36:1;ctx.translate(q.x,q.y);if(p.sinArtFlip)ctx.scale(-1,1);
   ctx.drawImage(row.image,...c.sourceRect,-c.pivot[0]*scale,-c.pivot[1]*scale,w,h);
   const command=Array.isArray(ctx.commands)?ctx.commands.at(-1):null;
   if(command?.kind==='image'&&command.owner?.id==='prop:'+p.id&&Array.isArray(command.points)&&Array.isArray(command.sourceRect)){
    command.sinRoomArtAuthored={id:command.owner.id,sourceRect:command.sourceRect.slice(),points:command.points.map(point=>point.slice())};recorded.push(command);
   }
  }finally{ctx.restore();}};
 if(typeof ctx.scope==='function')ctx.scope({id:'prop:'+p.id,kind:'prop',x:p.x,y:p.y,bodyPath:p.path,alive:true,sinArt:true,r83DoorPlane:propPlane(p)},paint);else paint();
 restoreAuthoredCommands({commands:recorded});stats.draws++;
}
function paintProp(p){
 const r=typeof room!=='undefined'?room:null;
 if(p?.sinArt){if(eligible(r)&&p.sinArtZone===r.id&&p.visible!==false&&p.enabled!==false&&!p.destroyed)try{drawOwn(p);}catch(e){fail(e);}return true;}
 if(eligible(r)&&covered(p,r.id)){stats.hidden++;return true;}return false;
}
// Register inside the native actors-on-top pass to avoid duplicate atlas draws.
const perf=window.__STORYWORLD_PERF_GROUPS_R266__;
if(typeof perf?.registerPropRenderer==='function')perf.registerPropRenderer(paintProp);
else if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...args){if(paintProp(p))return;return base.call(this,p,...args);};}
// Populate before drawObjective enters R266's early prop pass, including the
// first room frame; the timer also handles room construction while paused.
function current(){try{if(typeof room!=='undefined'&&room&&!(typeof loading!=='undefined'&&loading))apply(room);}catch(e){fail(e);}}
if(typeof drawObjective==='function'){const base=drawObjective;drawObjective=function(...args){current();return base.apply(this,args);};}
if(typeof setInterval==='function')setInterval(current,400);current();
window.__STORYWORLD_SIN_ROOM_ART__=Object.freeze({revision:REV,ATLAS,GROUND_EDGE,themes,layout,eligible,apply,covered,drawOwn,paintProp,propPlane,hideOwnedWalls,restoreOwnedWalls,restoreAuthoredCommands,
 inspect:()=>({revision:REV,stats:{...stats},last,lastError,assets:Object.values(ATLAS).map(a=>({path:a.path,cells:Object.keys(a.cells),loaded:typeof readyImage==='function'&&!!readyImage(a.path)})),
  current:typeof room!=='undefined'&&room?{zone:room.id,props:(room.props||[]).filter(p=>p.sinArt).map(p=>({id:p.id,x:p.x,y:p.y,path:p.path,key:p.sinArtKey}))}:null})});
})();

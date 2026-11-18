/* The original authored Pride room remains here. The five revised interiors
 * are owned by sin-room-art.js; Mammon stays in its approved overlay.
 * No original assets, doors, balance or saves change. */
(()=>{'use strict';
if(window.__STORYWORLD_SIN_BOSSROOMS__)return;
const REV='seven-sins-bossrooms-v2-pride',cache=new WeakMap(),stats={layouts:0,scenes:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e?.stack||e).slice(0,500);};
const solo=()=>!window.__STORYWORLD_COOP_SIM_R62__?.mode||window.__STORYWORLD_COOP_SIM_R62__.mode()==='off';
const prop=(id,kind,x,y,width,depth,height)=>Object.freeze({id,kind,x,y,width,depth,height});
const themes=Object.freeze({
 ep1b02:{name:'나태의 집',wood:0x554737,metal:0x62665a,accent:0x56573e,props:[prop('sofa','sofa',14,7.15,4.8,1.9,1.3),prop('fridge','fridge',22,7.1,1.8,1.8,2.35),prop('neglected-papers','papers',6.9,15,1.5,3.6,1.0)]},
 ep1b03:{name:'금이 간 안경',wood:0x50453c,metal:0x63716c,accent:0x77847a,props:[prop('photo-console','photos',14,7.05,5.2,1.65,1.8),prop('cracked-panel','mirror',22,6.85,2.5,1.2,2.3),prop('ordered-cabinet','cabinet',6.9,15,1.5,3.6,1.15)]},
 ep1b04:{name:'탐식의 주방',wood:0x4b3e35,metal:0x747c78,accent:0x72654c,props:[prop('plate-counter','kitchen',14,7.1,5.2,1.8,1.15),prop('stove','stove',22,7.1,3.2,1.8,1.4),prop('waste-counter','waste',6.9,15,1.5,3.6,1.1)]},
 ep1b05:{name:'붉은 하이힐',wood:0x4f3533,metal:0x67606a,accent:0x702f3c,props:[prop('curtain-stage','curtain',14,6.9,5,1.4,2.6),prop('empty-audience','seats',22,7.1,3.6,1.8,1.25),prop('side-seats','side-seats',6.9,15,1.5,3.6,1.15)]},
 ep1b07:{name:'불을 지른 남자',wood:0x39312c,metal:0x575b58,accent:0x7d4e33,props:[prop('scorched-bench','burnt',14,7,4.8,1.6,1.25),prop('cleaning-trolley','trolley',22,7.1,2.4,1.8,1.45),prop('charred-storage','charred',6.9,15,1.5,3.6,1.35)]},
 ep1b08:{name:'하늘에 서려는 자',wood:0x403b3d,metal:0x62686b,accent:0x6f8584,props:[prop('signal-consoles','screens',14,7.05,5.2,1.7,2.1),prop('electrode-couch','electrode',22,7.1,3.2,1.8,1.6),prop('recording-cabinet','records',6.9,15,1.5,3.6,1.4)]}
});
for(const t of Object.values(themes)){Object.freeze(t.props);Object.freeze(t);}
function layout(id,L){
 const t=themes[id];if(id!=='ep1b08'||!t||!solo()||!L?.storyMapR171||L.samongR103||L.samongR115)return L;
 if(L.sinBossroom)return L;if(cache.has(L))return cache.get(L);
 const walls=L.walls.slice();for(const p of t.props)walls.push({id:'sin:'+id+':'+p.id,x:p.x,y:p.y,width:p.width,depth:p.depth,height:.01,r98BaseHeight:.01,r115Wall:p.height,angle:0,analyticBounds12:[p.x-p.width/2,p.y-p.depth/2,p.x+p.width/2,p.y+p.depth/2],sinFurniture:true});
 const out={...L,walls,sinBossroom:REV,sinBossroomZone:id};
 for(const key of['r219Source','r204Source'])if(L[key])Object.defineProperty(out,key,{value:L[key]});
 cache.set(L,out);stats.layouts++;return out;
}
const previous=window.__STORYWORLD_LAYOUT_HOOK_R204__;
window.__STORYWORLD_LAYOUT_HOOK_R204__=function(id,L){return layout(id,previous?.(id,L)||L);};
const eligible=r=>r?.id==='ep1b08'&&r.layer==='STORY'&&!r.samongR103&&!r.samongR115&&solo()&&r.exploration?.sinBossroom;
// Hide only non-interactive old dressing within the new furniture footprints.
const covered=(p,id)=>p&&!p.chest&&!p.altar&&!p.name&&!p.r74Door&&!p.r81WardDoor&&!p.interactive&&!p.solid&&!p.terrainWall&&!/chest|altar|portal|door|note|memory/i.test(String(p.kind||'')+String(p.id||''))&&(p.r80PresentationOnly||p.visualOnly6||p.decorative)&&themes[id]?.props.some(q=>Math.abs(p.x-q.x)<q.width/2+.25&&Math.abs(p.y-q.y)<q.depth/2+.25);
window.__STORYWORLD_PERF_GROUPS_R266__?.registerPropRenderer?.(p=>typeof room!=='undefined'&&eligible(room)&&covered(p,room.id));
if(typeof drawProp==='function'){const base=drawProp;drawProp=function(p,...a){if(typeof room!=='undefined'&&eligible(room)&&covered(p,room.id))return;return base.call(this,p,...a);};}
// Each assembly shares a collision envelope. Small details stay within that envelope.
function pieces(t){
 const list=[];let active;
 const box=(name,x,y,z,w,d,h,m,angle=0)=>list.push({name:active.id+':'+name,x:active.x+x,y:active.y+y,z,w,d,h,m,angle});
 const cyl=(name,x,y,z,r,h,m)=>list.push({name:active.id+':'+name,x:active.x+x,y:active.y+y,z,w:r*2,d:r*2,h,m,cylinder:true});
 const legs=(w,d,h)=>{for(const x of[-w/2+.16,w/2-.16])for(const y of[-d/2+.16,d/2-.16])box('foot',x,y,0,.14,.14,h,'metal');};
 const counter=(w,d,h)=>{legs(w,d,h-.12);box('top',0,0,h-.12,w,d,.12,'top');box('back',0,-d/2+.08,.18,w,.12,h-.3,'wood');};
 const cabinet=(w,d,h)=>{box('case',0,0,.06,w,d,h-.12,'wood');box('cap',0,0,h-.06,w,d,.06,'top');for(let y=-d/2+.55;y<=d/2-.45;y+=1)for(const z of[.35,.8]){box('drawer',w/2-.015,y,z-.16,.035,.9,.31,'top');box('handle',w/2+.035,y,z,.06,.26,.05,'trim');}};
 const plate=(x,y,z)=>{cyl('plate-rim',x,y,z,.3,.045,'paper');cyl('plate-well',x,y,z+.046,.23,.01,'shade');};
 const bottle=(x,y,z)=>{cyl('bottle',x,y,z,.1,.29,'glass');cyl('bottle-neck',x,y,z+.29,.044,.12,'metal');};
 const chair=(x,y,side=false)=>{box('seat',x,y,.48,side?.9:.85,side?.85:.9,.14,'accent');box('seat-back',side?x-.38:x,side?y:y-.38,.6,side?.14:.85,side?.85:.14,.57,'accent');for(const dx of[-.3,.3])for(const dy of[-.3,.3])box('chair-foot',x+dx,y+dy,.02,.09,.09,.46,'wood');};
 for(const p of t.props){active=p;const w=p.width,d=p.depth,h=p.height;
 switch(p.kind){
 case 'sofa':
  box('base',0,0,.14,w,d,.42,'wood');box('back',0,-.72,.48,w,.35,.8,'accent');
  for(const x of[-w/2+.16,w/2-.16])box('arm',x,0,.48,.32,d,.55,'accent');
  for(let i=0;i<3;i++){box('sagging-cushion',-1.45+i*1.45,.04,.55,1.35,1.23,.23-i*.025,'cloth');box('worn-seam',-1.45+i*1.45,.67,.64,1.2,.02,.025,'shade');}
  for(let i=0;i<3;i++)bottle(-1.8+i*.3,-.25,.8);
  box('abandoned-paper',.8,.1,.79,.6,.45,.018,'paper',.1);break;
 case 'fridge':
  box('body',0,0,0,w,d,h,'metal');for(const [z,hh]of[[.12,1.35],[1.54,.7]]){box('door',0,d/2+.035,z,w-.14,.05,hh,'appliance');box('pull',-.55,d/2+.085,z+.23,.065,.06,.38,'shade');}
  box('stain',.35,d/2+.012,.2,.42,.015,.25,'shade');break;
 case 'papers':
  cabinet(w,d,h);for(let i=0;i<4;i++){box('unread-pages',0,-1.2+i*.72,h+.01,.8,.5,.035+i*.014,'paper',i*.04);box('page-line',.03,-1.2+i*.72,h+.08,.46,.025,.008,'shade');}
  for(let i=0;i<3;i++)bottle(.1,-1.25+i*.6,.05);break;
 case 'photos':
  counter(w,d,.85);
  for(const x of[-1.65,0,1.65]){box('picture-frame',x,-.4,.87,1.05,.1,.92,'trim');box('photograph',x,-.338,.94,.89,.02,.76,'paper');box('portrait-shoulders',x,-.32,.99,.46,.012,.26,'shade');box('portrait-head',x,-.32,1.3,.19,.012,.21,'shade');}
  for(const [x,z,a]of[[.08,1.35,.5],[-.14,1.15,-.4]])box('scratched-photo',x,-.3,z,.73,.015,.025,'scar',a);
  break;
 case 'mirror':
  box('plinth',0,0,0,w,d,.32,'wood');box('frame',0,-.25,.32,w-.2,.16,h-.32,'trim');box('glass',0,-.15,.44,w-.4,.03,h-.56,'glass');
  for(const [x,z,a]of[[0,1.45,.5],[.38,.95,-.75],[-.4,1.65,-.35]])box('crack',x,-.12,z,.9,.015,.022,'shade',a);break;
 case 'cabinet':cabinet(w,d,h);for(const y of[-1.1,0,1.1])box('ordered-book',0,y,h,.7,.55,.07,'paper');break;
 case 'kitchen':
  counter(w,d,h);box('lower-shelf',0,0,.22,w-.2,d-.12,.1,'metal');
  for(const x of[-1.8,-.6,.6,1.8])for(let i=0;i<3;i++)plate(x,0,h+i*.055);
  for(const x of[-1.7,.2,1.5]){box('discard-tray',x,.2,.34,.9,.65,.08,'metal');box('rejected-food',x+.12,.2,.43,.5,.4,.14,'waste');}break;
 case 'stove':
  box('oven',0,0,0,w,d,1.05,'metal');box('oven-window',0,d/2+.01,.2,w-.45,.03,.5,'shade');box('oven-handle',0,d/2+.04,.78,1.1,.06,.06,'trim');
  for(const x of[-.85,.85]){cyl('hob',x,0,1.05,.42,.06,'shade');cyl('pan',x,0,1.12,.34,.13,'metal');box('pan-handle',x+.35,0,1.2,.45,.09,.07,'shade');}break;
 case 'waste':
  counter(w,d,h);for(const y of[-1,1]){cyl('waste-bin',0,y,.02,.52,.75,'metal');cyl('waste-opening',0,y,.78,.45,.025,'shade');box('discarded-food',.13,y,.8,.44,.3,.12,'waste');plate(0,y,h); }break;
 case 'curtain':
  box('stage-plinth',0,0,.01,w,d,.24,'wood');
  for(const x of[-1.85,1.85]){box('curtain-side',x,-.35,.26,1.05,.22,2.2,'accent');for(const dx of[-.36,-.12,.12,.36])box('velvet-fold',x+dx,-.2,.3,.09,.1,2.1,'cloth');}
  box('valance',0,-.35,2.38,w,.28,.2,'accent');
  for(const x of[-.65,-.22,.22,.65])box('suspended-thread',x,-.36,.45,.018,.018,1.8,'thread');
  // Two unoccupied red shoes on the rear stage edge, not loot.
  for(const x of[-.42,.42]){box('shoe-toe',x,.25,.26,.42,.55,.12,'accent');box('shoe-heel',x,.02,.26,.1,.1,.32,'accent');box('shoe-upper',x,.09,.48,.25,.25,.09,'accent');}break;
 case 'seats':for(const x of[-1.15,0,1.15])chair(x,0);break;
 case 'side-seats':for(const y of[-1.15,0,1.15])chair(0,y,true);break;
 case 'burnt':
  legs(w,d,.53);box('seat',0,.1,.53,w,d-.2,.14,'wood');
  for(const x of[-2,-.8,.5,1.9])box('scorched-back-slat',x,-.6,.65,.25,.12,.42+(x+2)*.04,'shade',x*.02);
  for(const x of[-1.7,-.3,1.2])box('ash-mark',x,.08,.68,.72,.5,.015,'ash',x*.1);break;
 case 'trolley':
  for(const x of[-.85,.85])for(const y of[-.6,.6]){cyl('wheel',x,y,0,.16,.15,'shade');box('upright',x,y,.15,.075,.075,1.12,'metal');}
  for(const z of[.25,.95])box('cart-tray',0,0,z,w-.2,d-.2,.1,'metal');
  cyl('bucket',-.48,0,1.05,.38,.35,'metal');cyl('bucket-open',-.48,0,1.4,.31,.02,'shade');box('folded-cloth',.48,0,1.06,.7,.7,.12,'ash');box('discarded-tray',0,.08,.36,1.3,.8,.06,'trim');break;
 case 'charred':
  cabinet(w,d,h);for(const y of[-1.25,0,1.2]){box('burn-scar',w/2+.04,y,.15,.015,.2,.8,'shade');box('ash-on-top',0,y,h,.65,.45,.018,'ash');}break;
 case 'screens':
  counter(w,d,.85);box('console-front',0,.65,.15,w,.12,.65,'metal');
  for(const x of[-1.7,0,1.7]){box('monitor-case',x,-.25,.9,1.45,.35,1.08,'shade');box('screen',x,-.061,1.02,1.2,.025,.81,'glass');for(let i=0;i<3;i++)box('record-lines',x,-.044,1.15+i*.19,.85-i*.14,.012,.025,'accent');}
  for(let i=0;i<7;i++){box('signal-terminal',-2.1+i*.7,.42,.87,.16,.2,.065,'accent');box('rear-cable',-2.1+i*.7,-.7,.04,.035,.035,1.8,'shade');}break;
 case 'electrode':
  legs(w,d,.58);box('couch',0,0,.58,w,d,.22,'metal');box('padding',0,0,.8,w-.25,d-.2,.16,'cloth');box('headrest',1.05,0,.96,.6,d-.2,.24,'cloth');
  for(const x of[-1.25,1.25]){box('electrode-post',x,-.68,.8,.06,.06,.75,'metal');box('electrode-terminal',x,-.56,1.48,.25,.28,.07,'trim');}
  for(const x of[-.8,.3])box('restraint-band',x,0,.97,.1,d-.18,.035,'shade');break;
 case 'records':
  cabinet(w,d,h);for(const y of[-1.1,0,1.1]){box('record-unit',w/2+.03,y,.23,.04,.7,.75,'metal');for(let z=.35;z<1;z+=.2)box('record-slot',w/2+.055,y,z,.02,.52,.025,'shade');}break;
 }
 }
 return list;
}
const plans=new Map([['ep1b08',pieces(themes.ep1b08)]]);
function release(r){const o=r.__sinBossroom;if(!o)return;if(o.generation===r.sceneGeneration){o.group.removeFromParent();for(const a of o.resources){r.spatialResources.delete(a);a.dispose?.();}}delete r.__sinBossroom;}
function build(r,L,id){
 release(r);const T=r.T,t=themes[id],resources=new Set(),group=new T.Group();group.name='seven-sins:'+id;
 const resource=o=>{r.spatialResources.add(o);resources.add(o);return o;};
 const colors={wood:t.wood,top:t.wood+0x171511,metal:t.metal,accent:t.accent,trim:0x887255,paper:0xb0a58a,shade:0x302c2c,cloth:t.accent,glass:0x647975,scar:0x402d2d,waste:0x61543c,ash:0x817665,thread:0x8c8277,appliance:0x7f8781};
 const mats={};for(const [key,color]of Object.entries(colors)){const m=resource(new T.MeshStandardMaterial({color,roughness:.9,metalness:key==='metal'?.28:.08}));if(r.sightState24)window.StoryPhase1.attachSight24?.(m,r.sightState24);mats[key]=m;}
 // Read-only reuse of the same painted school wood crop as the approved Mammon room.
 const gen=r.sceneGeneration,im=new Image();im.onload=()=>{if(r.disposed||r.sceneGeneration!==gen||r.__sinBossroom?.group!==group)return;const c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,0,0,1024,1024,0,0,256,256);const tx=resource(new T.CanvasTexture(c));tx.colorSpace=T.SRGBColorSpace;for(const key of['wood','top']){mats[key].map=tx;mats[key].color.multiplyScalar(1.4);mats[key].needsUpdate=true;}};im.onerror=()=>{if(!r.disposed&&r.sceneGeneration===gen&&r.__sinBossroom?.group===group)fail(Error('seven-sins wood texture unavailable'));};im.src='assets/r118/tiles/school.webp';
 const geometries=new Map();
 for(const p of plans.get(id)){const key=[!!p.cylinder,p.w,p.d,p.h].join(':');if(!geometries.has(key))geometries.set(key,resource(p.cylinder?new T.CylinderGeometry(p.w/2,p.w/2,p.h,16):new T.BoxGeometry(p.w,p.h,p.d)));const o=new T.Mesh(geometries.get(key),mats[p.m]);o.position.set(p.x,p.z+p.h/2,p.y);if(p.angle)o.rotation.z=p.angle;o.name='sin:'+id+':'+p.name;o.layers.set(2);o.userData.presentationOnly=true;group.add(o);}
 r.spatialRoot.add(group);r.__sinBossroom={group,resources,generation:r.sceneGeneration,L};stats.scenes++;
}
function before(r,frame){const L=frame?.exploration,id=frame?.zone;if(frame?.layer!=='STORY'||id!=='ep1b08'||!L?.sinBossroom||!solo()){release(r);return;}if(!r.spatialBuilt)return;if(!r.__sinBossroom||r.__sinBossroom.generation!==r.sceneGeneration||r.__sinBossroom.L!==L)build(r,L,id);}
const C=window.StoryPhase1?.ThreeRenderer?.prototype,wrap=fn=>function(frame){try{before(this,frame);}catch(e){fail(e);}return fn.apply(this,arguments);};if(C?.render)C.render=wrap(C.render);
const wrapped=new WeakSet();function instance(){const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(r&&Object.hasOwn(r,'render')&&!wrapped.has(r)){wrapped.add(r);r.render=wrap(r.render);}}
if(typeof setInterval==='function')setInterval(instance,500);instance();
function fallback(){
 if(typeof room==='undefined'||!eligible(room)||window.__STORYWORLD_PHASE1__?.controller?.state?.three||typeof project!=='function')return;
 const t=themes[room.id],z=(typeof TILE==='number'?TILE:34)*Math.sqrt(1.5)*(typeof zoom==='number'?zoom:1),hex=n=>'#'+n.toString(16).padStart(6,'0');
 const face=(a,c)=>{ctx.beginPath();a.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=c;ctx.fill();};
 ctx.save();try{for(const p of t.props){const x=p.x-p.width/2,y=p.y-p.depth/2,b=[[x,y],[x+p.width,y],[x+p.width,y+p.depth],[x,y+p.depth]].map(([x,y])=>project(x,y)),h=Math.min(p.height,1.4),a=b.map(q=>({x:q.x,y:q.y-h*z}));face([a[1],a[2],b[2],b[1]],hex(t.wood));face([a[2],a[3],b[3],b[2]],hex(t.metal));face(a,hex(t.accent));}}finally{ctx.restore();}
}
if(typeof drawObjective==='function'){const base=drawObjective;drawObjective=function(...a){const out=base.apply(this,a);fallback();return out;};}
window.__STORYWORLD_SIN_BOSSROOMS__=Object.freeze({revision:REV,themes,layout,covered,inspect:()=>({revision:REV,stats:{...stats},lastError})});
})();

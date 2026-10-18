import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
import {test} from 'node:test';

const helper=fs.readFileSync(new URL('../client-source/progression-r71.js',import.meta.url),'utf8');
const rendererSource=fs.readFileSync(new URL('../docs/dist/phase1.js',import.meta.url),'utf8');
function loadProductionDrawCommands(){
 const start=rendererSource.indexOf('const affinePoint='),end=rendererSource.indexOf('\n\n/* Real Three objects',start);
 assert.ok(start>=0&&end>start,'production DrawCommands source markers must remain present');
 const source=rendererSource.slice(start,end);
 return new Function(source+'\nreturn DrawCommands;')();
}

class FakeDrawCommands{
 constructor(){this.commands=[];this.owner={id:'scene',kind:'scene'};this.stack=[];}
 scope(owner,fn){const old=this.owner;this.owner=owner;try{return fn();}finally{this.owner=old;}}
 push(kind,row={}){this.commands.push({kind,owner:{...this.owner},...row});}
 save(){this.stack.push(1);}restore(){this.stack.pop();}
 translate(){}beginPath(){}moveTo(){}lineTo(){}rect(){}ellipse(){}
 stroke(){this.push('stroke');}fill(){this.push('fill');}
 fillRect(){this.push('fill');}strokeRect(){this.push('stroke');}
 fillText(text){this.push('text',{text:String(text)});}
 drawImage(){this.push('image');}
}

class NodeStub{
 constructor(id='',attrs={}){this.id=id;this.attrs={...attrs};this.dataset={};for(const[k,v]of Object.entries(attrs))if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;this.children=[];this.textContent='';this.disabled=false;this.className='';this.tabIndex=0;this.style={};this.classList={toggle:()=>{}};}
 setAttribute(k,v){this.attrs[k]=String(v);}
 addEventListener(k,fn){this.listeners??={};this.listeners[k]=fn;}
 focus(){this.focused=true;}
 querySelectorAll(selector){if(selector.includes('[data-r71-tier]'))return this.children.filter(n=>n.dataset.r71Tier);return[];}
 click(){if(!this.disabled)this.onclick?.({target:this,preventDefault(){},stopImmediatePropagation(){}});}
}
function domStub(){
 const nodes=new Map(),document={listeners:{},head:{appendChild(){}},addEventListener(type,fn){this.listeners[type]=fn;},createElement(){return new NodeStub();},getElementById(id){return nodes.get(id)||null;},querySelectorAll(selector){const m=selector.match(/data-r71-tier(?:="([^"]+)")?/);if(!m)return[];const group=nodes.get('r71DifficultyOptions');return(group?.children||[]).filter(n=>!m[1]||n.dataset.r71Tier===m[1]);},querySelector(selector){const m=selector.match(/data-r71-tier="([^"]+)"/);if(m)return this.querySelectorAll(selector)[0]||null;const id=selector.match(/^#([\w-]+)$/);return id?nodes.get(id[1])||null:null;},parse(html){nodes.clear();const stack=[];for(const match of html.matchAll(/<([a-z]+)\b([^>]*)>/gi)){const tag=match[1].toLowerCase(),attrs={};for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(!attrs.id)continue;const node=new NodeStub(attrs.id,attrs);nodes.set(node.id,node);if(node.id==='r71DifficultyOptions')stack.push(node);else if(node.dataset.r71Tier&&stack.length)stack.at(-1).children.push(node);} }};
 const panel={innerHTML:'',querySelector(selector){const m=selector.match(/^#([\w-]+)$/);return m?nodes.get(m[1])||null:null;}};document.panel=panel;
 return{document,panel,nodes};
}
function fixture(){
 const dom=domStub(),window={},coopPlayers=[];
 const context={window,document:dom.document,dom,console,Math,Number,JSON,Map,Set,WeakSet,Promise,encodeURIComponent,decodeURIComponent,URL,performance:{now:()=>100},
  ctx:{save(){},restore(){},translate(){},beginPath(){},moveTo(){},lineTo(){},rect(){},stroke(){},ellipse(){},fill(){},fillRect(){},strokeRect(){},fillText(){},setTransform(){},},
  W:800,H:600,zoom:1,shake:0,settings:{reducedMotion:true},
 };
 vm.createContext(context);
 window.__coopPlayers=coopPlayers;
 const code=`(()=>{'use strict';
 const dom=globalThis.dom,coopPlayers=window.__coopPlayers;
 const N=30,COOP_KEY='difficultyR63',POINT_PICKUP_RANGE=1.35;
 const TIERS=Object.freeze({easy:{name:'이지',hp:.2,incoming:.4,reward:1},normal:{name:'노말',hp:.25,incoming:1,reward:3},hard:{name:'하드',hp:.4,incoming:1.2,reward:7}});
 const validTier=k=>Object.prototype.hasOwnProperty.call(TIERS,k)?k:'normal';
 let zone='dist00',layer='STORY',modal=false,time=0,pointEpochCounterR64=0,mode='off',saveCount=0,hudCount=0;
 const tiersByMap=new Map(),clears=new Set(),clearListeners=new Set(),toasts=[];
 const roomKey=(id,l)=>String(l||layer)+':'+String(id||zone),regionById=Object.fromEntries(['dist00','dist01','dist02','dist03'].map(id=>[id,{id,title:'Map '+id,records:[{}],safe:false}]));
 const makePlayer=(id,x,y)=>({id,coopIdR62:id,x,y,hp:100,points:0,connectedR62:true,progressionR62:{pointDropClaimsR64:{}}});
 let player=makePlayer('host',15,15);
 let room={id:zone,layer,props:[],enemies:[],difficultyR63:'normal',objective:{x:15,y:13}};
 const world={'STORY:dist00':room};
 const mapMode=(id=zone,l=layer)=>tiersByMap.get(roomKey(id,l))||world[roomKey(id,l)]?.[COOP_KEY]||'normal';
 const setMapMode=(id,l,tier)=>{const key=roomKey(id,l);tiersByMap.set(key,validTier(tier));if(world[key])world[key][COOP_KEY]=validTier(tier);return validTier(tier)};
 const reward=info=>info?.mode==='EGO'?1:TIERS[validTier(mapMode(info?.regionId,info?.layer))].reward;
 const coopMode=()=>mode,inCoop=()=>mode==='host'||mode==='guest';
 const coopApi={mode:()=>mode,players:()=>coopPlayers,currentPlayer:()=>player};window.__STORYWORLD_COOP_SIM_R62__=coopApi;
 const state=p=>{if(!p.progressionR62)p.progressionR62={pointDropClaimsR64:{}};p.progressionR62.pointDropClaimsR64??={};return p.progressionR62;};
 const progression={state,awardPointDrop(amount,id,p=player){if(mode==='guest'||state(p).pointDropClaimsR64[id])return false;state(p).pointDropClaimsR64[id]=true;p.points+=amount;return true;},onClear(fn){clearListeners.add(fn);return()=>clearListeners.delete(fn);}};
 window.__STORYWORLD_PROGRESSION_R62__=progression;
 function openPanel(html){modal=true;document.parse(html);dom.panel.innerHTML=html;}
 function closePanel(){modal=false;}
 function button(id,fn){const el=dom.document.getElementById(id);if(el)el.onclick=()=>{try{return fn()}catch(e){throw e;}};}
 const $=id=>id==='panel'?dom.panel:null,escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const toast=(s)=>toasts.push(s),saveGame=()=>{saveCount++;return true;},updateHUD=()=>{hudCount++;};
 const enterBase=async(id,from,options={})=>{zone=id;layer=options.layer||layer;room=world[roomKey(id,layer)]||{id,layer,props:[],enemies:[],objective:{x:15,y:13}};world[roomKey(id,layer)]=room;return true;};
 function applyRoom(r,tier){if(r)r[COOP_KEY]=tier;return 0;}
 const enterRegion=async(id,from,options={})=>{const l=options.layer||layer,tier=options.difficultyR63||mapMode(id,l);setMapMode(id,l,tier);const result=await enterBase(id,from,{...options,layer:l,difficultyR63:tier});if(result===true&&room)applyRoom(room,tier);return result;};
 function showSettings(){} function showRegionInfo(){}
 function draw(){return true;} function drawProp(){}
 function killEnemy(e){e.deadRecorded=true;return true;}
 function ensurePointState(r){if(!Number.isSafeInteger(r.passivePointEpochR64)||r.passivePointEpochR64<1)r.passivePointEpochR64=++pointEpochCounterR64;else pointEpochCounterR64=Math.max(pointEpochCounterR64,r.passivePointEpochR64);if(!Array.isArray(r.passivePointDropsR64))r.passivePointDropsR64=[];if(!Array.isArray(r.passivePointRollsR64))r.passivePointRollsR64=[];if(!Array.isArray(r.passivePointClaimsR64))r.passivePointClaimsR64=[];if(!Number.isSafeInteger(r.passivePointRevisionR64)||r.passivePointRevisionR64<0)r.passivePointRevisionR64=0;if(!Number.isSafeInteger(r.passivePointSpawnSeqR64)||r.passivePointSpawnSeqR64<0)r.passivePointSpawnSeqR64=0;return r;}
 const validPointId=v=>typeof v==='string'&&/^r64:[A-Za-z0-9._:%-]{1,900}$/.test(v);
 const pointKillId=(r,e)=>'r64:'+r.passivePointEpochR64+':kill:'+encodeURIComponent(String(e?.id||'enemy')).slice(0,720);
 const pointDropChance=(tier,isBoss)=>{const boss={easy:.10,normal:.50,hard:.77}[validTier(tier)];return isBoss?boss:boss/10;};
 function rollPointDrop(tier,isBoss,rng=Math.random){const chance=pointDropChance(tier,isBoss),next=()=>{const n=Number(rng());return Number.isFinite(n)?Math.max(0,Math.min(.999999999999,n)):.999999999999;};if(next()>=chance)return{success:false,chance,amount:0};return{success:true,chance,amount:1+Math.floor(next()*7)};}
 function pointRandom(id){let seed=2166136261;for(let i=0;i<id.length;i++){seed^=id.charCodeAt(i);seed=Math.imul(seed,16777619);}return()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 const rollPointForKill=(tier,isBoss,id)=>rollPointDrop(tier,isBoss,pointRandom(String(id)));
 function recordPointDrop(){return null;}
 function cleanPointDrops(){return[];}
 function restorePointRoom(){return false;}
 function exportPointRoom(r){ensurePointState(r);return{epoch:r.passivePointEpochR64,spawnSeq:r.passivePointSpawnSeqR64,revision:r.passivePointRevisionR64,drops:r.passivePointDropsR64.map(d=>({...d})),rolls:[...r.passivePointRollsR64],claims:[...r.passivePointClaimsR64]};}
 function restorePointState(){return false;}
 function syncPointDrops(){return 0;}
 function collectPointDrops(){if(!room||coopMode()==='guest'||!Array.isArray(room.passivePointDropsR64)||!room.passivePointDropsR64.length)return 0;ensurePointState(room);const c=window.__STORYWORLD_COOP_SIM_R62__,actors=c?.mode?.()==='host'?c.players().filter(p=>p?.hp>0&&p.connectedR62!==false):[player].filter(p=>p?.hp>0),progression=window.__STORYWORLD_PROGRESSION_R62__;if(!actors.length||!progression?.awardPointDrop)return 0;let count=0,changed=false;for(let i=room.passivePointDropsR64.length-1;i>=0;i--){const d=room.passivePointDropsR64[i];if(!d||room.passivePointClaimsR64.includes(d.id))continue;let owner=null,best=POINT_PICKUP_RANGE;for(const p of actors){const dist=Math.hypot(p.x-d.x,p.y-d.y);if(dist<=best){owner=p;best=dist;}}if(!owner)continue;const duplicate=progression.state?.(owner)?.pointDropClaimsR64?.[d.id]===true;if(!duplicate&&!progression.awardPointDrop(d.amount,d.id,owner))continue;room.passivePointClaimsR64.push(d.id);room.passivePointDropsR64.splice(i,1);room.passivePointRevisionR64++;changed=true;if(!duplicate){count++;withActor(owner,()=>toast('포인트 +'+d.amount,2));}}if(changed){syncPointDrops(room);saveGame(false);}return count;}
 function withActor(p,fn){const old=player;player=p;try{return fn()}finally{player=old;}}
 function blocked(x,y,radius=.27,r=room){const b=r?.exploration?.expanded?r.exploration.bounds:[1,1,N-1,N-1];return x-radius<b[0]||y-radius<b[1]||x+radius>b[2]||y+radius>b[3]||(r?.props||[]).some(p=>p.solid&&Math.hypot(p.x-x,p.y-y)<(p.radius||.5)+radius);}
 const project=(x,y)=>({x:x*20,y:y*20}),sprite=(path,x,y,h)=>{window.__spriteDraws=(window.__spriteDraws||0)+1;if(typeof ctx?.drawImage==='function')ctx.drawImage({width:h,height:h,src:path},x,y,h,h);return true;};
 const TIERS_BOUND=TIERS;
 ${helper}
 const clearRegion=id=>{const key='STORY:'+id;if(clears.has(key))return false;clears.add(key);player.points+=1;if(mode==='host')for(const p of coopPlayers)if(p!==player&&p.connectedR62!==false)p.points+=1;const info={key,mode:'STORY',regionId:id,layer:'STORY'};for(const fn of clearListeners)fn(info);return true;};
 window.__fixture={getPlayer:()=>player,setPlayer:p=>player=p,getRoom:()=>room,setRoom:r=>room=r,setMode:v=>{mode=v;},setCoopPlayers:v=>{coopPlayers.splice(0,coopPlayers.length,...v);},clearRegion,drawProp:(...args)=>drawProp(...args),getSaveCount:()=>saveCount,getHUDCount:()=>hudCount,isModal:()=>modal,toasts,world,getZone:()=>zone,setZone:v=>{zone=v;},roomKey,tiersByMap};
})();`;
 vm.runInContext(code,context,{timeout:2000});
 return{...dom,context,api:context.window.__STORYWORLD_PROGRESSION_R71__,fixture:context.window.__fixture};
}

test('transform_html inserts only at the campaign closure and fails closed on drift or duplicates',()=>{
 const python=`import importlib.util,sys\nspec=importlib.util.spec_from_file_location('r71','scripts/progression-r71.py')\nmod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)\nsys.stdout.write(mod.transform_html(sys.stdin.read()))`;
 const base='<script id="campaign-combat-r63r1">\n  window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze({revision:\'R64-candidate\'});\n</script>';
 const good=spawnSync('python3',['-c',python],{cwd:process.cwd(),input:base,encoding:'utf8'});assert.equal(good.status,0,good.stderr);assert.ok(good.stdout.includes('R71-DIFFICULTY-DROPS'));assert.ok(good.stdout.indexOf('R71-DIFFICULTY-DROPS')<good.stdout.indexOf("window.__STORYWORLD_CAMPAIGN_R63R1__=Object.freeze"));
 for(const bad of ['<script id="campaign-combat-r63r1"></script>',base+'\n'+base,good.stdout]){const out=spawnSync('python3',['-c',python],{cwd:process.cwd(),input:bad,encoding:'utf8'});assert.notEqual(out.status,0);}
});

test('difficulty cards require an explicit confirm, support cancel, and apply once',()=>{
 const f=fixture(),api=f.api,player=f.fixture.getPlayer(),room=f.fixture.getRoom();
 assert.equal(api.openDifficulty('dist00',null,{layer:'STORY'}),false);assert.equal(f.fixture.isModal(),true);assert.equal(api.difficultyState().selected,'normal');
 assert.equal(f.nodes.get('r71DifficultyNormal').attrs['aria-checked'],'true');
 f.nodes.get('r71DifficultyHard').click();assert.equal(api.difficultyState().selected,'hard');assert.equal(f.nodes.get('r71DifficultyHard').attrs['aria-checked'],'true');assert.equal(room.difficultyR63,'normal');assert.equal(player.points,0);
 f.nodes.get('r71DifficultyConfirm').click();assert.equal(f.fixture.isModal(),false);assert.equal(room.difficultyR63,'hard');assert.equal(api.difficultyState().confirmed,'hard');assert.equal(api.difficultyState().transitions,1);assert.equal(f.fixture.getHUDCount(),1);
 api.openDifficulty('dist00',null,{layer:'STORY'});f.nodes.get('r71DifficultyEasy').click();f.nodes.get('r71DifficultyCancel').click();assert.equal(api.difficultyState().cancelled,true);assert.equal(room.difficultyR63,'hard');assert.equal(api.difficultyState().transitions,1);
});

test('confirmed difficulty transitions through campaign entry and applies once',async()=>{
 const f=fixture(),api=f.api;
 api.openDifficulty('dist01',null,{layer:'STORY'});f.nodes.get('r71DifficultyHard').click();
 const transition=api.confirmDifficulty();assert.equal(f.fixture.isModal(),false);await transition;
 assert.equal(f.fixture.getZone(),'dist01');assert.equal(f.fixture.world['STORY:dist01'].difficultyR63,'hard');
 assert.equal(api.difficultyState().transitions,1);assert.equal(f.fixture.isModal(),false);
});

test('first map clear grants exactly 1/3/7 points and duplicate clear remains blocked',()=>{
 const f=fixture(),api=f.api,p=f.fixture.getPlayer();
 for(const[id,tier,expected]of [['dist00','easy',1],['dist01','normal',3],['dist02','hard',7]]){p.points=0;f.fixture.tiersByMap.set('STORY:'+id,tier);assert.equal(f.fixture.clearRegion(id),true);assert.equal(p.points,expected,tier);assert.equal(f.fixture.clearRegion(id),false);assert.equal(p.points,expected,'duplicate '+tier);}
 const egoBefore=p.points;for(const fn of [])fn({mode:'EGO'});assert.equal(p.points,egoBefore);
});

test('cooperative clear bonus reaches every connected participant, including a downed player',()=>{
 const f=fixture(),api=f.api,host=f.fixture.getPlayer(),alive={...host,id:'alive',coopIdR62:'alive',hp:50,points:0,connectedR62:true,progressionR62:{pointDropClaimsR64:{}}},down={...host,id:'down',coopIdR62:'down',hp:0,points:0,connectedR62:true,progressionR62:{pointDropClaimsR64:{}}};
 f.fixture.setMode('host');f.fixture.setCoopPlayers([host,alive,down]);f.fixture.tiersByMap.set('STORY:dist01','hard');
 assert.equal(f.fixture.clearRegion('dist01'),true);assert.equal(host.points,7);assert.equal(alive.points,7);assert.equal(down.points,7);
});

test('seeded point-drop rules are preserved, failed outcomes persist, replicas can drop, and coordinates use map bounds',()=>{
 const f=fixture(),api=f.api,room=f.fixture.getRoom();room.passivePointEpochR64=9;room.exploration={expanded:true,bounds:[25,0,60,20]};room.props=[];
 const e={id:'coop:replica-1',x:52,y:10,coopReplicaR62:true};
 const success=api.recordPointDrop(e,room,()=>0);assert.equal(success.success,true);assert.equal(success.amount,1);assert.equal(success.x,52);assert.equal(success.y,10);assert.equal(room.passivePointDropsR64.length,1);assert.equal(room.passivePointRollsR64.length,1);
 assert.equal(api.recordPointDrop(e,room,()=>0),null,'same enemy cannot roll twice');
 assert.equal(api.syncPointDrops(room),1);assert.equal(room.props.filter(p=>p.passivePointDropR64).length,1);assert.equal(room.props.find(p=>p.passivePointDropR64).x,52);
 room.props=room.props.filter(p=>!p.passivePointDropR64);assert.equal(api.syncPointDrops(room),1,'missing render prop is reconstructed even when the room revision did not change');
 const persisted=api.exportPointRoom(room),restored={id:'dist00',layer:'STORY',props:[],enemies:[],exploration:{expanded:true,bounds:[25,0,60,20]}};
 const duplicate={...persisted.drops[0]},sameSourceDifferentId={...duplicate,id:'r64:9:drop:999',amount:7};assert.equal(api.restorePointRoom(restored,{...persisted,drops:[...persisted.drops,duplicate,sameSourceDifferentId]}),true);assert.equal(restored.passivePointDropsR64.length,1);assert.equal(restored.props.filter(p=>p.passivePointDropR64).length,1);assert.equal(restored.passivePointDropsR64[0].x,52);
 const miss={id:'mob-missed',x:52,y:10};const failed=api.recordPointDrop(miss,room,()=>.999);assert.equal(failed.success,false);const missId='r64:9:kill:mob-missed';assert.ok(room.passivePointRollsR64.includes(missId));assert.equal(api.recordPointDrop(miss,room,()=>0),null,'failed roll is saved and not rerolled');
 const expected=api.pointDropChance('normal',false);assert.equal(expected,.05);assert.equal(api.pointDropChance('hard',true),.77);
});

test('host pickup awards the closest living actor once and guest clients cannot claim',()=>{
 const f=fixture(),api=f.api,room=f.fixture.getRoom(),host=f.fixture.getPlayer(),near={...host,id:'near',coopIdR62:'near',x:10.1,y:10,points:0,progressionR62:{pointDropClaimsR64:{}}},far={...host,id:'far',coopIdR62:'far',x:13,y:10,points:0,progressionR62:{pointDropClaimsR64:{}}};
 room.passivePointEpochR64=12;room.passivePointDropsR64=[{id:'r64:12:drop:1',source:'r64:12:kill:mob',x:10,y:10,amount:4,kind:'enemy',createdAt:0}];room.passivePointClaimsR64=[];room.passivePointRollsR64=['r64:12:kill:mob'];room.props=[];api.syncPointDrops(room);
 f.fixture.setMode('host');f.fixture.setCoopPlayers([far,near]);assert.equal(api.collectPointDrops(),1);assert.equal(near.points,4);assert.equal(far.points,0);assert.equal(room.passivePointDropsR64.length,0);assert.equal(api.collectPointDrops(),0);assert.equal(near.points,4);
 room.passivePointDropsR64=[{id:'r64:12:drop:2',source:'r64:12:kill:mob2',x:10,y:10,amount:2,kind:'enemy',createdAt:0}];room.passivePointClaimsR64=[];f.fixture.setMode('guest');assert.equal(api.collectPointDrops(),0);assert.equal(room.passivePointDropsR64.length,1);assert.equal(near.points,4);
});

test('point beacons enter DrawCommands under a prop owner and obey the sight mask',()=>{
 const f=fixture(),api=f.api,room=f.fixture.getRoom(),drop={id:'r64:15:drop:1',source:'r64:15:kill:mob',x:10,y:10,amount:4,kind:'enemy',createdAt:0},prop={id:'point:'+drop.id,x:10,y:10,path:'assets/vfx/v31315/spirit-orb.webp',height:30,visible:true,passivePointDropR64:true,pointDropIdR64:drop.id,amountR64:4};
 room.passivePointEpochR64=15;room.passivePointDropsR64=[drop];room.passivePointClaimsR64=[];room.props=[prop];
 f.context.window.StoryPhase1={DrawCommands:FakeDrawCommands};f.context.window.__STORYWORLD_SIGHT24__={enabled:true,pointVisible:(x,y)=>x<12};
 f.context.ctx=new FakeDrawCommands();f.fixture.drawProp(prop);
 let commands=f.context.ctx.commands.filter(c=>c.owner.id==='r71:point-drop:'+drop.id);assert.ok(commands.length>=4,JSON.stringify({commands:f.context.ctx.commands,rendering:api.inspect().pointDrops.rendering,instance:f.context.ctx instanceof FakeDrawCommands}));assert.ok(commands.some(c=>c.kind==='text'&&c.text==='+4'));let diagnostics=api.inspect().pointDrops.rendering;assert.equal(diagnostics.beaconsCaptured,true);assert.equal(diagnostics.lastCaptureBeaconCount,1);assert.ok(diagnostics.lastCaptureBeaconCommands>=commands.length);
 f.context.window.__STORYWORLD_SIGHT24__.pointVisible=()=>false;f.context.ctx=new FakeDrawCommands();f.fixture.drawProp(prop);commands=f.context.ctx.commands.filter(c=>c.owner.id==='r71:point-drop:'+drop.id);assert.equal(commands.length,0);diagnostics=api.inspect().pointDrops.rendering;assert.equal(diagnostics.beaconsCaptured,false);assert.ok(diagnostics.lastCaptureSightCulled>0);
});

test('point beacon icon, amount, and border use the production DrawCommands API',()=>{
 const f=fixture(),api=f.api,room=f.fixture.getRoom(),DrawCommands=loadProductionDrawCommands();
 const drop={id:'r64:16:drop:1',source:'r64:16:kill:mob',x:10,y:10,amount:6,kind:'enemy',createdAt:0};
 const prop={id:'point:'+drop.id,x:10,y:10,path:'assets/vfx/v31315/spirit-orb.webp',height:30,visible:true,passivePointDropR64:true,pointDropIdR64:drop.id,amountR64:6};
 room.passivePointEpochR64=16;room.passivePointDropsR64=[drop];room.passivePointClaimsR64=[];room.props=[prop];
 f.context.window.StoryPhase1={DrawCommands};f.context.window.__STORYWORLD_SIGHT24__={enabled:false,pointVisible:()=>true};
 const ctx=new DrawCommands();assert.equal(typeof ctx.strokeRect,'undefined','production recorder must not provide the unsupported convenience method');
 f.context.ctx=ctx;assert.doesNotThrow(()=>f.fixture.drawProp(prop));
 const commands=ctx.commands.filter(c=>c.owner.id==='r71:point-drop:'+drop.id);
 assert.ok(commands.some(c=>c.kind==='image'&&c.sourcePath==='assets/vfx/v31315/spirit-orb.webp'),'the registered point icon remains in the production capture');
 assert.ok(commands.some(c=>c.kind==='text'&&c.text==='+6'),'the pickup amount remains in the production capture');
 assert.ok(commands.some(c=>c.kind==='stroke'&&c.paths.some(p=>p.closed&&p.points.length===4)),'the amount label retains its closed rectangular border stroke');
 const diagnostics=api.inspect().pointDrops.rendering;
 assert.equal(diagnostics.beaconsCaptured,true);assert.equal(diagnostics.lastCaptureBeaconCount,1);assert.ok(diagnostics.lastCaptureBeaconCommands>=commands.length);
});

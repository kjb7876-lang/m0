'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const root=process.argv[2],source=fs.readFileSync(root+'/r96/client-source/hwando-3d-r1302.js','utf8');
const stub=(url)=>({naturalWidth:1536,naturalHeight:256,src:url});
const A={ready:true,zone:'dist00',layer:'STORY',time:6,events:[]}, room0={id:'dist00'}, p={hero:'hwando',hp:777,attackAnim:.24,attackCD:.46,x:4,y:3,direction:'right'};
let sample={atkT0:6,castT0:-9},records=[],blocked=false,los=true,coOp='off',imageReady=false;
const e={room:room0,player:p,target:'e1',nestedCommands:new WeakSet(),HEROES:{hwando:{range:3.15},slayer:{range:3.3},lauren:{range:3.15},neon:{range:3.15}},
 window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>coOp},__STORYWORLD_HERO_MOTION_R895__:{sample:()=>sample},__STORYWORLD_CURRENT_HERO__:{actions:()=>records}},
 commandArea(c){return c?.points?.length?100:0;},blocked:()=>blocked,clearLine:()=>los,
 cachedSpiritImage:url=>imageReady?stub(url):null,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*33,y:(x+y)*16.5})};
e.ENGINE_HEROES=e.HEROES;
vm.runInNewContext(source.slice(source.indexOf('const echoState='),source.indexOf('const DIR={front'))+'globalThis.echo={planSummon,resetSummon,echoCommand,actualEchoPose,nativeEvidence,echoSnapshot,summonPlacement,existingEchoSlots};',e);
const X=e.echo, r={projection:{worldToScreen:e.project}};
const frame=(rows=[])=>({...A,events:rows});
const shot=(extra={})=>({hero:p.hero,type:'projectile-spawn',at:6,x:4,y:3,serial:71,id:'shot:4',...extra});
const hit=(extra={})=>({hero:p.hero,type:'confirmed-hit',at:6,x:5.5,y:3,target:'e1',damage:40,serial:17,kind:'attack',...extra});
const b=(extra={})=>({kind:'image',image:{src:'test'},sourcePath:'assets/r271/hwando/attack-e.webp',r271:'attack',sourceRect:[192,0,192,256],
 points:[[30,50],[80,50],[80,100],[30,100]],owner:{x:p.x,y:p.y,alive:true,kind:'hero',id:'hero:7'},style:{globalAlpha:.77},order:100,key:'hero:7body',clips:[],...extra});
function reset(id='hwando'){Object.assign(p,{hero:id,hp:777,dashAnim:0,hurtAnim:0,skillAnim:0,ultimateAnim:0,attackAnim:.24,x:4,y:3,moving:false});sample={atkT0:6,castT0:-9};records=[];e.target='e1';e.room=room0;blocked=false;los=true;coOp='off';imageReady=false;}
test('four exact class basics prefer accepted fixed near-caster origin; never moves or modifies game',()=>{
 for(const id of ['seoha','michaela','hunter','gunner']){
  reset(id);const g={};const s=X.planSummon(g,frame([shot()]),b(),id,p,6.01),prior={...p};
  assert.equal(s.family,'ranged');assert.equal(s.placed.x,4.46);assert.equal(s.placed.y,2.54);
  p.x+=.6;p.y+=.3;
  X.planSummon(g,frame(),b(),id,p,6.08);
  assert.equal(s.placed.x,4.46);assert.equal(s.placed.y,2.54);
  assert.equal(p.x,prior.x+.6);assert.equal(p.y,prior.y+.3);
 }
});
test('no, stale, foreign, far or unnumbered shot refuses ranged overlay; delayed exact native receipt creates only one strike',()=>{
 for(const id of ['seoha','michaela','hunter','gunner']){
  reset(id);const g={};const body=b({sourcePath:'assets/r143/attack/'+id+'/attack-e.webp',r143Attack:true});
  const invalid=[shot({hero:'wrong'}),shot({x:7.3}),shot({at:5.934}),shot({at:6.13}),shot({serial:null})];
  const a=X.planSummon(g,frame(),body,id,p,6.01);assert.equal(a.placed,null,id+' without receipt');
  const b0=X.planSummon(g,frame(invalid),body,id,p,6.02);assert.equal(b0.placed,null,id+' wrong receipt');
  const c=X.planSummon(g,frame([...invalid,shot({at:6.055})]),body,id,p,6.058);assert.equal(c.event,71);assert(c.placed);
  const one=X.echoCommand(r,c,[body],id,6.058);assert(one?.summonerEcho);assert.equal(one.owner.x,4.46);
  assert.equal(X.echoSnapshot(g).nativeEvent,71);assert(Math.abs(X.echoSnapshot(g).latency-.003)<1e-6);
  const d0=X.planSummon(g,frame([shot({serial:72,at:6.07})]),body,id,p,6.073);assert.equal(d0.event,71);
  assert.equal(X.echoCommand(r,d0,[body],id,6.073).key,one.key);
  X.resetSummon(g,true);assert.equal(X.planSummon(g,frame([shot()]),body,id,p,6.085).placed,null);
 }
});
test('confirmed selected native target fixes melee anchor, no guessed target or blocked slot',()=>{
 for(const id of ['hwando','slayer','neon','lauren']){
  reset(id);const g={};let s=X.planSummon(g,frame(),b(),id,p,6);assert.equal(s.placed,null);
  s=X.planSummon(g,frame([hit({hero:'other'}),hit({kind:'hazard'}),hit({target:'e2',x:6.1}),hit()]),b(),id,p,6.03);
  assert.equal(s.family,'melee');assert.equal(s.event,17);assert.equal(s.placed.x,5.12);assert.equal(s.placed.y,3);assert(Math.abs(s.acceptLatency-.03)<1e-5);
  const old=s.placed;X.planSummon(g,frame([hit({x:6.1})]),b(),id,p,6.09);assert.equal(s.placed,old);
  blocked=true;s=X.planSummon({},frame([hit()]),b(),id,p,6.01);assert.equal(s.placed,null);
  blocked=false;los=false;s=X.planSummon({},frame([hit()]),b(),id,p,6.01);assert.equal(s.placed,null);
 }
});
test('only native one actor body pose, keeps actual pixels/source rectangle, projects fixed ground point',()=>{
 reset();const g={},body=b();const s=X.planSummon(g,frame([hit()]),body,'hwando',p,6.01);
 const c=X.echoCommand(r,s,[{...body,sourcePath:'assets/vfx/hwando/slash.webp',r271:'fx'},body,{...body,key:'clone',owner:{...body.owner,r945Clone:true}}],'hwando',6.01);
 assert.equal(c.summonerEcho,true);assert.equal(c.owner.x,5.12);assert.equal(c.owner.y,3);
 assert.equal(c.image,body.image);assert.equal(c.sourceRect,body.sourceRect);assert.equal(c.owner.id,'summoner-echo:hwando');
 assert.equal(c.spatialRole,'body');assert.equal(c.style.globalAlpha,.77);assert.equal(body.owner.x,4);assert.equal(body.key,'hero:7body');
 assert(Math.abs(c.points[0][0]-(30+(5.12-4)*33))<1e-6);
 p.x=4.9;const q=b({sourceRect:[576,0,192,256]});const later=X.echoCommand(r,s,[q],'hwando',6.08);
 assert.equal(later.owner.x,5.12);assert.equal(later.sourceRect[0],576);assert.equal(X.echoSnapshot(g).nativeEvent,17);
 assert.equal(X.echoCommand(r,s,[b({clips:[[]]})],'hwando',6.04),null);
});
test('safely reject stale/different action, incomplete evidence, interruption, region switch, and co-op and death',()=>{
 reset();const g={};assert.equal(X.planSummon(g,frame([hit({at:5.90})]),b(),'hwando',p,6.01).placed,null);
 assert.equal(X.planSummon(g,frame([hit({damage:0})]),b(),'hwando',p,6.02).placed,null);
 assert.equal(X.planSummon(g,frame([hit()]),b(),'hwando',p,6.15).placed,null);
 reset();p.moving=true;assert.equal(X.planSummon(g,frame([hit()]),b(),'hwando',p,6.14).placed,null);
 reset();assert.equal(X.planSummon(g,frame([hit()]),b(),'hwando',p,6.04).placed,null); // simulated rewind may not recreate a stale cast
 const live={};const s=X.planSummon(live,frame([hit()]),b(),'hwando',p,6.04);assert(s.placed);
 p.dashAnim=.12;assert.equal(X.planSummon(live,frame(),b(),'hwando',p,6.06).placed,null);
 reset();coOp='guest';assert.equal(X.planSummon({},frame([hit()]),b(),'hwando',p,6).placed,null);
 reset();p.hp=0;assert.equal(X.planSummon({},frame([hit()]),b(),'hwando',p,6).placed,null);
 reset();e.room={id:'other'};assert.equal(X.planSummon(g,{...frame(),zone:'other'},b(),'hwando',p,6.2).placed,null);
});
test('native same-hero attack and skill source allowlist; existing native clone rows untouched',()=>{
 reset();const ok=(id,row,mode='attack')=>X.actualEchoPose(b(row),id,mode);
 assert(ok('slayer',{sourcePath:'assets/r351/slayer/attack-w.webp',r351:'attack'}));
 assert(ok('hunter',{sourcePath:'assets/r425/hunter/attack-r.webp',r425Hunter:0}));
 assert(ok('ego',{sourcePath:'assets/r1048/ego/attack-e.webp',r1048:'attack'}));
 assert(ok('michaela',{sourcePath:'assets/r143/skill/michaela/skill-e.webp'},'skill'));
 assert(ok('lauren',{sourcePath:'assets/r437/lauren/attack-e.webp',r143Attack:true}));
 assert(ok('neon',{sourcePath:'assets/r143/attack/neon/attack-e.webp',r143Attack:true}));
 assert(!ok('ego',{sourcePath:'assets/r1048/ego/attack-e.webp',r1048:'attack',key:'hero:7:r1048g0'}));
 assert(!ok('persona',{sourcePath:'assets/r1113/persona/walk.webp',r1113:true}));
 assert.equal(X.planSummon({},frame([hit({kind:'attack'})]),b(),'hwando',{...p,attackAnim:0,skillAnim:.5},6).placed,null);
 const c=b({owner:{...b().owner,r945Clone:true}});assert(!ok('hwando',c));assert.equal(c.owner.r945Clone,true);
});
test('Persona optional actual directional bake loads exact schema or no stand-in and stops at .50',()=>{
 reset('lauren');const g={},origin= b({sourcePath:'assets/r1173/persona-walk-side.webp'});
 const s=X.planSummon(g,frame([hit()]),origin,'persona',p,6.01);assert(s.placed);assert.equal(X.echoCommand(r,s,[origin],'persona',6.01),null);
 imageReady=true;
 const pose=X.echoCommand(r,s,[origin],'persona',6.25);
 assert(pose);assert.equal(pose.sourcePath,'assets/hero-summon-v1/persona-attack-right.webp');
 assert.equal(pose.sourceRect[0],4*192);assert.equal(pose.sourceRect[2],192);
 assert.equal(X.echoCommand(r,s,[origin],'persona',6.50),null);
});

test('native exact clone slot reuse: count by native slot, not command count, no cloned commands',()=>{
 reset();
 const src=fs.readFileSync(root+'/r96/client-source/hwando-ink-r945.js','utf8'),canon=src.slice(src.indexOf('function echoSlots('),src.indexOf('window.__STORYWORLD_HWANDO_INK_R945__='));
 const live={clones:Array.from({length:7},(_,i)=>({i,x:i+3,y:4,t0:6+i*.01,foe:{id:'real'+i}})),cloneEnd:13,
  phantoms:Array.from({length:3},(_,i)=>({i,x:i+3,y:8,t0:6+i*.025,end:8})),trio:{t0:5.4}};
 const U={on:true,st:()=>live,P:()=>p,CFG:{clones:{life:7}}};vm.runInNewContext(canon+'globalThis.api=echoSlots;',U);
 const rows=U.api(p),cmds=rows.flatMap(n=>[b({owner:{kind:'hero',r945Clone:true,x:n.x,y:n.y}}),b({owner:{kind:'hero',r945Clone:true,x:n.x+.07,y:n.y+.07}})]);
 const independent=b({owner:{kind:'hero',x:22,y:23}});e.nestedCommands.add(independent);cmds.push(independent);
 e.window.__STORYWORLD_CLONE_R767__={live:()=>2,list:()=>[{x:22,y:23,t0:6,life:.3},{x:33,y:34,t0:6,life:.3}]};
 e.window.__STORYWORLD_HWANDO_INK_R945__={echoSlots:U.api};
 let m=X.existingEchoSlots(cmds,p,'hwando',6.1);
 assert.deepEqual(JSON.parse(JSON.stringify(m)),{r767:1,r945Fixed:3,r945Moving:7,r1157:0,suppress:true,visibleFixed:4});
 assert.equal(cmds.length,21);assert.equal(live.clones.length,7);assert.equal(live.phantoms.length,3);assert.equal(live.clones[5].x,8);
 const ally=b({owner:{kind:'hero',id:'hero:r1157:hwando:9',x:4,y:10}});cmds.push(ally);
 e.window.__STORYWORLD_EGO_SUMMON_R1157__={inspect:()=>({summons:[{t0:6,until:11,x:4,y:10}]})};
 assert.equal(X.existingEchoSlots(cmds,p,'ego',6.4).r1157,1);
 assert.equal(X.existingEchoSlots(cmds,p,'ego',12).r1157,0);
});

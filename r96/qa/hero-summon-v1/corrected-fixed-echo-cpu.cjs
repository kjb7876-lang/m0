'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const root=process.argv[2],source=fs.readFileSync(root+'/r96/client-source/hwando-3d-r1302.js','utf8');
const stub=(url)=>{const [naturalWidth,naturalHeight]=url.includes('r425')?[768,512]:url.includes('r351')?[1350,196]:url.includes('r389')?[1536,256]:[3456,214];return {naturalWidth,naturalHeight,src:url};};
const A={ready:true,zone:'dist00',layer:'STORY',time:6,events:[]}, room0={id:'dist00'}, p={hero:'hwando',hp:777,attackAnim:.24,attackCD:.46,x:4,y:3,direction:'right'};
let sample={atkT0:6,castT0:-9},records=[],blocked=false,los=true,coOp='off',imageReady=false;
const e={room:room0,player:p,target:'e1',nestedCommands:new WeakSet(),HEROES:{hwando:{range:3.15},slayer:{range:3.3},lauren:{range:3.15},neon:{range:3.15}},
 window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>coOp},__STORYWORLD_HERO_MOTION_R895__:{sample:()=>sample},__STORYWORLD_CURRENT_HERO__:{actions:()=>records}},
 commandArea(c){return c?.points?.length?100:0;},blocked:()=>blocked,clearLine:()=>los,
 cachedSpiritImage:url=>imageReady?stub(url):null,actorHeight:()=>60,project:(x,y)=>({x:(x-y)*33,y:(x+y)*16.5})};
e.ENGINE_HEROES=e.HEROES;
let nativeRows=[],onBasic=()=>{};
const nativeEvents={get serial(){return nativeRows.at(-1)?.serial??0;},since(serial){return nativeRows.filter(x=>x.serial>serial);}};
e.window.__STORYWORLD_PHASE1__={controller:{bridge:{events:nativeEvents}}};
e.time=6;e.basicAttack=(...args)=>onBasic(...args);
vm.runInNewContext(source.slice(source.indexOf('const echoState='),source.indexOf('const DIR={front'))+'globalThis.echo={planSummon,resetSummon,echoCommand,authoredSidePose,chooseEchoSide,observeSummonLaunch,nativeEvidence,echoSnapshot,summonPlacement,existingEchoSlots};',e);
const X=e.echo, r={projection:{worldToScreen:e.project}};
const frame=(rows=[])=>{
 if(p.hero==='hunter'){
  records=[{hero:p.hero,state:'attack',at:sample.atkT0,origin:{x:4,y:3}}];
  for(const e0 of rows)if(e0.type==='projectile-spawn'&&e0.hero===p.hero){
   const a={id:'e568:attack:9',kind:'attack',heroId:p.hero,at:sample.atkT0};
   X.observeSummonLaunch({since:()=>[e0]},0,{...e0,id:4,owner:'hero',friendly:true,e568HeroActionContext:a},p,e.room,e0.at,a);
  }
 }
 return {...A,events:rows};
};
const shot=(extra={})=>({hero:p.hero,type:'projectile-spawn',at:6,x:4,y:3,serial:71,id:'shot:4',...extra});
const hit=(extra={})=>({hero:p.hero,type:'confirmed-hit',at:6,x:5.5,y:3,target:'e1',damage:40,serial:17,kind:'attack',...extra});
const b=(extra={})=>({kind:'image',image:{src:'test'},sourcePath:'assets/r271/hwando/attack-e.webp',r271:'attack',sourceRect:[192,0,192,256],
 points:[[30,50],[80,50],[80,100],[30,100]],owner:{x:p.x,y:p.y,alive:true,kind:'hero',id:'hero:7'},style:{globalAlpha:.77},order:100,key:'hero:7body',clips:[],...extra});
function reset(id='hwando'){Object.assign(p,{hero:id,hp:777,dashAnim:0,hurtAnim:0,skillAnim:0,ultimateAnim:0,attackAnim:.24,x:4,y:3,moving:false});sample={atkT0:6,castT0:-9};records=[];e.target='e1';e.room=room0;blocked=false;los=true;coOp='off';imageReady=false;}
test('Hunter basic prefer accepted fixed near-caster origin; never moves or modifies game',()=>{
 for(const id of ['hunter']){
  reset(id);const g={};const s=X.planSummon(g,frame([shot()]),b(),id,p,6.01),prior={...p};
  assert.equal(s.family,'ranged');assert.equal(s.placed.x,4.46);assert.equal(s.placed.y,2.54);
  p.x+=.6;p.y+=.3;
  X.planSummon(g,frame(),b(),id,p,6.08);
  assert.equal(s.placed.x,4.46);assert.equal(s.placed.y,2.54);
  assert.equal(p.x,prior.x+.6);assert.equal(p.y,prior.y+.3);
 }
});
test('no, stale, foreign, far or unnumbered shot refuses ranged overlay; delayed exact native receipt creates only one strike',()=>{
 for(const id of ['hunter']){
  reset(id);imageReady=true;const g={};const body=b({sourcePath:'assets/r143/attack/'+id+'/attack-e.webp',r143Attack:true});
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
 for(const id of ['hwando','slayer']){
  reset(id);const g={};let s=X.planSummon(g,frame(),b(),id,p,6);assert.equal(s.placed,null);
  s=X.planSummon(g,frame([hit({hero:'other'}),hit({kind:'hazard'}),hit({target:'e2',x:6.1}),hit()]),b(),id,p,6.03);
  assert.equal(s.family,'melee');assert.equal(s.event,17);assert.equal(s.placed.x,5.12);assert.equal(s.placed.y,3);assert(Math.abs(s.acceptLatency-.03)<1e-5);
  const old=s.placed;X.planSummon(g,frame([hit({x:6.1})]),b(),id,p,6.09);assert.equal(s.placed,old);
  blocked=true;s=X.planSummon({},frame([hit()]),b(),id,p,6.01);assert.equal(s.placed,null);
  blocked=false;los=false;s=X.planSummon({},frame([hit()]),b(),id,p,6.01);assert.equal(s.placed,null);
 }
});
test('only authored fixed side body, accepts no FX, overlays or pose invention',()=>{
 reset();imageReady=true;const g={},body=b();const s=X.planSummon(g,frame([hit()]),body,'hwando',p,6.01);
 const c=X.echoCommand(r,s,[body],'hwando',6.01);
 assert.equal(c.summonerEcho,true);assert.equal(c.owner.x,5.12);assert.equal(c.owner.y,3);
 assert.equal(c.sourcePath,'assets/r283/hwando/r271/attack-e.webp');assert.equal(c.sourceRect[0],6*288);
 assert.equal(c.owner.id,'summoner-echo:hwando');assert.equal(c.style.globalAlpha,.77);assert.equal(body.owner.x,4);
 p.x=4.9;const later=X.echoCommand(r,s,[b()],'hwando',6.08);
 assert.equal(later.owner.x,5.12);assert.equal(later.sourceRect[0],7*288);assert.equal(X.echoSnapshot(g).nativeEvent,17);
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
test('only release three can echo; all other loaded 3D identities and every skill/ultimate stay 3D',()=>{
 for(const id of ['seoha','michaela','gunner','lauren','neon','persona','ego','unknown']){
  reset(id);imageReady=true;
  const s=X.planSummon({},frame([shot(),hit()]),b(),id,p,6.01);
  assert.equal(s.placed,null,id);assert.equal(X.echoCommand(r,s,[b()],id,6.01),null,id);
 }
 for(const id of ['hwando','slayer','hunter']){
  reset(id);for(const action of ['skillAnim','ultimateAnim']){
   p[action]=.5;
   assert.equal(X.planSummon({},frame([shot(),hit()]),b(),id,p,6.01).placed,null);
   p[action]=0;
  }
 }
});
test('stable projection-facing with vertical ties, baked axes and exact assets',()=>{
 reset();imageReady=true;
 const body=b(),C=X.chooseEchoSide,pose=(h,m)=>X.authoredSidePose(h,m,body,r.projection,6,6);
 assert.equal(C({x:4,y:3},{x:3,y:4},'right'),'left');
 assert.equal(C({x:4,y:3},{x:5,y:4},'left'),'left');
 assert.equal(C({x:4,y:3},{x:5,y:4},null),'right');
 assert.equal(C({x:4,y:3},{x:5,y:2},'left'),'right');
 assert(pose('hwando','left').points[1][0]<pose('hwando','left').points[0][0]);
 assert(pose('hwando','right').points[1][0]>pose('hwando','right').points[0][0]);
 assert(pose('slayer','left').sourcePath.endsWith('attack-w.webp'));
 assert(pose('slayer','right').sourcePath.endsWith('attack-e.webp'));
 assert(pose('hunter','left').sourcePath.endsWith('attack-l.webp'));
 assert(pose('hunter','right').sourcePath.endsWith('attack-r.webp'));
 imageReady=false;assert.equal(pose('hunter','right'),null);
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

function overlapCase({real=true,kind='hero-thread-dance-r63',hero='hwando',direct={},thread={},ms=.05,threadAt=6.033,breakLedger=false,changeRoom=false}={}){
 reset(hero);imageReady=true;p.combo=0;p.skillAnim=.263;p.threadDanceAtR63=threadAt;
 sample={atkT0:6.05,castT0:6.05};e.time=6;
 const receipt=hit({serial:31,...direct}),r63=hit({target:'other',serial:39,kind,at:6.033,...thread});
 const row={hero,state:'attack',at:6,origin:{x:4,y:3},target:{id:'e1',x:5.5,y:3}};
 const g={};
 nativeRows=[];records=[];onBasic=()=>{nativeRows.push(receipt);records.push(row);p.combo++;return 'stock';};
 if(real)assert.equal(e.basicAttack(), 'stock');else onBasic();
 if(breakLedger)records.push({...row,state:'skill'});
 if(changeRoom)e.room={id:'new-native-room'};
 nativeRows.push(r63);
 const from={...p},s=X.planSummon(g,frame(nativeRows),b(),hero,p,6+ms);
 assert.deepEqual(p,from,'no actor/gameplay mutation');
 return {s,g,receipt,r63};
}
test('native real A→T overlap retains selected exact basic damage, original floor and first drawn attack',()=>{
 const {s,g,receipt,r63}=overlapCase();
 assert.equal(s.event,receipt.serial);assert.notEqual(s.event,r63.serial);
 assert(s.placed);assert.equal(s.placed.x,5.12);assert.equal(s.until,6.4);
 assert.equal(X.echoCommand(r,s,[b()],'hwando',6.05).owner.x,5.12);
 const old=s.placed;
 p.attackAnim=0;
 sample={atkT0:6.25,castT0:6.25}; // later R63 strike must not retime the original
 const again=X.planSummon(g,frame([]),b(),'hwando',p,6.1);
 assert.equal(again.placed,old);assert.equal(again.event,receipt.serial);assert.equal(again.until,6.4);
 const ongoing=X.planSummon(g,frame([]),b(),'hwando',p,6.3);
 assert.equal(ongoing.placed,old);assert.equal(ongoing.event,receipt.serial);
 assert.equal(X.planSummon(g,frame([receipt,r63]),b(),'hwando',p,6.401).placed,null);
});
test('cannot use ordinary Q, untagged R63, fabricated basics, wrong receipt, stale cast or scene as overlap',()=>{
 for(const a of [
  {real:false},{kind:'skill'},{kind:'hero-splash-r118'},{hero:'slayer'},
  {direct:{target:'wrong'}},{direct:{damage:0}},{direct:{kind:'hero-splash-r118'}},
  {thread:{hero:'slayer'}},{thread:{damage:0}},{thread:{serial:30}},{thread:{at:6.19}},
  {threadAt:5.85},{threadAt:6.2},{breakLedger:true},{changeRoom:true},{ms:.18},
 ])assert.equal(overlapCase(a).s.placed,null,JSON.stringify(a));
});
test('T alone, even when native R63 raises attackAnim, cannot create a fixed 2D echo',()=>{
 reset();imageReady=true;p.skillAnim=.26;p.threadDanceAtR63=6;sample={atkT0:6,castT0:6};
 const only=hit({kind:'hero-thread-dance-r63',serial:90});
 const g={};assert.equal(X.planSummon(g,frame([only]),b(),'hwando',p,6.05).placed,null);
});
test('incremental A frame then T frame retains the existing original token even without A receipt or stable motion onset',()=>{
 reset();imageReady=true;p.combo=0;e.time=6;sample={atkT0:6.01,castT0:-9};
 const receipt=hit({serial:31}),thread=hit({kind:'hero-thread-dance-r63',at:6.07,serial:39,target:'other'});
 const attack={hero:'hwando',state:'attack',at:6,origin:{x:4,y:3},target:{id:'e1',x:5.5,y:3}};
 records=[];nativeRows=[];onBasic=()=>{nativeRows.push(receipt);records.push(attack);p.combo++;};
 e.basicAttack();
 const g={};
 const first=X.planSummon(g,frame([receipt]),b(),'hwando',p,6.025);
 const original=first.placed,expiry=first.until,token=first.token;
 assert(original&&expiry===6.41);
 p.skillAnim=.28;p.threadDanceAtR63=6.07;sample={atkT0:6.07,castT0:6.07};
 assert.equal(X.planSummon(g,frame([thread]),b(),'hwando',p,6.08).placed,original);
 for(const t of [6.12,6.27,6.39]){
  const current=X.planSummon(g,frame([]),b(),'hwando',p,t);
  assert.equal(current.placed,original);assert.equal(current.event,31);
  assert.equal(current.until,expiry);assert.equal(current.token,token);
 }
 assert.equal(X.planSummon(g,frame([]),b(),'hwando',p,6.411).placed,null);
});
test('native A receipt consumed in a prior capture still permits first render on the positive T-only event frame',()=>{
 reset();imageReady=true;p.combo=0;e.time=6;sample={atkT0:6.05,castT0:6.05};
 const receipt=hit({serial:31}),thread=hit({kind:'hero-thread-dance-r63',at:6.05,serial:39,target:'other'});
 records=[];nativeRows=[];onBasic=()=>{
  nativeRows.push(receipt);records.push({hero:'hwando',state:'attack',at:6,origin:{x:4,y:3},target:{id:'e1',x:5.5,y:3}});p.combo++;
 };
 e.basicAttack();p.skillAnim=.28;p.threadDanceAtR63=6.04;
 const s=X.planSummon({},frame([thread]),b(),'hwando',p,6.06);
 assert(s.placed);assert.equal(s.event,31);assert.equal(s.until,6.4);
});

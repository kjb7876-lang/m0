'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const [source,enginePath]=process.argv.slice(2),raw=fs.readFileSync(source,'utf8'),html=fs.readFileSync(enginePath,'utf8');
const native=html.match(/const SAVE=.*?SPEED=([^,]+), TAU=/)[1];
const move=html.slice(html.indexOf('function moveActor('),html.indexOf('\n',html.indexOf('function moveActor(')));
const blink=+html.match(/moveActor\(player,v\.x\*(\d+\.\d+),v\.y\*\1\)/)[1];
assert.equal(blink,3.8);
const speed=vm.runInNewContext(native);
const heroRange=Object.fromEntries(['hwando','neon','lauren','slayer','seoha'].map(id=>[id,+html.match(new RegExp('^ '+id+':\\{[^\\n]+?range:([0-9.]+)','m'))[1]]));
assert.deepEqual(heroRange,{hwando:3.15,neon:3.15,lauren:3.15,slayer:3.3,seoha:8.1});
const near=(a,b)=>Math.abs(a-b)<1e-9;
function lab(hero='seoha'){
 const p={hero,hp:270,x:15,y:15,attackAnim:.24,direction:'right',moving:false};
 let clock=10,mode='off',props=[],los=true,checks=0,overrideBlock=null;
 let sample={atkT0:10,castT0:10};const room={id:'dist00',layer:'STORY'};
 const e={room,player:p,target:'e',nestedCommands:new WeakSet(),
  HEROES:Object.fromEntries(Object.entries(heroRange).map(([id,range])=>[id,{range}])),
  window:{__STORYWORLD_COOP_SIM_R62__:{mode:()=>mode},__STORYWORLD_HERO_MOTION_R895__:{sample:()=>sample}},
  document:{baseURI:'http://local/'},commandArea:()=>100,
  blocked(x,y,r){checks++;return overrideBlock?.(x,y,r)||props.some(v=>Math.hypot(v.x-x,v.y-y)<v.r+r);},
  clearLine:a=>los,VFX:{},actorHeight:()=>60};
e.ENGINE_HEROES=e.HEROES;
 vm.runInNewContext(raw.slice(raw.indexOf('const echoState='),raw.indexOf('const DIR={front:'))+move+
  ';globalThis.logic={planSummon,echoCommand,echoSnapshot,resetSummon,echoReturnAnchor,updateEchoLeash,moveActor};',e);
 const g={},X=e.logic,vp={width:800,height:540};let projectShift=0;
 const proj={tile:34,zoom:1,worldToScreen:(x,y)=>({x:400+projectShift+(x-y)*34*proj.zoom,y:300+(x+y-30)*17*proj.zoom})};
 const renderer={projection:proj};
 const asset=(state='attack',cell=0)=>{
  const q=proj.worldToScreen(p.x,p.y);
  return {kind:'image',image:{src:'test'},imageSize:[768,512],sourcePath:'assets/r143/attack/'+p.hero+'/'+state+'.webp',sourceRect:[cell*192,0,192,256],
   points:[[q.x-30*proj.zoom,q.y-58*proj.zoom],[q.x+45*proj.zoom,q.y-58*proj.zoom],[q.x+45*proj.zoom,q.y+6*proj.zoom],[q.x-30*proj.zoom,q.y+6*proj.zoom]],
   spatialRole:'body',r143Attack:state==='attack',key:'live',style:{globalAlpha:1},owner:{x:p.x,y:p.y,kind:'hero',id:'hero',alive:true,renderHeight:0}};
 };
 const shot=(at=sample.atkT0)=>({hero,type:'projectile-spawn',x:p.x,y:p.y,at,serial:3,id:'shot:4'});
 const hit=(n=heroRange[hero])=>({hero,type:'confirmed-hit',target:'e',at:10,x:15+n,y:15,kind:'attack',damage:18,serial:1});
 const stateDefault=()=>hero==='seoha'&&p.attackAnim>0?[shot()]:[];
 const step=(t=clock,{events=stateDefault(),state='attack',other={},cell=0,owner={}}={})=>{
  clock=t;const frame={time:t,ready:true,zone:'dist00',layer:'STORY',viewport:vp,events,...other};
  const body=asset(state,cell);Object.assign(body.owner,owner);
  const s=X.planSummon(g,frame,body,hero,p,t);
  return {s,row:X.echoCommand(renderer,s,[body],hero,t,frame,body.owner),body};
 };
 const simWalk=(dx,dy,dt)=>{p.moving=true;p.attackAnim=0;X.moveActor(p,dx*speed*dt,dy*speed*dt);};
 return {p,X,step,simWalk,hit,shot,proj,g,e,vp,wall:v=>{props=v;},clear:v=>{los=v;},mode:v=>{mode=v;},at:v=>{sample={atkT0:v,castT0:v};},
  block:v=>{overrideBlock=v;},checks:()=>checks,screen:v=>{projectShift=v;}};
}
test('pinned native walking actually reaches ranged and far legal melee leash, without resetting pose, owner or native timers',()=>{
 const runs=[];
 for(const hero of ['seoha','slayer']){
  const L=lab(hero),ranged=hero==='seoha',a=L.step(10,{events:ranged?[L.shot()]:[L.hit()],cell:1});
  assert(a.row);const from={...a.s.placed},until=a.s.until;let last=a;
  const dx=ranged?-Math.SQRT1_2:-1,dy=ranged?Math.SQRT1_2:0;
  for(let i=1;i<=38;i++){
   const t=10+i/120;
   L.simWalk(dx,dy,1/120);
   const after={x:L.p.x,y:L.p.y};
   last=L.step(t,{state:'walk'});
   assert.deepEqual(after,{x:L.p.x,y:L.p.y}); // render cannot warp the 3D owner
   assert.equal(last.s.until,until);assert.equal(last.row.sourceRect[0],192); // hold true pose, do not restart it
   if(Math.hypot(L.p.x-from.x,L.p.y-from.y)<=(ranged?2.4:4.7)){
    assert.equal(last.s.leash.count,0);assert.deepEqual({...last.s.placed},from);
   } else if(last.s.leash.count){
    assert(Math.hypot(last.row.owner.x-L.p.x,last.row.owner.y-L.p.y)<.8);
    assert.equal(last.s.leash.count,1);assert(last.s.until-t>=.085);break;
   }
  }
  assert.equal(last.s.leash.phase,'warped');
  const back={...last.s.placed},t=last.s.leash.warpAt;
  L.simWalk(-dx,-dy,.06);assert.deepEqual({...L.step(t+.06,{state:'walk'}).s.placed},back);
  assert.equal(L.step(10.4,{state:'walk'}).row,null);
  runs.push({hero,at:+(t-10).toFixed(3),initial:+Math.hypot(from.x-15,from.y-15).toFixed(3),remain:+(until-t).toFixed(3)});
 }
 console.log(JSON.stringify({nativeWalk:speed,manualBlink:blink,legalMelee:heroRange.slayer,runs}));
});
test('ordinary near melee stays on exact admitted target side; legal maximum does not trigger early',()=>{
 for(const distance of [.9,1.5,3.3]){
  const L=lab('slayer'),t0=L.step(10,{events:[L.hit(distance)]});
  const from=t0.s.placed.x;assert(near(from,15+distance-.38));assert.equal(t0.s.leash.phase,'fixed');
  if(distance<3){L.simWalk(-1,0,.31);const out=L.step(10.31,{state:'walk'});assert(near(out.row.owner.x,from));assert.equal(out.s.leash.count,0);}
 }
});
test('hit slice protected, pending uses hysteresis, recovery ends without extending native time',()=>{
 const L=lab('slayer'),a=L.step(10,{events:[L.hit()]}),from=a.s.placed.x;
 L.simWalk(-1,0,.29);const f=L.step(10.14,{state:'walk'});assert.equal(f.s.leash.phase,'pending');assert.equal(f.row.owner.x,from);
 L.simWalk(1,0,.1);const g=L.step(10.18,{state:'walk'});assert.equal(g.s.leash.phase,'fixed');assert.equal(g.row.owner.x,from);
 L.simWalk(-1,0,.10);const r=L.step(10.34,{state:'walk'});
 assert.equal(r.row,null);assert.equal(r.s.leash.reason,'recovery-ended');assert.equal(r.s.until,10.4);
});
test('six bounded arrival choices, same-room LOS and full-quad visibility; unsafe return is dissipate',()=>{
 const cases=[
  L=>L.block((x,y,r)=>r===.29&&x>L.p.x),   // opposite native side selected
  L=>L.block((x,y,r)=>r===.29),
  L=>L.clear(false),
  L=>L.screen(-800),
  L=>{L.vp.height=150;}, // feet outside current viewport
 ];
 cases.forEach((arr,i)=>{
  const L=lab();assert(L.step(10).row);L.simWalk(-1,1,.3);arr(L);
  const before=L.checks(),s=L.step(10.28,{state:'walk'});
  assert(L.checks()-before<=6);
  if(i===0){assert(s.row);assert(s.row.owner.x<L.p.x);}
  else{assert.equal(s.row,null);assert.equal(s.s.leash.phase,'recalled');assert.equal(s.s.leash.count,0);}
 });
});
test('failed early return never re-admits same native action token',()=>{
 const L=lab();assert(L.step(10).row);L.X.moveActor(L.p,-2.7,2.7);L.screen(-1000);
 const old=L.step(10.095);assert.equal(old.s.leash.reason,'no-safe-visible-foot');assert.equal(old.row,null);
 L.screen(0);
 const next=L.step(10.105);assert.equal(next.row,null);assert.equal(next.s.leash.count,0);
});
test('cached native frame follows camera projection without stale screen coords or walk stand-in',()=>{
 const L=lab();const p0=L.step(10,{cell:1});assert(p0.row);const relative=p0.row.points.map(q=>[q[0]-L.proj.worldToScreen(p0.row.owner.x,p0.row.owner.y).x,q[1]-L.proj.worldToScreen(p0.row.owner.x,p0.row.owner.y).y]);
 L.simWalk(-1,0,.085);L.screen(20);L.proj.zoom=1.2;
 const out=L.step(10.085,{state:'walk',cell:0}),at=L.proj.worldToScreen(out.row.owner.x,out.row.owner.y);
 assert.equal(out.row.sourceRect[0],192);assert(near(out.row.points[0][0]-at.x,relative[0][0]*1.2));
 assert.deepEqual({...out.s.placed},{...p0.s.placed});assert.equal(out.s.leash.count,0);
});
test('pause, co-op, native dash, hit reaction, death and zone transition do not resurrect old scenes/actions',()=>{
 for(const [off,recover] of [
  [L=>L.step(10.12,{other:{paused:true}}),L=>L.step(10.14)],
  [L=>{L.mode('host');return L.step(10.12);},L=>{L.mode('off');return L.step(10.14);}],
  [L=>{L.p.dashAnim=.26;L.X.moveActor(L.p,-3.8,0);return L.step(10.12);},L=>{L.p.dashAnim=0;return L.step(10.14);}],
  [L=>{L.p.hurtAnim=.26;return L.step(10.12);},L=>{L.p.hurtAnim=0;return L.step(10.14);}],
  [L=>{L.p.hp=0;return L.step(10.12);},L=>{L.p.hp=270;return L.step(10.14);}],
  [L=>{L.e.room={id:'dist06'};return L.step(10.12,{other:{zone:'dist06'}});},L=>L.step(10.14,{other:{zone:'dist06'}})],
  [L=>{L.X.resetSummon(L.g,true);return L.step(10.12);},L=>L.step(10.14)],
 ]){
  const L=lab();assert(L.step(10).row);assert.equal(off(L).row,null);assert.equal(recover(L).row,null);
  L.at(10.2);assert(L.step(10.2,{other:{zone:L.e.room.id}}).row||L.e.room.id==='dist06'); // new native acceptance is still possible after cancel
 }
});

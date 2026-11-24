import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {installRestoreProbe} from './restore-probe.mjs';

const expected=process.env.SW0027_R1302_SHA||'df560b8bcd35d594f47c1c894d2dc64c7ceed593d20959ff06d3cb26417585d3';
const scenarios=[
 {label:'desktop-64', vp:{width:960,height:540}, actorPx:64},
 {label:'compact-96', vp:{width:390,height:844}, actorPx:96},
];
if(process.argv.includes('--list')){
 console.log(JSON.stringify(scenarios.map(x=>({...x,cases:['2D fallback','idle shoulder orb','real Hunter ranged launch','Hunter no-shot negative','real Hwando and Slayer melee contact','excluded Seoha native 3D attack/skill without echo','ranged/melee single safe return','scene transition and isolated save reload','native A→T same-frame/retained Hwando echo','native T-only hit without echo']})),null,2));
 process.exit(0); // Safe static discovery; before the Playwright import or any socket.
}
const url=new URL(process.env.SW_URL||'http://127.0.0.1:4410/m0/');
assert.equal(url.protocol,'http:');
assert(['127.0.0.1','localhost'].includes(url.hostname));
assert.equal(url.pathname,'/m0/');assert.match(expected,/^[a-f0-9]{64}$/);
assert(!url.username&&!url.password&&!url.search&&!url.hash);
process.env.SW_URL=url.href;
const output=process.env.SW0027_OUTPUT||'r96/qa/hero-summon-v1/evidence';
assert(!fs.existsSync(output)||fs.readdirSync(output).length===0,'new evidence directory required');
fs.mkdirSync(output,{recursive:true});
const {chromium,go,skip}=await import('../r444/lib.mjs');
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={exactR1302SourceSHA256:expected,mode:'disposable native browser fixture, software GPU; not physical-device or natural playthrough',cases:[],idleFrames:[],skillPrerequisites:[]};
// One disposable fresh story profile per viewport. Mirrors the stock r444 bootstrap,
// but verifies Q is really locked BEFORE its ordinary cheat-mode level setup.
async function nativeQState(p){
 return p.evaluate(()=>{
  const G=window.__STORYWORLD_SKILL_GROWTH_R663__,L=window.__STORYWORLD_SKILL_UNLOCK_R1275__,
    P=window.__STORYWORLD_PROGRESSION_R62__,E=window.__STORYWORLD_PHASE1__?.controller?.bridge?.events;
  return {hero:player.hero,lvl:player.level,nativeLevel:L.level(),need:L.at('q'),points:player.points,rank:P.ranks('skillQR663',player),
    cleared:Object.keys(P.state(player).clears||{}).length,lockedLevel:L.locked('q'),locked:G.locked('q'),
    blockedKey:G.inspect().stats.blockedKeys,cd:player.specialCD,anim:player.skillAnim,serial:E?.serial??null,
    variant:window.__STORYWORLD_APPROVED_SIX__?.chosen(player.hero)??null,
    started,modal:!!modal,loading:!!loading,story:!!storyScene};
 });
}
async function bootWithQPrerequisite(browser,sc){
 const ctx=await browser.newContext({viewport:sc.vp,deviceScaleFactor:1});
 try{
  await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
  const p=await ctx.newPage();
  await p.goto(url.href);await p.locator('#campaignNew54').click({timeout:180000});
  await p.locator('#slotConfirmR73').click();
  await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
  await p.evaluate(()=>{settings.autoSkill=false;});await skip(p);
  const study={profile:sc.label,beforeLockedKey:await nativeQState(p)};
  report.skillPrerequisites.push(study);
  const b=study.beforeLockedKey;
  assert(b.started&&!b.modal&&!b.loading&&!b.story&&b.lvl===1&&b.rank===0&&b.lockedLevel&&b.locked,'expected a genuine fresh Q lock');
  await p.keyboard.press('KeyQ');
  const a=study.afterLockedKey=await nativeQState(p);
  assert.equal(a.blockedKey,b.blockedKey+1,'stock capture handler must observe real keyboard lock');
  assert(a.locked&&a.cd===b.cd&&a.anim===0,'locked Q did not become a gameplay cast');
  if(a.serial!==null&&b.serial!==null){
   const ev=await p.evaluate(before=>window.__STORYWORLD_PHASE1__.controller.bridge.events.since(before),b.serial);
   study.lockedKeyEvents=ev;
   assert(!ev.some(e=>e.type==='projectile-spawn'&&e.hero===b.hero),'locked keyboard emitted no native hero projectile');
  }
  study.purchase=await p.evaluate(async()=>{
   const C=window.__STORYWORLD_CHEAT777__,G=window.__STORYWORLD_SKILL_GROWTH_R663__,
    L=window.__STORYWORLD_SKILL_UNLOCK_R1275__,P=window.__STORYWORLD_PROGRESSION_R62__;
   const cap=await C.activate('777');
   const snapshot=()=>({level:player.level,nativeLevel:L.level(),threshold:L.at('q'),points:player.points,
     rank:P.ranks('skillQR663',player),locked:G.locked('q'),lockedLevel:L.locked('q')});
   const before=snapshot();
   if(!cap.ok||before.lockedLevel||before.rank!==0||!before.locked)return {cap,before,error:'expected level-eligible unlearned Q'};
   // Fixture-only starting balance; the tree's genuine purchase consumes the point
   // and records learned Q. Never assign the rank, disable a rule, or fake a cast.
   const credit=Math.max(0,1-before.points);
   if(credit)player.points+=credit;
   const purchase=P.purchase('skillQR663',player);
   return {cap,before,credit,purchase,after:snapshot()};
  });
  const k=study.purchase;
  assert(k.purchase===true&&k.after.rank===1&&!k.after.locked&&!k.after.lockedLevel&&
    k.after.points===k.before.points+k.credit-1,'actual learned state and exact payment, not just level or cooldown');
  await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
  return {ctx,p,study};
 }catch(error){await ctx.close();throw error;}
}
const approx=(a,b,tol=.03)=>Math.abs(a-b)<=tol;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ready=(p,h)=>p.waitForFunction(id=>{
 const S=window.__STORYWORLD_HWANDO3D_R1302__?.inspect(),r=window.__STORYWORLD_PHASE1__?.controller?.state;
 return S?.hero===id&&S.ready&&S.shown&&S.sharedScene&&S.spirit?.phase==='idle'&&S.spirit?.visible&&r.active==='three';
},h,{timeout:120000});
async function hero(p,h,enabled){
 await p.evaluate(async ({h,enabled})=>{
  player.hero=h;player.personaHeroR1113=false;player.egoSovereignR1046=false;
  const side={hwando:['assets/r283/hwando/r271/attack-e.webp'],slayer:['assets/r351/slayer/attack-w.webp','assets/r389/slayer/attack-e.webp'],hunter:['assets/r425/hunter/attack-l.webp','assets/r425/hunter/attack-r.webp']};
  await ensureImages([...heroPaths(h),...(side[h]||[])]);player.attackAnim=0;player.skillAnim=0;player.ultimateAnim=0;
  player.moving=false;auto=false;guide=false;settings.autoSkill=false;
  // Supported native settings entry; does not patch storage or attack behavior.
  window.__STORYWORLD_HWANDO3D_R1302__.set(enabled);
 },{h,enabled});
 if(enabled)await ready(p,h);
}
async function placement(p,h,{requireDamageable=false}={}){
 return p.evaluate(({h,requireDamageable})=>{
  // Select an existing enemy on the authentic map and lock environmental movement/damage
  // in the test context only. We do not create a foe, write its HP, or call hitEnemy.
  for(const e of room.enemies){e.speed=0;e.damage=0;}
  const range=HEROES[h].range;
  // A plus its native splash/cone can clear a whole pack, so R63 (T) also needs another
  // damageable enemy outside the basic splash and direct swing yet inside R63's 11-tile reach.
  // Spare = outside every possible direct swing (any foe within reach of the start) and
  // outside the native R118 basic splash of each of those, yet inside R63's 11-tile reach.
  const splashR=window.__STORYWORLD_COMBAT_R118__?.splashShape?.('basic')?.radius??3;
  const reach=(d,from)=>Math.hypot(d.x-from.x,d.y-from.y)<=range+(d.radius||.4)+.3;
  // Preferred: a spare >4.5 tiles from the basic target (clean local R63 overlaps). If the
  // earlier cases left none, accept any spare outside every swing and its measured splash.
  const far=(o,e,from)=>Math.hypot(o.x-e.x,o.y-e.y)>4.5&&Math.hypot(o.x-from.x,o.y-from.y)>range+1.2;
  const outside=(o,e,from)=>!reach(o,from)&&
   liveEnemies().every(d=>d===o||!(d===e||reach(d,from))||Math.hypot(o.x-d.x,o.y-d.y)>splashR+(o.radius||.4)*.5+.3);
  const base=(o,e,from)=>o!==e&&o.hp>1&&damageable3(o)&&Math.hypot(o.x-from.x,o.y-from.y)<=10.5;
  let pass=0;
  const spareR63=(o,e,from)=>base(o,e,from)&&outside(o,e,from)&&(pass>0||far(o,e,from));
  const looseSpare=e=>liveEnemies().some(o=>o!==e&&o.hp>1&&damageable3(o)&&
    Math.hypot(o.x-e.x,o.y-e.y)>(pass>0?splashR+(o.radius||.4)*.5+.3:4.5)&&Math.hypot(o.x-e.x,o.y-e.y)<=10.5+range);
  for(;pass<(requireDamageable?2:1);pass++){
  for(const e of liveEnemies()){
   if(e.hp<=1||requireDamageable&&!damageable3(e))continue;
   if(requireDamageable&&!looseSpare(e))continue;
   // Ranged genuine directional muzzle can sit nearly three tiles from the caster.
   // Choose safer flight/return geometry from real actors, without forcing damage/aim.
   const melee=h==='hwando'||h==='slayer';
   const amount=melee?range-.07:4.1;
   for(const [ux,uy] of [[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[-.707,-.707],[.707,-.707],[-.707,.707]]){
    const start={x:e.x+amount*ux,y:e.y+amount*uy},end={x:start.x+2.1*ux,y:start.y+2.1*uy};
    if(blocked(start.x,start.y,.29)||blocked(end.x,end.y,.29)||!clearLine(start,e)||!clearLine(start,end))continue;
    if(requireDamageable&&!liveEnemies().some(o=>spareR63(o,e,start)))continue;
    if(requireDamageable&&melee){
     const gap=Math.hypot(e.x-start.x,e.y-start.y);
     const foot={x:e.x+(start.x-e.x)*.38/gap,y:e.y+(start.y-e.y)*.38/gap};
     if(blocked(foot.x,foot.y,.16)||!clearLine(start,foot))continue;
    }
    if(!melee){
     const sector=window.__STORYWORLD_CURRENT_HERO__.sector(e.x-start.x,e.y-start.y);
     const frame=window.__STORYWORLD_PHASE1_ART__.heroFrame(h,'attack',sector),a=frame?.assetFrame;
     let from=start;
     if(a?.muzzle){
      const [sx,sy]=a.sourceRect,[px,py]=a.pivot,k=actorHeight()/zoom/a.visibleHeight;
      const rx=(a.muzzle[0]-sx-px)*k*(frame.nativeHero5?.flip?-1:1),ry=(a.muzzle[1]-sy-py)*k;
      const muzzle={x:start.x+(rx/TILE+2*ry/TILE)/2,y:start.y+(2*ry/TILE-rx/TILE)/2};
      if(!blocked(muzzle.x,muzzle.y,.14))from=muzzle;
     }
     if(room.enemies.some(v=>v!==e&&v.hp>0&&segmentDistance(v.x,v.y,from.x,from.y,e.x,e.y)<v.radius+.20))continue;
     const shells=[-1,1].map(d=>({x:start.x+d*.46,y:start.y-d*.46}));
     if(!shells.some(o=>!blocked(o.x,o.y,.16)&&clearLine(start,o)))continue;
     if(h==='hunter'&&!shells.every(o=>{
      const sx=Math.sign(start.x-o.x)*Math.SQRT1_2,sy=Math.sign(start.y-o.y)*Math.SQRT1_2;
      const end={x:start.x+2.1*sx,y:start.y+2.1*sy};return !blocked(end.x,end.y,.29)&&clearLine(start,end);
     }))continue;
    }
    player.x=start.x;player.y=start.y;player.attackCD=0;player.attackAnim=0;player.moving=false;
    if(Array.isArray(player.path))player.path.length=0;
    if(typeof auto==='boolean')auto=false;
    if(typeof route!=='undefined')route=[];
    if(typeof command!=='undefined')command=null;
    if(typeof cam==='object'){cam.x=start.x;cam.y=start.y;}
    target=e.id;
    if(nearestEnemy(range)?.id!==e.id)continue;
    return {start,enemy:{id:e.id,x:e.x,y:e.y,hp:e.hp},ux,uy,range,sparePass:pass};
   }
  }
  }
  throw Error('authentic dist00 enemy and clear scripted runway unavailable'+(requireDamageable?' '+JSON.stringify({splashR,
   foes:liveEnemies().map(o=>[o.id,+o.x.toFixed(2),+o.y.toFixed(2),Math.round(o.hp),damageable3(o)])}):''));
 },{h,requireDamageable});
}
async function hunterPlacement(p){
 let last=null;
 for(let attempt=0;attempt<3;attempt++){
  const fx=await placement(p,'hunter');
  last=await p.evaluate(async ({start,enemy,range})=>{
   const began=time;
   let stable=0;
   for(let i=0;i<180;i++){
    await new Promise(requestAnimationFrame);
    const drift=Math.hypot(player.x-start.x,player.y-start.y);
    if(drift>.15)return {ok:false,reason:'caster moved before attack',drift};
    const q=window.__STORYWORLD_PHASE1__.controller.state.three.projection.worldToScreen(player.x,player.y);
    const onScreen=Number.isFinite(q?.x+q?.y)&&q.x>0&&q.x<innerWidth&&q.y>0&&q.y<innerHeight;
    if(time-began>=.65&&onScreen&&!loading&&!modal&&player.skillAnim<=0&&
       player.attackAnim<=0&&nearestEnemy(range)?.id===enemy.id)stable++;
    else stable=0;
    if(stable>=3)return {ok:true};
   }
   return {ok:false,reason:'camera or selected target did not settle'};
  },fx);
  if(last.ok)return fx;
 }
 throw new Error('Hunter fixture not ready before attack: '+JSON.stringify(last));
}
async function observer(p,actorPx){
 await p.evaluate(actorPx=>{
  const C=window.__STORYWORLD_PHASE1__.controller;
  const r=C.state.three, api=window.__STORYWORLD_HWANDO3D_R1302__;
  if(!r?.commands?.rows||!r.renderer?.render||!r.canvas)throw Error('actual renderer is not Three/WebGL');
  const base=r.render, orig=Object.getOwnPropertyDescriptor(r,'render');
  const O={rows:[],images:{},frames:{},on:false,serial:C.bridge.events.serial,walk:null,lastTime:null,
   };
  const pixelCanvas=document.createElement('canvas');pixelCanvas.width=pixelCanvas.height=16;
  const pixels=pixelCanvas.getContext('2d',{willReadFrequently:true});
  const commands=r.commands,renderCommands=commands.render,commandDescriptor=Object.getOwnPropertyDescriptor(commands,'render');
  const orbPaintActor=Symbol.for('r101.seoha.legacyOrbActor');
  function observeCommands(rows){
   const tagged=c=>c.owner?.[orbPaintActor]===player;
   const amount=()=>rows.filter(tagged).length;
   const other=()=>rows.filter(c=>c.owner?.r101===true&&!tagged(c)).length;
   const countBefore=amount(),otherBefore=other();
   const value=renderCommands.apply(this,arguments);
   O.stockOrbPaint={before:countBefore,after:amount(),otherBefore,otherAfter:other()};
   return value;
  }
  // Chaining the actual R1302 command hook, never running it twice.
  observeCommands.__r1304=true;commands.render=observeCommands;
  function gpuOrbDiagnostic(mesh){
   mesh.updateWorldMatrix(true,false);
   const pj=r.projection,a=mesh.geometry.attributes.position,pts=[];
   for(let i=0;i<4;i++){
    const v=new r.T.Vector3().fromBufferAttribute(a,i);mesh.localToWorld(v);v.project(r.camera);
    pts.push({x:(v.x+1)*pj.width*.5,y:(1-v.y)*pj.height*.5});
   }
   const d=r.canvas.width/pj.width,dy=r.canvas.height/pj.height;
   const x=Math.max(0,Math.floor(Math.min(...pts.map(o=>o.x))*d)-2);
   const y=Math.max(0,Math.floor(Math.min(...pts.map(o=>o.y))*dy)-2);
   const w=Math.min(r.canvas.width-x,Math.ceil(Math.max(...pts.map(o=>o.x))*d)+2-x);
   const h=Math.min(r.canvas.height-y,Math.ceil(Math.max(...pts.map(o=>o.y))*dy)+2-y);
   if(![x,y,w,h].every(Number.isFinite)||w<3||h<3||w>64||h>64)return {vertices:pts,reason:'invalid/mostly clipped projected ROI'};
   const diag=document.createElement('canvas');diag.width=w;diag.height=h;
   const c=diag.getContext('2d',{willReadFrequently:true});
   const sample=()=>{c.drawImage(r.canvas,x,y,w,h,0,0,w,h);return c.getImageData(0,0,w,h).data;};
   const restoreLayer=r.camera.layers.mask,visible=mesh.visible,shadow=r.renderer.shadowMap.needsUpdate;
   const actual=sample();
   function replay(){
    r.renderer.shadowMap.needsUpdate=false;
    r.renderer.clear(true,true,true);
    r.camera.layers.set(1);r.renderer.render(r.scene,r.camera);r.renderer.clearDepth();
    r.camera.layers.set(2);r.renderer.render(r.scene,r.camera);
    r.camera.layers.set(3);r.renderer.render(r.scene,r.camera);
   }
   try{
    mesh.visible=false;replay();const without=sample();
    const png=r.canvas.toDataURL('image/png');
    mesh.visible=visible;replay();const withOrb=sample();
    let changed=0,blueVisible=0,controlChanged=0;
    for(let i=0;i<actual.length;i+=4){
     const err=(a,b)=>Math.max(...[0,1,2].map(k=>Math.abs(a[i+k]-b[i+k])));
     if(err(actual,withOrb)>8)controlChanged++;
     if(err(withOrb,without)>12){changed++;
      if(withOrb[i+2]>(without[i+2]+8)&&withOrb[i+2]>=withOrb[i]+8)blueVisible++;
     }
    }
    return {vertices:pts,roi:{x,y,w,h},changed,blueVisible,controlChanged,png};
   }finally{mesh.visible=visible;r.camera.layers.mask=restoreLayer;r.renderer.shadowMap.needsUpdate=shadow;}
  }
  const snapshot=()=>{
   const i=api.inspect(),items=[];let fallbackBodyRows=0;
   for(const [key,v] of r.commands.rows){
    const k=String(v.mesh?.userData?.key??key);
    if(!k.includes('summoner-echo:')){if(v.geometryState?.kind==='image'&&v.geometryState?.owner?.kind==='hero'&&v.mesh?.visible!==false&&v.mesh?.material?.map?.image)fallbackBodyRows++;continue;}
    items.push({key:k,mesh:!!v.mesh?.isMesh,visible:v.mesh?.visible!==false,
     area:v.mesh?.geometry?.attributes?.position?.count??0,opacity:v.mesh?.material?.opacity??0,
     texture:!!v.mesh?.material?.map?.image});
   }
   const orbs=[];
   r.scene.traverse(o=>{
    if(o.name!=='hero-spirit-light-batch'||!o.isMesh)return;
    for(let t=o;t;t=t.parent)if(!t.visible)return;
    const rgb=Array.from(o.geometry.attributes.color.array.slice(0,3));
    const expectedTints={seoha:0x78ceff,hwando:0xd6deea,slayer:0xde1634,hunter:0xff6028};
    if(!Object.hasOwn(expectedTints,i.hero))throw Error('Missing independent expected tint for '+i.hero);
    const want=(new r.T.Color(expectedTints[i.hero])).toArray();
    orbs.push({indices:o.geometry.drawRange.count,tint:rgb.every((v,k)=>Math.abs(v-want[k])<1e-5)});
   });
   const s=i.summon,warpWalkable=s?.leash?.count===1&&Number.isFinite(s.x+s.y)?!blocked(s.x,s.y,.29)&&clearLine(player,s):null;
   const e=O.foe==null?null:room?.enemies?.find(v=>v.id===O.foe);
   const projection=r.projection;
   return {t:time,zone:room?.id,layer:room?.layer,x:player.x,y:player.y,bodyPx:actorHeight(),
    frameViewport:{...O.viewport},browserViewport:{width:innerWidth,height:innerHeight},frameProjection:{...O.sourceProjection},projection:{width:projection.width,height:projection.height,zoom:projection.zoom,tile:projection.tile,pixelsPerUnit:projection.pixelsPerUnit},
    projectedTilePx:projection.tile*projection.zoom,gpuCalls:r.renderer.info.render.calls,
    webglWidth:r.canvas.width,webglHeight:r.canvas.height,attackAnim:player.attackAnim,skillAnim:player.skillAnim,combo:player.combo,
    spirit:i.spirit,action:i.action,renderedPose:i.renderedPose,weights:i.weights,summon:i.summon,orbs,warpWalkable,held:i.heldVisuals,shown:i.shown,renderer:C.state.active,items,
    fallbackBodyRows,stockOrbPaint:O.stockOrbPaint,foeHP:e?.hp??null,events:C.bridge.events.since(O.serial).map(z=>({...z}))};
  };
  function wrapped(frame){
   O.viewport=frame?.viewport;O.sourceProjection=frame?.projection;
   const value=base.apply(this,arguments);
   if(!O.on)return value;
   const q=snapshot();
   if(O.threadOverlap)q.nativeFrameEvents=(frame.events||[]).map(e=>e.serial);
   O.rows.push(q);if(O.rows.length>240)O.rows.shift();
   // Pixel snapshots come from the actual completed native WebGL canvas, not a reconstructed
   // screenshot or isolated asset. A blank/tainted canvas is a failure for visual review.
   let shot=null;
   if(q.shown&&q.spirit?.visible&&!q.summon?.visible&&q.attackAnim===0)shot=q.spirit.phase==='idle'?'idle':null;
   if(O.exclude&&q.shown&&q.items.length===0){
    if(q.skillAnim>0&&q.spirit?.phase==='cast')shot='native-skill';
    else if(q.attackAnim>0&&q.action==='attack'&&q.renderedPose==='attack')shot='native-attack';
   }
   if(q.summon?.visible&&q.items.length===1){
    shot=q.summon.leash?.count===1?'warp':'echo';
    if(O.threadOverlap&&q.skillAnim>0&&q.events.some(e=>e.kind==='hero-thread-dance-r63'&&e.damage>0))
     shot='r63-overlap';
   }
   if(shot&&!O.images[shot]){
    pixels.drawImage(r.canvas,0,0,16,16);
    const src=pixels.getImageData(0,0,16,16).data, sample=new Set();
    for(let k=0;k<src.length;k+=4) sample.add((src[k]<<16)|(src[k+1]<<8)|src[k+2]);
    if(sample.size<4)throw Error('WebGL snapshot is blank or not the real canvas frame');
    O.images[shot]=r.canvas.toDataURL('image/png');
    let isolatedOrb=null;
    if(shot==='idle'&&q.orbs.length===1&&q.orbs[0].indices===6){
     let mesh=null;
     r.scene.traverse(o=>{if(o.name==='hero-spirit-light-batch'&&o.isMesh){for(let t=o;t;t=t.parent)if(!t.visible)return;mesh=o;}});
     if(mesh){const {png,...metrics}=gpuOrbDiagnostic(mesh);if(png)O.images['idle-managed-orb-hidden']=png;isolatedOrb=metrics;}
    }
    const silhouette=api.measure();
    O.frames[shot]={...q,isolatedOrb,projectedModelSilhouette:silhouette?.ink?{...silhouette,
     heightPx:silhouette.bottom-silhouette.top,widthPx:silhouette.right-silhouette.left}:null,nonblankSampleColors:sample.size};
   }
   if(q.summon?.visible&&q.items.length===1&&q.summon.nativeEvent>O.serial&&q.summon.leash?.phase==='fixed'&&q.summon.leash.count===0&&O.walk?.once){
    if(O.walk.ranged){const n=Math.hypot(q.x-q.summon.x,q.y-q.summon.y);O.walk.ux=(q.x-q.summon.x)/n;O.walk.uy=(q.y-q.summon.y)/n;}
    O.walk.at=q.t;O.walk.once=false;
   }
   return value;
  }
  // Already chains the original R1304 wrapper, so the production re-wrapper must not wrap this QA probe a second time.
  wrapped.__r1304=true;
  Object.defineProperty(r,'render',{configurable:true,writable:true,value:wrapped});
  O.snapshot=snapshot;
  // The stock R63/R81 camera can replace a one-time zoom on any tick, and
  // not every stock profile exposes 96 px. Scope the nominal size to the
  // render call before bridge.capture/visual commands, not simulation or save.
  const stockDraw=draw;
  function drawAtRequestedScale(){
   // Assisted warp test: ordinary native collision, same elapsed native time and nominal
   // arrow movement speed. No writes to the candidate summon object or its renderer rows.
   const t=time;
   if(O.walk&&Number.isFinite(O.walk.at)&&Number.isFinite(t)&&O.lastTime!=null&&t>O.lastTime&&t>O.walk.at&&t-O.walk.at<.37){
    const elapsed=Math.min(.055,t-O.lastTime), pace=6.47;
    moveActor(player,O.walk.ux*pace*elapsed,O.walk.uy*pace*elapsed);
    player.moving=true;
   }
   if(Number.isFinite(t))O.lastTime=t;
   const previous=zoom;zoom=actorPx/66;
   try{return stockDraw.apply(this,arguments);}
   finally{zoom=previous;}
  }
  draw=drawAtRequestedScale;
  O.restore=()=>{
   if(draw===drawAtRequestedScale)draw=stockDraw;
   if(commands.render===observeCommands){if(commandDescriptor)Object.defineProperty(commands,'render',commandDescriptor);else delete commands.render;}
   if(r.render===wrapped){if(orig)Object.defineProperty(r,'render',orig);else delete r.render;}
  };
  window.__sw0027Probe=O;
 },actorPx);
}
async function mark(p,info={}){
 await p.evaluate(a=>{
  const O=window.__sw0027Probe,C=window.__STORYWORLD_PHASE1__.controller;
  O.rows=[];O.images={};O.frames={};O.foe=a.id??null;O.exclude=a.excluded===true;O.threadOverlap=a.threadOverlap===true;O.serial=C.bridge.events.serial;O.on=true;
  if(a.walk) O.walk={...a.walk,at:Infinity,once:true};else O.walk=null;
 },info);
}
async function rows(p){return p.evaluate(()=>window.__sw0027Probe.rows);}
async function capture(p,key,what,{mandatory=true}={}){
 const raw=await p.evaluate(label=>window.__sw0027Probe.images[label],what);
 if(!raw&&!mandatory)return null;
 assert(raw?.startsWith('data:image/png;base64,')&&raw.length>1400,'same-frame PNG unavailable or blank sample');
 const buf=Buffer.from(raw.split(',')[1],'base64');
 assert(buf.subarray(1,4).equals(Buffer.from('PNG'))&&buf.readUInt32BE(16)>100&&buf.readUInt32BE(20)>100,'native WebGL output size');
 const name=key+'-'+what+'.png';fs.writeFileSync(path.join(output,name),buf);return name;
}
const waitRow=(p,kind)=>p.waitForFunction(k=>{
 const a=window.__sw0027Probe.rows;
 if(k==='idle')return !!window.__sw0027Probe.images.idle;
 if(k==='echo'||k==='warp'||k==='native-attack'||k==='native-skill'||k==='r63-overlap')return !!window.__sw0027Probe.images[k];
 const a0=a.find(q=>q.attackAnim>0);
 return !!a0&&a.some(q=>q.t>=a0.t+.43&&q.attackAnim===0&&!q.summon?.visible&&q.items.length===0);
},kind,{timeout:15000});
const event=(q,serial)=>q.events.find(e=>e.serial===serial);
function verify(rows,family,fx,h){
 const hits=rows.find(r=>r.summon?.visible&&r.items.length===1);
 assert(hits, h+' missing physical renderer row');
 const i=hits.items[0],s=hits.summon,e=event(hits,s.nativeEvent);
 assert(hits.renderer==='three'&&hits.gpuCalls>0&&hits.webglWidth>100&&hits.webglHeight>100);
 assert.equal(s.family,family);
 const sources={hwando:['assets/r283/hwando/r271/attack-e.webp'],slayer:['assets/r351/slayer/attack-w.webp','assets/r389/slayer/attack-e.webp'],hunter:['assets/r425/hunter/attack-l.webp','assets/r425/hunter/attack-r.webp']};
 assert(['left','right'].includes(s.side)&&sources[h].includes(s.source),'existing authored L/R attack texture only');
 assert(i.key.includes('summoner-echo:'+h)&&i.mesh&&i.visible&&i.texture&&i.area>=6&&i.opacity>0);
 assert(e?.hero===h&&e.at<=hits.t+.005&&Number.isFinite(s.latency)&&s.latency>=-.005&&s.latency<=.125,'synchronized receipt');
 assert.equal(e.type,family==='melee'?'confirmed-hit':'projectile-spawn');
 assert(!hits.held.some(x=>x.visible),'held weapon leaked');
 assert(dist(hits,fx.start)<=.15,'native caster lunged before warp');
 if(family==='melee'){
  assert(e.target===fx.enemy.id&&e.damage>0);
  assert(approx(dist(s,e),.38)&&dist(s,fx.enemy)<.8);
  if(hits.foeHP!==null)assert(approx(fx.enemy.hp-hits.foeHP,e.damage,.15));
 }else assert(approx(dist(s,fx.start),Math.SQRT2*.46));
 assert(rows.every(q=>q.items.length<=1),'duplicate simultaneous renderer body');
 return {hits,e};
}

try{
 for(const sc of scenarios){
  const {ctx,p,study}=await bootWithQPrerequisite(browser,sc);
  const liveSource=await p.request.get(new URL('hwando-3d-r1302.js',url).href);
  assert(liveSource.ok(),'served exact summoner runtime present');
  assert.equal(createHash('sha256').update(await liveSource.body()).digest('hex'),expected,'served bytes do not match reviewed candidate');
 const stockAura=await p.request.get(new URL('polish-r101.js',url).href);
 assert(stockAura.ok());assert.equal(createHash('sha256').update(await stockAura.body()).digest('hex'),
  '316994dd007ee2399b160b6ad9afc4ebd4b43c81d7b5f006e8672cfb5434b24c','served stock aura marker bytes');
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  try{
   await go(p,'dist00');await hero(p,'seoha',false);
   await observer(p,sc.actorPx);await mark(p);
   await p.waitForFunction(()=>window.__sw0027Probe.rows.length>=4);
   const fallback=await p.evaluate(()=>window.__sw0027Probe.rows.at(-1));
   assert(fallback.stockOrbPaint?.before>0&&fallback.stockOrbPaint.before===fallback.stockOrbPaint.after&&
    fallback.stockOrbPaint.otherBefore===fallback.stockOrbPaint.otherAfter&&fallback.stockOrbPaint.otherAfter>0,'native 2D stock pass remains untouched');
   assert(fallback.renderer==='three'&&fallback.fallbackBodyRows>0&&fallback.orbs.length===0&&!fallback.shown&&!fallback.spirit?.visible&&!fallback.summon?.visible&&fallback.items.length===0);
   for(const [h,family,limit] of [['seoha','excluded',null],['hwando','melee',4.7],['slayer','melee',4.7],['hunter','ranged',2.4]]){
    const label=sc.label+'-'+h;
    await hero(p,h,true);
    await mark(p);await waitRow(p,'idle');
    const idle=await p.evaluate(()=>window.__sw0027Probe.frames.idle);
    const idleRecord={label,requestedNominalActorPx:sc.actorPx,requestedViewport:sc.vp,
     framing:'QA draw-only nominal coefficient, not native settings or projected silhouette height',frame:idle};
    report.idleFrames.push(idleRecord);
    idleRecord.png=await capture(p,label,'idle');
    idleRecord.managedOrbHiddenControlPNG=await capture(p,label,'idle-managed-orb-hidden');
    assert(idle.isolatedOrb?.changed>=5&&idle.isolatedOrb.controlChanged<=Math.max(2,idle.isolatedOrb.changed*.2),
     'managed orb materially changes native pixels in matching same-frame GPU passes, not just a command');
    if(h==='seoha'){
     assert(idle.isolatedOrb.blueVisible>=4,'managed Seoha orb contributes cold-blue pixels');
     assert(idle.stockOrbPaint?.before>0&&idle.stockOrbPaint.after===0&&
       idle.stockOrbPaint.otherBefore>0&&idle.stockOrbPaint.otherBefore===idle.stockOrbPaint.otherAfter,
       'only the real active Seoha stock duplicate glyph commands were removed; native non-glyph auras remain');
    }
    assert(idle.spirit.visible&&idle.spirit.batches===1&&idle.spirit.strokes===1&&idle.orbs.length===1&&idle.orbs[0].indices===6&&idle.orbs[0].tint,'one native visible selected-hero-indexed shoulder orb');
    const f=idle.frameViewport,pj=idle.projection,src=idle.frameProjection,vp=idle.browserViewport;
    assert(vp.width===sc.vp.width&&vp.height===sc.vp.height&&f.width>100&&f.height>100&&
      src.width===f.width&&src.height===f.height&&pj.width===f.width&&pj.height===f.height&&
      approx(idle.bodyPx,sc.actorPx,.5)&&approx(66*f.zoom,sc.actorPx,.5)&&approx(66*src.zoom,sc.actorPx,.5)&&approx(66*pj.zoom,sc.actorPx,.5)&&
      Number.isFinite(src.tile)&&src.tile>0&&approx(idle.projectedTilePx,src.tile*sc.actorPx/66,.5)&&
      approx(pj.pixelsPerUnit,src.tile*Math.SQRT2*sc.actorPx/66,.5),
      'sampled requested 64/96 px nominal native-render coefficient: '+JSON.stringify({bodyPx:idle.bodyPx,browserViewport:vp,frameViewport:f,frameProjection:src,projection:pj,projectedTilePx:idle.projectedTilePx}));

    if(family==='excluded'){
     const fx=await placement(p,h);await mark(p,{id:fx.enemy.id,excluded:true});
     await p.keyboard.press('KeyA');await waitRow(p,'native-attack');
     const attack=await capture(p,label,'native-attack');await waitRow(p,'settled');
     const shotRows=await rows(p);
     assert(shotRows.some(q=>q.events.some(e=>e.type==='projectile-spawn'&&e.hero===h))&&
       shotRows.some(q=>q.events.some(e=>e.type==='confirmed-hit'&&e.hero===h&&e.damage>0)),'actual excluded Seoha shot and positive gameplay hit');
     assert(shotRows.every(q=>!q.summon?.visible&&!q.items.length),'excluded 3D basic cannot emit 2D');
     const skillFX=await placement(p,h);
     await mark(p,{id:skillFX.enemy.id,excluded:true});
     study.atMarkedNativeQ=await nativeQState(p);
     const markQ=study.atMarkedNativeQ;
     assert(markQ.hero==='seoha'&&markQ.rank>=1&&!markQ.locked&&!markQ.lockedLevel&&markQ.cd===0&&markQ.anim===0&&
      !markQ.modal&&!markQ.loading&&!markQ.story,'marked test actually has an available native Seoha Q');
     await p.keyboard.press('KeyQ');
     study.afterNativeQ=await nativeQState(p);
     assert(study.afterNativeQ.blockedKey===markQ.blockedKey&&study.afterNativeQ.cd>markQ.cd,
      'native Q started cooldown before waiting for the rendered proof');
     await waitRow(p,'native-skill');
     const skill=await capture(p,label,'native-skill');
     study.nativeSkillFrame=await p.evaluate(()=>window.__sw0027Probe.frames['native-skill']);
     assert(study.nativeSkillFrame?.skillAnim>0&&study.nativeSkillFrame.shown&&
      study.nativeSkillFrame.spirit?.phase==='cast'&&!study.nativeSkillFrame.summon?.visible&&
      study.nativeSkillFrame.items.length===0,'captured same-frame Q animation/cast/no 2D');
     await p.waitForFunction(()=>window.__sw0027Probe.rows.some(q=>q.events.some(e=>e.type==='projectile-spawn'&&e.hero==='seoha')),null,{timeout:15000});
     const skillRows=await rows(p);
     study.nativeQEvents=skillRows.at(-1)?.events??[];
     study.nativeQPulses=skillRows.filter(q=>q.spirit?.phase==='cast').map(q=>({t:q.t,skillAnim:q.skillAnim,pulses:q.spirit.pulses}));
     assert(study.nativeQEvents.some(e=>e.type==='projectile-spawn'&&e.hero==='seoha'&&e.serial>markQ.serial),'positive post-mark native projectile');
     assert(skillRows.some(q=>q.skillAnim>0&&q.shown&&q.spirit?.phase==='cast')&&
       skillRows.every(q=>!q.summon?.visible&&!q.items.length),'excluded 3D skill with cast flame, no 2D');
     report.cases.push({label,family,attack,skill});continue;
    }
    if(family==='ranged'){
     const neg=await hunterPlacement(p);await mark(p,{id:neg.enemy.id});
     // Negative fixture only: suppress the real native shot factory for one attack input,
     // then restore. This deliberately yields an actual native attack pose and no launch.
     await p.evaluate(()=>{
      const base=makeShot;
      window.__sw0027Probe.unblock=()=>{makeShot=base;delete window.__sw0027Probe.unblock;};
      makeShot=function(...a){return a[5]?.friendly&&a[5]?.owner==='hero'?null:base.apply(this,a);};
     });
     try{await p.keyboard.press('KeyA');await waitRow(p,'settled');}
     finally{await p.evaluate(()=>window.__sw0027Probe.unblock?.());}
     const negative=await rows(p);
     assert(negative.some(q=>q.attackAnim>0),'expected actual no-shot attack pose');
     assert(!negative.some(q=>q.summon?.visible||q.items.length||q.events.some(z=>z.type==='projectile-spawn'&&z.hero===h)));
    }

    let fx=await (h==='hunter'?hunterPlacement(p):placement(p,h));await mark(p,{id:fx.enemy.id});
    await p.keyboard.press('KeyA');await waitRow(p,'echo');await capture(p,label,'echo');await waitRow(p,'settled');
    const plain=await rows(p), first=verify(plain,family,fx,h);
    assert(plain.at(-1).spirit?.visible&&!plain.at(-1).summon?.visible);
    if(family==='ranged'){
     const got=plain.some(q=>q.events.some(z=>z.type==='confirmed-hit'&&z.hero===h&&z.target===fx.enemy.id&&z.damage>0));
     assert(got,'ranged launch must actually reach this seeded native target');
    }

    if(h==='hwando'){report.cases.push({label,family,first});continue;}
    fx=await (h==='hunter'?hunterPlacement(p):placement(p,h));await mark(p,{id:fx.enemy.id,walk:{ux:fx.ux,uy:fx.uy,ranged:family==='ranged'}});
    await p.keyboard.press('KeyA');await waitRow(p,'warp');await capture(p,label,'warp');await waitRow(p,'settled');
    const walked=await rows(p), initial=verify(walked,family,fx,h), swaps=walked.filter(q=>q.summon?.visible&&q.summon.leash?.count===1);
    assert(swaps.length>0&&walked.every(q=>(q.summon?.leash?.count??0)<=1));
    const swap=swaps[0];
    assert(dist(swap,initial.hits.summon)>limit,'leash fired too early');
    assert(swap.warpWalkable&&dist(swap,swap.summon)<.9&&swaps.every(q=>dist(q.summon,swap.summon)<.001));
    assert(swaps.every(q=>q.summon.nativeEvent===initial.e.serial),'warp began a fresh attack');
    assert(walked.at(-1).combo===initial.hits.combo,'warp repeated attack input');
    const receipts=new Set(walked.flatMap(q=>q.events.filter(e=>e.hero===h&&e.target===fx.enemy.id&&e.type==='confirmed-hit').map(e=>e.serial)));
    assert(receipts.size<=1,'warp applied duplicate target damage in the single native attack fixture');
    report.cases.push({label,family,limit,first,warp:swap,damageReceipts:[...receipts],
     idleVisibleGlyphStrokes:idle.spirit.strokes,
     visualReview:{state:'pending visual QA',requires:'one perceived hero-matching shoulder orb, no weapon mesh, clean same-target spell and return; engine indexed-geometry and tint checks do NOT replace visual interpretation'}});
   }

   // Isolated slot only; author a live echo and start native restore in the same render
   // turn, without using a user save. Real scene change is separately entered at dist06.
   await hero(p,'hwando',true);
   await p.evaluate(installRestoreProbe);
   const saved=await p.evaluate(()=>{
    const C=window.__STORYWORLD_CHEAT777__,isolated=C?.active()===true;
    const slot=isolated?C.inspect().saveSlot:null;
    if(!slot)throw Error('native isolated 777 save slot is unavailable');
    const expected={zone,layer,hero:player.hero,time},ok=saveGame(false);
    const s=window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(slot);
    window.__sw0027Probe.savedCheckpoint={slot,text:s};
    const d=s?JSON.parse(s):null;
    const actual=d?{zone:d.zone,layer:d.layer,hero:d.hero,time:d.time}:null;
    return {ok,isolated,bytes:s?.length??0,hasEcho:s?.includes('summoner-echo:')??false,
      activeSlotState:d?.cheat777?.active===true,expected,actual};
   });
   assert(saved.ok&&saved.bytes>0&&!saved.hasEcho&&saved.activeSlotState===saved.isolated);
   assert.deepEqual(saved.actual,saved.expected,'check newly written record from the native active slot');
   const fx=await placement(p,'hwando');await mark(p,{id:fx.enemy.id});
   await p.keyboard.press('KeyA');await waitRow(p,'echo');
   const handoff=await p.evaluate(()=>{
    const q=window.__sw0027Probe.snapshot();
    if(!q.summon?.visible||q.items.length!==1)throw Error('map transition missed live echo; not valid evidence');
    const serial=q.summon.nativeEvent;
    window.__sw0027Probe.restoreProbe.begin();
    return {zone:q.zone,serial};
   });
   await p.waitForFunction(()=>window.__sw0027Probe.restoreProbe.entered());await skip(p);
   await p.waitForFunction(old=>{
    const q=window.__sw0027Probe.snapshot();
    return q.zone==='dist06'&&q.shown&&q.spirit?.visible&&!q.summon?.visible&&q.orbs.length===1&&q.summon?.nativeEvent!==old&&q.items.length===0;
   },handoff.serial);
   const restoreSetup=await p.evaluate(()=>window.__sw0027Probe.restoreProbe.restore());await skip(p);
   await p.waitForFunction(savedZone=>zone===savedZone&&!loading,saved.actual.zone,{timeout:15000});
   const restored=await p.evaluate(()=>({zone,layer,hero:player.hero,isolated:window.__STORYWORLD_CHEAT777__?.active()===true}));
   const {zone:savedZone,layer:savedLayer,hero:savedHero}=saved.actual;
   assert.deepEqual(restored,{zone:savedZone,layer:savedLayer,hero:savedHero,isolated:saved.isolated},'native loader returned to that new stored record');
   await p.waitForFunction(()=>{const q=window.__sw0027Probe.snapshot();return q.zone==='dist00'&&!loading&&!q.summon?.visible&&q.items.length===0;});
   await hero(p,'hwando',false);
   await p.waitForFunction(()=>{const q=window.__sw0027Probe.snapshot();return q.fallbackBodyRows>0&&q.orbs.length===0&&!q.shown&&!q.spirit?.visible&&!q.summon?.visible&&q.items.length===0;});
   assert.deepEqual(errors,[],'unexpected page JavaScript errors');
   report.cases.push({label:sc.label+'-scenes-and-option',saved,restoreSetup,fallback:true,transition:true,load:true});
   // Each viewport exercises a real T alone, then a real A→T overlap from
   // a fresh naturally restored actor. No native R63 cooldown/skill writes.
   await hero(p,'hwando',true);
   await p.evaluate(()=>{
    const C=window.__STORYWORLD_CHEAT777__,O=window.__sw0027Probe;
    if(C.active()!==true||!saveGame(false))throw Error('Isolated native R63 test checkpoint unavailable');
    const slot=C.inspect().saveSlot,text=window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(slot);
    if(!text)throw Error('Isolated native R63 test checkpoint missing');
    O.threadCheckpoint={slot,text,actor:player};
   });
   const negative=await placement(p,'hwando');
   // The earlier native reload grants restored enemies a grace window; wait for it to
   // end naturally so T alone can land real damage (never clear a game timer).
   report.r63SkillOnlyReadiness=await (await p.waitForFunction(({id,range})=>{
    const foe=liveEnemies().find(e=>e.id===id),policy=window.__STORYWORLD_DANCE_POLICY_R75__,r66=window.__STORYWORLD_R66__;
    if(loading||modal||storyScene||!foe||!damageable3(foe)||nearestEnemy(range)?.id!==id||player.skillAnim>0||
       window.__STORYWORLD_DANCES_R74__.nativeActive(player))return false;
    const first=r66.selectTargets(liveEnemies().filter(e=>policy.target('native',e,player)),player,11,distance)[0];
    if(!first||!damageable3(first))return false;
    return {id,first:first.id,t:time,graceUntil:foe.graceUntil??null,invulnerableUntil:foe.invulnerableUntil??null};
   },{id:negative.enemy.id,range:negative.range},{timeout:15000})).jsonValue();
   await mark(p,{id:negative.enemy.id});
   await p.keyboard.press('KeyT');
   await p.waitForFunction(()=>{const a=window.__sw0027Probe.rows;
    const hit=a.flatMap(q=>q.events).find(e=>e.hero==='hwando'&&e.kind==='hero-thread-dance-r63'&&e.damage>0);
    return hit&&a.some(q=>q.skillAnim>0)&&a.at(-1)?.t>hit.at+.45;},null,{timeout:15000});
   const skillOnly=await rows(p);
   assert(skillOnly.every(q=>!q.summon?.visible&&q.items.length===0&&
    !q.events.some(e=>e.type==='confirmed-hit'&&e.kind==='attack'&&e.hero==='hwando')),
    'T alone produces authentic thread damage but neither basic receipt nor 2D echo');
   report.cases.push({label:sc.label+'-r63-skill-only',nativeSkill:true,echo:false});
   await p.evaluate(async()=>{
    const C=window.__STORYWORLD_CHEAT777__,K=window.__sw0027Probe.threadCheckpoint;
    if(C.active()!==true||C.inspect().saveSlot!==K.slot||
     window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(K.slot)!==K.text)
     throw Error('Isolated native R63 test checkpoint changed');
    if(await loadLocal()===false||player===K.actor)throw Error('R63 test did not get a fresh native actor');
   });
   await skip(p);await hero(p,'hwando',true);
   // Native restore deliberately grants each saved enemy a grace window. Do
   // not rehearse both keys into that protection or clear a real game timer.
   await p.waitForFunction(()=>!loading&&!modal&&!storyScene&&room?.id==='dist00'&&
    liveEnemies().some(e=>e.hp>1&&damageable3(e)),null,{timeout:60000});
   const thread=await placement(p,'hwando',{requireDamageable:true});
   // One atomic readiness read: the same evaluation that admits the attack returns its evidence.
   const r63Readiness=await (await p.waitForFunction(({id,range})=>{
    const foe=nearestEnemy(range),dances=window.__STORYWORLD_DANCES_R74__;
    const policy=window.__STORYWORLD_DANCE_POLICY_R75__,r66=window.__STORYWORLD_R66__;
    if(loading||modal||storyScene||player.hero!=='hwando'||player.attackCD>0||
       player.skillAnim>0||dances.nativeActive(player)||foe?.id!==id||!damageable3(foe))return false;
    const targets=r66.selectTargets(liveEnemies().filter(e=>policy.target('native',e,player)),player,11,distance);
    const splashR=window.__STORYWORLD_COMBAT_R118__?.splashShape?.('basic')?.radius??3;
    const reach=d=>distance(player,d)<=range+(d.radius||.4)+.3;
    const swung=liveEnemies().filter(d=>d===foe||reach(d));
    const spare=targets.filter(e=>e.id!==id&&e.hp>1&&damageable3(e)&&!reach(e)&&
      swung.every(d=>d===e||Math.hypot(e.x-d.x,e.y-d.y)>splashR+(e.radius||.4)*.5+.3));
    if(!spare.length)return false;
    return {id,t:time,graceUntil:foe.graceUntil??null,invulnerableUntil:foe.invulnerableUntil??null,hp:foe.hp,
     distance:distance(player,foe),range,splashR,spareR63Targets:spare.map(e=>e.id)};
   },{id:thread.enemy.id,range:thread.range},{timeout:60000})).jsonValue();
   await mark(p,{id:thread.enemy.id,threadOverlap:true});
   report.r63Readiness={profile:sc.label,sparePass:thread.sparePass,...r63Readiness};
   await p.keyboard.press('KeyA');await p.keyboard.press('KeyT');
   await waitRow(p,'r63-overlap');
   const image=await capture(p,sc.label,'r63-overlap');
   const q=await p.evaluate(()=>window.__sw0027Probe.frames['r63-overlap']);
   const hit=q.events.find(e=>e.serial===q.summon.nativeEvent);
   const skill=q.events.find(e=>e.hero==='hwando'&&e.kind==='hero-thread-dance-r63'&&e.damage>0);
   // The selected enemy and the nearest enemy (native dispatch row) may differ; the echo must
   // follow the one enemy this basic attack really damaged (user 2026-11-24, SW-0027 r2).
   const ledger=await p.evaluate(at=>{
    const row=window.__STORYWORLD_CURRENT_HERO__.actions(player).findLast(a=>a.hero==='hwando'&&a.state==='attack'&&a.at===at);
    return {dispatchTarget:row?.target?.id??null};
   },hit?.at);
   const basics=q.events.filter(e=>e.hero==='hwando'&&e.type==='confirmed-hit'&&e.kind==='attack'&&e.at===hit?.at&&e.damage>0);
   assert(hit?.kind==='attack'&&hit.damage>0&&basics.some(e=>e.serial===hit.serial)&&
    (basics.length===1||hit.target===ledger.dispatchTarget||hit.target===thread.enemy.id)&&
    skill.serial>hit.serial&&skill.at>=hit.at&&skill.at<=hit.at+.12,'positive native A and R63 must overlap; echo remains the really damaged basic receipt');
   const targets={selected:thread.enemy.id,dispatch:ledger.dispatchTarget,damaged:hit.target,
    basicReceipts:basics.map(e=>e.target),divergent:ledger.dispatchTarget!==thread.enemy.id};
   assert(q.summon.source==='assets/r283/hwando/r271/attack-e.webp'&&q.items.length===1&&
    q.items[0].mesh&&q.items[0].visible&&q.items[0].texture&&q.items[0].opacity>0&&q.gpuCalls>0,
    'real unchanged Hwando L/R body in that native overlap frame');
   assert(approx(dist(q.summon,hit),.38),'overlap does not move the echo to the secondary skill target');
   await p.waitForFunction(({t,serial,skill})=>window.__sw0027Probe.rows.some(q=>q.t>t&&q.skillAnim>0&&
    q.items.length===1&&q.summon?.nativeEvent===serial&&!q.nativeFrameEvents.includes(serial)&&
    !q.nativeFrameEvents.includes(skill)),{t:q.t,serial:hit.serial,skill:skill.serial},{timeout:15000});
   const retained=(await rows(p)).find(r=>r.t>q.t&&r.skillAnim>0&&r.summon?.nativeEvent===hit.serial&&
    !r.nativeFrameEvents.includes(hit.serial)&&!r.nativeFrameEvents.includes(skill.serial));
   assert(retained&&dist(retained.summon,q.summon)<.001&&
    approx(retained.t+retained.summon.ttl,q.t+q.summon.ttl,1e-6),'second native frame retains anchor and original expiry without repeated receipts');
   assert.deepEqual(errors,[],'unexpected page JavaScript errors during R63 cases');
   report.cases.push({label:sc.label+'-r63-native-overlap',image,hit,skill,retainedAt:retained.t,targets});
  }catch(error){
   report.failure={profile:sc.label,message:String(error),lastFrames:await rows(p).then(a=>a.slice(-3)).catch(()=>[]),pageErrors:errors,
    r63LastCast:await p.evaluate(()=>window.__STORYWORLD_CAMPAIGN_R63R1__?.inspect?.()?.lastCast??null).catch(()=>null),
    gameState:await p.evaluate(()=>({t:time,loading:!!loading,modal:!!modal,storyScene:!!storyScene,room:room?.id??null,hero:player?.hero,
     x:player?.x,y:player?.y,foes:liveEnemies().map(e=>[e.id,+e.x.toFixed(2),+e.y.toFixed(2),Math.round(e.hp),
     +(+e.graceUntil||0).toFixed(2),+(+e.invulnerableUntil||0).toFixed(2),damageable3(e)])})).catch(e=>String(e)),
    recentHits:await rows(p).then(a=>[...new Map(a.flatMap(q=>q.events).filter(e=>e.type==='confirmed-hit').map(e=>[e.serial,[e.serial,e.kind,e.target,e.damage,e.at]])).values()].slice(-16)).catch(()=>[])};
   throw error;
  }finally{
   await p.evaluate(()=>window.__sw0027Probe?.restore?.()).catch(()=>{});
   await ctx.close();
  }
 }
}finally{
 await browser.close();
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
}

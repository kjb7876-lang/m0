import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const expected=process.env.SW0027_R1302_SHA||'070f05550bb13d148c5906427ec6a9c1a3d7f7a1b939ca158542da53a2339180';
const scenarios=[
 {label:'desktop-64', vp:{width:960,height:540}, actorPx:64},
 {label:'compact-96', vp:{width:390,height:844}, actorPx:96},
];
if(process.argv.includes('--list')){
 console.log(JSON.stringify(scenarios.map(x=>({...x,cases:['2D fallback','idle shoulder orb','native ranged launch','no-shot negative','real melee contact','ranged/melee single safe return','scene transition and isolated save reload']})),null,2));
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
const {chromium,boot,go,skip}=await import('../r444/lib.mjs');
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={exactR1302SourceSHA256:expected,mode:'disposable native browser fixture, software GPU; not physical-device or natural playthrough',cases:[]};
const approx=(a,b,tol=.03)=>Math.abs(a-b)<=tol;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ready=(p,h)=>p.waitForFunction(id=>{
 const S=window.__STORYWORLD_HWANDO3D_R1302__?.inspect(),r=window.__STORYWORLD_PHASE1__?.controller?.state;
 return S?.hero===id&&S.ready&&S.shown&&S.sharedScene&&S.spirit?.phase==='idle'&&S.spirit?.visible&&r.active==='three';
},h,{timeout:120000});
async function hero(p,h,enabled,actorPx){
 await p.evaluate(async ({h,enabled,actorPx})=>{
  player.hero=h;player.personaHeroR1113=false;player.egoSovereignR1046=false;
  await ensureImages(heroPaths(h));player.attackAnim=0;player.skillAnim=0;player.ultimateAnim=0;
  player.moving=false;zoom=actorPx/66;
  // Supported native settings entry; does not patch storage or attack behavior.
  window.__STORYWORLD_HWANDO3D_R1302__.set(enabled);
 },{h,enabled,actorPx});
 if(enabled)await ready(p,h);
}
async function placement(p,h){
 return p.evaluate(h=>{
  // Select an existing enemy on the authentic map and lock environmental movement/damage
  // in the test context only. We do not create a foe, write its HP, or call hitEnemy.
  for(const e of room.enemies){e.speed=0;e.damage=0;}
  const range=HEROES[h].range;
  for(const e of liveEnemies()){
   if(e.hp<=1)continue;
   const amount=h==='hwando'?range-.14:2.5;
   for(const [ux,uy] of [[1,0],[-1,0],[0,1],[0,-1],[.707,.707],[-.707,-.707],[.707,-.707],[-.707,.707]]){
    const start={x:e.x+amount*ux,y:e.y+amount*uy},end={x:start.x+2.1*ux,y:start.y+2.1*uy};
    if(blocked(start.x,start.y,.29)||blocked(end.x,end.y,.29)||!clearLine(start,e)||!clearLine(start,end))continue;
    player.x=start.x;player.y=start.y;player.attackCD=0;player.attackAnim=0;player.moving=false;
    if(Array.isArray(player.path))player.path.length=0;
    if(typeof auto==='boolean')auto=false;
    if(typeof route!=='undefined')route=[];
    if(typeof command!=='undefined')command=null;
    if(typeof cam==='object'){cam.x=start.x;cam.y=start.y;}
    target=e.id;
    return {start,enemy:{id:e.id,x:e.x,y:e.y,hp:e.hp},ux,uy,range};
   }
  }
  throw Error('authentic dist00 enemy and clear scripted runway unavailable');
 },h);
}
async function observer(p){
 await p.evaluate(()=>{
  const C=window.__STORYWORLD_PHASE1__.controller;
  const r=C.state.three, api=window.__STORYWORLD_HWANDO3D_R1302__;
  if(!r?.commands?.rows||!r.renderer?.render||!r.canvas)throw Error('actual renderer is not Three/WebGL');
  const base=r.render, orig=Object.getOwnPropertyDescriptor(r,'render');
  const O={rows:[],images:{},on:false,serial:C.bridge.events.serial,walk:null,lastTime:null};
  const pixelCanvas=document.createElement('canvas');pixelCanvas.width=pixelCanvas.height=16;
  const pixels=pixelCanvas.getContext('2d',{willReadFrequently:true});
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
    const want=(new r.T.Color(({seoha:0x78ceff,hwando:0xd6deea})[i.hero])).toArray();
    orbs.push({indices:o.geometry.drawRange.count,tint:rgb.every((v,k)=>Math.abs(v-want[k])<1e-5)});
   });
   const s=i.summon,warpWalkable=s?.leash?.count===1&&Number.isFinite(s.x+s.y)?!blocked(s.x,s.y,.29)&&clearLine(player,s):null;
   const e=O.foe==null?null:room?.enemies?.find(v=>v.id===O.foe);
   return {t:time,zone:room?.id,layer:room?.layer,x:player.x,y:player.y,bodyPx:actorHeight(),gpuCalls:r.renderer.info.render.calls,
    webglWidth:r.canvas.width,webglHeight:r.canvas.height,attackAnim:player.attackAnim,combo:player.combo,
    spirit:i.spirit,summon:i.summon,orbs,warpWalkable,held:i.heldVisuals,shown:i.shown,renderer:C.state.active,items,
    fallbackBodyRows,foeHP:e?.hp??null,events:C.bridge.events.since(O.serial).map(z=>({...z}))};
  };
  function wrapped(frame){
   // Assisted warp test: ordinary native collision, same elapsed native time and nominal
   // arrow movement speed. No writes to the candidate summon object or its renderer rows.
   const t=frame?.time;
   if(O.walk&&Number.isFinite(t)&&O.lastTime!=null&&t>O.lastTime&&t-O.walk.at<.37){
    const elapsed=Math.min(.055,t-O.lastTime), pace=6.47;
    moveActor(player,O.walk.ux*pace*elapsed,O.walk.uy*pace*elapsed);
    player.moving=true;
   }
   if(Number.isFinite(t))O.lastTime=t;
   const value=base.apply(this,arguments);
   if(!O.on)return value;
   const q=snapshot();O.rows.push(q);if(O.rows.length>240)O.rows.shift();
   // Pixel snapshots come from the actual completed native WebGL canvas, not a reconstructed
   // screenshot or isolated asset. A blank/tainted canvas is a failure for visual review.
   let shot=null;
   if(q.shown&&q.spirit?.visible&&!q.summon?.visible&&q.attackAnim===0)shot=q.spirit.phase==='idle'?'idle':null;
   if(q.summon?.visible&&q.items.length===1)shot=q.summon.leash?.count===1?'warp':'echo';
   if(shot&&!O.images[shot]){
    pixels.drawImage(r.canvas,0,0,16,16);
    const src=pixels.getImageData(0,0,16,16).data, sample=new Set();
    for(let k=0;k<src.length;k+=4) sample.add((src[k]<<16)|(src[k+1]<<8)|src[k+2]);
    if(sample.size<4)throw Error('WebGL snapshot is blank or not the real canvas frame');
    O.images[shot]=r.canvas.toDataURL('image/png');
   }
   if(q.summon?.visible&&O.walk?.once){O.walk.at=q.t;O.walk.once=false;}
   return value;
  }
  // Already chains the original R1304 wrapper, so the production re-wrapper must not wrap this QA probe a second time.
  wrapped.__r1304=true;
  Object.defineProperty(r,'render',{configurable:true,writable:true,value:wrapped});
  O.snapshot=snapshot;
  O.restore=()=>{if(r.render===wrapped){if(orig)Object.defineProperty(r,'render',orig);else delete r.render;}};
  window.__sw0027Probe=O;
 });
}
async function mark(p,info={}){
 await p.evaluate(a=>{
  const O=window.__sw0027Probe,C=window.__STORYWORLD_PHASE1__.controller;
  O.rows=[];O.images={};O.foe=a.id??null;O.serial=C.bridge.events.serial;O.on=true;
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
 if(k==='echo'||k==='warp')return !!window.__sw0027Probe.images[k];
 const a0=a.find(q=>q.attackAnim>0);
 return !!a0&&a.some(q=>q.t>=a0.t+.43&&q.attackAnim===0&&!q.summon?.visible&&q.items.length===0);
},kind,{timeout:15000});
const event=(q,serial)=>q.events.find(e=>e.serial===serial);
function verify(rows,family,fx,h){
 const hits=rows.find(r=>r.summon?.visible&&r.items.length===1);
 assert(hits, h+' missing physical renderer row');
 const i=hits.items[0],s=hits.summon,e=event(hits,s.nativeEvent);
 assert(hits.renderer==='three'&&hits.gpuCalls>0&&hits.webglWidth>100&&hits.webglHeight>100);
 assert.equal(s.family,family);assert(s.source && !s.source.includes('/walk'));
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
  const {ctx,p}=await boot(browser,{vp:sc.vp});
  const liveSource=await p.request.get(new URL('hwando-3d-r1302.js',url).href);
  assert(liveSource.ok(),'served exact summoner runtime present');
  assert.equal(createHash('sha256').update(await liveSource.body()).digest('hex'),expected,'served bytes do not match reviewed candidate');
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  try{
   await go(p,'dist00');await hero(p,'seoha',false,sc.actorPx);
   await observer(p);await mark(p);
   await p.waitForFunction(()=>window.__sw0027Probe.rows.length>=4);
   const fallback=await p.evaluate(()=>window.__sw0027Probe.rows.at(-1));
   assert(fallback.renderer==='three'&&fallback.fallbackBodyRows>0&&fallback.orbs.length===0&&!fallback.shown&&!fallback.spirit?.visible&&!fallback.summon?.visible&&fallback.items.length===0);
   for(const [h,family,limit] of [['seoha','ranged',2.4],['hwando','melee',4.7]]){
    const label=sc.label+'-'+h;
    await hero(p,h,true,sc.actorPx);
    await mark(p);await waitRow(p,'idle');const idle=(await rows(p)).at(-1);
    assert(idle.spirit.visible&&idle.spirit.batches===1&&idle.spirit.strokes===1&&idle.orbs.length===1&&idle.orbs[0].indices===6&&idle.orbs[0].tint,'one native visible selected-hero-indexed shoulder orb');
    assert(approx(idle.bodyPx,sc.actorPx,.5),'sampled requested 64/96 px native zoom');
    await capture(p,label,'idle');

    if(family==='ranged'){
     const neg=await placement(p,h);await mark(p,{id:neg.enemy.id});
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

    let fx=await placement(p,h);await mark(p,{id:fx.enemy.id});
    await p.keyboard.press('KeyA');await waitRow(p,'echo');await capture(p,label,'echo');await waitRow(p,'settled');
    const plain=await rows(p), first=verify(plain,family,fx,h);
    assert(plain.at(-1).spirit?.visible&&!plain.at(-1).summon?.visible);
    if(family==='ranged'){
     const got=plain.some(q=>q.events.some(z=>z.type==='confirmed-hit'&&z.hero===h&&z.target===fx.enemy.id&&z.damage>0));
     assert(got,'ranged launch must actually reach this seeded native target');
    }

    fx=await placement(p,h);await mark(p,{id:fx.enemy.id,walk:{ux:fx.ux,uy:fx.uy}});
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
   const saved=await p.evaluate(()=>{const ok=saveGame(false);const s=window.__STORYWORLD_TEST_STORAGE_B1__.store.getItem(normalSaveKeyR73()); return {ok,bytes:s?.length??0,hasEcho:s?.includes('summoner-echo:')??false};});
   assert(saved.ok&&saved.bytes>0&&!saved.hasEcho);
   const fx=await placement(p,'hwando');await mark(p,{id:fx.enemy.id});
   await p.keyboard.press('KeyA');await waitRow(p,'echo');
   const handoff=await p.evaluate(()=>{
    const q=window.__sw0027Probe.snapshot();
    if(!q.summon?.visible||q.items.length!==1)throw Error('map transition missed live echo; not valid evidence');
    const serial=q.summon.nativeEvent;
    enterRegion('dist06',null,{layer:'STORY',restore:true});
    return {zone:q.zone,serial};
   });
   await p.waitForFunction(()=>!loading&&room?.id==='dist06');await skip(p);
   await p.waitForFunction(old=>{
    const q=window.__sw0027Probe.snapshot();
    return q.zone==='dist06'&&q.shown&&q.spirit?.visible&&!q.summon?.visible&&q.orbs.length===1&&q.summon?.nativeEvent!==old&&q.items.length===0;
   },handoff.serial);
   await p.evaluate(()=>loadLocal());await skip(p);
   await p.waitForFunction(()=>{const q=window.__sw0027Probe.snapshot();return q.zone==='dist00'&&!loading&&!q.summon?.visible&&q.items.length===0;});
   await hero(p,'hwando',false,sc.actorPx);
   await p.waitForFunction(()=>{const q=window.__sw0027Probe.snapshot();return q.fallbackBodyRows>0&&q.orbs.length===0&&!q.shown&&!q.spirit?.visible&&!q.summon?.visible&&q.items.length===0;});
   assert.deepEqual(errors,[],'unexpected page JavaScript errors');
   report.cases.push({label:sc.label+'-scenes-and-option',saved,fallback:true,transition:true,load:true});
  }finally{
   await p.evaluate(()=>window.__sw0027Probe?.restore?.()).catch(()=>{});
   await ctx.close();
  }
 }
}finally{
 await browser.close();
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
}

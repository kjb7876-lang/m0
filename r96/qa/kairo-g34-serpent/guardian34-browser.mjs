/* Official loopback build only. Real game / Three renderer; fixture moves native rows, never emits draw commands. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const config={
 id:'kair-guardian-34',name:'시간수문장',zone:'kair09',
 native:'assets/generated-v3125/kair-guardians/guardian_34.webp',
 pack:'assets/kairo-g34-serpent-v1/',
 directions:{up:[-1,-1],down:[1,1],right:[1,-1],left:[-1,1]},
 selectors:['#campaignNew54','#slotConfirmR73']
};
export function checkURL(raw){
 const u=new URL(raw);assert.equal(u.protocol,'http:');
 assert.ok(['127.0.0.1','localhost','[::1]'].includes(u.hostname));
 assert.equal(u.pathname,'/m0/');assert.equal(u.search,'');assert.equal(u.hash,'');
 assert.equal(u.username+u.password,'');return u.href;
}
export function campaignPrefix(rows,id){
 const prior=[];
 for(const row of rows){
  if(row.id===id)return prior;
  if(row.recordCount>0)prior.push(row.id);
 }
 throw new Error('Unknown canonical QA destination '+id);
}
function install(c){
 const controller=window.__STORYWORLD_PHASE1__.controller, engine=controller.state.three;
 const old=engine.render, record=window.g34Witness={rows:[],mode:'idle',dir:'up',t0:time,baseline:null};
 record.fixture=(mode,dir='up')=>{Object.assign(record,{mode,dir,t0:time,rows:[]});};
 engine.render=function(frame){
  const e=room?.enemies?.find(a=>a.nativeId===c.id&&String(a.name).replace(/\s+\d+$/,'')===c.name);
  const ownerId=e?'enemy:'+e.id:null;
  const draws=frame.commands?.filter(q=>ownerId&&q.owner?.id===ownerId&&(q.owner.kind==='enemy'||q.owner.kind==='contact')&&
    Math.hypot(q.owner.x-e.x,q.owner.y-e.y)<.0001)||[];
  const row=e&&{
   layer:room.layer,globalLayer:layer,id:e.id,time:frame.time,generation:frame.generation,
   nativeAction:!!(e.attack||e.rangedWindup>0),
   busy:!!(e.attack||e.rangedWindup>0||e.storyAttackUntil5>time||['attack','cast','windup'].includes(e.state)),
   xy:[e.x,e.y],project:[project(e.x,e.y).x,project(e.x,e.y).y],
   images:draws.filter(q=>q.kind==='image'&&!q.r620Ghost&&!q.r760Ghost).map(q=>({
    owner:q.owner.id,source:String(q.sourcePath||q.image?.currentSrc||'').split('?')[0],pack:!!q.kairoG34Serpent,
    face:q.r974,rect:q.sourceRect,quad:q.points,size:q.imageSize
   })),
   contacts:draws.filter(q=>q.owner.kind==='contact'&&q.kind==='fill').map(q=>q.paths?.[0]?.points||[])
  };
  const r=old.apply(this,arguments); // only admit a sample after the real renderer accepts it
  if(row){record.rows.push(row);if(record.rows.length>600)record.rows.shift();}
  if(e&&record.mode==='attack'&&row.nativeAction){
   // Maintain a small observed velocity during the real action to expose lost busy gates.
   const dt=Math.max(0,Math.min(.05,time-(record.attackT??time)));
   e.x+=dt*.7;e.y-=dt*.7;record.attackT=time;
  }
  if(e&&record.mode==='walk'){
   const [dx,dy]=c.directions[record.dir],u=((time-record.t0)%2.4)-1.2;
   e.x=player.x+dx*u*.67;e.y=player.y+dy*u*.67;
  }
  return r;
 };
}
export function measureLiveRows({rows,c,dir,id,gate}){
 const stamps=[];
 for(const r of (rows||window.g34Witness.rows)){
  if(r.id!==id||r.layer!=='STORY'||r.globalLayer!=='STORY')continue;
  const q=r.images.find(q=>q.owner==='enemy:'+id&&q.pack&&q.face===dir&&q.source.endsWith(c.pack+'guardian34-'+dir+'.webp')&&
   Array.isArray(q.rect)&&[0,256,512,768].includes(q.rect[0])&&q.rect.slice(1).join(',')==='0,256,256');
  if(q)stamps.push([r.time,r.generation,q.rect[0]]);
 }
 const first=stamps[0], advanced=!!first&&stamps.some(x=>x[0]>first[0]&&x[1]>first[1]&&x[2]!==first[2]);
 const observation={count:stamps.length,first,advanced,crops:[...new Set(stamps.map(x=>x[2]))].sort((a,b)=>a-b)};
 return gate==='first'?observation.count>0:gate==='advanced'?advanced:gate==='four'?observation.crops.length===4:observation;
}
function inspectNative(c){
 const w=window.g34Witness,api=window.__STORYWORLD_MOVE_DIR_R974__,roomRows=w?.rows||[];
 const r974=api?.inspect(), b=w?.baseline;
 return {location:{zone,room:room?.id,roomLayer:room?.layer,layer,loading,modal:!!modal,booted},active:window.__STORYWORLD_PHASE1__?.controller?.inspect().active,
  clock:{time,first:roomRows[0]?.time,last:roomRows.at(-1)?.time,rows:roomRows.length,mode:w?.mode,dir:w?.dir,t0:w?.t0},
  r974,delta:b?{waiting:(r974?.stats.g34Waiting||0)-b.waiting,swaps:(r974?.stats.g34||0)-b.swaps}:null,
  decode:Object.keys(c.directions).map(dir=>{
   const path=c.pack+'guardian34-'+dir+'.webp', raw=imageCache.get(path),im=readyImage(path)?.image;
   return {dir,path,ready:!!im,width:im?.naturalWidth||0,height:im?.naturalHeight||0,
    error:raw?.error||null,attempts:raw?.attempts153||[]};
  }),
  recent:roomRows.slice(-60)};
}
function dirRows(rows,c,dir){
 return rows.filter(r=>r.layer==='STORY'&&r.globalLayer==='STORY'&&
  r.images.some(q=>q.pack&&q.face===dir&&q.source.endsWith(c.pack+'guardian34-'+dir+'.webp')));
}
async function main(){
 const url=checkURL(process.env.STORYWORLD_URL),out=path.resolve(process.env.G34_REPORT||'/tmp/guardian34-browser');
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
 const report={passed:false,scope:'real WebGL, fresh disposable context; staged actor location/velocity, not natural progression or a physical device',checks:{},errors:[]};
 let release, requested=false, page, stage='boot';
 const held=new Promise(r=>{release=r;});
 try{
  await fs.mkdir(out,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
  page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e.message)));
  await page.route(/\/kairo-g34-serpent-v1\/guardian34-left\.webp(?:\?|$)/,async route=>{
   requested=true;await held;try{await route.continue();}catch(e){if(!page.isClosed())throw e;}
  });
  assert.equal((await page.goto(url,{timeout:120000})).status(),200);
  for(const selector of config.selectors)await page.locator(selector).click({timeout:120000});
  await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:120000});
  const settle=()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;};
  await page.evaluate(settle);
  await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.controller?.inspect().active==='three',null,{timeout:120000});
  await page.evaluate(install,config);
  // A fresh campaign has not unlocked kair09. The native restore route returns
  // true even when it redirects a locked target to a safe room. Stage only the
  // preceding canonical completions in this disposable context, then let the
  // stock serializer refresh the real unlock ledger for both layers.
  const order=await page.evaluate(()=>window.__STORYWORLD4__.campaignOrder());
  const done=campaignPrefix(order,config.zone);
  assert.ok(done.length>0,'fixture stages preceding story completions only');
  report.checks.unlock=await page.evaluate(({done,dest})=>{
   const api=window.__STORYWORLD4__, layers=['STORY','DREAM'];
   const before=layers.map(L=>api.isUnlocked(dest,L));
   for(const L of layers)for(const id of done)progress[L][id]=true;
   serializeSave();
   return {before,after:layers.map(L=>api.isUnlocked(dest,L)),completed:layers.map(L=>progress[L][dest]===true),prior:done.length};
  },{done,dest:config.zone});
  assert.deepEqual(report.checks.unlock.after,[true,true],'native route is unlocked in both layers');
  assert.deepEqual(report.checks.unlock.completed,[false,false],'target itself is not marked cleared');
  const visit=async L=>{
   const at=await page.evaluate(async({id,L})=>{
    const opened=window.__STORYWORLD4__.isUnlocked(id,L);
    const ok=await enterRegion(id,null,{layer:L,restore:true,noStory:true});
    return {requested:{zone:id,layer:L},opened,ok,zone,roomId:room?.id,roomLayer:room?.layer,layer,loading,
     roster:room?.enemies?.map(e=>({id:e.nativeId,name:e.name})).slice(0,32)};
   },{id:config.zone,L});
   (report.checks.transitions??={})[L]=at;
   assert.deepEqual([at.opened,at.ok,at.zone,at.roomId,at.roomLayer,at.layer,at.loading],
    [true,true,config.zone,config.zone,L,L,false],'native region transition '+L+' '+JSON.stringify(at));
   await page.evaluate(settle);
   return page.evaluate(c=>{
    const e=room.enemies.find(a=>a.nativeId===c.id&&String(a.name).replace(/\s+\d+$/,'')===c.name);
    if(!e||e.hp<=0)throw Error('Native living same-name guardian missing in '+room.layer);
    for(const q of room.enemies){q.speed=0;q.cd=1e6;}
    player.hp=player.maxHp=99999;player.invincible=1e6;
    e.spawnState='active';e.visible=true;e.disabled=false;e.x=player.x+1;e.y=player.y;e.visualLiftPx=0;
    window.g34Witness.fixture('idle');return {id:e.id,layer:room.layer,name:e.name,path:e.path,ai:e.ai};
   },config);
  };
  const mode=(m,d)=>page.evaluate(([m,d])=>window.g34Witness.fixture(m,d),[m,d]);
  const rows=()=>page.evaluate(()=>window.g34Witness.rows);
  stage='STORY arrival and native idle';
  report.checks.story=await visit('STORY');
  await page.waitForFunction(c=>window.g34Witness.rows.some(r=>!r.busy&&r.images.some(q=>q.source.endsWith(c.native))),config,{timeout:30000});
  assert.ok((await rows()).every(r=>r.images.every(q=>!q.pack)),'idle never uses walk pack');
  // Capture real idle corroboration before the deferred LEFT request exists.
  try{await page.screenshot({path:path.join(out,'story-before-pack.png'),timeout:8000});}
  catch(e){report.beforeScreenshot=String(e.message).slice(0,300);}
  stage='held LEFT, visible fresh partial fallback';
  await mode('walk','up');
  await page.evaluate(()=>{
   const s=window.__STORYWORLD_MOVE_DIR_R974__.inspect().stats;
   window.g34Witness.baseline={waiting:s.g34Waiting||0,swaps:s.g34||0};
  });
  await page.waitForFunction(c=>{
   const i=window.__STORYWORLD_MOVE_DIR_R974__.inspect(),w=window.g34Witness;
   const keys=Object.keys(c.directions);
   return (i.stats.g34Waiting||0)>w.baseline.waiting&&keys.filter(d=>d!=='left').every(d=>{
    const im=readyImage(c.pack+'guardian34-'+d+'.webp')?.image;
    return im?.naturalWidth===1024&&im.naturalHeight===256;
   })&&!readyImage(c.pack+'guardian34-left.webp')&&w.rows.length>=15;
  },config,{timeout:60000});
  assert.ok(requested,'exact left strip request was intercepted');
  const waiting=(await rows()).filter(r=>r.images.length);
  assert.ok(waiting.length>=5&&waiting.every(r=>r.images.every(q=>!q.pack)),'3/4 decoded retains visible native/legacy body');
  report.checks.partialFrames=waiting.length;
  stage='all four real game-cache entries decoded 1024×256';
  release();
  // Do not reset the running UP probe: preserve direction tracker and all rows
  // before and after cache readiness. Decoding is a separate gate, not motion.
  await page.waitForFunction(c=>Object.keys(c.directions).every(d=>{
   const im=readyImage(c.pack+'guardian34-'+d+'.webp')?.image;
   return im?.naturalWidth===1024&&im.naturalHeight===256;
  }),config,{timeout:30000});
  const afterDecode=await page.evaluate(inspectNative,config);
  report.checks.decode={clock:afterDecode.clock,dimensions:afterDecode.decode,delta:afterDecode.delta};
  const args={c:config,dir:'up',id:report.checks.story.id};
  // Share the original 30s real-motion budget across all three UP assertions,
  // starting only after actual decode. This predicate only reads native rows.
  const deadline=Date.now()+30000, budget=()=>Math.max(1,deadline-Date.now());
  stage='first canonical owned UP swap';
  await page.waitForFunction(measureLiveRows,{...args,gate:'first'},{timeout:budget()});
  stage='native UP game clock and different crop advance';
  await page.waitForFunction(measureLiveRows,{...args,gate:'advanced'},{timeout:budget()});
  stage='all four native UP source residues';
  await page.waitForFunction(measureLiveRows,{...args,gate:'four'},{timeout:budget()});
  report.checks.upProgress=measureLiveRows({...args,rows:await rows()});
  report.checks.facings={};
  for(const dir of Object.keys(config.directions)){
   stage='native facing and contact: '+dir;
   if(dir!=='up'){
    await mode('walk',dir);
    await page.waitForFunction(measureLiveRows,{...args,dir,gate:'four'},{timeout:30000});
   }
   const good=dirRows(await rows(),config,dir);
   assert.deepEqual([...new Set(good.flatMap(r=>r.images.filter(q=>q.pack&&q.face===dir).map(q=>q.rect[0])))].sort((a,b)=>a-b),[0,256,512,768]);
   const deltas=[];
   for(const r of good){
    const q=r.images.find(q=>q.pack&&q.face===dir);assert.deepEqual(q.rect.slice(1),[0,256,256]);assert.deepEqual(q.size,[1024,256]);
    assert.ok(q.quad[1][0]>q.quad[0][0],'direction is authored, never mirrored');
    for(const polygon of r.contacts){
     if(polygon.length<4)continue;
     const X=polygon.map(p=>p[0]),Y=polygon.map(p=>p[1]);
     const center=[(Math.max(...X)+Math.min(...X))/2,(Math.max(...Y)+Math.min(...Y))/2];
     assert.ok(Math.hypot(center[0]-r.project[0],center[1]-r.project[1])<2,'native contact centered on projected real actor');
     deltas.push({t:r.time,center,world:r.xy});
    }
   }
   const [x,y]=config.directions[dir], axis=x===y?1:0,sign=x===y?y:x;
   assert.ok(deltas.some((a,i)=>deltas.slice(i+1).some(b=>b.t-a.t>.05&&b.t-a.t<.5&&
    (b.center[axis]-a.center[axis])*sign>2&&Math.abs(b.center[1-axis]-a.center[1-axis])<2 &&
    (b.world[0]-a.world[0])*x>0&&(b.world[1]-a.world[1])*y>0)),dir+' native contact moves in correct projected direction');
   report.checks.facings[dir]={n:good.length,contactSamples:deltas.length,example:good.find(r=>r.contacts.length)||good[0]};
   await page.screenshot({path:path.join(out,dir+'-live.png')});
  }
  stage='native active attack exclusion';
  await mode('attack');
  await page.evaluate(c=>{
   const e=room.enemies.find(a=>a.nativeId===c.id&&String(a.name).replace(/\s+\d+$/,'')===c.name);
   // Open the normal AI attack gate; do not inject e.attack or a synthetic contact.
   const rr=Math.min(1.3,e.combatProfile.attackShape.range*.8);
   const placement=[[rr,0],[-rr,0],[0,rr],[0,-rr]].map(([dx,dy])=>({x:player.x+dx,y:player.y+dy}))
    .find(p=>!blocked(p.x,p.y,.3)&&clearLine(p,player));
   if(!placement)throw Error('No unobstructed native attack placement');
   Object.assign(e,placement,{cd:0,graceUntil:0,rest:0});
  },config);
  await page.waitForFunction(()=>window.g34Witness.rows.filter(r=>r.nativeAction&&r.images.length).length>=5,null,{timeout:30000});
  const attack=(await rows()).filter(r=>r.nativeAction&&r.images.length);
  assert.ok(new Set(attack.map(r=>r.xy.join(','))).size>=3,'native action observed while actor is moving');
  assert.ok(attack.every(r=>r.images.every(q=>!q.pack)),'real AI attack leaves native action art untouched');
  report.checks.attack=attack.slice(0,8);
  stage='native DREAM same-name exclusion';
  report.checks.dream=await visit('DREAM');
  await mode('walk','down');
  await page.waitForFunction(()=>window.g34Witness.rows.filter(r=>r.layer==='DREAM'&&r.globalLayer==='DREAM'&&r.images.length).length>=20,null,{timeout:30000});
  const dream=(await rows()).filter(r=>r.layer==='DREAM'&&r.images.length);
  assert.ok(new Set(dream.map(r=>r.xy.join(','))).size>8&&dream.every(r=>r.images.every(q=>!q.pack&&!q.source.includes(config.pack))),'moving same-ID/same-name DREAM counterpart excluded');
  report.checks.dream.frames=dream.length;
  assert.equal(await page.evaluate(()=>window.__STORYWORLD_PHASE1__.controller.inspect().active),'three');
  assert.deepEqual(report.errors,[]);
  report.passed=true;
 }catch(e){
  report.failure=String(e.stack);report.failedStage=stage;process.exitCode=1;
  if(page&&!page.isClosed()){
   try{report.diagnostic=await Promise.race([page.evaluate(inspectNative,config),new Promise((_,reject)=>setTimeout(()=>reject(Error('diagnostic timeout')),5000))]);}
   catch(error){report.diagnosticError=String(error.message);}
   try{await page.screenshot({path:path.join(out,'failure-live.png'),timeout:8000});}
   catch(error){report.failureScreenshot=String(error.message).slice(0,300);}
  }
 }
 finally{release();await browser.close();await fs.writeFile(path.join(out,'guardian34-browser-results.json'),JSON.stringify(report,null,2)+'\n');}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

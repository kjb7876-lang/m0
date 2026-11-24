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
function install(c){
 const controller=window.__STORYWORLD_PHASE1__.controller, engine=controller.state.three;
 const old=engine.render, record=window.g34Witness={rows:[],mode:'idle',dir:'up',t0:time};
 record.fixture=(mode,dir='up')=>{Object.assign(record,{mode,dir,t0:time,rows:[]});};
 engine.render=function(frame){
  const e=room?.enemies?.find(a=>a.nativeId===c.id&&String(a.name).replace(/\s+\d+$/,'')===c.name);
  const draws=frame.commands?.filter(q=>e&&(q.owner?.kind==='enemy'||q.owner?.kind==='contact')&&
    Math.hypot(q.owner.x-e.x,q.owner.y-e.y)<.0001)||[];
  const row=e&&{
   layer:room.layer,globalLayer:layer,id:e.id,time:frame.time,
   nativeAction:!!(e.attack||e.rangedWindup>0),
   busy:!!(e.attack||e.rangedWindup>0||e.storyAttackUntil5>time||['attack','cast','windup'].includes(e.state)),
   xy:[e.x,e.y],project:[project(e.x,e.y).x,project(e.x,e.y).y],
   images:draws.filter(q=>q.kind==='image'&&!q.r620Ghost&&!q.r760Ghost).map(q=>({
    source:String(q.sourcePath||q.image?.currentSrc||'').split('?')[0],pack:!!q.kairoG34Serpent,
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
function dirRows(rows,c,dir){
 return rows.filter(r=>r.layer==='STORY'&&r.globalLayer==='STORY'&&
  r.images.some(q=>q.pack&&q.face===dir&&q.source.endsWith(c.pack+'guardian34-'+dir+'.webp')));
}
async function main(){
 const url=checkURL(process.env.STORYWORLD_URL),out=path.resolve(process.env.G34_REPORT||'/tmp/guardian34-browser');
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
 const report={passed:false,scope:'real WebGL, fresh disposable context; staged actor location/velocity, not natural progression or a physical device',checks:{},errors:[]};
 let release, requested=false;
 const held=new Promise(r=>{release=r;});
 try{
  await fs.mkdir(out,{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'});
  const page=await context.newPage();
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
  const visit=async L=>{
   assert.equal(await page.evaluate(({id,L})=>enterRegion(id,null,{layer:L,restore:true,noStory:true}),{id:config.zone,L}),true,'native region transition '+L);
   await page.evaluate(settle);
   await page.waitForFunction(({id,L})=>!loading&&room?.id===id&&room.layer===L&&layer===L,{id:config.zone,L},{timeout:90000});
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
  report.checks.story=await visit('STORY');
  await page.waitForFunction(c=>window.g34Witness.rows.some(r=>!r.busy&&r.images.some(q=>q.source.endsWith(c.native))),config,{timeout:30000});
  assert.ok((await rows()).every(r=>r.images.every(q=>!q.pack)),'idle never uses walk pack');
  await mode('walk','up');
  await page.waitForFunction(c=>{
   const i=window.__STORYWORLD_MOVE_DIR_R974__.inspect(),rs=window.g34Witness.rows;
   return i.stats.g34Waiting>0&&['up','down','right'].every(d=>readyImage(c.pack+'guardian34-'+d+'.webp')?.image?.naturalWidth===1024)&&rs.length>=15;
  },config,{timeout:60000});
  assert.ok(requested,'exact left strip request was intercepted');
  const waiting=(await rows()).filter(r=>r.images.length);
  assert.ok(waiting.length>=5&&waiting.every(r=>r.images.every(q=>!q.pack)),'3/4 decoded retains visible native/legacy body');
  report.checks.partialFrames=waiting.length;release();
  report.checks.facings={};
  for(const dir of Object.keys(config.directions)){
   await mode('walk',dir);
   await page.waitForFunction(({c,dir})=>new Set(window.g34Witness.rows.flatMap(r=>r.images
    .filter(q=>q.pack&&q.face===dir&&q.source.endsWith(c.pack+'guardian34-'+dir+'.webp')).map(q=>q.rect?.[0]))).size===4,{c:config,dir},{timeout:30000});
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
  report.checks.dream=await visit('DREAM');
  await mode('walk','down');
  await page.waitForFunction(()=>window.g34Witness.rows.filter(r=>r.layer==='DREAM'&&r.globalLayer==='DREAM'&&r.images.length).length>=20,null,{timeout:30000});
  const dream=(await rows()).filter(r=>r.layer==='DREAM'&&r.images.length);
  assert.ok(new Set(dream.map(r=>r.xy.join(','))).size>8&&dream.every(r=>r.images.every(q=>!q.pack&&!q.source.includes(config.pack))),'moving same-ID/same-name DREAM counterpart excluded');
  report.checks.dream.frames=dream.length;
  assert.equal(await page.evaluate(()=>window.__STORYWORLD_PHASE1__.controller.inspect().active),'three');
  assert.deepEqual(report.errors,[]);
  report.passed=true;
 }catch(e){report.failure=String(e.stack);process.exitCode=1;}
 finally{release();await browser.close();await fs.writeFile(path.join(out,'guardian34-browser-results.json'),JSON.stringify(report,null,2)+'\n');}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();

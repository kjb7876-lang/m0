import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const cases=['stale-live-first-no-new-launch','native-second-launch-first-still-live'];
if(process.argv.includes('--list')){console.log(JSON.stringify(cases));process.exit(0);}
const url=new URL(process.env.SW_URL||'http://127.0.0.1:4410/m0/');
assert(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/m0/'&&!url.username&&!url.password&&!url.search&&!url.hash);
process.env.SW_URL=url.href;
const expected=process.env.SW0027_R1302_SHA||'f4b60946c5cc584229f874ac346668e052e38a950b5463553e478d913de3c1a2';
assert.match(expected,/^[a-f\d]{64}$/);
const output=process.env.SW0027_PROJECTILE_OUTPUT||'r96/qa/hero-summon-v1/projectile-sequence-evidence';
assert(!fs.existsSync(output)||fs.readdirSync(output).length===0);
fs.mkdirSync(output,{recursive:true});
const {chromium,boot,go}=await import('../r444/lib.mjs');
const b=await chromium.launch({headless:true,chromiumSandbox:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const result=[];
try{
 for(const mode of cases){
  const {ctx,p}=await boot(b,{vp:{width:960,height:540}});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  try{
   await go(p,'dist00');
   const response=await p.request.get(new URL('hwando-3d-r1302.js',url).href);
   assert(response.ok());assert.equal(createHash('sha256').update(await response.body()).digest('hex'),expected);
   await p.evaluate(async()=>{
    player.hero='hunter';player.personaHeroR1113=false;player.egoSovereignR1046=false;
    auto=false;guide=false;route=[];command=null;
    // Disposable empty-room fixture: no invented hits, no persistence or changes to gameplay functions.
    room.enemies=[];player.attackCD=0;player.attackAnim=0;player.skillAnim=0;player.ultimateAnim=0;player.combo=0;player.moving=false;
    player.direction='right';player.currentVisualSector=null;
    await ensureImages(heroPaths('hunter'));
    window.__STORYWORLD_HWANDO3D_R1302__.set(true);
   });
   await p.waitForFunction(()=>{const s=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return s.hero==='hunter'&&s.ready&&s.shown&&s.spirit?.visible;},null,{timeout:120000});
   const receipt=await p.evaluate(async admitSecond=>{
    const A=window.__STORYWORLD_HWANDO3D_R1302__,C=window.__STORYWORLD_PHASE1__.controller;
    const r=C.state.three; if(C.state.active!=='three'||!r?.commands?.rows)throw Error('native Three missing');
    const aim=storyAim22(),dx=Math.cos(aim)*9.1,dy=Math.sin(aim)*9.1;
    let start=null;
    for(let x=2;x<N-2&&!start;x+=.5)for(let y=2;y<N-2&&!start;y+=.5){
     const end={x:x+dx,y:y+dy};
     if(Math.min(end.x,end.y)>1&&Math.max(end.x,end.y)<N-1&&!blocked(x,y,.29)&&clearLine({x,y},end))start={x,y};
    }
    if(!start)throw Error('no safe authentic-map in-flight runway');
    Object.assign(player,start);if(Array.isArray(player.path))player.path.length=0;cam.x=start.x;cam.y=start.y;
    const key=()=>{for(const type of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(type,{key:'a',code:'KeyA',bubbles:true,cancelable:true}));};
    const before=C.bridge.events.serial,doneAt=performance.now()+12000;
    const frame=()=>new Promise(res=>requestAnimationFrame(res));
    const ensureTime=()=>{if(performance.now()>doneAt)throw Error('native projectile sequencing observation timed out');};
    const isShot=e=>e?.type==='projectile-spawn'&&e.hero==='hunter';
    const live=()=>C.bridge.frame.projectiles.map(x=>x.id);
    key();
    let first,firstEvidence=null;
    while(!firstEvidence){
     await frame();ensureTime();
     first=C.bridge.events.since(before).find(isShot);
     const s=A.inspect().summon;
     if(first&&s?.visible&&s.nativeEvent===first.serial&&live().includes(first.id))
      firstEvidence={at:time,serial:first.serial,live:live()};
    }
    while(player.attackCD>0){await frame();ensureTime();}
    const liveAtDispatch=live();
    if(!liveAtDispatch.includes(first.id)||player.attackAnim>0)throw Error('old shot not genuinely live at native cooldown boundary');
    const old=makeShot;
    if(!admitSecond)makeShot=function(...a){return a[5]?.friendly&&a[5]?.owner==='hero'?null:old.apply(this,a);};
    const count=player.combo,at=time;
    try{key();}finally{makeShot=old;}
    if(player.combo!==count+1||player.attackAnim<=0)throw Error('second native input did not enter a new attack');
    const samples=[];let firstFrameAt=null;
    while(time-at<.27){
     await frame();ensureTime();
     const s=A.inspect().summon,keys=[...r.commands.rows.keys()].filter(k=>String(k).startsWith('summoner-echo:'));
     if(firstFrameAt===null)firstFrameAt=time;
     samples.push({t:time,serial:s?.visible?s.nativeEvent:null,keys,live:live(),attackAnim:player.attackAnim});
    }
    return {first:firstEvidence,secondAt:at,liveAtDispatch,firstFrameAt,samples,receipts:C.bridge.events.since(first.serial).filter(isShot)};
   },mode===cases[1]);
   assert.deepEqual(errors,[]);
   const {first,receipts,samples,liveAtDispatch}=receipt,positive=mode===cases[1];
   assert(liveAtDispatch.some(id=>first.live.includes(id))&&receipt.secondAt>first.at);
   assert(samples.some(s=>s.attackAnim>0));assert(samples.every(s=>s.serial!==first.serial&&s.keys.length<=1));
   if(positive){
    assert.equal(receipts.length,1);
    const next=receipts[0];assert(next.serial>first.serial);
    const matching=samples.filter(s=>s.serial===next.serial&&s.keys[0]==='summoner-echo:hunter');
    assert(matching.length>0,'authentic second launch has no matching physical render row');
    assert(matching.some(s=>s.live.includes(next.id)&&s.live.some(id=>first.live.includes(id))),'both real projectiles must still be live in an observed matching frame');
   }else{
    assert.equal(receipts.length,0);
    assert(samples.every(s=>s.serial===null&&s.keys.length===0),'expired source receipt created a phantom');
   }
   result.push({mode,receipt});
  }finally{await ctx.close();}
 }
}finally{await b.close();fs.writeFileSync(path.join(output,'projectile-sequence.json'),JSON.stringify({expected,result},null,2));}

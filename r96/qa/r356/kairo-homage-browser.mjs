// R356 headless check (Playwright) on a built site — 윤서하 '시간 제어' 실제 발동과 카이로 구역 소리 호출 기록.
//   STORYWORLD_URL=http://127.0.0.1:4436/m0/ OUT=out/r356 node r96/qa/r356/kairo-homage-browser.mjs
// Headless Chromium: 판정·호출·화면 구성만 본다. GPU 그래픽·실기기 모바일·소리 품질은 검증하지 않는다(임시).
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4436/m0/',OUT=process.env.OUT||'out/r356';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const results=[];const check=(name,ok,info)=>{results.push({name,ok:!!ok,info});if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,500)));};
const skip=p=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
async function boot(viewport,off){const b=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext({viewport,deviceScaleFactor:viewport.width<500?2:1,isMobile:viewport.width<500,hasTouch:viewport.width<500});
 await ctx.addInitScript(o=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));if(o)localStorage.setItem('storyworld.r356.kairo','0');}catch(_){}},off);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(1000);await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip(p);
 await p.evaluate(async()=>{await enterRegion('kair02',null,{layer:'STORY',restore:true});});await p.waitForFunction(()=>!loading&&room?.id==='kair02',null,{timeout:120000});await skip(p);
 await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('seoha'));player.hero='seoha';}finally{loading=false;}updateHUD();guide=false;auto=false;try{unlockAudio();}catch(_){}});
 await p.waitForTimeout(1500);return {b,p,errors};}
// 실제 엔진 위험지대를 영웅 발밑에 두고, 발동 직전에 빠져나간다
const scenario=p=>p.evaluate(async()=>{player.hp=Math.max(player.hp,maxHP());for(const e of room.enemies)e.cd=Math.max(e.cd||0,30);
 const foe=room.enemies.find(e=>e.hp>0)||{id:-1,x:player.x+3,y:player.y,profile:{}};
 const shot=enemyShot(foe,0,0.0001,3,{});shot.x=player.x+1.2;shot.y=player.y-.6;shot.vx=1.5;shot.vy=.2;shot.life=6;
 hazards.push({id:++uid,type:'burst',owner:foe.id,x:player.x,y:player.y,radius:1.3,age:0,warning:.9,life:1.6,asset:VFX.burst,damage:4,lastHit:-99});
 const h=hazards[hazards.length-1],wait=ms=>new Promise(r=>setTimeout(r,ms));
 // 헤드리스는 게임 시간이 느리게 흐른다 → 실제 시간 대신 게임 시간(위험지대 나이)으로 기다린다
 for(let i=0;i<100&&h.age<h.warning*.5;i++)await wait(50);player.x+=2.2;for(let i=0;i<150&&h.age<h.warning+.15;i++)await wait(50);
 return {api:window.__STORYWORLD_KAIRO_HOMAGE_R356__?.inspect?.()||null,shotV:[shot.vx,shot.vy],hp:player.hp};});
for(const [label,viewport] of [['pc',{width:1280,height:720}],['mobile',{width:390,height:844}]]){
 for(const off of [true,false]){const {b,p,errors}=await boot(viewport,off);
  const zone=await p.evaluate(()=>({id:room.id,layer:room.layer,hero:player.hero,api:window.__STORYWORLD_KAIRO_HOMAGE_R356__?.inspect?.()}));
  if(!off){check(label+': in Kairo story zone as Seoha',zone.id==='kair02'&&zone.hero==='seoha'&&zone.api?.kairo&&zone.api?.seoha,zone);
   check(label+': zone-entry toll requested once',zone.api.stats.stings===1,zone.api.stats);}
  const r=await scenario(p);
  if(off)check(label+': toggle off = no trigger',!r.api||r.api.stats.triggers===0,r.api?.stats);
  else{check(label+': 시간 제어 fired by escaping a real engine telegraph',r.api.stats.triggers===1&&r.api.stats.escapes>=1,r.api.stats);
   check(label+': clock ticks requested while telegraph ripened',r.api.stats.ticks>=2,r.api.stats.sounds);
   check(label+': sounds requested (tick/chime/toll)',r.api.stats.sounds.chime===1,{sounds:r.api.stats.sounds,audioRunning:r.api.audio});
   check(label+': no overlay errors',r.api.stats.errors===0,r.api.lastError);}
  // 같은 카메라에서 다시 한 번 발동시키고 연출 중간을 찍는다(끈 쪽은 같은 순간)
  await p.evaluate(()=>{const api=window.__STORYWORLD_KAIRO_HOMAGE_R356__;hazards.length=0;effects.length=0;if(api&&api.on()){/* 재사용 대기 풀기 위해 시간을 앞당기지 않고 바로 연출만 */}});
  const second=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const api=window.__STORYWORLD_KAIRO_HOMAGE_R356__;for(let i=0;i<400&&api&&api.on()&&api.inspect().readyIn>0;i++)await wait(50);
   const foe=room.enemies.find(e=>e.hp>0)||{id:-1};const h={id:++uid,type:'burst',owner:foe.id,x:player.x,y:player.y,radius:1.3,age:0,warning:.6,life:1.2,asset:VFX.burst,damage:4,lastHit:-99};hazards.push(h);
   for(let i=0;i<100&&h.age<.3;i++)await wait(50);player.x+=2.2;
   const shot=makeShot(player.x+1.1,player.y+.4,0,.35,2,{owner:foe.id,asset:VFX.bolt});if(shot){shot.x=player.x+1.1;shot.y=player.y+.4;shot.vx=.35;shot.vy=0;shot.life=8;}
   for(let i=0;i<100&&h.age<h.warning+.12;i++)await wait(50);return {stats:api?.inspect().stats,shot:shot?{vx:shot.vx,dead:!!shot.dead}:null};});
  await p.screenshot({path:`${OUT}/${off?'before':'after'}-${label}.jpg`,type:'jpeg',quality:80});
  if(!off)check(label+': hostile projectile near Seoha frozen by 시간 제어',second.stats.frozen>=1&&second.shot&&second.shot.vx===0,second);
  check(label+(off?' (off)':'')+': no page errors',errors.length===0,errors);
  await b.close();}}
fs.writeFileSync(`${OUT}/results.json`,JSON.stringify({fails,results},null,1));
console.log(JSON.stringify({ok:fails===0,fails,checks:results.length,method:'headless Chromium (임시) — GPU·실기기·소리 품질 미검증'}));
process.exit(fails?1:0);

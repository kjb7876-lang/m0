// R1289 전수(헤드리스): 영웅 8명 × (보통·EGO·페르소나) × (멈춰 S·걸으며 S) × (PC·터치 모바일) 에서 실제 S 키 블링크 뒤
//  rAF 마다 영웅 화면 위치(가운데에서 떨어진 px)·한 프레임 이동량·R1266 맞춤 횟수를 잰다. GPU·실기기 아님.
import {chromium,boot,skip,go} from '../r444/lib.mjs';
import fs from 'node:fs';
const b=await chromium.launch();const out=[];const errors=[];
const kinds=(process.env.KINDS||'pc,touch').split(',');
for(const kind of kinds){
 const ctx=await b.newContext(kind==='touch'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1280,height:720},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(kind+': '+String(e).slice(0,160)));
 await p.goto(process.env.SW_URL||'http://127.0.0.1:4410/m0/');await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip(p);
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
 await go(p,process.env.ZONE||'murder01');
 const heroes=await p.evaluate(()=>Object.keys(HEROES));
 const forms=[];for(const h of heroes)forms.push([h,'normal']);forms.push(['hwando','ego'],['lauren','persona']);
 for(const [h,form] of forms)for(const walk of [false,true]){
  await p.evaluate(async([h,form])=>{await ensureImages(heroPaths(h));player.hero=h;auto=false;try{guide=false}catch(_){}
   const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;try{E?.setForm?.(form==='ego');}catch(_){}player.personaHeroR1113=form==='persona';
   for(const e of liveEnemies()){e.x=player.x+40;e.y=player.y+40;e.speed=0;}player.hp=Math.max(player.hp,300);player.invincible=9;player.blinkCD=0;
   await new Promise(r=>{const t0=time;const w=()=>{if(time-t0>.8)r();else requestAnimationFrame(w)};requestAnimationFrame(w)});},[h,form]);
  if(walk){await p.keyboard.down('ArrowRight');await p.waitForTimeout(400);}
  await p.evaluate(()=>{const off=()=>{const q=project(player.x,player.y);return Math.round(Math.hypot(q.x-W/2,q.y-H/2))};window.__r=[];window.__s0=window.__STORYWORLD_BLINK_CAMERA_R1236__?.inspect().stats.snaps||0;
   let px=player.x,py=player.y;const f=()=>{window.__r.push([off(),+Math.hypot(player.x-px,player.y-py).toFixed(2),+time.toFixed(2)]);px=player.x;py=player.y;if(window.__r.length<10)requestAnimationFrame(f)};window.__pre=off();requestAnimationFrame(f);});
  await p.keyboard.press('s');await p.waitForFunction(()=>window.__r.length>=10,null,{timeout:120000});if(walk)await p.keyboard.up('ArrowRight');
  const r=await p.evaluate(([h,form])=>({ego:!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),persona:!!player.personaHeroR1113,hero:player.hero,pre:window.__pre,offs:window.__r.map(q=>q[0]),steps:window.__r.map(q=>q[1]),snaps:(window.__STORYWORLD_BLINK_CAMERA_R1236__?.inspect().stats.snaps||0)-window.__s0,owner:window.__STORYWORLD_WORLD_PRESENTATION_R81__?.ownsCamera?.()?'R81':'R63',err:window.__STORYWORLD_BLINK_CAMERA_R1236__?.inspect().lastError}),[h,form]);
  const row={kind,h,form,walk,...r};out.push(row);console.log(JSON.stringify(row));}
 await ctx.close();}
fs.writeFileSync(new URL('./census-result.json',import.meta.url),JSON.stringify({out,errors},null,1));console.log('errors',errors.length,errors.slice(0,3));await b.close();

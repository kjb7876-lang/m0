// R390 headless check: 한 번 발견한 적은 영웅이 멀리 가도 쫓아온다(dist00, 영화 모드 길잡이로 입장).
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=r96/qa/r390/out node r96/qa/r390/r390-browser.mjs
// 헤드리스(소프트웨어 렌더): 판정만 본다. GPU·실기기·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(name,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+name+(info===undefined?'':' '+JSON.stringify(info).slice(0,400)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:1280,height:720}});
await ctx.addInitScript(()=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));}catch(_){}});
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);
await p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
check('R390 chase overlay loaded and R74 pursuing wrapped',await p.evaluate(()=>window.__STORYWORLD_AGGRO_CHASE_R390__?.inspect().wrapped===true));
await p.evaluate(()=>window.__STORYWORLD_CINEMA_MODE_R370__.set({on:true}));
await p.waitForFunction(()=>room?.id==='dist00'&&!loading,null,{timeout:240000});
// 길잡이를 끄고, 무리 몹 하나 곁으로 가서 발견되게 한 뒤 멀리 달아난다.
const s0=await p.evaluate(async()=>{window.__STORYWORLD_CINEMA_MODE_R370__.set({on:false});guide=false;auto=false;player.invincible=9999;window.__r390p=()=>{player.vx=player.vy=0;};
 const e=room.enemies.find(e=>e.hp>0&&!e.deadRecorded&&e.spawnState!=='hidden'&&!e.boss&&!e.midboss&&e.explorationGroup&&Number.isFinite(e.explorationLeash));if(!e)return null;
 for(let i=0;i<40&&!window.__STORYWORLD_AGGRO_CHASE_R390__.engaged(e);i++){player.x=e.x+1.2;player.y=e.y;player.vx=player.vy=0;await new Promise(r=>setTimeout(r,500));}
 const engaged=window.__STORYWORLD_AGGRO_CHASE_R390__.engaged(e);
 // 무리 자리에서 목줄 밖, 같은 바닥 위 먼 칸으로
 let far=null;for(let k=0;k<400&&!far;k++){const a=Math.random()*Math.PI*2,d=e.explorationLeash+4+Math.random()*8,q={x:e.homeX+Math.cos(a)*d,y:e.homeY+Math.sin(a)*d};if(!blocked(q.x,q.y,.4)&&findPath(e,q,room).length)far=q;}
 if(!far)return{engaged,far:null};player.x=far.x;player.y=far.y;const d0=Math.hypot(e.x-player.x,e.y-player.y);window.__r390e=e;return{engaged,aggro:e.combatProfile?.aggro,leash:e.explorationLeash,d0:+d0.toFixed(1),homeToHero:+Math.hypot(e.homeX-player.x,e.homeY-player.y).toFixed(1)};});
check('mob spotted after the hero stands next to it',s0&&s0.engaged,s0);
await p.waitForTimeout(45000);
const s1=await p.evaluate(()=>{const e=window.__r390e;return{alive:e.hp>0,d:+Math.hypot(e.x-player.x,e.y-player.y).toFixed(1),fromHome:+Math.hypot(e.x-e.homeX,e.y-e.homeY).toFixed(1),pursuing:window.__STORYWORLD_WORLD_R74__.pursuing(e)};});
check('hero beyond the group leash: spotted mob still pursues and closes in (left its home)',s1.pursuing&&s1.d<s0.d0-1&&s1.fromHome>2,{s0,s1});
await p.screenshot({path:`${OUT}/chase.jpg`,quality:72});
check('no page errors / R390 errors',errors.length===0&&(await p.evaluate(()=>window.__STORYWORLD_AGGRO_CHASE_R390__.inspect().stats.errors))===0,errors);
console.log(JSON.stringify({fails}));await b.close();process.exitCode=fails?1:0;

// R1011 헤드리스: 환도 · 사몽 0번(생존 666) · 777 코드 레벨 칸 777 → 실제 레벨·체력·공격력이 유한한지, 게임 시간 동안 NaN 없이 도는지,
// 이펙트·투사체 수를 Lv.1 과 견준다(렉 조사 스레드에 넘길 수치). 헤드리스 소프트웨어 렌더링(GPU·실기기 아님).
// 사용: node r1011-samong-probe.mjs <출력폴더> <URL>
import {createRequire} from 'node:module';import fs from 'node:fs';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL]=process.argv.slice(2);fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').click({timeout:20000}).catch(()=>{});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
async function run(level){
 const r=await p.evaluate(async lv=>window.__STORYWORLD_CHEAT_LEVEL_R970__.activate('777',lv),level);await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 if((await p.evaluate(()=>layer))!=='DREAM'){await p.evaluate(()=>window.__STORYWORLD_CHEAT777__.goSamong(0,0,{force:true}));await p.waitForFunction(()=>!loading&&layer==='DREAM',null,{timeout:180000}).catch(()=>{});await skip();}
 await p.evaluate(()=>{player.hp=maxHP();player.invincible=9999;});
 const t0=await p.evaluate(()=>time),wall0=Date.now();const samples=[];
 for(let k=0;k<8;k++){await p.waitForTimeout(2500);samples.push(await p.evaluate(()=>{const fin=v=>Number.isFinite(v);const en=room.enemies.filter(e=>e.hp>0);
  return {t:+time.toFixed(2),level:player.level,points:player.points,hp:player.hp,maxHp:maxHP(),atk:attackPower(),x:player.x,y:player.y,
   enemies:en.length,badEnemy:en.filter(e=>!fin(e.x)||!fin(e.y)||!fin(e.hp)).length,effects:(typeof effects!=='undefined'&&effects?.length)||0,shots:(typeof projectiles!=='undefined'&&projectiles?.length)||(typeof shots!=='undefined'&&shots?.length)||0,zone,layer};}));
  await p.evaluate(()=>{player.hp=maxHP();});}
 return {level,activate:r,gamePerWall:+((samples.at(-1).t-t0)/((Date.now()-wall0)/1000)).toFixed(3),samples};}
const lo=await run(1);const hi=await run(777);
const all=[...lo.samples,...hi.samples];const finite=all.every(s=>[s.hp,s.maxHp,s.atk,s.x,s.y].every(Number.isFinite)&&s.badEnemy===0);
const avg=(a,k)=>+(a.reduce((x,s)=>x+s[k],0)/a.length).toFixed(1);
const out={lo:{level:lo.level,gamePerWall:lo.gamePerWall,effects:avg(lo.samples,'effects'),shots:avg(lo.samples,'shots'),enemies:avg(lo.samples,'enemies'),atk:lo.samples[0].atk,maxHp:lo.samples[0].maxHp},
 hi:{level:hi.samples[0].level,gamePerWall:hi.gamePerWall,effects:avg(hi.samples,'effects'),shots:avg(hi.samples,'shots'),enemies:avg(hi.samples,'enemies'),atk:hi.samples[0].atk,maxHp:hi.samples[0].maxHp,where:hi.samples[0].zone+'/'+hi.samples[0].layer},finite,errs};
fs.writeFileSync(OUT+'/r1011-samong-probe.json',JSON.stringify({out,lo,hi},null,2));await p.screenshot({path:OUT+'/r1011-samong-lv777.png'});console.log(JSON.stringify(out,null,1));
await b.close();process.exit(finite&&hi.samples[0].level===777&&errs.length===0?0:1);

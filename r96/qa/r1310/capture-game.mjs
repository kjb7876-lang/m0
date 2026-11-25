// R1310 게임 안 걷기 장면 찍기(헤드리스, 소프트웨어 WebGL — 그래픽 검증 아님). STORYWORLD_URL, OUT, HEROES=persona,seoha
import {chromium} from 'playwright';import fs from 'node:fs';
const URL_=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/',OUT=process.env.OUT||'r96/qa/r1310/game';fs.mkdirSync(OUT,{recursive:true});
const heroes=(process.env.HEROES||'persona,seoha').split(',');const DIRS=(process.env.DIRS||'toward').split(',');
const b=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});const page=await b.newPage({viewport:{width:960,height:600}});
await page.goto(URL_,{timeout:120000});await page.locator('#campaignNew54').click({timeout:120000});await page.locator('#slotConfirmR73').click();
await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:120000});
await page.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;player.hp=player.maxHp=99999;room.enemies.length=0;});
await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.controller?.inspect().active==='three',null,{timeout:120000});
for(const hero of heroes)for(const dir of DIRS){
 await page.evaluate(async hero=>{const base=hero==='persona'?'lauren':hero==='ego'?'hwando':hero;const api=window.__STORYWORLD_HWANDO3D_R1302__;api.set(false);await ensureImages(heroPaths(base));player.hero=base;
  const persona=window.__STORYWORLD_PERSONA_HERO_R1113__,ego=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;persona.setForm(false);ego.setForm(false);
  if(hero==='persona'){persona.unlock('silent');persona.setForm(true);}if(hero==='ego'){ego.unlock('rc151');ego.setForm(true);}api.set(true);},hero);
 await page.waitForFunction(hero=>{const v=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return v.hero===hero&&v.ready&&v.shown;},hero,{timeout:90000});
 const D={toward:[1,1],away:[-1,-1],right:[1,-1],left:[-1,1]}[dir];
 const home=await page.evaluate(()=>({x:player.x,y:player.y}));
 for(let i=0;i<14;i++){
  await page.evaluate(([D,home])=>{const k=Math.hypot(player.x-home.x,player.y-home.y);if(k>2.5){player.x=home.x;player.y=home.y;}route=[{x:player.x+D[0]*2,y:player.y+D[1]*2}];},[D,home]);
  const t0=await page.evaluate(()=>time);await page.waitForFunction(t0=>time-t0>.06,t0,{timeout:20000});
  await page.screenshot({path:`${OUT}/${hero}-${dir}-${String(i).padStart(2,'0')}.png`,clip:{x:330,y:150,width:300,height:300}});
 }
 await page.evaluate(()=>{route=[];});
}
await b.close();

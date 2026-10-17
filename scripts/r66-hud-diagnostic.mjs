import fs from 'node:fs';
import {chromium} from 'playwright';
const html=fs.readFileSync('docs/index.html','utf8');
for(const term of ['bossbar','bossHP']){
 const matches=[...html.matchAll(new RegExp(term,'g'))];console.log('HUD_SOURCE_COUNT',term,matches.length);
 for(const m of matches)console.log('HUD_SOURCE',html.slice(Math.max(0,m.index-140),m.index+300).replaceAll('\n',' '));
}
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1365,height:850}});page.on('pageerror',e=>console.log('HUD_ERROR',e.message));
 await page.goto(process.env.STORYWORLD_URL||'http://127.0.0.1:4391/',{waitUntil:'load',timeout:60000});
 await page.locator('#campaignNew54').click();await page.waitForFunction(()=>window.eval('started&&booted&&!loading'),null,{timeout:60000});
 await page.evaluate(()=>enterRegion('dist00',null,{restore:true,noStory:true,difficultyR63:'normal',position:{x:15,y:19}}));
 await page.waitForFunction(()=>window.eval('!loading&&!modal'));
 await page.evaluate(()=>{auto=false;settings.autoSkill=false;room.engaged=true;const b=room.enemies.find(e=>e.boss||e.midboss);b.hp=3210.5;b.maxHp=6421.5;updateHUD();});
 const result=await page.evaluate(()=>{
  const describe=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{id:e.id,class:e.className,tag:e.tagName,display:s.display,visibility:s.visibility,position:s.position,width:r.width,height:r.height,top:r.top,left:r.left,inline:e.getAttribute('style'),text:e.textContent?.slice(0,150)};};
  const ancestors=[];for(let e=document.getElementById('bossHPNumbersR66');e;e=e.parentElement)ancestors.push(describe(e));
  const bosses=[...document.querySelectorAll('[id]')].filter(e=>/boss|health/i.test(e.id)).map(describe);
  return{ancestors,bosses,engaged:room.engaged,modal,loading,zone,hero:player.hero};
 });console.log('HUD_DIAGNOSTIC',JSON.stringify(result));
 await page.screenshot({path:'out/r66/hud-diagnostic.png'});
}finally{await browser.close();}

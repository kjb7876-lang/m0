// R912 전후 장면(헤드리스): 영웅별 비행·적중 순간을 멈춰 시트 끔/켬을 같은 프레임으로 찍는다. 몹 탄은 지역을 돌며 찍는다.
//  실행: node r96/qa/r912/scene.mjs heroes | mobs
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const {chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4411/m0/';const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const OUT=path.join(HERE,'review');fs.mkdirSync(OUT,{recursive:true});const mode=process.argv[2]||'heroes';
const b=await chromium.launch();
async function boot(hero){const ctx=await b.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth',JSON.stringify({on:false}));});
 const p=await ctx.newPage();p.on('pageerror',e=>console.log('PAGEERR',String(e).slice(0,200)));
 await p.goto(URL,{timeout:240000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
 const skip=()=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(600);await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.addScriptTag({content:HELPER});
 await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
 const go=async z=>{await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip();};
 return {p,ctx,skip,go};}
async function pair(p,name,find,S=[460,300]){
 const f=await p.evaluate(src=>{const A=window.__STORYWORLD_PROJ_SHEETS_R912__;const pick=eval('('+src+')')(A);if(!pick)return null;window.__SLOW=1e-4;const r=document.getElementById('game').getBoundingClientRect(),q=project(pick.x,pick.y);return{x:q.x+r.left,y:q.y+r.top-18*zoom,w:r.width,h:r.height};},find.toString());
 if(!f)return false;const clip={x:Math.round(Math.max(0,Math.min(f.w-S[0],f.x-S[0]/2))),y:Math.round(Math.max(0,Math.min(f.h-S[1],f.y-S[1]/2))),width:S[0],height:S[1]};
 await p.evaluate(()=>{window.__STORYWORLD_PROJ_SHEETS_R912__.setEnabled(false);draw();draw();});await p.screenshot({path:path.join(OUT,name+'-before.png'),clip});
 await p.evaluate(()=>{window.__STORYWORLD_PROJ_SHEETS_R912__.setEnabled(true);draw();draw();});await p.screenshot({path:path.join(OUT,name+'-after.png'),clip});
 await p.evaluate(()=>{window.__SLOW=1;});console.log('shot',name);return true;}
if(mode==='heroes'){
 const WANT={seoha:['pj01','pj05','pj06'],hunter:['pj02','pj07'],michaela:['pj03'],gunner:['pj04']};
 for(const hero of (process.argv[3]||'seoha,hunter,michaela,gunner').split(',')){const {p,ctx,skip,go}=await boot(hero);await go('dist00');const got={};
  const KEYS=['a','a','q','a','a','s','a','q'];
  for(let i=0;i<40&&(WANT[hero].some(k=>!got[k])||!got.hit);i++){await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});const k=KEYS[i%KEYS.length];await p.keyboard.down(k);await p.evaluate(()=>__HQ795.step(.3,2));await p.keyboard.up(k);await skip();
   for(const kind of WANT[hero])if(!got[kind]){if(await pair(p,`${hero}-${kind}`,eval(`(A=>projectiles.find(b=>!b.dead&&b.age>.1&&A.kindOf(b)==='${kind}'&&(()=>{const q=project(b.x,b.y);return q.x>240&&q.x<W-240&&q.y>170&&q.y<H-150;})()))`)))got[kind]=1;}
   if(!got.hit&&await pair(p,`${hero}-hit`,A=>effects.find(e=>e.type==='r912hit'&&e.age>.06&&e.age<.22)))got.hit=1;}
  console.log(hero,JSON.stringify(got));await ctx.close();}
}else{
 const {p,ctx,skip,go}=await boot('gunner');
 const zones=await p.evaluate(()=>Object.values(regionById).filter(r=>!r.safe).map(r=>[r.id,r.title,window.__STORYWORLD_PROJ_SHEETS_R912__.themeFor(r.id)]));
 fs.writeFileSync(path.join(HERE,'themes.json'),JSON.stringify(zones,null,0).replace(/\],\[/g,'],\n['));console.log('zones',zones.length);
 const want=(process.argv[3]||'dist06,ep1b02,dist02,murder01,ep1b05').split(',');const hosp=zones.filter(z=>z[2]==='pj09c').map(z=>z[0]).slice(0,2);
 for(const z of [...want,...hosp]){try{await go(z);}catch(e){console.log('zone fail',z);continue;}let ok=false,hit=false;
  for(let i=0;i<26&&!(ok&&hit);i++){await p.evaluate(()=>{player.hp=maxHP();__HQ795.engage(false);});await p.evaluate(()=>__HQ795.step(.3,3));await skip();
   if(!ok)ok=await pair(p,`mob-${z}`,A=>projectiles.find(b=>!b.dead&&!b.friendly&&b.age>.15&&A.kindOf(b)&&(()=>{const q=project(b.x,b.y);return q.x>240&&q.x<W-240&&q.y>170&&q.y<H-150;})()));
   if(!hit)hit=await pair(p,`mob-${z}-hit`,A=>effects.find(e=>e.type==='r912hit'&&/pj09|pj10/.test(e.r912)&&e.age>.06&&e.age<.22));}
  console.log(z,ok,hit,JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_PROJ_SHEETS_R912__.stats)));}
 await ctx.close();}
await b.close();

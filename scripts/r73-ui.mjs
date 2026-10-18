import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const out='out/r73',url='http://127.0.0.1:4391/';await fs.mkdir(out,{recursive:true});
const report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sandbox:true,physicalGPU:false,scope:'isolated browser storage; actual buttons, code input, difficulty confirmation and keyboard movement; no internal entry calls or unlock/progress fixtures',runs:[]},browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--disable-dev-shm-usage']});
const save=()=>fs.writeFile(`${out}/ui.json`,JSON.stringify(report,null,2));
async function state(page){return page.evaluate(()=>({zone,layer,loading,modal,started,booted,story:storyScene?.key,profile:window.__STORYWORLD_STORY_PROFILE_R54__.inspect(),cheat:window.__STORYWORLD_CHEAT777__.active(),player:player&&{x:player.x,y:player.y,hp:player.hp},panel:$('panel').innerText.slice(0,1500)}));}
async function settle(page){await page.waitForFunction(()=>started&&!loading&&window.__STORYWORLD_STORY_PROFILE_R54__.inspect().stage==='playing',null,{timeout:60000});for(let n=0;n<40&&await page.locator('#storyNext').count();n++){await page.locator('#storyNext').click();await page.waitForTimeout(120);}await page.waitForFunction(()=>started&&!loading&&!modal&&player.hp>0,null,{timeout:15000});}
async function move(page){const before=await state(page);for(const key of ['ArrowRight','ArrowUp']){await page.keyboard.down(key);await page.waitForTimeout(350);await page.keyboard.up(key);}const after=await state(page);assert.ok(Math.hypot(after.player.x-before.player.x,after.player.y-before.player.y)>.05,'actual input must move player');return{before,after};}
try{for(const kind of ['baseline','r72','candidate']){
 const dir={baseline:'_r71/docs',r72:'_r72/docs',candidate:'_pages/docs'}[kind],html=await fs.readFile(dir+'/index.html'),js=await fs.readFile(dir+'/dist/phase1.js'),context=await browser.newContext({viewport:{width:1365,height:850}}),page=await context.newPage(),row={kind,htmlSHA256:createHash('sha256').update(html).digest('hex'),rendererSHA256:createHash('sha256').update(js).digest('hex'),errors:[],cases:[]};report.runs.push(row);page.on('pageerror',e=>row.errors.push(e.message));page.on('crash',()=>row.errors.push('PAGE_CRASH'));
 await page.route(url,r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));await page.route('**/dist/phase1.js*',r=>r.fulfill({contentType:'text/javascript',body:js}));
 async function check(name,fn){try{const data=await fn();row.cases.push({name,ok:true,data});}catch(e){row.cases.push({name,ok:false,error:String(e.stack),state:await state(page).catch(()=>null)});await page.screenshot({path:`${out}/ui-${kind}-${name}-failure.png`}).catch(()=>{});}await save();}
 try{
 await check('new-empty-storage',async()=>{await page.goto(url,{timeout:60000});await page.locator('#campaignNew54').click({timeout:60000});await settle(page);return move(page);});
 if(!row.cases.at(-1).ok)continue;
 await check('new-from-menu-with-save',async()=>{const before=await page.evaluate(()=>({stored:localStorage.getItem(SAVE),progress:JSON.stringify(progress)}));await page.locator('#menuBtn').click();await page.locator('#campaignNewMenu54').click();await settle(page);const after=await state(page),backup=await page.evaluate(()=>localStorage.getItem(window.__STORYWORLD_STORY_PROFILE_R54__.backupKey));assert.equal(after.zone,'hub');assert.equal(after.cheat,false);assert.equal(backup,before.stored);return{movement:await move(page),backupRetained:backup===before.stored};});
 await check('new-from-title-after-reload',async()=>{await page.reload();await page.locator('#campaignNew54').click({timeout:60000});await settle(page);return move(page);});
 await check('777-button-to-actual-map',async()=>{
  await page.locator('#story-code-button').click();await page.locator('#story-code-input').fill('777');await page.locator('#codeApply').click();await page.locator('#codeMap').selectOption('ep1b09');await page.locator('#codeLayer').selectOption('DREAM');await page.locator('#codeGo').click();
  await page.waitForTimeout(450);if(await page.locator('#r71DifficultyConfirm').count())await page.locator('#r71DifficultyConfirm').click();await page.waitForFunction(()=>zone==='ep1b09'&&layer==='DREAM'&&!loading,null,{timeout:15000});await settle(page);await page.screenshot({path:`${out}/ui-${kind}-777-destination.png`});return move(page);
 });
 await check('new-while-777-active',async()=>{await page.locator('#menuBtn').click();await page.locator('#campaignNewMenu54').click();await settle(page);const s=await state(page);assert.equal(s.zone,'hub');assert.equal(s.layer,'STORY');assert.equal(s.cheat,false);return move(page);});
 row.ok=row.errors.length===0&&row.cases.every(c=>c.ok);
 }finally{await context.close();await save();}
}}finally{await browser.close();await save();}
console.log('R73_UI_RESULTS',JSON.stringify(report));
assert.ok(report.runs.find(r=>r.kind==='candidate')?.ok,'candidate UI regression; see ui.json');

// R1103 주황 줄무늬가 보이는 순간의 3D 프레임 명령 목록을 저장.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const hero=process.argv[2]||'hwando',z=process.argv[3]||'ep1b03';
const OUT=path.join(HERE,'grab');fs.mkdirSync(OUT,{recursive:true});
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});const p=await ctx.newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="${hero}"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&zone===z,z,{timeout:150000});await skip(p);
await p.addScriptTag({content:fs.readFileSync(path.join(HERE,'frame-probe.js'),'utf8')});
await p.evaluate(()=>{__R1103F.wrapInst(window.__STORYWORLD_PHASE1__?.controller?.state?.three);const es=(room.enemies||[]).filter(e=>e.hp>0);es.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));const e=es[0];player.x=e.x+1.4;player.y=e.y+.2;});
const score=f=>+execFileSync('python3',['-c',`
from PIL import Image
im=Image.open('${f}').convert('RGB');n=0
for x in range(200,760,2):
  for y in range(120,420,2):
    r,g,b=im.getpixel((x,y))
    if r>130 and r>g+40 and g>b+15:n+=1
print(n)`]).toString();
let saved=0;
for(let i=0;i<70&&saved<4;i++){await p.evaluate(()=>{player.hp=Math.max(player.hp,maxHP()*.9);});await p.waitForTimeout(250);
 const f=path.join(OUT,`f${i}.png`);const cmds=await p.evaluate(()=>__R1103F.grab());await p.screenshot({path:f});const s=score(f);
 if(s>150){fs.writeFileSync(path.join(OUT,`f${i}.json`),JSON.stringify(cmds));saved++;console.log('saved',i,s);}else fs.unlinkSync(f);}
await b.close();

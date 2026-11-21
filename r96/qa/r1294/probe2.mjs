// R1294 보조: 스킬 키 뒤 그림 경로가 빈(캔버스로 물들인) 효과 그리기 명령의 정체와 R163 play 이름을 모은다.
import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';const OUT=process.argv[2];
const HELPER=fs.readFileSync(path.join(HERE,'../r795/page-helper.js'),'utf8');
const skip=p=>p.evaluate(()=>{for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r663.skillgrowth','{"on":false}');});
const p=await ctx.newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator(`.heroRowR101 button[data-hero="neon"]`).click({timeout:20000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading&&(!modal||!!storyScene),null,{timeout:240000});await p.waitForTimeout(600);await skip(p);
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip(p);
await p.evaluate(async z=>{if(zone!==z)await enterRegion(z,null,{layer:'STORY',restore:true});},'dist00');await p.waitForFunction(z=>!loading&&zone===z,'dist00',{timeout:150000});await skip(p);
await p.addScriptTag({content:HELPER});
await p.evaluate(()=>{const plays=window.__R1294plays=[];const P=window.__STORYWORLD_PIXELFX_R163__;const base=P.play;const n=Object.assign(Object.create(null),P,{play(name,x,y,o){const st=String(new Error().stack).split('\n').slice(2,6).map(l=>(l.match(/\/([\w.-]+\.js)/)||[])[1]).filter(Boolean).join('<');plays.push({name,tint:!!(o&&o.tint),st,t:time});return base.apply(this,arguments);}});
 try{Object.defineProperty(window,'__STORYWORLD_PIXELFX_R163__',{value:n,configurable:true,writable:true});}catch(e){window.__STORYWORLD_PIXELFX_R163__=n;}});
const res={};
for(const k of ['q','w','e','r']){await skip(p);
 await p.evaluate(()=>{const q=__HQ795.findOpen(4);if(q)__HQ795.tp(q);__HQ795.engage(true,[]);for(const k of Object.keys(player))if(/cd$/i.test(k)&&typeof player[k]==='number')player[k]=0;window.__R1294plays.length=0;});
 await p.keyboard.down(k);await p.evaluate(()=>{try{tick(1/60);}catch(_){}});await p.keyboard.up(k);
 const empt={};
 for(let i=0;i<24;i++){await p.evaluate(()=>{for(let j=0;j<3;j++){try{tick(1/60);}catch(_){}}player.hp=Math.max(player.hp,maxHP()*.9);});
  const r=await p.evaluate(()=>{const out=[];const cs=window.__STORYWORLD_PHASE1__.captureVisual();for(const c of cs){if(c.kind!=='image'||(c.owner&&c.owner.kind)!=='effect'||c.sourcePath)continue;out.push(JSON.stringify({id:String(c.owner.id||'').slice(0,60),keys:Object.keys(c).join(','),w:c.image?.width,h:c.image?.height,rect:c.sourceRect}));}return out;});
  for(const s of r){empt[s]=(empt[s]||0)+1;}}
 res[k]={plays:await p.evaluate(()=>window.__R1294plays.slice(0,40)),empty:Object.entries(empt).sort((a,b)=>b[1]-a[1]).slice(0,30)};}
fs.writeFileSync(OUT,JSON.stringify(res,null,1));await b.close();console.log('done');

// R1112 EGO 수묵 시트 48장 미리 굽기 — 게임(ego-ink-r1099.js)의 실제 굽기(수묵+얼굴+몸통 슬림, PC 1.5배)를 헤드리스 브라우저에서 돌려
//  캔버스를 PNG 로 받아 둔다. 그다음 bake_ego_ink.py 가 webp 와 ego-ink-r1099.js 의 PRE 표를 만든다.
//  실행: SW_URL=http://127.0.0.1:4410/m0/ node r96/tools/r1112/bake_ego_ink.mjs <png 폴더>   (빌드 사이트에서 PRE 를 끈 채: localStorage storyworld.r1112.inkPre=0)
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.argv[2]||'ego-ink-png';fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360},deviceScaleFactor:1});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r1112.inkPre','0');localStorage.removeItem('storyworld.r1099.egoFace');localStorage.removeItem('storyworld.r1099.egoInk');});
const p=await ctx.newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(600);
await p.locator('#panel [data-ego-r1046]').first().click();await p.waitForTimeout(300);
await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
await p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);player.invincible=1e6;});
const I=()=>p.evaluate(()=>window.__STORYWORLD_EGO_INK_R1099__.inspect());
for(let i=0;i<400;i++){const s=await I();if(i%10===0)console.log('ready',s.ready,'queued',s.queued,'scale',s.scale,'mode',s.mode);if(s.ready>=48&&!s.queued&&!s.baking)break;await p.waitForTimeout(3000);}
const rows=await p.evaluate(()=>window.__STORYWORLD_EGO_INK_R1099__.bakedRows().map(r=>({path:r.path,box:r.box,ow:r.ow,oh:r.oh,frames:r.frames,cell:r.cell,png:r.canvas.toDataURL('image/png')})));
const meta={};for(const r of rows){const k=/r1099:ink:([a-z]+-[a-z]+)/.exec(r.path)[1];fs.writeFileSync(`${OUT}/${k}.png`,Buffer.from(r.png.split(',')[1],'base64'));meta[k]={box:r.box,ow:r.ow,oh:r.oh,frames:r.frames,cell:r.cell,path:r.path};}
fs.writeFileSync(OUT+'/meta.json',JSON.stringify(meta,null,1));console.log('saved',Object.keys(meta).length);await b.close();

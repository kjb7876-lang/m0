// R1052 전후 장면(헤드리스): 2560×1440 창 7단계를 배율 2(고치기 전)와 예산 배율(고친 뒤)로 같은 순간 찍어 화면 크기로 줄인 결과를 비교한다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',OUT=process.env.OUT||'.';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:2560,height:1440},deviceScaleFactor:1});const p=await ctx.newPage();
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
await p.evaluate(()=>{for(let i=0;i<300;i++){if(modal){document.getElementById('r600Pick0')?.click();continue;}player.hp=maxHP();tick(1/30);}window.__STORYWORLD_PERF7_R1043__.setStep(7);});
const clip={x:980,y:520,width:600,height:400};
for(const [name,d] of [['after',null],['before',2]]){await p.evaluate(d=>{if(d){dpr=d;canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);}draw();},d);await p.waitForTimeout(400);
 const info=await p.evaluate(()=>[dpr,canvas.width,canvas.height]);await p.screenshot({path:`${OUT}/r1052-${name}.png`,clip,timeout:180000});console.log(name,info);}
await b.close();

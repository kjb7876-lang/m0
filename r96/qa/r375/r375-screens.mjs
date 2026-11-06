// R375 전후 비교 스크린샷(PC·모바일) + 4방향 확인. before = storyworld.r375.dots {on:false}.
// 사용: node r96/qa/r375/r375-screens.mjs <사이트 URL> <출력 폴더>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req(process.env.PW||'playwright');
const URL=process.argv[2]||'http://127.0.0.1:4436/m0/',OUT=process.argv[3]||'r96/qa/r375/screens';
const TARGETS=[['kair02',/^시간수문장/],['kair03',/^시간핵의 명령 잔류/]];const log=[];
const b=await chromium.launch();
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]])for(const st of ['before','after']){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r375.dots',JSON.stringify({on}));},st==='after');
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 for(const [z,re] of TARGETS){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});await skip();await p.waitForTimeout(2500);
  const sides=vp==='pc'&&st==='after'?[['west',-2.2,2.2],['east',2.2,-2.2],['south',2.2,2.2],['north',-2.2,-2.2]]:[['near',-2.2,-2.2]];
  for(const [side,ox,oy] of sides){const info=await p.evaluate(([src,ox,oy])=>{const re=new RegExp(src);const e=room.enemies.find(x=>re.test(x.name)&&x.hp>0);if(!e)return null;
    for(const o of room.enemies)if(o!==e)o.frozenR375=true;player.x=e.x+ox;player.y=e.y+oy;e.attack=null;const D=window.__STORYWORLD_MOB_DOTS_R375__;
    return {name:e.name,mob:e.r375Mob||null,dir:D?.dirOf?.(e),stats:D?.inspect?.()};},[re.source,ox,oy]);
   await p.waitForTimeout(900);log.push({vp,st,z,side,info});await p.screenshot({path:`${OUT}/${z}-${vp}-${st}-${side}.jpg`,quality:72});}}
 await ctx.close();}
await b.close();console.log(JSON.stringify(log,null,0));

// R386 전후 비교 스크린샷(PC·모바일). before = 공개 사이트(main R385), after = 로컬 빌드.
// 사용: node r96/qa/r375/r375-screens.mjs <사이트 URL> <출력 폴더>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req(process.env.PW||'playwright');
const URL=process.argv[2]||'http://127.0.0.1:4436/m0/',BEFORE=process.argv[4]||'https://kjb7876-lang.github.io/m0/',OUT=process.argv[3]||'r96/qa/r386/screens';
const TARGETS=[['ep1b08',/육망성의 흑마술 실험체/,''],['ep1a09',/^유리 망령/,''],['ep1b02',/^나태에 잠식된 남자/,''],['ep1b02',/^(살아 움직이는 쓰레기들|등에 붙은 쓰레기더미)/,'b02-b1']];const log=[];
const b=await chromium.launch();
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]])for(const st of ['before','after']){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));},st==='after');
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(st==='after'?URL:BEFORE);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 for(const [z,re,pid] of TARGETS){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});await skip();await p.waitForTimeout(2500);
  const sides=[['near',-2.2,-2.2]];
  for(const [side,ox,oy] of sides){const info=await p.evaluate(([src,ox,oy,pid])=>{const re=new RegExp(src);const e=room.enemies.find(x=>re.test(x.name)&&x.hp>0&&(!pid||x.nativeId===pid));if(!e)return null;
    for(const o of room.enemies)if(o!==e)o.frozenR380=true;player.x=e.x+ox;player.y=e.y+oy;e.attack=null;const D=window.__STORYWORLD_APPROVED_MOBS_R380__;
    return {name:e.name,sprite:e.rc146BodySprite||null,look:e.r385Look||null,stats:window.__STORYWORLD_MOB_MOVES_R385__?.inspect?.()?.stats,err:window.__STORYWORLD_MOB_MOVES_R385__?.inspect?.()?.lastError,r248:e.r248Key};},[re.source,ox,oy,pid]);
   await p.waitForTimeout(900);const cache=await p.evaluate(src=>{const re=new RegExp(src);const e=room.enemies.find(x=>re.test(x.name)&&x.hp>0);return e&&{r374Mob:e.r374Mob||null,r375Mob:e.r375Mob||null,r380Mob:e.r380Mob||null,r208Mob:e.r208Mob||null,vis:e.visible!==false,x:e.x,y:e.y,px:player.x,py:player.y};},re.source);log.push({vp,st,z,side,info,cache});await p.screenshot({path:`${OUT}/${z}-${re.source.replace(/[^가-힣a-z]/g,'')}-${vp}-${st}.jpg`,quality:72});}}
 await ctx.close();}
await b.close();console.log(JSON.stringify(log,null,0));

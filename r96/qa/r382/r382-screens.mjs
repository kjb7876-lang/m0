// R382 전후 비교 스크린샷(PC·모바일). before = storyworld.r380.mobs {on:false}.
// 사용: node r96/qa/r375/r375-screens.mjs <사이트 URL> <출력 폴더>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium,devices}=req(process.env.PW||'playwright');
const URL=process.argv[2]||'http://127.0.0.1:4436/m0/',OUT=process.argv[3]||'r96/qa/r382/screens';
const TARGETS=[['ep1a11',/^거짓천국 근위천사/,''],['ep1a11',/^치료거부의 가면/,''],['ep1b02',/^(살아 움직이는 쓰레기들|미뤄 둔 시간의 형상)/,''],['ep1b03',/^(질투로 얼룩진 망령|찢어진 사진의 망령)/,''],['ep1b03',/^(추녀의 한탄|칼날과 유리 조각)/,''],['ep1b04',/^버려진 최고급 식재료/,''],['ep1b09',/^(걸어다니는 소형 로봇|인간의 뇌)/,''],['ep1b09',/^(설원 잠복 보행기|설원 아래의 기계 다리)/,''],['u201',/^(전쟁기계사냥개|폭격기억)/,''],['u204',/^(기계화 )?첫 기억/,''],['u204',/^(기계화 )?문턱 관측거미/,''],['u206',/^(기계화 기억이주|기억이주)/,''],['u206',/^(기계화 공명술사|중앙이주 공명기사)/,''],['dist02',/^뿌리 추적자/,'']];const log=[];
const b=await chromium.launch();
for(const [vp,opt] of [['pc',{viewport:{width:1280,height:720}}],['mobile',{...devices['iPhone 13']}]])for(const st of ['before','after']){
 const ctx=await b.newContext({...opt,deviceScaleFactor:1});await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r380.mobs',JSON.stringify({on}));},st==='after');
 const p=await ctx.newPage();const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 for(const [z,re,pid] of TARGETS){await p.evaluate(z=>{if(room?.id!==z)enterRegion(z,null,{layer:'STORY',restore:true});},z);await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:120000});await skip();await p.waitForTimeout(2500);
  const sides=[['near',-2.2,-2.2]];
  for(const [side,ox,oy] of sides){const info=await p.evaluate(([src,ox,oy,pid])=>{const re=new RegExp(src);const e=room.enemies.find(x=>re.test(x.name)&&x.hp>0&&(!pid||new RegExp(pid).test(x.profile?.id||x.nativeId||'')));if(!e)return null;
    for(const o of room.enemies)if(o!==e)o.frozenR380=true;player.x=e.x+ox;player.y=e.y+oy;e.attack=null;const D=window.__STORYWORLD_APPROVED_MOBS_R380__;
    return {name:e.name,mob:e.r380Mob||null,dir:D?.dirOf?.(e),stats:D?.inspect?.()};},[re.source,ox,oy,pid]);
   await p.waitForTimeout(900);log.push({vp,st,z,side,info});await p.screenshot({path:`${OUT}/${z}-${re.source.replace(/[^가-힣a-z]/g,'')}-${vp}-${st}.jpg`,quality:72});}}
 await ctx.close();}
await b.close();console.log(JSON.stringify(log,null,0));

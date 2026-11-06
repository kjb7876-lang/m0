// R376 headless — 본편 R171 지도 길·방 폭 2배: 넓힘 켬/끔 지역 입장 시간·프레임·화면. 헤드리스(소프트웨어 렌더) 상대 비교일 뿐 GPU·실기기 아님.
//   STORYWORLD_URL=http://127.0.0.1:4410/ OUT=dir node r96/qa/r376/r376-browser.mjs [zone...]
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
import fs from 'node:fs';
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4410/',OUT=process.env.OUT||'/tmp/r376';fs.mkdirSync(OUT,{recursive:true});
const zones=process.argv.slice(2).length?process.argv.slice(2):['dist01','ep1a10','u201'];
const b=await chromium.launch({headless:true});const rows=[];
for(const wide of [false,true])for(const mobile of [false,true]){
 const ctx=await b.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}:{viewport:{width:1280,height:720}});
 await ctx.addInitScript(w=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r376.storyWide',JSON.stringify({on:w}));},wide);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await p.waitForTimeout(800);await skip();
 await p.evaluate(()=>__STORYWORLD_CHEAT777__.activate('777'));
 for(const z of zones){const t0=Date.now();
  await p.evaluate(z=>__STORYWORLD_CHEAT777__.go(z,'STORY'),z);
  if(await p.evaluate(()=>window.__STORYWORLD_PROGRESSION_R71__.difficultyState().open)){await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;P.selectDifficulty('normal');await P.confirmDifficulty();});}
  await p.waitForFunction(z=>!loading&&room?.id===z,z,{timeout:180000});
  await skip();const enter=Date.now()-t0;await p.waitForTimeout(2500);await skip();
  const m=await p.evaluate(()=>new Promise(res=>{let n=0,worst=0,last=performance.now();const t0=last;const f=()=>{const t=performance.now();worst=Math.max(worst,t-last);last=t;n++;if(t-t0<5000)requestAnimationFrame(f);else res({fps:+(n*1000/(t-t0)).toFixed(1),worst:+worst.toFixed(0)});};requestAnimationFrame(f);}));
  const info=await p.evaluate(()=>({cells:room.exploration?.floorCells?.length,bounds:room.exploration?.bounds,wide:room.exploration?.storyMapR171?.wideR376||null,type:room.exploration?.type,enemies:room.enemies.filter(e=>e.hp>0).length,stuck:blocked(player.x,player.y,.34,room)}));
  const shot=`${OUT}/${z}-${mobile?'mobile':'pc'}-${wide?'after':'before'}.jpg`;await p.screenshot({path:shot,type:'jpeg',quality:70});
  rows.push({zone:z,wide,mobile,enterMs:enter,...m,...info,shot});console.log(JSON.stringify(rows[rows.length-1]));}
 rows.push({wide,mobile,errors});await ctx.close();}
fs.writeFileSync(OUT+'/r376-browser.json',JSON.stringify(rows,null,1));await b.close();

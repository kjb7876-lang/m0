// R1045d 헤드리스 검사(Playwright, 소프트웨어 렌더): 쏘지 않고 그냥 걸을 때 기억사수 옆 걷기가 새 그림(walk-e3)인지.
//   STORYWORLD_URL=http://127.0.0.1:4396/m0/ OUT=out/r1045d node r96/qa/r1045d/r1045d-browser.mjs
//   OFF=1: {"plainWalk":false} 로 예전 동작(전후 비교 — 실패가 정상). GPU·실기기·자연 플레이 체감은 미검증.
import {createRequire} from 'node:module';import fs from 'node:fs';
const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/m0/',OUT=process.env.OUT||'out/r1045d',OFF=process.env.OFF==='1';fs.mkdirSync(OUT,{recursive:true});
let fails=0;const check=(n,ok,info)=>{if(!ok)fails++;console.log((ok?'PASS ':'FAIL ')+n+(info===undefined?'':' '+JSON.stringify(info).slice(0,900)));};
const b=await chromium.launch({headless:true});const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
await ctx.addInitScript((OFF)=>{try{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r953.gunnerVeil','{"on":false}');if(OFF)localStorage.setItem('storyworld.r991.gunnerAim','{"plainWalk":false}');}catch(_){}},OFF);
const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist01','STORY');const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>room?.id==='dist01'&&!loading,null,{timeout:180000});await skip();
await p.evaluate(async()=>{guide=false;auto=false;settings.autoSkill=false;loading=true;try{await ensureImages(heroPaths('gunner'));player.hero='gunner';}finally{loading=false;}updateHUD();
 for(const v of room.enemies){v.x=player.x+80;v.y=player.y+80;v.speed=0;}room.engaged=false;player.invincible=999;
 window.__wk={src:{},frames:{}};const dh=drawHero;drawHero=function(...a){const rec=typeof ctx==='object'?ctx:null,st=Array.isArray(rec?.commands)?rec.commands.length:-1;const r=dh.apply(this,a);
  try{if(st>=0&&player.moving&&!(player.attackAnim>0))for(let i=st;i<rec.commands.length;i++){const c=rec.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero')continue;const s=String(c.sourcePath||c.image?.src||'');const m=/gunner\/walk-[a-z0-9]+\.webp/.exec(s);if(!m)continue;
   const k=window.__wk.key||'?';(window.__wk.src[k]=window.__wk.src[k]||{})[s.replace(/^.*?(assets\/)/,'$1')]=1;(window.__wk.frames[k]=window.__wk.frames[k]||{})[Math.floor((c.sourceRect?.[0]||0)/192)]=1;}}catch(_){}return r;};});
const rows=[];
for(const key of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){
 const t0=await p.evaluate(k=>{window.__wk.key=k;keys.clear?.();keys.add(k);return time;},key);
 await p.waitForFunction(t=>time>=t+1.2,t0,{timeout:180000});
 await p.screenshot({path:`${OUT}/${OFF?'off-':''}walk-${key}.png`,clip:{x:330,y:110,width:300,height:220}});
 const r=await p.evaluate(k=>{keys.delete(k);return{src:Object.keys(window.__wk.src[k]||{}),frames:Object.keys(window.__wk.frames[k]||{}).length,stats:window.__STORYWORLD_GUNNER_AIM_R991__?.inspect?.().stats};},key);
 rows.push({key,...r});console.log('ROW '+JSON.stringify({key,...r}).slice(0,600));
 await p.evaluate(()=>new Promise(r=>setTimeout(r,300)));}
const side=rows.filter(r=>r.src.some(s=>/walk-e/.test(s)||/r1045d\/gunner\/walk-e3/.test(s)));
check('옆 걷기가 기록됨(오른쪽·왼쪽 중 하나 이상)',side.length>=1,rows.map(r=>[r.key,r.src]));
check('그냥 옆으로 걸을 때 새 그림 walk-e3 만 그려짐(r144·r128 walk-e 없음)',side.length>=1&&side.every(r=>r.src.includes('assets/r1045d/gunner/walk-e3.webp')&&!r.src.some(s=>/(r144\/walk|r128)\/gunner\/walk-e\.webp/.test(s))),side.map(r=>[r.key,r.src]));
check('옆 걷기 칸이 4칸 이상 돌아감',side.every(r=>r.frames>=4),side.map(r=>[r.key,r.frames]));
check('다른 방향 걷기는 새 옆 그림을 쓰지 않음',rows.filter(r=>!side.includes(r)).every(r=>!r.src.some(s=>/r1045d/.test(s))),rows.map(r=>[r.key,r.src]));
check('페이지 오류 없음',errors.length===0,errors);
console.log(JSON.stringify({fails}));await b.close();process.exit(fails?1:0);

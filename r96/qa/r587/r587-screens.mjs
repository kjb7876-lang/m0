// R587 화면: Dots CX-0055B r3 슬레이어 시트 전(assets/r587 막음 = 옛 코드 그림)/후를 같은 게임 시간에 찍고 수치를 남긴다.
// 헤드리스 소프트웨어 렌더링(GPU·실기기 아님). 사용: node r587-screens.mjs <출력폴더> <URL>
// 주의: '전' 은 R587 시트만 막은 상태라 Q 고리·출혈은 R585 옛 시트가 아니라 R425 코드 그림으로 돌아간다(W·E·처형·사슬·낙인은 실제 이전과 같음).
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL]=process.argv.slice(2);const b=await chromium.launch();const log={};
for(const TAG of ['before','after']){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
 if(TAG==='before')await ctx.route(/assets\/r587\//,r=>r.abort());
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 const at=t=>p.waitForFunction(t=>time>=t,t,{timeout:120000,polling:16}).catch(()=>{}),now=()=>p.evaluate(()=>time);
 const clip=async(dx=0)=>{const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const v=project(player.x,player.y);return {x:r.left+v.x*(r.width/(c.clientWidth||r.width)),y:r.top+v.y*(r.height/(c.clientHeight||r.height))};});return {x:Math.max(0,Math.min(960-480,q.x-240+dx)),y:Math.max(0,Math.min(540-320,q.y-200)),width:480,height:320};};
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';});
 await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(3000);
 const base=await p.evaluate(()=>({x:player.x,y:player.y}));
 const setup=()=>p.evaluate(b=>{player.x=b.x;player.y=b.y;let L=window.__r587t;if(!L){L=room.enemies.filter(e=>e.hp>0).slice(0,3);for(const e of room.enemies)if(!L.includes(e)){e.hp=0;e.spawnState='dead';}}for(const e of L)if(!room.enemies.includes(e))room.enemies.push(e);const [a,low,side]=L;
  for(const e of [a,low,side]){e.__r587=1;e.spawnState='active';e.speed=0;e.cd=99;}
  a.x=player.x+1.3;a.y=player.y;a.hp=a.maxHp=Math.max(a.maxHp,9e4);low.x=player.x+.9;low.y=player.y+.9;low.maxHp=Math.max(low.maxHp,2000);low.hp=low.maxHp*.1;
  side.x=player.x+2.0;side.y=player.y-.3;side.hp=side.maxHp=Math.max(side.maxHp,9e4);
  player.storyWER&&(player.storyWER.ready={});player.specialCD=0;player.hp=Math.max(Number(player.hp)||0,777);player.direction='right';window.__r587t=[a,low,side];},base);
 const shot=async(name,dx)=>p.screenshot({path:`${OUT}/${name}-${TAG}.png`,clip:await clip(dx)});
 await setup();await p.waitForTimeout(800);
 // 낙인 5개
 for(let i=0;i<5;i++){const t=await now();await p.evaluate(()=>hitEnemy(window.__r587t[0],1));await at(t+.25);}
 log[TAG+'-marks']=await p.evaluate(()=>__STORYWORLD_SLAYER_BERSERK_R586__.marks(window.__r587t[0]));await shot('mark5');
 // W → 십자 + 처형
 {const t0=await now();log[TAG+'-w']=await p.evaluate(()=>__STORYWORLD_WER__.cast('w'));for(const dt of [.2,.38,.6,.9]){await at(t0+dt);await shot('w-'+String(dt).replace('.',''));}
  log[TAG+'-afterW']=await p.evaluate(()=>({hp:window.__r587t.map(e=>Math.round(e.hp)),execs:__STORYWORLD_SLAYER_BERSERK_R586__.inspect().stats.execs}));await at(t0+2);}
 // Q
 await setup();{const t0=await now();await p.evaluate(()=>special());for(const dt of [.15,.3,.9]){await at(t0+dt);await shot('q-'+String(dt).replace('.',''));}await at(t0+2.2);}
 // E → 바닥 자국 + 피사슬
 await setup();await p.evaluate(()=>{player.x-=2.2;});{const t1=await now();await at(t1+.1);const t0=await now();log[TAG+'-e']=await p.evaluate(()=>__STORYWORLD_WER__.cast('e'));for(const dt of [.12,.3,.5,.9]){await at(t0+dt);await shot('e-'+String(dt).replace('.',''),-60);}
  log[TAG+'-pull']=await p.evaluate(()=>{const e=window.__r587t[2];return +Math.hypot(e.x-player.x,e.y-player.y).toFixed(2);});}
 log[TAG+'-r585']=await p.evaluate(()=>{const i=__STORYWORLD_SLAYER_SHEETS_R585__.inspect();return {ready:i.ready,spawn:i.stats.spawn,errors:i.stats.errors,lastError:i.lastError};});
 log[TAG+'-r586']=await p.evaluate(()=>__STORYWORLD_SLAYER_BERSERK_R586__.inspect());
 // 프레임 시간: Q+R 동시 2초(헤드리스라 전/후 비교만)
 await setup();log[TAG+'-frame']=await p.evaluate(async()=>{special();__STORYWORLD_WER__.cast('r');const d=[];let l=performance.now();await new Promise(res=>{const f=t=>{d.push(t-l);l=t;d.length<90?requestAnimationFrame(f):res();};requestAnimationFrame(f);});return +(d.reduce((a,b)=>a+b,0)/d.length).toFixed(1);});
 log[TAG+'-errs']=errs.slice(0,5);await ctx.close();}
console.log(JSON.stringify(log,null,1));await b.close();

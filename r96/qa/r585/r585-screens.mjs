// R585 화면: 슬레이어 R·Q·W·E·D·F 시전 순간을 R585 끔(이전 코드 이펙트)/켬(CX-0055 시트)으로 같은 게임 시간에 찍고, 프레임 시간을 잰다.
// 헤드리스 소프트웨어 렌더링(임시, GPU·실기기 아님). 사용: node r585-screens.mjs <출력폴더> <URL>
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const [OUT,URL]=process.argv.slice(2);const b=await chromium.launch();const log={};
for(const TAG of ['off','on']){
 const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
 await ctx.addInitScript(on=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r585.slayer-sheets',JSON.stringify({on}));},TAG==='on');
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,160)));
 const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});
 const clip=async()=>{const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const v=project(player.x,player.y);return {x:r.left+v.x*(r.width/(c.clientWidth||r.width)),y:r.top+v.y*(r.height/(c.clientHeight||r.height))};});return {x:Math.max(0,Math.min(960-420,q.x-210)),y:Math.max(0,Math.min(540-320,q.y-220)),width:420,height:320};};
 const at=dt=>p.waitForFunction(t=>time>=t,null,{timeout:120000,polling:16}).catch(()=>{}),now=()=>p.evaluate(()=>time);
 const pin=()=>p.evaluate(()=>{const a=room.enemies.filter(e=>e.hp>0).slice(0,3);a.forEach((e,i)=>{e.x=player.x+1.1+i*.35;e.y=player.y+.2-i*.45;e.hp=Math.max(e.hp,9e3);e.maxHp=Math.max(e.maxHp||0,9e3);});for(const e of room.enemies.slice(3)){e.hp=0;e.spawnState='dead';}});
 const reset=()=>p.evaluate(()=>{player.storyWER&&(player.storyWER.ready={});player.specialCD=0;player.attackCD=0;player.hp=Math.max(Number(player.hp)||0,777);player.resonance=100;player.ego=0;player.egoCD=0;player.guard=false;player.direction='right';});
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:120000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:180000});await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:60000});await skip();
 await p.evaluate(async()=>{await ensureImages(heroPaths('slayer'));player.hero='slayer';});
 await p.evaluate(()=>enterRegion('dist01',null,{layer:'STORY',restore:true}));await p.waitForFunction(()=>!loading&&room?.id==='dist01',null,{timeout:120000});await skip();await p.waitForTimeout(3000);
 await pin();await p.waitForTimeout(1500);
 const plan=[['r',()=>p.evaluate(()=>__STORYWORLD_WER__.cast('r')),[.15,.4,.6,.95]],['q',()=>p.evaluate(()=>special()),[.2,.6,1.1]],['w',()=>p.evaluate(()=>__STORYWORLD_WER__.cast('w')),[.25,.6,1.0]],
  ['e',()=>p.evaluate(()=>__STORYWORLD_WER__.cast('e')),[.15,.45,.9]],['d',()=>p.evaluate(()=>guardStart()),[.3,.9]],['f',()=>p.evaluate(()=>ego()),[.3,.9,1.6]]];
 for(const [k,go,ts] of plan){await reset();await pin();await p.waitForTimeout(400);const t0=await now();const okc=await go();log[TAG+'-'+k+'-cast']=okc;
  for(const dt of ts){await at(t0+dt);await p.screenshot({path:`${OUT}/${k}-${String(dt).replace('.','')}-${TAG}.png`,clip:await clip()});}
  if(k==='d')await p.evaluate(()=>guardEnd());await at(t0+2.2);}
 // 프레임 시간: Q 회전 + R 동시 2초 동안 rAF 간격(헤드리스라 절대값보다 끔/켬 비교만 의미)
 await reset();await pin();await p.waitForTimeout(500);
 log[TAG+'-frame']=await p.evaluate(async()=>{special();__STORYWORLD_WER__.cast('r');const d=[];let l=performance.now();await new Promise(res=>{const f=t=>{d.push(t-l);l=t;d.length<120?requestAnimationFrame(f):res();};requestAnimationFrame(f);});d.sort((a,b)=>a-b);const m=d.reduce((a,b)=>a+b,0)/d.length;return {n:d.length,mean:+m.toFixed(2),p50:+d[60].toFixed(2),p95:+d[114].toFixed(2)};});
 log[TAG+'-r585']=await p.evaluate(()=>{const i=window.__STORYWORLD_SLAYER_SHEETS_R585__?.inspect?.();return i?{on:i.on,stats:i.stats,ready:i.ready}:null;});
 log[TAG+'-errs']=errs.slice(0,5);await ctx.close();}
console.log(JSON.stringify(log,null,1));await b.close();

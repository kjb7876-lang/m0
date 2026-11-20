// R1265 조사: EGO(2D·3D)·환도로 A·Q·W·E·R·F 를 쓸 때 렌더러가 받은 그림 명령 출처 전수(헤드리스 소프트웨어 렌더링)
import {createRequire} from 'node:module';import fs from 'node:fs';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',MODE=process.argv[2]||'3d',OUT=process.argv[3]||'';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:960,height:540},deviceScaleFactor:1});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:300000});await p.locator('.heroRowR101 button[data-hero="hwando"]').waitFor({timeout:30000});await p.waitForTimeout(800);
if(MODE!=='hwando'){await p.evaluate(()=>{const E=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;E.unlock?.('qa');E.refresh?.();});await p.waitForTimeout(900);
 await p.locator(`#panel .heroRowR101 [data-r1176="${MODE}"]`).click();}else await p.locator('#panel .heroRowR101 button[data-hero="hwando"]').click();
await p.waitForTimeout(300);await p.locator('#slotConfirmR73').click();await p.waitForFunction(()=>started&&!loading,null,{timeout:300000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
const waitG=s=>p.evaluate(async s=>{const t0=time;for(let i=0;i<4000&&time-t0<s;i++)await new Promise(r=>setTimeout(r,15));},s);
if(MODE!=='hwando')await p.waitForFunction(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__.formActive(),null,{timeout:8000}).catch(()=>{});
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
await p.evaluate(()=>{enterRegion('dist02',null,{restore:true});});await p.waitForFunction(()=>!loading&&zone==='dist02',null,{timeout:200000});await skip();await waitG(1.5);
const hero=await p.evaluate(()=>player.hero);const form=await p.evaluate(()=>window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.()||false);
await p.evaluate(()=>{window.__q={on:false,phase:'',rows:{}};const tag=()=>{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r||r.__q1265)return;r.__q1265=true;const base=r.render;
 r.render=function(f){const out=base.apply(this,arguments);try{if(__q.on){const M=(__q.rows[__q.phase]=__q.rows[__q.phase]||{});for(const c of f?.commands||[]){if(!c)continue;const a=+(c.style?.globalAlpha??1);if(!(a>0))continue;
   let id;if(c.kind==='image'){id='img:'+String(c.sourcePath||c.image?.src||'?').replace(/^.*?assets\//,'assets/').replace(/\?.*$/,'').slice(0,120);}
   else id=c.kind+':'+String(c.style?.strokeStyle||'')+'|'+String(c.style?.fillStyle||'')+'|'+String(c.style?.globalCompositeOperation||'');
   const ow=c.owner?.kind||'-';const k=ow+' '+id;M[k]=(M[k]||0)+1;}}}catch(e){__q.err=String(e);}return out;};};tag();setInterval(tag,50);});
const pull=()=>p.evaluate(()=>{const es=room.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y));es.slice(0,3).forEach((e,i)=>{e.x=player.x+1.3+i*.5;e.y=player.y+(i-1)*.7;e.hp=e.maxHp=Math.max(e.maxHp||1,1e7);e.speed=0;});});
const reset=()=>p.evaluate(()=>{for(const k in player)if(/CD$/.test(k))player[k]=0;player.resonance=100;player.invincible=1e6;});
async function phase(name,fn,dur){await pull();await reset();await p.evaluate(n=>{__q.phase=n;__q.on=true;},name);await fn();await waitG(dur);await p.evaluate(()=>{__q.on=false;});await waitG(.6);}
await phase('idle',async()=>{},1);
await phase('A',async()=>{await p.keyboard.down('KeyA');await waitG(2.5);await p.keyboard.up('KeyA');},.5);
for(const k of ['Q','W','E','R','F'])await phase(k,async()=>{await p.keyboard.press('Key'+k);},1.4);
const rows=await p.evaluate(()=>__q.rows);
const res={mode:MODE,form,errs,rows};if(OUT)fs.writeFileSync(OUT,JSON.stringify(res,null,1));
console.log(MODE,'hero',hero,'form',form,'phases',Object.keys(rows).map(k=>k+':'+Object.keys(rows[k]).length).join(' '),'errs',errs.length);
await b.close();

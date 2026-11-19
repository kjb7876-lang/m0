// R1233 전수: 지역마다 몹 이름별로 R248 이름 시트를 켰을 때(지금 게임)와 껐을 때(원래 그림) drawEnemy 가 실제 그린 몸 그림.
//  실행: OUT=x.jsonl MODE=STORY|DREAM|SAMONG [FROM= TO=] SW_URL=http://127.0.0.1:4410/m0/ node r96/qa/r1233/census.mjs (헤드리스 — 그래픽 검증 아님)
import {createRequire} from 'node:module';import fs from 'node:fs';const {chromium}=createRequire(import.meta.url)('playwright');
const OUT=process.env.OUT||'census.jsonl',FROM=+process.env.FROM||0,TO=+process.env.TO||1e9,MODE=process.env.MODE||'STORY',URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
const b=await chromium.launch();let p,ctx;
async function boot(){if(ctx)await ctx.close().catch(()=>{});ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');localStorage.setItem('storyworld.r183.scene3d','{"on":false}');});
 p=await ctx.newPage();p.on('pageerror',e=>{p.__errs=(p.__errs||[]);p.__errs.push(String(e).slice(0,200));});
 await p.goto(URL);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(()=>{window.__C={phase:'on',seen:{}};
  const bd=drawEnemy;drawEnemy=function(e,...a){const C=ctx&&ctx.commands,n0=C?C.length:0;const r=bd.call(this,e,...a);try{if(C&&e&&e.hp>0){let best=null,ba=0;
   for(const q of C.slice(n0))if(q&&q.kind==='image'&&q.points){const P=q.points;const ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));const sc=ar*((q.spatialRole||'')==='body'?100:1);if(sc>ba){ba=sc;best=q;}}
   if(best){const id=String(best.sourcePath||best.image?.__path||best.image?.src||'?').replace(/^https?:\/\/[^/]+\/(m0\/)?/,'')+'|'+(best.sourceRect||[]).map(v=>Math.round(v)).join(',');
    const o=__C.seen[e.name]||(__C.seen[e.name]={on:{},off:{},boss:!!e.boss,mid:!!e.midboss,sheet:null});o[__C.phase][id]=(o[__C.phase][id]||0)+1;
    if(__C.phase==='on'&&!o.sheet){try{const s=window.__STORYWORLD_MOB_UNIQUE_R248__.sheetFor(e);if(s)o.sheet={id:s.id,path:s.path,name:s.name};}catch(_){}}}}}catch(err){__C.err=String(err);}return r;};});}
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+s||Date.now()-w0>7000)?r():setTimeout(f,40);f();}),s);
const R=on=>p.evaluate(on=>{window.__STORYWORLD_MOB_UNIQUE_R248__.set({on});__C.phase=on?'on':'off';},on);
await boot();
const jobs=await p.evaluate(M=>{const J=[];if(M==='SAMONG'){const CH=window.__STORYWORLD_SAMONG_ZONES_R115__.chapters;for(const [k,l] of Object.entries(CH))for(const z of l)J.push({mode:'SAMONG',ep:k,id:z.id});}else for(const id of Object.keys(regionById))if(id!=='hub')J.push({mode:M,id});return J;},MODE);
console.error('jobs',jobs.length);
for(let i=FROM;i<Math.min(TO,jobs.length);i++){const j=jobs[i];const t0=Date.now();
 try{await R(true);
 if(j.mode==='SAMONG')await p.evaluate(async id=>{await window.__STORYWORLD_SAMONG_R103__.goZone(id);},j.id);
 else await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[j.id,j.mode]);
 await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.5);await skip();
 await p.evaluate(()=>{__C.seen={};player.invincible=1e9;try{player.hp=maxHP();}catch(_){}});
 for(let k=0;k<10;k++){const left=await p.evaluate(()=>{player.invincible=1e9;const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.__c1233);const B=L.slice(0,9);B.forEach((e,n)=>{e.__c1233=true;e.speed=0;const a=n/9*6.283;e.x=player.x+Math.cos(a)*1.6;e.y=player.y+Math.sin(a)*1.1;});return L.length-B.length;});
  await waitGame(.5);await R(false);await waitGame(.5);await R(true);await skip();if(left<=0)break;}
 const r=await p.evaluate(()=>({room:room?.id,seen:__C.seen,err:__C.err||null}));
 fs.appendFileSync(OUT,JSON.stringify({...j,...r,ms:Date.now()-t0,errs:(p.__errs||[]).splice(0)})+'\n');console.error(i,j.id,Object.keys(r.seen).length,Date.now()-t0);
 }catch(e){console.error(i,j.id,'FAIL',String(e).slice(0,200));await boot().catch(x=>console.error('reboot fail',x));}
}
await b.close();

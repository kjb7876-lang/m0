import {createRequire} from 'node:module';import fs from 'node:fs';const {chromium}=createRequire(import.meta.url)('playwright');
const OUT=process.env.OUT||'probe.jsonl',FROM=+process.env.FROM||0,TO=+process.env.TO||1e9,MODE=process.env.MODE||'STORY';
const b=await chromium.launch();let p,ctx;
async function boot(){if(ctx)await ctx.close().catch(()=>{});ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
 p=await ctx.newPage();p.on('pageerror',e=>{p.__errs=(p.__errs||[]);p.__errs.push(String(e).slice(0,200));});
 await p.goto('http://127.0.0.1:4410/m0/');await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
 await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await skip();
 await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
 await p.evaluate(()=>{window.__FP={seen:{},bodies:{}};
  const an=window.__FPAN=(im,r)=>{const [sx,sy,sw,sh]=r.map(v=>Math.round(v));if(sw<4||sh<4)return null;const c=document.createElement('canvas');c.width=sw;c.height=sh;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);const d=g.getImageData(0,0,sw,sh).data;
   const A=(x,y)=>d[(y*sw+x)*4+3];const row=y=>{let n=0,h=0;for(let x=0;x<sw;x++){const a=A(x,y);if(a>=40)n++;if(a>=200)h++;}return[n,h];};const col=x=>{let n=0;for(let y=0;y<sh;y++)if(A(x,y)>=40)n++;return n;};
   let maxW=0,last=-1,first=-1;for(let y=0;y<sh;y++){const [n]=row(y);if(n>maxW)maxW=n;if(n>0){last=y;if(first<0)first=y;}}
   const L=last<0?0:last;return{sw,sh,maxW,first,last,b0:row(sh-1),c0:row(L),c1:row(Math.max(0,L-1)),c3:row(Math.max(0,L-3)),c8:row(Math.max(0,L-8)),t0:row(0),l0:col(0),r0:col(sw-1)};};
  const bd=drawEnemy;drawEnemy=function(e,...a){const C=ctx&&ctx.commands,n0=C?C.length:0;const r=bd.call(this,e,...a);try{if(C&&e&&e.hp>0){let best=null,ba=0;
   for(const q of C.slice(n0))if(q&&q.kind==='image'&&q.points){const P=q.points;const ar=Math.abs((P[1][0]-P[0][0])*(P[3][1]-P[0][1])-(P[1][1]-P[0][1])*(P[3][0]-P[0][0]));if(!q.__r){q.__r=1;}const role=q.spatialRole||'';const sc=ar*(role==='body'?100:1);if(sc>ba){ba=sc;best=q;}}
   if(best){const id=String(best.sourcePath||'?').replace(/^https?:\/\/[^/]+\/m0\//,'')+'|'+best.sourceRect.map(v=>Math.round(v)).join(',');
    if(!__FP.bodies[id]){let s=null;try{s=best.mutable?{mutable:1}:__FPAN(best.image,best.sourceRect);}catch(err){s={err:String(err).slice(0,80)};}__FP.bodies[id]={s,role:best.spatialRole||null,ok:best.owner?.kind||null,names:{},boss:!!e.boss,mid:!!e.midboss,state:e.state||null};}
    __FP.bodies[id].names[e.name]=1;}}}catch(err){__FP.err=String(err);}return r;};});}
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+s||Date.now()-w0>8000)?r():setTimeout(f,40);f();}),s);
await boot();
const jobs=await p.evaluate(M=>{const J=[];if(M==='SAMONG'){const CH=window.__STORYWORLD_SAMONG_ZONES_R115__.chapters;for(const [k,l] of Object.entries(CH))for(const z of l)J.push({mode:'SAMONG',ep:k,id:z.id});}else for(const id of Object.keys(regionById))if(id!=='hub')J.push({mode:M,id});return J;},MODE);
console.error('jobs',jobs.length);
for(let i=FROM;i<Math.min(TO,jobs.length);i++){const j=jobs[i];const t0=Date.now();
 try{
 if(j.mode==='SAMONG')await p.evaluate(async id=>{await window.__STORYWORLD_SAMONG_R103__.goZone(id);},j.id);
 else await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[j.id,j.mode]);
 await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.6);await skip();
 await p.evaluate(()=>{__FP.bodies={};player.invincible=1e9;try{player.hp=maxHP();}catch(_){}});
 for(let k=0;k<12;k++){const left=await p.evaluate(()=>{player.invincible=1e9;const L=(room.enemies||[]).filter(e=>e.hp>0&&!e.__fpDone);const B=L.slice(0,9);B.forEach((e,n)=>{e.__fpDone=true;e.speed=0;const a=n/9*6.283;e.x=player.x+Math.cos(a)*1.6;e.y=player.y+Math.sin(a)*1.1;});return L.length-B.length;});
  await waitGame(.9);await skip();if(left<=0)break;}
 const r=await p.evaluate(()=>({room:room?.id,bodies:__FP.bodies,err:__FP.err||null}));
 fs.appendFileSync(OUT,JSON.stringify({...j,...r,ms:Date.now()-t0,errs:(p.__errs||[]).splice(0)})+'\n');console.error(i,j.id,Object.keys(r.bodies).length,Date.now()-t0);
 }catch(e){console.error(i,j.id,'FAIL',String(e).slice(0,200));await boot().catch(x=>console.error('reboot fail',x));}
}
await b.close();

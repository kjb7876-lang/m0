import {createRequire} from 'node:module';import fs from 'node:fs';const {chromium}=createRequire(import.meta.url)('playwright');
const ZONES=(process.env.ZONES||'ep1a09').split(','),LAYER=process.env.LAYER||'STORY',OUT=process.env.OUT||'death.jsonl';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();p.on('pageerror',e=>console.error('PE',String(e).slice(0,150)));
await p.goto(`http://127.0.0.1:${process.env.PORT||4410}/m0/`);await p.locator('#campaignNew54').click({timeout:240000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<200&&storyScene;i++)advanceScene();if(modal)closePanel(true);}).catch(()=>{});
await skip();await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const waitGame=s=>p.evaluate(s=>new Promise(r=>{const t0=time,w0=Date.now();const f=()=>{try{if(modal)closePanel(true);}catch(_){}(time>t0+s||Date.now()-w0>20000)?r():setTimeout(f,30);};f();}),s);
for(const Z of ZONES){try{
await p.evaluate(async([id,l])=>{await enterRegion(id,null,{layer:l,restore:true});},[Z,LAYER]);
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await waitGame(.4);await skip();
await p.evaluate(()=>{
 const FX=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura|hexagram|blood|r1195:|mist|smoke|r430|r108/i;
 const fr=window.__DFR=new Map();const an=(im,r)=>{const k=(im.src||im.__k||(im.__k='c'+Math.random()))+r.join(',');if(fr.has(k))return fr.get(k);let v=null;try{const [sx,sy,sw,sh]=r.map(Math.round);const H=64,W=Math.max(4,Math.round(64*sw/sh));const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,sx,sy,sw,sh,0,0,W,H);const d=g.getImageData(0,0,W,H).data;let a=-1,b2=-1,x0=W,x1=-1;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>90){if(a<0)a=y;b2=y;if(x<x0)x0=x;if(x>x1)x1=x;}v=a<0?0:[(b2-a+1)/H,(x1-x0+1)/W];}catch(_){v=null;}fr.set(k,v);return v;};
 window.__DLOG=new Map();const base=drawEnemy;const w=function(e,...a){const C=ctx.commands,n0=C?C.length:0;const r=base.call(this,e,...a);
  try{const L=window.__DLOG.get(e);if(L&&C){let best=null,bh=0;for(let i=n0;i<C.length;i++){const q=C[i];if(!q||q.kind!=='image'||!q.points)continue;const src=String(q.sourcePath||q.image?.__storyworldStaticSource?.path||q.image?.src||'');if(FX.test(src))continue;const h=Math.abs(q.points[3][1]-q.points[0][1]);if(h>bh){bh=h;best=q;}}
   if(best){const f=best.sourceRect?an(best.image,best.sourceRect):null;const h=Math.abs(best.points[3][1]-best.points[0][1]),wd=Math.abs(best.points[1][0]-best.points[0][0]);L.push({t:time,hp:e.hp,dead:!(e.hp>0),vis:f?Math.round(h*f[0]*10)/10:null,visw:f?Math.round(wd*f[1]*10)/10:null,h:Math.round(h),src:String(best.sourcePath||best.image?.__storyworldStaticSource?.path||'').replace(/^.*\/m0\//,'').slice(-50)});}}}catch(err){window.__DERR=String(err);}return r;};
 for(const k of Object.keys(base))if(/^__/.test(k))w[k]=base[k];drawEnemy=w;
 const be=drawBurnDeath3;const we=function(fx,...a){const C=ctx.commands,n0=C?C.length:0;const r=be.call(this,fx,...a);try{let L=null;for(const [e,l] of window.__DLOG)if(fx&&(fx.sourceId===e.id||fx.source===e||fx.enemy===e))L=l;
  if(L&&C){let best=null,bh=0;for(let i=n0;i<C.length;i++){const q=C[i];if(!q||q.kind!=='image'||!q.points)continue;const src=String(q.sourcePath||q.image?.__storyworldStaticSource?.path||q.image?.src||'');if(FX.test(src)||/r411|r190|r976|r462:pool/.test(src))continue;const h=Math.abs(q.points[3][1]-q.points[0][1]);if(h>bh){bh=h;best=q;}}
   if(best){const f=best.sourceRect?an(best.image,best.sourceRect):null;L.push({t:time,fx:fx.type||fx.kind||'?',age:Math.round((fx.age||0)*100)/100,dead:true,vis:f?Math.round(bh*f[0]*10)/10:null,h:Math.round(bh),src:String(best.sourcePath||best.image?.__storyworldStaticSource?.path||'').replace(/^.*\/m0\//,'').slice(-50)});}}}catch(err){window.__DERR=String(err);}return r;};
 for(const k of Object.keys(be))if(/^__/.test(k))we[k]=be[k];drawBurnDeath3=we;});
const kinds=await p.evaluate(()=>{const seen=new Set(),L=[];for(const e of room.enemies||[]){if(!(e.hp>0))continue;const k=String(e.nativeId||'')+'|'+String(e.name).replace(/ \d+$/,'');if(seen.has(k))continue;seen.add(k);L.push(e.id);}return L;});
for(const id of kinds){const r=await p.evaluate(async id=>{const e=room.enemies.find(x=>x.id===id);if(!e||!(e.hp>0))return null;player.invincible=1e9;
  for(const o of room.enemies)if(o!==e&&o.hp>0&&Math.hypot(o.x-player.x,o.y-player.y)<6){o.x+=30;}
  e.hidden=false;if(e.spawnState&&e.spawnState!=='active')e.spawnState='active';e.x=player.x+1.6;e.y=player.y+.2;e.speed=0;const L=[];window.__DLOG.set(e,L);
  await new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+.6||Date.now()-w0>9000)?r():setTimeout(f,30);f();});
  try{hitEnemy(e,(e.hp||1)*10+1e6,{x:player.x,y:player.y,friendly:true});}catch(err){e.hp=0;}
  await new Promise(r=>{const t0=time,w0=Date.now();const f=()=>(time>t0+1.4||Date.now()-w0>14000)?r():setTimeout(f,30);f();});
  window.__DLOG.delete(e);return{name:e.name,nid:e.nativeId,boss:!!e.boss,mid:!!e.midboss,L};},id);
 if(!r)continue;const al=r.L.filter(x=>!x.dead&&x.vis),dd=r.L.filter(x=>x.dead&&x.vis);const med=a=>{const s=a.map(x=>x.vis).sort((a,b)=>a-b);return s.length?s[s.length>>1]:null;};
 const A=med(al),D=dd.length?Math.max(...dd.map(x=>x.vis)):null;const row={zone:Z,name:r.name,nid:r.nid,boss:r.boss,mid:r.mid,alive:A,deadMax:D,ratio:A&&D?Math.round(D/A*100)/100:null,n:[al.length,dd.length],srcA:al[0]?.src,srcD:dd.map(x=>x.src).filter((v,i,a)=>a.indexOf(v)===i).slice(0,3),L:r.L};
 fs.appendFileSync(OUT,JSON.stringify(row)+'\n');console.error(Z,r.name,A,D,row.ratio);}
}catch(err){console.error(Z,'FAIL',String(err).slice(0,200));}}
await b.close();

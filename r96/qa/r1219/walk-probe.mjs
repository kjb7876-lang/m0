// R1219 헤드리스 탐침: 환도로 아래 걷기 → 매 프레임 몸 그림(경로·칸·키·발·가운데)을 적고 걷는 중 화면을 찍는다. GPU·실기기 아님.
// 실행: SW_URL=… node walk-probe.mjs <out.json> <shot.png> [initJson]
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [,,out='walk.json',shot='walk.png',initJson]=process.argv;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:initJson?JSON.parse(initJson):null});await go(p,process.env.ZONE||'dist01');
await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('hwando'));}finally{loading=false;}player.hero='hwando';player.hp=99999;for(const e of room.enemies||[])e.hp=0;});
await p.waitForTimeout(3000);
await p.evaluate(()=>{window.__rec=[];const dh=drawHero;drawHero=function(...a){const c=ctx,st=Array.isArray(c?.commands)?c.commands.length:-1;const r=dh.apply(this,a);
 if(window.__on&&st>=0){let best=null,bh=0;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.owner?.kind!=='hero')continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
  const q=project(player.x,player.y);if(best)window.__rec.push({t:+time.toFixed(3),mv:!!player.moving,s:String(best.sourcePath||'').replace(/^.*?(assets\/)/,'$1'),sx:best.sourceRect?.[0],h:+bh.toFixed(2),foot:+(best.points[3][1]-q.y).toFixed(2),cx:+((best.points[0][0]+best.points[1][0])/2-q.x).toFixed(2),st:(()=>{try{const s=window.__STORYWORLD_HWANDO_R271__.state();return [s.dir,s.walkDir,s.lastWalk,+(+s.sx).toFixed(2),+(+s.sy).toFixed(2)];}catch(_){return null;}})(),mvv:[+(+player.moveVX150||0).toFixed(2),+(+player.moveVY150||0).toFixed(2)]});}
 return r;};});
await p.evaluate(()=>{window.__on=true;keys.add('ArrowDown');window.__t0=time;});
await p.waitForFunction(w=>time-window.__t0>w,+(process.env.WT||0.45),{timeout:120000,polling:200});
await p.evaluate(()=>{window.__SLOWSAVE=true;});
const q=await p.evaluate(()=>{const v=project(player.x,player.y);return v;});
const cv=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,cw:c.width,ch:c.height};});
await p.screenshot({path:shot});
await p.evaluate(()=>{keys.delete('ArrowDown');window.__t1=time;});
await p.waitForFunction(()=>time-window.__t1>.6,null,{timeout:120000,polling:200});
await p.screenshot({path:shot.replace(/\.png$/,'-idle.png')});
await p.evaluate(()=>{window.__on=false;});
const rec=await p.evaluate(()=>window.__rec);fs.writeFileSync(out,JSON.stringify({q,cv,rec},null,0));
const walk=rec.filter(r=>/walk-s/.test(r.s)&&r.mv);const idle=rec.filter(r=>!r.mv).slice(-3);console.log('idle',JSON.stringify(idle));const u=k=>[...new Set(walk.map(r=>r[k]))];
console.log(JSON.stringify({frames:rec.length,walkS:walk.length,paths:u('s'),cells:u('sx'),h:[Math.min(...walk.map(r=>r.h)),Math.max(...walk.map(r=>r.h))],foot:[Math.min(...walk.map(r=>r.foot)),Math.max(...walk.map(r=>r.foot))],cx:[Math.min(...walk.map(r=>r.cx)),Math.max(...walk.map(r=>r.cx))]}));
await b.close();

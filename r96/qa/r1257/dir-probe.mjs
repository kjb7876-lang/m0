// R1257 헤드리스 탐침: 환도로 아래·오른쪽·위·왼쪽을 걷고 멈춘 앞모습까지 — 그 순간 실제로 그린 몸 그림 경로와 화면 조각을 남긴다. GPU·실기기 아님.
// 실행: SW_URL=… node dir-probe.mjs <outDir> [off]   (off = R1257 끔 → 전 그림)
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const [,,outDir='.',mode='on']=process.argv;fs.mkdirSync(outDir,{recursive:true});
const init=mode==='off'?{'storyworld.r1257.hwandoHead':'{"on":false}'}:null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:1280,height:720},init});await go(p,process.env.ZONE||'dist01');
await p.evaluate(async()=>{loading=true;try{await ensureImages(heroPaths('hwando'));}finally{loading=false;}player.hero='hwando';player.hp=99999;for(const e of room.enemies||[])e.hp=0;});
await p.waitForTimeout(2500);
await p.evaluate(()=>{const dh=drawHero;drawHero=function(...a){const c=ctx,st=Array.isArray(c?.commands)?c.commands.length:-1;const r=dh.apply(this,a);
 if(st>=0){let best=null,bh=0;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.owner?.kind!=='hero')continue;const h=Math.abs(k.points[3][1]-k.points[0][1]);if(h>bh){bh=h;best=k;}}
  if(best){const q=project(player.x,player.y);window.__last={s:String(best.sourcePath||'').replace(/^.*?(assets\/)/,'$1'),h:+bh.toFixed(1),q:[q.x,q.y]};}}return r;};});
const res=[];
for(const [name,key] of [['down','ArrowDown'],['right','ArrowRight'],['up','ArrowUp'],['left','ArrowLeft'],['down2','ArrowDown']]){
 await p.evaluate(k=>{keys.add(k);window.__t0=time;},key);await p.waitForFunction(()=>time-window.__t0>.35,null,{timeout:120000,polling:100});
 const L=await p.evaluate(()=>window.__last);const cv=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:r.x,y:r.y,sx:r.width/c.width,sy:r.height/c.height};});
 const cx=cv.x+L.q[0]*cv.sx,cy=cv.y+L.q[1]*cv.sy;await p.screenshot({path:`${outDir}/${name}.png`,clip:{x:Math.max(0,cx-90),y:Math.max(0,cy-160),width:180,height:190}});
 res.push({name,...L});await p.evaluate(k=>{keys.delete(k);},key);}
await p.evaluate(()=>{window.__t1=time;});await p.waitForFunction(()=>time-window.__t1>.8,null,{timeout:120000,polling:100});
{const L=await p.evaluate(()=>window.__last);const cv=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();return {x:r.x,y:r.y,sx:r.width/c.width,sy:r.height/c.height};});
 await p.screenshot({path:`${outDir}/idle.png`,clip:{x:Math.max(0,cv.x+L.q[0]*cv.sx-90),y:Math.max(0,cv.y+L.q[1]*cv.sy-160),width:180,height:190}});res.push({name:'idle',...L});}
fs.writeFileSync(`${outDir}/probe.json`,JSON.stringify(res,null,1));console.log(JSON.stringify(res.map(r=>[r.name,r.s,r.h])));await b.close();

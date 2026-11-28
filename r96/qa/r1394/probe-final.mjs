// 몹 그림 명령이 render 사슬을 다 지난 뒤에도 남는지·알파·필터를 본다(헤드리스 진단용).
import {chromium,boot,skip} from '../r444/lib.mjs';
const [z,nm]=process.argv.slice(2);const b=await chromium.launch();
const {p}=await boot(b,{init:{'storyworld.r619.videopause':'{"on":false}','storyworld.r1036.entryvideo':'{"on":false}','storyworld.r309.opening':'{"on":false}','storyworld.r372.rootgate':'{"on":false}'}});
await p.evaluate(async z=>{await window.__STORYWORLD_SAMONG_R103__.goZone(z);},z);
await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip(p);
await p.waitForFunction(nm=>room.enemies.some(q=>String(q.name).includes(nm)),nm,{timeout:40000}).catch(()=>{});

const r=await p.evaluate(nm=>new Promise(res=>{const e=room.enemies.find(q=>String(q.name).includes(nm));if(!e)return res('no enemy');const h=window.__STORYWORLD_PHASE1__.controller.state.three;const sc=h.commands;
 const mine=k=>k?.kind==='image'&&k.owner?.kind==='enemy'&&String(k.owner?.id||'').endsWith(':'+e.id);
 const base=sc.render;let n=0;sc.render=function(cmds){const before=(cmds||[]).filter(mine).map(k=>({src:String(k.sourcePath||'').slice(-60),a:k.style?.globalAlpha,f:k.style?.filter,op:k.style?.globalCompositeOperation}));const out=base.apply(this,arguments);
  if(before.length&&++n>3){sc.render=base;const after=(cmds||[]).filter(mine).map(k=>({src:String(k.sourcePath||'').slice(-60),a:k.style?.globalAlpha,f:k.style?.filter,op:k.style?.globalCompositeOperation,keys:Object.keys(k).join(',')}));
   res({e:{id:e.id,name:e.name,alpha:e.alpha,opacity:e.opacity,hp:e.hp,spawn:e.spawnState,vis:e.visible,ghost:e.ghost},before,after,total:cmds.length});}return out;};
 setTimeout(()=>res('timeout'),20000);}),nm);
console.log(JSON.stringify(r,null,1));await b.close();

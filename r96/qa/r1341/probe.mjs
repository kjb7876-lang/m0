// R1341 탐색: ep1a11 몹 목록과 각 몹이 실제로 그려진 몸 그림 경로
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {ctx,p}=await boot(b,{vp:{width:960,height:540}});
await go(p,process.argv[2]||'ep1a11');
const out=await p.evaluate(async()=>{const seen={};const h=window.__STORYWORLD_PHASE1__?.controller?.state?.three;const base=h.commands.render;
 h.commands.render=function(cmds){try{for(const k of cmds){const o=String(k?.owner?.id||'');if(k?.kind!=='image'||!o.startsWith('enemy:'))continue;const s=String(k.sourcePath||k.image?.src||'').replace(/^.*?assets\//,'assets/');(seen[o]??=new Set()).add(s);}}catch(_){}return base.apply(this,arguments);};
 await new Promise(r=>setTimeout(r,8000));
 return {npc:room.props.filter(p=>p.r790NPC).length,en:room.enemies.map(e=>({id:e.id,nid:e.nativeId,name:e.name,boss:!!e.boss,mid:!!e.midboss,x:+e.x.toFixed(1),y:+e.y.toFixed(1),paths:[...(seen['enemy:'+e.id]||[])].slice(0,8)}))};});
console.log(JSON.stringify(out,null,1));await b.close();

import {chromium,boot,go} from './lib.mjs';
const Z=(process.env.Z||'dist00').split(',');const HERO=process.env.HERO||'';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
for(const z of Z){await go(p,z);if(process.env.CAST)await p.evaluate(()=>{window.__CAST=1;});
 await p.evaluate(()=>{window.__cen=new Map();const S=window.__STORYWORLD_PHASE1__.controller.state.three.commands;const A=window.__STORYWORLD_FX_ALPHA_R1369__;const fn=S.render;
  S.render=function(cmds){const r=fn.apply(this,arguments);try{for(const c of cmds){const k=c.owner?.kind;if(['ground','prop','exits','objective'].includes(k))continue;if(c.kind==='text')continue;
   const cat=A?A.classify(c):'-';const id=String(c.owner?.id||'').replace(/[0-9.]+/g,'#').slice(0,50);const sp=String(c.sourcePath||'').replace(/^.*assets\//,'').replace(/[0-9]+/g,'#').slice(0,60);
   const key=(cat||'·')+'|'+k+'|'+(c.r1369fx?.type||'')+'|'+id+'|'+sp+'|'+c.kind+(c.owner?.r1369bg?'|BG':'')+(c.owner?.r1369edge?'|EDGE':'');const r0=window.__cen.get(key)||{n:0,a:0};r0.n++;r0.a=Math.max(r0.a,c.style?.globalAlpha??1);window.__cen.set(key,r0);}}catch(e){}return r;};S.render.r1369=true;});
 for(let i=0;i<(+process.env.N||14);i++){await p.evaluate(()=>{const b=room.enemies.find(e=>e.boss&&e.hp>0)||room.enemies.find(e=>e.hp>0);if(b&&Math.hypot(player.x-b.x,player.y-b.y)>3){player.x=b.x-1.6;player.y=b.y-1.6;}player.hp=player.maxHp;if(window.__CAST){const M=window.__STORYWORLD_BOSS_METEOR_R241__;const bb=room.enemies.find(e=>e.boss&&e.hp>0);if(M&&bb)try{bb.spawnState='active';M.cast(bb);}catch(_){} }});await p.keyboard.press(['q','w','e','r','a','d'][i%6]);await p.waitForTimeout(1200);}
 const rows=await p.evaluate(()=>[...window.__cen].map(([k,v])=>k+' n='+v.n+' a='+v.a.toFixed(2)).sort());
 console.log('=== '+z);console.log(rows.join('\n'));
 console.log(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_FX_ALPHA_R1369__.inspect())));}
console.log('ERR',errs.length,errs.slice(0,3).join(' / '));await b.close();

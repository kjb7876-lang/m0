import {chromium,boot,skip} from '../r444/lib.mjs';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
await p.evaluate(()=>enterRegion('kair03',null,{layer:'DREAM',restore:true}));await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip(p);await p.waitForTimeout(1500);
await p.evaluate(()=>{for(const e of room.enemies.filter(e=>/명령 잔류/.test(e.name||'')).slice(0,3)){e.x=player.x+1;e.y=player.y;e.speed=0;drawEnemy(e);}});await p.waitForTimeout(3000);
const r=await p.evaluate(()=>{const ms=room.enemies.filter(e=>/명령 잔류/.test(e.name||''));const out=[];const c=ctx,d=c.drawImage;
 for(const e of ms.slice(0,3)){const ss0=e.spawnState;e.spawnState='active';e.visible=true;e.x=player.x+1;e.y=player.y;e.speed=0;const fs=[];c.drawImage=function(img,...a){fs.push(String(img&&img.src||'').replace(/^.*assets\//,''));return d.call(c,img,...a);};
 try{drawEnemy(e);}finally{delete c.drawImage;}out.push({n:e.name,ss:e.spawnState,vis2:e.visible,hp:e.hp,vis:e.visible,inv:e.invisible||e.hiddenR||null,mob:e.r208Mob||e.r374Mob||e.mobId||null,fs});}
 const R=window.__STORYWORLD_MOB_ART_R1179__;return {out,api:R?Object.keys(R):null,insp:R&&R.inspect&&R.inspect(),u248:Object.keys(window).filter(k=>/R248/.test(k))};});
console.log(JSON.stringify(r));(await import('node:fs')).writeFileSync('r96/qa/r1186/live-kair03-woken.json',JSON.stringify(r.out,null,1));
await p.evaluate(()=>{room.enemies.filter(e=>/명령 잔류/.test(e.name||'')).slice(0,3).forEach((e,i)=>{e.spawnState='active';e.visible=true;e.x=player.x+1.1+i*.8;e.y=player.y+(i%2?.5:-.4);e.speed=0;});});await p.waitForTimeout(1500);await p.screenshot({path:'r96/qa/r1186/dream-kair03-woken.png'});await b.close();

// R471 장면 찍기(헤드리스): 나태 보스를 영웅 가까운 빈 바닥에 두고 조형물 던지기 들어 올림·날아감 순간을 시간을 멈춰 찍는다.
// OUT=접두어 SW_OFF=1(이전 동작) N=던지기 수
import {chromium,boot,go} from '../r444/lib.mjs';
const off=!!process.env.SW_OFF,out=process.env.OUT||'/tmp/r471',N=+(process.env.N||3);
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:off?{'storyworld.r471.canonThrow':'{"on":false}'}:null});
await go(p,'ep1b02');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 const e=room.enemies.find(x=>x.nativeId==='b02-boss');e.spawnState='active';window.__bz=e;for(const x of room.enemies)if(x!==e){x.hp=0;x.dead=true;}
 const bl=(x,y)=>typeof blocked==='function'&&blocked(x,y);let best=null;
 for(let r=2.5;r<9&&!best;r+=.5)for(let k=0;k<16&&!best;k++){const a=k/16*Math.PI*2,x=player.x+Math.cos(a)*r,y=player.y+Math.sin(a)*r;if(!bl(x,y)&&!bl(x+.6,y)&&!bl(x,y+.6)&&!bl(x-.6,y)&&!bl(x,y-.6)&&(x+y)<(player.x+player.y)-1.5)best={x,y};}
 if(best){e.x=best.x;e.y=best.y;}e.speed=0;e.moveSpeed=0;player.hp=player.maxHp=99999;});
for(let i=0;i<N;i++){
 await p.evaluate(()=>{window.__SLOW=1;});
 await p.waitForFunction(()=>{const e=window.__bz;return !e.r61Action&&!e.attack&&!(e.rangedWindup>0);},null,{timeout:180000});
 let tok=null;for(let k=0;k<60&&!tok;k++){tok=await p.evaluate(()=>window.__STORYWORLD_FIELDS_R61__.prepare(window.__bz,'prop')?.token??null);if(!tok)await p.waitForTimeout(700);}
 if(!tok)break;
 await p.waitForFunction(t=>{const a=window.__bz.r61Action;return !a||a.token!==t||time>a.start+(a.releaseAt-a.start)*.78;},tok,{timeout:60000});
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);await p.screenshot({path:`${out}-${i}-lift.png`});
 await p.evaluate(()=>{window.__SLOW=1;});
 await p.waitForFunction(()=>projectiles.some(q=>q.r114Throw&&!q.dead&&(q.age??0)>.12),null,{timeout:60000}).catch(()=>{});
 await p.evaluate(()=>{window.__SLOW=1e-4;});await p.waitForTimeout(500);await p.screenshot({path:`${out}-${i}-fly.png`});
}
await b.close();

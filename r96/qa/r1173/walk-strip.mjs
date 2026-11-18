// R1173 옆·위 걷기 장면 띠(헤드리스 소프트웨어 렌더링): 걷는 동안 영웅 둘레를 잘라 칸마다 찍는다
import {chromium,boot} from '../r444/lib.mjs';
const OUT=process.argv[2]||'.';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540}});
const A='__STORYWORLD_PERSONA_HERO_R1113__';
await p.evaluate(async A=>{await ensureImages(heroPaths('lauren'));player.hero='lauren';window[A].unlock('silent');window[A].setForm(true);},A);
await p.waitForTimeout(1500);
for(const [name,key] of [['up','ArrowUp'],['left','ArrowLeft']]){
 await p.keyboard.down(key);const t0=await p.evaluate(()=>time);await p.waitForFunction(t0=>time>t0+.4,t0,{timeout:60000,polling:100});
 for(let i=0;i<10;i++){const r=await p.evaluate(()=>{const g=project(player.x,player.y),c=document.querySelector('canvas'),R=c.getBoundingClientRect(),s=R.width/W;return {x:R.left+g.x*s,y:R.top+g.y*s,s,f:__STORYWORLD_PERSONA_HERO_R1113__.inspect().stats.last,t:time};});
  await p.screenshot({path:`${OUT}/strip-${name}-${i}.png`,clip:{x:Math.max(0,r.x-60),y:Math.max(0,r.y-150),width:120,height:170}});console.log(name,i,r.f,r.t.toFixed(2));
  const t1=r.t;await p.waitForFunction(t1=>time>t1+.1,t1,{timeout:60000,polling:50});}
 await p.keyboard.up(key);await p.waitForTimeout(300);}
await b.close();

// R1340 자리 확인(헤드리스): 근접 몹 출처로 hurt 를 한 번 불러 할퀴기·작은 타격 시트를 띄우고, 게임 시간을 거의 멈춘 채 영웅 둘레를 찍는다(R350 피 튐 끔 — 이 장면에서만).
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.OUT;const b=await chromium.launch();const {p}=await boot(b,{vp:{width:800,height:450},init:{'storyworld.r350.heroVisibility':'{"blood":false}'}});await go(p,'dist01');
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};auto=false;guide=false;command=null;route=[];room.enemies.forEach(e=>{e.hp=0;e.spawnState='dead';});window.__STORYWORLD_PIXELFX_R163__.warm(['mob-r1340-slash','mob-r1340-impact']);});
await p.waitForFunction(()=>!!readyImage('assets/r1177/mob-domestic-dots-12.webp')?.image&&!!readyImage('assets/r1214/dark-impact8.webp')?.image,null,{timeout:60000});await p.waitForTimeout(6000);
for(const [kind,name,w,steps] of [['slash','거미줄에 묶인 수호병','blade',[.15,.3,.45]],['impact','재 나방','claw',[.12,.25]]]){
 await p.evaluate(([name,w])=>{const src={name,weapon:w,x:player.x-1.1,y:player.y+.1,attack:{committed:true,angle:0},lastAttackKind:'melee',id:'probe'+Math.random()};player.hp=player.maxHp=1e9;const hp=player.hp;hurt(5,src);if(player.hp===hp){}},[name,w]);
 let tPrev=0;for(const st of steps){await p.evaluate(()=>{window.__SLOW=.1;});const t0=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t,t0+(st-tPrev));tPrev=st;await p.evaluate(()=>{window.__SLOW=1e-5;});await p.waitForTimeout(300);
  const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const q=project(player.x,player.y);return {x:r.left+q.x*r.width/c.width,y:r.top+q.y*r.height/c.height};});
  await p.screenshot({path:`${OUT}/${kind}-${st}.png`,clip:{x:q.x-110,y:q.y-150,width:220,height:190}});}}
console.log(JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_MELEE_HITFX_R1340__.inspect().stats)));await b.close();

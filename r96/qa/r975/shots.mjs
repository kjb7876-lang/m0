// R975 전/후 화면(헤드리스 소프트웨어 렌더링 — GPU·실기기 아님). 찍는 순간 tick 배율 1e-4 로 멈춰 찍는다(R444 방식).
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.SHOT_DIR||'.';const b=await chromium.launch();
for(const TAG of ['before','after']){
 const init={'storyworld.r663.skillgrowth':JSON.stringify({on:false})};if(TAG==='before')init['storyworld.r975.hwandoIlseom']=JSON.stringify({on:false});
 const {p}=await boot(b,{vp:{width:960,height:540},init});await go(p,'ep1a08');
 await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));if(player.hero!=='hwando')await switchHero('hwando');await wait(800);modal=null;player.hp=player.maxHp=99999;
  const b=room.enemies.find(e=>e.boss&&e.hp>0);b.spawnState='active';b.speed=0;b.moveSpeed=0;b.hp=b.maxHp=500000;for(const e of room.enemies)if(e!==b){e.hp=0;e.spawnState='dead';}
  let s=null;for(let i=0;i<32&&!s;i++){const a=i/32*Math.PI*2,x=b.x+Math.cos(a)*4,y=b.y+Math.sin(a)*4;if(!blocked(x,y,.3,room)&&clearLine({x,y},b,room))s={x,y};}player.x=s.x;player.y=s.y;target=b;
  const T0=tick;window.__slow=1;tick=function(dt,...a){return T0.call(this,dt*window.__slow,...a);};
  window.__hits=0;const H=hitEnemy;hitEnemy=function(e,v,s){if(s&&(s.r975||s.r590==='flash'))window.__hits++;return H.apply(this,arguments);};__STORYWORLD_WER__.cast('e');});
 for(const k of (TAG==='before'?[1]:[2,4,6,7])){await p.waitForFunction(k=>window.__hits>=k,k,{timeout:60000,polling:5});
  await p.evaluate(()=>{window.__slow=1e-4;});await p.waitForTimeout(1200);await p.screenshot({path:OUT+'/'+TAG+'-'+k+'.png',clip:{x:330,y:110,width:380,height:280}});await p.evaluate(()=>{window.__slow=1;});}
 await p.context().close();}
await b.close();

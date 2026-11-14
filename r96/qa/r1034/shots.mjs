// R1034 전후 캡처(헤드리스 소프트웨어 렌더링): 환도 W — 원 밖 적 2 / 원 밖 적 0 두 장면, 시전 뒤 분신 서 있는 순간·십자 베기 순간.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.SHOT_DIR||'.',TAG=process.env.TAG||'x';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
await go(p,process.env.ZONE||'ep1a08');
const res={};
for(const [name,nOut] of [['out2',2],['out0',0]]){
 await p.evaluate(async(nOut)=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));if(player.hero!=='hwando'){await switchHero('hwando');await wait(800);}modal=null;player.hp=player.maxHp=99999;
  const ok=(x,y)=>!blocked(x,y,.45,room);let spot=null;
  for(let k=0;k<4000&&!spot;k++){const x=4+Math.random()*(room.w||60),y=4+Math.random()*(room.h||60);if(!ok(x,y))continue;let g=true;for(let i=0;i<14&&g;i++){const a=i/14*Math.PI*2;for(const r of [2,3.5,5.2])if(!ok(x+Math.cos(a)*r,y+Math.sin(a)*r)||!clearLine({x,y},{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r},room))g=false;}if(g)spot={x,y};}
  if(!spot)throw new Error('no spot');player.x=spot.x;player.y=spot.y;player.direction='right';
  const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.speed=0;e.moveSpeed=0;e.x=-100-i;e.y=-100;});
  const use=live.filter(e=>!e.boss&&!e.midboss).slice(0,nOut+2);
  use.forEach((e,i)=>{e.spawnState='active';e.hp=e.maxHp=99999;if(i<2){e.x=player.x+(i?-1:1)*1.3;e.y=player.y+.6;}else{const a=(i-2)*2.2+.4;e.x=player.x+Math.cos(a)*5.2;e.y=player.y+Math.sin(a)*5.2;}});
  if(player.storyWER?.ready)for(const k in player.storyWER.ready)player.storyWER.ready[k]=0;target=null;
  await wait(400);window.__c0=time;__STORYWORLD_WER__.cast('w');},nOut);
 for(const at of [.55,.95]){await p.waitForFunction(at=>time-window.__c0>=at,at,{timeout:120000,polling:5});await p.screenshot({path:`${OUT}/${TAG}-${name}-${String(at).slice(2)}.png`});}
 res[name]=await p.evaluate(()=>{const I=window.__STORYWORLD_HWANDO_W_CROSS_R348__.inspect();return {stats:I.stats,clones:I.casts[0]?.clones?.length??null};});
 await p.waitForFunction(()=>time-window.__c0>=1.6,null,{timeout:120000,polling:20});
 res[name].after=await p.evaluate(()=>window.__STORYWORLD_HWANDO_W_CROSS_R348__.inspect().stats);}
console.log(JSON.stringify(res));await b.close();

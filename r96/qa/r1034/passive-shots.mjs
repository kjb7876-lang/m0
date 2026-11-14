// R1034 칠묵영(환도 확률 분신) 실제 엔진 확인 + 캡처(헤드리스 소프트웨어 렌더링). 적 셋: 하나는 분신 원 안(영웅에서 6칸), 하나는 원 밖(10칸), 하나는 곁.
import {chromium,boot,go} from '../r444/lib.mjs';
const OUT=process.env.SHOT_DIR||'.',TAG=process.env.TAG||'x';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:960,height:540},init:{'storyworld.r663.skillgrowth':JSON.stringify({on:false})}});
await go(p,process.env.ZONE||'ep1a08');
const r=await p.evaluate(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));if(player.hero!=='hwando'){await switchHero('hwando');await wait(800);}modal=null;player.hp=player.maxHp=99999;
 const ok=(x,y)=>!blocked(x,y,.45,room);let spot=null;
 for(let k=0;k<6000&&!spot;k++){const x=4+Math.random()*(room.w||60),y=4+Math.random()*(room.h||60);if(!ok(x,y))continue;let g=true;for(let i=0;i<14&&g;i++){const a=i/14*Math.PI*2;for(const r of [2,4,6,7.5])if(!ok(x+Math.cos(a)*r,y+Math.sin(a)*r)||!clearLine({x,y},{x:x+Math.cos(a)*r,y:y+Math.sin(a)*r},room))g=false;}if(g)spot={x,y};}
 if(!spot)return {noSpot:true};player.x=spot.x;player.y=spot.y;player.direction='right';
 const live=room.enemies.filter(e=>e.hp>0);live.forEach((e,i)=>{e.speed=0;e.moveSpeed=0;e.x=-100-i;e.y=-100;});
 const use=live.filter(e=>!e.boss&&!e.midboss).slice(0,3);if(use.length<3)return {few:use.length};
 const [near,inz,outz]=use;for(const e of use){e.spawnState='active';e.hp=e.maxHp=999999;}
 near.x=player.x+1.2;near.y=player.y;inz.x=player.x+0.5;inz.y=player.y+6.2;outz.x=player.x-7.4;outz.y=player.y-3;/* outz: 모든 제자리에서 4칸 밖인지 아래서 잼 */
 const A=window.__STORYWORLD_HWANDO_INK_R945__;A.force('clones');player.attackCD=0;target=near;basicAttack();const t0=time;
 while(time-t0<.3)await wait(30);near.x=-200;near.y=-200;
 const st=Date.now();while(time-t0<3.2&&Date.now()-st<200000)await wait(50);
 const I=A.inspect();const home=I.clones.map(c=>c.home);
 return {rev:A.revision,clones:I.clones,stats:I.stats,errors:I.errors,inz:{id:inz.id,x:inz.x,y:inz.y,hp:inz.hp},outz:{id:outz.id,minHome:Math.min(...home.filter(Boolean).map(h=>Math.hypot(h.x-outz.x,h.y-outz.y)))},p:{x:player.x,y:player.y},
  inzDist:Math.min(...I.clones.map(c=>Math.hypot(c.x-inz.x,c.y-inz.y))),inzHomeMin:Math.min(...home.filter(Boolean).map(h=>Math.hypot(h.x-inz.x,h.y-inz.y)))};});
await p.screenshot({path:`${OUT}/${TAG}-passive.png`});
console.log(JSON.stringify(r));await b.close();

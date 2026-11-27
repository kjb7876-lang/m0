// R1340 전후 비교 장면(헤드리스, 그래픽 검증 아님): 한 종류 몹 2마리를 영웅 옆에 두고 공격하게 한 뒤 영웅 둘레를 연속으로 찍는다.
//  사용: SW_URL=... OUT=dir ZONE=dist01 RX='거미줄에 묶인 수호병' N=36 node gif-shot.mjs
import {chromium,boot,go} from '../r444/lib.mjs';import fs from 'node:fs';
const OUT=process.env.OUT,ZONE=process.env.ZONE,RX=process.env.RX,N=+(process.env.N||36);fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:800,height:450},init:{'storyworld.r183.scene3d':'{"on":true}'}});await go(p,ZONE);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
await p.evaluate(async(rx)=>{auto=false;guide=false;command=null;route=[];
 const ms=room.enemies.filter(e=>e.hp>0&&new RegExp(rx).test(e.name)).slice(0,1);room.enemies.filter(e=>!ms.includes(e)).forEach(e=>{e.hp=0;e.spawnState='dead';});
 window.__px=player.x;window.__py=player.y;ms.forEach((e,i)=>{e.x=player.x-1.15;e.y=player.y+.15;e.spawnState='active';e.hp=e.maxHp=1e8;});room.engaged=true;window.__ms=ms;
 setInterval(()=>{try{player.hp=player.maxHp=1e9;player.x=window.__px;player.y=window.__py;}catch(_){}},30);},RX);
await p.evaluate(()=>new Promise(r=>{const t=time;const f=()=>time>t+3?r():setTimeout(f,50);f();}));await p.evaluate(v=>{window.__SLOW=v;},+(process.env.SLOW||.12));const t0=await p.evaluate(()=>time);
for(let i=0;i<N;i++){const q=await p.evaluate(()=>{const c=document.querySelector('canvas');const r=c.getBoundingClientRect();const q=project(player.x,player.y);return {x:r.left+q.x*r.width/c.width,y:r.top+q.y*r.height/c.height};});
 await p.screenshot({path:`${OUT}/f${String(i).padStart(3,'0')}.png`,clip:{x:Math.max(0,q.x-150),y:Math.max(0,q.y-170),width:300,height:220}});
 {const st=+(process.env.STEP||.05);await p.waitForFunction(t=>time>t,await p.evaluate(st=>time+st,st));}}
console.log('game secs',(await p.evaluate(()=>time))-t0);await b.close();

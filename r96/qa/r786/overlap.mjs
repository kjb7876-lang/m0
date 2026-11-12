// R786 헤드리스: #446 발밑 고리(hover)와 R786 발밑 체력 줄이 겹치는지 캡처. 사용: U=http://localhost:4396/ OUT=/tmp/o786 node overlap.mjs
import {boot} from '../r596/lib.mjs';
const U=process.env.U,Z=process.env.Z||'dist00',OUT=process.env.OUT;
const {b,p,errs,go,gameWait}=await boot(U,960,540);await go(Z);
await p.evaluate(()=>{const t=tick;tick=function(...a){if(player){player.hp=player.maxHp;}const m=window.__mob;if(m){m.speed=0;m.x=m.__px;m.y=m.__py;}return t.apply(this,a);};auto=false;});
const info=await p.evaluate(()=>{const m=(room.enemies||[]).filter(e=>e.hp>0&&!e.boss&&!e.midboss&&!e.r170Tower).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];player.x=m.x+2.5;player.y=m.y+1;m.hp=Math.round(m.maxHp*.5);m.__px=m.x;m.__py=m.y;m.cd=99;window.__mob=m;return m.name;});
await gameWait(.6);
const top=await p.evaluate(()=>document.getElementById('game').getBoundingClientRect().top);
const q=await p.evaluate(()=>{const m=window.__mob,q=project(m.x,m.y),a=actorHeight();return {x:q.x,y:q.y,ah:a};});
await p.mouse.move(q.x,q.y+top-q.ah*.5);await gameWait(.5);
const st=await p.evaluate(()=>window.__STORYWORLD_CURSOR_R780__?.inspect());
console.log(info,JSON.stringify(q),JSON.stringify({hover:st?.hover,draws:st?.draws}),errs.join('|'));
await p.screenshot({path:`${OUT}/overlap.png`,clip:{x:Math.max(0,q.x-110),y:Math.max(0,q.y+top-130),width:220,height:190}});await b.close();

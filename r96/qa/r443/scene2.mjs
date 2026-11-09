// 같은 공격을 직접 걸어 전후 비교(판정은 엔진 meleeFootprint154 그대로). 확대 잘라 찍기.
import {chromium,boot,go} from './lib.mjs';
const [,,tag,zone,nameRe]=process.argv;
const b=await chromium.launch();const {p}=await boot(b);await go(p,zone);await p.waitForTimeout(2500);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 const de=drawEnemy;drawEnemy=function(e,...a){if(e&&e.__mark&&!e.__pd){let v=e.direction;Object.defineProperty(e,'direction',{configurable:true,get(){if(window.__in===e)window.__rd=v;return v;},set(x){v=x;}});e.__pd=1;}window.__in=e;window.__rd=undefined;let r;try{r=de.call(this,e,...a);}finally{window.__in=null;}const shown=window.__rd;try{if(e&&e.__mark&&e.hp>0){const q=project(e.x,e.y);ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#ff3030';const g=e.attack?e.attack.angle:e.rangedWindup>0?e.rangedAim:null;
  if(g!=null){const t=project(e.x+Math.cos(g)*1.4,e.y+Math.sin(g)*1.4);ctx.beginPath();ctx.moveTo(q.x,q.y-4);ctx.lineTo(t.x,t.y-4);ctx.stroke();}
  ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe14d';ctx.fillText((g!=null?'판정 '+(Math.cos(g)-Math.sin(g)>0?'▶':'◀')+'  ':'')+'몸 '+(shown==='left'?'◀':shown==='right'?'▶':String(shown)),q.x,q.y+24);ctx.restore();}}catch(_){}return r;};});
const info=await p.evaluate(src=>{const re=new RegExp(src);const L=room.enemies.filter(e=>e.hp>0&&re.test(e.name)&&e.spawnState==='active');const e=L.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(!e)return null;
 window.__E=e;e.__mark=true;player.hp=9e8;player.invincible=999;for(const o of room.enemies)if(o!==e){o.visible=false;o.cd=99;}
 e.x=Math.round(e.x)+.5;e.y=Math.round(e.y)+.5;player.x=e.x+1.6;player.y=e.y-1.6;cam={x:e.x,y:e.y};return {name:e.name,x:e.x,y:e.y};},nameRe);
console.log(tag,JSON.stringify(info));await p.waitForTimeout(1500);
const shot=async n=>{const c=await p.evaluate(()=>{const q=project(window.__E.x,window.__E.y);const cv=document.querySelector('canvas');const r=cv.getBoundingClientRect();return {x:r.left+q.x*r.width/cv.width,y:r.top+q.y*r.height/cv.height};});
 await p.screenshot({path:`../shots/${zone}-${n}-${tag}.png`,clip:{x:Math.max(0,c.x-230),y:Math.max(0,c.y-230),width:460,height:330}});};
// ① 영웅 오른쪽(화면) → 엔진과 같은 방식으로 근접 준비 시작 → 영웅이 왼쪽 뒤로 돎
await p.evaluate(()=>{const e=window.__E;window.__SLOW=.15;e.cd=9;const ang=Math.atan2(player.y-.15-e.y,player.x-e.x),shape=e.combatProfile.attackShape;e.direction=facing(player.x-e.x,player.y-e.y);
 e.attack={elapsed:0,angle:ang,committed:true,id:999999,origin154:Object.freeze({x:e.x,y:e.y}),shape154:Object.freeze({...shape,windup:9,active:.2,recovery:.3})};try{e.attack.footprint154=meleeFootprint154(e.attack);}catch(_){}e.state='attack';e.meleeStageQuality='windup';
 player.x=e.x-1.6;player.y=e.y+1.6;cam={x:e.x,y:e.y};});
await p.waitForTimeout(2500);await shot('windup-hero-behind');
console.log(tag,'windup',JSON.stringify(await p.evaluate(()=>({dir:window.__E.direction,stage:window.__E.meleeStageQuality,el:window.__E.attack?.elapsed}))));
// ② 공격 끝 → 걷기: 영웅은 왼쪽, 몹은 오른쪽(화면)으로 걷는다
await p.evaluate(()=>{const e=window.__E;e.attack=null;e.state='idle';window.__SLOW=1;window.__walk=setInterval(()=>{e.attack=null;e.cd=9;const nx=e.x+.05,ny=e.y-.05;if(!blocked(nx,ny,.3)){e.x=nx;e.y=ny;}player.x=e.x-2.6;player.y=e.y+2.6;cam={x:e.x,y:e.y};},40);});
await p.waitForTimeout(1500);await shot('walk-away');console.log(tag,'walk',JSON.stringify(await p.evaluate(()=>({dir:window.__E.direction,sh:window.__STORYWORLD_ENEMY_FACE_R443__?.inspect?.().stats.shadowsSkipped}))));
await b.close();

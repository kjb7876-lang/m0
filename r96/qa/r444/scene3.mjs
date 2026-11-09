// 같은 카메라 전후 비교(최종 그림): 한 몹만 남기고 ① 근접 준비 중 영웅이 뒤로 돎 ② 영웅에게서 멀어지며 걷기. 표시: 빨간 선 = 근접 판정 각, 노란 글 = 판정/걷는 쪽.
import {chromium,boot,go} from './lib.mjs';
const [,,tag,zone,nameRe,initJson]=process.argv;const init=initJson&&initJson!=='-'?JSON.parse(initJson):null;
const b=await chromium.launch();const {p}=await boot(b,{init});await go(p,zone);await p.waitForTimeout(2500);
await p.evaluate(()=>{window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};
 const de=drawEnemy;drawEnemy=function(e,...a){const r=de.call(this,e,...a);try{if(e&&e.__mark&&e.hp>0){const q=project(e.x,e.y);ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#ff3030';const g=e.attack?e.attack.angle:null;
  if(g!=null){const t=project(e.x+Math.cos(g)*1.4,e.y+Math.sin(g)*1.4);ctx.beginPath();ctx.moveTo(q.x,q.y-4);ctx.lineTo(t.x,t.y-4);ctx.stroke();}
  ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe14d';const lab=g!=null?'판정 '+(Math.cos(g)-Math.sin(g)>0?'▶':'◀'):window.__walkLabel||'';if(lab)ctx.fillText(lab,q.x,q.y+24);if(window.__tag){ctx.font='bold 15px sans-serif';ctx.fillStyle='#ffffff';ctx.strokeStyle='#000';ctx.lineWidth=4;ctx.strokeText(window.__tag,q.x,q.y-150);ctx.fillText(window.__tag,q.x,q.y-150);}ctx.restore();}}catch(_){}return r;};});
await p.evaluate(t=>{window.__tag=t;},process.argv[6]||'');
const info=await p.evaluate(src=>{const re=new RegExp(src);const L=room.enemies.filter(e=>e.hp>0&&re.test(e.name)&&e.spawnState==='active');const e=L.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];if(!e)return null;
 window.__E=e;e.__mark=true;player.hp=9e8;player.invincible=999;for(const o of room.enemies)if(o!==e){o.cd=99;o.x+=60;o.y+=60;}
 e.x=Math.round(e.x)+.5;e.y=Math.round(e.y)+.5;player.x=e.x+1.6;player.y=e.y-1.6;cam={x:e.x,y:e.y};return {name:e.name,x:e.x,y:e.y,src:e.profile?.frames?.idle?.path};},nameRe);
console.log(tag,zone,JSON.stringify(info));if(!info){await b.close();process.exit(2);}
await p.waitForTimeout(1500);
const shot=async n=>{const c=await p.evaluate(()=>{const q=project(window.__E.x,window.__E.y);const cv=document.querySelector('canvas');const r=cv.getBoundingClientRect();return {x:r.left+q.x*r.width/cv.width,y:r.top+q.y*r.height/cv.height};});
 await p.screenshot({path:`../shots/s3-${zone}-${n}-${tag}.png`,clip:{x:Math.max(0,c.x-200),y:Math.max(0,c.y-200),width:400,height:290}});};
// ① 영웅이 화면 오른쪽 → 엔진과 같은 꼴로 근접 준비(판정 고정) → 영웅이 왼쪽 뒤로 돎
await p.evaluate(()=>{const e=window.__E;window.__SLOW=.15;e.cd=9;const ang=Math.atan2(player.y-.15-e.y,player.x-e.x),shape=e.combatProfile.attackShape;
 e.attack={elapsed:0,angle:ang,committed:true,id:999999,origin154:Object.freeze({x:e.x,y:e.y}),shape154:Object.freeze({...shape,windup:9,active:.2,recovery:.3})};try{e.attack.footprint154=meleeFootprint154(e.attack);}catch(_){}e.state='attack';e.meleeStageQuality='windup';
 player.x=e.x-1.6;player.y=e.y+1.6;cam={x:e.x,y:e.y};});
await p.waitForTimeout(2500);await shot('windup-hero-behind');
// ② 공격 끝 → 영웅은 왼쪽에 두고 몹은 화면 오른쪽으로 걷는다(위치를 정해진 길로 덮어써 AI 추격을 이긴다)
await p.evaluate(()=>{const e=window.__E;e.attack=null;e.state='idle';window.__SLOW=1;const x0=e.x,y0=e.y,t0=performance.now();window.__walkLabel='걷는 쪽 ▶';
 window.__walk=setInterval(()=>{e.attack=null;e.cd=9;const k=Math.min(2.2,(performance.now()-t0)/1000*1.1);const nx=x0+k,ny=y0-k;if(!blocked(nx,ny,.3)){e.x=nx;e.y=ny;}player.x=x0-2.4;player.y=y0+2.4;cam={x:e.x,y:e.y};},15);});
await p.waitForTimeout(1400);await shot('walk-away');
const st=await p.evaluate(()=>({face:window.__STORYWORLD_ENEMY_FACE_R444__?.state?.(window.__E),sh:window.__STORYWORLD_ENEMY_FACE_R444__?.inspect?.().stats.shadowsSkipped}));console.log(tag,'walk',JSON.stringify(st));
await b.close();

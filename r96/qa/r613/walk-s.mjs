// 걷기 전수: 몹마다 AI 걸음을 멈추고 tick 뒤 원을 따라 옮겨 '걷는 중' 몸 그림(src+칸)과 변형(점 모양)이 바뀌는지 잰다.
import {chromium,boot,go,skip} from './lib.mjs';import fs from 'node:fs';
const zones=process.argv[2].split(',');const secs=+(process.argv[3]||4);const outFile=process.argv[4]||'walk.json';
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init:{'storyworld.r286.motion':'{"on":false}'}});
await p.evaluate(()=>{const P=window.__wk={rows:new Map()};
 const bad=/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil|shadow|aura/i;
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!ctx||typeof ctx.drawImage!=='function'||!e.__wk)return base.call(this,e,...a);
  const c=ctx,orig=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage,st0=Array.isArray(c.commands)?c.commands.length:-1;let best=null;
  c.drawImage=function(img,...q){try{let sx=0,sy=0,sw=0,sh=0,dw,dh;if(q.length>=8){sx=q[0];sy=q[1];sw=q[2];sh=q[3];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
    const m=c.matrix||[1,0,0,1,0,0],area=Math.abs(dw*dh*m[0]*m[3]);const src=String(img?.currentSrc||img?.src||img?.__path||img?.dataset?.path||('cv'+img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');
    if(!bad.test(src)&&(!best||area>best.area))best={area,src,cell:sx+','+sy+','+sw+','+sh,h:Math.round(Math.abs(dh*m[3])),w:Math.round(Math.abs(dw*m[0]))};}catch(_){}return f.apply(this,arguments);};
  try{return base.call(this,e,...a);}finally{if(orig)c.drawImage=orig;else delete c.drawImage;
   let fin=null;if(st0>=0&&Array.isArray(c.commands))for(let i=st0;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(bad.test(src))continue;const Q=k.points;const ar=Math.abs((Q[1][0]-Q[0][0])*(Q[3][1]-Q[0][1])-(Q[1][1]-Q[0][1])*(Q[3][0]-Q[0][0]));if(!fin||ar>fin.ar)fin={ar,src,q:Q.map(v=>[Math.round(v[0]),Math.round(v[1])]),rect:String(k.sourceRect||'')};}
   const key=(fin&&fin.src&&fin.src!=='original-actor-canvas'?fin.src:(best?.src||'none'))+'|'+(best?.cell||fin?.rect||'');
   let shape='';if(fin){const Q=fin.q,cx=(Q[0][0]+Q[1][0]+Q[2][0]+Q[3][0])/4,cy=(Q[0][1]+Q[1][1]+Q[2][1]+Q[3][1])/4;shape=Q.map(v=>[Math.round(v[0]-cx),Math.round(v[1]-cy)].join(':')).join(';');}
   let r=P.rows.get(e.__wk);if(!r)P.rows.set(e.__wk,r={name:String(e.name||'').replace(/\s*\d+$/,''),id:e.id,zone:room.id,boss:!!(e.boss||e.midboss||e.persona),keys:{},shapes:{},n:0,kind:window.__STORYWORLD_MOB_MOTION_R286__?.kindOf?.(e)||null});
   r.n++;r.keys[key]=(r.keys[key]||0)+1;r.shapes[shape]=(r.shapes[shape]||0)+1;}};
 const tb=tick;tick=function(dt,...a){const res=tb.call(this,dt,...a);try{const W=window.__walk;if(W){player.hp=Math.max(player.hp,9e8);player.invincible=999;
   const L=room.enemies.filter(e=>e.hp>0);if(!W.list){W.list=L.slice();W.i=0;W.bt=time;}
   if(time-W.bt>=W.per){W.i+=12;W.bt=time;}W.done=W.i>=W.list.length;
   const B=W.list.slice(W.i,W.i+12);
   for(const e of room.enemies){if(!(e.hp>0))continue;e.speed=0;e.attack=null;e.rangedWindup=0;}
   B.forEach((e,j)=>{if(!e.__wk){e.__wk=room.id+'#'+e.id;}const gx=(j%4)-1.5,gy=Math.floor(j/4)-1;const sx=gx*1.7,sy=gy*1.5;// 화면 가로·세로 → 등각 칸
    const cx=player.x+(sx/2+sy),cy=player.y+(sy-sx/2);const A=(time-W.bt)*1.6/.35+j;e.x=cx+Math.cos(A)*.35;e.y=cy+Math.sin(A)*.35;e.moving=true;e.vx=-Math.sin(A)*1.6;e.vy=Math.cos(A)*1.6;if(e.spawnState==='hidden')e.spawnState='active';});
   for(const e of W.list.slice(0,W.i))e.__wk=null;}}catch(err){window.__wkErr=String(err).slice(0,200);}return res;};});
const out={};
for(const z0 of zones){let z=z0;try{if(z0.startsWith('S:')){await p.evaluate(id=>window.__STORYWORLD_SAMONG_R103__.goZone(id),z0.slice(2));await p.waitForFunction(()=>!loading&&room?.samongR103,null,{timeout:150000});await skip(p);z=await p.evaluate(()=>room.id);}else await go(p,z);await p.evaluate(()=>{auto=false;guide=false;window.__walk={t0:time,per:2};});
 await p.waitForFunction(()=>window.__walk.done,null,{timeout:600000,polling:300});
 out[z0]={rows:await p.evaluate(z=>[...window.__wk.rows.values()].filter(r=>r.zone===z),z),err:await p.evaluate(()=>window.__wkErr||null),n:await p.evaluate(()=>room.enemies.length)};
 await p.evaluate(()=>{window.__walk=null;});console.error(z0,out[z0].rows.length,out[z0].n);}catch(err){out[z0]={err:String(err).slice(0,200)};console.error(z0,'ERR',out[z0].err);}
 fs.writeFileSync(outFile,JSON.stringify(out));}
await b.close();

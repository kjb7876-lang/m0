// 최종 그림 뒤집기 전수: drawEnemy 동안 실제 그리기 기록기(ctx=DrawCommands)의 drawImage 중 가장 큰 그림(몸)의 좌우 뒤집힘(변환 행렬 a×폭 부호)을 R444 좌우와 비교
import {chromium,boot,go,skip} from './lib.mjs';
const zones=(process.argv[2]||'ep1a01,dist01,ep1a08,ep1b03,u202').split(',');const secs=+process.argv[3]||14;const init=process.argv[4]&&process.argv[4]!=='-'?JSON.parse(process.argv[4]):null;const outFile=process.argv[5]||'fc.json';const dwell=+(process.argv[6]||700);// 영웅이 한 자리에 머무는 시간(ms) — 길면 몹이 공격을 끝까지 한다
const b=await chromium.launch();const {p}=await boot(b,{init});
await p.evaluate(()=>{const P=window.__fp={rows:[],miss:0,st:new Map()};
 const F=()=>window.__STORYWORLD_ENEMY_FACE_R444__;
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!ctx||typeof ctx.drawImage!=='function')return base.call(this,e,...a);
  const c=ctx,orig=Object.prototype.hasOwnProperty.call(c,'drawImage')?c.drawImage:null,f=c.drawImage;let best=null;
  c.drawImage=function(img,...q){try{let sx=0,sy=0,dw,dh;if(q.length>=8){sx=q[0];sy=q[1];dw=q[6];dh=q[7];}else if(q.length>=4){dw=q[2];dh=q[3];}else{dw=img?.width||0;dh=img?.height||0;}
    const m=c.matrix||[1,0,0,1,0,0],area=Math.abs(dw*dh*m[0]*m[3]);const src=String(img?.currentSrc||img?.src||img?.__path||img?.dataset?.path||(img?.width+'x'+img?.height)).replace(/^.*\/m0\//,'');if(!/r251\/atlas|pixelfx|\/fx|effect|vfx|ring|circle|sigil/i.test(src)&&(!best||area>best.area)){best={area,src,cell:sx+','+sy,flip:(m[0]*Math.sign(dw||1))<0};}}catch(_){}return f.apply(this,arguments);};
  try{return base.call(this,e,...a);}finally{if(orig)c.drawImage=orig;else delete c.drawImage;
   const s=P.st.get(e)||{};const sx=(e.x-e.y)-(s.x??(e.x-e.y)),sy=((e.x+e.y)/2)-(s.y??((e.x+e.y)/2));P.st.set(e,{x:e.x-e.y,y:(e.x+e.y)/2});
   if(!best){P.miss++;return;}
   const atk=e.attack&&Number.isFinite(e.attack.angle)?e.attack.angle:(e.rangedWindup>0?e.rangedAim:(e.r61Action&&time<e.r61Action.endAt?e.r61Action.angle:null));
   const sd=a=>{if(a==null||!Number.isFinite(a))return null;const X=Math.cos(a)-Math.sin(a);return Math.abs(X)<.15?null:X>0?'right':'left';};
   const st=F()?.state?.(e);const ps=(player.x-player.y)-(e.x-e.y);
   P.rows.push({id:e.id,n:e.name,t:time,side:st?.side||null,own:st?.owner||null,dir:e.direction,src:best.src,cell:best.cell,flip:best.flip,sx,sy,atk:sd(atk),ph:e.attack?'m':e.rangedWindup>0?'r':(e.r61Action&&time<e.r61Action.endAt?'61':null),hero:Math.abs(ps)<.3?null:ps>0?'right':'left',boss:!!(e.boss||e.midboss),persona:!!e.persona,mv:!!e.moving});}};});
const out={};
for(const z of zones){try{await go(p,z);await p.evaluate(()=>{window.__fp.rows=[];window.__fp.miss=0;player.hp=1e9;window.__fp.st=new Map();});
 const t0=Date.now();let k=0;while(Date.now()-t0<secs*1000){await p.evaluate(k=>{const L=room.enemies.filter(e=>e.hp>0&&e.spawnState!=='hidden');if(!L.length)return;player.hp=Math.max(player.hp,9e8);player.invincible=1;
  const e=L.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];const a=k*Math.PI/4;const tx=e.x+Math.cos(a)*1.6,ty=e.y+Math.sin(a)*1.6;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;}},k++);await p.waitForTimeout(dwell);}
 out[z]={rows:await p.evaluate(()=>window.__fp.rows),miss:await p.evaluate(()=>window.__fp.miss)};}catch(err){out[z]={err:String(err).slice(0,200)};}}
const fs=await import('node:fs');fs.writeFileSync(outFile,JSON.stringify(out));
await b.close();

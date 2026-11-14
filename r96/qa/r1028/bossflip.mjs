// R1028 보스 최종 그림 좌우 기록: drawEnemy 뒤 ctx.commands 몸 그림 points 로 뒤집힘을 읽어 보스·중간보스만 남긴다.
// node bossflip.mjs <zones> <게임초> <out.json> [mode: auto|circle|hop] [init-json]
import {chromium,boot,go} from '../r444/lib.mjs';
const zones=(process.argv[2]||'dist01').split(',');const secs=+process.argv[3]||20;const outFile=process.argv[4]||'bf.json';const mode=process.argv[5]||'auto';
const init=process.argv[6]?JSON.parse(process.argv[6]):null;const VP=(process.env.VP||'640x360').split('x').map(Number);
const b=await chromium.launch();const {p}=await boot(b,{init,vp:{width:VP[0],height:VP[1]}});
await p.evaluate(()=>{const P=window.__bf={rows:[]};
 const finalBody=(c,st)=>{if(!(st>=0)||!Array.isArray(c.commands))return null;let fin=null;for(let i=st;i<c.commands.length;i++){const k=c.commands[i];if(k?.kind!=='image'||!Array.isArray(k.points)||k.points.length<4)continue;if(k.owner&&k.owner.kind&&k.owner.kind!=='enemy')continue;
  const src=String(k.sourcePath||k.image?.src||'').replace(/^.*\/m0\//,'');if(/r251\/atlas|pixelfx|\/fx|effect|vfx|\bring|circle|sigil/i.test(src))continue;const Q=k.points,area=Math.abs((Q[1][0]-Q[0][0])*(Q[3][1]-Q[0][1])-(Q[1][1]-Q[0][1])*(Q[3][0]-Q[0][0]));if(!fin||area>fin.area)fin={area,src,flip:(Q[1][0]-Q[0][0])<0};}return fin;};
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)||!(e.boss||e.midboss)||!ctx)return base.call(this,e,...a);const c=ctx,st0=Array.isArray(c.commands)?c.commands.length:-1;
  try{return base.call(this,e,...a);}finally{try{const fin=finalBody(c,st0);const s=window.__STORYWORLD_ENEMY_FACE_R444__?.state?.(e);
   P.rows.push({id:e.id,n:e.name,t:+time.toFixed(3),flip:fin?fin.flip:null,src:fin?fin.src:null,side:s?.side||null,own:s?.owner||null,ph:e.attack?'m':e.rangedWindup>0?'r':(e.r61Action&&time<e.r61Action.endAt?'61':null),
    ex:+e.x.toFixed(2),ey:+e.y.toFixed(2),px:+player.x.toFixed(2),py:+player.y.toFixed(2),boss:!!e.boss});}catch(_){}}};});
const out={};
for(const z of zones){try{await go(p,z);
 await p.evaluate(([mode,G])=>{window.__bf.rows=[];player.invincible=999;player.hp=9e8;
  // 보스·중간보스를 영웅 가까이(4칸) 불러온다(숨은 상태면 깨운다)
  const B=room.enemies.filter(e=>e.hp>0&&(e.boss||e.midboss));const tgt=B.find(e=>e.midboss)||B[0];window.__tgt=tgt?tgt.id:null;
  if(tgt){for(const e of room.enemies)if(e!==tgt&&!(e.boss||e.midboss))e.hp=0;tgt.hp=tgt.maxHp=Math.max(tgt.maxHp||1,1e7);if(tgt.spawnState!=='active')tgt.spawnState='active';
   for(let j=0;j<16;j++){const a=j*Math.PI/8;const tx=tgt.x+Math.cos(a)*3.5,ty=tgt.y+Math.sin(a)*3.5;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}room.engaged=true;}
  for(const e of room.enemies)if(e!==tgt&&(e.boss||e.midboss))e.spawnState='hidden';
  auto=mode==='auto';guide=false;window.__H={t0:time,G,mode,k:0,next:time,a:0};
  if(!window.__hw){window.__hw=1;const tb=tick;tick=function(dt,...a){const r=tb.call(this,dt,...a);try{window.__hs?.(dt);}catch(err){window.__herr=String(err);}return r;};}
  window.__hs=dt=>{const H=window.__H;if(!H)return;player.hp=Math.max(player.hp,9e8);player.invincible=999;const e=room.enemies.find(x=>x.id===window.__tgt);if(!e)return;
   if(H.mode==='hop'&&time>=H.next){for(let j=0;j<8;j++){const a=(H.k++)*Math.PI*3/4;const tx=e.x+Math.cos(a)*2,ty=e.y+Math.sin(a)*2;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;break;}}H.next=time+1.1;}
   if(H.mode==='circle'){const R=2.2,w=1.8/R;H.a+=w*dt;const tx=e.x+Math.cos(H.a)*R,ty=e.y+Math.sin(H.a)*R;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;}}};},[mode,secs]);
 await p.waitForFunction(()=>time-window.__H.t0>=window.__H.G,null,{timeout:1200000,polling:500});await p.evaluate(()=>{window.__H=null;});
 out[z]={tgt:await p.evaluate(()=>window.__tgt),rows:await p.evaluate(()=>window.__bf.rows),err:await p.evaluate(()=>window.__herr||null)};}catch(err){out[z]={err:String(err).slice(0,300)};}}
(await import('node:fs')).writeFileSync(outFile,JSON.stringify(out));await b.close();

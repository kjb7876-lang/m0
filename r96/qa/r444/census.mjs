// 적 방향 전수: 그리는 순간 쓰인 e.direction vs 실제 이동(화면 가로) vs 공격 각도
import {chromium,boot,go,skip} from './lib.mjs';
const zones=(process.argv[2]||'ep1a01,dist01,ep1a08,ep1b03').split(',');const secs=+process.argv[3]||14;const init=process.argv[4]?JSON.parse(process.argv[4]):null;
const b=await chromium.launch();const {p}=await boot(b,{init});const out={};
await p.evaluate(()=>{window.__probe={rows:[]};const P=window.__probe;
 const base=drawEnemy;drawEnemy=function(e,...a){if(!e||!(e.hp>0)){return base.call(this,e,...a);}
  if(!e.__pd){let v=e.direction;Object.defineProperty(e,'direction',{configurable:true,enumerable:true,get(){if(P.inDraw===e){P.read=v;P.reads.push(v);}return v;},set(x){v=x;}});e.__pd=1;}
  P.inDraw=e;P.read=undefined;P.reads=[];try{return base.call(this,e,...a);}finally{P.inDraw=null;const s=P.st.get(e)||{};const sx=(e.x-e.y)-(s.x??(e.x-e.y)),sy=((e.x+e.y)/2)-(s.y??((e.x+e.y)/2));
   const atk=e.attack?e.attack.angle:(e.rangedWindup>0?e.rangedAim:(e.r61Action&&time<e.r61Action.endAt?e.r61Action.angle:null));
   const side=a=>{if(a==null)return null;const c=Math.cos(a),s2=Math.sin(a),X=c-s2;return Math.abs(X)<.15?null:X>0?'right':'left';};
   const ps=(player.x-player.y)-(e.x-e.y);
   P.rows.push({id:e.id,n:e.name,t:time,dir:P.read,sx,sy,atk:side(atk),phase:e.attack?(e.meleeStageQuality||'atk'):e.rangedWindup>0?'rwind':null,hero:Math.abs(ps)<.3?null:ps>0?'right':'left',boss:!!(e.boss||e.midboss),f:window.__STORYWORLD_ENEMY_FACE_R444__?.state?.(e),seq:P.seq,reads:P.reads.join('')});
   P.st.set(e,{x:e.x-e.y,y:(e.x+e.y)/2});}};P.st=new Map();});
for(const z of zones){try{await go(p,z);await p.evaluate(()=>{window.__probe.rows=[];player.hp=1e9;window.__probe.st=new Map();});
 // 영웅을 가장 가까운 몹 무리 쪽으로 옮기고, 8방향으로 돌며 끌어들인다
 const t0=Date.now();let k=0;while(Date.now()-t0<secs*1000){await p.evaluate(k=>{const L=room.enemies.filter(e=>e.hp>0&&e.spawnState!=='hidden');if(!L.length)return;player.hp=Math.max(player.hp,9e8);player.invincible=1;
  const e=L.sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];const a=k*Math.PI/4;const tx=e.x+Math.cos(a)*1.6,ty=e.y+Math.sin(a)*1.6;if(!blocked(tx,ty,.3)){player.x=tx;player.y=ty;}},k++);await p.waitForTimeout(700);}
 out[z]=await p.evaluate(()=>window.__probe.rows);}catch(err){out[z]={err:String(err).slice(0,200)};}}
const fs=await import('node:fs');fs.writeFileSync(process.argv[5]||'census.json',JSON.stringify(out));
// 요약
for(const [z,rows] of Object.entries(out)){if(!Array.isArray(rows)){console.log(z,rows);continue;}
 let walk=0,walkBad=0,atk=0,atkBad=0,flips=0,frames=0;const last=new Map();const badN={};
 for(const r of rows){frames++;const d=r.dir==='left'||r.dir==='right'?r.dir:null;const pv=last.get(r.id);if(pv&&d&&pv!==d)flips++;if(d)last.set(r.id,d);
  if(r.phase||r.atk){if(r.atk&&d){atk++;if(d!==r.atk){atkBad++;badN[r.n]=(badN[r.n]||0)+1;}}continue;}
  if(Math.abs(r.sx)>.02&&Math.abs(r.sx)>Math.abs(r.sy)*.6&&d){walk++;if((r.sx>0?'right':'left')!==d)walkBad++;}}
 console.log(z,{frames,walk,walkBad,atk,atkBad,flipsPerEnemyFrame:(flips/Math.max(1,frames)).toFixed(3)},JSON.stringify(badN).slice(0,300));}
await b.close();

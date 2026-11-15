// R1053 전 보스·중간보스 헤드리스 전수(같은 빌드, 규칙 끔→켬을 같은 자리에서): node r96/qa/r1053/boss-census.mjs [out.json] [zone,zone…]
//  대상: 지역마다 보스·중간보스 전부 + 일반 원거리(hybrid·ranged) 몹 하나 + 근접 몹 하나.
//  가만히(영웅 2.4칸, 6초): 평균 거리 meanD, 물러섬 retreats(영웅에게서 멀어지는 걸음 묶음 수, 0.25초 이상).
//  돌며 때리기(영웅이 2.4칸 둘레를 0.5 rad/s, 0.25초마다 1 피해, 8초): 공격 밖 영웅 반대쪽 awayPct, 좌우 뒤집기 flips, 공격 그림 순간 피격 자세 atkHitPct.
//  헤드리스 소프트웨어 렌더링(640×360) 결과이며 GPU·실기기 확인이 아니다. 맘몬 구역(ep1b06·mammon)은 사용자 지시로 뺀다.
import fs from 'node:fs';import {chromium,boot,go,skip} from '../r444/lib.mjs';
const out=process.argv[2]||'boss-census.json';const only=process.argv[3]?process.argv[3].split(','):null;
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
const zones=only||await p.evaluate(()=>{const L=[];for(const id of Object.keys(regionById)){if(/mammon/i.test(id)||id==='ep1b06')continue;try{const r=makeRoom(id);const m=(r?.enemies||[]).filter(e=>(e.boss||e.midboss)&&!e.persona);if(m.length)L.push(id);}catch(_){}}return L;});
console.log('zones',zones.length,zones.join(','));
const res=[];const t0=Date.now();
for(const z of zones){try{await go(p,z);}catch(e){res.push({zone:z,error:'enter '+String(e).slice(0,80)});continue;}
 const ids=await p.evaluate(()=>{const L=room.enemies.filter(e=>e.hp>0&&!e.persona&&!e.r170Tower&&!e.r446Pillar&&!e.r251Circle&&e.combatProfile);const out=L.filter(e=>e.boss||e.midboss).map(e=>e.id);
  const mob=L.filter(e=>!e.boss&&!e.midboss);const r=mob.find(e=>e.ai==='hybrid'||e.ai==='ranged'),m=mob.find(e=>e.ai==='melee');if(r)out.push(r.id);if(m)out.push(m.id);return out;});
 for(const id of ids){for(const sw of ['off','on']){
  await p.evaluate(({id,sw})=>{window.__STORYWORLD_ENEMY_RULES_R1053__?.set({on:sw==='on'});const B=room.enemies.find(e=>e.id===id);window.__CB=B;
   for(const e of room.enemies)if(e!==B){e.spawnState='hidden';e.attack=null;e.rangedWindup=0;}
   B.spawnState='active';B.graceUntil=0;B.attack=null;B.rangedWindup=0;B.hp=Math.max(B.hp,B.maxHp*.6);room.engaged=true;
   player.maxHp=player.hp=1e9;player.invincible=1e9;player.x=B.x+2.4;player.y=B.y+.4;
   const r={phase:'still',t0:time,dsum:0,dn:0,retreats:0,outRun:0,prevD:null,atkReads:0,atkHitReads:0,flips:0,away:0,n:0,last:null,hitT:-9,attacks:0,lastKey:null};window.__CR=r;
   if(!B.__r1053probe){let v=B.hitTimer||0;let inDraw=false;B.__r1053probe=1;
    const atk=()=>!!(B.attack&&!B.attack.storyWorldPose5)||B.rangedWindup>0||!!(B.r61Action&&time<B.r61Action.endAt);
    Object.defineProperty(B,'hitTimer',{configurable:true,enumerable:true,get(){const r=window.__CR;if(inDraw&&r&&r.phase==='orbit'&&atk()){r.atkReads++;if(v>0)r.atkHitReads++;}return v;},set(x){v=x;}});
    const base=drawEnemy;drawEnemy=function(e,...a){if(e!==window.__CB)return base.call(this,e,...a);inDraw=true;try{return base.call(this,e,...a);}finally{inDraw=false;}};}
   const F=window.__STORYWORLD_ENEMY_FACE_R444__;const atk=()=>!!(B.attack&&!B.attack.storyWorldPose5)||B.rangedWindup>0||!!(B.r61Action&&time<B.r61Action.endAt);
   let px=player.x,py=player.y;const fx=player.x,fy=player.y;
   const tick=()=>{const r=window.__CR;if(r.done)return;const t=time-r.t0;player.hp=player.maxHp;
    if(r.phase==='still'){player.x=fx;player.y=fy;const d=Math.hypot(player.x-B.x,player.y-B.y);r.dsum+=d;r.dn++;
     if(r.prevD!=null){if(d>r.prevD+1e-3&&!atk())r.outRun+=Math.max(0,Math.min(.1,time-(r.lt??time)));else if(d<r.prevD-1e-3){if(r.outRun>=.25)r.retreats++;r.outRun=0;}}if(r.prevD!=null&&!atk()){const dd=d-r.prevD,dir=dd>1e-3?1:dd<-1e-3?-1:0;if(dir&&r.dir0&&dir!==r.dir0)r.inOut=(r.inOut||0)+1;if(dir)r.dir0=dir;}r.prevD=d;r.lt=time;
     if(t>=6){if(r.outRun>=.25)r.retreats++;r.phase='orbit';r.t1=time;r.last=null;}}
    else{const u=time-r.t1;const a=.5*u;player.x=B.x+Math.cos(a)*2.4;player.y=B.y+Math.sin(a)*2.4;
     if(time-r.hitT>=.25){r.hitT=time;B.hp=Math.max(B.hp,B.maxHp*.5);hitEnemy(B,1,{kind:'probe-r1053'});}
     const k=B.attack&&!B.attack.storyWorldPose5?B.attack:B.rangedWindup>0?'rw':(B.r61Action&&time<B.r61Action.endAt?B.r61Action:null);if(k&&k!==r.lastKey)r.attacks++;r.lastKey=k;
     const s=F?.state(B);if(s){if(r.last&&s.side!==r.last)r.flips++;r.last=s.side;if(!atk()){const h=(player.x-player.y)-(B.x-B.y);if(Math.abs(h)>.6){r.n++;if((h>0?'right':'left')!==s.side)r.away++;}}}
     if(u>=8||!(B.hp>0))r.done=true;}
    if(!r.done)requestAnimationFrame(tick);};requestAnimationFrame(tick);},{id,sw});
  const r0=Date.now();while(!(await p.evaluate(()=>!!window.__CR.done))&&Date.now()-r0<150000){await skip(p);await p.waitForTimeout(400);}
  const r=await p.evaluate(()=>{const r=window.__CR,B=window.__CB;return{name:B.name,ai:B.ai,inOut:r.inOut||0,boss:!!B.boss,mid:!!B.midboss,done:!!r.done,meanD:r.dn?+(r.dsum/r.dn).toFixed(2):null,retreats:r.retreats,awayPct:r.n?+(100*r.away/r.n).toFixed(1):null,flips:r.flips,atkHitPct:r.atkReads?+(100*r.atkHitReads/r.atkReads).toFixed(1):null,attacks:r.attacks};});
  res.push({zone:z,id,sw,...r});console.log(((Date.now()-t0)/1000|0)+'s',JSON.stringify(res.at(-1)));fs.writeFileSync(out,JSON.stringify(res,null,1));}}}
await p.evaluate(()=>window.__STORYWORLD_ENEMY_RULES_R1053__?.set({on:true}));
await b.close();

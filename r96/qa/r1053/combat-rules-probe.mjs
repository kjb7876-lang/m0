// R1053 헤드리스 전후 비교(같은 빌드에서 규칙 켬/끔): node r96/qa/r1053/combat-rules-probe.mjs <zone> <mid|boss|mob> <still|hits|both> [on|off]
//  still: 영웅 가만히(2.4칸) — 보스가 다가오는가(meanD). hits: 0.1초마다 1 피해 — 공격 자세를 그릴 순간에 피격 자세가 덮는가(atkHitReads/atkReads).
//  both: 영웅이 2.4칸 둘레를 0.5 rad/s(게임 시간)로 돌며 0.25초마다 때림 — 공격 밖에서 영웅 반대쪽을 보는 비율(awayPct)·좌우 뒤집기.
//  서버: SW_URL(기본 http://127.0.0.1:4410/m0/) 에 빌드 사이트. 헤드리스 소프트웨어 렌더링 결과이며 GPU·실기기 확인이 아니다.
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const [zone='last302',sel='mid',mode='both',sw='on']=process.argv.slice(2);const secs=+(process.env.SECS||20);
const init=sw==='off'?{'storyworld.r1053.rules':'{"on":false}'}:{};
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360},init});await go(p,zone);
const name=await p.evaluate(({sel,mode,secs})=>{const L=room.enemies.filter(e=>e.hp>0);
 const B=sel==='mid'?L.find(e=>e.midboss):sel==='boss'?L.find(e=>e.boss):L.find(e=>!e.boss&&!e.midboss&&!e.persona&&!e.r170Tower&&e.combatProfile);if(!B)return null;
 B.spawnState='active';B.graceUntil=0;room.engaged=true;for(const e of room.enemies)if(e!==B)e.hp=0;
 player.x=B.x+2.4;player.y=B.y+.4;player.maxHp=player.hp=1e9;player.invincible=1e9;
 const r={atkReads:0,atkHitReads:0,attacks:0,hits:0,flips:0,away:0,n:0,dsum:0,dn:0,last:null,lastKey:null,hitT:-9};let inDraw=false,v=B.hitTimer||0;
 const atk=()=>!!(B.attack&&!B.attack.storyWorldPose5)||B.rangedWindup>0||!!(B.r61Action&&time<B.r61Action.endAt);
 Object.defineProperty(B,'hitTimer',{configurable:true,enumerable:true,get(){if(inDraw&&atk()){r.atkReads++;if(v>0)r.atkHitReads++;}return v;},set(x){v=x;}});
 const base=drawEnemy;drawEnemy=function(e,...a){if(e!==B)return base.call(this,e,...a);inDraw=true;try{return base.call(this,e,...a);}finally{inDraw=false;}};
 const t0=time,orbit=mode==='both',hit=mode==='hits'?.1:mode==='both'?.25:0;window.__R1053P={r,done:false};
 const F=window.__STORYWORLD_ENEMY_FACE_R444__;
 const tick=()=>{const t=time-t0;if(t>=secs||!(B.hp>0)){window.__R1053P.done=true;return;}player.hp=player.maxHp;
  if(orbit){const a=.5*t;player.x=B.x+Math.cos(a)*2.4;player.y=B.y+Math.sin(a)*2.4;}
  if(hit&&time-r.hitT>=hit){r.hitT=time;B.hp=Math.max(B.hp,B.maxHp*.5);hitEnemy(B,1,{kind:'probe-r1053'});r.hits++;}
  const k=B.attack&&!B.attack.storyWorldPose5?B.attack:B.rangedWindup>0?'rw':(B.r61Action&&time<B.r61Action.endAt?B.r61Action:null);if(k&&k!==r.lastKey)r.attacks++;r.lastKey=k;
  const s=F?.state(B);if(s){if(r.last&&s.side!==r.last)r.flips++;r.last=s.side;if(!atk()){const h=(player.x-player.y)-(B.x-B.y);if(Math.abs(h)>.6){r.n++;if((h>0?'right':'left')!==s.side)r.away++;}}}
  r.dsum+=Math.hypot(player.x-B.x,player.y-B.y);r.dn++;requestAnimationFrame(tick);};requestAnimationFrame(tick);return B.name+' ai='+B.ai;},{sel,mode,secs});
if(!name){console.log('no target');await b.close();process.exit(2);}
const r0=Date.now();while(!(await p.evaluate(()=>window.__R1053P.done))&&Date.now()-r0<420000){await skip(p);await p.waitForTimeout(500);}
const r=await p.evaluate(()=>{const r=window.__R1053P.r;return{attacks:r.attacks,hits:r.hits,atkReads:r.atkReads,atkHitReads:r.atkHitReads,atkHitPct:r.atkReads?+(100*r.atkHitReads/r.atkReads).toFixed(1):null,flips:r.flips,awayPct:r.n?+(100*r.away/r.n).toFixed(1):null,meanD:r.dn?+(r.dsum/r.dn).toFixed(2):null,rules:window.__STORYWORLD_ENEMY_RULES_R1053__?.inspect?.()?.stats||null};});
console.log('RESULT',JSON.stringify({zone,sel,mode,sw,secs,name,...r}));await b.close();

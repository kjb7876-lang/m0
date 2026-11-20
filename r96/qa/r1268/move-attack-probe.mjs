// R1268 실패 먼저 탐침 — "이동 중엔 기본 공격 시작 안 함, 멈추면 공격 나감, 이미 시작한 공격은 그대로 나감"
//  영웅: 방향키를 누른 채 걸으며 공격키(attack)를 계속 누름 → 걷는 틱에 attackCD 가 새로 걸리면(공격 시작) 위반.
//        멈춘 뒤 0.35초(게임 시간) 안에 공격이 나가야 함(멈추면 공격). 8영웅 모두.
//  적:   영웅이 반지름 1.3 원을 그리며 움직여 적이 계속 쫓게 함 → 적 공격 시작(e.attack 새로 생김·rangedWindup 0→+)이 '이 틱이나 직전 0.1초 안에 걸었던' 적이면 위반.
//        공격 시작 자체는 있어야 함(멈추면 공격). 보스 지역 포함.
//  시간은 게임 time 기준으로 기다린다(헤드리스는 실제 시간보다 느림).
import {chromium,boot,go,skip} from '../r444/lib.mjs';
const ZONES=(process.env.ZONES||'kair04,cult03,cult04,murder03').split(',');const HEROES=process.env.HEROES==='none'?[]:(process.env.HEROES||'hwando,seoha,neon,michaela,lauren,hunter,slayer,gunner').split(',');
const b=await chromium.launch();const {p}=await boot(b,{vp:{width:640,height:360}});
if(!process.env.OFF)await p.evaluate(()=>window.__STORYWORLD_STILL_ATTACK_R1268__?.set({enemy:true}));/* 몹 규칙은 기본 끔 — 탐침에선 켬 */
if(process.env.OFF)await p.evaluate(()=>window.__STORYWORLD_STILL_ATTACK_R1268__?.set({on:false}));
if(process.env.TP)console.error('TP mode');
await p.evaluate(()=>{
 {let v=player.attackCD;Object.defineProperty(player,'attackCD',{configurable:true,get(){return v},set(n){if(n>v+.01&&player.moving&&window.__R1268P?.heroOn){const st=new Error().stack;if(!/swap/.test(st))(window.__R1268P.stacks??=[]).push(st.split('\n').slice(2,6).map(x=>x.trim().replace(/http:\/\/[^/]+\/m0\//,'').slice(0,90)).join(' | '))}v=n}});}
 const W=window.__R1268P={hero:[],enemy:{starts:0,afterMove:0,samples:[],byKind:{}}};
 const base=tick;window.tick=tick=function(dt){
  const pre={cd:player.attackCD,moving:player.moving,anim:player.attackAnim,hero:player.hero},es=new Map();
  for(const e of room.enemies||[])if(e.hp>0)es.set(e,{x:e.x,y:e.y,atk:e.attack,rw:+e.rangedWindup||0,st:e.state});
  const r=base.apply(this,arguments);
  if(W.heroOn&&player.attackCD>pre.cd+.01)W.hero.push({t:+(time-(W.walkAt??0)).toFixed(3),moving:!!player.moving,hero:player.hero,anim:+(+player.attackAnim||0).toFixed(3),animPre:+(+pre.anim||0).toFixed(3)});
  for(const [e,s] of es){if(e.hp<=0)continue;const moved=!!e.moving&&Math.hypot(e.x-s.x,e.y-s.y)>.004;if(moved)e.__pMove=time;
   const kind=(!s.atk&&e.attack)?'melee':(s.rw<=0&&(+e.rangedWindup||0)>0)?'ranged':null;
   if(kind&&W.enemyOn){W.enemy.starts++;const after=moved||time-(e.__pMove??-9)<.1;const k=(e.boss?'boss':e.midboss?'mid':'mob')+':'+kind;const B=W.enemy.byKind[k]??={n:0,bad:0};B.n++;if(after){B.bad++;W.enemy.afterMove++;if(W.enemy.samples.length<12)W.enemy.samples.push({name:e.name,id:e.id,kind,ai:e.ai,boss:!!e.boss,movedThisTick:moved,ago:+(time-(e.__pMove??-9)).toFixed(3)})}}}
  if(W.inv)player.hp=maxHP();return r};
});
async function waitT(dt){const t0=await p.evaluate(()=>time);const T=Date.now();for(;;){const s=await p.evaluate(t=>{if(storyScene)for(let i=0;i<160&&storyScene;i++)advanceScene();if(modal)closePanel(true);return {done:time>=t,time,modal:!!modal}},t0+dt);if(s.done)return;if(Date.now()-T>240000)throw new Error('waitT stuck '+JSON.stringify(s));await p.waitForTimeout(150);}}
await p.evaluate(()=>{window.__R1268P.inv=true;});
// ---- 적 ----
const enemyRes=[];
for(const z of ZONES){
 try{await go(p,z);}catch(err){enemyRes.push({z,err:String(err).slice(0,80)});continue}
 await p.evaluate(([RADV,TPV])=>{const W=window.__R1268P;W.enemy={starts:0,afterMove:0,samples:[],byKind:{}};W.enemyOn=true;W.inv=true;W.rad=+RADV;room.engaged=true;
  const e=liveEnemies().find(e=>e.boss)||liveEnemies()[0];if(e){W.cx=e.x;W.cy=e.y+0.01;if(TPV){player.x=e.x-RADV;player.y=e.y;}}else{W.cx=player.x;W.cy=player.y}
  // 영웅은 적 무리 가운데에서 반지름 2.2 원을 그리며 걷는다(방향키로 — 진짜 이동)
  W.circ=setInterval(()=>{const RAD=W.rad;const a=Math.atan2(player.y-W.cy,player.x-W.cx)+Math.PI/2,r=Math.hypot(player.x-W.cx,player.y-W.cy);for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'])keys.delete(k);
   const vx=Math.cos(a)+(RAD-r)*.8,vy=Math.sin(a)+(RAD-r)*.8;/* 화면 키 → 세계 v=norm(sx+2sy,2sy-sx) 의 역 */const sx=(vx-vy)/2,sy=(vx+vy)/4;if(sx>.15)keys.add('ArrowRight');if(sx<-.15)keys.add('ArrowLeft');if(sy>.08)keys.add('ArrowDown');if(sy<-.08)keys.add('ArrowUp');},60);
 },[process.env.RAD||1.3,!!process.env.TP]);
 await waitT(+(process.env.ESEC||6));
 const r=await p.evaluate(()=>{const W=window.__R1268P;clearInterval(W.circ);for(const k of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'])keys.delete(k);W.enemyOn=false;return {room:room.id,live:liveEnemies().length,...W.enemy}});
 enemyRes.push({z,...r});
}
// ---- 영웅 ----
await go(p,process.env.HZONE||'cult02');
const heroRes=[];
for(const h of HEROES){
 await p.evaluate(h=>{ensureImages?.(heroPaths?.(h)||[]);player.hero=h;window.__R1268P.inv=true;const e=liveEnemies().filter(e=>!e.boss).sort((a,b)=>distance(a,player)-distance(b,player))[0];
  if(e){player.x=e.x-1.0;player.y=e.y;}player.attackCD=0;for(const q of liveEnemies()){q.__keepHp=q.hp;}},h);
 // 걷기: 0.25초마다 좌우 바꿈(적 곁을 오감), 공격키 계속
 await p.evaluate(()=>{const W=window.__R1268P;W.hero.length=0;W.heroOn=true;W.walkAt=time;keys.add('attack');keys.add('ArrowRight');W.flip=setInterval(()=>{if(keys.has('ArrowRight')){keys.delete('ArrowRight');keys.add('ArrowLeft')}else{keys.delete('ArrowLeft');keys.add('ArrowRight')}},250)});
 await waitT(1.6);
 const walk=await p.evaluate(()=>{const W=window.__R1268P;clearInterval(W.flip);keys.delete('ArrowRight');keys.delete('ArrowLeft');const r=W.hero.slice();W.hero.length=0;
  const e=liveEnemies().sort((a,b)=>distance(a,player)-distance(b,player))[0];if(e){player.x=e.x-.9;player.y=e.y;}W.stopAt=+(time-W.walkAt).toFixed(3);return r});
 await waitT(.6);
 const still=await p.evaluate(()=>{const W=window.__R1268P;W.heroOn=false;keys.delete('attack');const r=W.hero.slice();W.hero.length=0;return {first:r.length?+(r[0].t-W.stopAt).toFixed(3):null,n:r.length}});
 const movingStarts=walk.filter(x=>x.moving&&x.anim>x.animPre).length,otherCD=walk.filter(x=>x.moving&&!(x.anim>x.animPre)).length;/* 공격 모션(attackAnim) 없이 attackCD 만 오른 것은 기본 공격이 아님 — 따로 셈 */heroRes.push({h,walkStarts:walk.length,movingStarts,otherCD,still,walk:walk.slice(0,4),stacks:await p.evaluate(()=>{const s=window.__R1268P.stacks||[];window.__R1268P.stacks=[];return s.slice(0,3)})});
}
await b.close();
let fail=0;const out={heroRes,enemyRes};console.log(JSON.stringify(out,null,1));
for(const h of heroRes){if(h.movingStarts>0){fail++;console.log('FAIL 영웅',h.h,'걷는 중 공격 시작',h.movingStarts,'/',h.walkStarts)}if(!(h.still.n>0&&h.still.first!==null&&h.still.first<=.35)){fail++;console.log('FAIL 영웅',h.h,'멈춘 뒤 0.35초 안 공격 없음',JSON.stringify(h.still))}}
for(const e of enemyRes){if(e.err){fail++;console.log('FAIL 지역',e.z,e.err);continue}if(e.afterMove>0){fail++;console.log('FAIL 적',e.z,'걷다가 바로 공격 시작',e.afterMove,'/',e.starts)}if(!(e.starts>0)){fail++;console.log('FAIL 적',e.z,'공격 시작이 아예 없음')}}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);

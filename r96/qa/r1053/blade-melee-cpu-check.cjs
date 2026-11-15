// R1053c CPU 검사: 칼(weapon 'blade') 든 적은 근접 우선(규칙 ⑥, docs/enemy-combat-rules.md).
// 사용자 2026-11-15 22:22Z 요약 "붉은 하이힐 칼날의 근접 공격이 원거리로 바뀌는 문제".
// 헤드리스 재현(main 3700583, ep1b05): 데이터가 칼날(근접 호 1.45칸)인데 AI 가 hybrid 라 엔진이 사거리+0.5칸 밖이면 늘 원거리 탄을 쏨
//  — 영웅 4칸에서 20초 동안 원거리 7번·근접 0번(R1053 을 꺼도 같음). 칼 든 적 24종(일반 19·중간보스 5)이 모두 같은 데이터.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='enemy-rules-r1053.js',FACE='enemy-face-r444.js';
// ── 작은 세계: 엔진 tickEnemies(쿨다운·hybrid 물러서기·근접/원거리 시작·이동)와 hitEnemy(hitTimer=.14), R444 drawEnemy 감싸기 ──
function env(ls={}){const g={localStorage:{_s:{...ls},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,Number,String,Object,Array,WeakMap,Map,Set,setTimeout:()=>0};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=0,frameDT=1/60,player={x:20,y:16,hp:1000,maxHp:1000},room={id:"last302",enemies:[]},settings={};var drawn=[];
 function norm(x,y){const m=Math.hypot(x,y)||1;return{x:x/m,y:y/m};}
 function moveAI3(e,goal,dt){const v=norm(goal.x-e.x,goal.y-e.y);const s=e.speed*dt;e.x+=v.x*s;e.y+=v.y*s;e.moving=true;}
 function tickEnemies(dt){for(const e of room.enemies){e.hitTimer=Math.max(0,e.hitTimer-dt);e.moving=false;if(!(e.hp>0))continue;e.cd-=dt;
  if(e.attack){e.attack.elapsed+=dt;if(e.attack.elapsed>=.9){e.attack=null;e.cd=e.boss||e.midboss?.18:.55;}continue;}
  if(e.rangedWindup>0){e.rangedWindup-=dt;if(e.rangedWindup<=0)e.cd=2.1;continue;}
  const d=Math.hypot(player.x-e.x,player.y-e.y),range=1.2;
  if(e.cd<=0&&d<=range+.15){e.attack={elapsed:0,angle:Math.atan2(player.y-.15-e.y,player.x-e.x)};e.attacks=(e.attacks||0)+1;continue;}
  if(e.cd<=0&&d>range+.5&&d<8&&(e.ai==='hybrid'||e.ai==='ranged')){e.rangedAim=Math.atan2(player.y-.15-e.y,player.x-e.x);e.rangedWindup=.55;e.attacks=(e.attacks||0)+1;continue;}
  let goal={x:player.x,y:player.y};if((e.ai==='ranged'||e.ai==='hybrid')&&d<3&&e.cd>0){const v=norm(e.x-player.x,e.y-player.y);goal={x:e.x+v.x*2,y:e.y+v.y*2};}
  if(d>range*.7||e.ai!=='melee')moveAI3(e,goal,dt);}}
 function hitEnemy(e,v){e.hp-=v;e.flash=.14;e.hitTimer=.14;return true;}
 function drawEnemy(e){drawn.push({id:e.id,dir:e.direction,hit:e.hitTimer>0,atk:!!e.attack||e.rangedWindup>0});}`,g);
 vm.runInContext(C(FACE),g);if(fs.existsSync(path.join(R,'client-source',F)))vm.runInContext(C(F),g);return g;}
const mk=(o={})=>({id:'e'+Math.random().toString(36).slice(2,7),name:'적',hp:1e6,maxHp:1e6,x:16,y:12,speed:1.04,ai:'melee',cd:0,hitTimer:0,flash:0,attack:null,rangedWindup:0,spawnState:'active',direction:'right',combatProfile:{aggro:9,attackShape:{range:1.2}},...o});
function run(g,secs,{hitEvery=0,orbit=0,each=null}={}){const dt=1/60;let ang=0,nextHit=0;const L=[];
 for(let i=0;i<Math.round(secs/dt);i++){g.time=+(g.time+dt).toFixed(5);vm.runInContext('time='+g.time,g);
  if(orbit){const e=g.room.enemies[0];ang+=dt*orbit;g.player.x=e.x+Math.cos(ang)*2.4;g.player.y=e.y+Math.sin(ang)*2.4;}
  if(hitEvery&&g.time>=nextHit){nextHit=g.time+hitEvery;for(const e of g.room.enemies)g.hitEnemy(e,1);}
  g.tickEnemies(dt);g.drawn.length=0;for(const e of g.room.enemies)g.drawEnemy(e);if(each)each(g);L.push(g.drawn.map(d=>({...d})));}
 return L;}
const API=g=>g.__STORYWORLD_ENEMY_RULES_R1053__;
function duel(o,{secs=20,dist=4,ls}={}){const g=env(ls);const M=mk({x:20-dist,y:16,...o});g.room.enemies.push(M);let near=0,n=0,shots=0,swings=0,wasR=false,wasA=null;
 run(g,secs,{each:g=>{const d=Math.hypot(g.player.x-M.x,g.player.y-M.y);n++;if(d<=2)near++;if(M.rangedWindup>0&&!wasR)shots++;wasR=M.rangedWindup>0;if(M.attack&&M.attack!==wasA)swings++;wasA=M.attack;}});
 return {M,shots,swings,nearPct:100*near/n};}
{const r=duel({name:'붉은 하이힐 칼날',weapon:'blade',ai:'hybrid',cd:0});
 ok('⑥ blade hybrid at 4 tiles: no ranged shots (was every cooldown)',r.shots===0);
 ok('⑥ blade hybrid closes in and swings (≥ 6 melee in 20 s)',r.swings>=6);
 ok('⑥ blade hybrid spends most time within 2 tiles (≥ 70%)',r.nearPct>=70);
 ok('⑥ ai restored to hybrid after ticks',r.M.ai==='hybrid');}
{const r=duel({name:'심장빛 무대감독',midboss:true,weapon:'blade',ai:'hybrid',cd:0});
 ok('⑥ blade midboss at 4 tiles: no ranged shots',r.shots===0);ok('⑥ blade midboss swings (≥ 8)',r.swings>=8);}
{const r=duel({name:'칼',weapon:'blade',ai:'hybrid',cd:0},{dist:6.5,secs:1.2});
 ok('⑥ blade hybrid still shoots from beyond 4 tiles',r.shots>=1);}
{const r=duel({name:'박수',weapon:'caster',ai:'hybrid',cd:0});
 ok('⑥ regression: caster hybrid still shoots at 4 tiles',r.shots>=3);}
{const r=duel({name:'둔기',weapon:'heavy',ai:'hybrid',cd:0});
 ok('⑥ regression: heavy hybrid unchanged (still shoots at 4 tiles)',r.shots>=3);}
{const r=duel({name:'칼',weapon:'blade',ai:'hybrid',cd:0},{ls:{'storyworld.r1053.rules':'{"on":false}'}});
 ok('⑥ off switch: blade hybrid shoots like the engine',r.shots>=3);}
{const r=duel({name:'칼',weapon:'blade',ai:'hybrid',cd:0},{ls:{'storyworld.r1053.rules':'{"blade":false}'}});
 ok('⑥ partial switch blade:false restores engine shooting',r.shots>=3);}
{const g=env();const M=mk({weapon:'blade',ai:'hybrid',cd:0,x:NaN,y:16});g.room.enemies.push(M);let threw=false;try{run(g,.5);}catch(_){threw=true;}
 ok('⑥ NaN position: no throw',!threw);ok('⑥ NaN position: ai restored',M.ai==='hybrid');}
{const r=duel({name:'붉은 하이힐 칼날',weapon:'blade',ai:'hybrid',cd:1.5},{dist:4.4});
 ok('⑥ blade hybrid on cooldown just outside 4 tiles is not parked by the ranged distance band (closes in, ≥ 5 swings)',r.swings>=5);
 ok('⑥ … and ends up within 2 tiles most of the time (≥ 60%)',r.nearPct>=60);}
console.log(`R1053c blade melee cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

// R1053 CPU 검사: 적 전투 규칙(docs/enemy-combat-rules.md).
// 사용자 2026-11-15 "꼭두각시 실안개 등 보스들이 좌우를 번갈아서 보는 이유가 뭐야 전투중이니까 공격적으로 달려들어야지
//  그리고 몬스터가 피격당하면 피격모션도 있지만 피격만 계속당하지말고 공격도 해야해 너가 규칙정해서 일관성있게 해줘".
// 엔진 tickEnemies 의 hybrid 물러서기·hitEnemy 의 hitTimer 를 그대로 흉내 낸 작은 세계에서 규칙 ①~⑤ 와 경계값·회귀·NaN 을 본다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='enemy-rules-r1053.js',FACE='enemy-face-r444.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
ok('rules document docs/enemy-combat-rules.md exists',fs.existsSync(path.join(R,'..','docs','enemy-combat-rules.md')));
if(exists){
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));
 ok('R444 runtime copy matches source',C(FACE)===RT(FACE));
 try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const html=RT('index.html');
 ok('script tag once, right after kiss-lips-r1042 line',html.split('"./'+F+'"').length===2&&/<script src="\.\/kiss-lips-r1042\.js"><\/script>\n<script src="\.\/enemy-rules-r1053\.js"><\/script>\n/.test(html));
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r1053\/enemy-rules-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);
 ok('no save writes / no damage or hp changes',!/saveGame|\.hp\s*=[^=]|\.hp-=|\.damage\s*=/.test(src));
 ok('does not lengthen attack cooldown (rule ⑤)',!/\.cd\s*=[^=]|\.cd\+=/.test(src));
 ok('Mammon zones excluded',/mammon/.test(src)&&/ep1b06/.test(src));
}
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
const API=g=>g.__STORYWORLD_ENEMY_RULES_R1053__||{missing:true,faceHero:()=>null,inspect:()=>({stats:{errors:-1}})};
{// ② 접근: hybrid 중간보스, 영웅 가만히 2.4칸 → 물러서지 않고 근접 거리로
 const g=env();const B=mk({midboss:true,ai:'hybrid',cd:1.5,x:17.6,y:16});g.room.enemies.push(B);let maxD=0,sumD=0,n=0;
 run(g,12,{each:g=>{const d=Math.hypot(g.player.x-B.x,g.player.y-B.y);maxD=Math.max(maxD,d);sumD+=d;n++;}});
 ok('API exposed',!API(g).missing&&typeof API(g).inspect==='function');
 ok('② midboss (hybrid) closes in: mean distance ≤ 1.35 tiles (was ~3 with retreat)',sumD/n<=1.35);
 ok('② midboss never backs off past 2.5 tiles once engaged',maxD<=2.5);
 ok('② ai restored to hybrid after each tick',B.ai==='hybrid');
 ok('② midboss still attacks (≥ 8 starts in 12 s)',(B.attacks||0)>=8);}
{// ② 회귀: 일반 hybrid 몹은 거리 두기 그대로
 const g=env();const M=mk({ai:'hybrid',cd:1.5,x:17.6,y:16});g.room.enemies.push(M);let sumD=0,n=0;run(g,8,{each:g=>{sumD+=Math.hypot(g.player.x-M.x,g.player.y-M.y);n++;}});
 ok('② ordinary hybrid mob keeps its distance (mean ≥ 2.3)',sumD/n>=2.3);}
{// ② 경계: 원거리 보스(ranged)도 쿨다운 중 물러서지 않음 / 쿨다운 0 이면 원래 AI 로 원거리 공격 고름
 const g=env();const B=mk({boss:true,ai:'ranged',cd:0,x:24,y:16});g.room.enemies.push(B);run(g,1/60);
 ok('② ranged boss at 4 tiles with cd ready starts a ranged attack (ai untouched when ready)',B.rangedWindup>0&&B.ai==='ranged');}
{// ① 시선: 영웅이 둘레를 돌며 때리는 동안 중간보스는 공격 밖에서 영웅 반대쪽을 거의 보지 않는다
 const g=env();const B=mk({midboss:true,ai:'hybrid',cd:1,x:17.6,y:16});g.room.enemies.push(B);let away=0,n=0,flips=0,last=null;
 run(g,20,{orbit:.5,hitEvery:.25,each:g=>{const s=g.__STORYWORLD_ENEMY_FACE_R444__.state(B);if(!s)return;if(last&&s.side!==last)flips++;last=s.side;if(B.attack||B.rangedWindup>0)return;const hsx=(g.player.x-g.player.y)-(B.x-B.y);if(Math.abs(hsx)>.6){n++;if((hsx>0?'right':'left')!==s.side)away++;}}});
 ok('① midboss faces the hero outside attacks ≥ 95% while the hero circles at fighting pace (away '+(n?(100*away/n).toFixed(1):'-')+'%)',n>50&&away/n<=.05);
 ok('① side flips only when the hero crosses over: ≤ 2 per lap + 2 (got '+flips+', laps '+(20*.5/(2*Math.PI)).toFixed(2)+')',flips<=Math.ceil(2*20*.5/(2*Math.PI))+2);}
{// ① 회귀: 일반 몹이 떠나 걸을 땐 걷는 쪽(R444 그대로)
 const g=env();const M=mk({ai:'melee',x:20,y:12.5,speed:2});g.room.enemies.push(M);g.player.x=20;g.player.y=16;
 const F=g.__STORYWORLD_ENEMY_FACE_R444__;let s=null;for(let i=0;i<40;i++){g.time+=1/60;vm.runInContext('time='+g.time,g);M.x-=2/60;M.y+=2/60;s=F.state(M);}
 ok('① ordinary mob walking away keeps walking-side facing (R444 unchanged)',s&&s.owner==='move');
 ok('① faceHero false for ordinary mobs and beyond 6 tiles, true for a boss at 5.9, false at 6 (boundary)',!API(g).faceHero(M,2)&&API(g).faceHero({boss:true,hp:1},5.9)&&!API(g).faceHero({boss:true,hp:1},6)&&!API(g).faceHero({boss:true,hp:1},NaN));}
{// ③ 슈퍼아머: 0.1초마다 맞는 몹 — 공격 중 그려지는 순간에 피격 자세가 없다, 공격도 계속한다
 const g=env();const M=mk({ai:'melee',x:20.9,y:16});g.room.enemies.push(M);let atkDraw=0,atkHit=0,hitDraw=0,all=0;
 run(g,12,{hitEvery:.1,each:g=>{for(const d of g.drawn){all++;if(d.atk){atkDraw++;if(d.hit)atkHit++;}else if(d.hit)hitDraw++;}}});
 ok('③ no hit pose while attacking (0 of '+atkDraw+' attack draws, was '+atkHit+')',atkDraw>100&&atkHit===0);
 ok('③ mob keeps attacking under a 10/s barrage (≥ 8 starts in 12 s)',(M.attacks||0)>=8);
 ok('③ flash (hit feedback) still set on every hit',M.flash>0);
 // ④ 경직 상한: 공격 밖 시간 중 피격 자세 비율 ≤ 35%(0.45 보임 / 1.2 버팀 ≈ 27%)
 const idle=all-atkDraw;ok('④ hit pose capped outside attacks ('+(idle?(100*hitDraw/idle).toFixed(0):'-')+'% ≤ 35%)',idle>50&&hitDraw/idle<=.35);}
{// ④ 경계: 한 번 맞으면 피격 자세는 그대로 보인다(상한은 연타에만)
 const g=env();const M=mk({ai:'melee',x:26,y:16,cd:9});g.room.enemies.push(M);g.time=5;vm.runInContext('time=5',g);g.hitEnemy(M,1);
 ok('④ a single hit still shows the hit pose (hitTimer .14 kept)',Math.abs(M.hitTimer-.14)<1e-9);
 const B=mk({boss:true,ai:'melee',x:26,y:18,cd:9});g.room.enemies.push(B);g.hitEnemy(B,1);ok('④ boss first hit flinches',B.hitTimer>0);
 g.time=5.3;vm.runInContext('time=5.3',g);g.hitEnemy(B,1);ok('④ boss second hit within 0.6 s does not flinch again',B.hitTimer===0);
 g.time=5.65;vm.runInContext('time=5.65',g);g.hitEnemy(B,1);ok('④ boss hit after 0.6 s flinches again',B.hitTimer>0);}
{// NaN·Infinity 안전
 const g=env();const M=mk({ai:'hybrid',x:NaN,y:16,cd:NaN,hitTimer:NaN});const B=mk({midboss:true,ai:'hybrid',cd:Infinity,hitTimer:Infinity,x:19,y:16});g.room.enemies.push(M,B);let threw=false;
 try{run(g,1,{hitEvery:.2});vm.runInContext('time=NaN',g);g.tickEnemies(1/60);g.hitEnemy(B,1);}catch(e){threw=e;}
 ok('NaN/Infinity inputs do not throw',!threw);ok('no NaN hitTimer left behind',[M,B].every(e=>!Number.isNaN(e.hitTimer)));ok('ai restored',M.ai==='hybrid'&&B.ai==='hybrid');
 ok('no errors recorded',API(g).inspect().stats.errors===0);}
{// 끄기
 const g=env({'storyworld.r1053.rules':'{"on":false}'});
 const B=mk({midboss:true,ai:'hybrid',cd:1.5,x:17.6,y:16});g.room.enemies.push(B);let sumD=0,n=0;run(g,6,{each:g=>{sumD+=Math.hypot(g.player.x-B.x,g.player.y-B.y);n++;}});
 ok('switch off → engine retreat behaviour back (mean ≥ 2.3)',sumD/n>=2.3);}
console.log(`R1053 enemy-rules cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

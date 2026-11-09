// R443 CPU check — 적 방향 한 곳에서 정하기(공격 = 판정 각도, 걷기 = 실제 이동, 옆·뒷걸음/정지 = 영웅 쪽, 순간이동·피격·사망 유지) + 몬스터 그림자 없애기.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='enemy-face-r443.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
const PROV=['play-r113.js','combat-r137.js','play-r106.js','mobs-r109.js','samong-doll-r193.js','samong-shades-r200.js','story-mobs-r208.js','mob-dots-r375.js','samong-r161.js','combat-flow-r425.js','mob-art-variants-r306.js'];
for(const f of PROV){ok(f+': runtime copy matches and defers to R443',RT(f)===C(f)&&C(f).includes('__STORYWORLD_ENEMY_FACE_R443__'));}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
const html=RT('index.html');
ok('script tag once, right after bossroom-tidy-r438 and before combat-read-r409',html.split('"./'+F+'"').length===2&&/<script src="\.\/bossroom-tidy-r438\.js"><\/script><script src="\.\/enemy-face-r443\.js"><\/script><script src="\.\/combat-read-r409\.js"><\/script>/.test(html));
ok('loads after every face decider it overrides (R98·R113·R137·R268·R286·R375·R380)',['combat-r98.js','play-r113.js','combat-r137.js','mob-gaze-r268.js','mob-motion-r286.js','mob-dots-r375.js','approved-mobs-r380.js'].every(f=>html.indexOf('"./'+f+'"')>0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"')));
ok('listed in verify-r96-public.py',/'enemy-face-r443\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r443\/r443-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('presentation only: no hp/cd/attack/position/save writes',!/\be\.(?:hp|cd|attack|x|y|rangedAim|rangedWindup|speed)\s*=[^=]|saveGame|player\.[a-z]+\s*=[^=]/.test(src.replace(/\/\/.*$/mg,'')));
ok('Mammon untouched',!/ep1b06|mammon|맘몬/i.test(src.replace(/\/\/.*$/mg,'')));
// ---- 동작: 가짜 엔진에서 drawEnemy 를 프레임마다 부른다 ----
function env(){const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:0,y:0,hp:100},settings:{},shadowCalls:0,read:[]};
 E.window=E;E.drawEnemy=function(e){E.read.push(e.direction);E.shadow(1,2,3);};E.shadow=function(){E.shadowCalls++;};vm.createContext(E);vm.runInContext(src,E);return E;}
const mob=o=>({id:1,name:'몹',x:5,y:5,hp:10,maxHp:10,speed:2,spawnState:'active',direction:'front',combatProfile:{aggro:7,attackShape:{range:1.2}},...o});
function frames(E,e,n,step,dt=1/60){for(let i=0;i<n;i++){E.time+=dt;if(step)step(e,i);E.drawEnemy(e);}return E.read[E.read.length-1];}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R443__;ok('api exported',!!api&&typeof api.left==='function'&&typeof api.d4==='function'&&typeof api.owns==='function');
 // 1) 걷기: 화면 오른쪽(+x)으로 실제 이동 → 오른쪽(영웅은 왼쪽 멀리)
 E.player.x=-20;E.player.y=0;const e=mob({});frames(E,e,1);
 const d1=frames(E,e,40,e=>{e.x+=2/60;});ok('walk: faces real displacement (right) even with hero far left',d1==='right'&&api.state(e).owner==='move');
 // 2) 세로로 걷기(화면 아래: x,y 함께 +) → 마지막 좌우 유지
 const d2=frames(E,e,40,e=>{e.x+=1.4/60;e.y+=1.4/60;});ok('vertical walk keeps last side (side-view art, no front/back unflipped)',d2==='right');
 // 3) 대각선 경계 떨림: 매 프레임 좌우 번갈아 아주 작게 → 바뀌지 않음
 let flips=0,prev=E.read[E.read.length-1];frames(E,e,60,(e,i)=>{e.x+=(i%2?1:-1)*.012;e.y+=(i%2?1:-1)*.0115;const d=E.read[E.read.length-1];if(d!==prev)flips++;prev=d;});
 ok('jitter at the diagonal boundary does not flip (EMA + hold)',flips===0);
 // 4) 순간이동: 큰 튐은 걸음이 아니다
 const before=E.read[E.read.length-1];e.x-=4;frames(E,e,1);ok('teleport/knockback jump is not read as walking',E.read[E.read.length-1]===before&&api.state(e).owner==='warp');
 // 5) 블링크한 쪽이 정한 좌우는 받아들인다
 e.x+=3;e.direction='left';frames(E,e,1);ok('blinker-set side is adopted on a jump (R230/R268/R286)',E.read[E.read.length-1]==='left');}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R443__;const e=mob({x:5,y:5});E.player.x=7;E.player.y=5;frames(E,e,20);
 ok('idle near hero faces hero (right)',E.read[E.read.length-1]==='right'&&api.state(e).owner==='face');
 // 근접 공격: 판정 각도 = 화면 오른쪽, 준비 중 영웅이 뒤(왼쪽)로 돌아도 그림은 판정 쪽
 e.attack={angle:0,elapsed:0,footprint154:{shape:'arc',angle:0,radius:1.2,width:.9}};frames(E,e,5);ok('melee windup faces the locked hitbox angle',E.read[E.read.length-1]==='right'&&api.state(e).owner==='attack:melee');
 E.player.x=3;E.player.y=5;frames(E,e,30,e=>{e.attack.elapsed+=1/60;});ok('hero circles behind during windup: image stays with the hitbox (no split)',E.read[E.read.length-1]==='right');
 // 공격 끝 → 영웅 쪽으로 복구
 e.attack=null;frames(E,e,30);ok('after the attack the body returns to the hero side',E.read[E.read.length-1]==='left');
 // 원거리: rangedAim 쪽
 e.rangedWindup=.5;e.rangedAim=0;frames(E,e,3);ok('ranged windup faces rangedAim (projectile direction)',E.read[E.read.length-1]==='right'&&api.state(e).owner==='attack:ranged');e.rangedWindup=0;
 // 옆걸음(영웅 곁, 영웅 쪽 성분 0): 영웅 쪽을 본다
 E.player.x=5.8;E.player.y=5.8;frames(E,e,30);const s0=E.read[E.read.length-1];frames(E,e,40,e=>{e.x+=.9/60;e.y-=.9/60;});
 ok('strafing beside the hero keeps facing the hero (intent ≠ step)',api.state(e).owner==='face');
 // 피격 중엔 유지
 const keep=E.read[E.read.length-1];e.hitTimer=.3;frames(E,e,10,e=>{e.x-=.03;e.y+=.03;});ok('hurt/knockback holds the last side',E.read[E.read.length-1]===keep&&api.state(e).owner==='hold');e.hitTimer=0;
 // 사망: 굳힘
 const dk=E.read[E.read.length-1];e.hp=0;E.player.x=-9;frames(E,e,10);ok('death freezes the side',E.read[E.read.length-1]===dk&&api.state(e).owner==='dead');
 // 재사용(풀): hp 회복 + 활성 → 새로 시작
 e.hp=10;e.direction='left';frames(E,e,1);ok('pool reuse/respawn re-initialises (no stale walk vector)',api.state(e).owner==='spawn'||api.state(e).owner==='face');}
{const E=env();const e=mob({});frames(E,e,3);ok('monster contact shadows are skipped while drawing an enemy',E.shadowCalls===0);E.shadow();ok('non-enemy shadows (hero/props) still draw',E.shadowCalls===1);
 E.__STORYWORLD_ENEMY_FACE_R443__.set({shadows:true});frames(E,e,1);ok('{"shadows":true} brings mob shadows back',E.shadowCalls===2);}
{const E=env();const e=mob({persona:true,direction:'back'});frames(E,e,3);ok('persona (own 8-way art) is left to the engine',E.read[E.read.length-1]==='back');}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R443__;const e=mob({});E.player.x=5;E.player.y=9;frames(E,e,1);frames(E,e,40,e=>{e.x+=1.6/60;e.y+=1.6/60;});ok('4-way sheets get south when walking clearly down-screen',api.d4(e)==='south');
 frames(E,e,40,e=>{e.x+=2/60;e.y-=2/60;});ok('4-way sheets get east when walking clearly right',api.d4(e)==='east');}
{const E=env();E.__STORYWORLD_ENEMY_FACE_R443__.set({on:false});const e=mob({direction:'front'});frames(E,e,3);ok('{"on":false} leaves everything to the old rules',E.read[E.read.length-1]==='front'&&E.__STORYWORLD_ENEMY_FACE_R443__.left(e)===null);}
console.log(`\nR443 enemy-face: ${n-bad}/${n} passed`);if(bad)process.exit(1);

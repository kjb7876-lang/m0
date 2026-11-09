// R444 CPU check — 적 방향 한 곳에서 정하기(공격 = 판정 각도, 걷기 = 실제 이동, 옆·뒷걸음/정지 = 영웅 쪽, 순간이동·피격·사망 유지) + 몬스터 그림자 없애기.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let bad=0,n=0;const ok=(m,c)=>{n++;if(!c){bad++;console.log('FAIL',m);}else console.log('ok  ',m);};
const F='enemy-face-r444.js',src=C(F);
ok('runtime copy matches client source',RT(F)===src);
const PROV=['play-r113.js','combat-r137.js','play-r106.js','mobs-r109.js','samong-doll-r193.js','samong-shades-r200.js','story-mobs-r208.js','mob-dots-r375.js','samong-r161.js','combat-flow-r425.js','mob-art-variants-r306.js','approved-mobs-r380.js','mob-dots-r374.js','visual-r93.js','polish-r100.js','mob-unique-r248.js'];
for(const f of PROV){ok(f+': runtime copy matches and defers to R444',RT(f)===C(f)&&C(f).includes('__STORYWORLD_ENEMY_FACE_R444__'));}
try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
// 최종 뒤집기를 정하는 곳마다 R444 좌우를 먼저 묻는다(실측: 이 연결 전엔 R380 알집지기 17%, R93/R100 이 영웅 쪽으로 되돌림)
ok('R380 approved sheets: faceLeft asks R444 first (before R441 moveLeft / attack / hero)',/function faceLeft\(e\)\{const r444=window\.__STORYWORLD_ENEMY_FACE_R444__\?\.left\?\.\(e\);if\(typeof r444==='boolean'\)return r444;/.test(C('approved-mobs-r380.js')));
ok('R374 Dots sheets: faceLeft asks R444 first',/function faceLeft\(e\)\{const r444=window\.__STORYWORLD_ENEMY_FACE_R444__\?\.left\?\.\(e\);if\(typeof r444==='boolean'\)return r444;/.test(C('mob-dots-r374.js')));
ok('R93 flip chain: side() uses R444 (art table keeps only the L/R/F polarity), bosses pass R444 through',/function side\(e,art\)\{const r444=window\.__STORYWORLD_ENEMY_FACE_R444__\?\.left\?\.\(e\);if\(typeof r444==='boolean'\)return r444\?-1:1;/.test(C('visual-r93.js'))&&/function bossHold\(e,native\)\{if\(window\.__STORYWORLD_ENEMY_FACE_R444__\?\.owns\?\.\(e\)\)return native;/.test(C('visual-r93.js')));
ok('R248 self-drawn sheets (R290/R410 replacements): m.face follows R444 after its own rules',/\{const r444=window\.__STORYWORLD_ENEMY_FACE_R444__\?\.left\?\.\(e\);if\(typeof r444==='boolean'\)m\.face=r444\?-1:1;\}/.test(C('mob-unique-r248.js'))&&C('mob-unique-r248.js').indexOf('m.face=r444')>C('mob-unique-r248.js').indexOf('let fr=attackFrame(e)'));
ok('R100 flip chain: wantLeft() uses R444',/function wantLeft\(e\)\{const r444=window\.__STORYWORLD_ENEMY_FACE_R444__\?\.left\?\.\(e\);if\(typeof r444==='boolean'\)return r444;/.test(C('polish-r100.js')));
ok('R442 exposes the skill angle (read-only) and its runtime copy matches',/angle:e=>\{const m=marks\.get\(e\);if\(!m\)return null;const el=T\(\)-m\.t0;return el>=0&&el<m\.dur\?m\.angle:null;\}/.test(C('enemy-skill-pose-r442.js'))&&RT('enemy-skill-pose-r442.js')===C('enemy-skill-pose-r442.js'));
const html=RT('index.html');
ok('script tag once, right after bossroom-tidy-r438 and before combat-read-r409',html.split('"./'+F+'"').length===2&&/<script src="\.\/bossroom-tidy-r438\.js"><\/script><script src="\.\/enemy-face-r444\.js"><\/script><script src="\.\/combat-read-r409\.js"><\/script>/.test(html));
ok('loads after every face decider it overrides (R98·R113·R137·R268·R286·R375·R380)',['combat-r98.js','play-r113.js','combat-r137.js','mob-gaze-r268.js','mob-motion-r286.js','mob-dots-r375.js','approved-mobs-r380.js'].every(f=>html.indexOf('"./'+f+'"')>0&&html.indexOf('"./'+f+'"')<html.indexOf('"./'+F+'"')));
ok('listed in verify-r96-public.py',/'enemy-face-r444\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
ok('pages.yml runs this check',/r96\/qa\/r444\/r444-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('presentation only: no hp/cd/attack/position/save writes',!/\be\.(?:hp|cd|attack|x|y|rangedAim|rangedWindup|speed)\s*=[^=]|saveGame|player\.[a-z]+\s*=[^=]/.test(src.replace(/\/\/.*$/mg,'')));
ok('Mammon only appears as an exclusion',/function mammon\(e\)/.test(src)&&/!mammon\(e\)/.test(src));
// ---- 동작: 가짜 엔진에서 drawEnemy 를 프레임마다 부른다 ----
function env(){const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:0,y:0,hp:100},settings:{},shadowCalls:0,read:[]};
 E.window=E;E.drawEnemy=function(e){E.read.push(e.direction);E.shadow(1,2,3);};E.shadow=function(){E.shadowCalls++;};vm.createContext(E);vm.runInContext(src,E);return E;}
const mob=o=>({id:1,name:'몹',x:5,y:5,hp:10,maxHp:10,speed:2,spawnState:'active',direction:'front',combatProfile:{aggro:7,attackShape:{range:1.2}},...o});
function frames(E,e,n,step,dt=1/60){for(let i=0;i<n;i++){E.time+=dt;if(step)step(e,i);E.drawEnemy(e);}return E.read[E.read.length-1];}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R444__;ok('api exported',!!api&&typeof api.left==='function'&&typeof api.d4==='function'&&typeof api.owns==='function');
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
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R444__;const e=mob({x:5,y:5});E.player.x=7;E.player.y=5;frames(E,e,20);
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
 E.__STORYWORLD_ENEMY_FACE_R444__.set({shadows:true});frames(E,e,1);ok('{"shadows":true} brings mob shadows back',E.shadowCalls===2);}
{const E=env();const e=mob({persona:true,direction:'back'});frames(E,e,3);ok('persona (own 8-way art) is left to the engine',E.read[E.read.length-1]==='back');}
{const E=env();const tw=mob({r170Tower:{art:'x'},r446Pillar:true,direction:'front'});frames(E,tw,3);ok('stationary structure enemies (R170 tower / R446 pillar) are not managed: no facing, shadow left to R206',E.read[E.read.length-1]==='front'&&E.__STORYWORLD_ENEMY_FACE_R444__.left(tw)===null&&E.shadowCalls===3);}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R444__;const t=mob({r75Tower:true,ai:'ranged',speed:0});E.player.x=2;E.player.y=8;frames(E,t,30);ok('R75 pack turret (r75Tower, ordinary mob art, speed 0) is managed and faces the hero while idle',api.left(t)===true);
 t.rangedWindup=.6;t.rangedAim=0;frames(E,t,3);ok('R75 pack turret faces its ranged aim during the windup even with the hero behind',E.read[E.read.length-1]==='right'&&api.state(t).owner==='attack:ranged');t.rangedWindup=0;
 const c=mob({r75Tower:true,r251Circle:true,speed:0,direction:'front'});frames(E,c,3);ok('R251 summoning circle (r75Tower + r251Circle) stays unmanaged',api.left(c)===null);}
{const E=env();E.room={id:'ep1b06'};const e=mob({direction:'front'});frames(E,e,3);ok('Mammon zone (ep1b06) untouched',E.read[E.read.length-1]==='front'&&E.__STORYWORLD_ENEMY_FACE_R444__.left(e)===null);}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R444__;const e=mob({});E.player.x=5;E.player.y=9;frames(E,e,1);frames(E,e,40,e=>{e.x+=1.6/60;e.y+=1.6/60;});ok('4-way sheets get south when walking clearly down-screen',api.d4(e)==='south');
 frames(E,e,40,e=>{e.x+=2/60;e.y-=2/60;});ok('4-way sheets get east when walking clearly right',api.d4(e)==='east');}
{const E=env(),api=E.__STORYWORLD_ENEMY_FACE_R444__;const e=mob({});E.player.x=-20;frames(E,e,1);frames(E,e,30,e=>{e.x-=2/60;});const walkSide=E.read[E.read.length-1];
 // R442 보스 테마 기술(0.9초): 걸으며 시전해도 기술이 떨어지는 쪽(각 0 = 화면 오른쪽)을 본다 → 끝나면 다시 걸음
 let sk=0;E.__STORYWORLD_ENEMY_SKILL_POSE_R442__={angle:()=>sk};frames(E,e,3,e=>{e.x-=2/60;});ok('R442 skill cast: body faces the skill target side while walking the other way',walkSide==='left'&&E.read[E.read.length-1]==='right'&&api.state(e).owner==='attack:skill');
 sk=null;frames(E,e,30,e=>{e.x-=2/60;});ok('after the skill the walk side returns',E.read[E.read.length-1]==='left'&&api.state(e).owner==='move');}
{// 자세 프레임(R54 이야기 전투 자세·R53 병원 자세): 프레임 안 flip 을 R444 좌우 + 그 자세의 그림 규칙으로
 const E={console,Math,JSON,Number,String,Object,WeakMap,Map,Set,Array,localStorage:{getItem:()=>null,setItem:()=>{}},time:0,player:{x:-20,y:0,hp:100},settings:{},read:[]};E.window=E;
 E.drawEnemy=function(e){E.read.push(e.direction);};E.shadow=function(){};E.__STORYWORLD_STORY_COMBAT_R54__=Object.freeze({__r380:true,frameFor:(e,f)=>f});E.__STORYWORLD_ENEMY_MOTION_R51__=Object.freeze({__r208:true,flip:(e,f,fb)=>f?.r74Monster?f.flip:fb});vm.createContext(E);vm.runInContext(src,E);
 const S=E.__STORYWORLD_STORY_COMBAT_R54__,e=mob({});frames(E,e,1);frames(E,e,30,e=>{e.x+=2/60;});// 오른쪽으로 걷는 중(영웅은 왼쪽 멀리)
 ok('pose wrapper installed outermost, other provider markers kept',S.__r444===true&&S.__r380===true);
 const f0={path:'a.webp',flip:true,r54StoryPose:true,assetFrame:{}};const r0=S.frameFor(e,f0);ok('R54 story pose (right-facing art) walking right: flip off, original frame untouched',r0.flip===false&&f0.flip===true&&r0.r54StoryPose===true);
 ok('R54 story pose with left-baked art walking right: flipped',S.frameFor(e,{flip:false,r54StoryPose:true,assetFrame:{bakedFacing:'left'}}).flip===true);
 const f8={flip:false,r54StoryPose:true,assetFrame:{bakedFacing:'eight-way'}};ok('R54 eight-way bodies keep their own direction canvas',S.frameFor(e,f8)===f8);
 ok('R53 hospital pose walking right: not flipped',S.frameFor(e,{flip:true,r53HospitalPose:true,assetFrame:{bakedFacing:'eight-way'}}).flip===false);
 frames(E,e,40,e=>{e.x-=2/60;});ok('R53 hospital pose walking left: flipped',S.frameFor(e,{flip:false,r53HospitalPose:true,assetFrame:{bakedFacing:'eight-way'}}).flip===true);
 const M=E.__STORYWORLD_ENEMY_MOTION_R51__;ok('R74 atlas flip rule installed outermost on the R51 chain (other markers kept)',M.__r444===true&&M.__r208===true);
 ok('R74 monster atlas walking left: flipped by R444 side (the frame itself always faced the hero)',M.flip(e,{r74Monster:'m',flip:false},false)===true&&M.flip(e,{r208Mob:'x',flip:false},'FB')==='FB');
 const pf={flip:true,r54StoryPose:true,assetFrame:{}};ok('persona / other frames untouched',S.frameFor(mob({persona:true}),pf)===pf&&S.frameFor(e,{flip:true,r208Mob:'x'}).flip===true);}
{const E=env();E.__STORYWORLD_ENEMY_FACE_R444__.set({on:false});const e=mob({direction:'front'});frames(E,e,3);ok('{"on":false} leaves everything to the old rules',E.read[E.read.length-1]==='front'&&E.__STORYWORLD_ENEMY_FACE_R444__.left(e)===null);}
console.log(`\nR444 enemy-face: ${n-bad}/${n} passed`);if(bad)process.exit(1);

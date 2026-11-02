// R217 CPU check: 뿌리 보스 환영 간격 ×3·체력 66%, 보스·중간보스 최소 영웅 1.6배, 시야 배율 0.7~1(카메라 확대값을 쌓지 않고 나눔).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html'),pos=f=>idx.indexOf('./'+f);
ok('view-r217 loads after skills-r209 and before combat-r118',pos('view-r217.js')>pos('skills-r209.js')&&pos('skills-r209.js')>0&&pos('view-r217.js')<pos('combat-r118.js'));
ok('lag-r217 loads right after view-r217',pos('lag-r217.js')>pos('view-r217.js')&&pos('lag-r217.js')<pos('combat-r118.js'));
ok('runtime copies match',['view-r217.js','lag-r217.js','cave-r204.js','boss-r205.js','balance-r179.js'].every(f=>RT(f)===C(f)));
ok('in the public verify list and the CI workflow',/'view-r217\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r217\/r217-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
// 보스
{const b=C('boss-r205.js');ok('root boss echo gap ×3 (26s → 78s, ≥66% fewer clones); other bosses keep 26s',/ROOT_GAP_MUL=3/.test(b)&&/gap\.set\(e,\(a\.endAt\|\|t\)\+gapOf\(e\)\)/.test(b));
 const sb={console,Math,JSON,String,Number,Object,localStorage:{getItem:()=>null,setItem(){}},window:{},time:0,room:{enemies:[]},player:{x:0,y:0,hp:1}};vm.createContext(sb);
 vm.runInContext('function tick(){} function drawEnemy(){}',sb);vm.runInContext(C('boss-r205.js'),sb);const B=sb.window.__STORYWORLD_BOSS_R205__;
 ok('gapOf: 뿌리의 문지기 78s, other boss 26s',B.gapOf({boss:true,nativeId:'dist00-boss',name:'뿌리의 문지기'})===78&&B.gapOf({boss:true,nativeId:'dist06-boss',name:'발록'})===26);
 ok('min boss height constant is 1.6× hero',B.constants.MIN_BOSS_H===1.6);
 // 그려진 몸 기준 맞춤: 기록기 명령의 그림 높이가 영웅 몸(actorHeight×.98)×1.6 보다 작으면 발밑 기준으로 키운다
 const sb2={console,Math,JSON,String,Number,Object,localStorage:{getItem:()=>null,setItem(){}},window:{},time:0,room:{enemies:[]},player:{x:0,y:0,hp:1},document:{createElement:()=>({getContext:()=>null})}};vm.createContext(sb2);
 vm.runInContext('var ctx={commands:[]};function actorHeight(){return 50;}function tick(){} function drawEnemy(e){ctx.commands.push({kind:"image",owner:e,points:[[-20,-e.h],[20,-e.h],[20,0],[-20,0]]});}',sb2);vm.runInContext(C('boss-r205.js'),sb2);
 sb2.__e={midboss:true,hp:10,maxHp:10,defScale:1,h:40,combatProfile:{spriteRect:{height:1}}};vm.runInContext('drawEnemy(__e)',sb2);const P=vm.runInContext('ctx.commands[0].points',sb2),hh=Math.abs(P[3][1]-P[0][1]);
 ok('a midboss drawn 40px tall (hero body 49px) is lifted to ≥1.6× hero body around its feet',Math.abs(hh-50*.98*1.6)<1e-6&&P[3][1]===0,{hh});
 sb2.__e={boss:true,hp:10,maxHp:10,defScale:1,h:120};vm.runInContext('ctx.commands.length=0;drawEnemy(__e)',sb2);ok('a boss already ≥1.6× is left as drawn',Math.abs(vm.runInContext('ctx.commands[0].points[0][1]',sb2)+120)<1e-9);
 sb2.__e={hp:10,maxHp:10,defScale:1,h:40};vm.runInContext('ctx.commands.length=0;drawEnemy(__e)',sb2);ok('ordinary mobs are not resized',Math.abs(vm.runInContext('ctx.commands[0].points[0][1]',sb2)+40)<1e-9);}
// 체력
{const got=[];const sb={console,Math,JSON,localStorage:{getItem:()=>null,setItem(){}},window:{},layer:'STORY',room:{id:'dist00'},hitEnemy:(e,v)=>{got.push(v);return true;}};vm.createContext(sb);vm.runInContext(C('balance-r179.js'),sb);
 const hit=e=>{got.length=0;sb.__e=e;vm.runInContext('hitEnemy(__e,100)',sb);return got[0];};
 ok('root boss takes ÷(0.45×0.66) (66% of the previous HP); dist00 midboss keeps ÷0.45',Math.abs(hit({boss:true})-100/(.45*.66))<1e-6&&Math.abs(hit({midboss:true})-100/.45)<1e-6);
 sb.room.id='dist01';ok('other regions unchanged (dist01 boss ÷0.6)',Math.abs(hit({boss:true})-100/.6)<1e-6);}
// 시야
{const sb={console,Math,JSON,Number,localStorage:{getItem:()=>null,setItem(){}},window:{},zoom:1};vm.createContext(sb);
 vm.runInContext('var zoom=1;function cameraTick(dt){zoom+=(2-zoom)*.5;}',sb);vm.runInContext(C('view-r217.js'),sb);const V=sb.window.__STORYWORLD_VIEW_R217__;
 vm.runInContext('cameraTick(1)',sb);const z1=vm.runInContext('zoom',sb);
 V.set(.7);vm.runInContext('cameraTick(1);cameraTick(1);cameraTick(1)',sb);const z2=vm.runInContext('zoom',sb);const base=2-(2-1.5)*.125;
 ok('factor 1 leaves the camera untouched',z1===1.5,z1);
 ok('factor 0.7 divides the camera zoom once per frame without compounding',Math.abs(z2-base/.7)<1e-9,{z2,want:base/.7});
 ok('factor clamps to 0.7..1',V.set(.2)===.7&&V.set(3)===1);
 vm.runInContext('cameraTick(1)',sb);ok('back to 1 restores the raw zoom',Math.abs(vm.runInContext('zoom',sb)-(2-(2-base)*.5))<1e-9);}
// 통로 확장(cave-r204): 쉼터(hub)·디테일 전용을 뺀 유기 지형 지역 모두 widen, 폭 4칸 이하 통로만 2.3칸까지
{const c=C('cave-r204.js');ok('all organic zones except the hub widen corridors (depth ≤2 cells, radius 2.3) and widen can be switched off',/WIDEN_SKIP=new Set\(\['hub'\]\)/.test(c)&&/c\.widenHW=c\.widenHW\|\|2;c\.widenR=c\.widenR\|\|2\.3/.test(c)&&/!prefs\.widen\|\|/.test(c));}
// 길찾기 간선 기억(lag-r217)
{let calls=0;const sb={console,Math,JSON,String,Number,Object,localStorage:{getItem:()=>null,setItem(){}},window:{},performance:{now:()=>sb.__t},__t:0,room:{id:'a'}};vm.createContext(sb);
 vm.runInContext('function clearPath3(a,b,r,w){__calls++;return a.x+b.x<10;}var __calls=0;',sb);vm.runInContext(C('lag-r217.js'),sb);
 const q=(ax,ay,bx,by,w)=>{sb.__a={x:ax,y:ay};sb.__b={x:bx,y:by};sb.__w=w||sb.room;return vm.runInContext('clearPath3(__a,__b,.29,__w)',sb);};
 q(1.5,1.5,2.5,1.5);q(1.5,1.5,2.5,1.5);ok('cell-centre edge answered once, then from memory',vm.runInContext('__calls',sb)===1);
 q(1.3,1.5,2.5,1.5);q(1.3,1.5,2.5,1.5);ok('off-centre (real position) queries are never memoised',vm.runInContext('__calls',sb)===3);
 sb.__t=1500;q(1.5,1.5,2.5,1.5);ok('memory expires after 1 s',vm.runInContext('__calls',sb)===4);
 q(1.5,1.5,2.5,1.5,{id:'b'});ok('a different room never reuses the memory',vm.runInContext('__calls',sb)===5);
 ok('same answers as the original (true/false)',q(1.5,1.5,2.5,1.5)===true&&q(8.5,1.5,2.5,1.5)===false);}
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');

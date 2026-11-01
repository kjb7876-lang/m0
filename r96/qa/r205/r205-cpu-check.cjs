// R205 CPU check: 중간보스 50%·환영은 보스만(가끔)·보스가 환영 쪽으로 이동·광폭화(30%↓ 크기2·범위2·공격 +6%).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
const idx=RT('index.html');ok('boss-r205 loads after combat-r137 and before combat-r118',idx.indexOf('./boss-r205.js')>idx.indexOf('./combat-r137.js')&&idx.indexOf('./boss-r205.js')<idx.indexOf('./combat-r118.js'));
ok('runtime copy matches',RT('boss-r205.js')===C('boss-r205.js'));
ok('in the public verify list and the CI workflow',/'boss-r205\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r205\/r205-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('no ctx.filter (recorder rule)',!/ctx\.filter/.test(C('boss-r205.js')));
const states=new Map(),drawn=[];
const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:()=>null,setItem(){}},window:{},toasts:[]};
sb.window.__STORYWORLD_FIELDS_R61__={state:e=>{if(!states.has(e))states.set(e,{next:5,step:0});return states.get(e);}};
sb.window.__STORYWORLD_COMBAT_R137__={midClass:e=>!!e&&!e.boss&&(e.midboss||e.wardChampionR81),prefs:()=>({midbossScale:true})};
vm.createContext(sb);
vm.runInContext(`var started=true,loading=false,modal=null,time=10,player={x:20,y:10,hp:100},hazards=[],ctx=null;
var room={enemies:[]};function tick(dt){} function drawEnemy(e){__drawn.push([e.id,e.defScale]);} function toast(t){__toasts.push(t);}
function moveActor(e,dx,dy){e.x+=dx;e.y+=dy;}`,sb);sb.__drawn=drawn;sb.__toasts=sb.toasts;
vm.runInContext(C('boss-r205.js'),sb);const API=sb.window.__STORYWORLD_BOSS_R205__;
const mid={id:'mid',midboss:true,hp:100,maxHp:100,defScale:1.4,x:5,y:5,damage:10},boss={id:'boss',boss:true,hp:1000,maxHp:1000,defScale:2,x:5,y:10,damage:50,combatProfile:{attackShape:{range:3,radius:1.5}}},mob={id:'mob',hp:10,maxHp:10,defScale:1,x:9,y:9,damage:5};
sb.room.enemies.push(mid,boss,mob);
// ① 크기
vm.runInContext(`drawEnemy(room.enemies[0]);drawEnemy(room.enemies[1]);drawEnemy(room.enemies[2]);`,sb);
ok('midboss drawn at 5/7 of R137 70% scale (=50% overall), restored after; boss and mob unchanged',Math.abs(drawn[0][1]-1.4*5/7)<1e-9&&mid.defScale===1.4&&drawn[1][1]===2&&drawn[2][1]===1,drawn);
// ② 환영: 중간보스 차례 멈춤, 시작된 환영 거둠
const aMid={kind:'echo',start:10,releaseAt:11,endAt:11.5,angle:0};mid.r61Action=aMid;vm.runInContext('tick(1/60)',sb);
ok('midboss R61 turn stopped and its started illusion cancelled before release',states.get(mid).next===Infinity&&aMid.cancelled===true);
// 보스: 환영 뒤 26초 동안 환영 칸 건너뜀, 장판 칸은 그대로
const aB={kind:'echo',start:10,releaseAt:10.5,endAt:11,angle:0,target:{x:12,y:10}};boss.r61Action=aB;vm.runInContext('tick(1/60)',sb);
// ③ 환영 쪽 이동: 풀린 뒤 목표(12,10) 쪽으로, 영웅 1칸 앞까지, 최대 7칸
for(let i=0;i<90;i++){vm.runInContext('time+=1/60;tick(1/60)',sb);}
ok('boss moves toward where its illusion went (≤7 cells, stops before the hero)',boss.x>9&&boss.x<=12.01&&Math.abs(boss.y-10)<1e-6,{x:boss.x});
// 보스: 환영 뒤 26초 동안 환영 칸 건너뜀, 장판 칸은 그대로
const st=states.get(boss);st.step=1;vm.runInContext('time=20;tick(1/60)',sb);const skipped=st.step===2;st.step=0;vm.runInContext('tick(1/60)',sb);
ok('boss: echo step skipped during the 26 s gap, field step kept',skipped&&st.step===0);
const st2=states.get(boss);st2.step=1;vm.runInContext('time=40;tick(1/60)',sb);ok('after the gap the echo step is allowed again',st2.step===1);
// ④ 광폭화
boss.hp=290;vm.runInContext('tick(1/60)',sb);
ok('enrage at ≤30% HP once: damage ×1.06, attack shape ranges ×2, notice shown',boss.r205Enraged&&Math.abs(boss.damage-53)<1e-9&&boss.combatProfile.attackShape.range===6&&boss.combatProfile.attackShape.radius===3&&sb.toasts.length===1);
vm.runInContext('tick(1/60)',sb);ok('enrage does not stack',Math.abs(boss.damage-53)<1e-9&&sb.toasts.length===1);
drawn.length=0;vm.runInContext('drawEnemy(room.enemies[1])',sb);ok('enraged boss drawn at 2× size, restored after',drawn[0][1]===4&&boss.defScale===2);
const h={owner:'boss',radius:2,width:1,age:0};sb.hazards.push(h);vm.runInContext('hazards.push(__h);tick(1/60)',Object.assign(sb,{__h:h}));
ok('new hazards of the enraged boss get 2× range',h.radius===4&&h.width===2);
const h2={owner:'mob',radius:2,age:0};vm.runInContext('hazards.push(__h2);tick(1/60)',Object.assign(sb,{__h2:h2}));ok('other owners untouched',h2.radius===2);
mid.hp=20;vm.runInContext('tick(1/60)',sb);ok('midbosses never enrage',!mid.r205Enraged);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');

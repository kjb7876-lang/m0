// R1150 CPU check (사용자 2026-11-18 07:37Z "모든 모드 보스광폭화 커지는거 원크기의 6프로정도만 조금 커지게하고 모든스펙 66프로 올려줘 초당 체력재생도 0.6프로"):
//  광폭화(R205, 보스급 체력 30% 이하 한 번) — 그림 1.06배(판정 반지름 그대로), 공격력·이동 속도·공격 속도(쿨다운 1.66배 빨리)·방어(받는 피해 ÷1.66) 66% 상승,
//  광폭화 중 초당 최대 체력 0.6% 재생(최대 체력 넘지 않음, 죽은 보스는 안 살림, 서사 붙잡기(R384 hold) 중엔 멈춤). 스킬 범위 2배는 그대로.
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});const near=(a,b,t=1e-9)=>Math.abs(a-b)<=t;
ok('runtime copy matches',RT('boss-r205.js')===C('boss-r205.js'));
ok('CI workflow runs this check',/qa\/r1150\/r1150-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
function env(opt={}){
 const sb={console,Math,JSON,Set,Map,WeakMap,Number,String,Object,Array,localStorage:{getItem:()=>null,setItem(){}},window:{},toasts:[],drawn:[]};
 sb.window.__STORYWORLD_FIELDS_R61__={state:()=>({next:5,step:0})};
 if(opt.coop)sb.window.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};
 if(opt.hold)sb.window.__STORYWORLD_CINEMA_SYNC_R384__={inspect:()=>({bossMode:sb.__hold?'hold':'normal'})},sb.__hold=true;
 vm.createContext(sb);
 vm.runInContext(`var started=true,loading=false,modal=null,time=10,player={x:20,y:10,hp:100},hazards=[],ctx=null;var room={enemies:[]};
  function tick(dt){for(const e of room.enemies)if(e.hp>0&&Number.isFinite(e.cd))e.cd-=dt;}
  function drawEnemy(e){drawn.push([e.id,e.defScale]);} function toast(t){toasts.push(t);}
  function hitEnemy(e,v){if(!e||e.hp<=0||!(v>0))return false;e.hp-=Math.min(e.hp,v);return true;}
  function moveActor(e,dx,dy){e.x+=dx;e.y+=dy;}`,sb);
 vm.runInContext(C('boss-r205.js'),sb);sb.API=sb.window.__STORYWORLD_BOSS_R205__;sb.API.set({minSize:false,echoMove:false});
 sb.step=(sec,dt=1/60)=>{for(let i=0;i<Math.round(sec/dt);i++)vm.runInContext(`time+=${dt};tick(${dt})`,sb);};
 return sb;}
const mk=o=>({id:'boss',boss:true,hp:1000,maxHp:1000,defScale:2,radius:.9,x:5,y:10,damage:50,speed:2,cd:5,combatProfile:{attackShape:{range:3,radius:1.5}},...o});
// 상수
{const g=env(),K=g.API.constants;ok('constants: size 1.06, stats 1.66, regen 0.6%/s, enrage at 30%, range 2× unchanged',K.ENRAGE_SIZE===1.06&&K.ENRAGE_STAT===1.66&&K.ENRAGE_DMG===1.66&&K.ENRAGE_REGEN===.006&&K.ENRAGE_AT===.3&&K.ENRAGE_RANGE===2,K);}
// 경계: 30.1% 는 아직, 30% 는 광폭화
{const g=env(),b=mk({hp:301});g.room.enemies.push(b);g.step(1/60);ok('30.1% HP → not enraged yet',!b.r205Enraged&&b.damage===50&&b.speed===2);
 b.hp=300;g.step(1/60);ok('exactly 30% → enraged once with notice',!!b.r205Enraged&&g.toasts.length===1);
 ok('damage ×1.66 (50 → 83)',near(b.damage,83),b.damage);ok('move speed ×1.66 (2 → 3.32)',near(b.speed,3.32),b.speed);
 ok('hit radius (판정) unchanged',b.radius===.9);ok('attack shape range still ×2',b.combatProfile.attackShape.range===6&&b.combatProfile.attackShape.radius===3);
 g.drawn.length=0;vm.runInContext('drawEnemy(room.enemies[0])',g);ok('enraged boss drawn at 1.06× (2 → 2.12), restored after',near(g.drawn[0][1],2.12)&&b.defScale===2,g.drawn);
 // 회귀: 재생으로 30% 위로 올라갔다 다시 내려와도 두 번 곱하지 않음
 b.hp=500;g.step(1/60);b.hp=200;g.step(1/60);ok('regression: stats multiplied only once (no re-enrage)',near(b.damage,83)&&near(b.speed,3.32)&&g.toasts.length===1,{d:b.damage,s:b.speed});}
// 공격 속도: 쿨다운 1.66배 빨리
{const g=env(),a=mk({hp:200,cd:10}),n=mk({id:'calm',hp:900,cd:10});g.room.enemies.push(a,n);g.step(1/60);a.cd=10;n.cd=10;a.hp=200;g.step(1);
 ok('attack speed: enraged cooldown runs 1.66× (−1.66 in 1 s), calm boss −1',near(10-a.cd,1.66,.02)&&near(10-n.cd,1,.02),{a:10-a.cd,n:10-n.cd});}
// 방어: 받는 피해 ÷1.66
{const g=env(),b=mk({hp:300}),c=mk({id:'calm',hp:900}),m={id:'mob',hp:100,maxHp:100,damage:5,speed:2};g.room.enemies.push(b,c,m);g.step(1/60);
 const h0=b.hp;vm.runInContext('hitEnemy(room.enemies[0],166)',g);ok('defense: enraged boss takes 166/1.66 = 100',near(h0-b.hp,100,1e-6),h0-b.hp);
 vm.runInContext('hitEnemy(room.enemies[1],166);hitEnemy(room.enemies[2],50)',g);ok('calm boss and mobs take full damage',c.hp===734&&m.hp===50);
 b.hp=1;vm.runInContext('hitEnemy(room.enemies[0],50)',g);ok('enraged boss can still be killed',b.hp<=0);}
// 재생
{const g=env(),b=mk({hp:250});g.room.enemies.push(b);g.step(1/60);const h0=b.hp;g.step(1);ok('regen +0.6% max HP per second (≈6/1000 in 1 s)',near(b.hp-h0,6,.15),b.hp-h0);
 b.hp=998;g.step(2);ok('regen never exceeds max HP',b.hp===1000,b.hp);
 const d=mk({id:'dead',hp:0});g.room.enemies.push(d);d.r205Enraged={at:0};g.step(1);ok('dead enraged boss is not revived',d.hp===0);
 const c=mk({id:'calm',hp:900});g.room.enemies.push(c);g.step(1);ok('no regen before enrage',c.hp===900);
 vm.runInContext('modal={}',g);b.hp=300;g.step(1);ok('no regen while paused (modal)',b.hp===300);}
// 생존 모드 체력 잠금(guardBossHp 처럼 접근자)에서도 재생이 들어감
{const g=env(),b=mk({hp:250});let v=250;Object.defineProperty(b,'hp',{configurable:true,enumerable:true,get:()=>v,set:n=>{if(n>=v)v=n;else v=Math.max(n,v-60);}});
 g.room.enemies.push(b);g.step(1/60);const h0=b.hp;g.step(1);ok('regen goes through an hp accessor (survival guard)',near(b.hp-h0,6,.15),b.hp-h0);}
// 서사 붙잡기 중엔 재생 멈춤
{const g=env({hold:true}),b=mk({hp:250});g.room.enemies.push(b);g.step(1/60);const h0=b.hp;g.step(1);ok('no regen while R384 holds the boss for narration',b.hp===h0);
 g.__hold=false;g.step(1);ok('regen resumes after the hold',near(b.hp-h0,6,.15));}
// 중간보스·잡몹·협동
{const g=env(),mid={id:'mid',midboss:true,hp:10,maxHp:100,damage:10,speed:2,defScale:1},mob={id:'mob',hp:1,maxHp:10,damage:5,speed:2};g.room.enemies.push(mid,mob);g.step(1);
 ok('midboss and mobs never enrage',!mid.r205Enraged&&!mob.r205Enraged&&mid.damage===10&&mob.speed===2&&mid.hp===10);}
{const g=env({coop:true}),b=mk({hp:100});g.room.enemies.push(b);g.step(1);vm.runInContext('hitEnemy(room.enemies[0],10)',g);
 ok('co-op: unchanged (enrage stays off as before)',!b.r205Enraged&&b.damage===50&&b.hp===90);}
// 다른 보스급(사몽 persona·cosmic·trial)도 같은 규칙 — 모든 모드
{const g=env(),p=mk({id:'p',boss:false,persona:true,hp:100}),q=mk({id:'q',boss:false,cosmic:true,hp:100});g.room.enemies.push(p,q);g.step(1/60);
 ok('persona / cosmic boss classes enrage the same way',near(p.damage,83)&&near(q.speed,3.32));}
const fail=checks.filter(c=>!c.pass);for(const c of checks)console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));
console.log(`R1150 enrage: ${checks.length-fail.length}/${checks.length} passed`);if(fail.length)process.exit(1);

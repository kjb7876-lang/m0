// R330 보스급 재해 스킬 검사 — 정적 + 가짜 전역으로 시전·위험지대·피해 순서를 돌린다(GPU·실기기 아님).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const src=fs.readFileSync(path.join(root,'client-source/disaster-r330.js'),'utf8');
assert.strictEqual(src,fs.readFileSync(path.join(root,'runtime-text/disaster-r330.js'),'utf8'));ok('client-source and runtime copies agree');
const idx=fs.readFileSync(path.join(root,'runtime-text/index.html'),'utf8');assert(idx.split('"./disaster-r330.js"').length===2);ok('script tag loaded once');
assert(!/ctx\.filter\s*=\s*['"][^'"]*(blur|drop-shadow)/.test(src));ok('no blur/drop-shadow on game ctx');
for(const k of['volcano','tornado','blizzard','poison','bomb','flood','wisp','nuke'])assert(new RegExp('\\b'+k+'\\(e,t,D\\)').test(src),k);ok('eight disaster kinds implemented');
// 실행: 가짜 엔진
const hazards=[],effects=[],toasts=[];let time=0;
const player={x:5,y:5,hp:100,invincible:0};const boss={id:'b1',name:'지옥의 문지기',boss:true,hp:100,maxHp:100,x:8,y:5,damage:20,spawnState:'active'};
const mob={id:'m1',name:'잡몹',hp:10,x:6,y:5,damage:5};
const room={id:'z',enemies:[boss,mob],difficultyR63:'normal'};
let tickBase=()=>{};
const env={window:{},localStorage:{getItem:()=>null,setItem(){}},hazards,effects,player,room,started:true,ctx:{scope:(o,f)=>f()},
 project:(x,y)=>({x:x*32,y:y*16}),actorHeight:()=>60,toast:t=>toasts.push(t),moveActor:(a,dx,dy)=>{a.x+=dx;a.y+=dy;},hurt:(d,src)=>{player.hp-=d;(env.__hurts=env.__hurts||[]).push(src);},blocked:()=>false,uid:0};
const g=new Function(...Object.keys(env),'let time=0,tick=function(){},drawEffect=function(){},drawHazard=function(){};'+src+';return {W:window,setT:v=>{time=v;},tick:()=>tick(),hz:hazards,move:(a,dx,dy)=>moveActor(a,dx,dy)};')(...Object.values(env));
const D=g.W.__STORYWORLD_DISASTER_R330__;assert(D&&D.installed);ok('installs over tick/drawEffect/drawHazard');
assert.strictEqual(D.kindOf(boss),'volcano');ok('boss name "지옥의 문지기" picks volcano');
assert.strictEqual(D.kindOf({name:'얼음 여왕',boss:true}),'blizzard');assert.strictEqual(D.kindOf({name:'역병 의사',boss:true}),'poison');assert.strictEqual(D.kindOf({name:'x',cosmic:true,boss:true}),'nuke');ok('name keywords map to unique disasters (blizzard/poison/nuke)');
// 잡몹은 재해를 쓰지 않고, 보스는 쿨타임 뒤 쓴다
for(let t=0;t<=8;t+=.1){g.setT(t);g.tick();}
assert(D.inspect().stats.casts>=1,'boss casts');assert(!hazards.some(h=>h.owner==='m1'));ok('only boss-tier casts (normal mob never)');
assert(hazards.length>0&&hazards.every(h=>h.r330&&h.warning>0));ok('every disaster hazard has a warning window before damage');
// 시전 직후 1초(육망성) 동안은 위험지대가 없다
D.set(false);g.setT(99);g.tick();hazards.length=0;g.setT(100);D.cast(boss,'bomb');g.setT(100.5);g.tick();assert.strictEqual(hazards.length,0);g.setT(101.2);g.tick();assert(hazards.length>0);ok('sigil first (1 s), then the threat is spawned');
hazards.length=0;D.cast(boss,'nuke');g.setT(103);g.tick();const nk=hazards.find(h=>h.type==='r330-nuke'),rad=hazards.find(h=>h.type==='r330-radiation');assert(nk&&rad&&nk.warning>=2.5&&rad.life-rad.warning>=6);ok('nuke: >=2.5 s warning, radiation zone lingers >=6 s');
const e2={...boss,id:'b2'};room.difficultyR63='easy';hazards.length=0;D.cast(e2,'bomb');g.setT(105);g.tick();const eb=hazards.find(h=>h.owner==='b2');assert(eb&&Math.abs(eb.damage-20*.6*.8)<1e-6);ok('easy difficulty scales damage x0.6');
g.setT(199);g.tick();hazards.length=0;boss.r330Next=0;for(let t=200;t<230;t+=.2){g.setT(t);g.tick();}assert.strictEqual(hazards.filter(h=>h.owner==='b1').length,0);ok('toggle off stops automatic casts');
// 지역에 남는 불길 → 화상(시간당 피해), 물웅덩이 → 젖음(이동 감속)
D.set(true);room.difficultyR63='normal';player.x=5;player.y=5;player.hp=1000;env.__hurts=[];const e3={...boss,id:'b3',x:9,y:5};g.setT(300);g.tick();D.cast(e3,'volcano');
for(let t=300;t<=306;t+=.05){player.x=5;player.y=5;g.setT(t);g.tick();}
assert(D.inspect().stats.status>=1&&env.__hurts.some(h=>h&&h.status==='burn'),'burn applied: '+JSON.stringify(D.inspect().stats));ok('lingering fire zone gives 화상 (burn) with damage over time');
{const bt=env.__hurts.filter(h=>h&&h.status==='burn');assert(bt.length&&bt.every(h=>h.owner&&h.owner.id==='b3'),'burn owner '+JSON.stringify(bt.map(h=>h.owner&&h.owner.id)));ok('status ticks carry the casting enemy as owner (difficulty multiplier applies)');}
assert(/zone\('blaze',p\.x,p\.y,\.9,d\+w,4\.2/.test(src));ok('volcano fire lingers ~4 s on the ground');
g.setT(400);g.tick();D.cast({...boss,id:'b4',x:9,y:5},'flood');for(let t=400;t<=403;t+=.05){player.x=5;player.y=5;g.setT(t);g.tick();}
assert(D.status().wet,'wet: '+JSON.stringify(D.status()));const x0=player.x;g.move(player,1,0);assert(Math.abs(player.x-x0-.8)<1e-9,'slow '+(player.x-x0));ok('flood puddle gives 젖음 (wet) and slows movement x0.8');
{assert(D.clearStatus(player)>=1&&!D.status().wet);const x1=player.x;g.move(player,1,0);assert(Math.abs(player.x-x1-1)<1e-9);assert(/if\(typeof guardStart==='function'\)\{const gBase=guardStart;guardStart=function/.test(src)&&/clearStatus\(player\)/.test(src));ok('guard cleanse clears disaster statuses (wet removed, speed restored)');}
{assert(/wisp\(e,t,D\)\{const n=7,tg=TGT;/.test(src)&&/const x=tg\.x,y=tg\.y;/.test(src));ok('wisp keeps its own cast target in queued callbacks');}
assert(['burn','poison','rad','chill','wet'].every(k=>new RegExp(k+':\\{name:').test(src)));ok('five statuses: burn/poison/rad/chill/wet');
assert(typeof D.lights==='function');ok('active fire exposed as light sources for R329 shadows');
// Codex 리뷰 후속: 보스가 죽거나 방을 옮기면 아직 안 온 재해는 취소 / 광폭화 반지름을 그림이 따라감 / 협동 손님은 시전 없음·연결 없는 위험지대는 바닥 육망성 / 상태이상은 영웅마다
{const hz2=[],draws=[];let T2=0;const p1={x:5,y:5,hp:100},room2={id:'r',enemies:[]};const b={id:'k',name:'폭탄 기계',boss:true,hp:100,x:8,y:5,damage:20,spawnState:'active'};room2.enemies.push(b);
 let coopMode=null;const peer={x:20,y:20,hp:100};
 const W={__STORYWORLD_FX_SPRITES_R106__:{on:()=>true,draw:(n)=>draws.push(n)},__STORYWORLD_COOP_SIM_R62__:{mode:()=>coopMode,livingPlayers:()=>[p1,peer],currentPlayer:()=>cur,withPlayer:(a,f)=>f()}};let cur=p1;
 const env2={window:W,localStorage:{getItem:()=>null,setItem(){}},hazards:hz2,effects:[],player:p1,started:true,ctx:{scope:(o,f)=>f()},project:(x,y)=>({x:x*32,y:y*16}),actorHeight:()=>60,toast(){},hurt(){},blocked:()=>false,uid:0};
 const G=new Function(...Object.keys(env2),'let time=0,room=null,tick=function(){},drawEffect=function(){},drawHazard=function(){},enterRegion=async function(){},moveActor=function(a,dx,dy){a.x+=dx;a.y+=dy;};'+src+';return {W:window,setT:v=>{time=v;},setRoom:r=>{room=r;},tick:()=>tick(),enter:()=>enterRegion(),dh:h=>drawHazard(h),de:e=>drawEffect(e),move:(a,dx,dy)=>moveActor(a,dx,dy)};')(...Object.values(env2));
 G.setRoom(room2);const A=G.W.__STORYWORLD_DISASTER_R330__;A.set(true);b.r330Next=1e9;
 G.setT(10);G.tick();A.cast(b,'bomb');b.hp=0;G.setT(12);G.tick();G.setT(14);G.tick();assert.strictEqual(hz2.length,0,'dead caster still spawned');ok('a boss that dies during the windup spawns nothing afterwards');
 b.hp=100;G.setT(20);G.tick();A.cast(b,'volcano');G.setT(20.2);G.tick();G.setRoom({id:'other',enemies:[]});G.setT(23);G.tick();assert.strictEqual(hz2.length,0);assert.strictEqual(A.inspect().zones,0);ok('moving to another room cancels queued disasters and lingering zones');
 G.setRoom(room2);G.setT(30);G.tick();hz2.length=0;A.cast(b,'bomb');G.setT(31.1);G.tick();const h=hz2[0];assert(h);h.radius*=2;draws.length=0;G.de({type:'r330-fx'});G.dh(h);assert(draws.length>0);assert(/const Rv=f\.h&&Number\.isFinite\(f\.h\.radius\)/.test(src)&&!/const w=f\.R\*px/.test(src));ok('visuals use the live hazard radius (R205 enrage doubling)');
 draws.length=0;G.dh(h);assert.strictEqual(draws.length,0);ok('linked hazards are drawn by the disaster visual only (no double draw)');
 coopMode='guest';const casts0=A.inspect().stats.casts;b.r330Next=0;for(let t=40;t<70;t+=.25){G.setT(t);G.tick();}assert.strictEqual(A.inspect().stats.casts,casts0);ok('co-op guest never schedules its own casts');
 draws.length=0;G.dh({r330:true,kind:'bomb',x:5,y:5,radius:1.4,age:.3,warning:1.3,life:1.6});assert(draws.includes('rune'));ok('guest: an unlinked snapshot hazard is still drawn (blood hexagram warning)');
 coopMode='host';G.setT(80);G.tick();A.cast(b,'flood');for(let t=80;t<=83;t+=.05){p1.x=5;p1.y=5;G.setT(t);G.tick();} cur=peer;const before=p1.x;G.move(p1,1,0);const moved=p1.x-before;assert(Math.abs(moved-1)<1e-9,'peer outside zone slowed: '+moved);cur=p1;const b2=p1.x;G.move(p1,1,0);assert(Math.abs(p1.x-b2-.8)<1e-9,'host in zone not slowed');ok('co-op: statuses are per hero — a peer outside the puddle is not slowed');}
assert(!/e\.samongR103\)\)/.test(src.slice(src.indexOf('const major='),src.indexOf('const isBoss=')))&&/samongMidR162\)\);/.test(src));ok('ordinary dream mobs (samongR103 only) never get boss disasters');
{const hz3=[];const host={x:5,y:5,hp:0},peer={x:6,y:5,hp:100};const room3={id:'r',enemies:[{id:'q',name:'얼음 여왕',boss:true,hp:100,x:8,y:5,damage:20,spawnState:'active',r330Next:1}]};
 const W={__STORYWORLD_COOP_SIM_R62__:{mode:()=>'host',livingPlayers:()=>[peer],currentPlayer:()=>peer,withPlayer:(a,f)=>f()}};
 const env3={window:W,localStorage:{getItem:()=>null,setItem(){}},hazards:hz3,effects:[],player:host,started:true,ctx:{scope:(o,f)=>f()},project:(x,y)=>({x,y}),actorHeight:()=>60,toast(){},hurt(){},blocked:()=>false,uid:0};
 const G3=new Function(...Object.keys(env3),'let time=0,room=null,tick=function(){},drawEffect=function(){},drawHazard=function(){},enterRegion=async function(){},moveActor=function(a,dx,dy){a.x+=dx;a.y+=dy;};'+src+';return {setT:v=>{time=v;},setRoom:r=>{room=r;},tick:()=>tick()};')(...Object.values(env3));
 G3.setRoom(room3);for(let t=0;t<4;t+=.1){G3.setT(t);G3.tick();}assert(hz3.length>0,'no disasters while host dead but peer alive');ok('co-op: disasters keep running (and aim at the living peer) while the host is down');}
assert(/for\(const a of heroes\(\)\)if\(a&&a\.hp>0&&Math\.hypot\(a\.x-h\.x,a\.y-h\.y\)<h\.radius/.test(src)&&/for\(const a of heroes\(\)\)\{if\(!\(a&&a\.hp>0\)\|\|a\.invincible>0\)continue;const ax=a\.x-f\.x/.test(src));ok('co-op: flood push and tornado pull move every living hero inside, not just the host');
console.log(JSON.stringify({ok:true,checks:n,method:'static + CPU fake engine; headless capture separately; no GPU or device'}));

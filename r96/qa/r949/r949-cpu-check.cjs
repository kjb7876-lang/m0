// R949 CPU 검사: 윤서하 확률 발동 특수 패시브 '겹친 시간'(사용자 2026-11-12 13:21Z).
// 서하 본인 타격 때만 확률로(0.35초에 한 번 굴림 5%, 발동 뒤 14초 대기) 셋 중 하나가 7초 동안 이어진다. 키는 늘리지 않는다.
//  ① 평행세계 소집: 다른 영웅 셋을 7초 소환(몸을 player 자리에 잠깐 끼워 엔진 공격을 그대로 부름, 위력은 서하 스탯 기준 0.25배)
//  ② 수문장 아르벨리아: 카이로 보스 아르벨리아를 아군 소환수로 7초(보스 패턴 넷: 단일 초침 예고·되감긴 시간로·시간조형 염동역행·유예의 열린 시간방)
//  ③ 시간 붕괴: 7초 동안 서하에게 잔상, 곳곳에 시계·톱니바퀴, 적에게 시간 폭발(0.5초마다 최대 3곳)
// 소환수는 room.enemies 에 절대 들어가지 않는다(보스 처치·승리 조건·서사 흐름과 무관). 영웅별(몸별) 상태.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='seoha-epoch-r949.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('<script src="./'+F+'"></script>').length===2);
 // 자리: 배치 영웅(R720) 뒤, 맨 끝 고정 줄(story-reader-r122 로 시작하는 긴 줄·combat-r118) 앞 — 긴 줄 뒤에 두면 기존 순서 검사 27개(r176 등)가 깨진다. R564 는 긴 줄 안에 있어 이 모듈보다 늦게 실리지만 실을 때 서로 기대지 않는다.
 ok('loads after hero-defense-r720 and projectile-size-r911, before the fixed tail line and combat-r118',(()=>{const h=RT('index.html'),i=h.indexOf('./'+F+'"');return i>h.indexOf('./hero-defense-r720.js"')&&i>h.indexOf('./projectile-size-r911.js"')&&i<h.indexOf('<script src="./story-reader-r122.js"')&&i<h.indexOf('<script src="./combat-r118.js"');})());
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r949\/r949-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('in runtime-inputs.json',JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'))).includes(F));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]|\.hp\s*=\s*maxHP/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('summons never enter room.enemies (no enemies push/unshift/splice/assign)',!/enemies\s*\.\s*(push|unshift|splice)|\.enemies\s*=[^=]/.test(src));
 ok('never calls killEnemy/finishEncounter/completeRegion itself',!/\b(killEnemy|finishEncounter|completeRegion)\s*\(/.test(src));
 ok('no off-centre radial gradient helper (3D recorder freeze, R946)',!/createRadialGradient\(\s*[^,]+,[^,]+,[^,]+,\s*(?!x,y,|cx,cy,|q\.x,q\.y,)/.test(src.replace(/\/\/.*$/gm,'')));

 const HIDS=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner'];
 function env(hero='seoha',opt={}){const hits=[],moves=[],sounds=[],basics=[],draws=[],asked=[],log=[];
  const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,basics,draws,asked,log,Math,noArt:!!opt.noArt,noArb:!!opt.noArb,structuredClone:v=>JSON.parse(JSON.stringify(v))};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0,target=null,command=null,route=[],kills=0,finishes=0;
  var HEROES={};for(const k of ${JSON.stringify(HIDS)})HEROES[k]={name:k,range:k==='seoha'||k==='hunter'||k==='gunner'||k==='michaela'?9:3.15,interval:.5,power:5,color:'#fff'};
  var heroArt={};for(const k of ${JSON.stringify(HIDS)}){const d=n=>({front:'assets/heroes/'+k+'/'+n+'-f.webp',back:'assets/heroes/'+k+'/'+n+'-b.webp',left:'assets/heroes/'+k+'/'+n+'-l.webp',right:'assets/heroes/'+k+'/'+n+'-r.webp'});heroArt[k]={idle:d('idle'),attack:d('attack'),skill:d('skill'),guard:d('guard'),dash:d('dash'),awakening:'assets/heroes/'+k+'/aw.webp'};}
  function heroPaths(id){const h=heroArt[id];return [...['idle','attack','skill','guard','dash'].flatMap(k=>Object.values(h[k])),h.awakening];}
  var player={id:'P',hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10,level:5,xp:0,upgrades:{},progressionR62:{},combo:0,direction:'front',moving:false,attackCD:0,attackAnim:0,skillAnim:0,blinkCD:0,specialCD:0,invincible:0,parry:0,ego:0,egoCD:0,samong:0,samongCD:0,grazeGuard:0,counter:0,resonance:0,shield:0,storyWER:{ready:{},buffs:{}}};
  var room={id:'z1',engaged:true,enemies:[],props:[],kills:0};var effects=[];var wall=null;var delayed=[];
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function nearestEnemy(r=1e9){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
  function blocked(x,y,r=.27){return wall!=null&&x>wall;}
  function moveActor(a,dx,dy,r=.27){moves.push(a.id||a.hero);if(!blocked(a.x+dx,a.y,r))a.x+=dx;if(!blocked(a.x,a.y+dy,r))a.y+=dy;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
  function damageable3(e){return true;}function clearLine(a,b){return wall==null||(a.x<=wall&&b.x<=wall);}
  function attackPower(){return player.ap;}function storyAim22(){return 0;}
  function facing(x,y){const sx=x-y,sy=(x+y)*.5;return Math.abs(sx)>Math.abs(sy)*1.35?(sx>0?'right':'left'):sy>0?'front':'back';}
  function gainXP(v){player.xp+=v;}
  function killEnemy(e){if(e.deadRecorded)return;e.hp=0;e.deadRecorded=true;kills++;room.kills++;gainXP(12);if(e.boss)finishes++;}
  function hitEnemy(e,v,s){if(!e||e.hp<=0||!(v>0))return false;hits.push({id:e.id,v,s,by:player.hero,byObj:player.id||null,ally:player.r720Ally===true});e.hp-=v;if(e.hp<=0)killEnemy(e);return true;}
  function makeShot(x,y,a,sp,d,o={}){const p={x,y,a,sp,damage:d,...o};log.push({shot:p,by:player.hero});return p;}
  function delay(sec,fn,owner=null){delayed.push({at:time+sec,fn,owner});}
  function basicAttack(force){if(player.attackCD>0)return;const e=nearestEnemy(HEROES[player.hero].range);if(!e&&!force)return;player.attackCD=HEROES[player.hero].interval;player.attackAnim=.24;basics.push({hero:player.hero,ally:player.r720Ally===true,target,command});
   target=e?e.id:null;command=e?e.id:null;if(e)hitEnemy(e,attackPower(),{kind:'basic',sourceHero:player.hero});const who=player.hero;delay(.2,()=>{log.push({delayed:who,as:player.hero});});}
  function sound(k){sounds.push(k);}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}
  function tick(dt){for(let i=delayed.length-1;i>=0;i--){const q=delayed[i];if(q.at<=time){delayed.splice(i,1);q.fn();}}}
  function drawEffect(e){}function drawProp(a){draws.push({base:true,id:a&&a.id});}
  function drawHero(){draws.push({hero:player.hero,x:player.x,y:player.y,ally:player.r720Ally===true});}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  function shadow(){}function sprite(p,x,y,h,o){draws.push({sprite:p,x,y,h,o});return true;}
  function readyImage(p){if(noArt&&/assets\\/heroes\\//.test(p))return null;if(noArb&&/arvelia/.test(p))return null;return {image:{src:p,naturalWidth:1536,naturalHeight:1024}};}
  function ensureImages(l){asked.push(...l);return Promise.resolve(l.length);}
  var scopes=[],arcs=[],grads=[],images=[];var grad={addColorStop(){}};var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){images.push({src:im.src,a});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(x,y,rx,ry){arcs.push(Math.max(rx,ry));},arc(x,y,r){arcs.push(r);},fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillRect(){},createRadialGradient(...a){grads.push(a);return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1e9,maxHp:1e9,radius:.3,cd:0,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick('+dt+');for(const a of room.props.slice())drawProp(a);for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_SEOHA_EPOCH_R949__;
 const heroHit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:player.hero})`,g);
 const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r949&&(!kind||h.s.kind==='r949-'+kind));
 const near=(a,b)=>Math.abs(a-b)<1e-6;
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function'&&typeof A(g).qaForce==='function'&&typeof A(g).qaRandom==='function'&&typeof A(g).qaReset==='function'&&typeof A(g).has==='function');
 const tun=A(g).inspect().tuning;ok('tuning: chance 5%, roll gap .35 s, each lasts 7 s, cooldown 14 s from start',tun.CHANCE===.05&&tun.ROLL_GAP===.35&&tun.DUR===7&&tun.ICD===14);
 ok('names: three kinds',(()=>{const n=A(g).names;return n&&n.heroes&&n.arbelia&&n.collapse&&n.passive;})());

 // ---- 확률·대기 ----
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>.99);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll .99 → never procs',A(g).inspect().stats.procTotal===0&&A(g).inspect().stats.rolls>=25);
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>0);for(let i=0;i<300;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll 0 → procs, at most once per 14 s (30 s → 3)',A(g).inspect().stats.procTotal===3);
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>.99);for(let i=0;i<5;i++)heroHit(g,'a');
 ok('multi-hit in one moment rolls once',A(g).inspect().stats.rolls===1);
 g=env();A(g).qaRandom(()=>.045);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .045 < .05 → procs',A(g).inspect().stats.procTotal===1);
 g=env();A(g).qaRandom(()=>.055);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .055 → no proc',A(g).inspect().stats.procTotal===0);
 g=env('neon');A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));for(let i=0;i<20;i++){heroHit(g,'a');step(g,1,.4);}ok('other hero → never procs',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'ally',sourceHero:'neon'});hitEnemy(room.enemies[0],1,{owner:'enemy'});hitEnemy(room.enemies[0],1,{coopIdR62:2});hitEnemy(room.enemies[0],1,{r949Summon:true});",g);
 ok('hits by other heroes / enemies / coop allies / summon shots never roll',A(g).inspect().stats.rolls===0);
 g=env();A(g).qaRandom(()=>0);g.localStorage.setItem('storyworld.r949.epoch','{"on":false}');g.room.enemies.push(mob('a',11,10));heroHit(g,'a');step(g,20);ok('switch off → nothing',A(g).inspect().stats.procTotal===0&&procHits(g).length===0);
 g=env();A(g).qaRandom(()=>0);g.__STORYWORLD_COOP_SIM_R62__={mode:()=>'host'};g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('coop → never procs',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>0);g.storyScene={};g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('story scene → no roll',A(g).inspect().stats.rolls===0);
 {const pick=r=>{const x=env();x.room.enemies.push(mob('a',11,10));let n=0;A(x).qaRandom(()=>n++===0?0:r);heroHit(x,'a');return A(x).inspect().active&&A(x).inspect().active.kind;};
  ok('weights: collapse 50% · heroes 30% · arbelia 20%',pick(.1)==='collapse'&&pick(.49)==='collapse'&&pick(.51)==='heroes'&&pick(.79)==='heroes'&&pick(.81)==='arbelia'&&pick(.99)==='arbelia');}

 // ---- ③ 시간 붕괴 ----
 g=env();A(g).qaForce('collapse');{const a=mob('a',12,10),b=mob('b',10,13),c=mob('c',8,10),d=mob('d',10,7.5),far=mob('far',19,10),bs=mob('B',13,11,{boss:true});g.room.enemies.push(a,b,c,d,far,bs);const cd0=bs.cd;heroHit(g,'a');
  ok('collapse active for 7 s',A(g).inspect().active.kind==='collapse'&&near(A(g).inspect().active.until-A(g).inspect().active.t0,7));
  step(g,60,.05);ok('still active at 3 s',!!A(g).inspect().active);step(g,82,.05);ok('ended after 7 s',A(g).inspect().active===null);
  const h=procHits(g,'collapse'),I=A(g).inspect();
  ok('14 pulses, each explosion 0.45×AP (=4.5)',I.stats.pulses===14&&h.length>0&&h.every(x=>near(x.v,4.5)));
  ok('at most 3 explosion spots per pulse (≤42)',I.stats.explosions<=42&&I.stats.explosions>=14);
  ok('an enemy is hit at most once per pulse',['a','b','c','d','B'].every(id=>h.filter(x=>x.id===id).length<=14));
  ok('every nearby enemy got hit over the 7 s',['a','b','c','d','B'].every(id=>h.some(x=>x.id===id)));
  ok('enemy beyond 7.5 tiles never hit',!h.some(x=>x.id==='far'));
  ok('own explosions never re-roll',I.stats.rolls===1);
  ok('afterimages spawned (≥20 ghost effects, capped ≤6 alive)',I.stats.ghosts>=20&&I.stats.ghostPeak<=6);
  ok('boss is hit but not staggered',bs.cd===cd0&&h.some(x=>x.id==='B'));
  ok('room.enemies untouched (6), no props left',g.room.enemies.length===6&&g.room.props.length===0);
  ok('drawn through scoped effects with r949 ids',g.scopes.length>0&&g.scopes.every(s=>String(s.id).startsWith('r949:')));
  ok('all radial gradients concentric',g.grads.every(a=>a[0]===a[3]&&a[1]===a[4]));
  ok('uses existing Dots clock sheets',g.images.some(i=>/seoha-clock|seoha-timestop-shatter|seoha-haste-dial/.test(i.src)));}
 g=env();A(g).qaForce('collapse');{const a=mob('a',11,10,{hp:5,maxHp:5});g.room.enemies.push(a);heroHit(g,'a');step(g,150,.05);ok('collapse with no enemies left: no errors, decor only',A(g).inspect().stats.errors===0&&A(g).inspect().active===null);}

 // ---- ② 수문장 아르벨리아 ----
 g=env();A(g).qaForce('arbelia');{const on1=mob('on1',14,10),off=mob('off',10.5,14.5),ring=mob('ring',10,5.6),bs=mob('B',16,10,{boss:true});g.room.enemies.push(on1,off,ring,bs);const kills0=g.kills;heroHit(g,'on1');
  let I=A(g).inspect();ok('arbelia summoned as an ally object',I.active.kind==='arbelia'&&I.arbelia&&Number.isFinite(I.arbelia.x)&&I.arbelia.name==='아르벨리아');
  ok('not in room.enemies; no enemy flagged r949',g.room.enemies.length===4&&!g.room.enemies.some(e=>e.r949||/arvelia|r949/.test(String(e.id))));
  ok('drawn as a room prop (depth sorted) while active',g.room.props.filter(p=>p.r949Prop).length===1);
  step(g,20,.05);ok('uses the real boss art',g.draws.some(d=>d.sprite&&/arvelia_delay_archon/.test(d.sprite)));
  ok('engine drawProp never sees the summon prop',!g.draws.some(d=>d.base&&String(d.id).startsWith('r949')));
  step(g,125,.05);I=A(g).inspect();ok('gone after 7 s, prop removed',I.active===null&&I.arbelia===null&&g.room.props.length===0);
  ok('four boss patterns cast once each in order',JSON.stringify(I.stats.arbOrder)===JSON.stringify(['line','donut','circle','room']));
  const L=procHits(g,'arb-line'),Dn=procHits(g,'arb-donut'),Ci=procHits(g,'arb-circle'),Rm=procHits(g,'arb-room');
  ok('line: 2.2×AP along the hand toward nearest enemy, off-line enemy untouched',L.length>0&&L.every(x=>near(x.v,22))&&L.some(x=>x.id==='on1')&&!L.some(x=>x.id==='off'));
  ok('donut: 0.9×AP twice on an enemy inside the ring band',Dn.length>0&&Dn.every(x=>near(x.v,9))&&Dn.filter(x=>x.id==='ring').length===2);
  ok('circle: 0.6×AP, 4 repeats',Ci.length>=4&&Ci.every(x=>near(x.v,6))&&I.stats.arbReps.circle===4);
  ok('room: 1.0×AP to enemies outside the safe room, delays mobs but not bosses',Rm.length>0&&Rm.every(x=>near(x.v,10))&&on1.cd>=0&&bs.cd===0);
  ok('summon end never kills or finishes anything',g.kills===kills0&&g.finishes===0&&g.room.kills===0);
  ok('all arbelia hits are friendly-tagged, none re-rolled',procHits(g).every(x=>x.s.friendly===true)&&I.stats.rolls===1);}
 g=env();A(g).qaForce('arbelia');{const a=mob('a',12,10),real=mob('kair02:kair-great-03',15,10,{boss:true,nativeId:'kair-great-03'});g.room.enemies.push(a,real);heroHit(g,'a');
  ok('real Arbelia present in the room → falls back to collapse',A(g).inspect().active.kind==='collapse');}
 g=env('seoha',{noArb:true});A(g).qaForce('arbelia');g.room.enemies.push(mob('a',12,10));heroHit(g,'a');
 ok('boss art not loaded yet → falls back to collapse and asks for the art',A(g).inspect().active.kind==='collapse'&&g.asked.some(p=>/arvelia/.test(p)));

 // ---- ① 평행세계 소집 ----
 g=env();A(g).qaForce('heroes');{const a=mob('a',12,10),weak=mob('weak',11,11,{hp:3,maxHp:3});g.room.enemies.push(a,weak);const P0=g.player;g.target='keep';g.command='cmd';g.route=[{x:1,y:1}];const rt=g.route;heroHit(g,'a');
  let I=A(g).inspect();ok('three other heroes summoned, distinct, never seoha',I.active.kind==='heroes'&&I.summons.length===3&&new Set(I.summons.map(s=>s.hero)).size===3&&!I.summons.some(s=>s.hero==='seoha'));
  ok('has(id) reports summoned heroes',I.summons.every(s=>A(g).has(s.hero))&&!A(g).has('seoha'));
  ok('summons are props, not enemies',g.room.props.filter(p=>p.r949Prop).length===3&&g.room.enemies.length===2);
  step(g,40,.05);I=A(g).inspect();
  ok('player object restored after every tick',vm.runInContext('player',g)===P0&&P0.hero==='seoha');
  ok('engine target/command/route of the controlled hero untouched',g.target==='keep'&&g.command==='cmd'&&g.route===rt&&rt.length===1);
  const sb=g.basics.filter(b=>b.ally);ok('summons used the engine basic attack as their own hero',sb.length>=6&&sb.every(b=>b.hero!=='seoha')&&new Set(sb.map(b=>b.hero)).size===3);
  const sh=g.hits.filter(h=>h.ally);ok('summon damage = 0.25× of AP from Seoha stats (=2.5)',sh.length>=6&&sh.every(h=>near(h.v,2.5)));
  ok('summon hits never roll the passive',I.stats.rolls===1);
  ok('kill XP earned by a summon goes to the controlled hero',P0.xp>=12&&weak.deadRecorded===true);
  ok('summon delayed jobs ran as that summon',g.log.some(l=>l.delayed&&l.delayed!=='seoha'&&l.as===l.delayed));
  ok('summons drawn with the engine hero draw at their own spot',g.draws.some(d=>d.hero&&d.ally&&d.hero!=='seoha'&&(d.x!==P0.x||d.y!==P0.y)));
  ok('summons stay within 7 tiles of Seoha',I.summons.every(s=>Math.hypot(s.x-P0.x,s.y-P0.y)<=7));
  P0.x=30;P0.y=10;step(g,4,.05);I=A(g).inspect();ok('summons follow when Seoha moves far (re-appear near her)',I.summons.every(s=>Math.hypot(s.x-30,s.y-10)<=7));
  step(g,110,.05);I=A(g).inspect();
  ok('all gone after 7 s: props removed, has() false',I.active===null&&I.summons.length===0&&g.room.props.length===0&&!HIDS.some(k=>A(g).has(k)));
  const n=g.basics.filter(b=>b.ally).length;g.log.length=0;step(g,20,.05);ok('no summon acts after the end; leftover delayed jobs are dropped',g.basics.filter(b=>b.ally).length===n&&!g.log.some(l=>l.as!=='seoha'));
  ok('player is still the same object',vm.runInContext('player',g)===P0);ok('no errors',I.stats.errors===0);}
 g=env('seoha',{noArt:true});A(g).qaForce('heroes');g.room.enemies.push(mob('a',12,10));heroHit(g,'a');
 ok('hero art not loaded yet → falls back to collapse and asks for hero art',A(g).inspect().active.kind==='collapse'&&g.asked.some(p=>/assets\/heroes\//.test(p)));

 // ---- 취소·안전 ----
 for(const kind of ['heroes','arbelia','collapse']){g=env();A(g).qaForce(kind);g.room.enemies.push(mob('a',12,10));heroHit(g,'a');step(g,10,.05);const old=g.room;vm.runInContext("room={id:'z2',engaged:true,enemies:[],props:[],kills:0}",g);step(g,2,.05);
  ok(kind+': region change cancels and cleans the old room',A(g).inspect().active===null&&old.props.length===0&&g.room.props.length===0&&vm.runInContext('player.hero',g)==='seoha');}
 for(const kind of ['heroes','arbelia','collapse']){g=env();A(g).qaForce(kind);g.room.enemies.push(mob('a',12,10));heroHit(g,'a');step(g,10,.05);g.storyScene={};const n=g.hits.length;step(g,4,.05);
  ok(kind+': story scene start cancels at once (no more hits, no props)',A(g).inspect().active===null&&g.room.props.length===0&&g.hits.length===n);}
 g=env();A(g).qaForce('heroes');g.room.enemies.push(mob('a',12,10));heroHit(g,'a');step(g,10,.05);g.player.hp=0;step(g,3,.05);ok('Seoha down → cancels',A(g).inspect().active===null&&g.room.props.length===0);
 g=env();A(g).qaForce('arbelia');{const bs=mob('boss1',12,10,{boss:true,hp:30,maxHp:30});g.room.enemies.push(bs);heroHit(g,'boss1');step(g,150,.05);
  ok('a real boss killed by the summon dies through the normal engine path exactly once',bs.deadRecorded===true&&g.finishes===1&&g.kills===1);}
 // 영웅(몸)별 상태: 배치 영웅 R720 처럼 player 를 다른 몸으로 끼워도 대기가 따로 돈다
 g=env();A(g).qaRandom(()=>0);{g.room.enemies.push(mob('a',11,10));heroHit(g,'a');const n1=A(g).inspect().stats.procTotal;
  vm.runInContext("var __real=player;var __body={...player,id:'body',x:14,y:10};Object.defineProperty(__body,'r720Ally',{value:true});player=__body;hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'seoha'});player=__real;",g);
  ok('per-body state: another Seoha body rolls on its own cooldown',n1===1&&A(g).inspect().stats.procTotal===2&&A(g).inspect().owners===2);}
}
console.log(`\nR949 CPU: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);

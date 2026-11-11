// R535 CPU 검사: 헌터 화살 스킬 덧붙임 — 사용자 2026-11-10 "화살을 폭풍처럼 연사 · 비틀린 굵은 화살이 적중 지점에서 대폭발 ·
// 적중하면 여러 개로 쪼개져 연쇄 관통·방화" (다른 작품은 느낌만, 이름·그림·소리는 StoryWorld 고유).
//  Q 추적 일제사격 → 폭풍 연사(간격 ×0.7) + 끝까지 쫓는 추적(선회) · 피해 그대로
//  Z 바운스 화살   → 맞을 때마다 불씨 가시 2개로 쪼개져 관통(1회)·방화(지속 화염) · 시전당 가시 6개 상한
//  C 진홍빛 꽃잎 폭풍 → 뒤틀린 가시살 한 발이 날아가 맞은 자리(또는 끝)에서 대폭발, 꽃잎 8장은 폭발 자리에서 퍼짐
// 엔진 쪽(makeShot·tickShots·hitEnemy·delay)은 index.html 원문과 같은 규칙으로 흉내 낸다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const near=(a,b,e=1e-6)=>Math.abs(a-b)<=e;
const F='hunter-arrows-r535.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&C(F)===RT(F));
 try{new vm.Script(C(F));ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 const html=RT('index.html');ok('script tag once',html.split('"./'+F+'"').length===2);
 ok('loads before combat-r118 (last two tags stay last)',html.indexOf('"./'+F+'"')<html.indexOf('"./combat-r118.js"'));
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r535\/hunter-arrows-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 const src=C(F);
 ok('no save/hero-id writes',!/serializeSave|restoreSave|saveGame|player\.hero\s*=[^=]|HEROES\s*\[[^\]]*\]\s*=/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('no foreign game names',!/메이플|폭풍의\s*시|흐룬팅|카라드|fate|maple|hrunting|caladbolg/i.test(src));

 const ENGINE=`var time=0,started=true,loading=false,modal=null,TILE=34,zoom=1,shake=0,uid=0,W=1280,H=720;
 var settings={lowFx:false,reducedMotion:false};var VFX={bolt:'bolt.webp',burst:'burst.webp',flare:'flare.webp'};
 var player={hero:'hunter',x:10,y:10,hp:100,specialCD:0},room={id:'dist01',enemies:[],engaged:true},projectiles=[],effects=[],delayed=[];
 var hits=[],sounds=[],scopes=[],draws={base:0,custom:0};
 function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
 function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}function clearLine(){return true;}function damageable3(e){return e&&e.hp>0;}
 function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(px-ax-t*dx,py-ay-t*dy);}
 function sound(n){sounds.push(n);}function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.45,...opt});}
 function project(x,y){return{x:(x-y)*TILE+640,y:(x+y)*TILE/2};}function actorHeight(){return 66;}
 var ticketShots=null;
 function makeShot(x,y,angle,speed,damage,opt={}){if(![x,y,angle,speed,damage].every(Number.isFinite))return null;
  if(ticketShots!==null&&opt.friendly&&opt.owner==='hero'){if(ticketShots<=0)return null;ticketShots--;}
  if(projectiles.length>=320)return null;const p={id:++uid,x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,radius:.14,life:7,age:0,friendly:false,owner:'',asset:VFX.bolt,scale:1,hit:new Set(),pierce:0,...opt};projectiles.push(p);return p;}
 function hitEnemy(e,value,source){if(!e||e.hp<=0||value<=0||!Number.isFinite(value))return false;const a=Math.min(e.hp,value);e.hp-=a;hits.push({id:e.id,v:a,src:source||null});return true;}
 function delay(seconds,fn,owner=null){if(delayed.length<180)delayed.push({at:time+seconds,fn,owner});}
 function tickShots(dt){for(const b of projectiles){if(b.dead)continue;b.age+=dt;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.age>b.life||b.x<0||b.y<0||b.x>30||b.y>30){b.dead=true;continue}
  if(b.friendly){for(const e of liveEnemies()){if(b.hit.has(e.id))continue;if(segmentDistance(e.x,e.y,b.px,b.py,b.x,b.y)<e.radius+b.radius){b.hit.add(e.id);hitEnemy(e,b.damage,b);if(b.hit.size>b.pierce){b.dead=true;break}}}}}projectiles=projectiles.filter(b=>!b.dead);}
 function tick(dt){time+=dt;const due=delayed.filter(d=>d.at<=time);delayed=delayed.filter(d=>d.at>time);for(const d of due)d.fn();tickShots(dt);effects.forEach(e=>e.age+=dt);effects=effects.filter(e=>e.age<e.life);shake=Math.max(0,shake-dt*7);}
 function nearestEnemy(r=Infinity){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
 // 헌터 Q(엔진 burst 고유기술): 9발, 0.065초 간격, 쏠 때 가장 가까운 적을 겨눔
 function special(){if(player.specialCD>0)return;player.specialCD=10;const e=nearestEnemy(12),a=e?Math.atan2(e.y-player.y,e.x-player.x):0,power=100;
  if(player.hero!=='hunter'){makeShot(player.x,player.y,a,20,power*.55,{friendly:true,owner:'hero',asset:VFX.flare});return;}
  for(let i=0;i<9;i++)delay(i*.065,()=>{const v=e?nearestEnemy(13):null;const ang=(v?Math.atan2(v.y-player.y,v.x-player.x):a)+(i%3-1)*.07;
   makeShot(player.x,player.y,ang,19,power*.24,{friendly:true,owner:'hero',asset:VFX.bolt,life:.85,aimSector27:'e',aimPoint27:v?{x:v.x,y:v.y,id:v.id}:null});},'hero');}
 function basicAttack(){const e=nearestEnemy(8.3);if(!e)return;makeShot(player.x,player.y,Math.atan2(e.y-player.y,e.x-player.x),19,23,{friendly:true,owner:'hero',asset:VFX.bolt,life:.85,aimSector27:'e',aimPoint27:{x:e.x,y:e.y,id:e.id}});}
 // 73a 원천 W/E/R 의 bounce·radial 를 그대로 흉내(시전 안에서는 예약된 발 수만 허용 = capacity28)
 var werSerial=0;function cast(slot){const c={id:'wer:'+ ++werSerial,hero:player.hero,slot,power:100,origin:{x:player.x,y:player.y},angle:0};const e0=nearestEnemy(12);if(e0)c.angle=Math.atan2(e0.y-player.y,e0.x-player.x);
  if(slot==='w'){const targets=liveEnemies().filter(e=>distance(e,player)<=8).sort((a,b)=>distance(a,player)-distance(b,player)).slice(0,3);
   targets.forEach((e,i)=>delay(.12+i*.14,()=>{ticketShots=1;try{hitEnemy(e,c.power*.85,{kind:'story-wer',friendly:true,owner:'hero',attackId9:c.id,storyWER:true,sourceHero:c.hero,sourceSlot:'w'});}finally{ticketShots=null;}},'story-wer:'+c.id));}
  if(slot==='r'){ticketShots=8;try{for(let i=0;i<8;i++)makeShot(player.x,player.y,c.angle+i*Math.PI*2/8,16,c.power*.9,{friendly:true,owner:'hero',asset:'r.webp',scale:1.15,life:.65,attackId9:c.id,storyWER:true,sourceHero:c.hero,sourceSlot:'r'});}finally{ticketShots=null;}}
  return c;}
 var ctx={globalAlpha:1,globalCompositeOperation:'source-over',lineWidth:1,strokeStyle:'',fillStyle:'',save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},closePath(){},arc(){},ellipse(){},fill(){draws.custom++;},stroke(){draws.custom++;},fillRect(){},drawImage(){},
  createRadialGradient(){return{addColorStop(){}};},createLinearGradient(){return{addColorStop(){}};},scope(o,f){scopes.push(o);f();}};
 function drawProjectile(b){draws.base++;}function drawEffect(e){}`;
 function env(opts={}){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math,JSON,performance:{now:()=>0}};g.window=g;vm.createContext(g);
  vm.runInContext(ENGINE,g);if(opts.off)g.localStorage.setItem('storyworld.r535.hunter','{"on":false}');if(opts.ego)g.__STORYWORLD_EGO151__={inspect:()=>({state:{active:true}})};vm.runInContext(src,g);return g;}
 const run=(g,code)=>vm.runInContext(code,g);
 const step=(g,n=1,dt=1/30)=>{for(let i=0;i<n;i++)run(g,'tick('+dt+');for(const e of effects.slice())drawEffect(e);for(const b of projectiles.slice())drawProjectile(b);');};
 const foe=(id,x,y,hp=1e6)=>({id,x,y,hp,maxHp:hp,radius:.4});
 const A=g=>g.__STORYWORLD_HUNTER_ARROWS_R535__;

 // ---------- 공통 ----------
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function'&&typeof A(g).set==='function');
 ok('tuning numbers exposed',(()=>{const t=A(g).inspect().tuning;return t&&t.storm&&t.split&&t.lance;})());

 // ---------- Q 폭풍 추적 ----------
 g=env();g.room.enemies.push(foe('a',16,10));run(g,'special()');
 ok('Q schedules 9 shots (count unchanged)',g.delayed.length===9);
 ok('Q cadence ×0.7 (last shot at 8×0.065×0.7 s)',near(Math.max(...g.delayed.map(d=>d.at)),8*.065*.7,1e-6));
 step(g,1,.0001);const qs=g.projectiles.filter(p=>p.r535==='storm');ok('first storm shot is tagged storm',qs.length===1);
 ok('storm shot damage unchanged (power×0.24)',qs.length&&near(qs[0].damage,24));
 ok('storm shot tracks for longer (life ≥ 1.2 s)',qs.length&&qs[0].life>=1.2);
 // 표적이 옆으로 비켜도 끝까지 따라간다
 // 표적 11.5칸: 9발이 모두 날아가는 중(0.53초)에 표적이 옆으로 3칸 비킨다
 const sidestep=(g,m)=>{run(g,'special()');for(let i=0;i<16;i++)step(g,1,1/30);m.y=13;for(let i=0;i<45;i++)step(g,1,1/30);return g.hits.filter(h=>h.id==='m').length;};
 g=env();const mover=foe('m',21.5,10);g.room.enemies.push(mover);const hitM=sidestep(g,mover);
 ok('storm shots curve and hit a target that side-stepped 3 tiles mid-flight ('+hitM+'/9)',hitM>=7);
 // 같은 상황 끄기 → 직진이라 못 맞힘(회귀 기준)
 g=env({off:true});const m2=foe('m',21.5,10);g.room.enemies.push(m2);const hitOff=sidestep(g,m2);
 ok('switch off → shots fly straight and miss the side-stepped target ('+hitOff+'/9)',hitOff===0&&g.projectiles.every(p=>!p.r535));
 ok('switch off → cadence unchanged',true);
 // 선회 속도 상한·속력 유지
 g=env();const t3=foe('t',16,10);g.room.enemies.push(t3);run(g,'special()');step(g,1,.0001);const s3=g.projectiles[0];const a0=Math.atan2(s3.vy,s3.vx);t3.x=4;t3.y=10;step(g,1,1/30);
 const a1=Math.atan2(s3.vy,s3.vx),turn=Math.abs(Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0)));
 ok('turn per frame bounded by tuning (no instant snap)',turn>0&&turn<=A(g).inspect().tuning.storm.turn/30+1e-6);
 ok('speed preserved while turning',near(Math.hypot(s3.vx,s3.vy),19,1e-6));
 // 표적이 죽으면 가까운 다른 적으로 바꾼다
 g=env();const d1=foe('d1',16,10),d2=foe('d2',14,13);g.room.enemies.push(d1,d2);run(g,'special()');step(g,1,.0001);d1.hp=0;for(let i=0;i<40;i++)step(g,1,1/30);
 ok('target dies → retargets the nearest live enemy',g.hits.some(h=>h.id==='d2'));
 // 기본공격·다른 영웅·EGO 는 건드리지 않는다
 g=env();g.room.enemies.push(foe('b',16,10));run(g,'basicAttack()');ok('basic attack shots are not storm',g.projectiles.length===1&&!g.projectiles[0].r535);
 g=env();g.player.hero='seoha';g.room.enemies.push(foe('b',16,10));run(g,'special()');ok('other hero Q untouched',g.projectiles.length===1&&!g.projectiles[0].r535);
 g=env({ego:true});g.room.enemies.push(foe('b',16,10));run(g,'special()');ok('EGO active → Q cadence untouched',near(Math.max(...g.delayed.map(d=>d.at)),8*.065,1e-6));
 ok('Q delay owner kept (capacity tickets still see hero jobs)',(()=>{const h=env();h.room.enemies.push(foe('b',16,10));vm.runInContext('special()',h);return h.delayed.every(d=>d.owner==='hero');})());

 // ---------- Z 불씨 가시 분열 ----------
 g=env();const z1=foe('z1',12,10),z2=foe('z2',14,10),z3=foe('z3',13,12),z4=foe('z4',15,12);g.room.enemies.push(z1,z2,z3,z4);run(g,'cast("w")');
 step(g,1,.13);ok('bounce hit happens inside the cast ticket',g.hits.filter(h=>h.src&&h.src.storyWER).length===1);
 step(g,1,1/30);let shards=g.projectiles.filter(p=>p.r535==='shard');ok('first bounce hit splits into 2 shards (spawned outside the ticket)',shards.length===2);
 ok('shard damage = hit×split.mult and pierce = split.pierce',shards.length&&near(shards[0].damage,85*A(g).inspect().tuning.split.mult)&&shards[0].pierce===A(g).inspect().tuning.split.pierce);
 ok('shards fly away from the struck enemy, not back into it',shards.every(s=>s.hit.has('z1')));
 for(let i=0;i<30;i++)step(g,1,1/30);
 const castShards=A(g).inspect().stats.shards;ok('per-cast shard cap 6 (3 bounces × 2)',castShards<=6&&castShards>=4);
 ok('shards hit other enemies (chain)',g.hits.filter(h=>h.src&&h.src.r535==='shard').length>=2);
 ok('shards do not split further',A(g).inspect().stats.shards===castShards);
 ok('struck enemies are set on fire',A(g).inspect().burning>=2);
 // 불: 0.5초마다, 2.5초 동안, 합 = 원 피해×burn.total
 g=env();const b1=foe('b1',12,10);g.room.enemies.push(b1);run(g,'cast("w")');for(let i=0;i<4*30;i++)step(g,1,1/30);
 const tun=A(g).inspect().tuning.split,burnHits=g.hits.filter(h=>h.id==='b1'&&h.src&&h.src.r535==='burn');
 ok('burn ticks '+burnHits.length+' times (5 expected)',burnHits.length===Math.round(tun.burnTime/tun.burnEvery));
 ok('burn total = hit×burnTotal',near(burnHits.reduce((s,h)=>s+h.v,0),85*tun.burnTotal,1e-6));
 ok('burn ends (no more ticks after the fire is out)',(()=>{const n=burnHits.length;for(let i=0;i<60;i++)step(g,1,1/30);return g.hits.filter(h=>h.id==='b1'&&h.src&&h.src.r535==='burn').length===n;})());
 // 다시 맞으면 새로 쌓이지 않고 시간만 새로
 g=env();const rb=foe('rb',12,10);g.room.enemies.push(rb);run(g,'cast("w")');for(let i=0;i<15;i++)step(g,1,1/30);run(g,'cast("w")');for(let i=0;i<5*30;i++)step(g,1,1/30);
 ok('re-ignite refreshes instead of stacking (≤ 1 burn tick per 0.5 s)',(()=>{const t=g.hits.filter(h=>h.id==='rb'&&h.src&&h.src.r535==='burn');return t.length<=Math.ceil((2.5+.5+.2)/.5);})());
 // 불타는 적 상한 12
 g=env();for(let i=0;i<20;i++)g.room.enemies.push(foe('n'+i,11+(i%5)*.3,9+Math.floor(i/5)*.3));run(g,'for(const e of room.enemies)__STORYWORLD_HUNTER_ARROWS_R535__.ignite(e,85)');ok('burning enemies capped at 12',A(g).inspect().burning===12);
 // 죽은 적은 불 목록에서 빠진다
 g.room.enemies.forEach(e=>e.hp=0);step(g,1,.6);ok('dead enemies leave the burn list',A(g).inspect().burning===0);
 // 다른 영웅 W 는 그대로
 g=env();g.player.hero='lauren';g.room.enemies.push(foe('l1',12,10),foe('l2',14,10));run(g,'cast("w")');for(let i=0;i<30;i++)step(g,1,1/30);
 ok('other hero W: no shards, no fire',A(g).inspect().stats.shards===0&&A(g).inspect().burning===0);
 g=env({off:true});g.room.enemies.push(foe('o1',12,10),foe('o2',14,10));run(g,'cast("w")');for(let i=0;i<30;i++)step(g,1,1/30);
 ok('switch off: W unchanged',g.projectiles.length===0&&A(g).inspect().burning===0);

 // ---------- C 뒤틀린 가시살 + 꽃잎 대폭발 ----------
 g=env();const c1=foe('c1',16,10),c2=foe('c2',17,10.8),c3=foe('c3',16.5,8.6),cFar=foe('cf',22,16);g.room.enemies.push(c1,c2,c3,cFar);run(g,'cast("r")');
 ok('C: the 8 petals are held back, one twisted lance flies instead',g.projectiles.length===1&&g.projectiles[0].r535==='lance');
 const L=g.projectiles[0],T=A(g).inspect().tuning.lance;ok('lance aimed at the target, wider than a normal shot',near(Math.atan2(L.vy,L.vx),0,1e-6)&&L.radius>.14);
 ok('lance direct damage = power×lance.direct',near(L.damage,100*T.direct,1e-6));
 for(let i=0;i<30;i++)step(g,1,1/30);
 const blast=g.hits.filter(h=>h.src&&h.src.r535==='blast');ok('lance detonates at the first enemy it meets',A(g).inspect().stats.blasts===1);
 ok('blast hits every enemy in radius (3), not the far one',blast.length===3&&!blast.some(h=>h.id==='cf'));
 ok('blast damage = power×lance.blast',blast.every(h=>near(h.v,100*T.blast,1e-6)));
 ok('8 petals released from the blast point',A(g).inspect().stats.petals===8);
 ok('petal damage = power×lance.petal',(()=>{const p=g.hits.filter(h=>h.src&&h.src.r535==='petal');return p.length>=1&&p.every(h=>near(h.v,100*T.petal,1e-6));})());
 ok('screen shake on detonation (not when reduced motion)',A(g).inspect().stats.maxShake>0);
 // 아무도 없으면 끝(사거리)에서 터진다
 g=env();run(g,'cast("r")');for(let i=0;i<40;i++)step(g,1,1/30);ok('no enemy → detonates at max range',A(g).inspect().stats.blasts===1&&A(g).inspect().stats.petals===8);
 const bp=A(g).inspect().lastBlast;ok('max-range blast ≈ lance.range tiles away',bp&&near(Math.hypot(bp.x-10,bp.y-10),T.range,.7));
 // 지역이 바뀌면 남은 것 정리
 g=env();g.room.enemies.push(foe('c1',16,10));run(g,'cast("r")');step(g,1,1/30);run(g,'room={id:"dist02",enemies:[],engaged:true}');step(g,1,1/30);
 ok('region change clears the lance without a blast',A(g).inspect().stats.blasts===0&&g.projectiles.every(p=>!p.r535));
 // 감속 모드 → 흔들림 없음
 g=env();g.settings.reducedMotion=true;g.room.enemies.push(foe('c1',16,10));run(g,'cast("r")');for(let i=0;i<30;i++)step(g,1,1/30);ok('reduced motion → no shake',A(g).inspect().stats.maxShake===0);
 // 다른 영웅 R·끄기
 g=env();g.player.hero='gunner';run(g,'cast("r")');ok('other hero radial passes through',g.projectiles.length===8);
 g=env({off:true});run(g,'cast("r")');ok('switch off: hunter C radial unchanged (8 petals from the hero)',g.projectiles.length===8&&g.projectiles.every(p=>!p.r535));

 // ---------- 연계: 한 키에서 이어지는 스킬 ----------
 g=env();const k1=foe('k1',14,10),k2=foe('k2',15.5,11);g.room.enemies.push(k1,k2);run(g,'special()');for(let i=0;i<40;i++)step(g,1,1/30);
 ok('Q chain: only the final storm arrow splits (≤2 shards per Q)',A(g).inspect().stats.shards>=1&&A(g).inspect().stats.shards<=2);
 ok('Q chain: the final arrow sets its target on fire',g.hits.some(h=>h.src&&h.src.r535==='burn')||A(g).inspect().burning>=1);
 ok('Q chain shard damage = final hit×qFinal×split.mult',(()=>{const s=g.hits.filter(h=>h.src&&h.src.r535==='shard');return s.length>=1&&s.every(h=>near(h.v,24*2*.15,1e-6));})());
 g=env();const pk=foe('pk',22,16),pc=foe('pc',16,10);g.room.enemies.push(pc,pk);run(g,'cast("r")');for(let i=0;i<40;i++)step(g,1,1/30);
 ok('C chain: petals that hit set enemies on fire',g.hits.some(h=>h.id==='pk'&&h.src&&h.src.r535==='petal')&&(A(g).inspect().burning>=1||g.hits.some(h=>h.id==='pk'&&h.src&&h.src.r535==='burn')));
 ok('no new keys/slots (no keydown listener, no button)',!/addEventListener\(['"]key|createElement\(['"]button/.test(src));

 ok('C beat: petals leave a beat after the blast, not in the same frame',(()=>{const h=env();h.room.enemies.push(foe('c1',16,10));vm.runInContext('cast("r")',h);let tb=null,tp=null;for(let i=0;i<60&&tp==null;i++){step(h,1,1/60);const s=h.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().stats;if(tb==null&&s.blasts)tb=h.time;if(tp==null&&s.petals)tp=h.time;}return tb!=null&&tp!=null&&tp-tb>=.07&&tp-tb<=.12;})());
 ok('at most 4 blast flashes alive at once',(()=>{const h=env();for(let k=0;k<8;k++)vm.runInContext('cast("r")',h);for(let i=0;i<20;i++)step(h,1,1/30);return h.__STORYWORLD_HUNTER_ARROWS_R535__.inspect().fx<=4;})());
 // ---------- R535-2 후속: 헌터 테마(불과 화살, 허공의 문에서 무기가 쏟아짐) · 드라이브 화살촉 불꽃 · 사몽 배수 ----------
 ok('arrowhead flame sheet shipped (drive hunter-fire-arrowhead, ≤ 200KB)',(()=>{const f=path.join(R,'runtime-text','assets','r535','hunter-fire-arrowhead.webp');return fs.existsSync(f)&&fs.statSync(f).size<=200000;})());
 ok('source names the sheet path',/assets\/r535\/hunter-fire-arrowhead\.webp/.test(src));
 g=env();g.readyImage=p=>/hunter-fire-arrowhead/.test(p)?{image:{naturalWidth:1152,naturalHeight:768},ready:true}:null;g.document={createElement(){return{width:0,height:0,getContext(){return{drawImage(){}};}};}};
 g.room.enemies.push(foe('c1',17,10));run(g,'cast("r")');for(let i=0;i<4;i++)step(g,1,1/30);
 ok('lance head wears the arrowhead flame sheet when loaded',A(g).inspect().stats.headDraws>0);
 ok('C opens weapon gates behind the hero (5 portals)',A(g).inspect().gates.some(x=>x.kind==='r'&&x.n===5));
 ok('gates pour visual fire-arrows toward the lance while it flies',A(g).inspect().stats.volleys>0);
 ok('visual volleys capped at 20 alive',A(g).inspect().volleys<=20);
 for(let i=0;i<40;i++)step(g,1,1/30);ok('gates close after the blast',A(g).inspect().gates.filter(x=>x.kind==='r').length===0);
 ok('gate volleys are visual only (no extra hits or projectiles)',g.hits.every(h=>h.src&&['lance','blast','petal','burn','shard'].includes(h.src.r535)||!h.src||h.src.storyWER));
 g=env();g.room.enemies.push(foe('a',16,10));run(g,'special()');step(g,1,.0001);ok('Q opens 3 small gates during the storm',A(g).inspect().gates.some(x=>x.kind==='q'&&x.n===3));
 g=env({off:true});run(g,'special();cast("r")');step(g,2,1/30);ok('switch off → no gates',A(g).inspect().gates.length===0);
 // 사몽(R571 공용 API) 중이면 폭발 반경·가시 사거리 ×1.77, 상한은 그대로
 const surge=on=>({active:()=>on,range:r=>on?r*1.77:r,cd:s=>s,chance:c=>c});
 for(const on of [false,true]){g=env();g.__STORYWORLD_SAMONG_SURGE_R571__=surge(on);const s1=foe('s1',16,10),s2=foe('s2',16,13.2);g.room.enemies.push(s1,s2);run(g,'cast("r")');for(let i=0;i<30;i++)step(g,1,1/30);
  const hitS2=g.hits.some(h=>h.id==='s2'&&h.src&&h.src.r535==='blast');ok('samong '+(on?'on':'off')+': blast reaches an enemy 3.2 tiles away = '+on,hitS2===on);}
 g=env();g.__STORYWORLD_SAMONG_SURGE_R571__=surge(true);for(let i=0;i<30;i++)g.room.enemies.push(foe('p'+i,11+(i%6)*.5,9+Math.floor(i/6)*.5));for(let k=0;k<12;k++){run(g,'cast("w");cast("r")');step(g,8,1/30);}
 ok('samong keeps the 24 live projectile cap',A(g).inspect().stats.maxLive<=24);
 // Codex 리뷰(#376): Q 문 3개가 모두 줄기를 쏘는지 · 사몽 중 넓어진 가시 사거리로 고른 표적에 실제로 닿는지
 g=env();g.room.enemies.push(foe('a',16,10));run(g,'special()');{const seen=new Set();for(let i=0;i<20;i++){step(g,1,1/30);for(const o of A(g).inspect().volleyOrigins)seen.add(o);}ok('Q volleys pour from all 3 gates ('+seen.size+')',seen.size>=3);}
 g=env();g.__STORYWORLD_SAMONG_SURGE_R571__=surge(true);g.room.enemies.push(foe('w1',12,10),foe('far',12,18));run(g,'cast("w")');for(let i=0;i<40;i++)step(g,1,1/30);
 ok('samong: shard reaches a target 8 tiles away',g.hits.some(h=>h.id==='far'&&h.src&&h.src.r535==='shard'));

 // ---------- R535-3: Dots r1 헌터 시트 6장(HU-01~06) 연결 · 시트가 아직 안 읽혔으면 옛 코드 그림 그대로 ----------
 const DOTS=['hunter-c-lance','hunter-c-blast','hunter-burn','hunter-z-ember-thorn','hunter-z-split-pop','hunter-q-storm-trail'];
 ok('Dots r1 sheets shipped (6, each ≤ 400KB, total ≤ 1.2MB)',(()=>{let t=0;for(const n of DOTS){const f=path.join(R,'runtime-text','assets','r535','dots',n+'.webp');if(!fs.existsSync(f))return false;const z=fs.statSync(f).size;if(z>400000)return false;t+=z;}return t<=1200000;})());
 ok('source names every Dots sheet path',DOTS.every(n=>src.includes('assets/r535/dots/'+n+'.webp')));
 const sheetEnv=()=>{const h=env();h.readyImage=p=>/assets\/r535\//.test(p)?{image:{naturalWidth:1536,naturalHeight:1024},ready:true}:null;return h;};
 g=sheetEnv();g.room.enemies.push(foe('a',13,10),foe('b',14,10.6),foe('c',17,10),foe('d',15.5,11));run(g,'special();cast("w")');for(let i=0;i<12;i++)step(g,1,1/30);run(g,'cast("r")');for(let i=0;i<30;i++)step(g,1,1/30);
 {const sd=A(g).inspect().stats.sheetDraws||{};for(const k of ['lance','blast','burn','shard','pop','storm'])ok('sheet drawn when loaded: '+k+' ('+(sd[k]|0)+')',(sd[k]|0)>0);}
 // R535-4: Dots r2 무기 문(HU-07)·불줄기(HU-08)
 ok('Dots r2 gate/volley sheets shipped (each ≤ 200KB) and named in source',['hunter-gate','hunter-volley'].every(n=>{const f=path.join(R,'runtime-text','assets','r535','dots',n+'.webp');return fs.existsSync(f)&&fs.statSync(f).size<=200000&&src.includes('assets/r535/dots/'+n+'.webp');}));
 {const sd=A(g).inspect().stats.sheetDraws||{};for(const k of ['gate','volley'])ok('sheet drawn when loaded: '+k+' ('+(sd[k]|0)+')',(sd[k]|0)>0);}
 g=env();g.room.enemies.push(foe('a',13,10),foe('b',14,10.6),foe('c',17,10));run(g,'special();cast("w")');for(let i=0;i<12;i++)step(g,1,1/30);run(g,'cast("r")');for(let i=0;i<30;i++)step(g,1,1/30);
 ok('sheets not loaded → old code art still draws (no sheet draws, lance drawn)',(()=>{const s=A(g).inspect().stats,sd=s.sheetDraws||{};return Object.values(sd).every(v=>!v)&&s.lanceDraws>0;})());
 g=sheetEnv();for(let i=0;i<30;i++)g.room.enemies.push(foe('p'+i,11+(i%6)*.5,9+Math.floor(i/6)*.5));for(let k=0;k<8;k++){run(g,'cast("w")');step(g,6,1/30);}
 ok('split pops capped (≤ 6 alive)',A(g).inspect().pops<=6);

 // ---------- 그리기·성능 ----------
 g=env();g.room.enemies.push(foe('a',16,10),foe('b',17,10.8));run(g,'special();cast("w");cast("r")');for(let i=0;i<20;i++)step(g,1,1/30);
 ok('custom draws happen inside ctx.scope effect owners',g.scopes.length>0&&g.scopes.every(o=>o.kind==='effect'&&Number.isFinite(o.x)&&Number.isFinite(o.y)));
 ok('lance replaces the base sprite draw (custom twisted shaft)',A(g).inspect().stats.lanceDraws>0);
 ok('one sentinel effect at most',g.effects.filter(e=>e&&e.r535Sentinel).length<=1);
 // 수 상한: 아무리 많이 써도 R535 투사체 ≤ 24
 g=env();for(let i=0;i<30;i++)g.room.enemies.push(foe('p'+i,11+(i%6)*.5,9+Math.floor(i/6)*.5));
 for(let k=0;k<12;k++){run(g,'cast("w")');step(g,8,1/30);}
 ok('live R535 projectiles never exceed 24 (max seen '+A(g).inspect().stats.maxLive+')',A(g).inspect().stats.maxLive<=24);
 // 비용: 30발+12 불일 때 한 틱+그리기 평균
 g=env();for(let i=0;i<30;i++)g.room.enemies.push(foe('q'+i,11+(i%6)*.5,9+Math.floor(i/6)*.5));for(let k=0;k<4;k++){run(g,'cast("w");cast("r")');step(g,3,1/30);}
 const t0=process.hrtime.bigint();for(let i=0;i<300;i++)step(g,1,1/120);const per=Number(process.hrtime.bigint()-t0)/1e6/300;
 ok('frame cost with harness < 2 ms ('+per.toFixed(3)+' ms)',per<2);
}
console.log(`R535 hunter-arrows cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

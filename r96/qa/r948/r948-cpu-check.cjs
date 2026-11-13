// R948 CPU 검사: 미카엘라 확률 발동 특수 패시브 '사랑의 처방'(사용자 2026-11-12 13:17Z).
// 미카엘라 본인 타격 때만 확률로(0.35초에 한 번 굴림, 발동 뒤 대기) 세 가지 중 하나가 저절로 나간다. 키는 늘리지 않는다.
//  ① 연심 대개화(가장 드묾): 큰 분홍 하트가 생겨 2초 뛰다가 대폭발 → 하트 모양 구름이 남아 잠깐 계속 피해.
//  ② 하트 세례(가장 흔함): 하트 투사체를 둘레로 난사, 맞은 일반 몹은 잠깐 미카엘라 쪽으로 홀려 걸어옴(보스는 맞기만).
//  ③ 쉼터 오르골탑: 쉼터 오르골(R378 그림)을 7초 탑으로 소환, 하트·음표가 섞인 둥실 투사체가 여러 적에게 달라붙었다가 하트 폭발.
// 영웅 인스턴스별 상태(생존 모드 배치 영웅 R720 이 player 를 몸으로 바꿔 끼우는 방식)도 확인한다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='michaela-heart-r948.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('<script src="./'+F+'"></script>').length===2);
 ok('loads after hero-defense-r720 / projectile-size-r911 and before combat-r118 (R895 pins hero-motion right before combat-r118)',(()=>{const h=RT('index.html'),i=h.indexOf('./'+F+'"');return i>h.indexOf('./hero-defense-r720.js"')&&i>h.indexOf('./projectile-size-r911.js"')&&i<h.indexOf('<script src="./combat-r118.js"');})());
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r948\/r948-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('in runtime-inputs.json',JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'))).includes(F));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]|\.hp\s*\+=/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('reuses the shelter music box picture (R378 orgel frames)',/assets\/r378\/orgel-/.test(src));
 function env(hero='michaela'){const hits=[],moves=[],sounds=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];var wall=null;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function blocked(x,y,r=.27){return wall!=null&&x>wall;}
  function moveActor(a,dx,dy,r=.27){moves.push(a.id);if(!blocked(a.x+dx,a.y,r))a.x+=dx;if(!blocked(a.x,a.y+dy,r))a.y+=dy;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
  function damageable3(e){return true;}function clearLine(a,b){return wall==null||(a.x<=wall&&b.x<=wall)||(a.x>wall&&b.x>wall);}
  function attackPower(){return player.ap;}function storyAim22(){return 0;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v,s,by:player.id||player.hero});e.hp-=v;return true;}
  function sound(k){sounds.push(k);}
  function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var drawn=[];var imgReady=true;function readyImage(p){return imgReady?{image:{src:p,naturalWidth:262,naturalHeight:360}}:null;}
  var sprites=[];function sprite(p,x,y,h,o){sprites.push({p,x,y,h,o});return true;}function addImage(p){}
  var scopes=[],arcs=[],grads=[],hearts=[];var grad={addColorStop(){}};var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){drawn.push({src:im.src,a});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(x,y,rx,ry){arcs.push(Math.max(rx,ry));},arc(x,y,r){arcs.push(r);},fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(...a){hearts.push(a);},fillRect(){},fillText(){},createRadialGradient(...a){grads.push(a);return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_MICHAELA_HEART_R948__;
 const heroHit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:player.hero})`,g);
 const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r948&&(!kind||h.s.kind==='r948-'+kind));
 let g=env();ok('API exposed',!!A(g)&&['inspect','qaForce','qaRandom','qaReset','set'].every(k=>typeof A(g)[k]==='function'));
 const tun=A(g).inspect().tuning;
 ok('tuning: chance 11%, roll gap .35 s, cooldown 5 s, tower lasts 7 s',tun.CHANCE===.11&&tun.ROLL_GAP===.35&&tun.ICD===5&&tun.TOWER_LIFE===7);
 ok('weights: volley most common, bloom rarest',(()=>{const w=Object.fromEntries(tun.WEIGHTS);return w.volley>w.tower&&w.tower>w.bloom&&w.bloom>0;})());

 // ---- 확률·대기 ----
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>.99);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll .99 → never procs',A(g).inspect().stats.procTotal===0&&A(g).inspect().stats.rolls>=25);
 g=env();g.room.enemies.push(mob('a',11,10,{hp:1e9,maxHp:1e9}));A(g).qaRandom(()=>0);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 {const n=A(g).inspect().stats.procTotal;ok('roll 0 → procs, at most once per 5 s cooldown (10 s → 2)',n===2);}
 g=env();g.room.enemies.push(mob('a',11,10,{hp:1e9,maxHp:1e9}));A(g).qaRandom(()=>0);for(let i=0;i<5;i++)heroHit(g,'a');
 ok('multi-hit in one moment rolls once',A(g).inspect().stats.rolls===1);
 g=env();A(g).qaRandom(()=>.105);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .105 < .11 → procs',A(g).inspect().stats.procTotal===1);
 g=env();A(g).qaRandom(()=>.115);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .115 → no proc (alone)',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>.115);g.room.enemies.push(mob('a',11,10),mob('b',10.5,11),mob('c',9,9.5),mob('d',10,11.5));heroHit(g,'a');ok('surrounded by 4 within 2 tiles → 15% (.115 procs)',A(g).inspect().stats.procTotal===1);
 g=env('lauren');A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));for(let i=0;i<20;i++){heroHit(g,'a');step(g,1,.4);}ok('other hero → never procs',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'ally',sourceHero:'neon'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{owner:'enemy'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{coopIdR62:2})",g);
 ok('hits by other heroes / enemies / coop allies never roll',A(g).inspect().stats.rolls===0);
 g=env();A(g).qaRandom(()=>0);g.localStorage.setItem('storyworld.r948.heart','{"on":false}');g.room.enemies.push(mob('a',11,10));heroHit(g,'a');step(g,20);ok('switch off → nothing',A(g).inspect().stats.procTotal===0&&procHits(g).length===0);
 // 무작위 굴림 분포: 하트 세례 > 오르골탑 > 대개화
 g=env();{let s=12345;A(g).qaRandom(()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;});g.room.enemies.push(mob('a',11,10,{hp:1e12,maxHp:1e12}));for(let i=0;i<6000;i++){heroHit(g,'a');step(g,1,.4);if(i%400===0)A(g).qaReset();}
  const p=A(g).inspect().stats.procs;console.log('  distribution',JSON.stringify(p));ok('random procs: volley most, bloom least',p.volley>p.tower&&p.tower>p.bloom&&p.bloom>0);}

 // ---- ② 하트 세례 ----
 g=env();A(g).qaForce('volley');{const ring=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;ring.push(mob('v'+i,10+Math.cos(a)*3,10+Math.sin(a)*3));}const B=mob('B',10+Math.cos(Math.PI*.625)*4,10+Math.sin(Math.PI*.625)*4,{boss:true}),far=mob('far',18,10);
  g.room.enemies.push(...ring,B,far);heroHit(g,'v0');ok('volley launches hearts all around (≥ 12)',A(g).inspect().acts.filter(a=>a.kind==='volley').length===1&&A(g).inspect().acts[0].hearts>=12);
  const pos=ring.map(e=>({x:e.x,y:e.y}));step(g,30);const h=procHits(g,'volley');
  ok('hearts hit enemies in every direction with .55×AP (=5.5)',ring.every(e=>h.some(x=>x.id===e.id))&&h.every(x=>Math.abs(x.v-5.5)<1e-9));
  ok('each heart hits once (total hits ≤ heart count)',h.length<=A(g).inspect().tuning.VOLLEY_N);
  ok('volley range ≤ 6 tiles (enemy 8 tiles away untouched)',!h.some(x=>x.id==='far'));
  ok('charmed mobs walk toward Michaela (closer than before, via moveActor)',ring.every((e,i)=>Math.hypot(e.x-10,e.y-10)<Math.hypot(pos[i].x-10,pos[i].y-10)-.3)&&g.moves.includes('v0'));
  ok('charmed mobs never walk into Michaela (stay ≥ .8 tiles)',ring.every(e=>Math.hypot(e.x-10,e.y-10)>=.8-1e-9));
  ok('charmed mobs hold attacks (cd ≥ .5)',ring[0].cd>=.5);
  ok('boss is hit but not charmed/moved',h.some(x=>x.id==='B')&&B.x===10+Math.cos(Math.PI*.625)*4&&B.y===10+Math.sin(Math.PI*.625)*4);
  step(g,40);ok('volley ends',!A(g).inspect().acts.length);}
 g=env();g.wall=11.5;A(g).qaForce('volley');{const t=mob('t',11,10),bh=mob('bh',13,10);g.room.enemies.push(t,bh);heroHit(g,'t');step(g,40);ok('hearts stop at walls (no hit behind)',!procHits(g,'volley').some(x=>x.id==='bh'));}

 // ---- ① 연심 대개화 ----
 g=env();A(g).qaForce('bloom');{const t=mob('t',13,10),n=mob('n',14.5,11),out=mob('out',18,10),B=mob('B',12,11,{boss:true});g.room.enemies.push(t,n,out,B);heroHit(g,'t');
  const a=A(g).inspect().acts.find(x=>x.kind==='bloom');ok('big heart planted at the struck enemy',a&&Math.abs(a.x-13)<1e-9&&Math.abs(a.y-10)<1e-9);
  step(g,36);ok('no damage while the heart beats (~2 s)',procHits(g,'bloom').length===0);
  step(g,6);const h=procHits(g,'bloom');ok('big explosion: every enemy within 3 tiles once, 3.2×AP (=32), boss 2.0×AP (=20)',h.some(x=>x.id==='t'&&Math.abs(x.v-32)<1e-9)&&h.some(x=>x.id==='n'&&Math.abs(x.v-32)<1e-9)&&h.some(x=>x.id==='B'&&Math.abs(x.v-20)<1e-9)&&h.length===3);
  ok('explosion misses enemy 5 tiles away',!h.some(x=>x.id==='out'));
  ok('heart-shaped cloud remains after explosion',A(g).inspect().acts.some(x=>x.kind==='cloud'));
  step(g,90);const c=procHits(g,'cloud').filter(x=>x.id==='t');ok('cloud ticks .3×AP (=3) every .5 s for 4 s (8 times) on enemies inside',c.length===8&&c.every(x=>Math.abs(x.v-3)<1e-9));
  ok('cloud leaves enemy outside 2.2 tiles alone',!procHits(g,'cloud').some(x=>x.id==='out'));
  ok('bloom + cloud end',!A(g).inspect().acts.length);
  ok('boss not moved by bloom',B.x===12&&B.y===11);}
 g=env();A(g).qaForce('bloom');{const t=mob('t',30,10);g.room.enemies.push(t);heroHit(g,'t');const a=A(g).inspect().acts.find(x=>x.kind==='bloom');ok('struck enemy too far (> 7 tiles) → heart planted 3 tiles ahead of Michaela',a&&Math.abs(Math.hypot(a.x-10,a.y-10)-3)<1e-6);}

 // ---- ③ 쉼터 오르골탑 ----
 g=env();A(g).qaForce('tower');{const ms=[mob('m1',13,10),mob('m2',12,13),mob('m3',8,13),mob('m4',7,7)],far=mob('far',25,10),B=mob('B',13,8,{boss:true});g.room.enemies.push(...ms,far,B);heroHit(g,'m1');
  const tw=A(g).inspect().acts.find(x=>x.kind==='tower');ok('music box tower summoned beside Michaela (≤ 1.5 tiles)',tw&&Math.hypot(tw.x-10,tw.y-10)<=1.5);
  step(g,20);{const fl=A(g).inspect().floaters;ok('tower fires floating heart/note projectiles at several different enemies',fl.length>=3&&new Set(fl.map(f=>f.target)).size>=3);
   ok('projectiles mix hearts and notes',fl.some(f=>f.shape==='heart')&&fl.some(f=>f.shape==='note'));}
  step(g,30);ok('projectiles stick to enemies before bursting',A(g).inspect().stats.stuck>=3);
  step(g,30);const h=procHits(g,'tower');ok('stuck projectiles burst into hearts: .4×AP (=4) to several enemies incl. boss',new Set(h.map(x=>x.id)).size>=4&&h.every(x=>Math.abs(x.v-4)<1e-9)&&h.some(x=>x.id==='B'));
  ok('tower never targets enemies beyond 6.5 tiles',!h.some(x=>x.id==='far'));
  ok('tower still standing at 4 s',A(g).inspect().acts.some(x=>x.kind==='tower'));
  step(g,62);ok('tower gone after 7 s (+ last bursts)',!A(g).inspect().acts.some(x=>x.kind==='tower'));
  step(g,80);ok('all floaters gone afterwards',A(g).inspect().floaters.length===0);
  ok('boss not moved by tower',B.x===13&&B.y===8);}
 g=env();A(g).qaForce('tower');{const t=mob('t',13,10);g.room.enemies.push(t);heroHit(g,'t');A(g).qaReset();A(g).qaForce('tower');step(g,2);heroHit(g,'t');
  ok('only one tower per Michaela at a time (second tower roll becomes volley)',A(g).inspect().acts.filter(x=>x.kind==='tower').length===1&&A(g).inspect().stats.procs.volley===1);}
 g=env();A(g).qaForce('tower');{const t=mob('t',13,10);g.room.enemies.push(t);heroHit(g,'t');step(g,14);vm.runInContext("room.enemies[0].hp=0",g);step(g,60);ok('target dies mid-flight → projectile re-targets or fizzles (no error)',A(g).inspect().stats.errors===0);}
 g=env();A(g).qaForce('tower');{g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,4);vm.runInContext("room={id:'z2',engaged:true,enemies:[],props:[]}",g);step(g,2);ok('room change cancels tower and projectiles',!A(g).inspect().acts.length&&!A(g).inspect().floaters.length);}
 g=env();A(g).qaForce('tower');{g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,4);vm.runInContext('storyScene={}',g);step(g,2);ok('story scene cancels everything',!A(g).inspect().acts.length);}

 // ---- 영웅 인스턴스별(R720 배치 미카엘라) ----
 g=env('neon');A(g).qaRandom(()=>0);{const t=mob('t',13,10,{hp:1e9,maxHp:1e9});g.room.enemies.push(t);
  vm.runInContext("var bodyA={id:'A',hero:'michaela',x:12,y:10,hp:100,ap:20},bodyB={id:'B',hero:'michaela',x:12,y:12,hp:100,ap:30};function as(b,f){const p=player;player=b;try{return f();}finally{player=p;}}",g);
  A(g).qaForce('bloom');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'michaela'}))",g);
  A(g).qaForce('tower');vm.runInContext("as(bodyB,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'michaela'}))",g);
  ok('deployed Michaela bodies proc while the controlled hero is Neon',A(g).inspect().stats.procTotal===2&&A(g).inspect().owners===2);
  const tw=A(g).inspect().acts.find(x=>x.kind==='tower');ok('tower placed beside its own body (B), not the controlled hero',tw&&Math.hypot(tw.x-12,tw.y-12)<=1.5);
  step(g,44);const h=procHits(g,'bloom');ok('damage uses each body\'s own attack power (A bloom 64)',h.some(x=>Math.abs(x.v-64)<1e-9));
  vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'michaela'}))",g);ok('body A still in its own cooldown',A(g).inspect().stats.procTotal===2);
  step(g,120);vm.runInContext("bodyA.hp=0",g);A(g).qaForce('volley');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'michaela'}))",g);ok('fallen body cannot proc',A(g).inspect().stats.procs.volley===0);}
 g=env();A(g).qaRandom(()=>0);A(g).qaForce('volley');{for(let i=0;i<8;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*1.5,10+Math.sin(i)*1.5));heroHit(g,'m0');step(g,20);ok('own proc damage never rolls a new proc',A(g).inspect().stats.rolls===1);}

 // ---- 그리기 ----
 g=env();for(const k of ['volley','bloom','tower']){A(g).qaReset();A(g).qaForce(k);g.room.enemies.push(mob('d'+k,13,10,{hp:1e9}),mob('e'+k,12,12,{hp:1e9}));heroHit(g,'d'+k);step(g,12);}
 step(g,30);
 {const s=vm.runInContext('scopes',g);ok('all three draw through ctx.scope effect owners',['volley','bloom','tower'].every(k=>s.some(o=>o.kind==='effect'&&String(o.id).startsWith('r948:'+k))));
  ok('heart shapes drawn with curves',vm.runInContext('hearts.length',g)>20);
  ok('cloud / tower ground marks are groundAligned',s.some(o=>o.groundAligned&&/r948:(bloom|tower)/.test(o.id)));
  ok('tower drawn with the R378 orgel picture',vm.runInContext('sprites.some(x=>/assets\\/r378\\/orgel-[0-7]\\.webp/.test(x.p))||drawn.some(x=>/assets\\/r378\\/orgel-/.test(x.src))',g));
  ok('projectiles drawn at least half hero height (sizes logged ≥ 33 px at zoom 1)',A(g).inspect().stats.minProjPx>=33);
  ok('radial gradients are concentric only (3D recorder freezes on offset two-circle gradients — R946)',(()=>{const a=vm.runInContext('grads',g);return a.length>0&&a.every(v=>v[0]===v[3]&&v[1]===v[4]);})());
  ok('sentinel effect in effects while active',vm.runInContext('effects.some(e=>e.r948Sentinel)',g));
  step(g,260);ok('sentinel removed when idle',vm.runInContext('effects.filter(e=>e.r948Sentinel).length',g)===0);}
 ok('hearts drawn from the Dots PJ-03 painted heart sheets (fly8 / hit6) when loaded',vm.runInContext('drawn.some(x=>/assets\\/r948\\/heart-fly8\\.webp/.test(x.src))&&drawn.some(x=>/assets\\/r948\\/heart-hit6\\.webp/.test(x.src))',g));
 g=env();vm.runInContext('imgReady=false',g);A(g).qaForce('tower');g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,10);ok('orgel picture not loaded yet → code-drawn box fallback, no error',A(g).inspect().stats.errors===0&&vm.runInContext('scopes',g).some(o=>/r948:tower/.test(o.id)));
 ok('sounds use existing Michaela cues only (no new paid audio)',(()=>{const g2=env();for(const k of ['volley','bloom','tower']){A(g2).qaReset();A(g2).qaForce(k);g2.room.enemies.push(mob('s'+k,13,10));heroHit(g2,'s'+k);step(g2,60);}return g2.sounds.length>0&&g2.sounds.every(k=>/^r546(Sp|Atk)_michaela$/.test(k));})());


 // ---- Dots MH-09 r2 작은 하트 폭발(16장, 6×3 아틀라스 256 칸, 12.5fps) — 오르골탑 투사체 폭발에 적용 ----
 {const g=env();A(g).qaForce('tower');g.room.enemies.push(mob('t',13,10,{hp:1e9,maxHp:1e9}));heroHit(g,'t');
  const BURST=/assets\/r948\/heart-burst16\.webp/;let n=0;while(A(g).inspect().stats.bursts<1&&n++<600)step(g,1,.02);
  const steps=[];for(let i=0;i<80;i++){vm.runInContext('drawn.length=0',g);step(g,1,.02);steps.push(vm.runInContext('drawn',g).filter(x=>BURST.test(x.src)).map(x=>({sx:x.a[0],sy:x.a[1],w:x.a[2],h:x.a[3]})));}
  const all=steps.flat(),idx=all.map(r=>r.sx/256+6*(r.sy/256));
  ok('tower burst drawn from the MH-09 sheet',all.length>0);
  ok('MH-09 cells are whole 256 cells of the 6×3 atlas, only frames 0..15 (slots 17·18 are packing)',all.every(r=>r.w===256&&r.h===256&&r.sx%256===0&&r.sy%256===0)&&idx.every(i=>i>=0&&i<=15));
  ok('MH-09 plays through to its fade (frame ≥ 13 reached → ~1.28 s, not cut at .5 s)',Math.max(...idx)>=13);
  ok('jewel heart (3rd) → outline heart (4th) cross-fades: both drawn in one moment',steps.some(s=>{const f=s.map(r=>r.sx/256+6*(r.sy/256));return f.includes(2)&&f.includes(3);}));
  {const g3=env();A(g3).qaForce('tower');g3.room.enemies.push(mob('t',13,10,{hp:1e9,maxHp:1e9}));heroHit(g3,'t');let k=0;while(A(g3).inspect().stats.bursts<1&&k++<600)step(g3,1,.02);step(g3,10,.02);
   const sb=vm.runInContext('scopes',g3).filter(o=>/r948:tower:boom/.test(o.id));
   ok('burst picture drawn upright in front of the mob (not inside the groundAligned floor scope — it was hidden behind the body)',sb.some(o=>!o.groundAligned)&&sb.some(o=>o.groundAligned));}
  ok('MH-09 sheet does not replace the volley pop (PJ-03 hit6 stays for volley)',/heart-hit6\.webp/.test(src));}

 // ---- R988 Dots CX-0094MH 시트: MH-03 큰 하트 고동 · MH-04 r2 대폭발 · MH-07 둥실 음표 · MH-10/10a/10b 오르골탑 받침 빛 ----
 {const cellOf=(r,cols)=>r.sx/256+cols*(r.sy/256);
  const grab=(g,re)=>vm.runInContext('drawn',g).filter(x=>re.test(x.src)).map(x=>({sx:x.a[0],sy:x.a[1],w:x.a[2],h:x.a[3]}));
  const tick1=(g,dt)=>{vm.runInContext('drawn.length=0',g);step(g,1,dt);};
  const M03=/assets\/r948\/mh03-heart24\.webp/,M04=/assets\/r948\/mh04-blast24(-r3)?\.webp/,M07=/assets\/r948\/mh07-note24\.webp/,M10=/assets\/r948\/mh10-aura24\.webp/,M10A=/assets\/r948\/mh10a-enter8\.webp/,M10B=/assets\/r948\/mh10b-exit8\.webp/;
  // 대개화
  let g=env();A(g).qaForce('bloom');g.room.enemies.push(mob('t',13,10,{hp:1e9,maxHp:1e9}));heroHit(g,'t');
  for(let i=0;i<19;i++)step(g,1,.05);tick1(g,.05); // u≈1.0
  let r=grab(g,M03);ok('R988 bloom charge drawn from MH-03 (24 cells of 256, 6×4)',r.length>0&&r.every(c=>c.w===256&&c.h===256&&c.sx%256===0&&c.sy%256===0&&cellOf(c,6)<=23));
  ok('R988 MH-03 frame follows the 2 s charge (u≈1 s → cell 11..13)',r.some(c=>{const f=cellOf(c,6);return f>=11&&f<=13;}));
  for(let i=0;i<18;i++)step(g,1,.05);tick1(g,.05); // u≈1.95
  ok('R988 MH-03 reaches its last cracked frames at the end of the charge (≥ 22)',grab(g,M03).some(c=>cellOf(c,6)>=22));
  const seen04=[];let after03=0;for(let i=0;i<40;i++){tick1(g,.05);grab(g,M04).forEach(c=>seen04.push(cellOf(c,6)));if(i>=5&&grab(g,M03).length)after03++;}
  ok('R988 bloom blast drawn from MH-04 r2, from the flash frame (≥ 3) to the petal fade (≥ 20)',seen04.length>0&&Math.min(...seen04)>=3&&Math.max(...seen04)>=20&&seen04.every(f=>f<=23));
  ok('R988 MH-03 heart gone once the blast is under way',after03===0);
  // 오르골탑
  g=env();A(g).qaForce('tower');g.room.enemies.push(mob('t',13,10,{hp:1e9,maxHp:1e9}),mob('n',12,12,{hp:1e9,maxHp:1e9}));heroHit(g,'t');
  tick1(g,.1);ok('R988 tower enters with MH-10a (8 cells)',grab(g,M10A).length>0&&grab(g,M10A).every(c=>cellOf(c,4)<=7));
  for(let i=0;i<28;i++)step(g,1,.1);tick1(g,.1); // u≈3
  {const a=grab(g,M10),sc0=vm.runInContext('scopes',g);
   ok('R988 standing tower uses the MH-10 aura loop (24 cells), not enter/exit',a.length>0&&a.every(c=>cellOf(c,6)<=23||c.h<256)&&!grab(g,M10A).length&&!grab(g,M10B).length);
   ok('R988 aura split at the ring centre: back half behind the orgel, front half in front',a.some(c=>c.h<256&&c.sy%256===0)&&a.some(c=>c.h<256&&c.sy%256>0)&&sc0.some(o=>/:aura-back$/.test(o.id))&&sc0.some(o=>/:aura-front$/.test(o.id))&&(()=>{const b=sc0.filter(o=>/:aura-back$/.test(o.id)).pop(),f=sc0.filter(o=>/:aura-front$/.test(o.id)).pop(),bx=sc0.filter(o=>/:box$/.test(o.id)).pop();return b&&f&&bx&&b.y<bx.y&&f.y>bx.y;})());}
  {const seen=[],runs=[];let run=[];for(let i=0;i<30;i++){tick1(g,.1);const c=grab(g,M07).map(c=>cellOf(c,6));c.forEach(f=>seen.push(f));if(c.length===1)run.push(c[0]);else{if(run.length)runs.push(run);run=[];}}if(run.length)runs.push(run);
   ok('R988 floating notes drawn from MH-07 (24 cells)',seen.length>0&&seen.every(f=>f>=0&&f<=23));
   // 한 음표가 이어 보이는 동안(그 틱에 음표 하나)만 비교 — 왕복이면 칸이 1~2씩만 움직인다
   ok('R988 MH-07 plays back and forth (no 24→1 jump)',(()=>{let pairs=0,bad=0;for(const r of runs)for(let i=1;i<r.length;i++){pairs++;if(Math.abs(r[i]-r[i-1])>3)bad++;}return pairs>=3&&bad===0;})());}
  for(let i=0;i<8;i++)step(g,1,.1);tick1(g,.1); // u≈6.9
  ok('R988 tower leaves with MH-10b (8 cells)',grab(g,M10B).length>0&&grab(g,M10B).every(c=>cellOf(c,4)<=7||c.h<256));
  ok('R988 damage numbers unchanged by the new pictures (tower .4×AP, bloom 3.2×AP)',procHits(g,'tower').every(h=>Math.abs(h.v-4)<1e-9));
  // 그림이 아직 안 읽혔으면 코드 그림으로(오류 없음)
  g=env();vm.runInContext('imgReady=false',g);for(const k of ['bloom','tower']){A(g).qaReset();A(g).qaForce(k);g.room.enemies.push(mob('f'+k,13,10,{hp:1e9}));heroHit(g,'f'+k);step(g,60,.05);}
  ok('R988 pictures not loaded → code-drawn fallback, no errors',A(g).inspect().stats.errors===0&&vm.runInContext('hearts.length',g)>5);}
 // ---- R998 Dots CX-0094MH MH-05 하트 구름(기존 24장 알파 60% 정리판) ----
 {const cellOf=(r,cols)=>r.sx/256+cols*(r.sy/256);
  const M05=/assets\/r948\/mh05-cloud24\.webp/,grab=(g)=>vm.runInContext('drawn',g).filter(x=>M05.test(x.src)).map(x=>({sx:x.a[0],sy:x.a[1],w:x.a[2],h:x.a[3]}));
  const tick1=(g,dt)=>{vm.runInContext('drawn.length=0',g);step(g,1,dt);};
  let g=env();A(g).qaForce('bloom');g.room.enemies.push(mob('c',13,10,{hp:1e9,maxHp:1e9}));heroHit(g,'c');
  for(let i=0;i<40;i++)step(g,1,.05); // 충전 2초 → 폭발, 구름 시작
  const seen=[];for(let i=0;i<90;i++){tick1(g,.05);const r=grab(g);if(r.length)seen.push({i,cells:r});}
  const all=seen.flatMap(s=>s.cells);
  ok('R998 heart cloud drawn from MH-05 (24 cells of 256, 6×4)',all.length>0&&all.every(c=>c.w===256&&c.h===256&&c.sx%256===0&&c.sy%256===0&&cellOf(c,6)<=23));
  const fr=seen.map(s=>Math.max(...s.cells.map(c=>cellOf(c,6))));
  ok('R998 MH-05 plays once across the cloud life: starts small (≤ 2), swells mid-way, ends on the last frames (≥ 21)',fr.length>20&&fr[0]<=2&&fr.some(f=>f>=10&&f<=13)&&fr[fr.length-1]>=21);
  ok('R998 MH-05 never jumps back (frame order kept)',fr.every((f,i)=>i===0||f>=fr[i-1]));
  ok('R998 cloud damage unchanged (power × .3 per .5 s tick, 8 ticks)',procHits(g,'cloud').length===8&&procHits(g,'cloud').every(h=>Math.abs(h.v-procHits(g,'cloud')[0].v)<1e-9));
  g=env();vm.runInContext('imgReady=false',g);A(g).qaForce('bloom');g.room.enemies.push(mob('d',13,10,{hp:1e9}));heroHit(g,'d');step(g,140,.05);
  ok('R998 MH-05 not loaded → code puffs fallback, no errors',A(g).inspect().stats.errors===0&&!grab(g).length);}
 // ---- R1004 Dots MH-04 R988 가운데 비운 대폭발(몹을 덜 덮음) ----
 {const M4N=/assets\/r948\/mh04-blast24-r3\.webp/,M4O=/assets\/r948\/mh04-blast24\.webp/;
  const g=env();A(g).qaForce('bloom');g.room.enemies.push(mob('h',13,10,{hp:1e9,maxHp:1e9}));heroHit(g,'h');
  let nN=0,nO=0;for(let i=0;i<80;i++){vm.runInContext('drawn.length=0',g);step(g,1,.05);const d=vm.runInContext('drawn',g);nN+=d.filter(x=>M4N.test(x.src)).length;nO+=d.filter(x=>M4O.test(x.src)).length;}
  ok('R1004 bloom blast drawn from the hollow-centre MH-04 sheet (mh04-blast24-r3), r2 no longer drawn',nN>0&&nO===0);}
 // ---- 3D 기록기 안전(헤드리스 실측: 폭발 순간 u=2-1e-9 에서 sqrt(음수)=NaN → Three.js 'Nonfinite original draw command' → 화면 실패로 게임 정지) ----
 {const bad=[];const watch=g=>{const raw=g.ctx;g.ctx=new Proxy(raw,{get(o,k){const v=o[k];if(typeof v!=='function')return v;return (...a)=>{a.forEach((x,i)=>{if(typeof x==='number'&&!Number.isFinite(x))bad.push(String(k)+'#'+i);});return v.apply(o,a);};},set(o,k,v){if(typeof v==='number'&&!Number.isFinite(v))bad.push('set:'+String(k));o[k]=v;return true;}});};
  const at=(g,t)=>{g.time=t;vm.runInContext('time='+t+';tick();for(const e of effects.slice())drawEffect(e)',g);};
  for(const k of ['bloom','volley','tower']){const g=env();watch(g);g.room.enemies.push(mob('t',12,10,{hp:1e9,maxHp:1e9}),mob('n',12.5,11,{hp:1e9,maxHp:1e9}),mob('m',11,12,{hp:1e9,maxHp:1e9}));A(g).qaForce(k);heroHit(g,'t');
   const t0=A(g).inspect().acts[0]?.t0??0;
   // 엔진처럼 1/60 을 더해 가며 실수 오차가 쌓인 시각 + 경계 바로 앞뒤(대개화 2 s, 구름 끝, 탑 끝)
   let t=t0;for(let i=0;i<60*11;i++){t+=1/60;at(g,t);}
   const g2=env();watch(g2);g2.room.enemies.push(mob('t',12,10,{hp:1e9,maxHp:1e9}));A(g2).qaForce(k);heroHit(g2,'t');const s0=A(g2).inspect().acts[0]?.t0??0;
   for(const d of [1.999999999,2-1e-12,2,2+1e-12,2.6-1e-10,2.6,6-1e-10,6.3-1e-10,6.9999999999,7,7.0000001])at(g2,s0+d);}
  ok('every draw-call number stays finite for all three kinds (3D recorder never fails) '+(bad.length?JSON.stringify([...new Set(bad)].slice(0,8)):''),bad.length===0);}
 // ---- 렉 ----
 g=env();A(g).qaRandom(()=>0);for(let i=0;i<60;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*4,10+Math.sin(i)*4,{hp:1e9}));
 const t0=process.hrtime.bigint();for(const k of ['tower','bloom','volley','tower','volley']){A(g).qaForce(k);heroHit(g,'m1');A(g).qaReset();step(g,24);}step(g,100);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 console.log('  60 mobs, 5 procs, ~220 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('60 mobs stays cheap (< 400 ms in vm)',ms<400);
 ok('floater cap respected (≤ 14 at once)',A(g).inspect().stats.maxFloaters<=14);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
}
console.log(`R948 michaela-heart cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

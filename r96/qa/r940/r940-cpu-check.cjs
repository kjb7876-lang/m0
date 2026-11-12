// R940 CPU 검사: 라우렌 확률 발동 특수 패시브 '천체 공명'.
// 라우렌 본인 타격 때만 확률로(0.35초에 한 번 굴림, 발동 뒤 5초 대기) 다섯 가지 중 하나가 저절로 나간다. 키는 늘리지 않는다.
//  항성 반발(척력 폭발) · 적색 거성(밀어내는 붉은 구) · 청색 왜성(끌어당기는 푸른 구) · 쌍성 소멸(붉은+푸른 → 보라 관통탄, 둘이 12초 안에 나간 뒤) · 유성 궤도(주변 조형물을 띄워 던져 중력 폭발)
// 보스·중간 보스는 밀리거나 끌리지 않는다(맞기만 함). 이동은 moveActor(벽 존중). 조형물은 자리·충돌을 바꾸지 않고 잠깐 숨겼다가 되돌린다.
// 영웅 인스턴스별 상태(생존 모드 배치 영웅 R720 이 player 를 몸으로 바꿔 끼우는 방식)도 확인한다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='lauren-celestial-r940.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('<script src="./'+F+'"></script>').length===2);
 ok('loads after hero-defense-r720 (deployed heroes) and before combat-r118',(()=>{const h=RT('index.html'),i=h.indexOf('./'+F+'"');return i>h.indexOf('./hero-defense-r720.js"')&&i<h.indexOf('<script src="./combat-r118.js"');})());
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r940\/r940-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('in runtime-inputs.json',JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'))).includes(F));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('no prop position/collision writes (a.x=, .solid=, .radius=)',!/\b(?:a|p|prop)\.(?:x|y|solid|radius)\s*=[^=]/.test(src));
 function env(hero='lauren'){const hits=[],moves=[],sounds=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];var wall=null;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function nearestEnemy(r=1e9){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
  function blocked(x,y,r=.27){return wall!=null&&x>wall;}
  function moveActor(a,dx,dy,r=.27){moves.push(a.id);if(!blocked(a.x+dx,a.y,r))a.x+=dx;if(!blocked(a.x,a.y+dy,r))a.y+=dy;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
  function damageable3(e){return true;}function clearLine(a,b){return wall==null||(a.x<=wall&&b.x<=wall);}
  function attackPower(){return player.ap;}function storyAim22(){return 0;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v,s,by:player.id||player.hero});e.hp-=v;return true;}
  function sound(k){sounds.push(k);}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}
  function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var drawn=[];function readyImage(p){return {image:{src:p,naturalWidth:100,naturalHeight:200}};}function ensureImages(){return Promise.resolve();}
  var scopes=[],arcs=[],grads=[];var grad={addColorStop(){}};var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){drawn.push({src:im.src,a});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(x,y,rx,ry){arcs.push(Math.max(rx,ry));},arc(x,y,r){arcs.push(r);},fill(){},stroke(){},moveTo(){},lineTo(){},quadraticCurveTo(){},fillRect(){},createRadialGradient(...a){grads.push(a);return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_LAUREN_CELESTIAL_R940__;
 const heroHit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:player.hero})`,g);
 const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r940&&(!kind||h.s.kind==='r940-'+kind));
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function'&&typeof A(g).qaForce==='function'&&typeof A(g).qaRandom==='function'&&typeof A(g).qaReset==='function');
 const tun=A(g).inspect().tuning;ok('tuning: chance 10%, roll gap .35 s, cooldown 5 s',tun.CHANCE===.10&&tun.ROLL_GAP===.35&&tun.ICD===5);

 // ---- 확률·대기 ----
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>.99);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll .99 (>= 10%) → never procs',A(g).inspect().stats.procTotal===0&&A(g).inspect().stats.rolls>=25);
 g=env();g.room.enemies.push(mob('a',11,10,{hp:1e9,maxHp:1e9}));A(g).qaRandom(()=>0);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 {const n=A(g).inspect().stats.procTotal;ok('roll 0 → procs, but at most once per 5 s cooldown (10 s → 2)',n===2);}
 g=env();g.room.enemies.push(mob('a',11,10,{hp:1e9,maxHp:1e9}));A(g).qaRandom(()=>0);for(let i=0;i<5;i++)heroHit(g,'a');
 ok('multi-hit in one moment rolls once (roll gap .35 s)',A(g).inspect().stats.rolls===1);
 g=env();A(g).qaRandom(()=>.095);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .095 < .10 → procs',A(g).inspect().stats.procTotal===1);
 g=env();A(g).qaRandom(()=>.105);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .105 → no proc (alone)',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>.105);g.room.enemies.push(mob('a',11,10),mob('b',10.5,11),mob('c',9,9.5),mob('d',10,11.5));heroHit(g,'a');ok('surrounded by 4 within 2 tiles → chance 14% (.105 procs)',A(g).inspect().stats.procTotal===1);
 g=env('neon');A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));for(let i=0;i<20;i++){heroHit(g,'a');step(g,1,.4);}ok('other hero → never procs',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'ally',sourceHero:'neon'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{owner:'enemy'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{coopIdR62:2})",g);
 ok('hits by other heroes / enemies / coop allies never roll',A(g).inspect().stats.rolls===0);
 g=env();A(g).qaRandom(()=>0);g.localStorage.setItem('storyworld.r940.celestial','{"on":false}');g.room.enemies.push(mob('a',11,10));heroHit(g,'a');step(g,20);ok('switch off → nothing',A(g).inspect().stats.procTotal===0&&procHits(g).length===0);

 // ---- ① 항성 반발 ----
 g=env();A(g).qaForce('repulse');const r1=mob('r1',11,10),r2=mob('r2',10,8.5),rf=mob('rf',14,10),rb=mob('rB',9,10,{boss:true});g.room.enemies.push(r1,r2,rf,rb);heroHit(g,'r1');step(g,10);
 {const h=procHits(g,'repulse');ok('repulse hits every enemy within 2.8 tiles once with 1.2×AP (=12)',h.length===3&&h.every(x=>Math.abs(x.v-12)<1e-9)&&new Set(h.map(x=>x.id)).size===3);
  ok('repulse does not hit enemy outside 2.8',!h.some(x=>x.id==='rf'));
  ok('repulse pushes mobs outward ≥1.6 tiles (via moveActor)',Math.hypot(r1.x-10,r1.y-10)>=1+1.6&&Math.hypot(r2.x-10,r2.y-10)>=1.5+1.6&&g.moves.includes('r1'));
  ok('repulse never moves boss (damage only)',rb.x===9&&rb.y===10&&h.some(x=>x.id==='rB'));
  ok('repulse staggers pushed mobs (cd ≥ .4)',r1.cd>=.4);}
 g=env();g.wall=11.5;A(g).qaForce('repulse');const rw=mob('rw',11,10);g.room.enemies.push(rw);heroHit(g,'rw');step(g,10);ok('repulse respects walls',rw.x<=11.5);

 // ---- ② 적색 거성 ----
 g=env();A(g).qaForce('red');{const t=mob('t',13,10),s=mob('s',15,10.3),off=mob('o',13,13),B=mob('B',16,10,{boss:true});g.room.enemies.push(t,s,off,B);heroHit(g,'t');
  ok('red orb launched toward the struck enemy',A(g).inspect().acts.some(a=>a.kind==='red'));
  step(g,40);const h=procHits(g,'red');ok('red orb hits enemies on its path once each with .9×AP (=9)',h.some(x=>x.id==='t')&&h.some(x=>x.id==='s')&&h.every(x=>Math.abs(x.v-9)<1e-9)&&new Set(h.map(x=>x.id)).size===h.length);
  ok('red orb misses enemy far off the path',!h.some(x=>x.id==='o'));
  ok('red orb pushes mobs forward along its path (+x)',t.x>13+1&&s.x>15+.8);ok('red orb does not move boss',B.x===16&&B.y===10&&h.some(x=>x.id==='B'));
  ok('red orb ends (travels ≤ 8 tiles)',!A(g).inspect().acts.some(a=>a.kind==='red'));}
 g=env();g.wall=12.5;A(g).qaForce('red');{const t=mob('t',12,10),bh=mob('bh',14,10);g.room.enemies.push(t,bh);heroHit(g,'t');step(g,40);ok('red orb stops at a wall (no hit behind it)',!procHits(g,'red').some(x=>x.id==='bh'));}

 // ---- ③ 청색 왜성 ----
 g=env();A(g).qaForce('blue');{const t=mob('t',13,10),p1=mob('p1',15.5,10),p2=mob('p2',13,12.5),far=mob('far',18,10),B=mob('B',13,11,{boss:true});g.room.enemies.push(t,p1,p2,far,B);heroHit(g,'t');
  const d1=Math.hypot(p1.x-13,p1.y-10),d2=Math.hypot(p2.x-13,p2.y-10);step(g,16);
  ok('blue orb settles at the struck enemy and pulls mobs within 3.4 tiles toward it',Math.hypot(p1.x-13,p1.y-10)<d1-.4&&Math.hypot(p2.x-13,p2.y-10)<d2-.4);
  ok('blue orb never pulls past the core (.5)',[p1,p2].every(e=>Math.hypot(e.x-13,e.y-10)>=.5-1e-9));
  ok('blue orb leaves enemy outside 3.4 tiles',far.x===18);ok('blue orb never moves boss',B.x===13&&B.y===11);
  step(g,30);const h=procHits(g,'blue');const byT=h.filter(x=>x.id==='t');ok('blue orb ticks .25×AP (=2.5) 4 times on enemies at its core',byT.length===4&&byT.every(x=>Math.abs(x.v-2.5)<1e-9));
  ok('blue orb ends after ~1.4 s',!A(g).inspect().acts.some(a=>a.kind==='blue'));}

 // ---- ④ 쌍성 소멸(붉은+푸른 → 보라) ----
 g=env();A(g).qaRandom(()=>0);{const t=mob('t',13,10,{hp:1e9,maxHp:1e9});g.room.enemies.push(t);A(g).qaForce('red');heroHit(g,'t');step(g,110);A(g).qaForce('blue');heroHit(g,'t');step(g,110);
  heroHit(g,'t');ok('after red and blue within 12 s the next proc becomes violet (no force)',A(g).inspect().stats.procs.violet===1);
  step(g,4);ok('violet: red and blue orbs converge first (charge ~.5 s, no damage yet)',procHits(g,'violet').length===0);}
 g=env();A(g).qaRandom(()=>0);{const t=mob('t',13,10,{hp:1e9,maxHp:1e9});g.room.enemies.push(t);A(g).qaForce('red');heroHit(g,'t');step(g,260);A(g).qaForce('blue');heroHit(g,'t');step(g,110);A(g).qaRandom(()=>.5);
  ok('red then blue 13 s+ apart → no violet combo pending',A(g).inspect().comboReady===false);}
 g=env();A(g).qaForce('violet');{const t=mob('t',12,10),l1=mob('l1',16,10.4),l2=mob('l2',19,9.7),off=mob('off',16,12.5),B=mob('B',18,10,{boss:true}),beyond=mob('far',23,10);g.room.enemies.push(t,l1,l2,off,B,beyond);heroHit(g,'t');step(g,40);
  const h=procHits(g,'violet');ok('violet beam pierces every enemy on the line with 3.0×AP (=30)',['t','l1','l2'].every(id=>h.some(x=>x.id===id&&Math.abs(x.v-30)<1e-9)));
  ok('violet hits boss with 1.8×AP (=18), no movement',h.some(x=>x.id==='B'&&Math.abs(x.v-18)<1e-9)&&B.x===18);
  ok('violet each enemy once',new Set(h.map(x=>x.id)).size===h.length);ok('violet misses off-line enemy and range ends at 11 tiles',!h.some(x=>x.id==='off')&&!h.some(x=>x.id==='far'));}
 g=env();g.wall=14;A(g).qaForce('violet');{const t=mob('t',12,10),bh=mob('bh',16,10);g.room.enemies.push(t,bh);heroHit(g,'t');step(g,40);ok('violet stops at a wall',procHits(g,'violet').some(x=>x.id==='t')&&!procHits(g,'violet').some(x=>x.id==='bh'));}

 // ---- ⑤ 유성 궤도(주변 조형물) ----
 const prop=(id,x,y,extra={})=>({id,x,y,path:'assets/props/'+id+'.webp',height:60,radius:.4,solid:false,visible:true,...extra});
 g=env();A(g).qaForce('meteor');{const pa=prop('vase',11,11),pb=prop('jar',8.5,10),solid=prop('statue',10,12,{solid:true}),npc=prop('npc',9,9,{r75NPC:'michaela'}),door=prop('door',11,9,{r74Door:{}}),big=prop('tree',9,11,{height:400}),root=prop('r138:z1:root:0',10.5,10.5,{path:'assets/r138/root.webp'}),rug=prop('rug',9.5,10.5,{path:'assets/props/blood_carpet.webp'}),farP=prop('far',20,20);
  g.room.props.push(pa,pb,solid,npc,door,big,farP,root,rug);const t=mob('t',14,10),n=mob('n',15,11),B=mob('B',14,9,{boss:true});g.room.enemies.push(t,n,B);
  heroHit(g,'t');const act=A(g).inspect().acts.find(a=>a.kind==='meteor');
  ok('meteor gathers nearby decorative props (non-solid, has picture, not NPC/door, not huge) + debris to 3',act&&act.rocks.length===3&&act.rocks.filter(r=>r.propId).map(r=>r.propId).sort().join()==='jar,vase'&&act.rocks.filter(r=>!r.propId).length===1);
  ok('picked props hidden while flying; others (incl. flat ground decals: roots, carpets) untouched',pa.visible===false&&pb.visible===false&&solid.visible===true&&npc.visible===true&&door.visible===true&&big.visible===true&&farP.visible===true&&root.visible===true&&rug.visible===true);
  step(g,6);ok('props re-hidden even if something turns them back on mid-flight',(pa.visible=true,step(g,1),pa.visible===false));
  ok('no damage during gather/orbit (~1 s)',procHits(g,'meteor').length===0);
  step(g,40);const h=procHits(g,'meteor');ok('meteors hit with gravity explosions 1.4×AP (=14) each',h.length>=3&&h.every(x=>Math.abs(x.v-14)<1e-9));
  ok('boss takes meteor damage but is not pulled',B.x===14&&B.y===9);
  step(g,30);ok('props restored visible at the same place after the explosion',pa.visible===true&&pb.visible===true&&pa.x===11&&pa.y===11&&pb.x===8.5&&pb.y===10&&!A(g).inspect().acts.length);
  ok('props stats: 2 hidden, 2 restored, 1 debris',A(g).inspect().stats.hiddenProps===2&&A(g).inspect().stats.restoredProps===2&&A(g).inspect().stats.debris===1);}
 // 엔진이 지금 화면에 그리지 않는 조형물(병원·카이로 일부: 자리에 그림이 안 나옴)은 던지지 않는다 — drawProp 이 최근에 그린 것만.
 {const src2=fs.readFileSync(path.join(R,'client-source',F),'utf8');
  // drawProp 가 있는 환경을 새로 만든다: 모듈이 실릴 때 감쌀 수 있게 먼저 정의
  const h=(()=>{const hits=[],moves=[],sounds=[];const c={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};c.window=c;vm.createContext(c);return c;})();
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;var player={hero:'lauren',x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];
   function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}function blocked(){return false;}function moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}function attackPower(){return 10;}
   function hitEnemy(e,v,s){hits.push({id:e.id,v,s});e.hp-=v;return true;}function tick(){}function drawEffect(){}function drawProp(a){}function project(x,y){return{x,y};}function actorHeight(){return 66;}`,h);
  vm.runInContext(src2,h);const s1=prop('seen',11,11),u1=prop('unseen',10.5,11.5);h.room.props.push(s1,u1);h.room.enemies.push(mob('t',13,10));
  vm.runInContext('drawProp(room.props[0])',h);h.__STORYWORLD_LAUREN_CELESTIAL_R940__.qaForce('meteor');vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'})",h);
  const act=h.__STORYWORLD_LAUREN_CELESTIAL_R940__.inspect().acts.find(a=>a.kind==='meteor');
  ok('with drawProp present, only props the engine drew in the last .5 s are thrown (seen yes, never-drawn no)',act&&act.rocks.some(r=>r.propId==='seen')&&!act.rocks.some(r=>r.propId==='unseen')&&u1.visible===true);}
 g=env();g.wall=11.5;A(g).qaForce('meteor');{const behind=prop('behind',12.5,10),front=prop('front',11,10.5);g.room.props.push(behind,front);g.room.enemies.push(mob('t',11.2,9));heroHit(g,'t');const act=A(g).inspect().acts.find(a=>a.kind==='meteor');
  ok('props behind a wall (no clear line from Lauren) are not thrown',act&&act.rocks.some(r=>r.propId==='front')&&!act.rocks.some(r=>r.propId==='behind')&&behind.visible===true);}
 g=env();A(g).qaForce('meteor');{g.room.enemies.push(mob('t',13,10));heroHit(g,'t');const act=A(g).inspect().acts.find(a=>a.kind==='meteor');ok('no props nearby → 3 debris stones instead',act&&act.rocks.length===3&&act.rocks.every(r=>!r.propId));step(g,60);ok('debris meteors still explode',procHits(g,'meteor').length>=1);}
 g=env();A(g).qaForce('meteor');{const pa=prop('vase',11,11);g.room.props.push(pa);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,4);vm.runInContext("room={id:'z2',engaged:true,enemies:[],props:[]}",g);step(g,4);
  ok('room change mid-flight restores hidden props and cancels',pa.visible===true&&!A(g).inspect().acts.length);}
 g=env();A(g).qaForce('meteor');{const pa=prop('vase',11,11,{visible:undefined});g.room.props.push(pa);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,4);vm.runInContext('storyScene={}',g);step(g,2);
  ok('story scene cancels and restores the original visible value',pa.visible===undefined&&!A(g).inspect().acts.length);}
 g=env();A(g).qaForce('meteor');{const pa=prop('vase',11,11);g.room.props.push(pa);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,4);A(g).set(false);step(g,30);ok('switching off mid-flight restores props',pa.visible===true&&!A(g).inspect().acts.length);}

 // ---- 영웅 인스턴스별(R720 배치 라우렌) ----
 g=env('neon');A(g).qaRandom(()=>0);{const t=mob('t',13,10,{hp:1e9,maxHp:1e9});g.room.enemies.push(t);
  vm.runInContext("var bodyA={id:'A',hero:'lauren',x:12,y:10,hp:100,ap:20},bodyB={id:'B',hero:'lauren',x:12,y:12,hp:100,ap:30};function as(b,f){const p=player;player=b;try{return f();}finally{player=p;}}",g);
  A(g).qaForce('repulse');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'}))",g);
  A(g).qaForce('repulse');vm.runInContext("as(bodyB,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'}))",g);
  ok('deployed Lauren bodies proc while the controlled hero is Neon',A(g).inspect().stats.procTotal===2);
  ok('each body has its own cooldown (A proc does not block B)',A(g).inspect().owners===2);
  const h=procHits(g,'repulse');ok('damage uses each body\'s own attack power (A 24, B 36)',h.some(x=>Math.abs(x.v-24)<1e-9)&&h.some(x=>Math.abs(x.v-36)<1e-9));
  ok('repulse centred on the body, not the controlled hero',A(g).inspect().stats.repulseCentres.join(';')==='12,10;12,12');
  vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'}))",g);ok('body A still in its own cooldown',A(g).inspect().stats.procTotal===2);
  step(g,30);vm.runInContext("bodyA.hp=0",g);A(g).qaForce('meteor');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'}))",g);ok('fallen body cannot proc',A(g).inspect().stats.procs.meteor===0);}
 // ---- 자기 피해로 다시 굴리지 않음 ----
 g=env();A(g).qaRandom(()=>0);A(g).qaForce('repulse');{for(let i=0;i<8;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*1.5,10+Math.sin(i)*1.5));heroHit(g,'m0');ok('own proc damage never rolls a new proc',A(g).inspect().stats.rolls===1);}
 // ---- 그리기 ----
 g=env();for(const k of ['repulse','red','blue','violet','meteor']){A(g).qaReset();A(g).qaForce(k);g.room.enemies.push(mob('d'+k,13,10,{hp:1e9}));heroHit(g,'d'+k);step(g,8);}
 {const s=vm.runInContext('scopes',g);ok('all five draw through ctx.scope effect owners',['repulse','red','blue','violet','meteor'].every(k=>s.some(o=>o.kind==='effect'&&String(o.id).startsWith('r940:'+k))));
  ok('ground rings are groundAligned',s.some(o=>o.groundAligned&&/r940:(repulse|blue)/.test(o.id)));
  ok('orbs drawn at least half hero height across (radius ≥ 16.5 px at zoom 1)',(()=>{const a=vm.runInContext('arcs',g);return a.some(r=>r>=16.5);})());
  ok('meteor copies drawn from prop/debris pictures',vm.runInContext('drawn.length',g)>0||s.some(o=>/r940:meteor:rock/.test(o.id)));
  ok('radial gradients are concentric only (3D recorder freezes the game on offset two-circle gradients — browser regression R940)',(()=>{const a=vm.runInContext('grads',g);return a.length>0&&a.every(v=>v[0]===v[3]&&v[1]===v[4]);})());
  ok('sentinel effect in effects while active',vm.runInContext('effects.some(e=>e.r940Sentinel)',g));
  step(g,120);ok('sentinel removed when idle',vm.runInContext('effects.filter(e=>e.r940Sentinel).length',g)===0);}
 ok('sounds use existing pleasant Lauren cues (no new paid audio)',(()=>{const g2=env();A(g2).qaForce('violet');g2.room.enemies.push(mob('t',13,10));heroHit(g2,'t');step(g2,20);return g2.sounds.length>0&&g2.sounds.every(k=>/^r546(Sp|Atk)_lauren$/.test(k));})());
 // ---- 렉 ----
 g=env();A(g).qaRandom(()=>0);for(let i=0;i<60;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*4,10+Math.sin(i)*4,{hp:1e9}));for(let i=0;i<6;i++)g.room.props.push(prop('p'+i,10+Math.cos(i)*3,10+Math.sin(i)*3));
 const t0=process.hrtime.bigint();for(const k of ['meteor','violet','blue','red','repulse']){A(g).qaForce(k);heroHit(g,'m1');A(g).qaReset();g.time+=5.1;step(g,6);}step(g,24);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 console.log('  60 mobs, 5 procs, ~54 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('60 mobs stays cheap (< 150 ms in vm)',ms<150);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
}
console.log(`R940 lauren-celestial cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

// R951 CPU 검사: 네온 확률 발동 특수 패시브 '독전 회로'(사용자 2026-11-12 13:24Z).
// 네온 본인 타격 때만 확률로(0.35초에 한 번 굴림, 발동 뒤 6초 대기) 세 가지 중 하나가 저절로 나간다. 키는 늘리지 않는다.
//  ① 천공 낙뢰(화면 전역 민트 낙뢰, 가장 드묾·자체 30초 대기) ② 쌍갈래 뇌창(하늘에서 큰 두 갈래 전기창이 적에게 꽂힘) ③ 생화학 경보(방사능 표식 → 화면 전역 독안개)
// 화면 전역 기술은 피해 상한(대상 수·적마다 맞는 횟수)과 그리기 상한을 둔다. 영웅 인스턴스별 상태(R720 배치 영웅)도 확인한다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='neon-storm-r951.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('<script src="./'+F+'"></script>').length===2);
 ok('loads after hero-defense-r720 (deployed heroes) and before combat-r118',(()=>{const h=RT('index.html'),i=h.indexOf('./'+F+'"');return i>h.indexOf('./hero-defense-r720.js"')&&i<h.indexOf('<script src="./combat-r118.js"');})());
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r951\/r951-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('in runtime-inputs.json',JSON.stringify(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8'))).includes(F));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('only concentric radial gradients (3D recorder freeze, R946)',(()=>{const m=[...src.matchAll(/createRadialGradient\(([^)]*)\)/g)];return m.every(x=>{const a=x[1].split(',').map(s=>s.trim());return a.length===6&&a[0]===a[3]&&a[1]===a[4];});})());
 ok('reuses Neon Drive sheets (lightning strike, toxic mist)',/assets\/r562\/neon-lightning-strike\.webp/.test(src)&&/assets\/r562\/neon-toxic-mist\.webp/.test(src));
 function env(hero='neon'){const hits=[],moves=[],sounds=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}
  function blocked(x,y,r=.27){return false;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
  function damageable3(e){return true;}function clearLine(a,b){return true;}
  function attackPower(){return player.ap;}function storyAim22(){return 0;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v,s,by:player.id||player.hero,t:time});e.hp-=v;return true;}
  function sound(k){sounds.push(k);}
  function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var drawn=[],asked=[];function readyImage(p){return {image:{src:p,naturalWidth:1152,naturalHeight:768}};}function ensureImages(l){asked.push(...l);return Promise.resolve();}
  var scopes=[],grads=[],fills=0,strokes=0,alphaMax=0;var grad={addColorStop(){}};
  var ctx={translate(){},rotate(){},scale(){},setLineDash(){},drawImage(im,...a){drawn.push({src:im.src,a,alpha:ctx.globalAlpha});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},closePath(){},ellipse(){},arc(){},
   fill(){fills++;},stroke(){strokes++;},moveTo(){},lineTo(){},quadraticCurveTo(){},fillRect(){fills++;},createRadialGradient(...a){grads.push(a);return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_NEON_STORM_R951__;
 const heroHit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:player.hero})`,g);
 const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r951&&(!kind||h.s.kind==='r951-'+kind));
 const near=(a,b)=>Math.abs(a-b)<1e-9;
 let g=env();ok('API exposed',!!A(g)&&['inspect','qaForce','qaRandom','qaReset','set'].every(k=>typeof A(g)[k]==='function'));
 const tun=A(g).inspect().tuning;
 ok('tuning: chance 9%, roll gap .35 s, cooldown 6 s, storm own cooldown 30 s',tun.CHANCE===.09&&tun.ROLL_GAP===.35&&tun.ICD===6&&tun.STORM_CD===30);
 ok('storm is the rarest of the three',tun.WEIGHTS.storm<tun.WEIGHTS.fog&&tun.WEIGHTS.storm<tun.WEIGHTS.lance);
 ok('names are original (no referenced work names)',(()=>{const n=JSON.stringify(A(g).names);return !/텐가이|天元|gurren|롱기누스|longinus|에반|eva/i.test(n)&&!/텐가이|롱기누스|longinus|gurren/i.test(src);})());

 // ---- 확률·대기 ----
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>.99);for(let i=0;i<100;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll .99 → never procs',A(g).inspect().stats.procTotal===0&&A(g).inspect().stats.rolls>=25);
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>0);for(let i=0;i<130;i++){heroHit(g,'a');step(g,1,.1);}
 ok('roll 0 → procs at most once per 6 s (13 s → 3)',A(g).inspect().stats.procTotal===3);
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaRandom(()=>0);for(let i=0;i<5;i++)heroHit(g,'a');ok('multi-hit in one moment rolls once',A(g).inspect().stats.rolls===1);
 g=env();A(g).qaRandom(()=>.085);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .085 < .09 → procs',A(g).inspect().stats.procTotal===1);
 g=env();A(g).qaRandom(()=>.095);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('roll .095 → no proc (alone)',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>.095);g.room.enemies.push(mob('a',11,10),mob('b',10.5,11),mob('c',9,9.5),mob('d',10,11.5));heroHit(g,'a');ok('surrounded by 4 within 2 tiles → chance 12% (.095 procs)',A(g).inspect().stats.procTotal===1);
 g=env('lauren');A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));for(let i=0;i<20;i++){heroHit(g,'a');step(g,1,.4);}ok('other hero → never procs',A(g).inspect().stats.procTotal===0);
 g=env();A(g).qaRandom(()=>0);g.room.enemies.push(mob('a',11,10));vm.runInContext("hitEnemy(room.enemies[0],1,{kind:'ally',sourceHero:'lauren'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{owner:'enemy'})",g);vm.runInContext("hitEnemy(room.enemies[0],1,{coopIdR62:2})",g);
 ok('hits by other heroes / enemies / coop allies never roll',A(g).inspect().stats.rolls===0);
 g=env();A(g).qaRandom(()=>0);g.localStorage.setItem('storyworld.r951.neonStorm','{"on":false}');g.room.enemies.push(mob('a',11,10));heroHit(g,'a');step(g,40);ok('switch off → nothing',A(g).inspect().stats.procTotal===0&&procHits(g).length===0);
 g=env();A(g).qaRandom(()=>0);vm.runInContext('storyScene={}',g);g.room.enemies.push(mob('a',11,10));heroHit(g,'a');ok('story scene → no proc',A(g).inspect().stats.procTotal===0);
 // 가중치: 낙뢰 .12 → 굴림값 0 은 첫 칸
 {const w=tun.WEIGHTS,tot=w.lance+w.fog+w.storm;g=env();g.room.enemies.push(mob('a',11,10));let k=0;const seq=[0,(w.lance+w.fog+w.storm*.5)/tot];A(g).qaRandom(()=>seq[Math.min(k++,1)]);heroHit(g,'a');
  ok('weighted pick reaches storm at the top of the range',A(g).inspect().stats.procs.storm===1);}
 // 낙뢰는 30초 안에 다시 안 나옴(뽑혀도 뇌창으로 바뀜)
 g=env();g.room.enemies.push(mob('a',11,10));A(g).qaForce('storm');heroHit(g,'a');step(g,140,.05);A(g).qaReset();A(g).qaForce('storm');heroHit(g,'a');
 ok('storm again within 30 s turns into lance',A(g).inspect().stats.procs.storm===1&&A(g).inspect().stats.procs.lance===1);
 step(g,500,.05);A(g).qaReset();A(g).qaForce('storm');heroHit(g,'a');ok('storm allowed again after 30 s',A(g).inspect().stats.procs.storm===2);

 // ---- ② 쌍갈래 뇌창 ----
 g=env();A(g).qaForce('lance');{const t=mob('t',12,10),b=mob('b',13,12),c=mob('c',8,9),far=mob('far',19.5,10),B=mob('B',14,8,{boss:true});g.room.enemies.push(t,b,c,far,B);heroHit(g,'t');
  ok('lance: no damage before the spears land (telegraph)',procHits(g,'lance').length===0);
  step(g,4);ok('lance: still no damage at .2 s',procHits(g,'lance').length===0);
  step(g,40);const h=procHits(g,'lance');
  ok('lance: 6 spears fall',A(g).inspect().stats.lances===6);
  ok('lance: every enemy within 8 tiles is struck, 1.5×AP (=15) per spear',['t','b','c'].every(id=>h.some(x=>x.id===id&&near(x.v,15))));
  ok('lance: boss takes 1.0×AP (=10)',h.some(x=>x.id==='B'&&near(x.v,10))&&h.filter(x=>x.id==='B').every(x=>near(x.v,10)));
  ok('lance: enemy beyond 8 tiles untouched',!h.some(x=>x.id==='far'));
  ok('lance: each enemy struck at most twice',['t','b','c','B'].every(id=>h.filter(x=>x.id===id).length<=2));
  ok('lance: ends within ~2 s',!A(g).inspect().acts.length);}
 g=env();A(g).qaForce('lance');{const t=mob('t',12,10);g.room.enemies.push(t);heroHit(g,'t');step(g,60);const h=procHits(g,'lance');
  ok('lance: a lone enemy takes at most 2 spears (rest fall around it)',h.length===2&&A(g).inspect().stats.lances===6);}

 // ---- ③ 생화학 경보 ----
 g=env();A(g).qaForce('fog');{const a=mob('a',12,10),b=mob('b',4,6),far=mob('far',21,10),B=mob('B',10,15,{boss:true});g.room.enemies.push(a,b,far,B);heroHit(g,'a');
  ok('fog: hazard symbol first (act phase sign)',A(g).inspect().acts.some(x=>x.kind==='fog'&&x.phase==='sign'));
  step(g,10);ok('fog: no damage during the .6 s sign',procHits(g,'fog').length===0);
  step(g,100);const h=procHits(g,'fog');
  ok('fog: 8 ticks of .12×AP (=1.2) on every enemy within 9 tiles (bosses too)',['a','b','B'].every(id=>{const r=h.filter(x=>x.id===id);return r.length===8&&r.every(x=>near(x.v,1.2));}));
  ok('fog: enemy beyond 9 tiles untouched',!h.some(x=>x.id==='far'));
  ok('fog: over after ~4.6 s',!A(g).inspect().acts.length);}
 g=env();A(g).qaForce('fog');{for(let i=0;i<40;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*(1+i*.15),10+Math.sin(i)*(1+i*.15)));heroHit(g,'m0');step(g,120);
  const h=procHits(g,'fog'),per=new Map();for(const x of h)per.set(x.t,(per.get(x.t)||0)+1);ok('fog: at most 24 enemies per tick (40 present)',[...per.values()].every(n=>n<=24)&&h.length===24*8);}

 // ---- ① 천공 낙뢰 ----
 g=env();A(g).qaForce('storm');{const ms=[];for(let i=0;i<14;i++){const m=mob('s'+i,10+Math.cos(i*.9)*(1.5+i*.5),10+Math.sin(i*.9)*(1.5+i*.5));ms.push(m);}const far=mob('far',22,10),B=mob('B',11,9,{boss:true});g.room.enemies.push(...ms,far,B);heroHit(g,'s0');
  ok('storm: charge first, no damage in the first .4 s',(step(g,8),procHits(g,'storm').length===0));
  step(g,60);const h=procHits(g,'storm');
  ok('storm: 3 waves, at most 8 targets per wave',A(g).inspect().stats.stormWaves===3&&(()=>{const per=new Map();for(const x of h)per.set(x.t,(per.get(x.t)||0)+1);return per.size===3&&[...per.values()].every(n=>n<=8);})());
  ok('storm: mobs 1.1×AP (=11), boss .7×AP (=7)',h.filter(x=>x.id!=='B').every(x=>near(x.v,11))&&h.filter(x=>x.id==='B').every(x=>near(x.v,7))&&h.some(x=>x.id==='B'));
  ok('storm: no enemy struck more than 3 times; total ≤ 24 hits',h.length<=24&&[...new Set(h.map(x=>x.id))].every(id=>h.filter(x=>x.id===id).length<=3));
  ok('storm: spreads over the screen (≥ 14 distinct enemies struck)',new Set(h.map(x=>x.id)).size>=14);
  ok('storm: enemy beyond 9 tiles untouched',!h.some(x=>x.id==='far'));
  ok('storm: over after ~2.6 s',(step(g,20),!A(g).inspect().acts.length));}

 // ---- 그리기·성능 ----
 g=env();A(g).qaForce('storm');{for(let i=0;i<30;i++)g.room.enemies.push(mob('s'+i,10+Math.cos(i)*(1+i*.25),10+Math.sin(i)*(1+i*.25)));heroHit(g,'s0');let maxD=0,maxS=0;
  for(let i=0;i<50;i++){g.drawn.length=0;g.scopes.length=0;step(g,1);maxD=Math.max(maxD,g.drawn.length);maxS=Math.max(maxS,g.scopes.length);}
  ok('storm draw budget: ≤ 16 sheet draws and ≤ 40 scoped pieces per frame (30 enemies)',maxD>0&&maxD<=16&&maxS<=40);
  ok('every effect piece has a world anchor (ctx.scope with x,y)',g.scopes.every(s=>s.kind==='effect'&&Number.isFinite(s.x)&&Number.isFinite(s.y)));}
 g=env();A(g).qaForce('fog');{g.room.enemies.push(mob('a',12,10));heroHit(g,'a');let maxD=0,maxA=0;for(let i=0;i<90;i++){g.drawn.length=0;step(g,1);maxD=Math.max(maxD,g.drawn.length);for(const d of g.drawn)maxA=Math.max(maxA,d.alpha);}
  ok('fog draw budget: ≤ 12 mist puffs per frame',maxD>0&&maxD<=12);ok('fog stays see-through (sheet alpha ≤ .6)',maxA<=.6);
  ok('fog readable: tuning FOG_VEIL ≤ .25',A(g).inspect().tuning.FOG_VEIL<=.25);}
 g=env();A(g).qaForce('lance');{g.room.enemies.push(mob('a',12,10));heroHit(g,'a');let n=0;for(let i=0;i<40;i++){g.scopes.length=0;step(g,1);n=Math.max(n,g.scopes.length);}ok('lance draws (≥1 scoped piece) within budget (≤ 30)',n>=1&&n<=30);}

 // ---- 상황 변화 ----
 g=env();A(g).qaForce('fog');{g.room.enemies.push(mob('a',12,10));heroHit(g,'a');step(g,20);vm.runInContext("room={id:'z2',engaged:true,enemies:[{id:'n',x:11,y:10,hp:1e6,radius:.3}],props:[]}",g);step(g,60);
  ok('room change cancels running effects (no damage in the new room)',!A(g).inspect().acts.length&&!procHits(g,'fog').some(x=>x.id==='n'));}
 g=env();A(g).qaForce('storm');{g.room.enemies.push(mob('a',12,10));heroHit(g,'a');step(g,4);A(g).set(false);step(g,60);ok('switching off mid-cast cancels',!A(g).inspect().acts.length&&procHits(g,'storm').length===0);}

 // ---- 영웅 인스턴스별(R720 배치 네온) ----
 g=env('lauren');A(g).qaRandom(()=>0);{const t=mob('t',13,10);g.room.enemies.push(t);
  vm.runInContext("var bodyA={id:'A',hero:'neon',x:12,y:10,hp:100,ap:20},bodyB={id:'B',hero:'neon',x:12,y:12,hp:100,ap:30};function as(b,f){const p=player;player=b;try{return f();}finally{player=p;}}",g);
  A(g).qaForce('lance');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'neon'}))",g);
  A(g).qaForce('lance');vm.runInContext("as(bodyB,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'neon'}))",g);
  ok('deployed Neon bodies proc while the controlled hero is Lauren',A(g).inspect().stats.procTotal===2&&A(g).inspect().owners===2);
  step(g,60);const h=procHits(g,'lance');ok('damage uses each body\'s own attack power (A 30, B 45)',h.some(x=>near(x.v,30))&&h.some(x=>near(x.v,45)));
  vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'neon'}))",g);ok('body A still in its own cooldown',A(g).inspect().stats.procTotal===2);
  step(g,200);vm.runInContext("bodyA.hp=0",g);A(g).qaForce('fog');vm.runInContext("as(bodyA,()=>hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'neon'}))",g);ok('fallen body cannot proc',A(g).inspect().stats.procs.fog===0);}
 g=env();A(g).qaRandom(()=>0);A(g).qaForce('storm');{for(let i=0;i<8;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*1.5,10+Math.sin(i)*1.5));heroHit(g,'m0');step(g,60);ok('own proc damage never rolls a new proc',A(g).inspect().stats.rolls===1);}
 ok('no errors recorded',A(g).inspect().stats.errors===0);
}
console.log(`R951 neon storm: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

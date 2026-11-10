// R562 CPU 검사: 네온 Q 를 한 번 누르면 원래 연쇄 뒤에 ① 2차 감전(안 맞은 적으로, 최대 4줄, 0.25배) ② 독 주입(2초 4번 0.05배, 겹쳐 쌓이지 않음)
// ③ 독 장판(1.7칸 3초 0.03배)이 박자 있게 이어지는지, R 보스 낙인 폭발 자리에 큰 장판(한 시전에 한 번), 상한·끄기·다른 영웅·장면·지역 이동.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='neon-toxic-r562.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r562\/neon-toxic-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 function env(hero='neon'){const hits=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,specialCD:0};var room={id:'z1',engaged:true,enemies:[]};var effects=[];
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function damageable3(e){return true;}function clearLine(a,b){return true;}function attackPower(){return 10;}function rank(){return 0;}
  function hitEnemy(e,v,s){if(!e||e.hp<=0)return false;hits.push({id:e.id,v,s,t:time});e.hp-=v;return true;}
  // 원래 네온 Q: 10칸 안 7명까지 power(24) 로 동기 타격
  function special(){if(player.specialCD>0)return;player.specialCD=10;for(const v of liveEnemies().filter(v=>distance(v,player)<10).slice(0,7))hitEnemy(v,24);}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}
  function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var DOTS_ON=false,drawn=[];function readyImage(p){return (String(p).endsWith('r562/neon-lightning-strike.webp')||String(p).endsWith('r562/neon-toxic-mist.webp')||(DOTS_ON&&String(p).includes('r562/dots/')))?{image:{src:p}}:null;}
  var scopes=[];var grad={addColorStop(){}};var ctx={translate(){},rotate(){},scale(){},drawImage(im,sx,sy){drawn.push({src:im.src,sx,sy});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},createRadialGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_NEON_TOXIC_R562__;const by=(g,k)=>g.hits.filter(h=>h.s&&h.s.kind===k);
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function');
 // 몹 2명은 Q 사거리(10) 안, 바깥 11~12칸에 3명(2차 감전 대상), 아주 멀리 1명
 g.player.x=0;const a=mob('a',9,10),b=mob('b',9.8,10),c1=mob('c1',12.5,10),c2=mob('c2',14,10),c3=mob('c3',13,12),far=mob('far',40,40);g.room.enemies.push(a,b,c1,c2,c3,far);
 vm.runInContext('special()',g);ok('Q base hit only in-range targets (a,b)',g.hits.length===2);
 ok('Q targets poisoned at once',JSON.stringify(A(g).inspect().poisoned.sort())==='["a","b"]');
 step(g,4);ok('no second-stage arc before 0.30 s',by(g,'r562-arc').length===0);
 step(g,3);const arcs=by(g,'r562-arc');ok('arc jumps to un-hit neighbour within 3.5 tiles (one per source, 0.25×24=6)',arcs.length===1&&arcs[0].id==='c1'&&Math.abs(arcs[0].v-6)<1e-9);
 ok('lightning-strike sheet plays on the arc target',vm.runInContext('drawn',g).some(x=>/lightning-strike/.test(x.src)));
 ok('arc target gets poisoned too',A(g).inspect().poisoned.includes('c1'));ok('far enemy untouched',!g.hits.some(h=>h.id==='far'));
 step(g,6);ok('toxic pool laid at ~0.55 s at the centre of hit targets',A(g).inspect().pools.length===1&&Math.abs(A(g).inspect().pools[0].x-9.4)<1e-6&&A(g).inspect().pools[0].r===1.7);
 step(g,40);const pz=by(g,'r562-poison').filter(h=>h.id==='a');ok('poison: 4 ticks of 0.05×24=1.2 on a',pz.length===4&&pz.every(h=>Math.abs(h.v-1.2)<1e-9));
 ok('pool ticks are 0.03×24=0.72',by(g,'r562-pool').length>0&&by(g,'r562-pool').every(h=>Math.abs(h.v-.72)<1e-9));
 step(g,60);ok('pool expires after 3 s',A(g).inspect().pools.length===0);
 const extra=g.hits.filter(h=>h.s&&h.s.r562&&h.id==='a').reduce((s,h)=>s+h.v,0);console.log('  extra on a (in pool) =',extra.toFixed(2),'vs base 24 →',(extra/24*100).toFixed(0)+'%');
 ok('balance: extra damage on a pooled Q target ≤ 45% of base hit',extra<=24*.45);
 ok('all chain damage is friendly hero damage',g.hits.filter(h=>h.s&&h.s.r562).every(h=>h.s.friendly===true&&h.s.owner==='hero'));
 // 다시 맞으면 새로 걸림(겹쳐 쌓이지 않음)
 g=env();const s1=mob('s',12,10);g.room.enemies.push(s1);vm.runInContext('special()',g);step(g,10);vm.runInContext('player.specialCD=0;special()',g);step(g,60);
 const ps=by(g,'r562-poison');ok('poison refreshes instead of stacking (≤ 6 ticks over two casts 0.5 s apart)',ps.length<=6&&ps.length>=5);
 // 상한: 장판 3개, 독 24명
 g=env();for(let i=0;i<40;i++)g.room.enemies.push(mob('m'+i,10+(i%7)*.3,10+Math.floor(i/7)*.3));for(let k=0;k<5;k++){vm.runInContext('player.specialCD=0;special()',g);step(g,12);}
 ok('pools capped at 3',A(g).inspect().pools.length<=3);ok('poisoned capped at 24',A(g).inspect().poisoned.length<=24);
 const t0=process.hrtime.bigint();step(g,24);const ms=Number(process.hrtime.bigint()-t0)/1e6;console.log('  40 mobs, 3 pools, 24 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('cheap (< 150 ms in vm)',ms<150);
 ok('mist sheet drawn on pools, lightning sheet on arc targets (192 cells inside 6×4)',(()=>{const d=vm.runInContext('drawn',g);return d.some(x=>/toxic-mist/.test(x.src))&&d.every(x=>x.sx%192===0&&x.sy%192===0&&x.sx<1152&&x.sy<768);})());
 ok('sheet assets shipped (< 400 KB each)',['neon-lightning-strike','neon-toxic-mist'].every(n=>{try{return fs.statSync(path.join(R,'runtime-text','assets','r562',n+'.webp')).size<400000;}catch(_){return false;}}));
 ok('drawn with ctx.scope owners (ground groundAligned)',(()=>{const s=vm.runInContext('scopes',g);return s.some(o=>/:ground$/.test(o.id)&&o.groundAligned)&&s.every(o=>o.kind==='effect');})());
 // Dots NE-01(번개 한 줄)·NE-02(독 웅덩이) 시트가 있으면 그것으로: 번개는 두 적 사이로 돌려 늘이고, 장판은 바닥 시트 + 금빛 회로 고리
 {const h=env();vm.runInContext('DOTS_ON=true',h);h.player.x=0;h.room.enemies.push(mob('a',9,10),mob('b',9.8,10),mob('c1',12.5,10));vm.runInContext('special()',h);step(h,7);
  let d=vm.runInContext('drawn',h);ok('Dots chain sheet drawn for the second-stage arc',d.some(x=>/dots\/neon-chain/.test(x.src)));
  step(h,6);step(h,4);d=vm.runInContext('drawn',h);const pd=d.filter(x=>/dots\/neon-toxic-pool/.test(x.src));
  ok('Dots pool sheet drawn on the ground (256 cells, loop 0..19), mist sheet not stacked on top',pd.length>0&&pd.every(x=>x.sx%256===0&&x.sy%256===0&&(x.sx/256+6*x.sy/256)<20)&&!d.some(x=>/toxic-mist/.test(x.src)));
  ok('Dots NE-03 bubble ring back+front around poisoned mobs',d.some(x=>/neon-bubble-ring-back/.test(x.src))&&d.some(x=>/neon-bubble-ring-front/.test(x.src)));
  ok('arc stays drawn 0.6 s for the sheet but damage was dealt once',by(h,'r562-arc').length===1);}
 ok('Dots sheets shipped (assets/r562/dots, < 400 KB each)',['neon-chain','neon-toxic-pool','neon-bubble-ring-back','neon-bubble-ring-front'].every(n=>{try{return fs.statSync(path.join(R,'runtime-text','assets','r562','dots',n+'.webp')).size<400000;}catch(_){return false;}}));
 // R 보스 낙인 → 큰 장판, 같은 시전 두 번 release 여도 한 번
 g=env();g.room.enemies.push(mob('t',13,10));
 vm.runInContext(`fx('storySourceSkill',13,10,{storyWER:true,stage:'release',sourceHero:'neon',sourceSlot:'r',castId:'wer:1'});fx('storySourceSkill',13,10,{storyWER:true,stage:'release',sourceHero:'neon',sourceSlot:'r',castId:'wer:1'})`,g);
 step(g,10);ok('R mark → one big pool (2.2) after 0.7 s',A(g).inspect().pools.length===0);step(g,6);ok('…laid',A(g).inspect().pools.length===1&&A(g).inspect().pools[0].big&&A(g).inspect().pools[0].r===2.2&&A(g).inspect().stats.rPools===1);
 vm.runInContext(`fx('storySourceSkill',13,10,{storyWER:true,stage:'release',sourceHero:'neon',sourceSlot:'w',castId:'wer:2'})`,g);step(g,20);ok('W release → no pool',A(g).inspect().stats.rPools===1&&A(g).inspect().stats.pools===1);
 // 다른 영웅·끄기·장면·지역 이동
 g=env('lauren');g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,40);ok('other hero → nothing',A(g).inspect().stats.qCasts===0&&!g.hits.some(h=>h.s&&h.s.r562));
 g=env();g.localStorage.setItem('storyworld.r562.toxic','{"on":false}');g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,40);ok('switch off → nothing',!g.hits.some(h=>h.s&&h.s.r562));
 g=env();g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);vm.runInContext('storyScene={}',g);step(g,40);ok('story scene cancels chain',!g.hits.some(h=>h.s&&h.s.r562));
 g=env();g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,2);vm.runInContext("room={id:'z2',engaged:true,enemies:[]}",g);step(g,40);ok('room change cancels',A(g).inspect().pools.length===0&&A(g).inspect().poisoned.length===0);
 g=env();vm.runInContext('special()',g);step(g,20);ok('Q with no target → no chain',A(g).inspect().stats.qCasts===0);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
 // 사몽 발현(R571) 중: 장판 1.7칸×1.77, 2차 감전 3.5칸×1.77
 g=env();vm.runInContext("window.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>true,range:r=>r*1.77,cd:s=>s*.23,chance:c=>c}",g);g.player.x=0;g.room.enemies.push(mob('a',9,10),mob('d6',15,10));vm.runInContext('special()',g);step(g,13);ok('surge: pool radius ×1.77',A(g).inspect().pools.length===1&&Math.abs(A(g).inspect().pools[0].r-1.7*1.77)<1e-9);ok('surge: arc reaches 6 tiles (outside 3.5, inside 6.2)',by(g,'r562-arc').some(h=>h.id==='d6'));
 // 사몽 발현 문양: R572 neon 문양 draw 를 Dots CX-0064T 시트로 감쌈(시트 없으면 원래 코드 그림)
 g=env();vm.runInContext("var themeCalls=0;var TH={draw(){themeCalls++;}};window.__STORYWORLD_SAMONG_THEME_R572__={theme:h=>h==='neon'?TH:null}",g);step(g,1);
 vm.runInContext("TH.draw('back',100,200,70,0,1,1,false)",g);ok('sigil: no sheet yet → original R572 code draw',vm.runInContext('themeCalls',g)===1);
 vm.runInContext("DOTS_ON=true;drawn.length=0;TH.draw('back',100,200,70,0,1,1,false);TH.draw('front',100,200,70,0,1,1,false)",g);
 ok('sigil: back+front drawn from neon-sigil sheets, R572 code skipped',vm.runInContext('themeCalls',g)===1&&vm.runInContext('drawn',g).filter(d=>/neon-sigil-(back|front)/.test(d.src)).length>=2&&vm.runInContext('drawn',g).every(d=>d.sx<1152&&d.sy<768));
 vm.runInContext("TH.draw('mark',100,200,70,0,1,1,false)",g);ok('sigil: other layers untouched',vm.runInContext('themeCalls',g)===2);
 ok('sigil sheets shipped (< 200 KB each)',['back','front'].every(L=>{const f=path.join(R,'runtime-text','assets','r562','dots','neon-sigil-'+L+'.webp');return fs.existsSync(f)&&fs.statSync(f).size<200000;}));
}
console.log(`R562 neon-toxic cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

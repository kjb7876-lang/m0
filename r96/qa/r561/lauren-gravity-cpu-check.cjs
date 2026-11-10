// R561 CPU 검사: 라우렌 Q 를 한 번 누르면 원래 잔향 결계 뒤에 중력 특이점(끌어당김 1.1초) → 붕괴 폭발(Q 위력 0.35배)이 저절로 이어지는지,
// R 진명 심판 맞은 자리마다 압축 소용돌이(끌기만, 3개 상한)가 생기는지. 보스는 안 끌림, 벽은 못 넘음, 다른 영웅·끄기·장면·지역 이동 땐 없음.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='lauren-gravity-r561.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r561\/lauren-gravity-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));
 ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));
 ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 function env(hero='lauren'){const hits=[],moves=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,target=null;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,specialCD:0};var room={id:'z1',engaged:true,enemies:[]};var effects=[];var wall=null;
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function nearestEnemy(r=1e9){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
  function blocked(x,y,r){return wall!=null&&x>wall;}
  function moveActor(a,dx,dy,r=.27){moves.push(a.id);if(!blocked(a.x+dx,a.y,r))a.x+=dx;if(!blocked(a.x,a.y+dy,r))a.y+=dy;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}
  function damageable3(e){return true;}function clearLine(a,b){return true;}
  function attackPower(){return 10;}function rank(){return 0;}function storyAim22(){return 0;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v,s});e.hp-=v;return true;}
  function special(){if(player.specialCD>0)return;player.specialCD=10;}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}
  function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var SHEETS_ON=false,drawn=[];function readyImage(p){return SHEETS_ON&&String(p).includes('r561/lauren/')?{image:{src:p}}:null;}
  var scopes=[];var grad={addColorStop(){}};var ctx={translate(){},scale(){},drawImage(im,sx,sy){drawn.push({src:im.src,sx,sy});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},createRadialGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_LAUREN_GRAVITY_R561__;
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function');
 // 정상: Q → 특이점이 가장 가까운 적 자리에 열림
 const near=mob('a',12,10),out1=mob('b',15,10),side=mob('c',12,13),far=mob('d',20,10),boss=mob('B',12,8.2,{boss:true});g.room.enemies.push(near,out1,side,far,boss);
 vm.runInContext('special()',g);let w=A(g).inspect().well;ok('Q opens one gravity well at nearest enemy',w&&w.x===12&&w.y===10&&A(g).inspect().stats.wells===1);
 const d0=Math.hypot(out1.x-12,out1.y-10),dSide0=Math.hypot(side.x-12,side.y-10);
 step(g,10);ok('mobs inside 4.6 tiles are pulled toward the centre',Math.hypot(out1.x-12,out1.y-10)<d0-.3&&Math.hypot(side.x-12,side.y-10)<dSide0-.3);
 ok('mob outside 4.6 tiles stays',far.x===20&&far.y===10);ok('boss is never pulled',boss.x===12&&boss.y===8.2);
 step(g,30);ok('pull never goes inside the core (0.55)',Math.hypot(out1.x-12,out1.y-10)>=.55-1e-9&&Math.hypot(side.x-12,side.y-10)>=.55-1e-9);
 const cHits=g.hits.filter(h=>h.s&&h.s.kind==='r561-collapse');ok('collapse hits once per enemy in 2.4 tiles with 0.35×Q power (=8.4)',cHits.length>=3&&cHits.every(h=>Math.abs(h.v-8.4)<1e-9)&&new Set(cHits.map(h=>h.id)).size===cHits.length);
 ok('collapse also hits boss (damage only)',cHits.some(h=>h.id==='B'));ok('far enemy not hit',!cHits.some(h=>h.id==='d'));
 ok('collapse source is friendly hero damage',cHits.every(h=>h.s.friendly===true&&h.s.owner==='hero'));
 step(g,20);ok('well clears after ~1.75 s and sentinel removed',!A(g).inspect().well&&vm.runInContext('effects.filter(e=>e.r561Sentinel).length',g)===0);
 ok('drawn with ctx.scope owners (disk groundAligned + core)',(()=>{const s=vm.runInContext('scopes',g);return s.some(o=>/:disk$/.test(o.id)&&o.groundAligned)&&s.some(o=>/:core$/.test(o.id))&&s.every(o=>o.kind==='effect');})());
 ok('no sheets loaded → code drawing only (no drawImage)',vm.runInContext('drawn.length',g)===0);
 // Dots 시트(CX-0059S LA-01·02·03): 뒤층·앞층 → 붕괴 시트 → 끝, R 소용돌이는 바닥 시트. 칸 256, 6×4 안.
 {const h=env();vm.runInContext('SHEETS_ON=true',h);h.room.enemies.push(mob('a',12,10),mob('b',13,10));vm.runInContext('special()',h);step(h,8);
  let d=vm.runInContext('drawn',h),s=vm.runInContext('scopes',h);
  ok('Dots well: back + front layers drawn while pulling, no code disk',d.some(x=>/well-back/.test(x.src))&&d.some(x=>/well-front/.test(x.src))&&s.some(o=>/:back$/.test(o.id))&&s.some(o=>/:front$/.test(o.id))&&!s.some(o=>/:disk$/.test(o.id)));
  step(h,30);d=vm.runInContext('drawn',h);const col=d.filter(x=>/collapse/.test(x.src));
  ok('Dots collapse sheet takes over before the hit and plays past the well end (hit frame 6 at collapse)',col.length>=8&&col.some(x=>x.sx===0&&x.sy===256)&&vm.runInContext('effects.filter(e=>e.r561Sentinel).length',h)===1);
  step(h,20);ok('collapse sheet ends and sentinel removed',vm.runInContext('effects.filter(e=>e.r561Sentinel).length',h)===0);
  vm.runInContext("player.specialCD=0;fx('storySourceSkill',14,10,{storyWER:true,stage:'release',sourceHero:'lauren',sourceSlot:'r',castId:'k1'})",h);step(h,3);
  d=vm.runInContext('drawn',h);s=vm.runInContext('scopes',h);ok('Dots crush vortex drawn flat on the ground',d.some(x=>/crush-vortex/.test(x.src))&&s.some(o=>/:vortex$/.test(o.id)&&o.groundAligned));
  ok('all sheet cells are 256-aligned inside 1536×1024',d.length>0&&d.every(x=>x.sx%256===0&&x.sy%256===0&&x.sx<1536&&x.sy<1024));}
 ok('Dots sheets shipped (runtime-text/assets/r561/lauren/*.webp, each < 400 KB)',['lauren-gravity-well-back','lauren-gravity-well-front','lauren-collapse','lauren-crush-vortex'].every(n=>{try{return fs.statSync(path.join(R,'runtime-text','assets','r561','lauren',n+'.webp')).size<400000;}catch(_){return false;}}));
 // 쿨다운 중 Q → 새 특이점 없음
 vm.runInContext('special()',g);ok('Q on cooldown → no new well',A(g).inspect().stats.wells===1);
 // 적 없음 → 앞 3.4칸
 g=env();vm.runInContext('special()',g);w=A(g).inspect().well;ok('no enemy → well 3.4 tiles ahead',w&&Math.abs(w.x-13.4)<1e-9&&w.y===10);
 // 벽 경계: 벽 너머로 끌려가지 않음
 g=env();g.wall=12;const wm=mob('w',10.5,10.4);g.room.enemies.push(mob('n',14,10),wm);g.player.x=13;g.player.y=10;vm.runInContext('special()',g);step(g,30);ok('pull goes through moveActor (walls respected: stops at the wall line)',g.moves.includes('w')&&wm.x<=12&&wm.x>11);
 // R 진명 심판 연계: release 마다 압축 소용돌이, 3개 상한
 g=env();const v1=mob('v',12,10),pulled=mob('p',13.5,10);g.room.enemies.push(v1,pulled);
 for(let i=0;i<5;i++)vm.runInContext(`fx('storySourceSkill',12,10,{storyWER:true,stage:'release',sourceHero:'lauren',sourceSlot:'r'})`,g);
 ok('R release spawns crush vortices, capped at 3',A(g).inspect().crushes.length===3&&A(g).inspect().stats.crushes===5);
 step(g,8);ok('crush pulls nearby mob',pulled.x<13.5-.2);ok('crush deals no damage',g.hits.length===0);
 vm.runInContext(`fx('storySourceSkill',12,10,{storyWER:true,stage:'release',sourceHero:'lauren',sourceSlot:'w'})`,g);vm.runInContext(`fx('storySourceSkill',12,10,{storyWER:true,stage:'warning',sourceHero:'lauren',sourceSlot:'r'})`,g);
 ok('W release / R warning do not spawn',A(g).inspect().stats.crushes===5);
 step(g,20);ok('crushes clear',A(g).inspect().crushes.length===0);
 // 다른 영웅·끄기·장면·지역 이동
 g=env('neon');g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);ok('other hero → nothing',!A(g).inspect().well&&A(g).inspect().stats.wells===0);
 g=env();g.localStorage.setItem('storyworld.r561.gravity','{"on":false}');g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,40);ok('switch off → nothing',A(g).inspect().stats.wells===0&&g.hits.length===0);
 g=env();g.room.enemies.push(mob('a',12,10),mob('b',14,10));vm.runInContext('special()',g);vm.runInContext('storyScene={}',g);step(g,40);ok('story scene opening cancels (no collapse)',A(g).inspect().stats.collapses===0);
 g=env();g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,2);vm.runInContext("room={id:'z2',engaged:true,enemies:[]}",g);step(g,40);ok('room change cancels',A(g).inspect().stats.collapses===0&&!A(g).inspect().well);
 g=env();g.room.enemies.push(mob('a',12,10));vm.runInContext('special()',g);step(g,2);g.player.hp=0;step(g,40);ok('hero down cancels',A(g).inspect().stats.collapses===0);
 // 렉: 몹 60마리 1초 끌기 비용
 g=env();for(let i=0;i<60;i++)g.room.enemies.push(mob('m'+i,10+Math.cos(i)*4,10+Math.sin(i)*4));vm.runInContext('special()',g);const t0=process.hrtime.bigint();step(g,24);const ms=Number(process.hrtime.bigint()-t0)/1e6;
 console.log('  60 mobs, 24 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('60 mobs × 24 ticks stays cheap (< 120 ms in vm)',ms<120);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
 // 사몽 발현(R571) 중: 끌림 반경 4.6×1.77(최대 2배)
 g=env();vm.runInContext("window.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>true,range:r=>r*1.77,cd:s=>s*.23,chance:c=>c}",g);{const n=mob('n',12,10),m=mob('m',19.5,10);g.room.enemies.push(n,m);vm.runInContext('special()',g);ok('surge: well remembers range ×1.77',Math.abs(A(g).inspect().well.k-1.77)<1e-9);step(g,6);ok('surge: mob at 7.5 tiles (outside 4.6, inside 8.1) is pulled',m.x<19.5-.1);}
 g=env();vm.runInContext("window.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>true,range:r=>r*9}",g);vm.runInContext('special()',g);g.room.enemies.push(mob('n',12,10));ok('surge range capped at 2×',!A(g).inspect().well||A(g).inspect().well.k<=2);
}
console.log(`R561 lauren-gravity cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

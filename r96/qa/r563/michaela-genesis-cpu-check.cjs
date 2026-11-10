// R563 CPU 검사: 미카엘라 R 세라핌 대정화 뒤 하늘 열림(+0.2) → 빛기둥 8개(+0.55부터 0.1초 간격, 1.4칸, R 위력 0.3배, 한 적 2번까지) → 큰 기둥(+1.4, 피해 없음),
// Q 성흔 정화 뒤 가까운 적 3명 위 작은 기둥(0.15배). 십자가 그림 없음, 상한, 끄기·다른 영웅·장면·지역 이동.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='michaela-genesis-r563.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r563\/michaela-genesis-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));ok('no save writes; only hero hp write is the capped grand-pillar heal',!/saveGame/.test(src)&&(src.match(/player\.hp\s*=[^=]/g)||[]).length===1&&/player\.hp=Math\.min\(m,player\.hp\+m\*k\)/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 ok('no cross sprite / no flipY / no rotate (upright-cross rule)',!/'cross'|"cross"|flipY|scale\(\s*1\s*,\s*-1|\.rotate\(/.test(src));
 function env(hero='michaela'){const hits=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34;
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,specialCD:0};var room={id:'z1',engaged:true,enemies:[]};var effects=[];
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function damageable3(e){return true;}function clearLine(a,b){return true;}function attackPower(){return 10;}function maxHP(){return 200;}var floats=[];function floatText(t){floats.push(t);}function rank(){return 0;}
  function hitEnemy(e,v,s){if(!e||e.hp<=0)return false;hits.push({id:e.id,v,s,t:time});e.hp-=v;return true;}
  function special(){if(player.specialCD>0)return;player.specialCD=10;}
  function fx(type,x,y,opt={}){effects.push({type,x,y,age:0,life:.4,...opt});}function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var DOTS_ON=false,drawn=[];function readyImage(p){return DOTS_ON&&String(p).includes('r563/dots/')?{image:{src:p}}:null;}
  var scopes=[];var grad={addColorStop(){}};var ctx={drawImage(im,sx,sy){drawn.push({src:im.src,sx,sy});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},createRadialGradient(){return grad;},createLinearGradient(){return grad;},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick();for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_MICHAELA_GENESIS_R563__;const by=(g,k)=>g.hits.filter(h=>h.s&&h.s.kind===k);
 const R_=g=>vm.runInContext(`fx('storySourceSkill',player.x,player.y,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'r',castId:'wer:'+time})`,g);
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function');
 const a=mob('a',12,10),b=mob('b',12.3,10.2),c=mob('c',8,13),far=mob('far',19,10);g.room.enemies.push(a,b,c,far);
 R_(g);step(g,5);ok('sky opens at ~0.2 s, no pillar yet',A(g).inspect().skies===1&&A(g).inspect().stats.pillars===0);
 step(g,8);ok('pillars start at ~0.55 s',A(g).inspect().stats.pillars>=1);
 step(g,13);ok('8 pillars by ~1.3 s',A(g).inspect().stats.pillars===8);
 const ph=by(g,'r563-pillar');ok('pillar damage = 0.3×attackPower (3)',ph.length>0&&ph.every(h=>Math.abs(h.v-3)<1e-9));
 const per=id=>ph.filter(h=>h.id===id).length;ok('each enemy hit at most 2 times per cast',['a','b','c'].every(id=>per(id)<=2)&&per('a')===2);
 ok('enemy outside 8 tiles not hit',per('far')===0);
 step(g,3);ok('grand pillar at ~1.4 s on Michaela, no damage',A(g).inspect().stats.grand===1&&by(g,'r563-grand').length===0);
 ok('grand pillar heals 4% max HP once (100 → 108)',g.player.hp===108&&vm.runInContext('floats.length',g)===1);
 ok('pillar draws use scope owners (beam + ground)',(()=>{const s=vm.runInContext('scopes',g);return s.some(o=>/:beam$/.test(o.id))&&s.some(o=>/:ground$/.test(o.id)&&o.groundAligned)&&s.every(o=>o.kind==='effect');})());
 ok('no Dots sheets → code drawing only',vm.runInContext('drawn.length',g)===0);
 {const h=env();vm.runInContext('DOTS_ON=true',h);h.room.enemies.push(mob('a',12,10),mob('b',13,11));
  vm.runInContext("fx('storySourceSkill',player.x,player.y,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'r',castId:'d1'})",h);step(h,40);
  const d=vm.runInContext('drawn',h),s2=vm.runInContext('scopes',h);
  ok('Dots halo (MI-01), pillar (MI-02 r2) and grand pillar (MI-03) sheets drawn, cells 256-aligned in 6×4',d.some(x=>/michaela-halo/.test(x.src))&&d.some(x=>/michaela-pillar/.test(x.src))&&d.some(x=>/michaela-grand-pillar/.test(x.src))&&d.every(x=>x.sx%256===0&&x.sy%256===0&&x.sx<1536&&x.sy<1024));
  ok('with the pillar sheet the code ground ring is not doubled, beam kept for the sky part',!s2.some(o=>/:ground$/.test(o.id))&&s2.some(o=>/:beam$/.test(o.id))&&s2.some(o=>/:sheet$/.test(o.id)));}
 ok('Dots sheets shipped (assets/r563/dots, < 400 KB each)',['michaela-halo','michaela-pillar','michaela-grand-pillar'].every(n=>{try{return fs.statSync(path.join(R,'runtime-text','assets','r563','dots',n+'.webp')).size<400000;}catch(_){return false;}}));
 step(g,40);ok('everything clears ~2 s later',A(g).inspect().pillars.length===0&&A(g).inspect().skies===0&&vm.runInContext('effects.filter(e=>e.r563Sentinel).length',g)===0);
 const extra=g.hits.filter(h=>h.id==='a').reduce((s,h)=>s+h.v,0);console.log('  R extra on a =',extra,'vs base R 1.5×10=15 →',(extra/15*100).toFixed(0)+'%');ok('balance: R extra ≤ 45% of base R hit',extra<=15*.45);
 // 치유는 최대치까지만
 g=env();g.player.hp=199;R_(g);step(g,40);ok('heal capped at max HP',g.player.hp===200);
 // 같은 시전 두 번 warning → 한 번만
 g=env();vm.runInContext(`fx('storySourceSkill',10,10,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'r',castId:'x1'});fx('storySourceSkill',10,10,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'r',castId:'x1'})`,g);step(g,40);ok('one chain per cast id',A(g).inspect().stats.rCasts===1&&A(g).inspect().stats.pillars===9);
 vm.runInContext(`fx('storySourceSkill',10,10,{storyWER:true,stage:'warning',sourceHero:'michaela',sourceSlot:'w',castId:'x2'})`,g);step(g,40);ok('W → nothing',A(g).inspect().stats.rCasts===1);
 // 적 없을 때 둘레 빈자리에 기둥(피해 없음)
 ok('no enemies → pillars still fall around (no hits)',g.hits.length===0);
 // Q
 g=env();g.room.enemies.push(mob('a',11,10),mob('b',10,12.5),mob('c',7.5,8),mob('d',15,10),mob('far',30,10));vm.runInContext('special()',g);step(g,4);ok('Q: no pillar before 0.25 s',A(g).inspect().stats.pillars===0);
 step(g,10);const qh=by(g,'r563-q-pillar');ok('Q: 3 small pillars on the 3 nearest (0.15×24=3.6)',A(g).inspect().stats.pillars===3&&['a','b','c'].every(id=>qh.some(h=>h.id===id))&&!qh.some(h=>h.id==='d'||h.id==='far')&&qh.every(h=>Math.abs(h.v-3.6)<1e-9));
 vm.runInContext('special()',g);step(g,20);ok('Q on cooldown → no new pillars',A(g).inspect().stats.qCasts===1);
 // 상한
 g=env();for(let i=0;i<30;i++)g.room.enemies.push(mob('m'+i,10+(i%6),10+Math.floor(i/6)));for(let k=0;k<4;k++){R_(g);vm.runInContext('player.specialCD=0;special()',g);step(g,3);}step(g,10);
 ok('pillars on screen capped at 12',A(g).inspect().pillars.length<=12);
 const t0=process.hrtime.bigint();step(g,24);const ms=Number(process.hrtime.bigint()-t0)/1e6;console.log('  30 mobs, 4 stacked casts, 24 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('cheap (< 150 ms in vm)',ms<150);
 // 다른 영웅·끄기·장면·지역
 g=env('neon');g.room.enemies.push(mob('a',11,10));R_(g);vm.runInContext('special()',g);step(g,40);ok('other hero → nothing',A(g).inspect().stats.pillars===0);
 g=env();g.localStorage.setItem('storyworld.r563.genesis','{"on":false}');g.room.enemies.push(mob('a',11,10));R_(g);vm.runInContext('special()',g);step(g,40);ok('switch off → nothing',A(g).inspect().stats.pillars===0&&g.hits.length===0);
 g=env();g.room.enemies.push(mob('a',11,10));R_(g);vm.runInContext('storyScene={}',g);step(g,40);ok('story scene cancels',A(g).inspect().stats.pillars===0);
 g=env();g.room.enemies.push(mob('a',11,10));R_(g);step(g,2);vm.runInContext("room={id:'z2',engaged:true,enemies:[]}",g);step(g,40);ok('room change cancels',A(g).inspect().stats.pillars===0);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
}
console.log(`R563 michaela-genesis cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

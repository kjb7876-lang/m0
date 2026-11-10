// R564 CPU 검사: 윤서하 W 가속 중 잔상(0.1초 간격, 움직일 때만), Q 뒤 평행세계 분신 2명(+0.15 등장, +0.3 각자 한 발 0.25배, +0.75 사라짐),
// R 뒤 6칸 시간 정지 1.6초(보스 제외, 멈춘 몹·탄은 피해 못 줌, 적 탄은 멈췄다가 다시 날아감), 상한·끄기·다른 영웅·장면·지역 이동.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='seoha-chrono-r564.js';const exists=fs.existsSync(path.join(R,'client-source',F));ok(F+' exists',exists);
if(exists){
 const src=C(F);
 ok('runtime copy matches source',fs.existsSync(path.join(R,'runtime-text',F))&&src===RT(F));
 try{new vm.Script(src);ok('syntax',true);}catch(e){ok('syntax '+e.message,false);}
 ok('script tag once',RT('index.html').split('"./'+F+'"').length===2);
 ok('listed in verify-r96-public.py',new RegExp("'"+F.replace(/\./g,'\\.')+"'").test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8')));
 ok('CI runs this check',/qa\/r564\/seoha-chrono-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
 ok('no new key bindings',!/addEventListener\(\s*['"]key/.test(src));ok('no save writes / hero hp writes',!/saveGame|player\.hp\s*=[^=]/.test(src));
 ok('no ctx.filter blur/drop-shadow',!/drop-shadow|blur\(/.test(src));ok('Mammon zones not touched',!/ep1b06|mammon/i.test(src));
 function env(hero='seoha'){const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,hurts=[],shots=[],ghosts=[];
  var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,specialCD:0,direction:'front',moving:false,storyWER:{ready:{},buffs:{}}};var room={id:'z1',engaged:true,enemies:[]};var effects=[];var projectiles=[];
  var heroArt={seoha:{dash:{front:'dash-front',left:'dash-left'},attack:{front:'atk-front',right:'atk-right',left:'atk-left',back:'atk-back'}}};var VFX={flare:'flare'};
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}function liveEnemies(){return room.enemies.filter(e=>e.hp>0&&(!e.boss||room.engaged));}
  function nearestEnemy(r=1e9){let b=null,d=r;for(const e of liveEnemies()){const q=distance(e,player);if(q<d){d=q;b=e;}}return b;}
  function majorActor3(e){return !!e&&(e.boss===true||e.midboss===true);}function facing(x,y){return x>=0?'right':'left';}
  function attackPower(){return 10;}function rank(){return 0;}function storyAim22(){return 0;}
  function makeShot(x,y,a,sp,dmg,opt){const b={x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,damage:dmg,...opt};shots.push(b);return b;}
  function hurt(d,s){hurts.push({d,s});player.hp-=0;return 'hit';}
  function special(){if(player.specialCD>0)return;player.specialCD=10;}
  function fx(type,x,y,opt={}){if(type==='ghost')ghosts.push({x,y,...opt,at:time});effects.push({type,x,y,age:0,life:.4,...opt});}
  // 엔진 몹 걸음 흉내: 매 tick 영웅 쪽으로 0.1 칸, cd 감소, 탄 이동
  function tick(dt=.05){for(const e of room.enemies){if(e.hp<=0||e.speed===0)continue;const d=distance(e,player);if(d>1){e.x+=(player.x-e.x)/d*.1;e.y+=(player.y-e.y)/d*.1;}e.cd=Math.max(0,(e.cd||0)-dt);}
   for(const b of projectiles){b.x+=b.vx*dt;b.y+=b.vy*dt;}}
  function drawEffect(e){}function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var SHEETS_ON=false,drawn=[];function readyImage(p){return SHEETS_ON&&String(p).includes('r564/')?{image:{src:p}}:null;}
  var scopes=[];var ctx={drawImage(im,sx,sy){drawn.push({src:im.src,sx,sy});},globalAlpha:1,globalCompositeOperation:'source-over',save(){},restore(){},beginPath(){},ellipse(){},fill(){},stroke(){},moveTo(){},lineTo(){},closePath(){},scope(o,f){scopes.push(o);f();}};`,g);
  vm.runInContext(src,g);return g;}
 const mob=(id,x,y,extra={})=>({id,x,y,hp:1000,maxHp:1000,radius:.3,cd:0,spawnState:'active',...extra});
 const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';tick(.05);for(const e of effects.slice())drawEffect(e)',g);}};
 const A=g=>g.__STORYWORLD_SEOHA_CHRONO_R564__;const V=(g,s)=>vm.runInContext(s,g);
 const R_=g=>V(g,`fx('storySourceSkill',player.x,player.y,{storyWER:true,stage:'warning',sourceHero:'seoha',sourceSlot:'r',castId:'wer:'+time})`);
 let g=env();ok('API exposed',!!A(g)&&typeof A(g).inspect==='function');
 // W 가속 잔상
 V(g,'player.storyWER.buffs.hasteUntil=3;player.moving=true');step(g,20);let gh=V(g,'ghosts.filter(x=>x.r564)');
 ok('haste + moving → afterimages every ~0.1 s (8–11 in 1 s)',gh.length>=8&&gh.length<=11&&gh.every(x=>x.asset==='dash-front'&&Math.abs(x.life-.36)<1e-9));
 V(g,'player.moving=false');step(g,10);ok('standing still → no new afterimage',V(g,'ghosts.filter(x=>x.r564).length')===gh.length);
 V(g,'player.moving=true');step(g,60);const after=V(g,'ghosts.filter(x=>x.r564&&x.at>3.05).length');ok('haste over (3 s) → afterimages stop',after===0);
 // Q 분신
 g=env();const e1=mob('a',15,10),e2=mob('b',15,14);g.room.enemies.push(e1,e2);V(g,'special()');step(g,2);ok('Q: no clone before 0.15 s',A(g).inspect().clones.length===0);
 step(g,2);let cl=A(g).inspect().clones;ok('Q: two clones 1.5 tiles to each side (perpendicular to aim)',cl.length===2&&cl.every(c=>Math.abs(Math.hypot(c.x-10,c.y-10)-1.5)<1e-9&&Math.abs(c.x-10)<1e-9));
 ok('clones drawn as hero ghosts',V(g,'ghosts.filter(x=>x.r564&&/^atk-/.test(x.asset)).length')===2);
 step(g,3);const sh=V(g,'shots.filter(s=>s.r564Clone)');ok('Q: each clone fires one piercing shot at 0.25×24=6',sh.length===2&&sh.every(s=>Math.abs(s.damage-6)<1e-9&&s.pierce===8&&s.friendly===true&&s.owner==='hero'));
 step(g,10);ok('clones vanish by 0.75 s',A(g).inspect().clones.length===0);
 V(g,'special()');step(g,20);ok('Q on cooldown → no clones',V(g,'shots.filter(s=>s.r564Clone).length')===2);
 // R 시간 정지
 g=env();const m1=mob('m1',12,10),m2=mob('m2',10,13),boss=mob('B',11,11,{boss:true}),far=mob('far',20,10);g.room.enemies.push(m1,m2,boss,far);
 V(g,"projectiles.push({x:13,y:10,vx:-4,vy:0,life:2,age:0,owner:'m1'},{x:30,y:10,vx:-4,vy:0,life:2,age:0,owner:'far'},{x:11,y:10,vx:4,vy:0,life:1,friendly:true})");
 R_(g);step(g,1);ok('R: no stop before 0.14 s',!A(g).inspect().stop);step(g,2);const ins=A(g).inspect();
 ok('R: stop starts, freezes non-boss mobs inside 6 tiles',ins.stop&&JSON.stringify(ins.frozen.sort())==='["m1","m2"]');
 const p1={x:m1.x,y:m1.y},sx0=V(g,'projectiles[0].x');step(g,20);ok('frozen mob does not move',m1.x===p1.x&&m1.y===p1.y);ok('boss keeps moving',Math.hypot(boss.x-11,boss.y-11)>.3);ok('mob outside keeps moving',far.x<20-.5);
 ok('enemy shot inside stops; outside shot and friendly shot keep flying',(()=>{const P=V(g,'projectiles');return P[0].x===sx0&&P[1].x<29&&P[2].x>11.5;})());
 ok('frozen shot lifetime extended by 1.6 s',Math.abs(V(g,'projectiles[0].life')-3.6)<1e-9);
 V(g,"hurts.length=0");const r1=V(g,"hurt(10,room.enemies[0])"),r2=V(g,"hurt(10,projectiles[0])"),r3=V(g,"hurt(10,room.enemies[2])");
 ok('frozen mob / its shot cannot hurt; boss still can',r1==='ignored'&&r2==='ignored'&&r3==='hit'&&V(g,'hurts.length')===1);
 step(g,12);ok('stop ends after 1.6 s',!A(g).inspect().stop&&A(g).inspect().frozen.length===0);
 ok('released enemy shot flies again with its old velocity',V(g,'projectiles[0].vx')===-4);step(g,4);ok('released mob moves again',Math.hypot(m1.x-p1.x,m1.y-p1.y)>.2);
 ok('hurt from mob works again after stop',V(g,"hurt(10,room.enemies[0])")==='hit');
 ok('drawn with scope owners (stop ground)',(()=>{const s=V(g,'scopes');return s.some(o=>/^r564:stop/.test(o.id)&&o.groundAligned)&&s.some(o=>/^r564:ice/.test(o.id))&&s.every(o=>o.kind==='effect');})());
 // 상한
 g=env();for(let i=0;i<40;i++)g.room.enemies.push(mob('m'+i,10+(i%7)*.5,10+Math.floor(i/7)*.5));for(let i=0;i<60;i++)V(g,`projectiles.push({x:11,y:11,vx:1,vy:0,life:2,owner:'x'})`);R_(g);step(g,4);
 ok('frozen mobs capped at 20, shots at 40',A(g).inspect().frozen.length===20&&A(g).inspect().heldShots===40);
 const t0=process.hrtime.bigint();step(g,24);const ms=Number(process.hrtime.bigint()-t0)/1e6;console.log('  40 mobs, 60 shots, stop, 24 ticks incl. draw: '+ms.toFixed(1)+' ms');ok('cheap (< 150 ms in vm)',ms<150);
 // 정지 중 장면이 열리면 즉시 풀림(탄 속도 되돌림)
 g=env();g.room.enemies.push(mob('a',12,10));V(g,"projectiles.push({x:12,y:10,vx:-3,vy:0,life:2,owner:'a'})");R_(g);step(g,4);V(g,'storyScene={}');step(g,1);ok('scene opening releases stop and restores shots',!A(g).inspect().stop&&V(g,'projectiles[0].vx')===-3);
 g=env();g.room.enemies.push(mob('a',12,10));R_(g);step(g,4);V(g,"room={id:'z2',engaged:true,enemies:[]}");step(g,2);ok('room change releases stop',!A(g).inspect().stop);
 // 다른 영웅·끄기
 g=env('neon');g.room.enemies.push(mob('a',12,10));R_(g);V(g,'special()');step(g,20);ok('other hero → nothing',A(g).inspect().stats.stops===0&&A(g).inspect().stats.qCasts===0);
 g=env();g.localStorage.setItem('storyworld.r564.chrono','{"on":false}');g.room.enemies.push(mob('a',12,10));R_(g);V(g,'special();player.storyWER.buffs.hasteUntil=3;player.moving=true');step(g,20);
 ok('switch off → nothing',A(g).inspect().stats.stops===0&&A(g).inspect().stats.qCasts===0&&A(g).inspect().stats.hasteTrails===0);
 ok('errors stay 0',A(g).inspect().stats.errors===0);
 // 시트: 분신 시공 틈(core24 색바꿈 192칸)·Dots SE-01 시계 판(256칸) — 없으면 코드 그림
 {const h=env();V(h,'SHEETS_ON=true');h.room.enemies.push(mob('a',12,10));R_(h);step(h,10);let d=V(h,'drawn');
  ok('Dots clock dial (SE-01) drawn under the time stop, 256 cells inside 6×4',d.some(x=>/dots\/seoha-clock/.test(x.src))&&d.filter(x=>/seoha-clock/.test(x.src)).every(x=>x.sx%256===0&&x.sy%256===0&&x.sx<1536&&x.sy<1024));
  ok('Dots SE02 r2 crystal shell back+front on frozen mobs, no code shell',d.some(x=>/crystal-shell-back/.test(x.src))&&d.some(x=>/crystal-shell-front/.test(x.src))&&V(h,'scopes').some(o=>/^r564:ice:b:/.test(o.id))&&!V(h,'scopes').some(o=>/^r564:ice:a$/.test(o.id)));
  step(h,40);d=V(h,'drawn');ok('Dots SE03 shatter plays when the stop ends',d.some(x=>/timestop-shatter/.test(x.src)));
  V(h,'player.specialCD=0;special()');step(h,6);d=V(h,'drawn');ok('Dots SE04 rift back+front where the clones appear (replaces the core24 blink)',d.some(x=>/seoha-rift-back/.test(x.src))&&d.some(x=>/seoha-rift-front/.test(x.src))&&!d.some(x=>/time-blink/.test(x.src)));
  V(h,'player.storyWER.buffs.hasteUntil=time+3;player.moving=true');step(h,4);d=V(h,'drawn');ok('Dots SE05 haste dial under the feet',d.some(x=>/seoha-haste-dial/.test(x.src)));
  ok('all Dots r3 cells 256-aligned inside 6×4',d.filter(x=>/dots\//.test(x.src)).every(x=>x.sx%256===0&&x.sy%256===0&&x.sx<1536&&x.sy<1024));
  ok('sheet errors stay 0',A(h).inspect().stats.errors===0);}
 {const h=env();h.room.enemies.push(mob('a',12,10));R_(h);step(h,10);ok('no sheets → code drawing only',V(h,'drawn.length')===0);}
 ok('sheets shipped (< 400 KB each)',[['r564','seoha-time-blink'],['r564/dots','seoha-clock'],['r564/dots','seoha-crystal-shell-back'],['r564/dots','seoha-crystal-shell-front'],['r564/dots','seoha-timestop-shatter'],['r564/dots','seoha-rift-back'],['r564/dots','seoha-rift-front'],['r564/dots','seoha-haste-dial']].every(([d,n])=>{try{return fs.statSync(path.join(R,'runtime-text','assets',d,n+'.webp')).size<400000;}catch(_){return false;}}));
 // 사몽 발현(R571) 중: 시간 정지 장 6칸×1.77
 g=env();V(g,"window.__STORYWORLD_SAMONG_SURGE_R571__={active:()=>true,range:r=>r*1.77,cd:s=>s*.23,chance:c=>c}");{const m=mob('m9',19,10);g.room.enemies.push(m);R_(g);step(g,3);ok('surge: mob at 9 tiles (outside 6, inside 10.6) is frozen',(A(g).inspect().frozen||[]).includes('m9'));step(g,40);ok('surge: stop still ends',!A(g).inspect().stop);}
}
console.log(`R564 seoha-chrono cpu check: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);

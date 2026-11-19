// R1198 실패 먼저 — 페르소나 하이라이트 스킬 3종(사용자 2026-11-19 03:52Z
//  "은빛 거성과 심연왜성이 더 자주 발동되도록 확률업 … 사거리 스킬범위 이펙트 크기 자체를 키워줘 쌍성소멸도 마찬가지 … 화려하게 연출").
// 페르소나 형상(라우렌 몸 + persona-hero-r1113 formActive)에서만 바뀐다. 라우렌 본인은 그대로(회귀).
// ① 연결 ② 비중(은빛 거성·심연 왜성 몫) ③ 사거리·범위(은빛 거성·심연 왜성·쌍성 소멸) ④ 피해 배율 그대로 ⑤ 그림 크기 ⑥ 하이라이트 덧그림(Dots 시트 재사용) ⑦ (진) 레이저 굵기·길이 ⑧ 경계값
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
const rd=f=>{try{return fs.readFileSync(path.join(R,f),'utf8');}catch(_){return '';}};
let pass=0,fail=0;const ok=(n,c)=>{if(c){pass++;console.log('PASS',n);}else{fail++;console.log('FAIL',n);}};
const F='lauren-celestial-r946.js',src=rd('client-source/'+F),WER=rd('client-source/persona-wer-r1144.js');
// ① 연결
ok('① runtime-text 사본 = client-source (r946)',src.length>0&&rd('runtime-text/'+F)===src);
ok('① runtime-text 사본 = client-source (r1144)',WER.length>0&&rd('runtime-text/persona-wer-r1144.js')===WER);
ok('① pages.yml CPU 검사 줄',rd('../.github/workflows/pages.yml').includes('node r96/qa/r1198/persona-highlight-cpu-check.cjs'));
ok('① 새 키 없음·기록기가 못 받는 필터 없음',!/addEventListener\(\s*['"]key/.test(src)&&!/drop-shadow|blur\(/.test(src));
 function env(hero='lauren',form=true){const hits=[],moves=[],sounds=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};g.window=g;vm.createContext(g);
  vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,shake=0;
  var FORM=${form};window.__STORYWORLD_PERSONA_HERO_R1113__={formActive:()=>FORM&&player.hero==='lauren'};var player={hero:${JSON.stringify(hero)},x:10,y:10,hp:100,ap:10};var room={id:'z1',engaged:true,enemies:[],props:[]};var effects=[];var wall=null;
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
const A=g=>g.__STORYWORLD_LAUREN_CELESTIAL_R946__;
const heroHit=(g,id)=>vm.runInContext(`hitEnemy(room.enemies.find(e=>e.id===${JSON.stringify(id)}),1,{kind:'basic',sourceHero:player.hero})`,g);
const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r946&&(!kind||h.s.kind==='r946-'+kind));
const api=env();ok('① API highlight() 있음',!!A(api)&&typeof A(api).highlight==='function');
// ② 비중: 같은 난수열로 2000번 발동시켜 갈래 몫을 센다(쌍성 소멸은 따로).
function shares(form){const g=env('lauren',form);let s=12345;A(g).qaRandom(()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;});g.room.enemies.push(mob('t',11,10,{hp:1e12,maxHp:1e12}));
 for(let i=0;i<4000;i++){A(g).qaReset();heroHit(g,'t');g.time+=.4;vm.runInContext('time='+g.time,g);if(i%50===0)vm.runInContext('tick()',g);}
 const p=A(g).inspect().stats.procs,n=p.repulse+p.red+p.blue+p.meteor;return {rb:(p.red+p.blue)/n,red:p.red/n,blue:p.blue/n,total:p.repulse+p.red+p.blue+p.meteor+p.violet,p};}
const SP=shares(true),SL=shares(false);
ok('② 페르소나: 은빛 거성+심연 왜성 몫 ≥ 70% ('+SP.rb.toFixed(3)+')',SP.rb>=.70);
ok('② 페르소나: 둘 다 각각 ≥ 33% (red '+SP.red.toFixed(3)+', blue '+SP.blue.toFixed(3)+')',SP.red>=.33&&SP.blue>=.33);
ok('② 라우렌 본인 몫 그대로 ≈ 48% ('+SL.rb.toFixed(3)+')',SL.rb>.42&&SL.rb<.54);
ok('② 페르소나 발동 확률 자체도 올라감(같은 난수열 총 발동 '+SP.total+' > '+SL.total+')',SP.total>SL.total*1.1);
// ③ 사거리·범위
function redRun(form,far,off=0){const g=env('lauren',form);A(g).qaForce('red');const t=mob('t',11,10),f=mob('f',10+far,10+off);g.room.enemies.push(t,f);heroHit(g,'t');step(g,80);return procHits(g,'red').some(h=>h.id==='f');}
ok('③ 페르소나 은빛 거성 11칸 앞 적까지 닿음',redRun(true,11));ok('③ 라우렌 은빛 거성 11칸은 안 닿음(8칸 그대로)',!redRun(false,11));
ok('③ 페르소나 은빛 거성 사거리 끝(12칸) 넘으면 안 닿음(15.5칸)',!redRun(true,15.5));
ok('③ 페르소나 은빛 거성 굵기: 줄에서 1.4칸 떨어진 적도 맞음',redRun(true,5,1.4));ok('③ 라우렌은 1.4칸 떨어진 적 안 맞음',!redRun(false,5,1.4));
function blueRun(form,d,ex={}){const g=env('lauren',form);A(g).qaForce('blue');const t=mob('t',13,10),p=mob('p',13+d,10,ex);g.room.enemies.push(t,p);heroHit(g,'t');const x0=p.x;step(g,40);return {pulled:p.x<x0-1e-6,hit:procHits(g,'blue').some(h=>h.id==='p')};}
ok('③ 페르소나 심연 왜성 4.8칸 밖 적도 끌어당김',blueRun(true,4.8).pulled);ok('③ 라우렌 심연 왜성 4.8칸은 안 끌림(3.4칸 그대로)',!blueRun(false,4.8).pulled);
ok('③ 페르소나 심연 왜성 핵 2.2칸 보스(안 끌림)도 피해',blueRun(true,2.2,{boss:true}).hit);ok('③ 라우렌 심연 왜성 핵 2.2칸 보스는 피해 없음(1.6칸 그대로)',!blueRun(false,2.2,{boss:true}).hit);ok('③ 페르소나 심연 왜성 5.6칸 밖은 안 끌림(경계)',!blueRun(true,5.6).pulled);
function vioRun(form,far){const g=env('lauren',form);A(g).qaForce('violet');const t=mob('t',12,10),f=mob('f',10+far,10);g.room.enemies.push(t,f);heroHit(g,'t');step(g,60);return procHits(g,'violet').some(h=>h.id==='f');}
ok('③ 페르소나 쌍성 소멸 15칸 앞 적까지 꿰뚫음',vioRun(true,15));ok('③ 라우렌 쌍성 소멸 15칸은 안 닿음(11칸 그대로)',!vioRun(false,15));ok('③ 페르소나 쌍성 소멸 18칸 밖은 안 닿음(경계)',!vioRun(true,18.5));
// ④ 피해 배율 그대로
{const g=env('lauren',true);A(g).qaForce('red');g.room.enemies.push(mob('t',11,10));heroHit(g,'t');step(g,20);ok('④ 은빛 거성 0.9×AP 그대로',procHits(g,'red').some(h=>Math.abs(h.v-9)<1e-9));}
{const g=env('lauren',true);A(g).qaForce('violet');g.room.enemies.push(mob('t',12,10),mob('B',14,10,{boss:true}));heroHit(g,'t');step(g,40);const h=procHits(g,'violet');ok('④ 쌍성 소멸 3.0×/보스 1.8× 그대로',h.some(x=>x.id==='t'&&Math.abs(x.v-30)<1e-9)&&h.some(x=>x.id==='B'&&Math.abs(x.v-18)<1e-9));}
// ⑤ 그림 크기(코드 그림 대체 경로에서 가장 큰 원)
function maxArc(form,kind,n){const g=env('lauren',form);A(g).qaSheets(false);A(g).qaForce(kind);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');g.arcs.length=0;step(g,n);return Math.max(0,...g.arcs.filter(Number.isFinite));}
for(const [k,n] of [['red',6],['blue',14],['violet',16]]){const a=maxArc(true,k,n),b=maxArc(false,k,n);ok('⑤ '+k+' 그림 크기 페르소나 ≥ 1.45배 ('+a.toFixed(1)+' / '+b.toFixed(1)+')',b>0&&a>=b*1.45);}
// ⑥ 하이라이트 덧그림: 페르소나만, 주인 id r946:<갈래>:hl:* (페르소나 굽기 대상), Dots 시트 재사용
function hlScopes(form,kind,n){const g=env('lauren',form);A(g).qaForce(kind);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,n);return g.scopes.filter(o=>o&&new RegExp('^r946:'+kind+':hl').test(String(o.id)));}
for(const [k,n] of [['red',10],['blue',20],['violet',24]]){ok('⑥ '+k+' 페르소나 하이라이트 덧그림 있음',hlScopes(true,k,n).length>0);ok('⑥ '+k+' 라우렌은 덧그림 없음',hlScopes(false,k,n).length===0);
 ok('⑥ '+k+' 덧그림 주인 kind=effect·pxfSide=hero',hlScopes(true,k,n).every(o=>o.kind==='effect'&&o.pxfSide==='hero'));}
{const g=env('lauren',true);A(g).qaForce('violet');g.room.enemies.push(mob('t',13,10));heroHit(g,'t');const s0=g.shake;step(g,14);ok('⑥ 쌍성 소멸 발사 화면 흔들림 ≥ 6 (라우렌 4)',g.shake>=6);}
{const g=env('lauren',true),h=A(g).highlight();ok('⑥ 덧그림은 기존 Dots 시트(lauren-boom·lauren-repulse) 재사용, 새 자산 없음',Array.isArray(h.sheets)&&h.sheets.every(k=>['boom','repulse','fuse','aura','disk'].includes(k))&&h.sheets.length>=2);}
// ⑦ (진) 레이저(R1144, 페르소나 전용) 굵기·여운
{const m=WER.match(/laser:Object\.freeze\(\{([^}]*)\}\)/),o={};if(m)for(const kv of m[1].split(/,(?![^\[]*\])/)){const [k,v]=kv.split(':');o[k]=v;}
 ok('⑦ 레이저 판정 굵기 ≥ .8칸 ('+o.width+')',Number(o.width)>=.8);ok('⑦ 레이저 여운 ≥ 1.1초 ('+o.life+')',Number(o.life)>=1.1);
 ok('⑦ 레이저 일곱 줄·보스 7% 그대로',/rays:\[-\.42,-\.28,-\.14,0,\.14,\.28,\.42\]/.test(m&&m[1]||'')&&o.bossK==='.07');
 ok('⑦ 레이저 그림 배율 HL 1.4 이상',/LASER_VIS=(1\.[4-9]\d*|2(\.\d+)?)/.test(WER));}
// ⑧ 경계값: 형상이 끊긴 뒤 나간 발동은 라우렌 값, EGO 판은 영향 없음
{const g=env('lauren',true);vm.runInContext('FORM=false',g);ok('⑧ 형상 끊김 → 은빛 거성 11칸 안 닿음',(()=>{A(g).qaForce('red');const t=mob('t',11,10),f=mob('f',21,10);g.room.enemies.push(t,f);heroHit(g,'t');step(g,80);return !procHits(g,'red').some(h=>h.id==='f');})());}
// ⑨ 성능 7단계(perf7-r1043, 렉 전수조사 스레드 11-19 04:06Z): 1·2단계는 덧그림 끔, 3·4단계는 주 그림만, 5~7단계는 전부. 판정(사거리·비중)은 단계와 무관.
function hlAt(stepN,kind,n){const g=env('lauren',true);vm.runInContext('window.__STORYWORLD_PERF7_R1043__={step:()=>'+JSON.stringify(stepN)+'}',g);A(g).qaForce(kind);g.room.enemies.push(mob('t',13,10));heroHit(g,'t');step(g,n);return g.scopes.filter(o=>o&&/^r946:[a-z]+:hl/.test(String(o.id))).map(o=>String(o.id));}
for(const k of ['red','blue','violet'])ok('⑨ 1단계(초저) '+k+' 덧그림 없음',hlAt(1,k,24).length===0);
ok('⑨ 2단계(낮음) 덧그림 없음',hlAt(2,'violet',24).length===0);
{const lo=hlAt(3,'violet',30),hi=hlAt(7,'violet',30);ok('⑨ 3단계는 주 그림만(총구 폭발), 7단계는 발밑 고리·끝 폭발까지 ('+new Set(lo.map(i=>i.split(':').slice(4).join(':'))).size+' < '+new Set(hi.map(i=>i.split(':').slice(4).join(':'))).size+')',lo.length>0&&new Set(lo.map(i=>i.split(':').slice(4).join(':'))).size<new Set(hi.map(i=>i.split(':').slice(4).join(':'))).size);}
ok('⑨ \'auto\'·없음 → 기본(전부)',hlAt('auto','red',10).length>0);
{const g=env('lauren',true);vm.runInContext('window.__STORYWORLD_PERF7_R1043__={step:()=>1}',g);A(g).qaForce('red');const t=mob('t',11,10),f=mob('f',21,10);g.room.enemies.push(t,f);heroHit(g,'t');step(g,80);ok('⑨ 1단계에서도 사거리(판정) 그대로 12칸',procHits(g,'red').some(h=>h.id==='f'));}
console.log((fail?'FAILED ':'ALL PASS ')+pass+'/'+(pass+fail));process.exit(fail?1:0);

'use strict';
// R1145 EGO 히든 영웅 — R 환수검에 은빛 거성·심연 왜성 동시, 묵월 발동에 항성 반발(백적색) CPU 검사(사용자 2026-11-18 05:55Z).
//  ① E 백은 유영보 → 악의 시선: 실측에서 정상(배우면 나감) — 배분표·감지 회귀만 확인 ② R(EGO 환수검)을 쓰면 은빛 거성·심연 왜성이 같이, 흰색+빨강 ③ 묵월이 발동하면 항성 반발도 같이, 백적색.
//  EGO 형상에만. 환도·라우렌 본인은 그대로. 기존 이펙트 모양 그대로 색만. 키·쿨다운 불변.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-celestial-r1145.js',OSRC=rd(path.join(R,'client-source',N)),LSRC=rd(path.join(R,'client-source','lauren-celestial-r946.js')),KSRC=rd(path.join(R,'client-source','ego-kit-r1094.js'));
ok(OSRC.length>0,N+' 있음');
ok(OSRC.length>0&&rd(path.join(R,'runtime-text',N))===OSRC,N+' runtime-text 사본 = client-source');
ok(rd(path.join(R,'runtime-text','lauren-celestial-r946.js'))===LSRC,'lauren-celestial-r946.js 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');ok(t(N)>0&&t(N)>t('ego-kit-r1094.js')&&t(N)>t('lauren-celestial-r946.js')&&t(N)>t('hwando-ink-r945.js')&&t(N)<t('combat-r118.js'),'태그: EGO 협주·천체 공명·수묵 패시브 뒤, combat-r118 앞');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1145/r1145-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'ego-celestial-r1145\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(rd(path.join(R,'runtime-inputs.json')).includes(N),'runtime-inputs 에 새 파일');
ok(!/\btick\s*=\s*function|\bsaveGame\s*=\s*function/.test(OSRC)&&/__STORYWORLD_POST_HOOKS__\.register\(/.test(OSRC),'tick 은 직접 감싸지 않고 POST_HOOKS.register 로');
ok(!/addEventListener\(\s*['"]key/.test(OSRC),'새 키 없음');
// ① E → 악의 시선 회귀(배분표·감지)
ok(/e:F\(\{cycle:F\(\['eye'\]\)/.test(KSRC)&&/for\(const k of \['w','e','r'\]\)/.test(KSRC),'① 협주 배분표: E → 악의 시선, 감지 목록에 e');
 function env(hero='hwando',ego=true){const hits=[],moves=[],sounds=[];const g={localStorage:{_s:{},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,moves,sounds,Math};g.window=g;vm.createContext(g);g.__ego=ego;
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
  vm.runInContext('window.__STORYWORLD_EGO_KIT_R1094__={active:()=>window.__ego,inspect:()=>({stats:{r:window.__kitR||0}})};window.__STORYWORLD_HWANDO_INK_R945__={inspect:()=>({stats:{moons:window.__moons||0}})};window.__STORYWORLD_POST_HOOKS__={register(m,h){(window.__hooks=window.__hooks||{})[m]=h;}};var delays=[];function delay(t,f){delays.push({t:time+t,f});}',g);vm.runInContext(LSRC,g,{filename:'r946'});if(OSRC)vm.runInContext(OSRC,g,{filename:'r1145'});return g;}
const step=(g,k=1,dt=.05)=>{for(let i=0;i<k;i++){g.time=+(g.time+dt).toFixed(4);vm.runInContext('time='+g.time+';for(const d of delays.splice(0)){if(d.t<=time)d.f();else delays.push(d);}tick();window.__hooks&&Object.values(window.__hooks).forEach(h=>h.tick&&h.tick());for(const e of effects.slice())drawEffect(e)',g);}};
const mob=(id,x,y,extra={})=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3,spawnState:'active',...extra});
const L=g=>g.__STORYWORLD_LAUREN_CELESTIAL_R946__,O=g=>g.__STORYWORLD_EGO_CELESTIAL_R1145__;
const kinds=g=>L(g).inspect().acts.map(a=>a.kind).sort().join(',');
const procHits=(g,kind)=>g.hits.filter(h=>h.s&&h.s.r946&&(!kind||h.s.kind==='r946-'+kind));
let g=env();
ok(!!L(g)&&typeof L(g).egoCast==='function'&&typeof L(g).egoWrFilter==='string','천체 공명 API: egoCast·egoWrFilter');
ok(!!O(g)&&/^R1145/.test(String(O(g)?.revision)),'API 열림(__STORYWORLD_EGO_CELESTIAL_R1145__)');
if(L(g)?.egoCast&&O(g)){
 // 필터: 렌더러가 받는 CSS 필터만, 기존 언주·먹 판과 다름(더 밝은 백적)
 const wr=L(g).egoWrFilter;ok(/^(?:(?:brightness|contrast|saturate|grayscale|hue-rotate)\([^)]*\)\s*)+$/.test(wr)&&!/blur|drop-shadow/.test(wr)&&wr!==L(g).egoFilter,'백적색 필터: 허용된 CSS 필터만, 기존 EGO 필터와 다름',wr);
 {const b=+(/brightness\(([\d.]+)\)/.exec(wr)||[])[1],b0=+(/brightness\(([\d.]+)\)/.exec(L(g).egoFilter)||[])[1];ok(b>b0&&b>=1,'흰색이 섞이게 기존보다 밝음',[b,b0]);}
 // ② R → 은빛 거성 + 심연 왜성 동시
 g=env();g.room.enemies.push(mob('a',12,10));step(g,2);
 ok(kinds(g)==='','R 전: 천체 없음');
 g.__kitR=1;step(g,1);ok(kinds(g)===''||kinds(g)==='blue,red','R 직후(지연 안)',kinds(g));step(g,14);
 ok(O(g).inspect().stats.rCasts===1,'R 한 번 → 한 번만 발동',O(g).inspect().stats);
 {const st=L(g).inspect().stats;ok(st.procs.red===1&&st.procs.blue===1&&st.procs.repulse===0&&st.procs.violet===0&&st.procs.meteor===0,'은빛 거성 1 + 심연 왜성 1 (다른 갈래 없음)',st.procs);}
 step(g,40);ok(procHits(g,'red').length>=1&&procHits(g,'blue').length>=1,'둘 다 실제로 맞음(기존 판정)',[procHits(g,'red').length,procHits(g,'blue').length]);
 {const pw=10;ok(procHits(g,'red').every(h=>Math.abs(h.v-pw*L(g).inspect().tuning.RED_K)<1e-6)&&procHits(g,'blue').every(h=>Math.abs(h.v-pw*L(g).inspect().tuning.BLUE_K)<1e-6),'피해 배율은 라우렌 값 그대로(은빛 0.9·심연 0.25)',procHits(g).slice(0,3).map(h=>h.v));}
 ok(L(g).inspect().comboReady===false,'R 로 나간 둘은 쌍성 소멸 조건을 채우지 않음(확률 패시브 흐름 불변)');
 step(g,30);g.__kitR=1;step(g,20);ok(O(g).inspect().stats.rCasts===1,'숫자가 그대로면 다시 안 나감');
 g.__kitR=2;step(g,20);ok(O(g).inspect().stats.rCasts===2,'다음 R 에 다시');
 // 그림: 백적 필터로 그려짐
 {g=env();g.room.enemies.push(mob('a',12,10));step(g,1);const fl=[];vm.runInContext('var __fl=[];Object.defineProperty(ctx,"filter",{set(v){__fl.push(v);},get(){return "none";},configurable:true});',g);g.__kitR=1;step(g,16);
  vm.runInContext('for(const e of effects.slice())if(typeof e.draw==="function")e.draw();',g);const seen=vm.runInContext('__fl',g);
  ok(seen.includes(L(g).egoWrFilter)&&!seen.includes(L(g).egoFilter),'R 천체는 백적색 필터로(기존 언주·먹 필터 아님)',[...new Set(seen)]);}
 // 색 두 번 돌리기 회귀: 이펙트 수묵 색(R1095)이 켜져 있으면 색상 회전 없는 필터(심연 왜성이 초록으로 나오던 문제)
 {g=env();vm.runInContext('window.__STORYWORLD_INK_FX_R1095__={active:()=>true};var __fl=[];Object.defineProperty(ctx,"filter",{set(v){__fl.push(v);},get(){return "none";},configurable:true});',g);g.room.enemies.push(mob('a',12,10,{hp:1e9,maxHp:1e9}));step(g,1);g.__kitR=1;step(g,16);
  const seen=[...new Set(vm.runInContext('__fl',g))];ok(seen.includes(L(g).egoWrInkFilter)&&seen.every(f=>!/hue-rotate/.test(f)),'R1095 켜짐: R 천체에 색상 회전 없음(명도만)',seen);
  L(g).qaReset();L(g).qaRandom(()=>0);L(g).qaForce('blue');vm.runInContext("__fl.length=0;hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:player.hero})",g);step(g,6);
  const s2=[...new Set(vm.runInContext('__fl',g))];ok(s2.includes(L(g).egoInkFilter)&&s2.every(f=>!/hue-rotate/.test(f)),'R1095 켜짐: 기존 확률 발동 판(심연 왜성)도 색상 회전 없음',s2);
  ok(!/hue-rotate/.test(L(g).egoInkFilter)&&!/hue-rotate/.test(L(g).egoWrInkFilter)&&/^(?:(?:brightness|contrast|saturate|grayscale)\([^)]*\)\s*)+$/.test(L(g).egoWrInkFilter),'수묵 색용 필터 둘: 허용 필터만');}
 // ③ 묵월 → 항성 반발
 g=env();g.room.enemies.push(mob('a',11,10),mob('far',30,30));step(g,2);g.__moons=1;step(g,2);
 {const st=L(g).inspect().stats;ok(st.procs.repulse===1&&O(g).inspect().stats.moonCasts===1,'묵월 1회 → 항성 반발 1회',st.procs);}
 {const h=procHits(g,'repulse');ok(h.length===1&&h[0].id==='a','반경 안 적만 맞음',h.map(x=>x.id));
  const full=10*L(g).inspect().tuning.REP_K;ok(h[0]&&h[0].v>0&&h[0].v<=full*O(g).REPULSE_SCALE+1e-6&&O(g).REPULSE_SCALE<=.6&&O(g).REPULSE_SCALE>=.3,'묵월(18%·1.2초 대기)에 맞춘 낮춘 배율',[h[0]?.v,full]);}
 g.__moons=3;step(g,2);ok(O(g).inspect().stats.moonCasts===2,'한 틱에 여러 번 올라도 한 번');
 // 회귀: EGO 가 아니면 아무것도 안 함
 g=env('hwando',false);g.room.enemies.push(mob('a',11,10));step(g,2);g.__kitR=1;g.__moons=1;step(g,20);
 ok(kinds(g)===''&&L(g).inspect().stats.procTotal===0&&L(g).egoCast('red',null)===false,'환도 본인(EGO 형상 아님): 발동 없음, egoCast 거부');
 g=env('lauren',false);g.room.enemies.push(mob('a',11,10));step(g,2);g.__kitR=1;g.__moons=1;step(g,20);
 ok(L(g).inspect().stats.procTotal===0&&L(g).egoCast('repulse',null)===false,'라우렌 본인: 이 길로는 발동 없음');
 {g=env('lauren',false);g.room.enemies.push(mob('a',11,10,{hp:1e9,maxHp:1e9}));L(g).qaRandom(()=>0);L(g).qaForce('repulse');vm.runInContext("var __fl=[];Object.defineProperty(ctx,'filter',{set(v){__fl.push(v);},get(){return 'none';},configurable:true});hitEnemy(room.enemies[0],1,{kind:'basic',sourceHero:'lauren'})",g);step(g,3);
  vm.runInContext('for(const e of effects.slice())if(typeof e.draw==="function")e.draw();',g);ok(L(g).inspect().stats.procs.repulse===1&&!vm.runInContext('__fl',g).includes(L(g).egoWrFilter),'라우렌 항성 반발은 원래 색(필터 없음)');}
 // 경계
 g=env();ok(L(g).egoCast('violet',null)===false&&L(g).egoCast('meteor',null)===false&&L(g).egoCast('x',null)===false&&L(g).egoCast()===false,'egoCast 는 은빛·심연·반발만');
 ok(L(g).egoCast('red',{x:NaN,y:1})===true&&L(g).inspect().acts.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)),'NaN 표적이어도 좌표는 유한');
 vm.runInContext('player.hp=0',g);ok(L(g).egoCast('red',null)===false,'쓰러진 뒤엔 발동 없음');
 g=env();step(g,1);g.__kitR=5;g.__moons=7;const g2=g;ok(O(g2).rose(NaN,1)===false&&O(g2).rose(1,1)===false&&O(g2).rose(1,2)===true&&O(g2).rose(2,1)===false&&O(g2).rose(undefined,3)===false,'rose: 처음 본 값·같은 값·줄어든 값은 발동 아님');
 // 끄기
 {const s0=OSRC;g=env();vm.runInContext('window.__STORYWORLD_EGO_CELESTIAL_R1145__.set(false)',g);g.room.enemies.push(mob('a',11,10));step(g,2);g.__kitR=1;g.__moons=1;step(g,20);ok(L(g).inspect().stats.procTotal===0&&O(g).inspect().on===false,'끄기: 아무것도 안 함');}
 ok(O(env()).inspect().stats.errors===0,'오류 0');
}
console.log(`\nR1145 CPU 검사: ${n-bad}/${n} 통과`);process.exit(bad?1:0);

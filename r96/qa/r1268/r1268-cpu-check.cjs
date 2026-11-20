// R1268 CPU 검사 — 이동 중엔 기본 공격 시작 안 함·멈추면 나감·이미 시작한 공격은 그대로(still-attack-r1268.js)
//  가짜 엔진(basicAttack·tick·tickEnemies·R53 canPrepare)을 vm 에 깔고 실제 오버레이를 돌린다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),F='still-attack-r1268.js',SRC=path.join(R,'client-source',F);
let pass=0;const ok=(c,m)=>{assert.ok(c,m);pass++;};
ok(fs.existsSync(SRC),'오버레이 파일 있음');const code=fs.readFileSync(SRC,'utf8');
// ---- 정적 연결 ----
const html=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');const t=n=>html.indexOf(n);
ok(new RegExp('\\n<script src="\\./'+F.replace(/\./g,'\\.')+'"></script>\\n').test(html),'index.html 스크립트 태그(따로 한 줄)');
ok(t(F)>t('save-guard-r1248.js')&&t('save-guard-r1248.js')>0&&t(F)<t('boot-lean-r1038.js'),'태그: save-guard-r1248 뒤, boot-lean-r1038 앞');
ok(fs.readFileSync(path.join(R,'../scripts/verify-r96-public.py'),'utf8').includes("'"+F+"'"),'공개 확인 기대 목록');
ok(fs.readFileSync(path.join(R,'../.github/workflows/pages.yml'),'utf8').includes('r96/qa/r1268/r1268-cpu-check.cjs'),'pages.yml 검사 줄');
ok(fs.existsSync(path.join(R,'runtime-text',F))&&fs.readFileSync(path.join(R,'runtime-text',F),'utf8')===code,'runtime-text 사본(sync)이 같음');
ok(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8').includes(F),'runtime-inputs 등록');
ok(!/ctx\.filter\s*=/.test(code),'ctx.filter 안 씀');
// ---- 가짜 엔진 ----
function sandbox(ls={}){
 const sb={localStorage:{v:{...ls},getItem(k){return this.v[k]??null;},setItem(k,v){this.v[k]=String(v);}},document:{readyState:'complete'},addEventListener(){},
  setInterval:()=>0,clearInterval(){},Math,JSON,Object,Number,String,Map,Set,Array,console,time:0,
  player:{x:0,y:0,moving:false,attackCD:0,hp:100},room:{enemies:[]},log:[]};
 sb.window=sb;
 vm.createContext(sb);
 vm.runInContext(`
  function basicAttack(force){if(player.attackCD>0)return;player.attackCD=.5;log.push({k:'atk',force:!!force,t:time});}
  var MOVE={};
  function tickEnemies(dt){for(const e of room.enemies){e.moving=false;if(e.attack){e.attack.el+=dt;if(e.attack.el>=.5){log.push({k:'strike',id:e.id,t:time});e.attack=null;e.cd=1;}continue;}
    e.cd-=dt;const d=Math.hypot(player.x-e.x,player.y-e.y);
    if(e.cd<=0&&d<=(window.NARROW?e.range:e.range+.15)&&window.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee')){e.attack={el:0};log.push({k:'start',id:e.id,t:time,moved:time-(MOVE[e.id]??-9)<.1});continue;}
    if(d>e.range*.7){const v=Math.min(d,2*dt)/d;e.x+=(player.x-e.x)*v;e.y+=(player.y-e.y)*v;e.moving=true;}}}
  window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({canPrepare(e,k){return true}});
  function tick(dt){time+=dt;player.attackCD=Math.max(0,player.attackCD-dt);player.moving=!!window.WALK;if(player.moving)player.x+=dt;if(window.HOLD)basicAttack();const pre=room.enemies.map(e=>[e,e.x,e.y]);tickEnemies(dt);for(const [e,x,y] of pre)if(e.moving&&Math.hypot(e.x-x,e.y-y)>.004)MOVE[e.id]=time;}
 `,sb);
 vm.runInContext(code,sb);if(!ls.noEnemy)sb.__STORYWORLD_STILL_ATTACK_R1268__.set({enemy:true});return sb;}
const mk=o=>({ai:'melee',combatProfile:{attackShape:{range:o.range}},...o});
const run=(sb,sec,dt=1/60)=>{for(let i=0;i<Math.round(sec/dt);i++)vm.runInContext('tick('+dt+')',sb);};
// 1) 영웅: 걷는 동안 공격키 → 공격 0, 멈추면 그 틱에 바로
{const S=sandbox(),API=S.__STORYWORLD_STILL_ATTACK_R1268__;ok(API&&typeof API.inspect==='function','전역 API');
 S.WALK=true;S.HOLD=true;run(S,1);ok(S.log.filter(x=>x.k==='atk').length===0,'걷는 1초 동안 공격 시작 0 ('+S.log.length+')');
 S.WALK=false;run(S,1/60);ok(S.log.filter(x=>x.k==='atk').length===1,'멈춘 첫 틱에 공격 나감');
 run(S,1);ok(S.log.filter(x=>x.k==='atk').length>=2,'서 있으면 쿨다운마다 계속 공격(0.5초 간격)');
 // 이미 시작한 공격: 공격 직후 걸어도 공격 기록·쿨다운 그대로(취소 없음)
 const n=S.log.length,cd=S.player.attackCD;S.WALK=true;run(S,1/60);ok(S.log.length===n&&S.player.attackCD<cd&&S.player.attackCD>0,'시작한 공격은 걸어도 취소 안 됨(쿨다운 그대로 흐름)');
 ok(API.inspect().stats.heroBlocked>0&&API.inspect().stats.errors===0,'막은 횟수 기록·오류 0 '+API.inspect().stats.lastError);}
// 2) 영웅: 걷는 중 버튼 한 번(force) → 0.6초 안에 멈추면 나감, 넘으면 버려짐
{const S=sandbox();S.WALK=true;run(S,.2);vm.runInContext('basicAttack(true)',S);ok(S.log.length===0,'걷는 중 버튼: 바로 안 나감');
 run(S,.3);ok(S.log.length===0,'계속 걷는 동안 안 나감');S.WALK=false;run(S,1/60);ok(S.log.length===1&&S.log[0].force,'멈추는 틱에 기억한 버튼 공격 나감');
 S.WALK=true;run(S,.1);vm.runInContext('basicAttack(true)',S);run(S,.7);S.WALK=false;run(S,1/60);ok(S.log.length===1,'경계: 0.6초 넘게 걸으면 기억 버림');}
// 3) 끄기: 예전처럼 걸으며 공격
{const S=sandbox({'storyworld.r1268.still':'{"on":false}'});S.WALK=true;S.HOLD=true;run(S,1);ok(S.log.filter(x=>x.k==='atk').length>=2,'끄면 걷는 중에도 공격(예전 동작)');}
// 4) 적: 다가오다 사거리 안 → 0.12초 서 있다가 공격, 걸은 직후 시작 0, 공격은 끝까지
{const S=sandbox();S.room.enemies.push(mk({id:'m',x:3,y:0,hp:10,cd:0,range:1.35}));run(S,4);
 const st=S.log.filter(x=>x.k==='start'),sk=S.log.filter(x=>x.k==='strike');ok(st.length>=2,'적 공격 시작 있음 '+st.length);
 ok(st.every(x=>!x.moved),'걸은 뒤 0.1초 안 시작 0 '+JSON.stringify(st));ok(sk.length>=st.length-1,'시작한 공격은 타격까지 나감');
 const first=st[0].t,lastMove=(()=>{let m=-9;return m})();ok(first>.15,'첫 공격은 멈춘 뒤 서 있다가 '+first.toFixed(3));
 const API=S.__STORYWORLD_STILL_ATTACK_R1268__;ok(API.inspect().stats.enemyHeld>0&&API.inspect().stats.enemyStopped>0,'막은 틱·멈춰 세운 틱 있음');}
// 5) 적: 영웅이 계속 달아나면(사거리 언저리) 쫓기만 하고 걸으며 공격 안 함
{const S=sandbox();S.room.enemies.push(mk({id:'c',x:-1.2,y:0,hp:10,cd:0,range:1.35}));S.WALK=true;run(S,3);
 const st=S.log.filter(x=>x.k==='start');ok(st.every(x=>!x.moved),'달아나는 영웅 쫓는 동안 걸으며 시작한 공격 0 '+JSON.stringify(st));}
// 6) 적: 이미 시작한 공격 중엔 막지 않음(canPrepare 를 공격 중 다시 물어도 통과)
{const S=sandbox();const e={id:'a',x:0,y:0,hp:10,attack:{el:0},__r1268MoveAt:0};S.time=.01;
 ok(S.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e,'melee')===true,'공격 중인 적은 걸었어도 통과');
 const e2={id:'b',x:0,y:0,hp:10,__r1268MoveAt:0};ok(S.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e2,'melee')===false,'걸은 직후(0.01초)는 막음');
 S.time=.13;ok(S.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e2,'melee')===true,'경계: 0.12초 넘게 서 있으면 통과');S.time=.11;ok(S.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e2,'melee')===false,'경계: 0.11초는 막음');}
// 7) 다른 오버레이가 뒤에 다시 감싸도 install 이 맨 바깥을 되찾음
{const S=sandbox();vm.runInContext(`const b0=basicAttack;basicAttack=function(f){return b0.apply(this,arguments)};Object.assign(basicAttack,b0);
  const m0=window.__STORYWORLD_HOSPITAL_MOTION_R53__;window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({...m0,canPrepare(e,k){return true}});`,S);
 S.__STORYWORLD_STILL_ATTACK_R1268__.install();S.WALK=true;S.HOLD=true;run(S,.5);ok(S.log.filter(x=>x.k==='atk').length===0,'다시 감싼 뒤에도 걷는 중 공격 0');
 const e2={id:'b',x:0,y:0,hp:10,__r1268MoveAt:S.time};ok(S.__STORYWORLD_HOSPITAL_MOTION_R53__.canPrepare(e2,'melee')===false,'R53 다시 감싼 뒤에도 막음');}
// 8) 원래 관문이 막는 적(패턴 중 보스 등)은 걸음을 끊지 않는다 — 계속 걷기(멈칫 0)
{const S=sandbox();vm.runInContext(`window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({canPrepare(e,k){return !e.deny}});`,S);S.__STORYWORLD_STILL_ATTACK_R1268__.install();
 const e=mk({id:'d',x:6,y:0,hp:10,cd:0,range:1.35,deny:true});S.room.enemies.push(e);S.WALK=true;let stops=0,px=e.x;for(let i=0;i<120;i++){vm.runInContext('tick(1/60)',S);if(Math.hypot(e.x-px,e.y-0)<1e-9&&Math.hypot(S.player.x-e.x,S.player.y-e.y)>e.range*.7)stops++;px=e.x;}
 ok(stops===0,'관문이 막는 적은 멈칫 없이 계속 걸음 (멈춘 틱 '+stops+')');ok(S.__STORYWORLD_STILL_ATTACK_R1268__.inspect().stats.enemyStopped===0,'막는 적은 멈춰 세우지 않음');}
// 9) 붙잡는 동안 옆자리 블링크(R230·R425 처럼 e.r230At 이 방금이면 건너뛰는 부수 효과)는 일어나지 않고, 진짜 시작 때 한 번만
{const S=sandbox();vm.runInContext(`var FLANKS=0;const m0=window.__STORYWORLD_HOSPITAL_MOTION_R53__;window.__STORYWORLD_HOSPITAL_MOTION_R53__=Object.freeze({...m0,canPrepare(e,k){const ok=m0.canPrepare(e,k);if(ok&&!(e.r230At!=null&&time-e.r230At<2.4)){FLANKS++;e.r230At=time;}return ok}});`,S);
 S.__STORYWORLD_STILL_ATTACK_R1268__.install();const e=mk({id:'f',x:3,y:0,hp:10,cd:0,range:1.35});S.room.enemies.push(e);run(S,1.2);
 const st=S.log.filter(x=>x.k==='start');ok(st.length===1,'공격 한 번 시작 '+st.length+JSON.stringify(S.__STORYWORLD_STILL_ATTACK_R1268__.inspect().stats)+JSON.stringify(e));ok(S.FLANKS===1,'블링크는 진짜 시작 때 한 번만 (FLANKS='+S.FLANKS+')');ok(e.r230At===st[0].t,'블링크 시각 = 공격 시작 시각');}
// 10) 안전판: 엔진 쪽 공격 조건이 더 좁아(다른 규칙) 멈춰 세운 자리에서 공격이 안 나가도 0.45초 넘게 얼지 않고 다가가 공격
{const S=sandbox();S.NARROW=true;const e=mk({id:'n',x:3,y:0,hp:10,cd:0,range:1.35});S.room.enemies.push(e);let frozen=0,maxFrozen=0,px=e.x;
 for(let i=0;i<240;i++){vm.runInContext('tick(1/60)',S);if(!e.attack&&Math.abs(e.x-px)<1e-9&&Math.hypot(e.x,e.y)>e.range*.7){frozen++;maxFrozen=Math.max(maxFrozen,frozen)}else frozen=0;px=e.x;}
 ok(maxFrozen/60<=.5,'얼어붙는 시간 0.5초 이하 '+(maxFrozen/60).toFixed(2));ok(S.log.some(x=>x.k==='start'),'결국 공격 시작');ok(S.log.filter(x=>x.k==='start').every(x=>!x.moved),'그래도 걸은 직후 시작 0');}
// 11) 자리 다툼 꼼지락(초당 0.6칸 미만, e.moving 켜짐)은 걷기로 안 봐서 공격이 막히지 않음
{const S=sandbox();vm.runInContext(`const tb=tickEnemies;tickEnemies=function(dt){const r=tb.apply(this,arguments);for(const e of room.enemies)if(!e.attack&&e.wiggle){e.x+=(Math.random()-.5)*.01;e.moving=true;}return r};`,S);S.__STORYWORLD_STILL_ATTACK_R1268__.install();
 const e=mk({id:'w',x:1,y:0,hp:10,cd:0,range:1.35,wiggle:true});S.room.enemies.push(e);run(S,1);ok(S.log.some(x=>x.k==='start'),'꼼지락거리는 적도 공격 시작');}
// 12) 무리에 밀려 사거리 밖으로 밀렸다 걸어 들어오기를 되풀이(틱마다 0.03칸 왕복)해도 공격 시작
{const S=sandbox();vm.runInContext(`const tb=tickEnemies;tickEnemies=function(dt){const r=tb.apply(this,arguments);return r};const t0=tick;tick=function(dt){const r=t0.apply(this,arguments);for(const e of room.enemies)if(!e.attack&&e.shove)e.x+=.03;return r};`,S);S.__STORYWORLD_STILL_ATTACK_R1268__.install();
 const e=mk({id:'s',x:1.4,y:0,hp:10,cd:0,range:1.35,shove:true});S.room.enemies.push(e);run(S,1.5);ok(S.log.some(x=>x.k==='start'),'밀렸다 돌아오는 적도 공격 시작 '+JSON.stringify(S.__STORYWORLD_STILL_ATTACK_R1268__.inspect().stats));}
// 13) 기본값: 몹 규칙은 꺼져 있음(사용자 결정 대기) — 걸어 다가온 적이 예전처럼 바로 공격, 영웅 규칙은 켜짐
{const S=sandbox({noEnemy:1});S.room.enemies.push(mk({id:'o',x:3,y:0,hp:10,cd:0,range:1.35}));S.WALK=true;S.HOLD=true;run(S,2);
 ok(S.__STORYWORLD_STILL_ATTACK_R1268__.inspect().cfg.enemy===false,'기본값 enemy 끔');ok(S.log.some(x=>x.k==='start'&&x.moved),'몹 규칙 끔: 걷다 바로 공격(예전 동작)');ok(S.log.filter(x=>x.k==='atk').length===0,'영웅 규칙은 켜짐');}
// 14) 공격 중(준비·윈드업) 다른 규칙이 몹을 미는 걸음(R425 steer·R115 간격 같은)은 되돌려 제자리 — 기본 켬(몹 시작 관문은 꺼도)
{const S=sandbox({noEnemy:1});vm.runInContext(`function hitEnemy(e,d){e.x+=.3;e.hp-=d;}const t1=tick;tick=function(dt){const r=t1.apply(this,arguments);for(const e of room.enemies)if(e.attack||e.rangedWindup>0)e.x+=.05;return r};`,S);S.__STORYWORLD_STILL_ATTACK_R1268__.install();
 const m=mk({id:'p',x:0.8,y:0,hp:10,cd:0,range:1.35});S.room.enemies.push(m);run(S,1/60);ok(!!m.attack,'공격 시작');const x0=m.x;run(S,.2);ok(Math.abs(m.x-x0)<1e-9,'공격 중 밀림 되돌림(제자리) '+(m.x-x0).toFixed(3));
 vm.runInContext('hitEnemy(room.enemies[0],1)',S);const x1=m.x;ok(Math.abs(x1-x0-.3)<1e-9,'영웅 타격 넉백은 그대로');run(S,1/60);ok(Math.abs(m.x-x1)<1e-9,'넉백 뒤에도 그 자리에서 고정');
 const B=mk({id:'b',x:-0.8,y:0,hp:10,cd:9,range:1.35,boss:true,attack:{el:0}});S.room.enemies.push(B);const bx=B.x;run(S,.1);ok(B.x>bx+.2,'보스는 고정 안 함(고유 패턴 이동 보존)');
 const D=mk({id:'d',x:0,y:.8,hp:10,cd:9,range:1.35,attack:{el:0},r286:{mode:'dash'}});S.room.enemies.push(D);const dy=D.x;run(S,.1);ok(D.x>dy+.2,'R286 돌진 중엔 고정 안 함');
 S.__STORYWORLD_STILL_ATTACK_R1268__.set({pin:false});m.attack={el:0};const x2=m.x;run(S,.1);ok(m.x>x2+.2,'pin 끄면 예전처럼 밀림');S.__STORYWORLD_STILL_ATTACK_R1268__.set({pin:true});
 ok(S.__STORYWORLD_STILL_ATTACK_R1268__.inspect().stats.pinned>0,'고정 횟수 기록');}
console.log('R1268 cpu check PASS '+pass);

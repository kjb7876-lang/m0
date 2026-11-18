'use strict';
// R1157 EGO 히든 영웅 R — 영웅 하나를 7초 소환(사용자 2026-11-18 09:12Z "히든에고영웅 r스킬사용시 랜덤으로 영웅하나 소환하여 7초간 전투를 도움
//  그영웅은 소환시간동안 모든 스킬쿨타임0.7초적용함", 09:13Z "그영웅들은 특수확률발동패시브도 사용함",
//  09:13Z "소환된영웅이 또 소환스킬을 사용하면 둘다 7초가연장되고 7초후 같이사라짐", 09:14Z "버그없게 잘적용", "모든모드에 적용부탁").
//  실패 먼저: 이 검사는 ego-summon-r1157.js 가 없으면 실패한다.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}else console.log('ok  ',m);};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const N='ego-summon-r1157.js',SRC=rd(path.join(R,'client-source',N));
const HS=rd(path.join(R,'client-source','hunter-squad-r952.js')),SE=rd(path.join(R,'client-source','seoha-epoch-r949.js')),SP=rd(path.join(R,'client-source','survival-passives-r962.js'));

// ── 연결(빌드 파이프라인 다섯 곳) ──
ok(SRC.length>0,N+' 있음');
ok(SRC.length>0&&rd(path.join(R,'runtime-text',N))===SRC,N+' runtime-text 사본 = client-source');
{const html=rd(path.join(R,'runtime-text','index.html')),t=x=>html.indexOf('<script src="./'+x+'"></script>');
 ok(t(N)>0&&t(N)>t('ego-celestial-r1145.js')&&t(N)>t('ego-kit-r1094.js')&&t(N)>t('hunter-squad-r952.js')&&t(N)>t('seoha-epoch-r949.js')&&t(N)<t('combat-r118.js'),'태그: EGO 협주·천체 공명·소환 패시브 뒤, combat-r118 앞');}
ok(rd(path.join(ROOT,'.github/workflows/pages.yml')).includes('node r96/qa/r1157/r1157-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(/'ego-summon-r1157\.js'/.test(rd(path.join(ROOT,'scripts','verify-r96-public.py'))),'공개 확인 목록');
ok(rd(path.join(R,'runtime-inputs.json')).includes(N),'runtime-inputs 에 새 파일');
ok(!/addEventListener\(\s*['"]key/.test(SRC),'새 키 없음');
ok(/__STORYWORLD_POST_HOOKS__\.register\(/.test(SRC)&&!/\btick\s*=\s*function/.test(SRC),'tick 은 POST_HOOKS.register 로(직접 감싸지 않음)');
for(const f of ['hunter-squad-r952.js','seoha-epoch-r949.js','survival-passives-r962.js','hero-defense-r720.js'])ok(rd(path.join(R,'runtime-text',f))===rd(path.join(R,'client-source',f)),f+' 사본 = client-source');
// 소환 영웅의 소환(헌터 사냥 분대·서하 아르벨리아/평행세계)이 R1157 에 이어지는 고리, 투사체 명중 귀속(R962)이 소환 몸을 아는지
ok(/__STORYWORLD_EGO_SUMMON_R1157__/.test(HS)&&/K1157\(p,sq,'end'\)/.test(HS),'헌터 사냥 분대: 소환 몸이 부르면 R1157 연장 고리(end)');
ok(/__STORYWORLD_EGO_SUMMON_R1157__/.test(HS)&&/B1157\(p\)/.test(HS),'헌터 사냥 분대: R1157 몸도 주인으로 인정');
ok(/K1157\(o,x,'until'\)/.test(SE),'서하 겹친 시간: 소환 몸이 부르면 R1157 연장 고리(until)');
ok(/__STORYWORLD_EGO_SUMMON_R1157__/.test(SP),'R962 명중 귀속: R1157 몸 포함');

// ── 가짜 엔진 ──
function env(opt={}){
 const g={console,Math,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Number,Error,structuredClone,localStorage:{_s:{...(opt.ls||{})},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}}};g.window=g;vm.createContext(g);
 g.__opt=opt;
 vm.runInContext(`var time=0,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34,paused=false;
 var HEROES={hwando:{name:'환도',type:'blade',range:3.15},seoha:{name:'윤서하',range:6},neon:{name:'네온',range:5},michaela:{name:'미카엘라',range:5},lauren:{name:'라우렌',range:5},hunter:{name:'헌터',range:7},slayer:{name:'슬레이어',type:'heavy',range:2.4},gunner:{name:'기억사수',range:6}};
 var player={id:'me',hero:'hwando',x:10,y:10,hp:100,maxHp:100,level:7,ap:10,upgrades:{a:1},progressionR62:{p:1},egoSovereignR1046:true,personaHeroR1113:false,storyWER:{ready:{},buffs:{}},attackCD:0,specialCD:0,skillAnim:0,direction:'front'};
 var me=player;var room={id:'z1',enemies:[],props:[]};var effects=[];var target=null,command=null,route=[];
 var log={basic:[],wer:[],q:[],hits:[],xp:[],draws:[],imgs:[],sounds:[],shots:[]};
 var heroArt={};for(const k in HEROES)heroArt[k]={idle:{front:'art/'+k+'.webp'}};
 function heroPaths(k){return ['art/'+k+'.webp'];}
 function readyImage(p){if(String(p).startsWith("act/")&&!(window.asked||[]).includes(p))return null;return {image:{src:p,naturalWidth:2304,naturalHeight:192}};}function ensureImages(){return Promise.resolve();}
 function wallAt(){return false;}function moveActor(a,dx,dy){a.x+=dx;a.y+=dy;}function facing(x,y){return x>0?'right':'left';}
 function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}
 function attackPower(){return player.ap;}
 function hitEnemy(e,v,s){log.hits.push({e:e.id,v,hero:player.hero,body:!!player.r1157Summon});e.hp-=v;return true;}
 function basicAttack(){log.basic.push(player.hero+(player.r1157Summon?':body':''));player.attackCD=.5;const e=room.enemies[0];if(e)hitEnemy(e,attackPower(),{friendly:true,owner:'hero'});}
 function makeShot(x,y,a,s,d,o){const r={x,y,a,d,...(o||{})};log.shots.push({hero:player.hero,r});return r;}
 var delays=[];function delay(sec,fn){delays.push({t:time+sec,f:fn});}
 function gainXP(v){log.xp.push({who:player.id||player.hero,v});}
 function sound(k){log.sounds.push(k);}function toast(){}
 function project(x,y){return {x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
 function drawHero(){log.draws.push({hero:player.hero,body:!!player.r1157Summon,x:player.x,y:player.y});}
 function drawProp(p){log.draws.push({prop:p&&p.id});}
 function sprite(){}
 var ctx={globalAlpha:1,globalCompositeOperation:'source-over',filter:'none',save(){},restore(){},beginPath(){},ellipse(){},fill(){},stroke(){},font:'',textAlign:'',fillStyle:'',strokeStyle:'',lineWidth:1,fillText(t,x,y){log.texts=(log.texts||[]);log.texts.push(t);if(!Number.isFinite(x)||!Number.isFinite(y))log.nan=(log.nan||0)+1;},strokeText(){},fillRect(x,y,w,h){if([x,y,w,h].some(v=>!Number.isFinite(v)))log.nan=(log.nan||0)+1;log.rects=(log.rects||0)+1;},
  drawImage(im,...a){log.imgs.push({src:im.src,a});if(a.some(v=>!Number.isFinite(v)))log.nan=(log.nan||0)+1;},scope(o,f){f();}};
 var asked=[];ensureImages=function(ps){asked.push(...ps);return Promise.resolve();};window.StoryPhase1={CURRENT_PUBLIC_HERO_DATA:{heroActions:Object.fromEntries(Object.keys(HEROES).map(k=>[k,{w:'act/'+k+'-w.webp',e:'act/'+k+'-e.webp',r:'act/'+k+'-r.webp'}]))}};
 window.__STORYWORLD_WER__={cast(slot,auto){if(window.__opt.loose){if(!liveEnemies().length)return false;player.skillAnim=.6;log.wer.push({hero:player.hero,slot,t:time,body:!!player.r1157Summon});return true;}const k=player.hero+':'+slot,s=player.storyWER||(player.storyWER={ready:{},buffs:{}});if(Number.isFinite(s.ready[k])&&s.ready[k]>time)return false;if(!liveEnemies().length)return false;s.ready[k]=time+13;player.skillAnim=.6;log.wer.push({hero:player.hero,slot,t:time,body:!!player.r1157Summon});return true;}};
 window.__STORYWORLD_HANDO_FINAL_R49__={autoSpecial(){if(player.specialCD>0)return;player.specialCD=9;log.q.push({hero:player.hero,t:time,body:!!player.r1157Summon});},autoTarget(){return liveEnemies()[0]||null;}};
 window.__STORYWORLD_EGO_KIT_R1094__={active:()=>window.__opt.ego!==false&&player===me&&player.egoSovereignR1046===true};
 var r720has=new Set(window.__opt.present||[]);window.__STORYWORLD_HERO_DEFENSE_R720__={has:id=>r720has.has(id),bodies:()=>[]};
 window.__STORYWORLD_POST_HOOKS__={register(m,h){(window.__hooks=window.__hooks||{})[m]=h;}};
 if(window.__opt.coop){const c=window.__opt.coop;window.__STORYWORLD_COOP_SIM_R62__={mode:()=>c.mode,isHost:()=>c.mode==='host',players:()=>[me,...(window.__guests||[])],localPlayer:()=>me};}
 `,g);
 vm.runInContext(SRC,g);
 return g;}
const A=g=>g.__STORYWORLD_EGO_SUMMON_R1157__;
const run=(g,code)=>vm.runInContext(code,g);
function step(g,k=1,dt=.05){for(let i=0;i<k;i++){g.time=+(g.time+dt).toFixed(4);run(g,`time=${g.time};for(const d of delays.splice(0)){if(d.t<=time)d.f();else delays.push(d);}player.skillAnim=Math.max(0,player.skillAnim-${dt});window.__hooks&&Object.values(window.__hooks).forEach(h=>h.tick&&h.tick());`);}}
// 조종 영웅이 R 을 쓴 것처럼: ready 가 앞으로 뛰고 skillAnim 이 켜진다
function castR(g,who='player'){run(g,`${who}.storyWER.ready['hwando:r']=time+13;${who}.skillAnim=.6;`);}
const mob=(id,x,y)=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3});
if(!SRC){console.log(`\nR1157 CPU: ${n-bad}/${n} 통과`);process.exit(1);}

let g=env();
ok(!!A(g)&&/^R1157/.test(String(A(g).revision)),'API 열림(__STORYWORLD_EGO_SUMMON_R1157__)');
ok(A(g).tuning.DUR===7&&A(g).tuning.CD===.7&&A(g).tuning.EXT===7,'수치: 7초·쿨 0.7초·연장 7초',A(g).tuning);
// ① EGO 가 아니면(환도 본인) R 을 써도 소환 없음
{const h=env({ego:false});h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,3);ok(A(h).bodies().length===0,'① 환도 본인(EGO 아님) R → 소환 없음');}
// ② 형상 전환처럼 ready 만 뛰고 시전 자세가 없으면 소환 없음(오발동 방지)
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);run(h,`player.storyWER.ready['hwando:r']=time+9;`);step(h,3);ok(A(h).bodies().length===0,'② R 대기만 바뀌고 시전 자세 없음 → 소환 없음');}
// ③ EGO R → 영웅 하나 소환
g=env({present:['neon']});g.room.enemies.push(mob('a',13,10));step(g,2);castR(g);step(g,1);
{const bs=A(g).bodies();ok(bs.length===1,'③ EGO R → 영웅 1명 소환',A(g).inspect());
 const b=bs[0]||{};ok(Object.keys(g.HEROES).includes(b.hero)&&b.hero!=='hwando','③ 기본 영웅 8명 중에서, EGO 자신(환도)은 제외',b.hero);
 ok(b.hero!=='neon','③ 이미 판에 있는 영웅(배치 네온)과 겹치지 않음',b.hero);
 ok(b.egoSovereignR1046!==true&&b.personaHeroR1113!==true,'③ 소환 몸은 EGO·페르소나 형상이 아님(기본 영웅)');
 ok(b.r720Ally===true&&b.r1157Summon===true,'③ 몸 표식: r720Ally + r1157Summon');
 ok(g.room.props.some(p=>p&&p.r1157Prop),'③ 방 소품으로 깊이 정렬에 들어감');
 ok(!g.room.enemies.some(e=>e&&e.r1157Summon),'③ room.enemies 에 넣지 않음');}
// 고르기: 비어 있는 영웅만, 무작위
{const seen=new Set();for(let i=0;i<40;i++){const h=env({present:['neon','seoha']});h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,1);const b=A(h).bodies()[0];if(b)seen.add(b.hero);}
 ok(seen.size>=3&&!seen.has('neon')&&!seen.has('seoha')&&!seen.has('hwando'),'고르기: 무작위(여러 영웅이 나옴), 판에 있는 영웅·환도 제외',[...seen]);}
// ④ 싸움: 기본 공격·스킬을 몸으로, 쿨타임 0.7초
step(g,140);// 7초
{const hero=A(g).inspect().summons[0]?.hero||g.log.wer.find(w=>w.body)?.hero;
 const w=g.log.wer.filter(x=>x.body),q=g.log.q.filter(x=>x.body);
 ok(g.log.basic.some(x=>/:body$/.test(x)),'④ 소환 영웅이 기본 공격(몸으로)');
 ok(q.length>=5,'④ 고유기(Q) 0.7초 쿨로 여러 번(7초에 5번 이상)',q.length);
 for(const s of ['w','e','r']){const c=w.filter(x=>x.slot===s);ok(c.length>=5,'④ '+s.toUpperCase()+' 0.7초 쿨로 여러 번(7초에 5번 이상)',c.length);
  const gaps=c.slice(1).map((x,i)=>+(x.t-c[i].t).toFixed(3));ok(gaps.every(d=>d>=.69),'④ '+s.toUpperCase()+' 간격은 0.7초보다 짧지 않음',gaps.slice(0,6));}
 ok(g.log.hits.some(h=>h.body),'④ 피해는 엔진 hitEnemy 로(몸 차례 = player 가 소환 영웅 → 그 영웅 확률 패시브가 굴러감)');
 ok(g.log.hits.filter(h=>h.body).every(h=>h.hero!=='hwando'),'④ 몸 차례 타격의 player.hero 는 소환 영웅');
 ok(g.player===g.me&&g.player.hero==='hwando'&&g.player.egoSovereignR1046===true,'④ 차례가 끝나면 조종 EGO 로 되돌아옴');
 ok(g.me.storyWER.ready['hwando:r']>g.time+3,'④ EGO 자신의 R 대기는 그대로(0.7초 적용은 소환 영웅만)',g.me.storyWER.ready['hwando:r']-g.time);
 const bh=g.log.hits.filter(h=>h.body&&h.v>0);ok(bh.length>0&&bh.every(h=>Math.abs(h.v-10*A(g).tuning.HERO_K)<1e-9||h.v<10),'④ 소환 영웅 공격력 = EGO 공격력 × HERO_K',bh.slice(0,2));}
// ⑤ 7초 뒤 사라짐
step(g,6);{ok(A(g).bodies().length===0,'⑤ 7초 뒤 사라짐',A(g).inspect());ok(!g.room.props.some(p=>p&&p.r1157Prop),'⑤ 방 소품도 걷힘');}
// ⑥ 끝난 몸의 지연 작업은 돌지 않음
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);const b=A(h).bodies()[0];
 let ran=0;h.__ran=()=>ran++;A(h).qaAs(b,()=>run(h,'delay(8,()=>window.__ran())'));step(h,180);ok(ran===0&&A(h).bodies().length===0,'⑥ 사라진 몸의 지연 작업은 버림');}
// ⑦ 처치 경험치는 주인에게
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);const b=A(h).bodies()[0];A(h).qaAs(b,()=>run(h,'gainXP(5)'));ok(h.log.xp.length===1&&h.log.xp[0].who==='me','⑦ 몸 차례의 경험치는 EGO 주인에게',h.log.xp);}
// ⑧ 소환 영웅이 또 소환하면 둘 다 7초 연장, 같이 사라짐(상한 있음)
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);const b=A(h).bodies()[0],u0=A(h).inspect().summons[0].until;
 const sub={end:h.time+7};const r1=A(h).chain(b,sub,'end');const u1=A(h).inspect().summons[0].until;
 ok(Math.abs(u1-(u0+7))<1e-9&&sub.end===u1&&r1===u1,'⑧ 소환 영웅의 소환 → 소환 영웅 +7초, 새 소환도 같은 때 끝',{u0,u1,sub:sub.end});
 const sub2={until:h.time+7};A(h).chain(b,sub2,'until');ok(sub.end===sub2.until&&sub2.until===A(h).inspect().summons[0].until,'⑧ 또 이어지면 모두 같은 끝 시각으로 맞춰짐');
 for(let i=0;i<10;i++)A(h).chain(b,{end:0},'end');const cap=A(h).inspect().summons[0].until-A(h).inspect().summons[0].t0;
 ok(cap<=A(h).tuning.DUR+A(h).tuning.EXT*A(h).tuning.MAX_EXT+1e-9,'⑧ 연장 상한(끝없이 늘지 않음)',cap);
 ok(A(h).chain({hero:'x'},{end:5},'end')===false,'⑧ 소환 몸이 아니면 연장 안 함');
 run(h,'room={id:"z2",enemies:[],props:[]}');step(h,2);ok(A(h).bodies().length===0&&b.hp===0&&sub.end<=h.time&&sub2.until<=h.time,'⑧ 주인 소환이 끝나면 이어진 소환도 같이 끝(몸 hp 0, 끝 시각 지금)',{hp:b.hp,end:sub.end,t:h.time});}
// ⑨ 지역 이동·서사 장면·EGO 쓰러짐·끄기 → 즉시 걷힘
for(const [name,code] of [['지역 이동','room={id:"z9",enemies:[],props:[]}'],['서사 장면','storyScene={}'],['EGO 쓰러짐','player.hp=0']]){const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);run(h,code);step(h,2);ok(A(h).bodies().length===0,'⑨ '+name+' → 걷힘');}
{const h=env({ls:{'storyworld.r1157.egoSummon':'{"on":false}'}});h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);ok(A(h).bodies().length===0,'⑨ 끄기(localStorage) → 소환 없음');}
// ⑩ 두 번째 R(첫 소환이 남아 있을 때) → 다른 영웅, 동시 상한
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);A(h).chain(A(h).bodies()[0],{end:0},'end');step(h,20);castR(h);step(h,2);const bs=A(h).bodies();
 ok(bs.length===2&&bs[0].hero!==bs[1].hero,'⑩ 남아 있을 때 또 R → 다른 영웅 하나 더(겹치지 않음)',bs.map(b=>b.hero));
 step(h,20);castR(h);step(h,2);ok(A(h).bodies().length<=A(h).tuning.MAX_LIVE,'⑩ 동시 소환 상한',A(h).bodies().length);}
// ⑪ 그리기: 몸은 엔진 drawHero 로(그 몸 차례), 발밑 백적 고리·등장 소용돌이는 기존 손그림 시트, 좌표 NaN 없음
{const h=env();h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);const p=h.room.props.find(x=>x&&x.r1157Prop);
 h.log.draws.length=0;h.log.imgs.length=0;run(h,'drawProp(room.props.find(x=>x&&x.r1157Prop))');
 ok(h.log.draws.some(d=>d.body&&d.hero!=='hwando'),'⑪ drawProp → 소환 몸으로 drawHero',h.log.draws);
 ok(h.player===h.me,'⑪ 그린 뒤 조종 영웅으로 되돌아옴');
 ok(h.log.imgs.some(i=>/sig-aura-red\.webp$/.test(i.src)),'⑪ 발밑 백적 고리 = 기존 시트 r100 sig-aura-red');
 ok(h.log.imgs.some(i=>/sig-gather-red\.webp$/.test(i.src)),'⑪ 등장 소용돌이 = 기존 시트 r100 sig-gather-red');
 ok((h.log.texts||[]).some(t=>t.includes(h.HEROES[A(h).bodies()[0].hero].name)),'⑪ 아군 표시: 머리 위 영웅 이름',h.log.texts);
 ok((h.log.rects||0)>=2,'⑪ 남은 시간 막대',h.log.rects);
 ok(!h.log.nan,'⑪ 그리기 좌표 NaN 없음');
 run(h,'drawProp({id:"x"})');ok(h.log.draws.some(d=>d.prop==='x'),'⑪ 다른 소품은 원래 drawProp');}
// ⑫ 모든 모드: 협동 손님 화면은 직접 소환하지 않음(방장이 돌림), 방장은 손님 EGO 의 R 도 소환
{const h=env({coop:{mode:'guest'}});h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);ok(A(h).bodies().length===0,'⑫ 협동 손님 화면: 직접 소환 안 함(방장 판정)');}
{const h=env({coop:{mode:'host'}});h.room.enemies.push(mob('a',13,10));run(h,`window.__guests=[{id:'guest',hero:'hwando',x:12,y:12,hp:100,ap:20,level:5,egoSovereignR1046:true,storyWER:{ready:{},buffs:{}},skillAnim:0}]`);step(h,2);
 castR(h,'window.__guests[0]');step(h,2);const bs=A(h).bodies();ok(bs.length===1,'⑫ 협동 방장: 손님 EGO 의 R → 소환',A(h).inspect());
 if(bs[0]){A(h).qaAs(bs[0],()=>run(h,'gainXP(3)'));ok(h.log.xp.some(x=>x.who==='guest'),'⑫ 손님 소환 몸의 경험치는 손님에게',h.log.xp);ok(A(h).inspect().summons[0].owner==='guest','⑫ 주인 = 손님');}
 ok(h.player===h.me,'⑫ 방장 player 그대로');}
{const h=env({coop:{mode:'host'}});h.room.enemies.push(mob('a',13,10));run(h,`window.__guests=[{id:'g2',hero:'neon',x:12,y:12,hp:100,storyWER:{ready:{},buffs:{}}}]`);step(h,2);castR(h);step(h,2);
 ok(A(h).bodies().length===1&&A(h).bodies()[0].hero!=='neon','⑫ 협동: 다른 사람이 쓰는 영웅(네온)과 겹치지 않음',A(h).bodies().map(b=>b.hero));}
// ⑭ 배우지 않은 스킬도 소환 동안 쓴다(R663 잠금: 몸만 Q·W·E·R 1단계 이상), 주인의 배움 상태는 그대로
{const h=env();run(h,"player.progressionR62={version:1,ranks:{skillQR663:0,skillWR663:2,endlessPower:3},points:0}");h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,2);const b=A(h).bodies()[0];
 const rk=A(h).qaAs(b,()=>run(h,'({...player.progressionR62.ranks})'));
 ok(rk&&rk.skillQR663>=1&&rk.skillWR663===2&&rk.skillER663>=1&&rk.skillRR663>=1&&rk.endlessPower===3,'⑭ 몸: Q·W·E·R 최소 1단계, 나머지 강화는 주인 값',rk);
 ok(h.me.progressionR62.ranks.skillQR663===0&&!('skillER663' in h.me.progressionR62.ranks),'⑭ 주인 EGO 의 배움 상태는 안 바뀜',h.me.progressionR62.ranks);}
// ⑮ 엔진 칸 대기를 안 쓰는 스킬(기억사수 R561 처럼 다른 겹이 맡음)도 0.7초보다 자주 나가지 않음 — 몸마다 칸별 대기를 따로 센다
{const h=env({loose:true});h.room.enemies.push(mob('a',13,10));step(h,2);castR(h);step(h,100);
 for(const k of ['w','e','r']){const c=h.log.wer.filter(x=>x.body&&x.slot===k),gaps=c.slice(1).map((x,i)=>+(x.t-c[i].t).toFixed(3));
  ok(c.length>=4&&gaps.every(d=>d>=.69),'⑮ 대기를 안 남기는 '+k.toUpperCase()+' 도 0.7초 간격',{n:c.length,gaps:gaps.slice(0,5)});}}
// ⑯ EGO 일 때 소환 후보 영웅의 몸 그림·W·E·R 시전 그림을 미리 받는다(그림이 없으면 엔진 cast 가 거절)
{const h=env({present:['neon']});h.room.enemies.push(mob('a',13,10));step(h,3);const as=h.asked;
 ok(['seoha','lauren','hunter','slayer','gunner','michaela'].every(k=>as.includes('act/'+k+'-w.webp')&&as.includes('act/'+k+'-r.webp')),'⑯ 후보 영웅 W·E·R 시전 그림 미리 받기',as.filter(x=>/^act/.test(x)).length);
 ok(!as.includes('act/neon-w.webp')&&!as.includes('act/hwando-w.webp'),'⑯ 후보 아닌 영웅(판에 있는 네온·환도)은 안 받음');}
// ⑬ 오류 없음
ok(A(g).inspect().stats.errors===0,'⑬ 오류 0',A(g).inspect().lastError);
console.log(`\nR1157 CPU: ${n-bad}/${n} 통과`);process.exit(bad?1:0);

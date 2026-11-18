// R1144 실패 먼저 — 페르소나 영웅 W·E·R 덧효과 (사용자 2026-11-18 05:44Z·05:45Z).
//  W 순수악의의 분기: 표식 붙은 적끼리 언주 번개 연쇄 + 피해 / E 욕망의 일식: 주변 적에게 언주 구슬(기본 공격) + 화상 도트 /
//  R 악의의 관통: 언주 구슬이 영웅 둘레를 돌며 닿은 적에게 피해 + 화상 도트. 페르소나 형상만, 키 그대로, 그림은 기존 영웅 시트에 색만(언주·흑).
// 검사: ① 연결 ② 형상 아님·끔 → 아무 일 없음 ③ W 연쇄 ④ E 구슬·화상 ⑤ R 회전 구슬 ⑥ 화상 균형 ⑦ 불러오기·방 이동·쓰러짐 ⑧ 본편 수치·키 그대로 ⑨ 그리기(시트·주인·흑 밑그림) ⑩ 페르소나 굽기 연동
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'../..'),rd=f=>{try{return fs.readFileSync(path.join(ROOT,f),'utf8');}catch(_){return'';}};
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const N='persona-wer-r1144.js',MOD=rd('client-source/'+N),SRC=rd('client-source/persona-hero-r1113.js'),FILE=path.join(ROOT,'client-source/persona-hero-r1113.js');
const hooks=rd('client-source/ego-sovereign-r1046.js');
// ① 연결
{const html=rd('runtime-text/index.html');ok(MOD.length>0&&rd('runtime-text/'+N)===MOD,'① '+N+' runtime-text 사본 = client-source');
 const t=x=>html.indexOf('<script src="./'+x+'"></script>');ok(t(N)>0&&t(N)>t('persona-hero-r1113.js')&&t(N)>t('ego-sovereign-r1046.js'),'① 스크립트 태그: persona-hero-r1113 뒤');
 ok(rd('../scripts/verify-r96-public.py').includes("'"+N+"'"),'① verify-r96-public.py 기대 목록');ok(rd('runtime-manifest.json').includes(N)&&rd('runtime-inputs.json').includes(N),'① runtime-manifest·inputs');
 ok(rd('../.github/workflows/pages.yml').includes('node r96/qa/r1144/persona-wer-cpu-check.cjs'),'① pages.yml CPU 검사 줄');
 for(const p of ['assets/r562/dots/neon-chain.webp','assets/r535/dots/hunter-burn.webp','assets/r946/lauren-red.webp'])ok(rd('runtime-manifest.json').includes(p),'① 재사용 시트가 매니페스트에 있음(새 자산 없음): '+p);
 ok(!/addEventListener\(\s*['"]key/.test(MOD)&&!/bindings|KeyboardEvent/.test(MOD),'① 키를 새로 듣지 않음(스킬 키 그대로)');
 ok(!/drop-shadow|blur\(/.test(MOD),'① 기록기가 못 받는 필터 없음');}
function env(opt={}){const hits=[];const g={localStorage:{_s:{...(opt.store||{})},getItem(k){return this._s[k]??null;},setItem(k,v){this._s[k]=String(v);}},console,hits,Math,Map,Set,Object,Array,Number,String,JSON};g.window=g;vm.createContext(g);
 vm.runInContext(`var time=10,started=true,loading=false,modal=null,storyScene=null,zoom=1,TILE=34;
  var player={hero:${JSON.stringify(opt.hero||'lauren')},x:10,y:10,hp:100,ap:10,skillAnim:0,storyWER:{ready:{},buffs:{}}};var room={id:'z1',enemies:[],props:[]};var effects=[];var FORM=${opt.form!==false};
  window.__STORYWORLD_PERSONA_HERO_R1113__={formActive:()=>FORM};
  function liveEnemies(){return room.enemies.filter(e=>e.hp>0);}function damageable3(e){return !e.immune;}function clearLine(a,b){return !b.walled;}function attackPower(){return player.ap;}
  function hitEnemy(e,v,s){hits.push({id:e.id,v:+v.toFixed(6),k:s&&s.kind,t:+time.toFixed(3),src:s});e.hp-=v;return true;}function tick(){}function drawEffect(e){}
  function project(x,y){return{x:(x-y)*34+480,y:(x+y)*17};}function actorHeight(){return 66;}
  var seen=[],cur=null,READY=${opt.sheets!==false};function readyImage(p){if(!READY)return null;const c=/r946/.test(p)?192:256;return {image:{src:p,naturalWidth:c*6,naturalHeight:c*4}};}var asked=[];function ensureImages(a){asked.push(...a);return Promise.resolve();}
  var st=[];var ctx={filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',translate(){},rotate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},arc(){},
   save(){st.push([ctx.globalAlpha,ctx.globalCompositeOperation,ctx.filter]);},restore(){const s=st.pop();if(s){ctx.globalAlpha=s[0];ctx.globalCompositeOperation=s[1];ctx.filter=s[2];}},
   drawImage(im,...a){seen.push({op:'image',src:im.src,a,o:cur,comp:ctx.globalCompositeOperation,filter:ctx.filter});},fill(){seen.push({op:'fill',o:cur});},stroke(){seen.push({op:'stroke',o:cur});},scope(o,f){const p=cur;cur=o;try{f();}finally{cur=p;}}};
  // 본편 W·E·R 을 쓴 것처럼(대기·시전 자세)
  function castWER(slot,cd){player.storyWER.ready['lauren:'+slot]=time+cd;player.skillAnim=.6;}`,g);
 if(opt.hooks!==false)vm.runInContext(hooks,g);vm.runInContext(MOD,g,{filename:N});return g;}
const Z=g=>g.__STORYWORLD_PERSONA_WER_R1144__;
const mob=(id,x,y,extra={})=>({id,x,y,hp:1e6,maxHp:1e6,radius:.3,spawnState:'active',...extra});
const step=(g,n=1,dt=.05)=>{for(let i=0;i<n;i++){vm.runInContext('time=+(time+'+dt+').toFixed(4);player.skillAnim=Math.max(0,player.skillAnim-'+dt+');tick();for(const e of effects.slice())drawEffect(e)',g);}};
const H=(g,k)=>g.hits.filter(h=>h.k==='r1144-'+k);
const cast=(g,slot,cd=6.9)=>{vm.runInContext(`castWER(${JSON.stringify(slot)},${cd})`,g);};
const mark=(g,ids,sec=3)=>vm.runInContext(`for(const e of room.enemies)if(${JSON.stringify(ids)}.includes(e.id))e.storyWERExposeUntil=time+${sec}`,g);
if(!MOD){ok(false,'모듈 파일 없음: client-source/'+N);console.log('FAILED '+fails);process.exit(1);}
// ② 형상 아님·끔
{let g=env({form:false});g.room.enemies.push(mob('a',12,10),mob('b',13,10));step(g,2);for(const s of ['w','e','r']){cast(g,s);mark(g,['a','b']);step(g,80);}
 ok(g.hits.length===0&&Z(g).inspect().stats.casts.w===0,'② 라우렌 본인(형상 아님) → 덧효과 0');
 g=env({store:{'storyworld.r1144.personaWer':'{"on":false}'}});g.room.enemies.push(mob('a',12,10));step(g,2);cast(g,'r');step(g,80);ok(g.hits.length===0,'② 끄기 설정 → 0');
 g=env({hero:'hwando'});g.room.enemies.push(mob('a',12,10));step(g,2);vm.runInContext("player.storyWER.ready['hwando:w']=time+5;player.skillAnim=.6",g);step(g,40);ok(g.hits.length===0,'② 다른 영웅 → 0');}
// ③ W 연쇄
{const g=env();g.room.enemies.push(mob('a',12,10),mob('b',14,10),mob('c',16,10),mob('u',11,11),mob('far',30,10));step(g,2);cast(g,'w');step(g,2);mark(g,['a','b','c','far']);step(g,10);
 let h=H(g,'chain');ok(h.length===3&&['a','b','c'].every(id=>h.filter(x=>x.id===id).length===1)&&h.every(x=>Math.abs(x.v-6)<1e-9),'③ 표식 붙은 셋이 한 번씩 0.6배(=6) ('+h.map(x=>x.id+':'+x.v).join(',')+')');
 ok(!h.some(x=>x.id==='u'||x.id==='far'),'③ 표식 없는 적·9칸 밖 적은 안 맞음');ok(h[0].id==='a'&&h[1].id==='b'&&h[2].id==='c'&&h[0].t<=h[1].t&&h[1].t<=h[2].t,'③ 가까운 순으로 이어짐');
 ok(Z(g).inspect().stats.links===2,'③ 적끼리 잇는 번개 2줄 ('+Z(g).inspect().stats.links+')');
 step(g,30);h=H(g,'chain');ok(h.length===6,'③ 1.2초 뒤 한 번 더(표식이 남아 있으면) ('+h.length+')');step(g,60);ok(H(g,'chain').length===6,'③ 두 번으로 끝');
 ok(h.every(x=>x.src.friendly===true&&x.src.owner==='hero'&&x.src.sourceHero==='lauren'),'③ 피해 출처 = 영웅(아군 판정)');}
{const g=env();g.room.enemies.push(mob('a',12,10));step(g,2);cast(g,'w');step(g,2);mark(g,['a'],.6);step(g,10);ok(H(g,'chain').length===1&&Z(g).inspect().stats.links===1,'③ 표식 적이 하나면 영웅에게서 한 줄');step(g,40);ok(H(g,'chain').length===1,'③ 표식이 끝난 적은 두 번째에 안 맞음');}
{const g=env();for(let i=0;i<12;i++)g.room.enemies.push(mob('m'+i,10.5+i*.5,10));step(g,2);cast(g,'w');step(g,2);mark(g,g.room.enemies.map(e=>e.id));step(g,16);ok(H(g,'chain').length===8,'③ 한 번에 최대 8마리 ('+H(g,'chain').length+')');}
{const g=env();g.room.enemies.push(mob('a',12,10),mob('b',12.5,18.5));step(g,2);cast(g,'w');step(g,2);mark(g,['a','b']);step(g,10);ok(H(g,'chain').length===1,'③ 마디가 7칸 넘게 떨어지면 끊김');}
// ④ E 구슬 + 화상
{const g=env();g.room.enemies.push(mob('a',11,10),mob('b',12,10),mob('c',13,10),mob('d',13.5,10.5),mob('e5',14,10),mob('far',16,10),mob('w',11,11,{walled:true}));step(g,2);cast(g,'e',5.85);step(g,20);
 const o=H(g,'orb');ok(o.length===4&&o.map(x=>x.id).sort().join()==='a,b,c,d'&&o.every(x=>Math.abs(x.v-6)<1e-9),'④ 4.5칸 안 가까운 넷에게 구슬 0.6배 ('+o.map(x=>x.id).join()+')');
 ok(Z(g).inspect().burning===4,'④ 맞은 적은 불탄다 ('+Z(g).inspect().burning+')');step(g,70);
 const b=H(g,'burn').filter(x=>x.id==='a');ok(b.length===5&&Math.abs(b.reduce((n,x)=>n+x.v,0)-3)<1e-6,'④ 화상: 다섯 번에 걸쳐 합계 0.3배(=3) ('+b.length+'번, 합 '+b.reduce((n,x)=>n+x.v,0).toFixed(3)+')');
 ok(b.every((x,i)=>!i||Math.abs(x.t-b[i-1].t-.5)<.051)&&b[4].t-o.find(x=>x.id==='a').t<=2.6,'④ 0.5초마다, 2.5초 안에 끝');ok(Z(g).inspect().burning===0,'④ 다 타면 사라짐');}
// ⑤ R 회전 구슬
{const g=env();g.room.enemies.push(mob('near',11.5,10),mob('mid',10,12.6),mob('far',15,10));step(g,2);cast(g,'r',21);step(g,2);ok(Z(g).inspect().orbit===false,'⑤ 발동 직전엔 구슬 없음');step(g,4);ok(Z(g).inspect().orbit===true,'⑤ 0.14초 뒤 구슬이 돈다');step(g,80);
 const h=H(g,'orbit'),n=h.filter(x=>x.id==='near');ok(n.length>=3&&n.length<=5&&n.every(x=>Math.abs(x.v-3.5)<1e-9),'⑤ 궤도 위 적: 0.35배(=3.5)씩 3~5번 ('+n.length+')');
 ok(n.every((x,i)=>!i||x.t-n[i-1].t>=.6-1e-6),'⑤ 적마다 0.6초에 한 번');ok(!h.some(x=>x.id==='far'||x.id==='mid'),'⑤ 궤도 밖 적은 안 맞음');
 ok(Z(g).inspect().orbit===false&&n.at(-1).t-n[0].t<=3.01,'⑤ 3초 뒤 끝');ok(H(g,'burn').some(x=>x.id==='near'),'⑤ 닿은 적은 불탄다');}
// ⑥ 화상 균형
{const g=env();for(let i=0;i<16;i++)g.room.enemies.push(mob('m'+i,11.5,10));step(g,2);cast(g,'r',21);step(g,8);ok(Z(g).inspect().burning===12,'⑥ 한 번에 12마리까지 ('+Z(g).inspect().burning+')');}
{const g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);step(g,70);step(g,60);const b=H(g,'burn');
 const span=b.at(-1).t-b[0].t;ok(b.length<=Math.ceil((3+2.5)/.5)+1&&b.every(x=>Math.abs(x.v-.6)<1e-9),'⑥ 다시 걸려도 겹치지 않고 시간만 새로(틱 0.06배씩 '+b.length+'번, '+span.toFixed(2)+'초)');}
// ⑦ 불러오기·방 이동·쓰러짐
{let g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);vm.runInContext("player.storyWER={ready:{'lauren:r':time+20,'lauren:w':time+5},buffs:{}}",g);step(g,60);ok(g.hits.length===0,'⑦ 불러오기(대기만 채워짐, 시전 자세 없음) → 덧효과 없음');
 g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);step(g,10);vm.runInContext("room={id:'z2',enemies:room.enemies,props:[]}",g);const n0=g.hits.length;step(g,60);ok(g.hits.length===n0&&Z(g).inspect().orbit===false&&Z(g).inspect().burning===0,'⑦ 방이 바뀌면 모두 거둠');
 g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);step(g,10);vm.runInContext('player.hp=0',g);const n1=g.hits.length;step(g,60);ok(g.hits.length===n1,'⑦ 쓰러지면 멈춤');
 g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);step(g,10);vm.runInContext('FORM=false',g);const n2=g.hits.length;step(g,60);ok(g.hits.length===n2,'⑦ 형상을 끄면 멈춤');
 g=env({hooks:false});g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);step(g,30);ok(H(g,'orbit').length>0,'⑦ 훅 모음이 없어도 tick 감싸기로 돈다');}
// ⑧ 본편 수치·키 그대로
{const html=rd('runtime-text/index.html');ok(html.includes("lauren:{w:['거짓 분리',6,'expose'],e:['심문자의 전이',4.5,'dash'],r:['진명 심판',14,'execute']}")&&html.includes("bindings={z:'w',x:'e',c:'r'}"),'⑧ 본편 W·E·R 정의·키 그대로');
 const g=env();g.room.enemies.push(mob('a',11.5,10));step(g,2);cast(g,'r',21);const rdy=vm.runInContext("player.storyWER.ready['lauren:r']",g);step(g,80);ok(vm.runInContext("player.storyWER.ready['lauren:r']",g)===rdy&&vm.runInContext('player.ap',g)===10,'⑧ 대기·공격력을 건드리지 않음');
 const T=Z(g).tune;ok(T.chain.k===.6&&T.chain.pulses===2&&T.chain.max===8&&T.volley.k===.6&&T.volley.max===4&&T.volley.reach===4.5&&T.orbit.k===.35&&T.orbit.n===3&&T.orbit.time===3&&T.orbit.gap===.6&&T.burn.total===.3&&T.burn.time===2.5&&T.burn.every===.5&&T.burn.max===12,'⑧ 수치 표');}
// ⑨ 그리기
{const g=env();g.room.enemies.push(mob('a',11.5,10),mob('b',13,10));step(g,2);cast(g,'w');step(g,2);mark(g,['a','b']);step(g,4);cast(g,'e',5.85);step(g,4);cast(g,'r',21);step(g,8);
 const s=vm.runInContext('seen',g),ids=k=>s.filter(x=>x.o&&String(x.o.id).startsWith('r1144:'+k));
 ok(['chain','orb','orbit','burn'].every(k=>ids(k).length>0),'⑨ 번개·구슬·회전 구슬·화상 모두 그림 ('+['chain','orb','orbit','burn'].map(k=>k+':'+ids(k).length).join(' ')+')');
 ok(s.every(x=>x.o&&x.o.kind==='effect')&&s.filter(x=>!/:shade$/.test(x.o.id)).every(x=>x.o.pxfSide==='hero'),'⑨ 모두 이펙트 주인(ctx.scope), 밑그림 말고는 영웅 쪽 — 페르소나 굽기가 언주로 바꿈');
 ok(ids('chain').every(x=>x.src==='assets/r562/dots/neon-chain.webp')&&ids('burn').every(x=>x.src==='assets/r535/dots/hunter-burn.webp')&&[...ids('orb'),...ids('orbit')].every(x=>x.src==='assets/r946/lauren-red.webp'),'⑨ 기존 영웅 시트 재사용(네온 번개·헌터 화상·은빛 거성 구)');
 const sh=ids('chain').filter(x=>/:shade$/.test(x.o.id)),top=ids('chain').filter(x=>!/:shade$/.test(x.o.id));ok(sh.length>0&&sh.every(x=>x.filter==='brightness(0)'&&!x.o.pxfSide&&x.comp==='source-over')&&top.length>0&&top.every(x=>x.comp==='lighter'&&x.filter==='none'),'⑨ 번개: 흑 밑그림(brightness(0), 보통 겹치기) + 언주 번개(빛 더하기)');
 ok(ids('chain').every(x=>x.a[2]===256&&x.a[3]===256&&x.a[0]%256===0&&x.a[1]%256===0)&&ids('orbit').every(x=>x.a[2]===192&&x.a[0]%192===0),'⑨ 시트 칸 크기대로 자름');
 ok(vm.runInContext('effects.filter(e=>e.r1144Sentinel).length',g)===1,'⑨ 표지 하나');step(g,200);ok(vm.runInContext('effects.filter(e=>e.r1144Sentinel).length',g)===0&&vm.runInContext('st.length',g)===0,'⑨ 끝나면 표지 치움·save 짝 맞음');
 ok(Z(g).inspect().stats.errors===0,'⑨ 오류 0 ('+Z(g).inspect().stats.lastError+')');
 const g2=env({sheets:false});g2.room.enemies.push(mob('a',11.5,10),mob('b',13,10));step(g2,2);cast(g2,'w');step(g2,2);mark(g2,['a','b']);step(g2,4);cast(g2,'r',21);step(g2,8);
 const s2=vm.runInContext('seen',g2);ok(s2.length>0&&s2.every(x=>x.op!=='image')&&Z(g2).inspect().stats.tempDraws>0&&Z(g2).inspect().stats.errors===0,'⑨ 시트가 안 읽혔으면 임시 코드 그림');
 ok(vm.runInContext('asked',g2).includes('assets/r562/dots/neon-chain.webp'),'⑨ 안 읽힌 시트를 부탁함');}
// ⑪ (진) 쌍성 소멸 부채꼴 레이저 (사용자 06:23Z "가는곳에 저렇게 흑적색 레이져가 펴지면서 (맵끝까지) 일반몹즉사 보스몹 최대체력7프로 추가데미지")
{const fake=(g)=>{vm.runInContext(`var N=64;var VIO={procs:0,acts:[]};window.__STORYWORLD_LAUREN_CELESTIAL_R946__={inspect:()=>({acts:VIO.acts.map(a=>({...a})),stats:{procs:{violet:VIO.procs}}})};
  function fireViolet(ux,uy){VIO.procs++;VIO.acts.push({kind:'violet',x:player.x+ux*.9,y:player.y+uy*.9,t0:time});}`,g);};
 let g=env();fake(g);g.room.enemies.push(mob('n1',14,10),mob('n2',30,10.6),mob('n3',20,14.2),mob('n4',20,11.3),mob('boss',24,10,{boss:true,hp:5000,maxHp:5000}),mob('side',10,20),mob('behind',6,10));step(g,2);
 vm.runInContext('fireViolet(1,0)',g);step(g,4);ok(H(g,'laser').length===0,'⑪ 쌍성 충전(0.5초) 동안은 레이저 없음');step(g,16);
 const L=H(g,'laser'),id=k=>L.filter(h=>h.id===k);
 ok(['n1','n2','n3','n4'].every(k=>id(k).length===1&&g.room.enemies.find(e=>e.id===k).hp<=0),'⑪ 부채꼴 안 일반 몹은 즉사(맵 끝 30칸 거리까지) ('+L.map(h=>h.id).join(',')+')');
 const b=id('boss');ok(b.length===1&&Math.abs(b[0].v-350)<1e-6&&g.room.enemies.find(e=>e.id==='boss').hp>0,'⑪ 보스는 최대 체력 7%(=350) 추가 피해, 즉사 아님 ('+(b[0]&&b[0].v)+')');
 ok(!id('side').length&&!id('behind').length,'⑪ 부채꼴 밖·뒤쪽 적은 안 맞음');
 ok(L.every(h=>h.src.friendly===true&&h.src.r946===true&&h.src.sourceHero==='lauren'),'⑪ 영웅 피해, 천체 공명을 다시 굴리지 않게 r946 표식');
 ok(JSON.stringify(Z(g).tune.laser.rays)==='[-0.42,-0.28,-0.14,0,0.14,0.28,0.42]','⑪ 레이저 일곱 줄(사용자 06:42Z), ±24도');
 step(g,40);ok(H(g,'laser').length===L.length,'⑪ 한 번만');
 const s=vm.runInContext('seen',g).filter(x=>x.o&&/^r946:violet:laser:/.test(String(x.o.id)));ok(s.length>0&&s.every(x=>x.o.kind==='effect'&&x.o.pxfSide==='hero'),'⑪ 그림 주인 r946:violet:laser:* (페르소나 검빨 굽기 대상) ('+s.length+')');
 ok(s.filter(x=>x.op==='image').every(x=>x.src==='assets/r562/dots/neon-chain.webp'),'⑪ 레이저 결 = 기존 네온 번개 시트 재사용');
 g=env({form:false});fake(g);g.room.enemies.push(mob('n1',14,10));step(g,2);vm.runInContext('fireViolet(1,0)',g);step(g,30);ok(H(g,'laser').length===0,'⑪ 라우렌 본인(형상 아님) → 레이저 없음');
 g=env();fake(g);g.room.enemies.push(mob('n1',14,10));step(g,2);vm.runInContext("VIO.acts.push({kind:'red',x:11,y:10,t0:time})",g);step(g,30);ok(H(g,'laser').length===0,'⑪ 다른 갈래 → 없음');
 g=env();fake(g);vm.runInContext('player.x=88;player.y=60;room.exploration={expanded:true,bounds:[0,0,120,120]}',g);g.room.enemies.push(mob('x1',100,60),mob('x2',118,60.3));step(g,2);vm.runInContext('fireViolet(1,0)',g);step(g,30);ok(H(g,'laser').filter(h=>/^x/.test(h.id)).length===2,'⑪ 넓힌 탐험 맵(경계 120)에서는 그 끝까지 ('+H(g,'laser').map(h=>h.id)+')');
 g=env();fake(g);g.room.enemies.push(mob('n1',14,10),mob('far',70,10));step(g,2);vm.runInContext('fireViolet(1,0)',g);step(g,30);ok(H(g,'laser').some(h=>h.id==='n1')&&!H(g,'laser').some(h=>h.id==='far'),'⑪ 맵(N=64) 밖까지는 안 감');}
// ⑩ 페르소나 굽기 연동(persona-hero-r1113): 다른 영웅 시트도 언주로, personaTone 흑, 굽지 못하면 주인이 준 색 돌리기
function el(id,attrs={},text=''){const a={...attrs};return {id,dataset:{},textContent:text,style:{_p:{},setProperty(k,v){this._p[k]=v;},getPropertyValue(k){return this._p[k]||'';}},
 getAttribute:k=>a[k]??null,setAttribute:(k,v)=>{a[k]=String(v);},get src(){return a.src;},set src(v){a.src=String(v);},get title(){return a.title;},set title(v){a.title=String(v);},_a:a};}
function world({pixels=true}={}){
 const images=[];let seen=null;const proto={render(frame){seen=frame.commands.map(c=>({...c,points:c.points&&c.points.map(p=>[...p]),style:c.style&&{...c.style}}));}};
 const E={attackIcon:el('attackIcon',{src:'a'}),blinkIcon:el('blinkIcon',{src:'b'}),guardIcon:el('guardIcon',{src:'g'}),specialIcon:el('specialIcon',{src:'s'}),egoIcon:el('egoIcon',{src:'e'}),specialLabel:el('specialLabel',{},'잔향 결계'),r376Pf:el('r376Pf'),
  'story-wer-w':el('story-wer-w',{title:'거짓 분리','aria-label':'거짓 분리 · W'}),'story-wer-e':el('story-wer-e',{title:'심문자의 전이','aria-label':'심문자의 전이 · E'}),'story-wer-r':el('story-wer-r',{title:'진명 심판','aria-label':'진명 심판 · R'}),heroName:el('heroName',{},'라우렌 · Lv.9'),portrait:el('portrait',{src:'x'})};
 const L={w:'./assets/vfx/heroes/lauren-w.webp',e:'./assets/vfx/heroes/lauren-e.webp',r:'./assets/r911/clean/assets/vfx/heroes/lauren-r.webp'},T={w:'거짓 분리',e:'심문자의 전이',r:'진명 심판'};
 const im={w:el('wimg',{src:L.w}),e:el('eimg',{src:L.e}),r:el('rimg',{src:L.r})};
 const sel={'#story-wer-w img':im.w,'#story-wer-e img':im.e,'#story-wer-r img':im.r};
 const stat={get:0};
 const mkCanvas=()=>({tagName:'canvas',width:0,height:0,getContext(){const cv=this;return {drawImage(img){cv._from=img;},fillRect(){},clearRect(){},createRadialGradient:()=>({addColorStop(){}}),
   getImageData(){stat.get++;if(!pixels)throw new Error('no pixels');const s=cv._from;if(!s||s._taint)throw new Error('tainted');return {data:new Uint8ClampedArray(s._pixels),width:cv.width,height:cv.height};},putImageData(d){cv._pixels=d.data;}};},
   toDataURL(){return 'data:image/png;base64,'+(this.__id||'ICON');}});
 const document={createElement:t=>t==='canvas'?mkCanvas():{tagName:t},baseURI:'http://x/m0/',getElementById:id=>E[id]||null,querySelector:s=>sel[s]||null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}}};
 class Img{constructor(){images.push(this);}set src(v){this._src=v;}get src(){return this._src;}}
 const player={hero:'lauren',x:10,y:10,hp:100,direction:'front',attackAnim:0,skillAnim:0,ultimateAnim:0};
 const C={Math,Number,JSON,Object,Array,Map,Set,WeakMap,WeakSet,String,Error,URL,console,Date,Uint8ClampedArray,time:0,player,room:{id:'cult04'},loading:false,storyScene:null,modal:false,started:true,
  zoom:1,actorHeight:()=>66,project:(x,y)=>({x:500+(x-y)*16,y:300+(x+y)*8}),toast:()=>{},HEROES:{lauren:{name:'라우렌'}},
  setInterval:()=>0,setTimeout:()=>0,StoryPhase1:{ThreeRenderer:{prototype:proto}},document,Image:Img,localStorage:{getItem:()=>null,setItem(){}}};
 // 엔진 updateHUD(index.html 6024줄과 같은 일): 매번 라우렌 아이콘·제목을 다시 쓴다
 C.updateHUD=function(){for(const s of ['w','e','r']){const b=E['story-wer-'+s];if(im[s].getAttribute('src')!==L[s])im[s].src=L[s];b.title=T[s];b.setAttribute('aria-label',T[s]+' · '+s.toUpperCase());}return 'hud';};
 C.hudW={};C.setHudTextR63R2=(id,v)=>{C.hudW[id]=String(v);};C.tick=function(){};C.serializeSave=()=>({player:{}});C.restoreSave=async()=>{};C.__STORYWORLD_CHEAT777__={active:()=>true};
 C.window=C;vm.createContext(C);vm.runInContext(hooks,C);vm.runInContext(SRC,C);
 const load=()=>{for(const i of images)if(i._src&&!i._done&&i.onload){i._done=true;const s=i._src;i.naturalWidth=/walk/.test(s)?4096:/persona-idle/.test(s)?1152:/lance-flight/.test(s)?3072:/lance-contact/.test(s)?2304:/flight/.test(s)?2048:/contact/.test(s)?1536:344;i.naturalHeight=/walk/.test(s)?512:/lance/.test(s)?384:/r1119|persona-idle/.test(s)?256:400;i._pixels=new Uint8ClampedArray(4);i.onload();}};
 const frame=cmds=>{C.time+=.016;proto.render.call({}, {commands:cmds});return seen;};
 return {C,E,im,L,T,player,frame,load,stat,api:()=>C.__STORYWORLD_PERSONA_HERO_R1113__};}
const Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const body=()=>({kind:'image',key:'hero:2:0',order:5,owner:{id:'hero:2',kind:'hero'},sourcePath:'http://x/m0/assets/r130/lauren/idle-s.webp',sourceRect:[0,0,192,463],style:{filter:'none'},points:Q(480,240,26,61)});
const px=(w,h,rgba)=>{const d=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++)d.set(rgba,i*4);return d;};
const img=(w,h,rgba,extra={})=>({width:w,height:h,naturalWidth:w,naturalHeight:h,_pixels:px(w,h,rgba),...extra});
const fx=(id,sp,image,extra={})=>({kind:'image',key:id+':0',order:9,owner:{id,kind:'effect',...(extra.owner||{})},sourcePath:sp,image,sourceRect:[0,0,image?.width||8,image?.height||8],imageSize:[image?.width||8,image?.height||8],style:{filter:'none',globalAlpha:.8,globalCompositeOperation:'lighter',...(extra.style||{})},points:Q(400,200,40,40),...(extra.cmd||{})});
const hue=c=>/hue-rotate/.test(c?.style?.filter||'');
const A=w=>w.api();
const on=w=>{A(w).unlock('silent');A(w).setForm(true);w.frame([body()]);w.load();};


{const w=world();on(w);const C=img(8,8,[80,230,190,255]),B=img(8,8,[240,140,40,255]);
 const o=(id,extra)=>({owner:{pxfSide:'hero',...extra},style:{globalCompositeOperation:'source-over'}});let s;
 const SH={kind:'image',key:'sh:0',order:9,owner:{id:'r1144:chain:1:shade',kind:'effect'},sourcePath:'http://x/m0/assets/r562/dots/neon-chain.webp',image:C,sourceRect:[0,0,8,8],imageSize:[8,8],style:{filter:'brightness(0)',globalAlpha:.6},points:Q(400,200,40,40)};
 for(let i=0;i<6;i++)s=w.frame([body(),fx('r1144:chain:1','http://x/m0/assets/r562/dots/neon-chain.webp',C,o()),{...SH,style:{...SH.style}},fx('r1144:burn:1','http://x/m0/assets/r535/dots/hunter-burn.webp',B,o())]);
 ok(/^r1140:eonju:/.test(s[1].sourcePath)&&s[1].image._pixels[0]>s[1].image._pixels[2]*2,'⑩ 네온 번개(민트) → 언주 굽기 ('+s[1].sourcePath+' '+[...s[1].image._pixels.slice(0,3)]+')');
 ok(s[2].image===C&&s[2].style.filter==='brightness(0)','⑩ 밑그림(영웅 쪽 표식 없음)은 페르소나 굽기가 건드리지 않음 → 검은 그림자 그대로');
 ok(/^r1140:eonju:/.test(s[3].sourcePath),'⑩ 헌터 화상 → 언주 굽기');}
{const w=world();on(w);const C=img(8,8,[80,230,190,255]);let s;for(let i=0;i<6;i++)s=w.frame([body(),fx('r946:violet:laser:3:1','http://x/m0/assets/r562/dots/neon-chain.webp',C,{owner:{pxfSide:'hero'}})]);
 ok(/^r1140:darkred:/.test(s[1].sourcePath),'⑩ (진) 쌍성 소멸 레이저 결(네온 번개 시트) → 검빨 굽기 ('+s[1].sourcePath+')');}
{const w=world({pixels:false});on(w);const C=img(8,8,[80,230,190,255]);let s;for(let i=0;i<4;i++)s=w.frame([body(),fx('r1144:chain:1','http://x/m0/assets/r562/dots/neon-chain.webp',C,{owner:{pxfSide:'hero',personaFallback:'hue-rotate(200deg) saturate(1.6) brightness(.85)'}})]);
 ok(s[1].image===C&&s[1].style.filter==='hue-rotate(200deg) saturate(1.6) brightness(.85)','⑩ 굽지 못하면 주인이 준 색 돌리기(민트 → 붉은 쪽) ('+s[1].style.filter+')');
 const s3=w.frame([body(),fx('r1144:x','http://x/m0/a.webp',img(8,8,[1,2,3,255]),{owner:{pxfSide:'hero',personaFallback:'blur(3px)'}})]);ok(!/blur/.test(s3[1].style.filter),'⑩ 기록기가 못 받는 필터는 받지 않음 ('+s3[1].style.filter+')');}
console.log(fails?('FAILED '+fails):'ALL PASS');process.exit(fails?1:0);

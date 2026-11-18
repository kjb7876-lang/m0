'use strict';
// R1149 무한생존 멀티플레이 — CPU 검사(순수 규칙 + 연결 지점).
// 사용자 2026-11-18 07:35Z "멀티플레이 무한생존모드도 되게해주고 최대 7명까지 … 4명이하일때는 각자 1명의 영웅만 배치가능하고 5명부터는 영웅배치 없이 …
//  정화구슬은 알아서 레벨업하고 스킬고르는건 각자영웅에 관련된것만", 07:39Z 카드 "서버는 그대로, 4명까지만",
//  07:39Z "영화서사모드는 1인플레이만 … 플레이어 숫자에 비례해서 적체력 배수".
// VM 모델 검사다. 실제 브라우저 두 대 검사는 r1149-browser.mjs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const same=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);/* vm 안에서 만든 배열·객체는 다른 영역이라 deepEqual 이 원형 차이로 실패한다 → 값만 견준다 */
let checks=0,failures=0;const check=(name,fn)=>{try{fn();checks++;console.log('ok',name);}catch(e){failures++;console.error('FAIL',name,'\n ',String(e.message).split('\n')[0]);}};
let P=null,api=null;
try{const src=read('r96/client-source/survival-coop-r1149.js');
 const g={console,Math,Number,Set,Map,JSON,Object,Array,String,Date,setInterval:()=>({unref(){}}),setTimeout:()=>0,clearTimeout(){},document:{getElementById:()=>null,createElement:()=>({style:{}}),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}},body:{appendChild(){},classList:{toggle(){},add(){},remove(){}}}},localStorage:{getItem:()=>null,setItem(){}},addEventListener(){}};g.window=g;
 vm.runInNewContext(src,g);api=g.__STORYWORLD_SURVIVAL_COOP_R1149__;P=api.pure;}catch(e){console.error('FAIL 오버레이 불러오기\n ',String(e.message).split('\n')[0]);failures++;}
const need=()=>assert.ok(P,'오버레이 pure 없음');

check('자리 수: 규칙 상한 7명, 지금 서버는 4석',()=>{need();assert.equal(P.RULE_MAX,7);assert.equal(P.SEATS,4);assert.equal(P.joinCap(),4,'실제 입장 상한 = 둘 중 작은 값');});
check('영웅 배치 한도: 혼자는 예전 그대로(null), 2~4명은 각자 1명, 5명부터 0',()=>{need();
 assert.equal(P.deployLimit(1),null);same([2,3,4].map(P.deployLimit),[1,1,1]);same([5,6,7].map(P.deployLimit),[0,0,0]);});
check('영웅 배치 한도 경계: 0·음수·NaN·문자열은 혼자로, 7 초과는 7로',()=>{need();
 for(const v of [0,-3,NaN,undefined,null,'x'])assert.equal(P.deployLimit(v),null,String(v));assert.equal(P.deployLimit(8),0);assert.equal(P.deployLimit(99),0);assert.equal(P.deployLimit(4.9),1,'소수는 내림');assert.equal(P.deployLimit('3'),1);});
check('적 체력 배수 = 플레이어 수(1~7)',()=>{need();
 same([1,2,3,4,5,6,7].map(P.hpScale),[1,2,3,4,5,6,7]);for(const v of [0,-1,NaN,undefined,'a'])assert.equal(P.hpScale(v),1,String(v));assert.equal(P.hpScale(12),7);assert.equal(P.hpScale(2.7),2);});
check('적 체력 적용: 반올림한 정수, 1명은 그대로(회귀)',()=>{need();
 assert.equal(P.scaleHp(137,1),137);assert.equal(P.scaleHp(137,3),411);assert.equal(P.scaleHp(0.4,2),1,'최소 1');assert.equal(P.scaleHp(NaN,2),1);});
check('스킬 선택지: 멀티에서는 정화 구슬(코어) 강화가 빠지고 영웅 것만',()=>{need();
 const pool=[{id:'u:vital',kind:'hero'},{id:'c:coreMax',kind:'core'},{id:'u:power',kind:'hero'},{id:'c:coreDmg',kind:'core'}];
 same(P.heroCards(pool,true).map(o=>o.id),['u:vital','u:power']);same(P.heroCards(pool,false).map(o=>o.id),pool.map(o=>o.id),'혼자는 예전 그대로');
 same(P.heroCards([],true),[]);same(P.heroCards(null,true),[]);same(P.heroCards([null,{id:'c:x',kind:'core'}],true),[]);});
const UPS=[{id:'coreMax',max:8},{id:'coreRegen',max:8},{id:'coreHeal',max:6},{id:'coreDmg',max:8},{id:'coreRate',max:6},{id:'coreRange',max:5},{id:'coreShots',max:4}];
check('정화 구슬 자동 레벨업: 가장 덜 오른 것부터 고르게, 정해진 순서',()=>{need();
 assert.equal(P.autoCore({},UPS),'coreMax');assert.equal(P.autoCore({coreMax:1},UPS),'coreRegen');
 const lv={};const seq=[];for(let k=0;k<7;k++){const id=P.autoCore(lv,UPS);seq.push(id);lv[id]=(lv[id]||0)+1;}same(seq,UPS.map(u=>u.id),'일곱 번이면 한 바퀴');});
check('정화 구슬 자동 레벨업 경계: 최대 단계는 건너뛰고, 모두 최대면 null, 합계는 최대 합과 같음',()=>{need();
 const lv={};let n=0;for(let k=0;k<200;k++){const id=P.autoCore(lv,UPS);if(!id)break;lv[id]=(lv[id]||0)+1;n++;}
 assert.equal(n,UPS.reduce((a,u)=>a+u.max,0));for(const u of UPS)assert.equal(lv[u.id],u.max,u.id);assert.equal(P.autoCore(lv,UPS),null);assert.equal(P.autoCore({},[]),null);assert.equal(P.autoCore(null,UPS),'coreMax');});
check('지역 이름 싣기: 서버 정규식 안에서 왕복',()=>{need();
 for(const [id,i,loop,diff] of [['ep1a09',0,0,'normal'],['last301',55,3,'nightmare'],['mam-mon_01',71,12,'easy'],['hub',7,0,'hard']]){
  const s=P.encodeRegion(id,{i,loop,diff});assert.match(s,/^[A-Za-z0-9_-]+$/);assert.ok(s.length<=128);same(P.decodeRegion(s),{id,i,loop,diff});}});
check('지역 이름 싣기 경계: 보통 지역·깨진 값은 null, 너무 긴 이름은 싣지 않음',()=>{need();
 for(const v of ['ep1a09','hub','sv1149-normal-0-0','sv1149-normal-x-0--ep1','sv1149--0-0--ep1','sv1149-weird-0-0--ep1','',null,undefined,42])assert.equal(P.decodeRegion(v),null,String(v));
 assert.equal(P.encodeRegion('a'.repeat(120),{i:0,loop:0,diff:'normal'}),null);assert.equal(P.encodeRegion('bad id!',{i:0,loop:0,diff:'normal'}),null);assert.equal(P.encodeRegion('ep1',{i:-1,loop:0,diff:'normal'}),null);});
check('손님 강화 고르기 명령: 서버가 받는 passiveId 꼴로 왕복',()=>{need();
 for(const id of ['vital','power','tempo','mend']){const c=P.pickCommand(id);assert.match(c,/^[A-Za-z0-9_-]+$/);assert.ok(c.length<=64);assert.equal(P.parseCommand(c),id);}
 for(const v of ['tempo','sv1149-','sv1149-u-','sv1149-u-bad id','',null,'sv1149-u-'+'a'.repeat(80)])assert.equal(P.parseCommand(v),null,String(v));assert.equal(P.pickCommand('bad id'),null);});
check('멀티가 되는 모드: 스토리·무한생존만, 영화 서사 모드는 혼자만',()=>{need();
 assert.equal(P.multiAllowed('story'),true);assert.equal(P.multiAllowed('survival'),true);assert.equal(P.multiAllowed('cinema'),false);assert.equal(P.multiAllowed('other'),false);assert.equal(P.multiAllowed(undefined),false);});
check('혼자일 때는 꺼져 있음(회귀): active false, 배수 1',()=>{need();assert.equal(api.active(),false);assert.equal(api.hpScale(),1);assert.equal(api.deployLimit(),null);});

// ── 스토리 협동: 몹 복제 대신 체력 × 인원수(사용자 07:39Z '멀티모드시 플레이어 숫자에 비례해서 적체력 배수') ──
check('스토리 체력 다시 맞추기: 1명→2명 두 배, 2명→3명 1.5배, 같은 인원은 그대로',()=>{need();
 same(P.rescale(100,100,1,2),{hp:200,maxHp:200});same(P.rescale(60,100,1,2),{hp:120,maxHp:200});same(P.rescale(120,200,2,3),{hp:180,maxHp:300});same(P.rescale(77,130,2,2),{hp:77,maxHp:130});});
check('스토리 체력 다시 맞추기 경계: 인원이 줄면 되돌림, 죽은 몹은 0 그대로, 살아 있으면 최소 1, 깨진 값은 건드리지 않음',()=>{need();
 same(P.rescale(180,300,3,1),{hp:60,maxHp:100});same(P.rescale(0,200,1,2),{hp:0,maxHp:400});same(P.rescale(1,3,3,1),{hp:1,maxHp:1});
 same(P.rescale(NaN,100,1,2),{hp:NaN,maxHp:100});same(P.rescale(50,0,1,2),{hp:50,maxHp:0});same(P.rescale(50,100,0,2),{hp:100,maxHp:200},'적용 배수가 없으면 1로 봄');same(P.rescale(50,100,1,99),{hp:350,maxHp:700},'7명 상한');});
check('스토리 복제 몹 가려내기: 복제는 빼고 그 이름은 처치 목록에(다시 생기지 않게), 원본은 그대로',()=>{need();
 const r={enemies:[{id:'a',hp:5},{id:'a:coop:1',coopReplicaR62:true,hp:5},{id:'b',hp:0},{id:'b:coop:1',coopReplicaR62:true,hp:3}],coopDefeatedR62:['x']};const n=P.stripReplicas(r);
 assert.equal(n,2);same(r.enemies.map(e=>e.id),['a','b']);same(r.coopDefeatedR62,['x','a:coop:1','b:coop:1']);assert.equal(P.stripReplicas(r),0,'두 번째는 할 일 없음');assert.equal(P.stripReplicas(null),0);assert.equal(P.stripReplicas({}),0);});
// ── 연결 지점 ──
check('빌드 연결: index.html 스크립트 태그 한 번, 협동 인라인 스크립트(coop-client-r62) 뒤 · 맨 끝 등록 오버레이 줄(R118·R713·R1124) 앞',()=>{const h=read('r96/runtime-text/index.html');const a=h.indexOf('<script src="./survival-coop-r1149.js"></script>');assert.ok(a>0,'태그 없음');assert.equal(h.split('./survival-coop-r1149.js').length,2,'한 번만');assert.ok(a>h.indexOf('<script id="coop-client-r62">'),'협동 클라이언트 뒤');assert.ok(a<h.indexOf('./combat-r118.js'),'맨 끝 줄 앞');});
check('빌드 연결: 공개 확인 목록·Pages CPU 검사 줄',()=>{assert.ok(read('scripts/verify-r96-public.py').includes('survival-coop-r1149.js'));assert.ok(read('.github/workflows/pages.yml').includes('r96/qa/r1149/r1149-cpu-check.cjs'));});
check('생존 본체: 멀티 훅(손님 무대·방장 시작·체력 배수)',()=>{const s=read('r96/client-source/survival-r600.js');
 for(const k of ['startHost','guestEnter','guestSync','publicState','__STORYWORLD_SURVIVAL_COOP_R1149__'])assert.ok(s.includes(k),k);});
check('생존 본체 순수 함수 회귀: 혼자 값은 그대로',()=>{const g={document:{getElementById:()=>null,createElement:()=>({}),querySelectorAll:()=>[],addEventListener(){},head:{appendChild(){}},body:{appendChild(){}}},localStorage:{getItem:()=>null}};g.window=g;
 vm.runInNewContext(read('r96/client-source/survival-r600.js'),g);const S=g.__STORYWORLD_SURVIVAL_R600__.pure;
 assert.equal(S.mobHp(0,0,'normal',40,false),50);assert.equal(S.bossPlan('nightmare').n,6);assert.equal(S.xpNeed(1),52);assert.equal(S.CORE_UPS.length,7);});
check('중계 서버는 건드리지 않음(사용자 결정): 4석 그대로',()=>{const s=read('relay/server.mjs');assert.ok(/players: 4,/.test(s));});
console.log(`\nR1149 CPU: ${checks} 통과, ${failures} 실패`);process.exit(failures?1:0);

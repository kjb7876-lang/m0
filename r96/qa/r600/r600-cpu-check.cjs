// R600 무한 생존 모드 CPU 검사: 입구 교체(픽셀 모드 입구 제거)·빌드 연결·순수 규칙(서사 순서·직사각형·몹 생성 시간·단계·회차·상한·코어·3택).
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(root,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(root,'runtime-text',f),'utf8');
const src=CS('survival-r600.js');assert.strictEqual(src,RT('survival-r600.js'));ok('client-source and runtime copies agree');
const idx=RT('index.html');const at=k=>idx.indexOf('"./'+k+'"');
assert(idx.split('"./survival-r600.js"').length===2);assert(at('cinema-run-r461.js')<at('survival-r600.js')&&at('samong-r103.js')<at('survival-r600.js')&&at('voice-r381.js')<at('survival-r600.js')&&at('survival-r600.js')<at('combat-r118.js'));ok('loaded once, after R103/R381/R461, before combat-r118');
assert(fs.readFileSync(path.join(root,'..','scripts','verify-r96-public.py'),'utf8').includes("'survival-r600.js'"));ok('public verify list includes it');
assert(fs.readFileSync(path.join(root,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r600/r600-cpu-check.cjs'));ok('Pages CPU step');
assert(JSON.parse(fs.readFileSync(path.join(root,'runtime-inputs.json'),'utf8')).textPaths.some(p=>/survival-r600\.js$/.test(p)));ok('runtime inputs list it');
// 픽셀 모드 입구 제거: R306 이 더는 '픽셀 모드로 시작' 단추를 만들지 않고, 옛 픽셀 기록도 칠한 그림으로 불러온다.
{const r306=CS('mob-art-variants-r306.js');assert.strictEqual(r306,RT('mob-art-variants-r306.js'));
 assert(!/textContent\s*=\s*'픽셀 모드로 시작'/.test(r306));ok('R306 no longer creates the pixel-mode title button');
 // 가짜 화면으로 실제 동작 확인
 const els={};const mk=id=>({id,parentNode:null,onclick:null,appendChild(c){els[c.id]=c;c.parentNode=this;},insertBefore(c){els[c.id]=c;c.parentNode=this;}});
 const panel=mk('panel'),normal=mk('campaignNew54');normal.parentNode=panel;normal.onclick=()=>{};els.panel=panel;els.campaignNew54=normal;
 const doc={getElementById:id=>els[id]||null,createElement:()=>mk(''),addEventListener:()=>{}};const win={};
 new Function('window','document','localStorage',r306)(win,doc,{getItem:()=>null,setItem(){}});
 assert(!els.pixelStartR306);ok('title has no pixel button after R306 runs');}
// 순수 규칙
const win={};const doc={getElementById:()=>null,createElement:()=>({}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){}},querySelectorAll:()=>[]};
new Function('window','document','localStorage',src)(win,doc,{getItem:()=>null,setItem(){}});
const A=win.__STORYWORLD_SURVIVAL_R600__;assert(A&&A.pure);const P=A.pure;ok('module loads without an engine');
{const R=[{id:'dist01',index:2},{id:'hub',index:0,safe:true},{id:'dist00',index:1},{id:'dreamRest',index:13,safe:true},{id:'ep1a08',index:8},{id:'sm',index:3,layer:'DREAM'}];
 assert.deepStrictEqual(P.stageIds(R),['dist00','dist01','ep1a08']);assert.deepStrictEqual(P.stageIds([]),[]);assert.deepStrictEqual(P.stageIds(null),[]);ok('stages: story combat regions in narrative order, no rest/DREAM');}
{const a=P.arena([0,0,100,104]);assert.deepStrictEqual([a.x0,a.y0,a.x1,a.y1],[1,1,99,103]);assert.strictEqual(a.cx,50);assert.strictEqual(a.cy,52);assert.strictEqual(a.w*a.h,98*102);
 const b=P.arena([1,1,89,49]);assert.strictEqual(b.cx,45);assert.strictEqual(b.cy,25);
 const c=P.arena(null);assert(c.w>=8&&c.h>=8&&Number.isFinite(c.cx));const d=P.arena([0,0,3,3]);assert(d.w>=8&&d.h>=8);ok('arena: rectangle of the map size, centred; bad/tiny bounds fall back');}
{const s={narrating:true,narrEndAt:NaN};assert.strictEqual(P.spawning(s,0),true);s.narrating=false;s.narrEndAt=10;
 assert.strictEqual(P.TAIL>=6&&P.TAIL<=7,true);assert.strictEqual(P.spawning(s,10),true);assert.strictEqual(P.spawning(s,10+P.TAIL-.01),true);assert.strictEqual(P.spawning(s,10+P.TAIL),false);
 assert.strictEqual(P.spawning({narrating:false,narrEndAt:NaN},5),false);assert.strictEqual(P.spawning(null,5),false);ok('spawning: while narration plays and 6~7 s after (boundary exact)');}
{assert.strictEqual(P.nextPhase('pre',true),'boss');assert.strictEqual(P.nextPhase('pre',false),'clear');assert.strictEqual(P.nextPhase('boss',true),'clear');assert.strictEqual(P.nextPhase('clear',true),'clear');ok('phases pre → boss → clear');}
{assert.deepStrictEqual(P.advance(0,0,56),{i:1,loop:0});assert.deepStrictEqual(P.advance(55,0,56),{i:0,loop:1});assert.deepStrictEqual(P.advance(55,3,56),{i:0,loop:4});assert.deepStrictEqual(P.advance(5,2,0),{i:0,loop:2});ok('advance: next map, wrap to first with loop+1 (endless)');}
{assert.strictEqual(P.cap(0,0,false),16);assert(P.cap(9999,60,false)===48);assert(P.cap(9999,60,true)===30);assert(P.cap(60,0,false)>P.cap(0,0,false));ok('enemy cap grows with time, capped 48 (PC) / 30 (mobile/low)');}
{assert.strictEqual(P.hpMul(0,0),1);assert(P.hpMul(10,0)>P.hpMul(0,0));assert(P.hpMul(0,1)>P.hpMul(55,0)*0+1.5);ok('hp scale rises with map order and loop');}
{const b=P.coreStats({});assert.deepStrictEqual(b,{...P.CORE0});assert(b.max>0&&b.regen>0&&b.heal>0&&b.rate>0&&b.range>0&&b.shots===1);
 const u=P.coreStats({coreMax:2,coreRegen:1,coreHeal:1,coreDmg:1,coreRate:1,coreRange:1,coreShots:1});
 assert(u.max>b.max&&u.regen>b.regen&&u.heal>b.heal&&u.dmg>b.dmg&&u.rate<b.rate&&u.range>b.range&&u.shots===2);
 assert.deepStrictEqual(P.coreStats({coreMax:-3,coreRate:'x'}),{...P.CORE0});assert(P.CORE_UPS.length>=6&&P.CORE_UPS.every(u=>u.max>0&&u.name.startsWith('정화 코어')));ok('core base spec (hp/regen/heal-on-kill/purify) and upgrades; bad levels ignored');}
{const pool=[{id:'a',max:3,level:3},{id:'b',max:5,level:0},{id:'c',max:2,level:1},{id:'d',max:1,level:0},{id:'e',max:4,level:4}];let seen=new Set();
 for(let k=0;k<50;k++){const t=P.pickThree(pool);assert.strictEqual(t.length,3);assert.strictEqual(new Set(t.map(o=>o.id)).size,3);for(const o of t){assert(!['a','e'].includes(o.id));seen.add(o.id);}}
 assert.deepStrictEqual([...seen].sort(),['b','c','d']);
 const two=P.pickThree([{id:'x',max:2,level:0},{id:'y',max:2,level:1}]);assert.strictEqual(two.length,2);
 const none=P.pickThree([{id:'x',max:1,level:1}]);assert.strictEqual(none.length,1);assert.strictEqual(none[0].kind,'mend');ok('three distinct offers, maxed excluded, mend when nothing left');}
{assert.strictEqual(typeof P.xpNeed,'function');assert(P.xpNeed(1)>0&&P.xpNeed(1)<=60);assert(P.xpNeed(10)>P.xpNeed(1)&&P.xpNeed(50)>P.xpNeed(10));assert(Number.isFinite(P.xpNeed(9999)));
 // 이 게임은 처치로 레벨이 오르지 않는다(R62 지도 완료 규칙) → 생존 모드는 자기 경험치·레벨로 3택을 연다
 const L=P.levelUps(0,1,P.xpNeed(1)-1);assert.deepStrictEqual(L,{lv:1,xp:P.xpNeed(1)-1,ups:0});const L2=P.levelUps(0,1,P.xpNeed(1));assert.deepStrictEqual(L2,{lv:2,xp:0,ups:1});
 const L3=P.levelUps(5,1,P.xpNeed(1)+P.xpNeed(2)+3-5);assert.strictEqual(L3.ups,2);assert.strictEqual(L3.lv,3);assert.strictEqual(L3.xp,3);ok('own survival XP curve: exact level boundary, multi-level gains');}
{const t='첫 문장이다. 둘째 문장? "대사!"\n\n새 문단…';assert.deepStrictEqual(P.sentences(t),['첫 문장이다.','둘째 문장?','"대사!"','새 문단…']);assert.deepStrictEqual(P.sentences(''),[]);ok('sentence split (matches R370 rule used for voice ids)');}
// 엔진에 손대지 않음: 저장을 막고(이 모드는 저장하지 않음), 스토리 진행 마무리(finishEncounter)·길잡이를 생존 무대에서 막는다.
assert(/saveGame=function[^]*?S\?\.active\)\{stats\.saveBlocked\+\+;return true;[^]*?if\(tainted\)\{stats\.saveBlocked\+\+;return false;\}/.test(src));assert(/finishEncounter=function[^]*?here\(\)\)return;/.test(src));assert(/guideStep=function[^]*?guide=false/.test(src));ok('no saves, no story finish, no guide inside survival');
assert(/if\(used\)return;used=true;/.test(src));ok('a choice applies once per panel (double click / stale button safe)');
console.log('R600 CPU',n,'checks passed');

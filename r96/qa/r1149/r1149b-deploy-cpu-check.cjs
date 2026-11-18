'use strict';
// R1149b 멀티 영웅 배치 — CPU 검사(순수 규칙 + 연결 지점).
// 사용자 2026-11-18 07:35Z "4명이하일때는 각자 1명의 영웅만 배치가능하고 5명부터는 영웅배치 없이 각자 플레이하는 영웅으로만 플레이하도록".
//  각자 지갑(정화 결정·보유 영웅), 한 사람 한 자리, 손님 명령 글(서버 패시브 칸 규칙 [A-Za-z0-9_-] 64자), 나간 사람 자리 정리.
// VM 모델 검사다. 실제 브라우저 두 대 검사는 r1149b-deploy-browser.mjs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../../..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const same=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);
let checks=0,failures=0;const check=(name,fn)=>{try{fn();checks++;console.log('ok',name);}catch(e){failures++;console.error('FAIL',name,'\n ',String(e.message).split('\n')[0]);}};
const HEROES={hwando:{name:'환도',type:'blade',range:3.15},seoha:{name:'윤서하',type:'precision',range:8.1},neon:{name:'네온',type:'chain',melee:true,range:3.15},michaela:{name:'미카엘라',type:'light',range:7},
 lauren:{name:'라우렌',type:'spell',melee:true,range:3.15},hunter:{name:'헌터',type:'burst',range:8.3},slayer:{name:'슬레이어',type:'heavy',range:3.3},gunner:{name:'기억사수',type:'memory',range:8.2}};
function box(extra={}){const el=()=>({style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},insertBefore(){},setAttribute(){},getAttribute:()=>null,remove(){},querySelector:()=>null,querySelectorAll:()=>[]});
 const g={console,Math,Number,Set,Map,JSON,Object,Array,String,Date,Promise,setInterval:()=>({unref(){}}),setTimeout:()=>0,clearTimeout(){},performance:{now:()=>0},HEROES,
  document:{getElementById:()=>null,createElement:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},head:el(),body:el()},localStorage:{getItem:()=>null,setItem(){}},addEventListener(){},...extra};g.window=g;g.globalThis=g;return g;}
let D=null,C=null;
try{const g=box();vm.runInNewContext(read('r96/client-source/hero-defense-r720.js'),g);D=g.__STORYWORLD_HERO_DEFENSE_R720__.pure;}catch(e){console.error('FAIL 배치 오버레이 불러오기\n ',String(e.message).split('\n')[0]);failures++;}
try{const g=box();vm.runInNewContext(read('r96/client-source/survival-coop-r1149.js'),g);C=g.__STORYWORLD_SURVIVAL_COOP_R1149__.pure;}catch(e){console.error('FAIL 멀티 오버레이 불러오기\n ',String(e.message).split('\n')[0]);failures++;}
const need=()=>{assert.ok(D,'배치 pure 없음');assert.ok(typeof D.mpPlace==='function','mpPlace 없음');};
const ENV={centre:{x:10,y:10},range:5.5};
const wallet=(main,c=0,owned=[])=>{const o={[main]:true};for(const k of owned)o[k]=true;return {crystals:c,main,owned:o};};
const board=()=>({crystals:0,main:'hwando',owned:{hwando:true},slots:[]});

check('멀티 배치: 한 사람 한 자리 — 두 번째는 full, 다른 사람은 놓을 수 있음',()=>{need();const st=board(),a=wallet('hwando',0,['hunter','slayer']),b=wallet('neon',0,['gunner']);
 const r1=D.mpPlace(st,a,'A','hunter',{x:12,y:10},ENV,1,['hwando','neon']);assert.equal(r1.ok,true);assert.equal(st.slots[0].owner,'A');
 const r2=D.mpPlace(st,a,'A','slayer',{x:10,y:13},ENV,1,['hwando','neon']);same([r2.ok,r2.why],[false,'full']);
 const r3=D.mpPlace(st,b,'B','gunner',{x:10,y:13},ENV,1,['hwando','neon']);assert.equal(r3.ok,true);same(st.slots.map(s=>s.owner),['A','B']);});
check('멀티 배치: 한도 0(5명부터)은 아무도 못 놓음',()=>{need();const st=board(),a=wallet('hwando',0,['hunter']);
 const r=D.mpPlace(st,a,'A','hunter',{x:12,y:10},ENV,0,['hwando']);same([r.ok,r.why],[false,'full']);assert.equal(st.slots.length,0);});
check('멀티 배치: 안 산 영웅·자기 조종 영웅·동료 조종 영웅·이미 놓인 영웅은 거절',()=>{need();const st=board(),a=wallet('hwando',0,['hunter','neon']),b=wallet('neon',0,['hunter']);
 assert.equal(D.mpPlace(st,a,'A','slayer',{x:12,y:10},ENV,1,['hwando','neon']).why,'unowned');
 assert.equal(D.mpPlace(st,a,'A','hwando',{x:12,y:10},ENV,1,['hwando','neon']).why,'main');
 assert.equal(D.mpPlace(st,a,'A','neon',{x:12,y:10},ENV,1,['hwando','neon']).why,'ally','동료가 조종 중인 영웅');
 assert.equal(D.mpPlace(st,a,'A','hunter',{x:12,y:10},ENV,1,['hwando','neon']).ok,true);
 assert.equal(D.mpPlace(st,b,'B','hunter',{x:10,y:13},ENV,1,['hwando','neon']).why,'placed');});
check('멀티 배치: 자리 규칙(사거리 밖·코어 곁·겹침)은 혼자와 같음, 자리 총합은 4',()=>{need();const st=board(),a=wallet('hwando',0,['hunter']);
 assert.equal(D.mpPlace(st,a,'A','hunter',{x:30,y:10},ENV,1,[]).why,'far');assert.equal(D.mpPlace(st,a,'A','hunter',{x:10.2,y:10},ENV,1,[]).why,'core');
 st.slots.push({hero:'slayer',ox:2,oy:0,lv:1,rangeLv:0,radiusLv:0,owner:'B'});assert.equal(D.mpPlace(st,a,'A','hunter',{x:12.1,y:10},ENV,1,[]).why,'crowded');
 for(const v of [NaN,undefined,null])assert.equal(D.mpPlace(st,a,'A','hunter',{x:v,y:1},ENV,1,[]).ok,false);
 assert.equal(D.mpPlace(st,null,'A','hunter',{x:12,y:10},ENV,1,[]).ok,false);});
check('내 자리 찾기: 주인으로 찾고 없으면 -1',()=>{need();const st=board();st.slots.push({hero:'a',owner:'A'},{hero:'b',owner:'B'});
 assert.equal(D.mpOwn(st,'B'),1);assert.equal(D.mpOwn(st,'C'),-1);assert.equal(D.mpOwn(null,'A'),-1);assert.equal(D.mpOwn(st,''),-1);});
check('나간 사람 자리 정리: 남은 사람 자리는 그대로, 뒤에서부터 지운 번호를 돌려줌',()=>{need();const st=board();st.slots.push({hero:'a',owner:'A'},{hero:'b',owner:'B'},{hero:'c',owner:'C'});
 same(D.mpPrune(st,['B']),[2,0]);same(st.slots.map(s=>s.owner),['B']);same(D.mpPrune(st,['B']),[]);same(D.mpPrune(null,['B']),[]);});
check('명령 글: 영입·배치·옮기기·강화·해제·변경이 서버 패시브 칸 규칙 안에서 오가고 되읽으면 같은 값',()=>{need();const c={x:10,y:10};
 const rows=[['buy','hunter',{x:12.34,y:7.5}],['place','slayer',{x:6.01,y:14.99}],['move','',{x:10,y:15.5}],['up','range',null],['up','level',null],['remove','',null],['replace','gunner',null],['buy','ego',null]];
 for(const [op,arg,pos] of rows){const s=D.mpEncode(op,arg,pos,c);assert.ok(typeof s==='string'&&/^[A-Za-z0-9_-]{1,50}$/.test(s),op+' → '+s);const d=D.mpDecode(s);assert.ok(d,op+' 되읽기');
  assert.equal(d.op,op);assert.equal(d.arg||'',arg);if(pos){assert.ok(Math.abs(d.ox-(pos.x-c.x))<=.006&&Math.abs(d.oy-(pos.y-c.y))<=.006,op+' 자리 '+JSON.stringify(d));}else assert.equal(d.ox,undefined);}});
check('명령 글 경계: 모르는 동작·이상한 글·너무 먼 자리·NaN 은 null',()=>{need();const c={x:0,y:0};
 for(const s of ['', 'zz-hunter','b-hun ter','p-hunter-1','p-hunter-x-1','m-99999999-1','g-power','b-'+'a'.repeat(60),null,undefined,7])assert.equal(D.mpDecode(s),null,String(s));
 assert.equal(D.mpEncode('fly','hunter',null,c),null);assert.equal(D.mpEncode('place','hunter',{x:NaN,y:1},c),null);assert.equal(D.mpEncode('place','hunter',{x:500,y:1},c),null,'무대 밖 먼 자리');
 assert.equal(D.mpEncode('up','power',null,c),null);assert.equal(D.mpEncode('buy','bad id',null,c),null);});
check('멀티 오버레이: 배치 명령을 패시브 칸 글로 싸고 풀기(강화 고르기 명령과 섞이지 않음)',()=>{assert.ok(C&&typeof C.deployCommand==='function','deployCommand 없음');
 const s=C.deployCommand('p-hunter-200-n150');assert.equal(s,'sv1149-d-p-hunter-200-n150');assert.ok(s.length<=64);assert.equal(C.parseDeploy(s),'p-hunter-200-n150');
 assert.equal(C.parseDeploy('sv1149-u-vital'),null);assert.equal(C.parseCommand(s),null,'강화 고르기로 읽히지 않음');
 for(const v of ['', 'x y',null,'a'.repeat(60)])assert.equal(C.deployCommand(v),null,String(v));for(const v of ['sv1149-d-','sv1149-d-a b',null,7])assert.equal(C.parseDeploy(v),null,String(v));});
check('혼자 하는 판 규칙은 그대로(회귀): doPlace 는 주인 없이 4자리',()=>{need();const st=board();st.owned={hwando:true,hunter:true,slayer:true};
 assert.equal(D.doPlace(st,'hunter',{x:12,y:10},ENV).ok,true);assert.equal(D.doPlace(st,'slayer',{x:10,y:13},ENV).ok,true);assert.equal(st.slots[0].owner,undefined);assert.equal(D.MAX.slots,4);});
check('연결: 멀티 중 배치는 한도가 있을 때만 열림(코드 표식), 손님은 직접 바꾸지 않고 명령을 보냄',()=>{const s=read('r96/client-source/hero-defense-r720.js'),m=read('r96/client-source/survival-coop-r1149.js');
 assert.ok(/const here=\(\)=>on&&\(!multi\(\)\|\|cap\(\)>0\)/.test(s),'here() 가 멀티 한도를 봄');assert.ok(s.includes('sendDeploy'),'손님 명령 보내기');assert.ok(m.includes('mpCommand')&&m.includes('mpPublic')&&m.includes('mpSync'),'멀티 오버레이가 배치 명령·상태를 나름');
 assert.equal(read('r96/runtime-text/hero-defense-r720.js'),s,'runtime-text 사본');assert.equal(read('r96/runtime-text/survival-coop-r1149.js'),m,'runtime-text 사본');
 assert.ok(read('.github/workflows/pages.yml').includes('node r96/qa/r1149/r1149b-deploy-cpu-check.cjs'),'pages.yml CPU 검사 줄');});
console.log(`\nR1149b 배치 CPU: ${checks} 통과, ${failures} 실패`);process.exit(failures?1:0);

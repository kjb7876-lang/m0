// R1006 CPU 검사: 무한생존 56지역 뒤에 사몽 16장(P~S-07, 사몽역행 RA~RG, 미카엘라 M)을 생존 단계로 잇는다(survival-samong-r1006.js + survival-r600.js 연결 고리).
//  사용자 2026-11-13 06:58Z "무한생존 사몽역행 미카엘라 엔딩까지 구현". 이 라운드는 M 단계 전투까지, M 몹 물결 뒤 R1010(결전·엔딩)으로 넘기는 연결 지점(handoff)만 남긴다.
const fs=require('fs'),path=require('path'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;const ok=m=>{n++;console.log('PASS',m);};
const CS=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const FILE='survival-samong-r1006.js';
assert(fs.existsSync(path.join(R,'client-source',FILE)),FILE+' exists');const src=CS(FILE);assert.strictEqual(src,RT(FILE));ok('client-source and runtime copies agree');
// 빌드 연결
{const idx=RT('index.html');assert.strictEqual(idx.split('"./'+FILE+'"').length,2);assert(idx.indexOf('"./'+FILE+'"')<idx.indexOf('"./combat-r118.js"'));
 assert(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8').includes("'"+FILE+"'"));
 assert(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8').includes('r96/qa/r1006/r1006-cpu-check.cjs'));
 assert(JSON.parse(fs.readFileSync(path.join(R,'runtime-inputs.json'),'utf8')).textPaths.some(p=>p.endsWith('/'+FILE)||p===FILE));ok('loaded once before combat-r118, public verify list, Pages CPU step, runtime inputs');}
// 모듈 불러오기(엔진 없이). 진짜 사몽 장 정의(samong-r103.js)와 정본 원문(samong-text-r103.js)을 함께 싣는다.
const mkDoc=()=>({getElementById:()=>null,createElement:()=>({style:{},classList:{toggle(){},add(){},remove(){}}}),addEventListener:()=>{},head:{appendChild(){}},body:{appendChild(){},classList:{toggle(){}}},querySelectorAll:()=>[],querySelector:()=>null});
function load(store={}){const win={},doc=mkDoc(),ls={getItem:k=>Object.prototype.hasOwnProperty.call(store,k)?store[k]:null,setItem(k,v){store[k]=String(v);}};
 for(const f of ['samong-text-r103.js','samong-r103.js',FILE])new Function('window','document','localStorage',CS(f))(win,doc,ls);return win;}
const win=load();const A=win.__STORYWORLD_SURVIVAL_SAMONG_R1006__;assert(A&&A.pure&&typeof A.stage==='function'&&typeof A.ids==='function'&&typeof A.handoff==='function');ok('module loads without an engine and exposes ids/stage/handoff');
const P=A.pure,EP=win.__STORYWORLD_SAMONG_R103__.episodes,SEC=win.__STORYWORLD_SAMONG_TEXT_R103__.sections;
const KEYS=['P','S-01','S-02','S-03','S-04','S-05','S-06','S-07','RA','RB','RC','RD','RE','RF','RG','M'];
// 1) 16장, 정본 순서
{assert.deepStrictEqual(EP.map(e=>e.key),KEYS);const ids=A.ids();assert.strictEqual(ids.length,16);assert.deepStrictEqual(ids,KEYS.map(k=>'sm1006:'+k));
 assert.deepStrictEqual(P.ids(EP),ids);assert.deepStrictEqual(P.ids([]),[]);assert.deepStrictEqual(P.ids(null),[]);ok('16 samong stages in canon order P → S-01..S-07 → RA..RG → M');}
// 2) 장 정의와 일치(지역 그림 host, 제목)
{for(const e of EP){const s=A.stage('sm1006:'+e.key);assert(s,e.key);assert.strictEqual(s.key,e.key);assert.strictEqual(s.host,e.host);assert(s.title.includes(e.title),e.key+' title');assert.strictEqual(s.chapter,e.chapter);}
 assert.strictEqual(A.stage('dist00'),null);assert.strictEqual(A.stage('sm1006:ZZ'),null);assert.strictEqual(A.stage(''),null);assert.strictEqual(A.stage(null),null);ok('each stage borrows EP.host art and EP title; story ids / unknown keys are not samong stages');}
// 3) 원문 자막 = 스토리 모드 사몽(R103 CUES)과 같은 구간을 재사용(모드는 내용 공유, 플레이 방식만 다름 — 사용자 11-13 08:25Z).
//    보스 전(pre) = 생존·미로·도착 구간(s·m·a), 보스(post) = 등장 구간(b). 처치 뒤(z)는 쓰지 않는다. M 은 s(R-17 끝 2문단)만 — M1·M2·M3·종장은 R1010(결전·엔딩)이 쓴다.
{const SM=win.__STORYWORLD_SAMONG_R103__;assert.strictEqual(typeof SM.cueRows,'function','samong-r103 exposes its cue rows');
 const paraSet=new Map();for(const [k,s] of Object.entries(SEC))for(const b of s.blocks||[])for(const t of b.paras||[])paraSet.set(t,k);
 const rowsOf=(key,parts)=>parts.flatMap(pt=>SM.cueRows(key,pt).map(r=>r.text));
 for(const e of EP){const s=A.stage('sm1006:'+e.key),all=[...s.pre,...s.post];
  for(const x of all){assert(typeof x.text==='string'&&x.text.trim(),e.key);for(const t of x.text.split('\n\n'))assert(paraSet.has(t),e.key+' paragraph must be verbatim canon: '+t.slice(0,40));
   assert(typeof x.narrator==='string');}
  const pre=s.pre.flatMap(x=>x.text.split('\n\n')),post=s.post.flatMap(x=>x.text.split('\n\n'));
  if(e.key==='M'){assert.deepStrictEqual(pre,rowsOf('M',['s']));assert.deepStrictEqual(post,[]);assert.strictEqual(s.finale,true);assert(!pre.some(t=>['M1','M2','M3','epilogue','record'].includes(paraSet.get(t))),'M uses no M1/M2/M3/ending');}
  else if(e.key==='P'){assert.deepStrictEqual(pre,[]);assert.deepStrictEqual(post,rowsOf('P',['a','b']));assert(post.length>0);}
  else{assert.deepStrictEqual(pre,rowsOf(e.key,['s','m','a']));assert.deepStrictEqual(post,rowsOf(e.key,['b']));assert(pre.length>0&&post.length>0,e.key+' has pre and boss subtitles');}
  assert(!s.finale||e.key==='M');}
 const rgAll=[...A.stage('sm1006:RG').pre,...A.stage('sm1006:RG').post].flatMap(x=>x.text.split('\n\n'));assert(!A.stage('sm1006:M').pre.flatMap(x=>x.text.split('\n\n')).some(t=>rgAll.includes(t)),'RG and M do not repeat R-17 closing');
 ok('subtitles reuse story-mode R103 cue paragraphs verbatim (pre s·m·a, boss b); P boss-only gets a+b; M pre = R-17 closing only, no M1/ending text');}
// 4) 장면 묶기 경계: 같은 구간 연속 문단은 한 장면, 화자는 그 구간 첫 문단 화자, 없는 구간·없는 장은 빈 목록
{const rows={X:{s:[{text:'가.',narrator:'n1',key:'K'},{text:'나.',narrator:'n1',key:'K'}],m:[],a:[{text:'다.',narrator:'n2',key:'L'}],b:[{text:'라.',narrator:'',key:'L'}]}};
 const cr=(k,p)=>(rows[k]&&rows[k][p])||[];const x=P.scenesFor({key:'X',mobs:[[1,2]]},cr);
 assert.deepStrictEqual(x.pre,[{text:'가.\n\n나.',narrator:'n1'},{text:'다.',narrator:'n2'}]);assert.deepStrictEqual(x.post,[{text:'라.',narrator:''}]);
 assert.deepStrictEqual(P.scenesFor({key:'none',mobs:[[1,2]]},cr),{pre:[],post:[]});assert.deepStrictEqual(P.scenesFor(null,cr),{pre:[],post:[]});
 assert.deepStrictEqual(P.scenesFor({key:'X',mobs:[[1,2]]},()=>{throw new Error('x');}),{pre:[],post:[]});
 ok('scene grouping: consecutive cue paragraphs → one scene with its narrator; missing cues / chapters / throwing source → empty');}
// 5) 몹·보스 = EP 기증 배우, 이름은 장의 이름. 기증 배우가 없으면 지킴이 → 그래도 없으면 바탕 지역 몹(대체 표시)
{const prof={path:'x.webp'};const native=(rows)=>(id,L)=>({enemies:rows.filter(r=>r.r===id&&(!r.L||r.L===L)).map(r=>({nativeId:r.n,name:'원래 '+r.n,profile:prof,boss:!!r.boss,midboss:!!r.mid}))});
 const base=id=>({normal:[{nativeId:'host-n',name:'바탕몹',profile:prof}],boss:{nativeId:'host-b',name:'바탕보스',boss:true,profile:prof},mid:null,template:{id,enemies:[]}});
 const e=EP.find(x=>x.key==='S-01');const mk=native([{r:'ep1a10',n:'a10-s1'},{r:'last302',n:'l302-e1'},{r:'ep1a11',n:'mb-ep1a11',mid:true},{r:'ep1b05',n:'b05-p1'}]);
 const r=A.stage('sm1006:S-01').roster(mk,base);assert.deepStrictEqual(r.normal.map(x=>x.nativeId),['a10-s1','l302-e1']);assert(r.normal.every(x=>x.name===e.mobName&&x.profile===prof&&!x.boss&&!x.midboss));
 assert.strictEqual(r.boss.nativeId,'mb-ep1a11');assert.strictEqual(r.boss.name,'봉합부인');assert.strictEqual(r.boss.boss,true);assert.strictEqual(r.boss.midboss,false);assert.strictEqual(r.mid,null);assert.strictEqual(r.samongKey,'S-01');assert.deepStrictEqual(r.template,{id:'ep1b05',enemies:[]});assert.strictEqual(r.fallback,0);
 const onlyDream=native([{r:'ep1a10',n:'a10-s1',L:'DREAM'},{r:'ep1a11',n:'mb-ep1a11',L:'DREAM'}]);const r2=A.stage('sm1006:S-01').roster(onlyDream,base);assert.deepStrictEqual(r2.normal.map(x=>x.nativeId),['a10-s1']);assert.strictEqual(r2.boss.nativeId,'mb-ep1a11');
 const guardOnly=native([{r:'ep1b05',n:'b05-p1'}]);const r3=A.stage('sm1006:S-01').roster(guardOnly,base);assert.deepStrictEqual(r3.normal.map(x=>x.nativeId),['b05-p1']);assert.strictEqual(r3.normal[0].name,e.mobName);assert.strictEqual(r3.boss.nativeId,'host-b');assert.strictEqual(r3.boss.name,'봉합부인');assert(r3.fallback>=1);
 const none=native([]);const r4=A.stage('sm1006:S-01').roster(none,base);assert.deepStrictEqual(r4.normal.map(x=>x.nativeId),['host-n']);assert.strictEqual(r4.normal[0].name,e.mobName);assert(r4.fallback>=2);
 const throws=()=>{throw new Error('boom');};const r5=A.stage('sm1006:S-01').roster(throws,base);assert(r5&&r5.normal.length===1&&r5.boss);
 const p=A.stage('sm1006:P').roster(native([{r:'dist00',n:'dist00-boss',boss:true}]),base);assert.deepStrictEqual(p.normal,[]);assert.strictEqual(p.boss.name,'코어 아래의 검은 뿌리');assert.strictEqual(A.stage('sm1006:P').idle,0);assert.strictEqual(A.stage('sm1006:S-01').idle,undefined);
 const m=A.stage('sm1006:M').roster(native([{r:'kair04',n:'kair-guardian-01'},{r:'u201',n:'u201-e3'},{r:'kair02',n:'kair-great-03',boss:true}]),base);assert.strictEqual(m.boss,null);assert.strictEqual(m.mid,null);assert.strictEqual(m.finaleBoss.name,'미카엘라');assert.strictEqual(m.finaleBoss.nativeId,'kair-great-03');assert.deepStrictEqual(m.normal.map(x=>x.nativeId),['kair-guardian-01','u201-e3']);
 ok('roster: EP donors renamed to the chapter mob / boss name (boss always the stage boss); DREAM-layer donors; guard then host fallback counted; P is boss-only with no idle wait; M never spawns 미카엘라 as a killable boss (finaleBoss template for R1010)');}
// 6) M 끝 연결 지점(R1010 결전·엔딩과 약속): M 몹 물결을 다 잡은 자리에서 __STORYWORLD_SURVIVAL_FINALE_R1010__.begin 을 한 번 부르고 true 면 넘김(handoff).
(async()=>{
 assert.strictEqual(A.handoff('sm1006:M',{loop:0}),false);ok('no R1010 → no handoff (M clears without a killable 미카엘라 and the run goes on)');
 const calls=[];win.__STORYWORLD_SURVIVAL_FINALE_R1010__={begin:info=>{calls.push(info);return true;}};
 assert.strictEqual(A.handoff('sm1006:RG',{loop:0}),false);assert.strictEqual(A.handoff('dist00',{loop:0}),false);assert.strictEqual(calls.length,0);
 assert.strictEqual(A.handoff('sm1006:M',{loop:0,kills:5,i:71}),true);assert.strictEqual(calls.length,1);assert.deepStrictEqual(calls[0],{stageId:'sm1006:M',key:'M',loop:0,kills:5,i:71});
 win.__STORYWORLD_SURVIVAL_FINALE_R1010__={begin:()=>false};assert.strictEqual(A.handoff('sm1006:M',{loop:1}),false);
 win.__STORYWORLD_SURVIVAL_FINALE_R1010__={begin:()=>{throw new Error('x');}};assert.strictEqual(A.handoff('sm1006:M',{loop:2}),false);
 win.__STORYWORLD_SURVIVAL_FINALE_R1010__={begin:()=>'yes'};assert.strictEqual(A.handoff('sm1006:M',{loop:3}),false);
 win.__STORYWORLD_SURVIVAL_FINALE_R1010__={};assert.strictEqual(A.handoff('sm1006:M',{loop:4}),false);delete win.__STORYWORLD_SURVIVAL_FINALE_R1010__;
 assert(A.inspect().stats.handoffErrors>=1&&A.inspect().stats.handoffs===1);ok('handoff: calls R1010 begin({stageId,key,loop,kills,i}) only on M; only a strict true hands over; false/throw/non-boolean/missing begin keep the normal flow');
 // 7) 끄기
 {const w=load({'storyworld.r1006.samong':JSON.stringify({on:false})});const B=w.__STORYWORLD_SURVIVAL_SAMONG_R1006__;assert.deepStrictEqual(B.ids(),[]);ok('off switch storyworld.r1006.samong {"on":false} → no samong stages (56-region loop as before)');}
 // 8) r600 연결 고리: 사몽 단계를 56지역 뒤에 붙이고, 지역 그림·몹·서사·제목·연결 지점을 단계 정의에서 읽는다(스토리 단계는 그대로)
 {const s=CS('survival-r600.js');assert.strictEqual(s,RT('survival-r600.js'));assert(s.includes('__STORYWORLD_SURVIVAL_SAMONG_R1006__'));
  assert(/ids:\[\.\.\.stageIds\(G\(\(\)=>regions,\[\]\)\),\.\.\.extIds\(\)\]/.test(s),'fresh ids = story stages then ext stages');
  assert(/function go\(i\)\{[^\n]*const sid=S\.ids\[i\],X=extOf\(sid\),id=X\?X\.host:sid;/.test(s),'go maps a samong stage to its host region');
  assert(/X\?X\.roster\(makeNative,roster\):roster\(id\)/.test(s),'roster from the stage definition');assert(/extHandoff\(\)/.test(s)&&/S\.phase==='handoff'/.test(s),'M boss slot hands over to R1010 and the handoff phase never advances');
  const w=new Function('window','document','localStorage',s+'\n;return window;')({},mkDoc(),{getItem:()=>null,setItem(){}});assert.deepStrictEqual(w.__STORYWORLD_SURVIVAL_R600__.pure.stageIds([{id:'a',index:1},{id:'sm',index:0,layer:'DREAM'}]),['a']);
  ok('r600 hook: ids = 56 story stages + samong stages, go/roster/narration/title read the stage definition, M hands over; pure story stageIds unchanged');}
 console.log('R1006 CPU',n,'checks passed');})().catch(e=>{console.error(e);process.exit(1);});

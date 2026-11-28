// R1396 3D 몹·보스 설정 하나로 합치기(사용자 2026-11-28 12:42Z "3d키면 내가 지정한 3d몹들만 3d로 적용되고 기본은 다 2d로, 3d 키고 끄는거 설정에서 하나의 키로만 조절") CPU 검사.
//  실제 오버레이(R1326·R1385·R1389·R1396)를 vm 에서 차례로 돌려 판정 결과를 본다: 기본 끔=전부 2D, 켬=사용자 지정(R1389 표)만 3D, 2D 지역 4곳 잠금,
//  자동 검사(webdriver)는 키를 안 정하면 예전 값 그대로(기존 CI 장면 불변), 주소·키 우선순위, 실시간 전환, 설정 줄 하나, 빌드 연결.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'../../..'),CS=ROOT+'/r96/client-source/',RT=ROOT+'/r96/runtime-text/';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const F='mob3d-master-r1396.js';
ok(fs.existsSync(CS+F),'오버레이 있음');
const src=fs.readFileSync(CS+F,'utf8');
ok(fs.existsSync(RT+F)&&fs.readFileSync(RT+F,'utf8')===src,'runtime-text 사본 같음');
const dec=JSON.parse(fs.readFileSync(ROOT+'/r96/qa/r1389/scope-decision.json','utf8'));
const want={};for(const m of dec.mobs)for(const k of m.kinds)want[k]=m.decision;
const TAGS=['r1312','r1315','r1316','r1317','r1322','r1322c','r1329','r1330','r1338','r1343','r1382'];

function load({webdriver=false,search='',zone='ep1b03',layer='STORY',ls={},extra={}}={}){
 const win={};const store=Object.assign({},ls);const room=Object.assign({id:zone,layer},extra);
 const ctx={window:win,navigator:{webdriver},location:{search},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},room,console};win.window=win;
 for(const f of ['mob-3d-zone-r1326.js','mob-dim-rule-r1385.js','mob-scope-r1389.js',F])vm.runInNewContext(fs.readFileSync(CS+f,'utf8'),ctx);
 return {D:win.__STORYWORLD_MOB_DIM_R1385__,Z:win.__STORYWORLD_MOB3D_ZONE_R1326__,M:win.__STORYWORLD_MOB3D_MASTER_R1396__,store,room};}
// 예전 값(마스터 없이) — webdriver 통과 모드 비교용
function legacy(opt){const win={};const store=Object.assign({},opt.ls||{});const ctx={window:win,navigator:{webdriver:!!opt.webdriver},location:{search:opt.search||''},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},room:{id:opt.zone||'ep1b03',layer:'STORY'},console};win.window=win;
 for(const f of ['mob-3d-zone-r1326.js','mob-dim-rule-r1385.js','mob-scope-r1389.js'])vm.runInNewContext(fs.readFileSync(CS+f,'utf8'),ctx);return {D:win.__STORYWORLD_MOB_DIM_R1385__,Z:win.__STORYWORLD_MOB3D_ZONE_R1326__};}

// 1) 기본(사람 플레이, 키 없음) = 끔 → 모든 몹·보스 2D
{const {D,Z,M}=load();ok(M&&/R1396/.test(M.revision),'API 있음');ok(M.on()===false&&M.mode()==='off','기본 꺼짐');
 for(const k of Object.keys(want)){const [t,kid]=k.split(':');ok(D.use(t,kid,true)===false,'기본 2D '+k);}
 for(const t of TAGS)ok(D.active(t,false)===false,'기본 오버레이 비활성 '+t);
 ok(D.use('r1315','glutton',true)===false&&D.use('r1338','balrog',true)===false&&D.use('r1382','wrathEar',true)===false,'설정 보스도 기본 2D');
 ok(Z.pick(true)===false,'7대죄 지역 강제 3D(R1326)도 끔');}
// 2) 켬 → R1389 표(사용자 지정)만 3D, 표 밖은 2D
{const {D,M}=load({ls:{'storyworld.r1396.mob3d':'on'}});ok(M.on()===true,'키 on');
 let three=0;for(const [k,v] of Object.entries(want)){const [t,kid]=k.split(':');ok(D.use(t,kid,false)===(v==='3d'),'켬 '+k+'='+v);if(v==='3d')three++;}
 ok(three>=60,'3D 지정 종류 '+three);
 ok(D.use('r1316','__none__',true)===false,'표 밖 종류는 원래 설정이 켜져 있어도 2D');
 ok(D.use('r1322c','sirenMor',true)===false&&D.use('r1322c','cyborgChairman',true)===false,'2D 보류(세이렌 모르·사이보그 회장) 2D');
 ok(D.use('r1315','glutton',false)===true,'탐식 보스 베엘제붑(7대죄) 3D');
 ok(D.use('r1382','wrathEar',false)===true&&D.use('r1382','slothMan',false)===true,'분노의 귀·나태 남자(7대죄) 3D');
 ok(D.use('r1382','lucifer',false)===true,'루시퍼 3D(사용자 목록)');
 ok(D.use('r1338','balrog',true)===false,'발록: 사용자 목록 밖·원화 닮음 6 → 2D');
 ok(D.use('r1312','gatekeeper',true)===false,'뿌리의 문지기 2D');
 for(const t of ['r1316','r1317','r1322','r1322c','r1329','r1330','r1343','r1382','r1312','r1315'])ok(D.active(t,false)===true,'켬 오버레이 활성 '+t);
 ok(D.active('r1338',true)===false,'발록 오버레이는 지정 3D 없음 → 비활성');}
// 3) 2D 지역 4곳(시스템의 거부권·관리자의 권한·잠들지 못하는 마을·한약과 불면귀) 잠금
for(const z of ['u204','u205','last302','last303']){const {D}=load({zone:z,ls:{'storyworld.r1396.mob3d':'on'}});
 ok(D.use('r1316','trash',true)===false&&D.use('r1330','mammon',true)===false,'2D 지역 '+z);for(const t of TAGS)ok(D.active(t,true)===false,'2D 지역 비활성 '+z+' '+t);}
{const {D}=load({zone:'u203',ls:{'storyworld.r1396.mob3d':'on'}});ok(D.use('r1316','trash',false)===true,'경계: 이웃 지역 u203 은 3D');}
// 4) 이야기 층 밖(사몽·무한생존)은 켜도 2D(지정은 이야기 지역 기준)
{const {D}=load({layer:'SAMONG',ls:{'storyworld.r1396.mob3d':'on'}});ok(D.use('r1316','trash',true)===false,'사몽 층 2D');}
{const {D}=load({extra:{survivalR600:true},ls:{'storyworld.r1396.mob3d':'on'}});ok(D.use('r1316','trash',true)===false,'무한생존 2D');}
// 5) 예전 개별 키는 무시(합쳐짐)
{const {D}=load({ls:{'storyworld.r1338.balrog3d':'on','storyworld.r1316.mob3d':'on','storyworld.r1389.scope':'off','storyworld.r1385.dimrule':'off'}});
 ok(D.use('r1338','balrog',true)===false&&D.use('r1316','trash',true)===false,'끔: 예전 개별 키가 켜져 있어도 2D');}
{const {D}=load({ls:{'storyworld.r1396.mob3d':'on','storyworld.r1389.scope':'off','storyworld.r1385.dimrule':'off'}});
 ok(D.use('r1316','trash',false)===true&&D.use('r1322c','sirenMor',true)===false,'켬: R1385·R1389 개별 끄기와 상관없이 지정표');}
// 6) 주소 우선
{const {M}=load({search:'?mob3d96=1',ls:{'storyworld.r1396.mob3d':'off'}});ok(M.on()===true,'?mob3d96=1 이 키보다 우선');}
{const {M}=load({search:'?x=1&mob3d96=0',ls:{'storyworld.r1396.mob3d':'on'}});ok(M.on()===false,'?mob3d96=0');}
// 7) 자동 검사(webdriver): 키·주소 없으면 예전 동작 그대로(기존 CI 기준선 불변), 정하면 따름
{const opt={webdriver:true,ls:{'storyworld.r1338.balrog3d':'on'}};const {D,M}=load(opt);const L=legacy(opt);ok(M.mode()==='legacy','webdriver 기본 = 예전 동작');
 for(const k of [...Object.keys(want),'r1338:balrog','r1315:glutton','r1316:__none__']){const [t,kid]=k.split(':');for(const b of [true,false])ok(D.use(t,kid,b)===L.D.use(t,kid,b),'webdriver 통과 '+k+' '+b);}
 for(const t of TAGS)ok(D.active(t,false)===L.D.active(t,false),'webdriver active 통과 '+t);ok(L.Z.pick(false)===load(opt).Z.pick(false),'webdriver R1326 통과');}
{const {D}=load({webdriver:true,search:'?mob3d96=0'});ok(D.use('r1316','trash',true)===false,'webdriver ?mob3d96=0 → 2D');}
// 8) 실시간 전환·저장
{const {D,M,store}=load();ok(D.use('r1316','trash',false)===false,'전환 전 2D');M.set(true);ok(store['storyworld.r1396.mob3d']==='on','set(true) 저장');ok(D.use('r1316','trash',false)===true,'켠 즉시 3D');
 M.set(false);ok(store['storyworld.r1396.mob3d']==='off'&&D.use('r1316','trash',true)===false,'끈 즉시 2D');}
// 9) 설정 화면: 3D 몹 체크 하나만 보이고 예전 줄은 숨김(영웅 줄은 그대로)
ok(/id="mob3dMasterR1396Toggle"/.test(src)&&/3D 몹·보스/.test(src),'새 설정 체크 하나');
const OLD=['mob3dHqR1339Row','mob3dR1312Row','mob3dR1315Row','mob3dR1316Row','mob3dR1317Row','mob3dR1322Row','boss3dR1322cRow','mob3dR1329Row','boss3dR1330Row','balrog3dR1338Row','envy3dR1343Row','boss3dR1382Row','mobStyleR1325Row'];
for(const id of OLD)ok(src.includes('#'+id),'예전 줄 숨김 '+id);
ok(!/hwando3dR1302Row|hero3d|r1327/i.test(src.replace(/\/\/.*$/gm,'')),'영웅 3D 줄은 건드리지 않음');
// 10) 빌드 연결
const html=fs.readFileSync(RT+'index.html','utf8');
ok(/<script src="\.\/mob-scope-r1389\.js"><\/script>\n<script src="\.\/mob3d-master-r1396\.js"><\/script>/.test(html),'스크립트 태그(R1389 바로 뒤)');
ok(html.split('<script src="./'+F+'"></script>').length===2,'태그 1개');
ok(['mob-3d-r1312.js','mob-3d-r1315.js','mob-3d-r1329.js','mob-3d-r1338.js'].every(f=>html.indexOf('"./'+f+'"')>html.indexOf('"./'+F+'"')),'뒤에 읽는 3D 오버레이보다 앞');
ok(fs.readFileSync(ROOT+'/scripts/verify-r96-public.py','utf8').includes("'"+F+"'"),'공개 검증 목록');
ok(fs.readFileSync(ROOT+'/.github/workflows/pages.yml','utf8').includes('node r96/qa/r1396/r1396-cpu-check.cjs'),'CI 검사 줄');
ok(JSON.parse(fs.readFileSync(ROOT+'/r96/runtime-manifest.json','utf8')).files.some(f=>f.path===F),'manifest');
console.log('R1396 CPU check OK',n,'assertions');

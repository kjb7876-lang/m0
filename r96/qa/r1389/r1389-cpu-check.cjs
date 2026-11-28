// R1389 3D 범위(사용자 11-28 06:02Z "중요 보스·구체·네모·기계·유령형 몹만 3D, 3D 품질 8점 이상만 3D, 나머지 2D") CPU 검사.
//  판정 규칙을 이 파일에서 따로 다시 계산해 scope-decision.json·오버레이 표와 대조하고, 경계값·잠금·맘몬 맵 제외·실행 동작·빌드 연결을 본다.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'../../..'),CS=ROOT+'/r96/client-source/',RT=ROOT+'/r96/runtime-text/';
let n=0;const ok=(c,m)=>{assert.ok(c,m);n++;};
const R85=JSON.parse(fs.readFileSync(ROOT+'/r96/qa/r1385/decision.json','utf8'));
const scope=JSON.parse(fs.readFileSync(__dirname+'/scope.json','utf8'));
const amp=JSON.parse(fs.readFileSync(__dirname+'/amp.json','utf8'));
ok(fs.existsSync(__dirname+'/scope-decision.json'),'판정표 scope-decision.json 있음');
const dec=JSON.parse(fs.readFileSync(__dirname+'/scope-decision.json','utf8'));
ok(fs.existsSync(CS+'mob-scope-r1389.js'),'오버레이 있음');
const src=fs.readFileSync(CS+'mob-scope-r1389.js','utf8');
ok(fs.readFileSync(RT+'mob-scope-r1389.js','utf8')===src,'runtime-text 사본 같음');

// 1) 규칙 경계값(파이썬 판정 함수)
const q=(qq,f)=>cp.execFileSync('python3',[ROOT+'/scripts/r1389-scope.py','--judge',String(qq),String(f)]).toString().trim();
ok(q(8.5,8)==='3d','문턱 정확히(품질 8.5·원화 8) → 3d');ok(q(8.49,9)==='2d','품질 8.49 → 2d');ok(q(9.5,7.9)==='2d','원화 닮음 7.9 → 2d');ok(q(10,10)==='3d','만점 → 3d');

// 2) 따로 계산한 판정과 대조
const TARGET=new Set([...scope.boss,...Object.values(scope.shape).flat()]);
const SETTING=new Set(['r1338:balrog','r1315:glutton','r1382:wrathEar','r1382:slothMan']);
const UL=new Set(scope.user_list),ULZ=new Set(scope.user_list_zones),UL2Z=new Set(scope.user_2d_zones||[]);
const MAP=Object.fromEntries([...fs.readFileSync(CS+'mob-3d-hq-r1339.js','utf8').matchAll(/'(assets\/[^']+\.glb)':'(assets\/r1339\/[^']+\.glb)'/g)].map(m=>[m[1],m[2]]));
for(const k of Object.keys(scope.old_3d_kept))delete MAP[k];
const glbOf={};for(const f of fs.readdirSync(CS).filter(f=>/^mob-3d-r13\d+c?\.js$/.test(f))){const t=f.replace(/^mob-3d-|\.js$/g,'');const s=fs.readFileSync(CS+f,'utf8');
 for(const m of s.matchAll(/['"]?(\w+)['"]?\s*:\s*[\{\[]\s*(?:glb\s*:\s*)?['"](assets\/[^'"]+\.glb)/g))glbOf[t+':'+m[1]]=m[2];}
Object.assign(glbOf,scope.glb_extra);
function quality(m){const g0=glbOf[m.key];const g=MAP[g0]||g0;const a=(amp[g]||{}).clips;if(!a)return null;
 const atk=Math.max(0,...Object.entries(a).filter(([k])=>/attack|special|cast/i.test(k)).map(([,v])=>v));
 const f=Math.max(.3,Math.min(1,atk/.25));const fid=(scope.fid_extra[m.key]||[])[0]??(m.d3||{}).aes;const mot=(m.d3||{}).mot??9;
 if(fid==null)return null;return {q:Math.round((.4*9.5+.35*mot*f+.25*fid)*100)/100,fid,atk};}
const want={};
for(const m of [...R85.mobs,...R85.skipped.filter(x=>UL.has(x.key)).map(x=>({key:x.key,kinds:[x.key],zones:[]}))]){
 if(SETTING.has(m.key))continue;
 let v;const zs=m.zones||[];
 if(m.key in (scope.hold_2d||{}))v='2d';// 큰 동작 판 오기 전까지 2D 보류
 else if(zs.length&&zs.every(z=>UL2Z.has(z)))v='2d';// 사용자 지정 2D 지역
 else if(UL.has(m.key)||(zs.length&&zs.every(z=>ULZ.has(z))))v='3d';// 사용자 지정 목록 우선
 else if(m.key in scope.card_locks)v=scope.card_locks[m.key];
 else if(m.lock&&m.decision==='2d')v='2d';// 사용자 2D 잠금은 그대로
 else if(!TARGET.has(m.key))v='2d';
 else{const Q=quality(m);if(!Q)v=m.decision;// 측정 못 한 사용자 잠금(봉인구·유리 망령)은 그대로
  else{v=Q.q>=8.5&&Q.fid>=8?'3d':'2d';
   // 지금 2D 인 것을 3D 로 켤 때는 R1385 화면 색 검사도 통과해야(R1385 판정이 2d 이고 이유에 색·문턱이 있으면 2D 유지)
   if(v==='3d'&&m.current==='2d'&&m.decision==='2d'&&/2D 유지/.test(m.reason||''))v='2d';}}
 for(const k of m.kinds)want[k]=v;}
const got={};for(const m of dec.mobs)for(const k of m.kinds)got[k]=m.decision;
ok(JSON.stringify(Object.keys(got).sort())===JSON.stringify(Object.keys(want).sort()),'판정 열쇠 일치 '+Object.keys(got).length+' vs '+Object.keys(want).length);
for(const k in want)ok(got[k]===want[k],'판정 일치 '+k+' 기대 '+want[k]+' 실제 '+got[k]);

// 3) 회귀·정상 사례(사람이 정한 기대값)
const E={'r1322c:hotelChairman':'3d','r1322c:seoyun':'3d','r1317:extSignal':'3d','r1316:trash':'3d','r1317:orb':'3d','r1343:glassWraith':'3d',
 // 사용자 11-28 08:34Z 목록
 'r1317:rose':'3d','r1316:slime':'3d','r1322:slimeMeadow':'3d','r1316:cable':'3d','r1322c:judicialCore':'3d','r1312:guard':'3d','r1316:moth':'3d','r1316:goat':'3d','r1317:twinned':'3d',
 'r1316:nurse':'3d','r1316:vial':'3d','r1316:carrier':'3d','r1329:addictionCore':'3d','r1382:lucifer':'3d','r1317:seal':'3d','r1317:nameless':'3d','r1343:leviathan':'3d','r1316:mannequin':'3d','r1330:mammon':'3d','r1330:backCoin':'3d','r1315:knight':'3d',
 // 사용자 11-28 08:51Z: 2부·3부·4부·5부 3D(시스템의 거부권·관리자 권한·잠들지 못하는 마을·한약과 불면귀는 2D)
 'r1316:robot':'3d','r1322c:cyborgChairman':'2d','r1322:gateFrame':'3d','r1316:void':'3d','r1322c:controller':'2d','r1317:warhound':'3d','r1322:core':'3d','r1322c:sirenMor':'2d','r1322c:greatGatekeeper05':'2d','r1322:slimeMeadow':'3d','r1317:herbwife':'2d',
 // 목록 밖은 R1389 규칙
 'r1322:superEgo':'2d','r1317:guard':'2d','r1316:mask':'2d','r1316:mason':'2d','r1322:manuscript':'2d',
 'r1329:eggkeeper':'3d','r1329:swampMage':'3d','r1322c:surgeon':'2d','r1322:clockwork':'2d','r1322:reversal':'2d','r1322:censor':'2d'};
for(const [k,v] of Object.entries(E))ok(got[k]===v,'기대값 '+k+'='+v+' (실제 '+got[k]+')');
for(const k of SETTING)ok(!(k in got),'설정으로 정하는 보스는 표 밖 '+k);
ok(dec.mobs.every(m=>m.decision==='3d'?TARGET.has(m.key)||m.key in scope.card_locks||UL.has(m.key)||(m.zones||[]).some(z=>ULZ.has(z)):true),'3D 는 사용자 목록·대상·카드 잠금뿐');
ok(dec.mobs.filter(m=>(m.zones||[]).length&&m.zones.every(z=>ULZ.has(z))&&!(m.key in (scope.hold_2d||{}))).every(m=>m.decision==='3d'),'사용자 지정 지역 몹 전부 3D(2D 보류 보스 빼고)');
ok(Object.keys(scope.hold_2d||{}).length<=4,'2D 보류는 hq5 보스 4종뿐');ok(dec.mobs.filter(m=>(m.zones||[]).length&&m.zones.every(z=>UL2Z.has(z))).every(m=>m.decision==='2d'),'사용자 지정 2D 지역 몹 전부 2D');
ok(['u204','u205','last302','last303'].every(z=>UL2Z.has(z)&&!ULZ.has(z)),'2D 지역은 3D 지역 목록과 겹치지 않음');

// 4) 오버레이 표 = 판정표
function load({webdriver=false,search='',zone='ep1b03',layer='STORY',ls={}}={}){const win={};const store=Object.assign({},ls);
 const ctx={window:win,navigator:{webdriver},location:{search},localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}},room:{id:zone,layer},console};win.window=win;
 vm.runInNewContext(fs.readFileSync(CS+'mob-dim-rule-r1385.js','utf8'),ctx);vm.runInNewContext(src,ctx);return win.__STORYWORLD_MOB_DIM_R1385__;}
const R=load();ok(R&&/R1389/.test(R.revision89||''),'R1385 API 를 R1389 가 감쌈');
const T=R.table89();ok(JSON.stringify(T)===JSON.stringify(Object.fromEntries(Object.keys(got).sort().map(k=>[k,got[k]]))),'오버레이 표 = 판정표');
ok(R.use('r1316','mason',true)===false,'성벽 침식 봉인병(6부): 2d');ok(R.use('r1322c','sirenMor',true)===false,'세이렌 모르: 큰 동작 판 전까지 2D 보류');ok(R.use('r1317','warhound',false)===true,'전쟁기계사냥개(3부): 3d');ok(R.use('r1382','lucifer',false)===true,'루시퍼: 사용자 목록으로 3D');ok(R.use('r1316','trash',false)===true,'쓰레기들 3d');
ok(R.use('r1338','balrog',false)===false&&R.use('r1315','glutton',true)===true,'설정 보스는 원래 값');ok(R.use('r1316','__none__',true)===true&&R.use('r1316','__none__',false)===false,'표에 없으면 원래 값');
ok(R.active('r1316',false)===true,'3D 남은 오버레이는 active');
{const Rz=load({zone:'last302'});ok(Rz.use('r1316','trash',true)===false,'불면귀 마을은 늘 2D');}
{const Rs=load({layer:'SAMONG'});ok(Rs.use('r1316','mason',true)===true,'이야기 층 밖은 원래 값');}
{const Ro=load({ls:{'storyworld.r1389.scope':'off'}});ok(Ro.use('r1322c','sirenMor',false)===false,'R1389 끄면 R1385 결정(세이렌 2D)');}
{const Rw=load({webdriver:true});ok(Rw.use('r1316','mason',true)===true,'자동 검사(webdriver)는 기본 꺼짐 → 원래 값');}
{const Ru=load({webdriver:true,search:'?scope89=1&dim85=1'});ok(Ru.use('r1316','mason',true)===false,'?scope89=1 로 켬');}

// 5) 빌드 연결
const html=fs.readFileSync(RT+'index.html','utf8');ok(/<script src="\.\/mob-dim-rule-r1385\.js"><\/script>\n<script src="\.\/mob-scope-r1389\.js"><\/script>/.test(html),'스크립트 태그(R1385 바로 뒤)');
ok(fs.readFileSync(ROOT+'/scripts/verify-r96-public.py','utf8').includes("'mob-scope-r1389.js'"),'공개 검증 목록');
ok(fs.readFileSync(ROOT+'/.github/workflows/pages.yml','utf8').includes('node r96/qa/r1389/r1389-cpu-check.cjs'),'CI 검사 줄');
ok(JSON.parse(fs.readFileSync(ROOT+'/r96/runtime-manifest.json','utf8')).files.some(f=>f.path==='mob-scope-r1389.js'),'manifest');
console.log('R1389 CPU check OK',n,'assertions,',Object.keys(got).length,'kinds, 3D',Object.values(got).filter(v=>v==='3d').length);

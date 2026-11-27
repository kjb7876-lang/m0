// R1342 솔로몬의 봉인식(ep1b01) 잡몹 3D(사용자 11-26 13:42Z 카드 "잡몹 4종 3D, 보스 2D") — 정적 회귀.
//  · ep1b01 은 3D 지역: R1326 pick 이 이야기 층에서 true(7대죄 7곳·불면귀 2곳 규칙은 그대로).
//  · 이름 없던 공포(2D r92/mobs/M018-move) = R1317 기계화 복종 봉인구 GLB 재사용(새 종류 nameless).
//  · 유리 망령 = R1316 기존 3D(표 그대로).
//  · 보스 교만의 잔향 · 제72문(mb-ep1b01)은 2D 유지: 3D 표 어디에도 없고, 3D 오버레이는 e.boss 를 뺀다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return String(fs.readFileSync(path.join(R,p)));}catch(_){return '';}};
const Z='mob-3d-zone-r1326.js',z=rd('client-source/'+Z),P='mob-3d-r1317.js',q=rd('client-source/'+P);
ok(!!z&&z===rd('runtime-text/'+Z),Z+' 원본·사본 같음');
ok(!!q&&q===rd('runtime-text/'+P),P+' 원본·사본 같음');
// R1326 pick 을 실제로 돌려 본다(가짜 window·room).
function pickIn(zoneId,layer,on,extra){const win={};const ctx={window:win,localStorage:{getItem:()=>null,setItem(){}},location:{search:''},room:Object.assign({id:zoneId,layer},extra||{})};
 vm.createContext(ctx);vm.runInContext(z,ctx);return win.__STORYWORLD_MOB3D_ZONE_R1326__.pick(on);}
ok(pickIn('ep1b01','STORY',false)===true,'ep1b01 이야기 층: 설정 꺼져도 3D');
ok(pickIn('ep1b01','STORY',true)===true,'ep1b01 이야기 층: 설정 켜도 3D');
ok(pickIn('ep1b01',null,false)===true,'ep1b01 layer 없음(이야기): 3D');
ok(pickIn('ep1b01','DREAM',false)===false,'경계: ep1b01 꿈 층은 설정 그대로(꺼짐)');
ok(pickIn('ep1b01','STORY',false,{samongR103:true})===false,'경계: 사몽 방은 설정 그대로');
ok(pickIn('ep1b01','STORY',false,{survivalR600:true})===false,'경계: 무한생존 방은 설정 그대로');
ok(pickIn('ep1b09','STORY',false)===false,'회귀: ep1b09(밖)은 설정 그대로 꺼짐');
ok(pickIn('ep1b07','STORY',false)===true,'회귀: 7대죄 ep1b07 3D');
ok(pickIn('last302','STORY',true)===false,'회귀: 불면귀 마을 2D');
ok(pickIn('ep1a11','STORY',false)===false,'회귀: 앞 지역 ep1a11 설정 그대로');
// R1317 종류 표를 실제로 꺼내 본다.
const m=/const TABLE=\{([\s\S]*?)\};/.exec(q);let T={};try{T=vm.runInNewContext('({'+m[1]+'})');}catch(e){ok(false,'TABLE 파싱 '+e);}
const nl=T.nameless;ok(!!nl,'R1317 표에 nameless 종류');
if(nl){ok(nl[0]==='assets/r1317/sw-glb-orb.glb','nameless = 봉인구 GLB 재사용(새 파일 없음)');
 ok(nl[2]==='이름 없던 공포','nameless 이름 = 이름 없던 공포');
 ok(nl[1].test('assets/r92/mobs/M018-move.png')&&nl[1].test('assets/r116/mobs/M018-hit.png')&&nl[1].test('assets/r198/mobs/M018-idle.png'),'M018 몸 그림(move·hit·idle) 짝');
 ok(!nl[1].test('assets/r410/mobs/m018.webp')&&!nl[1].test('assets/r248/mobs/m018.webp'),'경계: 소문자 m018(유리 망령) 과 섞이지 않음');
 ok(!nl[1].test('assets/r92/mobs/M0180-move.png')&&!nl[1].test('assets/r92/mobs/M019-move.png'),'경계: M0180·M019 와 섞이지 않음');}
ok(T.signal&&T.signal[2]==='빗속 횡단보도의 기억 잔향'&&T.signal[0]==='assets/r1317/sw-glb-signal.glb','회귀: 기존 signal(빗속 횡단보도) 종류 그대로');
ok(Object.keys(T).length===new Set(Object.keys(T)).size&&(q.match(/^ signal:/mg)||[]).length===1,'회귀: 표 키 중복 없음');
ok(T.orb&&T.orb[2]==='기계화 복종 봉인구'&&T.orb[1].test('assets/r380/mobs/cult-memory-orb-float-d1.webp'),'회귀: 기존 봉인구 종류 그대로');
ok(fs.existsSync(path.join(R,'runtime-text/assets/r1317/sw-glb-orb.glb')),'봉인구 GLB 있음');
const g=rd('client-source/mob-3d-r1316.js');ok(/glass:\['assets\/r1316\/mob-glass-wraith-3d\.glb',\/r410\\\/mobs\\\/m018\\b/.test(g),'유리 망령 3D(R1316) 표 그대로');
// 보스는 2D 유지
for(const f of ['mob-3d-r1312.js','mob-3d-r1315.js','mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js','mob-3d-r1326.js'].filter(f=>rd('client-source/'+f)))
 ok(!/mb-ep1b01|제72문|교만의 잔향/.test(rd('client-source/'+f)),f+' 에 제72문 보스 3D 없음');
ok(/if\(!e\|\|e\.boss\)return null/.test(q),'R1317 은 보스(e.boss) 제외');

// ---- R1342b: Dots SW-R1342 결과 — 01 인장 잔류체·02 외부 신호 3D(새 GLB), 03 제72문 보스 2D 고품질 모션 시트 ----
const nk=T.seal,ns=T.extSignal;
ok(!!nk&&nk[0]==='assets/r1342/sw-r1342-01-seal-residual.glb'&&nk[2]==='일흔두 번째 인장 잔류체','seal 종류 = 새 GLB·이름');
if(nk){ok(nk[1].test('assets/r380/mobs/ep1b-seal-residual-float-d1.webp')&&nk[1].test('assets/episode1b/generated-v394/seal_residual.webp'),'seal 2D 몸 그림 짝(이야기·꿈)');
 ok(!nk[1].test('assets/r380/mobs/cult-memory-orb-float-d1.webp'),'경계: seal 이 봉인구와 섞이지 않음');}
ok(!!ns&&ns[0]==='assets/r1342/sw-r1342-02-external-signal.glb'&&ns[2]==='검은 실의 외부 신호','extSignal 종류 = 새 GLB·이름');
if(ns){ok(ns[1].test('assets/r109/mobs/M019-move.png')&&ns[1].test('assets/episode1b/generated-v392/brainwave_contamination.webp'),'signal 2D 몸 그림 짝');
 ok(!ns[1].test('assets/r109/mobs/M0190-move.png')&&!ns[1].test('assets/r92/mobs/M018-move.png'),'경계: signal 이 M0190·M018 과 섞이지 않음');}
for(const g of ['assets/r1342/sw-r1342-01-seal-residual.glb','assets/r1342/sw-r1342-02-external-signal.glb']){const b=fs.existsSync(path.join(R,'runtime-text',g))?fs.readFileSync(path.join(R,'runtime-text',g)):null;
 ok(!!b&&b.slice(0,4).toString()==='glTF'&&b.length<2e6,g+' GLB(2MB 미만)');}
ok(nk&&nk[3]&&nk[3].ink===0&&ns&&ns[3]&&ns[3].ink===0,'가는 다리·고리 모델 먹 껍질 얇게(opts.ink<1)');
ok(/const glass=!!source\.transparent&&Number\(source\.opacity\)<\.99;[^\n]*m\.opacity=glass\?source\.opacity:1/.test(q),'반투명 유리 재질은 원래 불투명도 유지');
ok(/addInk\(model,k,KINDS\[kindId\]\.opts\.ink\?\?1\)/.test(q),'먹 두께 배율을 create 에서 넘김');
// R1342c(사용자 11-27 "크기도 맞춰"): 인장 잔류체 3D 가 같은 키면 가는 다리라 2D 보다 작아 보였다 → 키 1.3배, 외부 신호는 그대로.
ok(nk&&nk[3]&&nk[3].size===1.3&&ns&&ns[3]&&!(ns[3].size>0),'인장 잔류체 3D 크기 1.3배(외부 신호 1)');
ok(/i\.targetU=s\[s\.length>>1\]\*\(KINDS\[i\.kind\]\.opts\.size>0\?KINDS\[i\.kind\]\.opts\.size:1\)/.test(q),'2D 목표 키에 opts.size 곱함');
ok(/pick\(\/\^idle\$\/i\)/.test(q)&&/pick\(\/\^walk\$\/i\)/.test(q),'R1317 클립 이름 대소문자 무시(새 GLB 는 소문자 idle·walk)');
// 보스 2D 시트
const B='boss72-motion-r1342.js',b=rd('client-source/'+B);
ok(!!b&&b===rd('runtime-text/'+B),B+' 원본·사본 같음');
const SHEETS={idle:8,move:8,atkA:8,atkB:8,cast:10,hit:4,death:10,reveal:8};
let png=null;try{png=require('zlib')&&null;}catch(_){}
for(const [m,n] of Object.entries(SHEETS)){const f=path.join(R,'runtime-text/assets/r1342/boss72/'+m+'.webp');const ex=fs.existsSync(f);ok(ex,'시트 '+m+'.webp 있음');
 if(ex){const buf=fs.readFileSync(f);ok(buf.slice(0,4).toString()==='RIFF'&&buf.slice(8,12).toString()==='WEBP','  '+m+' WebP');
  // VP8X 캔버스 크기(24비트 -1)
  const W=buf.readUIntLE(24,3)+1,H=buf.readUIntLE(27,3)+1;ok(W===752*n&&H===870,'  '+m+' 크기 '+W+'×'+H+' = 752×'+n+' 칸');}}

// 상태 → 시트 고르기(가짜 window 에서 실제 pick 실행)
{const win={},R1241={on:false,n:0};win.__STORYWORLD_BOSS72_SHADOWS_R1241__={inspect:()=>({casting:R1241.on,casts:R1241.n}),tune:{chant:.9}};
 const cx={window:win,localStorage:{getItem:()=>null,setItem(){}},location:{search:''},setInterval(){},performance:{now:()=>0}};vm.createContext(cx);vm.runInContext(b,cx);
 const A=win.__STORYWORLD_BOSS72_MOTION_R1342__;ok(!!A&&typeof A.pick==='function','pick 공개');
 if(A){const mk=o=>Object.assign({nativeId:'mb-ep1b01',name:'교만의 잔향 · 제72문',hp:100,state:'idle',spawnState:'active',hitTimer:0,moveDX:0,moveDY:0},o);
  let e=mk({});ok(A.pick(e,0)[0]==='idle'&&A.pick(e,1)[1]===0&&A.pick(e,.13)[1]===1,'대기 8fps 반복 '+A.pick(e,.13));
  e=mk({state:'move',moveDX:.5});ok(A.pick(e,0)[0]==='move'&&A.pick(e,.7)[1]===0,'이동 12fps(0.7초=8칸 한 바퀴)');
  e=mk({state:'move',moveDX:0,moveDY:0});ok(A.pick(e,0)[0]==='idle','경계: move 상태라도 안 움직이면 대기');
  e=mk({state:'attack',attack:{id:2,elapsed:0}});ok(A.pick(e,0).join()==='atkA,0','공격 짝수 번호 = A 첫 칸');
  e.attack.elapsed=.5;A.pick(e,0);e.attack.elapsed=1;ok(A.pick(e,0).join()==='atkA,7','공격 A 끝 칸(진행 비례, 넘치지 않음) '+A.pick(e,0));
  e=mk({state:'attack',attack:{id:3,elapsed:.0}});ok(A.pick(e,0)[0]==='atkB','공격 홀수 번호 = B(번갈아)');
  e=mk({state:'attack',attack:{id:4,elapsed:0},lastAttackKind:'ranged'});ok(A.pick(e,0)[0]==='atkB','원거리 공격 = B');
  e=mk({hitTimer:.3});ok(A.pick(e,5).join()==='hit,0'&&A.pick(e,5.08)[0]==='hit'&&A.pick(e,5.08)[1]===1,'피격 14fps');ok(A.pick(e,6)[0]==='idle','피격 4칸 뒤엔 대기(피격 시간 남아도)');
  e=mk({});R1241.on=true;R1241.n=1;ok(A.pick(e,10).join()==='cast,0'&&A.pick(e,10.5)[0]==='cast','시전(주문 0.9초)');ok(A.pick(e,11)[0]==='idle','주문 뒤 파도 동안은 대기');
  R1241.n=2;ok(A.pick(e,12).join()==='cast,0','회귀: 시전이 이어서 다시 시작돼도 주문 동작 처음부터');R1241.on=false;
  e=mk({hp:0});ok(A.pick(e,20).join()==='death,0'&&A.pick(e,30).join()==='death,9','사망 10칸, 마지막 칸 유지');
  ok(A.pick(mk({state:'attack',attack:{id:1,elapsed:.2},hitTimer:.3}),0)[0]==='hit','우선순위: 피격 > 공격');}
}
ok(new RegExp("FRAMES=\\{idle:8,move:8,atkA:8,atkB:8,cast:10,hit:4,death:10,reveal:8\\}").test(b),'오버레이 칸 수 표 = 시트');
ok(/mb-ep1b01/.test(b)&&/제72문/.test(b),'대상 = 제72문 보스만');
ok(/storyworld\.r1342\.boss72/.test(b)&&/boss72m=/.test(b),'끄기 설정 키·주소(?boss72m=0)');
const html=rd('runtime-text/index.html');ok(html.split('<script src="./'+B+'"></script>').length===2,'index.html 태그 1개');
const man=JSON.parse(rd('runtime-manifest.json')||'{"files":[]}');for(const f of [B,'assets/r1342/sw-r1342-01-seal-residual.glb','assets/r1342/sw-r1342-02-external-signal.glb',...Object.keys(SHEETS).map(m=>'assets/r1342/boss72/'+m+'.webp')])ok(man.files.some(v=>v.path===f),'runtime-manifest '+f);
ok(String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'))).includes("'"+B+"'"),'공개 확인 목록');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1342/r1342-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1342 FAIL '+fail:'R1342 ALL OK');process.exit(fail?1:0);

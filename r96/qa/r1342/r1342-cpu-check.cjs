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
ok(T.orb&&T.orb[2]==='기계화 복종 봉인구'&&T.orb[1].test('assets/r380/mobs/cult-memory-orb-float-d1.webp'),'회귀: 기존 봉인구 종류 그대로');
ok(fs.existsSync(path.join(R,'runtime-text/assets/r1317/sw-glb-orb.glb')),'봉인구 GLB 있음');
const g=rd('client-source/mob-3d-r1316.js');ok(/glass:\['assets\/r1316\/mob-glass-wraith-3d\.glb',\/r410\\\/mobs\\\/m018\\b/.test(g),'유리 망령 3D(R1316) 표 그대로');
// 보스는 2D 유지
for(const f of ['mob-3d-r1312.js','mob-3d-r1315.js','mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js','mob-3d-r1326.js'].filter(f=>rd('client-source/'+f)))
 ok(!/mb-ep1b01|제72문|교만의 잔향/.test(rd('client-source/'+f)),f+' 에 제72문 보스 3D 없음');
ok(/if\(!e\|\|e\.boss\)return null/.test(q),'R1317 은 보스(e.boss) 제외');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1342/r1342-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1342 FAIL '+fail:'R1342 ALL OK');process.exit(fail?1:0);

// R1323 3D 몹 몸 재질에서 맵용 수묵 셰이더(R1055)·국지 조명(R451) 빼기 — 정적 회귀.
// 원인(R1320 3D 영웅 스레드가 찾음): 두 오버레이가 층 2 의 모든 메시 재질에 onBeforeCompile 을 덧대 3D 몹이 바닥 먹빛에 묻혀 흐릿했다.
// 메시 userData.r1055Skip·userData.r451 이면 둘 다 건너뛴다(ink-wash-r1055 eligible, local-light-r451 eligible).
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return String(fs.readFileSync(path.join(R,p)));}catch(_){return '';}};
for(const f of ['mob-3d-r1312.js','mob-3d-r1315.js','mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js']){
 const s=rd('client-source/'+f);ok(s&&s===rd('runtime-text/'+f),f+' runtime-text 사본이 원본과 같음');
 ok(/model\.traverse\(o=>\{o\.layers\?\.set\(HOST_LAYER\);if\(o\.isMesh\)\{o\.userData\.r1055Skip=true;o\.userData\.r451=true;/.test(s),f+' 몹 메시에 r1055Skip·r451 표식');}
const ink=rd('client-source/ink-wash-r1055.js'),ll=rd('client-source/local-light-r451.js');
ok(/o\.userData\?\.r1055Skip/.test(ink),'R1055 가 r1055Skip 메시를 건너뜀(이 표식이 유효)');
ok(/o\.userData\?\.r451\b/.test(ll),'R451 이 userData.r451 메시를 건너뜀(이 표식이 유효)');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1323/r1323-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1323 FAIL '+fail:'R1323 ALL OK');process.exit(fail?1:0);

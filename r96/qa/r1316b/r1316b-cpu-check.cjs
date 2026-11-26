// R1316b — #1017 Codex 리뷰 2건 후속(무한생존 방 제외, 시야 배율 바뀌면 3D 몹 키도 따라감) — 정적 회귀. R1316·R1317 둘 다.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
for(const F of ['mob-3d-r1316.js','mob-3d-r1317.js']){
 const s=String(fs.readFileSync(path.join(R,'client-source',F)));const rt=String(fs.readFileSync(path.join(R,'runtime-text',F)));
 ok(s===rt,F+' runtime-text 사본이 원본과 같음');
 ok(/const inStory=[^\n]*!room\.survivalR600/.test(s),F+' 이야기 층 조건이 무한생존 방(room.survivalR600)을 뺌');
 ok(/targetU/.test(s)&&/i\.hs\.push\([^)]*pxPerUnit\(/.test(s),F+' 2D 키 표본을 화면 픽셀이 아니라 줌과 무관한 값(÷pxPerUnit)으로 저장');
 ok(/const inStory=[^\n]*NO3D\.has\(String\(room\.id\)\)/.test(s)&&/const NO3D=new Set\(\['last302','last303'\]\)/.test(s),F+' 불면귀 마을(last302·last303)은 3D 몹 제외(사용자 11-26)');
 ok(/i\.target=i\.targetU\*pxPerUnit\(r\)/.test(s),F+' 매 프레임 지금 줌으로 화면 키를 다시 계산');
}
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1316b/r1316b-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1316b FAIL '+fail:'R1316b ALL OK');process.exit(fail?1:0);

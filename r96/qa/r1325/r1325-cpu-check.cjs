// R1325 3D 몹·2D 몹 이질감 줄이기(사용자 11-26 "3d몹들과 기존 2d몹들 너무 이질감 없게") — 정적 회귀.
//  ① 3D 모션을 초당 10장으로 끊어 그림(2D 프레임 리듬) ② 명암 3단(셀 음영) ③ 먹 윤곽 굵게 ④ 2D 몸 그림 평균색에 3D 색을 맞춤. 기본 꺼짐 3D(R1316·R1317·R1322·R1322c)만.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return String(fs.readFileSync(path.join(R,p)));}catch(_){return '';}};
const F='mob-3d-style-r1325.js',s=rd('client-source/'+F);
ok(!!s&&s===rd('runtime-text/'+F),'오버레이 원본·runtime-text 사본 같음');
ok(/__STORYWORLD_MOB3D_STYLE_R1325__/.test(s)&&/hold\s*[:(]/.test(s),'공개 API 와 hold(자세 붙잡기)');
ok(/FPS=10\b/.test(s),'초당 10장');
ok(/BANDS=3\b/.test(s),'명암 3단');
ok(/INK_MUL=/.test(s),'먹 윤곽 배율');
ok(/function sample\(i,rows\)/.test(s)&&/r1325Tint/.test(s)&&/TINT_MIX=/.test(s),'2D 몸 그림 평균색으로 3D 색 맞춤(sample·r1325Tint)');
ok(/r13(16\|17\|22\|22c|\(16\|17\|22c\?\|22\))/.test(s)||/\^r13\(16\|17\|22c\|22\)-mob3d:/.test(s),'대상: R1316·R1317·R1322·R1322c 묶음만');
ok(!/r1312|r1315/.test(s.replace(/\/\/.*$/mg,'')),'공개 기본 켜짐 R1312·R1315 는 건드리지 않음');
ok(/storyworld\.r1325\.mobstyle/.test(s)&&/mobstyle25=/.test(s),'설정 키·주소(?mobstyle25=1/0)');
for(const f of ['mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js']){const t=rd('client-source/'+f);
 ok(t===rd('runtime-text/'+f),f+' 사본 같음');
 ok(/if\(!window\.__STORYWORLD_MOB3D_STYLE_R1325__\?\.hold\?\.\(i,t\)\)i\.mixer\.update\(0\);/.test(t),f+' 자세 적용 전에 R1325 hold 를 물음');
 ok(/measure2D\(i,b\.rows\);window\.__STORYWORLD_MOB3D_STYLE_R1325__\?\.sample\?\.\(i,b\.rows\);/.test(t),f+' 2D 몸 그림을 R1325 sample 에 넘김');}
const html=rd('runtime-text/index.html');ok(html.split('<script src="./'+F+'"></script>').length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1322c.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1322c 뒤');
const man=JSON.parse(rd('runtime-manifest.json')||'{"files":[]}');ok(man.files.some(v=>v.path===F),'runtime-manifest');
ok(String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'))).includes("'"+F+"'"),'공개 확인 목록');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1325/r1325-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1325 FAIL '+fail:'R1325 ALL OK');process.exit(fail?1:0);

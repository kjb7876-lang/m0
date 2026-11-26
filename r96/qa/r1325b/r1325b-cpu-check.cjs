// R1325b 몹별 고르기·효과 따로 켜기(사용자 11-26 "abc각각 좋은게 있고 별로인게 있는데", "서윤과 회장은 b가더 나아", "위세개는 a가낫고") — 정적 회귀.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return String(fs.readFileSync(path.join(R,p)));}catch(_){return '';}};
const s=rd('client-source/mob-3d-style-r1325.js'),m22=rd('client-source/mob-3d-r1322.js');
ok(s===rd('runtime-text/mob-3d-style-r1325.js')&&m22===rd('runtime-text/mob-3d-r1322.js'),'원본·runtime-text 사본 같음');
ok(/USE_2D=new Set\(\['clockwork','clockworkLeader','reversal','censor'\]\)/.test(s),'A(2D 그대로): 태엽 수집자(+우두머리)·역전 관리자·기억 검열기');
ok(/RAW=new Set\(\['seoyun','hotelChairman'\]\)/.test(s),'B(3D 손질 없음): 서윤·호텔 회장');
ok(/if\(k&&window\.__STORYWORLD_MOB3D_STYLE_R1325__\?\.use2D\?\.\(k\)\)k=null;\s*memo\.set\(id,k\|\|''\);/.test(m22),'R1322 몹 고르기가 use2D 를 물어 2D 로 남김');
ok(/use2D:k=>USE_2D\.has\(k\)/.test(s)&&/raw:k=>RAW\.has\(k\)/.test(s),'공개 API use2D·raw');
ok(/RAW\.has\(i\.kind\)\)\{if\(i\.g\?\.userData\)i\.g\.userData\.r1325Raw=true;return false;\}/.test(s),'RAW 몹은 자세 끊기 안 함·무리 표시');
ok(/!g\.userData\?\.r1325Raw\)g\.traverse/.test(s)&&/g\.userData\?\.r1325Raw\)g\.traverse\(o=>\{if\(o\.isMesh\)for\(const m of \[\]\.concat\(o\.material\)\)unpatch\(m\)/.test(s),'RAW 몹 재질은 손질하지 않고 이미 손질됐으면 되돌림');
ok(/const parts=\{fps:true,bands:true,ink:true,tint:true\}/.test(s),'효과 넷 따로(기본 넷 다 켜짐)');
ok(/mobstyle25p=/.test(s)&&/KEY\+'\.parts'/.test(s)&&/setPart,setParts/.test(s),'효과 설정 키·주소·API');
ok(/if\(kind==='ink'\?!parts\.ink:!\(parts\.bands\|\|parts\.tint\)\)return;/.test(s),'꺼진 효과는 재질에 안 넣음');
ok(/'\|r1325-'\+kind\+'-'\+P/.test(s),'셰이더 캐시 키에 켠 효과 포함');
ok(/mobStyleR1325Part_/.test(s),'설정 창 효과별 체크');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1325b/r1325b-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1325b FAIL '+fail:'R1325b ALL OK');process.exit(fail?1:0);

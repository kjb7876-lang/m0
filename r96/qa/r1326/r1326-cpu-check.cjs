// R1326 지역별 3D 통일(사용자 11-26 "일단 7대죄는 다 3d로해줘 불면귀쪽은 다 2d로 하고") — 정적 회귀.
//  7대죄 지역(ep1b02 나태·03 질투·04 탐식·05 색욕·06 탐욕·07 분노·08 교만)에서는 3D 몹 설정과 무관하게 3D(있는 것만),
//  불면귀 마을(last302·last303)에서는 늘 2D. 그 밖은 지금 설정 그대로.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return String(fs.readFileSync(path.join(R,p)));}catch(_){return '';}};
const F='mob-3d-zone-r1326.js',s=rd('client-source/'+F);
ok(!!s&&s===rd('runtime-text/'+F),'오버레이 원본·runtime-text 사본 같음');
ok(/__STORYWORLD_MOB3D_ZONE_R1326__/.test(s)&&/pick\s*[:(]/.test(s),'공개 API pick');
ok(/SIN3D=new Set\(\['ep1b02','ep1b03','ep1b04','ep1b05','ep1b06','ep1b07','ep1b08'\]\)/.test(s),'7대죄 지역 7곳(ep1b02~08)');
ok(/NO3D=new Set\(\['last302','last303'\]\)/.test(s),'불면귀 마을 2곳');
ok(/storyworld\.r1326\.zone3d/.test(s)&&/zone3d26=/.test(s),'설정 키·주소(?zone3d26=1/0)');
for(const f of ['mob-3d-r1315.js','mob-3d-r1316.js','mob-3d-r1317.js','mob-3d-r1322.js','mob-3d-r1322c.js']){const t=rd('client-source/'+f);
 ok(t===rd('runtime-text/'+f),f+' 사본 같음');
 ok(/const active=\(\)=>\(window\.__STORYWORLD_MOB3D_ZONE_R1326__\?\.pick\?\.\(on\)\?\?on\)&&/.test(t),f+' active 가 R1326 pick 을 물음');}
ok(!/R1326/.test(rd('client-source/mob-3d-r1312.js')),'첫 맵 R1312 는 건드리지 않음(7대죄·불면귀 밖)');
const html=rd('runtime-text/index.html');ok(html.split('<script src="./'+F+'"></script>').length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1322c.js"')<html.indexOf('"./'+F+'"'),'태그 자리: mob-3d-r1322c 뒤');
const man=JSON.parse(rd('runtime-manifest.json')||'{"files":[]}');ok(man.files.some(v=>v.path===F),'runtime-manifest');
ok(String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'))).includes("'"+F+"'"),'공개 확인 목록');
ok(String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'))).includes('node r96/qa/r1326/r1326-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1326 FAIL '+fail:'R1326 ALL OK');process.exit(fail?1:0);

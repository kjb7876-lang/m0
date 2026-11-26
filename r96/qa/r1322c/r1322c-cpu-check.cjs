// R1322c Dots CX-3D-LQ 보스·중간보스 10종 3D 시범(3시간 정기 점검 11-26 3차, R1322 와 별도 파일) — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1322c.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// Dots 원본 GLB 는 바이트 그대로(덮어쓰기·재압축 금지, 손질은 코드 재질에서만). 드라이브 READ-FIRST 의 SHA-256 과 같아야 한다.
const GLB={
 'assets/r1322c/boss-u203-controller-3d.glb':['b1d8a64cb77dd6e4b7efa8c72c317b81cbfc5e9570dbf0e709497d0f073e98f1','Float'],
 'assets/r1322c/boss-ep1b05-seoyun-3d.glb':['441dbdd550d805b90d3bc9d3bf25a32f3948bc9dc2544330be649687c8d92cfa','Walk'],
 'assets/r1322c/boss-ep1b08-hotel-chairman-3d.glb':['2272a451bf74bc6b5659ccf0177e08657374e1d2c4fa2f88a7176531bca750c5','Walk'],
 'assets/r1322c/boss-ep1b09-cyborg-chairman-3d.glb':['a28ddac4c7ea67bf08e6a14690b67e3914c9052a82a6e464d22666e73d617b69','Walk'],
 'assets/r1322c/boss-kair08-great-gatekeeper-05-3d.glb':['86970ee527b60be73df54565fc1406438f702ce13f871a44d0065673dda37c1f','Float'],
 'assets/r1322c/boss-kair03-siren-mor-3d.glb':['9722e13cbc100b79ee721ec66be21ff7cadb67ef6c34412df2ba6639c192fdc7','Walk'],
 'assets/r1322c/boss-ep1a08-deep-ward-surgeon-3d.glb':['aa65970b68200abef991a560243f5cf9153e629566e919d89e7966bad3713d6f','Walk'],
 'assets/r1322c/boss-ep1a09-syringe-apparition-3d.glb':['fc95285458b8065c81564d0f402f3ffe7146fddf5fe0579f28a4645850f50a01','Float'],
 'assets/r1322c/boss-cult05-id-cultivation-manager-3d.glb':['9764120aab8f098a6bc65d656ba3aca98c6cb59a042112ecd086de408a6bf6ba','Walk'],
 'assets/r1322c/boss-cult06-mechanical-judicial-core-3d.glb':['111631a6f893c8636b2f37013e618fca8d972318ebbb5cc1ba7a30942ef3c6b3','Walk']};
let total=0;
for(const [p,[h,walk]] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');
 if(!b)continue;total+=b.length;ok(b.length<=2500000,p+' 2.5MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle',walk,'Hit','Death'].every(n=>names.includes(n))&&names.some(n=>/^Attack/.test(n)),p+' 클립 Idle·'+walk+'·Attack*·Hit·Death');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(Object.keys(GLB).length===10,'10종');
ok(total<=12000000,'GLB 합계 12MB 이하('+total+')');
ok(!/sw-glb-knight|electrode/i.test(s),'전극기계수호기사(R1315 몫)는 건드리지 않음');
ok(!/root-bound-ghoul|root-stalker-r74|dist00-boss|glutton/.test(s),'R1312(첫 맵)·R1315(탐식 보스) 몹은 건드리지 않음');
ok(!/wrath-hound|snow-lurker|assets\/r1316\/|assets\/r1317\/|assets\/r1322\//.test(s),'R1316·R1317·R1322 몹은 건드리지 않음');
ok(!/root-gatekeeper|gluttony/.test(s),'뿌리의 문지기(R1312·R1321)·탐식 보스(R1315)는 건드리지 않음');
ok(!/적그리스도 배양좌|antichrist/i.test((s.match(/const TABLE=\{[\s\S]*?\};/)||[''])[0]),'적그리스도 배양좌(요청 밖, 사이보그 회장 그림 재사용)는 적용 안 함');
ok(/'대수문장 05'/.test(s)&&/EXACT/.test(s),'대수문장은 05 만(번호를 떼지 않고 정확히)');
ok(/const NO3D=new Set\(\['last302','last303'\]\)/.test(s)&&/!NO3D\.has\(String\(room\.id\)\)/.test(s),'불면귀 마을(last302·last303)은 새 3D 제외');
ok(/pick\(\/\^Float\$\/\)/.test(s),'떠다니는 보스는 Float 클립');
ok(/\nlet on=false;/.test(s),'사람이 할 때도 기본 꺼짐(시험 기능, 사용자 확인 전)');
ok(/BOSS_KINDS/.test(s)&&/if\(e\.boss&&!BOSS_KINDS\.has\(k\)\)k=null/.test(s),'진짜 보스는 보스 표시한 항목 이름만 3D, 다른 보스는 2D');
ok(/KINDS\[b\[1\]\.kid\]\.boss/.test(s),'상한 안에서 보스 먼저');
ok(/storyworld\.r1322c\.boss3d/.test(s)&&/boss3d22c=/.test(s),'설정 키·주소 강제(?boss3d22c=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만(사몽 흑백 꿈 층은 2D 그대로)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s)&&!/new THREE\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/clone\(/.test(s),'몹마다 뼈째 복제');
ok(/r1322c-ink-shell/.test(s),'먹 테두리(한지 바닥에서 읽힘)');
ok(/MAX_LIVE=(\d+)/.test(s)&&+s.match(/MAX_LIVE=(\d+)/)[1]<=6,'동시 3D 보스 수 상한 6 이하');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 실제 보이는 키(알파 상자)에 맞춤');
ok(/c\.order|\.order\b/.test(s),'renderOrder 는 바뀐 2D 몸 명령 순서를 따름(R1315 함정)');
ok(/__r1322c/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식을 옮겨 서로 덧감싸지 않음(R1312 함정)');
ok(/__STORYWORLD_BOSS3D_R1322C__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1322.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1322 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 10개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1322c/'"),'공개 확인 목록');
const ex=JSON.parse(String(rd('pages-exclude.json')||'{"exclude":[]}'));ok(!ex.exclude.some(e=>F.startsWith(e.prefix)||'assets/r1322c/x.glb'.startsWith(e.prefix)),'Pages 배포에서 빠지지 않음');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1322c/r1322c-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1322c FAIL '+fail:'R1322c ALL OK');process.exit(fail?1:0);

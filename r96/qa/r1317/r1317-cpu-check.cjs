// R1317 Dots 새 3D 일반 몹 9종 시범 적용(3시간 정기 점검 21:16Z, R1316 방식) — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1317.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// Dots 원본 GLB 는 바이트 그대로(덮어쓰기·재압축 금지, 손질은 코드 재질에서만). 드라이브 READ-FIRST 의 SHA-256 과 같아야 한다.
const GLB={
 'assets/r1317/sw-glb-rose.glb':['776bf573d6e6071b4b505943c1c525fca4a959d1a5df4ca880ca3dc0b358dfee','Attack'],
 'assets/r1317/sw-glb-orb.glb':['eb7fb2b7c9e413dfc567b4869a3dbc4df01b976eef2892c3d3ee9e51d833d2f1','Attack'],
 'assets/r1317/mob-delicacy-crawler-3d.glb':['0f664b0f0b02ab18a2fdbe325dfc49dd01d593b884967e862b00744afeb605be','Attack_Pincher'],
 'assets/r1317/mob-twinned-messenger-3d.glb':['10c3f57be3a613722e764ad3bf05dc87f37b0ffbf84da1bca37e439ed1e78e83','Attack_Hook'],
 'assets/r1317/sw-glb-crystal.glb':['a50f371683423d49799fa48a2dfc47e7cae6e1359fd34c3cca06f7ac5b354db6','Attack'],
 'assets/r1317/sw-glb-guard.glb':['609831b8849a47924351a16a67edb47985f91b10dbc2a97517877f44fbdaa7fe','Attack'],
 'assets/r1317/mob-apothecary-3d.glb':['cc0972ca2610676eb9a0691d7f1e5ae88003efddaef165e6a57c2cc7b9066c69','Attack_Bowl'],
 'assets/r1317/sw-glb-signal.glb':['35c6c2f1d94780d1d0e69a8dccab325eafa370397959e3ea3f13bdf8eb226ce3','Attack'],
 'assets/r1317/sw-glb-warhound.glb':['3acb04730552d76a3c1a53a5a44c10c1334b73fc29431ff9d8ae854c88b5cde9','Attack_Bite']};
let total=0;
for(const [p,[h,atk]] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');
 if(!b)continue;total+=b.length;ok(b.length<=1100000,p+' 1.1MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle','Walk',atk,'Hit','Death'].every(n=>names.includes(n)),p+' 클립 Idle·Walk·'+atk+'·Hit·Death');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(Object.keys(GLB).length===9,'9종');
ok(total<=20000000,'GLB 합계 20MB 이하('+total+')');
ok(!/sw-glb-knight|electrode/i.test(s),'전극기계수호기사(R1315 몫)는 건드리지 않음');
ok(!/root-bound-ghoul|root-stalker-r74|dist00-boss|glutton/.test(s),'R1312(첫 맵)·R1315(탐식 보스) 몹은 건드리지 않음');
ok(!/wrath-hound|snow-lurker|assets\/r1316\//.test(s),'R1316 몹은 건드리지 않음');
ok(/\nlet on=false;/.test(s),'사람이 할 때도 기본 꺼짐(시험 기능, R1317 결정 대기)');
ok(/e\.boss/.test(s),'진짜 보스는 제외(보스 3D 는 따로)');
ok(/storyworld\.r1317\.mob3d/.test(s)&&/mob3d17=/.test(s),'설정 키·주소 강제(?mob3d17=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만(사몽 흑백 꿈 층은 2D 그대로)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s)&&!/new THREE\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/clone\(/.test(s),'몹마다 뼈째 복제');
ok(/r1317-ink-shell/.test(s),'먹 테두리(한지 바닥에서 읽힘)');
ok(/MAX_LIVE=(\d+)/.test(s)&&+s.match(/MAX_LIVE=(\d+)/)[1]<=16,'동시 3D 몹 수 상한 16 이하');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 실제 보이는 키(알파 상자)에 맞춤');
ok(/c\.order|\.order\b/.test(s),'renderOrder 는 바뀐 2D 몸 명령 순서를 따름(R1315 함정)');
ok(/__r1317/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식을 옮겨 서로 덧감싸지 않음(R1312 함정)');
ok(/__STORYWORLD_MOB3D_R1317__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1316.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1316 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 9개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1317/'"),'공개 확인 목록');
const ex=JSON.parse(String(rd('pages-exclude.json')||'{"exclude":[]}'));ok(!ex.exclude.some(e=>F.startsWith(e.prefix)||'assets/r1317/x.glb'.startsWith(e.prefix)),'Pages 배포에서 빠지지 않음');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1317/r1317-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1317 FAIL '+fail:'R1317 ALL OK');process.exit(fail?1:0);

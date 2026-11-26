// R1316 Dots 새 3D 일반 몹 21종 시범 적용(사용자 2026-11-25 "구글드라이브 3시간마다 확인해서 신규 3d몹자산 닷츠가 생성한거 검토및 개선해서 시범적용") — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1316.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// Dots 원본 GLB 는 바이트 그대로(덮어쓰기·재압축 금지, 손질은 코드 재질에서만). 드라이브 READ-FIRST 의 SHA-256 과 같아야 한다.
const GLB={
 'assets/r1316/mob-mold-refuse-bag-3d.glb':['bfc2a7e10d6cf91d1414129eaac50dd064b6eb1f8570ae4847bfe5db4fc3e9e0','Attack_Slam'],
 'assets/r1316/mob-void-afterimage-3d.glb':['84c3c2b6de5dc9ba7963970b8d2d72cd8988c23950afa7d8ebd44aa400f942ec','Attack_Rift'],
 'assets/r1316/md37-nameless-scar.glb':['63af237b03afdb4a29cac3307e1ae787b9320fad8ffd69c890820a25c4e30f8c','Attack'],
 'assets/r1316/mob-cult-slime-3d.glb':['387501ea6c6a36c3f4ddcce69cfdab11f78852a65d6d89d513891153519010d5','Attack_Bite'],
 'assets/r1316/md73-lantern-spider.glb':['96bada47efb98520a7ff0e29fa5f79f74db61e48db8b44bd787c14c3fba93b05','Attack_Rake'],
 'assets/r1316/mob-memory-carrier-3d.glb':['6407094e0c8687c18b3f322241c760dd1fc105adc4f9faf60f3f8ce6a583262a','Attack_Lunge'],
 'assets/r1316/mob-wrath-hound-r1.glb':['e7a41a65e3a09005ac51011a4d66d676bc2b80c6b33b551e0dab959a3ff75b41','Attack_Bite'],
 'assets/r1316/md26-small-walking-robot.glb':['33bcb36e195d03ae446271e8a1bd6177a2bd187179cb48c9941d4ecec138b7ee','Attack'],
 'assets/r1316/md30-ash-mason.glb':['a84ab9fce9e244aba24714d92b01e35160f86fa993b9674fee8c6182945fcead','Attack'],
 'assets/r1316/mob-red-heel-blade-MD16.glb':['40d24964f119e95b4c6bb735d16b1c15528db5c5fa3470fb68a60b34323b3967','Attack_Ember'],
 'assets/r1316/mob-cable-devourer-3d.glb':['85dc310ff48a186dd0bfb8a589d3ebc7701d84228a2f91754077d7513c4130d0','Attack_Cable'],
 'assets/r1316/mob-jealousy-wraith-3d.glb':['970f09ef3e6ceee83d71458a353a282f8a9f83ed113773a35bb5045e0cadd0a0','Attack_Grasp'],
 'assets/r1316/mob-glass-wraith-3d.glb':['259ffc2301928cef98d666909fb2e7973326af7ae288acd87ff3b97304e83cc9','Attack_GlassPalm'],
 'assets/r1316/sw-glb-goat.glb':['c9f0d8032195ef8dcef2f4ac21f2aef64d11c77f3740617e9a45c2f911e89f91','Attack'],
 'assets/r1316/sw-glb-mannequin.glb':['51e6db922040d5a30f349331e1d3ffb7c948c24c9879f4aa0e3211db596fb04c','Attack'],
 'assets/r1316/mob-refusal-mask-3d.glb':['3ef99d650d10ef704b92acc24fbce9d8bb1e541e2c36289666534e0bd455ada9','Attack_Rush'],
 'assets/r1316/sw-glb-moth.glb':['b58ab5a237a9ac3a3a83df4be2b362bc1ca720a6f1919ba596862e3add132400','Attack'],
 'assets/r1316/sw-glb-nurse.glb':['555a443f14c89afb1b825d160fd38b79756128f9450e0cc4da64afc3ca6d6ee3','Attack'],
 'assets/r1316/sw-glb-trash.glb':['8b3e42dccaa67873bdd621b6ff0a8d68cbb59806de77983689ca0266dcce0a9a','Attack'],
 'assets/r1316/sw-glb-vial.glb':['a7505c9be3729e6bd6b01d747b846ed0c6409022d12b4f1fd6d95615eb0a68bc','Attack'],
 'assets/r1316/mob-snow-lurker-MD28.glb':['4fbd40840d098b28e0354ecd437fd3d0d7f2a38c691a6b72e80a18a5797c277a','Attack_Slam']};
let total=0;
for(const [p,[h,atk]] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');
 if(!b)continue;total+=b.length;ok(b.length<=1100000,p+' 1.1MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle','Walk',atk,'Hit','Death'].every(n=>names.includes(n)),p+' 클립 Idle·Walk·'+atk+'·Hit·Death');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(Object.keys(GLB).length===21,'21종(전극기계수호기사는 R1315 GLB 유지라 제외)');
ok(total<=20000000,'GLB 합계 20MB 이하('+total+')');
ok(!/sw-glb-knight|electrode/i.test(s),'전극기계수호기사(R1315 몫)는 건드리지 않음');
ok(!/root-bound-ghoul|root-stalker-r74|dist00-boss|glutton/.test(s),'R1312(첫 맵)·R1315(탐식 보스) 몹은 건드리지 않음');
ok(/e\.boss/.test(s),'진짜 보스는 제외(보스 3D 는 따로)');
ok(/storyworld\.r1316\.mob3d/.test(s)&&/mob3d16=/.test(s),'설정 키·주소 강제(?mob3d16=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만(사몽 흑백 꿈 층은 2D 그대로)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s)&&!/new THREE\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/clone\(/.test(s),'몹마다 뼈째 복제');
ok(/r1316-ink-shell/.test(s),'먹 테두리(한지 바닥에서 읽힘)');
ok(/MAX_LIVE=(\d+)/.test(s)&&+s.match(/MAX_LIVE=(\d+)/)[1]<=16,'동시 3D 몹 수 상한 16 이하');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 실제 보이는 키(알파 상자)에 맞춤');
ok(/c\.order|\.order\b/.test(s),'renderOrder 는 바뀐 2D 몸 명령 순서를 따름(R1315 함정)');
ok(/__r1316/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식을 옮겨 서로 덧감싸지 않음(R1312 함정)');
ok(/__STORYWORLD_MOB3D_R1316__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./slayer-blade-3d-r1309.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: slayer-blade-3d-r1309 와 combat-guide-r1249 사이');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 21개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1316/'"),'공개 확인 목록');
const ex=JSON.parse(String(rd('pages-exclude.json')||'{"exclude":[]}'));ok(!ex.exclude.some(e=>F.startsWith(e.prefix)||'assets/r1316/x.glb'.startsWith(e.prefix)),'Pages 배포에서 빠지지 않음');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1316/r1316-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1316 FAIL '+fail:'R1316 ALL OK');process.exit(fail?1:0);

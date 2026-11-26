// R1322 Dots CX-3D-LQ 3D 몹·중간보스 29종 시범 적용(3시간 정기 점검 11-26 03:16Z, R1322 방식) — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1322.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// Dots 원본 GLB 는 바이트 그대로(덮어쓰기·재압축 금지, 손질은 코드 재질에서만). 드라이브 READ-FIRST 의 SHA-256 과 같아야 한다.
const GLB={
 'assets/r1322/boss-u203-gate-frame-3d.glb':['f94e0dfc90c3c7ddcea650f82afa0a214c97fe2df4d2eaf6fe2860892d155148','Walk'],
 'assets/r1322/boss-u204-memory-censor-3d.glb':['342e9904aedf48eab8735c809bc6076db47b61c047e7e0d8bb3a84ac4ad8e377','Walk'],
 'assets/r1322/boss-u205-reversal-manager-3d.glb':['56ff8798b0b6825ee60bf46e7100b3cc17015f04568091bd866ca0474b4799c2','Walk'],
 'assets/r1322/boss-u206-core-3d.glb':['d128a87720376049aff5dc6719e7ffa136c9a4d51581eb10018cd8ef4854e94b','Float'],
 'assets/r1322/mob-armageddon-computation-crystal-3d.glb':['71adfe3852efde0b8d44a8e68d08e7ffb41f1d73438d4a10b93f070bc43a5320','Float'],
 'assets/r1322/mob-clockwork-collector-3d.glb':['206caede43c6bdb2183bec024eaa2ef40a901134cac1f02d746e6aa7d6fafe65','Walk'],
 'assets/r1322/mob-clockwork-collector-leader-3d.glb':['635f100e55f9eb3c47ca34f87df6abdfc657f4ed7c22440a6f20e1af3e323f1e','Walk'],
 'assets/r1322/mob-dog-wolf-time-3d.glb':['00ff5060145abf8fd9d12051777db4bfcc5da946e7fe7ba3d898d15ddf46d4c3','Walk'],
 'assets/r1322/mob-memory-migration-connector-3d.glb':['3d0dd9284f50b2ec3dbccac64d04373b9be6600604a32ef11fd24f237a70b20a','Walk'],
 'assets/r1322/mob-red-proofread-mark-3d.glb':['8f7f64954299948dd835438a04f273e762154afa56e8f7160a81d2585fceaf42','Walk'],
 'assets/r1322/mob-remnant-adoption-memory-3d.glb':['4bfd80fba29a495c249e581dbe4455911e81c152d7b2eb59566e73084f5335c9','Float'],
 'assets/r1322/mob-remnant-erased-cctv-3d.glb':['351cbb71906ab61d240f78c76152e2a5e6a0d405eb9d2b56d8b5c1f380c9befb','Float'],
 'assets/r1322/mob-remnant-hotel-ash-3d.glb':['56c686a52ce998f93761dff04cf09a3ba9fc910abb21eff8455deaffec694ea6','Float'],
 'assets/r1322/mob-remnant-late-footsteps-3d.glb':['768074b1d8a12daf314cb6af2fff10a9275235691f872eb5067dc91327a918f2','Walk'],
 'assets/r1322/mob-remnant-repeated-fall-3d.glb':['9a8b7a62e09a1e070019141e7d8322e64137dcd8ab19fa1c38e929ca21aef54d','Float'],
 'assets/r1322/mob-remnant-rooftop-return-3d.glb':['4b3b264886d6c4d31c6c9c7c1304fe9463fd1e9b0a745f9f38094ef0f4404b39','Walk'],
 'assets/r1322/mob-remnant-root-overflow-3d.glb':['35efdc2e953037aebd5a6384be102b0fe4142cfb353afd20d428910168632dbc','Float'],
 'assets/r1322/mob-remnant-torn-photo-3d.glb':['a9a3d84efcb622b0c4ba50dca85ff649386160eecd6d7228c929c91594b6750c','Float'],
 'assets/r1322/mob-rusted-turnstile-3d.glb':['7d2119d47ac8efd248dc76a4a0f1aa7c83287a6c5f534309bdf924d1b1e46649','Walk'],
 'assets/r1322/mob-samong-blade-glass-3d.glb':['69e005d096a839cbe177ef2c259fecf2bb38d61a6b1bf3c5eaee579bff457c40','Float'],
 'assets/r1322/mob-samong-deferred-time-3d.glb':['658bc71c27b526516b983fd24cd58a2036a1ca006d7053ab94b3b1a63b7be309','Walk'],
 'assets/r1322/mob-samong-harbor-dark-mist-3d.glb':['474520f7a69187107e9d7d7273b56d0d0dee1c408a3fe82b185d312f896f04c0','Float'],
 'assets/r1322/mob-samong-resonant-knight-3d.glb':['457a7d60292e25ec69393dc4d16f1d2dc4b2c4f7bd5f5ea35cbf5bceefcab245','Walk'],
 'assets/r1322/mob-samong-violet-revenant-3d.glb':['370adbefa47794f0189bf281d9d42ea701d40b27aaba33f5c633c22f0723961f','Walk'],
 'assets/r1322/mob-slime-id-culture-3d.glb':['9f2187c6b1ff84e7f925b634805be8ba70b55af4642b77a7e1f5b66cb755d5c8','Walk'],
 'assets/r1322/mob-slime-neutral-meadow-3d.glb':['1abb5ea5533f90d5a42c9bb4264e05a45c07be5189a5a99b88c7e8a2570adaab','Walk'],
 'assets/r1322/mob-slime-overheated-synapse-3d.glb':['10738f39810e859270b7c7e88f72a541df0d3325b3ce9177a87a91d87af940b0','Walk'],
 'assets/r1322/mob-super-ego-incision-crystal-3d.glb':['88a3e2e1a8893f5f17a02de359dea455161b7f5d2434794a5a4cdfaa8b79a0b8','Float'],
 'assets/r1322/mob-unsubmitted-sentence-3d.glb':['fe73ae5ba29bc1424c859a49d5dded7b95a7fc58ccd65dcf0622b850109dfed6','Float']};
let total=0;
for(const [p,[h,walk]] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');
 if(!b)continue;total+=b.length;ok(b.length<=2500000,p+' 2.5MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle',walk,'Hit','Death'].every(n=>names.includes(n))&&names.some(n=>/^Attack/.test(n)),p+' 클립 Idle·'+walk+'·Attack*·Hit·Death');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(Object.keys(GLB).length===29,'29종');
ok(total<=25000000,'GLB 합계 25MB 이하('+total+')');
ok(!/sw-glb-knight|electrode/i.test(s),'전극기계수호기사(R1315 몫)는 건드리지 않음');
ok(!/root-bound-ghoul|root-stalker-r74|dist00-boss|glutton/.test(s),'R1312(첫 맵)·R1315(탐식 보스) 몹은 건드리지 않음');
ok(!/wrath-hound|snow-lurker|assets\/r1316\/|assets\/r1317\//.test(s),'R1316·R1317 몹은 건드리지 않음');
ok(!/ID 잔류 점액체|ID 배양 점액체 우두머리/.test((s.match(/const TABLE=\{[\s\S]*?\};/)||[''])[0]),'HOLD 2종(10-03·10-04)은 적용 안 함');
ok(/const NO3D=new Set\(\['last302','last303'\]\)/.test(s)&&/!NO3D\.has\(String\(room\.id\)\)/.test(s),'불면귀 마을(last302·last303)은 새 3D 제외');
ok(/pick\(\/\^Float\$\/\)/.test(s),'떠다니는 몹은 Float 클립');
ok(!/후속 증원\|우두머리/.test(s)&&/HOLD_2D=new Set\(\['ID 배양 점액체 우두머리'/.test(s)&&/!HOLD_2D\.has\(n\)/.test(s),'우두머리: 자기 모델 > HOLD 는 2D > 기본 몹 모델');
ok(/\nlet on=false;/.test(s),'사람이 할 때도 기본 꺼짐(시험 기능, R1322 과 같은 결정)');
ok(/e\.boss/.test(s),'진짜 보스는 제외(보스 3D 는 따로)');
ok(/storyworld\.r1322\.mob3d/.test(s)&&/mob3d22=/.test(s),'설정 키·주소 강제(?mob3d22=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/room\.layer==='STORY'/.test(s),'이야기 층만(사몽 흑백 꿈 층은 2D 그대로)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s)&&!/new THREE\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/clone\(/.test(s),'몹마다 뼈째 복제');
ok(/r1322-ink-shell/.test(s),'먹 테두리(한지 바닥에서 읽힘)');
ok(/MAX_LIVE=(\d+)/.test(s)&&+s.match(/MAX_LIVE=(\d+)/)[1]<=16,'동시 3D 몹 수 상한 16 이하');
ok(/getImageData/.test(s),'크기는 2D 몸 그림의 실제 보이는 키(알파 상자)에 맞춤');
ok(/c\.order|\.order\b/.test(s),'renderOrder 는 바뀐 2D 몸 명령 순서를 따름(R1315 함정)');
ok(/__r1322/.test(s)&&/Object\.assign\(w,/.test(s),'감싸기 표식을 옮겨 서로 덧감싸지 않음(R1312 함정)');
ok(/__STORYWORLD_MOB3D_R1322__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');
ok(html.indexOf('"./mob-3d-r1317.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1317 뒤, combat-guide-r1249 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 29개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1322/'"),'공개 확인 목록');
const ex=JSON.parse(String(rd('pages-exclude.json')||'{"exclude":[]}'));ok(!ex.exclude.some(e=>F.startsWith(e.prefix)||'assets/r1322/x.glb'.startsWith(e.prefix)),'Pages 배포에서 빠지지 않음');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1322/r1322-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1322 FAIL '+fail:'R1322 ALL OK');process.exit(fail?1:0);

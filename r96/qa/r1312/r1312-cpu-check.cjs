// R1312 첫 맵(악마화 나무의 정원) 몹 3D 임시 적용 — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1312.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// Dots 원본 GLB 는 바이트 그대로(덮어쓰기·재압축 금지, 손질은 코드 재질에서만)
const GLB={'assets/r1312/mob-root-bound-guard-3d.glb':'0bb4e8e9ec9cb2cf486917d200ef4cb58c2ad0a4ad7c6bc81c0229cac21788b5',
 'assets/r1312/mob-root-stalker-3d.glb':'78aed7147207111cd41e10fd8e4fb13647be422bb7a5d201fd585ea6f62620da',
 'assets/r1312/boss-dist00-root-gatekeeper-3d.glb':'8aabea9193212dc40f26d8f61bf2bade9ac5850d89816c7761fe3370e19b8521'};
const CLIPS={'assets/r1312/mob-root-bound-guard-3d.glb':['Idle','Walk','Attack_Claw','Hit','Death'],
 'assets/r1312/mob-root-stalker-3d.glb':['Idle','Walk','Attack_Slash','Hit','Death'],
 'assets/r1312/boss-dist00-root-gatekeeper-3d.glb':['Idle','Walk','Attack_RootSweep','Attack_Cast','Hit','Death']};
for(const [p,h] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = Dots 원본 바이트');
 if(!b)continue;ok(b.length<=1100000,p+' 1.1MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(CLIPS[p].every(n=>names.includes(n)),p+' 클립 '+CLIPS[p].join('·'));
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');}
// R1337(사용자 2026-11-26 "맨처음 뿌리보스 2d로돌리고"): 문지기 3D 는 쓰지 않는다(파일은 보존) — 사용자 지시 동작 변경으로 이 줄만 바꿈.
for(const [p] of Object.entries(GLB)){const boss=/boss-dist00/.test(p);ok(boss?!s.includes("'"+p+"'"):s.includes("'"+p+"'"),boss?'R1337: 문지기는 2D(오버레이가 '+p+' 를 안 씀)':'오버레이가 '+p+' 를 씀');}
ok(/ZONE='dist00'/.test(s),'첫 몹 맵(dist00)에만');
ok(/storyworld\.r1312\.mob3d/.test(s)&&/[?&]mob3d=/.test(s.replace(/\\/g,'')),'설정 키·주소 강제(?mob3d=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/root-bound-ghoul/.test(s)&&/\\\/root-stalker-r74/.test(s)&&/dist00-boss/.test(s),'2D 몸 그림 경로로 종류 판별(늪 뿌리 추적자 제외)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s)&&!/new THREE\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/clone\(/.test(s),'몹마다 뼈째 복제');
ok(/r1312-ink-shell/.test(s),'먹 테두리(한지 바닥에서 읽힘)');
ok(/MAX_LIVE=\d+/.test(s),'동시 3D 몹 수 상한');
ok(/__STORYWORLD_MOB3D_R1312__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');ok(html.indexOf('"./slayer-blade-3d-r1309.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: slayer-blade-3d-r1309 바로 뒤');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 3개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&Object.keys(GLB).every(p=>ver.includes("'"+p+"'")),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1312/r1312-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1312 FAIL '+fail:'R1312 ALL OK');process.exit(fail?1:0);

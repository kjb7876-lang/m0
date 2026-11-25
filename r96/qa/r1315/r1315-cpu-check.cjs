// R1315 새 3D 보스·몹 시범 적용(탐식 보스 악마 3D · 전극기계수호기사 3D) — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='mob-3d-r1315.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
// storyworld-3d-assets PR #1(3abe8da) processed GLB 바이트 그대로
const GLB={'assets/r1315/boss-gluttony-demon-3d.glb':'94de958c3deeceb6aac9917b768db530dd2cd756a08494d34709dac3fca882ec',
 'assets/r1315/mob-electrode-knight-3d.glb':'04a9fbcfcde93ddfb1481d273bac633f3d5a581fb1ce6724be5e7841f268faa6'};
const CLIPS={'assets/r1315/boss-gluttony-demon-3d.glb':['Idle','Walk','Attack','Special_DevourMaw','Hit','Death'],'assets/r1315/mob-electrode-knight-3d.glb':['Idle','Walk','Attack','Hit','Death']};
for(const [p,h] of Object.entries(GLB)){const b=rd('runtime-text/'+p);
 ok(b&&crypto.createHash('sha256').update(b).digest('hex')===h,p+' = 자산 저장소 원본 바이트');if(!b)continue;
 ok(b.length<=1400000,p+' 1.4MB 이하('+b.length+')');
 const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(CLIPS[p].every(n=>names.includes(n)),p+' 클립 '+CLIPS[p].join('·'));
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),p+' 필수 확장은 로더가 아는 것만');
 ok((j.skins||[]).length>=1,p+' 스킨 있음');
 ok(s.includes("'"+p+"'"),'오버레이가 '+p+' 를 씀');}
ok(/zone:'ep1b04'/.test(s)&&/zone:'ep1b08'/.test(s),'탐식 보스(ep1b04)·전극기계수호기사(ep1b08) 지역만');
ok(/Special_DevourMaw/.test(s),'보스 고유기 클립 사용');
ok(/전극기계수호기사/.test(s)&&/electrode-machine-knight/.test(s),'기사 판별: 이름·2D 그림 경로');
ok(/storyworld\.r1315\.mob3d/.test(s)&&/mob3d15=/.test(s),'설정 키·주소 강제(?mob3d15=1/0)');
ok(/navigator\.webdriver/.test(s),'자동 검사 기본값은 꺼짐(기존 2D 기준선 보존)');
ok(/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s),'게임 렌더러 장면(층 2) 공유, 별도 렌더러 없음');
ok(/SkeletonUtils/.test(s)&&/r1315-ink-shell/.test(s)&&/MAX_LIVE=\d+/.test(s),'뼈째 복제·먹 테두리·동시 상한');
ok(/Object\.assign\(w,base\)/.test(s)&&/WeakSet/.test(s),'render 감싸기 표식 옮김(감싸기 쌓임 방지)');
ok(/__STORYWORLD_MOB3D_R1315__/.test(s),'공개 API');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');ok(html.indexOf('"./mob-3d-r1312.js"')>=0&&html.indexOf('"./mob-3d-r1312.js"')<html.indexOf('"./'+F+'"')&&html.indexOf('"./'+F+'"')<html.indexOf('"./combat-guide-r1249.js"'),'태그 자리: mob-3d-r1312 바로 뒤');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&Object.keys(GLB).every(p=>paths.has(p)),'runtime-manifest 에 스크립트·GLB 2개');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&Object.keys(GLB).every(p=>ver.includes("'"+p+"'")),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1315/r1315-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1315 FAIL '+fail:'R1315 ALL OK');process.exit(fail?1:0);

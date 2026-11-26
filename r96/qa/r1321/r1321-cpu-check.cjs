// R1321 — 뿌리의 문지기 R3(Dots BOSS3D-00 R3) 시범: R1312 의 R2 보스 모델을 설정으로 R3 로 바꿔 끼움(기본 꺼짐) — 정적 검사.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='boss00-r3-r1321.js',GLB='assets/r1321/boss-dist00-root-gatekeeper-3d-r3.glb';
const s=String(rd('client-source/'+F)||''),rt=String(rd('runtime-text/'+F)||'');ok(s.length>0&&s===rt,F+' 원본·runtime-text 사본 같음');
const b=rd('runtime-text/'+GLB);ok(b&&crypto.createHash('sha256').update(b).digest('hex')==='bda1314634d3418f71d1c55be39c2dc25fe3e9825e73c447db4f0254c946aab1','R3 GLB = Dots 원본 바이트');
if(b){const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const names=(j.animations||[]).map(a=>a.name);
 ok(['Idle','Walk','Attack_RootSweep','Hit','Death'].every(n=>names.includes(n)),'R3 에 R1312 가 쓰는 클립(Idle·Walk·Attack_RootSweep·Hit·Death)');
 ok((j.extensionsRequired||[]).every(x=>['EXT_meshopt_compression','KHR_mesh_quantization','EXT_texture_webp','KHR_texture_transform'].includes(x)),'필수 확장은 로더가 아는 것만');}
ok(s.includes("'"+GLB+"'"),'오버레이가 R3 GLB 를 가리킴');
ok(/storyworld\.r1321\.boss00r3/.test(s)&&/boss00r3/.test(s)&&/let on=false/.test(s),'설정 키·주소(?boss00r3=1)·기본 꺼짐');
ok(/__STORYWORLD_BOSS00_R1321__/.test(s),'공개 API');
const m=String(rd('client-source/mob-3d-r1312.js')||''),mr=String(rd('runtime-text/mob-3d-r1312.js')||'');ok(m===mr,'R1312 원본·사본 같음');
ok(/function glbOf\(id\)/.test(m)&&/__STORYWORLD_BOSS00_R1321__/.test(m)&&/const url=glbOf\(id\)/.test(m)&&/fetch\(url,/.test(m),'R1312 는 보스 GLB 를 불러올 때 R1321 설정을 물음');
ok(/bossGlb:/.test(m),'R1312 inspect 가 지금 보스 GLB 를 알려 줌');
ok(/tone\(src,id==='boss'&&\(url===KINDS\.boss\.glb\|\|/.test(m),'R3 는 빛나지 않는 재질에 자체조명(검은 덩어리 방지), R2 는 그대로');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');ok(html.indexOf(tag)>=0&&html.indexOf(tag)<html.indexOf('"./mob-3d-r1312.js"'),'태그 자리: R1312 앞');
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));ok(paths.has(F)&&paths.has(GLB),'runtime-manifest 에 스크립트·GLB');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'"+GLB+"'"),'공개 확인 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(wf.includes('node r96/qa/r1321/r1321-cpu-check.cjs'),'CI 에 이 검사');
console.log(fail?'R1321 FAIL '+fail:'R1321 ALL OK');process.exit(fail?1:0);

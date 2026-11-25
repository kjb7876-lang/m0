// R1309 3D 슬레이어 대검(Armory R2) + 두 손 쥐기 — 정적 회귀.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const F='slayer-blade-3d-r1309.js',src=rd('client-source/'+F),rt=rd('runtime-text/'+F),s=String(src||'');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
ok(/size:1\.18,roll:-18\*Math\.PI\/180,slide:\.14,off:\[-\.03,\.03,0\]/.test(s),'사용자 체험판 값(118%·-18°·+14·손 안쪽 보정)');
ok(/GROUP='r1305-slayer-3d-shared'/.test(s)&&/MODEL='r1305-slayer-3d-model'/.test(s),'R1305 슬레이어 3D 묶음만 찾음');
ok(/scene\.onBeforeRender=function/.test(s)&&/prev\?\.apply\(this,a\)/.test(s),'장면 렌더 직전 훅(기존 훅 이어 부름)');
ok(/Arm_L/.test(s)&&/Forearm_L/.test(s)&&/Weapon_Socket_L/.test(s)&&/IK_FULL=\.16,IK_NONE=\.42/.test(s),'왼팔 두 뼈 IK, 거리로 섞기');
ok(!/new T\.WebGLRenderer/.test(s)&&!/hwando3d|localStorage/.test(s),'별도 렌더러·별도 설정 없음(3D 설정을 따름)');
ok(/LAYER=2/.test(s)&&/r1304-hanji-tone-v1/.test(s),'몸과 같은 레이어·한지 톤');
const h3=String(rd('client-source/hwando-3d-r1302.js')||'');ok(/slayer:\['slayer_Weapon'/.test(h3),'원래 슬레이어 무기는 R1305 가 계속 숨김');
const html=String(rd('runtime-text/index.html')||'');const tag='<script src="./'+F+'"></script>';
ok(html.split(tag).length===2,'index.html 태그 1개');ok(html.indexOf('"./hwando-3d-r1302.js"')<html.indexOf('"./'+F+'"'),'태그 자리: hwando-3d-r1302 뒤');
const glb=rd('runtime-text/assets/r1309/slayer-greatsword.glb');
ok(glb&&crypto.createHash('sha256').update(glb).digest('hex')==='ad2d71450f6b2ab679d49bafdf7957828c645a854e6f32d23b5611131a6407cd','대검 GLB = Armory R2 원본 바이트');
if(glb){const jl=glb.readUInt32LE(12),j=JSON.parse(glb.slice(20,20+jl).toString());ok(!(j.extensionsRequired||[]).length,'필수 확장 없음(GLTFLoader 만으로 읽힘)');ok(j.nodes.some(n=>/^BladeTip/.test(n.name)),'BladeTip 노드(길이 기준)');}
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
ok(paths.has(F)&&paths.has('assets/r1309/slayer-greatsword.glb'),'runtime-manifest 에 스크립트·GLB');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));ok(ver.includes("'"+F+"'")&&ver.includes("'assets/r1309/slayer-greatsword.glb'"),'공개 확인 목록');
console.log(fail?'R1309 FAIL '+fail:'R1309 ALL OK');process.exit(fail?1:0);

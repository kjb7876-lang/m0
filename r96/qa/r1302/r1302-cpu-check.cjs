// R1302~R1304 3D 환도 — 정적 회귀. 태그·자산·GLTFLoader 연결, 기본값(꺼짐), 공유 장면 계약을 본다.
const fs=require('fs'),path=require('path'),crypto=require('crypto');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const src=rd('client-source/hwando-3d-r1302.js'),rt=rd('runtime-text/hwando-3d-r1302.js');
ok(!!src,'오버레이 원본 있음');ok(src&&rt&&src.equals(rt),'runtime-text 사본이 원본과 같음');
const s=String(src||'');
ok(/localStorage\.getItem\(KEY\)==='on'/.test(s)&&/let on=false/.test(s),'기본값 꺼짐(저장값 on 일 때만 켬)');
ok(/Attack_DiagonalSlash/.test(s)&&/AnimationMixer/.test(s),'GLB 클립을 AnimationMixer 로 재생');ok((/player\.hero===HERO/.test(s)||/heroKey\(\)===HERO/.test(s))&&/HERO='hwando'/.test(s),'지금 영웅(R1302~R1304 환도, R1305 부터 HEROES 10명)일 때만 3D');
ok(/function heroCommands\(commands,hint=null\)/.test(s)&&/c\.spatialRole==='body'\|\|c\.r350Lifted/.test(s)&&/c\.owner\?\.kind==='hero'/.test(s)&&/!nestedCommands\.has\(c\)/.test(s),'내 영웅 몸 명령만 뺌(소환·분신·이펙트는 그대로)');
ok(/const r=window\.__STORYWORLD_PHASE1__\?\.controller\?\.state\?\.three/.test(s)&&/T=r\.T/.test(s),'게임 Three r186 인스턴스를 공유');
ok(/r\.scene\.add\(group\)/.test(s)&&/HOST_LAYER=2/.test(s)&&!/new T\.WebGLRenderer/.test(s),'별도 캔버스 없이 월드 몸/벽 레이어에 붙음');
ok(/showSettings=function/.test(s)&&/3D (환도|영웅)\(시험\)/.test(s),'설정 창 한 줄(R1305 부터 3D 영웅)');
const html=String(rd('runtime-text/index.html')||'');const tags=html.match(/<script src="\.\/hwando-3d-r1302\.js"><\/script>/g)||[];
ok(tags.length===1,'index.html 태그 1개');ok(html.indexOf('summon-size-r1299.js')<html.indexOf('hwando-3d-r1302.js'),'태그 자리: summon-size-r1299 뒤');
const g=String(rd('runtime-text/vendor/three/examples/jsm/loaders/GLTFLoader.js')||'');
ok(g.includes("from '../../../build/three.module.js'")&&!/from 'three'/.test(g),'GLTFLoader 가 상대 경로로 three 를 읽음');
for(const u of ['BufferGeometryUtils','SkeletonUtils']){const t=String(rd('runtime-text/vendor/three/examples/jsm/utils/'+u+'.js')||'');ok(t.includes("from '../../../build/three.module.js'"),u+' 상대 경로');}
const glb=rd('runtime-text/assets/r1302/hwando-3d.glb');ok(glb&&glb.readUInt32LE(0)===0x46546c67,'GLB 머리 glTF');ok(glb&&glb.length<4e6,'GLB 4MB 미만 ('+(glb?glb.length:0)+')');
if(glb){const jl=glb.readUInt32LE(12),j=JSON.parse(glb.slice(20,20+jl).toString());const req=j.extensionsRequired||[];
 ok(req.every(x=>['KHR_mesh_quantization','EXT_texture_webp'].includes(x)),'필수 확장은 GLTFLoader 기본 지원만 ('+req+')');const an=(j.animations||[]).map(a=>a.name).sort();ok(['Attack_DiagonalSlash','Idle','Walk'].every(n=>an.includes(n)),'애니메이션 클립 Idle·Walk·Attack_DiagonalSlash ('+an+')');ok((j.skins||[]).length>=1,'몸 skin 있음(뼈 무게)');}
const m=JSON.parse(String(rd('runtime-manifest.json')));const rows=Object.fromEntries(m.files.map(r=>[r.path,r]));
const manifestHash=(p,b)=>{if(/\.(?:c?js|mjs|html|json|css|svg|txt|md|py)$/i.test(p))b=Buffer.from(String(b).replace(/\r\n/g,'\n'));return crypto.createHash('sha256').update(b).digest('hex');};
for(const p of ['hwando-3d-r1302.js','assets/r1302/hwando-3d.glb','vendor/three/examples/jsm/loaders/GLTFLoader.js','vendor/three/examples/jsm/utils/BufferGeometryUtils.js','vendor/three/examples/jsm/utils/SkeletonUtils.js']){
 const b=rd('runtime-text/'+p);ok(rows[p]&&b&&rows[p].sha256===manifestHash(p,b),'매니페스트 '+p);}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);

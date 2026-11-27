// R1378 네온·라우렌 3D 무기 — 정적 회귀(사용자 11-27 "네온과 라우렌에 무기 추가, 영웅 고르는 곳 그림에 맞게, 닷츠와 협업, 모션은 미카엘라 참고").
//  ① R1313 무기 표에 neon·lauren(오른손 소켓, assets/r1378 GLB), persona 는 없음(페르소나 = 라우렌 틀이지만 라우렌 흔적 없음).
//  ② R1320 자세 표에 neon·lauren = 미카엘라와 같은 틀(대기 = 팔꿈치 굽혀 세워 쥠, 공격 = 앞으로 내밈), persona 없음.
//  ③ GLB: GripSocket 원점·+Y 가 창끝(BladeTip), 필수 확장 없음, 길이·손잡이 위치, 그림 색(네온 청록 발광, 라우렌 보라 발광), 용량 한도.
//  ④ 빌드 연결: manifest·공개 확인 목록·CI 줄.
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const W=String(rd('client-source/hero-weapons-3d-r1313.js')||''),S=String(rd('client-source/hero-stance-3d-r1320.js')||'');
ok(W===String(rd('runtime-text/hero-weapons-3d-r1313.js')||'x')&&S===String(rd('runtime-text/hero-stance-3d-r1320.js')||'x'),'오버레이 원본 = runtime-text 사본');
const GLB={neon:'neon-abyss-spear.glb',lauren:'lauren-violet-lance.glb'};
for(const [id,f] of Object.entries(GLB)){
 ok(new RegExp("\\n "+id+":\\{glb:'assets/r1378/"+f.replace('.','\\.')+"',tip:/\\^BladeTip/,socket:'Weapon_Socket_R'").test(W),`① 무기 표: ${id} → assets/r1378/${f}, 오른손, 창끝 BladeTip`);
 ok(new RegExp("\\n "+id+":\\{socket:'Weapon_Socket_R',(view:\\d+,)?\\s*\\n?\\s*rest:\\{anchor:'grip'").test(S)&&new RegExp("\\n "+id+":\\{[^]*?attack:\\{anchor:'grip'").test(S),`② 자세 표: ${id} 대기·공격(미카엘라 틀, 손잡이 쥐기)`);
}
for(const id of ['neon','lauren']){const m=new RegExp('\\n '+id+":\\{socket:'Weapon_Socket_R',view:(\\d+),").exec(S);ok(m&&+m[1]>=25,`② ${id}: 정면 찌르기에서 창이 카메라 축에 겹치지 않게 view ≥ 25° (${m?m[1]:'-'})`);}
ok(!/\n persona:/.test(W)&&!/\n persona:/.test(S),'①② 페르소나는 두 표 모두 없음(라우렌 무기가 새지 않음)');
ok(/regex|NAME=\/\^r1305-\(\[a-z\]\+\)-3d-shared\$\//.test(S)||/NAME=\/\^r1305-/.test(S),'② 자세는 영웅 묶음 이름(r1305-<id>-3d-shared)으로만 찾음');
// GLB 읽기
const glb=b=>{const jl=b.readUInt32LE(12),j=JSON.parse(b.slice(20,20+jl).toString());const bo=20+jl,bl=b.readUInt32LE(bo),bin=b.slice(bo+8,bo+8+bl);return {j,bin};};
const man=JSON.parse(String(rd('runtime-manifest.json')||'{"files":[]}'));const paths=new Set(man.files.map(v=>v.path));
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py')));
const COL={neon:[[.05,.75,.6],'청록'],lauren:[[.55,.2,.95],'보라']};
for(const [id,f] of Object.entries(GLB)){
 const b=rd('runtime-text/assets/r1378/'+f);ok(!!b,`③ ${f} 있음`);if(!b)continue;ok(b.length<=900000,`③ ${f} 용량 ${b.length} ≤ 900KB(Dots 정식판 규격)`);
 const {j,bin}=glb(b);ok(!(j.extensionsRequired||[]).length,`③ ${f} 필수 확장 없음`);
 const N=j.nodes.map(n=>n.name||'');const gi=N.indexOf('GripSocket'),ti=N.findIndex(n=>/^BladeTip/.test(n));
 ok(gi>=0&&!(j.nodes[gi].translation||[0,0,0]).some(v=>Math.abs(v)>1e-6),`③ ${f} GripSocket 원점`);
 const t=ti>=0?(j.nodes[ti].translation||[0,0,0]):[0,0,0];ok(ti>=0&&t[1]>=.7&&t[1]<=1.3&&Math.abs(t[0])<.02&&Math.abs(t[2])<.02,`③ ${f} BladeTip 가 +Y 위 (${t.map(v=>v.toFixed(3))})`);
 let lo=9,hi=-9;for(const m of j.meshes)for(const p of m.primitives){const a=j.accessors[p.attributes.POSITION];lo=Math.min(lo,a.min[1]);hi=Math.max(hi,a.max[1]);}
 ok(hi-lo>=1.3&&hi-lo<=2.0&&lo<=-.35&&lo>=-.8,`③ ${f} 창 길이 ${(hi-lo).toFixed(2)}(1.3~2.0), 손잡이 아래 자루 ${(-lo).toFixed(2)}(0.35~0.8)`);
 // 심사(7.54) 지적: 네온 자루가 게임 배율에서 가는 선 하나로만 보임 → 자루(손잡이 위아래 0.3m) 단면 반지름이 0.038 이상, 청록 발광 면이 자루 길이 60% 이상을 따라감
 if(id==='neon'){const acc=j.accessors,bv=j.bufferViews;let r=0,glow=[9,-9];for(const m of j.meshes)for(const p of m.primitives){const a=acc[p.attributes.POSITION],v=bv[a.bufferView],mt=j.materials[p.material],e=(mt.emissiveFactor||[0,0,0]).some(x=>x>.2);
  for(let i=0;i<a.count;i++){const o=v.byteOffset+i*12,x=bin.readFloatLE(o),y=bin.readFloatLE(o+4),z=bin.readFloatLE(o+8);if(y>-.3&&y<.3&&!e)r=Math.max(r,Math.hypot(x,z));if(e&&Math.hypot(x,z)<.06){glow[0]=Math.min(glow[0],y);glow[1]=Math.max(glow[1],y);}}}
  ok(r>=.038,`③ 네온 자루 굵기(반지름) ${r.toFixed(3)} ≥ 0.038`);ok(glow[1]-glow[0]>=.6*(hi-lo),`③ 네온 청록 발광이 자루를 따라감 ${(glow[1]-glow[0]).toFixed(2)} / 창 ${(hi-lo).toFixed(2)}`);
  const sh=j.materials.find(m=>m.name==='steel');const c=sh?.pbrMetallicRoughness?.baseColorFactor||[0,0,0];ok(c[2]>c[0]+.05&&c[1]>c[0],`③ 네온 자루 색이 검정이 아니라 청흑 (${c.slice(0,3).map(x=>x.toFixed(2))})`);}
 const em=j.materials.filter(m=>m.emissiveFactor&&m.emissiveFactor.some(v=>v>.2));const [c,name]=COL[id];
 const near=em.some(m=>{const e=m.emissiveFactor,s=Math.max(...e);const n=e.map(v=>v/s);return Math.hypot(n[0]-c[0]/Math.max(...c),n[1]-c[1]/Math.max(...c),n[2]-c[2]/Math.max(...c))<.45;});
 ok(near,`③ ${f} ${name} 발광 재질 (선택 화면 그림 색)`);
 ok(paths.has('assets/r1378/'+f)&&(ver.includes("'assets/r1378/"+f+"'")||ver.includes("'assets/r1378/'")),`④ ${f} manifest·공개 확인 목록`);
}
const yml=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml')));ok(yml.includes('node r96/qa/r1378/r1378-cpu-check.cjs'),'④ CI 에 이 검사 줄');
console.log(fail?'R1378 FAIL '+fail:'R1378 ALL OK');process.exit(fail?1:0);

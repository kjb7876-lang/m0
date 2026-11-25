// R1310 3D 영웅 걷기 모션 CPU 검사. 실행: node r96/qa/r1310/r1310-cpu-check.cjs (빌드된 site 의 three 모듈 사용)
// 원본 GLB 의 휴지 뼈·Walk 키를 읽어, 새 보행이 (1) 원본과 같은 변환식을 쓰는지(원본 키 재현) (2) 팔다리가 엇갈리는지
// (3) 디딤발이 바닥에 붙어 있는지 (4) 부드럽고 이음매 없이 반복되는지 (5) 손대지 말아야 할 것을 안 건드리는지 본다.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('ok  ',m);}else{fail++;console.log('FAIL',m);}};
const HEROES=['seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego'];
function glb(p){const b=rd(p);const jl=b.readUInt32LE(12);const j=JSON.parse(b.subarray(20,20+jl).toString());const bin=b.subarray(20+jl+8);
 const acc=i=>{const a=j.accessors[i],v=j.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type],o=(v.byteOffset||0)+(a.byteOffset||0),out=[];
  for(let k=0;k<a.count*n;k++){if(a.componentType===5126)out.push(bin.readFloatLE(o+k*4));else if(a.componentType===5122)out.push(Math.max(-1,bin.readInt16LE(o+k*2)/32767));else throw Error('type '+a.componentType);}
  return {n,out};};
 return {j,acc};}
(async()=>{
const T=await import(path.join(R,'hospital-three-pc/site/vendor/three/build/three.module.js'));
// 1) 연결
const src=String(rd('client-source/hero-walk-3d-r1310.js')||'');
ok(src.length>0,'client-source/hero-walk-3d-r1310.js 있음');
const html=String(rd('runtime-text/index.html')||'');
ok(/<script src="\.\/hwando-3d-r1302\.js"><\/script>\r?\n<script src="\.\/hero-walk-3d-r1310\.js"><\/script>/.test(html),'index.html: hwando-3d-r1302 바로 뒤에 hero-walk-3d-r1310 태그 1개');
ok((html.match(/hero-walk-3d-r1310\.js/g)||[]).length===1,'태그 중복 없음');
ok(String(rd('runtime-text/hero-walk-3d-r1310.js')||'')===src&&src.length>0,'runtime-text 사본 = client-source');
const inputs=String(rd('runtime-inputs.json')||'');ok(inputs.includes('hero-walk-3d-r1310.js'),'runtime-inputs.json 에 등록');
const ver=String(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'));ok(ver.includes("'hero-walk-3d-r1310.js'"),'verify-r96-public.py 기대 목록');
const wf=String(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8'));ok(wf.includes('node r96/qa/r1310/r1310-cpu-check.cjs'),'pages.yml CPU 검사 줄');
ok(!/hwando-3d-r1302\.js/.test(String(require('child_process').execSync('git diff --name-only origin/main -- r96/client-source/hwando-3d-r1302.js r96/runtime-text/hwando-3d-r1302.js',{cwd:R}).toString())),'hwando-3d-r1302.js 안 건드림(#1004 작업 중)');
if(!src){console.log(`\nR1310 CPU: ${pass} pass, ${fail} fail`);process.exit(1);}
// 2) 실행
const win={};const ctx={window:win,globalThis:win,console};vm.createContext(ctx);vm.runInContext(src,ctx);
const W=win.__STORYWORLD_HERO_WALK3D_R1310__;ok(!!W,'API __STORYWORLD_HERO_WALK3D_R1310__');
const M=W.maker(T);const fk=M.fk;
const D=Math.PI/180,ang=(a,b)=>2*Math.acos(Math.min(1,Math.abs(a.dot(b))))/D;
const corr=(a,b)=>{const m=x=>x.reduce((s,v)=>s+v,0)/x.length,ma=m(a),mb=m(b);let n=0,da=0,db=0;for(let i=0;i<a.length;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}return n/Math.sqrt(da*db||1);};
const OLD=[[1/30,-26,12,24,18,7,0],[7/30,-4,34,4,10,0,.028],[13/30,24,18,-26,12,-7,0],[19/30,4,10,-4,34,0,.028]];
function fkLocal(rest,frame){ // frame: name→{q?,t?}; returns world matrices
 const W={};const get=n=>{if(W[n])return W[n];const r=rest[n],f=frame[n]||{};const m=new T.Matrix4().compose(new T.Vector3().fromArray(f.t||r.t),new T.Quaternion().fromArray(f.q||r.q),new T.Vector3(1,1,1));W[n]=r.parent?get(r.parent).clone().multiply(m):m;return W[n];};
 for(const n in rest)get(n);return W;}
function metrics(rest,tracks){
 const by={};for(const t of tracks){const [n,p]=t.name.split('.');(by[n]||(by[n]={}))[p]=t;}
 const N=by.Thigh_R.quaternion.times.length,[La,Lb]=M.lengths(rest);
 const at=(t,i,s)=>{if(!t)return null;const k=Math.min(i,t.values.length/s-1);return Array.from(t.values.slice(k*s,k*s+s));};
 const footY=[],footZ=[[],[]],handZ=[[],[]],lowY=[];let maxStep=0;
 for(let i=0;i<N;i++){const f={};for(const n in by)f[n]={q:at(by[n].quaternion,i,4)||undefined,t:at(by[n].position,i,3)||undefined};
  const Wm=fkLocal(rest,f),tip=(n,len)=>new T.Vector3(0,len,0).applyMatrix4(Wm[n]);
  const fr=tip('Shin_R',Lb),fl=tip('Shin_L',Lb),hr=tip('Forearm_R',.25),hl=tip('Forearm_L',.25);
  footZ[0].push(fr.z);footZ[1].push(fl.z);handZ[0].push(hr.z);handZ[1].push(hl.z);lowY.push(Math.min(fr.y,fl.y));footY.push(Math.max(fr.y,fl.y));
  if(i)for(const n in by)if(by[n].quaternion){const a=new T.Quaternion().fromArray(at(by[n].quaternion,i,4)),b=new T.Quaternion().fromArray(at(by[n].quaternion,i-1,4));maxStep=Math.max(maxStep,ang(a,b));}}
 const restY=new T.Vector3(0,Lb,0).applyMatrix4(fkLocal(rest,{}).Shin_R).y;
 return {N,armLegR:corr(handZ[0],footZ[0]),armLegL:corr(handZ[1],footZ[1]),groundVar:Math.max(...lowY)-Math.min(...lowY),sink:restY-Math.min(...lowY),clear:Math.max(...footY)-restY,stride:Math.max(...footZ[0])-Math.min(...footZ[0]),maxStep};}
function stockTracks(g,j,anim){const out=[];for(const c of anim.channels){const s=anim.samplers[c.sampler],n=j.nodes[c.target.node].name,p=c.target.path==='rotation'?'quaternion':c.target.path==='translation'?'position':c.target.path;const t=g.acc(s.input).out,v=g.acc(s.output).out;
 out.push(p==='quaternion'?new T.QuaternionKeyframeTrack(n+'.'+p,t,v):new T.VectorKeyframeTrack(n+'.'+p,t,v));}return out;}
for(const id of HEROES){
 const g=glb('runtime-text/assets/r1305/'+id+'-3d.glb'),j=g.j;
 const rest={};const parent={};j.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent[c]=i));
 const joints=new Set(j.skins[0].joints);
 j.skins[0].joints.forEach(i=>{const n=j.nodes[i];rest[n.name]={q:n.rotation||[0,0,0,1],t:n.translation||[0,0,0],parent:joints.has(parent[i])?j.nodes[parent[i]].name:null};});
 const walk=j.animations.find(a=>a.name==='Walk');
 // (a) 원본 키 재현: 공용 스크립트 표(프레임 1·7·13·19)를 같은 변환식으로 → GLB 키와 1° 안(GLB 회전 키 양자화 오차 실측 최대 0.68°, 식이 틀리면 수십 도).
 const ch={};for(const c of walk.channels){const s=walk.samplers[c.sampler];ch[j.nodes[c.target.node].name+'.'+c.target.path]={t:g.acc(s.input).out,v:g.acc(s.output)};}
 let worst=0,worstLoc=0;
 for(const [tm,rth,rsh,lth,lsh,yaw,bob] of OLD){
  const want={Pelvis:[0,0,yaw],Spine_Chest:[7,0,-yaw],Thigh_R:[rth,0,0],Shin_R:[rsh,0,0],Thigh_L:[lth,0,0],Shin_L:[lsh,0,0],Arm_R:[8+rth*.45,-22,0],Arm_L:[8-rth*.45,22,0]};
  for(const [n,e] of Object.entries(want)){const c=ch[n+'.rotation'];const k=c.t.findIndex(x=>Math.abs(x-tm)<.004);const q=new T.Quaternion().fromArray(c.v.out.slice(k*4,k*4+4));worst=Math.max(worst,ang(q,M.world(rest,n,e)));}
  const c=ch['Pelvis.translation'];const k=c.t.findIndex(x=>Math.abs(x-tm)<.004);worstLoc=Math.max(worstLoc,new T.Vector3().fromArray(c.v.out.slice(k*3,k*3+3)).distanceTo(M.worldLoc(rest,'Pelvis',[0,0,bob-.018])));
 }
 ok(worst<1&&worstLoc<.002,`${id}: 변환식이 원본 Walk 키를 재현(최대 ${worst.toFixed(2)}°, 골반 ${(worstLoc*1000).toFixed(1)}mm)`);
 const dur=Math.max(...ch['Thigh_R.rotation'].t);
 const before=metrics(rest,stockTracks(g,j,walk));
 const clip=new T.AnimationClip('Walk',dur,stockTracks(g,j,walk));
 const root={name:'r1305-'+id+'-3d-model',traverse(){},rotation:{y:0},userData:{}};
 // 뼈 traverse 흉내(restOf 용)
 const bones=Object.entries(rest).map(([n,r])=>({isBone:true,name:n,quaternion:new T.Quaternion().fromArray(r.q),position:new T.Vector3().fromArray(r.t),parent:null}));
 const byName=Object.fromEntries(bones.map(b=>[b.name,b]));for(const b of bones)b.parent=rest[b.name].parent?byName[rest[b.name].parent]:{isBone:false};
 root.traverse=f=>bones.forEach(f);
 const changed=W.patchClip(T,root,clip);
 if(W.skip().includes(id)){ok(!changed&&clip.tracks.length===walk.channels.length,`${id}: 이번엔 건너뜀(R1309 대검 병합 뒤 맞춤) — Walk 그대로`);continue;}
 ok(changed&&clip.duration===dur,`${id}: Walk 클립 교체, 길이 ${dur.toFixed(3)}초 그대로`);
 const after=metrics(rest,clip.tracks);
 console.log(`     ${id} 전: 팔다리 상관 R ${before.armLegR.toFixed(2)} L ${before.armLegL.toFixed(2)} · 디딤발 높이 흔들림 ${(before.groundVar*100).toFixed(1)}cm · 키 ${before.N}`);
 console.log(`     ${id} 후: 팔다리 상관 R ${after.armLegR.toFixed(2)} L ${after.armLegL.toFixed(2)} · 디딤발 높이 흔들림 ${(after.groundVar*100).toFixed(1)}cm · 묻힘 ${(after.sink*100).toFixed(1)}cm · 들림 ${(after.clear*100).toFixed(1)}cm · 보폭 ${after.stride.toFixed(2)}m · 키 ${after.N} · 키 사이 최대 ${after.maxStep.toFixed(1)}°`);
 ok(after.armLegR<-.6&&after.armLegL<-.6,`${id}: 팔이 반대쪽 다리와 엇갈림(상관 R ${after.armLegR.toFixed(2)}, L ${after.armLegL.toFixed(2)} < -0.6)`);
 ok(after.groundVar<.008&&after.sink<.006&&after.sink>-.006,`${id}: 디딤발이 바닥에 붙음(흔들림 ${(after.groundVar*100).toFixed(2)}cm < 0.8, 묻힘 |${(after.sink*100).toFixed(2)}|cm < 0.6)`);
 ok(after.clear>.06&&after.clear<.22,`${id}: 흔드는 발이 6~22cm 들림(${(after.clear*100).toFixed(1)}cm)`);
 ok(after.stride>.4&&after.stride<.9,`${id}: 보폭 0.4~0.9m(${after.stride.toFixed(2)})`);
 ok(after.N>=24&&after.maxStep<9,`${id}: 키 ${after.N}개(≥24) · 키 사이 회전 ${after.maxStep.toFixed(1)}° < 9°`);
 let seam=0;for(const t of clip.tracks){if(!t.values||t.values.length<8)continue;const s=t.getValueSize(),a=t.values.slice(0,s),b=t.values.slice(t.values.length-s);seam=Math.max(seam,...Array.from(a,(x,i)=>Math.abs(x-b[i])));}
 ok(seam<1e-5,`${id}: 첫 키 = 마지막 키(이음매 ${seam.toExponential(1)})`);
 ok(!W.patchClip(T,root,clip),`${id}: 같은 클립 두 번 안 바꿈`);
 if(id!=='persona'){const idle=new T.AnimationClip('Idle',1,[]);ok(!W.patchClip(T,root,idle)&&idle.tracks.length===0,`${id}: Idle 은 안 건드림`);}
 // 걷기 방향: 오른발이 앞으로 나갈 때(뒤꿈치 닿기, 위상 0) 발끝이 몸 앞쪽(+Z, 페르소나는 메시가 뒤집혀 -Z)에 있어야 한다.
 {const by={};for(const t of clip.tracks){const [n,p]=t.name.split('.');(by[n]||(by[n]={}))[p]=t;}
  const f={};for(const n in by)f[n]={q:by[n].quaternion?Array.from(by[n].quaternion.values.slice(0,4)):undefined,t:by[n].position?Array.from(by[n].position.values.slice(0,3)):undefined};
  const Wm=fk(rest,f),Lb=M.lengths(rest)[1],z=new T.Vector3(0,Lb,0).applyMatrix4(Wm.Shin_R).z,want=id==='persona'?-1:1;
  ok(z*want>.1,`${id}: 위상 0 에 오른발이 몸 앞쪽(${want>0?'+Z':'-Z, 거울'})으로 ${Math.abs(z).toFixed(2)}m`);}
 if(id==='persona'){
  ok(Math.abs(root.rotation.y-Math.PI)<1e-9,'persona: 모델을 180° 돌려 얼굴을 이동 방향에 맞춤');
  // 대기·공격 클립 거울: 두 번 거울 = 원래값, 한 번 거울은 앞뒤(gl Z 축 아닌 회전 성분)만 바뀜.
  const idleTracks=stockTracks(g,j,j.animations.find(a=>a.name==='Idle'));const before=idleTracks.map(t=>Float32Array.from(t.values));
  const idle=new T.AnimationClip('Idle',1,idleTracks);ok(W.patchClip(T,root,idle)&&idle.userData.r1310,'persona: Idle 클립 앞뒤 거울');
  let back=0;for(let k=0;k<idleTracks.length;k++){const c=idleTracks[k].clone();M.mirrorTrack(rest,c);back=Math.max(back,...Array.from(c.values,(x,i)=>Math.abs(x-before[k][i])));}
  ok(back<1e-4,'persona: 거울을 두 번 하면 원래 키(Float32 반올림 안, 오차 '+back.toExponential(1)+')');
  const atk=j.animations.find(a=>a.name==='Attack_EgoCast'),at=stockTracks(g,j,atk),ac=new T.AnimationClip('Attack_EgoCast',1,at);
  const hand=(tr,i)=>{const by={};for(const t of tr){const [n,p]=t.name.split('.');(by[n]||(by[n]={}))[p]=t;}const f={};for(const n in by){const tt=by[n].quaternion;if(tt){const k=Math.min(i,tt.values.length/4-1);f[n]={q:Array.from(tt.values.slice(k*4,k*4+4))};}}return new T.Vector3().setFromMatrixPosition(fk(rest,f).Forearm_R).z;};
  const n=at[0].times.length,zs0=[...Array(n).keys()].map(i=>hand(at,i));W.patchClip(T,root,ac);const zs1=[...Array(n).keys()].map(i=>hand(ac.tracks,i));
  ok(Math.max(...zs0)>.1&&Math.min(...zs1)<-.1,`persona: 공격 손 내밀기 앞뒤 거울(원래 최대 +${Math.max(...zs0).toFixed(2)}m → ${Math.min(...zs1).toFixed(2)}m)`);
 }
}
// 3) 범위 밖
{const c=new (T.AnimationClip)('Walk',1,[]);ok(!W.patchClip(T,{name:'r1305-hwando-3d-model',traverse(){},rotation:{y:0},userData:{}},c)&&!c.userData?.r1310,'환도는 안 건드림');
 ok(!W.patchClip(T,{name:'some-other-model',traverse(){},rotation:{y:0},userData:{}},c),'다른 모델 이름은 안 건드림');}
ok(/SKIP=new Set\(\['slayer'\]\)/.test(src),'슬레이어 건너뜀 표시(R1309 병합 뒤 해제)');
console.log(`\nR1310 CPU: ${pass} pass, ${fail} fail`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

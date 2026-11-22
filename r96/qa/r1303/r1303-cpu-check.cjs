// R1303 3D 환도 모션 자연스럽게 — 정적 검사. GLB 를 직접 풀어 뼈 위치를 월드 좌표로 계산해 동작 품질을 잰다(three 불필요).
const fs=require('fs'),path=require('path');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const rd=p=>{try{return fs.readFileSync(path.join(R,p));}catch(_){return null;}};
const s=String(rd('client-source/hwando-3d-r1302.js')||'');
// ---- 게임 쪽: 동작 사이 섞기·걷기 속도·방향 ----
ok(/setEffectiveWeight/.test(s)&&/FADE_SEC\s*=\s*\.\d+/.test(s),'동작 사이 크로스페이드(가중치 섞기, FADE_SEC)');
ok(/WALK_REF\s*=/.test(s)&&/Math\.hypot\(vx,vy\)\s*\/\s*WALK_REF/.test(s),'걷기 재생 속도를 실제 이동 속도에 맞춤(발 미끄러짐 줄이기)');
ok(/YAW_RATE\s*=\s*\d/.test(s),'방향 돌리기 속도 상수(YAW_RATE)로 부드럽게');
ok(/weights:/.test(s),'inspect() 가 동작별 가중치를 보여 줌(브라우저 검사용)');
// ---- GLB 풀기 ----
const glb=rd('runtime-text/assets/r1302/hwando-3d.glb');ok(!!glb,'GLB 있음');if(!glb){console.log('RESULT FAIL');process.exit(1);}
const jl=glb.readUInt32LE(12),J=JSON.parse(glb.slice(20,20+jl).toString()),bin=glb.slice(28+jl);
function acc(i){const a=J.accessors[i],bv=J.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],ct=a.componentType;
 const sz={5126:4,5122:2,5123:2,5120:1,5121:1}[ct],stride=bv.byteStride||sz*n,off=(bv.byteOffset||0)+(a.byteOffset||0),out=[];
 for(let k=0;k<a.count;k++){const e=[];for(let c=0;c<n;c++){const o=off+k*stride+c*sz;let v;
  if(ct===5126)v=bin.readFloatLE(o);else if(ct===5122)v=bin.readInt16LE(o);else if(ct===5123)v=bin.readUInt16LE(o);else if(ct===5120)v=bin.readInt8(o);else v=bin.readUInt8(o);
  if(a.normalized){if(ct===5122)v=Math.max(v/32767,-1);else if(ct===5123)v/=65535;else if(ct===5120)v=Math.max(v/127,-1);else if(ct===5121)v/=255;}e.push(v);}out.push(e);}return out;}
const N=J.nodes,byName={};N.forEach((n,i)=>{if(n.name)byName[n.name]=i;});const parent={};N.forEach((n,i)=>(n.children||[]).forEach(c=>parent[c]=i));
ok(byName.Forearm_R!==undefined&&byName.Forearm_L!==undefined,'팔꿈치(아래팔 본 Forearm_R·Forearm_L) 있음');
const anc=i=>{const r=[];while(parent[i]!==undefined){i=parent[i];r.push(N[i].name);}return r;};
ok(byName.Hwando_Weapon!==undefined&&anc(byName.Hwando_Weapon).includes('Forearm_R'),'칼이 오른 아래팔(손목) 쪽에 붙음');
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qrot=(q,v)=>{const p=qmul(qmul(q,[v[0],v[1],v[2],0]),[-q[0],-q[1],-q[2],q[3]]);return[p[0],p[1],p[2]];};
const nrm=q=>{const l=Math.hypot(...q)||1;return q.map(x=>x/l);};
function clip(name){const A=J.animations.find(a=>a.name===name);if(!A)return null;const tr={};let dur=0;
 for(const ch of A.channels){const sm=A.samplers[ch.sampler],t=acc(sm.input).map(x=>x[0]),v=acc(sm.output);dur=Math.max(dur,t[t.length-1]);(tr[ch.target.node]=tr[ch.target.node]||{})[ch.target.path]={t,v};}return{tr,dur};}
function samp(k,time,rot){const t=k.t;if(time<=t[0])return k.v[0];if(time>=t[t.length-1])return k.v[t.length-1];let i=1;while(t[i]<time)i++;const f=(time-t[i-1])/(t[i]-t[i-1]),a=k.v[i-1],b=k.v[i];
 if(rot){let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];const bb=d<0?b.map(x=>-x):b;return nrm(a.map((x,j)=>x+(bb[j]-x)*f));}return a.map((x,j)=>x+(b[j]-x)*f);}
function pose(C,time){const W={};const get=i=>{if(W[i])return W[i];const n=N[i],k=C&&C.tr[i]||{};
  const T=k.translation?samp(k.translation,time):(n.translation||[0,0,0]),Q=k.rotation?samp(k.rotation,time,1):(n.rotation||[0,0,0,1]),S=k.scale?samp(k.scale,time):(n.scale||[1,1,1]);
  let w;if(parent[i]===undefined)w={p:T,q:nrm(Q),s:S};else{const P=get(parent[i]);const sp=[T[0]*P.s[0],T[1]*P.s[1],T[2]*P.s[2]],r=qrot(P.q,sp);w={p:[P.p[0]+r[0],P.p[1]+r[1],P.p[2]+r[2]],q:nrm(qmul(P.q,Q)),s:[P.s[0]*S[0],P.s[1]*S[1],P.s[2]*S[2]]};}return W[i]=w;};
 const out={};for(const nm of Object.keys(byName))out[nm]=get(byName[nm]).p;return out;}
const I=clip('Idle'),Wk=clip('Walk'),At=clip('Attack_DiagonalSlash');ok(I&&Wk&&At,'클립 세 개 있음');
if(I&&Wk&&At){
 const bones=['Pelvis','Spine_Chest','Head_Hood','Arm_R','Forearm_R','Arm_L','Forearm_L','Thigh_R','Shin_R','Thigh_L','Shin_L','Weapon_Socket','Hwando_Weapon'].filter(b=>byName[b]!==undefined);
 const p0=pose(I,0),h=p0.Head_Hood[1]-Math.min(...bones.map(b=>p0[b][1]));const sc=1.75/Math.max(.01,(p0.Head_Hood[1]+.3*0)||1);
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);const maxd=(A,B)=>Math.max(...bones.map(b=>dist(A[b],B[b])));
 const H=(()=>{let y=-1e9,lo=1e9;for(const b of bones){y=Math.max(y,p0[b][1]);lo=Math.min(lo,p0[b][1]);}return y-lo;})();
 // 1) 이음새: 베기 처음·끝 자세 = 대기 첫 자세(뚝 튀지 않게), 걷기 처음=끝(고리)
 const a0=maxd(pose(At,0),p0),a1=maxd(pose(At,At.dur),p0);ok(a0<.03*H*1.75&&a1<.03*H*1.75,`베기 처음·끝 자세가 대기와 이어짐 (처음 ${a0.toFixed(3)} 끝 ${a1.toFixed(3)}, 한도 ${(.03*H*1.75).toFixed(3)})`);
 const w0=maxd(pose(Wk,0),pose(Wk,Wk.dur));if(process.env.DBG){const A=pose(Wk,0),B=pose(Wk,Wk.dur);for(const b of bones)console.log(b,dist(A[b],B[b]).toFixed(3));}ok(w0<.01*H*1.75,`걷기 고리 이음새 (${w0.toFixed(3)})`);
 // 2) 걷기 골반: 위아래 출렁임이 앞뒤 흔들림보다 커야 함(축 오류 잡기)
 let ys=[],zs=[],xs=[];for(let k=0;k<=40;k++){const P=pose(Wk,Wk.dur*k/40).Pelvis;xs.push(P[0]);ys.push(P[1]);zs.push(P[2]);}
 const rg=a=>Math.max(...a)-Math.min(...a);ok(rg(ys)>.006*H&&rg(ys)>=rg(zs),`걷기 골반 위아래 출렁임 > 앞뒤 흔들림 (위아래 ${rg(ys).toFixed(3)} 앞뒤 ${rg(zs).toFixed(3)} 좌우 ${rg(xs).toFixed(3)})`);
 // 3) 베기: 깊게 쭈그리지 않음, 칼 든 손이 어깨 위에서 허리 아래로 지나감(대각 베기)
 let minP=1e9,hiHand=-1e9,loHand=1e9;for(let k=0;k<=60;k++){const P=pose(At,At.dur*k/60);minP=Math.min(minP,P.Pelvis[1]);const hd=P.Weapon_Socket||P.Forearm_R;hiHand=Math.max(hiHand,hd[1]);loHand=Math.min(loHand,hd[1]);}
 const drop=(p0.Pelvis[1]-minP)/H;ok(drop<.09,`베기 중 골반 내려앉음 키의 9% 미만 (${(drop*100).toFixed(1)}%)`);
 const sh=p0.Arm_R[1];ok(hiHand>sh-.02*H&&loHand<p0.Pelvis[1]+.05*H,`칼 손이 어깨 높이 위→허리 아래로 지나감 (최고 ${((hiHand-sh)/H*100).toFixed(1)}%H, 최저-골반 ${((loHand-p0.Pelvis[1])/H*100).toFixed(1)}%H)`);
 // 4) 대기: 숨쉬기 움직임이 있되 작음
 let im=0;for(let k=1;k<=20;k++)im=Math.max(im,maxd(pose(I,I.dur*k/20),p0));ok(im>.003*H&&im<.06*H,`대기 숨쉬기 움직임 작게 있음 (${(im/H*100).toFixed(2)}%H)`);
 // 5) 완급: 베기 타격 구간 칼 손 속도가 준비 구간보다 빠름
 const sp=[];for(let k=0;k<30;k++){const A=pose(At,At.dur*k/30),B=pose(At,At.dur*(k+1)/30);const hd='Weapon_Socket' in A?'Weapon_Socket':'Forearm_R';sp.push(dist(A[hd],B[hd]));}
 const pk=sp.indexOf(Math.max(...sp)),avg=sp.reduce((a,b)=>a+b,0)/sp.length;ok(Math.max(...sp)>2.2*avg&&pk>3,`베기 완급: 최고 속도가 평균의 2.2배 넘고 준비 뒤에 옴 (${(Math.max(...sp)/avg).toFixed(2)}배, ${pk}/30)`);
}
console.log(fail?`RESULT FAIL ${fail}`:'RESULT PASS');process.exit(fail?1:0);

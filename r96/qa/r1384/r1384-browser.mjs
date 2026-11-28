// R1384 3D 헌터: 오른손이 시위까지 가서 잡고 당겨 쏘기, 왼손은 활대를 확실히 쥐기(사용자 2026-11-27 23:48Z, 2D 헌터 좌우 공격 7칸 참고)
//  브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). 단계는 R1364 pin(u) 으로 고정해 잰다(주기 .5초 기준 위치 u).
//  단위 = 영웅 모델 좌표(키 약 1.6).
//   ① 화살 걸기(u .39): 오른손(주먹)이 실제 시위 가운데(쉬는 자리)에 닿음 ≤ .035
//   ② 당기기(u .6)·조준 정지(u .95): 시위 가운데가 오른손에 붙어 따라옴 ≤ .03, 정지 땐 얼굴 옆 기준점 ≤ .05
//   ③ 왼손이 활대를 쥠: 모든 활 단계에서 활 손잡이(GripSocket)가 왼 주먹 가운데 ≤ .03
//   ④ 놓기 반동(u .14): 오른손이 기준점에서 뒤로 ≥ .05 빠지고 실제로 목표에 닿음(IK 오차 ≤ .06), 시위는 곧음(쉬는 자리 ≤ .01)
//   ⑤ 순서: 실제 연사 중 단계가 놓기→반동→되돌림→걸기→당기기→정지 차례로만 나옴(되감기 없음)
//   ⑦ 끝까지 당김 닻점(u .95, 7분야 1차 심사 8.30 뒤 추가): 오른 주먹이 턱·뺨 높이(턱선 −.03 ~ +.10)·얼굴 오른쪽(x<0)이고 얼굴(머리 메시)에서 ≤ .07
//   ⑧ 당김 길이(u .95): 활 손잡이~시위 가운데 ≥ 팔 길이(어깨-팔꿈치 + 팔꿈치-주먹) × 0.75
//   ⑨ 놓은 뒤 시위 진동(u 0~.14): 시위 가운데가 쉬는 자리를 사이에 두고 2번 넘게 오가고(부호 바뀜 ≥ 2), 처음 크기 ≥ .006, 뒤로 갈수록 줄어듦
//   ⑩ 활대 휨: 끝까지 당기면 활 끝이 시위 쪽으로 ≥ .025(활 좌표) 휘고, 당기는 중(u .6)엔 그보다 덜, 대기 땐 0
//   ⑪ 시위 잘 보이게: 당길 때 시위 굵기 ≥ 쉬는 굵기 × 1.3, 대기 땐 원래 굵기
//   ⑥ 회귀: 대기 땐 활 자세 덧씌움 없음(대기 클립 시각이 달라 손 자리 비교 대신), 그리기 밖 활 자리·시위 원래대로, 셰이더 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1384/r1384-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.evaluate(async()=>{try{await ensureImages(heroPaths('hunter'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero='hunter';player.moving=false;player.attackAnim=0;});
await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();const r=window.__STORYWORLD_PHASE1__.controller.state.three;return i.hero==='hunter'&&i.shown&&!!r.scene.getObjectByName('r1305-hunter-3d-shared')?.getObjectByName('r1313-hunter-weapon');},null,{timeout:240000});
await p.waitForTimeout(2000);
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;const cache=new WeakMap();
 const fistPts=(body,fore)=>{let c=cache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;const cap=new T.Vector3(),mid=new T.Vector3();let n=0,m=0;for(const q of pts){if(q.y>=top-.07&&q.y<=top+.02){cap.add(q);n++;}if(q.y>=top-.10&&q.y<=top+.02){mid.add(q);m++;}}
  c={palm:cap.multiplyScalar(1/Math.max(1,n)),fist:mid.multiplyScalar(1/Math.max(1,m))};cache.set(fore,c);return c;};
 let strIdx=null;
 window.__r1384M=()=>{const g=s.getObjectByName('r1305-hunter-3d-shared'),m=g?.getObjectByName('r1305-hunter-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3()));
  let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r13/.test(x.name||''))body=x;});const o={t:+time.toFixed(3),last:window.__STORYWORLD_HUNTER_DRAW_R1336__.inspect().last};
  for(const side of ['R','L']){const B=m.getObjectByName('Forearm_'+side),F=fistPts(body,B);o['palm'+side]=f(m.worldToLocal(F.palm.clone().applyMatrix4(B.matrixWorld)));o['fist'+side]=f(m.worldToLocal(F.fist.clone().applyMatrix4(B.matrixWorld)));}
  const H=m.getObjectByName('Head')||m.getObjectByName('Head_Hood');const DA=window.__STORYWORLD_HUNTER_DRAW_R1336__,D=DA.anchorOffset?DA.anchorOffset():DA.pose().draw;o.anchor=f(L(H)).map((x,i)=>+(x+D[i]).toFixed(4));
  const w=g.getObjectByName('r1313-hunter-weapon');const n={};w.traverse(x=>{if(x.name)n[x.name.replace(/\d+$/,'')]=x;});o.mountQ=w.quaternion.toArray().map(x=>+x.toFixed(4));o.grip=f(L(n.GripSocket||w));
  let sm=null;w.traverse(x=>{if(!sm&&x.isMesh&&/bowstring/i.test(x.material?.name||''))sm=x;});
  if(sm){const P=sm.geometry.attributes.position,R=sm.geometry.userData.r1364Rest||P.array;if(!strIdx){strIdx=[];let top=0;for(let i=1;i<R.length;i+=3)top=Math.max(top,Math.abs(R[i]));for(let i=0;i<P.count;i++)if(Math.abs(R[i*3+1])<top*.05)strIdx.push(i);}
   const c=new T.Vector3(),r0=new T.Vector3(),v=new T.Vector3();for(const i of strIdx){c.add(v.fromBufferAttribute(P,i));r0.add(v.set(R[i*3],R[i*3+1],R[i*3+2]));}c.multiplyScalar(1/strIdx.length);r0.multiplyScalar(1/strIdx.length);
   o.str=f(m.worldToLocal(c.clone().applyMatrix4(sm.matrixWorld)));o.strRest=f(m.worldToLocal(r0.clone().applyMatrix4(sm.matrixWorld)));}
  return o;};
 window.__r1384F=[];const prev=s.onAfterRender;s.onAfterRender=function(...a){try{if(window.__r1384Rec){const o=window.__r1384M();if(o)window.__r1384F.push(o);}}catch(e){window.__r1384Err=String(e);}return prev?.apply(this,a);};});
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a)};const dist=(a,c)=>V.len(V.sub(a,c));const r3=x=>+(+x).toFixed(3);
const grab=async n=>{await p.evaluate(()=>{window.__r1384F=[];window.__r1384Rec=true;});await p.waitForFunction(n=>window.__r1384F.length>=n,n,{timeout:120000});return p.evaluate(()=>{window.__r1384Rec=false;return window.__r1384F.splice(0);});};
const C='window.__STORYWORLD_HUNTER_CYCLE_R1364__';
const hasPin=await p.evaluate(()=>typeof window.__STORYWORLD_HUNTER_CYCLE_R1364__?.pin==='function');ok(hasPin,'준비: R1364 pin() 있음');
const rest=(await grab(1))[0];
await p.evaluate(()=>{player.direction='right';clearInterval(window.__A);window.__A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});
await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.attack>.97,null,{timeout:60000});
const at=async u=>{await p.evaluate(u=>window.__STORYWORLD_HUNTER_CYCLE_R1364__?.pin?.(u),u);await p.waitForTimeout(300);const F=await grab(3);return F[F.length-1];};
const S={};for(const [k,u] of [['release',.05],['follow',.14],['return',.27],['nock',.39],['draw',.6],['hold',.95]])S[k]=await at(u);
console.log('정보 단계',JSON.stringify(Object.fromEntries(Object.entries(S).map(([k,o])=>[k,o?.last?.stage]))));
{const o=S.nock,d=dist(o.palmR,o.strRest);ok(d<=.035,`① 화살 걸기: 오른손이 시위 가운데에 닿음 (${r3(d)})`);}
for(const k of ['draw','hold']){const o=S[k],d=dist(o.str,o.palmR);ok(d<=.03,`② ${k}: 시위 가운데가 오른손에 붙어 따라옴 (${r3(d)})`);}
{const o=S.hold,d=dist(o.palmR,o.anchor);ok(d<=.05,`② 조준 정지: 얼굴 옆 기준점 (${r3(d)})`);}
for(const k of Object.keys(S)){const o=S[k],d=dist(o.grip,o.fistL);ok(d<=.03,`③ ${k}: 활 손잡이가 왼 주먹 가운데 (${r3(d)})`);}
{const o=S.follow,back=o.anchor[2]-o.palmR[2],e=o.last?.errR??9,ds=dist(o.str,o.strRest);ok(back>=.05&&e<=.06,`④ 놓기 반동: 손이 뒤로 ${r3(back)}, IK 오차 ${r3(e)}`);ok(ds<=.01,`④ 놓은 뒤 시위는 곧음 (${r3(ds)})`);}

// ⑦~⑪ 추가 측정(머리 메시·팔 길이·활대 끝·시위 굵기)
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;let HP=null;
 window.__r1384X=()=>{const g=s.getObjectByName('r1305-hunter-3d-shared'),m=g.getObjectByName('r1305-hunter-3d-model');let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r13/.test(x.name||''))body=x;});const sk=body.skeleton,hi=sk.bones.findIndex(b=>b.name==='Head');
  if(!HP){HP=[];const G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[hi],body.bindMatrix),v=new T.Vector3();for(let i=0;i<P.count;i+=3){let w=0;for(let k=0;k<4;k++)if(SI.getComponent(i,k)===hi)w+=SW.getComponent(i,k);if(w>.5)HP.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}}
  const H=sk.bones[hi],pts=HP.map(q=>m.worldToLocal(q.clone().applyMatrix4(H.matrixWorld)));let zmax=-9;for(const q of pts)zmax=Math.max(zmax,q.z);let jaw=9;for(const q of pts)if(q.z>zmax-.08)jaw=Math.min(jaw,q.y);
  const o=window.__r1384M(),pr=new T.Vector3().fromArray(o.palmR);let face=9;for(const q of pts)face=Math.min(face,q.distanceTo(pr));
  const L=n=>m.worldToLocal(m.getObjectByName(n).getWorldPosition(new T.Vector3()));const armLen=L('Arm_R').distanceTo(L('Forearm_R'))+L('Forearm_R').distanceTo(pr);
  const w=g.getObjectByName('r1313-hunter-weapon');let limb=null,sm=null;w.traverse(x=>{if(x.isMesh&&!/^r1320/.test(x.name)){if(!limb&&/oxblood/i.test(x.material?.name||''))limb=x;if(!sm&&/bowstring/i.test(x.material?.name||''))sm=x;}});
  let tip=0;if(limb){const A=limb.geometry.attributes.position.array,R=limb.geometry.userData.r1384Rest||A;let bi=0;for(let i=1;i<R.length;i+=3)if(R[i]>R[bi*3+1])bi=(i-1)/3;tip=A[bi*3]-R[bi*3];}
  let wid=0,wid0=0;if(sm){const A=sm.geometry.attributes.position.array,R=sm.geometry.userData.r1364Rest||A;let top=0;for(let i=1;i<R.length;i+=3)top=Math.max(top,Math.abs(R[i]));let z0=9,z1=-9,r0=9,r1=-9;for(let i=0;i<R.length;i+=3)if(Math.abs(R[i+1])<top*.3){z0=Math.min(z0,A[i+2]);z1=Math.max(z1,A[i+2]);r0=Math.min(r0,R[i+2]);r1=Math.max(r1,R[i+2]);}wid=z1-z0;wid0=r1-r0;}
  return {...o,jaw:+jaw.toFixed(4),face:+face.toFixed(4),armLen:+armLen.toFixed(4),tip:+tip.toFixed(4),wid:+wid.toFixed(5),wid0:+wid0.toFixed(5)};};});
const atX=async u=>{await p.evaluate(u=>window.__STORYWORLD_HUNTER_CYCLE_R1364__?.pin?.(u),u);await p.waitForTimeout(300);await grab(2);return p.evaluate(()=>new Promise(res=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,prev=s.onAfterRender;s.onAfterRender=function(...a){s.onAfterRender=prev;let o=null;try{o=window.__r1384X();}catch(e){o={err:String(e)};}res(o);return prev?.apply(this,a);};}));};
{const o=await atX(.95);if(o.err)console.log('정보 측정 오류',o.err);const dy=o.palmR?o.palmR[1]-o.jaw:9;
 ok(dy>=-.03&&dy<=.10&&o.palmR[0]<0&&o.face<=.07,`⑦ 끝까지 당김 닻점: 턱선 대비 높이 ${r3(dy)}, 얼굴까지 ${r3(o.face)}, x ${r3(o.palmR?.[0])}`);
 const dl=dist(o.grip,o.str);ok(dl>=.75*o.armLen,`⑧ 당김 길이: 손잡이~시위 ${r3(dl)} ≥ 팔 ${r3(o.armLen)}×0.75 (${r3(dl/o.armLen)})`);
 const d6=await atX(.6);ok(o.tip>=.025&&d6.tip>0&&d6.tip<o.tip,`⑩ 활대 휨: 끝까지 ${r3(o.tip)}, 당기는 중 ${r3(d6.tip)}`);
 ok(o.wid0>0&&o.wid>=o.wid0*1.3,`⑪ 당길 때 시위 굵기 ${r3(o.wid0>0?o.wid/o.wid0:0)}배`);}
{const dev=[];for(let u=.004;u<=.141;u+=.008){const o=await atX(u);const d=o.str&&o.strRest?(o.str[0]-o.strRest[0])+(o.str[2]-o.strRest[2]):0;dev.push(+d.toFixed(4));}
 let sc=0;for(let i=1;i<dev.length;i++)if(Math.sign(dev[i])&&Math.sign(dev[i-1])&&Math.sign(dev[i])!==Math.sign(dev[i-1]))sc++;const a0=Math.max(...dev.slice(0,4).map(Math.abs)),a1=Math.max(...dev.slice(-4).map(Math.abs));
 console.log('정보 시위 진동',JSON.stringify(dev));ok(sc>=2&&a0>=.006&&a1<a0,`⑨ 놓은 뒤 시위 진동: 부호 바뀜 ${sc}, 처음 ${r3(a0)} → 끝 ${r3(a1)}`);}
// ⑤ 실제 연사 순서
await p.evaluate(()=>{window.__STORYWORLD_HUNTER_CYCLE_R1364__?.pin?.(null);clearInterval(window.__A);player.attackAnim=0;const e=room.enemies.find(e=>e.hp>0&&!e.boss);window.__E=e;e.visible=true;e.x=player.x+4;e.y=player.y+1;e.hp=e.maxHp=1e9;e.spawnState='active';
 let last=-9;window.__A=setInterval(()=>{if(time-last>=.5){player.attackCD=0;player.moving=false;try{basicAttack(true);}catch(_){}last=time;}else player.attackCD=Math.max(+player.attackCD||0,.05);},4);});
{const F=await grab(60);await p.evaluate(()=>clearInterval(window.__A));const ord=['release','follow','return','nock','draw','hold'];let back=0,seen=new Set(),prev=null;
 for(const f of F){const s=f.last?.stage;if(!s||!ord.includes(s))continue;seen.add(s);if(prev&&ord.indexOf(s)<ord.indexOf(prev)&&s!=='release'&&s!=='follow')back++;prev=s;}
 ok(back===0&&seen.has('draw')&&seen.has('hold')&&(seen.has('release')||seen.has('follow')),`⑤ 단계 순서 되감기 없음 (되감기 ${back}, 본 단계 ${[...seen].join(',')})`);}
await p.evaluate(()=>{const e=window.__E;e.visible=false;e.x+=9999;player.attackAnim=0;player.direction='right';});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(500);
{const o=(await grab(2)).pop();ok(o.last&&o.last.w===0,`⑥ 대기 땐 활 자세를 덧씌우지 않음 (w ${o.last&&o.last.w})`);ok(dist(o.str,o.strRest)<=.002,'⑥ 대기 때 시위 곧음');
 const Q=[.5,-.5,.5,-.5],d=Math.max(...(await p.evaluate(()=>window.__r1384M())).mountQ.map((x,i)=>Math.abs(Math.abs(x)-Math.abs(Q[i]))));ok(d<=.002,`⑥ 그리기 밖 활 자리 R1313 표 그대로 (${r3(d)})`);}
{const o=await p.evaluate(()=>window.__r1384X());ok(Math.abs(o.tip)<=1e-4&&Math.abs(o.wid-o.wid0)<=1e-5,`⑩⑪ 대기 땐 활대·시위 원래대로 (끝 ${o.tip}, 굵기 ${o.wid}/${o.wid0})`);}
ok(shaderErrors.length===0,`⑥ 셰이더 오류 0 (${shaderErrors.length})`);
console.log(fail?`R1384 브라우저 실패 ${fail}`:'R1384 브라우저 통과');await b.close();process.exit(fail?1:0);

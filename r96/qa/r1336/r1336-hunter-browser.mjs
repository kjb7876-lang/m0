// R1336 헌터 3D 활 공격 모션 강화(사용자 2026-11-26 "헌터활모션강화") — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  영상 실측: 3D 헌터 공격은 원래 모션 그대로라 활을 옆구리에서 세로로 들어 올렸다 내릴 뿐, 활을 앞으로 뻗거나 시위를 당기는 동작이 없었다.
//  기대(그리는 순간, 영웅 모델 좌표 +Z 앞·+Y 위·오른손 −X):
//   ① 활 손(왼 주먹)이 왼 어깨에서 앞으로 0.35 이상 뻗고 어깨 높이(±0.15) ② 활이 거의 곧게 섬(위 끝 방향 y ≥ .9)
//   ③ 시위(StringCenter)가 쏘는 사람 쪽(활 손잡이보다 뒤) ④ 당기는 손(오른 주먹)이 얼굴 가까이(머리 뼈에서 0.22 이하)·활 손보다 0.3 이상 뒤
//   ⑤ 당기는 팔꿈치가 어깨 높이 근처(어깨 −0.1 이상) ⑥ 4방향 모두 ⑦ 회귀: 그리기 밖 뼈 값은 원래 모션 그대로, 대기 자세는 바꾸지 않음, 셰이더 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1336/r1336-hunter-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.evaluate(async()=>{try{await ensureImages(heroPaths('hunter'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero='hunter';player.moving=false;player.attackAnim=0;});
await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();const r=window.__STORYWORLD_PHASE1__.controller.state.three;return i.hero==='hunter'&&i.shown&&!!r.scene.getObjectByName('r1305-hunter-3d-shared')?.getObjectByName('r1313-hunter-weapon');},null,{timeout:240000});
await p.waitForTimeout(2500);
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;const prev=s.onAfterRender;const cache=new WeakMap();
 const palm=(body,fore)=>{let c=cache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}c.multiplyScalar(1/Math.max(1,n));cache.set(fore,c);return c;};
 const measure=()=>{const g=s.getObjectByName('r1305-hunter-3d-shared'),m=g?.getObjectByName('r1305-hunter-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3()));
  let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r13/.test(x.name||''))body=x;});const o={w:window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights};
  for(const side of ['R','L']){const A=m.getObjectByName('Arm_'+side),B=m.getObjectByName('Forearm_'+side);o['arm'+side]=f(L(A));o['elbow'+side]=f(L(B));o['palm'+side]=f(m.worldToLocal(palm(body,B).clone().applyMatrix4(B.matrixWorld)));o['q'+side]=[...A.quaternion.toArray(),...B.quaternion.toArray()].map(x=>+x.toFixed(5));}
  const H=m.getObjectByName('Head')||m.getObjectByName('Head_Hood');o.head=f(L(H));const w=g.getObjectByName('r1313-hunter-weapon');const n={};w.traverse(x=>{if(x.name)n[x.name.replace(/\d+$/,'')]=x;});
  o.mountQ=w.quaternion.toArray().map(x=>+x.toFixed(4));o.grip=f(L(n.GripSocket||w));o.tip=f(L(n.UpperTip));o.string=f(L(n.StringCenter));return o;};
 s.onAfterRender=function(...a){const q=window.__r1336H;if(q&&!q.out){try{q.out=measure()||{none:true};}catch(e){q.out={error:String(e)};}}return prev?.apply(this,a);};window.__r1336Out=measure;});
const snap=async()=>{await p.evaluate(()=>{window.__r1336H={};});await p.waitForFunction(()=>window.__r1336H?.out,null,{timeout:60000});return p.evaluate(()=>{const o=window.__r1336H.out;window.__r1336H=null;return o;});};
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a)};const dist=(a,c)=>V.len(V.sub(a,c));const r2=x=>Array.isArray(x)?x.map(v=>+v.toFixed(2)):+(+x).toFixed(2);
const idle=async d=>{await p.evaluate(d=>{clearInterval(window.__r1336A);player.attackAnim=0;route.length=0;player.moving=false;if(d)player.direction=d;},d);await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(400);};
const attack=async d=>{await p.evaluate(d=>{clearInterval(window.__r1336A);route.length=0;window.__r1336A=setInterval(()=>{player.moving=false;player.attackAnim=.2;if(d)player.direction=d;},8);},d);await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.97;},null,{timeout:60000});await p.waitForTimeout(250);};
console.log("정보 R1336 헌터 오버레이",JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_HUNTER_DRAW_R1336__?.inspect?.()??null)));
await idle("right");const rest=await snap();const restOut=await p.evaluate(()=>window.__r1336Out());
for(const d of ['right','front','left','back']){await attack(d);const o=await snap();if(!o||o.none||o.error){ok(false,`${d}: 잴 수 없음 ${JSON.stringify(o)}`);continue;}
 const fwd=o.palmL[2]-o.armL[2],dir=V.sub(o.tip,o.grip),up=dir[1]/V.len(dir);
 ok(fwd>=.35&&Math.abs(o.palmL[1]-o.armL[1])<=.15,`① ${d}: 활 손이 앞으로 뻗음 (어깨에서 앞 ${r2(fwd)}, 높이 차 ${r2(o.palmL[1]-o.armL[1])})`);
 ok(up>=.9,`② ${d}: 활이 곧게 섬 (위 방향 ${r2(up)})`);
 ok(o.string[2]<o.grip[2]-.05,`③ ${d}: 시위가 쏘는 사람 쪽 (시위 z ${r2(o.string[2])}, 손잡이 z ${r2(o.grip[2])})`);
 ok(dist(o.palmR,o.head)<=.22&&o.palmR[2]<=o.palmL[2]-.3,`④ ${d}: 당기는 손이 얼굴 가까이·뒤로 (머리까지 ${r2(dist(o.palmR,o.head))}, 활 손보다 뒤 ${r2(o.palmL[2]-o.palmR[2])})`);
 ok(o.elbowR[1]>=o.armR[1]-.1,`⑤ ${d}: 당기는 팔꿈치가 어깨 높이 근처 (팔꿈치 ${r2(o.elbowR[1])}, 어깨 ${r2(o.armR[1])})`);}
{const out=await p.evaluate(()=>window.__r1336Out());const R=[.5,-.5,.5,-.5],d=out?Math.max(...out.mountQ.map((x,i)=>Math.abs(Math.abs(x)-Math.abs(R[i])))):9;ok(d<=.002,`⑦ 그리기 밖 활 자리는 R1313 표 그대로(되돌림) (차 ${r2(d)})`);}
console.log("정보 R1336 헌터 오버레이",JSON.stringify(await p.evaluate(()=>window.__STORYWORLD_HUNTER_DRAW_R1336__?.inspect?.()??null)));
await idle("right");{const o=await snap();ok(dist(o.palmL,rest.palmL)<=.03&&dist(o.palmR,rest.palmR)<=.03,`⑦ 대기 자세는 그대로 (왼손 차 ${r2(dist(o.palmL,rest.palmL))}, 오른손 차 ${r2(dist(o.palmR,rest.palmR))})`);}
ok(shaderErrors.length===0,`⑦ 셰이더 오류 0 (${shaderErrors.length})`);
console.log(fail?`R1336 헌터 실패 ${fail}`:'R1336 헌터 통과');clearInterval();await b.close();process.exit(fail?1:0);

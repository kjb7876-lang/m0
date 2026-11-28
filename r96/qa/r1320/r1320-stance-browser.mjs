// R1320 3D 영웅 자세 보정(환도·EGO 검 세워 들기, 기억사수 견착, 미카엘라 봉 쥐기) — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-26: "검을 이런 파란색 처럼 들어야지 자연스럽게"(환도 영웅 — 손에서 앞·위로 비스듬히), "기억사수 총 쏠 때 개머리판 부분 어깨에 견착하고 진짜 군인처럼",
//  "미카엘라도 옆에서 봤을 때는 봉을 잡고 있는 게 아니라 봉이 그냥 손에 붙어있는 느낌".
//  재는 법: 그리는 순간(scene.onAfterRender, 자세 오버레이가 뼈를 되돌리기 전)의 뼈·무기 자리를 영웅 모델 좌표(+Z 앞, +Y 위, 오른손 −X, 키 약 1.75)로 읽는다.
//  주먹 = 아래팔 뼈에 붙은(가중치 .5 이상) 꼭짓점 가운데 손끝 쪽 7cm 의 무게중심(이 리그에는 손·손가락 뼈가 없다).
//  ① 환도·EGO 대기·걷기: 칼끝이 손보다 위·앞(올림각 25~70°), 손은 몸 앞, 주먹이 칼자루에. 4방향 모두. 공격 중에는 원래 베기 모션(칼끝이 크게 움직임).
//  ② 기억사수 공격: 개머리판 끝이 오른 어깨 앞, 총열 수평·정면, 총 위쪽이 위, 총열 높이가 어깨 높이, 오른 주먹이 손잡이, 왼 주먹이 총열 덮개에. 대기: 두 손으로 쥠.
//  ③ 미카엘라 대기·걷기: 주먹이 봉 축 위, 팔꿈치 굽힘, 봉이 거의 곧게 섬. 공격: 주먹이 봉 축 위.
//  ⑤ R1320b 환도·EGO: 4방향 대기·공격 내내 칼날이 카메라 축에서 30° 넘게 벌어져 있다(정면 공격에서 칼이 점으로 줄어 빈손처럼 보이던 것).
//  ④ 회귀·경계: 그리기 밖에서는 뼈·무기 값이 원래대로(R1313 표), 다른 영웅(슬레이어)은 손대지 않음, 끄기 키면 원래 자세, 영웅을 바꿔도 오류 0, 셰이더 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1320/r1320-stance-browser.mjs` (HEROES=a,b 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const W=640,H=400,HEROES=(process.env.HEROES||'hwando,ego,gunner,michaela,slayer').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const WEAPON={hwando:'r1313-hwando-weapon',ego:'r1313-ego-weapon',gunner:'r1313-gunner-weapon',michaela:'r1313-michaela-weapon',slayer:'r1309-slayer-greatsword'};
const pick=async h=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}clearInterval(window.__r1320A);player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(([h,w])=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(!(i.hero===h&&i.shown))return false;const r=window.__STORYWORLD_PHASE1__.controller.state.three;return !!r.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName(w);},[h,WEAPON[h]],{timeout:240000});await p.waitForTimeout(2200);};
// 그리는 순간 재기: onAfterRender 를 한 번 감싸 두고(자세 오버레이의 되돌리기보다 먼저 돈다), 요청이 있을 때만 잰다.
const install=()=>p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;if(s.__r1320M)return;const prev=s.onAfterRender;s.__r1320M=true;
 const palmCache=new WeakMap();
 const palm=(body,fore)=>{let c=palmCache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}c.multiplyScalar(1/Math.max(1,n));palmCache.set(fore,c);return c;};
 const measure=q=>{const g=s.getObjectByName('r1305-'+q.hero+'-3d-shared'),m=g?.getObjectByName('r1305-'+q.hero+'-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));
  const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3())),o={pose:window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights,snap:(window.__STORYWORLD_SWORD_COMBO_R1347__?.snapWindow?.(q.hero)===true)};
  let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r1320/.test(x.name||''))body=x;});
  for(const side of ['R','L']){const A=m.getObjectByName('Arm_'+side),B=m.getObjectByName('Forearm_'+side),C=B?.children.find(c=>/^Weapon_Socket/.test(c.name));if(!A||!B)continue;o['arm'+side]=f(L(A));o['elbow'+side]=f(L(B));if(C){o['sock'+side]=f(L(C));const a=L(A),e=L(B),c=L(C);o['bend'+side]=+(e.clone().sub(a).angleTo(c.clone().sub(e))*180/Math.PI).toFixed(1);o['palm'+side]=f(m.worldToLocal(palm(body,B).clone().applyMatrix4(B.matrixWorld)));}
   o['q'+side]=[...A.quaternion.toArray(),...B.quaternion.toArray()].map(x=>+x.toFixed(5));}
  const w=g.getObjectByName(q.weapon);if(w){const inv=new T.Matrix4().copy(w.matrixWorld).invert(),bb=new T.Box3(),nodes={};
   w.traverse(x=>{if(x.isMesh&&!/^r1320/.test(x.name||'')&&x.visible){const P=x.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,x.matrixWorld),v=new T.Vector3();for(let i=0;i<P.count;i+=2)bb.expandByPoint(v.fromBufferAttribute(P,i).applyMatrix4(M));}else if(x.name)nodes[x.name.replace(/\d+$/,'')]=x;});
   const P=(x,y,z)=>m.worldToLocal(w.localToWorld(new T.Vector3(x,y,z)));
   o.grip=f(P(0,0,0));o.axis=f(P(0,1,0).sub(P(0,0,0)).normalize());o.side=f(P(1,0,0).sub(P(0,0,0)).normalize());o.lo=f(P(0,bb.min.y,0));o.hi=f(P(0,bb.max.y,0));
   for(const k of ['BladeTip','HeartFX','EmissionFX','SupportSocket'])if(nodes[k])o[k]=f(L(nodes[k]));
   if(nodes.BladeTip){const d=nodes.BladeTip.getWorldPosition(new T.Vector3()).sub(w.getWorldPosition(new T.Vector3())).normalize(),c=r.camera.getWorldDirection(new T.Vector3());o.camAng=+(Math.acos(Math.min(1,Math.abs(d.dot(c))))*180/Math.PI).toFixed(1);}
   if(nodes.EmissionFX){const e=w.worldToLocal(nodes.EmissionFX.getWorldPosition(new T.Vector3()));o.butt=f(P(e.x,bb.min.y,0));o.muzzle=f(P(e.x,bb.max.y,0));}
   o.mountQ=w.quaternion.toArray().map(x=>+x.toFixed(5));o.mountP=f(w.position);}
  return o;};
 s.onAfterRender=function(...a){const q=window.__r1320Q;if(q&&!q.out){try{q.out=measure(q)||{none:true};}catch(e){q.out={error:String(e)};}}return prev?.apply(this,a);};
 window.__r1320Outside=q=>measure(q);});
const snap=async h=>{await p.evaluate(([h,w])=>{window.__r1320Q={hero:h,weapon:w};},[h,WEAPON[h]]);await p.waitForFunction(()=>window.__r1320Q?.out,null,{timeout:60000});return p.evaluate(()=>{const o=window.__r1320Q.out;window.__r1320Q=null;return o;});};
const outside=h=>p.evaluate(([h,w])=>window.__r1320Outside({hero:h,weapon:w}),[h,WEAPON[h]]);
const idle=async d=>{await p.evaluate(d=>{clearInterval(window.__r1320A);player.attackAnim=0;route.length=0;player.moving=false;if(d)player.direction=d;},d);await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(500);};
const walk=async()=>{await p.evaluate(()=>{clearInterval(window.__r1320A);player.attackAnim=0;let dir=1;window.__r1320A=setInterval(()=>{player.attackAnim=0;if(!route.length){dir=-dir;route=[{x:player.x+dir*3,y:player.y+dir*1.5}];}},8);});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.walk>.97,null,{timeout:60000});await p.waitForTimeout(400);};
const attack=async()=>{await p.evaluate(()=>{clearInterval(window.__r1320A);route.length=0;window.__r1320A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.97;},null,{timeout:60000});};
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a),dot:(a,c)=>a.reduce((s,x,i)=>s+x*c[i],0)};
const dist=(a,c)=>V.len(V.sub(a,c)),elev=a=>Math.asin(Math.max(-1,Math.min(1,a[1]/V.len(a))))*180/Math.PI;
// 점 p 에서 선분 a→c 까지 거리
const segDist=(q,a,c)=>{const d=V.sub(c,a),t=Math.max(0,Math.min(1,V.dot(V.sub(q,a),d)/Math.max(1e-9,V.dot(d,d))));return dist(q,a.map((x,i)=>x+d[i]*t));};
const r2=x=>Array.isArray(x)?x.map(v=>+v.toFixed(2)):+(+x).toFixed(2);
const st=()=>p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__?.inspect?.()??null);

for(const h of HEROES){
 await pick(h);await install();
 if(h==='hwando'||h==='ego'){
  for(const d of ['right','front','left','back']){await idle(d);const o=await snap(h),dir=V.sub(o.BladeTip,o.grip),e=elev(dir);
   ok(e>=25&&e<=70&&dir[2]>.25,`① ${h} 대기 ${d}: 칼끝이 손보다 위·앞 (올림각 ${r2(e)}°, 앞 ${r2(dir[2])})`);
   ok(o.grip[2]>=.12&&o.grip[1]>=.85&&o.grip[1]<=1.2,`① ${h} 대기 ${d}: 손이 몸 앞·허리~가슴 높이 (손 ${r2(o.grip)})`);
   ok(dist(o.palmR,o.grip)<=.06,`① ${h} 대기 ${d}: 주먹이 칼자루에 (거리 ${r2(dist(o.palmR,o.grip))})`);
   ok(o.BladeTip[1]<=2.05&&Math.abs(o.BladeTip[0])<=.5,`① ${h} 대기 ${d}: 칼끝이 몸 가까이(옆으로 벌어지지 않음) (칼끝 ${r2(o.BladeTip)})`);}
  await walk();{const a=await snap(h);await p.waitForTimeout(350);const c=await snap(h),dir=V.sub(a.BladeTip,a.grip),e=elev(dir);
   ok(e>=25&&e<=70&&dir[2]>.25&&dist(a.palmR,a.grip)<=.06,`① ${h} 걷기: 검을 세워 든 채 걷는다 (올림각 ${r2(e)}°, 주먹 거리 ${r2(dist(a.palmR,a.grip))})`);
   ok(dist(a.BladeTip,c.BladeTip)<=.12,`① ${h} 걷기: 칼끝이 휘청이지 않음 (두 순간 차 ${r2(dist(a.BladeTip,c.BladeTip))})`);}
  // ⑤ R1320b: 어느 방향을 보고 서 있든 베든 칼날이 카메라 축과 겹쳐 사라지지 않는다(심사 지적: EGO 정면 공격이 빈손처럼 보임 — 실측 10°)
  for(const d of ['front','back','right','left']){await idle(d);let lo=(await snap(h)).camAng,loIn=181;await attack();for(let i=0;i<14;i++){const o=await snap(h);if(o.snap)loIn=Math.min(loIn,o.camAng);else lo=Math.min(lo,o.camAng);await p.waitForTimeout(70);}// R1360: 빠른 베기(약 70ms)는 빼고 봄(참고값만)
   ok(lo>=30,`⑤ ${h} ${d}: 대기·공격 내내 칼날이 화면에 보이는 각도 (카메라 축과 가장 작은 각 ${lo}°, 기준 30° — 빠른 베기 제외${loIn<181?', 그 안 참고 '+loIn+'°':''})`);}
  await idle();const rest=await snap(h);await attack();{let far=0;for(let i=0;i<6;i++){const o=await snap(h);far=Math.max(far,dist(o.BladeTip,rest.BladeTip));await p.waitForTimeout(90);}
   ok(far>=.35,`① ${h} 공격: 원래 베기 모션이 그대로 나온다 (칼끝 이동 ${r2(far)})`);}
  await idle();
 }
 if(h==='gunner'){
  await attack();await p.waitForTimeout(250);
  {const o=await snap(h),ax=o.axis,up=o.side.map(x=>-x);
   ok(dist(o.butt,o.armR)<=.14&&o.butt[2]>=o.armR[2]-.06,`② 기억사수 공격: 개머리판 끝이 오른 어깨 앞 (어깨까지 ${r2(dist(o.butt,o.armR))}, 개머리판 ${r2(o.butt)} 어깨 ${r2(o.armR)})`);
   ok(ax[2]>=.97&&Math.abs(ax[1])<=.12,`② 기억사수 공격: 총열 수평·정면 (방향 ${r2(ax)})`);
   ok(up[1]>=.9,`② 기억사수 공격: 총 위쪽이 위 (위 방향 ${r2(up)})`);
   ok(o.muzzle[1]>=o.armR[1]-.1&&o.muzzle[1]<=o.armR[1]+.2,`② 기억사수 공격: 총열이 어깨 높이 (총구 높이 ${r2(o.muzzle[1])}, 어깨 ${r2(o.armR[1])})`);
   ok(dist(o.palmR,o.grip)<=.07,`② 기억사수 공격: 오른 주먹이 손잡이에 (거리 ${r2(dist(o.palmR,o.grip))})`);
   ok(segDist(o.palmL,o.grip,o.muzzle)<=.12&&V.dot(V.sub(o.palmL,o.grip),ax)>=.1,`② 기억사수 공격: 왼 주먹이 총열 덮개를 받침 (총 축까지 ${r2(segDist(o.palmL,o.grip,o.muzzle))}, 손잡이 앞 ${r2(V.dot(V.sub(o.palmL,o.grip),ax))})`);
   ok(o.bendR>=40,`② 기억사수 공격: 오른 팔꿈치를 굽혀 당겨 쥠 (굽힘 ${o.bendR}°)`);}
  for(const d of ['right','back']){await idle(d);const o=await snap(h);
   ok(dist(o.palmR,o.grip)<=.07,`② 기억사수 대기 ${d}: 오른 주먹이 손잡이에 (거리 ${r2(dist(o.palmR,o.grip))})`);
   ok(segDist(o.palmL,o.grip,o.muzzle)<=.12,`② 기억사수 대기 ${d}: 두 손으로 쥠 (왼 주먹~총 축 ${r2(segDist(o.palmL,o.grip,o.muzzle))})`);
   ok(o.side[0]*-1>=-.5&&-o.side[1]>=.6,`② 기억사수 대기 ${d}: 총이 뒤집히지 않음 (위 방향 ${r2(o.side.map(x=>-x))})`);}
  await walk();{const o=await snap(h);ok(dist(o.palmR,o.grip)<=.07&&segDist(o.palmL,o.grip,o.muzzle)<=.12,`② 기억사수 걷기: 두 손으로 쥔 채 (오른 ${r2(dist(o.palmR,o.grip))}, 왼 ${r2(segDist(o.palmL,o.grip,o.muzzle))})`);}
  await idle();
 }
 if(h==='michaela'){
  for(const d of ['right','front','left','back']){await idle(d);const o=await snap(h),tilt=90-elev(o.axis);
   ok(segDist(o.palmR,o.lo,o.hi)<=.04,`③ 미카엘라 대기 ${d}: 주먹이 봉 축 위 (거리 ${r2(segDist(o.palmR,o.lo,o.hi))})`);
   ok(o.bendR>=45&&o.bendR<=120,`③ 미카엘라 대기 ${d}: 팔꿈치를 굽혀 쥠 (굽힘 ${o.bendR}°)`);
   ok(tilt<=20,`③ 미카엘라 대기 ${d}: 봉이 거의 곧게 섬 (기울기 ${r2(tilt)}°)`);
   ok(o.palmR[2]>=.1,`③ 미카엘라 대기 ${d}: 손이 몸 앞 (주먹 ${r2(o.palmR)})`);
   ok(o.lo[1]>=.02,`③ 미카엘라 대기 ${d}: 봉 끝이 땅을 뚫지 않음 (아래 끝 높이 ${r2(o.lo[1])})`);}
  await walk();{const o=await snap(h);ok(segDist(o.palmR,o.lo,o.hi)<=.04&&90-elev(o.axis)<=24,`③ 미카엘라 걷기: 봉을 쥔 채 (주먹~봉 ${r2(segDist(o.palmR,o.lo,o.hi))}, 기울기 ${r2(90-elev(o.axis))}°)`);}
  await idle();await attack();{let worst=0,low=9;for(let i=0;i<6;i++){const o=await snap(h);worst=Math.max(worst,segDist(o.palmR,o.lo,o.hi));low=Math.min(low,o.HeartFX[1]);await p.waitForTimeout(90);}
   ok(worst<=.05,`③ 미카엘라 공격: 주먹이 봉 축 위 (가장 먼 순간 ${r2(worst)})`);ok(low>=.6,`③ 미카엘라 공격: 하트가 땅에 처박히지 않음 (가장 낮은 높이 ${r2(low)})`);}
  await idle();
 }
 if(h==='slayer'){await idle('right');const i=await st();ok(i&&!i.active.includes('slayer')&&!(await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__.heroes())).includes('slayer')&&await p.evaluate(()=>window.__STORYWORLD_SLAYER_BLADE_R1309__.inspect().errors)===0,'④ 슬레이어: 자세 보정 대상이 아님(R1309 두 손 쥐기 그대로, 오류 0)');}
 else{
  // ④ 그리기 밖: 뼈·무기 값이 원래대로(R1313 표 회전·손 뼈 원점) — 다른 검사·정령 계산이 보는 값
  await idle('right');const fit=await p.evaluate(h=>window.__STORYWORLD_HERO_WEAPONS_R1313__.fit(h),h),o=await outside(h),n=Math.hypot(...fit.q),dq=Math.abs(o.mountQ.reduce((s,x,i)=>s+x*fit.q[i]/n,0));
  ok(dq>.9999&&Math.hypot(...o.mountP)<1e-6,`④ ${h} 그리기 밖: 무기 자리·회전이 R1313 표 그대로 (회전 일치 ${dq.toFixed(5)}, 자리 ${JSON.stringify(o.mountP)})`);
  // ④ 끄기 키: 원래 자세로(주먹 자리 맞춤도 끔)
  const on=await snap(h);const had=await p.evaluate(()=>{const s=window.__STORYWORLD_HERO_STANCE_R1320__;if(!s)return false;s.set(false);return true;});await p.waitForTimeout(400);const off=await snap(h);
  ok(had&&Math.hypot(...off.mountP)<1e-6&&Math.abs(off.mountQ.reduce((s,x,i)=>s+x*fit.q[i]/n,0))>.9999&&dist(on.grip,off.grip)>.03,`④ ${h} 끄기 키: 원래 자세로 돌아감 (손잡이 이동 ${had?r2(dist(on.grip,off.grip)):'-'})`);
  await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__?.set(true));await p.waitForTimeout(300);
 }
}
{const s=await st(),e=await p.evaluate(()=>({w:window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().errors,h:window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors??0,pz:window.__STORYWORLD_HERO_POLISH_R1320__?.inspect().errors??0}));
 ok(s&&s.errors===0&&s.frames>0,'④ 자세 오버레이 오류 0, 프레임 돎 ('+JSON.stringify(s&&{e:s.errors,f:s.frames,last:s.lastError})+')');
 ok(e.w===0&&e.pz===0,'④ R1313·R1320 보정 오류 0 ('+JSON.stringify(e)+')');ok(shaderErrors.length===0,'④ 셰이더·WebGL 오류 0 '+shaderErrors.slice(0,2).join(' | '));}
await b.close();console.log(fail?`\nR1320 자세 FAIL ${fail}`:'\nR1320 자세 PASS');process.exit(fail?1:0);

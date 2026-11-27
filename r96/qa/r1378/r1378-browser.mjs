// R1378 네온·라우렌 3D 무기 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 "네온과 라우렌에 무기추가 — 영웅 고르는 곳 그림에 맞게, 닷츠랑 협업, 모션은 미카엘라 참고".
//  재는 법은 R1320 자세 검사와 같다(그리는 순간 scene.onAfterRender, 영웅 모델 좌표 +Z 앞 +Y 위, 키 약 1.75).
//  ① 3D 꺼짐: r1378 GLB 요청 0.
//  ② 네온·라우렌: 3D 가 보이면 창이 오른손 소켓 아래에 붙음, 자세 오버레이 대상.
//  ③ 대기·걷기(미카엘라 틀): 주먹이 창 자루 위, 팔꿈치 굽힘, 창이 거의 곧게 섬, 창 아래 끝이 땅 위, 4방향.
//  ④ 공격(미카엘라 틀 = 앞으로 내밈): 주먹이 자루 위, 창끝이 몸 앞(z>0)·손보다 앞으로 나감, 창끝이 땅에 처박히지 않음.
//  ⑤ 페르소나(라우렌 틀): 페르소나 3D 묶음에 무기 없음, 라우렌 창 GLB 를 새로 읽지 않음, R1313·R1320 대상에 persona 없음.
//  ⑥ 회귀: 미카엘라 무기·자세 그대로 동작, 오류 0, 셰이더 오류 0, GLB 각 1번.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1378/r1378-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
const req=[];p.on('request',r=>{const m=/\/assets\/r1378\/([\w-]+\.glb)/.exec(r.url());if(m)req.push(m[1]);});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.waitForTimeout(1500);ok(req.length===0,'① 3D 꺼짐: r1378 GLB 요청 0 ('+req.length+')');
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const pick=async(h,persona=false)=>{await p.evaluate(async([h,persona])=>{try{await ensureImages(heroPaths(h));}catch(_){}clearInterval(window.__r1378A);player.egoSovereignR1046=false;player.personaHeroR1113=persona;player.hero=h;player.moving=false;player.attackAnim=0;},[h,persona]);
 const id=persona?'persona':h;await p.waitForFunction(id=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===id&&i.shown;},id,{timeout:240000});
 if(!persona)await p.waitForFunction(h=>!!window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon'),h,{timeout:240000}).catch(()=>null);
 await p.waitForTimeout(2200);};
const install=()=>p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;if(s.__r1378M)return;const prev=s.onAfterRender;s.__r1378M=true;const cache=new WeakMap();
 const palm=(body,fore)=>{let c=cache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}c.multiplyScalar(1/Math.max(1,n));cache.set(fore,c);return c;};
 const measure=h=>{const g=s.getObjectByName('r1305-'+h+'-3d-shared'),m=g?.getObjectByName('r1305-'+h+'-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));
  const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3())),o={};let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r1320/.test(x.name||''))body=x;});
  const A=m.getObjectByName('Arm_R'),B=m.getObjectByName('Forearm_R'),C=B?.children.find(c=>/^Weapon_Socket/.test(c.name));const a=L(A),e=L(B),c=L(C);o.bendR=+(e.clone().sub(a).angleTo(c.clone().sub(e))*180/Math.PI).toFixed(1);o.palmR=f(m.worldToLocal(palm(body,B).clone().applyMatrix4(B.matrixWorld)));
  const w=g.getObjectByName('r1313-'+h+'-weapon');if(!w)return o;let sock=false;for(let n=w.parent;n;n=n.parent)if(/^Weapon_Socket_R$/.test(n.name||''))sock=true;o.sock=sock;
  const inv=new T.Matrix4().copy(w.matrixWorld).invert(),bb=new T.Box3();let tip=null;w.traverse(x=>{if(x.isMesh&&x.visible){const P=x.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,x.matrixWorld),v=new T.Vector3();for(let i=0;i<P.count;i++)bb.expandByPoint(v.fromBufferAttribute(P,i).applyMatrix4(M));}else if(/^BladeTip/.test(x.name||''))tip=x;});
  const P=(x,y,z)=>m.worldToLocal(w.localToWorld(new T.Vector3(x,y,z)));o.grip=f(P(0,0,0));o.axis=f(P(0,1,0).sub(P(0,0,0)).normalize());o.lo=f(P(0,bb.min.y,0));o.hi=f(P(0,bb.max.y,0));o.tip=tip?f(L(tip)):null;o.len=+(bb.max.y-bb.min.y).toFixed(3);
  o.modelLen=+P(0,bb.max.y,0).distanceTo(P(0,bb.min.y,0)).toFixed(3);
  if(tip){const d=tip.getWorldPosition(new T.Vector3()).sub(w.getWorldPosition(new T.Vector3())).normalize(),c=r.camera.getWorldDirection(new T.Vector3());o.camAng=+(Math.acos(Math.min(1,Math.abs(d.dot(c))))*180/Math.PI).toFixed(1);}return o;};
 s.onAfterRender=function(...a){const q=window.__r1378Q;if(q&&!q.out){try{q.out=measure(q.h)||{none:true};}catch(e){q.out={error:String(e)};}}return prev?.apply(this,a);};});
const snap=async h=>{await p.evaluate(h=>{window.__r1378Q={h};},h);await p.waitForFunction(()=>window.__r1378Q?.out,null,{timeout:60000});return p.evaluate(()=>{const o=window.__r1378Q.out;window.__r1378Q=null;return o;});};
const idle=async d=>{await p.evaluate(d=>{clearInterval(window.__r1378A);player.attackAnim=0;route.length=0;player.moving=false;if(d)player.direction=d;},d);await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(500);};
const walk=async()=>{await p.evaluate(()=>{clearInterval(window.__r1378A);player.attackAnim=0;let dir=1;window.__r1378A=setInterval(()=>{player.attackAnim=0;if(!route.length){dir=-dir;route=[{x:player.x+dir*3,y:player.y+dir*1.5}];}},8);});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.walk>.97,null,{timeout:60000});await p.waitForTimeout(400);};
const attack=async()=>{await p.evaluate(()=>{clearInterval(window.__r1378A);route.length=0;window.__r1378A=setInterval(()=>{player.moving=false;player.attackAnim=.2;},8);});await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.action==='attack'&&i.weights.attack>.97;},null,{timeout:60000});};
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a),dot:(a,c)=>a.reduce((s,x,i)=>s+x*c[i],0)};
const dist=(a,c)=>V.len(V.sub(a,c)),elev=a=>Math.asin(Math.max(-1,Math.min(1,a[1]/V.len(a))))*180/Math.PI;
const segDist=(q,a,c)=>{const d=V.sub(c,a),t=Math.max(0,Math.min(1,V.dot(V.sub(q,a),d)/Math.max(1e-9,V.dot(d,d))));return dist(q,a.map((x,i)=>x+d[i]*t));};
const r2=x=>Array.isArray(x)?x.map(v=>+v.toFixed(2)):+(+x).toFixed(2);
for(const h of ['neon','lauren']){
 await pick(h);await install();
 const act=await p.evaluate(h=>({w:window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().active[h]??null,st:window.__STORYWORLD_HERO_STANCE_R1320__.inspect().active}),h);
 ok(act.w?.visible&&act.w.parent==='Weapon_Socket_R'&&act.st.includes(h),`② ${h}: 창이 오른손 소켓에 붙고 자세 보정 대상 (${JSON.stringify(act)})`);
 for(const d of ['right','front','left','back']){await idle(d);const o=await snap(h);if(!o?.axis){ok(false,`③ ${h} 대기 ${d}: 무기 없음`);continue;}const tilt=90-elev(o.axis);
  ok(segDist(o.palmR,o.lo,o.hi)<=.04,`③ ${h} 대기 ${d}: 주먹이 창 자루 위 (거리 ${r2(segDist(o.palmR,o.lo,o.hi))})`);
  ok(o.bendR>=45&&o.bendR<=120,`③ ${h} 대기 ${d}: 팔꿈치를 굽혀 쥠 (굽힘 ${o.bendR}°)`);
  ok(tilt<=20,`③ ${h} 대기 ${d}: 창이 거의 곧게 섬 (기울기 ${r2(tilt)}°)`);
  ok(o.lo[1]>=.02,`③ ${h} 대기 ${d}: 창 아래 끝이 땅을 뚫지 않음 (높이 ${r2(o.lo[1])})`);
  ok(o.tip&&o.tip[1]>o.palmR[1]+.5,`③ ${h} 대기 ${d}: 창끝이 위 (창끝 ${r2(o.tip||[])})`);
  if(d==='right')ok(o.modelLen>=1.3&&o.modelLen<=2.0,`③ ${h}: 창 길이가 몸과 어울림 (모델 좌표 ${o.modelLen}, 키 약 1.75)`);}
 await walk();{const o=await snap(h);ok(o?.axis&&segDist(o.palmR,o.lo,o.hi)<=.04&&90-elev(o.axis)<=24,`③ ${h} 걷기: 창을 쥔 채 (주먹~자루 ${o?.axis?r2(segDist(o.palmR,o.lo,o.hi)):'-'}, 기울기 ${o?.axis?r2(90-elev(o.axis)):'-'}°)`);}
 await idle('right');const rest=await snap(h);await attack();
 {let worst=0,low=9,fwd=-9;for(let i=0;i<6;i++){const o=await snap(h);if(!o?.axis)continue;worst=Math.max(worst,segDist(o.palmR,o.lo,o.hi));low=Math.min(low,o.tip[1]);fwd=Math.max(fwd,o.tip[2]);await p.waitForTimeout(90);}
  ok(worst<=.05,`④ ${h} 공격: 주먹이 자루 위 (가장 먼 순간 ${r2(worst)})`);ok(low>=.6,`④ ${h} 공격: 창끝이 땅에 처박히지 않음 (가장 낮은 높이 ${r2(low)})`);
  ok(rest?.tip&&fwd>=rest.tip[2]+.25&&fwd>=.4,`④ ${h} 공격: 창끝을 앞으로 내밂 (대기 ${r2(rest?.tip?.[2]??NaN)} → 공격 최대 ${r2(fwd)})`);}
 // ④ 화면 정면(카메라 쪽)으로 찌를 때도 창이 카메라 축과 겹쳐 점으로 사라지지 않음(헤드리스 전후 장면에서 정면 공격 창이 안 보였음)
 for(const d of ['front','back']){await idle(d);await attack();let lo=90;for(let i=0;i<8;i++){const o=await snap(h);if(o?.camAng!=null)lo=Math.min(lo,o.camAng);await p.waitForTimeout(80);}
  ok(lo>=25,`④ ${h} 공격 ${d}: 창이 화면에 보이는 각도 (카메라 축과 가장 작은 각 ${lo}°, 기준 25°)`);}
 await idle();
}
// ⑤ 페르소나
{const before=req.length;await pick('lauren',true);await p.waitForTimeout(1500);
 const o=await p.evaluate(()=>{const s=window.__STORYWORLD_PHASE1__.controller.state.three.scene,g=s.getObjectByName('r1305-persona-3d-shared');let wn=[];g?.traverse(x=>{if(/^r13\d\d-\w+-weapon$|greatsword|lauren|spear|lance|BladeTip|GripSocket/i.test(x.name||''))wn.push(x.name);});
  const lg=s.getObjectByName('r1305-lauren-3d-shared');return {has:!!g,vis:!!g?.visible,wn,laurenVis:!!lg?.visible,w:Object.keys(window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().active),st:window.__STORYWORLD_HERO_STANCE_R1320__.inspect().active};});
 ok(o.has&&o.vis&&o.wn.length===0,`⑤ 페르소나 3D 에 무기·라우렌 흔적 없음 (${JSON.stringify(o.wn)})`);
 ok(!o.laurenVis,'⑤ 페르소나일 때 라우렌 몸(창 포함)은 안 보임');
 ok(!o.w.includes('persona')&&!o.st.includes('persona'),`⑤ 무기·자세 대상에 persona 없음 (${o.w}/${o.st})`);
 ok(req.length===before,'⑤ 페르소나로 바꿔도 창 GLB 를 더 읽지 않음');}
// ⑥ 회귀: 미카엘라
{await pick('michaela');await install();await idle('right');const o=await snap('michaela');ok(o?.axis&&segDist(o.palmR,o.lo,o.hi)<=.04&&90-elev(o.axis)<=20,`⑥ 미카엘라 하트봉 자세 그대로 (주먹~봉 ${o?.axis?r2(segDist(o.palmR,o.lo,o.hi)):'-'})`);}
{const e=await p.evaluate(()=>({w:window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect(),s:window.__STORYWORLD_HERO_STANCE_R1320__.inspect(),h:window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors??0}));
 ok(e.w.errors===0&&e.s.errors===0&&e.h===0,`⑥ 오류 0 (${JSON.stringify({w:e.w.errors,wl:e.w.lastError,s:e.s.errors,sl:e.s.lastError,h:e.h})})`);
 ok(shaderErrors.length===0,'⑥ 셰이더·WebGL 오류 0 '+shaderErrors.slice(0,2).join(' | '));
 ok(req.filter(x=>x==='neon-abyss-spear.glb').length===1&&req.filter(x=>x==='lauren-violet-lance.glb').length===1,'⑥ 창 GLB 각 1번 ('+req.join(',')+')');}
await b.close();console.log(fail?`\nR1378 browser FAIL ${fail}`:'\nR1378 browser ALL OK');process.exit(fail?1:0);

// R1347 3D 검사 영웅(슬레이어·환도·EGO) 검술 연속 동작 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-26: "슬레이어랑 환도 그리고 ego각성영웅 공격모션 특히 검술 여러모션으로 / 이영상 모션 분석해서 이검술토대로 적용".
//  재는 법: 그리는 순간(scene.onAfterRender, 오버레이들이 뼈를 되돌리기 전)의 뼈·칼 자리를 영웅 모델 좌표(+Z 앞, +Y 위, 오른손 −X)로 매 프레임 기록한다.
//  ① 이어 치면 다섯 동작(내려베기→올려베기→찌르기→횡베기→감아베기)이 차례로 나온다.
//  ② 타격 순간 칼끝 자리가 동작마다 다르고, 동작마다 영상 특징(위→아래, 아래→위, 앞으로 뻗기, 오른쪽→왼쪽 수평, 머리 뒤로 감기)이 실제 3D 칼에서 보인다.
//  ③ 주먹이 칼자루에(슬레이어는 두 손 모두), 칼끝이 땅 위, 칼날이 카메라 축에서 30° 넘게 벌어져 화면에 보인다.
//  ④ 회귀·경계: 대기 자세는 그대로(켜고 끈 차이 없음), 끄기 키면 원래 클립 하나, 다른 영웅(기억사수)은 손대지 않음, 오류 0, 셰이더 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1347/r1347-browser.mjs` (HEROES=a,b 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const W=640,H=400,HEROES=(process.env.HEROES||'hwando,ego,slayer').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const WEAPON={hwando:'r1313-hwando-weapon',ego:'r1313-ego-weapon',gunner:'r1313-gunner-weapon',slayer:'r1309-slayer-greatsword'};
const pick=async h=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}clearInterval(window.__r1347A);player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;player.direction='right';},h);
 await p.waitForFunction(([h,w])=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(!(i.hero===h&&i.shown))return false;const r=window.__STORYWORLD_PHASE1__.controller.state.three;return !!r.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName(w);},[h,WEAPON[h]],{timeout:240000});await p.waitForTimeout(2500);};
const install=()=>p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;if(s.__r1347M)return;const prev=s.onAfterRender;s.__r1347M=true;
 const palmCache=new WeakMap();
 const palm=(body,fore)=>{let c=palmCache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}c.multiplyScalar(1/Math.max(1,n));palmCache.set(fore,c);return c;};
 const boxCache=new WeakMap();
 const measure=q=>{const g=s.getObjectByName('r1305-'+q.hero+'-3d-shared'),m=g?.getObjectByName('r1305-'+q.hero+'-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));
  const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3())),api=window.__STORYWORLD_SWORD_COMBO_R1347__,o={time:+time.toFixed(3),pose:window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights,combo:api?.inspect().last?.[q.hero]||null};
  let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r13/.test(x.name||''))body=x;});
  for(const side of ['R','L']){const B=m.getObjectByName('Forearm_'+side);if(B&&body)o['palm'+side]=f(m.worldToLocal(B.localToWorld(palm(body,B).clone())));}
  const A=m.getObjectByName('Arm_R');if(A)o.armR=f(L(A));const FR=m.getObjectByName('Forearm_R');if(FR)o.elbowR=f(L(FR));
  const w=g.getObjectByName(q.weapon);if(w){let bb=boxCache.get(w);const nodes={};w.traverse(x=>{if(x.name)nodes[x.name.replace(/\d+$/,'')]=x;});
   if(!bb){const inv=new T.Matrix4().copy(w.matrixWorld).invert();bb=new T.Box3();w.traverse(x=>{if(x.isMesh&&!/^r1320/.test(x.name||'')&&x.visible){const P=x.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,x.matrixWorld),v=new T.Vector3();for(let i=0;i<P.count;i+=2)bb.expandByPoint(v.fromBufferAttribute(P,i).applyMatrix4(M));}});boxCache.set(w,bb);}
   const P=(x,y,z)=>m.worldToLocal(w.localToWorld(new T.Vector3(x,y,z)));o.grip=f(P(0,0,0));o.lo=f(P(0,bb.min.y,0));o.hi=f(P(0,bb.max.y,0));
   if(nodes.BladeTip){o.tip=f(L(nodes.BladeTip));const d=nodes.BladeTip.getWorldPosition(new T.Vector3()).sub(w.getWorldPosition(new T.Vector3())).normalize(),c=r.camera.getWorldDirection(new T.Vector3());o.camAng=+(Math.acos(Math.min(1,Math.abs(d.dot(c))))*180/Math.PI).toFixed(1);}
   o.mountQ=w.quaternion.toArray().map(x=>+x.toFixed(5));o.mountP=f(w.position);}
  return o;};
 s.onAfterRender=function(...a){const q=window.__r1347Q;if(q){try{const o=measure(q);if(o)(q.log||(q.log=[])).push(o);}catch(e){q.err=String(e);}}return prev?.apply(this,a);};
 window.__r1347Outside=q=>measure(q);});
const startLog=h=>p.evaluate(([h,w])=>{window.__r1347Q={hero:h,weapon:w,log:[]};},[h,WEAPON[h]]);
const stopLog=()=>p.evaluate(()=>{const q=window.__r1347Q;window.__r1347Q=null;return q?.log||[];});
const logErr=()=>p.evaluate(()=>window.__r1347Q?.err||null);
const snap=async h=>{await startLog(h);await p.waitForFunction(()=>window.__r1347Q?.log?.length>0,null,{timeout:60000});return (await stopLog())[0];};
const idle=async d=>{await p.evaluate(d=>{clearInterval(window.__r1347A);player.attackAnim=0;route.length=0;player.moving=false;if(d)player.direction=d;},d);await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(500);};
// 이어 치기: 엔진처럼 누를 때 .24 로 올리고 줄어들게, 공격 클립(.5초)의 80% 지점마다 다시 누른다(게임 시간 기준).
const chain=async()=>{await p.evaluate(()=>{clearInterval(window.__r1347A);route.length=0;player.moving=false;let t0=-9;window.__r1347A=setInterval(()=>{player.moving=false;if(time-t0>=.42){t0=time;player.attackAnim=.24;}else player.attackAnim=Math.max(0,.24-(time-t0));},4);});};
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a),dot:(a,c)=>a.reduce((s,x,i)=>s+x*c[i],0)};
const dist=(a,c)=>V.len(V.sub(a,c));const segDist=(q,a,c)=>{const d=V.sub(c,a),t=Math.max(0,Math.min(1,V.dot(V.sub(q,a),d)/Math.max(1e-9,V.dot(d,d))));return dist(q,a.map((x,i)=>x+d[i]*t));};
const r2=x=>Array.isArray(x)?x.map(v=>+v.toFixed(2)):+(+x).toFixed(2);
const IDS=['down','rise','thrust','sweep','chop','backsweep','lunge','wrap'];
const api=()=>p.evaluate(()=>window.__STORYWORLD_SWORD_COMBO_R1347__?.inspect?.()??null);
const moves=await p.evaluate(()=>window.__STORYWORLD_SWORD_COMBO_R1347__?.pure?.MOVES?.map(m=>({id:m.id,strike:m.strike,windup:m.windup}))||null);
ok(!!moves&&moves.length===8,'R1347 오버레이가 실렸다');
const gifFrames={};
for(const h of HEROES){
 await pick(h);await install();await idle('right');
 const on0=await snap(h);
 // ① 이어 치기 — 두 영상의 여덟 동작이 차례로(동작이 열 번 바뀔 때까지 기록)
 await chain();await startLog(h);
 await p.waitForFunction(()=>{if(window.__r1347Q?.err)return true;const L=window.__r1347Q?.log||[];let n=0,last=null;for(const o of L)if(o.combo?.move&&o.combo.w>.5&&o.combo.move!==last){n++;last=o.combo.move;}return n>=10;},null,{timeout:420000,polling:500});
 {const e=await logErr();if(e)ok(false,'측정 오류 '+e);}const log=await stopLog();await idle('right');
 const order=[];for(const o of log){const c=o.combo;if(c?.move&&c.w>.5&&order[order.length-1]!==c.move)order.push(c.move);}
 const startAt=order.indexOf('down'),seq=order.slice(startAt,startAt+8);
 ok(JSON.stringify(seq)===JSON.stringify(IDS),`① ${h}: 이어 치면 여덟 동작이 차례로 (${order.join(' → ')})`);
 // ② 동작마다 타격 순간·특징
 const by={};for(const o of log){const c=o.combo;if(!c?.move||!(c.w>.2)||!o.tip)continue;(by[c.move]||(by[c.move]=[])).push(o);}
 const at=(mv,t)=>{const a=by[mv]||[];let best=null;for(const o of a)if(!best||Math.abs(o.combo.t-t)<Math.abs(best.combo.t-t))best=o;return best;};
 const strikes=IDS.map(id=>at(id,moves.find(m=>m.id===id).strike));
 ok(strikes.every(Boolean),`② ${h}: 여덟 동작 모두 실제 그려짐 (프레임 수 ${IDS.map(id=>(by[id]||[]).length).join('/')})`);
 if(strikes.every(Boolean)){// 칼끝이 지나는 길(진행도 .2~.8 일곱 점, 가장 가까운 프레임) 평균 거리 — 동작 둘이 같은 길이면 '여러 모션'이 아니다
  const bins=[.2,.3,.4,.5,.6,.7,.8],path=id=>bins.map(t=>at(id,t)?.tip);let dmin=9,pair='';
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){const a=path(IDS[i]),c=path(IDS[j]);const d=a.reduce((s,q,k)=>s+dist(q,c[k]),0)/bins.length;if(d<dmin){dmin=d;pair=IDS[i]+'·'+IDS[j];}}
  ok(dmin>=.3,`② ${h}: 여덟 동작의 칼끝 길이 서로 다름 (가장 닮은 ${pair} 평균 거리 ${r2(dmin)}, 기준 .3)`);
  const ys=id=>(by[id]||[]).map(o=>[o.combo.t,o.tip]).sort((a,c)=>a[0]-c[0]);
  const hi=(id,a,c)=>Math.max(...ys(id).filter(x=>x[0]>=a&&x[0]<=c).map(x=>x[1][1])),lo=(id,a,c)=>Math.min(...ys(id).filter(x=>x[0]>=a&&x[0]<=c).map(x=>x[1][1]));
  const sh=on0.armR[1];
  ok(hi('down',.1,.35)>sh&&lo('down',.5,.8)<sh-.5,`② ${h} 내려베기: 칼끝이 어깨 위(${r2(hi('down',.1,.35))}) → 아래(${r2(lo('down',.5,.8))}), 어깨 ${r2(sh)}`);
  ok(lo('rise',.15,.4)<sh-.5&&hi('rise',.5,.8)>sh,`② ${h} 올려베기: 칼끝이 아래(${r2(lo('rise',.15,.4))}) → 어깨 위(${r2(hi('rise',.5,.8))})`);
  {const g=Math.max(...(by.thrust||[]).map(o=>o.grip[2]));const s=strikes[2],d=V.sub(s.tip,s.grip),n=V.len(d);ok(g-on0.grip[2]>=.12&&d[2]/n>=.8,`② ${h} 찌르기: 손을 앞으로 뻗고(손 앞 ${r2(g)}, 대기 ${r2(on0.grip[2])}) 칼날이 정면(앞 성분 ${r2(d[2]/n)})`);}
  {const L=ys('sweep'),a=Math.min(...L.filter(x=>x[0]<=.4).map(x=>x[1][0])),c=Math.max(...L.filter(x=>x[0]>=.5).map(x=>x[1][0]));ok(a<-.3&&c>.3,`② ${h} 횡베기: 칼끝이 오른쪽(x ${r2(a)}) → 왼쪽(x ${r2(c)})`);}
  {const L=ys('wrap'),back=Math.min(...L.filter(x=>x[0]>=.15&&x[0]<=.4).map(x=>x[1][2])),hiY=Math.max(...L.filter(x=>x[0]>=.15&&x[0]<=.4).map(x=>x[1][1])),end=L.filter(x=>x[0]>=.6&&x[0]<=.8).map(x=>x[1]);
   ok(back<on0.armR[2]-.15&&hiY>sh&&end.some(t=>t[0]<-.1&&t[1]<sh-.4),`② ${h} 감아베기: 칼끝이 머리 뒤 위로(앞뒤 ${r2(back)}, 높이 ${r2(hiY)}) 감겼다가 오른쪽 아래로`);}
  {const L=ys('chop'),hiY=Math.max(...L.filter(x=>x[0]>=.15&&x[0]<=.4).map(x=>x[1][1])),end=L.filter(x=>x[0]>=.6&&x[0]<=.8).map(x=>x[1]);ok(hiY>sh+.2&&end.some(t=>t[1]<sh-.5&&Math.abs(t[0]-on0.grip[0])<.45),`② ${h} 정수리 내려치기(영상2): 칼끝이 머리 위(${r2(hiY)}) → 몸 앞 가운데 아래로`);}
  {const L=ys('backsweep'),a=Math.max(...L.filter(x=>x[0]<=.4).map(x=>x[1][0])),c=Math.min(...L.filter(x=>x[0]>=.5).map(x=>x[1][0]));ok(a>.3&&c<-.3,`② ${h} 역횡베기(영상2): 칼끝이 왼쪽(x ${r2(a)}) → 오른쪽(x ${r2(c)})`);}
  {const g=strikes[6],t=strikes[2];ok(g.grip[1]<t.grip[1]-.05&&g.grip[2]-on0.grip[2]>=.1,`② ${h} 낮게 찌르기(영상2): 찌르기보다 손이 낮게(${r2(g.grip[1])} < ${r2(t.grip[1])}) 앞으로`);}
  gifFrames[h]=log.filter(o=>o.combo?.move);}
 // ③ 손·땅·화면
 {// 대기↔공격 섞는 몇 프레임은 R1320 자세 보정이 칼자루를 옮긴다(그쪽 R1348 이 고치는 중) → 공격 가중치가 다 찬 프레임만 본다
  const posed=log.filter(o=>o.combo?.w>.5&&o.palmR&&o.lo&&o.pose.attack/(o.pose.idle+o.pose.walk+o.pose.attack)>=.98);
  // 주먹~칼 축 거리가 대기 때(원래 쥔 자리)와 같다 — 슬레이어 대검은 R1309 체험판 값으로 축에서 조금 비켜 쥔다(대기 실측 그대로 기준)
  const base=segDist(on0.palmR,on0.lo,on0.hi),far=Math.max(...posed.map(o=>Math.abs(segDist(o.palmR,o.lo,o.hi)-base)));
  ok(posed.length>20&&far<=.06,`③ ${h}: 오른 주먹이 대기 때처럼 칼자루에 (대기와 차이 가장 큰 ${r2(far)}, 대기 비킴 ${r2(base)}, 프레임 ${posed.length})`);
  if(h==='slayer'){const two=posed.filter(o=>!['thrust','lunge'].includes(o.combo.move)),one=posed.filter(o=>['thrust','lunge'].includes(o.combo.move));
   // 두 손 쥐기: 왼 주먹이 오른 주먹 바로 아래(칼자루 끝 쪽) 한두 주먹 안 — 대검을 R1309 값대로 축에서 비켜 쥐므로 축 대신 두 주먹 사이로 잰다
   const farL=Math.max(...two.filter(o=>o.combo.w>.9).map(o=>dist(o.palmL,o.palmR)));ok(two.length>20&&farL<=.22,`③ 슬레이어: 베기 여섯 동작은 두 손으로 쥠 (두 주먹 사이 가장 먼 ${r2(farL)}, 기준 .22, 프레임 ${two.length})`);
   const back=one.filter(o=>o.combo.w>.9).every(o=>o.palmL[2]<o.armR[2]+.05&&segDist(o.palmL,o.lo,o.hi)>.15);ok(one.length>5&&back,`③ 슬레이어: 찌르기 둘은 한 손 — 빈 왼손을 뒤로(영상처럼 균형) (프레임 ${one.length})`);}
  // R1348 과 함께: 칼날이 아래팔과 일직선(팔 끝 막대, '칼이 떠 보임')이 되지 않게 — 환도·EGO 는 모든 검술 프레임에서 칼날~아래팔(팔꿈치→주먹) 각 ≥ 30°
  if(h!=='slayer'){const ang=o=>{const f=V.sub(o.palmR,o.elbowR),d=V.sub(o.tip,o.grip);return Math.acos(Math.max(-1,Math.min(1,V.dot(f,d)/(V.len(f)*V.len(d)))))*180/Math.PI;};
   const L=log.filter(o=>o.combo?.w>.05&&o.palmR&&o.elbowR&&o.tip);let mn=181,at='';for(const o of L){const a=ang(o);if(a<mn){mn=a;at=o.combo.move+'@'+o.combo.t;}}
   ok(L.length>20&&mn>=30,`③ ${h}: 칼날~아래팔 각이 모든 검술 프레임에서 30° 이상 (가장 작은 ${r2(mn)}° ${at}, 프레임 ${L.length})`);}
  const low=Math.min(...log.filter(o=>o.tip).map(o=>o.tip[1]));ok(low>=.02,`③ ${h}: 칼끝이 땅을 뚫지 않음 (가장 낮은 ${r2(low)})`);
  const cam=Math.min(...log.filter(o=>o.camAng!=null).map(o=>o.camAng));ok(cam>=30,`③ ${h}: 칼날이 화면에 보이는 각도 (카메라 축과 가장 작은 각 ${cam}°, 기준 30°)`);}
 // ④ 대기 그대로(켜기·끄기 차이 없음), 끄기 키면 원래 클립 하나
 {await idle('right');const pi=(await api()).posed;await p.waitForTimeout(1500);const a=await snap(h);const pj=(await api()).posed;ok(pi===pj,`④ ${h} 대기 1.5초 동안 자세 얹은 횟수 변화 ${pj-pi}`);await p.evaluate(()=>window.__STORYWORLD_SWORD_COMBO_R1347__.set(false));await p.waitForTimeout(300);
  ok(a.combo&&!(a.combo.w>0),`④ ${h} 대기: 검술 자세를 얹지 않음 (${JSON.stringify(a.combo)})`);
  const before=(await api()).posed;await chain();await startLog(h);await p.waitForFunction(()=>(window.__r1347Q?.log||[]).filter(o=>o.pose.attack>.9).length>=8,null,{timeout:180000});const offLog=await stopLog();
  const after=(await api()).posed;ok(after===before&&offLog.every(o=>!o.combo||!(o.combo.w>0)),`④ ${h} 끄기 키: 원래 공격 클립 하나로 (자세 얹은 횟수 변화 ${after-before})`);
  await p.evaluate(()=>window.__STORYWORLD_SWORD_COMBO_R1347__.set(true));await idle('right');
  // 그리기 밖(렌더 사이): 공격 중에도 무기 묶음의 자기 자리·회전이 원래 값(켜기 전 대기 때와 같음) = 렌더 뒤 되돌림(판정·정령이 보는 값 그대로)
  const out=()=>p.evaluate(([h,w])=>{const o=window.__r1347Outside({hero:h,weapon:w});return o&&{q:o.mountQ,p:o.mountP};},[h,WEAPON[h]]);
  if(h!=='slayer'){const base=await out();await chain();await p.waitForTimeout(600);let worst=0;const p0=(await api()).posed;
  for(let i=0;i<8;i++){const o=await out();const dq=1-Math.abs(o.q.reduce((s,x,k)=>s+x*base.q[k],0));worst=Math.max(worst,dq*100,dist(o.p,base.p)*10);await p.waitForTimeout(120);}
  const p1=(await api()).posed;ok(p1>p0&&worst<1e-3,`④ ${h} 그리기 밖: 공격 중에도 무기 묶음 값이 원래대로 (차 ${worst.toExponential(1)}, 그사이 자세 얹음 ${p1-p0})`);}// 슬레이어 대검은 R1309 가 매 프레임 자기 값으로 다시 놓고 되돌리지 않아(오른팔 보조) 비교 기준이 없다
  await idle('right');}
}
// ④ 다른 영웅(기억사수)은 손대지 않음
{await pick('gunner');const i=await api();ok(i&&!i.active.includes('gunner'),'④ 기억사수: 검술 대상 아님 ('+(i&&i.active)+')');}
{const s=await api(),e=await p.evaluate(()=>({st:window.__STORYWORLD_HERO_STANCE_R1320__?.inspect().errors??0,sl:window.__STORYWORLD_SLAYER_BLADE_R1309__?.inspect().errors??0,w:window.__STORYWORLD_HERO_WEAPONS_R1313__?.inspect().errors??0,h:window.__STORYWORLD_HWANDO3D_R1302__.inspect().errors??0}));
 ok(s&&s.errors===0&&s.posed>0,'④ R1347 오류 0, 자세 얹음 '+JSON.stringify(s&&{e:s.errors,posed:s.posed,starts:s.starts,last:s.lastError}));
 ok(e.st===0&&e.sl===0&&e.w===0,'④ R1309·R1313·R1320 오류 0 '+JSON.stringify(e));ok(shaderErrors.length===0,'④ 셰이더·WebGL 오류 0 '+shaderErrors.slice(0,2).join(' | '));}
if(process.env.DUMP){const fs=await import('node:fs');fs.writeFileSync(process.env.DUMP,JSON.stringify(gifFrames));}
await b.close();console.log(fail?`\nR1347 검술 FAIL ${fail}`:'\nR1347 검술 PASS');process.exit(fail?1:0);

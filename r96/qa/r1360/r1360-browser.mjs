// R1360 검사 영웅 공격 '절도'·'칼날로 확실히 벤다'·슬레이어 두 손 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 06:22Z "환도영웅 동작이 절도 있고 확실하게 칼날로 적을 베는 느낌", 06:23Z "슬레이어 확실하게 두손으로 대검을 쥐고서 휘두르고 절도있게",
//  "ego각성영웅도 절도있게 칼날로 적을 화려하게 베는 느낌".
//  재는 법은 r1347-browser 와 같다(그리는 순간의 뼈·칼 자리, 영웅 모델 좌표 +Z 앞 +Y 위). 동작마다 진행도 t(0~1, 공격 .5초) 순으로 칼날 방향(손잡이→칼끝)을 본다.
//  ① 빠른 베기: 칼의 움직임(칼날이 돈 각 + 칼끝이 간 길)이 가장 큰 t 폭 .14(70ms) 구간의 평균 속도가 나머지(.1~.9 에서 그 구간·멈춤 구간 뺀 곳, 움츠림·거두기) 평균 속도의 3배 이상.
//     (처음엔 '.1~.9 전체 회전의 55% 가 70ms 안' 이었으나, 대기 자세로 되돌아가는 거두기 회전이 베기만큼 커서 아무리 빨리 베도 닿지 않는 기준이었다 → 첫 측정 뒤 비율로 바꿈.
//      바꾸기 전 원래 베기는 같은 비로 1.3~1.8배, 찌르기는 칼날이 거의 돌지 않아 칼끝 길을 함께 잰다. 기록: fail-first-browser.txt)
//  ② 멈춤: 그 빠른 구간이 끝난 바로 뒤 t 폭 .08(40ms) 동안 칼날 평균 속도가 빠른 구간 평균 속도의 15% 이하(벤 자리에서 딱 선다).
//  ③ 칼날로 앞을 벤다: 빠른 구간 안에 칼끝이 몸 앞(앞 .45 이상)·정면 ±30° 안·허리~머리 높이(.35~1.6)를 지나는 프레임이 있다(적이 서 있는 자리).
//  ④ 슬레이어 두 손: 여덟 동작 모두(찌르기 포함) 공격 가중치가 찬 프레임에서 두 주먹 사이 ≤ .22(r1347 의 두 손 기준과 같음).
//  ⑤ 회귀: 칼끝이 땅 위, 칼날~카메라 축 ≥ 30°(빠른 베기 구간 밖 — 사용자 결정 카드), 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1360/r1360-browser.mjs` (HEROES=a,b 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const W=640,H=400,HEROES=(process.env.HEROES||'hwando,ego,slayer').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
// 게임 시간을 1/4 로 늦춰 70ms 구간에도 프레임이 여럿 들어오게(r1351 과 같은 방식) — 공격 진행도는 게임 시간 기준이라 동작은 같다.
await p.evaluate(()=>{window.__SLOW=.25;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
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
const PP=await p.evaluate(()=>{const P=window.__STORYWORLD_SWORD_COMBO_R1347__?.pure;return P?{CUT:P.CUT,HOLD:P.HOLD}:null;});
const IDS2=IDS;const WIN=.14,HOLD=.08;
const unitv=a=>{const l=V.len(a);return a.map(x=>x/l);};const angd=(a,c)=>Math.acos(Math.max(-1,Math.min(1,V.dot(unitv(a),unitv(c)))))*180/Math.PI;
for(const h of HEROES){
 await pick(h);await install();await idle('right');
 await chain();await startLog(h);
 await p.waitForFunction(()=>{if(window.__r1347Q?.err)return true;const L=window.__r1347Q?.log||[];let n=0,last=null;for(const o of L)if(o.combo?.move&&o.combo.w>.5&&o.combo.move!==last){n++;last=o.combo.move;}return n>=10;},null,{timeout:900000,polling:500});
 {const e=await logErr();if(e)ok(false,'측정 오류 '+e);}const log=await stopLog();await idle('right');
 // 동작 한 번(같은 move 가 이어지는 구간)씩 묶기
 const runs=[];let cur=null;for(const o of log){const c=o.combo;if(!c?.move||!o.tip){cur=null;continue;}if(!cur||cur.move!==c.move||c.t<cur.last-.05){cur={move:c.move,fr:[]};runs.push(cur);}cur.fr.push(o);cur.last=c.t;}
 const per={};
 for(const r of runs){const raw=r.fr.filter(o=>o.combo.t>=0&&o.combo.t<=1).sort((a,c)=>a.combo.t-c.combo.t),F=[];for(const o of raw){if(F.length&&Math.abs(F[F.length-1].combo.t-o.combo.t)<1e-6)F[F.length-1]=o;else F.push(o);}
  if(F.length<12||F[F.length-1].combo.t-F[0].combo.t<.75)continue;
  const d=F.map(o=>V.sub(o.tip,o.grip)),t=F.map(o=>o.combo.t),seg=[];for(let i=1;i<F.length;i++)seg.push({t0:t[i-1],t1:t[i],a:angd(d[i-1],d[i])});
  // 구간 [a,b] 안에서 돈 각(구간 경계에 걸친 프레임 사이는 시간 비율로 나눔)
  // 칼의 움직임 = 칼날 방향이 돈 각(°) + 칼끝이 지나간 길(모델 단위 1 = 60° 로 환산) — 베기(돌기)와 찌르기(뻗기)를 함께 잰다.
  for(let i=1;i<F.length;i++)seg[i-1].a+=dist(F[i-1].tip,F[i].tip)*60;
  if(process.env.FRAMES&&process.env.FRAMES.split(',').includes(h+':'+r.move))console.log(h,r.move,seg.map(x=>x.t1.toFixed(3)+':'+x.a.toFixed(0)).join(' '));
  const turn=(a,b)=>seg.reduce((s,x)=>{const lo=Math.max(a,x.t0),hi=Math.min(b,x.t1);return hi>lo?s+x.a*(hi-lo)/Math.max(1e-9,x.t1-x.t0):s;},0);
  const total=turn(.1,.9);let best=0,bs=.1;for(let w0=.1;w0<=.9-WIN+1e-9;w0+=.005){const a=turn(w0,w0+WIN);if(a>best){best=a;bs=w0;}}
  // ① 빠르기 비: 빠른 구간 평균 속도 ÷ 나머지(.1~.9 에서 빠른 구간·멈춤 구간 뺀 곳) 평균 속도.
  const restSpan=.8-WIN-HOLD,restAmt=Math.max(1e-9,total-best-turn(bs+WIN,bs+WIN+HOLD)),fast=(best/WIN)/(restAmt/restSpan);
  const hold=turn(bs+WIN,bs+WIN+HOLD)/Math.max(1e-9,best)*(WIN/HOLD);// 멈춤 구간 평균 속도 ÷ 빠른 구간 평균 속도
  // 빠른 구간 안 칼끝 길(프레임 사이는 곧게 10칸으로 나눠) 중 몸 앞 정면·허리~머리 높이를 지나는 점이 있나
  let front=false,fz=-9;for(let i=1;i<F.length;i++){if(t[i]<bs-.01||t[i-1]>bs+WIN+.01)continue;for(let k=0;k<=10;k++){const q=F[i-1].tip.map((x,j)=>x+(F[i].tip[j]-x)*k/10),az=Math.atan2(q[0],q[2])*180/Math.PI;fz=Math.max(fz,q[2]);if(q[2]>=.45&&Math.abs(az)<=30&&q[1]>=.35&&q[1]<=1.6)front=true;}}
  (per[r.move]||(per[r.move]=[])).push({fast,hold,front,fz,bs,total,n:F.length,two:F.filter(o=>o.combo.w>.9&&o.palmL&&o.palmR).map(o=>dist(o.palmL,o.palmR))});}
 ok(IDS2.every(id=>per[id]?.length),`${h}: 여덟 동작 모두 잼 (${IDS2.map(id=>id+':'+(per[id]?.length||0)).join(' ')})`);
 for(const id of IDS2){const L=per[id]||[];if(!L.length)continue;const w=L.reduce((a,c)=>c.fast<a.fast?c:a,L[0]);
  ok(L.every(c=>c.fast>=3),`① ${h} ${id}: 빠른 베기 — 70ms 베기 구간이 나머지(움츠림·거두기)보다 ${r2(w.fast)}배 빠름 (기준 3배, 구간 t ${r2(w.bs)}~${r2(w.bs+WIN)})`);
  const hw=L.reduce((a,c)=>!(c.hold<=a.hold)?c:a,L[0]);ok(L.every(c=>c.hold<=.15),`② ${h} ${id}: 벤 뒤 40ms 멈춤 — 속도 ${Number.isFinite(hw.hold)?Math.round(hw.hold*100):'-'}% (빠른 구간 대비, 기준 15%)`);
  ok(L.every(c=>c.front),`③ ${h} ${id}: 빠른 구간에 칼끝이 몸 앞 정면을 지남 (가장 앞 ${r2(Math.min(...L.map(c=>c.fz)))}, 기준 앞 .45·±30°·높이 .35~1.6)`);
  if(h==='slayer'){const m=Math.max(...L.flatMap(c=>c.two));ok(L.some(c=>c.two.length>3)&&m<=.22,`④ 슬레이어 ${id}: 두 손으로 쥠 (두 주먹 사이 가장 먼 ${r2(m)}, 기준 .22)`);}}
 if(process.env.DUMP)console.log(h,JSON.stringify(Object.fromEntries(Object.entries(per).map(([k,v])=>[k,v.map(c=>({fast:r2(c.fast),hold:r2(c.hold),fz:r2(c.fz),bs:r2(c.bs),tot:Math.round(c.total),n:c.n}))]))));
 const lowO=log.filter(o=>o.tip).reduce((a,o)=>!a||o.tip[1]<a.tip[1]?o:a,null),low=lowO?lowO.tip[1]:NaN;ok(low>=.02,`⑤ ${h}: 칼끝이 땅 위 (가장 낮은 ${r2(low)}, ${lowO?.combo?.move||'-'}@${lowO?.combo?.t??'-'})`);
 // 빠른 베기 구간(앞 .03 ~ 멈춤 끝 + .03)은 칼이 카메라 축을 곧장 지나가도 됨(사용자 결정 카드 추천안 '베기 70ms 동안만 허용') — 그 밖에서만 ≥ 30°.
 const inCut=o=>{const m=moves.find(x=>x.id===o.combo?.move);if(!m||!PP)return false;const A=Math.max(.05,m.strike-PP.CUT);return o.combo.t>=A-.03&&o.combo.t<=m.strike+PP.HOLD+.09;};
 const camL=log.filter(o=>o.camAng!=null&&o.combo?.w>.05),cam=Math.min(...camL.filter(o=>!inCut(o)).map(o=>o.camAng)),camCut=Math.min(...camL.filter(inCut).map(o=>o.camAng));
 ok(cam>=30,`⑤ ${h}: 칼날~카메라 축 ≥ 30° — 빠른 베기 구간 밖 (가장 작은 ${cam}°, 베기 구간 안 참고 ${camCut}°)`);}
{const s=await api(),e=await p.evaluate(()=>({st:window.__STORYWORLD_HERO_STANCE_R1320__?.inspect().errors??0,sl:window.__STORYWORLD_SLAYER_BLADE_R1309__?.inspect().errors??0}));
 ok(s&&s.errors===0&&e.st===0&&e.sl===0,'⑤ 오류 0 '+JSON.stringify({c:s?.errors,l:s?.lastError,...e}));ok(shaderErrors.length===0,'⑤ 셰이더 오류 0');}
await b.close();console.log(fail?`\nR1360 FAIL ${fail}`:'\nR1360 PASS');process.exit(fail?1:0);

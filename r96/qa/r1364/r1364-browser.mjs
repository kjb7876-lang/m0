// R1364 헌터 활시위 당김 → 조준 정지 → 놓기 반동(사용자 2026-11-27 06:36Z "헌터영웅이 확실하게 활시위를 땡겨서 스킬과 공격을 하도록 모션개선")
//  브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). 3D 헌터(기본값)를 본다. 단위 = 영웅 모델 좌표(+Z 앞·+Y 위), 화면 = 게임 캔버스 px.
//  기대:
//   ① 연사 중 당기는 손이 한 주기 안에서 활(손잡이) 곁까지 돌아갔다가(시위에 화살 걸기, 손잡이까지 ≤ .22) 얼굴 옆 기준점까지 당김(기준점까지 ≤ .06)
//   ② 쏘기 바로 앞 마지막 그림: 손이 기준점에 멈춰 있음(조준 정지, ≤ .06)
//   ③ 쏜 직후(주기의 25% 안): 손이 기준점보다 뒤로 빠짐(놓기 반동, z 차 ≥ .03)·활 손이 앞으로 튐
//   ④ 시위(가운데)가 당기는 동안 손을 따라 휨(손까지 ≤ .07), 대기 때는 곧음(원래 자리 ≤ .005)
//   ⑤ 기본 화살 출발: 쏘는 순간 화살 꼬리(오늬)가 3D 시위 기준점 화면 위치에서 영웅 키 0.12배 안 — 오른쪽·왼쪽·위·아래 표적 모두
//   ⑥ 스킬(Q·W): 시전 중 3D 헌터가 활 자세(가중치 ≥ .9)를 잡고 시위를 끝까지 당김(손-기준점 ≤ .06)
//   ⑦ 회귀: 대기 자세 그대로, 그리기 밖 활 자리 R1313 표 그대로, 셰이더 오류 0
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1364/r1364-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{init:{'storyworld.r663.skillgrowth':'{"on":false}'},vp:{width:640,height:400}});await go(p,'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.evaluate(async()=>{try{await ensureImages(heroPaths('hunter'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero='hunter';player.moving=false;player.attackAnim=0;});
await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();const r=window.__STORYWORLD_PHASE1__.controller.state.three;return i.hero==='hunter'&&i.shown&&!!r.scene.getObjectByName('r1305-hunter-3d-shared')?.getObjectByName('r1313-hunter-weapon');},null,{timeout:240000});
await p.waitForTimeout(2000);
await p.evaluate(()=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T,cam=r.camera;const cache=new WeakMap();
 const palm=(body,fore)=>{let c=cache.get(fore);if(c)return c;const sk=body.skeleton,fb=sk.bones.indexOf(fore),sbs=sk.bones.map((x,i)=>x.parent===fore&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||sbs.includes(bi))w+=SW.getComponent(i,k);}if(w<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((a,b)=>a-b),top=ys[Math.floor(ys.length*.98)]||0;c=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){c.add(q);n++;}c.multiplyScalar(1/Math.max(1,n));cache.set(fore,c);return c;};
 const px=v=>{const q=v.clone().project(cam);return [(q.x+1)/2*W,(1-q.y)/2*H];};
 let strIdx=null;
 const measure=()=>{const g=s.getObjectByName('r1305-hunter-3d-shared'),m=g?.getObjectByName('r1305-hunter-3d-model');if(!g||!m||!g.visible)return null;const f=v=>v.toArray().map(x=>+x.toFixed(4));const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3()));
  let body=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r13/.test(x.name||''))body=x;});const o={t:+time.toFixed(3),sk:+(+player.skillAnim||0).toFixed(3),last:window.__STORYWORLD_HUNTER_DRAW_R1336__.inspect().last};
  for(const side of ['R','L']){const B=m.getObjectByName('Forearm_'+side);o['palm'+side]=f(m.worldToLocal(palm(body,B).clone().applyMatrix4(B.matrixWorld)));}
  const H=m.getObjectByName('Head')||m.getObjectByName('Head_Hood');o.head=f(L(H));const DA=window.__STORYWORLD_HUNTER_DRAW_R1336__,D=DA.anchorOffset?DA.anchorOffset():DA.pose().draw;o.anchor=o.head.map((x,i)=>+(x+D[i]).toFixed(4));
  const w=g.getObjectByName('r1313-hunter-weapon');const n={};w.traverse(x=>{if(x.name)n[x.name.replace(/\d+$/,'')]=x;});o.mountQ=w.quaternion.toArray().map(x=>+x.toFixed(4));o.grip=f(L(n.GripSocket||w));
  let sm=null;w.traverse(x=>{if(!sm&&x.isMesh&&/bowstring/i.test(x.material?.name||''))sm=x;});
  if(sm){const P=sm.geometry.attributes.position;if(!strIdx){strIdx=[];const base=sm.geometry.userData.r1364Rest||P.array;for(let i=0;i<P.count;i++)if(Math.abs(base[i*3+1])<.04)strIdx.push(i);}
   const c=new T.Vector3(),v=new T.Vector3();for(const i of strIdx)c.add(v.fromBufferAttribute(P,i));c.multiplyScalar(1/Math.max(1,strIdx.length));o.strLocalBow=f(c);o.str=f(m.worldToLocal(c.clone().applyMatrix4(sm.matrixWorld)));}
  const og=px(m.getWorldPosition(new T.Vector3())),an=px(m.localToWorld(new T.Vector3().fromArray(o.anchor)));o.px={origin:og,anchor:an};return o;};
 window.__r1364Measure=measure;window.__r1364Frames=[];window.__r1364Shots=[];
 const prev=s.onAfterRender;s.onAfterRender=function(...a){try{if(window.__r1364Rec&&window.__r1364Frames.length<3000){const o=measure();if(o)window.__r1364Frames.push(o);}}catch(e){window.__r1364Err=String(e);}return prev?.apply(this,a);};
 const base=makeShot;makeShot=function(...a){const sh=base.apply(this,a);try{if(window.__r1364Rec&&sh&&sh.friendly&&sh.owner==='hero'&&sh.r160Basic&&player.hero==='hunter'){const q=project(sh.x,sh.y),k=Math.hypot(sh.vx,sh.vy)||1,want=actorHeight()*(window.__STORYWORLD_VISUAL_R119__?.inspect?.()?.stats?.standRatio||.98);
   const T0=TILE*zoom,sx=(sh.vx-sh.vy)*T0,sy=(sh.vx+sh.vy)*T0*.5,sl=Math.hypot(sx,sy)||1,half=want*.25;
   window.__r1364Shots.push({t:+time.toFixed(3),tail:[q.x-sx/sl*half,q.y-18*zoom-sy/sl*half],want,pre:measure()});}}catch(e){window.__r1364Err=String(e);}return sh;};});
const V={sub:(a,c)=>a.map((x,i)=>x-c[i]),len:a=>Math.hypot(...a)};const dist=(a,c)=>V.len(V.sub(a,c));const r2=x=>Array.isArray(x)?x.map(v=>+v.toFixed(3)):+(+x).toFixed(3);
const snap=async()=>{await p.evaluate(()=>{window.__r1364Frames=[];window.__r1364Rec=true;});await p.waitForFunction(()=>window.__r1364Frames.length>0,null,{timeout:60000});return p.evaluate(()=>{window.__r1364Rec=false;return window.__r1364Frames[0];});};
const idle=async()=>{await p.evaluate(()=>{clearInterval(window.__r1364A);player.attackAnim=0;route.length=0;player.moving=false;player.direction='right';const e=window.__r1364E;if(e){e.visible=false;e.x+=9999;}});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(400);};
const gameWait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t0,s])=>time>t0+s,[t0,s],{timeout:600000});};
// 표적 하나를 (dx,dy) 에 두고 0.5초(게임 시간)마다 기본 공격
const volley=async(dx,dy,sec)=>{await p.evaluate(([dx,dy])=>{let e=window.__r1364E;if(!e||!(e.hp>0)){e=room.enemies.find(e=>e.hp>0&&!e.boss);window.__r1364E=e;}e.visible=true;e.x=player.x+dx;e.y=player.y+dy;e.hp=e.maxHp=1e9;e.speed=0;e.damage=0;e.spawnState='active';
  window.__r1364Frames=[];window.__r1364Shots=[];window.__r1364Rec=true;clearInterval(window.__r1364A);let last=-9;window.__r1364A=setInterval(()=>{if(time-last>=.5){player.attackCD=0;player.moving=false;try{basicAttack(true);}catch(_){}last=time;}else player.attackCD=Math.max(+player.attackCD||0,.05);},4);},[dx,dy]);
 await gameWait(sec);return p.evaluate(()=>{window.__r1364Rec=false;clearInterval(window.__r1364A);return {frames:window.__r1364Frames.splice(0),shots:window.__r1364Shots.splice(0),err:window.__r1364Err||null};});};
await idle();const rest=await snap();
// ①~④ 오른쪽 표적 연사
{const R=await volley(4,1,3.2);const F=R.frames.filter(f=>f.last&&f.last.w>.9),S=R.shots;console.log('정보 그림',R.frames.length,'활 자세',F.length,'화살',S.length,R.err||'');
 ok(S.length>=4&&F.length>=8,`준비: 화살 ${S.length}발, 활 자세 그림 ${F.length}장`);
 const nock=Math.min(...F.map(f=>dist(f.palmR,f.grip))),full=Math.min(...F.map(f=>dist(f.palmR,f.anchor)));
 ok(nock<=.22,`① 손이 활 곁까지 돌아가 화살을 검 (손잡이까지 최소 ${r2(nock)})`);ok(full<=.06,`① 얼굴 옆 기준점까지 당김 (최소 ${r2(full)})`);
 let preN=0,preOk=0,relN=0,relOk=0,strN=0,strOk=0;
 for(let i=1;i<S.length;i++){const s=S[i],before=R.frames.filter(f=>f.t<s.t-1e-6&&f.t>S[i-1].t+.3&&f.last?.w>.9).pop();if(before){preN++;if(dist(before.palmR,before.anchor)<=.06)preOk++;}
  const after=R.frames.filter(f=>f.t>s.t+1e-6&&f.t<=s.t+.125&&f.last?.w>.9);if(after.length){relN++;if(after.some(f=>f.palmR[2]<=f.anchor[2]-.03&&f.palmL[2]>=0))relOk++;}}
 for(const f of F)if(f.str&&dist(f.palmR,f.anchor)<=.06){strN++;if(dist(f.str,f.palmR)<=.07)strOk++;}
 ok(preN>=2&&preOk>=preN*.8,`② 쏘기 앞 조준 정지: 기준점에 멈춘 그림 ${preOk}/${preN}`);
 ok(relN>=2&&relOk>=relN*.8,`③ 놓기 반동: 쏜 직후 손이 뒤로 빠짐 ${relOk}/${relN}`);
 ok(strN>=2&&strOk>=strN*.8,`④ 시위가 당기는 손을 따라 휨 ${strOk}/${strN}`);}
// ⑤ 네 방향 화살 출발
for(const [name,dx,dy] of [['오른쪽',4,1],['왼쪽',-4,-1],['위',-3,-3],['아래',3,3]]){const R=await volley(dx,dy,1.6);const S=R.shots.filter(s=>s.pre);let good=0,worst=0;
 if(process.env.DBG)console.log(JSON.stringify(S.slice(0,2)));for(const s of S){const d=dist(s.tail,s.pre.px.anchor)/s.want;worst=Math.max(worst,d);if(d<=.12)good++;}
 ok(S.length>=2&&good>=S.length*.8,`⑤ ${name}: 화살 꼬리가 3D 시위 기준점에서 나감 ${good}/${S.length} (최대 ${r2(worst)}×키)`);}
// ⑥ 스킬 Q·W
for(const k of ['q','w']){await idle();await p.evaluate(()=>{const e=window.__r1364E;e.visible=true;e.x=player.x+4;e.y=player.y+1;window.__r1364Frames=[];window.__r1364Rec=true;});
 await p.evaluate(k=>{player.specialCD=0;if(k==='q')special();else window.__STORYWORLD_WER__.cast(k);},k);await gameWait(.6);
 const Fr=await p.evaluate(()=>{window.__r1364Rec=false;return window.__r1364Frames.splice(0);});const sk=Fr.filter(f=>f.sk>0);
 const posed=sk.filter(f=>f.last&&f.last.w>=.9),full=posed.length?Math.min(...posed.map(f=>dist(f.palmR,f.anchor))):9;
 ok(sk.length>=2&&posed.length>=1&&full<=.06,`⑥ 스킬 ${k.toUpperCase()}: 시전 중 활 자세 ${posed.length}/${sk.length}장, 끝까지 당김 (기준점까지 ${r2(full)})`);}
// ⑦ 회귀
await idle();{const o=await snap();ok(dist(o.palmL,rest.palmL)<=.03&&dist(o.palmR,rest.palmR)<=.03,`⑦ 대기 자세 그대로 (왼손 ${r2(dist(o.palmL,rest.palmL))}, 오른손 ${r2(dist(o.palmR,rest.palmR))})`);
 ok(o.strLocalBow&&rest.strLocalBow&&dist(o.strLocalBow,rest.strLocalBow)<=.005,`④ 대기 때 시위는 곧음 (${o.strLocalBow&&r2(dist(o.strLocalBow,rest.strLocalBow))})`);}
{const out=await p.evaluate(()=>window.__r1364Measure());const Q=[.5,-.5,.5,-.5],d=out?Math.max(...out.mountQ.map((x,i)=>Math.abs(Math.abs(x)-Math.abs(Q[i])))):9;ok(d<=.002,`⑦ 그리기 밖 활 자리는 R1313 표 그대로 (차 ${r2(d)})`);}
ok(shaderErrors.length===0,`⑦ 셰이더 오류 0 (${shaderErrors.length})`);
console.log(fail?`R1364 브라우저 실패 ${fail}`:'R1364 브라우저 통과');await b.close();process.exit(fail?1:0);

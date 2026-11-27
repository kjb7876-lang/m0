// R1362 영웅 칼끝이 뭉툭해 보이지 않음 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-27 "영웅윤곽 때문인지 영웅들 칼끝이 뭉툭해보이는데 이거 개선". R1320 무기 테두리 껍질(먹 .02·밝은 .05, 법선 방향으로 고르게 부풀림)이
//  가는 칼끝을 둥근 덩어리로 감싼다는 가설을 실제 메시·껍질 값으로 잰다(칼 묶음 좌표, 칼날 길이 L 로 나눔).
//  ① 껍질이 칼끝 너머로 튀어나온 길이 ≤ 0.5% L(칼끝이 그대로 끝남). ② 칼끝에서 3% L 안쪽 단면에서 껍질 포함 반폭 ≤ 칼 자체 반폭 × 1.5 + 0.5% L(껍질이 칼끝을 둥글게 감싸지 않음).
//  ③ 칼 몸 가운데(칼끝에서 50% L)의 테두리 두께는 그대로(지금 값의 90% 이상) — 테두리를 없애 뾰족해 보이게 만든 게 아님. ④ 오류 0.
//  대상: 칼날 끝 표지(BladeTip)가 있는 영웅 무기 — 환도·EGO(조선 환도 07)·슬레이어(대검).
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1362/r1362-browser.mjs` (HEROES=hwando)
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'hwando,ego,slayer').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
const pick=async h=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(!(i.hero===h&&i.shown))return false;const g=window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared');let t=null,sh=0;g?.traverse(x=>{if(/^BladeTip/.test(x.name))t=x;if(x.name==='r1320-weapon-rim')sh++;});return !!t&&sh>0;},h,{timeout:240000});await p.waitForTimeout(1500);};
const measure=h=>p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,T=r.T,g=r.scene.getObjectByName('r1305-'+h+'-3d-shared');g.updateMatrixWorld(true);
 let tip=null;g.traverse(x=>{if(!tip&&/^BladeTip/.test(x.name))tip=x;});
 // 칼 묶음 = 칼끝 표지의 조상 중 이름이 weapon·greatsword 인 것
 let W=tip;while(W&&!/weapon$|greatsword$/.test(W.name||''))W=W.parent;if(!W)return {err:'no weapon group'};
 const inv=new T.Matrix4().copy(W.matrixWorld).invert(),tipL=tip.getWorldPosition(new T.Vector3()).applyMatrix4(inv);
 // 칼날 축: 칼 묶음 안 메시 점들 가운데 칼끝에서 가장 먼 점 → 칼끝
 const pts=[];W.traverse(x=>{if(x.isMesh&&!/^r13/.test(x.name||'')&&x.visible!==false){const P=x.geometry.attributes.position,M=new T.Matrix4().multiplyMatrices(inv,x.matrixWorld),v=new T.Vector3();for(let i=0;i<P.count;i++)pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}});
 let far=pts[0];for(const q of pts)if(q.distanceTo(tipL)>far.distanceTo(tipL))far=q;
 // 칼날 축은 손잡이(묶음 원점) → 칼끝. 원점이 칼끝과 너무 가까우면 가장 먼 점을 쓴다.
 const base=tipL.length()>.2*far.distanceTo(tipL)?new T.Vector3():far,A=tipL.clone().sub(base).normalize(),L=tipL.clone().sub(base).length();
 const along=q=>q.clone().sub(tipL).dot(A),perp=q=>{const d=q.clone().sub(tipL);return d.addScaledVector(A,-d.dot(A)).length();};
 // 껍질: 실제 그리는 정점 셰이더와 같은 식(법선 × 두께 × 끝 가늘게 계수)
 const shells=[];W.traverse(x=>{if(x.name==='r1320-weapon-ink'||x.name==='r1320-weapon-rim')shells.push(x);});
 const res={L:+L.toFixed(4),shells:shells.length};
 for(const kind of ['ink','rim']){let out=0,nearW=0,midW=0,midW0=0,nearB=0,midB=0;
  for(const sh of shells.filter(s=>s.name==='r1320-weapon-'+kind)){const key=sh.material.customProgramCacheKey?.()||'',w=+(/\|([0-9.]+)$/.exec(key)?.[1]||0),G=sh.geometry,P=G.attributes.position,N=G.attributes.normal,TA=G.attributes.r1362Taper,M=new T.Matrix4().multiplyMatrices(inv,sh.matrixWorld),Nm=new T.Matrix3().getNormalMatrix(M);
   const v=new T.Vector3(),n=new T.Vector3();for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);n.fromBufferAttribute(N,i).normalize();const t=TA?TA.getX(i):1;const e=v.clone().addScaledVector(n,w*t).applyMatrix4(M),e0=v.clone().addScaledVector(n,w).applyMatrix4(M),o=v.clone().applyMatrix4(M);
    const a=along(e);out=Math.max(out,a);const s=-along(o)/L;
    if(s>=0&&s<=.03){nearW=Math.max(nearW,perp(e));nearB=Math.max(nearB,perp(o));}if(s>=.45&&s<=.55){midW=Math.max(midW,perp(e));midW0=Math.max(midW0,perp(e0));midB=Math.max(midB,perp(o));}}}
  res[kind]={out:+(out/L).toFixed(4),near:+(nearW/L).toFixed(4),mid:+(midW/L).toFixed(4),mid0:+(midW0/L).toFixed(4),nearBlade:+(nearB/L).toFixed(4),midBlade:+(midB/L).toFixed(4)};}
 return res;},h);
for(const h of HEROES){await pick(h);const m=await measure(h);console.log('info',h,JSON.stringify(m));if(m.err){ok(false,h+' '+m.err);continue;}
 for(const k of ['ink','rim']){const x=m[k];
  ok(x.out<=.005,`① ${h} ${k}: 껍질이 칼끝 너머로 튀어나온 길이 ${(x.out*100).toFixed(2)}% L (≤ 0.5%)`);
  ok(x.near<=1.5*x.nearBlade+.005,`② ${h} ${k}: 칼끝 3% 안 껍질 포함 반폭 ${(x.near*100).toFixed(2)}% L ≤ 칼 자체 ${(x.nearBlade*100).toFixed(2)}% × 1.5 + 0.5%`);
  ok(x.mid>=.9*x.mid0,`③ ${h} ${k}: 칼 몸 가운데 테두리 그대로 (${(x.mid*100).toFixed(2)}% / 원래 ${(x.mid0*100).toFixed(2)}% L)`);}}
{const s=await p.evaluate(()=>window.__STORYWORLD_HERO_POLISH_R1320__.inspect());ok(s.errors===0,'④ 오류 0 '+JSON.stringify({e:s.errors,l:s.lastError}));}
await b.close();console.log(fail?`\nR1362 브라우저 FAIL ${fail}`:'\nR1362 브라우저 PASS');process.exit(fail?1:0);

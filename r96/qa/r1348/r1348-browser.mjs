// R1348 환도·EGO 칼 쥐기·손목 꺾기 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-26 14:13Z "환도 손에 잘 쥐어서 모션 동작 자연스러워야한다".
//  그리는 순간(scene.onAfterRender, 자세 오버레이가 되돌리기 전)마다 영웅 모델 좌표로 잰다. 주먹 = 아래팔 뼈 꼭짓점 중 손끝 쪽 7cm 무게중심.
//  ① 재현(끄기 키, 환도): 원래 베기 모션에서 칼날~아래팔(팔꿈치→주먹) 각이 25° 아래로 내려간다(실측 3.5°). EGO 는 원래 81° 라 재현 대상 아님.
//  ② 고침: 공격·회복·대기 모든 프레임에서 그 각 ≥ 30°, 주먹~칼자루 ≤ 2cm(섞는 순간 포함, 실측 전 9cm), 베기 뒤 칼끝이 바닥을 긁지 않음(높이 ≥ 0.1).
//  ③ 회귀: 베기 궤적은 남음(칼끝 이동 ≥ .35), 대기 자세는 R1320 그대로(올림각 25~70°), 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1348/r1348-browser.mjs` (HEROES=hwando 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'hwando,ego').split(',');
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
const errs=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID/.test(t))errs.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);});
const pick=async h=>{await p.evaluate(async h=>{try{await ensureImages(heroPaths('hwando'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero='hwando';player.attackAnim=0;player.moving=false;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.shown&&!!window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon');},h,{timeout:240000});await p.waitForTimeout(2500);
 await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;if(!s.__r1348M){s.__r1348M=true;const prev=s.onAfterRender;
  s.onAfterRender=function(...a){const fn=window.__r1348F;if(fn)try{fn();}catch(e){window.__r1348E=String(e);}return prev?.apply(this,a);};}
  const g=s.getObjectByName('r1305-'+h+'-3d-shared'),m=g.getObjectByName('r1305-'+h+'-3d-model'),w=g.getObjectByName('r1313-'+h+'-weapon');
  let body=null,tip=null;m.traverse(x=>{if(!body&&x.isSkinnedMesh&&!x.material?.userData?.r1305Ink&&!/^r1320/.test(x.name||''))body=x;});w.traverse(x=>{if(/^BladeTip/.test(x.name))tip=x;});
  const C=w.parent,B=C.parent;const sk=body.skeleton,fb=sk.bones.indexOf(B),kids=sk.bones.map((x,i)=>x.parent===B&&/^Weapon_Socket/.test(x.name)?i:-1).filter(i=>i>=0),G=body.geometry,P=G.attributes.position,SI=G.attributes.skinIndex,SW=G.attributes.skinWeight,M=new T.Matrix4().multiplyMatrices(sk.boneInverses[fb],body.bindMatrix),v=new T.Vector3(),pts=[];
  for(let i=0;i<P.count;i++){let ww=0;for(let k=0;k<4;k++){const bi=SI.getComponent(i,k);if(bi===fb||kids.includes(bi))ww+=SW.getComponent(i,k);}if(ww<.5)continue;pts.push(v.fromBufferAttribute(P,i).applyMatrix4(M).clone());}
  const ys=pts.map(q=>q.y).sort((x,y)=>x-y),top=ys[Math.floor(ys.length*.98)],palm=new T.Vector3();let n=0;for(const q of pts)if(q.y>=top-.07&&q.y<=top+.02){palm.add(q);n++;}palm.multiplyScalar(1/n);
  const L=o=>m.worldToLocal(o.getWorldPosition(new T.Vector3()));window.__r1348R=[];
  window.__r1348F=()=>{if(!window.__r1348On)return;const el=L(B),pm=m.worldToLocal(B.localToWorld(palm.clone())),gp=L(w),tp=L(tip),f=pm.clone().sub(el),d=tp.clone().sub(gp);
   window.__r1348R.push({t:time,snap:(window.__STORYWORLD_SWORD_COMBO_R1347__?.snapWindow?.(h)===true),atk:window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.attack||0,ang:f.angleTo(d)*180/Math.PI,pg:pm.distanceTo(gp),tipY:tp.y,tip:tp.toArray(),elev:Math.asin(Math.max(-1,Math.min(1,d.y/d.length())))*180/Math.PI,fwd:d.z/d.length()});};},h);};
const swing=async()=>{await p.evaluate(()=>{player.attackAnim=0;route.length=0;player.moving=false;});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await p.waitForTimeout(300);
 await p.evaluate(()=>{window.__r1348R=[];window.__r1348On=true;player.attackCD=0;player.attackAnim=.45;});const t0=await p.evaluate(()=>time);
 await p.waitForFunction(t0=>time-t0>1.4,t0,{timeout:600000});return p.evaluate(()=>{window.__r1348On=false;return window.__r1348R;});};
const stance=v=>p.evaluate(v=>window.__STORYWORLD_HERO_STANCE_R1320__.set(v),v);
for(const h of HEROES){await pick(h);
 for(const d of ['right','front']){await p.evaluate(d=>{player.direction=d;},d);
  await stance(false);const off=await swing();await stance(true);const on=await swing();
  const mn=(a,k)=>Math.min(...a.map(x=>x[k])),mx=(a,k)=>Math.max(...a.map(x=>x[k])),r=x=>+x.toFixed(2);
  // EGO 는 원래 베기에서도 각이 넉넉하다(실측 81°) — 재현은 환도에서만, EGO 는 보정이 원래 모션을 망치지 않는지(②③)만 본다.
  if(h==='hwando')ok(off.length>10&&mn(off,'ang')<25,`① ${h} ${d} 재현(보정 끔): 베기 중 칼날~아래팔 최소 각 ${r(mn(off,'ang'))}° (25° 아래 = 팔 끝 막대)`);
  else console.log(`info ${h} ${d} 보정 끔 최소 각 ${r(mn(off,'ang'))}°`);
  // R1360(사용자 결정 카드 11-27 15:42Z): 빠른 베기(약 70ms) 프레임만 빼고 본다.
  {const o2=on.filter(x=>!x.snap),oi=on.filter(x=>x.snap);ok(o2.length>10&&mn(o2,'ang')>=30,`② ${h} ${d}: 모든 프레임 칼날~아래팔 각 ≥ 30° (최소 ${r(mn(o2,'ang'))}°, ${o2.length} 프레임 — 빠른 베기 ${oi.length} 프레임 제외${oi.length?', 그 안 최소 '+r(mn(oi,'ang'))+'°':''})`);}
  ok(mx(on,'pg')<=.02,`② ${h} ${d}: 섞는 순간 포함 주먹~칼자루 ≤ 2cm (최대 ${r(mx(on,'pg')*100)}cm, 보정 끔 ${r(mx(off,'pg')*100)}cm)`);
  const late=on.filter(x=>x.atk>.5).slice(-6);ok(late.length&&mn(late,'tipY')>=.1,`② ${h} ${d}: 베기 끝에서 칼끝이 바닥을 긁지 않음 (가장 낮은 높이 ${late.length?r(mn(late,'tipY')):'-'}, 보정 끔 ${r(mn(off.filter(x=>x.atk>.5).slice(-6),'tipY'))})`);
  const t0=on.find(x=>x.atk>.9)?.tip;let far=0;for(const x of on)if(t0)far=Math.max(far,Math.hypot(...x.tip.map((v,i)=>v-t0[i])));ok(far>=.35,`③ ${h} ${d}: 베기 궤적이 남음 (칼끝 이동 ${r(far)})`);
  const rest=on[on.length-1];ok(rest.atk<.05&&rest.elev>=25&&rest.elev<=70&&rest.fwd>.25,`③ ${h} ${d}: 대기 자세는 R1320 그대로 (올림각 ${r(rest.elev)}°)`);}}
{const s=await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__.inspect());const e=await p.evaluate(()=>window.__r1348E||null);
 ok(s.errors===0&&!e,'③ 자세 오버레이 오류 0 ('+JSON.stringify({e:s.errors,l:s.lastError,m:e})+')');ok(errs.length===0,'③ 셰이더·WebGL 오류 0 '+errs.slice(0,2).join(' | '));}
await b.close();console.log(fail?`\nR1348 브라우저 FAIL ${fail}`:'\nR1348 브라우저 PASS');process.exit(fail?1:0);

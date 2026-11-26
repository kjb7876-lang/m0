// R1320c 환도 영웅·EGO 칼 = Dots 조선 환도 07 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  사용자 11-26 07:06Z "조선 환도 07 … 환도영웅칼 이거 맞아?" → 카드 "07로 바꾸기".
//  ① 켜짐(기본): 환도·EGO 3D 가 07 파일을 받고 기존 칼 파일은 받지 않는다. R1313 이 읽은 바이트 = 07.
//  ② 칼 모양: 07 노드(BladeTip·TasselPivot)가 있고 기존 칼 노드(HopaeCharmPivot)는 없다. 질감 그림이 붙어 있다.
//     손잡이 원점→칼끝 길이(무기 mount 좌표) = 07 길이×1.1(기존 칼 길이와 5% 안), mount 크기는 R1313 표 그대로.
//  ③ 자세·쥐기 회귀: 그리는 순간 칼끝이 손보다 위·앞(R1320 자세), 오른 주먹 자리 = 칼 손잡이 원점 근처는 R1320 자세 검사가 따로 본다 — 여기서는 R1313·R1320 오류 0.
//  ④ 끄기(storyworld.r1320.sword07=off): 기존 칼 파일을 받고 07 은 받지 않는다. 길이 = 기존 칼, 크기 조정 없음.
//  ⑤ 경계: 영웅을 환도→EGO→환도로 바꿔도 크기를 두 번 곱하지 않는다. 다른 무기(기억사수 총)는 그대로 자기 파일. 셰이더 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1320/r1320-sword07-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const W=640,H=400;let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const LEN07=Math.hypot(.098,1.032)*1.1,LEN0=Math.hypot(.0245,1.117),SCALE={hwando:.8755,ego:.8503};
async function open(init){const {p}=await boot(b,{vp:{width:W,height:H},init});const req=[],sh=[];
 p.on('request',r=>{const u=r.url();if(/\.glb(?:$|\?)/.test(u))req.push(u.replace(/^.*\/assets\//,'assets/'));});
 p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))sh.push(t.slice(0,160));});
 await go(p,process.env.ZONE||'dist00');
 await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
 await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));return {p,req,sh};}
const pick=async(p,h)=>{await p.evaluate(async h=>{const base=h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();if(!(i.hero===h&&i.shown))return false;const r=window.__STORYWORLD_PHASE1__.controller.state.three;return !!r.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon');},h,{timeout:240000});await p.waitForTimeout(2200);};
const read=(p,h)=>p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,T=r.T,g=r.scene.getObjectByName('r1305-'+h+'-3d-shared'),w=g.getObjectByName('r1313-'+h+'-weapon');
 const names=[],tex=new Set();let meshes=0,tip=null;w.traverse(x=>{if(x.name)names.push(x.name);if(/^BladeTip/.test(x.name||''))tip=x;if(x.isMesh&&!/^r1320/.test(x.name||'')){meshes++;for(const m of [].concat(x.material))if(m?.map)tex.add(m.map.uuid);}});
 const len=tip?w.worldToLocal(tip.getWorldPosition(new T.Vector3())).length():0,model=w.children[0]?.children[0];
 return {names,meshes,tex:tex.size,len:+len.toFixed(4),mount:+w.scale.x.toFixed(4),model:+(model?.scale.x||0).toFixed(4),
  w13:window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect(),st:window.__STORYWORLD_HERO_STANCE_R1320__?.inspect?.(),s7:window.__STORYWORLD_HWANDO_SWORD07_R1320__?.inspect?.()};},h);
// ①②③⑤ 켜짐
{const {p,req,sh}=await open(null);
 for(const h of ['hwando','ego','hwando']){await pick(p,h);const o=await read(p,h);
  ok(o.names.some(n=>/^TasselPivot/.test(n))&&o.names.some(n=>/^BladeTip/.test(n))&&!o.names.some(n=>/^HopaeCharmPivot/.test(n)),`② ${h}: 07 노드(술 자리·칼끝) 있음, 기존 칼 노드 없음`);
  ok(o.meshes>=8&&o.tex>=4,`② ${h}: 칼 메시 ${o.meshes}개, 질감 그림 ${o.tex}장`);
  ok(Math.abs(o.len-LEN07)<.01&&Math.abs(o.len/LEN0-1)<.05,`② ${h}: 손잡이→칼끝 ${o.len} = 07×1.1(${LEN07.toFixed(4)}), 기존 칼 길이 ${LEN0.toFixed(4)} 와 5% 안`);
  ok(Math.abs(o.model-1.1)<1e-3,`⑤ ${h}: 칼 모델 크기 ${o.model} = 1.1(두 번 곱하지 않음)`);
  ok(o.w13.errors===0&&(!o.st||o.st.errors===0)&&o.s7?.errors===0,`③ ${h}: R1313·R1320 자세·07 오류 0`);
 }
 // mount 크기(R1313 표)는 그리는 순간이 아니면 표 값 그대로(R1320 자세가 그릴 때만 바꾸고 되돌림)
 const m=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().active);
 ok(Math.abs((m.hwando?.scale??m.ego?.scale)-(m.hwando?SCALE.hwando:SCALE.ego))<1e-3,'② mount 크기 = R1313 표 그대로 '+JSON.stringify(m));
 const l=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().loads);
 ok(l['joseon-hwando.glb']?.bytes===1326232,'① R1313 이 읽은 환도 칼 바이트 = 07 '+JSON.stringify(l['joseon-hwando.glb']));
 ok(req.includes('assets/r1313/joseon-hwando-07.glb')&&!req.includes('assets/r1313/joseon-hwando.glb'),'① 07 파일만 받음(기존 칼 파일 요청 없음)');
 ok(req.filter(u=>u==='assets/r1313/joseon-hwando-07.glb').length===1,'① 07 파일은 한 번만 받음(환도·EGO 공유)');
 await pick(p,'gunner');const g=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__.inspect().loads);
 ok(req.includes('assets/r1313/memory-arc-rifle.glb')&&g['memory-arc-rifle.glb']?.bytes>0,'⑤ 기억사수 총은 자기 파일 그대로');
 ok(sh.length===0,'⑤ 셰이더 오류 0'+(sh.length?' '+sh[0]:''));await p.context().close();}
// ④ 끄기
{const {p,req,sh}=await open({'storyworld.r1320.sword07':'off'});
 for(const h of ['hwando','ego']){await pick(p,h);const o=await read(p,h);
  ok(o.names.some(n=>/^HopaeCharmPivot/.test(n))&&!o.names.some(n=>/^TasselPivot/.test(n)),`④ ${h} 끄기: 기존 칼 노드`);
  ok(Math.abs(o.len-LEN0)<.01&&Math.abs(o.model-1)<1e-6,`④ ${h} 끄기: 길이 ${o.len} = 기존 칼, 크기 조정 없음(${o.model})`);
  ok(o.s7?.on===false&&o.s7.routed===0&&o.s7.sized===0&&o.s7.errors===0,`④ ${h} 끄기: 바꾼 횟수 0`);}
 ok(req.includes('assets/r1313/joseon-hwando.glb')&&!req.includes('assets/r1313/joseon-hwando-07.glb'),'④ 끄기: 기존 칼 파일만 받음');
 ok(sh.length===0,'④ 끄기: 셰이더 오류 0');await p.context().close();}
await b.close();console.log(fail?'\nR1320c 환도 07 브라우저 FAIL '+fail:'\nR1320c 환도 07 브라우저 PASS');process.exit(fail?1:0);

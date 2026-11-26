// R1320 3D 영웅 10명 가독성·재질 보정 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  ① 바닥에서 읽힘: 같은 프레임에서 3D 몸을 뺀 화면과 견줘, 몸 자리 픽셀의 밝기 차 평균·면적이 기준 이상(영웅 10명 모두).
//     고치기 전에는 맵용 수묵 셰이더(R1055)·국지 조명(R451)이 3D 몸에도 걸려 바닥과 같은 먹빛이 되어 묻혔다.
//  ② 맵 셰이더 제외: 3D 영웅 묶음의 모든 메시가 수묵·국지 조명 대상에서 빠짐(나중에 붙는 무기 포함), 셰이더 글에 먹빛 호출 없음.
//  ③ 외곽선: 스킨 몸마다 밝은 바깥 테두리 껍질, 붙은 무기 메시마다 먹·밝은 테두리 껍질. 몸 투명도를 따라감(경계: 0·0.5·1).
//  ④ 영웅 고유색 테두리빛: 페르소나 언주, EGO 언주, 환도 흰빛. 10명 모두 값이 있고 0~1.
//  ⑥ 옷 색 보존: TRELLIS 텍스처는 잘게 쪼개진 조각 사이가 검어, 60px 키로 줄면 밉맵이 검은 틈을 섞어 흰 옷이 갈색 얼룩이 됐다.
//     정점마다 텍스처 색을 구워(정점 색) 그리므로 흰 옷 영웅(환도·기억사수)은 몸 안쪽이 그 자리 바닥보다 밝아야 한다. 모든 영웅은 정점 색이 정점 수만큼 있고 0~1
//     (어두운 옷 영웅의 텍스처 평균은 선형 .009 까지 내려간다 — 슬레이어 실측 — 그래서 '전부 검정이 아님'만 본다).
//  ⑦ 셰이더 컴파일·WebGL 오류 0(덧빛 셰이더가 깨지면 몸이 안 그려져 테두리 껍질만 갈색 덩어리로 남는다 — 실제로 겪은 회귀).
//  ⑤ 회귀: 3D 끔(기본)이면 아무것도 안 함, 끄기 키로 보정을 끄면 덧빛 0·밝은 껍질 숨김, 영웅 바꿔도 오류 0, R1305·R1313 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1320/r1320-browser.mjs` (HEROES=a,b 로 일부만)
import {chromium,boot,go} from '../r444/lib.mjs';
const W=960,H=540,ALL=['hwando','seoha','neon','michaela','lauren','hunter','slayer','gunner','persona','ego'];
const HEROES=(process.env.HEROES||ALL.join(',')).split(',');
// 기준(960×540, 색 차 0~255). 고치기 전 실측(6명): mean 19~28 · edge 16~21 · strong 56~451, 흰 옷 안쪽 밝기 −34(환도)·−41(기억사수).
// 고친 뒤(10명): mean 28~53 · edge 26~45 · strong 453~1021, 흰 옷 안쪽 +70·+58. EGO 는 반투명 형상(사용자 규칙 'EGO 오라 반투명')이라 가장 낮다 → EGO 만 기준의 80%.
// (덧빛 셰이더가 깨져 몸이 안 그려지면 갈색 덩어리라 ①은 오히려 높게 나온다 — ⑥ 흰 옷·⑦ 셰이더 오류가 그 경우를 잡는다.)
const MIN_WHITE=15,MIN_MEAN=30,MIN_EDGE=28,MIN_STRONG=480,EGO_K=.8;
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:W,height:H}});await go(p,process.env.ZONE||'dist00');
const shaderErrors=[];p.on('console',m=>{const t=m.text();if(/Shader Error|WebGLProgram|GL_INVALID|WebGL: INVALID/.test(t))shaderErrors.push(t.slice(0,160));});
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.visible=false;e.x+=9999;}});
const api=()=>p.evaluate(()=>window.__STORYWORLD_HERO_POLISH_R1320__?.inspect?.()??null);
// ⑤ 3D 끔(기본)
await p.waitForTimeout(800);{const i=await api();ok(i&&i.on===true&&i.materials===0&&i.shells===0&&i.errors===0,'⑤ 3D 끔(기본): 보정 대상 0 ('+JSON.stringify(i&&{m:i.materials,s:i.shells,e:i.errors})+')');}
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
const pick=async h=>{await p.evaluate(async h=>{const base=h==='persona'?'lauren':h==='ego'?'hwando':h;try{await ensureImages(heroPaths(base));}catch(_){}player.personaHeroR1113=h==='persona';player.egoSovereignR1046=h==='ego';player.hero=base;player.moving=false;player.attackAnim=0;},h);
 await p.waitForFunction(h=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return i.hero===h&&i.shown;},h,{timeout:240000});await p.waitForTimeout(1800);};
const clip={x:W/2-70,y:H/2-110,width:140,height:150};
// 같은 프레임 비교: 시뮬레이션을 멈추고(그리기는 계속) 3D 묶음만 점으로 줄여 한 번 더 찍는다.
const hide=v=>p.evaluate(v=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene;if(v){if(!s.__r1320T){const prev=s.onBeforeRender;s.__r1320T=prev||(()=>{});s.onBeforeRender=function(...a){const out=prev?.apply(this,a);if(window.__r1320Hide)for(const g of s.children)if(/^r1305-[a-z]+-3d-shared$/.test(g.name||'')){g.scale.setScalar(1e-6);g.updateMatrixWorld(true);}return out;};}}window.__r1320Hide=v;},v);
const pix=buf=>p.evaluate(async s=>{const im=new Image();await new Promise(r=>{im.onload=r;im.src='data:image/png;base64,'+s;});const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return [...g.getImageData(0,0,c.width,c.height).data];},buf.toString('base64'));
// 몸 자리 = 3D 묶음을 뺀 화면과 색이 10 넘게 다른 픽셀. mean = 그 자리 색 차 평균, edge = 가장자리(윤곽) 픽셀의 색 차 평균, strong = 색 차 30 넘는 픽셀 수,
// inner = 가장자리에서 2픽셀 안쪽인 픽셀의 (몸 밝기 − 그 자리 바닥 밝기) 평균(흰 옷이면 +).
const contrast=async()=>{await p.evaluate(()=>{window.__r1320Modal=modal;modal=true;});await p.waitForTimeout(500);
 const a=await pix(await p.screenshot({clip}));await hide(true);await p.waitForTimeout(500);const c=await pix(await p.screenshot({clip}));await hide(false);await p.evaluate(()=>{modal=window.__r1320Modal;});
 const w=clip.width,hh=clip.height,L=(d,k)=>.2126*d[k]+.7152*d[k+1]+.0722*d[k+2],mask=new Uint8Array(w*hh),dc=new Float32Array(w*hh);
 for(let i=0;i<w*hh;i++){const k=i*4;dc[i]=(Math.abs(a[k]-c[k])+Math.abs(a[k+1]-c[k+1])+Math.abs(a[k+2]-c[k+2]))/3;if(dc[i]>10)mask[i]=1;}
 let n=0,sum=0,en=0,es=0,strong=0,inN=0,inS=0;for(let y=3;y<hh-3;y++)for(let x=3;x<w-3;x++){const i=y*w+x;if(!mask[i])continue;n++;sum+=dc[i];if(dc[i]>30)strong++;
  if(!mask[i-1]||!mask[i+1]||!mask[i-w]||!mask[i+w]){en++;es+=dc[i];}
  let deep=true;for(let dy=-2;dy<=2&&deep;dy++)for(let dx=-2;dx<=2;dx++)if(!mask[i+dy*w+dx]){deep=false;break;}if(deep){inN++;inS+=L(a,i*4)-L(c,i*4);}}
 return {area:n,mean:n?sum/n:0,edge:en?es/en:0,strong,inner:inN?inS/inN:0,innerN:inN};};
const scene=h=>p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,g=r.scene.getObjectByName('r1305-'+h+'-3d-shared');if(!g)return null;
 const o={meshes:0,unskipped:[],ink:0,light:0,bodies:0,rims:0,rimsVisible:0,weapons:0,weaponInk:0,weaponRim:0,bodyOpacity:null,rimOpacity:[]};
 const prog=m=>{try{return String(r.renderer.properties.get(m)?.currentProgram?.cacheKey||'');}catch(_){return'';}};
 g.traverse(x=>{if(!x.isMesh||/spirit/.test(x.name||''))return;const n=x.name||'';
  if(n==='r1320-rim-shell'){o.rims++;if(x.visible)o.rimsVisible++;o.rimOpacity.push(+x.material.opacity.toFixed(3));return;}
  if(n==='r1320-weapon-ink'){o.weaponInk++;return;}if(n==='r1320-weapon-rim'){o.weaponRim++;return;}
  o.meshes++;if(!(x.userData?.r1055Skip===true&&x.userData?.r451===true))o.unskipped.push(n||x.type);
  const k=prog(x.material);if(/\|r1055/.test(k))o.ink++;if(/\|r451/.test(k))o.light++;
  if(x.isSkinnedMesh&&n!=='r1305-ink-shell'){o.bodies++;o.bodyOpacity=x.material.opacity;const col=x.geometry.attributes.color,pos=x.geometry.attributes.position;let bad=0,sum=0;if(col)for(let k=0;k<col.count;k+=97)for(const v of [col.getX(k),col.getY(k),col.getZ(k)]){if(!(v>=0&&v<=1))bad++;sum+=v;}
   (o.baked||(o.baked=[])).push({has:!!col,full:!!col&&col.count===pos.count,bad,mean:col?sum/(Math.ceil(col.count/97)*3):0,vc:x.material.vertexColors===true,textured:!!x.material.map});}else if(!x.isSkinnedMesh&&x.visible){let v=true;for(let q=x;q&&q!==g;q=q.parent)if(!q.visible)v=false;if(v)o.weapons++;}});return o;},h);
for(const h of HEROES){await pick(h);const c=await contrast(),s=await scene(h),i=await api();
 const k=h==='ego'?EGO_K:1;ok(c.mean>=MIN_MEAN*k&&c.edge>=MIN_EDGE*k&&c.strong>=MIN_STRONG*k,`① ${h}: 바닥에서 읽힘 — 색 차 평균 ${c.mean.toFixed(1)} ≥ ${MIN_MEAN*k}, 윤곽 ${c.edge.toFixed(1)} ≥ ${MIN_EDGE*k}, 뚜렷한 픽셀 ${c.strong} ≥ ${MIN_STRONG*k} (면적 ${c.area}, 안쪽 밝기 ${c.inner.toFixed(1)}·${c.innerN}px)`);
 ok(s&&s.meshes>0&&s.unskipped.length===0&&s.ink===0&&s.light===0,`② ${h}: 맵 수묵·국지 조명 제외 — 메시 ${s?.meshes}, 빠지지 않은 것 ${s?.unskipped.length}, 먹빛 ${s?.ink}, 국지빛 ${s?.light}`);
 ok(s&&s.bodies>0&&s.rims===s.bodies&&s.rimsVisible===s.rims,`③ ${h}: 몸 ${s?.bodies}개마다 밝은 바깥 테두리 ${s?.rims}(보임 ${s?.rimsVisible})`);
 ok(s&&s.weaponInk===s.weapons&&s.weaponRim===s.weapons,`③ ${h}: 보이는 무기 메시 ${s?.weapons}개마다 먹 ${s?.weaponInk}·밝은 ${s?.weaponRim} 테두리`);
 const bk=s?.baked||[];ok(bk.length>0&&bk.every(v=>!v.textured||(v.has&&v.full&&v.bad===0&&v.vc&&v.mean>.003&&v.mean<.98)),`⑥ ${h}: 텍스처 몸은 정점 색으로 구움 ${JSON.stringify(bk.map(v=>({full:v.full,bad:v.bad,mean:+v.mean.toFixed(3),vc:v.vc})))}`);
 if(h==='hwando'||h==='gunner')ok(c.innerN>=40&&c.inner>=MIN_WHITE,`⑥ ${h}: 흰 옷이 밝게 보임 — 몸 안쪽이 바닥보다 ${c.inner.toFixed(1)} 밝음 ≥ ${MIN_WHITE} (${c.innerN}px)`);
 const rc=i?.rim?.[h];ok(Array.isArray(rc)&&rc.length===3&&rc.every(v=>v>=0&&v<=1),`④ ${h}: 테두리빛 색 ${JSON.stringify(rc)}`);
}
// ④ 고유색
{const i=await api(),r=i?.rim||{},hue=c=>{const [R,G,B]=c||[0,0,0],mx=Math.max(R,G,B),mn=Math.min(R,G,B);if(mx-mn<.02)return null;let h=mx===R?(G-B)/(mx-mn):mx===G?2+(B-R)/(mx-mn):4+(R-G)/(mx-mn);return(h*60+360)%360;},sat=c=>{const mx=Math.max(...(c||[0])),mn=Math.min(...(c||[0]));return mx?(mx-mn)/mx:0;};
 const red=c=>{const h=hue(c);return h!==null&&(h<=28||h>=340)&&sat(c)>.35;};
 ok(red(r.persona),'④ 페르소나 테두리빛 = 언주(붉은 주홍) '+JSON.stringify(r.persona));ok(red(r.ego),'④ EGO 테두리빛 = 언주 '+JSON.stringify(r.ego));
 ok(r.hwando&&sat(r.hwando)<.2&&Math.min(...r.hwando)>.7,'④ 환도 테두리빛 = 흰빛 '+JSON.stringify(r.hwando));ok(ALL.every(h=>Array.isArray(r[h])),'④ 10명 모두 값 있음');}
// ③ 투명도 경계(0·0.5·1) — 마지막 영웅에서 몸 재질 투명도를 바꾸면 밝은 껍질·무기 껍질이 같은 프레임에 따라감
{const h=HEROES[HEROES.length-1];for(const v of [.5,0,1]){const got=await p.evaluate(([h,v])=>new Promise(res=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,g=s.getObjectByName('r1305-'+h+'-3d-shared');const prev=s.onAfterRender;
   const set=()=>g.traverse(x=>{if(x.isSkinnedMesh&&!/^r13(05-ink|20-)/.test(x.name||'')){x.material.opacity=v;x.material.transparent=v<.98;}});
   const tick=s.onBeforeRender;let n=0;s.onBeforeRender=function(...a){set();return tick?.apply(this,a);};
   s.onAfterRender=function(...a){if(++n>=3){s.onAfterRender=prev;s.onBeforeRender=tick;const o=[];g.traverse(x=>{if(/^r1320-(rim-shell|weapon-ink|weapon-rim)$/.test(x.name||''))o.push([+x.material.opacity.toFixed(3),x.material.transparent,x.visible]);});res(o);}return prev?.apply(this,a);};}),[h,v]);
  ok(got.length>0&&got.every(([o,t,vis])=>Math.abs(o-v)<.011&&t===(v<.98)&&(v>0||!vis||o===0)),`③ ${h}: 몸 투명도 ${v} → 껍질 ${got.length}개가 따라감 ${JSON.stringify(got.slice(0,3))}`);}}
// ⑤ 끄기 키
{const h=HEROES[HEROES.length-1];await p.evaluate(()=>window.__STORYWORLD_HERO_POLISH_R1320__?.set?.(false));await p.waitForTimeout(700);const i=await api(),s=await scene(h),c=await contrast();
 ok(i&&i.on===false&&i.strength===0&&s&&s.rimsVisible===0,`⑤ 끄기: 덧빛 세기 ${i?.strength}, 밝은 테두리 보임 ${s?.rimsVisible}`);ok(s&&s.ink===0&&s.light===0,'⑤ 끄기: 맵 수묵 제외(버그 고침)는 그대로');
 ok(c.mean>=MIN_MEAN*.7,`⑤ 끄기: 그래도 바닥에서 읽힘(색 차 ${c.mean.toFixed(1)})`);
 await p.evaluate(()=>window.__STORYWORLD_HERO_POLISH_R1320__?.set?.(true));await p.waitForTimeout(500);const j=await api();ok(j&&j.on===true&&j.strength===1,'⑤ 다시 켜기');}
// ⑤ 영웅 바꾸기 회귀
if(HEROES.length>1){await pick(HEROES[0]);await pick(HEROES[1]);await pick(HEROES[0]);const s=await scene(HEROES[0]);ok(s&&s.rims===s.bodies&&s.unskipped.length===0,'⑤ 영웅을 바꿨다 돌아와도 껍질 수 그대로(중복 없음) '+s?.rims+'/'+s?.bodies);}
ok(shaderErrors.length===0,'셰이더 컴파일·WebGL 오류 0 ('+shaderErrors.length+(shaderErrors[0]?' '+shaderErrors[0]:'')+')');
{const i=await api();ok(i&&i.errors===0,'R1320 오류 0 ('+i?.errors+(i?.lastError?' '+i.lastError:'')+')');
 const h3=await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect());ok(h3.errors===0,'R1305 3D 오류 0 ('+h3.errors+')');
 const w=await p.evaluate(()=>window.__STORYWORLD_HERO_WEAPONS_R1313__?.inspect?.());ok(!w||w.errors===0,'R1313 무기 오류 0 ('+w?.errors+')');}
await b.close();console.log(fail?'R1320 browser FAIL '+fail:'R1320 browser ALL OK');process.exit(fail?1:0);

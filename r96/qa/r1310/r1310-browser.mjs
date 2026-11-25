// R1310 실제 게임(빌드된 site, 헤드리스·소프트웨어 WebGL)에서 3D 영웅 걷기 교체 확인.
// 실행: STORYWORLD_URL=http://127.0.0.1:4396/ node r96/qa/r1310/r1310-browser.mjs   (OUT=폴더 를 주면 걷기 장면 png 저장)
// 보는 것: 영웅마다 Walk 클립이 R1310 으로 바뀌었는지(슬레이어 제외), 페르소나 왼다리 무게가 옮겨졌는지,
// 걷는 동안 실제 스키닝된 메시의 가장 낮은 점이 바닥 근처에 머무는지(뜸·묻힘), 팔이 반대쪽 다리와 엇갈리는지.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const URL_=process.env.STORYWORLD_URL||'http://127.0.0.1:4396/';const OUT=process.env.OUT||'';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:960,height:600}});
const errors=[];page.on('pageerror',e=>errors.push(String(e.message).slice(0,300)));
const rows=[];let fails=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fails++;};
try{
 const response=await page.goto(URL_,{timeout:120000});assert.equal(response.status(),200);
 await page.locator('#campaignNew54').click({timeout:120000});
 await page.locator('#slotConfirmR73').click();
 await page.waitForFunction(()=>started&&!loading&&!window.__STORYWORLD_SAVE_SLOTS_R73__.inspect().busy,null,{timeout:120000});
 await page.evaluate(()=>{for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal)closePanel(true);auto=false;guide=false;settings.autoSkill=false;});
 await page.waitForFunction(()=>window.__STORYWORLD_PHASE1__?.controller?.inspect().active==='three',null,{timeout:120000});
 await page.waitForFunction(()=>window.__STORYWORLD_HERO_WALK3D_R1310__?.inspect().installed===true,null,{timeout:30000});
 ok(true,'R1310 훅이 게임 Three 에 설치됨(3D 영웅을 켜기 전)');
 await page.evaluate(()=>{player.hp=player.maxHp=99999;room.enemies.length=0;});
 const plan=['seoha','neon','lauren','michaela','slayer','hunter','gunner','persona','ego'];
 for(const hero of plan){
  await page.evaluate(async hero=>{
   const base=hero==='persona'?'lauren':hero==='ego'?'hwando':hero;const api=window.__STORYWORLD_HWANDO3D_R1302__;api.set(false);
   await ensureImages(heroPaths(base));player.hero=base;
   const persona=window.__STORYWORLD_PERSONA_HERO_R1113__,ego=window.__STORYWORLD_EGO_SOVEREIGN_R1046__;persona.setForm(false);ego.setForm(false);
   if(hero==='persona'){persona.unlock('silent');persona.setForm(true);}
   if(hero==='ego'){ego.unlock('rc151');ego.setForm(true);}
   player.attackAnim=0;player.direction='right';player.moving=false;api.set(true);
  },hero);
  await page.waitForFunction(hero=>{const v=window.__STORYWORLD_HWANDO3D_R1302__.inspect();return v.hero===hero&&v.ready&&v.shown;},hero,{timeout:90000});
  // 걷기: 게임 시간 기준으로 걷기 무게가 1 이 될 때까지.
  const res=await page.evaluate(async hero=>{
   const api=window.__STORYWORLD_HWANDO3D_R1302__;const scene=window.__STORYWORLD_PHASE1__.controller.state.three.scene;
   let model=null;scene.traverse(o=>{if(o.name==='r1305-'+hero+'-3d-model')model=o;});if(!model)return {err:'no model'};
   let sm=null;model.traverse(o=>{if(o.isSkinnedMesh&&!sm&&!o.material?.userData?.r1305Ink)sm=o;});
   const V=model.position.constructor,t=new V();const P=sm.geometry.attributes.position;
   const step=Math.max(1,Math.floor(P.count/20000));
   // 엔진 길찾기 경로(route)를 이어 주어 엔진이 직접 걷게 한다(자연 조작 아님: 클릭 대신 경로 주입). 막히면 반대쪽으로.
   let dir=1;const hold=()=>{player.attackAnim=0;if(!route.length){dir=-dir;route=[{x:player.x+dir*3,y:player.y+dir*1.5}];}};
   const frame=()=>new Promise(r=>requestAnimationFrame(()=>r()));
   const t0=performance.now();while(api.inspect().weights.walk<.98&&performance.now()-t0<20000){hold();await frame();}
   const samples=[];const bones={};model.traverse(o=>{if(o.isBone)bones[o.name]=o;});
   // 헤드리스 소프트웨어 렌더링은 게임 시간이 실제보다 느리다 → 게임 시간(time) 1.2초(걷기 한 주기 이상) 동안 잰다.
   const t1=performance.now(),g0=time;
   while((time-g0<1.2||samples.length<20)&&samples.length<600&&performance.now()-t1<120000){hold();await frame();
    model.updateMatrixWorld(true);let mn=Infinity;for(let i=0;i<P.count;i+=step){sm.getVertexPosition(i,t);sm.localToWorld(t);model.worldToLocal(t);if(t.y<mn)mn=t.y;}
    const z=n=>{bones[n].getWorldPosition(t);model.worldToLocal(t);return t.z;};
    if(api.inspect().action!=='walk')continue;samples.push({low:mn,thighR:z('Shin_R'),handR:z('Forearm_R'),thighL:z('Shin_L'),handL:z('Forearm_L'),walk:api.inspect().weights.walk});}
   route=[];
   // 발끝 방향: 정강이 무게 ≥.8 정점 중 정강이 뼈 머리에서 가장 먼 6cm 띠(발)를 정강이 뼈 로컬로 → 뼈 축(Y) 성분을 뺀 앞쪽 치우침을
   // 지금 정강이 월드 방향으로 돌려 무리(group, 이동 방향 +Z) 좌표의 z 로 본다(지팡이·창 등 무기 정점은 정강이 무게가 아니라 빠짐).
   const grp=model.parent;grp.updateMatrixWorld(true);const SI=sm.geometry.attributes.skinIndex,SW=sm.geometry.attributes.skinWeight;let toeZ=0;
   for(const n of ['Shin_R','Shin_L']){const bi=sm.skeleton.bones.findIndex(b=>b.name===n),inv=sm.skeleton.boneInverses[bi];const loc=[];
    for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++)if(SI.getComponent(i,k)===bi)w+=SW.getComponent(i,k);if(w<.8)continue;t.fromBufferAttribute(P,i).applyMatrix4(sm.bindMatrix).applyMatrix4(inv);loc.push([t.x,t.y,t.z]);}
    const far=Math.max(...loc.map(p=>p[1]));const ft=loc.filter(p=>p[1]>far-.06);const off=new V(ft.reduce((a,p)=>a+p[0],0)/ft.length,0,ft.reduce((a,p)=>a+p[2],0)/ft.length);
    const wq=sm.skeleton.bones[bi].getWorldQuaternion(new model.quaternion.constructor()),gq=grp.getWorldQuaternion(new model.quaternion.constructor()).invert();
    toeZ+=off.applyQuaternion(wq).applyQuaternion(gq).z/2;}
   return {toeZ,samples,gameSec:time-g0,walk:api.inspect().weights.walk,r1310:window.__STORYWORLD_HERO_WALK3D_R1310__.inspect()};
  },hero);
  if(OUT){fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:OUT+'/game-'+hero+'.png'});}
  if(res.err){ok(false,hero+': '+res.err);continue;}
  const S=res.samples,low=S.map(s=>s.low),corr=(a,b)=>{const m=x=>x.reduce((p,v)=>p+v,0)/x.length,ma=m(a),mb=m(b);let n=0,da=0,db=0;for(let i=0;i<a.length;i++){n+=(a[i]-ma)*(b[i]-mb);da+=(a[i]-ma)**2;db+=(b[i]-mb)**2;}return n/Math.sqrt(da*db||1);};
  // 뼈 위치: 정강이 뼈 머리(무릎)·아래팔 뼈 머리(팔꿈치) 앞뒤. 무릎-팔꿈치 상관이 음수면 엇갈림.
  const cR=corr(S.map(s=>s.thighR),S.map(s=>s.handR)),cL=corr(S.map(s=>s.thighL),S.map(s=>s.handL));
  const row={hero,toeZ:res.toeZ,frames:S.length,gameSec:res.gameSec,lowMin:Math.min(...low),lowMax:Math.max(...low),corrR:cR,corrL:cL,patched:res.r1310.patched[hero]||0,skipped:res.r1310.skipped[hero]||0,sole:res.r1310.sole[hero]||0};
  rows.push(row);console.log('     '+JSON.stringify(row,(k,v)=>typeof v==='number'?+v.toFixed(3):v));
  // 대칭 장화는 치우침이 0 근처라 '뒤로 뚜렷하지 않음(> -2cm)'만 본다. 페르소나(고치기 전 약 -10cm)는 앞으로 5cm 넘게.
  ok(hero==='persona'?row.toeZ>.05:row.toeZ>-.02,hero+`: 발끝이 이동 반대쪽이 아님(${(row.toeZ*100).toFixed(1)}cm${hero==='persona'?', 페르소나 > 5cm':', > -2cm'}) — 뒤로 걷지 않음`);
  if(hero==='slayer'){ok(row.skipped>0&&row.patched===0,'slayer: 이번엔 원래 Walk 그대로(R1309 뒤 맞춤)');continue;}
  ok(row.patched>0&&row.sole>0,hero+': 게임 로더가 만든 Walk 클립이 R1310 으로 바뀜(발바닥 표본 '+row.sole+')');
  ok(row.frames>=20&&row.gameSec>=1.2,hero+': 걷기 장면 '+row.frames+'프레임 · 게임 시간 '+row.gameSec.toFixed(2)+'초 측정');
  ok(row.lowMin>-.02&&row.lowMax<.03,hero+`: 걷는 동안 메시 맨 아래가 바닥 근처(${(row.lowMin*100).toFixed(1)}~${(row.lowMax*100).toFixed(1)}cm, 허용 -2~3cm)`);
  ok(cR<-.3&&cL<-.3,hero+`: 무릎과 같은 쪽 팔꿈치가 엇갈림(상관 R ${cR.toFixed(2)}, L ${cL.toFixed(2)} < -0.3)`);
  if(hero==='persona')ok(res.r1310.personaSkinMoved>500,'persona: 왼쪽 정강이 정점 '+res.r1310.personaSkinMoved+'개를 Shin_L 로 옮김');
 }
 ok(errors.length===0,'페이지 오류 없음 '+JSON.stringify(errors.slice(0,3)));
}catch(e){console.error(e);fails++;}
finally{await browser.close();}
if(OUT)fs.writeFileSync(OUT+'/r1310-browser.json',JSON.stringify(rows,null,1));
console.log(`\nR1310 browser: ${fails?'FAIL '+fails:'PASS'}`);process.exit(fails?1:0);

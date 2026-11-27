// R1349 칼날 화면 보정 연속성 — 브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님).
//  Codex #1039 P2: 그룹 yaw 265° 처럼 중간 방향에서 공격하면 손목 보정 뒤 clearView 가 칼을 원뿔 반대편으로 넘겨 46° 튐.
//  여러 방향(265° 포함)으로 적을 두고 환도·EGO 로 베게 한 뒤, 게임 시간을 1/10 로 늦춰(프레임 ≈ 0.005 게임초) 공격 0.5 게임초 동안 그리는 순간마다 칼날 방향을 잰다.
//  ① 프레임 사이 칼날 방향 변화(영웅 몸 기준 — 몸이 적 쪽으로 도는 회전은 빼고) ≤ max(20°, 같은 방향에서 자세 보정을 끈 원래 베기의 최대 변화 + 10°). 튐은 46~55°. ② 칼날이 카메라 축과 30° 넘게 벌어짐(R1320b 유지).
//  ③ 손목 각(칼날~아래팔) 최소값 보고(참고), 오류 0.
// 실행: 정적 서버(http://127.0.0.1:4410/m0/ → 빌드 site) 뒤 `node r96/qa/r1349/r1349-browser.mjs` (HEROES=hwando, YAWS=265,200)
import {chromium,boot,go} from '../r444/lib.mjs';
const HEROES=(process.env.HEROES||'hwando,ego').split(','),YAWS=(process.env.YAWS||'265,200,135,315,45,90').split(',').map(Number);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,process.env.ZONE||'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>{player.hp=player.maxHp=99999;for(const e of room.enemies){e.speed=0;e.damage=0;e.hp=e.maxHp=1e9;}window.__STORYWORLD_HWANDO3D_R1302__.set(true);
 window.__SLOW=1;const tb=tick;tick=function(dt,...a){return tb.call(this,dt*(window.__SLOW??1),...a);};});
for(const h of HEROES){
 await p.evaluate(async h=>{try{await ensureImages(heroPaths('hwando'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=h==='ego';player.hero='hwando';},h);
 await p.waitForFunction(h=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().shown&&!!window.__STORYWORLD_PHASE1__.controller.state.three.scene.getObjectByName('r1305-'+h+'-3d-shared')?.getObjectByName('r1313-'+h+'-weapon'),h,{timeout:240000});await p.waitForTimeout(2000);
 await p.evaluate(h=>{const r=window.__STORYWORLD_PHASE1__.controller.state.three,s=r.scene,T=r.T;if(!s.__r1349M){s.__r1349M=true;const prev=s.onAfterRender;s.onAfterRender=function(...a){try{window.__r1349F?.();}catch(e){window.__r1349E=String(e);}return prev?.apply(this,a);};}
  const g=s.getObjectByName('r1305-'+h+'-3d-shared'),w=g.getObjectByName('r1313-'+h+'-weapon');let tip=null;w.traverse(x=>{if(/^BladeTip/.test(x.name))tip=x;});
  window.__r1349F=()=>{if(!window.__r1349On)return;const dW=tip.getWorldPosition(new T.Vector3()).sub(w.getWorldPosition(new T.Vector3())).normalize(),d=dW.clone().applyQuaternion(g.getWorldQuaternion(new T.Quaternion()).invert()),c=r.camera.getWorldDirection(new T.Vector3()),L=window.__r1349R,last=L[L.length-1];
   if(last&&last.t===time)return;L.push({t:time,d:d.toArray(),cam:Math.acos(Math.min(1,Math.abs(dW.dot(c))))*180/Math.PI,yaw:g.rotation.y*180/Math.PI,wr:window.__STORYWORLD_HERO_STANCE_R1320__.inspect().last?.[h]?.wrist?.after??null,L:JSON.stringify(window.__STORYWORLD_HERO_STANCE_R1320__.inspect().last?.[h]),W:JSON.stringify(window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights),an:player.attackAnim});};},h);
 const run=yaw=>p.evaluate(async yaw=>{const es=room.enemies.filter(e=>e.hp>0&&!e.boss);es.forEach((e,i)=>{if(i){e.x=player.x+999;e.y=player.y+999;}});const e=es[0],a=yaw*Math.PI/180,rng=HEROES[player.hero].range*.6;
    e.x=player.x+Math.sin(a)*rng;e.y=player.y+Math.cos(a)*rng;player.moving=false;route.length=0;target=null;
    window.__SLOW=1;await new Promise(r=>setTimeout(r,1200));player.attackCD=0;basicAttack(true);window.__SLOW=.1;window.__r1349R=[];window.__r1349On=true;const t0=time;
    await new Promise(r=>{const f=()=>{if(time-t0>.5)r();else setTimeout(f,50);};f();});window.__r1349On=false;window.__SLOW=1;return window.__r1349R;},yaw);
 const jumpOf=R=>{let j=0,at=-1;for(let i=1;i<R.length;i++){const a=R[i-1].d,c=R[i].d,x=Math.acos(Math.max(-1,Math.min(1,a[0]*c[0]+a[1]*c[1]+a[2]*c[2])))*180/Math.PI;if(x>j){j=x;at=i;}}return [j,at];};
 for(const yaw of YAWS){
  await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__.set(false));const [base]=jumpOf(await run(yaw));await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__.set(true));
  const R=await run(yaw);
  const [jump,at]=jumpOf(R),lim=Math.max(20,base+10);
  const cam=Math.min(...R.map(x=>x.cam)),wr=R.map(x=>x.wr).filter(x=>x!=null),yawSeen=R.length?R[R.length>>1].yaw:NaN;
  ok(R.length>=60&&jump<=lim,`① ${h} yaw ${yaw}°(실제 ${((yawSeen%360)+360)%360|0}°): 프레임 사이 칼날 변화 최대 ${jump.toFixed(1)}° (기준 ${lim.toFixed(1)}° = 보정 끈 원래 베기 ${base.toFixed(1)}° + 10°) (${R.length} 프레임, ${at>0?(R[at].t-R[0].t).toFixed(3):'-'}s)`);
  ok(cam>=30,`② ${h} yaw ${yaw}°: 칼날~카메라 축 최소 ${cam.toFixed(1)}°`);
  if(process.env.DUMP)R.forEach((x,i)=>{if(Math.abs(i-at)<=3)console.log(i,x.t.toFixed(3),x.d.map(v=>v.toFixed(2)).join(","),x.W,x.L);});
  console.log(`info ${h} yaw ${yaw}: 손목 각 최소 ${wr.length?Math.min(...wr).toFixed(1):'-'}°`);
 }}
{const s=await p.evaluate(()=>window.__STORYWORLD_HERO_STANCE_R1320__.inspect()),e=await p.evaluate(()=>window.__r1349E||null);ok(s.errors===0&&!e,'③ 오류 0 '+JSON.stringify({e:s.errors,l:s.lastError,m:e}));}
await b.close();console.log(fail?`\nR1349 브라우저 FAIL ${fail}`:'\nR1349 브라우저 PASS');process.exit(fail?1:0);

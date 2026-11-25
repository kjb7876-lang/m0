// R1305 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님): 무한 생존 배치 영웅 타워형.
//  실제 빌드에서 생존 시작(조종 환도, 3D 환도 켬) → 근접 3명(슬레이어·네온·라우렌)+원거리 1명(기억사수) 배치 → 게임 시간 SECS 초.
//  ① 배치 영웅은 자리에서 0.02칸 넘게 움직이지 않음 ② 그릴 때 방향은 좌·우만 ③ 근접 배치 영웅도 3칸 넘게 떨어진 적을 맞힘(원거리 판정)
//  ④ 배치 영웅이 실제 공격(기본 공격 8회 이상) ⑤ 조종 영웅만 3D(R1302 active), 배치 몸은 2D 그림 ⑥ 오류 0.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/site/',SECS=+process.env.SECS||30;let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const ALLIES=['slayer','neon','lauren','gunner'],MELEE=['slayer','neon','lauren'];
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r1302.hwando3d','on');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
const placed=await A(hs=>{window.__L=[];window.__H=[];const base=drawHero;drawHero=function(...a){const pl=player;if(!pl||!pl.r720Ally)return base.apply(this,a);const st=Array.isArray(ctx.commands)?ctx.commands.length:-1;const r=base.apply(this,a);
  let body=null;if(st>=0)for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind==='image'&&c.owner?.kind==='hero'&&c.points){const h=Math.abs(c.points[3][1]-c.points[0][1]);if(!body||h>body.h)body={h,src:String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,'')};}}
  window.__L.push({hero:pl.hero,t:time,x:pl.x,y:pl.y,dir:pl.direction,aa:+pl.attackAnim||0,src:body&&body.src});return r;};
 const he=hitEnemy;hitEnemy=function(e,...a){const pl=player;if(pl&&pl.r720Ally&&e){const X=window.__STORYWORLD_HERO_DEFENSE_R720__,i=X.state().slots.findIndex(q=>q.hero===pl.hero),s=X.allies()[i]||null;/* 근접 몸은 치는 동안 닿는 점에 있으므로 거리는 그 영웅 자리에서 잰다 */window.__H.push({hero:pl.hero,d:Math.hypot(e.x-(s?s.x:pl.x),e.y-(s?s.y:pl.y))});}return he.call(this,e,...a);};
 const D=window.__STORYWORLD_HERO_DEFENSE_R720__;D.qaGive(5000);const z=room.survivalR600.centre,res=[];
 hs.forEach((h,i)=>{player.x=z.x+[1.6,-1.6,1.6,-1.6][i];player.y=z.y+[1.2,1.2,-1.2,-1.2][i];res.push(D.buy(h));});player.x=z.x;player.y=z.y+2;return res;},ALLIES);
ok('배치 완료',placed.every(r=>r.ok&&r.placed),placed);
const anchors=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.allies().map(a=>({x:a.x,y:a.y})));
const t0=await A(()=>time);for(;;){const t1=await A(()=>time);await p.waitForFunction(a=>time>=a,t1+5,{timeout:900000});const n=await A(()=>window.__H.length);if((n>=40&&t1+5>=t0+12)||t1+5>=t0+SECS)break;}
const L=await A(()=>window.__L),H=await A(()=>window.__H),now=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.allies().map(a=>({x:a.x,y:a.y})));
for(const h of ALLIES){const R=L.filter(r=>r.hero===h);let drift=0;for(let i=1;i<R.length;i++)drift=Math.max(drift,Math.hypot(R[i].x-R[0].x,R[i].y-R[0].y));
 ok(`${h}: 그린 장면 있음`,R.length>=20,R.length);ok(`${h}: 자리 고정(최대 이동 ≤ 0.02칸)`,drift<=.02,{drift:+drift.toFixed(4)});
 const dirs=[...new Set(R.map(r=>r.dir))];ok(`${h}: 방향은 좌·우만`,dirs.every(d=>d==='left'||d==='right'),dirs);
 ok(`${h}: 그리기 값 유한`,R.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)));}
{const drift=Math.max(...anchors.map((a,i)=>Math.hypot(a.x-now[i].x,a.y-now[i].y)));ok('배치 자리 전후 같음',drift<=.02,{drift});}
// ③ 근접 영웅 원거리 판정: 적 하나씩을 근접 배치 영웅 자리에서 5칸 떨어진 곳에 붙잡아 두고(나머지 적은 잠깐 멀리) 그 적을 맞히는지 본다
for(const h of MELEE){await A(()=>{window.__H.length=0;});const t1=await A(()=>time);
 for(;;){const t=await A(([h])=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__,i=D.state().slots.findIndex(s=>s.hero===h),an=D.allies()[i];const es=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded);
   if(!window.__PIN||!(window.__PIN.hp>0))window.__PIN=es.find(e=>!e.boss)||null;const e=window.__PIN;if(e){e.x=an.x+(i%2?-5:5);e.y=an.y;e.speed=0;e.hp=Math.max(e.hp,60);}
   for(const o of es)if(o!==e){o.x=an.x+(i%2?-5:5);o.y=an.y+40;}return time;},[h]);if(t>=t1+6)break;await p.waitForTimeout(150);}
 const far=(await A(()=>window.__H)).filter(r=>r.hero===h&&r.d>4.2);ok(`${h}(근접): 자리에서 5칸 떨어진 적을 자리에서 맞힘(원거리 판정)`,far.length>=1,{far:far.length,max:+Math.max(0,...far.map(r=>r.d)).toFixed(2)});
 await A(()=>{window.__PIN=null;});}
const ins=await A(()=>({d:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect(),h3:window.__STORYWORLD_HWANDO3D_R1302__?.inspect?.()}));
ok('배치 영웅이 실제로 공격함(기본 공격 ≥ 8)',ins.d.stats.casts.basic>=8,ins.d.stats.casts);
ok('조종 영웅 3D 환도 켜짐·보임(배치 몸은 3D 아님)',ins.h3&&ins.h3.on===true&&ins.h3.hero==='hwando'&&ins.h3.shown===true,ins.h3&&{on:ins.h3.on,hero:ins.h3.hero,shown:ins.h3.shown,ready:ins.h3.ready,err:ins.h3.lastError});
ok('배치 몸은 2D 그림으로 그려짐',ALLIES.every(h=>L.some(r=>r.hero===h&&r.src)),ALLIES.map(h=>[h,(L.find(r=>r.hero===h&&r.src)||{}).src]));
ok('오류 0(배치·페이지)',ins.d.stats.errors===0&&errs.length===0,{d:ins.d.lastError,errs});
await b.close();console.log(fail?`\nR1305 브라우저 실패 ${fail}`:'\nR1305 브라우저 모두 통과');process.exit(fail?1:0);

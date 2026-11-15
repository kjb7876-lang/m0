// R1050 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님): 무한 생존 배치 영웅이 공격할 때 공격 모션이 나오는가.
//  실제 빌드에서 생존 시작 → 배치 영웅 4명씩 두 판(조종 환도 / 조종 윤서하, 8영웅 모두 배치 쪽으로 한 번씩) → 게임 시간 SECS 초 동안
//  배치 영웅 몸 그리기(drawHero, player=몸)마다 몸 그림 경로·공격 동작 값·위치를 모아 판정한다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SECS=+process.env.SECS||40;let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const ART=/attack|skill|atk|slash|strike|cast|shoot/i;/* 공격·스킬 시트 경로(R143·R437·R389·R425·R1045·R242 등) */
const RUNS=[{main:'hwando',allies:['slayer','neon','lauren','michaela']},{main:'seoha',allies:['gunner','hunter','hwando']}];
const b=await chromium.launch();
for(const run of RUNS){
 const ctx=await b.newContext({viewport:{width:640,height:360}});
 await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
 await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator(`[data-r600hero="${run.main}"]`).click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
 const placed=await A(hs=>{window.__R1050L=[];const base=drawHero;drawHero=function(...a){const pl=player;if(!pl||!pl.r720Ally)return base.apply(this,a);const st=Array.isArray(ctx.commands)?ctx.commands.length:-1;const r=base.apply(this,a);
   let body=null;if(st>=0)for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind==='image'&&c.owner?.kind==='hero'&&c.points){const h=Math.abs(c.points[3][1]-c.points[0][1]);if(!body||h>body.h)body={h,src:String(c.sourcePath||c.image?.src||'').replace(/^.*assets\//,''),walk:!!c.r121Walk};}}
   const bad=[];if(body===null&&st>=0){}/* 몸 그림이 없는 장면은 셈에서 뺀다 */
   window.__R1050L.push({hero:pl.hero,t:time,x:pl.x,y:pl.y,aa:+pl.attackAnim||0,sk:+pl.skillAnim||0,ul:+pl.ultimateAnim||0,hu:+pl.hurtAnim||0,src:body&&body.src,walk:body&&body.walk});return r;};
  const D=window.__STORYWORLD_HERO_DEFENSE_R720__;D.qaGive(5000);const z=room.survivalR600.centre,res=[];
  hs.forEach((h,i)=>{player.x=z.x+[1.6,-1.6,1.6,-1.6][i];player.y=z.y+[1.2,1.2,-1.2,-1.2][i];res.push(D.buy(h));});return res;},run.allies);
 ok(`[${run.main}] 배치 완료`,placed.every(r=>r.ok&&r.placed),placed);
 // 적이 오는 때가 판마다 달라(무작위 등장) 모든 배치 영웅이 공격 장면 6개를 넘길 때까지 5초씩, 최대 SECS 초 게임 시간을 기다린다
 const t0=await A(()=>time);for(;;){const t1=await A(()=>time);await p.waitForFunction(a=>time>=a,t1+5,{timeout:900000});
  const enough=await A(hs=>hs.every(h=>window.__R1050L.filter(r=>r.hero===h&&r.src&&r.attackAnim!==0&&r.aa>0).length>=6),run.allies);if(enough||t1+5>=t0+SECS)break;}
 const L=await A(()=>window.__R1050L);
 for(const h of run.allies){const R=L.filter(r=>r.hero===h&&r.src);const atk=R.filter(r=>r.aa>0&&!(r.hu>0));const shown=atk.filter(r=>ART.test(r.src)&&!r.walk);
  // 공격 동작 중 위치 변화(같은 몸의 이웃 장면)
  let drift=0;for(let i=1;i<R.length;i++){if(R[i].aa>0&&R[i-1].aa>0&&R[i].aa<R[i-1].aa)drift=Math.max(drift,Math.hypot(R[i].x-R[i-1].x,R[i].y-R[i-1].y));}
  const frac=atk.length?shown.length/atk.length:0;
  ok(`[${run.main}] ${h}: 공격 동작 장면이 있음`,atk.length>=6,{atk:atk.length,draws:R.length});
  ok(`[${run.main}] ${h}: 공격 동작 장면의 60% 이상이 공격·스킬 그림(걷기 아님)`,frac>=.6,{frac:+frac.toFixed(2),atk:atk.length,srcs:[...new Set(atk.map(r=>(r.walk?'W ':'')+r.src))].slice(0,6)});
  ok(`[${run.main}] ${h}: 공격 동작 중 제자리(위치 변화 0.01칸 이하)`,drift<=.01,{drift:+drift.toFixed(4)});
  ok(`[${run.main}] ${h}: 그리기 값 유한(NaN 없음)`,R.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)&&Number.isFinite(r.aa)));}
 // 회귀: 배치 영웅은 공격하지 않을 때 여전히 움직인다(표적 쫓기·자리 복귀)
 const moved=run.allies.some(h=>{const R=L.filter(r=>r.hero===h);for(let i=1;i<R.length;i++)if(!(R[i].aa>0)&&Math.hypot(R[i].x-R[i-1].x,R[i].y-R[i-1].y)>.01)return true;return false;});
 ok(`[${run.main}] 회귀: 공격 밖에서는 배치 영웅이 움직인다`,moved);
 const ins=await A(()=>({d:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect(),a:window.__STORYWORLD_ATTACK_ANIM_R143__.inspect().stats.errors,m:window.__STORYWORLD_HERO_MOTION_R895__.inspect().stats.errors}));
 ok(`[${run.main}] 오류 0(배치·R143·R895·페이지)`,ins.d.stats.errors===0&&ins.a===0&&ins.m===0&&errs.length===0,{d:ins.d.lastError,a:ins.a,m:ins.m,errs});
 ok(`[${run.main}] 배치 영웅이 실제로 공격함`,ins.d.stats.casts.basic>=8,ins.d.stats.casts);
 await ctx.close();}
await b.close();console.log(fail?`\nR1050 브라우저 실패 ${fail}`:'\nR1050 브라우저 모두 통과');process.exit(fail?1:0);

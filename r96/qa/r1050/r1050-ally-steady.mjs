// R1050 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽·실기기·자연 플레이 검증 아님): 배치 영웅이 갈팡질팡하지 않는가
//  (사용자 2026-11-15 11:12Z "영웅들도" — R1053 적 규칙과 같은 원칙: 전투 중 대상 쪽 보기, 거리 경계 히스테리시스).
//  생존 판에 배치 영웅 4명 → 게임 시간 SECS 초 동안 배치 영웅 몸 그리기마다 위치·그림 좌우(points 로 읽음)·표적 유무를 모아
//  ① 걷기↔멈춤 바뀜(경계 들락날락) ② 좌우 뒤집힘을 10초당 횟수로 잰다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/',SECS=+process.env.SECS||30;let fail=0;
const MAX_TOGGLE=+process.env.MAX_TOGGLE||2,MAX_FLIP=+process.env.MAX_FLIP||1;/* 10초당 */
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const ALLIES=(process.env.ALLIES||'neon,slayer,gunner,michaela').split(',');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());
await A(hs=>{window.__R1050S=[];const D=window.__STORYWORLD_HERO_DEFENSE_R720__;
 /* 몸 그림 명령을 drawHero(몸 안)에서 집어 그 객체를 남겨 두고, 판이 끝난 뒤 최종 points(배치 영웅 그리기의 좌우 잠금까지 거친 값)로 좌우를 읽는다 */
 const dh=drawHero;drawHero=function(...a){const pl=player;if(!pl||!pl.r720Ally||!Array.isArray(ctx.commands))return dh.apply(this,a);const st=ctx.commands.length;const r=dh.apply(this,a);
  let best=null;for(let i=st;i<ctx.commands.length;i++){const c=ctx.commands[i];if(c.kind!=='image'||c.owner?.kind!=='hero'||!c.points)continue;const sp=String(c.sourcePath||c.image?.src||'');if(/barrier|aura|glow|ring|fx\//i.test(sp))continue;const h=Math.abs(c.points[3][1]-c.points[0][1]);if(!best||h>best.h)best={h,c};}
  const near=(room.enemies||[]).some(e=>e&&e.hp>0&&Math.hypot(e.x-pl.x,e.y-pl.y)<6);
  window.__R1050S.push({c:best&&best.c,hero:pl.hero,t:time,x:pl.x,y:pl.y,aa:+pl.attackAnim||0,near});return r;};
 D.qaGive(5000);const z=room.survivalR600.centre;hs.forEach((h,i)=>{player.x=z.x+[1.6,-1.6,1.6,-1.6][i];player.y=z.y+[1.2,1.2,-1.2,-1.2][i];D.buy(h);});},ALLIES);
const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+SECS,{timeout:1800000});
const L=await A(()=>{const D=window.__STORYWORLD_HERO_DEFENSE_R720__;return window.__R1050S.map(r=>{const c=r.c;return {hero:r.hero,t:r.t,x:r.x,y:r.y,aa:r.aa,near:r.near,flip:c?D.pure.sideOf(c.sourcePath||c.image?.src,c.points[1][0]<c.points[0][0]):null};});});
for(const h of ALLIES){const R=L.filter(r=>r.hero===h);let micro=0,fight=0,frames=0;const flipsAt=[];let f0=null;
 for(let i=1;i<R.length;i++){const a=R[i-1],c=R[i];const dt=c.t-a.t;if(!(dt>0))continue;if(!c.near)continue;fight+=dt;frames++;
  const d=Math.hypot(c.x-a.x,c.y-a.y);if(d>.0005&&d<.03)micro++;/* 한 장면 0.03칸 미만 꼼지락(이동 반경 가장자리·사거리 경계에서 비비기) */
  if(c.flip){if(f0!==null&&c.flip!==f0)flipsAt.push(c.t);f0=c.flip;}/* 화면 좌우(시트 방향+뒤집힘), 위·아래 그림은 건너뜀 */}
 let back=0;for(let i=1;i<flipsAt.length;i++)if(flipsAt[i]-flipsAt[i-1]<.6)back++;/* 0.6초 안에 되뒤집힘 = 번갈아 뒤집힘 */
 const per=fight>0?10/fight:0;const M=+(micro*per).toFixed(1),B=+(back*per).toFixed(1);
 ok(`${h}: 전투 시간 충분`,fight>=8,{fight:+fight.toFixed(1)});
 ok(`${h}: 꼼지락 걸음(한 장면 0.03칸 미만) 10초당 ${MAX_TOGGLE}회 이하`,M<=MAX_TOGGLE,{per10s:M,micro,frames});
 ok(`${h}: 0.6초 안 좌우 되뒤집힘 10초당 ${MAX_FLIP}회 이하`,B<=MAX_FLIP,{per10s:B,back,flips:flipsAt.length});
 ok(`${h}: 위치 유한`,R.every(r=>Number.isFinite(r.x)&&Number.isFinite(r.y)));}
const ins=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect());
const sides=L.filter(r=>r.near&&r.flip).length;ok('좌우 판정이 실제로 읽힘(전투 장면 절반 이상)',sides>=L.filter(r=>r.near).length*.5,{sides,n:L.filter(r=>r.near).length});
ok('오류 0',ins.stats.errors===0&&errs.length===0,{e:ins.lastError,errs});ok('배치 영웅이 공격함',ins.stats.casts.basic>=10,ins.stats.casts);
await b.close();console.log(fail?`\nR1050 갈팡질팡 실패 ${fail}`:'\nR1050 갈팡질팡 모두 통과');process.exit(fail?1:0);

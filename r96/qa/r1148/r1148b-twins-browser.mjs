// R1148b 브라우저 검사(헤드리스·소프트웨어 렌더링 — 그래픽/실기기/자연 플레이 검증 아님):
//  사용자 2026-11-18 07:59Z "같은 몸 금지 규칙 개선 … 모든모드에서 구분되게 각각 독립적이게".
//  환도와 EGO, 라우렌과 페르소나를 한 판에 같이 두고, 한쪽이 쓴 이어지는 기술(지연 작업·결계)이 다른 쪽 차례에 지워지거나 덮이지 않는지 본다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';let fail=0;
const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,400):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
const waitGame=async secs=>{const t0=await A(()=>time);await p.waitForFunction(a=>time>=a,t0+secs,{timeout:240000});};
const calm=async()=>{await A(()=>{player.attackCD=Math.max(player.attackCD||0,4);player.specialCD=Math.max(player.specialCD||0,4);});await p.waitForFunction(()=>{const s=window.__STORYWORLD_DANCE_FREE_R706__?.state?.();return !s||(!s.body&&!s.dancing);},null,{timeout:120000});};
async function start(hero){await p.goto(URL);await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await A(()=>{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('qa');window.__STORYWORLD_PERSONA_HERO_R1113__.unlock('qa');});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="'+hero+'"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:240000});
 await A(()=>window.__STORYWORLD_SURVIVAL_R600__.skipNarration());await A(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;d.qaGive(5000);d.qaSkills(true);});}
async function place(id,dx,dy){await calm();return A(([id,dx,dy])=>{const z=room.survivalR600.centre,d=window.__STORYWORLD_HERO_DEFENSE_R720__;player.x=z.x+dx;player.y=z.y+dy;const r=d.buy(id);return r.ok&&r.placed?{ok:true}:(r.ok?d.placeHere(id):r);},[id,dx,dy]);}
const slotOf=id=>A(id=>window.__STORYWORLD_HERO_DEFENSE_R720__.state().slots.findIndex(s=>s.hero===id),id);

// ① 환도 조종 + EGO 배치
await start('hwando');
let r=await place('ego',2.5,1);ok('환도 조종 중 EGO 배치 가능',r&&r.ok===true,r);
let s=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.state());ok('조종 = 환도, 자리 = EGO',s.main==='hwando'&&s.slots.some(x=>x.hero==='ego'),s);
await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.qaFreeze(true));
// EGO 몸만 E·R 을 쓴다(조종 환도는 가만히) → 환도 연계(R590)의 지연 작업이 조종 환도 차례에 지워지지 않고 실행돼야 한다
const i0=await slotOf('ego');const c0=await A(()=>({...window.__STORYWORLD_HWANDO_CHAIN_R590__?.inspect?.().stats}));
await A(()=>{window.__r1148hold=setInterval(()=>{player.specialCD=Math.max(player.specialCD||0,50);player.attackCD=Math.max(player.attackCD||0,5);},50);});/* 조종 환도는 Q 를 못 쓰게 묶어 둔다 */
const cast=await A(i=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;return ['q','e','r'].map(k=>d.qaCast(i,k));},i0);
await waitGame(3);await A(()=>clearInterval(window.__r1148hold));const c1=await A(()=>({...window.__STORYWORLD_HWANDO_CHAIN_R590__?.inspect?.().stats}));
const fired=k=>(+c1[k]||0)-(+c0[k]||0);
ok('EGO 몸 Q(조종 환도는 묶임) → 환도 연계 검풍이 EGO 몸으로 실행됨(winds+1·blades>0, 조종 환도 차례에 지워지지 않음)',cast[0]===true&&fired('winds')===1&&fired('blades')>0,{cast,c0,c1});
const body=await A(i=>{const b=window.__STORYWORLD_HERO_DEFENSE_R720__.bodies()[i];return b&&{h:b.hero,e:b.egoSovereignR1046===true};},i0);
ok('EGO 몸은 EGO 표식, 조종 환도는 표식 없음',body&&body.h==='hwando'&&body.e&&!(await A(()=>player.egoSovereignR1046===true)),body);
// ② 헌터 조종 + 라우렌·페르소나 동시 배치, 둘 다 고유기(Q 중력 결계 R561)
await start('hunter');
r=await place('lauren',2.5,1);ok('라우렌 배치',r&&r.ok===true,r);
r=await place('persona',-2.5,1);ok('라우렌 배치 중 페르소나 배치 가능',r&&r.ok===true,r);
await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.qaFreeze(true));
const g0=await A(()=>({...window.__STORYWORLD_LAUREN_GRAVITY_R561__?.inspect?.().stats||window.__STORYWORLD_LAUREN_GRAVITY_R561__?.stats}));
const li=await slotOf('lauren'),pi=await slotOf('persona');
const qc=await A(([a,b])=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;return [d.qaCast(a,'q'),d.qaCast(b,'q')];},[li,pi]);
await waitGame(4);
const g1=await A(()=>({...window.__STORYWORLD_LAUREN_GRAVITY_R561__?.inspect?.().stats||window.__STORYWORLD_LAUREN_GRAVITY_R561__?.stats}));
ok('라우렌·페르소나 결계가 서로 덮이지 않고 둘 다 무너짐(collapses +2)',(g1.wells-g0.wells)===2&&(g1.collapses-g0.collapses)===2,{qc,g0,g1});
const bodies=await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.bodies().map(b=>b&&{h:b.hero,p:b.personaHeroR1113===true}));
ok('라우렌 몸 표식 없음·페르소나 몸 표식 있음',bodies.some(x=>x&&x.h==='lauren'&&!x.p)&&bodies.some(x=>x&&x.h==='lauren'&&x.p),bodies);
ok('R720 오류 0',await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().stats.errors===0),await A(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.inspect().lastError));
ok('페이지 오류 없음',errs.length===0,errs);
await b.close();console.log(fail?'R1148b twins: '+fail+' FAIL':'R1148b twins: ALL PASS');process.exit(fail?1:0);

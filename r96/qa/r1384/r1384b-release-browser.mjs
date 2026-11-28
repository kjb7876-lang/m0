// R1384b 3D 헌터: 시위를 끝까지 당겨 장전한 뒤 '놓는 순간' 화살이 나가게(사용자 2026-11-28 08:37Z "헌터모션 활이 장전된후 놓으면 활이 나가게 지금은 반대인듯")
//  고치기 전(main 0f0fd957) 헤드리스 실측: 기본 공격을 누르는 그 순간 화살이 날아가고, 그 뒤에 시위 걸기→당기기→조준 정지 → 쏜 다음에 장전하는 꼴이었다.
//  브라우저 검사(헤드리스 Chromium + SwiftShader, 그래픽 검증 아님). 게임 시간 기준.
//   ① 한 발(대기 → 기본 공격 한 번): 화살이 날기 시작한 그림 직전이 '조준 정지(hold)' 또는 당김 ≥ .6 인 '당기기', 날기 전 그림에 '당기기(draw)' 가 있음
//   ② 한 발: 화살이 날기 시작한 뒤에는 다시 당기기·조준 정지가 나오지 않음(쏜 뒤 장전 없음), 날기 시작 직후 .12초 안에 놓기·반동
//   ③ 한 발: 누른 뒤 날기까지 지연 ≤ .21초(당기는 동안만), 화살은 하나도 사라지지 않음(누른 화살 수 = 난 화살 수)
//   ④ 연사(.39초마다): 날기 시작 간격 = 누른 간격(±.06초) — 쏘는 박자 그대로, 화살마다 ① 이 성립(80% 이상)
//   ⑤ 끄기(R1364 set(false)) 또는 2D 헌터면 예전처럼 누르는 즉시 날아감(지연 0)
// 실행: 정적 서버(http://127.0.0.1:4410/m0/) 뒤 `node r96/qa/r1384/r1384b-release-browser.mjs`
import {chromium,boot,go} from '../r444/lib.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const {p}=await boot(b,{vp:{width:640,height:400}});await go(p,'dist00');
let fail=0;const ok=(c,m)=>{console.log((c?'ok  ':'FAIL')+' '+m);if(!c)fail++;};
await p.evaluate(()=>window.__STORYWORLD_HWANDO3D_R1302__.set(true));
await p.evaluate(async()=>{try{await ensureImages(heroPaths('hunter'));}catch(_){}player.personaHeroR1113=false;player.egoSovereignR1046=false;player.hero='hunter';player.moving=false;player.hp=player.maxHp=99999;player.attackAnim=0;});
await p.waitForFunction(()=>{const i=window.__STORYWORLD_HWANDO3D_R1302__.inspect();const r=window.__STORYWORLD_PHASE1__.controller.state.three;return i.hero==='hunter'&&i.shown&&!!r.scene.getObjectByName('r1305-hunter-3d-shared')?.getObjectByName('r1313-hunter-weapon');},null,{timeout:240000});
await p.evaluate(()=>{const E=room.enemies.filter(e=>e.hp>0);const e0=E.find(e=>!e.boss)||E[0];for(const e of E){e.speed=0;e.damage=0;if(e!==e0){e.visible=false;e.x+=9999;}}e0.hp=e0.maxHp=1e9;e0.x=player.x+4;e0.y=player.y+1;e0.spawnState='active';e0.visible=true;
 window.__F=[];window.__REQ=[];window.__rec=false;const seen=new Set();
 const mine=s=>s&&s.friendly&&s.owner==='hero'&&s.r160Basic===true;
 const s=window.__STORYWORLD_PHASE1__.controller.state.three.scene;const prev=s.onAfterRender;
 s.onAfterRender=function(...a){try{if(window.__rec){const i=window.__STORYWORLD_HUNTER_DRAW_R1336__.inspect();const nw=[];for(const q of projectiles)if(mine(q)&&!seen.has(q)){seen.add(q);nw.push(q.id);}
  const C=window.__STORYWORLD_HUNTER_CYCLE_R1364__,ci=C.inspect(),tl=C.timeline?C.timeline(time,ci.lead,ci.cycle.at,ci.cycle.ps):null;window.__F.push({t:time,st:i.last?.stage||'-',w:i.last?.w??0,wa:tl?tl.wa:null,fly:nw.length,ids:nw});}}catch(e){window.__err=String(e);}return prev?.apply(this,a);};
 const base=basicAttack;basicAttack=function(...a){const n0=(window.__MADE||0);const r=base.apply(this,a);if(window.__rec&&(window.__MADE||0)>n0)window.__REQ.push({t:time,n:(window.__MADE||0)-n0,by:window.__BY||''});return r;};
 const ms=makeShot;makeShot=function(...a){const q=ms.apply(this,a);if(mine(q))window.__MADE=(window.__MADE||0)+1;return q;};});
const gameWait=async s=>{const t0=await p.evaluate(()=>time);await p.waitForFunction(([t0,s])=>time>t0+s,[t0,s],{timeout:600000});};
const idle=async()=>{await p.evaluate(()=>{clearInterval(window.__A);player.attackAnim=0;player.moving=false;});await p.waitForFunction(()=>window.__STORYWORLD_HWANDO3D_R1302__.inspect().weights.idle>.97,null,{timeout:60000});await gameWait(.3);};
const run=async(every,sec)=>{await p.evaluate(e=>{window.__F=[];window.__REQ=[];window.__rec=true;player.attackCD=0;let last=-9;clearInterval(window.__A);
  window.__A=setInterval(()=>{if(e>0?time-last>=e:last<0){player.attackCD=0;player.moving=false;try{basicAttack(true);}catch(_){}last=time;}else player.attackCD=Math.max(+player.attackCD||0,.2);},4);},every);
 await gameWait(sec);return p.evaluate(()=>{window.__rec=false;clearInterval(window.__A);return {F:window.__F.splice(0),R:window.__REQ.splice(0),err:window.__err||null};});};
// 날기 시작한 그림마다: 직전 단계, 누른 뒤 그 앞 그림에 draw 가 있었는지, 그 뒤 다음 누름 전까지 draw/hold 가 다시 나오는지
const judge=(F,R)=>{const out=[];const req=R.map(r=>r.t);for(let i=0;i<F.length;i++){if(!F[i].fly)continue;const t=F[i].t,r0=[...req].filter(x=>x<=t+1e-6).pop();const nextReq=req.find(x=>x>t+1e-6)??Infinity;
  const before=F.slice(0,i).filter(f=>f.t>=r0-1e-6);const after=F.slice(i+1).filter(f=>f.t<nextReq-1e-6&&f.w>.5);
  out.push({t,delay:t-r0,prev:F[i-1]?.st,prevWa:F[i-1]?.wa,drew:before.some(f=>f.st==='draw'),reload:after.filter(f=>f.st==='draw'||f.st==='hold').length,snap:after.filter(f=>f.t<=t+.12).some(f=>f.st==='release'||f.st==='follow'||f.st==='return')});}return out;};
// 장전 판정: 날기 직전 그림이 조준 정지이거나 거의 다 당긴 당기기(당김 ≥ .6 — 헤드리스는 그림 사이가 게임 .05초라 짧은 정지를 건너뛸 수 있음), 그 앞에 당기기 그림
const loaded=j=>(j.prev==='hold'||(j.prev==='draw'&&(j.prevWa??0)>=.6))&&j.drew;
// ① ② ③ 한 발
await idle();
{const {F,R,err}=await run(0,1.1);const J=judge(F,R);const made=R.reduce((s,r)=>s+r.n,0),flew=F.reduce((s,f)=>s+f.fly,0);console.log('정보 한 발',JSON.stringify(J.map(j=>({...j,delay:+j.delay.toFixed(3)}))),'누름',R.length,'만든 화살',made,'난 화살',flew,err||'');
 const j=J[0];ok(!!j&&loaded(j),`① 한 발: 날기 직전 그림이 당겨진 자세 (${j?.prev}, 당김 ${j?.prevWa?.toFixed?.(2)}), 그 앞에 당기기 (${j?.drew})`);
 ok(!!j&&j.reload===0&&j.snap,`② 한 발: 쏜 뒤 다시 장전 없음 (당기기·정지 그림 ${j?.reload}), 날자마자 놓기·반동 (${j?.snap})`);
 ok(!!j&&j.delay<=.21&&made>=1&&flew===made,`③ 한 발: 누른 뒤 ${j?+j.delay.toFixed(3):'-'}초에 날기(≤ .21), 만든 ${made} = 난 ${flew}`);}
// ④ 연사
await idle();
{const {F,R}=await run(.39,2.6);const J=judge(F,R);const dt=J.slice(1).map((j,i)=>j.t-J[i].t),rq=R.slice(1).map((r,i)=>r.t-R[i].t);const avgF=dt.reduce((a,b)=>a+b,0)/Math.max(1,dt.length),avgR=rq.reduce((a,b)=>a+b,0)/Math.max(1,rq.length);
 const good=J.filter(loaded).length;console.log('정보 연사 날기 간격',dt.map(x=>+x.toFixed(3)).join(','),'누른 간격',rq.map(x=>+x.toFixed(3)).join(','));
 ok(J.length>=4&&Math.abs(avgF-avgR)<=.06,`④ 연사: 날기 간격 평균 ${avgF.toFixed(3)} = 누른 간격 ${avgR.toFixed(3)} (±.06, 화살 ${J.length})`);
 ok(J.length>=4&&good>=J.length*.8,`④ 연사: 화살마다 당겨 정지한 뒤 날기 ${good}/${J.length}`);}
// ⑤ 끄기
await idle();await p.evaluate(()=>window.__STORYWORLD_HUNTER_CYCLE_R1364__.set(false));
{const {F,R}=await run(0,.6);const J=judge(F,R);ok(!!J[0]&&J[0].delay<=.07,`⑤ 끄면 누르는 즉시 날기 (${J[0]?+J[0].delay.toFixed(3):'-'}초)`);}
await p.evaluate(()=>window.__STORYWORLD_HUNTER_CYCLE_R1364__.set(true));
console.log(fail?`FAIL ${fail}`:'PASS');await b.close();process.exit(fail?1:0);

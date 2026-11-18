// R1181 브라우저 검사(헤드리스 Chromium — 실기기 GPU·아이폰 사파리 아님): 휴대폰 무한생존에서 겹친 경험치 조각 그리기 줄이기.
//  SW_URL(기본 http://127.0.0.1:4410/m0/)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,500):'');if(!c)fail++;};
const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
async function run(mobile){const ctx=await b.newContext(mobile?{viewport:{width:844,height:390},deviceScaleFactor:3,isMobile:true,hasTouch:true}:{viewport:{width:844,height:390},deviceScaleFactor:1});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));
 await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});await p.mouse.click(5,5).catch(()=>{});
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="slayer"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:200});
 await p.evaluate(()=>{setInterval(()=>{try{player.hp=maxHP();if(modal){const b=document.getElementById('r600Pick0');b&&b.click();}}catch(_){}},250);});
 const res={};
 for(const [label,n,r] of [['small',30,.15],['pile',200,.15]]){
  // 영웅에서 3칸 떨어진 곳(끌어당김 2.8 밖)에 조각을 놓고, 그동안 영웅·몹은 멈춘다(조각이 주워지지 않게).
  const before=await p.evaluate(([n,r])=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;window.__r1181Freeze=true;player.x+=0;const gx=player.x+3.6,gy=player.y;return Z.qaGems(n,gx,gy,r);},[n,r]);
  await p.waitForTimeout(1500);
  const s=await p.evaluate(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const st=Z.inspect().stats;const r3=window.__STORYWORLD_PHASE1__.controller.state.three.commands;let rows=0;for(const [k,row] of r3.rows){if(row.mesh.visible&&row.image&&/sv-gem-01/.test(row.image.src||''))rows++;}
   return {gems:Z.state().gems,drawn:st.gemDrawn,onScreen:st.gemOnScreen,rows,errors:st.errors};});
  // 한 프레임에 정화 구슬(조각·빛줄기·체력 막대 포함)을 몇 번 그리는지 — R266 '배우 먼저' 미리 그리기와 깊이순 그리기에서 두 번 그려지던 문제
  s.corePerFrame=await p.evaluate(async()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;const a=Z.inspect().stats.coreDraws||0;let f=0;await new Promise(r=>{const g=()=>{if(++f>=12)return r();requestAnimationFrame(g);};requestAnimationFrame(g);});return ((Z.inspect().stats.coreDraws||0)-a)/12;});
  res[label]={added:before,...s};
  await p.evaluate(()=>{});}
 res.errs=errs;await ctx.close();return res;}
const M=await run(true),D=await run(false);
console.log(JSON.stringify({mobile:M,desktop:D}));
ok('mobile small pile (≤ 40 on screen): every gem drawn (unchanged)',M.small.onScreen>0&&M.small.drawn===M.small.onScreen,M.small);
ok('mobile 230 gems in piles: far fewer gem draws (≤ 60) — gems themselves all still there',M.pile.onScreen>150&&M.pile.drawn<=60&&M.pile.rows<=60&&M.pile.gems>=200,M.pile);
ok('desktop (lowFx off): every on-screen gem drawn (unchanged)',D.pile.onScreen>150&&D.pile.drawn===D.pile.onScreen&&D.pile.rows>=150,D.pile);
ok('mobile: purification core (gems, beams, bar) drawn once per frame, gem meshes = gems drawn (no duplicate)',M.small.corePerFrame===1&&M.small.rows===M.small.drawn&&M.pile.rows===M.pile.drawn,{s:M.small,p:M.pile});
ok('desktop: core drawn once per frame, gem meshes = gems drawn',D.small.corePerFrame===1&&D.small.rows===D.small.drawn&&D.pile.rows===D.pile.drawn,{s:D.small,p:D.pile});
ok('no page errors / survival errors',!M.errs.length&&!D.errs.length&&!M.pile.errors&&!D.pile.errors,{m:M.errs,d:D.errs});
await b.close();console.log(fail?'FAILED '+fail:'ALL PASS');process.exit(fail?1:0);

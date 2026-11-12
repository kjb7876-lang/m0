// R850 무한 생존 지역 전환 검사(헤드리스 — 실제 망·GPU 시간은 미검증).
//  ① 다음 지역으로 넘어가는 동안(불러오기 창이 뜨기 전 빈 시간 포함) HUD 가 '다음 지역으로 이동' 을 보여 준다.
//  ② 지역 정화 완료(정화 대기 2.2초) 동안 다음 지역 지도 그림(def.paths)을 미리 읽어, 넘어갈 때 대부분 이미 준비돼 있다.
//  ③ 전환 시간(go 호출 → 새 지역 준비)을 재서 출력한다.
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);const {chromium}=req('playwright');
const URL=process.env.SW_URL||'http://127.0.0.1:4410/m0/';
let fail=0;const ok=(m,c,x)=>{console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)fail++;};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,200)));const A=(f,a)=>p.evaluate(f,a);
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').waitFor({timeout:180000});
await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
const ready=()=>p.waitForFunction(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;return Z.here()&&!loading&&Z.state().ready;},null,{timeout:240000,polling:100});
await ready();
// 서사를 건너뛰고 몹이 그만 나올 때까지 빨리 감은 뒤 모두 처치 → 보스 → 처치 → 정화 완료
await A(()=>{window.__STORYWORLD_SURVIVAL_R600__.skipNarration();});
const clearNow=()=>A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;for(let k=0;k<4000&&Z.state().phase!=='clear';k++){if(modal){document.getElementById('r600Pick0')?.click();if(modal)closePanel(true);}player.hp=maxHP();if(Z.narr().playing)Z.skipNarration();
  for(const e of room.enemies)if(e.hp>0&&!e.deadRecorded&&time>(e.graceUntil||0)){try{hitEnemy(e,1e9);}catch(_){}}tick(1/30);}return Z.state().phase;});
ok('stage reaches clear (precondition)',(await clearNow())==='clear');
const next=await A(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__,st=Z.state(),id=Z.stageIds()[st.i+1];return {id,paths:[...new Set(regionById[id].paths)]};});
const readyFrac=()=>A(paths=>{let n=0;for(const q of paths){const r=readyImage(q);if(r&&r.image&&(r.image.naturalWidth||r.image.width)>0)n++;}return n/paths.length;},next.paths);
const f0=await readyFrac();
// 정화 대기(게임 2.2초) 동안: 벽시계 2.5초 그대로 흘림(조각 흡수·대기)
await A(()=>{window.__goAt=0;window.__hudMoving=0;window.__panelAt=0;const op=openPanel;openPanel=function(h,...a){if(!window.__panelAt&&/IMAGE LOADING/.test(h))window.__panelAt=performance.now();return op.call(this,h,...a);};
 const iv=setInterval(()=>{const Z=window.__STORYWORLD_SURVIVAL_R600__;if(!window.__goAt&&Z.state().i===1)window.__goAt=performance.now();const t=document.querySelector('#r600Hud .s')?.textContent||'',on=document.getElementById('r600Hud')?.classList.contains('on');if(window.__goAt&&!window.__panelAt&&on&&/다음 지역/.test(t))window.__hudMoving++;if(Z.state().ready&&Z.state().i===1&&!loading)clearInterval(iv);},50);});
await p.waitForTimeout(1200);const fMid=await readyFrac();
await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.state().i===1,null,{timeout:120000,polling:50});
const fAtGo=await readyFrac();
await ready();
const m=await A(()=>({gap:Math.round((window.__panelAt||performance.now())-window.__goAt),total:Math.round(performance.now()-window.__goAt),hudMoving:window.__hudMoving}));
console.log('next',next.id,'paths',next.paths.length,'ready before clear wait',f0.toFixed(2),'mid',fMid.toFixed(2),'at go',fAtGo.toFixed(2),'gap ms',m.gap,'go→ready ms',m.total);
ok('HUD says it is moving to the next stage during the blank gap before the loading panel',m.hudMoving>0,m);
ok('next stage map art is prefetched during the clear wait (≥ 80% ready when the stage switch starts)',fAtGo>=.8,{f0,fMid,fAtGo});
ok('no page errors',errs.length===0,errs);
await b.close();console.log(fail?('FAILED '+fail):'ALL PASS');process.exit(fail?1:0);

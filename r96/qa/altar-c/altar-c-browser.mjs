// 제단 옆 C 가로채기 검사(헤드리스 브라우저, 그래픽 검증 아님) — 2026-11-18 스토리 사몽(DREAM) 실플레이 dist03 에서 재현:
//  중간보스를 잡아 bossReady 가 된 뒤 길잡이가 제단(15,13) 1칸 옆(14.96,12.04)에서 C 를 누르면, 옛 R61 포탈 층이 자기 포탈 자리(제단 근처)를 보고
//  travel 을 부르고, R72 서사 포탈이 '보스 처치와 기억 복원이 필요합니다.'로 거절해 제단 상호작용이 아예 안 불렸다 → 길잡이가 90초 넘게 멈춤.
// 검사: ① dist03 DREAM bossReady 에서 (14.96,12.04) C → complete ② 같은 자리에서 '보스 처치와 기억 복원' 알림이 안 뜸
//       ③ 회귀: complete 뒤 R72 다음 포탈 자리에서 C → 다음 지역으로 이동 ④ STORY dist03 에서도 같은 자리 C 에 가로채기 알림 없음 ⑤ 페이지 오류 0
import {createRequire} from 'node:module';
let chromium;try{({chromium}=createRequire(import.meta.url)('playwright'));}catch(_){({chromium}=createRequire('/opt/node22/lib/node_modules/')('playwright'));}
const URL=process.env.SW_URL||'http://127.0.0.1:4396/m0/';
let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'ok  ':'FAIL')+' '+m+(d!==undefined?': '+JSON.stringify(d).slice(0,400):''));};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:640,height:360}});
await ctx.addInitScript(()=>{localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false}));localStorage.setItem('storyworld.r790.npc','{"on":false}');});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,300)));
await p.goto(URL,{timeout:180000});await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click().catch(()=>{});
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});
const skip=()=>p.evaluate(()=>{for(let i=0;i<300&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:90000});await skip();
const go=async(id,L)=>{await p.evaluate(async([id,L])=>{await enterRegion(id,null,{layer:L,restore:true});},[id,L]);await p.waitForFunction(()=>!loading,null,{timeout:150000});await skip();await p.waitForTimeout(500);await skip();};
const T=k=>p.evaluate(k=>{for(let i=0;i<k;i++)tick(.05);},k);
const S=()=>p.evaluate(()=>({room:room.id,layer:room.layer,stage:room.encounterStage,toast:document.getElementById('toast')?.textContent||''}));
const toBossReady=async()=>{await p.evaluate(()=>{for(let k=0;k<20;k++){const r=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&!e.boss&&!e.midboss);if(!r.length)break;for(const e of r){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}player.x=room.objective.x+.5;player.y=room.objective.y+.5;interact();});await skip();await T(40);await skip();
 await p.evaluate(()=>{for(const e of room.enemies.filter(e=>(e.midboss||e.boss)&&e.hp>0&&e.spawnState==='active')){e.hp=0;killEnemy(e);}for(let i=0;i<60;i++)tick(.05);});await skip();return S();};
const cAt=async(x,y)=>{await p.evaluate(([x,y])=>{const el=document.getElementById('toast');if(el)el.textContent='';player.x=x;player.y=y;interact();},[x,y]);await skip();await T(30);await skip();return S();};
for(const L of ['DREAM','STORY']){
 await go('dist03',L);const r0=await toBossReady();
 const r1=await cAt(14.96,12.04);
 if(L==='DREAM'){ok(r0.stage==='bossReady'&&r1.stage==='complete','① dist03 DREAM bossReady 에서 제단 1칸 옆(14.96,12.04) C → complete',{r0,r1});
  ok(!/보스 처치와 기억 복원/.test(r1.toast),'② 같은 자리에서 "보스 처치와 기억 복원이 필요합니다" 가 안 뜸',r1.toast);
  const pt=await p.evaluate(()=>{const d=window.__STORYWORLD_REGION_ROUTES__?.activeDirection?.(),s=d&&window.__STORYWORLD_ROUTES_R72__.status(d);return s?.open?{x:s.point.x,y:s.point.y,d}:null;});
  if(pt){await p.evaluate(()=>{const W=window.__STORYWORLD_WORLD_R74__;for(const d of room.exploration?.worldR74?.doors||[]){if(W.isOpen(room,d))continue;for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0],[0,.8],[.8,0]]){player.x=d.x+dx;player.y=d.y+dy;if(W.canUse({id:d.id})&&W.use({id:d.id}))break;}}});await T(20);
   await p.evaluate(([x,y])=>{player.x=x;player.y=y;interact();},[pt.x,pt.y]);await p.waitForTimeout(800);await p.evaluate(()=>document.getElementById('r71DifficultyConfirm')?.click());await p.waitForTimeout(800);await p.waitForFunction(()=>!loading,null,{timeout:150000}).catch(()=>{});await p.waitForTimeout(1000);}
  const r2=await S();ok(!!pt&&r2.room!=='dist03','③ 회귀: complete 뒤 R72 다음 포탈 자리 C → 다음 지역',{pt,r2});}
 else ok(!/보스 처치와 기억 복원/.test(r1.toast)&&(r0.stage!=='bossReady'||r1.stage==='complete'),'④ STORY dist03 같은 자리 C 도 옛 포탈 가로채기 없음',{r0,r1});}
ok(errs.length===0,'⑤ 페이지 오류 0',errs.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);

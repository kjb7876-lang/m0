// R1290 전수 감시: 3D EGO 플레이 중 전역 함수·DrawCommands 프로토타입·ctx 함수가 계속 바뀌는지(감싸기 핑퐁) 2초마다 본다.
//  URL=… SECS=120 node r96/qa/r1290/rewrap-audit.mjs   (헤드리스, 바뀐 횟수 3번 넘는 것만 출력)
import {createRequire} from 'node:module';const req=createRequire(import.meta.url);let chromium;for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=req(p));break;}catch(_){}}
const URL=process.env.URL||'http://127.0.0.1:4396/m0/',SECS=+(process.env.SECS||120);
const b=await chromium.launch({headless:true});const p=await (await b.newContext({viewport:{width:640,height:360}})).newPage();
await p.goto(URL);await p.locator('#campaignNew54').click({timeout:180000});await p.locator('#slotConfirmR73').click();
await p.waitForFunction(()=>started&&!loading,null,{timeout:240000});await p.waitForTimeout(800);
const skip=()=>p.evaluate(()=>{for(let i=0;i<120&&storyScene;i++)advanceScene();if(modal)closePanel(true);});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.activate('777');});await p.waitForFunction(()=>!loading,null,{timeout:120000});await skip();
await p.evaluate(async()=>{await window.__STORYWORLD_CHEAT777__.go('dist02','STORY');}).catch(()=>{});
await p.evaluate(async()=>{const P=window.__STORYWORLD_PROGRESSION_R71__;if(P?.difficultyState?.().open){P.selectDifficulty('normal');await P.confirmDifficulty();}});
await p.waitForFunction(()=>!loading,null,{timeout:180000});await skip();
await p.evaluate(()=>{player.invincible=1e9;try{window.__STORYWORLD_EGO_SOVEREIGN_R1046__.unlock('secret-777')}catch(_){}window.__STORYWORLD_EGO_FORM_R1176__.set('3d');window.__STORYWORLD_EGO_SOVEREIGN_R1046__.setForm(true);auto=true;guide=true;});
await p.waitForTimeout(15000);
const r=await p.evaluate(async(secs)=>{const snap=()=>{const m=new Map();for(const k of Object.getOwnPropertyNames(window)){try{const v=window[k];if(typeof v==='function')m.set('w.'+k,v);else if(v&&typeof v==='object'&&/^__STORYWORLD_/.test(k))for(const j of Object.keys(v))if(typeof v[j]==='function')m.set(k+'.'+j,v[j]);}catch(_){}}
  const P=window.StoryPhase1?.DrawCommands?.prototype;if(P)for(const k of Object.getOwnPropertyNames(P))try{if(typeof P[k]==='function')m.set('DC.'+k,P[k]);}catch(_){}
  try{for(const k of Object.getOwnPropertyNames(ctx))if(typeof ctx[k]==='function')m.set('ctx.'+k,ctx[k]);}catch(_){}
  for(const C of [window.CanvasRenderingContext2D?.prototype])if(C)for(const k of Object.getOwnPropertyNames(C))try{const d=Object.getOwnPropertyDescriptor(C,k);if(typeof d.value==='function')m.set('C2D.'+k,d.value);}catch(_){}return m;};
 let prev=snap();const n={};for(let i=0;i<secs/2;i++){await new Promise(r=>setTimeout(r,2000));const cur=snap();for(const [k,v] of cur)if(prev.has(k)&&prev.get(k)!==v)n[k]=(n[k]||0)+1;prev=cur;}
 return Object.entries(n).filter(([k,v])=>v>3).sort((a,b)=>b[1]-a[1]);},SECS);
console.log(JSON.stringify(r));await b.close();

// R1132 길잡이 낡은 나침반 목표 검사(헤드리스 브라우저, 그래픽 검증 아님) — 2026-11-18 스토리 실플레이 한도성 3(hando03) 이어 하기에서 3/3 재현:
//  길잡이(polish-r101)는 나침반(polish-r100)의 goal() 을 쓰는데, 그 값은 그리기(draw) 때만 새로 계산된다. 나침반을 끄거나 그리기가 드물면
//  예전 단계의 목표('중앙 전투실' 집결점)가 남아, 보스 준비(bossReady) 뒤에도 길잡이가 제단(공동 코어) 대신 집결점과 다른 곳 사이를 왕복하며 멈췄다.
// 검사(dist01 세계 결계 방, 나침반 끔): ① 전제(집결 단계 → 다음 단계 진행) ② goal() 이 지난 집결점에 머무르지 않음 ③ 나침반을 켜면 화면 목표와 같음 ④ 페이지 오류 0
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
const killWhere=f=>p.evaluate(src=>{const pick=new Function('e','return ('+src+')(e)');for(let k=0;k<20;k++){const rows=room.enemies.filter(e=>e.hp>0&&!e.deadRecorded&&e.spawnState==='active'&&pick(e));if(!rows.length)break;for(const e of rows){e.hp=0;killEnemy(e);}for(let i=0;i<30;i++)tick(.05);}return room.encounterStage;},String(f));
const S=()=>p.evaluate(()=>{const g=window.__STORYWORLD_POLISH_R100__.goal();const R=window.__STORYWORLD_WORLD_COMBAT_R78__;return{stage:room.encounterStage,phase:R.controlled(room)?R.state(room)?.phase:null,goal:g&&{x:g.x,y:g.y,label:g.label,kind:g.kind},obj:room.objective&&[room.objective.x,room.objective.y],p:[+player.x.toFixed(1),+player.y.toFixed(1)]};});
const ticks=n=>p.evaluate(n=>{for(let i=0;i<n;i++)tick(.05);},n);
const ZONE=process.env.ZONE||'dist01';
await go(ZONE,'STORY');
await p.evaluate(()=>{player.invincible=1e9;guide=false;auto=false;});
// 들어온 순간 나침반 목표(세계 결계 'route' 단계 = '중앙 전투실' 집결점)를 그리기로 계산해 둔 뒤 나침반을 끈다(설정 '나침반' 끄기와 같다).
await p.evaluate(()=>{try{draw();}catch(_){}window.__STORYWORLD_POLISH_R100__.set({nav:false});});
const s0=await S();
await p.evaluate(()=>{guide=true;auto=true;guideTimer=0;route=[];command=null;});
let s1=null;for(let i=0;i<30;i++){await ticks(40);await skip();s1=await S();if(s1.phase&&!['route','rally'].includes(s1.phase))break;}
ok(s0.phase==='route'&&s0.goal?.label==='중앙 전투실'&&s1.phase!=='route'&&s1.phase!=='rally','① (전제) 들어올 때 집결 단계였고 길잡이로 다음 단계까지 진행했다',{entry:s0,after:s1});
ok(s1.goal&&s1.goal.label!=='중앙 전투실','② 나침반을 꺼도 goal() 이 지난 단계의 집결점(중앙 전투실)에 머무르지 않는다',s1);
await p.evaluate(()=>{window.__STORYWORLD_POLISH_R100__.set({nav:true});try{draw();}catch(_){}});
const s2=await S();const shown=await p.evaluate(()=>{const g=window.__STORYWORLD_POLISH_R100__.inspect().nav.goal;return g&&{x:g.x,y:g.y,label:g.label,kind:g.kind};});
ok(!shown||JSON.stringify(shown)===JSON.stringify(s2.goal),'③ 나침반을 켜면 화면 목표와 goal() 이 같다',{goal:s2.goal,shown});
ok(errs.length===0,'④ 페이지 오류 0',errs.slice(0,3));
console.log(`\n${n-bad}/${n} 통과`);await b.close();process.exit(bad?1:0);

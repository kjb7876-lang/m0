'use strict';
// R1131: 길잡이가 포탈 앞에서 C 를 끝없이 기다리지 않고 잠시 뒤 스스로 건넌다(사용자 2026-11-18 "4개다 개선").
// 실제 빌드(site)의 tick·guideStep·travel·난이도 창을 Node VM 에서 돌린다. 브라우저·GPU·자연 플레이는 미검증.
const fs=require('fs'),path=require('path');
const site=path.resolve(__dirname,'../../hospital-three-pc/site');
if(!fs.readFileSync(path.join(site,'index.html'),'utf8').includes('portal-interaction-r83.js'))throw Error('R1131 needs the integrated site');
const {createHarness}=require('../harness.cjs');
const flush=()=>new Promise(r=>setImmediate(r));
let failed=0,passed=0;const check=(name,ok,detail)=>{console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' '+JSON.stringify(detail)));ok?passed++:failed++;};
async function hub(storage){
 const h=createHarness({timeoutMs:60000}),run=c=>h.run(c);await h.boot();
 if(storage)for(const [k,v] of Object.entries(storage))h.storage.set(k,v);
 await run("newGame('hwando')");run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');
 run('guide=false;auto=false;player.invincible=99999;');return {h,run};
}
async function settle(run){await flush();if(run('__STORYWORLD_PROGRESSION_R71__.difficultyState().open')){run("__STORYWORLD_PROGRESSION_R71__.selectDifficulty('normal')");await run('__STORYWORLD_PROGRESSION_R71__.confirmDifficulty()');}await flush();run('for(let i=0;i<80&&storyScene;i++)advanceScene();if(modal&&!storyScene)closePanel(true);');}
(async()=>{
 // ① 기본: 길잡이가 쉼터 안쪽에서 포탈까지 걸어가면 잠시 뒤 스스로 건넌다.
 {const {run}=await hub();
  run('transitionCD=0;route=[];command=null;player.x=15;player.y=19;guide=true;guideTimer=0;');
  let crossed=false;for(let i=0;i<600&&!crossed;i++){run('tick(.1)');await flush();crossed=run("zone!=='hub'||loading||__STORYWORLD_PROGRESSION_R71__.difficultyState().open");}
  const at=run('({zone,loading,diff:__STORYWORLD_PROGRESSION_R71__.difficultyState().open,policy:__STORYWORLD_PORTAL_INTERACTION_R83__.inspect()})');
  check('① 길잡이가 포탈까지 걸어간 뒤 60초 안에 스스로 이동을 시작한다',crossed,at);
  await settle(run);
  const after=run("({zone,guide,loading,safe:!blocked(player.x,player.y,.34,room),events:__STORYWORLD_PORTAL_INTERACTION_R83__.inspect().events.map(e=>e.kind)})");
  check('② 건넌 뒤 dist00 에 안전하게 서고 길잡이는 켜진 채다',after.zone==='dist00'&&after.guide===true&&!after.loading&&after.safe,after);
  check('③ 자동 이동 기록(guide-auto-crosses)이 남는다',after.events.includes('guide-auto-crosses'),after.events);
  check('④ 오류 없음',run('errors.length===0'),run('[...errors]'));
 }
 // ⑦ 길잡이가 켜져 있어도 포탈 위에 놓였을 뿐(순간이동·불러오기)이면 예전처럼 C 를 기다린다.
 {const {run}=await hub();
  run('const p=__STORYWORLD_ROUTES_R72__.points().next;player.x=p.x;player.y=p.y;transitionCD=0;route=[];command=null;guide=true;for(let i=0;i<300;i++)tick(.1);');await flush();
  const w=run("({zone,waiting:__STORYWORLD_PORTAL_INTERACTION_R83__.inspect().waitingForKey,diff:__STORYWORLD_PROGRESSION_R71__.difficultyState().open})");
  check('⑦ 포탈 위에 놓였을 뿐이면 30초 동안 C 를 기다린다',w.zone==='hub'&&w.waiting&&!w.diff,w);
 }
 // ⑤ 길잡이가 꺼져 있으면 사람 C 를 기다린다(자동 이동 없음).
 {const {run}=await hub();
  run('const p=__STORYWORLD_ROUTES_R72__.points().next;player.x=p.x;player.y=p.y;transitionCD=0;route=[];command=null;guide=false;for(let i=0;i<300;i++)tick(.1);');await flush();
  check('⑤ 길잡이가 꺼져 있으면 30초 서 있어도 이동하지 않는다',run("zone==='hub'&&!loading&&!__STORYWORLD_PROGRESSION_R71__.difficultyState().open"),run('zone'));
 }
 // ⑥ 끄기 설정(storyworld.guidePortalAuto='0')이면 예전 R83 처럼 C 를 기다린다.
 {const {run}=await hub({'storyworld.guidePortalAuto':'0'});
  run('transitionCD=0;route=[];command=null;player.x=15;player.y=19;guide=true;guideTimer=0;for(let i=0;i<600;i++)tick(.1);');await flush();
  const w=run("({zone,waiting:__STORYWORLD_PORTAL_INTERACTION_R83__.inspect().waitingForKey,diff:__STORYWORLD_PROGRESSION_R71__.difficultyState().open})");
  check('⑥ 끄기 설정이면 길잡이가 걸어가 60초 동안 C 를 기다린다',w.zone==='hub'&&w.waiting&&!w.diff,w);
 }
 console.log(JSON.stringify({passed,failed}));process.exitCode=failed?1:0;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

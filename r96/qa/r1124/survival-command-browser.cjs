// R1124 실제 빌드 smoke. Headless/소프트웨어 렌더링 결과이며 실기기 검증은 아니다.
// SW_URL=http://127.0.0.1:4396/ SHOTS=/tmp/r1124 node ...
// SW_BASELINE_URL을 지정하면 변경 전 빌드도 같은 UI/카메라로 캡처한다.
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const URL=process.env.SW_URL||'http://127.0.0.1:4396/';
const SHOTS=process.env.SHOTS||path.join(__dirname,'browser-evidence');
const PC={width:960,height:640},MOBILE={width:390,height:844};
fs.mkdirSync(SHOTS,{recursive:true});
const checks=[],screens=[],pageErrors=[];
function check(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail===undefined?'':JSON.stringify(detail));}
const state=p=>p.evaluate(()=>({view:window.__STORYWORLD_SURVIVAL_COMMAND_R1124__?.state(),defense:window.__STORYWORLD_HERO_DEFENSE_R720__.state(),hero:{x:player.x,y:player.y,hero:player.hero},cam:{...cam},auto,command,route:route.map(q=>({...q})),modal,time}));
async function waitGame(p,seconds){const t=await p.evaluate(()=>time);await p.waitForFunction(t=>time>=t,t+seconds,{timeout:90000});}
async function shot(p,name){await p.screenshot({path:path.join(SHOTS,name+'.png')});screens.push(name+'.png');}
async function boot(browser,url,label){
 const context=await browser.newContext({viewport:PC});
 await context.addInitScript(()=>localStorage.setItem('storyworld.r183.scene3d',JSON.stringify({on:false})));
 const p=await context.newPage();p.setDefaultTimeout(30000);p.on('pageerror',e=>pageErrors.push({label,error:String(e)}));
 await p.goto(url,{timeout:180000,waitUntil:'domcontentloaded'});
 await p.locator('#survivalStartR600').waitFor({timeout:180000});
 await p.keyboard.press('h');
 if(label==='after')check('타이틀에서 H는 본진을 켜지 않는다',await p.evaluate(()=>!window.__STORYWORLD_SURVIVAL_COMMAND_R1124__.state().baseView));
 await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
 await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:180000});
 await p.evaluate(()=>{auto=false;guide=false;window.__STORYWORLD_SURVIVAL_R600__.skipNarration();player.invincible=99999;player.attackCD=999;player.specialCD=999;player.egoCD=999;const d=window.__STORYWORLD_HERO_DEFENSE_R720__;d.qaGive(5000);d.qaSkills(true);d.qaFreeze(true);});
 for(const [hero,dx,dy] of [['gunner',3,0],['neon',-3,0]]){
  await p.evaluate(([dx,dy])=>{const c=room.survivalR600.centre;player.x=c.x+dx;player.y=c.y+dy;route=[];command=null;target=null;},[dx,dy]);
  await p.keyboard.press('i');await p.locator('[data-r720buy="'+hero+'"]').click();await p.locator('#r720Close').click();
 }
 await p.evaluate(()=>{const c=room.survivalR600.centre;player.x=c.x;player.y=c.y+6;cam.x=c.x;cam.y=c.y;route=[];command=null;});
 await waitGame(p,.08);
 return {p,context};
}
async function comparison(p,prefix){
 await p.setViewportSize(PC);await p.evaluate(()=>{const c=room.survivalR600.centre;cam.x=c.x;cam.y=c.y;});await shot(p,prefix+'-pc-game');
 await p.keyboard.press('i');await p.locator('#r720Panel').waitFor();await shot(p,prefix+'-pc-placement');
 await p.setViewportSize(MOBILE);await shot(p,prefix+'-mobile-placement');await p.locator('#r720Close').click();
 await p.evaluate(()=>{const c=room.survivalR600.centre;cam.x=c.x;cam.y=c.y;});await shot(p,prefix+'-mobile-game');
 await p.setViewportSize(PC);
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--disable-dev-shm-usage']});
 let p;
 try{
  if(process.env.SW_BASELINE_URL){const b=await boot(browser,process.env.SW_BASELINE_URL,'before');await comparison(b.p,'before');await b.context.close();}
  const b=await boot(browser,URL,'after');p=b.p;
  check('UI에서 기억사수와 네온을 영입/배치',await p.evaluate(()=>window.__STORYWORLD_HERO_DEFENSE_R720__.state().slots.map(s=>s.hero).join(',')==='gunner,neon'));
  await comparison(p,'after');
  // 전환 한 번의 경계에서는 명령/경로가 그대로다. 실제 키 경로는 아래에서 별도로 확인한다.
  const boundary=await p.evaluate(()=>{const c=room.survivalR600.centre;auto=false;guide=false;player.x=c.x;player.y=c.y+6;const goal={x:c.x+4,y:c.y+6};commandMove(goal);const before={command,route:JSON.stringify(route),x:player.x,y:player.y};const ok=window.__STORYWORLD_SURVIVAL_COMMAND_R1124__.setBase(true);return {ok,before,after:{command,route:JSON.stringify(route),x:player.x,y:player.y},goal,core:c};});
  check('본진 전환은 기존 이동 명령/경로/본영웅 위치 보존',boundary.ok&&boundary.before.command===boundary.after.command&&boundary.before.route===boundary.after.route&&boundary.before.x===boundary.after.x&&boundary.before.y===boundary.after.y,boundary);
  check('이동 회귀 fixture에 실제 경로가 있다',JSON.parse(boundary.before.route).length>0);
  await waitGame(p,.35);let s=await state(p);
  check('본진 시점에서도 먼저 내린 이동 명령 수행',Math.hypot(s.hero.x-boundary.before.x,s.hero.y-boundary.before.y)>.05,s.hero);
  check('본진 카메라는 정화구슬에 고정',Math.hypot(s.cam.x-boundary.core.x,s.cam.y-boundary.core.y)<.001,s.cam);
  await p.keyboard.press('h');s=await state(p);check('H로 영웅 복귀하며 반자동 원래 값 복원',!s.view.baseView&&s.auto===false,s.view);
  check('영웅 복귀 카메라는 본영웅으로 돌아온다',Math.hypot(s.cam.x-s.hero.x,s.cam.y-s.hero.y)<.7,{cam:s.cam,hero:s.hero});
  // 반복 누름에 대한 토글은 브라우저 실제 keydown 경로를 통한다.
  await p.keyboard.press('h');s=await state(p);check('실제 H키로 본진 재진입',s.view.baseView&&s.auto===true);
  await p.keyboard.down('h');await p.keyboard.down('h');await p.keyboard.up('h');s=await state(p);check('H auto-repeat는 두 번 전환하지 않는다',!s.view.baseView);
  await p.keyboard.press('h');
  // 본진 클릭이 영웅 이동 명령을 지우지 않고 선택한 지점으로 배치창을 연다.
  const click=await p.evaluate(()=>{const c=room.survivalR600.centre,goal={x:c.x+5,y:c.y+6};commandMove(goal);const q={x:c.x,y:c.y-3},v=project(q.x,q.y),r=document.getElementById('game').getBoundingClientRect();return {point:q,command,goal,screen:{x:r.left+v.x*r.width/W,y:r.top+v.y*r.height/H}};});
  await p.mouse.click(click.screen.x,click.screen.y);await p.locator('#r720Panel').waitFor();s=await state(p);
  check('본진 땅 클릭은 배치 위치만 선택한다',s.modal&&s.view.baseView&&Math.hypot(s.view.selected.x-click.point.x,s.view.selected.y-click.point.y)<.05,s.view);
  check('배치창을 열어도 본영웅 명령 목적지 유지',s.command===click.command&&(!s.route.length||Math.hypot(s.route.at(-1).x-click.goal.x,s.route.at(-1).y-click.goal.y)<1.2),{command:s.command,route:s.route});
  await p.locator('#r720Close').click();
  await p.evaluate(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__,c=room.survivalR600.centre;d.buy('hunter');d.placeHere('hunter',{x:c.x,y:c.y-3});d.buy('slayer');d.placeHere('slayer',{x:c.x,y:c.y+3});d.buy('lauren');route=[];command=null;});
  await p.keyboard.press('i');s=await state(p);check('최대 4자리에서도 다른 영웅을 보유할 수 있다',s.defense.slots.length===4&&s.defense.owned.lauren,s.defense);
  // 실제 활성 선택 입력칸의 H는 단축키로 소비하지 않는다.
  await p.locator('[data-r720replacement="0"]').focus();await p.keyboard.press('h');check('선택 입력칸에서 H는 시점 전환을 하지 않는다',(await state(p)).view.baseView);
  await p.locator('[data-r720up="0:level"]').click();await p.locator('[data-r720up="0:range"]').click();const prior=(await state(p)).defense;
  await p.locator('[data-r720replacement="0"]').selectOption('lauren');await p.locator('[data-r720replace="0"]').click();s=await state(p);
  check('4자리 가득 찬 상태에서 배치 영웅 변경',s.defense.slots.length===4&&s.defense.slots[0].hero==='lauren'&&s.defense.main==='hwando',s.defense.slots);
  check('자리 변경은 위치/강화/재화와 이전 영웅 보유를 유지',s.defense.slots[0].ox===prior.slots[0].ox&&s.defense.slots[0].oy===prior.slots[0].oy&&s.defense.slots[0].lv===2&&s.defense.slots[0].rangeLv===1&&s.defense.crystals===prior.crystals&&s.defense.owned.gunner);
  // gunner를 다시 같은 자리에 배치하여 제거 전 지연 스킬도 확인한다.
  await p.locator('[data-r720replacement="0"]').selectOption('gunner');await p.locator('[data-r720replace="0"]').click();await p.locator('#r720Close').click();await p.keyboard.press('h');
  await waitGame(p,.08);
  const beam=await p.evaluate(()=>{const d=window.__STORYWORLD_HERO_DEFENSE_R720__;d.qaFreeze(true);d.qaSkills(true);const ally=d.bodies()[0];player.x=ally.x+7;player.y=ally.y+4;auto=false;guide=false;route=[];command=null;const success=d.qaCast(0,'q');return {success,ally:{x:ally.x,y:ally.y},main:{x:player.x,y:player.y},fx:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().effects};});
  check('배치 기억사수가 Q 레이저를 시전한다',beam.success&&beam.fx.some(f=>f.kind==='q'),beam);
  check('레이저 owner와 원점은 배치 기억사수',beam.fx.filter(f=>f.kind==='q').every(f=>f.ally&&f.hero==='gunner'&&f.origin&&Math.hypot(f.origin.x-beam.ally.x,f.origin.y-beam.ally.y)<.01),beam.fx);
  await waitGame(p,.2);await p.evaluate(()=>{const c=room.survivalR600.centre;cam.x=c.x;cam.y=c.y;});await shot(p,'after-ally-beam');
  const fired=await p.evaluate(()=>window.__STORYWORLD_GUNNER_ARMS_R561__.inspect());check('배치 레이저가 실제 그리기 경로를 통과',fired.stats.drawn>0,fired.stats);
  await p.keyboard.press('i');const refundBefore=(await state(p)).defense.crystals;await p.locator('[data-r720remove="0"]').click();s=await state(p);
  check('배치 해제는 영입 보유를 유지하고 강화 결정만 반환',s.defense.slots.length===3&&s.defense.owned.gunner&&s.defense.crystals===refundBefore+55,s.defense);
  await p.locator('#r720Close').click();await waitGame(p,.08);
  const removed=await p.evaluate(()=>({fx:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect().effects,slots:window.__STORYWORLD_HERO_DEFENSE_R720__.state().slots,props:room.props.filter(p=>p.r720AllyProp).map(p=>p.r720Slot)}));
  check('해제한 영웅의 지연 이펙트 취소, 남은 자리 인덱스 정합',removed.fx.length===0&&removed.props.length===3&&removed.props.every((v,i)=>v===i),removed);
  // H 종료/재시작: 새 판과 영입 상태가 이전 판을 상속하지 않는다.
  await p.keyboard.press('h');check('최종 H 진입 성공',(await state(p)).view.baseView);
  await p.evaluate(()=>showTitle());await p.locator('#survivalStartR600').waitFor();check('타이틀 복귀 시 본진 상태 초기화',await p.evaluate(()=>!window.__STORYWORLD_SURVIVAL_COMMAND_R1124__.state().baseView));
  await p.locator('#survivalStartR600').click();await p.locator('[data-r600diff="normal"]').click();await p.locator('[data-r600hero="hwando"]').click();await p.locator('#r600Go').click();
  await p.waitForFunction(()=>window.__STORYWORLD_SURVIVAL_R600__.here()&&!loading&&window.__STORYWORLD_SURVIVAL_R600__.state().ready,null,{timeout:180000});
  s=await state(p);check('새 판은 본영웅 시점/빈 배치/선택위치 없음',!s.view.baseView&&s.view.selected===null&&s.defense.slots.length===0,s);
  const health=await p.evaluate(()=>({command:window.__STORYWORLD_SURVIVAL_COMMAND_R1124__.state(),defense:window.__STORYWORLD_HERO_DEFENSE_R720__.inspect(),gunner:window.__STORYWORLD_GUNNER_ARMS_R561__.inspect()}));
  check('신규/배치/기억사수 모듈 오류 없음',health.command.stats.errors===0&&health.defense.stats.errors===0&&!health.gunner.lastError,health);
  check('페이지 JavaScript 오류 없음',pageErrors.length===0,pageErrors);
 }catch(e){check('browser smoke completes',false,String(e.stack||e));if(p)try{await shot(p,'failure');}catch(_){} }
 finally{const failed=checks.filter(x=>!x.pass).length;fs.writeFileSync(path.join(SHOTS,'results.json'),JSON.stringify({mode:'headless-software',baselineCaptured:!!process.env.SW_BASELINE_URL,url:URL,checks,screens,pageErrors,failed},null,2));await browser.close();console.log(JSON.stringify({checks:checks.length,failed}));process.exitCode=failed?1:0;}
})().catch(e=>{console.error(e);process.exitCode=1;});

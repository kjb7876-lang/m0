// R1228 CPU 검사: 3D 그리기 중 예외 한 번으로 3D(Three.js)가 영구히 꺼지고 "Three.js 실행 실패 · PC 테스트를 중단합니다." 로 게임이 멈추던 것.
//  사용자 2026-11-19: 추락(dist06) 보스방 들어가기 전 PC·슬레이어에서 이 문구로 중단.
//  phase1 createController 는 그리기·캡처 중 예외를 한 번만 받아도 fallback() → failed=true 로 다시 시도하지 않고, hospital-pc-test 가 modal=true 로 플레이를 멈춘다.
//  R1228 three-recover-r1228.js: WebGL2 가 있는 일시 오류는 1분에 3번까지 새 캔버스로 3D 를 다시 시작하고(알림·중단 없음), 넘으면 예전처럼 알리되 이유를 함께 쓴다.
//  실제 dist/phase1.js 의 createController 원문을 떼어 가짜 렌더러로 돌린다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d):''));};
const P=fs.readFileSync(path.join(R,'runtime-text/dist/phase1.js'),'utf8');
const a=P.indexOf('function createController('),b=P.indexOf('  return controller;\n}',a)+'  return controller;\n}'.length;ok(a>0&&b>a,'phase1 createController 원문을 찾음');
const SRC=path.join(R,'client-source/three-recover-r1228.js');const has=fs.existsSync(SRC);ok(has,'three-recover-r1228.js 있음');
const HTML=fs.readFileSync(path.join(R,'runtime-text/index.html'),'utf8');
const iF=HTML.indexOf('<script src="./webgl-fallback-r221.js"></script>'),iR=HTML.indexOf('<script src="./three-recover-r1228.js"></script>'),iP=HTML.indexOf('<script src="./dist/phase1.js');
ok(iR>iF&&iF>iP,'index.html: phase1 → R221 → (R171·R830·R838·R839) → R1228 순서',{iP,iF,iR});
ok(HTML.indexOf('three-recover-r1228.js')<HTML.indexOf('const controller=api.createController('),'R1228 이 컨트롤러 만들기 전에 읽힘');
const R221=fs.readFileSync(path.join(R,'client-source/webgl-fallback-r221.js'),'utf8');
function world({gl2=true}={}){
 const timers=[];let clock=0;
 const doc={getElementById:()=>null,createElement:()=>({getContext:()=>gl2?{getExtension:()=>null}:null,style:{},append(){},appendChild(){},setAttribute(){}}),querySelector:()=>null,body:{appendChild(){}}};
 const ls=new Map();
 const win={document:doc,localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v))},performance:{now:()=>clock}};
 const ctx={window:win,document:doc,localStorage:win.localStorage,performance:win.performance,console,setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},Date:{now:()=>clock},Promise,Error,String,Number,Math,Object,Array,JSON,Map,Set,RegExp,MutationObserver:undefined};
 ctx.globalThis=ctx;win.window=win;vm.createContext(ctx);
 // phase1 의 createController 를 가짜 부품과 함께
 const plan={throwNext:0,renders:0,created:0,disposed:0,initFail:0};ctx.plan=plan;
 vm.runInContext(`
 class RenderBridge{constructor(read){this.read=read;this.events={rows:[]};}capture(){return this.read();}}
 class LegacyRenderer{constructor(draw){this.drawOriginal=draw;this.frames=0;}render(){this.frames++;this.drawOriginal();}dispose(){}}
 class Projection{}
 class ThreeRenderer{constructor(T,o){if(plan.initFail>0){plan.initFail--;throw Error('init boom');}plan.created++;this.canvas=o.canvas;this.chunks={inspect:()=>null};this.metrics={report:()=>null};this.commands={inspect:()=>null};}
  supported(){return true;}render(f){plan.renders++;if(plan.throwNext>0){plan.throwNext--;throw Error(plan.msg||'Nonfinite original draw command');}}inspectSpatial(){return null;}clearScene(){}dispose(){plan.disposed++;}}
 ${P.slice(a,b)}
 window.StoryPhase1=Object.freeze({createController});`,ctx);
 vm.runInContext(R221,ctx);
 if(has)vm.runInContext(fs.readFileSync(SRC,'utf8'),ctx);
 const notices=[];let canvases=0,overlay=null,legacy=0;
 const hooks={read:()=>({ready:true}),draw:()=>{legacy++;},captureVisual:()=>[],loadThree:async()=>({}),webglCanvas:()=>({id:++canvases}),overlay:on=>{overlay=on;},disposeOverlay(){},notice:m=>notices.push(String(m))};
 const c=vm.runInContext('window.StoryPhase1',ctx).createController(hooks,{requested:'three',requiredThree:true});
 const flush=async()=>{for(let k=0;k<20;k++){await Promise.resolve();await new Promise(r=>setImmediate(r));}};
 const advance=async ms=>{clock+=ms;for(let i=0;i<timers.length;i++){const t=timers[i];if(t&&t.at<=clock){timers[i]=null;t.f();}}await flush();};
 return {c,plan,notices,advance,flush,ctx,get canvases(){return canvases;},get legacy(){return legacy;},get overlay(){return overlay;}};}
const shown=w=>w.notices.filter(m=>m.includes('시작하지 못해')).length;
(async()=>{
 // 1) 정상 경로: 예외 없이 그리면 그대로 three
 {const w=world();await w.c.initialize();for(let i=0;i<5;i++)w.c.draw();ok(w.c.state.active==='three'&&!w.c.state.failed&&w.plan.renders===5,'정상: 3D 로 5번 그림',w.c.inspect());ok(shown(w)===0,'정상: 실패 알림 없음');}
 // 2) 회귀: 그리기 중 예외 한 번 → 잠깐 뒤 3D 다시 시작, 알림 없음, 실패 상태 아님
 {const w=world();await w.c.initialize();w.c.draw();w.plan.throwNext=1;w.c.draw();
  ok(w.c.state.failed===false,'예외 1번: 그 자리에서 실패 상태로 남지 않음(PC 테스트가 멈추지 않음)',{failed:w.c.state.failed,reason:w.c.state.reason});
  await w.advance(400);w.c.draw();w.c.draw();
  ok(!!w.c.state.three&&w.c.state.active==='three','예외 1번: 3D 다시 시작해 그림',{active:w.c.state.active,created:w.plan.created});
  ok(w.plan.created===2&&w.canvases===2,'새 캔버스·새 렌더러로 다시 만듦',{created:w.plan.created,canvases:w.canvases});
  ok(shown(w)===0,'예외 1번: "PC 테스트를 중단" 알림 없음',w.notices);
  const I=w.ctx.window.__STORYWORLD_THREE_RECOVER_R1228__?.inspect?.();ok(!!I&&I.recovered===1&&/Nonfinite/.test(I.last||''),'복구 횟수·마지막 이유 기록',I);}
 // 3) 경계: 1분 안 3번까지는 복구, 4번째는 예전처럼 알림(무한 반복 금지)
 {const w=world();await w.c.initialize();for(let k=0;k<3;k++){w.plan.throwNext=1;w.c.draw();await w.advance(400);w.c.draw();}
  ok(w.c.state.active==='three'&&shown(w)===0,'1분 안 3번 예외: 모두 복구',{created:w.plan.created});
  w.plan.throwNext=1;w.c.draw();await w.advance(400);w.c.draw();
  ok(w.c.state.failed===true&&shown(w)===1,'4번째: 포기하고 알림 1번',{failed:w.c.state.failed,n:shown(w)});}
 // 4) 경계: 1분이 지나면 횟수 다시 셈
 {const w=world();await w.c.initialize();for(let k=0;k<3;k++){w.plan.throwNext=1;w.c.draw();await w.advance(400);w.c.draw();}
  await w.advance(61000);w.plan.throwNext=1;w.c.draw();await w.advance(400);w.c.draw();
  ok(w.c.state.active==='three'&&shown(w)===0,'61초 뒤 예외는 다시 복구',{failed:w.c.state.failed});}
 // 5) 다시 만들기도 실패하면 셈에 넣고 결국 알림(멈춤 없이 끝없이 돌지 않음)
 {const w=world();await w.c.initialize();w.plan.initFail=99;w.plan.throwNext=1;w.c.draw();for(let k=0;k<8;k++){await w.advance(400);w.c.draw();}
  ok(w.c.state.failed===true&&shown(w)===1,'다시 만들기 계속 실패: 알림 1번으로 끝',{n:shown(w),failed:w.c.state.failed});}
 // 6) WebGL2 자체가 없으면 복구하지 않고 바로 예전 알림(R221 안내 유지)
 {const w=world({gl2:false});w.plan.initFail=1;w.plan.msg='WebGL2 context unavailable';await w.c.initialize();
  ok(w.c.state.failed===true&&shown(w)===1,'WebGL2 없음: 바로 알림',{n:shown(w)});}
 // 7) 사용자에게 보이는 포기 문구에 이유가 붙음
 {const t=has?fs.readFileSync(SRC,'utf8'):'';ok(/phase1-status/.test(t)&&/reason/.test(t),'포기 때 상태 줄에 이유를 붙임');}
 console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);})();

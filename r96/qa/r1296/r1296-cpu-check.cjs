// R1296 CPU 검사: 3D(Three.js) 그리기 실패가 설정의 '저장된 오류 기록'(R1288)에 남지 않던 것.
//  사용자 2026-11-21 12:27Z: 윤서하 Lv.88·검은 공방에서 화면이 비고 "Three.js 실행 실패 · PC 테스트를 중단합니다. (이유: Maximum call stack size exceeded)",
//  그런데 설정의 오류 기록에는 "저장된 오류 없음".
//  원인 구조: phase1 createController 는 장면 캡처(captureVisual)·3D 렌더·브리지 캡처 중 예외를 try/catch 로 삼켜 fallback() 에 메시지만 넘긴다.
//   R1228 은 그 메시지로 다시 시작하거나 포기 문구를 띄울 뿐이고, R1288 기록기는 엔진 logError·window error·Promise 거절만 듣는다 → 이 길의 오류는 어디에도 스택과 함께 남지 않는다.
//  검사: 실제 dist/phase1.js createController 원문 + R221 + R1228 + R1288 을 vm 에 올려
//   ① 장면 캡처 중 진짜 호출 스택 초과(끝없는 재귀) → 기록 1건(종류 three, 단계 capture, 메시지 원문, 스택에 재귀 함수 이름, 반복 줄은 접힘)
//   ② 3D 렌더 중 TypeError → 단계 render 로 기록 ③ 브리지 캡처 중 예외 → 단계 bridge
//   ④ 복구된 실패(1분 3번 안)도 기록되고, 같은 오류가 되풀이되면 한 줄로 합쳐 횟수만 늘어남(20줄 넘치지 않음)
//   ⑤ 정상 경로: 오류 없으면 기록 0건, 캡처 결과·렌더 호출 수 그대로 ⑥ 포기 문구·이유 붙이기(R1228)는 그대로
//   ⑦ R1288 기록 끔('0')이면 기록하지 않음 ⑧ 다시 만든 렌더러도 한 번씩만 감쌈(감싸기 깊이 늘지 않음) ⑨ 빌드 사본 = client-source
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'../..');let n=0,bad=0;const ok=(c,m,d)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(d!==undefined?' '+JSON.stringify(d).slice(0,500):''));};
const P=fs.readFileSync(path.join(R,'runtime-text/dist/phase1.js'),'utf8');
const a=P.indexOf('function createController('),b=P.indexOf('  return controller;\n}',a)+'  return controller;\n}'.length;ok(a>0&&b>a,'phase1 createController 원문을 찾음');
const R221=fs.readFileSync(path.join(R,'client-source/webgl-fallback-r221.js'),'utf8'),R1228=fs.readFileSync(path.join(R,'client-source/three-recover-r1228.js'),'utf8'),R1288=fs.readFileSync(path.join(R,'client-source/error-log-r1288.js'),'utf8');
function world({logOff=false}={}){
 const timers=[];let clock=0;const ls=new Map();if(logOff)ls.set('storyworld.r1288.log','0');
 const status={textContent:'Three.js 실행 실패 · PC 테스트를 중단합니다.'};
 const doc={getElementById:id=>id==='phase1-status'?status:null,createElement:()=>({getContext:()=>({getExtension:()=>null}),style:{},append(){},appendChild(){},setAttribute(){}}),querySelector:()=>null,body:{appendChild(){}}};
 const listeners={};
 const win={document:doc,localStorage:{getItem:k=>ls.has(k)?ls.get(k):null,setItem:(k,v)=>ls.set(k,String(v)),removeItem:k=>ls.delete(k)},performance:{now:()=>clock},addEventListener:(t,f)=>{(listeners[t]=listeners[t]||[]).push(f);},innerWidth:1280,innerHeight:720,devicePixelRatio:1};
 const ctx={window:win,document:doc,localStorage:win.localStorage,performance:win.performance,console,setTimeout:(f,ms)=>{timers.push({f,at:clock+(ms||0)});return timers.length;},clearTimeout(){},Date,Promise,Error,RangeError,TypeError,String,Number,Math,Object,Array,JSON,Map,Set,WeakMap,WeakSet,RegExp,MutationObserver:undefined,innerWidth:1280,innerHeight:720};
 ctx.globalThis=ctx;win.window=win;vm.createContext(ctx);
 const plan={throwNext:0,renders:0,created:0,initFail:0,bridgeThrow:0};ctx.plan=plan;
 vm.runInContext(`var player={hero:'seoha',level:88,hp:500,x:1,y:1,ego:0},room={id:'kair07',layer:'STORY',enemies:[]},zone='kair07',layer='STORY';
 class RenderBridge{constructor(read){this.read=read;this.events={rows:[]};}capture(){if(plan.bridgeThrow>0){plan.bridgeThrow--;throw Error('bridge boom');}return this.read();}}
 class LegacyRenderer{constructor(draw){this.drawOriginal=draw;this.frames=0;}render(){this.frames++;this.drawOriginal();}dispose(){}}
 class Projection{}
 class ThreeRenderer{constructor(T,o){if(plan.initFail>0){plan.initFail--;throw Error('init boom');}plan.created++;this.canvas=o.canvas;this.chunks={inspect:()=>null};this.metrics={report:()=>null};this.commands={inspect:()=>null};}
  supported(){return true;}render(f){plan.renders++;if(plan.throwNext>0){plan.throwNext--;null.renderProp;}}inspectSpatial(){return null;}clearScene(){}dispose(){}}
 ${P.slice(a,b)}
 window.StoryPhase1=Object.freeze({createController});`,ctx);
 vm.runInContext(R221,ctx);vm.runInContext(R1228,ctx);
 const notices=[];const cap={deep:false,list:['c1','c2']};
 // 진짜 끝없는 재귀(그리기 감싸기가 서로를 부르는 꼴)
 vm.runInContext(`function drawSummonLoopR1296(n){return drawHeroLoopR1296(n+1);}function drawHeroLoopR1296(n){return drawSummonLoopR1296(n+1);}`,ctx);
 const hooks={read:()=>({ready:true}),draw:()=>{},captureVisual:()=>{if(cap.deep){cap.deep=false;vm.runInContext('drawSummonLoopR1296(0)',ctx);}return cap.list;},loadThree:async()=>({}),webglCanvas:()=>({}),overlay(){},disposeOverlay(){},notice:m=>notices.push(String(m))};
 const c=vm.runInContext('window.StoryPhase1',ctx).createController(hooks,{requested:'three',requiredThree:true});
 vm.runInContext(R1288,ctx); // R1288 은 index.html 맨 끝(컨트롤러를 만든 뒤)에 읽힌다
 const flush=async()=>{for(let k=0;k<20;k++){await Promise.resolve();await new Promise(r=>setImmediate(r));}};
 const advance=async ms=>{clock+=ms;for(let i=0;i<timers.length;i++){const t=timers[i];if(t&&t.at<=clock){timers[i]=null;t.f();}}await flush();};
 const L=()=>vm.runInContext('window.__STORYWORLD_ERROR_LOG_R1288__',ctx);
 return {c,plan,notices,advance,ctx,cap,status,L,rows:()=>L().list()};}
(async()=>{
 // ① 장면 캡처 중 호출 스택 초과
 {const w=world();await w.c.initialize();w.c.draw();w.cap.deep=true;w.c.draw();const r=w.rows();
  ok(r.length===1,'① 캡처 중 호출 스택 초과 → 오류 기록 1건',r.map(x=>x.message));
  const x=r[0]||{};ok(x.kind==='three'&&/capture/.test(x.message)&&/Maximum call stack size exceeded/.test(x.message),'① 종류 three·단계 capture·원래 메시지',{kind:x.kind,message:x.message});
  ok(/drawSummonLoopR1296|drawHeroLoopR1296/.test(x.stack||''),'① 스택에 재귀 함수 이름이 남음',(x.stack||'').slice(0,300));
  const lines=String(x.stack||'').split('\n');ok(lines.length<=60&&String(x.stack).length<=2000&&/반복|×/.test(x.stack||''),'① 반복되는 스택 줄은 접어서 짧게(2000자 안)',{lines:lines.length,len:String(x.stack||'').length});
  ok(x.zone==='kair07'&&x.hero==='seoha'&&x.level===88,'① 지역·영웅·레벨이 함께 남음',{zone:x.zone,hero:x.hero,level:x.level});
  ok(/저장된 오류 없음/.test(w.L().text())===false&&/capture/.test(w.L().text()),'① 설정 창 글(text)에 보임');}
 // ② 렌더 중 TypeError
 {const w=world();await w.c.initialize();w.c.draw();w.plan.throwNext=1;w.c.draw();const r=w.rows(),x=r[0]||{};
  ok(r.length===1&&/render/.test(x.message)&&/null/.test(x.message)&&/render/.test(x.stack||''),'② 3D 렌더 중 TypeError → 단계 render·스택',{message:x.message,stack:(x.stack||'').slice(0,200)});}
 // ③ 브리지 캡처 중 예외
 {const w=world();await w.c.initialize();w.c.draw();w.plan.bridgeThrow=1;w.c.draw();const r=w.rows(),x=r[0]||{};
  ok(r.length===1&&/bridge/.test(x.message)&&/bridge boom/.test(x.message),'③ 브리지 캡처 예외 → 단계 bridge',{message:x.message});}
 // ④ 복구된 실패도 기록, 같은 오류는 합쳐짐
 {const w=world();await w.c.initialize();for(let k=0;k<5;k++){w.c.draw();w.cap.deep=true;w.c.draw();await w.advance(400);}
  const r=w.rows();ok(r.length===1&&r[0].count===4,'④ 같은 오류 4번(3번 복구 + 4번째 포기, 그 뒤는 그리지 않음) → 한 줄, 횟수 4',r.map(x=>[x.message.slice(0,60),x.count]));
  ok(w.c.state.failed===true&&w.notices.filter(m=>m.includes('시작하지 못해')).length===1,'④ R1228 동작 그대로(1분 3번 복구 뒤 포기·알림 1번)',{failed:w.c.state.failed});
  ok(/이유: Maximum call stack size exceeded/.test(w.status.textContent),'⑥ 포기 문구에 이유 붙이기 그대로',w.status.textContent);}
 // ⑤ 정상 경로
 {const w=world();await w.c.initialize();for(let i=0;i<5;i++)w.c.draw();
  ok(w.rows().length===0&&w.plan.renders===5&&w.c.state.active==='three','⑤ 정상: 기록 0건, 3D 렌더 5번',{rows:w.rows().length,renders:w.plan.renders});
  const R2=vm.runInContext('window.__STORYWORLD_THREE_RECOVER_R1228__',w.ctx).inspect();ok(R2.logged===0,'⑤ 정상: 기록 횟수 0',R2);}
 // ⑦ 기록 끔
 {const w=world({logOff:true});await w.c.initialize();w.c.draw();w.cap.deep=true;w.c.draw();ok(w.rows().length===0,'⑦ R1288 기록 끔이면 남기지 않음');}
 // ⑧ 다시 만든 렌더러도 한 번씩만 감쌈
 {const w=world();await w.c.initialize();for(let k=0;k<3;k++){w.plan.throwNext=1;w.c.draw();await w.advance(400);for(let i=0;i<30;i++)w.c.draw();}
  const T=w.c.state.three;let st='';w.plan.throwNext=1;try{T.render({});}catch(e){st=String(e.stack||'');}
  const wraps=st.split('\n').filter(l=>/renderR1296/.test(l)).length;
  ok(w.plan.created===4&&w.rows().length===1&&w.rows()[0].count===3,'⑧ 렌더러 4번 만들고 같은 오류 3번 = 한 줄 ×3',{created:w.plan.created,rows:w.rows().map(x=>x.count)});
  ok(wraps===1,'⑧ 렌더 감싸기 정확히 1겹(다시 그려도 늘지 않음)',{wraps,stack:st.split('\n').slice(0,8)});}
 // ⑨ 빌드 사본
 {const B=path.join(R,'runtime-text/three-recover-r1228.js');ok(fs.existsSync(B)&&fs.readFileSync(B,'utf8')===R1228,'⑨ runtime-text 사본 = client-source');}
 console.log(`${n-bad}/${n} passed`);process.exit(bad?1:0);})();

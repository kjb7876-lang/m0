'use strict';
// R1344 CPU 검사: 탐식의 주방(ep1b04)에서 기억사수 플레이 중 "Three.js 실행 실패 · PC 테스트를 중단합니다. (이유: Maximum call stack size exceeded)"(사용자 2026-11-26 13:47Z).
//  사용자 오류 기록(R1288): [3D render] … at before (michaela-flashguard-r1267.js) / ThreeRenderer.w (hit-translucent-r1271.js) / ThreeRenderer.w (r1267) … ×29 반복.
//  원인 ①(prototype): R1267 미카엘라 섬광 제한(tick 마다)과 R1271 피격 반투명(0.5초마다)이 ThreeRenderer.prototype.render 를 '바깥 함수에 내 표식이 없으면
//   다시 감싼다'로 서로의 표식을 가려 번갈아 끝없이 감쌌다. 새 지역·3D 재시작 때 새 렌더러가 이 깊은 prototype render 를 받아 스택이 넘쳤다([3D init]→[3D render]).
//  원인 ②(인스턴스, 헤드리스 실측 qa/r1344/depth.mjs): R1103 경고 도형(0.7초)과 7대죄 방 그림 sin-room-art(0.4초)가 인스턴스 render 를 WeakSet 만 보고
//   서로의 감싸개를 덮어 번갈아 감쌌다(40초에 각 77겹, 계속 늘어남).
//  render 는 프레임마다 불리므로 겹이 쌓일수록 느려지고, 오래 플레이하면 호출 스택이 넘쳐 3D 가 멈춘다. 같은 종류 앞선 검사: qa/wrap-once, qa/r1290.
// 검사: ① 주기 감싸기를 많이 돌려도 render 깊이가 늘지 않음 ② 두 감싸기 모두 걸려 있음(한 번 render 에 각 손질이 정확히 한 번)
//       ③ 표식을 안 옮기는 다른 덧씌우기가 한 번 끼어도 깊이는 한 번만 늘고 멈춤 ④ 경고 도형 명령(r1103Drop)은 빠지고 다른 명령은 그대로 ⑤ 빌드 사본 = client-source
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'../../..'),R=path.join(ROOT,'r96');let n=0,bad=0;
const ok=(c,m,d)=>{n++;if(!c){bad++;console.log('FAIL',m,d!==undefined?JSON.stringify(d).slice(0,300):'');}else console.log('ok  ',m,d!==undefined?JSON.stringify(d).slice(0,160):'');};
const rd=f=>{try{return fs.readFileSync(f,'utf8');}catch(_){return'';}};
const NAMES=['warning-shapes-r1103.js','sin-room-art.js','michaela-flashguard-r1267.js','hit-translucent-r1271.js'];
Error.stackTraceLimit=Infinity;
function stage(){
 const store={},intervals=[];
 const sb={console:{log(){},warn(){},error(){}},JSON,Date,Set,Map,WeakMap,WeakSet,Object,Array,Number,String,Boolean,Symbol,Error,Math,Promise,isFinite,URL,
  setTimeout:()=>0,TextEncoder,clearTimeout(){},setInterval:(f,ms)=>{intervals.push(f);return intervals.length;},clearInterval(){},requestAnimationFrame:()=>0,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}},
  document:{createElement:()=>({getContext:()=>null}),getElementById:()=>null}};
 sb.window=sb;vm.createContext(sb);
 vm.runInContext(`
  function tick(){time+=.016;}function drawEffect(){}var ctx=null;var started=true,modal=false,loading=false,storyScene=null,layer='STORY',time=100;
  var player={hero:'gunner',x:10,y:10,hp:100};var room={id:'ep1b04',layer:'STORY',props:[]};
  var __d=()=>new Error().stack.split('\\n').length,__depth=0,__base=0,__seen=null;
  function DrawCommands(){this.commands=[];}
  DrawCommands.prototype.push=function(kind,data){this.commands.push({kind,...data});};
  function ThreeRenderer(){}
  ThreeRenderer.prototype.render=function(frame){__depth=__d();__base++;__seen=(frame?.commands||[]).map(c=>c.id);};
  ThreeRenderer.prototype.activateTerrain=function(){};ThreeRenderer.prototype.admitTerrain=function(){};ThreeRenderer.prototype.clearScene=function(){};
  var StoryPhase1={DrawCommands,ThreeRenderer};
  var __inst=new ThreeRenderer();
  // perf-r97 처럼 인스턴스에 render 를 복사해 둔다
  __inst.render=ThreeRenderer.prototype.render;
  window.__STORYWORLD_PHASE1__={controller:{state:{three:__inst}}};
 `,sb);
 for(const N of NAMES)vm.runInContext(rd(path.join(R,'client-source',N)),sb,{filename:N});
 const pump=k=>{for(let i=0;i<k;i++){for(const f of intervals.slice())try{f();}catch(_){}try{vm.runInContext('tick()',sb);}catch(_){}}};
 const proto=()=>{vm.runInContext('__base=0;new ThreeRenderer().render({commands:[{id:"keep",kind:"image"}]})',sb);return {depth:vm.runInContext('__depth',sb),base:vm.runInContext('__base',sb)};};
 const depth=()=>{vm.runInContext('__base=0;__inst.render({commands:[{id:"keep",kind:"image"},{id:"warn",kind:"fill",r1103Drop:"final42"}]})',sb);return {depth:vm.runInContext('__depth',sb),base:vm.runInContext('__base',sb),seen:vm.runInContext('__seen',sb)};};
 return {sb,pump,depth,proto,run:c=>vm.runInContext(c,sb)};
}
{const S=stage();
 ok(S.sb.__STORYWORLD_WARNING_SHAPES_R1103__&&S.sb.__STORYWORLD_SIN_ROOM_ART__!==null,'두 오버레이 읽힘');
 S.pump(3);const p0=S.proto();S.pump(400);const p1=S.proto();S.pump(400);const p2=S.proto();
 ok(p1.depth<=p0.depth&&p2.depth<=p0.depth,'① prototype render 깊이 그대로(R1267·R1271) ('+p0.depth+' → '+p1.depth+' → '+p2.depth+')',{p0:p0.depth,p1:p1.depth,p2:p2.depth});
 ok(p2.base===1,'② prototype: 한 번 render 에 바닥 render 한 번',p2.base);
 const pm=S.run('Object.keys(ThreeRenderer.prototype.render).filter(k=>/1267|1271|1103|sin/i.test(k))');
 ok(['1267','1271','1103'].every(t=>pm.some(k=>k.includes(t)))&&pm.some(k=>/sin/i.test(k)),'② prototype render 바깥에 네 표식 모두 있음',pm);
 const d0=S.depth();S.pump(400);const d1=S.depth();S.pump(400);const d2=S.depth();
 ok(d1.depth<=d0.depth&&d2.depth<=d0.depth,'① 주기 감싸기 800바퀴 뒤에도 render 깊이 그대로 ('+d0.depth+' → '+d1.depth+' → '+d2.depth+')',{d0:d0.depth,d1:d1.depth,d2:d2.depth});
 ok(d2.base===1,'② 한 번 render 에 바닥 render 한 번',d2.base);
 ok(JSON.stringify(d2.seen)==='["keep"]','④ 경고 도형 명령은 빠지고 다른 명령은 그대로',d2.seen);
 // ② 두 손질이 각각 정확히 한 번: 인스턴스 render 문자열 체인 대신 표식으로 확인
 const marks=S.run('Object.keys(__inst.render).filter(k=>/^_*r\\d+|sinRoom/i.test(k))');
 ok(marks.some(k=>/1103/.test(k))&&marks.some(k=>/sin/i.test(k)),'② 인스턴스 render 바깥에 두 표식(R1103·sin-room-art) 모두 있음',marks);
 // ③ 표식을 안 옮기는 다른 덧씌우기
 S.run('{const b=__inst.render;__inst.render=function(){return b.apply(this,arguments);};}');
 S.pump(2);const d3=S.depth();S.pump(400);const d4=S.depth();
 ok(d4.depth<=d3.depth&&d3.depth<=d2.depth+12,'③ 표식 없는 덧씌우기가 끼어도 한 번만 늘고 멈춤 ('+d2.depth+' → '+d3.depth+' → '+d4.depth+')',{d2:d2.depth,d3:d3.depth,d4:d4.depth});
 ok(d4.base===1&&JSON.stringify(d4.seen)==='["keep"]','③ 그 뒤에도 바닥 한 번·경고 도형 빠짐',d4);}
// ⑥ render 를 감싸는 오버레이 전부(client-source 에서 찾음)를 함께 올려도 prototype·인스턴스 깊이가 늘지 않음
{const {execFileSync}=require('child_process');const dir=path.join(R,'client-source');
 const all=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).filter(f=>{const t=rd(path.join(dir,f));return /ThreeRenderer|controller\??\.state\??\.three/.test(t)&&/\.render\s*=|\[name\]\s*=|\['render'\]/.test(t);});
 const out=execFileSync(process.execPath,[path.join(__dirname,'all-render-wrap-probe.cjs'),...all],{encoding:'utf8'});const j=JSON.parse(out.trim().split('\n').pop());
 ok(all.length>=40,'⑥ render 감싸는 오버레이 '+all.length+'개 함께 올림',Object.keys(j.loadErr));
 ok(j.b.inst<=j.a.inst&&j.b.proto<=j.a.proto,'⑥ 300바퀴 뒤 인스턴스 '+j.a.inst+'→'+j.b.inst+', prototype '+j.a.proto+'→'+j.b.proto,j.grow);}
// ⑤ 빌드 사본
for(const N of NAMES){const a=rd(path.join(R,'client-source',N)),b=rd(path.join(R,'runtime-text',N));ok(a&&a===b,'⑤ runtime-text/'+N+' = client-source');}
console.log(bad?'R1344 render wrap CPU FAIL '+bad+'/'+n:'R1344 render wrap CPU ALL OK '+n);process.exit(bad?1:0);

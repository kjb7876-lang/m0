// R1329d CPU 검사: 장면 캡처(DrawCommands) 중 save/restore 짝이 안 맞아도 3D 가 멈추지 않고(Unbalanced original draw state),
// 짝 안 맞은 save 의 주인(owner id)이 오류 기록에 남는지. 실제 dist/phase1.js 의 DrawCommands 클래스를 그대로 쓴다.
const fs=require('fs'),path=require('path'),vm=require('vm');const R=path.join(__dirname,'..','..');
let fail=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fail++;};
const src=fs.readFileSync(path.join(R,'runtime-text/dist/phase1.js'),'utf8');
const a=src.indexOf('class DrawCommands {'),b=src.indexOf('\n}\n',a);ok(a>0&&b>a,'phase1.js 에 DrawCommands 클래스');
const rec=[];const win={StoryPhase1:null,__STORYWORLD_ERROR_LOG_R1288__:{record:(k,v)=>rec.push([k,v])},localStorage:{getItem:()=>null,setItem(){}}};
const ctx=vm.createContext({window:win,console,Error,Math,Map,Set,WeakSet,JSON,Object,Array,String,Number});
vm.runInContext(src.slice(a,b+2)+'\nwindow.StoryPhase1=Object.freeze({DrawCommands});',ctx);
const ov=path.join(R,'client-source/draw-balance-r1329d.js');ok(fs.existsSync(ov),'오버레이 draw-balance-r1329d.js 있음');
try{vm.runInContext(fs.readFileSync(ov,'utf8'),ctx);}catch(e){ok(false,'오버레이 읽기 '+e.message);}
const D=win.StoryPhase1.DrawCommands;const mk=()=>new D({canvas:{},makeCanvas:()=>({width:0,height:0})});
// 1) 짝 맞는 그리기는 그대로
{const d=mk();d.save();d.globalAlpha=.5;d.restore();let c,err=null;try{c=d.finish();}catch(e){err=e;}ok(!err&&Array.isArray(c),'짝 맞는 캡처는 그대로 끝남');}
// 2) 짝 안 맞는 save(그리기 중 예외로 restore 를 건너뛴 경우) → 던지지 않고 풀고 기록
{const d=mk();d.reset(1);d.scope({id:'enemy:dist01:mb-dist01',kind:'enemy'},()=>{d.save();d.globalAlpha=.3;});let err=null;try{d.finish();}catch(e){err=e;}
 ok(!err,'짝 안 맞는 save 가 있어도 finish 가 던지지 않음('+(err&&err.message)+')');ok(d.stack.length===0,'남은 save 를 모두 풀었음');
 const A=win.__STORYWORLD_DRAW_BALANCE_R1329D__;ok(!!A&&A.inspect().leaks===1,'API 에 짝 안 맞음 1회');
 ok(A&&/enemy:dist01:mb-dist01/.test(JSON.stringify(A.inspect().last)),'남은 save 의 주인 id 기록('+JSON.stringify(A&&A.inspect().last)+')');
 ok(rec.some(([k,v])=>k==='three'&&/Unbalanced/.test(v.message)&&/mb-dist01/.test(v.message)),'R1288 오류 기록에 남김');}
// 3) 같은 주인은 다음 프레임에 호출 위치(스택)를 붙여 한 번 더 남기고, 그 뒤로는 쌓지 않음(매 프레임 기록 금지)
{const n=rec.length;for(let i=0;i<5;i++){const d=mk();d.scope({id:'enemy:dist01:mb-dist01'},()=>d.save());d.finish();}
 const add=rec.slice(n);ok(add.length===1,'같은 주인 반복은 호출 위치 붙은 기록 1번만 더('+add.length+')');ok(add[0]&&/r1329d-cpu-check/.test(add[0][1].stack),'두 번째 기록에 save 호출 위치 스택');}
console.log(fail?'R1329D FAIL '+fail:'R1329D ALL OK');process.exit(fail?1:0);

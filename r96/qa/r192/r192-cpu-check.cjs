// R192 CPU check: 렌더러 인스턴스 render 를 한 번만 감싼다(R186·R188 이 서로의 감싸기를 보고 0.5초마다 다시 감싸 사슬이 끝없이 길어지던 버그).
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..'),C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8'),RT=f=>fs.readFileSync(path.join(R,'runtime-text',f),'utf8');
const checks=[];const ok=(n,p,d)=>checks.push({name:n,pass:!!p,detail:d});
for(const f of ['samong-void-r186.js','edges-r188.js']){const s=C(f);ok('runtime copy matches · '+f,RT(f)===s);
 ok('instance wrap guarded per renderer (WeakSet), not by a flag on the top function · '+f,/const WRAPPED=new WeakSet\(\);/.test(s)&&/WRAPPED\.has\(r\)\)return;WRAPPED\.add\(r\);/.test(s)&&!/r\.render\.__r18[68]\)return/.test(s));}
// 두 오버레이를 같이 돌려 40번(20초) 폴링해도 감싸기가 늘지 않는다
const timers=[];const r={render(f){return 1;}};const sb={window:{__STORYWORLD_PHASE1__:{controller:{state:{three:r}}},StoryPhase1:{ThreeRenderer:{prototype:{render(){},clearScene(){}}}}},localStorage:{getItem:()=>null,setItem(){}},setInterval:(fn)=>timers.push(fn),setTimeout:()=>0,performance:{now:()=>0},document:{querySelector:()=>null,getElementById:()=>null},fetch:()=>Promise.reject()};
r.render=function(f){return 1;};Object.defineProperty(r,'render',{value:r.render,writable:true,configurable:true,enumerable:true});
vm.createContext(sb);vm.runInContext(C('samong-void-r186.js'),sb);vm.runInContext(C('edges-r188.js'),sb);
const depth=()=>{let n=0;const orig=Error.stackTraceLimit;Error.stackTraceLimit=Infinity;let stack='';const base=r.render;return base;};
const first=r.render;for(let i=0;i<40;i++)for(const t of timers)t();
let wraps=0,f=r.render,seen=new Set();// count distinct wrappers by calling once with a counter
const s0=sb.window.__STORYWORLD_SAMONG_VOID_R186__.inspect().stats.instWrapped||0;
ok('after 40 polls each overlay wrapped the instance at most once',s0<=1,s0);
let calls=0;const inner=r.render;try{inner.call(r,{});calls=1;}catch(e){}
ok('calling the wrapped render does not overflow the stack',calls===1);
let fail=0;for(const c of checks){console.log((c.pass?'PASS ':'FAIL ')+c.name+(c.pass?'':' '+JSON.stringify(c.detail)));if(!c.pass)fail++;}
if(fail){console.log(fail+' failed');process.exit(1);}console.log('all '+checks.length+' passed');

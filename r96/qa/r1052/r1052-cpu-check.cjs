// R1052 CPU 검사: 성능 7단계 최고 사양(6·7단계) 화소 예산.
//  사용자 2026-11-15 10:02Z "최고사양 버그없는지 확인하고 7품질설정 디버깅개선 최적화".
//  찾은 문제: 6·7단계는 화면 크기와 상관없이 배율 1.75·2 를 곱해, 2560×1440 창에서 게임 캔버스가 5120×2792(1,430만 화소)가 됐다
//   (전투 HUD 캔버스도 같은 크기). 4K(3840×2160 = 829만 화소)를 넘는 초과 표본은 눈에 띄는 이득 없이 그리기·메모리만 늘린다.
//  고침: 6·7단계 배율은 캔버스가 829만 화소를 넘지 않게 줄이되, 5단계(엔진 기본 배율)보다 낮아지지는 않는다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,500):''));};
const F=path.join(R,'client-source','perf7-r1043.js');const src=fs.readFileSync(F,'utf8');
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return null;}};
ok('runtime copy identical to client-source',RT('perf7-r1043.js')===src);
const BUDGET=3840*2160,px=(p,w,h)=>p.dpr==null?null:Math.round(w*p.dpr)*Math.round(h*p.dpr);
// ---- 샌드박스 ----
function boot(o={}){const store=new Map(Object.entries(o.stored?{'storyworld.r1043.perf7':JSON.stringify(o.stored)}:{}));
 const calls={r1023:[],r150:[],r300:[],r450:[],r451:[],r453:[],resize:0};
 const mk=(name,init)=>{let p={...init};return {prefs:()=>({...p}),set(x){calls[name].push({...x});p={...p,...x};return {...p};}};};
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,WeakSet,Error,isFinite,parseFloat,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  navigator:{webdriver:false},devicePixelRatio:o.dev??(o.mobile?3:2),performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({style:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},appendChild(){},querySelectorAll:()=>[]}),head:{appendChild(){}},documentElement:{classList:{toggle(){},add(){},remove(){},contains:()=>false}},addEventListener(){}},
  addEventListener(){},requestAnimationFrame:()=>0,queueMicrotask:f=>f(),setTimeout:()=>0,
  settings:{lowFx:!!o.lowFx},W:1000,H:500,dpr:o.mobile?1:1.5,canvas:{width:o.mobile?1000:1500,height:o.mobile?500:750},
  showSettings(){},
 };
 sb.resize=function(){calls.resize++;sb.dpr=Math.min(sb.devicePixelRatio,sb.settings.lowFx?1:(o.mobile?1.25:1.5));sb.canvas.width=Math.round(sb.W*sb.dpr);sb.canvas.height=Math.round(sb.H*sb.dpr);};
 sb.window=sb;
 sb.__STORYWORLD_MOBILE_TIER_R1023__={setPref(p){calls.r1023.push(p);if(p==='low'||p==='mid')sb.settings.lowFx=true;else if(p==='high'||p==='pc')sb.settings.lowFx=false;sb.resize();return p;},inspect:()=>({tier:3,pref:'auto'}),active:()=>!!o.mobile};
 sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>!!o.mobile};
 sb.__STORYWORLD_PERF_R150__={inspect:()=>({prefs:{lite:'auto'}}),set(x){calls.r150.push({...x});}};
 sb.__STORYWORLD_LIGHT_ATMOS_R300__=mk('r300',{on:o.r300On??true});sb.__STORYWORLD_WEATHER_R450__=mk('r450',{on:true});
 sb.__STORYWORLD_LOCAL_LIGHT_R451__=mk('r451',{on:true});sb.__STORYWORLD_ACTOR_TONE_R453__=mk('r453',{on:true});
 vm.createContext(sb);vm.runInContext(src,sb);
 return {sb,calls,store,P:sb.__STORYWORLD_PERF7_R1043__,read:()=>({dpr:sb.dpr,cw:sb.canvas.width,lowFx:sb.settings.lowFx})};}

const a=boot();const P=a.P;
// 정상 경로: 보통 창(1280×720)은 그대로 1.75·2
ok('1280×720 PC: step 6 = 1.75, step 7 = 2 (under budget, unchanged)',P.plan(6,{dev:1,W:1280,H:720}).dpr===1.75&&P.plan(7,{dev:1,W:1280,H:720}).dpr===2,[P.plan(6,{dev:1,W:1280,H:720}).dpr,P.plan(7,{dev:1,W:1280,H:720}).dpr]);
ok('1920×1080 PC: step 7 = 2 (exactly 4K pixels)',P.plan(7,{dev:1,W:1920,H:1080}).dpr===2,P.plan(7,{dev:1,W:1920,H:1080}));
// 문제 사례: 큰 창
for(const [w,h,dev] of [[2560,1440,1],[2560,1440,1.25],[3440,1440,1],[1920,1080,1.5],[1707,960,1.5]])for(const s of [6,7]){const q=P.plan(s,{dev,W:w,H:h});const p=px(q,w,h);
 ok(`${w}×${h} dev ${dev}: step ${s} canvas ≤ 4K pixels (or engine default)`,q.dpr==null||p<=BUDGET*1.01,{dpr:q.dpr,px:p});}
// 경계: 5단계보다 낮아지지 않음(4K 창 dev 2 → 예산 아래로는 못 내려가니 엔진 기본 배율 그대로 = null)
{const q=P.plan(7,{dev:2,W:3840,H:2160});ok('3840×2160 dev 2: step 7 never below step 5 (dpr null = engine 1.5, or ≥1.5)',q.dpr==null||q.dpr>=1.5,q);}
{const q=P.plan(7,{dev:1,W:2560,H:1440});ok('2560×1440 dev 1: step 7 still sharper than step 5 (dpr > 1)',q.dpr!=null&&q.dpr>1,q);}
{const q=P.plan(6,{dev:1,W:2560,H:1440}),r=P.plan(7,{dev:1,W:2560,H:1440});ok('step 7 ≥ step 6 at same window',(r.dpr??0)>=(q.dpr??0),[q.dpr,r.dpr]);}
// 회귀: 창 크기를 안 주면 예전 값(기존 r1043 검사 계약)
ok('no W/H given → old values 1.75 / 2',P.plan(6,{dev:1}).dpr===1.75&&P.plan(7,{dev:1}).dpr===2);
ok('garbage W/H (NaN, 0, Infinity) → finite dpr, no NaN',[[NaN,720],[0,0],[Infinity,720],[-5,10]].every(([w,h])=>{const d=P.plan(7,{dev:1,W:w,H:h}).dpr;return d===2;}),[[NaN,720],[0,0],[Infinity,720]].map(([w,h])=>P.plan(7,{dev:1,W:w,H:h}).dpr));
ok('phone 844×390 dev 3: step 7 = 2 (small screen, unchanged)',P.plan(7,{mobile:true,dev:3,W:844,H:390}).dpr===2);
ok('step 1 stays 0.75 at any size',P.plan(1,{dev:1,W:2560,H:1440}).dpr===.75);
// 실제 적용: 엔진 창이 커지면(resize) 캔버스도 예산 안
{const b=boot({dev:1});b.sb.W=2560;b.sb.H=1440;b.P.setStep(7);const r=b.read();ok('runtime: 2560×1440 window at step 7 → canvas ≤ 4K pixels',r.cw*b.sb.canvas.height<=BUDGET*1.01&&r.dpr>1,{dpr:r.dpr,w:r.cw,h:b.sb.canvas.height});
 b.sb.W=1280;b.sb.H=720;b.sb.resize();const r2=b.read();ok('runtime: shrinking window back → dpr 2 again',r2.dpr===2&&r2.cw===2560,r2);
 ok('runtime: no errors recorded',b.P.inspect().stats.errors===0,b.P.inspect().lastError);}
console.log(`\nR1052 perf7 max: ${n-bad}/${n} pass`);process.exit(bad?1:0);

// R1201 CPU 검사: 성능 7단계를 단계마다 확실히 다르게(사용자 2026-11-19 04:03Z
//  "7가지성능설정에 따라 확실하게 더 화려해지고 단계내리면 확실하게 렉개선되도록").
//  재 본 것(R1200 스레드, 헤드리스 얼린 장면): 2~5단계 프레임·그리기 수가 거의 같고 6·7단계는 해상도만 올랐다.
//  → perf7 이 단계별 '효과 밀도' 배율(scale)을 내고, 효과 예산(R106)·날씨 입자(R450)·재·포자(R300)가 그 배율을 따른다.
//    2단계는 날씨·국지 조명도 끄고 배율 0.9, 6단계는 빛·날씨를 모두 켠다. 기본(PC 5단계 미선택·휴대폰 자동)은 배율 1 = 지금 그대로.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return null;}};
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,400):''));};
const src=C('perf7-r1043.js');
function boot(o={}){const store=new Map(Object.entries(o.stored?{'storyworld.r1043.perf7':JSON.stringify(o.stored)}:{}));
 const calls={r300:[],r450:[],r451:[],r453:[]};const mk=(k)=>{let p={on:true};return {prefs:()=>({...p}),set(x){calls[k].push({...x});p={...p,...x};return {...p};}};};
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,Error,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},devicePixelRatio:o.dev??1,performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],head:{appendChild(){}},addEventListener(){}},
  addEventListener(){},requestAnimationFrame:()=>0,queueMicrotask:f=>f(),setTimeout:()=>0,settings:{lowFx:false},W:1000,H:500,dpr:1,canvas:{width:1000,height:500},showSettings(){}};
 sb.resize=function(){sb.dpr=Math.min(sb.devicePixelRatio,1.5);sb.canvas.width=Math.round(sb.W*sb.dpr);sb.canvas.height=Math.round(sb.H*sb.dpr);};
 sb.window=sb;sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>!!o.mobile};
 sb.__STORYWORLD_MOBILE_TIER_R1023__={setPref(){},inspect:()=>({tier:3})};sb.__STORYWORLD_PERF_R150__={set(){}};
 sb.__STORYWORLD_LIGHT_ATMOS_R300__=mk('r300');sb.__STORYWORLD_WEATHER_R450__=mk('r450');sb.__STORYWORLD_LOCAL_LIGHT_R451__=mk('r451');sb.__STORYWORLD_ACTOR_TONE_R453__=mk('r453');
 vm.createContext(sb);vm.runInContext(src,sb);return {sb,calls,P:sb.__STORYWORLD_PERF7_R1043__};}
const a=boot();const P=a.P;
ok('perf7 exposes scale()',typeof P.scale==='function');
const pc=[1,2,3,4,5,6,7].map(s=>P.plan(s,{mobile:false,dev:1})),mo=[1,2,3,4,5,6,7].map(s=>P.plan(s,{mobile:true,dev:3}));
const sc=pc.map(p=>p.scale);
ok('effect density strictly rises 1→7',sc.every(v=>Number.isFinite(v))&&sc.every((v,i)=>i===0||v>sc[i-1]),sc);
ok('step 5 (PC default) = 1, step 1 ≤ 0.45, step 7 ≥ 1.75',sc[4]===1&&sc[0]<=.45&&sc[6]>=1.75,sc);
ok('phone uses the same density table',JSON.stringify(mo.map(p=>p.scale))===JSON.stringify(sc));
ok('auto / unset plan → density 1 (current default untouched)',P.plan('auto',{mobile:true,dev:3}).scale===1&&P.plan(null).scale===1);
ok('PC never chose a step → scale() 1',P.step()===5&&P.scale()===1);
P.setStep(1);const s1=P.scale();P.setStep(7);const s7=P.scale();P.setStep(5);
ok('setStep drives scale() live (1 → low, 7 → high, 5 → 1)',s1===sc[0]&&s7===sc[6]&&P.scale()===1,[s1,s7,P.scale()]);
ok('step 2 renders a bit below step 3 (dpr 0.9)',pc[1].dpr===.9&&mo[1].dpr===.9&&pc[2].dpr==null);
ok('step 2 switches weather and local light off (keeps light/fog, actor tone)',JSON.stringify(pc[1].force)===JSON.stringify({r450:false,r451:false}));
ok('step 6 switches every light/weather extra on like 7',JSON.stringify(pc[5].force)===JSON.stringify({r300:true,r450:true,r451:true,r453:true}));
ok('steps 3–5 leave the extras to the player',[2,3,4].every(i=>pc[i].force==null));
{const b=boot();b.P.setStep(2);const on2=b.calls.r450.at(-1);b.P.setStep(4);const back=b.calls.r450.at(-1);
 ok('leaving step 2 restores the player weather setting',on2&&on2.on===false&&back&&back.on===true,[on2,back]);}
{const b=boot({stored:{off:true}});ok('perf7 off → scale() 1',b.P.scale()===1);}
// 소비자: 예산·입자 수가 배율을 따른다(배율 없거나 깨진 값이면 1)
const fx=C('fx-sprites-r106.js'),wx=C('weather-r450.js'),la=C('light-atmos-r300.js');
for(const [f,s] of [['fx-sprites-r106.js',fx],['weather-r450.js',wx],['light-atmos-r300.js',la]]){
 ok(f+' reads the perf7 density',/__STORYWORLD_PERF7_R1043__\?\.scale/.test(s));ok(f+' runtime copy identical',RT(f)===s);}
ok('R106 effect budget = 150 × density',/fb0=FB\*dens\(\)/.test(fx)||/FB\*dens\(\)/.test(fx));
ok('R450 rain/snow/splash/gust/dust counts × density, still capped by MAXN',(wx.match(/\*dens\(\)/g)||[]).length>=5&&/Math\.min\(MAXN\.flake/.test(wx));
ok('R300 motes × density inside a buffer big enough for step 7',/motes:lf\?0:Math\.round\(CFG\.motes\[t\]\*dens\(\)\)/.test(la)&&/MOTE_CAP/.test(la));
// density helper: NaN/Infinity/0 → 1, clamp 0.2..2
{const m=/const dens=(.+?;)\/\* R1201/.exec(wx);let okd=false;if(m){const box={window:{__STORYWORLD_PERF7_R1043__:{scale:()=>NaN}}};vm.createContext(box);const f=vm.runInContext('(()=>{const window=this.window;const dens='+m[1]+'return dens;})()',box);
 const r=[];for(const v of [NaN,Infinity,0,-1,.4,1.8,9]){box.window.__STORYWORLD_PERF7_R1043__.scale=()=>v;r.push(f());}okd=JSON.stringify(r)===JSON.stringify([1,1,1,1,.4,1.8,2]);ok('density guard: bad values → 1, clamped ≤ 2',okd,r);}else ok('density guard present in weather-r450',false);}
ok('CI runs this check',/qa\/r1201\/r1201-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
console.log(JSON.stringify({passed:n-bad,failed:bad}));process.exit(bad?1:0);

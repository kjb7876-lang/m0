// R1043 CPU 검사: 성능 7단계(perf7-r1043.js) + 도달 판정 렉(reach-r225 막힘 계산 캐시).
//  사용자 2026-11-15 "간이설정에 성능최적화 7단계로 해서 지금최하보다 더렉개선된거랑 완전풀옵션추가 하면서 전반적인 렉개선 디버깅".
//  1단계 = 지금 최저(낮음)보다 가벼운 초저사양, 2단계 = 지금 최저(휴대폰 기본), 5단계 = 지금 PC 기본, 7단계 = 풀옵션.
//  휴대폰 기본은 '자동'(R1023 그대로, 꺼짐 #572 위험 때문에 지금 수준이 최저 기본). PC 기본은 아무것도 바꾸지 않는다.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');const C=f=>fs.readFileSync(path.join(R,'client-source',f),'utf8');
let n=0,bad=0;const ok=(m,c,x)=>{n++;if(!c)bad++;console.log((c?'PASS ':'FAIL ')+m+(!c&&x!==undefined?' '+JSON.stringify(x).slice(0,500):''));};
const F=path.join(R,'client-source','perf7-r1043.js');ok('perf7-r1043.js exists',fs.existsSync(F));
const src=fs.existsSync(F)?fs.readFileSync(F,'utf8'):'';
const RT=f=>{try{return fs.readFileSync(path.join(R,'runtime-text',f),'utf8');}catch(_){return null;}};
ok('runtime copy identical to client-source',RT('perf7-r1043.js')===src&&src.length>0);
const html=RT('index.html')||'';
ok('script tag once, on its own line right after mobile-tier-r1023',html.includes('<script src="./mobile-tier-r1023.js"></script>\n<script src="./perf7-r1043.js"></script>\n')&&html.split('perf7-r1043.js').length===2);
ok('in the public verify list and the CI workflow',/'perf7-r1043\.js'/.test(fs.readFileSync(path.join(R,'..','scripts','verify-r96-public.py'),'utf8'))&&/qa\/r1043\/r1043-cpu-check\.cjs/.test(fs.readFileSync(path.join(R,'..','.github','workflows','pages.yml'),'utf8')));
ok('R1043b: hospital test section hidden from settings (user 11-15 04:02Z 허락)',/DEV_HIDE=\[[^\]]*'#hospitalTestSettingsR84'/.test(src));
ok('presentation only: no damage / hp / save writes',src.length>0&&!/hitEnemy|\.hp\s*=|saveGame\(|player\.\w+\s*=/.test(src));

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
if(src){
 const a=boot();const P=a.P;ok('API exposed (setStep, step, plan, inspect)',!!P&&typeof P.setStep==='function'&&typeof P.plan==='function'&&typeof P.inspect==='function');
 if(P){
  // 순수 계획표
  const pc=[1,2,3,4,5,6,7].map(s=>P.plan(s,{mobile:false,dev:1})),mo=[1,2,3,4,5,6,7].map(s=>P.plan(s,{mobile:true,dev:3}));
  ok('7 steps map onto R1023 tiers: 1·2 low, 3 mid, 4 high, 5·6·7 pc',pc.map(p=>p.r1023).join()==='low,low,mid,high,pc,pc,pc',pc.map(p=>p.r1023));
  ok('R150 light screen: 1 on, 2–5 auto, 6–7 off',pc.map(p=>p.lite).join()==='on,auto,auto,auto,auto,off,off',pc.map(p=>p.lite));
  ok('step 1 renders below the current lowest (dpr 0.75 < 1)',pc[0].dpr===.75&&mo[0].dpr===.75);
  ok('steps 2–5 leave resolution to R1023 (no override)',[1,2,3,4].every(i=>pc[i].dpr==null&&mo[i].dpr==null));
  ok('PC 6 = 1.75, 7 = 2 (supersampled even on a 1x screen)',pc[5].dpr===1.75&&pc[6].dpr===2,[pc[5].dpr,pc[6].dpr]);
  ok('phone 6/7 capped by the device ratio (dev 1.5 → 1.5)',P.plan(7,{mobile:true,dev:1.5}).dpr===1.5&&P.plan(6,{mobile:true,dev:3}).dpr===1.75&&P.plan(7,{mobile:true,dev:3}).dpr===2);
  ok('step 1 switches light/fog, weather, local light, actor tone off; step 7 forces them on; others leave them',JSON.stringify(pc[0].force)===JSON.stringify({r300:false,r450:false,r451:false,r453:false})&&JSON.stringify(pc[6].force)===JSON.stringify({r300:true,r450:true,r451:true,r453:true})&&[1,2,3,4,5].every(i=>pc[i].force==null));
  ok('6 and 7 force full effects (lowFx off)',pc[5].lowFx===false&&pc[6].lowFx===false&&pc[0].lowFx==null);
  // 경계값
  ok('step clamp: 0→1, 99→7, 3.6→4, "5"→5',P.norm(0)===1&&P.norm(99)===7&&P.norm(3.6)===4&&P.norm('5')===5);
  ok('NaN / Infinity / garbage → null (keep default)',P.norm(NaN)===null&&P.norm(Infinity)===null&&P.norm('x')===null&&P.norm(undefined)===null&&P.norm('auto')==='auto');
  ok('auto plan = R1023 auto, light auto, nothing forced',(()=>{const q=P.plan('auto',{mobile:true,dev:3});return q.r1023==='auto'&&q.lite==='auto'&&q.dpr==null&&q.force==null;})());
  // PC 기본: 아무것도 안 바꿈
  ok('PC default: step 5 shown, nothing applied (R1023/R150/R300 untouched, dpr 1.5)',P.step()===5&&a.calls.r1023.length===0&&a.calls.r150.length===0&&a.calls.r300.length===0&&a.read().dpr===1.5,{calls:a.calls,r:a.read()});
  // 1단계
  P.setStep(1);let r=a.read();
  ok('step 1: R1023 low, R150 light on, dpr 0.75, canvas 750 wide',a.calls.r1023.at(-1)==='low'&&a.calls.r150.at(-1)?.lite==='on'&&r.dpr===.75&&r.cw===750,{c:a.calls,r});
  ok('step 1: light/weather/local light/actor tone switched off',a.calls.r300.at(-1)?.on===false&&a.calls.r450.at(-1)?.on===false&&a.calls.r451.at(-1)?.on===false&&a.calls.r453.at(-1)?.on===false);
  ok('step saved',/"step":1/.test(a.store.get('storyworld.r1043.perf7')||''));
  a.sb.resize();ok('engine resize keeps the step 1 resolution',a.read().dpr===.75&&a.read().cw===750);
  P.setStep(3);r=a.read();
  ok('step 3: R1023 mid, light auto, resolution back to R1023 (dpr 1), user effects restored on',a.calls.r1023.at(-1)==='mid'&&a.calls.r150.at(-1)?.lite==='auto'&&r.dpr===1&&a.calls.r300.at(-1)?.on===true&&a.calls.r453.at(-1)?.on===true,{c:a.calls,r});
  P.setStep(7);r=a.read();
  ok('step 7: R1023 pc, light off, lowFx off, dpr 2, canvas 2000',a.calls.r1023.at(-1)==='pc'&&a.calls.r150.at(-1)?.lite==='off'&&r.lowFx===false&&r.dpr===2&&r.cw===2000,{r});
  P.setStep(5);r=a.read();ok('back to 5: dpr 1.5 (engine default)',r.dpr===1.5&&r.cw===1500,r);
  // 사람이 꺼 둔 빛·안개는 1→다른 단계에서 꺼진 채로 돌아온다
  const b=boot({r300On:false});b.P.setStep(1);b.P.setStep(4);ok('a user-off R300 stays off after leaving step 1',b.calls.r300.at(-1)?.on===false,b.calls.r300);
  const b7=boot({r300On:false});b7.P.setStep(7);const on7=b7.calls.r300.at(-1)?.on;b7.P.setStep(5);ok('step 7 turns a user-off R300 on, leaving 7 restores off',on7===true&&b7.calls.r300.at(-1)?.on===false,b7.calls.r300);
  // 저장된 단계는 부팅 때 적용
  const c=boot({stored:{step:2}});ok('stored step 2 applies at boot (R1023 low)',c.P.step()===2&&c.calls.r1023.at(-1)==='low');
  const g=boot({stored:{step:'zz'}});ok('garbage storage: default, nothing applied',g.P.step()===5&&g.calls.r1023.length===0);
  // 휴대폰
  const m=boot({mobile:true,dev:3});ok('phone default: auto, nothing applied (R1023 auto keeps current public = lowest default)',m.P.step()==='auto'&&m.calls.r1023.length===0&&m.calls.r150.length===0&&m.read().dpr===1);
  m.P.setStep(1);ok('phone step 1: dpr 0.75',m.read().dpr===.75);m.P.setStep('auto');ok('phone back to auto: R1023 auto, R150 auto',m.calls.r1023.at(-1)==='auto'&&m.calls.r150.at(-1)?.lite==='auto');
  // NaN 이 화면 크기에 들어가지 않는다
  ok('NaN / 0 device ratio: planned dpr stays finite',[NaN,0,-2,Infinity].every(d=>[1,6,7].every(s=>Number.isFinite(P.plan(s,{mobile:true,dev:d}).dpr))));
 }
}
// ---- reach-r225 막힘 계산 렉: 3초마다 지역 전체를 다시 훑으며 blocked() 를 칸마다 부르던 것 → 같은 지역은 계산 결과를 잠깐 다시 쓴다 ----
{const rc=C('reach-r225.js');let calls=0,NOW=1e6;const FakeDate={now:()=>NOW};const mk=()=>{const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,Error,isFinite,setInterval:()=>0,Date:FakeDate,
  localStorage:{getItem:()=>null,setItem(){}},window:{},started:true,loading:false,time:0,player:{x:5.5,y:5.5,hp:5},
  room:{id:'z',enemies:[{hp:5,x:6.5,y:6.5,spawnState:'active'}],exploration:{floorCells:[[1,1]],bounds:[0,0,40,40],entry:{x:5.5,y:5.5},worldR74:{doors:[]}}},
  blocked:(x,y)=>{calls++;return x<1||y<1||x>39||y>39;}};sb.window=sb;vm.createContext(sb);vm.runInContext(rc,sb);return sb;};
 const sb=mk();calls=0;sb.window.__STORYWORLD_REACH_R225__.check();const first=calls;calls=0;sb.time+=3;sb.window.__STORYWORLD_REACH_R225__.check();const second=calls;
 ok('reach check: a repeat check in the same area reuses wall tests (≥5× fewer blocked() calls)',first>0&&second*5<=first,{first,second});
 NOW+=16000;calls=0;sb.window.__STORYWORLD_REACH_R225__.check();ok('after 15 s the walls are measured again (doors/props that changed are seen)',calls>=first*.5,{calls,first});
 sb.room={...sb.room,id:'z2',exploration:{...sb.room.exploration}};calls=0;sb.window.__STORYWORLD_REACH_R225__.check();ok('a new area (new layout) is measured fresh',calls>=first*.5,{calls,first});
 const e=sb.room.enemies[0];e.x=6.5;e.y=6.5;sb.blocked=(x,y)=>{calls++;return x<1||y<1||x>39||y>39||(x>9.5&&x<10.5);};NOW+=16000;e.x=20.5;e.y=6.5;sb.time+=3;sb.window.__STORYWORLD_REACH_R225__.check();
 ok('a new wall after the cache window: enemy beyond it is still moved back into reach',e.x<10,{x:e.x});}
console.log((bad?'R1043 CPU FAILED ':'R1043 CPU PASSED ')+(n-bad)+'/'+n);process.exit(bad?1:0);

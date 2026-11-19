// R1203 CPU 검사: 성능 단계를 어디서 어디로 바꿔도 빛·안개(R300)·날씨(R450)·국지 조명(R451)·캐릭터 색감(R453)이
//  그 단계를 처음부터 고른 것과 같아야 한다(사용자 2026-11-19 06:46Z: 1·6·7단계에서 바로 2단계로 가면 이전 단계 조명·안개·색감이 남음).
//  모든 출발·도착 쌍(1~7, 자동) × 사람 설정 여러 가지, 두 번·세 번 이어 바꾸기, 새로 읽기(저장된 held) 까지.
'use strict';const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.resolve(__dirname,'..','..');const src=fs.readFileSync(path.join(R,'client-source','perf7-r1043.js'),'utf8');
let n=0,bad=0;const fails=[];const ok=(m,c,x)=>{n++;if(!c){bad++;if(fails.length<12)fails.push(m+' '+JSON.stringify(x));}};
const KEYS=['r300','r450','r451','r453'];
function boot(user,store=new Map(),mob=false){const mods={};const mk=k=>{let p={on:user[k]};return {prefs:()=>({...p}),set(x){p={...p,...x};return {...p};}};};
 const sb={console,Math,JSON,Number,String,Object,Array,Map,Set,WeakMap,Error,isFinite,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))},devicePixelRatio:1,performance:{now:()=>0},
  document:{readyState:'complete',getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],head:{appendChild(){}},addEventListener(){}},
  addEventListener(){},requestAnimationFrame:()=>0,queueMicrotask:f=>f(),setTimeout:()=>0,settings:{lowFx:false},W:1000,H:500,dpr:1,canvas:{width:1000,height:500},showSettings(){}};
 sb.resize=function(){};sb.window=sb;sb.__STORYWORLD_MOBILE_R63__={isMobile:()=>mob};
 sb.__STORYWORLD_MOBILE_TIER_R1023__={setPref(){},inspect:()=>({tier:3})};sb.__STORYWORLD_PERF_R150__={set(){}};
 sb.__STORYWORLD_LIGHT_ATMOS_R300__=mods.r300=mk('r300');sb.__STORYWORLD_WEATHER_R450__=mods.r450=mk('r450');sb.__STORYWORLD_LOCAL_LIGHT_R451__=mods.r451=mk('r451');sb.__STORYWORLD_ACTOR_TONE_R453__=mods.r453=mk('r453');
 vm.createContext(sb);vm.runInContext(src,sb);return {P:sb.__STORYWORLD_PERF7_R1043__,state:()=>KEYS.map(k=>mods[k].prefs().on).join(),store};}
const STEPS=[1,2,3,4,5,6,7,'auto'];
const USERS=[{r300:true,r450:true,r451:true,r453:true},{r300:false,r450:true,r451:false,r453:true},{r300:true,r450:false,r451:true,r453:false},{r300:false,r450:false,r451:false,r453:false}];
for(const mob of [false,true])for(const u of USERS){
 const want={};for(const s of STEPS){const b=boot(u,new Map(),mob);b.P.setStep(s);want[s]=b.state();}
 const userState=KEYS.map(k=>u[k]).join();
 ok('fresh 3/4/5 keep the player settings ('+userState+')',[3,4,5].every(s=>want[s]===userState),want);
 for(const a of STEPS)for(const b of STEPS){const x=boot(u,new Map(),mob);x.P.setStep(a);x.P.setStep(b);ok((mob?'phone ':'pc ')+a+'→'+b+' same as picking '+b+' fresh',x.state()===want[b],{user:u,got:x.state(),want:want[b]});}
 for(const a of STEPS)for(const b of STEPS)for(const c of [2,5]){const x=boot(u,new Map(),mob);x.P.setStep(a);x.P.setStep(b);x.P.setStep(c);ok(a+'→'+b+'→'+c,x.state()===want[c],{got:x.state(),want:want[c]});}
 // 새로 읽기: a 에서 저장된 뒤 다시 켜고 b
 for(const a of [1,2,6,7])for(const b of STEPS){const st=new Map();const x=boot(u,st,mob);x.P.setStep(a);const y=(()=>{/* 같은 저장소·현재 모듈 값으로 다시 부팅 */const cur={};x.state().split(',').forEach((v,i)=>cur[KEYS[i]]=v==='true');return boot(cur,st,mob);})();y.P.setStep(b);ok('reload at '+a+' then '+b,y.state()===want[b],{got:y.state(),want:want[b]});}
}
console.log(fails.join('\n'));console.log(JSON.stringify({passed:n-bad,failed:bad}));process.exit(bad?1:0);

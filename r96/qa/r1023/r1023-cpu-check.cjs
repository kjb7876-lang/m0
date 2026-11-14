// R1023 휴대폰 그래픽 자동 단계 CPU 검사(브라우저 없이 vm 으로 판정 규칙만 본다). 브라우저 검사는 r1023-mobile-tier.mjs.
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=path.join(__dirname,'..','..');
let n=0,bad=0;const ok=(m,c,x)=>{n++;console.log(c?'PASS':'FAIL',m,x!==undefined?JSON.stringify(x).slice(0,300):'');if(!c)bad++;};
const src=fs.readFileSync(path.join(R,'client-source','mobile-tier-r1023.js'),'utf8');
const html=fs.readFileSync(path.join(R,'runtime-text','index.html'),'utf8');
ok('runtime copy identical to client-source',fs.readFileSync(path.join(R,'runtime-text','mobile-tier-r1023.js'),'utf8')===src);
const i980=html.indexOf('<script src="./mobile-memory-r980.js"></script>'),i1023=html.indexOf('<script src="./mobile-tier-r1023.js"></script>');
ok('script tag present once, right after mobile-memory-r980',i1023>i980&&i980>0&&html.split('mobile-tier-r1023.js').length===2&&html.slice(i980,i1023).split('\n').length===2);
ok('presentation only: no damage / hp / save writes',!/hitEnemy|\.hp\s*=|saveGame\(|player\.\w+\s*=/.test(src));
for(const f of ['light-atmos-r300.js','weather-r450.js'])ok(f+' asks R1023 pcGrade before choosing the mobile budget',/T\?\(T\.pcGrade\(\)\?'pc':'mobile'\):\(mobile\(\)\?'mobile':'pc'\)/.test(fs.readFileSync(path.join(R,'client-source',f),'utf8')));
const m980=fs.readFileSync(path.join(R,'client-source','mobile-memory-r980.js'),'utf8');
ok('R980 exposes setHalfMin / setTierHalf (not persisted)',/setHalfMin:v=>/.test(m980)&&/setTierHalf:\(v,force\)=>/.test(m980)&&!/setTierHalf:[^\n]*localStorage/.test(m980));

function boot({mobile=true,stored=null,webdriver=false}={}){
 const store=new Map();if(stored)store.set('storyworld.r1023.mobileTier',JSON.stringify(stored));
 const listeners={};const calls={half:[],tierHalf:[],resize:0};
 const ctx={console,Math,JSON,Number,String,Object,Array,Date,Map,Set,WeakMap,Promise,Error,
  localStorage:{getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
  navigator:{webdriver},performance:{now:()=>0},devicePixelRatio:3,requestAnimationFrame:()=>0,
  matchMedia:()=>({matches:mobile}),
  document:{readyState:'complete',hidden:false,visibilityState:'visible',getElementById:()=>null,addEventListener:(k,f)=>{listeners[k]=f;},head:{appendChild(){}},createElement:()=>({})},
  settings:{lowFx:mobile},W:844,H:390,canvas:{width:844,height:390},dpr:1,
  started:true,modal:false,loading:false,storyScene:null};
 ctx.window=ctx;ctx.window.addEventListener=(k,f)=>{listeners['w:'+k]=f;};
 ctx.__STORYWORLD_MOBILE_MEMORY_R980__={setHalfMin:v=>{calls.half.push(v);return v;},setTierHalf:v=>{calls.tierHalf.push(v);return v;}};
 vm.createContext(ctx);
 vm.runInContext('var dpr=1;function resize(){dpr=Math.min(devicePixelRatio||1,settings.lowFx?1:(matchMedia("(pointer:coarse)").matches?1.25:1.5));canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);__resizeCalls++;}var __resizeCalls=0;',ctx);
 vm.runInContext(src,ctx);
 return {ctx,T:ctx.__STORYWORLD_MOBILE_TIER_R1023__,store,calls,listeners,read:()=>vm.runInContext('({dpr,cw:canvas.width,lowFx:settings.lowFx})',ctx)};
}
// PC: 기본은 아무것도 바꾸지 않는다. 고르면 휴대폰과 같은 값.
{const b=boot({mobile:false});const i=b.T.inspect();vm.runInContext('resize()',b.ctx);
 ok('PC default: inactive auto, tier 3, dpr 1.5 as engine sets, R980 knobs untouched, lowFx untouched',i.active===false&&i.pcDefault===true&&i.tier===3&&b.read().dpr===1.5&&b.read().lowFx===false&&b.calls.half.length===0&&b.calls.tierHalf.length===0,{i,r:b.read(),calls:b.calls});
 b.T.qa({auto:true,deviceMemory:2});b.T._feed(60,120);ok('PC: slow frames never change tier (no auto on PC)',b.T.tier()===3);
 ok('PC: pcGrade true by default',b.T.pcGrade()===true);
 b.T.setPref('low');ok('PC low: lowFx on, dpr 1, half forced on PC',b.T.tier()===0&&b.read().lowFx===true&&b.read().dpr===1&&b.calls.tierHalf.at(-1)===true&&b.calls.half.at(-1)===5e5&&b.T.pcGrade()===false);
 ok('PC low: no crash-guard live record on PC',/"live":null/.test(b.store.get('storyworld.r1023.mobileTier')));
 b.T.setPref('pc');ok('PC back to pc: lowFx restored false, dpr 1.5, half off',b.T.tier()===3&&b.read().lowFx===false&&b.read().dpr===1.5&&b.calls.tierHalf.at(-1)===false);
 const c=boot({mobile:false});c.ctx.settings.lowFx=true;c.T.setPref('mid');c.T.setPref('pc');ok('PC: a user lowFx=true chosen before is restored on PC grade',c.read().lowFx===true);
 const d=boot({mobile:false,stored:{pref:'low',cap:3,live:{tier:2,at:1}}});ok('PC: stored low applies at boot, no crash guard on PC',d.T.tier()===0&&d.read().lowFx===true&&d.T.inspect().crashGuard===false&&d.T.inspect().cap===3);}
// 모바일 기본
{const b=boot();const i=b.T.inspect();
 ok('mobile: starts at tier 0 = current public (lowFx, dpr 1, half 500k)',i.tier===0&&b.read().lowFx===true&&b.read().dpr===1&&b.calls.half.at(-1)===5e5&&b.calls.tierHalf.at(-1)===true,{tier:i.tier,r:b.read(),calls:b.calls});
 ok('real frames are not sampled in an automated browser',boot({webdriver:true}).T.inspect().automated===true);
 b.T.qa({auto:true,deviceMemory:null,heapRatio:null});b.T._feed(16.7,300);ok('unknown memory: never upgrades',b.T.tier()===0&&b.T.maxAuto()===0);b.T.qa({deviceMemory:4});
 for(const v of [NaN,Infinity,-1,0,5000])b.T._feed(v,10);ok('invalid gaps ignored',b.T.tier()===0&&b.T.inspect().stats.errors===0);
 b.T._feed(16.7,19.5);ok('19.5 s good: no upgrade yet',b.T.tier()===0);
 b.T._feed(16.7,1.5);ok('just over 20 s good: tier 1',b.T.tier()===1);
 ok('tier 1 keeps lowFx & dpr 1, half threshold 2M',b.read().lowFx===true&&b.read().dpr===1&&b.calls.half.at(-1)===2e6);
 b.T._feed(16.7,300);ok('4GB: never above 1',b.T.tier()===1&&b.T.maxAuto()===1);
 // 중앙값은 넉넉하지만 상위 10% 가 긴 경우(가끔 끊김): 올리지 않는다.
 const c=boot();c.T.qa({auto:true,deviceMemory:8});for(let k=0;k<40;k++){for(let j=0;j<50;j++)c.T._feed(j%8===0?60:16.7,.0167*(j%8===0?60/16.7:1));}
 ok('median good but p90 > 34 ms (stutter): no upgrade',c.T.tier()===0,{tier:c.T.tier(),p90:c.T.inspect().stats.p90});
 // 기기 메모리별 최고 단계
 for(const [m,want] of [[2,0],[3,0],[4,1],[6,2],[8,3]]){const d=boot();d.T.qa({auto:true,deviceMemory:m});for(let k=0;k<6;k++)d.T._feed(16.7,25);ok('deviceMemory '+m+'GB: auto tops out at '+want,d.T.tier()===want,{tier:d.T.tier()});}
 // 단계 3 내용
 const e=boot();e.T.qa({auto:true,deviceMemory:8});for(let k=0;k<4;k++)e.T._feed(16.7,25);
 ok('tier 3: lowFx off, dpr 1.5, half off',e.T.tier()===3&&e.read().lowFx===false&&e.read().dpr===1.5&&e.read().cw===1266&&e.calls.tierHalf.at(-1)===false,{r:e.read(),th:e.calls.tierHalf.at(-1)});
 ok('pcGrade true only at tier 3',e.T.pcGrade()===true&&b.T.pcGrade()===false);
 e.T._feed(29,3.5);ok('slow 29 ms for 3.5 s: not yet dropped',e.T.tier()===3);
 e.T._feed(29,1);ok('slow ≥ 4 s: dropped to 2',e.T.tier()===2);
 ok('tier 2: lowFx off, dpr 1.25, half on (2M)',e.read().lowFx===false&&e.read().dpr===1.25&&e.calls.tierHalf.at(-1)===true&&e.calls.half.at(-1)===2e6,e.read());
 e.T._feed(16.7,119);ok('cooldown: no re-upgrade inside 120 s',e.T.tier()===2);
 e.T._feed(16.7,25);ok('after cooldown + 20 s good: back to 3',e.T.tier()===3);
 e.T._feed(40,5);ok('second drop from 3',e.T.tier()===2);
 e.T._feed(16.7,400);ok('two drops from 3 in a session: stays at 2',e.T.tier()===2&&e.T.inspect().sessionCap===2,{tier:e.T.tier(),i:e.T.inspect()});
 e.T.qa({heapRatio:.71});e.T._feed(16.7,1.2);ok('heap ≥ 70%: straight to 0',e.T.tier()===0&&e.read().lowFx===true&&e.read().dpr===1);
 e.T.qa({heapRatio:.55});e.T._feed(16.7,400);ok('heap 55% (≥ 50%): no upgrade',e.T.tier()===0);
 // 수동
 const f=boot();f.T.setPref('pc');ok('manual pc: tier 3, saved',f.T.tier()===3&&/"pref":"pc"/.test(f.store.get('storyworld.r1023.mobileTier')));
 f.T.qa({auto:true});f.T._feed(60,20);ok('manual tier ignores slow frames',f.T.tier()===3);
 f.T.setPref('low');ok('manual low: tier 0',f.T.tier()===0&&f.read().lowFx===true);
 ok('unknown pref ignored',f.T.setPref('ultra')==='low');
 // 꺼짐 감지
 const g=boot({stored:{pref:'auto',cap:3,live:{tier:2,at:1}}});ok('unclean exit at tier 2: cap 1, crashGuard',g.T.inspect().cap===1&&g.T.inspect().crashGuard===true&&g.T.tier()===0);
 g.T.qa({auto:true,deviceMemory:8});for(let k=0;k<10;k++)g.T._feed(16.7,25);ok('capped at 1',g.T.tier()===1);
 const h=boot({stored:{pref:'auto',cap:3,live:null}});ok('clean exit: no cap change',h.T.inspect().cap===3&&h.T.inspect().crashGuard===false);
 const k2=boot({stored:{pref:'auto',cap:'x',live:{tier:'y'}}});ok('garbage storage: defaults',k2.T.inspect().cap===3&&k2.T.inspect().crashGuard===false);
 // 숨김 → 깨끗한 종료로 기록
 const j=boot();j.T.setPref('high');ok('tier ≥1 writes live tier',/"live":\{"tier":2/.test(j.store.get('storyworld.r1023.mobileTier')));
 j.ctx.document.visibilityState='hidden';j.listeners.visibilitychange();ok('hidden: live cleared (clean)',/"live":null/.test(j.store.get('storyworld.r1023.mobileTier')));
 j.ctx.document.visibilityState='visible';j.listeners.visibilitychange();ok('visible again: live restored',/"live":\{"tier":2/.test(j.store.get('storyworld.r1023.mobileTier')));
 j.listeners['w:pagehide']();ok('pagehide: live cleared',/"live":null/.test(j.store.get('storyworld.r1023.mobileTier')));
}
console.log(bad?('FAILED '+bad+'/'+n):('ALL PASS '+n));process.exit(bad?1:0);

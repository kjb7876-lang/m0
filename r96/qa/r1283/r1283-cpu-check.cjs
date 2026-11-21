// R1283 CPU 검사 — 검수 남은 두 건(사용자 2026-11-21): ① PC 설정창을 열어 두면 계속 다시 그림(R1280) ② 영웅 교체 뒤 붉은 하이힐 칼날 공격·사망 모션 빠짐(R1281).
//  node r96/qa/r1283/r1283-cpu-check.cjs   — 실제 화면은 r1283-browser.mjs(헤드리스)
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,600));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');
for(const F of ['hero-switch-mem-r1281.js','settings-merge-r1280.js'])ok(rd('client-source/'+F)===rd('runtime-text/'+F),F+' runtime-text 사본과 같음');
// ---- ② R1281: 놓은 그림을 다시 찾으면 다시 받는다 ----
const src=rd('client-source/hero-switch-mem-r1281.js');
function box({noAdd=false}={}){let ivf=null;const clock={t:1000};const imageCache=new Map();const added=[];
 const img=p=>({src:p,naturalWidth:500,naturalHeight:500});
 const HEROES={hwando:{},lauren:{},neon:{}};const paths={hwando:['h/hw.webp'],lauren:['h/la.webp'],neon:['h/ne.webp']};
 const sb={console,Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,Promise,isFinite,Date,Error,
  localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>clock.t},setInterval:f=>{ivf=f;return 1;},clearInterval(){},setTimeout:()=>0,
  document:{readyState:'complete',addEventListener(){}},imageCache,HEROES,heroArt:Object.fromEntries(Object.keys(HEROES).map(id=>[id,{idle:{front:'f/'+id+'.webp'}}])),
  player:{hero:'hwando'},loading:false,zone:'z',layer:'STORY',VFX:{},PROPS:{},regionById:{z:{paths:[]}},settings:{},cleanPath:p=>String(p).replace(/^\.\//,''),
  heroPaths:id=>paths[id]||[],ensureImages:()=>Promise.resolve(),
  readyImage:p=>{const r=imageCache.get(p);return r&&r.ready?r:null;}};
 if(!noAdd)sb.addImage=p=>{added.push(p);if(imageCache.has(p))return imageCache.get(p);const r={path:p,ready:false,image:null,promise:Promise.resolve()};imageCache.set(p,r);r.ready=true;r.image=img(p);return r;};
 sb.window={addEventListener(){},__STORYWORLD_MOBILE_TIER_R1023__:{tier:()=>3},__STORYWORLD_PHASE1__:{controller:{state:{three:{commands:{textures:new Map()}}}}}};
 vm.createContext(sb);vm.runInContext(src,sb);const api=sb.window.__STORYWORLD_HERO_SWITCH_MEM_R1281__;
 const put=p=>imageCache.set(p,{path:p,ready:true,image:img(p)});const tick=(ms=300)=>{clock.t+=ms;ivf&&ivf();};const settle=()=>{for(let i=0;i<20;i++)tick();};
 const sw=h=>{sb.player.hero=h;tick();settle();};return {sb,api,put,tick,settle,sw,imageCache,added};}
const MOB='assets/r1065/mobs/ma-02-red-heel-blade-attack.webp',DIE='assets/r1111/mobs/md-16-red-heel-blade-death.webp';
{const B=box();B.tick();B.put(MOB);B.put(DIE);B.put('h/hw.webp');
 B.sw('lauren');B.sw('neon');
 ok(!B.imageCache.has(MOB)&&!B.imageCache.has(DIE),'전제: 환도로 싸울 때 받은 몹 시트는 두 번 교체 뒤 놓임(R1281 메모리 정리 유지)');
 ok(B.sb.readyImage(DIE)===null,'놓인 직후 readyImage 는 빈손(그 순간은 바탕 그림)');
 ok(B.added.includes(DIE)&&B.imageCache.get(DIE)?.ready,'놓인 그림을 readyImage 로 찾으면 그 자리에서 다시 받음(사망 시트)',B.added);
 B.sb.readyImage(MOB);ok(B.imageCache.get(MOB)?.ready,'공격 시트도 다시 받음');
 const before=B.added.length;B.sb.readyImage(MOB);B.sb.readyImage(DIE);ok(B.added.length===before,'이미 다시 받은 그림은 또 부탁하지 않음');
 B.sb.readyImage('never/seen.webp');ok(!B.added.includes('never/seen.webp'),'놓은 적 없는 그림은 건드리지 않음(엔진 releaseImageMemory 동작 그대로)');
 ok(B.api.inspect().stats.refetched===2&&B.api.inspect().gone===1,'다시 받은 수 기록·남은 놓인 목록',B.api.inspect());
 // 다시 받은 몹 시트는 지금 영웅(네온) 몫으로 다시 표시 → 네온이 자리에 있으면 남고, 두 번 더 바뀌면 다시 놓였다가 또 다시 받음
 B.sw('hwando');ok(B.imageCache.has(MOB),'지금·바로 앞 영웅(네온) 때 다시 받은 시트는 남김');
 B.sw('lauren');ok(!B.imageCache.has(MOB),'네온이 두 번 전이 되면 다시 놓음');
 B.sb.readyImage(MOB);ok(B.imageCache.get(MOB)?.ready,'또 찾으면 또 다시 받음');}
{const B=box({noAdd:true});B.tick();B.put(MOB);B.sw('lauren');B.sw('neon');let threw=false;try{B.sb.readyImage(MOB);}catch(_){threw=true;}
 ok(!threw&&B.api.inspect().stats.errors===0,'addImage 가 없어도 오류 없음');}
// ---- ① R1280: 같은 값은 다시 쓰지 않고, 칸이 붙거나 빠질 때만 다시 만든다 ----
const s1=rd('client-source/settings-merge-r1280.js');
ok(/function hide\(el\)\{if\(el\?\.classList&&!el\.classList\.contains\(HIDE\)\)/.test(s1),'숨김 class 는 없을 때만 붙임');
ok(!/o\.textContent=/.test(s1)&&/setText\(o,/.test(s1),'시야 범위 글자는 바뀔 때만 씀(예전: 다시 만들 때마다 써서 감시기를 다시 깨움)');
ok(/setTog\(x,'active',on\);setAttr\(x,'aria-pressed'/.test(s1),'분위기 세기 단추 상태는 바뀔 때만 씀');
ok(/if\(inp\.title!==tt\)inp\.title=tt/.test(s1),'통합 칸 title 은 바뀔 때만 씀');
ok(/MutationObserver\(l=>\{if\(busy\|\|pend\)return;[^]*?nodeType===1/.test(s1),'감시기는 요소가 붙거나 빠질 때만 다시 만듦(글자 변화 무시)');

// ---- ② R1065: 받는 중 부탁만 겹치지 않게, 놓인 뒤엔 다시 부탁 ----
{const src65=rd('client-source/mob-attack-dots-r1065.js');const cache=new Map();const asks=[];let resolvers=[];
 const sb={console,Math,Number,JSON,Object,Array,Set,Map,WeakMap,WeakSet,String,Promise,RegExp,isFinite,Date,Error,
  localStorage:{getItem:()=>null,setItem(){}},setInterval:()=>1,setTimeout:()=>0,
  readyImage:p=>cache.get(p)||null,ensureImages:l=>{asks.push(l[0]);return new Promise(r=>resolvers.push(()=>{for(const p of l)cache.set(p,{ready:true,image:{naturalWidth:10,naturalHeight:10}});r();}));}};
 sb.window=sb;vm.createContext(sb);vm.runInContext(src65,sb);const D=sb.__STORYWORLD_MOB_ATTACK_DOTS_R1065__;
 const look={path:'r380/mobs/ep1b-red-heel-blade-walk-d1.webp',name:'붉은 하이힐 칼날'};const flush=async()=>{const r=resolvers;resolvers=[];r.forEach(f=>f());await new Promise(r=>setImmediate(r));};
 (async()=>{
  ok(D.deathFrame(look,.1)===null&&D.deathFrame(look,.2)===null&&asks.filter(p=>p===DIE).length===1,'받는 중에는 사망 시트 부탁 1번만(겹침 막음)',asks);
  await flush();ok(!!D.deathFrame(look,.1),'받은 뒤 사망 모션 프레임 나옴');
  cache.delete(DIE);// R1281 이 영웅 교체 뒤 놓음
  ok(D.deathFrame(look,.1)===null,'놓인 직후는 빈손');ok(asks.filter(p=>p===DIE).length===2,'놓인 뒤 다시 부탁함(예전: 0번)',asks);
  await flush();ok(!!D.deathFrame(look,.1),'다시 받은 뒤 사망 모션 다시 나옴');
  console.log('R1283 CPU PASSED',n);})().catch(e=>{console.log('FAIL',e&&e.message);process.exit(1);});}

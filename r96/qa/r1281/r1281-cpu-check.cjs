// R1281 777·영웅 전환 렉(사용자 2026-11-20 "777코드 그리고 영웅 전환시 렉이 심해지는 버그 개선") CPU 검사
//  node r96/qa/r1281/r1281-cpu-check.cjs   — 실제 화면 측정은 r1281-browser.mjs(헤드리스)
//  원인(헤드리스 계측 qa/r1281/measure-*.txt): 영웅을 바꿀 때마다 그 영웅 그림·스킬 그림이 그림 기억(imageCache)에 쌓이고 지역에 다시 들어가기 전까지 안 비워짐
//   (디코드 크기 605MB → 20번 전환 뒤 1,668MB). 첫 전환은 그 영웅 그림을 확정 단추를 누른 뒤에야 받기 시작해 1.5~3.7초 멈춤.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,600));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const F='hero-switch-mem-r1281.js';
ok(fs.existsSync(path.join(R,'client-source',F)),F+' 있음');
ok(rd('client-source/'+F)===rd('runtime-text/'+F),F+' runtime-text 사본과 같음');
const html=rd('runtime-text/index.html');
ok(/<script src="\.\/reward-throw-r1262\.js"><\/script>\n<script src="\.\/hero-switch-mem-r1281\.js"><\/script>\n<script src="\.\/note-fold-r1251\.js"><\/script>/.test(html),'index.html 태그: reward-throw-r1262 바로 뒤·note-fold-r1251 바로 앞(sloth-throw→R1280→sin-boss-sheet-vis 사슬·R1268·R1264·R1269 고정 사슬 밖, 실행 순서 무관)');
ok((html.match(/hero-switch-mem-r1281\.js/g)||[]).length===1,'index.html 에 한 번만');
ok(/'hero-switch-mem-r1281\.js'/.test(fs.readFileSync(path.join(ROOT,'scripts','verify-r96-public.py'),'utf8')),'공개 확인 기대 목록');
ok(/node r96\/qa\/r1281\/r1281-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
const man=JSON.parse(rd('runtime-manifest.json'));ok(JSON.stringify(man).includes(F),'runtime-manifest 에 들어감');

const src=rd('client-source/'+F);
const MB=1e6/4;// 이미지 한 장 = w*h*4 바이트 → 1MB 가 되려면 w*h = 250000
function box({pref,tier=3,lowFx=false,cur='hwando',coop=null,r720=null}={}){
 const store={};if(pref!==undefined)store['storyworld.r1281.heroMem']=typeof pref==='string'?pref:JSON.stringify(pref);
 const clicks=[];let ivf=null;const clock={t:1000};
 const img=(p,mb=1)=>({src:p,naturalWidth:500,naturalHeight:Math.round(mb*500)});
 const imageCache=new Map();const ensured=[];
 const HEROES={hwando:{},lauren:{},neon:{},gunner:{}};
 const paths={hwando:['assets/h/hw-a.webp','assets/h/hw-b.webp','shared/both.webp'],lauren:['assets/h/la-a.webp','assets/h/la-b.webp','shared/both.webp'],neon:['assets/h/ne-a.webp','assets/h/ne-b.webp'],gunner:['assets/h/gu-a.webp']};
 const heroArt=Object.fromEntries(Object.keys(HEROES).map(id=>[id,{idle:{front:'assets/front/'+id+'.webp'}}]));
 const textures=new Map();
 const sb={console,Math,Number,JSON,Object,Array,Set,Map,WeakMap,String,Promise,isFinite,Date,Error,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},
  performance:{now:()=>clock.t},setInterval:f=>{ivf=f;return 1;},clearInterval(){},setTimeout:f=>0,
  document:{readyState:'complete',addEventListener:(t,f,o)=>{if(t==='click')clicks.push(f);}},
  imageCache,HEROES,heroArt,player:{hero:cur},loading:false,zone:'z1',layer:'STORY',VFX:{v:'assets/vfx/v.webp'},PROPS:{p:'assets/props/p.webp'},
  regionById:{z1:{paths:['assets/map/z1.webp']}},settings:{lowFx},cleanPath:p=>String(p).replace(/^\.\//,''),
  heroPaths:id=>paths[id]||[],ensureImages:(list)=>{ensured.push(list.slice());for(const p of list)if(!imageCache.has(p))imageCache.set(p,{path:p,ready:true,image:img(p)});return Promise.resolve();},
  readyImage:p=>{const r=imageCache.get(p);return r&&r.ready?r:null;}};
 sb.window={addEventListener(){},__STORYWORLD_MOBILE_TIER_R1023__:{tier:()=>tier},__STORYWORLD_PHASE1__:{controller:{state:{three:{commands:{textures}}}}},
  __STORYWORLD_COOP_SIM_R62__:coop?{players:()=>coop.map(h=>({hero:h}))}:undefined,__STORYWORLD_HERO_DEFENSE_R720__:r720?{has:id=>r720.includes(id)}:undefined};
 vm.createContext(sb);vm.runInContext(src,sb);
 const api=sb.window.__STORYWORLD_HERO_SWITCH_MEM_R1281__;
 const put=(p,mb=1)=>{const r={path:p,ready:true,image:img(p,mb)};imageCache.set(p,r);return r;};
 const tick=(ms=300)=>{clock.t+=ms;ivf&&ivf();};
 const sw=h=>{sb.player.hero=h;};
 return {sb,api,put,tick,sw,clock,imageCache,textures,ensured,clicks,store};}
const has=(B,p)=>B.imageCache.has(p);
const settle=B=>{for(let i=0;i<20;i++)B.tick(300);};

// ① 기본: 바뀐 뒤 '자리에 없는' 영웅 몫만 놓는다 (PC: 바로 앞 영웅 1명은 남김)
{const B=box();ok(!!B.api&&typeof B.api.inspect==='function'&&typeof B.api.release==='function','API(__STORYWORLD_HERO_SWITCH_MEM_R1281__: inspect·release·set)');
 B.tick();// hwando 로 시작
 for(const p of ['assets/h/hw-a.webp','assets/h/hw-b.webp','shared/both.webp','assets/front/hwando.webp','assets/map/z1.webp','assets/vfx/v.webp'])B.put(p);
 B.sw('lauren');B.tick();for(const p of ['assets/h/la-a.webp','assets/h/la-b.webp','fx/lauren-skill.webp'])B.put(p);
 settle(B);
 ok(has(B,'assets/h/hw-a.webp')&&has(B,'assets/h/hw-b.webp'),'PC 단계: 바로 앞 영웅(환도) 그림은 남김 — 환도↔라우렌 되돌리기는 기다림 없음');
 B.sw('neon');B.tick();for(const p of ['assets/h/ne-a.webp','fx/neon-skill.webp'])B.put(p);
 settle(B);
 ok(!has(B,'assets/h/hw-a.webp')&&!has(B,'assets/h/hw-b.webp'),'두 번 전 영웅(환도) heroPaths 그림은 놓음');
 ok(has(B,'assets/h/la-a.webp')&&has(B,'fx/lauren-skill.webp'),'바로 앞 영웅(라우렌) 그림·그때 받은 스킬 그림은 남김');
 ok(has(B,'assets/h/ne-a.webp')&&has(B,'fx/neon-skill.webp'),'지금 영웅(네온) 그림은 그대로');
 ok(has(B,'assets/front/hwando.webp')&&has(B,'assets/map/z1.webp')&&has(B,'assets/vfx/v.webp'),'엔진이 늘 남기는 그림(영웅 칸 얼굴·지역·VFX)은 그대로');
 ok(has(B,'shared/both.webp'),'지금·앞 영웅이 함께 쓰는 그림은 남김');
 B.sw('gunner');B.tick();settle(B);
 ok(!has(B,'fx/lauren-skill.webp')&&!has(B,'assets/h/la-a.webp'),'라우렌이 두 번 전이 되면 라우렌 때 받은 스킬 그림(heroPaths 밖)도 놓음');
 ok(!has(B,'shared/both.webp'),'함께 쓰던 영웅이 모두 자리에 없으면 놓음');
 ok(has(B,'fx/neon-skill.webp'),'바로 앞(네온) 몫은 남음');
 const s=B.api.inspect();ok(s.stats.released>=6&&s.stats.releasedMB>=6,'놓은 수·크기 기록',s.stats);
 ok(s.gameplayChanged===false&&s.browser===false,'판정·세이브 불변, CPU 검사 표시');}
// ② 지금 그려지는 그림(Three 텍스처)과 10초 안에 그린 그림은 놓지 않음
{const B=box();B.tick();const r=B.put('assets/h/hw-a.webp');B.put('assets/h/hw-b.webp');B.textures.set(r.image,{refs:1});
 B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);
 ok(has(B,'assets/h/hw-a.webp'),'Three 텍스처로 지금 그려지는 그림은 남김');ok(!has(B,'assets/h/hw-b.webp'),'안 그려지는 같은 영웅 그림은 놓음');
 B.textures.clear();B.sw('gunner');B.tick();settle(B);ok(has(B,'assets/h/hw-a.webp'),'텍스처에서 빠진 뒤 10초 안이면 아직 남김');
 B.tick(11000);B.sw('lauren');B.tick();settle(B);ok(!has(B,'assets/h/hw-a.webp'),'10초 지나면 다음 정리 때 놓음');}
// ③ 받는 중(ready 아님)·불러오는 중(loading)에는 손대지 않음
{const B=box();B.tick();B.imageCache.set('assets/h/hw-a.webp',{path:'assets/h/hw-a.webp',ready:false});B.put('assets/h/hw-b.webp');
 B.sb.loading=true;B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);ok(has(B,'assets/h/hw-b.webp'),'loading 중에는 정리 미룸');
 B.sb.loading=false;settle(B);ok(!has(B,'assets/h/hw-b.webp')&&has(B,'assets/h/hw-a.webp'),'loading 끝나면 정리, 받는 중인 줄은 그대로');}
// ④ 낮은 단계(모바일 자동·낮음·보통, 또는 lowFx): 바로 앞 영웅도 놓음
for(const [opt,lab] of [[{tier:0},'tier 0(모바일 자동)'],[{tier:1},'tier 1'],[{tier:3,lowFx:true},'lowFx']]){
 const B=box(opt);B.tick();B.put('assets/h/hw-a.webp');B.sw('lauren');B.tick();settle(B);ok(!has(B,'assets/h/hw-a.webp'),lab+': 바로 앞 영웅 그림도 놓음(메모리 우선)');}
// ⑤ 함께 있는 영웅(협동 동료·무한생존 배치)은 자리에 있는 영웅
{const B=box({coop:['hwando','neon']});B.tick();B.put('assets/h/ne-a.webp');B.sw('lauren');B.tick();B.sw('gunner');B.tick();settle(B);ok(has(B,'assets/h/ne-a.webp'),'협동 동료 영웅 그림은 남김');}
{const B=box({r720:['neon']});B.tick();B.put('assets/h/ne-a.webp');B.sw('lauren');B.tick();B.sw('gunner');B.tick();settle(B);ok(has(B,'assets/h/ne-a.webp'),'무한생존 배치 영웅 그림은 남김');}
// ⑥ 전환이 없으면 아무것도 안 놓음(지역 안 평소 플레이 그대로)
{const B=box();B.tick();B.put('assets/h/la-a.webp');B.put('fx/x.webp');settle(B);B.tick(30000);settle(B);ok(has(B,'assets/h/la-a.webp')&&has(B,'fx/x.webp')&&B.api.inspect().stats.released===0,'영웅을 안 바꾸면 정리 안 함');}
// ⑦ 영웅 칸을 누르면(확정 전) 그 영웅 그림을 미리 받음 → 확정 때 기다림 줄임
{const B=box();B.tick();ok(B.clicks.length>=1,'click 듣기(캡처) 1개');
 const el=(attrs)=>({closest:sel=>/data-hero|data-ego|data-persona/.test(sel)?{dataset:attrs.dataset||{},getAttribute:k=>attrs[k]??null,hasAttribute:k=>k in attrs,closest:s=>/#panel/.test(s)?{}:null}:null});
 B.clicks[0]({target:el({dataset:{hero:'neon'}})});ok(B.ensured.some(l=>l.includes('assets/h/ne-a.webp')),'일반 영웅 칸 → heroPaths(네온) 미리 받기',B.ensured);
 B.clicks[0]({target:el({'data-ego-r1046':'',dataset:{egoR1046:''}})});ok(B.ensured.some(l=>l.includes('assets/h/hw-a.webp')),'EGO 칸 → 환도 몸(heroPaths(hwando)) 미리 받기');
 B.clicks[0]({target:el({'data-persona-r1113':'',dataset:{personaR1113:''}})});ok(B.ensured.some(l=>l.includes('assets/h/la-a.webp')),'페르소나 칸 → 라우렌 몸 미리 받기');
 const k=B.ensured.length;B.sb.loading=true;B.clicks[0]({target:el({dataset:{hero:'gunner'}})});ok(B.ensured.length===k,'불러오는 중(loading)에는 미리 받지 않음');
 B.sb.loading=false;B.clicks[0]({target:{closest:()=>null}});ok(B.ensured.length===k,'영웅 칸이 아닌 곳은 무시');}
// ⑧ 끄기
{const B=box({pref:'0'});B.tick();B.put('assets/h/hw-a.webp');B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);ok(has(B,'assets/h/hw-a.webp')&&B.api.inspect().stats.released===0,'localStorage storyworld.r1281.heroMem=0 이면 예전 그대로');}
{const B=box({pref:{release:false}});B.tick();B.put('assets/h/hw-a.webp');B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);ok(has(B,'assets/h/hw-a.webp'),'{"release":false} 면 정리만 끔');}
console.log(JSON.stringify({passed:n}));

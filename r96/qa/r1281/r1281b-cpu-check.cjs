// R1281b 보호가 풀린 뒤 다시 정리(아스트라 QA 2026-11-20: 전환 때 그리던 옛 영웅 그림이 보호된 채 12초 넘게 남다가 다음 전환에서야 지워짐)
//  node r96/qa/r1281/r1281b-cpu-check.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const R=path.resolve(__dirname,'../..'),ROOT=path.resolve(R,'..');let n=0;
const ok=(c,m,d)=>{if(!c)console.log('FAIL',m,d===undefined?'':JSON.stringify(d).slice(0,600));assert(c,m);n++;console.log('PASS',m);};
const rd=f=>fs.readFileSync(path.join(R,f),'utf8');const F='hero-switch-mem-r1281.js';
ok(rd('client-source/'+F)===rd('runtime-text/'+F),F+' runtime-text 사본과 같음');
ok(/node r96\/qa\/r1281\/r1281b-cpu-check\.cjs/.test(fs.readFileSync(path.join(ROOT,'.github','workflows','pages.yml'),'utf8')),'pages.yml 검사 단계');
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


// ① 전환 때 텍스처로 그려지던 옛 영웅 그림: 텍스처에서 빠지고 10초가 지나면 다음 전환 없이 놓음
{const B=box();B.tick();const r=B.put('assets/h/hw-a.webp');B.textures.set(r.image,{refs:1});
 B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);ok(has(B,'assets/h/hw-a.webp'),'그려지는 동안은 남김');
 B.textures.clear();B.tick(5000);ok(has(B,'assets/h/hw-a.webp'),'텍스처에서 빠진 직후(10초 안)는 아직 남김');
 for(let i=0;i<30;i++)B.tick(300);ok(!has(B,'assets/h/hw-a.webp'),'보호가 풀린 뒤(약 10초+) 다음 전환 없이 다시 검사해 놓음',B.api.inspect().stats);
 ok(B.api.inspect().stats.rechecks>=1,'다시 검사 횟수 기록');}
// ② 보호 사유가 계속되면(계속 그려짐) 다시 검사해도 남기고, 무한히 돌지 않음(최대 횟수)
{const B=box();B.tick();const r=B.put('assets/h/hw-a.webp');B.textures.set(r.image,{refs:1});
 B.sw('lauren');B.tick();B.sw('neon');B.tick();for(let i=0;i<400;i++)B.tick(300);
 ok(has(B,'assets/h/hw-a.webp'),'계속 그려지면 남김');const s=B.api.inspect().stats;ok(s.rechecks<=6,'다시 검사는 최대 6번',s);}
// ③ 남긴 것이 없으면 다시 검사 예약 없음
{const B=box();B.tick();B.put('assets/h/hw-a.webp');B.sw('lauren');B.tick();B.sw('neon');B.tick();for(let i=0;i<200;i++)B.tick(300);ok(B.api.inspect().stats.rechecks===0,'보호한 그림이 없으면 다시 검사 안 함');}
// ④ 다시 검사 사이에 영웅을 또 바꾸면 그 전환 정리로 이어짐(지금 영웅 그림은 안 놓음)
{const B=box();B.tick();const r=B.put('assets/h/hw-a.webp');B.textures.set(r.image,{refs:1});
 B.sw('lauren');B.tick();B.sw('neon');B.tick();settle(B);B.textures.clear();B.put('assets/h/gu-a.webp');/* 엔진이 전환 전에 받아 둠 */B.sw('gunner');B.tick();for(let i=0;i<60;i++)B.tick(300);
 ok(has(B,'assets/h/gu-a.webp')&&!has(B,'assets/h/hw-a.webp'),'중간 전환 뒤에도 지금 영웅 그림 남기고 옛 그림 놓음');}
// ⑤ 끄기면 다시 검사도 없음
{const B=box({pref:'0'});B.tick();const r=B.put('assets/h/hw-a.webp');B.textures.set(r.image,{refs:1});B.sw('lauren');B.tick();B.sw('neon');B.tick();B.textures.clear();for(let i=0;i<100;i++)B.tick(300);ok(has(B,'assets/h/hw-a.webp'),'끄기면 그대로');}
console.log(JSON.stringify({passed:n}));

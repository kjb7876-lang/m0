// R1281 777·영웅 전환 렉 — 전환한 영웅 그림 기억 정리 + 영웅 칸 누를 때 미리 받기 (사용자 2026-11-20 "777코드 그리고 영웅 전환시 렉이 심해지는 버그 개선")
//  원인(헤드리스 계측 qa/r1281/measure-*.txt, 전역 리스너·타이머·rAF·텍스처 수는 늘지 않음):
//   ① 영웅을 바꿀 때마다 그 영웅 몸 그림(heroPaths)과 그 영웅으로 싸우며 받은 스킬 그림이 그림 기억(imageCache)에 쌓이고,
//      엔진은 지역에 다시 들어갈 때(releaseImageMemory)만 비운다 → 777 뒤 영웅 10번 전환에 디코드 크기 600MB → 1,660MB.
//      기억이 큰 기기(특히 모바일)일수록 그림 디코드·GC·GPU 메모리 압박으로 전환 뒤에도 계속 느려진다. (R1264 를 꺼도 같음 — R1264 원인 아님)
//   ② 엔진은 '이 영웅으로 변경'을 누른 뒤에야 그 영웅 그림을 받기 시작하고 다 받을 때까지 멈춘다(첫 전환 1.5~3.7초).
//  고침: ① 영웅이 바뀌고 불러오기가 끝나면, 자리에 없는 영웅(지금·바로 앞 영웅[PC 단계만]·협동 동료·무한생존 배치 영웅 밖)의 그림을 놓는다.
//        놓는 그림 = 그 영웅 heroPaths 에만 있는 그림 + 그 영웅으로 플레이할 때 처음 받은 그림. 엔진이 지역 진입 때 남기는 그림(지역·VFX·소품·영웅 칸 얼굴),
//        지금 Three 텍스처로 그려지는 그림, 10초 안에 그린 그림, 받는 중인 그림은 남긴다. 다시 필요하면 각 덧그림이 지역 진입 뒤처럼 다시 받는다.
//      ② 영웅 창에서 칸(일반·EGO·페르소나)을 누르는 순간 그 영웅 heroPaths 를 미리 받아, 확정할 때 기다림을 줄인다.
//  판정·피해·세이브·그림 파일은 바꾸지 않는다. 끄기: localStorage storyworld.r1281.heroMem = '0' (부분: {"release":false} / {"prefetch":false})
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_HERO_SWITCH_MEM_R1281__)return;
const REV='R1281-hero-switch-mem-1',KEY='storyworld.r1281.heroMem',GAP=300,DELAY=1200,RECENT=10000;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={switches:0,releases:0,released:0,releasedMB:0,kept:0,keptRecent:0,prefetch:0,errors:0};let lastError=null;const releasedPaths=[];
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
function prefs(){const raw=G(()=>localStorage.getItem(KEY),null);if(raw==='0')return {release:false,prefetch:false};let o={};try{o=JSON.parse(raw||'{}')||{};}catch(_){o={};}
 return {release:o.release!==false,prefetch:o.prefetch!==false};}
const now=()=>G(()=>performance.now(),0);
const cp=p=>G(()=>typeof cleanPath==='function'?cleanPath(p):String(p).replace(/^\.\//,''),String(p));
const cur=()=>G(()=>player&&player.hero,null);
const busy=()=>G(()=>!!loading,false);
// 그림이 처음 기억에 들어올 때 지금 영웅(불러오는 중이면 표시 없음)을 적는다
const tagOf=new Map();let cacheWrapped=null;
function wrapCache(){try{const C=G(()=>imageCache,null);if(!(C instanceof Map)||cacheWrapped===C)return;const set=C.set.bind(C),del=C.delete.bind(C);
 C.set=function(k,v){try{if(!tagOf.has(k)){const h=busy()?null:cur();if(h)tagOf.set(k,h);}}catch(e){fail(e);}return set(k,v);};
 C.delete=function(k){tagOf.delete(k);return del(k);};cacheWrapped=C;}catch(e){fail(e);}}
// 지금·최근에 그려진 그림(Three 텍스처) 시각
const seenAt=new WeakMap();
function stampTextures(){const T=G(()=>window.__STORYWORLD_PHASE1__.controller.state.three.commands.textures,null);if(!(T instanceof Map))return null;const t=now();for(const im of T.keys())if(im&&typeof im==='object')seenAt.set(im,t);return T;}
function lowTier(){if(G(()=>settings.lowFx,false))return true;const t=G(()=>window.__STORYWORLD_MOBILE_TIER_R1023__.tier(),3);return typeof t==='number'&&t<2;}
let last=null,prev=null,due=0;
function present(){const s=new Set();const c=cur();if(c)s.add(c);if(prev&&!lowTier())s.add(prev);
 for(const a of G(()=>window.__STORYWORLD_COOP_SIM_R62__.players(),[])||[])if(a&&a.hero)s.add(a.hero);
 const D=G(()=>window.__STORYWORLD_HERO_DEFENSE_R720__,null);if(D&&typeof D.has==='function')for(const id of Object.keys(G(()=>HEROES,{})))if(G(()=>D.has(id),false))s.add(id);return s;}
function keepSet(pr){const k=new Set();const add=a=>{for(const p of a||[])if(p)k.add(cp(p));};
 add(G(()=>regionById[zone].paths,[]));add(G(()=>window.__STORYWORLD_WORLD_R74__.assetPaths(zone,layer),[]));
 for(const id of pr)add(G(()=>heroPaths(id),[]));add(Object.values(G(()=>VFX,{})));add(Object.values(G(()=>PROPS,{})));
 add(Object.keys(G(()=>HEROES,{})).map(id=>G(()=>heroArt[id].idle.front,null)));return k;}
function release(){if(!prefs().release)return 0;const C=G(()=>imageCache,null);if(!(C instanceof Map)||busy())return 0;
 const T=stampTextures(),t=now(),pr=present(),keep=keepSet(pr),owners=new Map();
 for(const id of Object.keys(G(()=>HEROES,{})))for(const p of G(()=>heroPaths(id),[])||[]){const k=cp(p);let s=owners.get(k);if(!s)owners.set(k,s=new Set());s.add(id);}
 let n=0,mb=0;
 for(const [path,row] of [...C]){try{if(!row||!row.ready||keep.has(path))continue;const o=owners.get(path),tg=tagOf.get(path);
  const absent=o?[...o].every(id=>!pr.has(id)):(!!tg&&!pr.has(tg));if(!absent)continue;
  const im=row.image;if(im&&typeof im==='object'){if(T&&T.has(im)){stats.kept++;continue;}const s=seenAt.get(im);if(s!==undefined&&t-s<RECENT){stats.keptRecent++;continue;}}
  const w=+(im&&(im.naturalWidth||im.width))||0,h=+(im&&(im.naturalHeight||im.height))||0;C.delete(path);n++;mb+=w*h*4/1e6;releasedPaths.push(path);if(releasedPaths.length>200)releasedPaths.shift();}catch(e){fail(e);}}
 stats.releases++;stats.released+=n;stats.releasedMB=Math.round((stats.releasedMB+mb)*10)/10;return n;}
function tick(){try{wrapCache();stampTextures();const h=cur();if(!h)return;
 if(last===null){last=h;return;}
 if(h!==last){prev=last;last=h;stats.switches++;due=now()+DELAY;}
 if(due&&now()>=due&&!busy()){due=0;release();}}catch(e){fail(e);}}
// 영웅 칸 미리 받기
const CARD='#panel [data-hero], #panel [data-ego-r1046], #panel [data-persona-r1113]';
function onClick(ev){try{if(!prefs().prefetch||busy())return;const el=ev&&ev.target&&typeof ev.target.closest==='function'?ev.target.closest(CARD):null;if(!el)return;
 const has=k=>typeof el.hasAttribute==='function'&&el.hasAttribute(k);const id=has('data-ego-r1046')?'hwando':has('data-persona-r1113')?'lauren':el.dataset&&el.dataset.hero;
 if(!id||!G(()=>HEROES[id],null)||typeof ensureImages!=='function')return;const list=G(()=>heroPaths(id),[]);if(!list||!list.length)return;
 stats.prefetch++;const r=ensureImages(list);if(r&&typeof r.catch==='function')r.catch(()=>{});}catch(e){fail(e);}}
wrapCache();G(()=>document.addEventListener('click',onClick,true));G(()=>setInterval(tick,GAP));
window.__STORYWORLD_HERO_SWITCH_MEM_R1281__=Object.freeze({revision:REV,prefs,tick,release,
 set:v=>{G(()=>localStorage.setItem(KEY,typeof v==='object'?JSON.stringify(v):(v?'1':'0')));return prefs();},
 inspect:()=>({revision:REV,prefs:prefs(),stats:{...stats},last,prev,present:[...present()],tagged:tagOf.size,releasedPaths:releasedPaths.slice(),lastError,gameplayChanged:false,browser:false,GPU:false})});
})();

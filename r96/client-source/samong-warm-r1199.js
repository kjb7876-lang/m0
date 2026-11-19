// R1199 ③ — 사몽 이펙트 텍스처 예열·붙잡기(사용자 2026-11-19 "사몽각성관련해서 전수조사해서 렉이특히 심해지는이유와 그이유에맞게 규칙개선해서 렉개선해줘").
//  측정(헤드리스 640×360, 환도, dist01→dist02→dist03 꿈): 지역을 옮겨 다시 각성해도 첫 장면에 사몽 전용 이펙트 그림
//  (r590 문양 앞·뒤 각 88만 화소, hwando/attack-e 74만, r100 문양 3장 각 31만 …)을 매번 GPU 에 다시 올렸다(4~5백만 화소, 첫 장면 250~430ms).
//  까닭(규칙 충돌): R89 는 쓰지 않는 텍스처를 20초 뒤 버리고(지역을 옮기면 곧바로) 사몽 대기는 46~77초라, 다음 각성 때는 늘 버려져 있다.
//  고침:
//   · 배우기: 사몽 중 처음 올라가는(그 장면 전에 GPU 에 없던) 그림 경로를 영웅·형상(EGO·페르소나 따로)별로 최대 40개 기억한다(localStorage 저장, 한 장 400만 화소 이하).
//   · 예열: 다시 사몽을 쓸 수 있게 되면(꿈 층·사몽 대기 3초 이하·각성 아님·살아 있음) 배운 그림을 장면당 PC 150만·저사양 50만 화소(최소 1장)씩
//     엔진 그림 캐시로 읽어 GPU 에 미리 올린다(renderer.initTexture). 성능 7단계 1(초저)은 하지 않는다.
//   · 붙잡기: 올린 텍스처는 참조 하나를 쥐어 각성이 끝날 때까지 버려지지 않게 한다. 준비도 각성도 아니게 되면 놓는다(그 뒤는 R89 규칙대로 20초 뒤 정리).
//     장면(CommandScene)이 바뀌면(지역 이동) 쥔 것을 잊고 다시 올린다.
//  화면에 보이는 것은 같다(같은 그림을 더 일찍 올릴 뿐). 판정·피해·대기는 건드리지 않는다. 끄기: localStorage 'storyworld.r1199.warm' {"on":false}.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_SAMONG_WARM_R1199__)return;
const REV='R1199-samong-warm-1',KEY='storyworld.r1199.warm',LKEY='storyworld.r1199.samongWarm';
const CFG=Object.freeze({ready:3,maxPaths:40,maxPx:4e6,budget:1.5e6,budgetLow:.5e6});
const prefs={on:true};try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s.on==='boolean')prefs.on=s.on;}catch(_){}
const stats={learned:0,loads:0,uploads:0,held:0,released:0,scenes:0,frames:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const P=()=>G(()=>typeof player==='object'&&player?player:null,null);
const lowFx=()=>G(()=>!!(typeof settings!=='undefined'&&settings?.lowFx),false);
const perfStep=()=>G(()=>{const n=Number(window.__STORYWORLD_PERF7_R1043__?.step?.());return Number.isFinite(n)?n:5;},5);
const samongOn=p=>!!(p&&Number(p.samong)>0&&!(Number(p.hp)<=0));
function heroKey(p){const h=String(p?.hero||'');if(!h)return '';
 if(G(()=>!!window.__STORYWORLD_EGO_SOVEREIGN_R1046__?.formActive?.(),false)||p.egoSovereignR1046===true)return h+':ego';
 if(p.personaHeroR1113===true)return h+':persona';return h;}
function ready(p){return !!(prefs.on&&p&&!(Number(p.hp)<=0)&&!samongOn(p)&&G(()=>typeof layer!=='undefined'&&layer==='DREAM',false)&&Number(p.samongCD)<=CFG.ready&&perfStep()>1);}
// ---- 배운 목록 ----
let book={};try{const s=JSON.parse(localStorage.getItem(LKEY)||'null');if(s&&typeof s==='object')for(const k of Object.keys(s))if(Array.isArray(s[k]))book[k]=s[k].filter(x=>typeof x==='string').slice(0,CFG.maxPaths);}catch(_){}
let dirty=false;const save=()=>{if(!dirty)return;dirty=false;try{localStorage.setItem(LKEY,JSON.stringify(book));}catch(_){}};
const isImg=im=>!!im&&typeof HTMLImageElement!=='undefined'&&im instanceof HTMLImageElement;
const px=im=>(im.naturalWidth||im.width||0)*(im.naturalHeight||im.height||0);
// 그림 → 엔진 경로(엔진 imageCache 를 거꾸로 훑음, 없으면 주소에서 문서 위치를 뗀다)
const pathMemo=new WeakMap();let scanAt=-1;
function pathOf(im){let v=pathMemo.get(im);if(v)return v;
 const cache=G(()=>typeof imageCache!=='undefined'&&imageCache instanceof Map?imageCache:null,null);
 if(cache&&scanAt!==stats.frames){scanAt=stats.frames;for(const [k,row] of cache)if(row?.image&&!pathMemo.has(row.image))pathMemo.set(row.image,k);v=pathMemo.get(im);if(v)return v;}
 const src=String(im.currentSrc||im.src||'');if(!src||/^(blob|data):/.test(src))return null;
 const base=G(()=>location.href.replace(/[?#].*$/,'').replace(/[^/]*$/,''),'');
 v=base&&src.startsWith(base)?src.slice(base.length):src.replace(/^https?:\/\/[^/]+\/(m0\/)?/,'');if(v)pathMemo.set(im,v);return v||null;}
function learn(S,frame,p){const key=heroKey(p);if(!key)return;const list=book[key]||(book[key]=[]);if(list.length>=CFG.maxPaths)return;
 const idle=S.r89Idle;
 for(const c of frame.commands){if(list.length>=CFG.maxPaths)break;const im=c&&c.kind==='image'&&!c.mutable?c.image:null;
  if(!isImg(im)||!(px(im)>0)||px(im)>CFG.maxPx||S.textures?.has?.(im)||idle?.has?.(im))continue;
  const path=pathOf(im);if(!path||list.includes(path))continue;list.push(path);stats.learned++;dirty=true;}
 save();}
// ---- 예열·붙잡기 ----
let owner=null,heldKey='';const held=new Map();/* image → path */const asked=new Set();
function releaseAll(){const S=owner;for(const im of held.keys()){try{S?.release?.(im);stats.released++;}catch(e){fail(e);}}held.clear();stats.held=0;}
function warm(r,S,p){const key=heroKey(p),list=book[key];if(key!==heldKey){releaseAll();heldKey=key;}if(!list||!list.length)return;
 let budget=lowFx()?CFG.budgetLow:CFG.budget,n=0;const heldPaths=new Set(held.values());
 for(const path of list){if(heldPaths.has(path))continue;
  const row=G(()=>typeof readyImage==='function'?readyImage(path):null,null);
  if(!row||!isImg(row.image)){if(!asked.has(path)){asked.add(path);stats.loads++;try{if(typeof addImage==='function'){const a=addImage(path);a?.promise?.catch?.(()=>{});}}catch(e){fail(e);}}continue;}
  const im=row.image,cost=px(im);if(n>0&&cost>budget)break;
  try{const tex=S.texture(im,false);held.set(im,path);stats.held=held.size;r.renderer?.initTexture?.(tex);stats.uploads++;}catch(e){fail(e);}
  budget-=cost;n++;if(budget<=0)break;}}
function before(r,frame){try{stats.frames++;if(!prefs.on)return;const S=r?.commands;if(!S?.texture)return;
 if(S!==owner){held.clear();stats.held=0;asked.clear();owner=S;stats.scenes++;}
 const p=P();if(!p)return;
 if(samongOn(p)){if(Array.isArray(frame?.commands))learn(S,frame,p);return;}/* 각성 중엔 쥔 채로 둔다 */
 if(ready(p))warm(r,S,p);else if(held.size)releaseAll();}catch(e){fail(e);}}
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 감싼다(R287 과 같은 방식).
const wrapFn=fn=>{if(fn.__r1199)return fn;const w=function(frame){before(this,frame);return fn.apply(this,arguments);};w.__r1199=true;return w;};
const wrapped=new WeakSet();
function wrapOnce(t){if(!t||wrapped.has(t)||typeof t.render!=='function')return;wrapped.add(t);t.render=wrapFn(t.render);}
function wrapAll(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r)return;wrapOnce(Object.getPrototypeOf(r));if(Object.prototype.hasOwnProperty.call(r,'render'))wrapOnce(r);}catch(e){fail(e);}}
setInterval(wrapAll,500);wrapAll();
function set(patch){if(typeof patch?.on==='boolean')prefs.on=patch.on;try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch(_){}if(!prefs.on)releaseAll();return{...prefs};}
window.__STORYWORLD_SAMONG_WARM_R1199__=Object.freeze({revision:REV,config:CFG,set,ready:()=>ready(P()),heroKey:()=>heroKey(P()),
 learned:k=>(book[k]||[]).slice(),forget:k=>{if(k)delete book[k];else book={};dirty=true;save();},
 inspect:()=>({revision:REV,prefs:{...prefs},stats:{...stats},held:[...held.values()],heldKey,lastError})});
})();

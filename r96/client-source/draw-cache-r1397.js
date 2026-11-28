// R1397 — 그리기 캐시 예산을 새 큰 시트에 맞춤(사용자 2026-11-28 "모든자산 적용하면 실플레이돌린다음 렉전반적으로 개선해줘 특히 이미지그리기및 출력부분").
//  헤드리스 실플레이 측정(환도 자동전투 640×360, main 2ee154e6, scratchpad lag/r409.mjs·rep.mjs):
//   · R409 영웅·몹 테두리 캐시(7M화소)가 dist02 한 지역 15초 만에 차서, 세 지역 50초 동안 78장을 버렸다 다시 구웠다
//     (굽기 = 픽셀 읽기 + 거리 변환 + 새 캔버스 GPU 올리기, 장면당 ~2.8ms, 굽기 예산 넘으면 그 장면은 테두리 없이 그려짐).
//   · R89 쉬는 텍스처 캐시(20초·64장·192MB)가 영웅 팔레트 시트(960×1344·3840×384 등)·몹 물들인 시트를 20초마다 버려
//     같은 그림을 40게임초에 228번(3,610만 화소) 다시 GPU 에 올렸다.
//  고친 방법: 넉넉한 PC(터치 기기 아님·저사양 끔·성능 단계 3 이상·기기 메모리 8GB 이상 또는 알 수 없음)에서만
//   R409 테두리 캐시 14M화소(약 56MB), R89 쉬는 텍스처 60초·160장·320MB 로 늘린다. 모바일·저사양은 예전 값 그대로(R980 모바일 예산이 먼저).
//  ② 아래: 영웅 스킬 시트를 지역 들어갈 때 미리 올리기(배우기).
//  그림·화질·동작·판정은 그대로(같은 그림을 다시 만들지 않거나 더 일찍 올릴 뿐). 끄기: localStorage 'storyworld.r1397.drawCache' = '0'.
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_DRAW_CACHE_R1397__)return;
const REV='R1397-draw-cache-1',KEY='storyworld.r1397.drawCache';
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
let on=G(()=>localStorage.getItem(KEY),null)!=='0';
const OUTLINE_PX=14e6;
const IDLE_OLD=Object.freeze({ms:20000,count:64,bytes:192*1048576}),IDLE_LOW=Object.freeze({ms:20000,count:24,bytes:64*1048576}),IDLE_ROOMY=Object.freeze({ms:60000,count:160,bytes:320*1048576});
const stats={roomyChecks:0};
function mobile(){const m=G(()=>window.__STORYWORLD_MOBILE_MEMORY_R980__?.mobile?.(),undefined);if(typeof m==='boolean')return m;return G(()=>matchMedia('(pointer:coarse)').matches,false);}
function roomy(){stats.roomyChecks++;if(!on)return false;if(mobile())return false;if(G(()=>typeof settings!=='undefined'&&!!settings?.lowFx,false))return false;
 const step=G(()=>Number(window.__STORYWORLD_PERF7_R1043__?.step?.()),NaN);if(Number.isFinite(step)&&step<3)return false;
 const mem=G(()=>Number(navigator.deviceMemory),NaN);if(Number.isFinite(mem)&&mem<8)return false;return true;}
// R409 combat-read: 데스크톱 기본 상한(7M) 대신 쓸 값. 모바일 예산(R980 px)은 R409 가 이 값과 비교해 더 작은 쪽을 쓴다.
function outlinePx(def){return roomy()?Math.max(+def||0,OUTLINE_PX):+def;}
// R89 world-retro: 쉬는 텍스처 수명·장수·바이트. low = R89 가 본 저사양(lowFx) 여부.
function texIdle(low){if(low)return IDLE_LOW;return roomy()?IDLE_ROOMY:IDLE_OLD;}
// ---- ② 영웅 스킬 시트 미리 올리기(배우기) -------------------------------------------------------------------------
//  측정(dist02 환도 10게임초, scratchpad lag/spike.mjs): 100ms 넘는 장면 12개 중 4개가 전투 중 처음 쓰는 영웅 그림 GPU 올리기
//  (r590 hwando-a-draw-cut·e-delayed-flash 1536×1024, hwando-action-atlas 1774×887, r100 sig-slash-gold 1920×160, 63~83ms).
//  지역을 옮기면 엔진이 장면 텍스처를 모두 비우므로 지역마다 첫 사용에 다시 생긴다.
//  배우기: 스토리 층에서 지역에 들어온 지 3게임초 넘어 처음 텍스처가 만들어지는 assets/ 그림을 영웅(형상)별로 기억(지역 id 최대 3곳, 영웅당 60장).
//  미리 올리기: 두 지역 넘게 그렇게 배운 그림(= 지역과 상관없는 그 영웅 그림)을 지역에 들어오면 0.25초에 1M화소(최소 1장)씩
//   엔진 그림 캐시로 읽어 GPU 에 올리고 곧바로 놓아(R89 쉬는 텍스처, PC 60초) 처음 쓸 때 그대로 다시 쓰게 한다. 영웅당 24장·장당 4M화소 이하. 넉넉한 PC 만.
// 미리 올리기만 끄기(캐시 확대는 그대로): localStorage 'storyworld.r1397.kitWarm' = '0'.
const kitOn=()=>G(()=>localStorage.getItem('storyworld.r1397.kitWarm'),null)!=='0';
const LKEY='storyworld.r1397.kitLearn2',WARM_GAP=250,WARM_PX=1e6,LEARN_AFTER=3,MAX_LEARN=60,MAX_WARM=24,MAX_PX=4e6;
const SAFE=/(?:^|\/)(assets\/[\w\-./]+\.(?:webp|png))(?:[?#].*)?$/;
const kstats={learned:0,warmed:0,loads:0,skippedBig:0,reusedByGame:0,errors:0};let lastError=null;const kfail=e=>{kstats.errors++;lastError=String(e&&e.message||e).slice(0,200);};
let book={};try{const v=JSON.parse(localStorage.getItem(LKEY)||'null');if(v&&typeof v==='object')for(const k of Object.keys(v))if(v[k]&&typeof v[k]==='object'){const o={};for(const [pp,z] of Object.entries(v[k]))if(SAFE.test(pp)&&Array.isArray(z))o[pp]=z.filter(x=>typeof x==='string').slice(0,3);book[k]=o;}}catch(_){}
let dirty=false,saveAt=0;function save(){if(!dirty)return;const t=Date.now();if(t-saveAt<3000)return;saveAt=t;dirty=false;try{localStorage.setItem(LKEY,JSON.stringify(book));}catch(_){}}
const P=()=>G(()=>typeof player==='object'&&player?player:null,null);
function heroKey(){const k=G(()=>window.__STORYWORLD_SAMONG_WARM_R1199__?.heroKey?.(),'');if(typeof k==='string'&&k)return k;return String(P()?.hero||'');}
const storyLayer=()=>G(()=>typeof layer==='undefined'||layer!=='DREAM',true)&&!(Number(P()?.samong)>0);
const isImg=im=>!!im&&typeof HTMLImageElement!=='undefined'&&im instanceof HTMLImageElement;
const pathOf=im=>{const m=SAFE.exec(String(im?.getAttribute?.('src')||im?.src||''));return m?m[1]:null;};
let zoneId=null,zoneT=0,warmedZone=new Set(),warmScene=null;
function zoneTick(){const id=G(()=>room?.id,null),t=G(()=>Number(time),0);if(id!==zoneId){zoneId=id;zoneT=t;warmedZone=new Set();}return t-zoneT;}
// Dots 검수(SW-R1397 범위QA): 지역 사이 겹치는 공용 배경·소품·몹 그림도 배울 수 있었다 → 그 텍스처를 만드는 그리기 명령의 주인을 보고
//  소품·바닥·벽·문·빛·목표·몹 명령은 배우지 않는다(영웅 몸·스킬 효과·주인 없는 장면 그리기만). 엔진 material(command) → texture(command.image) 사이에서 명령을 잡는다.
const SKIP_KIND=new Set(['prop','ground','objective','enemy','wall','door','light','contact','terrain','floor','decal']);const SKIP_PATH=/^assets\/(?:v290|outdoor|floor|walldecor|props|lights|world-r80|r74|r299|r620\/bosses|r1377|r1394|r1395|r1392)\/|\/(?:mobs|move|enemies|bosses)\//;/* 몹·보스 그림(어느 폴더든 mobs/·move/·bosses/, R1377·R1392·R1394·R1395 몹 재설계)도 뺀다 */
let curCmd=null;
// 엔진 material 을 거치지 않고 텍스처만 바꿔 끼우는 길(R1200 draw-reuse 등)은 지금 장면 기록(ctx.commands, 그린 뒤 비워짐)에서 같은 그림의 명령을 찾는다(새 텍스처가 생길 때만, 드묾).
//  R287 처럼 렌더 직전에 장면 명령 그림을 미리 잡는 길도 있어, 이번 장면 명령(ThreeRenderer.render(frame) 의 frame.commands)도 본다.
let lastFrame=null;
function findIn(L,image){if(!Array.isArray(L))return undefined;for(let i=L.length-1;i>=0;i--){const c=L[i];if(c&&c.kind==='image'&&c.image===image)return String(c.owner?.kind||'');}return undefined;}
function kindFor(image){if(curCmd&&curCmd.image===image)return String(curCmd.owner?.kind||'');
 let k=findIn(lastFrame?.commands,image);if(k!==undefined)return k;k=findIn(G(()=>typeof ctx!=='undefined'?ctx?.commands:null,null),image);return k===undefined?null:k;}
// perf-r97 이 인스턴스에 render 를 복사해 두므로 프로토타입과 인스턴스를 함께 한 번씩만 감싼다(R1199 과 같은 방식, 이미 감싼 함수는 다시 안 감쌈).
const wrappedR=new WeakSet();
function wrapRenderOnce(t){if(!t||wrappedR.has(t)||typeof t.render!=='function')return;wrappedR.add(t);const fn=t.render;if(fn.__r1397)return;
 const w=function(frame){lastFrame=frame&&typeof frame==='object'?frame:null;try{return fn.apply(this,arguments);}finally{lastFrame=null;}};w.__r1397=true;t.render=w;}
function wrapRender(){try{const r=window.__STORYWORLD_PHASE1__?.controller?.state?.three;if(!r)return;wrapRenderOnce(Object.getPrototypeOf(r));if(Object.prototype.hasOwnProperty.call(r,'render'))wrapRenderOnce(r);}catch(e){kfail(e);}}
function learn(S,image){try{if(!roomy()||!isImg(image)||G(()=>loading,false)||!storyLayer())return;if(!kitOn())return;
  const ck=kindFor(image);if(ck===null||SKIP_KIND.has(ck))return;if(S.textures?.has?.(image)||S.r89Idle?.has?.(image))return;
  if(zoneTick()<LEARN_AFTER)return;const path=pathOf(image);if(!path||SKIP_PATH.test(path))return;const k=heroKey();if(!k||!zoneId)return;
  if(warmedZone.has(path)){kstats.reusedByGame++;return;}
  const o=book[k]||(book[k]={});let z=o[path];if(!z){if(Object.keys(o).length>=MAX_LEARN)return;z=o[path]=[];}
  if(!z.includes(zoneId)&&z.length<3){z.push(zoneId);kstats.learned++;dirty=true;}}catch(e){kfail(e);}}
let sceneWrapped=false;
function wrapScene(){if(sceneWrapped)return;try{const CS=window.StoryPhase1?.CommandScene?.prototype;if(!CS||typeof CS.texture!=='function'||typeof CS.material!=='function')return;const t=CS.texture,m=CS.material;
 const w=function(image,mutable){if(!mutable)learn(this,image);return t.apply(this,arguments);};w.__r1397=true;CS.texture=w;
 const wm=function(c){const prev=curCmd;curCmd=c;try{return m.apply(this,arguments);}finally{curCmd=prev;}};wm.__r1397=true;CS.material=wm;sceneWrapped=true;}catch(e){kfail(e);}}
/* 영웅 몸 그림 묶음(공격·걷기 아틀라스)은 공격마다 쓰니 맨 앞에 올린다 — 스킬 그림이 많으면 뒤로 밀려 첫 공격에 늦던 것 */
const BODY=/^assets\/hero-authored[^/]*\/[^/]*-(?:action|walk)-atlas\.(?:png|webp)$/;
function warmList(k){const o=book[k]||{};return Object.entries(o).filter(([pp,z])=>z.length>=2&&!SKIP_PATH.test(pp)).sort((a,b)=>(BODY.test(b[0])-BODY.test(a[0]))||(b[1].length-a[1].length)).slice(0,MAX_WARM).map(([pp])=>pp);}
// 불러오는 중(지역 넘어가는 막)에는 목록 그림을 엔진 캐시로 미리 받아 둔다(R1217 처럼) — 지역 이동 때 그림 캐시가 비워져 다시 받느라 늦던 것.
const asked=new Set();let askedZone=null;
function askZone(){const z=G(()=>room?.id,null);if(z!==askedZone){askedZone=z;asked.clear();}}
function prefetch(){askZone();for(const path of warmList(heroKey())){if(asked.has(path))continue;asked.add(path);if(G(()=>typeof readyImage==='function'&&readyImage(path),null))continue;kstats.loads++;try{const a=typeof addImage==='function'?addImage(path):null;a?.promise?.catch?.(()=>{});}catch(e){kfail(e);}}}
function warmTick(){try{wrapScene();wrapRender();save();if(!kitOn()||!roomy()||!P()||!storyLayer())return;if(G(()=>loading,false)){prefetch();return;}askZone();
 const r=G(()=>window.__STORYWORLD_PHASE1__?.controller?.state?.three,null),S=r?.commands;if(!S||typeof S.texture!=='function'||typeof S.release!=='function')return;
 if(S!==warmScene){warmScene=S;warmedZone=new Set();}zoneTick();const list=warmList(heroKey());if(!list.length)return;
 let budget=WARM_PX,n=0,loads=0;
 for(const path of list){if(warmedZone.has(path))continue;const row=G(()=>typeof readyImage==='function'?readyImage(path):null,null);
  if(!row||!isImg(row.image)){if(loads<6&&!asked.has(path)){asked.add(path);loads++;kstats.loads++;try{const a=typeof addImage==='function'?addImage(path):null;a?.promise?.catch?.(()=>{});}catch(e){kfail(e);}}continue;}
  const im=row.image,px=(im.naturalWidth||0)*(im.naturalHeight||0);if(!(px>0))continue;if(px>MAX_PX){warmedZone.add(path);kstats.skippedBig++;continue;}
  if(S.textures.has(im)||S.r89Idle?.has?.(im)){warmedZone.add(path);continue;}
  if(n>0&&px>budget)break;
  try{const tex=S.texture(im,false);r.renderer?.initTexture?.(tex);S.release(im);warmedZone.add(path);kstats.warmed++;}catch(e){kfail(e);warmedZone.add(path);}
  budget-=px;n++;if(budget<=0)break;}}catch(e){kfail(e);}}
G(()=>setInterval(warmTick,WARM_GAP));wrapScene();
function set(p={}){if(typeof p.on==='boolean'){on=p.on;try{localStorage.setItem(KEY,on?'1':'0');}catch(_){}}return {on};}
window.__STORYWORLD_DRAW_CACHE_R1397__=Object.freeze({revision:REV,roomy,outlinePx,texIdle,set,
 learned:k=>({...(book[k||heroKey()]||{})}),warmList:k=>warmList(k||heroKey()),forget:()=>{book={};dirty=true;saveAt=0;save();},
 inspect:()=>({revision:REV,on,roomy:roomy(),outlinePx:outlinePx(7e6),texIdle:texIdle(false),mobile:mobile(),stats:{...stats},kit:{...kstats,zone:zoneId,warmedZone:[...warmedZone]},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();

// R1255 — 첫 사용 멈칫 세 가지(사용자 2026-11-20 02:36Z "네온 창 패시브 큰 그림·각성 연출 아틀라스·몹 사망 연기 / 개선").
//  헤드리스 추적(qa/r1255/trace.mjs, renderer.initTexture·imageCache 감시):
//   ① 몹 사망 연기(assets/r108/eden/smoke.webp, 105만 화소): R108 에덴 이펙트가 자기 그림 정리(0.2초마다, 자기가 20초 안 그린 시트를 imageCache 에서 지움)에서
//      R462 몹 사망·R1195 발밑 먹이 함께 쓰는 연기 시트를 지웠다 → 몹이 죽을 때마다 새 그림으로 다시 읽고(디코드) GPU 에 다시 올림(3초에 4번, 한 번 21~26ms).
//      고침: 에덴 경로(assets/r108/eden/) 그림을 지울 때 그 그림을 20초 동안 따로 쥐고, 누가 readyImage 로 다시 찾으면 같은 그림 객체를 그대로 돌려놓는다
//      (에덴의 자기 계산은 그대로 지워진 것으로 본다. 같은 객체라 GPU 텍스처도 그대로 쓴다).
//   ② "각성 연출 아틀라스"로 보였던 것은 영웅 타격 효과 F246(final42, 128만 화소, 영웅 공격 적중마다)·페르소나 적 타격 F217 이다.
//      final42 는 5초 안 쓴 아틀라스를 버리고(src 비움) 다음 적중 때 새 그림을 만들어 다시 디코드·업로드(18~23ms)한다 → 전투 사이 5초만 쉬어도 매번.
//      고침: 불러오는 중이 아니면 2초마다 F246(보스가 살아 있으면 F217 도) 을 ensure 해 사용 시각을 새로 고친다(PC 만, final42 가 켜진 곳만; 6.5MB, 상한 64MB·8장 안).
//      처음 만들 때 그 그림 객체를 잡아 한가한 때 GPU 에 미리 올린다.
//   ③ 네온 확률 패시브 쌍갈래 뇌창 시트(assets/r951/neon-lance.webp 1536×3072, 472만 화소): 첫 사용 146ms.
//      화면에서 한 칸(256×768)은 약 239×zoom CSS 화소로 그려진다 → 3/4 크기(1152×2304, 칸 192×576, 265만 화소)로 줄인 사본을 텍스처로 쓴다
//      (원본 그림·경로·칸 좌표는 그대로 — CommandScene 텍스처만 사본으로 바꿈, 좌표는 비율이라 같다). 사본은 영웅이 네온일 때 한가한 때
//      createImageBitmap(크기 줄이기, 브라우저 다른 스레드)으로 만들어 미리 올린다. 모바일은 R980 이 이미 절반 사본을 쓰므로 하지 않는다.
//  그림·판정·피해·쿨다운·세이브는 건드리지 않는다. 끄기: localStorage 'storyworld.r1255.firstUse' = '0' (각 부분: {"eden":false,"f42":false,"lance":false}).
(()=>{'use strict';
if(typeof window==='undefined'||window.__STORYWORLD_FIRST_USE_R1255__)return;
const REV='R1255-first-use-2',KEY='storyworld.r1255.firstUse',GAP=500;
const G=(f,d)=>{try{const v=f();return v===undefined?d:v;}catch(_){return d;}};
const stats={edenKept:0,edenRestored:0,edenExpired:0,f42Ensures:0,f42Captured:0,f42Uploads:0,f42Releases:0,lanceMade:0,lanceSubs:0,lanceUploads:0,errors:0};let lastError=null;
const fail=e=>{stats.errors++;lastError=String(e&&e.message||e).slice(0,160);};
function prefs(){const raw=G(()=>localStorage.getItem(KEY),null);if(raw==='0')return {eden:false,f42:false,lance:false};let o={};try{o=JSON.parse(raw||'{}')||{};}catch(_){o={};}
 return {eden:o.eden!==false,f42:o.f42!==false,lance:o.lance!==false};}
const nowMs=()=>G(()=>performance.now(),0);
const three=()=>G(()=>window.__STORYWORLD_PHASE1__.controller.state.three,null);
const isImg=im=>!!im&&typeof HTMLImageElement!=='undefined'&&im instanceof HTMLImageElement;
// ---- ① 에덴 공유 시트 ----
const EDEN=/^assets\/r108\/eden\//,KEEP_MS=20000;const shadow=new Map();/* path → {row,at} */const seen=new Map();/* path → 마지막 readyImage 시각 */
let cacheWrapped=null,readyWrapped=false;
function wrapCache(){try{const C=G(()=>imageCache,null);if(!(C instanceof Map)||cacheWrapped===C)return;const del=C.delete.bind(C);
  C.delete=function(k){try{if(prefs().eden&&typeof k==='string'&&EDEN.test(k)){const row=C.get(k);if(row&&row.ready&&isImg(row.image)&&row.image.getAttribute?.('src')){shadow.set(k,{row,at:nowMs()});stats.edenKept++;}}}catch(e){fail(e);}return del(k);};
  cacheWrapped=C;}catch(e){fail(e);}}
function wrapReady(){try{if(readyWrapped||typeof readyImage!=='function')return;const base=readyImage;
  const w=function(path){const row=base.apply(this,arguments);try{if(typeof path==='string'&&EDEN.test(path)){seen.set(path,nowMs());
    if(!row&&prefs().eden){const s=shadow.get(path);const C=G(()=>imageCache,null);if(s&&C instanceof Map&&!C.has(path)&&s.row.image.getAttribute?.('src')){C.set(path,s.row);shadow.delete(path);stats.edenRestored++;return base.apply(this,arguments);}}}}catch(e){fail(e);}return row;};
  for(const k of Object.keys(base))if(/^_*r\d+/i.test(k))G(()=>{w[k]=base[k];});w.__r1255=true;readyImage=w;readyWrapped=true;}catch(e){fail(e);}}
function sweepShadow(){const t=nowMs();for(const [p,s] of shadow){const last=Math.max(s.at,seen.get(p)||0);if(t-last>KEEP_MS){shadow.delete(p);stats.edenExpired++;}}}
// ---- 텍스처 미리 올리기·쥐기(장면이 바뀌면 잊음) ----
let owner=null;const held=new Map();/* image|canvas → tag */
function hold(src,tag){const r=three(),S=r?.commands;if(!S||typeof S.texture!=='function')return false;if(S!==owner){held.clear();owner=S;}if(held.has(src))return true;
 try{const tex=S.texture(src,false);held.set(src,tag);r.renderer?.initTexture?.(tex);return true;}catch(e){fail(e);return false;}}
function unhold(tag){const S=owner;for(const [src,t] of [...held])if(t===tag){try{S?.release?.(src);}catch(e){fail(e);}held.delete(src);}}
// ---- ② final42 F246·F217 ----
const F42=()=>G(()=>window.__STORYWORLD_FINAL42_R88__,null);const f42img=new Map();/* id → image */
function bossAlive(){return G(()=>Array.isArray(room?.enemies)&&room.enemies.some(e=>e&&e.boss&&+e.hp>0),false);}
// R1255b: 바뀐 그림·안 쓰는 id 는 자기 쥔 몫만 놓는다(지역 이동마다 F246 이 쌓이고 보스가 죽어도 F217 이 남던 누수).
function dropF42(id,forget){const im=f42img.get(id);if(im&&held.has(im)){try{owner?.release?.(im);}catch(e){fail(e);}held.delete(im);stats.f42Releases++;}if(forget)f42img.delete(id);}/* forget=false: 그림 참조는 남겨 다시 쓸 때 쥠 */
function keepF42(){const F=F42();if(!F||typeof F.ensure!=='function')return;const ids=['F246'];if(bossAlive())ids.push('F217');
 for(const id of [...f42img.keys()])if(!ids.includes(id))dropF42(id);
 for(const id of ids){let made=null;const I=window.Image;
  try{window.Image=function(...a){const im=new I(...a);made=im;return im;};window.Image.prototype=I.prototype;Promise.resolve(F.ensure(id)).catch(()=>{});stats.f42Ensures++;}catch(e){fail(e);}finally{window.Image=I;}
  if(made){if(f42img.get(id)!==made)dropF42(id,true);f42img.set(id,made);stats.f42Captured++;}
  const im=f42img.get(id);if(im&&im.complete&&im.naturalWidth>0&&im.getAttribute?.('src')){if(!held.has(im)&&hold(im,'f42:'+id))stats.f42Uploads++;}
  else if(im&&!im.getAttribute?.('src')){if(held.has(im)){try{owner?.release?.(im);}catch(e){fail(e);}held.delete(im);}f42img.delete(id);}}}
// ---- ③ 네온 창 시트 3/4 사본 ----
const LANCE='assets/r951/neon-lance.webp',LS=.75;let lanceSrc=null,lanceCanvas=null,making=false;const subs=new WeakMap();/* scene → 바꿔 낸 수 */
const r980live=()=>G(()=>!!window.__STORYWORLD_MOBILE_MEMORY_R980__?.inspect?.().live,false);
function makeLance(im){if(making||!isImg(im)||!(im.naturalWidth>0)||typeof createImageBitmap!=='function'||typeof document==='undefined')return;making=true;
 const w=Math.round(im.naturalWidth*LS),h=Math.round(im.naturalHeight*LS);
 createImageBitmap(im,{resizeWidth:w,resizeHeight:h,resizeQuality:'high'}).then(bm=>{try{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(bm,0,0);bm.close?.();
   Object.defineProperty(c,'src',{value:im.src});c.__storyworldStaticSource=Object.freeze({path:LANCE,immutable:true,r1255Scaled:LS});lanceSrc=im;lanceCanvas=c;stats.lanceMade++;}catch(e){fail(e);}making=false;},e=>{fail(e);making=false;});}
let sceneWrapped=false;
function wrapScene(){try{if(sceneWrapped)return;const CS=window.StoryPhase1?.CommandScene?.prototype;if(!CS||typeof CS.texture!=='function'||typeof CS.release!=='function')return;const t=CS.texture,r=CS.release;
  CS.texture=function(image,mutable){if(!mutable&&image&&image===lanceSrc&&lanceCanvas&&prefs().lance&&!r980live()){subs.set(this,(subs.get(this)||0)+1);stats.lanceSubs++;return t.call(this,lanceCanvas,mutable);}return t.apply(this,arguments);};
  CS.release=function(image){if(image&&image===lanceSrc&&lanceCanvas){const n=subs.get(this)||0;if(n>0){subs.set(this,n-1);return r.call(this,lanceCanvas);}}return r.apply(this,arguments);};
  sceneWrapped=true;}catch(e){fail(e);}}
function lanceTick(p){if(!prefs().lance||r980live()){unhold('lance');return;}const neon=p&&p.hero==='neon'&&!p.egoSovereignR1046&&!p.personaHeroR1113;
 if(!neon){unhold('lance');return;}const row=G(()=>readyImage(LANCE),null);
 if(!row){G(()=>{if(typeof ensureImages==='function')Promise.resolve(ensureImages([LANCE])).catch(()=>{});});return;}
 if(row.image!==lanceSrc&&!making){lanceCanvas=null;makeLance(row.image);return;}
 if(lanceCanvas&&!held.has(lanceSrc)){if(hold(lanceSrc,'lance'))stats.lanceUploads++;}}
// ---- 틱 ----
function tick(){try{wrapCache();wrapReady();wrapScene();sweepShadow();const P=prefs(),p=G(()=>player,null);
  if(G(()=>loading,false)||!p)return;const S=three()?.commands;if(S&&S!==owner){held.clear();owner=S;}
  if(P.f42)keepF42();else for(const id of [...f42img.keys()])dropF42(id);lanceTick(p);}catch(e){fail(e);}}
wrapCache();wrapReady();wrapScene();G(()=>setInterval(tick,GAP));
window.__STORYWORLD_FIRST_USE_R1255__=Object.freeze({revision:REV,prefs,tick,lanceScale:LS,
 set:v=>{G(()=>localStorage.setItem(KEY,typeof v==='object'?JSON.stringify(v):(v?'1':'0')));return prefs();},
 inspect:()=>({revision:REV,prefs:prefs(),...stats,shadow:[...shadow.keys()],held:[...held.values()],lanceReady:!!lanceCanvas,lastError,gameplayChanged:false,presentationOnly:true})});
})();

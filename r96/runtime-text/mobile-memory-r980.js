// R980 (사용자 2026-11-13 "모바일로 무한생존모드 슬레이어로 플레이하던중 갑자기 꺼지는 문제 … 렉이나 메모리쪽"):
//  모바일 전용 메모리 예산. 헤드리스 모바일 뷰포트(844×390, DPR2) 측정에서 렌더러 프로세스가 생존 시작 직후 약 1.2GB,
//  15분 뒤 약 1.65GB 까지 커졌다. 그중 상한 없이(또는 데스크톱 기준 상한으로) 쌓이던 것:
//   · 몹 물들인 픽셀 시트 R163(최대 40장, 시트 한 장 최대 약 9MB → 측정 140MB)
//   · R106 이펙트 색 사본(최대 220장 → 측정 54MB)
//   · 엔진 효과음 디코딩 캐시 buffers(상한 없음, 지역마다 새 몹·보스 소리 → 15분 51MB, 계속 증가)
//  고침(모바일만, 데스크톱 불변):
//   ① px(name, desktop) — 캐시별 픽셀 상한. R163·R106 이 이 값으로 오래 안 쓴 사본부터 버린다(데스크톱은 desktop 값 그대로).
//   ② 효과음 디코딩 캐시 — 쓸 때마다 맨 뒤로(LRU), 디코딩 합이 예산을 넘으면 오래 안 쓴 소리부터 캐시에서 뺀다.
//      재생 중인 소리는 재생 노드가 버퍼를 쥐고 있어 끊기지 않는다. 다시 필요하면 엔진이 평소처럼 다시 받아 디코딩한다.
//  R992(코디네이터 2026-11-13 '바닥값 낮추기'): 30분 측정에서 Blink partition(출처 미상)이 지역을 불러올 때마다 뛰어
//   129→457MB, 그림 캐시 427장 중 356장이 30초 넘게 안 쓰인 다른 영웅 스킬·적 이펙트 미리 읽기였다(각 오버레이가 지역마다 다시 미리 읽음).
//   JS 힙은 R61 포탈 계산이 지나간 지역마다 방 전체를 otherRooms 에 보관해 늘었다(1500게임초에 방 83개).
//   (그림 캐시 정리는 시험했으나 뺐다: 미리 읽은 그림 382장을 강제로 비워도 partition 은 13MB 만 줄었다 — 그림 원본 바이트가 주인이 아님.)
//   ③ 생존 단계가 바뀌면 R61 지난 방 캐시(otherRooms)를 비운다(생존은 포탈을 쓰지 않음, 다시 필요하면 엔진이 다시 만든다).
//  R992b(사용자 2026-11-13 "출처를 끝까지 찾기", "초반구간에 일어남"): partition 의 주인은 buffer 영역이었다. 지역에 들어갈 때마다
//   엔진 releaseImageMemory 가 그림 캐시를 비우면 오버레이들이 같은 그림을 곧바로 다시 받아(3지역에 361종 1360번) 받을 때마다
//   buffer 가 그림 원본 크기의 약 1.7배씩 늘고 줄지 않았다(8지역 212→340MB). 비우기를 멈추면 8지역 286MB·렌더러 RSS −72MB,
//   그림 해독 메모리(cc, Chrome 상한 약 530MB)는 그대로였다.
//   ⑤ 모바일 생존에서는 releaseImageMemory 를 건너뛴다(데스크톱·캠페인은 그대로).
//   ⑥ 단계가 바뀌면 엔진 지면 캐시(groundCache3, 지역 그림 크기 캔버스 최대 6장 약 41MB)를 지금 지역 것만 남긴다.
//   ⑦ R409 외곽선 캐시 픽셀 상한을 모바일 3M(약 12MB)로(데스크톱 7M 그대로).
//  R1000(사용자 기기 아이폰 13 미니, 생존 3~4분·첫 보스 즈음 꺼짐): ⑧ 엔진 addImage 는 받는 그림마다 im.decode() 로 픽셀까지 풀어 둔다.
//   생존 15단계에 한 번도 안 그린 캐시 그림이 165장(해독 약 210MB)이었다. 크롬은 해독 메모리를 스스로 약 530MB 로 묶지만 아이폰 사파리는
//   decode() 로 푼 픽셀을 들고 있을 수 있다 → 모바일에서는 decode() 가 '받기 끝'만 기다리고, 픽셀은 처음 그릴 때 풀린다(화면 그대로).
//  R1000b(사용자 2026-11-13 결정 카드 "모바일만 저해상도"): ⑨ 50만 화소 이상 그림은 모바일에서 가로·세로 절반 사본(픽셀 1/4)으로 그린다.
//   3D 장면은 CommandScene.texture 에서 원본 대신 절반 사본으로 텍스처를 만든다(UV 는 0~1 비율이라 그림 자리·잘라 쓰기 그대로,
//   명령의 image·sourceRect 는 손대지 않으므로 다른 오버레이의 '같은 그림' 비교도 그대로). 오프스크린 2D 그리기(지면·외곽선·물들이기)는
//   drawImage 에서 원본 자리에 절반 사본을 넣고 잘라 쓸 칸만 절반으로 줄인다(그려지는 크기 그대로). 데스크톱은 원본 그대로.
//   끄기: localStorage storyworld.r980.mobileMemory = {"half":false}
//  그림 원본 파일·전투·세이브는 바꾸지 않는다(표시 해상도·캐시만).
(()=>{'use strict';
if(window.__STORYWORLD_MOBILE_MEMORY_R980__)return;
const REV='R1000-mobile-memory-5',KEY='storyworld.r980.mobileMemory';
// 모바일 예산(픽셀 수, 1픽셀 = 4바이트)
const MOBILE_PX={'r163-tint':12e6/* 약 48MB */,'r106-tint':6e6/* 약 24MB */,'r409-outline':3e6/* 약 12MB */};
const AUDIO_MB=24,EVERY_MS=2000;
let on=true,halfOn=true,lastError=null;try{const v=JSON.parse(localStorage.getItem(KEY)||'null');on=v?.on!==false;halfOn=v?.half!==false;}catch(_){}
const stats={decodeSkipped:0,releaseSkipped:0,groundTrimmed:0,roomsCleared:0,checks:0,halfMade:0,halfPx:0,halfPeakPx:0,halfEvicted:0,halfDraws:0,halfTex:0,half2d:0,audioTrims:0,audioEvicted:0,audioEvictedMB:0,audioPeakMB:0,audioLastMB:0,errors:0};
function fail(e){stats.errors++;lastError=String(e?.stack||e).slice(0,300);}
function mobile(){
 try{const m=window.__STORYWORLD_MOBILE_R63__;if(typeof m?.isMobile==='function')return !!m.isMobile();}catch(_){}
 try{return typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;}catch(_){return false;}
}
const active=()=>on&&mobile();
function px(name,desktop){if(!active())return desktop;const v=MOBILE_PX[name];return Number.isFinite(v)?Math.min(v,desktop):desktop;}
function audioBudgetMB(){return active()?AUDIO_MB:Infinity;}

// 효과음 캐시(엔진 전역 buffers: 경로 → 디코딩 약속). 크기는 약속이 풀릴 때 WeakMap 에 적는다.
const sizeOf=new WeakMap();
const cacheMap=()=>{try{return typeof buffers!=='undefined'&&buffers instanceof Map?buffers:null;}catch(_){return null;}};
function note(pr){if(!pr||typeof pr.then!=='function'||sizeOf.has(pr))return;sizeOf.set(pr,-1);
 pr.then(a=>{try{sizeOf.set(pr,a&&a.length?a.length*a.numberOfChannels*4:0);}catch(_){sizeOf.set(pr,0);}},()=>sizeOf.set(pr,0));}
let wrapped=false;
function wrap(){if(wrapped||typeof audioBuffer!=='function')return;const orig=audioBuffer;
 const w=function(path){const r=orig.apply(this,arguments);try{const B=cacheMap();if(B&&active()){const k=typeof cleanPath==='function'?cleanPath(path):path;const v=B.get(k);if(v){B.delete(k);B.set(k,v);note(v);}}}catch(e){fail(e);}return r;};
 try{audioBuffer=w;wrapped=true;}catch(e){fail(e);}}
function trimAudio(){const B=cacheMap();if(!B)return;let total=0;for(const v of B.values()){note(v);const s=sizeOf.get(v);if(s>0)total+=s;}
 const mb=total/1e6;stats.audioLastMB=Math.round(mb);stats.audioPeakMB=Math.max(stats.audioPeakMB,stats.audioLastMB);if(mb<=AUDIO_MB)return;
 stats.audioTrims++;const goal=AUDIO_MB*1e6*.8;
 for(const [k,v] of [...B]){if(total<=goal)break;const s=sizeOf.get(v);if(!(s>0))continue;/* 아직 디코딩 중인 것은 두고 */B.delete(k);total-=s;stats.audioEvicted++;stats.audioEvictedMB+=s/1e6;}
 stats.audioEvictedMB=Math.round(stats.audioEvictedMB*10)/10;}
// ⑤ 엔진 그림 캐시 비우기(지역 진입마다): 모바일 생존에서는 건너뛴다. 전역 함수라 엔진 안 호출도 이 이름을 다시 찾는다.
let relWrapped=false;
const survival=()=>{try{return typeof room!=='undefined'&&!!room?.survivalR600;}catch(_){return false;}};
function wrapRelease(){if(relWrapped||typeof releaseImageMemory!=='function')return;const orig=releaseImageMemory;
 const w=function(){try{if(active()&&survival()){stats.releaseSkipped++;return;}}catch(e){fail(e);}return orig.apply(this,arguments);};
 try{releaseImageMemory=w;relWrapped=releaseImageMemory===w;}catch(e){fail(e);}}
// ⑥ 지면 캐시: 지금 지역 그림 것만 남긴다(키 = 지역 그림 경로|층|각성). 다시 필요하면 엔진이 다시 굽는다.
function trimGround(){try{if(typeof groundCache3==='undefined'||!(groundCache3 instanceof Map)||groundCache3.size<=1)return;
 const path=typeof regionById!=='undefined'&&typeof zone!=='undefined'?regionById[zone]?.map:null;
 for(const k of [...groundCache3.keys()])if(!path||String(k).split('|')[0]!==path){groundCache3.delete(k);stats.groundTrimmed++;}}catch(e){fail(e);}}
// ⑧ 모바일: decode() 는 받기 끝만 기다린다(이미 받았으면 바로). 깨진 그림은 원래 decode 가 거절하게 둔다.
let decWrapped=false;
function wrapDecode(){try{if(decWrapped||!active()||typeof HTMLImageElement!=='function')return;const P=HTMLImageElement.prototype,orig=P.decode;if(typeof orig!=='function')return;
 P.decode=function(){try{if(!active())return orig.apply(this,arguments);const im=this;if(im.complete){if(im.naturalWidth>0){stats.decodeSkipped++;return Promise.resolve();}return orig.apply(this,arguments);}
  stats.decodeSkipped++;return new Promise((res,rej)=>{const off=()=>{im.removeEventListener('load',ok);im.removeEventListener('error',bad);},ok=()=>{off();res();},bad=()=>{off();rej(new DOMException('The source image cannot be decoded.','EncodingError'));};im.addEventListener('load',ok);im.addEventListener('error',bad);});
 }catch(e){fail(e);return orig.apply(this,arguments);}};decWrapped=true;}catch(e){fail(e);}}
wrapDecode();
// ⑨ 모바일: 큰 그림은 절반 해상도 사본으로 그린다.
const HALF_MIN_PX=5e5,HALF_BUDGET_PX=12e6/* 약 48MB */,HALF_IDLE_MS=15000,NATIVE=typeof CanvasRenderingContext2D==='function'?CanvasRenderingContext2D.prototype.drawImage:null;
// 사본 목록(오래 안 쓴 것부터 놓는다). 놓은 사본은 그것으로 만든 텍스처가 쥐고 있는 동안만 살고 그 뒤 GC 가 거둔다(픽셀을 지우지 않는다).
const halves=new Map(),sceneHalves=new WeakMap(),nowMs=()=>{try{return performance.now();}catch(_){return Date.now();}};
let live=false,sceneWrapped=false;const nativeWrapped=new WeakSet();
const refreshLive=()=>{try{live=halfOn&&active();}catch(_){live=false;}return live;};
function dropHalf(im,m){halves.delete(im);stats.halfPx-=m.px;stats.halfEvicted++;}
function sweepHalves(force){if(!halves.size)return;const now=nowMs();for(const[im,m]of halves){if(stats.halfPx<=HALF_BUDGET_PX&&!(force&&now-m.at>HALF_IDLE_MS))break;if(now-m.at>HALF_IDLE_MS||stats.halfPx>HALF_BUDGET_PX)dropHalf(im,m);}}
function halfOf(im){try{
 if(!(im instanceof HTMLImageElement)||!im.complete||!NATIVE)return null;const w=im.naturalWidth,h=im.naturalHeight;if(!(w*h>=HALF_MIN_PX))return null;
 const src=im.src;if(!src)return null;const m=halves.get(im);
 if(m){halves.delete(im);if(m.src===src){m.at=nowMs();halves.set(im,m);return m.c;}stats.halfPx-=m.px;}
 const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w/2));c.height=Math.max(1,Math.round(h/2));const g=c.getContext('2d');if(!g)return null;
 g.imageSmoothingEnabled=true;if('imageSmoothingQuality'in g)g.imageSmoothingQuality='high';NATIVE.call(g,im,0,0,w,h,0,0,c.width,c.height);
 Object.defineProperty(c,'src',{value:src});if(im.__path)c.__path=im.__path;c.__storyworldStaticSource=Object.freeze({path:src,immutable:true,r1000Half:true});c.r1000Full=[w,h];
 const px=c.width*c.height;halves.set(im,{src,c,px,at:nowMs()});stats.halfMade++;stats.halfPx+=px;stats.halfPeakPx=Math.max(stats.halfPeakPx,stats.halfPx);if(stats.halfPx>HALF_BUDGET_PX)sweepHalves(false);return c;}catch(e){fail(e);return null;}}
function halfArgs(a){const im=a[0],c=halfOf(im);if(!c)return null;const w=im.naturalWidth,h=im.naturalHeight,kx=c.width/w,ky=c.height/h;
 if(a.length===3)return [c,0,0,c.width,c.height,a[1],a[2],w,h];if(a.length===5)return [c,0,0,c.width,c.height,a[1],a[2],a[3],a[4]];
 if(a.length===9)return [c,a[1]*kx,a[2]*ky,a[3]*kx,a[4]*ky,a[5],a[6],a[7],a[8]];return null;}
function wrapNative(P){try{if(!P||nativeWrapped.has(P)||typeof P.drawImage!=='function')return;const o=P.drawImage;
 P.drawImage=function(im){if(live&&im instanceof HTMLImageElement){const a=halfArgs(arguments);if(a){stats.halfDraws++;stats.half2d++;return o.apply(this,a);}}return o.apply(this,arguments);};nativeWrapped.add(P);}catch(e){fail(e);}}
function wrapScene(){try{if(sceneWrapped)return;const CS=window.StoryPhase1?.CommandScene?.prototype;if(!CS||typeof CS.texture!=='function'||typeof CS.release!=='function')return;const t=CS.texture,r=CS.release;
 CS.texture=function(image,mutable){if(live&&!mutable&&image instanceof HTMLImageElement){let map=sceneHalves.get(this);if(!map)sceneHalves.set(this,map=new Map());let c=map.get(image);
  if(!(c&&this.textures?.has(c)&&c.src===image.src)){c=halfOf(image);if(c)map.set(image,c);}if(c){stats.halfDraws++;stats.halfTex++;return t.call(this,c,mutable);}}return t.apply(this,arguments);};
 CS.release=function(image){try{if(image instanceof HTMLImageElement&&!this.textures?.has(image)){const map=sceneHalves.get(this),c=map?.get(image);if(c){const out=r.call(this,c);if(!this.textures?.has(c))map.delete(image);return out;}}}catch(e){fail(e);}return r.apply(this,arguments);};
 sceneWrapped=true;}catch(e){fail(e);}}
function wrapHalf(){if(!refreshLive())return;wrapNative(window.CanvasRenderingContext2D?.prototype);wrapNative(window.OffscreenCanvasRenderingContext2D?.prototype);wrapScene();}
wrapHalf();
// ④ R61 지난 방
let lastStage=null;
function trimRooms(){try{const H=window.__STORYWORLD_R61_OTHER_ROOMS__;if(!H||typeof room==='undefined'||!room?.survivalR600)return;if(room.id===lastStage)return;lastStage=room.id;const n=H.clear();if(n)stats.roomsCleared+=n;trimGround();}catch(e){fail(e);}}
function check(){stats.checks++;try{refreshLive();sweepHalves(true);if(!active())return;wrapHalf();wrap();wrapRelease();trimAudio();trimRooms();}catch(e){fail(e);}}
let timer=null;
function start(){wrapDecode();wrapHalf();wrap();wrapRelease();if(!timer)timer=setInterval(check,EVERY_MS);}
if(document.readyState==='complete')start();else window.addEventListener('load',start,{once:true});
window.__STORYWORLD_MOBILE_MEMORY_R980__=Object.freeze({revision:REV,mobile,active,px,audioBudgetMB,check,roomsCleared:()=>stats.roomsCleared,
 set:v=>{on=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on,half:halfOn}));}catch(_){}refreshLive();return on;},
 setHalf:v=>{halfOn=v!==false;try{localStorage.setItem(KEY,JSON.stringify({on,half:halfOn}));}catch(_){}wrapHalf();refreshLive();return halfOn;},
 inspect:()=>({revision:REV,on,half:halfOn,live,mobile:mobile(),wrapped,relWrapped,decWrapped,sceneWrapped,halfMB:Math.round(stats.halfPx*4/1e5)/10,halfPeakMB:Math.round(stats.halfPeakPx*4/1e5)/10,halfBudgetMB:HALF_BUDGET_PX*4/1e6,budgets:{...MOBILE_PX,audioMB:AUDIO_MB},stats:{...stats},lastError,presentationOnly:true,gameplayChanged:false,savesTouched:false})});
})();
